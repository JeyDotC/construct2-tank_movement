// ECMAScript 5 strict mode
"use strict";

assert2(cr, "cr namespace not created");
assert2(cr.behaviors, "cr.behaviors not created");

/////////////////////////////////////
// Behavior class
cr.behaviors.TankMovement = function (runtime) {
    this.runtime = runtime;
};

(function () {
    var behaviorProto = cr.behaviors.TankMovement.prototype;

    /////////////////////////////////////
    // Behavior type class
    behaviorProto.Type = function (behavior, objtype) {
        this.behavior = behavior;
        this.objtype = objtype;
        this.runtime = behavior.runtime;
    };

    var behtypeProto = behaviorProto.Type.prototype;

    behtypeProto.onCreate = function () {
    };

    /////////////////////////////////////
    // Behavior instance class
    behaviorProto.Instance = function (type, inst) {
        this.type = type;
        this.behavior = type.behavior;
        this.inst = inst;				// associated object instance to modify
        this.runtime = type.runtime;

        // Key states
        this.upkey = false;
        this.downkey = false;
        this.leftkey = false;
        this.rightkey = false;
        this.ignoreInput = false;

        // Simulated key states
        this.simup = false;
        this.simdown = false;
        this.simleft = false;
        this.simright = false;
        this.simTurnLeft = false;
        this.simTurnRight = false;

        // attempted workaround for sticky keys bug
        this.lastuptick = -1;
        this.lastdowntick = -1;
        this.lastlefttick = -1;
        this.lastrighttick = -1;

        // Movement
        this.dx = 0;
        this.dy = 0;
    };

    const behinstProto = behaviorProto.Instance.prototype;

    behinstProto.onCreate = function () {
        // Load properties

        this.maxspeed = this.properties[0];
        this.acc = this.properties[1];
        this.dec = this.properties[2];
        this.rotationSpeed = this.properties[3];
        this.setInstanceAngle = (this.properties[4] === 1);
        this.defaultControls = (this.properties[5] === 1);	// 0=no, 1=yes
        this.enabled = (this.properties[6] !== 0);

        this.currentRotationSpeed = 0;
        this.forwardAngle = cr.to_degrees(this.inst.type.plugin.is_rotatable ? this.inst.angle : 0);
        this.worldDx = 0;
        this.worldDy = 0;

        // Only bind keyboard events via jQuery if default controls are in use
        if (this.defaultControls && !this.runtime.isDomFree) {
            jQuery(document).keydown(
                (function (self) {
                    return function (info) {
                        self.onKeyDown(info);
                    };
                })(this)
            );

            jQuery(document).keyup(
                (function (self) {
                    return function (info) {
                        self.onKeyUp(info);
                    };
                })(this)
            );
        }
    };

    behinstProto.saveToJSON = function () {
        return {
            "dx": this.dx,
            "dy": this.dy,
            "r": this.currentRotationSpeed,
            "wdx": this.worldDx,
            "wdy": this.worldDy,
            "enabled": this.enabled,
            "maxspeed": this.maxspeed,
            "acc": this.acc,
            "dec": this.dec,
            "ignoreInput": this.ignoreInput
        };
    };

    behinstProto.loadFromJSON = function (o) {
        this.dx = o["dx"];
        this.dy = o["dy"];
        this.enabled = o["enabled"];
        this.maxspeed = o["maxspeed"];
        this.acc = o["acc"];
        this.dec = o["dec"];
        this.ignoreInput = o["ignoreInput"];
        this.currentRotationSpeed = o["r"];
        this.worldDx = o["wdx"];
        this.worldDy = o["wdy"];

        this.upkey = false;
        this.downkey = false;
        this.leftkey = false;
        this.rightkey = false;

        this.simup = false;
        this.simdown = false;
        this.simleft = false;
        this.simright = false;
        this.simTurnLeft = false;
        this.simTurnRight = false;

        this.lastuptick = -1;
        this.lastdowntick = -1;
        this.lastlefttick = -1;
        this.lastrighttick = -1;
    };

    behinstProto.onKeyDown = function (info) {
        const tickCount = this.runtime.tickcount;

        switch (info.which) {
            case 37:	// left
                info.preventDefault();

                // Workaround for sticky keys bug: reject if arriving on same tick as onKeyUp event
                if (this.lastlefttick < tickCount)
                    this.leftkey = true;

                break;
            case 38:	// up
                info.preventDefault();

                if (this.lastuptick < tickCount)
                    this.upkey = true;

                break;
            case 39:	// right
                info.preventDefault();

                if (this.lastrighttick < tickCount)
                    this.rightkey = true;

                break;
            case 40:	// down
                info.preventDefault();

                if (this.lastdowntick < tickCount)
                    this.downkey = true;

                break;
        }
    };

    behinstProto.onKeyUp = function (info) {
        const tickCount = this.runtime.tickcount;

        switch (info.which) {
            case 37:	// left
                info.preventDefault();
                this.leftkey = false;
                this.lastlefttick = tickCount;
                break;
            case 38:	// up
                info.preventDefault();
                this.upkey = false;
                this.lastuptick = tickCount;
                break;
            case 39:	// right
                info.preventDefault();
                this.rightkey = false;
                this.lastrighttick = tickCount;
                break;
            case 40:	// down
                info.preventDefault();
                this.downkey = false;
                this.lastdowntick = tickCount;
                break;
        }
    };

    behinstProto.onWindowBlur = function () {
        this.upkey = false;
        this.downkey = false;
        this.leftkey = false;
        this.rightkey = false;
    };

    behinstProto.tick = function () {
        const dt = this.runtime.getDt(this.inst);

        let left = this.simleft;
        let right = this.simright;
        let forward = this.upkey || this.simup;
        let backwards = this.downkey || this.simdown;
        let turnLeft = this.leftkey || this.simTurnLeft;
        let turnRight = this.rightkey || this.simTurnRight;

        this.simleft = false;
        this.simright = false;
        this.simup = false;
        this.simdown = false;
        this.simTurnLeft = false;
        this.simTurnRight = false;

        if (!this.enabled) {
            return;
        }

        // Is already overlapping solid: must have moved itself in (e.g. by rotating or being crushed),
        // so push out
        let collobj = this.runtime.testOverlapSolid(this.inst);
        if (collobj) {
            this.runtime.registerCollision(this.inst, collobj);
            if (!this.runtime.pushOutSolidNearest(this.inst))
                return;		// must be stuck in solid
        }

        // Ignoring input: ignore all keys
        if (this.ignoreInput) {
            left = false;
            right = false;
            forward = false;
            backwards = false;
            turnLeft = false;
            turnRight = false;
        }

        // Apply decelerations

        if (turnLeft === turnRight) {
            this.currentRotationSpeed  = 0;
        }

        if (forward === backwards) {
        {
            if (this.dx < 0) {
                this.dx = Math.min(this.dx + (this.dec * dt), 0);
            } else if (this.dx > 0) {
                this.dx = Math.max(this.dx - (this.dec * dt), 0);
            }
        }

        if (left === right)	// both up or both down
            if (this.dy < 0) {
                this.dy = Math.min(this.dy + (this.dec * dt), 0);
            } else if (this.dy > 0) {
                this.dy = Math.max(this.dy - (this.dec * dt), 0);
            }
        }

        // Apply acceleration
        if (turnLeft && !turnRight)
        {
            this.currentRotationSpeed = -this.rotationSpeed;
        }

        if (turnRight && !turnLeft)
        {
            this.currentRotationSpeed = this.rotationSpeed;
        }

        this.forwardAngle += this.currentRotationSpeed * dt;

        if (backwards && !forward)
        {
            // Moving in opposite direction to current motion: add deceleration
            if (this.dx > 0)
                this.dx -= (this.acc + this.dec) * dt;
            else
                this.dx -= this.acc * dt;
        }

        if (forward && !backwards)
        {
            if (this.dx < 0)
                this.dx += (this.acc + this.dec) * dt;
            else
                this.dx += this.acc * dt;
        }

        if (left && !right)
        {
            if (this.dy > 0)
                this.dy -= (this.acc + this.dec) * dt;
            else
                this.dy -= this.acc * dt;
        }

        if (right && !left)
        {
            if (this.dy < 0)
                this.dy += (this.acc + this.dec) * dt;
            else
                this.dy += this.acc * dt;
        }

        this.updateWorldVector();

        // Do not touch what's inside this if:
        if (this.dx !== 0 || this.dy !== 0 || this.currentRotationSpeed !== 0) {
            // Limit to max speed
            const speed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);

            if (speed > this.maxspeed) {
                // Limit vector magnitude to maxspeed
                const a = Math.atan2(this.dy, this.dx);
                this.dx = this.maxspeed * Math.cos(a);
                this.dy = this.maxspeed * Math.sin(a);
                this.updateWorldVector();
            }

            // Save old position and angle
            const oldX = this.inst.x;
            const oldY = this.inst.y;
            const oldAngle = this.inst.angle;

            // Attempt X movement
            this.inst.x += this.worldDx * dt;
            this.inst.set_bbox_changed();

            collobj = this.runtime.testOverlapSolid(this.inst);
            if (collobj) {
                // Try to push back out horizontally for a closer fit to the obstacle.
                if (!this.runtime.pushOutSolid(this.inst, (this.worldDx < 0 ? 1 : -1), 0, Math.abs(Math.floor(this.worldDx * dt)))) {
                    // Failed to push out: restore previous (known safe) position.
                    this.inst.x = oldX;
                }

                this.dx = 0;
                this.worldDx = 0;
                this.inst.set_bbox_changed();
                this.runtime.registerCollision(this.inst, collobj);
            }

            this.inst.y += this.worldDy * dt;
            this.inst.set_bbox_changed();

            collobj = this.runtime.testOverlapSolid(this.inst);
            if (collobj) {
                // Try to push back out vertically.
                if (!this.runtime.pushOutSolid(this.inst, 0, (this.worldDy < 0 ? 1 : -1), Math.abs(Math.floor(this.worldDy * dt)))) {
                    // Failed to push out
                    this.inst.y = oldY;
                }

                this.dy = 0;
                this.worldDy = 0;
                this.inst.set_bbox_changed();
                this.runtime.registerCollision(this.inst, collobj);
            }

            // Apply angle so long as object is still moving and isn't entirely blocked by a solid
            if (this.setInstanceAngle && this.inst.type.plugin.is_rotatable) {
                this.inst.angle = cr.to_radians(this.forwardAngle);
            }

            this.inst.set_bbox_changed();

            if (this.inst.angle != oldAngle) {
                collobj = this.runtime.testOverlapSolid(this.inst);
                if (collobj) {
                    this.inst.angle = oldAngle;
                    this.inst.set_bbox_changed();
                    this.runtime.registerCollision(this.inst, collobj);
                }
            }
        }
    };

    behinstProto.updateWorldVector = function(){
        const forwardAngleInRadians = cr.to_radians(this.forwardAngle);
        const cosForward = Math.cos(forwardAngleInRadians);
        const sinForward = Math.sin(forwardAngleInRadians);

        this.worldDx = cosForward * this.dx - sinForward * this.dy;
        this.worldDy = sinForward * this.dx + cosForward * this.dy;
    };

    /**BEGIN-PREVIEWONLY**/
    behinstProto.getDebuggerValues = function (propsections) {
        propsections.push({
            "title": this.type.name,
            "properties": [
                {"name": "Vector X", "value": this.dx},
                {"name": "Vector Y", "value": this.dy},
                {"name": "World Vector X", "value": this.worldDx,  "readonly": true },
                {"name": "World Vector Y", "value": this.worldDy,  "readonly": true },
                {"name": "Overall speed", "value": Math.sqrt(this.dx * this.dx + this.dy * this.dy)},
                {"name": "Angle of motion", "value": cr.to_degrees(Math.atan2(this.worldDy, this.worldDx)), "readonly": true},
                {"name": "Forward Angle", "value": this.forwardAngle},
                {"name": "Max speed", "value": this.maxspeed},
                {"name": "Acceleration", "value": this.acc},
                {"name": "Deceleration", "value": this.dec},
                {"name": "Enabled", "value": this.enabled}
            ]
        });
    };

    behinstProto.onDebugValueEdited = function (header, name, value) {
        switch (name) {
            case "Vector X":
                this.dx = value;
                break;
            case "Vector Y":
                this.dy = value;
                break;
            case "Overall speed":
                if (value < 0)
                    value = 0;
                if (value > this.maxspeed)
                    value = this.maxspeed;

                const a = Math.atan2(this.dy, this.dx);
                this.dx = value * Math.cos(a);
                this.dy = value * Math.sin(a);
                break;
            case "Forward Angle":
                this.forwardAngle = value;
                break;
            case "Max speed":
                this.maxspeed = value;
                break;
            case "Acceleration":
                this.acc = value;
                break;
            case "Deceleration":
                this.dec = value;
                break;
            case "Enabled":
                this.enabled = value;
                break;
        }
    };

    /**END-PREVIEWONLY**/

    //////////////////////////////////////
    // Conditions
    function Cnds() {
    }

    Cnds.prototype.IsMoving = function () {
        // In some cases floating point precision leaves the behavior with a tiny speed like 2.2e-16.
        // To avoid this rounding error making "Is moving" true, use a small minimum speed instead.
        const speed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
        return speed > 1e-10;
    };

    Cnds.prototype.CompareSpeed = function (cmp, s) {
        const speed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);

        return cr.do_cmp(speed, cmp, s);
    };

    behaviorProto.cnds = new Cnds();

    //////////////////////////////////////
    // Actions
    function Acts() {
    }

    Acts.prototype.Stop = function () {
        this.dx = 0;
        this.dy = 0;
    };

    Acts.prototype.Reverse = function () {
        this.dx *= -1;
        this.dy *= -1;
    };

    Acts.prototype.SetIgnoreInput = function (ignoring) {
        this.ignoreInput = ignoring;
    };

    Acts.prototype.SetSpeed = function (speed) {
        if (speed < 0)
            speed = 0;
        if (speed > this.maxspeed)
            speed = this.maxspeed;

        // Speed is new magnitude of vector of motion
        const a = Math.atan2(this.dy, this.dx);
        this.dx = speed * Math.cos(a);
        this.dy = speed * Math.sin(a);
    };

    Acts.prototype.SetMaxSpeed = function (maxspeed) {
        this.maxspeed = maxspeed;

        if (this.maxspeed < 0)
            this.maxspeed = 0;
    };

    Acts.prototype.SetAcceleration = function (acc) {
        this.acc = acc;

        if (this.acc < 0)
            this.acc = 0;
    };

    Acts.prototype.SetDeceleration = function (dec) {
        this.dec = dec;

        if (this.dec < 0)
            this.dec = 0;
    };

    Acts.prototype.SimulateControl = function (ctrl) {
        // 0=left, 1=right, 2=up, 3=down
        switch (ctrl) {
            case 0:
                this.simleft = true;
                break;
            case 1:
                this.simright = true;
                break;
            case 2:
                this.simup = true;
                break;
            case 3:
                this.simdown = true;
                break;
            case 4:
                this.simTurnLeft = true;
                break;
            case 5:
                this.simTurnRight = true;
                break;
        }
    };

    Acts.prototype.SetEnabled = function (en) {
        this.enabled = (en === 1);
    };

    Acts.prototype.SetVectorX = function (x_) {
        this.dx = x_;
    };

    Acts.prototype.SetVectorY = function (y_) {
        this.dy = y_;
    };

    Acts.prototype.SetRotationSpeed = function (rotationSpeed) {
        this.rotationSpeed = rotationSpeed;
    };

    Acts.prototype.SetForwardAngle = function (forwardAngle) {
        this.forwardAngle = forwardAngle;
    };

    behaviorProto.acts = new Acts();

    //////////////////////////////////////
    // Expressions
    function Exps() {
    }

    Exps.prototype.Speed = function (ret) {
        ret.set_float(Math.sqrt(this.dx * this.dx + this.dy * this.dy));
    };

    Exps.prototype.MaxSpeed = function (ret) {
        ret.set_float(this.maxspeed);
    };

    Exps.prototype.Acceleration = function (ret) {
        ret.set_float(this.acc);
    };

    Exps.prototype.Deceleration = function (ret) {
        ret.set_float(this.dec);
    };

    Exps.prototype.MovingAngle = function (ret) {
        ret.set_float(cr.to_degrees(Math.atan2(this.dy, this.dx)));
    };

    Exps.prototype.VectorX = function (ret) {
        ret.set_float(this.dx);
    };

    Exps.prototype.VectorY = function (ret) {
        ret.set_float(this.dy);
    };

    Exps.prototype.RotationSpeed = function (ret) {
        ret.set_float(this.rotationSpeed);
    };

    Exps.prototype.ForwardAngle = function (ret) {
        ret.set_float(this.forwardAngle);
    };

    behaviorProto.exps = new Exps();

}());
# Tank Movement
**Type:** Behavior

Moves an object as in the first versions of Resident Evil.

# Properties

| Name | Type | Description | Options |
|------|------|-------------|---------|
|**Max speed**| _float_ | The maximum speed, in pixels per second, the object can travel at. Default value: `200` |  |
|**Acceleration**| _float_ | The rate of acceleration, in pixels per second per second. Default value: `600` |  |
|**Deceleration**| _float_ | The rate of deceleration, in pixels per second per second. Default value: `500` |  |
|**Turn Speed**| _float_ | The speed at which this object will turn in degrees per second. Default value: `360` |  |
|**Set angle**| _combo_ | Rotate the instance or not. Default value: `Yes` | - No<br/>- Yes |
|**Default controls**| _combo_ | If enabled, arrow keys control movement.  Otherwise, use the 'simulate control' action. Default value: `Yes` | - No<br/>- Yes |
|**Initial state**| _combo_ | Whether to initially have the behavior enabled or disabled. Default value: `Enabled` | - Disabled<br/>- Enabled |

# ACES

## Actions

| Name | Description | Parameters |
|------|-------------|------------|
| |****| |
|**Stop**| Set the speed to zero. |  |
|**Reverse**| Invert the direction of motion. |  |
|**Set ignoring input**| Set whether to ignore the controls for this movement. | - **Input** _combo_: Set whether to ignore the controls for this movement.  **Options**: (`Stop ignoring`, `Start ignoring`) |
|**Set speed**| Set the object's current speed. | - **Speed** _number_: The new speed of the object to set, in pixels per second.  |
|**Set max speed**| Set the object's maximum speed. | - **Max Speed** _number_: The new maximum speed of the object to set, in pixels per second.  |
|**Set acceleration**| Set the object's acceleration. | - **Acceleration** _number_: The new acceleration of the object to set, in pixels per second per second.  |
|**Set deceleration**| Set the object's deceleration. | - **Deceleration** _number_: The new deceleration of the object to set, in pixels per second per second.  |
|**Simulate control**| Control the movement by events. | - **Control** _combo_: The movement control to simulate pressing.  **Options**: (`Left`, `Right`, `Forward`, `Backward`, `TurnLeft`, `TurnRight`) |
|**Set enabled**| Set whether this behavior is enabled. | - **State** _combo_: Set whether to enable or disable the behavior.  **Options**: (`Disabled`, `Enabled`) |
|**Set vector X**| Set the X component of motion. | - **Vector X** _number_: The X component of motion to set, in pixels per second.  |
|**Set vector Y**| Set the Y component of motion. | - **Vector Y** _number_: The Y component of motion to set, in pixels per second.  |
|**Set Rotation Speed**| Set the rotation speed. | - **Rotation Speed** _number_: The rotation speed in degrees per second.  |
|**Set Forward Angle**| Set the angle at which the object will move if forward is pressed. | - **Forward Angle** _number_: The new forward angle in degrees.  |

## Conditions

| Name | Description | Parameters |
|------|-------------|------------|
| |****| |
|**Is moving**| True when the object is moving. |  |
|**Compare speed**| Compare the current speed of the object. | - **Comparison** _comparison_: Choose the way to compare the current speed. <br />- **Speed** _number_: The speed, in pixels per second, to compare the current speed to.  |

## Expressions

| Name | Type | Description | Parameters |
|------|------|-------------|------------|
| | |****| |
|**Get speed**<br/><small>**Usage:** `MyObject.Tank Movement.Speed`</small>|`number`| The current object speed, in pixels per second. |  |
|**Get max speed**<br/><small>**Usage:** `MyObject.Tank Movement.MaxSpeed`</small>|`number`| The maximum speed setting, in pixels per second. |  |
|**Get acceleration**<br/><small>**Usage:** `MyObject.Tank Movement.Acceleration`</small>|`number`| The acceleration setting, in pixels per second per second. |  |
|**Get deceleration**<br/><small>**Usage:** `MyObject.Tank Movement.Deceleration`</small>|`number`| The deceleration setting, in pixels per second per second. |  |
|**Get angle of motion**<br/><small>**Usage:** `MyObject.Tank Movement.MovingAngle`</small>|`number`| The current angle of motion, in degrees. |  |
|**Get vector X**<br/><small>**Usage:** `MyObject.Tank Movement.VectorX`</small>|`number`| The current X component of motion, in pixels per second. |  |
|**Get vector Y**<br/><small>**Usage:** `MyObject.Tank Movement.VectorY`</small>|`number`| The current Y component of motion, in pixels per second. |  |
|**Get rotation speed**<br/><small>**Usage:** `MyObject.Tank Movement.RotationSpeed`</small>|`number`| The rotation speed in degrees per second. |  |
|**Get forward angle**<br/><small>**Usage:** `MyObject.Tank Movement.ForwardAngle`</small>|`number`| The angle at which the object will move if forward is pressed. |  |
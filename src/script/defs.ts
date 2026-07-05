
export const FPS_CAP = 15; // FPS

export const LO_H_RES = 320;
export const LO_V_RES = 200;
export const HI_H_RES = 640;
export const HI_V_RES = 400;

export const H_RES = 320;
export const V_RES = 200;
export const H_RES_HALF = H_RES / 2;
export const V_RES_HALF = V_RES / 2;

export const TERRAIN_SCALE = 200.0;
export const TERRAIN_MODEL_SIZE = 100.0;

export const PITCH_RATE = Math.PI / 5; // Radians/s
export const ROLL_RATE = Math.PI / 2; // Radians/s (was π/3, +50%)
export const YAW_RATE = Math.PI / 12; // Radians/s
export const MAX_SPEED = 250.0; // World units/s
export const THROTTLE_RATE = 33; // Percentage of maximum/s [0,100]
export const STICK_RATE = 1.5; // Full stick deflection per second
export const PLANE_DISTANCE_TO_GROUND = 2.0; // World units
export const PLANE_COCKPIT_OFFSET_Y = 1.0; // World units
export const PLANE_COCKPIT_OFFSET_Z = 8.0; // World units
export const MAX_ALTITUDE = 14000; // World units

export const COCKPIT_FOV = 50;
export const COCKPIT_FAR = 40000;

export const GROUND_SMOKE_PARTICLE_COUNT = 100;

export const AIRBASE_RUNWAY = { x: 1500, y: 0, z: -800 };
export const RUNWAY_HALF_LENGTH_M = 1500;
export const APPROACH_ALTITUDE_M = 500;
export const APPROACH_SPEED_KMH = 300;
export const APPROACH_SPEED_MPS = APPROACH_SPEED_KMH / 3.6;
export const APPROACH_FINAL_DISTANCE_M = 5000;

/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/script/defs.ts"
/*!****************************!*\
  !*** ./src/script/defs.ts ***!
  \****************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AIRBASE_RUNWAY: () => (/* binding */ AIRBASE_RUNWAY),
/* harmony export */   APPROACH_ALTITUDE_M: () => (/* binding */ APPROACH_ALTITUDE_M),
/* harmony export */   APPROACH_FINAL_DISTANCE_M: () => (/* binding */ APPROACH_FINAL_DISTANCE_M),
/* harmony export */   APPROACH_SPEED_KMH: () => (/* binding */ APPROACH_SPEED_KMH),
/* harmony export */   APPROACH_SPEED_MPS: () => (/* binding */ APPROACH_SPEED_MPS),
/* harmony export */   COCKPIT_FAR: () => (/* binding */ COCKPIT_FAR),
/* harmony export */   COCKPIT_FOV: () => (/* binding */ COCKPIT_FOV),
/* harmony export */   FPS_CAP: () => (/* binding */ FPS_CAP),
/* harmony export */   GROUND_SMOKE_PARTICLE_COUNT: () => (/* binding */ GROUND_SMOKE_PARTICLE_COUNT),
/* harmony export */   HI_H_RES: () => (/* binding */ HI_H_RES),
/* harmony export */   HI_V_RES: () => (/* binding */ HI_V_RES),
/* harmony export */   H_RES: () => (/* binding */ H_RES),
/* harmony export */   H_RES_HALF: () => (/* binding */ H_RES_HALF),
/* harmony export */   LO_H_RES: () => (/* binding */ LO_H_RES),
/* harmony export */   LO_V_RES: () => (/* binding */ LO_V_RES),
/* harmony export */   MAX_ALTITUDE: () => (/* binding */ MAX_ALTITUDE),
/* harmony export */   MAX_SPEED: () => (/* binding */ MAX_SPEED),
/* harmony export */   PITCH_RATE: () => (/* binding */ PITCH_RATE),
/* harmony export */   PLANE_COCKPIT_OFFSET_Y: () => (/* binding */ PLANE_COCKPIT_OFFSET_Y),
/* harmony export */   PLANE_COCKPIT_OFFSET_Z: () => (/* binding */ PLANE_COCKPIT_OFFSET_Z),
/* harmony export */   PLANE_DISTANCE_TO_GROUND: () => (/* binding */ PLANE_DISTANCE_TO_GROUND),
/* harmony export */   ROLL_RATE: () => (/* binding */ ROLL_RATE),
/* harmony export */   RUNWAY_HALF_LENGTH_M: () => (/* binding */ RUNWAY_HALF_LENGTH_M),
/* harmony export */   STICK_RATE: () => (/* binding */ STICK_RATE),
/* harmony export */   TERRAIN_MODEL_SIZE: () => (/* binding */ TERRAIN_MODEL_SIZE),
/* harmony export */   TERRAIN_SCALE: () => (/* binding */ TERRAIN_SCALE),
/* harmony export */   THROTTLE_RATE: () => (/* binding */ THROTTLE_RATE),
/* harmony export */   V_RES: () => (/* binding */ V_RES),
/* harmony export */   V_RES_HALF: () => (/* binding */ V_RES_HALF),
/* harmony export */   YAW_RATE: () => (/* binding */ YAW_RATE)
/* harmony export */ });
const FPS_CAP = 15;
const LO_H_RES = 320;
const LO_V_RES = 200;
const HI_H_RES = 640;
const HI_V_RES = 400;
const H_RES = 320;
const V_RES = 200;
const H_RES_HALF = H_RES / 2;
const V_RES_HALF = V_RES / 2;
const TERRAIN_SCALE = 200.0;
const TERRAIN_MODEL_SIZE = 100.0;
const PITCH_RATE = Math.PI / 5;
const ROLL_RATE = Math.PI / 2;
const YAW_RATE = Math.PI / 12;
const MAX_SPEED = 250.0;
const THROTTLE_RATE = 33;
const STICK_RATE = 1.5;
const PLANE_DISTANCE_TO_GROUND = 2.0;
const PLANE_COCKPIT_OFFSET_Y = 1.0;
const PLANE_COCKPIT_OFFSET_Z = 8.0;
const MAX_ALTITUDE = 14000;
const COCKPIT_FOV = 50;
const COCKPIT_FAR = 40000;
const GROUND_SMOKE_PARTICLE_COUNT = 100;
const AIRBASE_RUNWAY = { x: 1500, y: 0, z: -800 };
const RUNWAY_HALF_LENGTH_M = 1500;
const APPROACH_ALTITUDE_M = 500;
const APPROACH_SPEED_KMH = 300;
const APPROACH_SPEED_MPS = APPROACH_SPEED_KMH / 3.6;
const APPROACH_FINAL_DISTANCE_M = 5000;


/***/ },

/***/ "./src/script/physics/aeroUtils.ts"
/*!*****************************************!*\
  !*** ./src/script/physics/aeroUtils.ts ***!
  \*****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GROUND_AIR_DENSITY: () => (/* binding */ GROUND_AIR_DENSITY),
/* harmony export */   computeAirDensity: () => (/* binding */ computeAirDensity),
/* harmony export */   computeAngleOfAttack: () => (/* binding */ computeAngleOfAttack),
/* harmony export */   computeDynamicPressure: () => (/* binding */ computeDynamicPressure),
/* harmony export */   computeDynamicPressureDragPenalty: () => (/* binding */ computeDynamicPressureDragPenalty),
/* harmony export */   computeIsaAirDensity: () => (/* binding */ computeIsaAirDensity),
/* harmony export */   computeLoadFactorG: () => (/* binding */ computeLoadFactorG),
/* harmony export */   computeMachNumber: () => (/* binding */ computeMachNumber),
/* harmony export */   computeMaxEquilibriumSpeed: () => (/* binding */ computeMaxEquilibriumSpeed),
/* harmony export */   computeSpeedOfSound: () => (/* binding */ computeSpeedOfSound),
/* harmony export */   computeThrustDensityFactor: () => (/* binding */ computeThrustDensityFactor)
/* harmony export */ });
const GRAVITY = 9.8;
const GROUND_AIR_DENSITY = 1.225;
const VNE_MACH = 0.95;
const ISA_SEA_LEVEL_PRESSURE = 101325;
const ISA_SEA_LEVEL_TEMP = 288.15;
const ISA_LAPSE_RATE = 0.0065;
const ISA_TROPOPAUSE_ALT = 11000;
const ISA_TROPOPAUSE_PRESSURE = 22632.1;
const ISA_TROPOPAUSE_TEMP = 216.65;
const GRAVITY_ISA = 9.80665;
const GAS_CONSTANT = 287.053;
function computeIsaAirDensity(altitudeMeters) {
    const h = Math.max(0, altitudeMeters);
    let temperature;
    let pressure;
    if (h <= ISA_TROPOPAUSE_ALT) {
        temperature = ISA_SEA_LEVEL_TEMP - ISA_LAPSE_RATE * h;
        pressure = ISA_SEA_LEVEL_PRESSURE * Math.pow(temperature / ISA_SEA_LEVEL_TEMP, GRAVITY_ISA / (GAS_CONSTANT * ISA_LAPSE_RATE));
    }
    else {
        temperature = ISA_TROPOPAUSE_TEMP;
        pressure = ISA_TROPOPAUSE_PRESSURE * Math.exp(-GRAVITY_ISA * (h - ISA_TROPOPAUSE_ALT) / (GAS_CONSTANT * ISA_TROPOPAUSE_TEMP));
    }
    return pressure / (GAS_CONSTANT * temperature);
}
function computeAirDensity(altitudeMeters) {
    return computeIsaAirDensity(altitudeMeters);
}
function computeDynamicPressure(airDensity, speed) {
    return 0.5 * airDensity * speed * speed;
}
function computeThrustDensityFactor(airDensity, altitudeMeters = 0) {
    const sigma = airDensity / GROUND_AIR_DENSITY;
    const lapse = Math.pow(sigma, 0.7);
    const optimumAltitude = 11000;
    const altPenalty = altitudeMeters <= optimumAltitude
        ? 1
        : Math.max(0.35, 1 - (altitudeMeters - optimumAltitude) / 9000);
    return lapse * altPenalty;
}
const GAMMA = 1.4;
function computeSpeedOfSound(altitudeMeters) {
    const temperature = Math.max(ISA_TROPOPAUSE_TEMP, ISA_SEA_LEVEL_TEMP - ISA_LAPSE_RATE * altitudeMeters);
    return Math.sqrt(GAMMA * GAS_CONSTANT * temperature);
}
function computeMachNumber(speedMps, altitudeMeters) {
    const speedOfSound = computeSpeedOfSound(altitudeMeters);
    if (speedOfSound <= 0) {
        return 0;
    }
    return speedMps / speedOfSound;
}
function computeDynamicPressureDragPenalty(speedMps, altitudeMeters) {
    const speedOfSound = computeSpeedOfSound(altitudeMeters);
    if (speedOfSound <= 0 || speedMps <= 0) {
        return 0;
    }
    const mach = speedMps / speedOfSound;
    if (mach <= VNE_MACH) {
        return 0;
    }
    const excess = (mach - VNE_MACH) / VNE_MACH;
    return 0.55 * excess * excess;
}
function computeMaxEquilibriumSpeed(airDensity, thrustForce, wingArea, dragCoefficient) {
    if (airDensity <= 0 || dragCoefficient <= 0 || thrustForce <= 0) {
        return 0;
    }
    return Math.sqrt(2 * thrustForce / (airDensity * wingArea * dragCoefficient));
}
function computeAngleOfAttack(forward, right, velocity, scratch) {
    const speed = velocity.length();
    if (speed <= 1.0) {
        return 0;
    }
    scratch.copy(velocity).multiplyScalar(1 / speed).projectOnPlane(right);
    if (scratch.lengthSq() <= 1e-6) {
        return 0;
    }
    scratch.normalize();
    const aoaAngle = scratch.angleTo(forward);
    const aoaSign = scratch.cross(forward).dot(right) > 0 ? -1 : 1;
    return aoaSign * aoaAngle;
}
function computeLoadFactorG(accel, up, gravity = GRAVITY) {
    return (accel.x * up.x + (accel.y + gravity) * up.y + accel.z * up.z) / gravity;
}


/***/ },

/***/ "./src/script/physics/f16Engine.ts"
/*!*****************************************!*\
  !*** ./src/script/physics/f16Engine.ts ***!
  \*****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   F16_AFTERBURNER_CONE_LENGTH_M: () => (/* binding */ F16_AFTERBURNER_CONE_LENGTH_M),
/* harmony export */   F16_ENGINE: () => (/* binding */ F16_ENGINE),
/* harmony export */   F16_ENGINE_NOZZLE_COLORS: () => (/* binding */ F16_ENGINE_NOZZLE_COLORS),
/* harmony export */   adjustF16ThrottleInput: () => (/* binding */ adjustF16ThrottleInput),
/* harmony export */   computeF16EngineThrustKn: () => (/* binding */ computeF16EngineThrustKn),
/* harmony export */   computeF16EngineThrustN: () => (/* binding */ computeF16EngineThrustN),
/* harmony export */   computeF16SlThrustKn: () => (/* binding */ computeF16SlThrustKn),
/* harmony export */   f16ThrottleAudioLevel: () => (/* binding */ f16ThrottleAudioLevel),
/* harmony export */   formatF16ThrottleHud: () => (/* binding */ formatF16ThrottleHud),
/* harmony export */   getF16AfterburnerConeDither: () => (/* binding */ getF16AfterburnerConeDither),
/* harmony export */   getF16AfterburnerConeLengthM: () => (/* binding */ getF16AfterburnerConeLengthM),
/* harmony export */   getF16EngineNozzleColor: () => (/* binding */ getF16EngineNozzleColor),
/* harmony export */   getF16ThrottleZone: () => (/* binding */ getF16ThrottleZone),
/* harmony export */   isF16AbDetentBand: () => (/* binding */ isF16AbDetentBand),
/* harmony export */   isF16AfterburnerActive: () => (/* binding */ isF16AfterburnerActive),
/* harmony export */   leverToPercent: () => (/* binding */ leverToPercent),
/* harmony export */   stepF16ThrottleDetent: () => (/* binding */ stepF16ThrottleDetent)
/* harmony export */ });
/* harmony import */ var _aeroUtils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./aeroUtils */ "./src/script/physics/aeroUtils.ts");
/* harmony import */ var _f16Profile__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./f16Profile */ "./src/script/physics/f16Profile.ts");


const F16_ENGINE = {
    idleThrustKn: 0.5,
    milThrustKn: 76.3,
    abMinThrustKn: 104.0,
    abMaxThrustKn: _f16Profile__WEBPACK_IMPORTED_MODULE_1__.F16_PROFILE.abThrustKn,
    milLeverEnd: _f16Profile__WEBPACK_IMPORTED_MODULE_1__.F16_PROFILE.milLeverEnd,
    abMinLeverEnd: _f16Profile__WEBPACK_IMPORTED_MODULE_1__.F16_PROFILE.abMinLeverEnd,
};
const F16_ENGINE_NOZZLE_COLORS = {
    mil: '#0a0a0a',
    abMin: '#ff8800',
    abMax: '#ffff00',
};
function getF16EngineNozzleColor(lever) {
    const zone = getF16ThrottleZone(lever);
    if (zone === 'ab-min') {
        return F16_ENGINE_NOZZLE_COLORS.abMin;
    }
    if (zone === 'ab-max') {
        return F16_ENGINE_NOZZLE_COLORS.abMax;
    }
    return F16_ENGINE_NOZZLE_COLORS.mil;
}
function getF16AfterburnerConeDither(lever) {
    const zone = getF16ThrottleZone(lever);
    if (zone === 'ab-min') {
        return {
            primary: F16_ENGINE_NOZZLE_COLORS.abMin,
            secondary: F16_ENGINE_NOZZLE_COLORS.abMax,
        };
    }
    if (zone === 'ab-max') {
        return {
            primary: F16_ENGINE_NOZZLE_COLORS.abMax,
            secondary: F16_ENGINE_NOZZLE_COLORS.abMin,
        };
    }
    return null;
}
function isF16AfterburnerActive(lever) {
    return getF16ThrottleZone(lever) !== 'mil';
}
const F16_AFTERBURNER_CONE_LENGTH_M = {
    mil: 0,
    abMin: 4,
    abMax: 7,
};
function getF16AfterburnerConeLengthM(lever) {
    const zone = getF16ThrottleZone(lever);
    if (zone === 'ab-min') {
        return F16_AFTERBURNER_CONE_LENGTH_M.abMin;
    }
    if (zone === 'ab-max') {
        return F16_AFTERBURNER_CONE_LENGTH_M.abMax;
    }
    return F16_AFTERBURNER_CONE_LENGTH_M.mil;
}
function leverToPercent(lever) {
    return clampLever(lever) * 100;
}
function isF16AbDetentBand(lever) {
    return leverToPercent(lever) >= 98;
}
function getF16ThrottleZone(lever) {
    const pct = leverToPercent(lever);
    if (pct < 99) {
        return 'mil';
    }
    if (pct < 100) {
        return 'ab-min';
    }
    return 'ab-max';
}
function computeF16SlThrustKn(lever) {
    const pct = leverToPercent(lever);
    const { idleThrustKn, milThrustKn, abMinThrustKn, abMaxThrustKn } = F16_ENGINE;
    if (pct <= 98) {
        const milFraction = pct / 98;
        return idleThrustKn + (milThrustKn - idleThrustKn) * milFraction;
    }
    if (pct < 99) {
        return milThrustKn;
    }
    if (pct >= 100) {
        return abMaxThrustKn;
    }
    return abMinThrustKn;
}
function computeF16EngineThrustN(lever, altitudeMeters) {
    const slKn = computeF16SlThrustKn(lever);
    const rho = (0,_aeroUtils__WEBPACK_IMPORTED_MODULE_0__.computeAirDensity)(altitudeMeters);
    const factor = (0,_aeroUtils__WEBPACK_IMPORTED_MODULE_0__.computeThrustDensityFactor)(rho, altitudeMeters);
    return slKn * 1000 * factor;
}
function computeF16EngineThrustKn(lever, altitudeMeters) {
    return computeF16EngineThrustN(lever, altitudeMeters) / 1000;
}
function formatF16ThrottleHud(lever) {
    const pct = leverToPercent(lever);
    const zone = getF16ThrottleZone(lever);
    if (zone === 'mil') {
        if (pct > 98) {
            return 'MIL 100';
        }
        const milPct = Math.round(20 + (pct / 98) * 80);
        return `MIL ${milPct}`;
    }
    if (zone === 'ab-min') {
        return 'AB1';
    }
    return 'AB2';
}
function f16ThrottleAudioLevel(lever) {
    const slKn = computeF16SlThrustKn(lever);
    const { idleThrustKn, abMaxThrustKn } = F16_ENGINE;
    if (abMaxThrustKn <= idleThrustKn) {
        return 0;
    }
    return clampLever((slKn - idleThrustKn) / (abMaxThrustKn - idleThrustKn));
}
function adjustF16ThrottleInput(lever, step) {
    const current = clampLever(lever);
    if (step > 0) {
        return rampF16ThrottleUp(current, step);
    }
    if (step < 0) {
        return rampF16ThrottleDown(current, -step);
    }
    return current;
}
function stepF16ThrottleDetent(lever, direction) {
    const pct = leverToPercent(lever);
    if (direction > 0) {
        if (pct >= 99) {
            return 1;
        }
        if (pct >= 98) {
            return F16_ENGINE.abMinLeverEnd;
        }
        return lever;
    }
    if (pct >= 100) {
        return F16_ENGINE.abMinLeverEnd;
    }
    if (pct >= 99) {
        return F16_ENGINE.milLeverEnd;
    }
    return lever;
}
function rampF16ThrottleUp(lever, step) {
    const target = lever + step;
    if (target >= F16_ENGINE.milLeverEnd) {
        return F16_ENGINE.milLeverEnd;
    }
    return clampLever(target);
}
function rampF16ThrottleDown(lever, step) {
    const pct = leverToPercent(lever);
    if (pct > 98) {
        return F16_ENGINE.milLeverEnd;
    }
    return clampLever(lever - step);
}
function clampLever(lever) {
    return Math.max(0, Math.min(1, lever));
}


/***/ },

/***/ "./src/script/physics/f16FcsLimits.ts"
/*!********************************************!*\
  !*** ./src/script/physics/f16FcsLimits.ts ***!
  \********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   clampLoadFactorAcceleration: () => (/* binding */ clampLoadFactorAcceleration),
/* harmony export */   computeF16AoaRecoveryRate: () => (/* binding */ computeF16AoaRecoveryRate),
/* harmony export */   computeF16EnvelopeAuthority: () => (/* binding */ computeF16EnvelopeAuthority),
/* harmony export */   computeF16PitchAoaAuthority: () => (/* binding */ computeF16PitchAoaAuthority),
/* harmony export */   computeF16PitchGLimit: () => (/* binding */ computeF16PitchGLimit),
/* harmony export */   computeLoadFactorG: () => (/* binding */ computeLoadFactorG)
/* harmony export */ });
/* harmony import */ var _utils_math__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/math */ "./src/script/utils/math.ts");

const GRAVITY = 9.8;
function computeF16EnvelopeAuthority(currentG, maxG) {
    const margin = maxG - currentG;
    if (margin >= 1) {
        return 1;
    }
    if (margin <= 0) {
        return 0;
    }
    return margin;
}
function computeF16PitchGLimit(currentG, pitchStick, maxG) {
    if (pitchStick <= 0) {
        return 1;
    }
    return computeF16EnvelopeAuthority(currentG, maxG);
}
function computeF16PitchAoaAuthority(aoaRad, pitchStick, stallAoaRad) {
    if (pitchStick <= 0) {
        return 1;
    }
    const limit = stallAoaRad * 0.95;
    if (aoaRad <= limit) {
        return 1;
    }
    return (0,_utils_math__WEBPACK_IMPORTED_MODULE_0__.clamp)(1 - (aoaRad - limit) / stallAoaRad, 0, 1);
}
function computeF16AoaRecoveryRate(aoaRad, stallAoaRad, speed) {
    if (speed < 10) {
        return 0;
    }
    if (Math.abs(aoaRad) <= stallAoaRad) {
        return 0;
    }
    return (0,_utils_math__WEBPACK_IMPORTED_MODULE_0__.clamp)((Math.abs(aoaRad) - stallAoaRad) / stallAoaRad, 0, 1) * 0.35;
}
function computeLoadFactorG(accel, up, gravity = GRAVITY) {
    return (accel.x * up.x + (accel.y + gravity) * up.y + accel.z * up.z) / gravity;
}
function clampLoadFactorAcceleration(accel, up, maxG, gravity = GRAVITY) {
    const n = computeLoadFactorG(accel, up, gravity);
    if (n <= maxG) {
        return;
    }
    accel.addScaledVector(up, (maxG - n) * gravity);
}


/***/ },

/***/ "./src/script/physics/f16PaperData.ts"
/*!********************************************!*\
  !*** ./src/script/physics/f16PaperData.ts ***!
  \********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   F16_PAPER_ANALYTICAL: () => (/* binding */ F16_PAPER_ANALYTICAL),
/* harmony export */   F16_PAPER_CHART_CASES: () => (/* binding */ F16_PAPER_CHART_CASES),
/* harmony export */   F16_PAPER_VSPAERO: () => (/* binding */ F16_PAPER_VSPAERO),
/* harmony export */   F16_PAPER_VSPAERO_CASES: () => (/* binding */ F16_PAPER_VSPAERO_CASES),
/* harmony export */   FPS_TO_MPS: () => (/* binding */ FPS_TO_MPS),
/* harmony export */   FT_TO_M: () => (/* binding */ FT_TO_M),
/* harmony export */   LB_TO_KG: () => (/* binding */ LB_TO_KG),
/* harmony export */   LB_TO_N: () => (/* binding */ LB_TO_N)
/* harmony export */ });
const F16_PAPER_ANALYTICAL = {
    cd0: 0.018,
    inducedDragK: 0.1489,
    cl0: 0.2,
    clAlphaPerRad: 5.73,
    maxLiftToDrag: 9.66,
    maxLiftToDragAlphaDeg: 2,
    minGlideAngleDeg: 5.91,
    cruiseVelocityFps: 846,
    cruiseAltitudeFt: 30000,
    serviceCeilingFt: 50000,
    wingAreaFt2: 300,
    mtowLb: 42000,
};
const F16_PAPER_VSPAERO = {
    cd0: 0.0124,
    clAlphaPerRad: 3.62,
    inducedDragK: 0.0973,
    maxLiftToDrag: 14,
    maxLiftToDragAlphaDeg: 4,
};
const F16_PAPER_CHART_CASES = [
    {
        id: 'fig7_ld_max',
        figure: 'Fig. 7',
        description: 'Maximum lift-to-drag ratio',
        metric: 'liftToDrag',
        alphaDeg: 2,
        altitudeFt: 0,
        weightLb: F16_PAPER_ANALYTICAL.mtowLb,
        velocityFps: 0,
        reference: 9.66,
        tolerance: 0.15,
    },
    {
        id: 'fig9_min_glide',
        figure: 'Fig. 9',
        description: 'Minimum glide angle',
        metric: 'minGlideAngleDeg',
        altitudeFt: 30000,
        weightLb: F16_PAPER_ANALYTICAL.mtowLb,
        velocityFps: 0,
        reference: 5.91,
        tolerance: 0.1,
    },
    {
        id: 'fig10_min_drag_20k',
        figure: 'Fig. 10',
        description: 'Minimum total drag at 20,000 ft (MTOW)',
        metric: 'minTotalDragLb',
        altitudeFt: 20000,
        weightLb: F16_PAPER_ANALYTICAL.mtowLb,
        velocityFps: 797,
        reference: 4348.74,
        tolerance: 50,
    },
    {
        id: 'fig10_drag_750fps',
        figure: 'Fig. 10',
        description: 'Total drag at 750 ft/s, 20,000 ft (MTOW)',
        metric: 'totalDragLb',
        altitudeFt: 20000,
        weightLb: F16_PAPER_ANALYTICAL.mtowLb,
        velocityFps: 750,
        reference: 4381.50,
        tolerance: 50,
    },
    {
        id: 'fig11_min_drag_30k',
        figure: 'Fig. 11',
        description: 'Minimum total drag at 30,000 ft (MTOW)',
        metric: 'minTotalDragLb',
        altitudeFt: 30000,
        weightLb: F16_PAPER_ANALYTICAL.mtowLb,
        velocityFps: 952,
        reference: 4348.74,
        tolerance: 50,
    },
    {
        id: 'fig11_drag_900fps',
        figure: 'Fig. 11',
        description: 'Total drag at 900 ft/s, 30,000 ft (MTOW)',
        metric: 'totalDragLb',
        altitudeFt: 30000,
        weightLb: F16_PAPER_ANALYTICAL.mtowLb,
        velocityFps: 900,
        reference: 4375.84,
        tolerance: 50,
    },
    {
        id: 'fig12_min_drag_40k',
        figure: 'Fig. 12',
        description: 'Minimum total drag at 40,000 ft (MTOW)',
        metric: 'minTotalDragLb',
        altitudeFt: 40000,
        weightLb: F16_PAPER_ANALYTICAL.mtowLb,
        velocityFps: 1173,
        reference: 4348.73,
        tolerance: 50,
    },
    {
        id: 'fig12_drag_1000fps',
        figure: 'Fig. 12',
        description: 'Total drag at 1,000 ft/s, 40,000 ft (MTOW)',
        metric: 'totalDragLb',
        altitudeFt: 40000,
        weightLb: F16_PAPER_ANALYTICAL.mtowLb,
        velocityFps: 1000,
        reference: 4572.53,
        tolerance: 50,
    },
    {
        id: 'fig16_tr_min_35klb',
        figure: 'Fig. 16',
        description: 'Minimum thrust required at 35,000 lb (30,000 ft)',
        metric: 'thrustRequiredLb',
        altitudeFt: 30000,
        weightLb: 35000,
        velocityFps: 870,
        reference: 3623.96,
        tolerance: 50,
    },
    {
        id: 'fig16_tr_35klb_900fps',
        figure: 'Fig. 16',
        description: 'Thrust required at 35,000 lb, 900 ft/s (30,000 ft)',
        metric: 'thrustRequiredLb',
        altitudeFt: 30000,
        weightLb: 35000,
        velocityFps: 900,
        reference: 3633.01,
        tolerance: 50,
    },
    {
        id: 'fig16_tr_35klb_1000fps',
        figure: 'Fig. 16',
        description: 'Thrust required at 35,000 lb, 1,000 ft/s (30,000 ft)',
        metric: 'thrustRequiredLb',
        altitudeFt: 30000,
        weightLb: 35000,
        velocityFps: 1000,
        reference: 3768.43,
        tolerance: 50,
    },
    {
        id: 'fig17_tr_min_20k',
        figure: 'Fig. 17',
        description: 'Minimum thrust required at 20,000 ft (MTOW)',
        metric: 'thrustRequiredLb',
        altitudeFt: 20000,
        weightLb: F16_PAPER_ANALYTICAL.mtowLb,
        velocityFps: 797,
        reference: 4348.74,
        tolerance: 50,
    },
    {
        id: 'fig17_tr_min_30k',
        figure: 'Fig. 17',
        description: 'Thrust required at 1,000 ft/s, 30,000 ft (MTOW)',
        metric: 'thrustRequiredLb',
        altitudeFt: 30000,
        weightLb: F16_PAPER_ANALYTICAL.mtowLb,
        velocityFps: 1000,
        reference: 4370.12,
        tolerance: 50,
    },
    {
        id: 'fig17_tr_1150fps_40k',
        figure: 'Fig. 17',
        description: 'Thrust required at 1,150 ft/s, 40,000 ft (MTOW)',
        metric: 'thrustRequiredLb',
        altitudeFt: 40000,
        weightLb: F16_PAPER_ANALYTICAL.mtowLb,
        velocityFps: 1150,
        reference: 4352.20,
        tolerance: 50,
    },
    {
        id: 'assumption_cruise_speed',
        figure: 'Section III',
        description: 'Cruise velocity at 30,000 ft (MTOW)',
        metric: 'cruiseSpeedFps',
        altitudeFt: F16_PAPER_ANALYTICAL.cruiseAltitudeFt,
        weightLb: F16_PAPER_ANALYTICAL.mtowLb,
        velocityFps: F16_PAPER_ANALYTICAL.cruiseVelocityFps,
        reference: 846,
        tolerance: 0.5,
    },
];
const F16_PAPER_VSPAERO_CASES = [
    {
        id: 'fig20_ld_max_vspaero',
        figure: 'Fig. 20',
        description: 'VSPAero maximum L/D',
        metric: 'liftToDrag',
        alphaDeg: 4,
        altitudeFt: 0,
        weightLb: F16_PAPER_ANALYTICAL.mtowLb,
        velocityFps: 0,
        reference: 14,
        tolerance: 0.15,
    },
];
const FT_TO_M = 0.3048;
const FPS_TO_MPS = FT_TO_M;
const LB_TO_N = 4.4482216153;
const LB_TO_KG = 0.45359237;


/***/ },

/***/ "./src/script/physics/f16Profile.ts"
/*!******************************************!*\
  !*** ./src/script/physics/f16Profile.ts ***!
  \******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   F16_PROFILE: () => (/* binding */ F16_PROFILE),
/* harmony export */   F16_REFERENCE_CASES: () => (/* binding */ F16_REFERENCE_CASES),
/* harmony export */   MPS_TO_KTS: () => (/* binding */ MPS_TO_KTS)
/* harmony export */ });
/* harmony import */ var _f16PaperData__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./f16PaperData */ "./src/script/physics/f16PaperData.ts");

const F16_PROFILE = {
    combatMassKg: 19051,
    simMassKg: 13608,
    wingAreaM2: 27.87,
    wingSpanM: 9.45,
    cd0: _f16PaperData__WEBPACK_IMPORTED_MODULE_0__.F16_PAPER_ANALYTICAL.cd0,
    inducedDragK: _f16PaperData__WEBPACK_IMPORTED_MODULE_0__.F16_PAPER_ANALYTICAL.inducedDragK,
    cl0: _f16PaperData__WEBPACK_IMPORTED_MODULE_0__.F16_PAPER_ANALYTICAL.cl0,
    clAlphaPerRad: _f16PaperData__WEBPACK_IMPORTED_MODULE_0__.F16_PAPER_ANALYTICAL.clAlphaPerRad,
    abThrustKn: 129.4,
    milThrustKn: 76.3,
    milLeverEnd: 0.98,
    abMinLeverEnd: 0.99,
    minFlyingSpeedMps: 68,
    stallAoaDeg: 22,
    serviceCeilingM: _f16PaperData__WEBPACK_IMPORTED_MODULE_0__.F16_PAPER_ANALYTICAL.serviceCeilingFt * 0.3048,
    cruiseAltitudeM: _f16PaperData__WEBPACK_IMPORTED_MODULE_0__.F16_PAPER_ANALYTICAL.cruiseAltitudeFt * 0.3048,
    cruiseSpeedMps: _f16PaperData__WEBPACK_IMPORTED_MODULE_0__.F16_PAPER_ANALYTICAL.cruiseVelocityFps * 0.3048,
    maxRollRateDegS: 300,
    cat3MaxRollRateDegS: 180,
    maxLoadFactorG: 9.5,
    rotationSpeedMps: 65,
    landingMaxSpeedMps: 90,
    landingMaxVerticalSpeedMps: 8,
    landingMaxRollDeg: 12,
    landingMinPitchDeg: -12,
};
const F16_REFERENCE_CASES = [
    {
        id: 'cd0_paper',
        description: 'Zero-lift drag coefficient (Eq. 2)',
        source: 'Rehman paper analytical',
        metric: 'cd0',
        altitudeMeters: 0,
        reference: 0.018,
        tolerance: 0,
    },
    {
        id: 'induced_k_paper',
        description: 'Induced drag factor K (Eq. 3–5)',
        source: 'Rehman paper analytical',
        metric: 'inducedDragK',
        altitudeMeters: 0,
        reference: 0.1489,
        tolerance: 0.0001,
    },
    {
        id: 'cl_alpha_paper',
        description: 'Lift-curve slope',
        source: 'Rehman paper / NACA 64A204',
        metric: 'clAlphaPerRad',
        altitudeMeters: 0,
        reference: 5.73,
        tolerance: 0.01,
    },
    {
        id: 'ld_max_paper',
        description: 'Maximum lift-to-drag ratio at α ≈ 2°',
        source: 'Rehman Fig. 7',
        metric: 'maxLiftToDrag',
        altitudeMeters: 0,
        alphaDeg: 2,
        reference: 9.66,
        tolerance: 0.3,
    },
    {
        id: 'cruise_speed_paper',
        description: 'Cruise true airspeed at 30,000 ft',
        source: 'Rehman Section III (846 ft/s)',
        metric: 'cruiseSpeedMps',
        altitudeMeters: F16_PROFILE.cruiseAltitudeM,
        reference: F16_PROFILE.cruiseSpeedMps,
        tolerance: 0.5,
    },
    {
        id: 'wing_area',
        description: 'Wing reference area (300 ft²)',
        source: 'Jane\'s / Rehman paper',
        metric: 'wingAreaM2',
        altitudeMeters: 0,
        reference: 27.87,
        tolerance: 0.05,
    },
    {
        id: 'ab_thrust_sl',
        description: 'Full afterburner thrust at sea level',
        source: 'F100-PW-229 (129.4 kN)',
        metric: 'abThrustKn',
        altitudeMeters: 0,
        reference: 129.4,
        tolerance: 2.0,
    },
    {
        id: 'max_mach_fl400',
        description: 'Maximum Mach at 40,000 ft (AB, thrust–drag balance)',
        source: 'Sim envelope with Anderson polar + transonic drag',
        metric: 'maxMach',
        altitudeMeters: 12192,
        reference: 1.89,
        tolerance: 0.12,
    },
    {
        id: 'peak_speed_altitude',
        description: 'Altitude of peak level-flight max speed',
        source: 'Sim envelope (ISA thrust lapse)',
        metric: 'peakMaxSpeedAltitudeM',
        altitudeMeters: 0,
        reference: 11000,
        tolerance: 500,
    },
];
const MPS_TO_KTS = 1.94384;


/***/ },

/***/ "./src/script/physics/f16RollControl.ts"
/*!**********************************************!*\
  !*** ./src/script/physics/f16RollControl.ts ***!
  \**********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   F16_ROLL_CAT1: () => (/* binding */ F16_ROLL_CAT1),
/* harmony export */   F16_ROLL_CAT3: () => (/* binding */ F16_ROLL_CAT3),
/* harmony export */   computeF16CommandedRollRate: () => (/* binding */ computeF16CommandedRollRate),
/* harmony export */   computeF16RollDynamicPressureGain: () => (/* binding */ computeF16RollDynamicPressureGain),
/* harmony export */   computeF16RollYawCoupling: () => (/* binding */ computeF16RollYawCoupling),
/* harmony export */   maxRollRateRad: () => (/* binding */ maxRollRateRad),
/* harmony export */   stepF16BodyRollRate: () => (/* binding */ stepF16BodyRollRate)
/* harmony export */ });
/* harmony import */ var _utils_math__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/math */ "./src/script/utils/math.ts");

const F16_ROLL_CAT1 = {
    maxRollRateDegS: 300,
    actuatorTauS: 0.075,
};
const F16_ROLL_CAT3 = {
    maxRollRateDegS: 180,
    actuatorTauS: 0.09,
};
const DEG_TO_RAD = Math.PI / 180;
const MIN_Q_GAIN = 0.12;
const MAX_Q_GAIN = 1.0;
function maxRollRateRad(config) {
    return config.maxRollRateDegS * DEG_TO_RAD;
}
function computeF16RollDynamicPressureGain(dynamicPressure, qRef) {
    const q = Math.max(dynamicPressure, 1);
    const ref = Math.max(qRef, 1);
    const raw = MIN_Q_GAIN + (MAX_Q_GAIN - MIN_Q_GAIN) * Math.sqrt(ref / (ref + q));
    return (0,_utils_math__WEBPACK_IMPORTED_MODULE_0__.clamp)(raw, MIN_Q_GAIN, MAX_Q_GAIN);
}
function machRollLimiter(mach) {
    if (mach <= 0.85) {
        return 1;
    }
    return (0,_utils_math__WEBPACK_IMPORTED_MODULE_0__.clamp)(1 - (mach - 0.85) / 0.55, 0.35, 1);
}
function altitudeRollLimiter(altitudeM) {
    if (altitudeM <= 12000) {
        return 1;
    }
    return (0,_utils_math__WEBPACK_IMPORTED_MODULE_0__.clamp)(1 - (altitudeM - 12000) / 20000, 0.45, 1);
}
function aoaRollLimiter(aoaRad) {
    const aoaDeg = Math.abs(aoaRad) * (180 / Math.PI);
    if (aoaDeg <= 15) {
        return 1;
    }
    return (0,_utils_math__WEBPACK_IMPORTED_MODULE_0__.clamp)(1 - (aoaDeg - 15) / 22, 0.15, 1);
}
function computeF16CommandedRollRate(inputs) {
    if (inputs.landed || Math.abs(inputs.stick) < 1e-6) {
        return 0;
    }
    const flapFactor = inputs.flapsExtended ? 0.65 : 1;
    const limiter = machRollLimiter(inputs.mach)
        * altitudeRollLimiter(inputs.altitudeM)
        * aoaRollLimiter(inputs.aoaRad)
        * flapFactor;
    const qGain = computeF16RollDynamicPressureGain(inputs.dynamicPressure, inputs.qRef);
    return inputs.stick * maxRollRateRad(inputs.config) * qGain * limiter;
}
function stepF16BodyRollRate(bodyRollRateRad, commandedRateRad, delta, config) {
    if (delta <= 0) {
        return bodyRollRateRad;
    }
    const alpha = 1 - Math.exp(-delta / Math.max(config.actuatorTauS, 1e-3));
    return bodyRollRateRad + (commandedRateRad - bodyRollRateRad) * alpha;
}
function computeF16RollYawCoupling(bodyRollRateRad, aoaRad, maxRollRateRad) {
    const aoaFactor = (0,_utils_math__WEBPACK_IMPORTED_MODULE_0__.clamp)((Math.abs(aoaRad) - 0.12) / 0.4, 0, 1);
    if (aoaFactor <= 0 || maxRollRateRad <= 0) {
        return 0;
    }
    const normalizedRoll = (0,_utils_math__WEBPACK_IMPORTED_MODULE_0__.clamp)(bodyRollRateRad / maxRollRateRad, -1, 1);
    return normalizedRoll * 0.4 * aoaFactor;
}


/***/ },

/***/ "./src/script/physics/fm2/aeroSurface.ts"
/*!***********************************************!*\
  !*** ./src/script/physics/fm2/aeroSurface.ts ***!
  \***********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AeroSurface: () => (/* binding */ AeroSurface),
/* harmony export */   liftCoefficient: () => (/* binding */ liftCoefficient)
/* harmony export */ });
/* harmony import */ var three__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! three */ "./node_modules/three/build/three.module.js");

class AeroSurface {
    constructor(geom) {
        this.position = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.up = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.forward = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.span = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this._u = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this._rot = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this._dragDir = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this._liftDir = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.lastAoaRad = 0;
        this.geom = geom;
        this.name = geom.name;
        this.position.fromArray(geom.position);
        this.up.fromArray(geom.up).normalize();
        this.forward.fromArray(geom.forward).normalize();
        this.span.copy(this.up).cross(this.forward).normalize();
    }
    get positionBody() {
        return this.position;
    }
    accumulate(input, outForce, outMoment) {
        this._rot.crossVectors(input.angularVelocityBody, this.position);
        this._u.copy(input.velocityBody).add(this._rot);
        const spanComp = this._u.dot(this.span);
        this._u.addScaledVector(this.span, -spanComp);
        const speedSq = this._u.lengthSq();
        if (speedSq < 1e-4) {
            this.lastAoaRad = 0;
            return;
        }
        const speed = Math.sqrt(speedSq);
        const uf = this._u.dot(this.forward);
        const uu = this._u.dot(this.up);
        const aoa = Math.atan2(-uu, uf);
        this.lastAoaRad = aoa;
        const effectiveAoa = aoa + input.controlDeltaAoaRad + input.camberBiasRad;
        const stall = this.geom.stallAoaRad - input.stallShiftRad;
        const cl = liftCoefficient(effectiveAoa, this.geom.liftSlopePerRad, stall);
        const separated = Math.sin(effectiveAoa);
        const cd = this.geom.cd0 + input.extraCd
            + this.geom.inducedK * cl * cl
            + 1.0 * separated * separated;
        this._dragDir.copy(this._u).multiplyScalar(-1 / speed);
        this._liftDir.crossVectors(this.span, this._dragDir).normalize();
        const q = 0.5 * input.airDensity * speedSq;
        const area = this.geom.areaM2;
        const lift = q * area * cl;
        const drag = q * area * cd;
        const fx = this._liftDir.x * lift + this._dragDir.x * drag;
        const fy = this._liftDir.y * lift + this._dragDir.y * drag;
        const fz = this._liftDir.z * lift + this._dragDir.z * drag;
        outForce.x += fx;
        outForce.y += fy;
        outForce.z += fz;
        const rx = this.position.x, ry = this.position.y, rz = this.position.z;
        outMoment.x += ry * fz - rz * fy;
        outMoment.y += rz * fx - rx * fz;
        outMoment.z += rx * fy - ry * fx;
    }
}
function liftCoefficient(aoaRad, slopePerRad, stallRad) {
    const mag = Math.abs(aoaRad);
    const sign = Math.sign(aoaRad);
    if (mag <= stallRad) {
        return slopePerRad * aoaRad;
    }
    const peak = slopePerRad * stallRad;
    const decay = Math.cos((mag - stallRad) * 2.2);
    return sign * peak * Math.max(0, decay);
}


/***/ },

/***/ "./src/script/physics/fm2/f16Fcs.ts"
/*!******************************************!*\
  !*** ./src/script/physics/fm2/f16Fcs.ts ***!
  \******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   F16Fcs: () => (/* binding */ F16Fcs)
/* harmony export */ });
/* harmony import */ var _utils_math__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/math */ "./src/script/utils/math.ts");
/* harmony import */ var _aeroUtils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../aeroUtils */ "./src/script/physics/aeroUtils.ts");
/* harmony import */ var _f16RollControl__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../f16RollControl */ "./src/script/physics/f16RollControl.ts");
/* harmony import */ var _f16Fm2Config__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./f16Fm2Config */ "./src/script/physics/fm2/f16Fm2Config.ts");




const DEG = Math.PI / 180;
class F16Fcs {
    constructor() {
        this.elevator = 0;
        this.aileron = 0;
        this.rudder = 0;
        this.yawRateLowPass = 0;
        this.pitchIntegral = 0;
        this.prevAoa = 0;
        this.aoaRateFilt = 0;
        this.prevAoaValid = false;
    }
    reset() {
        this.elevator = 0;
        this.aileron = 0;
        this.rudder = 0;
        this.yawRateLowPass = 0;
        this.pitchIntegral = 0;
        this.prevAoa = 0;
        this.aoaRateFilt = 0;
        this.prevAoaValid = false;
    }
    getState() {
        return { elevator: this.elevator, aileron: this.aileron, rudder: this.rudder };
    }
    update(input, dt) {
        const elevatorTarget = this.pitchLaw(input, dt);
        const aileronTarget = this.rollLaw(input);
        const rudderTarget = this.yawLaw(input, aileronTarget, dt);
        const a = dt <= 0 ? 1 : 1 - Math.exp(-dt / Math.max(_f16Fm2Config__WEBPACK_IMPORTED_MODULE_3__.FM2_FCS.actuatorTauS, 1e-3));
        this.elevator += (elevatorTarget - this.elevator) * a;
        this.aileron += (aileronTarget - this.aileron) * a;
        this.rudder += (rudderTarget - this.rudder) * a;
        return this.getState();
    }
    pitchLaw(input, dt) {
        const { maxCommandG, minCommandG, pitchGGain, pitchIGain, pitchRateDampGain } = _f16Fm2Config__WEBPACK_IMPORTED_MODULE_3__.FM2_FCS;
        const e = _f16Fm2Config__WEBPACK_IMPORTED_MODULE_3__.FM2_FCS.pitchStickExpo;
        const shapedStick = (1 - e) * input.pitchStick + e * Math.pow(input.pitchStick, 3);
        let commandedG;
        if (shapedStick >= 0) {
            commandedG = 1 + shapedStick * (maxCommandG - 1);
        }
        else {
            commandedG = 1 + shapedStick * (1 - minCommandG);
        }
        let aoaRate = 0;
        if (this.prevAoaValid && dt > 0) {
            aoaRate = (input.aoaRad - this.prevAoa) / dt;
        }
        this.prevAoa = input.aoaRad;
        this.prevAoaValid = true;
        const fAoa = dt <= 0 ? 1 : 1 - Math.exp(-dt / Math.max(_f16Fm2Config__WEBPACK_IMPORTED_MODULE_3__.FM2_FCS.aoaRateFilterTauS, 1e-3));
        this.aoaRateFilt += (aoaRate - this.aoaRateFilt) * fAoa;
        const aoaDeg = input.aoaRad / DEG;
        const aoaLimiter = (0,_utils_math__WEBPACK_IMPORTED_MODULE_0__.clamp)((_f16Fm2Config__WEBPACK_IMPORTED_MODULE_3__.FM2_FCS.aoaLimitDeg - aoaDeg) / (_f16Fm2Config__WEBPACK_IMPORTED_MODULE_3__.FM2_FCS.aoaLimitDeg - _f16Fm2Config__WEBPACK_IMPORTED_MODULE_3__.FM2_FCS.aoaSoftDeg), 0, 1);
        if (commandedG > 1) {
            commandedG = 1 + (commandedG - 1) * aoaLimiter;
        }
        const gError = commandedG - input.loadFactorG;
        const proportional = pitchGGain * gError
            + pitchRateDampGain * input.pitchRate
            - _f16Fm2Config__WEBPACK_IMPORTED_MODULE_3__.FM2_FCS.pitchAoaRateDampGain * this.aoaRateFilt;
        const limiterActive = aoaLimiter < 0.999;
        const raw = proportional + pitchIGain * (this.pitchIntegral + gError * dt);
        const outputSaturated = raw <= -1 || raw >= 1;
        if (!outputSaturated && !limiterActive) {
            this.pitchIntegral = (0,_utils_math__WEBPACK_IMPORTED_MODULE_0__.clamp)(this.pitchIntegral + gError * dt, -3, 3);
        }
        else if (limiterActive) {
            const leak = dt <= 0 ? 1 : 1 - Math.exp(-dt / Math.max(_f16Fm2Config__WEBPACK_IMPORTED_MODULE_3__.FM2_FCS.integralLeakTauS, 1e-3));
            this.pitchIntegral -= this.pitchIntegral * leak;
        }
        const elevator = proportional + pitchIGain * this.pitchIntegral;
        return (0,_utils_math__WEBPACK_IMPORTED_MODULE_0__.clamp)(elevator, -1, 1);
    }
    rollLaw(input) {
        if (input.landed) {
            return 0;
        }
        const mach = (0,_aeroUtils__WEBPACK_IMPORTED_MODULE_1__.computeMachNumber)(input.speed, input.altitudeM);
        const commandedRateRad = (0,_f16RollControl__WEBPACK_IMPORTED_MODULE_2__.computeF16CommandedRollRate)({
            stick: input.rollStick,
            dynamicPressure: input.dynamicPressure,
            qRef: input.qRef,
            mach,
            altitudeM: input.altitudeM,
            aoaRad: input.aoaRad,
            flapsExtended: input.flapsExtended,
            landed: input.landed,
            config: _f16RollControl__WEBPACK_IMPORTED_MODULE_2__.F16_ROLL_CAT1,
        });
        const rateError = input.rollRate - commandedRateRad;
        return (0,_utils_math__WEBPACK_IMPORTED_MODULE_0__.clamp)(_f16Fm2Config__WEBPACK_IMPORTED_MODULE_3__.FM2_FCS.rollRateGain * rateError, -1, 1);
    }
    yawLaw(input, aileronCmd, dt) {
        const tau = Math.max(_f16Fm2Config__WEBPACK_IMPORTED_MODULE_3__.FM2_FCS.yawDamperWashoutTauS, 1e-3);
        const a = dt <= 0 ? 1 : 1 - Math.exp(-dt / tau);
        this.yawRateLowPass += (input.yawRate - this.yawRateLowPass) * a;
        const yawRateHighPass = input.yawRate - this.yawRateLowPass;
        const damper = -_f16Fm2Config__WEBPACK_IMPORTED_MODULE_3__.FM2_FCS.yawDamperGain * yawRateHighPass;
        const ari = _f16Fm2Config__WEBPACK_IMPORTED_MODULE_3__.FM2_FCS.ariGain * aileronCmd;
        const pedal = input.yawPedal * _f16Fm2Config__WEBPACK_IMPORTED_MODULE_3__.FM2_FCS.maxRudderCmd;
        return (0,_utils_math__WEBPACK_IMPORTED_MODULE_0__.clamp)(pedal + damper + ari, -1, 1);
    }
}


/***/ },

/***/ "./src/script/physics/fm2/f16Fm2Config.ts"
/*!************************************************!*\
  !*** ./src/script/physics/fm2/f16Fm2Config.ts ***!
  \************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   FM2_AILERON: () => (/* binding */ FM2_AILERON),
/* harmony export */   FM2_BODY_CD0: () => (/* binding */ FM2_BODY_CD0),
/* harmony export */   FM2_FCS: () => (/* binding */ FM2_FCS),
/* harmony export */   FM2_FLAPS: () => (/* binding */ FM2_FLAPS),
/* harmony export */   FM2_GEAR_CD: () => (/* binding */ FM2_GEAR_CD),
/* harmony export */   FM2_GEOMETRY: () => (/* binding */ FM2_GEOMETRY),
/* harmony export */   FM2_INERTIA: () => (/* binding */ FM2_INERTIA),
/* harmony export */   FM2_SURFACES: () => (/* binding */ FM2_SURFACES),
/* harmony export */   FM2_WAVE_DRAG: () => (/* binding */ FM2_WAVE_DRAG)
/* harmony export */ });
/* harmony import */ var _f16Profile__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../f16Profile */ "./src/script/physics/f16Profile.ts");

const DEG = Math.PI / 180;
const FM2_GEOMETRY = {
    massKg: _f16Profile__WEBPACK_IMPORTED_MODULE_0__.F16_PROFILE.simMassKg,
    wingAreaM2: _f16Profile__WEBPACK_IMPORTED_MODULE_0__.F16_PROFILE.wingAreaM2,
    wingSpanM: _f16Profile__WEBPACK_IMPORTED_MODULE_0__.F16_PROFILE.wingSpanM,
    meanChordM: 3.45,
};
const FM2_INERTIA = {
    pitch: 55814 * 1.35582,
    yaw: 63100 * 1.35582,
    roll: 9496 * 1.35582,
};
const FM2_SURFACES = {
    fuselage: {
        name: 'fuselage',
        position: [0.0, 0.0, 0.0],
        up: [0, 1, 0],
        forward: [0, 0, 1],
        areaM2: 16.0,
        liftSlopePerRad: 2.4,
        stallAoaRad: 40 * DEG,
        cd0: 0.0,
        inducedK: 0.25,
        controlEffectiveness: 0,
    },
    wingLeft: {
        name: 'wingLeft',
        position: [-2.1, 0.0, -0.15],
        up: [0, 1, 0],
        forward: [0, 0, 1],
        areaM2: 8.6,
        liftSlopePerRad: 5.2,
        stallAoaRad: 24 * DEG,
        cd0: 0.0085,
        inducedK: 0.118,
        controlEffectiveness: 0,
    },
    wingRight: {
        name: 'wingRight',
        position: [2.1, 0.0, -0.15],
        up: [0, 1, 0],
        forward: [0, 0, 1],
        areaM2: 8.6,
        liftSlopePerRad: 5.2,
        stallAoaRad: 24 * DEG,
        cd0: 0.0085,
        inducedK: 0.118,
        controlEffectiveness: 0,
    },
    htailLeft: {
        name: 'htailLeft',
        position: [-1.5, 0.0, -4.6],
        up: [0, 1, 0],
        forward: [0, 0, 1],
        areaM2: 2.95,
        liftSlopePerRad: 3.4,
        stallAoaRad: 26 * DEG,
        cd0: 0.006,
        inducedK: 0.15,
        controlEffectiveness: 0.9,
    },
    htailRight: {
        name: 'htailRight',
        position: [1.5, 0.0, -4.6],
        up: [0, 1, 0],
        forward: [0, 0, 1],
        areaM2: 2.95,
        liftSlopePerRad: 3.4,
        stallAoaRad: 26 * DEG,
        cd0: 0.006,
        inducedK: 0.15,
        controlEffectiveness: 0.9,
    },
    vtail: {
        name: 'vtail',
        position: [0.0, 1.1, -4.3],
        up: [1, 0, 0],
        forward: [0, 0, 1],
        areaM2: 5.1,
        liftSlopePerRad: 2.9,
        stallAoaRad: 30 * DEG,
        cd0: 0.007,
        inducedK: 0.16,
        controlEffectiveness: 0.55,
    },
};
const FM2_AILERON = {
    maxDeflectionRad: 4.2 * DEG,
};
const FM2_FLAPS = {
    aoaBiasRad: 8 * DEG,
    stallReductionRad: 1 * DEG,
    extraCd: 0.020,
};
const FM2_GEAR_CD = 0.022;
const FM2_BODY_CD0 = 0.010;
const FM2_WAVE_DRAG = {
    machOnset: 0.95,
    scale: 0.55,
};
const FM2_FCS = {
    maxCommandG: _f16Profile__WEBPACK_IMPORTED_MODULE_0__.F16_PROFILE.maxLoadFactorG,
    minCommandG: -3.0,
    aoaLimitDeg: 26,
    aoaSoftDeg: 18,
    pitchGGain: 0.14,
    pitchIGain: 0.6,
    pitchRateDampGain: 1.1,
    pitchAoaRateDampGain: 4.5,
    aoaRateFilterTauS: 0.05,
    pitchStickExpo: 0.92,
    integralLeakTauS: 0.35,
    maxStabilatorRad: 25 * DEG,
    maxRollRateDegS: _f16Profile__WEBPACK_IMPORTED_MODULE_0__.F16_PROFILE.maxRollRateDegS,
    rollRateGain: 0.8,
    rollDamperGain: 0.06,
    taileronRollFraction: 0.12,
    maxRudderCmd: 1.0,
    yawDamperGain: 1.6,
    yawDamperWashoutTauS: 1.0,
    ariGain: 0.10,
    actuatorTauS: 0.05,
};


/***/ },

/***/ "./src/script/physics/fm2/rigidBody.ts"
/*!*********************************************!*\
  !*** ./src/script/physics/fm2/rigidBody.ts ***!
  \*********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   RigidBody: () => (/* binding */ RigidBody)
/* harmony export */ });
/* harmony import */ var three__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! three */ "./node_modules/three/build/three.module.js");

class RigidBody {
    constructor(mass, inertia) {
        this.orientation = new three__WEBPACK_IMPORTED_MODULE_0__.Quaternion();
        this.velocityWorld = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.angularVelocityBody = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this._iw = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this._gyro = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this._angAccel = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this._dq = new three__WEBPACK_IMPORTED_MODULE_0__.Quaternion();
        this._axis = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.mass = mass;
        this.inertia = inertia;
    }
    reset() {
        this.orientation.identity();
        this.velocityWorld.set(0, 0, 0);
        this.angularVelocityBody.set(0, 0, 0);
    }
    integrateAngular(momentBody, dt) {
        const w = this.angularVelocityBody;
        const I = this.inertia;
        this._iw.set(I.x * w.x, I.y * w.y, I.z * w.z);
        this._gyro.crossVectors(w, this._iw);
        this._angAccel.set((momentBody.x - this._gyro.x) / I.x, (momentBody.y - this._gyro.y) / I.y, (momentBody.z - this._gyro.z) / I.z);
        w.addScaledVector(this._angAccel, dt);
        const omega = w.length();
        if (omega > 1e-9) {
            this._axis.copy(w).multiplyScalar(1 / omega);
            this._dq.setFromAxisAngle(this._axis, omega * dt);
            this.orientation.multiply(this._dq);
            this.orientation.normalize();
        }
    }
    integrateLinear(forceWorld, dt, outPosition) {
        this.velocityWorld.addScaledVector(forceWorld, dt / this.mass);
        outPosition.addScaledVector(this.velocityWorld, dt);
    }
}


/***/ },

/***/ "./src/script/physics/model/arcadeFlightModel.ts"
/*!*******************************************************!*\
  !*** ./src/script/physics/model/arcadeFlightModel.ts ***!
  \*******************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ArcadeFlightModel: () => (/* binding */ ArcadeFlightModel)
/* harmony export */ });
/* harmony import */ var three__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! three */ "./node_modules/three/build/three.module.js");
/* harmony import */ var _defs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../defs */ "./src/script/defs.ts");
/* harmony import */ var _utils_math__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utils/math */ "./src/script/utils/math.ts");
/* harmony import */ var _flightModel__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./flightModel */ "./src/script/physics/model/flightModel.ts");




const TURNING_RATE = Math.PI * 1.5;
const STALL_RATE = Math.PI / 6;
const INDUCED_DRAG_FACTOR = 10.0;
const ROLL_DRAG_FACTOR = 0.05;
const GROUND_FRICTION_KINETIC = 0.15;
const GROUND_FRICTION_STATIC = 0.2;
const GROUND_BRAKE_KINETIC = 1.8;
const GROUND_BRAKE_STATIC = 1.17;
const THROTTLE_UP_RATE = 0.02;
const THROTTLE_DOWN_RATE = 0.07;
const YAW_RATE_LANDED = _defs__WEBPACK_IMPORTED_MODULE_1__.YAW_RATE * 2.0;
const MAX_THRUST = 20;
const DRY_MASS = 20000;
const WING_AREA = 78;
const GROUND_AIR_DENSITY = 1.225;
const GRAVITY = 9.8;
const CD = 0.15;
const CD_LANDING_GEAR_FACTOR = 0.75;
const CD_FLAPS_FACTOR = 0.4;
const LIFT_FLAPS_FACTOR = 1.2;
const ROLL_FLAPS_FACTOR = 0.6;
const LANDED_MAX_SPEED = 100;
const LANDING_MAX_VSPEED = 5;
const LANDING_MIN_PITCH = -5 * _utils_math__WEBPACK_IMPORTED_MODULE_2__.PI_OVER_180;
const LANDING_MAX_ROLL = 5 * _utils_math__WEBPACK_IMPORTED_MODULE_2__.PI_OVER_180;
class ArcadeFlightModel extends _flightModel__WEBPACK_IMPORTED_MODULE_3__.FlightModel {
    constructor() {
        super();
        this.stall = 0;
        this._v = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this._q0 = new three__WEBPACK_IMPORTED_MODULE_0__.Quaternion();
        this._q1 = new three__WEBPACK_IMPORTED_MODULE_0__.Quaternion();
        this._m = new three__WEBPACK_IMPORTED_MODULE_0__.Matrix4();
        this.drag = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.thrust = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.weight = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.friction = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.forces = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.forward = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.up = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.right = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.prjForward = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.velocityUnit = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.obj.up.copy(_utils_math__WEBPACK_IMPORTED_MODULE_2__.UP);
    }
    step(delta) {
        if (this.crashed)
            return;
        if (this.effectiveThrottle > this.throttle) {
            this.effectiveThrottle = Math.max(this.throttle, this.effectiveThrottle - THROTTLE_DOWN_RATE * delta);
        }
        else if (this.effectiveThrottle < this.throttle) {
            this.effectiveThrottle = Math.min(this.throttle, this.effectiveThrottle + THROTTLE_UP_RATE * delta);
        }
        this.forward = this.forward.copy(_utils_math__WEBPACK_IMPORTED_MODULE_2__.FORWARD).applyQuaternion(this.obj.quaternion);
        this.up = this.up.copy(_utils_math__WEBPACK_IMPORTED_MODULE_2__.UP).applyQuaternion(this.obj.quaternion);
        this.right = this.right.copy(_utils_math__WEBPACK_IMPORTED_MODULE_2__.RIGHT).applyQuaternion(this.obj.quaternion);
        this.prjForward = this.prjForward.copy(this.forward).setY(0);
        this.velocityUnit = this.velocityUnit.copy(this.velocity).normalize();
        const airDensity = GROUND_AIR_DENSITY * Math.exp(-this.obj.position.y / 8000);
        const thrustDensity = GROUND_AIR_DENSITY * Math.exp(-this.obj.position.y * 0.25 / 8000);
        const speed = this.velocity.length();
        const rightPrjVelocity = this._v.copy(this.velocityUnit).projectOnPlane(this.right);
        const aoaAngle = rightPrjVelocity.angleTo(this.forward);
        const aoaSign = rightPrjVelocity.cross(this.forward).dot(this.right) > 0 ? -1 : 1;
        const aoa = aoaSign * aoaAngle;
        if (!(0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.isZero)(this.roll) && !this.landed) {
            const rollFlapFactor = this.flapsExtended ? ROLL_FLAPS_FACTOR : 1.0;
            this.obj.rotateZ(this.roll * _defs__WEBPACK_IMPORTED_MODULE_1__.ROLL_RATE * rollFlapFactor * delta);
        }
        if (!(0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.isZero)(this.pitch)
            && !(this.landed && this.pitch < 0)
            && (this.stall < 0 ||
                (this.pitch < 0 && this.up.y > 0) ||
                (this.pitch > 0 && this.up.y < 0))) {
            this.obj.rotateX(-this.pitch * _defs__WEBPACK_IMPORTED_MODULE_1__.PITCH_RATE * delta);
        }
        if (!(0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.isZero)(this.yaw) && !(0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.isZero)(speed)) {
            this.obj.rotateY(-this.yaw * (this.landed ? YAW_RATE_LANDED : _defs__WEBPACK_IMPORTED_MODULE_1__.YAW_RATE) * delta);
        }
        if (-0.99 < this.forward.y && this.forward.y < 0.99) {
            const prjUp = this._v.copy(this.up).projectOnPlane(this.prjForward).setY(0);
            const sign = (this.prjForward.x * prjUp.z - this.prjForward.z * prjUp.x) > 0 ? -1 : 1;
            this.obj.rotateOnWorldAxis(_utils_math__WEBPACK_IMPORTED_MODULE_2__.UP, sign * prjUp.length() * prjUp.length() * this.prjForward.length() * 2.0 * _defs__WEBPACK_IMPORTED_MODULE_1__.YAW_RATE * delta);
        }
        if (this.stall >= 0 && !this.landed) {
            const y = this.forward.y;
            if (y > -0.8) {
                const groundRight = this._v.copy(this.forward).cross(this.prjForward).normalize();
                this.obj.rotateOnWorldAxis(groundRight, STALL_RATE * delta * (y > 0 ? 1 : -1));
            }
        }
        (0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.roundToZero)(this.thrust.copy(this.forward).multiplyScalar(thrustDensity *
            MAX_THRUST *
            this.effectiveThrottle *
            DRY_MASS));
        this.engineThrustN = this.thrust.length();
        const arcadeInducedDrag = this.forward.dot(this.velocityUnit);
        const liftInducedDrag = 1 - Math.cos(2.0 * aoa);
        const rollDrag = Math.abs(this.right.y);
        const cdMultiplier = 1.0 + (this.landingGearDeployed ? CD_LANDING_GEAR_FACTOR : 0.0) + (this.flapsExtended ? CD_FLAPS_FACTOR : 0.0);
        (0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.roundToZero)(this.drag
            .copy(this.velocityUnit)
            .negate()
            .multiplyScalar(Math.pow(0.5 * (CD * cdMultiplier + liftInducedDrag) * airDensity * speed * speed * WING_AREA, 1.0 + INDUCED_DRAG_FACTOR * (1.0 - arcadeInducedDrag) + ROLL_DRAG_FACTOR * rollDrag)));
        const aoaLift = 0.2 * (aoa < (Math.PI / 8.0) || aoa > (7 * Math.PI / 8.0) ? Math.sin(6.0 * aoa) : Math.sin(2.0 * aoa));
        const minLiftFactor = 2.0 * (0.75 * 0.75 + 0.75) * GROUND_AIR_DENSITY;
        const fwdY = this.forward.y;
        const rightY = Math.abs(this.right.y);
        const liftFactor = 2 * (speed / 256.0) * ((-0.5 * fwdY + 1.5) * (-0.5 * rightY + 1.5) + (-0.5 * rightY + 1.5)) * airDensity;
        const liftFactorMultiplier = this.flapsExtended ? LIFT_FLAPS_FACTOR : 1.0;
        this.stall = -(0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.clamp)(liftFactor * liftFactorMultiplier / minLiftFactor + aoaLift * (1.0 - rightY) - 1.0, -1.0, 1.0);
        const weightFwdFactor = -this.forward.y;
        const weightDownFactor = -(0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.easeOutCirc)(1.0 - (0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.clamp)((speed / 256) * (1.0 - Math.abs(this.forward.y) * (1.0 - Math.abs(this.right.y))), 0, 1));
        this.weight
            .copy(_utils_math__WEBPACK_IMPORTED_MODULE_2__.UP)
            .multiplyScalar(weightDownFactor)
            .addScaledVector(this.forward, weightFwdFactor)
            .multiplyScalar(DRY_MASS * GRAVITY);
        if (!(0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.isZero)(speed)) {
            if (this.landed) {
                this.velocity.copy(this.forward).multiplyScalar(speed);
            }
            else {
                const alpha = this.velocityUnit.angleTo(this.forward);
                const turningFactor = alpha * TURNING_RATE * delta;
                this._m.lookAt(_utils_math__WEBPACK_IMPORTED_MODULE_2__.ZERO, this.forward, this.up);
                this._q1 = new three__WEBPACK_IMPORTED_MODULE_0__.Quaternion().setFromRotationMatrix(this._m);
                this._m.lookAt(_utils_math__WEBPACK_IMPORTED_MODULE_2__.ZERO, this.velocityUnit, this.up);
                this._q0 = new three__WEBPACK_IMPORTED_MODULE_0__.Quaternion().setFromRotationMatrix(this._m);
                this._q0.rotateTowards(this._q1, turningFactor);
                this._q1.setFromRotationMatrix(this._m.invert());
                this._v.copy(this.velocityUnit)
                    .applyQuaternion(this._q1)
                    .applyQuaternion(this._q0);
                this.velocity.copy(this._v).multiplyScalar(speed);
            }
        }
        this.forces.set(0, 0, 0).add(this.thrust).add(this.drag).add(this.weight);
        const onGround = this.obj.position.y <= _defs__WEBPACK_IMPORTED_MODULE_1__.PLANE_DISTANCE_TO_GROUND + 0.05;
        if (this.landed || (this.wheelBrakesApplied && onGround)) {
            const weightMagnitude = DRY_MASS * GRAVITY;
            const prjForces = this._v.copy(this.forces).setY(0);
            const prjForcesMagnitude = prjForces.length();
            const maxStaticFriction = (this.wheelBrakesApplied ? GROUND_BRAKE_STATIC : GROUND_FRICTION_STATIC) * weightMagnitude;
            const kineticFriction = (this.wheelBrakesApplied ? GROUND_BRAKE_KINETIC : GROUND_FRICTION_KINETIC) * weightMagnitude;
            if (((0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.isZero)(speed) && prjForcesMagnitude < maxStaticFriction)) {
                this.friction.copy(prjForces).negate();
            }
            else {
                this.friction.copy(this.velocityUnit).setY(0).negate().normalize().multiplyScalar(kineticFriction);
            }
            (0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.roundToZero)(this.friction);
        }
        else {
            this.friction.set(0, 0, 0);
        }
        const accel = (0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.roundToZero)(this.forces.add(this.friction).divideScalar(DRY_MASS));
        this.velocity.addScaledVector(accel, delta);
        if (this.landed && this.velocity.y < 0) {
            this.velocity.setY(0);
        }
        this.obj.position.addScaledVector((0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.roundToZero)(this.velocity, this.effectiveThrottle > 0 ? 0.01 : 0.1), delta);
        if (this.obj.position.y > _defs__WEBPACK_IMPORTED_MODULE_1__.PLANE_DISTANCE_TO_GROUND) {
            this.landed = false;
        }
        if (this.obj.position.y < _defs__WEBPACK_IMPORTED_MODULE_1__.PLANE_DISTANCE_TO_GROUND) {
            this.obj.position.y = _defs__WEBPACK_IMPORTED_MODULE_1__.PLANE_DISTANCE_TO_GROUND;
            const forward = this._v.copy(_utils_math__WEBPACK_IMPORTED_MODULE_2__.FORWARD).applyQuaternion(this.obj.quaternion);
            const right = this.right.copy(_utils_math__WEBPACK_IMPORTED_MODULE_2__.RIGHT).applyQuaternion(this.obj.quaternion);
            const prjForward = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3().copy(forward).setY(0).normalize();
            const pitchAngle = forward.angleTo(prjForward) * Math.sign(forward.y);
            const prjRight = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3().copy(right).setY(0).normalize();
            const rollAngle = right.angleTo(prjRight) * Math.sign(right.y);
            if (this.landingGearDeployed === false ||
                speed > LANDED_MAX_SPEED ||
                this.velocity.y < -LANDING_MAX_VSPEED ||
                Math.abs(rollAngle) > LANDING_MAX_ROLL ||
                LANDING_MIN_PITCH > pitchAngle) {
                this.crashed = true;
            }
            else {
                if (forward.y < 0.0) {
                    const heading = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3().copy(forward).setY(0).normalize();
                    this.obj.quaternion.setFromUnitVectors(_utils_math__WEBPACK_IMPORTED_MODULE_2__.FORWARD, heading);
                }
                this.velocity.setY(0);
                this.stall = -1;
                this.landed = true;
            }
        }
    }
    getStallStatus() {
        return this.stall;
    }
}


/***/ },

/***/ "./src/script/physics/model/debugFlightModel.ts"
/*!******************************************************!*\
  !*** ./src/script/physics/model/debugFlightModel.ts ***!
  \******************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DebugFlightModel: () => (/* binding */ DebugFlightModel)
/* harmony export */ });
/* harmony import */ var three__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! three */ "./node_modules/three/build/three.module.js");
/* harmony import */ var _defs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../defs */ "./src/script/defs.ts");
/* harmony import */ var _utils_math__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utils/math */ "./src/script/utils/math.ts");
/* harmony import */ var _flightModel__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./flightModel */ "./src/script/physics/model/flightModel.ts");




class DebugFlightModel extends _flightModel__WEBPACK_IMPORTED_MODULE_3__.FlightModel {
    constructor() {
        super();
        this.speed = 0;
        this._v = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this._w = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.obj.up.copy(_utils_math__WEBPACK_IMPORTED_MODULE_2__.UP);
    }
    step(delta) {
        if (this.crashed)
            return;
        this.effectiveThrottle = this.throttle;
        this.engineThrustN = 0;
        if (!(0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.isZero)(this.roll)) {
            this.obj.rotateZ(this.roll * _defs__WEBPACK_IMPORTED_MODULE_1__.ROLL_RATE * delta);
        }
        if (!(0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.isZero)(this.pitch)) {
            this.obj.rotateX(-this.pitch * _defs__WEBPACK_IMPORTED_MODULE_1__.PITCH_RATE * delta);
        }
        if (!(0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.isZero)(this.yaw)) {
            this.obj.rotateY(-this.yaw * _defs__WEBPACK_IMPORTED_MODULE_1__.YAW_RATE * delta);
        }
        const forward = this.obj.getWorldDirection(this._v);
        if (-0.99 < forward.y && forward.y < 0.99) {
            const prjForward = forward.setY(0);
            const up = this._w.copy(_utils_math__WEBPACK_IMPORTED_MODULE_2__.UP).applyQuaternion(this.obj.quaternion);
            const prjUp = up.projectOnPlane(prjForward).setY(0);
            const sign = (prjForward.x * prjUp.z - prjForward.z * prjUp.x) > 0 ? -1 : 1;
            this.obj.rotateOnWorldAxis(_utils_math__WEBPACK_IMPORTED_MODULE_2__.UP, sign * prjUp.length() * prjUp.length() * prjForward.length() * 2.0 * _defs__WEBPACK_IMPORTED_MODULE_1__.YAW_RATE * delta);
        }
        this.speed = this.effectiveThrottle * _defs__WEBPACK_IMPORTED_MODULE_1__.MAX_SPEED;
        this.obj.translateZ(this.speed * delta);
        if (this.obj.position.y < _defs__WEBPACK_IMPORTED_MODULE_1__.PLANE_DISTANCE_TO_GROUND) {
            this.obj.position.y = _defs__WEBPACK_IMPORTED_MODULE_1__.PLANE_DISTANCE_TO_GROUND;
            const d = this.obj.getWorldDirection(this._v);
            if (d.y < 0.0) {
                d.setY(0).add(this.obj.position);
                this.obj.lookAt(d);
            }
        }
        if (this.obj.position.y > _defs__WEBPACK_IMPORTED_MODULE_1__.MAX_ALTITUDE) {
            this.obj.position.y = _defs__WEBPACK_IMPORTED_MODULE_1__.MAX_ALTITUDE;
        }
        this.velocity.copy(_utils_math__WEBPACK_IMPORTED_MODULE_2__.FORWARD).applyQuaternion(this.obj.quaternion).multiplyScalar(this.speed);
        this.landed = this.obj.position.y <= _defs__WEBPACK_IMPORTED_MODULE_1__.PLANE_DISTANCE_TO_GROUND;
    }
    getStallStatus() {
        return -1;
    }
}


/***/ },

/***/ "./src/script/physics/model/flightModel.ts"
/*!*************************************************!*\
  !*** ./src/script/physics/model/flightModel.ts ***!
  \*************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   FlightModel: () => (/* binding */ FlightModel),
/* harmony export */   SIM_FPS: () => (/* binding */ SIM_FPS)
/* harmony export */ });
/* harmony import */ var three__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! three */ "./node_modules/three/build/three.module.js");
/* harmony import */ var _utils_math__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/math */ "./src/script/utils/math.ts");


const SIM_FPS = 120;
const SIM_DELTA = 1.0 / SIM_FPS;
class FlightModel {
    constructor() {
        this.obj = new three__WEBPACK_IMPORTED_MODULE_0__.Object3D();
        this.velocity = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.crashed = false;
        this.landed = true;
        this.landingGearDeployed = true;
        this.flapsExtended = true;
        this.wheelBrakesApplied = false;
        this.pitch = 0;
        this.roll = 0;
        this.yaw = 0;
        this.throttle = 0;
        this.effectiveThrottle = 0;
        this.angleOfAttackRad = 0;
        this.loadFactorG = 1;
        this.engineThrustN = 0;
        this.prevPosition = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.prevQuaternion = new three__WEBPACK_IMPORTED_MODULE_0__.Quaternion();
        this.prevVelocity = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.deltaRemainder = 0;
    }
    reset() {
        this.obj.position.set(0, 0, 0);
        this.obj.quaternion.setFromAxisAngle(_utils_math__WEBPACK_IMPORTED_MODULE_1__.UP, 0);
        this.velocity.set(0, 0, 0);
        this.crashed = false;
        this.landed = true;
        this.landingGearDeployed = true;
        this.flapsExtended = true;
        this.wheelBrakesApplied = false;
        this.pitch = 0;
        this.roll = 0;
        this.yaw = 0;
        this.throttle = 0;
        this.effectiveThrottle = 0;
        this.angleOfAttackRad = 0;
        this.loadFactorG = 1;
        this.engineThrustN = 0;
        this.deltaRemainder = 0;
        this.syncPreviousState();
    }
    snapPhysicsState() {
        this.syncPreviousState();
    }
    update(delta) {
        this.deltaRemainder += delta;
        while (this.deltaRemainder >= SIM_DELTA) {
            this.savePreviousState();
            this.step(SIM_DELTA);
            this.deltaRemainder -= SIM_DELTA;
        }
    }
    getRenderInterpolationAlpha() {
        return 1 - this.deltaRemainder / SIM_DELTA;
    }
    getRenderPosition(target) {
        return target.lerpVectors(this.prevPosition, this.obj.position, this.getRenderInterpolationAlpha());
    }
    getRenderQuaternion(target) {
        return target.slerpQuaternions(this.prevQuaternion, this.obj.quaternion, this.getRenderInterpolationAlpha());
    }
    getRenderVelocity(target) {
        return target.lerpVectors(this.prevVelocity, this.velocity, this.getRenderInterpolationAlpha());
    }
    savePreviousState() {
        this.prevPosition.copy(this.obj.position);
        this.prevQuaternion.copy(this.obj.quaternion);
        this.prevVelocity.copy(this.velocity);
    }
    syncPreviousState() {
        this.prevPosition.copy(this.obj.position);
        this.prevQuaternion.copy(this.obj.quaternion);
        this.prevVelocity.copy(this.velocity);
    }
    setPitch(pitch) {
        this.pitch = pitch;
    }
    setRoll(roll) {
        this.roll = roll;
    }
    setYaw(yaw) {
        this.yaw = yaw;
    }
    setThrottle(throttle) {
        this.throttle = throttle;
    }
    syncEffectiveThrottle() {
        this.effectiveThrottle = this.throttle;
    }
    setLandingGearDeployed(deployed) {
        this.landingGearDeployed = deployed;
    }
    setFlapsExtended(extended) {
        this.flapsExtended = extended;
    }
    setWheelBrakes(applied) {
        this.wheelBrakesApplied = applied;
    }
    isWheelBrakesApplied() {
        return this.wheelBrakesApplied;
    }
    setLanded(isLanded) {
        this.landed = isLanded;
    }
    isLanded() {
        return this.landed;
    }
    setCrashed(isCrashed) {
        this.crashed = isCrashed;
    }
    isCrashed() {
        return this.crashed;
    }
    set position(p) {
        this.obj.position.copy(p);
    }
    get position() {
        return this.obj.position;
    }
    set quaternion(q) {
        this.obj.quaternion.copy(q);
    }
    get quaternion() {
        return this.obj.quaternion;
    }
    set velocityVector(v) {
        this.velocity.copy(v);
    }
    get velocityVector() {
        return this.velocity;
    }
    getEffectiveThrottle() {
        return this.effectiveThrottle;
    }
    getAngleOfAttack() {
        return this.angleOfAttackRad;
    }
    getLoadFactorG() {
        return this.loadFactorG;
    }
    getEngineThrustKn() {
        return this.engineThrustN / 1000;
    }
    useF16ThrottleDetents() {
        return false;
    }
    stepThrottleDetent(current, direction) {
        return Math.max(0, Math.min(1, current + direction * 0.01));
    }
    isInThrottleAbDetentBand(_lever) {
        return false;
    }
    adjustThrottleInput(current, step) {
        return Math.max(0, Math.min(1, current + step));
    }
    getThrottleHudText() {
        return `THR ${(100 * this.effectiveThrottle).toFixed(0)}`;
    }
    getThrottleAudioLevel() {
        return this.effectiveThrottle;
    }
    getEngineNozzleColor() {
        return '#0a0a0a';
    }
}


/***/ },

/***/ "./src/script/physics/model/fm2FlightModel.ts"
/*!****************************************************!*\
  !*** ./src/script/physics/model/fm2FlightModel.ts ***!
  \****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Fm2FlightModel: () => (/* binding */ Fm2FlightModel)
/* harmony export */ });
/* harmony import */ var three__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! three */ "./node_modules/three/build/three.module.js");
/* harmony import */ var _defs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../defs */ "./src/script/defs.ts");
/* harmony import */ var _utils_math__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utils/math */ "./src/script/utils/math.ts");
/* harmony import */ var _aeroUtils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../aeroUtils */ "./src/script/physics/aeroUtils.ts");
/* harmony import */ var _f16Engine__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../f16Engine */ "./src/script/physics/f16Engine.ts");
/* harmony import */ var _f16Profile__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../f16Profile */ "./src/script/physics/f16Profile.ts");
/* harmony import */ var _fm2_aeroSurface__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../fm2/aeroSurface */ "./src/script/physics/fm2/aeroSurface.ts");
/* harmony import */ var _fm2_f16Fcs__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../fm2/f16Fcs */ "./src/script/physics/fm2/f16Fcs.ts");
/* harmony import */ var _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../fm2/f16Fm2Config */ "./src/script/physics/fm2/f16Fm2Config.ts");
/* harmony import */ var _fm2_rigidBody__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../fm2/rigidBody */ "./src/script/physics/fm2/rigidBody.ts");
/* harmony import */ var _flightModel__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./flightModel */ "./src/script/physics/model/flightModel.ts");











const GRAVITY = 9.80665;
const DEG = Math.PI / 180;
const THROTTLE_UP_RATE = 0.10;
const THROTTLE_DOWN_RATE = 0.07;
const MAX_STABILATOR_AOA = _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_8__.FM2_FCS.maxStabilatorRad;
const MAX_AILERON_AOA = _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_8__.FM2_AILERON.maxDeflectionRad;
const MAX_RUDDER_AOA = 22 * DEG;
const Q_REF = 0.5 * (0,_aeroUtils__WEBPACK_IMPORTED_MODULE_3__.computeIsaAirDensity)(_f16Profile__WEBPACK_IMPORTED_MODULE_5__.F16_PROFILE.cruiseAltitudeM) * Math.pow(_f16Profile__WEBPACK_IMPORTED_MODULE_5__.F16_PROFILE.cruiseSpeedMps, 2);
const STALL_AOA = _f16Profile__WEBPACK_IMPORTED_MODULE_5__.F16_PROFILE.stallAoaDeg * DEG;
const MIN_FLYING_SPEED = _f16Profile__WEBPACK_IMPORTED_MODULE_5__.F16_PROFILE.minFlyingSpeedMps;
const GEAR_POINTS = [
    [0.0, -_defs__WEBPACK_IMPORTED_MODULE_1__.PLANE_DISTANCE_TO_GROUND, 2.6],
    [-1.2, -_defs__WEBPACK_IMPORTED_MODULE_1__.PLANE_DISTANCE_TO_GROUND, -0.6],
    [1.2, -_defs__WEBPACK_IMPORTED_MODULE_1__.PLANE_DISTANCE_TO_GROUND, -0.6],
];
const GEAR_STIFFNESS = 4.0e6;
const GEAR_DAMPING = 1.6e5;
const GEAR_ROLL_FRICTION = 0.04;
const GEAR_BRAKE_FRICTION = 0.55;
const GEAR_SIDE_FRICTION = 0.8;
const LANDING_MAX_SPEED = _f16Profile__WEBPACK_IMPORTED_MODULE_5__.F16_PROFILE.landingMaxSpeedMps;
const LANDING_MAX_VSPEED = _f16Profile__WEBPACK_IMPORTED_MODULE_5__.F16_PROFILE.landingMaxVerticalSpeedMps;
const LANDING_MIN_PITCH = _f16Profile__WEBPACK_IMPORTED_MODULE_5__.F16_PROFILE.landingMinPitchDeg * DEG;
const LANDING_MAX_ROLL = _f16Profile__WEBPACK_IMPORTED_MODULE_5__.F16_PROFILE.landingMaxRollDeg * DEG;
class Fm2FlightModel extends _flightModel__WEBPACK_IMPORTED_MODULE_10__.FlightModel {
    constructor() {
        super();
        this.rb = new _fm2_rigidBody__WEBPACK_IMPORTED_MODULE_9__.RigidBody(_fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_8__.FM2_GEOMETRY.massKg, {
            x: _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_8__.FM2_INERTIA.pitch,
            y: _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_8__.FM2_INERTIA.yaw,
            z: _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_8__.FM2_INERTIA.roll,
        });
        this.fcs = new _fm2_f16Fcs__WEBPACK_IMPORTED_MODULE_7__.F16Fcs();
        this.fuselage = new _fm2_aeroSurface__WEBPACK_IMPORTED_MODULE_6__.AeroSurface(_fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_8__.FM2_SURFACES.fuselage);
        this.wingLeft = new _fm2_aeroSurface__WEBPACK_IMPORTED_MODULE_6__.AeroSurface(_fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_8__.FM2_SURFACES.wingLeft);
        this.wingRight = new _fm2_aeroSurface__WEBPACK_IMPORTED_MODULE_6__.AeroSurface(_fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_8__.FM2_SURFACES.wingRight);
        this.htailLeft = new _fm2_aeroSurface__WEBPACK_IMPORTED_MODULE_6__.AeroSurface(_fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_8__.FM2_SURFACES.htailLeft);
        this.htailRight = new _fm2_aeroSurface__WEBPACK_IMPORTED_MODULE_6__.AeroSurface(_fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_8__.FM2_SURFACES.htailRight);
        this.vtail = new _fm2_aeroSurface__WEBPACK_IMPORTED_MODULE_6__.AeroSurface(_fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_8__.FM2_SURFACES.vtail);
        this.stall = -1;
        this.velBody = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.forceBody = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.momentBody = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.forceWorld = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.gearForceWorld = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.gearMomentBody = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.invOrient = new three__WEBPACK_IMPORTED_MODULE_0__.Quaternion();
        this._up = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this._fwd = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this._right = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this._v = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this._v2 = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this._gearWorld = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this._contactVel = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this._omegaWorld = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this._friction = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.obj.up.copy(_utils_math__WEBPACK_IMPORTED_MODULE_2__.UP);
    }
    reset() {
        super.reset();
        this.rb.reset();
        this.fcs.reset();
        this.stall = -1;
    }
    step(delta) {
        if (this.crashed)
            return;
        this.spoolThrottle(delta);
        this.rb.orientation.copy(this.obj.quaternion);
        this.rb.velocityWorld.copy(this.velocity);
        const altitude = this.obj.position.y;
        const airDensity = (0,_aeroUtils__WEBPACK_IMPORTED_MODULE_3__.computeAirDensity)(altitude);
        this.invOrient.copy(this.rb.orientation).invert();
        this.velBody.copy(this.rb.velocityWorld).applyQuaternion(this.invOrient);
        const speed = this.velBody.length();
        const aoa = speed > 1 ? Math.atan2(-this.velBody.y, this.velBody.z) : 0;
        this.angleOfAttackRad = aoa;
        const dynamicPressure = (0,_aeroUtils__WEBPACK_IMPORTED_MODULE_3__.computeDynamicPressure)(airDensity, speed);
        const mach = (0,_aeroUtils__WEBPACK_IMPORTED_MODULE_3__.computeMachNumber)(speed, altitude);
        const fcsOut = this.fcs.update({
            pitchStick: this.pitch,
            rollStick: this.roll,
            yawPedal: this.yaw,
            pitchRate: this.rb.angularVelocityBody.x,
            yawRate: this.rb.angularVelocityBody.y,
            rollRate: this.rb.angularVelocityBody.z,
            loadFactorG: this.loadFactorG,
            aoaRad: aoa,
            dynamicPressure,
            qRef: Q_REF,
            speed,
            altitudeM: altitude,
            flapsExtended: this.flapsExtended,
            landed: this.landed,
        }, delta);
        const controls = this.mapControls(fcsOut.elevator, fcsOut.aileron, fcsOut.rudder);
        this.forceBody.set(0, 0, 0);
        this.momentBody.set(0, 0, 0);
        const camber = this.flapsExtended ? _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_8__.FM2_FLAPS.aoaBiasRad : 0;
        const stallShift = this.flapsExtended ? _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_8__.FM2_FLAPS.stallReductionRad : 0;
        const wingExtraCd = this.flapsExtended ? _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_8__.FM2_FLAPS.extraCd : 0;
        this.accumulateSurface(this.fuselage, 0, 0, 0, 0, airDensity);
        this.accumulateSurface(this.wingLeft, controls.wingLeftAoa, camber, stallShift, wingExtraCd, airDensity);
        this.accumulateSurface(this.wingRight, controls.wingRightAoa, camber, stallShift, wingExtraCd, airDensity);
        this.accumulateSurface(this.htailLeft, controls.htailLeftAoa, 0, 0, 0, airDensity);
        this.accumulateSurface(this.htailRight, controls.htailRightAoa, 0, 0, 0, airDensity);
        this.accumulateSurface(this.vtail, controls.vtailAoa, 0, 0, 0, airDensity);
        this.addBodyDrag(dynamicPressure, speed, mach);
        const thrustN = (0,_f16Engine__WEBPACK_IMPORTED_MODULE_4__.computeF16EngineThrustN)(this.effectiveThrottle, altitude);
        this.engineThrustN = thrustN;
        this.forceBody.z += thrustN;
        this.computeGearForces();
        const gearBodyUpY = this._v.copy(this.gearForceWorld).applyQuaternion(this.invOrient).y;
        this.loadFactorG = (this.forceBody.y + gearBodyUpY) / (_fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_8__.FM2_GEOMETRY.massKg * GRAVITY);
        this.momentBody.add(this.gearMomentBody);
        this.rb.integrateAngular(this.momentBody, delta);
        this.forceWorld.copy(this.forceBody).applyQuaternion(this.rb.orientation);
        this.forceWorld.add(this.gearForceWorld);
        this.forceWorld.y -= _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_8__.FM2_GEOMETRY.massKg * GRAVITY;
        this.rb.integrateLinear(this.forceWorld, delta, this.obj.position);
        this.obj.quaternion.copy(this.rb.orientation);
        this.velocity.copy(this.rb.velocityWorld);
        this.updateStallState(speed, aoa, altitude);
        this.handleGroundState();
        this.wrapPosition();
    }
    spoolThrottle(delta) {
        if (this.effectiveThrottle > this.throttle) {
            this.effectiveThrottle = Math.max(this.throttle, this.effectiveThrottle - THROTTLE_DOWN_RATE * delta);
        }
        else if (this.effectiveThrottle < this.throttle) {
            this.effectiveThrottle = Math.min(this.throttle, this.effectiveThrottle + THROTTLE_UP_RATE * delta);
        }
    }
    mapControls(elevator, aileron, rudder) {
        const elevatorAoa = -elevator * MAX_STABILATOR_AOA;
        const taileronAoa = aileron * _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_8__.FM2_FCS.taileronRollFraction * MAX_STABILATOR_AOA;
        return {
            wingLeftAoa: aileron * MAX_AILERON_AOA,
            wingRightAoa: -aileron * MAX_AILERON_AOA,
            htailLeftAoa: elevatorAoa + taileronAoa,
            htailRightAoa: elevatorAoa - taileronAoa,
            vtailAoa: -rudder * MAX_RUDDER_AOA,
        };
    }
    accumulateSurface(surface, controlAoa, camber, stallShift, extraCd, airDensity) {
        surface.accumulate({
            velocityBody: this.velBody,
            angularVelocityBody: this.rb.angularVelocityBody,
            airDensity,
            controlDeltaAoaRad: controlAoa,
            camberBiasRad: camber,
            stallShiftRad: stallShift,
            extraCd,
        }, this.forceBody, this.momentBody);
    }
    addBodyDrag(dynamicPressure, speed, mach) {
        if (speed < 1e-3)
            return;
        let cd0 = _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_8__.FM2_BODY_CD0 + (this.landingGearDeployed ? _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_8__.FM2_GEAR_CD : 0);
        if (mach > _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_8__.FM2_WAVE_DRAG.machOnset) {
            const excess = (mach - _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_8__.FM2_WAVE_DRAG.machOnset) / _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_8__.FM2_WAVE_DRAG.machOnset;
            cd0 += _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_8__.FM2_WAVE_DRAG.scale * excess * excess;
        }
        const dragN = dynamicPressure * _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_8__.FM2_GEOMETRY.wingAreaM2 * cd0;
        this._v.copy(this.velBody).multiplyScalar(-dragN / speed);
        this.forceBody.add(this._v);
    }
    computeGearForces() {
        this.gearForceWorld.set(0, 0, 0);
        this.gearMomentBody.set(0, 0, 0);
        this._omegaWorld.copy(this.rb.angularVelocityBody).applyQuaternion(this.rb.orientation);
        for (const gp of GEAR_POINTS) {
            this._v.set(gp[0], gp[1], gp[2]).applyQuaternion(this.rb.orientation);
            this._gearWorld.copy(this._v).add(this.obj.position);
            const penetration = -this._gearWorld.y;
            if (penetration <= 0)
                continue;
            this._contactVel.crossVectors(this._omegaWorld, this._v).add(this.rb.velocityWorld);
            let normal = GEAR_STIFFNESS * penetration - GEAR_DAMPING * this._contactVel.y;
            if (normal < 0)
                normal = 0;
            const vhx = this._contactVel.x;
            const vhz = this._contactVel.z;
            const vh = Math.hypot(vhx, vhz);
            this._friction.set(0, normal, 0);
            if (vh > 1e-3) {
                const rolling = this.wheelBrakesApplied ? GEAR_BRAKE_FRICTION : GEAR_ROLL_FRICTION;
                const mu = Math.max(rolling, GEAR_SIDE_FRICTION * this.sideSlipFraction(vhx, vhz));
                const fMag = mu * normal;
                this._friction.x = -fMag * vhx / vh;
                this._friction.z = -fMag * vhz / vh;
            }
            this.gearForceWorld.add(this._friction);
            this._v2.crossVectors(this._v, this._friction).applyQuaternion(this.invOrient);
            this.gearMomentBody.add(this._v2);
        }
    }
    sideSlipFraction(vhx, vhz) {
        this._fwd.copy(_utils_math__WEBPACK_IMPORTED_MODULE_2__.FORWARD).applyQuaternion(this.rb.orientation);
        const fwx = this._fwd.x, fwz = this._fwd.z;
        const fwLen = Math.hypot(fwx, fwz) || 1;
        const vh = Math.hypot(vhx, vhz) || 1;
        const along = Math.abs((vhx * fwx + vhz * fwz) / (fwLen * vh));
        return (0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.clamp)(1 - along, 0, 1);
    }
    updateStallState(speed, aoa, altitude) {
        if (this.landed) {
            this.stall = -1;
            return;
        }
        const aoaStall = speed > 5 ? (0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.clamp)((Math.abs(aoa) - STALL_AOA * 0.85) / (STALL_AOA * 0.3), 0, 1) : 0;
        const speedStall = altitude > _defs__WEBPACK_IMPORTED_MODULE_1__.PLANE_DISTANCE_TO_GROUND + 5
            ? (0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.clamp)((MIN_FLYING_SPEED - speed) / MIN_FLYING_SPEED, 0, 1) : 0;
        const level = Math.max(aoaStall, speedStall);
        this.stall = level > 0 ? level : -1;
    }
    handleGroundState() {
        const onGround = this.obj.position.y <= _defs__WEBPACK_IMPORTED_MODULE_1__.PLANE_DISTANCE_TO_GROUND + 0.25;
        if (this.obj.position.y > _defs__WEBPACK_IMPORTED_MODULE_1__.PLANE_DISTANCE_TO_GROUND + 0.3) {
            this.landed = false;
        }
        const minY = _defs__WEBPACK_IMPORTED_MODULE_1__.PLANE_DISTANCE_TO_GROUND - 0.6;
        if (this.obj.position.y < minY) {
            this.obj.position.y = minY;
            if (this.velocity.y < 0)
                this.velocity.y = 0;
        }
        if (!onGround)
            return;
        this._fwd.copy(_utils_math__WEBPACK_IMPORTED_MODULE_2__.FORWARD).applyQuaternion(this.rb.orientation);
        this._right.copy(_utils_math__WEBPACK_IMPORTED_MODULE_2__.RIGHT).applyQuaternion(this.rb.orientation);
        const speed = this.velocity.length();
        const pitchAngle = Math.asin((0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.clamp)(this._fwd.y, -1, 1));
        const rollAngle = Math.asin((0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.clamp)(this._right.y, -1, 1));
        const hardContact = this.velocity.y < -LANDING_MAX_VSPEED;
        const badAttitude = Math.abs(rollAngle) > LANDING_MAX_ROLL || pitchAngle < LANDING_MIN_PITCH;
        if (!this.landed && (hardContact || speed > LANDING_MAX_SPEED)) {
            if (!this.landingGearDeployed || hardContact || badAttitude) {
                this.crashed = true;
                return;
            }
        }
        if (!this.landingGearDeployed && this.velocity.y < -1.0) {
            this.crashed = true;
            return;
        }
        if (speed < LANDING_MAX_SPEED && Math.abs(rollAngle) < LANDING_MAX_ROLL) {
            this.landed = true;
        }
    }
    wrapPosition() {
        const h = 2.5 * _defs__WEBPACK_IMPORTED_MODULE_1__.TERRAIN_SCALE * _defs__WEBPACK_IMPORTED_MODULE_1__.TERRAIN_MODEL_SIZE;
        if (this.obj.position.x > h)
            this.obj.position.x = -h;
        if (this.obj.position.x < -h)
            this.obj.position.x = h;
        if (this.obj.position.z > h)
            this.obj.position.z = -h;
        if (this.obj.position.z < -h)
            this.obj.position.z = h;
    }
    getStallStatus() { return this.stall; }
    getThrottleHudText() { return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_4__.formatF16ThrottleHud)(this.throttle); }
    useF16ThrottleDetents() { return true; }
    stepThrottleDetent(current, direction) { return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_4__.stepF16ThrottleDetent)(current, direction); }
    isInThrottleAbDetentBand(lever) { return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_4__.isF16AbDetentBand)(lever); }
    adjustThrottleInput(current, step) { return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_4__.adjustF16ThrottleInput)(current, step); }
    getThrottleZone() { return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_4__.getF16ThrottleZone)(this.effectiveThrottle); }
    getThrottleAudioLevel() { return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_4__.f16ThrottleAudioLevel)(this.effectiveThrottle); }
    getEngineNozzleColor() { return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_4__.getF16EngineNozzleColor)(this.effectiveThrottle); }
}


/***/ },

/***/ "./src/script/physics/model/realisticFlightModel.ts"
/*!**********************************************************!*\
  !*** ./src/script/physics/model/realisticFlightModel.ts ***!
  \**********************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   RealisticFlightModel: () => (/* binding */ RealisticFlightModel)
/* harmony export */ });
/* harmony import */ var three__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! three */ "./node_modules/three/build/three.module.js");
/* harmony import */ var _defs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../defs */ "./src/script/defs.ts");
/* harmony import */ var _utils_math__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utils/math */ "./src/script/utils/math.ts");
/* harmony import */ var _aeroUtils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../aeroUtils */ "./src/script/physics/aeroUtils.ts");
/* harmony import */ var _f16Engine__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../f16Engine */ "./src/script/physics/f16Engine.ts");
/* harmony import */ var _f16RollControl__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../f16RollControl */ "./src/script/physics/f16RollControl.ts");
/* harmony import */ var _f16FcsLimits__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../f16FcsLimits */ "./src/script/physics/f16FcsLimits.ts");
/* harmony import */ var _f16Profile__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../f16Profile */ "./src/script/physics/f16Profile.ts");
/* harmony import */ var _flightModel__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./flightModel */ "./src/script/physics/model/flightModel.ts");









const THROTTLE_UP_RATE = 0.10;
const THROTTLE_DOWN_RATE = 0.07;
const YAW_RATE_LANDED = _defs__WEBPACK_IMPORTED_MODULE_1__.YAW_RATE * 2.0;
const DRY_MASS = _f16Profile__WEBPACK_IMPORTED_MODULE_7__.F16_PROFILE.simMassKg;
const WING_AREA = _f16Profile__WEBPACK_IMPORTED_MODULE_7__.F16_PROFILE.wingAreaM2;
const CD0 = _f16Profile__WEBPACK_IMPORTED_MODULE_7__.F16_PROFILE.cd0;
const INDUCED_DRAG_K = _f16Profile__WEBPACK_IMPORTED_MODULE_7__.F16_PROFILE.inducedDragK;
const CL0 = _f16Profile__WEBPACK_IMPORTED_MODULE_7__.F16_PROFILE.cl0;
const CL_ALPHA = _f16Profile__WEBPACK_IMPORTED_MODULE_7__.F16_PROFILE.clAlphaPerRad;
const STALL_AOA = _f16Profile__WEBPACK_IMPORTED_MODULE_7__.F16_PROFILE.stallAoaDeg * Math.PI / 180;
const MAX_CL = 1.48;
const Q_REF = 0.5 * (0,_aeroUtils__WEBPACK_IMPORTED_MODULE_3__.computeIsaAirDensity)(_f16Profile__WEBPACK_IMPORTED_MODULE_7__.F16_PROFILE.cruiseAltitudeM) * _f16Profile__WEBPACK_IMPORTED_MODULE_7__.F16_PROFILE.cruiseSpeedMps * _f16Profile__WEBPACK_IMPORTED_MODULE_7__.F16_PROFILE.cruiseSpeedMps;
const MIN_CONTROL_Q = 0.12;
const MAX_CONTROL_Q = 2.2;
const MIN_FLYING_SPEED = _f16Profile__WEBPACK_IMPORTED_MODULE_7__.F16_PROFILE.minFlyingSpeedMps;
const SIDE_SLIP_DAMP_RATE = 4.5;
const CY_BETA = -0.6;
const YAW_CONTROL_Q_SCALE = 0.45;
const CD_LANDING_GEAR = 0.035;
const CD_FLAPS = 0.08;
const CL_FLAPS_FACTOR = 1.25;
const F16_ROLL_CONFIG = {
    maxRollRateDegS: _f16Profile__WEBPACK_IMPORTED_MODULE_7__.F16_PROFILE.maxRollRateDegS,
    actuatorTauS: _f16RollControl__WEBPACK_IMPORTED_MODULE_5__.F16_ROLL_CAT1.actuatorTauS,
};
const GROUND_FRICTION_KINETIC = 0.15;
const GROUND_FRICTION_STATIC = 0.2;
const GROUND_BRAKE_KINETIC = 1.8;
const GROUND_BRAKE_STATIC = 1.17;
const LANDED_MAX_SPEED = _f16Profile__WEBPACK_IMPORTED_MODULE_7__.F16_PROFILE.landingMaxSpeedMps;
const LANDING_MAX_VSPEED = _f16Profile__WEBPACK_IMPORTED_MODULE_7__.F16_PROFILE.landingMaxVerticalSpeedMps;
const LANDING_MIN_PITCH = _f16Profile__WEBPACK_IMPORTED_MODULE_7__.F16_PROFILE.landingMinPitchDeg * _utils_math__WEBPACK_IMPORTED_MODULE_2__.PI_OVER_180;
const LANDING_MAX_ROLL = _f16Profile__WEBPACK_IMPORTED_MODULE_7__.F16_PROFILE.landingMaxRollDeg * _utils_math__WEBPACK_IMPORTED_MODULE_2__.PI_OVER_180;
const ROTATION_SPEED = _f16Profile__WEBPACK_IMPORTED_MODULE_7__.F16_PROFILE.rotationSpeedMps;
function computeCl(aoa, flapsExtended) {
    const flapBoost = flapsExtended ? CL_FLAPS_FACTOR : 1.0;
    const stallAoa = flapsExtended ? STALL_AOA * 1.1 : STALL_AOA;
    const maxCl = MAX_CL * flapBoost;
    if (Math.abs(aoa) <= stallAoa) {
        return (0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.clamp)(CL0 + CL_ALPHA * aoa * flapBoost, -maxCl * 0.35, maxCl);
    }
    const peakCl = (CL0 + CL_ALPHA * stallAoa * Math.sign(aoa)) * flapBoost;
    const postStall = Math.cos((Math.abs(aoa) - stallAoa) * 4.0);
    return peakCl * Math.max(0, postStall);
}
function computeInducedDrag(cl) {
    return INDUCED_DRAG_K * cl * cl;
}
function computePitchSpeedAuthority(speed, landed) {
    let authority = (0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.clamp)(speed / MIN_FLYING_SPEED, 0, 1);
    if (landed && speed < ROTATION_SPEED) {
        authority *= (0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.clamp)(speed / ROTATION_SPEED, 0, 1);
    }
    return authority;
}
class RealisticFlightModel extends _flightModel__WEBPACK_IMPORTED_MODULE_8__.FlightModel {
    constructor() {
        super();
        this.stall = -1;
        this.bodyRollRateRad = 0;
        this.forward = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.up = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.right = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.velocityUnit = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.thrust = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.drag = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.lift = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.weight = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.friction = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.forces = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.sideForce = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.liftDirection = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this._v = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
        this.obj.up.copy(_utils_math__WEBPACK_IMPORTED_MODULE_2__.UP);
    }
    reset() {
        super.reset();
        this.stall = -1;
        this.bodyRollRateRad = 0;
    }
    step(delta) {
        if (this.crashed)
            return;
        if (this.effectiveThrottle > this.throttle) {
            this.effectiveThrottle = Math.max(this.throttle, this.effectiveThrottle - THROTTLE_DOWN_RATE * delta);
        }
        else if (this.effectiveThrottle < this.throttle) {
            this.effectiveThrottle = Math.min(this.throttle, this.effectiveThrottle + THROTTLE_UP_RATE * delta);
        }
        this.forward.copy(_utils_math__WEBPACK_IMPORTED_MODULE_2__.FORWARD).applyQuaternion(this.obj.quaternion);
        this.up.copy(_utils_math__WEBPACK_IMPORTED_MODULE_2__.UP).applyQuaternion(this.obj.quaternion);
        this.right.copy(_utils_math__WEBPACK_IMPORTED_MODULE_2__.RIGHT).applyQuaternion(this.obj.quaternion);
        const altitude = this.obj.position.y;
        const airDensity = (0,_aeroUtils__WEBPACK_IMPORTED_MODULE_3__.computeAirDensity)(altitude);
        const speed = this.velocity.length();
        const dynamicPressure = (0,_aeroUtils__WEBPACK_IMPORTED_MODULE_3__.computeDynamicPressure)(airDensity, speed);
        const controlScale = (0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.clamp)(dynamicPressure / Q_REF, MIN_CONTROL_Q, MAX_CONTROL_Q);
        let aoa = 0;
        if (speed > 1.0) {
            aoa = (0,_aeroUtils__WEBPACK_IMPORTED_MODULE_3__.computeAngleOfAttack)(this.forward, this.right, this.velocity, this._v);
        }
        this.angleOfAttackRad = aoa;
        const cl = computeCl(aoa, this.flapsExtended);
        const waveDrag = (0,_aeroUtils__WEBPACK_IMPORTED_MODULE_3__.computeDynamicPressureDragPenalty)(speed, altitude);
        const cd = CD0 * (1 + waveDrag)
            + computeInducedDrag(cl)
            + (this.landingGearDeployed ? CD_LANDING_GEAR : 0)
            + (this.flapsExtended ? CD_FLAPS : 0);
        this.updateStallState(speed, aoa, altitude);
        const pitchAuthority = this.stall >= 0 ? 0.35 : 1.0;
        const pitchSpeedAuthority = computePitchSpeedAuthority(speed, this.landed);
        const pitchGLimit = (0,_f16FcsLimits__WEBPACK_IMPORTED_MODULE_6__.computeF16PitchGLimit)(this.loadFactorG, this.pitch, _f16Profile__WEBPACK_IMPORTED_MODULE_7__.F16_PROFILE.maxLoadFactorG);
        const pitchAoaLimit = (0,_f16FcsLimits__WEBPACK_IMPORTED_MODULE_6__.computeF16PitchAoaAuthority)(aoa, this.pitch, STALL_AOA);
        const aoaRecovery = (0,_f16FcsLimits__WEBPACK_IMPORTED_MODULE_6__.computeF16AoaRecoveryRate)(aoa, STALL_AOA, speed);
        const yawControlScale = MIN_CONTROL_Q + (controlScale - MIN_CONTROL_Q) * YAW_CONTROL_Q_SCALE;
        const mach = (0,_aeroUtils__WEBPACK_IMPORTED_MODULE_3__.computeMachNumber)(speed, altitude);
        const commandedRollRate = (0,_f16RollControl__WEBPACK_IMPORTED_MODULE_5__.computeF16CommandedRollRate)({
            stick: this.roll,
            dynamicPressure,
            qRef: Q_REF,
            mach,
            altitudeM: altitude,
            aoaRad: aoa,
            flapsExtended: this.flapsExtended,
            landed: this.landed,
            config: F16_ROLL_CONFIG,
        });
        this.bodyRollRateRad = (0,_f16RollControl__WEBPACK_IMPORTED_MODULE_5__.stepF16BodyRollRate)(this.bodyRollRateRad, commandedRollRate, delta, F16_ROLL_CONFIG);
        if (!this.landed && Math.abs(this.bodyRollRateRad) > 1e-6) {
            this.obj.rotateZ(this.bodyRollRateRad * delta);
        }
        else if (this.landed) {
            this.bodyRollRateRad = 0;
        }
        if (!(0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.isZero)(this.pitch)
            && !(this.landed && this.pitch < 0)
            && (this.stall < 0 || (this.pitch < 0 && this.up.y > 0) || (this.pitch > 0 && this.up.y < 0))) {
            this.obj.rotateX(-this.pitch * _defs__WEBPACK_IMPORTED_MODULE_1__.PITCH_RATE * controlScale * pitchAuthority * pitchSpeedAuthority * pitchGLimit * pitchAoaLimit * delta);
        }
        if (aoaRecovery !== 0) {
            this.obj.rotateX(Math.sign(aoa) * aoaRecovery * delta);
        }
        if (this.stall > 0 && !this.landed && this.pitch <= 0) {
            const stallNoseDown = this.stall * 0.6;
            const forward = this.forward;
            const right = this.right;
            const groundNormal = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3(0, -1, 0);
            const pitchDir = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3().crossVectors(forward, groundNormal);
            const dot = pitchDir.dot(right);
            this.obj.rotateX(Math.sign(dot) * stallNoseDown * delta);
        }
        if (this.landed && this.pitch <= 0) {
            const forward = this.forward;
            const prjForward = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3().copy(forward).setY(0).normalize();
            const pitchAngle = forward.angleTo(prjForward) * Math.sign(forward.y);
            if (pitchAngle > 0.001) {
                const speedFactor = (0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.clamp)(1 - speed / ROTATION_SPEED, 0, 1);
                const fallRate = speedFactor * 0.4;
                const rotation = Math.min(pitchAngle, fallRate * delta);
                this.obj.rotateX(rotation);
            }
        }
        const maxRollRate = (0,_f16RollControl__WEBPACK_IMPORTED_MODULE_5__.maxRollRateRad)(F16_ROLL_CONFIG);
        const rollYawCoupling = !this.landed && !(0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.isZero)(speed)
            ? (0,_f16RollControl__WEBPACK_IMPORTED_MODULE_5__.computeF16RollYawCoupling)(this.bodyRollRateRad, aoa, maxRollRate)
            : 0;
        if (!(0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.isZero)(speed) && (!(0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.isZero)(this.yaw) || Math.abs(rollYawCoupling) > 1e-6)) {
            const effectiveYaw = (0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.clamp)(this.yaw + rollYawCoupling, -1, 1);
            this.obj.rotateY(-effectiveYaw * (this.landed ? YAW_RATE_LANDED : _defs__WEBPACK_IMPORTED_MODULE_1__.YAW_RATE) * yawControlScale * delta);
        }
        const thrustN = (0,_f16Engine__WEBPACK_IMPORTED_MODULE_4__.computeF16EngineThrustN)(this.effectiveThrottle, altitude);
        (0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.roundToZero)(this.thrust.copy(this.forward).multiplyScalar(thrustN));
        this.engineThrustN = thrustN;
        if (speed > 1e-3) {
            this.velocityUnit.copy(this.velocity).multiplyScalar(1 / speed);
            (0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.roundToZero)(this.drag.copy(this.velocityUnit).negate().multiplyScalar(dynamicPressure * WING_AREA * cd));
            if (speed > 0.5) {
                this.liftDirection.crossVectors(this.right, this.velocityUnit);
                if (this.liftDirection.lengthSq() < 1e-6) {
                    this.liftDirection.copy(this.up);
                }
                else {
                    this.liftDirection.normalize();
                    if (this.liftDirection.dot(this.up) < 0) {
                        this.liftDirection.negate();
                    }
                }
                (0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.roundToZero)(this.lift.copy(this.liftDirection).multiplyScalar(dynamicPressure * WING_AREA * cl));
            }
            else {
                this.lift.set(0, 0, 0);
            }
        }
        else {
            this.drag.set(0, 0, 0);
            this.lift.set(0, 0, 0);
        }
        (0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.roundToZero)(this.weight.set(0, -DRY_MASS * 9.80665, 0));
        if (!this.landed && speed > 5) {
            const lateralSpeed = this.velocity.dot(this.right);
            const forwardSpeed = this.velocity.dot(this.forward);
            const beta = Math.atan2(lateralSpeed, Math.max(Math.abs(forwardSpeed), 5));
            const dampForce = -lateralSpeed * SIDE_SLIP_DAMP_RATE * DRY_MASS;
            const betaForce = CY_BETA * beta * dynamicPressure * WING_AREA;
            (0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.roundToZero)(this.sideForce.copy(this.right).multiplyScalar(dampForce + betaForce));
        }
        else {
            this.sideForce.set(0, 0, 0);
        }
        this.forces.set(0, 0, 0).add(this.thrust).add(this.drag).add(this.lift).add(this.sideForce).add(this.weight);
        const onGround = this.obj.position.y <= _defs__WEBPACK_IMPORTED_MODULE_1__.PLANE_DISTANCE_TO_GROUND + 0.05;
        if (this.landed || (this.wheelBrakesApplied && onGround)) {
            const weightMagnitude = DRY_MASS * 9.80665;
            const prjForces = this._v.copy(this.forces).setY(0);
            const prjForcesMagnitude = prjForces.length();
            const maxStaticFriction = (this.wheelBrakesApplied ? GROUND_BRAKE_STATIC : GROUND_FRICTION_STATIC) * weightMagnitude;
            const kineticFriction = (this.wheelBrakesApplied ? GROUND_BRAKE_KINETIC : GROUND_FRICTION_KINETIC) * weightMagnitude;
            if ((0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.isZero)(speed) && prjForcesMagnitude < maxStaticFriction) {
                this.friction.copy(prjForces).negate();
            }
            else if (speed > 0.5) {
                this.friction.copy(this.velocityUnit).setY(0).negate().normalize().multiplyScalar(kineticFriction);
            }
            else {
                this.friction.set(0, 0, 0);
            }
            (0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.roundToZero)(this.friction);
        }
        else {
            this.friction.set(0, 0, 0);
        }
        this.forces.add(this.friction);
        if (this.landed && this.forces.y < 0) {
            this.forces.setY(0);
        }
        const accel = (0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.roundToZero)(this.forces.divideScalar(DRY_MASS));
        this.up.copy(_utils_math__WEBPACK_IMPORTED_MODULE_2__.UP).applyQuaternion(this.obj.quaternion);
        (0,_f16FcsLimits__WEBPACK_IMPORTED_MODULE_6__.clampLoadFactorAcceleration)(accel, this.up, _f16Profile__WEBPACK_IMPORTED_MODULE_7__.F16_PROFILE.maxLoadFactorG);
        this.loadFactorG = (0,_aeroUtils__WEBPACK_IMPORTED_MODULE_3__.computeLoadFactorG)(accel, this.up);
        this.velocity.addScaledVector(accel, delta);
        if (this.landed && this.velocity.y < 0) {
            this.velocity.setY(0);
        }
        this.obj.position.addScaledVector(this.landed ? (0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.roundToZero)(this.velocity, 0.01) : this.velocity, delta);
        if (this.obj.position.y > _defs__WEBPACK_IMPORTED_MODULE_1__.PLANE_DISTANCE_TO_GROUND) {
            this.landed = false;
        }
        this.handleGroundContact(speed);
        this.wrapPosition();
    }
    getStallStatus() {
        return this.stall;
    }
    getThrottleHudText() {
        return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_4__.formatF16ThrottleHud)(this.throttle);
    }
    useF16ThrottleDetents() {
        return true;
    }
    stepThrottleDetent(current, direction) {
        return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_4__.stepF16ThrottleDetent)(current, direction);
    }
    isInThrottleAbDetentBand(lever) {
        return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_4__.isF16AbDetentBand)(lever);
    }
    adjustThrottleInput(current, step) {
        return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_4__.adjustF16ThrottleInput)(current, step);
    }
    getThrottleZone() {
        return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_4__.getF16ThrottleZone)(this.effectiveThrottle);
    }
    getThrottleAudioLevel() {
        return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_4__.f16ThrottleAudioLevel)(this.effectiveThrottle);
    }
    getEngineNozzleColor() {
        return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_4__.getF16EngineNozzleColor)(this.effectiveThrottle);
    }
    updateStallState(speed, aoa, altitude) {
        if (this.landed || speed < 5) {
            this.stall = -1;
            return;
        }
        const aoaStall = (0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.clamp)((Math.abs(aoa) - STALL_AOA * 0.75) / (STALL_AOA * 0.35), 0, 1);
        const speedStall = (0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.clamp)((MIN_FLYING_SPEED - speed) / MIN_FLYING_SPEED, 0, 1);
        const stallLevel = Math.max(aoaStall, altitude > _defs__WEBPACK_IMPORTED_MODULE_1__.PLANE_DISTANCE_TO_GROUND + 5 ? speedStall : 0);
        this.stall = stallLevel > 0 ? stallLevel : -1;
    }
    handleGroundContact(speed) {
        if (this.obj.position.y >= _defs__WEBPACK_IMPORTED_MODULE_1__.PLANE_DISTANCE_TO_GROUND) {
            return;
        }
        this.obj.position.y = _defs__WEBPACK_IMPORTED_MODULE_1__.PLANE_DISTANCE_TO_GROUND;
        const forward = this.forward.copy(_utils_math__WEBPACK_IMPORTED_MODULE_2__.FORWARD).applyQuaternion(this.obj.quaternion);
        const up = this.up.copy(_utils_math__WEBPACK_IMPORTED_MODULE_2__.UP).applyQuaternion(this.obj.quaternion);
        const right = this.right.copy(_utils_math__WEBPACK_IMPORTED_MODULE_2__.RIGHT).applyQuaternion(this.obj.quaternion);
        const prjForward = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3().copy(forward).setY(0).normalize();
        const pitchAngle = forward.angleTo(prjForward) * Math.sign(forward.y);
        const prjRight = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3().copy(right).setY(0).normalize();
        const rollAngle = right.angleTo(prjRight) * Math.sign(right.y);
        if (this.landingGearDeployed === false
            || speed > LANDED_MAX_SPEED
            || this.velocity.y < -LANDING_MAX_VSPEED
            || Math.abs(rollAngle) > LANDING_MAX_ROLL
            || LANDING_MIN_PITCH > pitchAngle) {
            this.crashed = true;
            return;
        }
        if (forward.y < 0) {
            const heading = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3().copy(forward).setY(0).normalize();
            this.obj.quaternion.setFromUnitVectors(_utils_math__WEBPACK_IMPORTED_MODULE_2__.FORWARD, heading);
        }
        this.velocity.setY(0);
        this.stall = -1;
        this.landed = true;
    }
    wrapPosition() {
        const terrainHalfSize = 2.5 * _defs__WEBPACK_IMPORTED_MODULE_1__.TERRAIN_SCALE * _defs__WEBPACK_IMPORTED_MODULE_1__.TERRAIN_MODEL_SIZE;
        if (this.obj.position.x > terrainHalfSize)
            this.obj.position.x = -terrainHalfSize;
        if (this.obj.position.x < -terrainHalfSize)
            this.obj.position.x = terrainHalfSize;
        if (this.obj.position.z > terrainHalfSize)
            this.obj.position.z = -terrainHalfSize;
        if (this.obj.position.z < -terrainHalfSize)
            this.obj.position.z = terrainHalfSize;
    }
}


/***/ },

/***/ "./src/script/physics/worker/flightWorker.ts"
/*!***************************************************!*\
  !*** ./src/script/physics/worker/flightWorker.ts ***!
  \***************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _model_realisticFlightModel__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../model/realisticFlightModel */ "./src/script/physics/model/realisticFlightModel.ts");
/* harmony import */ var _model_arcadeFlightModel__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../model/arcadeFlightModel */ "./src/script/physics/model/arcadeFlightModel.ts");
/* harmony import */ var _model_debugFlightModel__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../model/debugFlightModel */ "./src/script/physics/model/debugFlightModel.ts");
/* harmony import */ var _model_fm2FlightModel__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../model/fm2FlightModel */ "./src/script/physics/model/fm2FlightModel.ts");




let flightModel;
self.onmessage = (event) => {
    try {
        handleMessage(event.data);
    }
    catch (err) {
        const e = err;
        self.postMessage({ type: 'error', message: `${e === null || e === void 0 ? void 0 : e.name}: ${e === null || e === void 0 ? void 0 : e.message}`, stack: e === null || e === void 0 ? void 0 : e.stack });
    }
};
function handleMessage(data) {
    switch (data.type) {
        case 'init':
            if (data.modelType === 'realistic') {
                flightModel = new _model_realisticFlightModel__WEBPACK_IMPORTED_MODULE_0__.RealisticFlightModel();
            }
            else if (data.modelType === 'fm2') {
                flightModel = new _model_fm2FlightModel__WEBPACK_IMPORTED_MODULE_3__.Fm2FlightModel();
            }
            else if (data.modelType === 'arcade') {
                flightModel = new _model_arcadeFlightModel__WEBPACK_IMPORTED_MODULE_1__.ArcadeFlightModel();
            }
            else if (data.modelType === 'debug') {
                flightModel = new _model_debugFlightModel__WEBPACK_IMPORTED_MODULE_2__.DebugFlightModel();
            }
            break;
        case 'update':
            if (!flightModel)
                return;
            flightModel.setPitch(data.inputs.pitch);
            flightModel.setRoll(data.inputs.roll);
            flightModel.setYaw(data.inputs.yaw);
            flightModel.setThrottle(data.inputs.throttle);
            flightModel.setLandingGearDeployed(data.inputs.landingGearDeployed);
            flightModel.setFlapsExtended(data.inputs.flapsExtended);
            flightModel.setWheelBrakes(data.inputs.wheelBrakesApplied);
            flightModel.update(data.delta);
            sendState();
            break;
        case 'reset':
            if (!flightModel)
                return;
            flightModel.reset();
            flightModel.position.set(data.position[0], data.position[1], data.position[2]);
            flightModel.quaternion.set(data.quaternion[0], data.quaternion[1], data.quaternion[2], data.quaternion[3]);
            flightModel.velocityVector.set(data.velocity[0], data.velocity[1], data.velocity[2]);
            flightModel.setLanded(data.landed);
            flightModel.setThrottle(data.throttle);
            sendState();
            break;
        case 'syncEffectiveThrottle':
            if (!flightModel)
                return;
            flightModel.setThrottle(data.throttle);
            flightModel.syncEffectiveThrottle();
            sendState();
            break;
        case 'setPosition':
            if (!flightModel)
                return;
            flightModel.position.set(data.position[0], data.position[1], data.position[2]);
            sendState();
            break;
        case 'setQuaternion':
            if (!flightModel)
                return;
            flightModel.quaternion.set(data.quaternion[0], data.quaternion[1], data.quaternion[2], data.quaternion[3]);
            sendState();
            break;
        case 'setVelocity':
            if (!flightModel)
                return;
            flightModel.velocityVector.set(data.velocity[0], data.velocity[1], data.velocity[2]);
            sendState();
            break;
        case 'snapPhysicsState':
            if (!flightModel)
                return;
            flightModel.snapPhysicsState();
            sendState();
            break;
    }
}
;
function sendState() {
    if (!flightModel)
        return;
    const state = {
        position: flightModel.position.toArray(),
        quaternion: flightModel.quaternion.toArray(),
        velocity: flightModel.velocityVector.toArray(),
        prevPosition: flightModel.prevPosition.toArray(),
        prevQuaternion: flightModel.prevQuaternion.toArray(),
        prevVelocity: flightModel.prevVelocity.toArray(),
        crashed: flightModel.isCrashed(),
        landed: flightModel.isLanded(),
        angleOfAttackRad: flightModel.getAngleOfAttack(),
        loadFactorG: flightModel.getLoadFactorG(),
        engineThrustN: flightModel.getEngineThrustKn() * 1000,
        effectiveThrottle: flightModel.getEffectiveThrottle(),
        deltaRemainder: flightModel.deltaRemainder,
        stall: flightModel.getStallStatus()
    };
    self.postMessage({ type: 'state', state });
}


/***/ },

/***/ "./src/script/utils/math.ts"
/*!**********************************!*\
  !*** ./src/script/utils/math.ts ***!
  \**********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   FORWARD: () => (/* binding */ FORWARD),
/* harmony export */   N180_OVER_PI: () => (/* binding */ N180_OVER_PI),
/* harmony export */   PI_OVER_180: () => (/* binding */ PI_OVER_180),
/* harmony export */   RIGHT: () => (/* binding */ RIGHT),
/* harmony export */   UP: () => (/* binding */ UP),
/* harmony export */   ZERO: () => (/* binding */ ZERO),
/* harmony export */   calculatePitchRoll: () => (/* binding */ calculatePitchRoll),
/* harmony export */   clamp: () => (/* binding */ clamp),
/* harmony export */   easeOutCirc: () => (/* binding */ easeOutCirc),
/* harmony export */   easeOutQuad: () => (/* binding */ easeOutQuad),
/* harmony export */   easeOutQuint: () => (/* binding */ easeOutQuint),
/* harmony export */   equals: () => (/* binding */ equals),
/* harmony export */   isZero: () => (/* binding */ isZero),
/* harmony export */   lerp: () => (/* binding */ lerp),
/* harmony export */   roundToZero: () => (/* binding */ roundToZero),
/* harmony export */   toDegrees: () => (/* binding */ toDegrees),
/* harmony export */   toRadians: () => (/* binding */ toRadians),
/* harmony export */   vectorHeading: () => (/* binding */ vectorHeading)
/* harmony export */ });
/* harmony import */ var three__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! three */ "./node_modules/three/build/three.module.js");

const _v = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
const _w = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3();
const _q = new three__WEBPACK_IMPORTED_MODULE_0__.Quaternion();
const EPSILON = 0.0001;
const ZERO = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3(0, 0, 0);
const UP = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3(0, 1, 0);
const FORWARD = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3(0, 0, 1);
const RIGHT = new three__WEBPACK_IMPORTED_MODULE_0__.Vector3(1, 0, 0);
function isZero(n) {
    return -EPSILON <= n && n <= EPSILON;
}
function equals(a, b, epsilon = EPSILON) {
    return a - epsilon <= b && b <= a + epsilon;
}
function clamp(n, min, max) {
    return Math.max(min, Math.min(n, max));
}
function lerp(t, n0, n1) {
    return n0 + t * (n1 - n0);
}
function vectorHeading(v) {
    let bearing = Math.round(Math.atan2(v.x, -v.z) / (2 * Math.PI) * 360);
    if (bearing < 0) {
        bearing = 360 + bearing;
    }
    return bearing;
}
function roundToZero(v, epsilon = EPSILON) {
    if (equals(v.x, 0.0, epsilon)) {
        v.x = 0;
    }
    if (equals(v.y, 0.0, epsilon)) {
        v.y = 0;
    }
    if (equals(v.z, 0.0, epsilon)) {
        v.z = 0;
    }
    return v;
}
function easeOutCirc(x) {
    return Math.sqrt(1 - (x - 1) * (x - 1));
}
function easeOutQuad(x) {
    return 1 - (1 - x) * (1 - x);
}
function easeOutQuint(x) {
    return 1 - Math.pow(1 - x, 5);
}
const PI_OVER_180 = Math.PI / 180.0;
const N180_OVER_PI = 180.0 / Math.PI;
function toRadians(degrees) {
    return PI_OVER_180 * degrees;
}
function toDegrees(radians) {
    return N180_OVER_PI * radians;
}
function calculatePitchRoll(actor) {
    const forward = actor.getWorldDirection(_v);
    const prjForward = _w.copy(forward)
        .setY(0)
        .normalize();
    const pitch = forward.angleTo(prjForward) * Math.sign(forward.y);
    _q.setFromUnitVectors(forward, prjForward);
    const right = _v.copy(RIGHT)
        .applyQuaternion(actor.quaternion)
        .applyQuaternion(_q);
    _q.setFromUnitVectors(prjForward, FORWARD);
    right.applyQuaternion(_q);
    let roll = Math.acos(right.x) * Math.sign(right.y);
    roll = isNaN(roll) ? 0.0 : roll;
    return [pitch, roll];
}


/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	const __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		const cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		const module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			const e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/******/ 	// the startup function
/******/ 	__webpack_require__.x = () => {
/******/ 		// Load entry module and return exports
/******/ 		// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 		let __webpack_exports__ = __webpack_require__.O(undefined, ["vendors-node_modules_three_build_three_module_js"], () => (__webpack_require__("./src/script/physics/worker/flightWorker.ts")))
/******/ 		__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 		return __webpack_exports__;
/******/ 	};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		const deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			let notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				let [chunkIds, fn, priority] = deferred[i];
/******/ 				let fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					const r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter/value functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			if(Array.isArray(definition)) {
/******/ 				var i = 0;
/******/ 				while(i < definition.length) {
/******/ 					var key = definition[i++];
/******/ 					var binding = definition[i++];
/******/ 					if(!__webpack_require__.o(exports, key)) {
/******/ 						if(binding === 0) {
/******/ 							Object.defineProperty(exports, key, { enumerable: true, value: definition[i++] });
/******/ 						} else {
/******/ 							Object.defineProperty(exports, key, { enumerable: true, get: binding });
/******/ 						}
/******/ 					} else if(binding === 0) { i++; }
/******/ 				}
/******/ 			} else {
/******/ 				for(var key in definition) {
/******/ 					if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 						Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 					}
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = (chunkId) => {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce((promises, key) => {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks and chunks that the entrypoint depends on
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + chunkId + ".bundle.js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		let scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		const document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript?.tagName.toUpperCase() === 'SCRIPT')
/******/ 				scriptUrl = document.currentScript.src;
/******/ 			if (!scriptUrl) {
/******/ 				const scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) {
/******/ 					let i = scripts.length - 1;
/******/ 					while (i > -1 && (!scriptUrl || !/^http(s?):/.test(scriptUrl))) scriptUrl = scripts[i--].src;
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/^blob:/, "").replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/importScripts chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded chunks
/******/ 		// "1" means "already loaded"
/******/ 		var installedChunks = {
/******/ 			"src_script_physics_worker_flightWorker_ts": 1
/******/ 		};
/******/ 		
/******/ 		// importScripts chunk loading
/******/ 		var installChunk = (data) => {
/******/ 			let [chunkIds, moreModules, runtime] = data;
/******/ 			for(var moduleId in moreModules) {
/******/ 				if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 					__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 				}
/******/ 			}
/******/ 			if(runtime) runtime(__webpack_require__);
/******/ 			while(chunkIds.length)
/******/ 				installedChunks[chunkIds.pop()] = 1;
/******/ 			parentChunkLoadingFunction(data);
/******/ 		};
/******/ 		__webpack_require__.f.i = (chunkId, promises) => {
/******/ 			// "1" is the signal for "already loaded"
/******/ 			if(!installedChunks[chunkId]) {
/******/ 				if(true) { // all chunks have JS
/******/ 					importScripts(__webpack_require__.p + __webpack_require__.u(chunkId));
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunkretroflightsim"] = self["webpackChunkretroflightsim"] || [];
/******/ 		var parentChunkLoadingFunction = chunkLoadingGlobal.push.bind(chunkLoadingGlobal);
/******/ 		chunkLoadingGlobal.push = installChunk;
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/startup chunk dependencies */
/******/ 	(() => {
/******/ 		const next = __webpack_require__.x;
/******/ 		__webpack_require__.x = () => {
/******/ 			return __webpack_require__.e("vendors-node_modules_three_build_three_module_js").then(next);
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// run startup
/******/ 	var __webpack_exports__ = __webpack_require__.x();
/******/ 	
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3JjX3NjcmlwdF9waHlzaWNzX3dvcmtlcl9mbGlnaHRXb3JrZXJfdHMuYnVuZGxlLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDTyxNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFFbkIsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDO0FBQ3JCLE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQztBQUNyQixNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUM7QUFDckIsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDO0FBRXJCLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQztBQUNsQixNQUFNLEtBQUssR0FBRyxHQUFHLENBQUM7QUFDbEIsTUFBTSxVQUFVLEdBQUcsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUM3QixNQUFNLFVBQVUsR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBRTdCLE1BQU0sYUFBYSxHQUFHLEtBQUssQ0FBQztBQUM1QixNQUFNLGtCQUFrQixHQUFHLEtBQUssQ0FBQztBQUVqQyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUMvQixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUM5QixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztBQUM5QixNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUM7QUFDeEIsTUFBTSxhQUFhLEdBQUcsRUFBRSxDQUFDO0FBQ3pCLE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQztBQUN2QixNQUFNLHdCQUF3QixHQUFHLEdBQUcsQ0FBQztBQUNyQyxNQUFNLHNCQUFzQixHQUFHLEdBQUcsQ0FBQztBQUNuQyxNQUFNLHNCQUFzQixHQUFHLEdBQUcsQ0FBQztBQUNuQyxNQUFNLFlBQVksR0FBRyxLQUFLLENBQUM7QUFFM0IsTUFBTSxXQUFXLEdBQUcsRUFBRSxDQUFDO0FB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LElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUVqRSxNQUFNLENBQUMsR0FBRyxHQUFHLEdBQUcsS0FBSyxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUM7UUFDM0MsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDOUIsTUFBTSxJQUFJLEdBQUcsQ0FBQyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFDM0IsTUFBTSxJQUFJLEdBQUcsQ0FBQyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFHM0IsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztRQUMzRCxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO1FBQzNELE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7UUFDM0QsUUFBUSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDakIsUUFBUSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDakIsUUFBUSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7UUFHakIsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUN2RSxTQUFTLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUNqQyxTQUFTLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxF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LGdEQUFnRCxhQUFhO1dBQzdELEU7Ozs7O1dDTkE7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0Esa0M7Ozs7O1dDbEJBOztXQUVBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7O1dBRUE7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQSxhQUFhO1dBQ2I7V0FDQTtXQUNBO1dBQ0E7O1dBRUE7V0FDQTtXQUNBOztXQUVBOztXQUVBLGtCOzs7OztXQ3BDQTtXQUNBO1dBQ0E7V0FDQSxFOzs7OztVRUhBO1VBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvZGVmcy50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy9hZXJvVXRpbHMudHMiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vLi9zcmMvc2NyaXB0L3BoeXNpY3MvZjE2RW5naW5lLnRzIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltLy4vc3JjL3NjcmlwdC9waHlzaWNzL2YxNkZjc0xpbWl0cy50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy9mMTZQYXBlckRhdGEudHMiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vLi9zcmMvc2NyaXB0L3BoeXNpY3MvZjE2UHJvZmlsZS50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy9mMTZSb2xsQ29udHJvbC50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy9mbTIvYWVyb1N1cmZhY2UudHMiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vLi9zcmMvc2NyaXB0L3BoeXNpY3MvZm0yL2YxNkZjcy50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy9mbTIvZjE2Rm0yQ29uZmlnLnRzIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltLy4vc3JjL3NjcmlwdC9waHlzaWNzL2ZtMi9yaWdpZEJvZHkudHMiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vLi9zcmMvc2NyaXB0L3BoeXNpY3MvbW9kZWwvYXJjYWRlRmxpZ2h0TW9kZWwudHMiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vLi9zcmMvc2NyaXB0L3BoeXNpY3MvbW9kZWwvZGVidWdGbGlnaHRNb2RlbC50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy9tb2RlbC9mbGlnaHRNb2RlbC50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy9tb2RlbC9mbTJGbGlnaHRNb2RlbC50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy9tb2RlbC9yZWFsaXN0aWNGbGlnaHRNb2RlbC50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy93b3JrZXIvZmxpZ2h0V29ya2VyLnRzIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltLy4vc3JjL3NjcmlwdC91dGlscy9tYXRoLnRzIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svcnVudGltZS9jaHVuayBsb2FkZWQiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svcnVudGltZS9lbnN1cmUgY2h1bmsiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vd2VicGFjay9ydW50aW1lL2dldCBqYXZhc2NyaXB0IGNodW5rIGZpbGVuYW1lIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svcnVudGltZS9nbG9iYWwiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svcnVudGltZS9wdWJsaWNQYXRoIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svcnVudGltZS9pbXBvcnRTY3JpcHRzIGNodW5rIGxvYWRpbmciLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vd2VicGFjay9ydW50aW1lL3N0YXJ0dXAgY2h1bmsgZGVwZW5kZW5jaWVzIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svYmVmb3JlLXN0YXJ0dXAiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vd2VicGFjay9zdGFydHVwIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svYWZ0ZXItc3RhcnR1cCJdLCJzb3VyY2VzQ29udGVudCI6WyJcbmV4cG9ydCBjb25zdCBGUFNfQ0FQID0gMTU7IC8vIEZQU1xuXG5leHBvcnQgY29uc3QgTE9fSF9SRVMgPSAzMjA7XG5leHBvcnQgY29uc3QgTE9fVl9SRVMgPSAyMDA7XG5leHBvcnQgY29uc3QgSElfSF9SRVMgPSA2NDA7XG5leHBvcnQgY29uc3QgSElfVl9SRVMgPSA0MDA7XG5cbmV4cG9ydCBjb25zdCBIX1JFUyA9IDMyMDtcbmV4cG9ydCBjb25zdCBWX1JFUyA9IDIwMDtcbmV4cG9ydCBjb25zdCBIX1JFU19IQUxGID0gSF9SRVMgLyAyO1xuZXhwb3J0IGNvbnN0IFZfUkVTX0hBTEYgPSBWX1JFUyAvIDI7XG5cbmV4cG9ydCBjb25zdCBURVJSQUlOX1NDQUxFID0gMjAwLjA7XG5leHBvcnQgY29uc3QgVEVSUkFJTl9NT0RFTF9TSVpFID0gMTAwLjA7XG5cbmV4cG9ydCBjb25zdCBQSVRDSF9SQVRFID0gTWF0aC5QSSAvIDU7IC8vIFJhZGlhbnMvc1xuZXhwb3J0IGNvbnN0IFJPTExfUkFURSA9IE1hdGguUEkgLyAyOyAvLyBSYWRpYW5zL3MgKHdhcyDPgC8zLCArNTAlKVxuZXhwb3J0IGNvbnN0IFlBV19SQVRFID0gTWF0aC5QSSAvIDEyOyAvLyBSYWRpYW5zL3NcbmV4cG9ydCBjb25zdCBNQVhfU1BFRUQgPSAyNTAuMDsgLy8gV29ybGQgdW5pdHMvc1xuZXhwb3J0IGNvbnN0IFRIUk9UVExFX1JBVEUgPSAzMzsgLy8gUGVyY2VudGFnZSBvZiBtYXhpbXVtL3MgWzAsMTAwXVxuZXhwb3J0IGNvbnN0IFNUSUNLX1JBVEUgPSAxLjU7IC8vIEZ1bGwgc3RpY2sgZGVmbGVjdGlvbiBwZXIgc2Vjb25kXG5leHBvcnQgY29uc3QgUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5EID0gMi4wOyAvLyBXb3JsZCB1bml0c1xuZXhwb3J0IGNvbnN0IFBMQU5FX0NPQ0tQSVRfT0ZGU0VUX1kgPSAxLjA7IC8vIFdvcmxkIHVuaXRzXG5leHBvcnQgY29uc3QgUExBTkVfQ09DS1BJVF9PRkZTRVRfWiA9IDguMDsgLy8gV29ybGQgdW5pdHNcbmV4cG9ydCBjb25zdCBNQVhfQUxUSVRVREUgPSAxNDAwMDsgLy8gV29ybGQgdW5pdHNcblxuZXhwb3J0IGNvbnN0IENPQ0tQSVRfRk9WID0gNTA7XG5leHBvcnQgY29uc3QgQ09DS1BJVF9GQVIgPSA0MDAwMDtcblxuZXhwb3J0IGNvbnN0IEdST1VORF9TTU9LRV9QQVJUSUNMRV9DT1VOVCA9IDEwMDtcblxuZXhwb3J0IGNvbnN0IEFJUkJBU0VfUlVOV0FZID0geyB4OiAxNTAwLCB5OiAwLCB6OiAtODAwIH07XG5leHBvcnQgY29uc3QgUlVOV0FZX0hBTEZfTEVOR1RIX00gPSAxNTAwO1xuZXhwb3J0IGNvbnN0IEFQUFJPQUNIX0FMVElUVURFX00gPSA1MDA7XG5leHBvcnQgY29uc3QgQVBQUk9BQ0hfU1BFRURfS01IID0gMzAwO1xuZXhwb3J0IGNvbnN0IEFQUFJPQUNIX1NQRUVEX01QUyA9IEFQUFJPQUNIX1NQRUVEX0tNSCAvIDMuNjtcbmV4cG9ydCBjb25zdCBBUFBST0FDSF9GSU5BTF9ESVNUQU5DRV9NID0gNTAwMDtcbiIsImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcblxuY29uc3QgR1JBVklUWSA9IDkuODtcblxuZXhwb3J0IGNvbnN0IEdST1VORF9BSVJfREVOU0lUWSA9IDEuMjI1OyAvLyBrZy9twrMgYXQgc2VhIGxldmVsLCBJU0FcbmNvbnN0IFZORV9NQUNIID0gMC45NTsgLy8gdHJhbnNvbmljIGRyYWcgcmlzZSBvbnNldCAoc2ltIG9ubHk7IHBhcGVyIGvigoIgPSAwKVxuXG5jb25zdCBJU0FfU0VBX0xFVkVMX1BSRVNTVVJFID0gMTAxMzI1OyAvLyBQYVxuY29uc3QgSVNBX1NFQV9MRVZFTF9URU1QID0gMjg4LjE1OyAvLyBLXG5jb25zdCBJU0FfTEFQU0VfUkFURSA9IDAuMDA2NTsgLy8gSy9tXG5jb25zdCBJU0FfVFJPUE9QQVVTRV9BTFQgPSAxMTAwMDsgLy8gbVxuY29uc3QgSVNBX1RST1BPUEFVU0VfUFJFU1NVUkUgPSAyMjYzMi4xOyAvLyBQYVxuY29uc3QgSVNBX1RST1BPUEFVU0VfVEVNUCA9IDIxNi42NTsgLy8gS1xuY29uc3QgR1JBVklUWV9JU0EgPSA5LjgwNjY1OyAvLyBtL3PCslxuY29uc3QgR0FTX0NPTlNUQU5UID0gMjg3LjA1MzsgLy8gSi8oa2fCt0spXG5cbi8qKiBJU0EgZGVuc2l0eSAoa2cvbcKzKSDigJQgQW5kZXJzb24tc3R5bGUgcGVyZm9ybWFuY2UgYW5hbHlzaXMgYXRtb3NwaGVyZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlSXNhQWlyRGVuc2l0eShhbHRpdHVkZU1ldGVyczogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBjb25zdCBoID0gTWF0aC5tYXgoMCwgYWx0aXR1ZGVNZXRlcnMpO1xuICAgIGxldCB0ZW1wZXJhdHVyZTogbnVtYmVyO1xuICAgIGxldCBwcmVzc3VyZTogbnVtYmVyO1xuXG4gICAgaWYgKGggPD0gSVNBX1RST1BPUEFVU0VfQUxUKSB7XG4gICAgICAgIHRlbXBlcmF0dXJlID0gSVNBX1NFQV9MRVZFTF9URU1QIC0gSVNBX0xBUFNFX1JBVEUgKiBoO1xuICAgICAgICBwcmVzc3VyZSA9IElTQV9TRUFfTEVWRUxfUFJFU1NVUkUgKiBNYXRoLnBvdyhcbiAgICAgICAgICAgIHRlbXBlcmF0dXJlIC8gSVNBX1NFQV9MRVZFTF9URU1QLFxuICAgICAgICAgICAgR1JBVklUWV9JU0EgLyAoR0FTX0NPTlNUQU5UICogSVNBX0xBUFNFX1JBVEUpLFxuICAgICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRlbXBlcmF0dXJlID0gSVNBX1RST1BPUEFVU0VfVEVNUDtcbiAgICAgICAgcHJlc3N1cmUgPSBJU0FfVFJPUE9QQVVTRV9QUkVTU1VSRSAqIE1hdGguZXhwKFxuICAgICAgICAgICAgLUdSQVZJVFlfSVNBICogKGggLSBJU0FfVFJPUE9QQVVTRV9BTFQpIC8gKEdBU19DT05TVEFOVCAqIElTQV9UUk9QT1BBVVNFX1RFTVApLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiBwcmVzc3VyZSAvIChHQVNfQ09OU1RBTlQgKiB0ZW1wZXJhdHVyZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlQWlyRGVuc2l0eShhbHRpdHVkZU1ldGVyczogbnVtYmVyKTogbnVtYmVyIHtcbiAgICByZXR1cm4gY29tcHV0ZUlzYUFpckRlbnNpdHkoYWx0aXR1ZGVNZXRlcnMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUR5bmFtaWNQcmVzc3VyZShhaXJEZW5zaXR5OiBudW1iZXIsIHNwZWVkOiBudW1iZXIpOiBudW1iZXIge1xuICAgIHJldHVybiAwLjUgKiBhaXJEZW5zaXR5ICogc3BlZWQgKiBzcGVlZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVUaHJ1c3REZW5zaXR5RmFjdG9yKGFpckRlbnNpdHk6IG51bWJlciwgYWx0aXR1ZGVNZXRlcnMgPSAwKTogbnVtYmVyIHtcbiAgICBjb25zdCBzaWdtYSA9IGFpckRlbnNpdHkgLyBHUk9VTkRfQUlSX0RFTlNJVFk7XG4gICAgY29uc3QgbGFwc2UgPSBNYXRoLnBvdyhzaWdtYSwgMC43KTtcbiAgICBjb25zdCBvcHRpbXVtQWx0aXR1ZGUgPSAxMTAwMDsgLy8gbSwgfkZMMzYwIHRocnVzdC1saW1pdGVkIG9wdGltdW1cbiAgICBjb25zdCBhbHRQZW5hbHR5ID0gYWx0aXR1ZGVNZXRlcnMgPD0gb3B0aW11bUFsdGl0dWRlXG4gICAgICAgID8gMVxuICAgICAgICA6IE1hdGgubWF4KDAuMzUsIDEgLSAoYWx0aXR1ZGVNZXRlcnMgLSBvcHRpbXVtQWx0aXR1ZGUpIC8gOTAwMCk7XG4gICAgcmV0dXJuIGxhcHNlICogYWx0UGVuYWx0eTtcbn1cblxuY29uc3QgR0FNTUEgPSAxLjQ7XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlU3BlZWRPZlNvdW5kKGFsdGl0dWRlTWV0ZXJzOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IHRlbXBlcmF0dXJlID0gTWF0aC5tYXgoSVNBX1RST1BPUEFVU0VfVEVNUCwgSVNBX1NFQV9MRVZFTF9URU1QIC0gSVNBX0xBUFNFX1JBVEUgKiBhbHRpdHVkZU1ldGVycyk7XG4gICAgcmV0dXJuIE1hdGguc3FydChHQU1NQSAqIEdBU19DT05TVEFOVCAqIHRlbXBlcmF0dXJlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVNYWNoTnVtYmVyKHNwZWVkTXBzOiBudW1iZXIsIGFsdGl0dWRlTWV0ZXJzOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IHNwZWVkT2ZTb3VuZCA9IGNvbXB1dGVTcGVlZE9mU291bmQoYWx0aXR1ZGVNZXRlcnMpO1xuICAgIGlmIChzcGVlZE9mU291bmQgPD0gMCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgcmV0dXJuIHNwZWVkTXBzIC8gc3BlZWRPZlNvdW5kO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUR5bmFtaWNQcmVzc3VyZURyYWdQZW5hbHR5KHNwZWVkTXBzOiBudW1iZXIsIGFsdGl0dWRlTWV0ZXJzOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IHNwZWVkT2ZTb3VuZCA9IGNvbXB1dGVTcGVlZE9mU291bmQoYWx0aXR1ZGVNZXRlcnMpO1xuICAgIGlmIChzcGVlZE9mU291bmQgPD0gMCB8fCBzcGVlZE1wcyA8PSAwKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBjb25zdCBtYWNoID0gc3BlZWRNcHMgLyBzcGVlZE9mU291bmQ7XG4gICAgaWYgKG1hY2ggPD0gVk5FX01BQ0gpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGNvbnN0IGV4Y2VzcyA9IChtYWNoIC0gVk5FX01BQ0gpIC8gVk5FX01BQ0g7XG4gICAgcmV0dXJuIDAuNTUgKiBleGNlc3MgKiBleGNlc3M7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlTWF4RXF1aWxpYnJpdW1TcGVlZChcbiAgICBhaXJEZW5zaXR5OiBudW1iZXIsXG4gICAgdGhydXN0Rm9yY2U6IG51bWJlcixcbiAgICB3aW5nQXJlYTogbnVtYmVyLFxuICAgIGRyYWdDb2VmZmljaWVudDogbnVtYmVyLFxuKTogbnVtYmVyIHtcbiAgICBpZiAoYWlyRGVuc2l0eSA8PSAwIHx8IGRyYWdDb2VmZmljaWVudCA8PSAwIHx8IHRocnVzdEZvcmNlIDw9IDApIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIHJldHVybiBNYXRoLnNxcnQoMiAqIHRocnVzdEZvcmNlIC8gKGFpckRlbnNpdHkgKiB3aW5nQXJlYSAqIGRyYWdDb2VmZmljaWVudCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUFuZ2xlT2ZBdHRhY2soXG4gICAgZm9yd2FyZDogVEhSRUUuVmVjdG9yMyxcbiAgICByaWdodDogVEhSRUUuVmVjdG9yMyxcbiAgICB2ZWxvY2l0eTogVEhSRUUuVmVjdG9yMyxcbiAgICBzY3JhdGNoOiBUSFJFRS5WZWN0b3IzLFxuKTogbnVtYmVyIHtcbiAgICBjb25zdCBzcGVlZCA9IHZlbG9jaXR5Lmxlbmd0aCgpO1xuICAgIGlmIChzcGVlZCA8PSAxLjApIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgc2NyYXRjaC5jb3B5KHZlbG9jaXR5KS5tdWx0aXBseVNjYWxhcigxIC8gc3BlZWQpLnByb2plY3RPblBsYW5lKHJpZ2h0KTtcbiAgICBpZiAoc2NyYXRjaC5sZW5ndGhTcSgpIDw9IDFlLTYpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgc2NyYXRjaC5ub3JtYWxpemUoKTtcbiAgICBjb25zdCBhb2FBbmdsZSA9IHNjcmF0Y2guYW5nbGVUbyhmb3J3YXJkKTtcbiAgICBjb25zdCBhb2FTaWduID0gc2NyYXRjaC5jcm9zcyhmb3J3YXJkKS5kb3QocmlnaHQpID4gMCA/IC0xIDogMTtcbiAgICByZXR1cm4gYW9hU2lnbiAqIGFvYUFuZ2xlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUxvYWRGYWN0b3JHKGFjY2VsOiBUSFJFRS5WZWN0b3IzLCB1cDogVEhSRUUuVmVjdG9yMywgZ3Jhdml0eSA9IEdSQVZJVFkpOiBudW1iZXIge1xuICAgIHJldHVybiAoYWNjZWwueCAqIHVwLnggKyAoYWNjZWwueSArIGdyYXZpdHkpICogdXAueSArIGFjY2VsLnogKiB1cC56KSAvIGdyYXZpdHk7XG59XG4iLCIvKipcbiAqIEYxMDAtUFctMjI5IHRocm90dGxlIHF1YWRyYW50IGFuZCB0aHJ1c3Qgc2NoZWR1bGUgZm9yIEYtMTZDLlxuICogTGV2ZXIgWzAsIDFdIG1hcHMgdG8gMOKAkzEwMCU6IDA9TUlMIDIwJSwgOTg9TUlMIDEwMCUsIDk5PUFCMSwgMTAwPUFCMi5cbiAqL1xuaW1wb3J0IHsgY29tcHV0ZUFpckRlbnNpdHksIGNvbXB1dGVUaHJ1c3REZW5zaXR5RmFjdG9yIH0gZnJvbSAnLi9hZXJvVXRpbHMnO1xuaW1wb3J0IHsgRjE2X1BST0ZJTEUgfSBmcm9tICcuL2YxNlByb2ZpbGUnO1xuXG4vKiogRjEwMC1QVy0yMjkgc2VhLWxldmVsIHN0YXRpYyB0aHJ1c3QgKGtOKSwgVVNBRiAvIEphbmUncy4gKi9cbmV4cG9ydCBjb25zdCBGMTZfRU5HSU5FID0ge1xuICAgIC8qKiBGbGlnaHQgaWRsZSAoTUlMIDIwJSBvbiBxdWFkcmFudCkg4oCUIDAuNSBrTiBzZWEtbGV2ZWwgc3RhdGljLiAqL1xuICAgIGlkbGVUaHJ1c3RLbjogMC41LFxuICAgIG1pbFRocnVzdEtuOiA3Ni4zLFxuICAgIC8qKiBGaXJzdCBhZnRlcmJ1cm5lciBkZXRlbnQgKG1pbiBBQiAvIHpvbmUgNSkuICovXG4gICAgYWJNaW5UaHJ1c3RLbjogMTA0LjAsXG4gICAgYWJNYXhUaHJ1c3RLbjogRjE2X1BST0ZJTEUuYWJUaHJ1c3RLbixcbiAgICAvKiogTGV2ZXIgWzAsIDFdIGF0IDEwMCUgTUlMICg5OCBvbiBxdWFkcmFudCkuICovXG4gICAgbWlsTGV2ZXJFbmQ6IEYxNl9QUk9GSUxFLm1pbExldmVyRW5kLFxuICAgIC8qKiBMZXZlciBbMCwgMV0gYXQgQUIxIGRldGVudCAoOTkgb24gcXVhZHJhbnQpLiAqL1xuICAgIGFiTWluTGV2ZXJFbmQ6IEYxNl9QUk9GSUxFLmFiTWluTGV2ZXJFbmQsXG59IGFzIGNvbnN0O1xuXG5leHBvcnQgdHlwZSBGMTZUaHJvdHRsZVpvbmUgPSAnbWlsJyB8ICdhYi1taW4nIHwgJ2FiLW1heCc7XG5cbi8qKiBBZnRlcmJ1cm5lciBub3p6bGUgY29sb3JzIOKAlCBzb2xpZCwgbm8gYW5pbWF0aW9uLiAqL1xuZXhwb3J0IGNvbnN0IEYxNl9FTkdJTkVfTk9aWkxFX0NPTE9SUyA9IHtcbiAgICBtaWw6ICcjMGEwYTBhJyxcbiAgICBhYk1pbjogJyNmZjg4MDAnLFxuICAgIGFiTWF4OiAnI2ZmZmYwMCcsXG59IGFzIGNvbnN0O1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RjE2RW5naW5lTm96emxlQ29sb3IobGV2ZXI6IG51bWJlcik6IHN0cmluZyB7XG4gICAgY29uc3Qgem9uZSA9IGdldEYxNlRocm90dGxlWm9uZShsZXZlcik7XG4gICAgaWYgKHpvbmUgPT09ICdhYi1taW4nKSB7XG4gICAgICAgIHJldHVybiBGMTZfRU5HSU5FX05PWlpMRV9DT0xPUlMuYWJNaW47XG4gICAgfVxuICAgIGlmICh6b25lID09PSAnYWItbWF4Jykge1xuICAgICAgICByZXR1cm4gRjE2X0VOR0lORV9OT1paTEVfQ09MT1JTLmFiTWF4O1xuICAgIH1cbiAgICByZXR1cm4gRjE2X0VOR0lORV9OT1paTEVfQ09MT1JTLm1pbDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBGMTZBZnRlcmJ1cm5lckNvbmVEaXRoZXIge1xuICAgIHByaW1hcnk6IHN0cmluZztcbiAgICBzZWNvbmRhcnk6IHN0cmluZztcbn1cblxuLyoqIE9yYW5nZS95ZWxsb3cgY2hlY2tlcmJvYXJkIGRpdGhlciBmb3IgQUIgY29uZSBtZXNoZXM7IG51bGwgd2hlbiBNSUwgKGNvbmVzIGhpZGRlbikuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RjE2QWZ0ZXJidXJuZXJDb25lRGl0aGVyKGxldmVyOiBudW1iZXIpOiBGMTZBZnRlcmJ1cm5lckNvbmVEaXRoZXIgfCBudWxsIHtcbiAgICBjb25zdCB6b25lID0gZ2V0RjE2VGhyb3R0bGVab25lKGxldmVyKTtcbiAgICBpZiAoem9uZSA9PT0gJ2FiLW1pbicpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHByaW1hcnk6IEYxNl9FTkdJTkVfTk9aWkxFX0NPTE9SUy5hYk1pbixcbiAgICAgICAgICAgIHNlY29uZGFyeTogRjE2X0VOR0lORV9OT1paTEVfQ09MT1JTLmFiTWF4LFxuICAgICAgICB9O1xuICAgIH1cbiAgICBpZiAoem9uZSA9PT0gJ2FiLW1heCcpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHByaW1hcnk6IEYxNl9FTkdJTkVfTk9aWkxFX0NPTE9SUy5hYk1heCxcbiAgICAgICAgICAgIHNlY29uZGFyeTogRjE2X0VOR0lORV9OT1paTEVfQ09MT1JTLmFiTWluLFxuICAgICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRjE2QWZ0ZXJidXJuZXJBY3RpdmUobGV2ZXI6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIHJldHVybiBnZXRGMTZUaHJvdHRsZVpvbmUobGV2ZXIpICE9PSAnbWlsJztcbn1cblxuZXhwb3J0IGNvbnN0IEYxNl9BRlRFUkJVUk5FUl9DT05FX0xFTkdUSF9NID0ge1xuICAgIG1pbDogMCxcbiAgICBhYk1pbjogNCxcbiAgICBhYk1heDogNyxcbn0gYXMgY29uc3Q7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRGMTZBZnRlcmJ1cm5lckNvbmVMZW5ndGhNKGxldmVyOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IHpvbmUgPSBnZXRGMTZUaHJvdHRsZVpvbmUobGV2ZXIpO1xuICAgIGlmICh6b25lID09PSAnYWItbWluJykge1xuICAgICAgICByZXR1cm4gRjE2X0FGVEVSQlVSTkVSX0NPTkVfTEVOR1RIX00uYWJNaW47XG4gICAgfVxuICAgIGlmICh6b25lID09PSAnYWItbWF4Jykge1xuICAgICAgICByZXR1cm4gRjE2X0FGVEVSQlVSTkVSX0NPTkVfTEVOR1RIX00uYWJNYXg7XG4gICAgfVxuICAgIHJldHVybiBGMTZfQUZURVJCVVJORVJfQ09ORV9MRU5HVEhfTS5taWw7XG59XG5cbi8qKiBMZXZlciBbMCwgMV0gYXMgMOKAkzEwMCB0aHJvdHRsZSBxdWFkcmFudCBwb3NpdGlvbi4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsZXZlclRvUGVyY2VudChsZXZlcjogbnVtYmVyKTogbnVtYmVyIHtcbiAgICByZXR1cm4gY2xhbXBMZXZlcihsZXZlcikgKiAxMDA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0YxNkFiRGV0ZW50QmFuZChsZXZlcjogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGxldmVyVG9QZXJjZW50KGxldmVyKSA+PSA5ODtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEYxNlRocm90dGxlWm9uZShsZXZlcjogbnVtYmVyKTogRjE2VGhyb3R0bGVab25lIHtcbiAgICBjb25zdCBwY3QgPSBsZXZlclRvUGVyY2VudChsZXZlcik7XG4gICAgaWYgKHBjdCA8IDk5KSB7XG4gICAgICAgIHJldHVybiAnbWlsJztcbiAgICB9XG4gICAgaWYgKHBjdCA8IDEwMCkge1xuICAgICAgICByZXR1cm4gJ2FiLW1pbic7XG4gICAgfVxuICAgIHJldHVybiAnYWItbWF4Jztcbn1cblxuLyoqIFNlYS1sZXZlbCByYXRlZCB0aHJ1c3QgKGtOKSBmb3IgbGV2ZXIgcG9zaXRpb24sIGJlZm9yZSBhbHRpdHVkZSBsYXBzZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlRjE2U2xUaHJ1c3RLbihsZXZlcjogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBjb25zdCBwY3QgPSBsZXZlclRvUGVyY2VudChsZXZlcik7XG4gICAgY29uc3QgeyBpZGxlVGhydXN0S24sIG1pbFRocnVzdEtuLCBhYk1pblRocnVzdEtuLCBhYk1heFRocnVzdEtuIH0gPSBGMTZfRU5HSU5FO1xuXG4gICAgaWYgKHBjdCA8PSA5OCkge1xuICAgICAgICBjb25zdCBtaWxGcmFjdGlvbiA9IHBjdCAvIDk4O1xuICAgICAgICByZXR1cm4gaWRsZVRocnVzdEtuICsgKG1pbFRocnVzdEtuIC0gaWRsZVRocnVzdEtuKSAqIG1pbEZyYWN0aW9uO1xuICAgIH1cbiAgICBpZiAocGN0IDwgOTkpIHtcbiAgICAgICAgcmV0dXJuIG1pbFRocnVzdEtuO1xuICAgIH1cbiAgICBpZiAocGN0ID49IDEwMCkge1xuICAgICAgICByZXR1cm4gYWJNYXhUaHJ1c3RLbjtcbiAgICB9XG4gICAgcmV0dXJuIGFiTWluVGhydXN0S247XG59XG5cbi8qKiBEZWxpdmVyZWQgZW5naW5lIHRocnVzdCAoTikgYXQgYWx0aXR1ZGUgd2l0aCBJU0EgdHVyYm9mYW4gbGFwc2UuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUYxNkVuZ2luZVRocnVzdE4obGV2ZXI6IG51bWJlciwgYWx0aXR1ZGVNZXRlcnM6IG51bWJlcik6IG51bWJlciB7XG4gICAgY29uc3Qgc2xLbiA9IGNvbXB1dGVGMTZTbFRocnVzdEtuKGxldmVyKTtcbiAgICBjb25zdCByaG8gPSBjb21wdXRlQWlyRGVuc2l0eShhbHRpdHVkZU1ldGVycyk7XG4gICAgY29uc3QgZmFjdG9yID0gY29tcHV0ZVRocnVzdERlbnNpdHlGYWN0b3IocmhvLCBhbHRpdHVkZU1ldGVycyk7XG4gICAgcmV0dXJuIHNsS24gKiAxMDAwICogZmFjdG9yO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUYxNkVuZ2luZVRocnVzdEtuKGxldmVyOiBudW1iZXIsIGFsdGl0dWRlTWV0ZXJzOiBudW1iZXIpOiBudW1iZXIge1xuICAgIHJldHVybiBjb21wdXRlRjE2RW5naW5lVGhydXN0TihsZXZlciwgYWx0aXR1ZGVNZXRlcnMpIC8gMTAwMDtcbn1cblxuLyoqIEhVRCBsYWJlbDogTUlMIDIw4oCTMTAwJSDihpIgQUIxIOKGkiBBQjIuICovXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0RjE2VGhyb3R0bGVIdWQobGV2ZXI6IG51bWJlcik6IHN0cmluZyB7XG4gICAgY29uc3QgcGN0ID0gbGV2ZXJUb1BlcmNlbnQobGV2ZXIpO1xuICAgIGNvbnN0IHpvbmUgPSBnZXRGMTZUaHJvdHRsZVpvbmUobGV2ZXIpO1xuXG4gICAgaWYgKHpvbmUgPT09ICdtaWwnKSB7XG4gICAgICAgIGlmIChwY3QgPiA5OCkge1xuICAgICAgICAgICAgcmV0dXJuICdNSUwgMTAwJztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtaWxQY3QgPSBNYXRoLnJvdW5kKDIwICsgKHBjdCAvIDk4KSAqIDgwKTtcbiAgICAgICAgcmV0dXJuIGBNSUwgJHttaWxQY3R9YDtcbiAgICB9XG4gICAgaWYgKHpvbmUgPT09ICdhYi1taW4nKSB7XG4gICAgICAgIHJldHVybiAnQUIxJztcbiAgICB9XG4gICAgcmV0dXJuICdBQjInO1xufVxuXG4vKiogTWFwIGxldmVyIHRvIFswLCAxXSBmb3IgZW5naW5lIGF1ZGlvIChpZGxl4oaSbWls4oaSZnVsbCBBQikuICovXG5leHBvcnQgZnVuY3Rpb24gZjE2VGhyb3R0bGVBdWRpb0xldmVsKGxldmVyOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IHNsS24gPSBjb21wdXRlRjE2U2xUaHJ1c3RLbihsZXZlcik7XG4gICAgY29uc3QgeyBpZGxlVGhydXN0S24sIGFiTWF4VGhydXN0S24gfSA9IEYxNl9FTkdJTkU7XG4gICAgaWYgKGFiTWF4VGhydXN0S24gPD0gaWRsZVRocnVzdEtuKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICByZXR1cm4gY2xhbXBMZXZlcigoc2xLbiAtIGlkbGVUaHJ1c3RLbikgLyAoYWJNYXhUaHJ1c3RLbiAtIGlkbGVUaHJ1c3RLbikpO1xufVxuXG4vKiogQ29udGludW91cyBNSUwgcmFtcCBmb3IgaGVsZCBrZXlib2FyZCBpbnB1dCBiZWxvdyB0aGUgTUlMIHN0b3AuICovXG5leHBvcnQgZnVuY3Rpb24gYWRqdXN0RjE2VGhyb3R0bGVJbnB1dChsZXZlcjogbnVtYmVyLCBzdGVwOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IGN1cnJlbnQgPSBjbGFtcExldmVyKGxldmVyKTtcbiAgICBpZiAoc3RlcCA+IDApIHtcbiAgICAgICAgcmV0dXJuIHJhbXBGMTZUaHJvdHRsZVVwKGN1cnJlbnQsIHN0ZXApO1xuICAgIH1cbiAgICBpZiAoc3RlcCA8IDApIHtcbiAgICAgICAgcmV0dXJuIHJhbXBGMTZUaHJvdHRsZURvd24oY3VycmVudCwgLXN0ZXApO1xuICAgIH1cbiAgICByZXR1cm4gY3VycmVudDtcbn1cblxuLyoqIE9uZSBkZXRlbnQgcGVyIGtleSBwcmVzczogTUlMIDEwMCDihpIgQUIxIOKGkiBBQjIgKGFuZCByZXZlcnNlKS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdGVwRjE2VGhyb3R0bGVEZXRlbnQobGV2ZXI6IG51bWJlciwgZGlyZWN0aW9uOiAxIHwgLTEpOiBudW1iZXIge1xuICAgIGNvbnN0IHBjdCA9IGxldmVyVG9QZXJjZW50KGxldmVyKTtcbiAgICBpZiAoZGlyZWN0aW9uID4gMCkge1xuICAgICAgICBpZiAocGN0ID49IDk5KSB7XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocGN0ID49IDk4KSB7XG4gICAgICAgICAgICByZXR1cm4gRjE2X0VOR0lORS5hYk1pbkxldmVyRW5kO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBsZXZlcjtcbiAgICB9XG4gICAgaWYgKHBjdCA+PSAxMDApIHtcbiAgICAgICAgcmV0dXJuIEYxNl9FTkdJTkUuYWJNaW5MZXZlckVuZDtcbiAgICB9XG4gICAgaWYgKHBjdCA+PSA5OSkge1xuICAgICAgICByZXR1cm4gRjE2X0VOR0lORS5taWxMZXZlckVuZDtcbiAgICB9XG4gICAgcmV0dXJuIGxldmVyO1xufVxuXG5mdW5jdGlvbiByYW1wRjE2VGhyb3R0bGVVcChsZXZlcjogbnVtYmVyLCBzdGVwOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IHRhcmdldCA9IGxldmVyICsgc3RlcDtcbiAgICBpZiAodGFyZ2V0ID49IEYxNl9FTkdJTkUubWlsTGV2ZXJFbmQpIHtcbiAgICAgICAgcmV0dXJuIEYxNl9FTkdJTkUubWlsTGV2ZXJFbmQ7XG4gICAgfVxuICAgIHJldHVybiBjbGFtcExldmVyKHRhcmdldCk7XG59XG5cbmZ1bmN0aW9uIHJhbXBGMTZUaHJvdHRsZURvd24obGV2ZXI6IG51bWJlciwgc3RlcDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBjb25zdCBwY3QgPSBsZXZlclRvUGVyY2VudChsZXZlcik7XG4gICAgaWYgKHBjdCA+IDk4KSB7XG4gICAgICAgIHJldHVybiBGMTZfRU5HSU5FLm1pbExldmVyRW5kO1xuICAgIH1cbiAgICByZXR1cm4gY2xhbXBMZXZlcihsZXZlciAtIHN0ZXApO1xufVxuXG5mdW5jdGlvbiBjbGFtcExldmVyKGxldmVyOiBudW1iZXIpOiBudW1iZXIge1xuICAgIHJldHVybiBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCBsZXZlcikpO1xufVxuIiwiaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuaW1wb3J0IHsgY2xhbXAgfSBmcm9tICcuLi91dGlscy9tYXRoJztcblxuY29uc3QgR1JBVklUWSA9IDkuODtcblxuLyoqIEZCVyBlbnZlbG9wZSBtYXJnaW46IGZ1bGwgYXV0aG9yaXR5IHVudGlsIDFnIGJlbG93IGxpbWl0LCB0aGVuIGxpbmVhciBmYWRlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVGMTZFbnZlbG9wZUF1dGhvcml0eShjdXJyZW50RzogbnVtYmVyLCBtYXhHOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IG1hcmdpbiA9IG1heEcgLSBjdXJyZW50RztcbiAgICBpZiAobWFyZ2luID49IDEpIHtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICAgIGlmIChtYXJnaW4gPD0gMCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgcmV0dXJuIG1hcmdpbjtcbn1cblxuLyoqIFJlZHVjZSBub3NlLXVwIHBpdGNoIGNvbW1hbmQgYXMgcG9zaXRpdmUgZyBhcHByb2FjaGVzIHRoZSBGQ1MgY2FwLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVGMTZQaXRjaEdMaW1pdChjdXJyZW50RzogbnVtYmVyLCBwaXRjaFN0aWNrOiBudW1iZXIsIG1heEc6IG51bWJlcik6IG51bWJlciB7XG4gICAgaWYgKHBpdGNoU3RpY2sgPD0gMCkge1xuICAgICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXB1dGVGMTZFbnZlbG9wZUF1dGhvcml0eShjdXJyZW50RywgbWF4Ryk7XG59XG5cbi8qKiBGQlcgYWxwaGEgbGltaXRlcjogZmFkZSBub3NlLXVwIGNvbW1hbmQgYXMgQU9BIGFwcHJvYWNoZXMgdGhlIHN0YWxsLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVGMTZQaXRjaEFvYUF1dGhvcml0eShhb2FSYWQ6IG51bWJlciwgcGl0Y2hTdGljazogbnVtYmVyLCBzdGFsbEFvYVJhZDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBpZiAocGl0Y2hTdGljayA8PSAwKSB7XG4gICAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgICBjb25zdCBsaW1pdCA9IHN0YWxsQW9hUmFkICogMC45NTtcbiAgICBpZiAoYW9hUmFkIDw9IGxpbWl0KSB7XG4gICAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgICByZXR1cm4gY2xhbXAoMSAtIChhb2FSYWQgLSBsaW1pdCkgLyBzdGFsbEFvYVJhZCwgMCwgMSk7XG59XG5cbi8qKiBOb3NlLWRvd24gcmVjb3ZlcnkgcmF0ZSAocmFkL3MpIHdoZW4gfEFPQXwgZXhjZWVkcyB0aGUgc3RhbGwgbGltaXQuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUYxNkFvYVJlY292ZXJ5UmF0ZShhb2FSYWQ6IG51bWJlciwgc3RhbGxBb2FSYWQ6IG51bWJlciwgc3BlZWQ6IG51bWJlcik6IG51bWJlciB7XG4gICAgaWYgKHNwZWVkIDwgMTApIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGlmIChNYXRoLmFicyhhb2FSYWQpIDw9IHN0YWxsQW9hUmFkKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICByZXR1cm4gY2xhbXAoKE1hdGguYWJzKGFvYVJhZCkgLSBzdGFsbEFvYVJhZCkgLyBzdGFsbEFvYVJhZCwgMCwgMSkgKiAwLjM1O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUxvYWRGYWN0b3JHKGFjY2VsOiBUSFJFRS5WZWN0b3IzLCB1cDogVEhSRUUuVmVjdG9yMywgZ3Jhdml0eSA9IEdSQVZJVFkpOiBudW1iZXIge1xuICAgIHJldHVybiAoYWNjZWwueCAqIHVwLnggKyAoYWNjZWwueSArIGdyYXZpdHkpICogdXAueSArIGFjY2VsLnogKiB1cC56KSAvIGdyYXZpdHk7XG59XG5cbi8qKiBUcmltIGFjY2VsZXJhdGlvbiBhbG9uZyBib2R5IHVwIHNvIGxvYWQgZmFjdG9yIGRvZXMgbm90IGV4Y2VlZCB0aGUgRkNTIGVudmVsb3BlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsYW1wTG9hZEZhY3RvckFjY2VsZXJhdGlvbihcbiAgICBhY2NlbDogVEhSRUUuVmVjdG9yMyxcbiAgICB1cDogVEhSRUUuVmVjdG9yMyxcbiAgICBtYXhHOiBudW1iZXIsXG4gICAgZ3Jhdml0eSA9IEdSQVZJVFksXG4pOiB2b2lkIHtcbiAgICBjb25zdCBuID0gY29tcHV0ZUxvYWRGYWN0b3JHKGFjY2VsLCB1cCwgZ3Jhdml0eSk7XG4gICAgaWYgKG4gPD0gbWF4Rykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGFjY2VsLmFkZFNjYWxlZFZlY3Rvcih1cCwgKG1heEcgLSBuKSAqIGdyYXZpdHkpO1xufVxuIiwiLyoqXG4gKiBGLTE2QyBhZXJvZHluYW1pYyBkYXRhIGZyb206XG4gKiBSZWhtYW4sIFwiQWVyb2R5bmFtaWMgUGVyZm9ybWFuY2UgQW5hbHlzaXMgb2YgRi0xNkMgRmlnaHRpbmcgRmFsY29uXCIgKE5VU1QpLlxuICogQ2hhcnQgcmVmZXJlbmNlcyBjb21wdXRlZCB3aXRoIEFuZGVyc29uIElTQSArIHBhcGVyIEVxLiAoMuKAkzUpLCBr4oKCID0gMC5cbiAqL1xuXG5leHBvcnQgY29uc3QgRjE2X1BBUEVSX0FOQUxZVElDQUwgPSB7XG4gICAgLyoqIEVxLiAoMik6IENEMCA9IENmZSAqIFN3ZXQgLyBTcmVmICovXG4gICAgY2QwOiAwLjAxOCxcbiAgICAvKiogRXEuICgz4oCTNSk6IENEaSA9IEsgKiBDTMKyICovXG4gICAgaW5kdWNlZERyYWdLOiAwLjE0ODksXG4gICAgY2wwOiAwLjIsXG4gICAgLyoqIE5BQ0EgNjRBMjA0LCBwZXIgcmFkaWFuICovXG4gICAgY2xBbHBoYVBlclJhZDogNS43MyxcbiAgICAvKiogRmlnLiA3IHBlYWsgKi9cbiAgICBtYXhMaWZ0VG9EcmFnOiA5LjY2LFxuICAgIG1heExpZnRUb0RyYWdBbHBoYURlZzogMixcbiAgICAvKiogRmlnLiA5ICovXG4gICAgbWluR2xpZGVBbmdsZURlZzogNS45MSxcbiAgICAvKiogU2VjdGlvbiBJSUkgYXNzdW1wdGlvbnMg4oCUIGNydWlzZSBhdCBNVE9XICovXG4gICAgY3J1aXNlVmVsb2NpdHlGcHM6IDg0NixcbiAgICBjcnVpc2VBbHRpdHVkZUZ0OiAzMDAwMCxcbiAgICAvKiogSmFuZSdzIC8gbGl0ZXJhdHVyZSBzZXJ2aWNlIGNlaWxpbmcgKi9cbiAgICBzZXJ2aWNlQ2VpbGluZ0Z0OiA1MDAwMCxcbiAgICB3aW5nQXJlYUZ0MjogMzAwLFxuICAgIG10b3dMYjogNDIwMDAsXG59IGFzIGNvbnN0O1xuXG4vKiogT3BlblZTUCAvIFZTUEFlcm8gcmVzdWx0cyBjaXRlZCBpbiBTZWN0aW9uIElWLkIuICovXG5leHBvcnQgY29uc3QgRjE2X1BBUEVSX1ZTUEFFUk8gPSB7XG4gICAgY2QwOiAwLjAxMjQsXG4gICAgY2xBbHBoYVBlclJhZDogMy42MixcbiAgICAvKiogRGVyaXZlZCBmcm9tIEwvRCBtYXggPSAxNCBhdCDOsSDiiYggNMKwIHdpdGggQ0zigoAgPSAwLjIuICovXG4gICAgaW5kdWNlZERyYWdLOiAwLjA5NzMsXG4gICAgbWF4TGlmdFRvRHJhZzogMTQsXG4gICAgbWF4TGlmdFRvRHJhZ0FscGhhRGVnOiA0LFxufSBhcyBjb25zdDtcblxuZXhwb3J0IHR5cGUgRjE2UGFwZXJNZXRyaWMgPVxuICAgIHwgJ2xpZnRUb0RyYWcnXG4gICAgfCAnbWluR2xpZGVBbmdsZURlZydcbiAgICB8ICd0aHJ1c3RSZXF1aXJlZExiJ1xuICAgIHwgJ3RvdGFsRHJhZ0xiJ1xuICAgIHwgJ21pblRvdGFsRHJhZ0xiJ1xuICAgIHwgJ2NydWlzZVNwZWVkRnBzJ1xuICAgIHwgJ2NkMCdcbiAgICB8ICdjbEFscGhhUGVyUmFkJ1xuICAgIHwgJ3ZNaW5EcmFnRnBzJztcblxuZXhwb3J0IGludGVyZmFjZSBGMTZQYXBlckNoYXJ0Q2FzZSB7XG4gICAgaWQ6IHN0cmluZztcbiAgICBmaWd1cmU6IHN0cmluZztcbiAgICBkZXNjcmlwdGlvbjogc3RyaW5nO1xuICAgIG1ldHJpYzogRjE2UGFwZXJNZXRyaWM7XG4gICAgLyoqIEFuZ2xlIG9mIGF0dGFjayBmb3IgTC9EIGNhc2VzIChkZWdyZWVzKS4gKi9cbiAgICBhbHBoYURlZz86IG51bWJlcjtcbiAgICBhbHRpdHVkZUZ0OiBudW1iZXI7XG4gICAgd2VpZ2h0TGI6IG51bWJlcjtcbiAgICB2ZWxvY2l0eUZwczogbnVtYmVyO1xuICAgIHJlZmVyZW5jZTogbnVtYmVyO1xuICAgIHRvbGVyYW5jZTogbnVtYmVyO1xufVxuXG4vKipcbiAqIENoYXJ0IGNoZWNrcG9pbnRzIGZyb20gRmlncy4gNywgOSwgMTDigJMxMiwgMTbigJMxNy5cbiAqIERyYWcvdGhydXN0IHJlZmVyZW5jZXM6IElTQSArIHBhcGVyIHBvbGFyIGF0IHN0YXRlZCBWLCBoLCBXIChNQVRMQUIgbWV0aG9kb2xvZ3kpLlxuICovXG5leHBvcnQgY29uc3QgRjE2X1BBUEVSX0NIQVJUX0NBU0VTOiBGMTZQYXBlckNoYXJ0Q2FzZVtdID0gW1xuICAgIHtcbiAgICAgICAgaWQ6ICdmaWc3X2xkX21heCcsXG4gICAgICAgIGZpZ3VyZTogJ0ZpZy4gNycsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTWF4aW11bSBsaWZ0LXRvLWRyYWcgcmF0aW8nLFxuICAgICAgICBtZXRyaWM6ICdsaWZ0VG9EcmFnJyxcbiAgICAgICAgYWxwaGFEZWc6IDIsXG4gICAgICAgIGFsdGl0dWRlRnQ6IDAsXG4gICAgICAgIHdlaWdodExiOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5tdG93TGIsXG4gICAgICAgIHZlbG9jaXR5RnBzOiAwLFxuICAgICAgICByZWZlcmVuY2U6IDkuNjYsXG4gICAgICAgIHRvbGVyYW5jZTogMC4xNSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6ICdmaWc5X21pbl9nbGlkZScsXG4gICAgICAgIGZpZ3VyZTogJ0ZpZy4gOScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTWluaW11bSBnbGlkZSBhbmdsZScsXG4gICAgICAgIG1ldHJpYzogJ21pbkdsaWRlQW5nbGVEZWcnLFxuICAgICAgICBhbHRpdHVkZUZ0OiAzMDAwMCxcbiAgICAgICAgd2VpZ2h0TGI6IEYxNl9QQVBFUl9BTkFMWVRJQ0FMLm10b3dMYixcbiAgICAgICAgdmVsb2NpdHlGcHM6IDAsXG4gICAgICAgIHJlZmVyZW5jZTogNS45MSxcbiAgICAgICAgdG9sZXJhbmNlOiAwLjEsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGlkOiAnZmlnMTBfbWluX2RyYWdfMjBrJyxcbiAgICAgICAgZmlndXJlOiAnRmlnLiAxMCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTWluaW11bSB0b3RhbCBkcmFnIGF0IDIwLDAwMCBmdCAoTVRPVyknLFxuICAgICAgICBtZXRyaWM6ICdtaW5Ub3RhbERyYWdMYicsXG4gICAgICAgIGFsdGl0dWRlRnQ6IDIwMDAwLFxuICAgICAgICB3ZWlnaHRMYjogRjE2X1BBUEVSX0FOQUxZVElDQUwubXRvd0xiLFxuICAgICAgICB2ZWxvY2l0eUZwczogNzk3LFxuICAgICAgICByZWZlcmVuY2U6IDQzNDguNzQsXG4gICAgICAgIHRvbGVyYW5jZTogNTAsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGlkOiAnZmlnMTBfZHJhZ183NTBmcHMnLFxuICAgICAgICBmaWd1cmU6ICdGaWcuIDEwJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdUb3RhbCBkcmFnIGF0IDc1MCBmdC9zLCAyMCwwMDAgZnQgKE1UT1cpJyxcbiAgICAgICAgbWV0cmljOiAndG90YWxEcmFnTGInLFxuICAgICAgICBhbHRpdHVkZUZ0OiAyMDAwMCxcbiAgICAgICAgd2VpZ2h0TGI6IEYxNl9QQVBFUl9BTkFMWVRJQ0FMLm10b3dMYixcbiAgICAgICAgdmVsb2NpdHlGcHM6IDc1MCxcbiAgICAgICAgcmVmZXJlbmNlOiA0MzgxLjUwLFxuICAgICAgICB0b2xlcmFuY2U6IDUwLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2ZpZzExX21pbl9kcmFnXzMwaycsXG4gICAgICAgIGZpZ3VyZTogJ0ZpZy4gMTEnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ01pbmltdW0gdG90YWwgZHJhZyBhdCAzMCwwMDAgZnQgKE1UT1cpJyxcbiAgICAgICAgbWV0cmljOiAnbWluVG90YWxEcmFnTGInLFxuICAgICAgICBhbHRpdHVkZUZ0OiAzMDAwMCxcbiAgICAgICAgd2VpZ2h0TGI6IEYxNl9QQVBFUl9BTkFMWVRJQ0FMLm10b3dMYixcbiAgICAgICAgdmVsb2NpdHlGcHM6IDk1MixcbiAgICAgICAgcmVmZXJlbmNlOiA0MzQ4Ljc0LFxuICAgICAgICB0b2xlcmFuY2U6IDUwLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2ZpZzExX2RyYWdfOTAwZnBzJyxcbiAgICAgICAgZmlndXJlOiAnRmlnLiAxMScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnVG90YWwgZHJhZyBhdCA5MDAgZnQvcywgMzAsMDAwIGZ0IChNVE9XKScsXG4gICAgICAgIG1ldHJpYzogJ3RvdGFsRHJhZ0xiJyxcbiAgICAgICAgYWx0aXR1ZGVGdDogMzAwMDAsXG4gICAgICAgIHdlaWdodExiOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5tdG93TGIsXG4gICAgICAgIHZlbG9jaXR5RnBzOiA5MDAsXG4gICAgICAgIHJlZmVyZW5jZTogNDM3NS44NCxcbiAgICAgICAgdG9sZXJhbmNlOiA1MCxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6ICdmaWcxMl9taW5fZHJhZ180MGsnLFxuICAgICAgICBmaWd1cmU6ICdGaWcuIDEyJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdNaW5pbXVtIHRvdGFsIGRyYWcgYXQgNDAsMDAwIGZ0IChNVE9XKScsXG4gICAgICAgIG1ldHJpYzogJ21pblRvdGFsRHJhZ0xiJyxcbiAgICAgICAgYWx0aXR1ZGVGdDogNDAwMDAsXG4gICAgICAgIHdlaWdodExiOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5tdG93TGIsXG4gICAgICAgIHZlbG9jaXR5RnBzOiAxMTczLFxuICAgICAgICByZWZlcmVuY2U6IDQzNDguNzMsXG4gICAgICAgIHRvbGVyYW5jZTogNTAsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGlkOiAnZmlnMTJfZHJhZ18xMDAwZnBzJyxcbiAgICAgICAgZmlndXJlOiAnRmlnLiAxMicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnVG90YWwgZHJhZyBhdCAxLDAwMCBmdC9zLCA0MCwwMDAgZnQgKE1UT1cpJyxcbiAgICAgICAgbWV0cmljOiAndG90YWxEcmFnTGInLFxuICAgICAgICBhbHRpdHVkZUZ0OiA0MDAwMCxcbiAgICAgICAgd2VpZ2h0TGI6IEYxNl9QQVBFUl9BTkFMWVRJQ0FMLm10b3dMYixcbiAgICAgICAgdmVsb2NpdHlGcHM6IDEwMDAsXG4gICAgICAgIHJlZmVyZW5jZTogNDU3Mi41MyxcbiAgICAgICAgdG9sZXJhbmNlOiA1MCxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6ICdmaWcxNl90cl9taW5fMzVrbGInLFxuICAgICAgICBmaWd1cmU6ICdGaWcuIDE2JyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdNaW5pbXVtIHRocnVzdCByZXF1aXJlZCBhdCAzNSwwMDAgbGIgKDMwLDAwMCBmdCknLFxuICAgICAgICBtZXRyaWM6ICd0aHJ1c3RSZXF1aXJlZExiJyxcbiAgICAgICAgYWx0aXR1ZGVGdDogMzAwMDAsXG4gICAgICAgIHdlaWdodExiOiAzNTAwMCxcbiAgICAgICAgdmVsb2NpdHlGcHM6IDg3MCxcbiAgICAgICAgcmVmZXJlbmNlOiAzNjIzLjk2LFxuICAgICAgICB0b2xlcmFuY2U6IDUwLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2ZpZzE2X3RyXzM1a2xiXzkwMGZwcycsXG4gICAgICAgIGZpZ3VyZTogJ0ZpZy4gMTYnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1RocnVzdCByZXF1aXJlZCBhdCAzNSwwMDAgbGIsIDkwMCBmdC9zICgzMCwwMDAgZnQpJyxcbiAgICAgICAgbWV0cmljOiAndGhydXN0UmVxdWlyZWRMYicsXG4gICAgICAgIGFsdGl0dWRlRnQ6IDMwMDAwLFxuICAgICAgICB3ZWlnaHRMYjogMzUwMDAsXG4gICAgICAgIHZlbG9jaXR5RnBzOiA5MDAsXG4gICAgICAgIHJlZmVyZW5jZTogMzYzMy4wMSxcbiAgICAgICAgdG9sZXJhbmNlOiA1MCxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6ICdmaWcxNl90cl8zNWtsYl8xMDAwZnBzJyxcbiAgICAgICAgZmlndXJlOiAnRmlnLiAxNicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnVGhydXN0IHJlcXVpcmVkIGF0IDM1LDAwMCBsYiwgMSwwMDAgZnQvcyAoMzAsMDAwIGZ0KScsXG4gICAgICAgIG1ldHJpYzogJ3RocnVzdFJlcXVpcmVkTGInLFxuICAgICAgICBhbHRpdHVkZUZ0OiAzMDAwMCxcbiAgICAgICAgd2VpZ2h0TGI6IDM1MDAwLFxuICAgICAgICB2ZWxvY2l0eUZwczogMTAwMCxcbiAgICAgICAgcmVmZXJlbmNlOiAzNzY4LjQzLFxuICAgICAgICB0b2xlcmFuY2U6IDUwLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2ZpZzE3X3RyX21pbl8yMGsnLFxuICAgICAgICBmaWd1cmU6ICdGaWcuIDE3JyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdNaW5pbXVtIHRocnVzdCByZXF1aXJlZCBhdCAyMCwwMDAgZnQgKE1UT1cpJyxcbiAgICAgICAgbWV0cmljOiAndGhydXN0UmVxdWlyZWRMYicsXG4gICAgICAgIGFsdGl0dWRlRnQ6IDIwMDAwLFxuICAgICAgICB3ZWlnaHRMYjogRjE2X1BBUEVSX0FOQUxZVElDQUwubXRvd0xiLFxuICAgICAgICB2ZWxvY2l0eUZwczogNzk3LFxuICAgICAgICByZWZlcmVuY2U6IDQzNDguNzQsXG4gICAgICAgIHRvbGVyYW5jZTogNTAsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGlkOiAnZmlnMTdfdHJfbWluXzMwaycsXG4gICAgICAgIGZpZ3VyZTogJ0ZpZy4gMTcnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1RocnVzdCByZXF1aXJlZCBhdCAxLDAwMCBmdC9zLCAzMCwwMDAgZnQgKE1UT1cpJyxcbiAgICAgICAgbWV0cmljOiAndGhydXN0UmVxdWlyZWRMYicsXG4gICAgICAgIGFsdGl0dWRlRnQ6IDMwMDAwLFxuICAgICAgICB3ZWlnaHRMYjogRjE2X1BBUEVSX0FOQUxZVElDQUwubXRvd0xiLFxuICAgICAgICB2ZWxvY2l0eUZwczogMTAwMCxcbiAgICAgICAgcmVmZXJlbmNlOiA0MzcwLjEyLFxuICAgICAgICB0b2xlcmFuY2U6IDUwLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2ZpZzE3X3RyXzExNTBmcHNfNDBrJyxcbiAgICAgICAgZmlndXJlOiAnRmlnLiAxNycsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnVGhydXN0IHJlcXVpcmVkIGF0IDEsMTUwIGZ0L3MsIDQwLDAwMCBmdCAoTVRPVyknLFxuICAgICAgICBtZXRyaWM6ICd0aHJ1c3RSZXF1aXJlZExiJyxcbiAgICAgICAgYWx0aXR1ZGVGdDogNDAwMDAsXG4gICAgICAgIHdlaWdodExiOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5tdG93TGIsXG4gICAgICAgIHZlbG9jaXR5RnBzOiAxMTUwLFxuICAgICAgICByZWZlcmVuY2U6IDQzNTIuMjAsXG4gICAgICAgIHRvbGVyYW5jZTogNTAsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGlkOiAnYXNzdW1wdGlvbl9jcnVpc2Vfc3BlZWQnLFxuICAgICAgICBmaWd1cmU6ICdTZWN0aW9uIElJSScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQ3J1aXNlIHZlbG9jaXR5IGF0IDMwLDAwMCBmdCAoTVRPVyknLFxuICAgICAgICBtZXRyaWM6ICdjcnVpc2VTcGVlZEZwcycsXG4gICAgICAgIGFsdGl0dWRlRnQ6IEYxNl9QQVBFUl9BTkFMWVRJQ0FMLmNydWlzZUFsdGl0dWRlRnQsXG4gICAgICAgIHdlaWdodExiOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5tdG93TGIsXG4gICAgICAgIHZlbG9jaXR5RnBzOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5jcnVpc2VWZWxvY2l0eUZwcyxcbiAgICAgICAgcmVmZXJlbmNlOiA4NDYsXG4gICAgICAgIHRvbGVyYW5jZTogMC41LFxuICAgIH0sXG5dO1xuXG4vKiogVlNQQWVybyBjaGFydCBjaGVja3BvaW50cyAoRmlncy4gMTjigJMyMCkuICovXG5leHBvcnQgY29uc3QgRjE2X1BBUEVSX1ZTUEFFUk9fQ0FTRVM6IEYxNlBhcGVyQ2hhcnRDYXNlW10gPSBbXG4gICAge1xuICAgICAgICBpZDogJ2ZpZzIwX2xkX21heF92c3BhZXJvJyxcbiAgICAgICAgZmlndXJlOiAnRmlnLiAyMCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnVlNQQWVybyBtYXhpbXVtIEwvRCcsXG4gICAgICAgIG1ldHJpYzogJ2xpZnRUb0RyYWcnLFxuICAgICAgICBhbHBoYURlZzogNCxcbiAgICAgICAgYWx0aXR1ZGVGdDogMCxcbiAgICAgICAgd2VpZ2h0TGI6IEYxNl9QQVBFUl9BTkFMWVRJQ0FMLm10b3dMYixcbiAgICAgICAgdmVsb2NpdHlGcHM6IDAsXG4gICAgICAgIHJlZmVyZW5jZTogMTQsXG4gICAgICAgIHRvbGVyYW5jZTogMC4xNSxcbiAgICB9LFxuXTtcblxuZXhwb3J0IGNvbnN0IEZUX1RPX00gPSAwLjMwNDg7XG5leHBvcnQgY29uc3QgRlBTX1RPX01QUyA9IEZUX1RPX007XG5leHBvcnQgY29uc3QgTEJfVE9fTiA9IDQuNDQ4MjIxNjE1MztcbmV4cG9ydCBjb25zdCBMQl9UT19LRyA9IDAuNDUzNTkyMzc7XG4iLCIvKipcbiAqIEYtMTZDIHNpbSBwcm9maWxlIGFuZCByZWZlcmVuY2UgZGF0YS5cbiAqIEFuYWx5dGljYWwgYWVybzogUmVobWFuLCBcIkFlcm9keW5hbWljIFBlcmZvcm1hbmNlIEFuYWx5c2lzIG9mIEYtMTZDIEZpZ2h0aW5nIEZhbGNvblwiLlxuICogUGVyZm9ybWFuY2UgZW52ZWxvcGU6IFVTQUYgZmFjdCBzaGVldCAvIEphbmUncy5cbiAqL1xuaW1wb3J0IHsgRjE2X1BBUEVSX0FOQUxZVElDQUwgfSBmcm9tICcuL2YxNlBhcGVyRGF0YSc7XG5cbmV4cG9ydCBjb25zdCBGMTZfUFJPRklMRSA9IHtcbiAgICAvKiogTVRPVyBmb3IgcGFwZXIvZW52ZWxvcGUgYW5hbHlzaXMgKH40MiwwMDAgbGIpLiAqL1xuICAgIGNvbWJhdE1hc3NLZzogMTkwNTEsXG4gICAgLyoqIFR5cGljYWwgdGFrZW9mZiBncm9zcyB3ZWlnaHQgZm9yIHNpbSBkeW5hbWljcyAofjMwLDAwMCBsYikuICovXG4gICAgc2ltTWFzc0tnOiAxMzYwOCxcbiAgICB3aW5nQXJlYU0yOiAyNy44NyxcbiAgICB3aW5nU3Bhbk06IDkuNDUsXG4gICAgY2QwOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5jZDAsXG4gICAgaW5kdWNlZERyYWdLOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5pbmR1Y2VkRHJhZ0ssXG4gICAgY2wwOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5jbDAsXG4gICAgY2xBbHBoYVBlclJhZDogRjE2X1BBUEVSX0FOQUxZVElDQUwuY2xBbHBoYVBlclJhZCxcbiAgICBhYlRocnVzdEtuOiAxMjkuNCxcbiAgICBtaWxUaHJ1c3RLbjogNzYuMyxcbiAgICAvKiogTGV2ZXIgYXQgMTAwJSBtaWxpdGFyeSBwb3dlciAoOTggb24gMOKAkzEwMCBxdWFkcmFudCkuICovXG4gICAgbWlsTGV2ZXJFbmQ6IDAuOTgsXG4gICAgLyoqIExldmVyIGF0IEFCMSBkZXRlbnQgKDk5IG9uIDDigJMxMDAgcXVhZHJhbnQpLiAqL1xuICAgIGFiTWluTGV2ZXJFbmQ6IDAuOTksXG4gICAgbWluRmx5aW5nU3BlZWRNcHM6IDY4LFxuICAgIHN0YWxsQW9hRGVnOiAyMixcbiAgICBzZXJ2aWNlQ2VpbGluZ006IEYxNl9QQVBFUl9BTkFMWVRJQ0FMLnNlcnZpY2VDZWlsaW5nRnQgKiAwLjMwNDgsXG4gICAgY3J1aXNlQWx0aXR1ZGVNOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5jcnVpc2VBbHRpdHVkZUZ0ICogMC4zMDQ4LFxuICAgIGNydWlzZVNwZWVkTXBzOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5jcnVpc2VWZWxvY2l0eUZwcyAqIDAuMzA0OCxcbiAgICAvKiogQ2F0IEkgY2xlYW4tc2hpcCBGQlcgcm9sbC1yYXRlIGNhcCAoZGVnL3MpLiAqL1xuICAgIG1heFJvbGxSYXRlRGVnUzogMzAwLFxuICAgIC8qKiBDYXQgSUlJIGhlYXZ5IHN0b3JlcyByb2xsLXJhdGUgY2FwIChkZWcvcykuICovXG4gICAgY2F0M01heFJvbGxSYXRlRGVnUzogMTgwLFxuICAgIC8qKiBGQlcgcG9zaXRpdmUgc3RydWN0dXJhbCBnIGxpbWl0IChDYXQgSSkuICovXG4gICAgbWF4TG9hZEZhY3Rvckc6IDkuNSxcbiAgICAvKiogVGFrZW9mZiByb3RhdGlvbiBzcGVlZCAofjcwIGt0KS4gKi9cbiAgICByb3RhdGlvblNwZWVkTXBzOiA2NSxcbiAgICAvKiogTWF4IHRvdWNoZG93biBncm91bmRzcGVlZCB3aXRoIGdlYXIgZG93bi4gKi9cbiAgICBsYW5kaW5nTWF4U3BlZWRNcHM6IDkwLFxuICAgIC8qKiBNYXggc2luayByYXRlIGF0IHRvdWNoZG93biAobS9zKS4gKi9cbiAgICBsYW5kaW5nTWF4VmVydGljYWxTcGVlZE1wczogOCxcbiAgICAvKiogTWF4IGJhbmsgYXQgdG91Y2hkb3duIChkZWcpLiAqL1xuICAgIGxhbmRpbmdNYXhSb2xsRGVnOiAxMixcbiAgICAvKiogTWluaW11bSBwaXRjaCBhdCB0b3VjaGRvd24gKGRlZywgbm9zZS1kb3duIGxpbWl0KS4gKi9cbiAgICBsYW5kaW5nTWluUGl0Y2hEZWc6IC0xMixcbn0gYXMgY29uc3Q7XG5cbmV4cG9ydCB0eXBlIEYxNlJlZmVyZW5jZU1ldHJpYyA9XG4gICAgfCAnbWFzc0tnJ1xuICAgIHwgJ3dpbmdBcmVhTTInXG4gICAgfCAnd2luZ1NwYW5NJ1xuICAgIHwgJ2FiVGhydXN0S24nXG4gICAgfCAnbWF4TWFjaCdcbiAgICB8ICdtYXhTcGVlZEttaCdcbiAgICB8ICdtaW5GbHlpbmdTcGVlZEt0cydcbiAgICB8ICdwZWFrTWF4U3BlZWRBbHRpdHVkZU0nXG4gICAgfCAnY2QwJ1xuICAgIHwgJ2luZHVjZWREcmFnSydcbiAgICB8ICdjbEFscGhhUGVyUmFkJ1xuICAgIHwgJ21heExpZnRUb0RyYWcnXG4gICAgfCAnY3J1aXNlU3BlZWRNcHMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEYxNlJlZmVyZW5jZUNhc2Uge1xuICAgIGlkOiBzdHJpbmc7XG4gICAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgICBzb3VyY2U6IHN0cmluZztcbiAgICBtZXRyaWM6IEYxNlJlZmVyZW5jZU1ldHJpYztcbiAgICBhbHRpdHVkZU1ldGVyczogbnVtYmVyO1xuICAgIHJlZmVyZW5jZTogbnVtYmVyO1xuICAgIHRvbGVyYW5jZTogbnVtYmVyO1xuICAgIC8qKiBGb3IgTC9EIG1ldHJpYy4gKi9cbiAgICBhbHBoYURlZz86IG51bWJlcjtcbn1cblxuZXhwb3J0IGNvbnN0IEYxNl9SRUZFUkVOQ0VfQ0FTRVM6IEYxNlJlZmVyZW5jZUNhc2VbXSA9IFtcbiAgICB7XG4gICAgICAgIGlkOiAnY2QwX3BhcGVyJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdaZXJvLWxpZnQgZHJhZyBjb2VmZmljaWVudCAoRXEuIDIpJyxcbiAgICAgICAgc291cmNlOiAnUmVobWFuIHBhcGVyIGFuYWx5dGljYWwnLFxuICAgICAgICBtZXRyaWM6ICdjZDAnLFxuICAgICAgICBhbHRpdHVkZU1ldGVyczogMCxcbiAgICAgICAgcmVmZXJlbmNlOiAwLjAxOCxcbiAgICAgICAgdG9sZXJhbmNlOiAwLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2luZHVjZWRfa19wYXBlcicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnSW5kdWNlZCBkcmFnIGZhY3RvciBLIChFcS4gM+KAkzUpJyxcbiAgICAgICAgc291cmNlOiAnUmVobWFuIHBhcGVyIGFuYWx5dGljYWwnLFxuICAgICAgICBtZXRyaWM6ICdpbmR1Y2VkRHJhZ0snLFxuICAgICAgICBhbHRpdHVkZU1ldGVyczogMCxcbiAgICAgICAgcmVmZXJlbmNlOiAwLjE0ODksXG4gICAgICAgIHRvbGVyYW5jZTogMC4wMDAxLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2NsX2FscGhhX3BhcGVyJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdMaWZ0LWN1cnZlIHNsb3BlJyxcbiAgICAgICAgc291cmNlOiAnUmVobWFuIHBhcGVyIC8gTkFDQSA2NEEyMDQnLFxuICAgICAgICBtZXRyaWM6ICdjbEFscGhhUGVyUmFkJyxcbiAgICAgICAgYWx0aXR1ZGVNZXRlcnM6IDAsXG4gICAgICAgIHJlZmVyZW5jZTogNS43MyxcbiAgICAgICAgdG9sZXJhbmNlOiAwLjAxLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2xkX21heF9wYXBlcicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTWF4aW11bSBsaWZ0LXRvLWRyYWcgcmF0aW8gYXQgzrEg4omIIDLCsCcsXG4gICAgICAgIHNvdXJjZTogJ1JlaG1hbiBGaWcuIDcnLFxuICAgICAgICBtZXRyaWM6ICdtYXhMaWZ0VG9EcmFnJyxcbiAgICAgICAgYWx0aXR1ZGVNZXRlcnM6IDAsXG4gICAgICAgIGFscGhhRGVnOiAyLFxuICAgICAgICByZWZlcmVuY2U6IDkuNjYsXG4gICAgICAgIHRvbGVyYW5jZTogMC4zLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2NydWlzZV9zcGVlZF9wYXBlcicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQ3J1aXNlIHRydWUgYWlyc3BlZWQgYXQgMzAsMDAwIGZ0JyxcbiAgICAgICAgc291cmNlOiAnUmVobWFuIFNlY3Rpb24gSUlJICg4NDYgZnQvcyknLFxuICAgICAgICBtZXRyaWM6ICdjcnVpc2VTcGVlZE1wcycsXG4gICAgICAgIGFsdGl0dWRlTWV0ZXJzOiBGMTZfUFJPRklMRS5jcnVpc2VBbHRpdHVkZU0sXG4gICAgICAgIHJlZmVyZW5jZTogRjE2X1BST0ZJTEUuY3J1aXNlU3BlZWRNcHMsXG4gICAgICAgIHRvbGVyYW5jZTogMC41LFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ3dpbmdfYXJlYScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnV2luZyByZWZlcmVuY2UgYXJlYSAoMzAwIGZ0wrIpJyxcbiAgICAgICAgc291cmNlOiAnSmFuZVxcJ3MgLyBSZWhtYW4gcGFwZXInLFxuICAgICAgICBtZXRyaWM6ICd3aW5nQXJlYU0yJyxcbiAgICAgICAgYWx0aXR1ZGVNZXRlcnM6IDAsXG4gICAgICAgIHJlZmVyZW5jZTogMjcuODcsXG4gICAgICAgIHRvbGVyYW5jZTogMC4wNSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6ICdhYl90aHJ1c3Rfc2wnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0Z1bGwgYWZ0ZXJidXJuZXIgdGhydXN0IGF0IHNlYSBsZXZlbCcsXG4gICAgICAgIHNvdXJjZTogJ0YxMDAtUFctMjI5ICgxMjkuNCBrTiknLFxuICAgICAgICBtZXRyaWM6ICdhYlRocnVzdEtuJyxcbiAgICAgICAgYWx0aXR1ZGVNZXRlcnM6IDAsXG4gICAgICAgIHJlZmVyZW5jZTogMTI5LjQsXG4gICAgICAgIHRvbGVyYW5jZTogMi4wLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ21heF9tYWNoX2ZsNDAwJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdNYXhpbXVtIE1hY2ggYXQgNDAsMDAwIGZ0IChBQiwgdGhydXN04oCTZHJhZyBiYWxhbmNlKScsXG4gICAgICAgIHNvdXJjZTogJ1NpbSBlbnZlbG9wZSB3aXRoIEFuZGVyc29uIHBvbGFyICsgdHJhbnNvbmljIGRyYWcnLFxuICAgICAgICBtZXRyaWM6ICdtYXhNYWNoJyxcbiAgICAgICAgYWx0aXR1ZGVNZXRlcnM6IDEyMTkyLFxuICAgICAgICByZWZlcmVuY2U6IDEuODksXG4gICAgICAgIHRvbGVyYW5jZTogMC4xMixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6ICdwZWFrX3NwZWVkX2FsdGl0dWRlJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdBbHRpdHVkZSBvZiBwZWFrIGxldmVsLWZsaWdodCBtYXggc3BlZWQnLFxuICAgICAgICBzb3VyY2U6ICdTaW0gZW52ZWxvcGUgKElTQSB0aHJ1c3QgbGFwc2UpJyxcbiAgICAgICAgbWV0cmljOiAncGVha01heFNwZWVkQWx0aXR1ZGVNJyxcbiAgICAgICAgYWx0aXR1ZGVNZXRlcnM6IDAsXG4gICAgICAgIHJlZmVyZW5jZTogMTEwMDAsXG4gICAgICAgIHRvbGVyYW5jZTogNTAwLFxuICAgIH0sXG5dO1xuXG5leHBvcnQgY29uc3QgTVBTX1RPX0tUUyA9IDEuOTQzODQ7XG4iLCJpbXBvcnQgeyBjbGFtcCB9IGZyb20gJy4uL3V0aWxzL21hdGgnO1xuXG4vKiogRkJXIHJvbGwtYXhpcyBlbnZlbG9wZSAoQ2F0IEkgY2xlYW4pLiBDYXQgSUlJIGxvd2VycyBtYXggcmF0ZSBmb3IgaGVhdnkgc3RvcmVzLiAqL1xuZXhwb3J0IGludGVyZmFjZSBGMTZSb2xsQ29udHJvbENvbmZpZyB7XG4gICAgbWF4Um9sbFJhdGVEZWdTOiBudW1iZXI7XG4gICAgYWN0dWF0b3JUYXVTOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjb25zdCBGMTZfUk9MTF9DQVQxOiBGMTZSb2xsQ29udHJvbENvbmZpZyA9IHtcbiAgICBtYXhSb2xsUmF0ZURlZ1M6IDMwMCxcbiAgICBhY3R1YXRvclRhdVM6IDAuMDc1LFxufTtcblxuZXhwb3J0IGNvbnN0IEYxNl9ST0xMX0NBVDM6IEYxNlJvbGxDb250cm9sQ29uZmlnID0ge1xuICAgIG1heFJvbGxSYXRlRGVnUzogMTgwLFxuICAgIGFjdHVhdG9yVGF1UzogMC4wOSxcbn07XG5cbmNvbnN0IERFR19UT19SQUQgPSBNYXRoLlBJIC8gMTgwO1xuXG5jb25zdCBNSU5fUV9HQUlOID0gMC4xMjtcbmNvbnN0IE1BWF9RX0dBSU4gPSAxLjA7XG5cbmV4cG9ydCBmdW5jdGlvbiBtYXhSb2xsUmF0ZVJhZChjb25maWc6IEYxNlJvbGxDb250cm9sQ29uZmlnKTogbnVtYmVyIHtcbiAgICByZXR1cm4gY29uZmlnLm1heFJvbGxSYXRlRGVnUyAqIERFR19UT19SQUQ7XG59XG5cbi8qKiBHYWluIGZhbGxzIGFzIGR5bmFtaWMgcHJlc3N1cmUgcmlzZXMg4oCUIEZCVyBsaW1pdHMgY29tbWFuZCB0byBwcm90ZWN0IHN0cnVjdHVyZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlRjE2Um9sbER5bmFtaWNQcmVzc3VyZUdhaW4oZHluYW1pY1ByZXNzdXJlOiBudW1iZXIsIHFSZWY6IG51bWJlcik6IG51bWJlciB7XG4gICAgY29uc3QgcSA9IE1hdGgubWF4KGR5bmFtaWNQcmVzc3VyZSwgMSk7XG4gICAgY29uc3QgcmVmID0gTWF0aC5tYXgocVJlZiwgMSk7XG4gICAgY29uc3QgcmF3ID0gTUlOX1FfR0FJTiArIChNQVhfUV9HQUlOIC0gTUlOX1FfR0FJTikgKiBNYXRoLnNxcnQocmVmIC8gKHJlZiArIHEpKTtcbiAgICByZXR1cm4gY2xhbXAocmF3LCBNSU5fUV9HQUlOLCBNQVhfUV9HQUlOKTtcbn1cblxuZnVuY3Rpb24gbWFjaFJvbGxMaW1pdGVyKG1hY2g6IG51bWJlcik6IG51bWJlciB7XG4gICAgaWYgKG1hY2ggPD0gMC44NSkge1xuICAgICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgcmV0dXJuIGNsYW1wKDEgLSAobWFjaCAtIDAuODUpIC8gMC41NSwgMC4zNSwgMSk7XG59XG5cbmZ1bmN0aW9uIGFsdGl0dWRlUm9sbExpbWl0ZXIoYWx0aXR1ZGVNOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGlmIChhbHRpdHVkZU0gPD0gMTIwMDApIHtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICAgIHJldHVybiBjbGFtcCgxIC0gKGFsdGl0dWRlTSAtIDEyMDAwKSAvIDIwMDAwLCAwLjQ1LCAxKTtcbn1cblxuZnVuY3Rpb24gYW9hUm9sbExpbWl0ZXIoYW9hUmFkOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IGFvYURlZyA9IE1hdGguYWJzKGFvYVJhZCkgKiAoMTgwIC8gTWF0aC5QSSk7XG4gICAgaWYgKGFvYURlZyA8PSAxNSkge1xuICAgICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgcmV0dXJuIGNsYW1wKDEgLSAoYW9hRGVnIC0gMTUpIC8gMjIsIDAuMTUsIDEpO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEYxNlJvbGxDb21tYW5kSW5wdXRzIHtcbiAgICBzdGljazogbnVtYmVyO1xuICAgIGR5bmFtaWNQcmVzc3VyZTogbnVtYmVyO1xuICAgIHFSZWY6IG51bWJlcjtcbiAgICBtYWNoOiBudW1iZXI7XG4gICAgYWx0aXR1ZGVNOiBudW1iZXI7XG4gICAgYW9hUmFkOiBudW1iZXI7XG4gICAgZmxhcHNFeHRlbmRlZDogYm9vbGVhbjtcbiAgICBsYW5kZWQ6IGJvb2xlYW47XG4gICAgY29uZmlnOiBGMTZSb2xsQ29udHJvbENvbmZpZztcbn1cblxuLyoqIFN0aWNrIFstMSwgMV0g4oaSIGNvbW1hbmRlZCBib2R5IHJvbGwgcmF0ZSBwX2NtZCAocmFkL3MpLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVGMTZDb21tYW5kZWRSb2xsUmF0ZShpbnB1dHM6IEYxNlJvbGxDb21tYW5kSW5wdXRzKTogbnVtYmVyIHtcbiAgICBpZiAoaW5wdXRzLmxhbmRlZCB8fCBNYXRoLmFicyhpbnB1dHMuc3RpY2spIDwgMWUtNikge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICBjb25zdCBmbGFwRmFjdG9yID0gaW5wdXRzLmZsYXBzRXh0ZW5kZWQgPyAwLjY1IDogMTtcbiAgICBjb25zdCBsaW1pdGVyID0gbWFjaFJvbGxMaW1pdGVyKGlucHV0cy5tYWNoKVxuICAgICAgICAqIGFsdGl0dWRlUm9sbExpbWl0ZXIoaW5wdXRzLmFsdGl0dWRlTSlcbiAgICAgICAgKiBhb2FSb2xsTGltaXRlcihpbnB1dHMuYW9hUmFkKVxuICAgICAgICAqIGZsYXBGYWN0b3I7XG5cbiAgICBjb25zdCBxR2FpbiA9IGNvbXB1dGVGMTZSb2xsRHluYW1pY1ByZXNzdXJlR2FpbihpbnB1dHMuZHluYW1pY1ByZXNzdXJlLCBpbnB1dHMucVJlZik7XG4gICAgcmV0dXJuIGlucHV0cy5zdGljayAqIG1heFJvbGxSYXRlUmFkKGlucHV0cy5jb25maWcpICogcUdhaW4gKiBsaW1pdGVyO1xufVxuXG4vKiogRmlyc3Qtb3JkZXIgZmxhcGVyb24vYWN0dWF0b3IgbGFnIHRvd2FyZCBjb21tYW5kZWQgcmF0ZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdGVwRjE2Qm9keVJvbGxSYXRlKFxuICAgIGJvZHlSb2xsUmF0ZVJhZDogbnVtYmVyLFxuICAgIGNvbW1hbmRlZFJhdGVSYWQ6IG51bWJlcixcbiAgICBkZWx0YTogbnVtYmVyLFxuICAgIGNvbmZpZzogRjE2Um9sbENvbnRyb2xDb25maWcsXG4pOiBudW1iZXIge1xuICAgIGlmIChkZWx0YSA8PSAwKSB7XG4gICAgICAgIHJldHVybiBib2R5Um9sbFJhdGVSYWQ7XG4gICAgfVxuICAgIGNvbnN0IGFscGhhID0gMSAtIE1hdGguZXhwKC1kZWx0YSAvIE1hdGgubWF4KGNvbmZpZy5hY3R1YXRvclRhdVMsIDFlLTMpKTtcbiAgICByZXR1cm4gYm9keVJvbGxSYXRlUmFkICsgKGNvbW1hbmRlZFJhdGVSYWQgLSBib2R5Um9sbFJhdGVSYWQpICogYWxwaGE7XG59XG5cbi8qKiBIaWdoLUFvQSByb2xs4oCTeWF3IGNvdXBsaW5nOiBhdXRvIHJ1ZGRlciB0byBjb29yZGluYXRlIGFuZCBsaW1pdCBzaWRlc2xpcCBidWlsZHVwLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVGMTZSb2xsWWF3Q291cGxpbmcoYm9keVJvbGxSYXRlUmFkOiBudW1iZXIsIGFvYVJhZDogbnVtYmVyLCBtYXhSb2xsUmF0ZVJhZDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBjb25zdCBhb2FGYWN0b3IgPSBjbGFtcCgoTWF0aC5hYnMoYW9hUmFkKSAtIDAuMTIpIC8gMC40LCAwLCAxKTtcbiAgICBpZiAoYW9hRmFjdG9yIDw9IDAgfHwgbWF4Um9sbFJhdGVSYWQgPD0gMCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgY29uc3Qgbm9ybWFsaXplZFJvbGwgPSBjbGFtcChib2R5Um9sbFJhdGVSYWQgLyBtYXhSb2xsUmF0ZVJhZCwgLTEsIDEpO1xuICAgIHJldHVybiBub3JtYWxpemVkUm9sbCAqIDAuNCAqIGFvYUZhY3Rvcjtcbn1cbiIsIi8qKlxuICogQSBzaW5nbGUgcmlnaWQgYWVyb2R5bmFtaWMgc3VyZmFjZSBmb3IgdGhlIEZNMiBwYXJ0cyBtb2RlbC5cbiAqXG4gKiBHaXZlbiB0aGUgYWlyY3JhZnQncyBib2R5LWZyYW1lIGxpbmVhciB2ZWxvY2l0eSwgYm9keSBhbmd1bGFyIHZlbG9jaXR5IGFuZFxuICogdGhlIGxvY2FsIGFpciBkZW5zaXR5LCB0aGUgc3VyZmFjZSBjb21wdXRlcyB0aGUgbGlmdCArIGRyYWcgZm9yY2UgaXQgcHJvZHVjZXNcbiAqIGFuZCB0aGUgbW9tZW50IHRoYXQgZm9yY2UgZXhlcnRzIGFib3V0IHRoZSBDRy4gVGhlIGtleSBkZXRhaWwgdGhhdCBtYWtlcyB0aGVcbiAqIHdob2xlIG1vZGVsIGJlaGF2ZSBpcyB0aGF0IHRoZSBhaXJmbG93IHNlZW4gYnkgdGhlIHN1cmZhY2UgaW5jbHVkZXMgdGhlXG4gKiB2ZWxvY2l0eSBjb250cmlidXRlZCBieSByb3RhdGlvbiBhdCBpdHMgb3duIGxvY2F0aW9uOlxuICpcbiAqICAgICB1X2xvY2FsID0gdl9ib2R5ICsgz4kgw5cgclxuICpcbiAqIEEgcGl0Y2ggcmF0ZSB0aGVyZWZvcmUgcmFpc2VzIHRoZSBBb0Egb2YgdGhlIHRhaWwsIGEgcm9sbCByYXRlIHJhaXNlcyB0aGUgQW9BXG4gKiBvZiB0aGUgZG93bi1nb2luZyB3aW5nLCBhbmQgYSB5YXcgcmF0ZSBsb2FkcyB0aGUgZmluIOKAlCBpLmUuIHBpdGNoLCByb2xsIGFuZFxuICogeWF3IGFlcm9keW5hbWljIGRhbXBpbmcgYWxsIGFwcGVhciBhdXRvbWF0aWNhbGx5IGZyb20gdGhlIGdlb21ldHJ5LlxuICovXG5pbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgeyBTdXJmYWNlR2VvbWV0cnkgfSBmcm9tICcuL2YxNkZtMkNvbmZpZyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3VyZmFjZUlucHV0IHtcbiAgICAvKiogQm9keS1mcmFtZSB2ZWxvY2l0eSBvZiB0aGUgQ0cgdGhyb3VnaCB0aGUgYWlyIChtL3MpLiAqL1xuICAgIHZlbG9jaXR5Qm9keTogVEhSRUUuVmVjdG9yMztcbiAgICAvKiogQm9keS1mcmFtZSBhbmd1bGFyIHZlbG9jaXR5IChyYWQvcykuICovXG4gICAgYW5ndWxhclZlbG9jaXR5Qm9keTogVEhSRUUuVmVjdG9yMztcbiAgICAvKiogQWlyIGRlbnNpdHkgKGtnL23CsykuICovXG4gICAgYWlyRGVuc2l0eTogbnVtYmVyO1xuICAgIC8qKiBFZmZlY3RpdmUgaW5jaWRlbmNlIGFkZGVkIGJ5IGNvbnRyb2wgZGVmbGVjdGlvbiAocmFkKS4gKi9cbiAgICBjb250cm9sRGVsdGFBb2FSYWQ6IG51bWJlcjtcbiAgICAvKiogU3ltbWV0cmljIGNhbWJlciBiaWFzLCBlLmcuIGZsYXBzIChyYWQpLiAqL1xuICAgIGNhbWJlckJpYXNSYWQ6IG51bWJlcjtcbiAgICAvKiogUmVkdWN0aW9uIG9mIHRoZSBzdGFsbCBBb0EsIGUuZy4gZnJvbSBmbGFwcyAocmFkKS4gKi9cbiAgICBzdGFsbFNoaWZ0UmFkOiBudW1iZXI7XG4gICAgLyoqIEFkZGl0aW9uYWwgcHJvZmlsZSBkcmFnIGNvZWZmaWNpZW50IChyZWZlcmVuY2VkIHRvIHRoaXMgc3VyZmFjZSdzIGFyZWEpLiAqL1xuICAgIGV4dHJhQ2Q6IG51bWJlcjtcbn1cblxuZXhwb3J0IGNsYXNzIEFlcm9TdXJmYWNlIHtcbiAgICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSByZWFkb25seSBnZW9tOiBTdXJmYWNlR2VvbWV0cnk7XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IHBvc2l0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IHVwID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGZvcndhcmQgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgc3BhbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IF91ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9yb3QgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgX2RyYWdEaXIgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgX2xpZnREaXIgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG4gICAgLyoqIExhc3QgY29tcHV0ZWQgYW5nbGUgb2YgYXR0YWNrIGZvciB0aGlzIHN1cmZhY2UgKHJhZCk7IHVzZWZ1bCB0ZWxlbWV0cnkuICovXG4gICAgbGFzdEFvYVJhZCA9IDA7XG5cbiAgICBjb25zdHJ1Y3RvcihnZW9tOiBTdXJmYWNlR2VvbWV0cnkpIHtcbiAgICAgICAgdGhpcy5nZW9tID0gZ2VvbTtcbiAgICAgICAgdGhpcy5uYW1lID0gZ2VvbS5uYW1lO1xuICAgICAgICB0aGlzLnBvc2l0aW9uLmZyb21BcnJheShnZW9tLnBvc2l0aW9uKTtcbiAgICAgICAgdGhpcy51cC5mcm9tQXJyYXkoZ2VvbS51cCkubm9ybWFsaXplKCk7XG4gICAgICAgIHRoaXMuZm9yd2FyZC5mcm9tQXJyYXkoZ2VvbS5mb3J3YXJkKS5ub3JtYWxpemUoKTtcbiAgICAgICAgLy8gU3Bhbndpc2UgYXhpcyAodGhlIGRpcmVjdGlvbiB3ZSBpZ25vcmUgd2hlbiBtZWFzdXJpbmcgQW9BKS5cbiAgICAgICAgdGhpcy5zcGFuLmNvcHkodGhpcy51cCkuY3Jvc3ModGhpcy5mb3J3YXJkKS5ub3JtYWxpemUoKTtcbiAgICB9XG5cbiAgICBnZXQgcG9zaXRpb25Cb2R5KCk6IFRIUkVFLlZlY3RvcjMge1xuICAgICAgICByZXR1cm4gdGhpcy5wb3NpdGlvbjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBY2N1bXVsYXRlIHRoaXMgc3VyZmFjZSdzIGFlcm9keW5hbWljIGZvcmNlIGFuZCBtb21lbnQuXG4gICAgICogQHBhcmFtIGlucHV0ICAgICAgRmxpZ2h0IGNvbmRpdGlvbiBhbmQgY29udHJvbCBzdGF0ZS5cbiAgICAgKiBAcGFyYW0gb3V0Rm9yY2UgICBCb2R5LWZyYW1lIGZvcmNlIGFjY3VtdWxhdG9yIChOKSDigJQgYWRkZWQgdG8uXG4gICAgICogQHBhcmFtIG91dE1vbWVudCAgQm9keS1mcmFtZSBtb21lbnQtYWJvdXQtQ0cgYWNjdW11bGF0b3IgKE7Ct20pIOKAlCBhZGRlZCB0by5cbiAgICAgKi9cbiAgICBhY2N1bXVsYXRlKGlucHV0OiBTdXJmYWNlSW5wdXQsIG91dEZvcmNlOiBUSFJFRS5WZWN0b3IzLCBvdXRNb21lbnQ6IFRIUkVFLlZlY3RvcjMpOiB2b2lkIHtcbiAgICAgICAgLy8gTG9jYWwgdmVsb2NpdHkgdGhyb3VnaCB0aGUgYWlyIGF0IHRoZSBzdXJmYWNlOiB2ICsgz4kgw5cgci5cbiAgICAgICAgdGhpcy5fcm90LmNyb3NzVmVjdG9ycyhpbnB1dC5hbmd1bGFyVmVsb2NpdHlCb2R5LCB0aGlzLnBvc2l0aW9uKTtcbiAgICAgICAgdGhpcy5fdS5jb3B5KGlucHV0LnZlbG9jaXR5Qm9keSkuYWRkKHRoaXMuX3JvdCk7XG5cbiAgICAgICAgLy8gUmVtb3ZlIHRoZSBzcGFud2lzZSBjb21wb25lbnQgKHRoYXQgZmxvdyBkb2VzIG5vdCBtYWtlIGxpZnQgaGVyZSkuXG4gICAgICAgIGNvbnN0IHNwYW5Db21wID0gdGhpcy5fdS5kb3QodGhpcy5zcGFuKTtcbiAgICAgICAgdGhpcy5fdS5hZGRTY2FsZWRWZWN0b3IodGhpcy5zcGFuLCAtc3BhbkNvbXApO1xuXG4gICAgICAgIGNvbnN0IHNwZWVkU3EgPSB0aGlzLl91Lmxlbmd0aFNxKCk7XG4gICAgICAgIGlmIChzcGVlZFNxIDwgMWUtNCkge1xuICAgICAgICAgICAgdGhpcy5sYXN0QW9hUmFkID0gMDtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzcGVlZCA9IE1hdGguc3FydChzcGVlZFNxKTtcblxuICAgICAgICBjb25zdCB1ZiA9IHRoaXMuX3UuZG90KHRoaXMuZm9yd2FyZCk7XG4gICAgICAgIGNvbnN0IHV1ID0gdGhpcy5fdS5kb3QodGhpcy51cCk7XG4gICAgICAgIGNvbnN0IGFvYSA9IE1hdGguYXRhbjIoLXV1LCB1Zik7XG4gICAgICAgIHRoaXMubGFzdEFvYVJhZCA9IGFvYTtcblxuICAgICAgICBjb25zdCBlZmZlY3RpdmVBb2EgPSBhb2EgKyBpbnB1dC5jb250cm9sRGVsdGFBb2FSYWQgKyBpbnB1dC5jYW1iZXJCaWFzUmFkO1xuICAgICAgICBjb25zdCBzdGFsbCA9IHRoaXMuZ2VvbS5zdGFsbEFvYVJhZCAtIGlucHV0LnN0YWxsU2hpZnRSYWQ7XG4gICAgICAgIGNvbnN0IGNsID0gbGlmdENvZWZmaWNpZW50KGVmZmVjdGl2ZUFvYSwgdGhpcy5nZW9tLmxpZnRTbG9wZVBlclJhZCwgc3RhbGwpO1xuICAgICAgICBjb25zdCBzZXBhcmF0ZWQgPSBNYXRoLnNpbihlZmZlY3RpdmVBb2EpO1xuICAgICAgICBjb25zdCBjZCA9IHRoaXMuZ2VvbS5jZDAgKyBpbnB1dC5leHRyYUNkXG4gICAgICAgICAgICArIHRoaXMuZ2VvbS5pbmR1Y2VkSyAqIGNsICogY2xcbiAgICAgICAgICAgICsgMS4wICogc2VwYXJhdGVkICogc2VwYXJhdGVkO1xuXG4gICAgICAgIC8vIERyYWcgYWN0cyBkb3duc3RyZWFtIChkaXJlY3Rpb24gdGhlIGFpciBpcyBtb3ZpbmcgcmVsYXRpdmUgdG8gc3VyZmFjZSkuXG4gICAgICAgIHRoaXMuX2RyYWdEaXIuY29weSh0aGlzLl91KS5tdWx0aXBseVNjYWxhcigtMSAvIHNwZWVkKTtcbiAgICAgICAgLy8gTGlmdCBpcyBwZXJwZW5kaWN1bGFyIHRvIHRoZSByZWxhdGl2ZSB3aW5kLCBpbiB0aGUgc3VyZmFjZSdzIGxpZnQgcGxhbmUuXG4gICAgICAgIHRoaXMuX2xpZnREaXIuY3Jvc3NWZWN0b3JzKHRoaXMuc3BhbiwgdGhpcy5fZHJhZ0Rpcikubm9ybWFsaXplKCk7XG5cbiAgICAgICAgY29uc3QgcSA9IDAuNSAqIGlucHV0LmFpckRlbnNpdHkgKiBzcGVlZFNxO1xuICAgICAgICBjb25zdCBhcmVhID0gdGhpcy5nZW9tLmFyZWFNMjtcbiAgICAgICAgY29uc3QgbGlmdCA9IHEgKiBhcmVhICogY2w7XG4gICAgICAgIGNvbnN0IGRyYWcgPSBxICogYXJlYSAqIGNkO1xuXG4gICAgICAgIC8vIEZvcmNlIGNvbnRyaWJ1dGlvbi5cbiAgICAgICAgY29uc3QgZnggPSB0aGlzLl9saWZ0RGlyLnggKiBsaWZ0ICsgdGhpcy5fZHJhZ0Rpci54ICogZHJhZztcbiAgICAgICAgY29uc3QgZnkgPSB0aGlzLl9saWZ0RGlyLnkgKiBsaWZ0ICsgdGhpcy5fZHJhZ0Rpci55ICogZHJhZztcbiAgICAgICAgY29uc3QgZnogPSB0aGlzLl9saWZ0RGlyLnogKiBsaWZ0ICsgdGhpcy5fZHJhZ0Rpci56ICogZHJhZztcbiAgICAgICAgb3V0Rm9yY2UueCArPSBmeDtcbiAgICAgICAgb3V0Rm9yY2UueSArPSBmeTtcbiAgICAgICAgb3V0Rm9yY2UueiArPSBmejtcblxuICAgICAgICAvLyBNb21lbnQgYWJvdXQgQ0c6IHIgw5cgRi5cbiAgICAgICAgY29uc3QgcnggPSB0aGlzLnBvc2l0aW9uLngsIHJ5ID0gdGhpcy5wb3NpdGlvbi55LCByeiA9IHRoaXMucG9zaXRpb24uejtcbiAgICAgICAgb3V0TW9tZW50LnggKz0gcnkgKiBmeiAtIHJ6ICogZnk7XG4gICAgICAgIG91dE1vbWVudC55ICs9IHJ6ICogZnggLSByeCAqIGZ6O1xuICAgICAgICBvdXRNb21lbnQueiArPSByeCAqIGZ5IC0gcnkgKiBmeDtcbiAgICB9XG59XG5cbi8qKlxuICogTGlmdCBjb2VmZmljaWVudCB3aXRoIGEgbGluZWFyIHJhbmdlIGFuZCBhIHNtb290aCBwb3N0LXN0YWxsIGNvbGxhcHNlLlxuICogQmV5b25kIHRoZSBzdGFsbCBBb0EgdGhlIGNvZWZmaWNpZW50IGRlY2F5cyBsaWtlIGEgY29zaW5lIHNvIGxpZnQgZmFsbHMgb2ZmXG4gKiAoYW5kLCBjb21iaW5lZCB3aXRoIHRoZSBzZXBhcmF0ZWQtZmxvdyBkcmFnIHRlcm0sIHByb2R1Y2VzIGEgbm9zZSBkcm9wKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxpZnRDb2VmZmljaWVudChhb2FSYWQ6IG51bWJlciwgc2xvcGVQZXJSYWQ6IG51bWJlciwgc3RhbGxSYWQ6IG51bWJlcik6IG51bWJlciB7XG4gICAgY29uc3QgbWFnID0gTWF0aC5hYnMoYW9hUmFkKTtcbiAgICBjb25zdCBzaWduID0gTWF0aC5zaWduKGFvYVJhZCk7XG4gICAgaWYgKG1hZyA8PSBzdGFsbFJhZCkge1xuICAgICAgICByZXR1cm4gc2xvcGVQZXJSYWQgKiBhb2FSYWQ7XG4gICAgfVxuICAgIGNvbnN0IHBlYWsgPSBzbG9wZVBlclJhZCAqIHN0YWxsUmFkO1xuICAgIC8vIERlY2F5IHRvIH4wIG92ZXIgcm91Z2hseSB0aGUgbmV4dCAzNcKwLlxuICAgIGNvbnN0IGRlY2F5ID0gTWF0aC5jb3MoKG1hZyAtIHN0YWxsUmFkKSAqIDIuMik7XG4gICAgcmV0dXJuIHNpZ24gKiBwZWFrICogTWF0aC5tYXgoMCwgZGVjYXkpO1xufVxuIiwiLyoqXG4gKiBGTTIgZmx5LWJ5LXdpcmUgLyBzdGFiaWxpdHktYXVnbWVudGF0aW9uIGNvbnRyb2wgbGF3cy5cbiAqXG4gKiBUaGUgYmFyZSBGLTE2IGFpcmZyYW1lIGlzIChieSBkZXNpZ24pIGNsb3NlIHRvIG5ldXRyYWxseS9uZWdhdGl2ZWx5IHN0YWJsZSBhbmRcbiAqIGlzIG9ubHkgZmx5YWJsZSB0aHJvdWdoIGl0cyBGQlcgc3lzdGVtLiBUaGlzIG1vZHVsZSBtYXBzIHRoZSBwaWxvdCdzIHN0aWNrIGFuZFxuICogcGVkYWwgaW5wdXRzIGludG8gY29udHJvbC1zdXJmYWNlIGNvbW1hbmRzIGFuZCBjbG9zZXMgcmF0ZS9nIGxvb3BzIGFyb3VuZCB0aGVcbiAqIGFpcmZyYW1lIHNvIHRoYXQgdGhlIGhhbmRsaW5nIHF1YWxpdGllcyDigJQgbm90IHRoZSByYXcgYWVyb2R5bmFtaWNzIOKAlCBkZWZpbmUgdGhlXG4gKiBmZWVsOlxuICogICAtIFBpdGNoOiBhIGctY29tbWFuZCBsYXcgd2l0aCBwaXRjaC1yYXRlIGRhbXBpbmcsIGFuIGFuZ2xlLW9mLWF0dGFjayBsaW1pdGVyXG4gKiAgICAgYW5kIHRoZSBzdHJ1Y3R1cmFsIGcgZW52ZWxvcGUuXG4gKiAgIC0gUm9sbDogYSByb2xsLXJhdGUgY29tbWFuZCAoY2FwcGVkIG5lYXIgfjMwMMKwL3MsIGZhZGVkIGJ5IGR5bmFtaWMgcHJlc3N1cmUsXG4gKiAgICAgTWFjaCwgYWx0aXR1ZGUgYW5kIEFvQSkgZHJpdmluZyBhaWxlcm9ucyBwbHVzIGEgZGlmZmVyZW50aWFsIHN0YWJpbGF0b3IuXG4gKiAgIC0gWWF3OiBhIHdhc2hlZC1vdXQgeWF3LXJhdGUgZGFtcGVyIHBsdXMgYW4gYWlsZXJvbi1ydWRkZXIgaW50ZXJjb25uZWN0IGZvclxuICogICAgIHR1cm4gY29vcmRpbmF0aW9uLCB3aXRoIGRpcmVjdCBwZWRhbCBhdXRob3JpdHkgb24gdG9wLlxuICpcbiAqIE91dHB1dHMgYXJlIG5vcm1hbGl6ZWQgY29tbWFuZHMgaW4gWy0xLCAxXTsgdGhlIGZsaWdodCBtb2RlbCBjb252ZXJ0cyB0aGVtIGludG9cbiAqIHBoeXNpY2FsIHN1cmZhY2UgaW5jaWRlbmNlIGZvciB0aGUgYWVybyBwYXJ0cy4gRmlyc3Qtb3JkZXIgYWN0dWF0b3IgbGFnIGlzXG4gKiBhcHBsaWVkIHNvIHN1cmZhY2VzIGNhbm5vdCBzbmFwIGluc3RhbnRhbmVvdXNseS5cbiAqL1xuaW1wb3J0IHsgY2xhbXAgfSBmcm9tICcuLi8uLi91dGlscy9tYXRoJztcbmltcG9ydCB7IGNvbXB1dGVNYWNoTnVtYmVyIH0gZnJvbSAnLi4vYWVyb1V0aWxzJztcbmltcG9ydCB7IGNvbXB1dGVGMTZDb21tYW5kZWRSb2xsUmF0ZSwgRjE2X1JPTExfQ0FUMSB9IGZyb20gJy4uL2YxNlJvbGxDb250cm9sJztcbmltcG9ydCB7IEZNMl9GQ1MgfSBmcm9tICcuL2YxNkZtMkNvbmZpZyc7XG5cbmNvbnN0IERFRyA9IE1hdGguUEkgLyAxODA7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRmNzSW5wdXQge1xuICAgIHBpdGNoU3RpY2s6IG51bWJlcjsgLy8gWy0xLCAxXSBwb3NpdGl2ZSA9IG5vc2UgdXAgLyBwdWxsXG4gICAgcm9sbFN0aWNrOiBudW1iZXI7ICAvLyBbLTEsIDFdIHBvc2l0aXZlID0gcm9sbCByaWdodFxuICAgIHlhd1BlZGFsOiBudW1iZXI7ICAgLy8gWy0xLCAxXSBwb3NpdGl2ZSA9IG5vc2UgcmlnaHRcbiAgICAvKiogQm9keSBhbmd1bGFyIHZlbG9jaXR5IGNvbXBvbmVudHMgKHJhZC9zKS4gKi9cbiAgICBwaXRjaFJhdGU6IG51bWJlcjsgIC8vIGFib3V0ICtYXG4gICAgeWF3UmF0ZTogbnVtYmVyOyAgICAvLyBhYm91dCArWVxuICAgIHJvbGxSYXRlOiBudW1iZXI7ICAgLy8gYWJvdXQgK1pcbiAgICBsb2FkRmFjdG9yRzogbnVtYmVyO1xuICAgIGFvYVJhZDogbnVtYmVyO1xuICAgIGR5bmFtaWNQcmVzc3VyZTogbnVtYmVyO1xuICAgIHFSZWY6IG51bWJlcjtcbiAgICBzcGVlZDogbnVtYmVyO1xuICAgIGFsdGl0dWRlTTogbnVtYmVyO1xuICAgIGZsYXBzRXh0ZW5kZWQ6IGJvb2xlYW47XG4gICAgbGFuZGVkOiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEZjc091dHB1dCB7XG4gICAgLyoqIEVsZXZhdG9yIGNvbW1hbmQsIHBvc2l0aXZlID0gbm9zZSB1cC4gKi9cbiAgICBlbGV2YXRvcjogbnVtYmVyO1xuICAgIC8qKiBBaWxlcm9uIGNvbW1hbmQsIHBvc2l0aXZlID0gcm9sbCByaWdodC4gKi9cbiAgICBhaWxlcm9uOiBudW1iZXI7XG4gICAgLyoqIFJ1ZGRlciBjb21tYW5kLCBwb3NpdGl2ZSA9IG5vc2UgcmlnaHQuICovXG4gICAgcnVkZGVyOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBGMTZGY3Mge1xuICAgIHByaXZhdGUgZWxldmF0b3IgPSAwO1xuICAgIHByaXZhdGUgYWlsZXJvbiA9IDA7XG4gICAgcHJpdmF0ZSBydWRkZXIgPSAwO1xuICAgIHByaXZhdGUgeWF3UmF0ZUxvd1Bhc3MgPSAwO1xuICAgIHByaXZhdGUgcGl0Y2hJbnRlZ3JhbCA9IDA7XG4gICAgcHJpdmF0ZSBwcmV2QW9hID0gMDtcbiAgICBwcml2YXRlIGFvYVJhdGVGaWx0ID0gMDtcbiAgICBwcml2YXRlIHByZXZBb2FWYWxpZCA9IGZhbHNlO1xuXG4gICAgcmVzZXQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuZWxldmF0b3IgPSAwO1xuICAgICAgICB0aGlzLmFpbGVyb24gPSAwO1xuICAgICAgICB0aGlzLnJ1ZGRlciA9IDA7XG4gICAgICAgIHRoaXMueWF3UmF0ZUxvd1Bhc3MgPSAwO1xuICAgICAgICB0aGlzLnBpdGNoSW50ZWdyYWwgPSAwO1xuICAgICAgICB0aGlzLnByZXZBb2EgPSAwO1xuICAgICAgICB0aGlzLmFvYVJhdGVGaWx0ID0gMDtcbiAgICAgICAgdGhpcy5wcmV2QW9hVmFsaWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBnZXRTdGF0ZSgpOiBGY3NPdXRwdXQge1xuICAgICAgICByZXR1cm4geyBlbGV2YXRvcjogdGhpcy5lbGV2YXRvciwgYWlsZXJvbjogdGhpcy5haWxlcm9uLCBydWRkZXI6IHRoaXMucnVkZGVyIH07XG4gICAgfVxuXG4gICAgdXBkYXRlKGlucHV0OiBGY3NJbnB1dCwgZHQ6IG51bWJlcik6IEZjc091dHB1dCB7XG4gICAgICAgIGNvbnN0IGVsZXZhdG9yVGFyZ2V0ID0gdGhpcy5waXRjaExhdyhpbnB1dCwgZHQpO1xuICAgICAgICBjb25zdCBhaWxlcm9uVGFyZ2V0ID0gdGhpcy5yb2xsTGF3KGlucHV0KTtcbiAgICAgICAgY29uc3QgcnVkZGVyVGFyZ2V0ID0gdGhpcy55YXdMYXcoaW5wdXQsIGFpbGVyb25UYXJnZXQsIGR0KTtcblxuICAgICAgICAvLyBGaXJzdC1vcmRlciBhY3R1YXRvciBsYWcgdG93YXJkIHRoZSBjb21tYW5kZWQgZGVmbGVjdGlvbi5cbiAgICAgICAgY29uc3QgYSA9IGR0IDw9IDAgPyAxIDogMSAtIE1hdGguZXhwKC1kdCAvIE1hdGgubWF4KEZNMl9GQ1MuYWN0dWF0b3JUYXVTLCAxZS0zKSk7XG4gICAgICAgIHRoaXMuZWxldmF0b3IgKz0gKGVsZXZhdG9yVGFyZ2V0IC0gdGhpcy5lbGV2YXRvcikgKiBhO1xuICAgICAgICB0aGlzLmFpbGVyb24gKz0gKGFpbGVyb25UYXJnZXQgLSB0aGlzLmFpbGVyb24pICogYTtcbiAgICAgICAgdGhpcy5ydWRkZXIgKz0gKHJ1ZGRlclRhcmdldCAtIHRoaXMucnVkZGVyKSAqIGE7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0U3RhdGUoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBnLWNvbW1hbmQgcGl0Y2ggbGF3OiBhIFBJIHJlZ3VsYXRvciBkcml2ZXMgdGhlIGxvYWQgZmFjdG9yIHRvIHRoZSBjb21tYW5kZWRcbiAgICAgKiB2YWx1ZSAoc28gbmV1dHJhbCBzdGljayBob2xkcyAxIGcgLyBsZXZlbCBmbGlnaHQgd2l0aCBubyBzdGVhZHkgZXJyb3IsIGxpa2VcbiAgICAgKiB0aGUgRi0xNidzIGludGVncmFsIHRyaW0pLCB3aXRoIHBpdGNoLXJhdGUgZGFtcGluZyBhbmQgYW4gQW9BIGxpbWl0ZXIuXG4gICAgICovXG4gICAgcHJpdmF0ZSBwaXRjaExhdyhpbnB1dDogRmNzSW5wdXQsIGR0OiBudW1iZXIpOiBudW1iZXIge1xuICAgICAgICBjb25zdCB7IG1heENvbW1hbmRHLCBtaW5Db21tYW5kRywgcGl0Y2hHR2FpbiwgcGl0Y2hJR2FpbiwgcGl0Y2hSYXRlRGFtcEdhaW4gfSA9IEZNMl9GQ1M7XG5cbiAgICAgICAgLy8gU3RpY2sgc2hhcGluZzogYSBjdWJpYyBcImV4cG9cIiAobG9nYXJpdGhtaWMtc3R5bGUpIGN1cnZlLiBOZWFyIG5ldXRyYWwgdGhlXG4gICAgICAgIC8vIHJlc3BvbnNlIGlzIGRvbWluYXRlZCBieSB0aGUgc21hbGwgKDEtZSkgbGluZWFyIHRlcm0gc28gYSBsaWdodCBwdWxsIGJhcmVseVxuICAgICAgICAvLyBjaGFuZ2VzIHRoZSBnIGNvbW1hbmQ7IGF1dGhvcml0eSByYW1wcyB1cCBzdGVlcGx5IHRvd2FyZCB0aGUgZW5kcywgYW5kIGZ1bGxcbiAgICAgICAgLy8gc3RpY2sgKMKxMSkgc3RpbGwgbWFwcyB0byDCsTEgc28gdGhlIHN0cnVjdHVyYWwgbGltaXQgcmVtYWlucyByZWFjaGFibGUuIFRoaXNcbiAgICAgICAgLy8ga2VlcHMgZmluZSBwaXRjaCBjb3JyZWN0aW9ucyBhcm91bmQgY2VudHJlIGZyb20gaGF2aW5nIGFuIG91dHNpemVkIGltcGFjdC5cbiAgICAgICAgY29uc3QgZSA9IEZNMl9GQ1MucGl0Y2hTdGlja0V4cG87XG4gICAgICAgIGNvbnN0IHNoYXBlZFN0aWNrID0gKDEgLSBlKSAqIGlucHV0LnBpdGNoU3RpY2sgKyBlICogaW5wdXQucGl0Y2hTdGljayAqKiAzO1xuXG4gICAgICAgIC8vIFN0aWNrIOKGkiBjb21tYW5kZWQgbG9hZCBmYWN0b3IgKGFib3V0IDEgZyBhdCBuZXV0cmFsIHN0aWNrKS5cbiAgICAgICAgbGV0IGNvbW1hbmRlZEc6IG51bWJlcjtcbiAgICAgICAgaWYgKHNoYXBlZFN0aWNrID49IDApIHtcbiAgICAgICAgICAgIGNvbW1hbmRlZEcgPSAxICsgc2hhcGVkU3RpY2sgKiAobWF4Q29tbWFuZEcgLSAxKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbW1hbmRlZEcgPSAxICsgc2hhcGVkU3RpY2sgKiAoMSAtIG1pbkNvbW1hbmRHKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFuZ2xlLW9mLWF0dGFjayByYXRlICjOscyHKSwgbG93LXBhc3MgZmlsdGVyZWQuIFRoaXMgaXMgdGhlIHNob3J0LXBlcmlvZFxuICAgICAgICAvLyBkYW1wZXI6IHdoZW4gdGhlIGFpcmNyYWZ0IGlzIGVuZXJneS1saW1pdGVkIGl0IGNhbm5vdCBob2xkIHRoZSBjb21tYW5kZWRcbiAgICAgICAgLy8gZywgc28gdGhlIGxvYWQtZmFjdG9yIGxvb3AgYWxvbmUgaHVudHMgYXJvdW5kIHRoZSBBb0EgbGltaXQuIERhbXBpbmcgzrHMh1xuICAgICAgICAvLyBkaXJlY3RseSBraWxscyB0aGF0IG9zY2lsbGF0aW9uIHJlZ2FyZGxlc3Mgb2YgYXZhaWxhYmxlIHRocnVzdC5cbiAgICAgICAgbGV0IGFvYVJhdGUgPSAwO1xuICAgICAgICBpZiAodGhpcy5wcmV2QW9hVmFsaWQgJiYgZHQgPiAwKSB7XG4gICAgICAgICAgICBhb2FSYXRlID0gKGlucHV0LmFvYVJhZCAtIHRoaXMucHJldkFvYSkgLyBkdDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnByZXZBb2EgPSBpbnB1dC5hb2FSYWQ7XG4gICAgICAgIHRoaXMucHJldkFvYVZhbGlkID0gdHJ1ZTtcbiAgICAgICAgY29uc3QgZkFvYSA9IGR0IDw9IDAgPyAxIDogMSAtIE1hdGguZXhwKC1kdCAvIE1hdGgubWF4KEZNMl9GQ1MuYW9hUmF0ZUZpbHRlclRhdVMsIDFlLTMpKTtcbiAgICAgICAgdGhpcy5hb2FSYXRlRmlsdCArPSAoYW9hUmF0ZSAtIHRoaXMuYW9hUmF0ZUZpbHQpICogZkFvYTtcblxuICAgICAgICAvLyBBb0EgbGltaXRlcjogZmFkZSB0aGUgbm9zZS11cCBhdXRob3JpdHkgYXMgQW9BIGFwcHJvYWNoZXMgdGhlIGxpbWl0LlxuICAgICAgICBjb25zdCBhb2FEZWcgPSBpbnB1dC5hb2FSYWQgLyBERUc7XG4gICAgICAgIGNvbnN0IGFvYUxpbWl0ZXIgPSBjbGFtcChcbiAgICAgICAgICAgIChGTTJfRkNTLmFvYUxpbWl0RGVnIC0gYW9hRGVnKSAvIChGTTJfRkNTLmFvYUxpbWl0RGVnIC0gRk0yX0ZDUy5hb2FTb2Z0RGVnKSxcbiAgICAgICAgICAgIDAsIDEsXG4gICAgICAgICk7XG4gICAgICAgIGlmIChjb21tYW5kZWRHID4gMSkge1xuICAgICAgICAgICAgY29tbWFuZGVkRyA9IDEgKyAoY29tbWFuZGVkRyAtIDEpICogYW9hTGltaXRlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGdFcnJvciA9IGNvbW1hbmRlZEcgLSBpbnB1dC5sb2FkRmFjdG9yRztcbiAgICAgICAgLy8gcGl0Y2hSYXRlIGFib3V0ICtYIGlzIG5vc2UtZG93bi1wb3NpdGl2ZSwgc28gK3BpdGNoUmF0ZSBkYW1wcyBhIG5vc2UtdXBcbiAgICAgICAgLy8gY29tbWFuZDsgLc6xzIcgdGVybSBhZGRzIGRlZGljYXRlZCBzaG9ydC1wZXJpb2QgZGFtcGluZy5cbiAgICAgICAgY29uc3QgcHJvcG9ydGlvbmFsID0gcGl0Y2hHR2FpbiAqIGdFcnJvclxuICAgICAgICAgICAgKyBwaXRjaFJhdGVEYW1wR2FpbiAqIGlucHV0LnBpdGNoUmF0ZVxuICAgICAgICAgICAgLSBGTTJfRkNTLnBpdGNoQW9hUmF0ZURhbXBHYWluICogdGhpcy5hb2FSYXRlRmlsdDtcblxuICAgICAgICAvLyBJbnRlZ3JhbCB0cmltIHdpdGggYW50aS13aW5kdXAuIEZyZWV6ZSB0aGUgYWNjdW11bGF0b3Igd2hlbmV2ZXIgdGhlIEFvQVxuICAgICAgICAvLyBsaW1pdGVyIGlzIGFjdGl2ZSAoaW4gZWl0aGVyIGVycm9yIGRpcmVjdGlvbikgYW5kIGJsZWVkIGl0IGRvd24sIHNvIGl0XG4gICAgICAgIC8vIGNhbm5vdCB3aW5kIHVwIGJlbG93IHRoZSBsaW1pdGVyIGJhbmQgYW5kIGdldCBjaG9wcGVkIGFib3ZlIGl0IOKAlCB0aGVcbiAgICAgICAgLy8gcHVtcGluZyBhY3Rpb24gdGhhdCBkcml2ZXMgdGhlIGxvdy1zcGVlZCBwaXRjaCBsaW1pdCBjeWNsZS5cbiAgICAgICAgY29uc3QgbGltaXRlckFjdGl2ZSA9IGFvYUxpbWl0ZXIgPCAwLjk5OTtcbiAgICAgICAgY29uc3QgcmF3ID0gcHJvcG9ydGlvbmFsICsgcGl0Y2hJR2FpbiAqICh0aGlzLnBpdGNoSW50ZWdyYWwgKyBnRXJyb3IgKiBkdCk7XG4gICAgICAgIGNvbnN0IG91dHB1dFNhdHVyYXRlZCA9IHJhdyA8PSAtMSB8fCByYXcgPj0gMTtcbiAgICAgICAgaWYgKCFvdXRwdXRTYXR1cmF0ZWQgJiYgIWxpbWl0ZXJBY3RpdmUpIHtcbiAgICAgICAgICAgIHRoaXMucGl0Y2hJbnRlZ3JhbCA9IGNsYW1wKHRoaXMucGl0Y2hJbnRlZ3JhbCArIGdFcnJvciAqIGR0LCAtMywgMyk7XG4gICAgICAgIH0gZWxzZSBpZiAobGltaXRlckFjdGl2ZSkge1xuICAgICAgICAgICAgY29uc3QgbGVhayA9IGR0IDw9IDAgPyAxIDogMSAtIE1hdGguZXhwKC1kdCAvIE1hdGgubWF4KEZNMl9GQ1MuaW50ZWdyYWxMZWFrVGF1UywgMWUtMykpO1xuICAgICAgICAgICAgdGhpcy5waXRjaEludGVncmFsIC09IHRoaXMucGl0Y2hJbnRlZ3JhbCAqIGxlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZWxldmF0b3IgPSBwcm9wb3J0aW9uYWwgKyBwaXRjaElHYWluICogdGhpcy5waXRjaEludGVncmFsO1xuICAgICAgICByZXR1cm4gY2xhbXAoZWxldmF0b3IsIC0xLCAxKTtcbiAgICB9XG5cbiAgICAvKiogUm9sbC1yYXRlIGNvbW1hbmQgbGF3IOKGkiBhaWxlcm9uIChhbmQgZGlmZmVyZW50aWFsIHRhaWwgdmlhIHRoZSBtb2RlbCkuICovXG4gICAgcHJpdmF0ZSByb2xsTGF3KGlucHV0OiBGY3NJbnB1dCk6IG51bWJlciB7XG4gICAgICAgIGlmIChpbnB1dC5sYW5kZWQpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG1hY2ggPSBjb21wdXRlTWFjaE51bWJlcihpbnB1dC5zcGVlZCwgaW5wdXQuYWx0aXR1ZGVNKTtcbiAgICAgICAgY29uc3QgY29tbWFuZGVkUmF0ZVJhZCA9IGNvbXB1dGVGMTZDb21tYW5kZWRSb2xsUmF0ZSh7XG4gICAgICAgICAgICBzdGljazogaW5wdXQucm9sbFN0aWNrLFxuICAgICAgICAgICAgZHluYW1pY1ByZXNzdXJlOiBpbnB1dC5keW5hbWljUHJlc3N1cmUsXG4gICAgICAgICAgICBxUmVmOiBpbnB1dC5xUmVmLFxuICAgICAgICAgICAgbWFjaCxcbiAgICAgICAgICAgIGFsdGl0dWRlTTogaW5wdXQuYWx0aXR1ZGVNLFxuICAgICAgICAgICAgYW9hUmFkOiBpbnB1dC5hb2FSYWQsXG4gICAgICAgICAgICBmbGFwc0V4dGVuZGVkOiBpbnB1dC5mbGFwc0V4dGVuZGVkLFxuICAgICAgICAgICAgbGFuZGVkOiBpbnB1dC5sYW5kZWQsXG4gICAgICAgICAgICBjb25maWc6IEYxNl9ST0xMX0NBVDEsXG4gICAgICAgIH0pO1xuICAgICAgICAvLyBDbG9zZSB0aGUgbG9vcCBvbiBib2R5IHJvbGwgcmF0ZSAoYWJvdXQgK1opLiBBIHBvc2l0aXZlIGFpbGVyb24gY29tbWFuZFxuICAgICAgICAvLyBwcm9kdWNlcyBhIE5FR0FUSVZFIHJvbGwgbW9tZW50IChzZWUgdGhlIG1vZGVsJ3MgY29udHJvbCBtYXBwaW5nKSwgc28gdGhlXG4gICAgICAgIC8vIGVycm9yIGlzIChyYXRlIOKIkiBjb21tYW5kKSB0byBrZWVwIHRoZSBmZWVkYmFjayBuZWdhdGl2ZS5cbiAgICAgICAgY29uc3QgcmF0ZUVycm9yID0gaW5wdXQucm9sbFJhdGUgLSBjb21tYW5kZWRSYXRlUmFkO1xuICAgICAgICByZXR1cm4gY2xhbXAoRk0yX0ZDUy5yb2xsUmF0ZUdhaW4gKiByYXRlRXJyb3IsIC0xLCAxKTtcbiAgICB9XG5cbiAgICAvKiogWWF3IGRhbXBlciAod2FzaGVkIG91dCkgKyBhaWxlcm9uLXJ1ZGRlciBpbnRlcmNvbm5lY3QgKyBwZWRhbC4gKi9cbiAgICBwcml2YXRlIHlhd0xhdyhpbnB1dDogRmNzSW5wdXQsIGFpbGVyb25DbWQ6IG51bWJlciwgZHQ6IG51bWJlcik6IG51bWJlciB7XG4gICAgICAgIC8vIFdhc2hvdXQ6IGhpZ2gtcGFzcyB0aGUgeWF3IHJhdGUgc28gYSBzdGVhZHkgdHVybiBpcyBub3Qgb3Bwb3NlZC5cbiAgICAgICAgY29uc3QgdGF1ID0gTWF0aC5tYXgoRk0yX0ZDUy55YXdEYW1wZXJXYXNob3V0VGF1UywgMWUtMyk7XG4gICAgICAgIGNvbnN0IGEgPSBkdCA8PSAwID8gMSA6IDEgLSBNYXRoLmV4cCgtZHQgLyB0YXUpO1xuICAgICAgICB0aGlzLnlhd1JhdGVMb3dQYXNzICs9IChpbnB1dC55YXdSYXRlIC0gdGhpcy55YXdSYXRlTG93UGFzcykgKiBhO1xuICAgICAgICBjb25zdCB5YXdSYXRlSGlnaFBhc3MgPSBpbnB1dC55YXdSYXRlIC0gdGhpcy55YXdSYXRlTG93UGFzcztcblxuICAgICAgICBjb25zdCBkYW1wZXIgPSAtRk0yX0ZDUy55YXdEYW1wZXJHYWluICogeWF3UmF0ZUhpZ2hQYXNzO1xuICAgICAgICBjb25zdCBhcmkgPSBGTTJfRkNTLmFyaUdhaW4gKiBhaWxlcm9uQ21kOyAvLyBjb29yZGluYXRlIHR1cm5zXG4gICAgICAgIGNvbnN0IHBlZGFsID0gaW5wdXQueWF3UGVkYWwgKiBGTTJfRkNTLm1heFJ1ZGRlckNtZDtcbiAgICAgICAgcmV0dXJuIGNsYW1wKHBlZGFsICsgZGFtcGVyICsgYXJpLCAtMSwgMSk7XG4gICAgfVxufVxuIiwiLyoqXG4gKiBGTTIg4oCUIEYtMTZDIHJpZ2lkLWJvZHkgXCJwYXJ0c1wiIGZsaWdodCBtb2RlbCBjb25maWd1cmF0aW9uLlxuICpcbiAqIFRoaXMgbW9kZWwgdHJlYXRzIHRoZSBhaXJjcmFmdCBhcyBhIHNpbmdsZSByaWdpZCBib2R5IHdob3NlIGFlcm9keW5hbWljXG4gKiBmb3JjZXMgYXJlIGJ1aWx0IHVwIGZyb20gZGlzY3JldGUgbGlmdGluZyBzdXJmYWNlcyAoYSBjb21wb25lbnQgYnVpbGQtdXAgL1xuICogXCJwYXJ0c1wiIG1vZGVsKS4gRWFjaCBzdXJmYWNlIGdlbmVyYXRlcyBsaWZ0IGFuZCBkcmFnIGZyb20gdGhlIExPQ0FMIGFpcmZsb3dcbiAqIGl0IGV4cGVyaWVuY2VzLCB3aGljaCBpcyB0aGUgYWlyY3JhZnQgYm9keSB2ZWxvY2l0eSBQTFVTIHRoZSBjb250cmlidXRpb24gb2ZcbiAqIHRoZSBib2R5J3MgYW5ndWxhciB2ZWxvY2l0eSBhdCB0aGUgc3VyZmFjZSBsb2NhdGlvbiAoz4kgw5cgcikuIEJlY2F1c2UgZXZlcnlcbiAqIGZvcmNlIGlzIGFwcGxpZWQgYXQgdGhlIHN1cmZhY2UncyByZWFsIGxvY2F0aW9uLCBwaXRjaGluZy9yb2xsaW5nL3lhd2luZ1xuICogTU9NRU5UUyDigJQgYW5kLCBjcnVjaWFsbHksIHRoZSBhZXJvZHluYW1pYyBEQU1QSU5HIG9mIHRob3NlIHJhdGVzIOKAlCBlbWVyZ2VcbiAqIG5hdHVyYWxseSBmcm9tIHRoZSBnZW9tZXRyeSBpbnN0ZWFkIG9mIGJlaW5nIGhhbmQtYXV0aG9yZWQuXG4gKlxuICogQm9keSBheGVzIChtYXRjaGluZyB0aGUgc2ltJ3MgVEhSRUUuanMgY29udmVudGlvbiwgc2VlIHV0aWxzL21hdGgudHMpOlxuICogICArWCA9IFJJR0hUIChvdXQgdGhlIHJpZ2h0IHdpbmcpXG4gKiAgICtZID0gVVBcbiAqICAgK1ogPSBGT1JXQVJEIChvdXQgdGhlIG5vc2UpXG4gKiBUaGlzIGlzIGEgcmlnaHQtaGFuZGVkIGZyYW1lOiBSSUdIVCDDlyBVUCA9IEZPUldBUkQuXG4gKlxuICogUmVmZXJlbmNlIGRhdGE6XG4gKiAgIC0gR2VvbWV0cnkgLyBtYXNzOiBHZW5lcmFsIER5bmFtaWNzIEYtMTZDIChKYW5lJ3MsIFVTQUYgZmFjdCBzaGVldCkuXG4gKiAgIC0gSW5lcnRpYTogTkFTQSBUUC0xNTM4IC8gU3RldmVucyAmIExld2lzIFwiQWlyY3JhZnQgQ29udHJvbCBhbmQgU2ltdWxhdGlvblwiXG4gKiAgICAgbm9taW5hbCBGLTE2IChjb252ZXJ0ZWQgZnJvbSBzbHVnwrdmdMKyIGFuZCByb3RhdGVkIGludG8gdGhlIHNpbSBib2R5IGZyYW1lKS5cbiAqICAgLSBBZXJvIGNvZWZmaWNpZW50cyB0dW5lZCB0byBSZWhtYW4sIFwiQWVyb2R5bmFtaWMgUGVyZm9ybWFuY2UgQW5hbHlzaXMgb2ZcbiAqICAgICBGLTE2QyBGaWdodGluZyBGYWxjb25cIiAoQ0QwIOKJiCAwLjAxOCwgSyDiiYggMC4xNDksIENMzrEg4omIIDMuNuKAkzUuNy9yYWQsXG4gKiAgICAgTC9EX21heCDiiYggOS434oCTMTQpIGFuZCB0aGUgc2ltJ3MgZXhpc3RpbmcgRjE2X1BST0ZJTEUgZW52ZWxvcGUuXG4gKi9cbmltcG9ydCB7IEYxNl9QUk9GSUxFIH0gZnJvbSAnLi4vZjE2UHJvZmlsZSc7XG5cbmNvbnN0IERFRyA9IE1hdGguUEkgLyAxODA7XG5cbi8qKiBSZWZlcmVuY2UgZ2VvbWV0cnkgKFNJKS4gKi9cbmV4cG9ydCBjb25zdCBGTTJfR0VPTUVUUlkgPSB7XG4gICAgbWFzc0tnOiBGMTZfUFJPRklMRS5zaW1NYXNzS2csICAgICAgLy8gfjEzLDYwOCBrZyB0eXBpY2FsIHRha2VvZmYgZ3Jvc3NcbiAgICB3aW5nQXJlYU0yOiBGMTZfUFJPRklMRS53aW5nQXJlYU0yLCAvLyAyNy44NyBtwrIgcmVmZXJlbmNlIHBsYW5mb3JtXG4gICAgd2luZ1NwYW5NOiBGMTZfUFJPRklMRS53aW5nU3Bhbk0sICAgLy8gOS40NSBtXG4gICAgbWVhbkNob3JkTTogMy40NSwgICAgICAgICAgICAgICAgICAgLy8gbWVhbiBhZXJvZHluYW1pYyBjaG9yZCAofjExLjMgZnQpXG59IGFzIGNvbnN0O1xuXG4vKipcbiAqIFByaW5jaXBhbCBtb21lbnRzIG9mIGluZXJ0aWEgaW4gdGhlIFNJTSBib2R5IGZyYW1lIChrZ8K3bcKyKS5cbiAqXG4gKiBOQVNBL1N0ZXZlbnMtTGV3aXMgRi0xNiAoYWVyb3NwYWNlIFgtZndkLFktcmlnaHQsWi1kb3duKTpcbiAqICAgSXh4KHJvbGwpPTk0OTYsIEl5eShwaXRjaCk9NTU4MTQsIEl6eih5YXcpPTYzMTAwIHNsdWfCt2Z0wrIgICjDlyAxLjM1NTgyIOKGkiBrZ8K3bcKyKVxuICogTWFwcGluZyB0byBzaW0gYXhlczogcm9sbOKGlCtaLCBwaXRjaOKGlCtYLCB5YXfihpQrWS4gVGhlIHNtYWxsIEl4eiBwcm9kdWN0IG9mXG4gKiBpbmVydGlhICjiiYgxMzMxIGtnwrdtwrIpIGlzIG5lZ2xlY3RlZCDigJQgaXQgaXMgfjIlIG9mIHRoZSB5YXcvcm9sbCBpbmVydGlhcyBhbmRcbiAqIG9ubHkgcHJvZHVjZXMgbWlub3IgaW5lcnRpYWwgcm9sbOKGlHlhdyBjcm9zcy1jb3VwbGluZy5cbiAqL1xuZXhwb3J0IGNvbnN0IEZNMl9JTkVSVElBID0ge1xuICAgIHBpdGNoOiA1NTgxNCAqIDEuMzU1ODIsIC8vIGFib3V0ICtYIChSSUdIVCkgIOKJiCA3NSw2NzIga2fCt23CslxuICAgIHlhdzogNjMxMDAgKiAxLjM1NTgyLCAgIC8vIGFib3V0ICtZIChVUCkgICAgIOKJiCA4NSw1NTIga2fCt23CslxuICAgIHJvbGw6IDk0OTYgKiAxLjM1NTgyLCAgIC8vIGFib3V0ICtaIChGT1JXQVJEKSDiiYggMTIsODc0IGtnwrdtwrJcbn0gYXMgY29uc3Q7XG5cbi8qKiBIb3cgYSBzdXJmYWNlJ3MgbGlmdCBwbGFuZSBpcyBvcmllbnRlZCBpbiB0aGUgYm9keSBmcmFtZS4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU3VyZmFjZUdlb21ldHJ5IHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgLyoqIEFwcGxpY2F0aW9uIHBvaW50IHJlbGF0aXZlIHRvIENHLCBib2R5IGZyYW1lIChtKS4gKi9cbiAgICBwb3NpdGlvbjogW251bWJlciwgbnVtYmVyLCBudW1iZXJdO1xuICAgIC8qKiBMaWZ0IGRpcmVjdGlvbiBhdCBwb3NpdGl2ZSBBb0EsIGJvZHkgZnJhbWUgdW5pdCB2ZWN0b3IuICovXG4gICAgdXA6IFtudW1iZXIsIG51bWJlciwgbnVtYmVyXTtcbiAgICAvKiogQ2hvcmQgKHplcm8tbGlmdCByZWZlcmVuY2UpIGRpcmVjdGlvbiwgYm9keSBmcmFtZSB1bml0IHZlY3RvciAobm9taW5hbGx5ICtaKS4gKi9cbiAgICBmb3J3YXJkOiBbbnVtYmVyLCBudW1iZXIsIG51bWJlcl07XG4gICAgLyoqIFBsYW5mb3JtIGFyZWEgb2YgdGhpcyBzdXJmYWNlIChtwrIpLiAqL1xuICAgIGFyZWFNMjogbnVtYmVyO1xuICAgIC8qKiBMaWZ0LWN1cnZlIHNsb3BlIChwZXIgcmFkaWFuKSBpbiB0aGUgbGluZWFyIHJhbmdlLiAqL1xuICAgIGxpZnRTbG9wZVBlclJhZDogbnVtYmVyO1xuICAgIC8qKiBTdGFsbCBhbmdsZSBvZiBhdHRhY2sgKHJhZCkuIEJleW9uZCB0aGlzLCBDTCBjb2xsYXBzZXMuICovXG4gICAgc3RhbGxBb2FSYWQ6IG51bWJlcjtcbiAgICAvKiogUHJvZmlsZSAoemVyby1saWZ0KSBkcmFnIGNvZWZmaWNpZW50IG9mIHRoaXMgc3VyZmFjZS4gKi9cbiAgICBjZDA6IG51bWJlcjtcbiAgICAvKiogSW5kdWNlZC1kcmFnIGZhY3RvcjogQ0RfaSA9IGluZHVjZWRLIMK3IENMwrIuICovXG4gICAgaW5kdWNlZEs6IG51bWJlcjtcbiAgICAvKiogzpRBb0EgKHJhZCkgcHJvZHVjZWQgcGVyIHVuaXQgY29udHJvbCBkZWZsZWN0aW9uIFstMSwxXSAoMCA9IG5vIGNvbnRyb2wpLiAqL1xuICAgIGNvbnRyb2xFZmZlY3RpdmVuZXNzOiBudW1iZXI7XG59XG5cbi8qKlxuICogVGhlIEYtMTYgYXMgYSBzZXQgb2YgcmlnaWQgbGlmdGluZyBzdXJmYWNlcy5cbiAqXG4gKiBMYXRlcmFsIHNwbGl0IG9mIHRoZSB3aW5nIGFuZCBob3Jpem9udGFsIHRhaWwgaXMgZGVsaWJlcmF0ZTogaXQgbGV0cyByb2xsXG4gKiBkYW1waW5nLCBkaWZmZXJlbnRpYWwtdGFpbCAodGFpbGVyb24pIHJvbGwgYXV0aG9yaXR5IGFuZCBkaWhlZHJhbC9zaWRlc2xpcFxuICogZWZmZWN0cyBmYWxsIG91dCBvZiB0aGUgZ2VvbWV0cnkgcmF0aGVyIHRoYW4gYmVpbmcgZmFrZWQuIFRoZSBob3Jpem9udGFsIGFuZFxuICogdmVydGljYWwgdGFpbHMgc2l0IHdlbGwgYWZ0IG9mIHRoZSBDRyAo4oiSWikgd2hpY2ggcHJvdmlkZXMgdGhlIHN0YXRpYyBwaXRjaFxuICogYW5kIHlhdyBzdGFiaWxpdHkgYW5kIHRoZSBhZXJvZHluYW1pYyBwaXRjaC95YXcgcmF0ZSBkYW1waW5nLlxuICovXG5leHBvcnQgY29uc3QgRk0yX1NVUkZBQ0VTOiBSZWNvcmQ8c3RyaW5nLCBTdXJmYWNlR2VvbWV0cnk+ID0ge1xuICAgIC8qKlxuICAgICAqIEJsZW5kZWQgZnVzZWxhZ2UgLyBzdHJha2UgbGlmdGluZyBib2R5LiBUaGUgRi0xNiBpcyBhIGxpZnRpbmctYm9keSBkZXNpZ246XG4gICAgICogdGhlIHdpZGUgZm9yZWJvZHkgYW5kIGxlYWRpbmctZWRnZSBzdHJha2VzIGNhcnJ5IGEgbGFyZ2Ugc2hhcmUgb2YgdGhlIHRvdGFsXG4gICAgICogbGlmdC4gVGhpcyBzdXJmYWNlIGlzIHNpemVkIHNvIHRoZSBmdXNlbGFnZSBwcm9kdWNlcyB+MzAlIG9mIHRoZSBhaXJjcmFmdCdzXG4gICAgICogbGlmdCDigJQgaXRzIGxpZnQtY3VydmUgY29udHJpYnV0aW9uIChDTM6xwrdTID0gMi40IMOXIDE2LjAg4omIIDM4LjQpIGlzIDMvNyBvZiB0aGVcbiAgICAgKiBjb21iaW5lZCB3aW5nIGNvbnRyaWJ1dGlvbiAoMiDDlyA1LjIgw5cgOC42IOKJiCA4OS40KSwgc29cbiAgICAgKiAzOC40IC8gKDM4LjQgKyA4OS40KSDiiYggMC4zMCBvZiB0aGUgd2luZytib2R5IGxpZnQgdGhyb3VnaG91dCB0aGUgbGluZWFyXG4gICAgICogcmFuZ2UuIEl0IGFjdHMgYXQgdGhlIENHIChubyB0cmltIG1vbWVudCk7IHBhcmFzaXRlIGZvcm0gZHJhZyBzdGF5cyBpblxuICAgICAqIEZNMl9CT0RZX0NEMCwgc28gY2QwIGhlcmUgaXMgMCB0byBhdm9pZCBkb3VibGUtY291bnRpbmcuXG4gICAgICovXG4gICAgZnVzZWxhZ2U6IHtcbiAgICAgICAgbmFtZTogJ2Z1c2VsYWdlJyxcbiAgICAgICAgcG9zaXRpb246IFswLjAsIDAuMCwgMC4wXSxcbiAgICAgICAgdXA6IFswLCAxLCAwXSxcbiAgICAgICAgZm9yd2FyZDogWzAsIDAsIDFdLFxuICAgICAgICBhcmVhTTI6IDE2LjAsXG4gICAgICAgIGxpZnRTbG9wZVBlclJhZDogMi40LFxuICAgICAgICBzdGFsbEFvYVJhZDogNDAgKiBERUcsIC8vIGEgbG93LWFzcGVjdCBib2R5IHN0YWxscyBsYXRlIGFuZCBnZW50bHlcbiAgICAgICAgY2QwOiAwLjAsXG4gICAgICAgIGluZHVjZWRLOiAwLjI1LFxuICAgICAgICBjb250cm9sRWZmZWN0aXZlbmVzczogMCxcbiAgICB9LFxuICAgIHdpbmdMZWZ0OiB7XG4gICAgICAgIG5hbWU6ICd3aW5nTGVmdCcsXG4gICAgICAgIHBvc2l0aW9uOiBbLTIuMSwgMC4wLCAtMC4xNV0sXG4gICAgICAgIHVwOiBbMCwgMSwgMF0sXG4gICAgICAgIGZvcndhcmQ6IFswLCAwLCAxXSxcbiAgICAgICAgYXJlYU0yOiA4LjYsXG4gICAgICAgIGxpZnRTbG9wZVBlclJhZDogNS4yLFxuICAgICAgICBzdGFsbEFvYVJhZDogMjQgKiBERUcsXG4gICAgICAgIGNkMDogMC4wMDg1LFxuICAgICAgICBpbmR1Y2VkSzogMC4xMTgsXG4gICAgICAgIGNvbnRyb2xFZmZlY3RpdmVuZXNzOiAwLCAvLyBhaWxlcm9ucyBhcHBsaWVkIHNlcGFyYXRlbHkgYmVsb3dcbiAgICB9LFxuICAgIHdpbmdSaWdodDoge1xuICAgICAgICBuYW1lOiAnd2luZ1JpZ2h0JyxcbiAgICAgICAgcG9zaXRpb246IFsyLjEsIDAuMCwgLTAuMTVdLFxuICAgICAgICB1cDogWzAsIDEsIDBdLFxuICAgICAgICBmb3J3YXJkOiBbMCwgMCwgMV0sXG4gICAgICAgIGFyZWFNMjogOC42LFxuICAgICAgICBsaWZ0U2xvcGVQZXJSYWQ6IDUuMixcbiAgICAgICAgc3RhbGxBb2FSYWQ6IDI0ICogREVHLFxuICAgICAgICBjZDA6IDAuMDA4NSxcbiAgICAgICAgaW5kdWNlZEs6IDAuMTE4LFxuICAgICAgICBjb250cm9sRWZmZWN0aXZlbmVzczogMCxcbiAgICB9LFxuICAgIGh0YWlsTGVmdDoge1xuICAgICAgICBuYW1lOiAnaHRhaWxMZWZ0JyxcbiAgICAgICAgcG9zaXRpb246IFstMS41LCAwLjAsIC00LjZdLFxuICAgICAgICB1cDogWzAsIDEsIDBdLFxuICAgICAgICBmb3J3YXJkOiBbMCwgMCwgMV0sXG4gICAgICAgIGFyZWFNMjogMi45NSxcbiAgICAgICAgbGlmdFNsb3BlUGVyUmFkOiAzLjQsXG4gICAgICAgIHN0YWxsQW9hUmFkOiAyNiAqIERFRyxcbiAgICAgICAgY2QwOiAwLjAwNixcbiAgICAgICAgaW5kdWNlZEs6IDAuMTUsXG4gICAgICAgIGNvbnRyb2xFZmZlY3RpdmVuZXNzOiAwLjksIC8vIGFsbC1tb3Zpbmcgc3RhYmlsYXRvclxuICAgIH0sXG4gICAgaHRhaWxSaWdodDoge1xuICAgICAgICBuYW1lOiAnaHRhaWxSaWdodCcsXG4gICAgICAgIHBvc2l0aW9uOiBbMS41LCAwLjAsIC00LjZdLFxuICAgICAgICB1cDogWzAsIDEsIDBdLFxuICAgICAgICBmb3J3YXJkOiBbMCwgMCwgMV0sXG4gICAgICAgIGFyZWFNMjogMi45NSxcbiAgICAgICAgbGlmdFNsb3BlUGVyUmFkOiAzLjQsXG4gICAgICAgIHN0YWxsQW9hUmFkOiAyNiAqIERFRyxcbiAgICAgICAgY2QwOiAwLjAwNixcbiAgICAgICAgaW5kdWNlZEs6IDAuMTUsXG4gICAgICAgIGNvbnRyb2xFZmZlY3RpdmVuZXNzOiAwLjksXG4gICAgfSxcbiAgICB2dGFpbDoge1xuICAgICAgICBuYW1lOiAndnRhaWwnLFxuICAgICAgICBwb3NpdGlvbjogWzAuMCwgMS4xLCAtNC4zXSxcbiAgICAgICAgdXA6IFsxLCAwLCAwXSwgLy8gc2lkZSBmb3JjZSBhY3RzIGFsb25nICtYXG4gICAgICAgIGZvcndhcmQ6IFswLCAwLCAxXSxcbiAgICAgICAgYXJlYU0yOiA1LjEsXG4gICAgICAgIGxpZnRTbG9wZVBlclJhZDogMi45LFxuICAgICAgICBzdGFsbEFvYVJhZDogMzAgKiBERUcsXG4gICAgICAgIGNkMDogMC4wMDcsXG4gICAgICAgIGluZHVjZWRLOiAwLjE2LFxuICAgICAgICBjb250cm9sRWZmZWN0aXZlbmVzczogMC41NSwgLy8gcnVkZGVyXG4gICAgfSxcbn07XG5cbi8qKlxuICogQWlsZXJvbiAocm9sbCkgcGFyYW1ldGVycyDigJQgZGlmZmVyZW50aWFsIGluY2lkZW5jZSBhZGRlZCB0byBlYWNoIHdpbmcuXG4gKiBTaXplZCBzbyB0aGF0IGZ1bGwgZGVmbGVjdGlvbiBwcm9kdWNlcyByb3VnaGx5IHRoZSBGLTE2J3MgfjM2MMKwL3Mgb3Blbi1sb29wXG4gKiByb2xsIHJhdGUgKGFlcm8gcm9sbCBkYW1waW5nIGJhbGFuY2VzIGNvbnRyb2wgcG93ZXIpOyB0aGUgRkJXIHJhdGUgbG9vcCB0aGVuXG4gKiBjYXBzIHRoZSBjb21tYW5kZWQgcmF0ZSBuZWFyIDMwMMKwL3MuXG4gKi9cbmV4cG9ydCBjb25zdCBGTTJfQUlMRVJPTiA9IHtcbiAgICAvKiogzpRBb0EgKHJhZCkgYXQgZWFjaCB3aW5nIHBlciB1bml0IGFpbGVyb24gY29tbWFuZCBbLTEsMV0uICovXG4gICAgbWF4RGVmbGVjdGlvblJhZDogNC4yICogREVHLFxufSBhcyBjb25zdDtcblxuLyoqIFN5bW1ldHJpYyBmbGFwIGNhbWJlciBpbmNyZW1lbnQgKHJhZCBvZiBlZmZlY3RpdmUgd2luZyBpbmNpZGVuY2UpIHdpdGggZmxhcHMgZG93bi4gKi9cbmV4cG9ydCBjb25zdCBGTTJfRkxBUFMgPSB7XG4gICAgYW9hQmlhc1JhZDogOCAqIERFRyxcbiAgICBzdGFsbFJlZHVjdGlvblJhZDogMSAqIERFRyxcbiAgICBleHRyYUNkOiAwLjAyMCxcbn0gYXMgY29uc3Q7XG5cbi8qKiBMYW5kaW5nIGdlYXIgcGFyYXNpdGUgZHJhZyBpbmNyZW1lbnQgKENEIHJlZmVyZW5jZWQgdG8gd2luZyBhcmVhKS4gKi9cbmV4cG9ydCBjb25zdCBGTTJfR0VBUl9DRCA9IDAuMDIyO1xuXG4vKiogRnVzZWxhZ2UgLyBtaXNjZWxsYW5lb3VzIHBhcmFzaXRlIGRyYWcgKENEIHJlZmVyZW5jZWQgdG8gd2luZyBhcmVhKS4gKi9cbmV4cG9ydCBjb25zdCBGTTJfQk9EWV9DRDAgPSAwLjAxMDtcblxuLyoqIEV4dHJhIHRyYW5zb25pYy9zdXBlcnNvbmljIHdhdmUtZHJhZyBzY2FsZSBhcHBsaWVkIGFib3ZlIHRoZSBkaXZlcmdlbmNlIE1hY2guICovXG5leHBvcnQgY29uc3QgRk0yX1dBVkVfRFJBRyA9IHtcbiAgICBtYWNoT25zZXQ6IDAuOTUsXG4gICAgc2NhbGU6IDAuNTUsXG59IGFzIGNvbnN0O1xuXG4vKipcbiAqIEZseS1ieS13aXJlIGNvbnRyb2wtbGF3IGdhaW5zLiBUaGUgRi0xNiBpcyBhZXJvZHluYW1pY2FsbHkgcmVsYXhlZC1zdGFiaWxpdHlcbiAqIGFuZCBvbmx5IGZseWFibGUgdGhyb3VnaCBpdHMgRkJXIHN5c3RlbSwgc28gdGhlc2UgZ2FpbnMgYXJlIHdoYXQgZ2l2ZSB0aGVcbiAqIGFpcmNyYWZ0IGl0cyBoYW5kbGluZyBxdWFsaXRpZXMgKGNyaXNwIH4zMDDCsC9zIHJvbGwsIGcvQW9BLWxpbWl0ZWQgcGl0Y2gsXG4gKiBjb29yZGluYXRlZCB5YXcpIHJhdGhlciB0aGFuIHRoZSBiYXJlLWFpcmZyYW1lIHJlc3BvbnNlLlxuICovXG5leHBvcnQgY29uc3QgRk0yX0ZDUyA9IHtcbiAgICAvKiogUG9zaXRpdmUvbmVnYXRpdmUgc3RydWN0dXJhbCBnIGNvbW1hbmQgbGltaXRzLiAqL1xuICAgIG1heENvbW1hbmRHOiBGMTZfUFJPRklMRS5tYXhMb2FkRmFjdG9yRywgLy8gOS41XG4gICAgbWluQ29tbWFuZEc6IC0zLjAsXG4gICAgLyoqIENvbW1hbmQgQW9BIGxpbWl0ZXIgKGRlZykuIFdpZGVuZWQgZmFkZSBiYW5kIHNvIGF1dGhvcml0eSB0YXBlcnMgZ2VudGx5LiAqL1xuICAgIGFvYUxpbWl0RGVnOiAyNixcbiAgICBhb2FTb2Z0RGVnOiAxOCxcblxuICAgIC8qKlxuICAgICAqIFBpdGNoIGxvb3A6IHN0YWJpbGF0b3IgY29tbWFuZCBwZXIgdW5pdCBnIGVycm9yLCBpbnRlZ3JhbCB0cmltLCBwaXRjaC1yYXRlXG4gICAgICogZGFtcGluZywgYW5kIHN0aWNrIHNoYXBpbmcuXG4gICAgICpcbiAgICAgKiBgcGl0Y2hTdGlja0V4cG9gIGJsZW5kcyBhIGN1YmljIGludG8gdGhlIHN0aWNr4oaSZyBtYXAgKDAgPSBsaW5lYXIsIDEgPSBwdXJlXG4gICAgICogY3ViaWMpIHNvIHNtYWxsIGRlZmxlY3Rpb25zIGFyZSB2ZXJ5IGdlbnRsZSDigJQgYSBsb2dhcml0aG1pYy1zdHlsZSBmZWVsIHdoZXJlIGFcbiAgICAgKiBsaWdodCBwdWxsIG5lYXIgY2VudHJlIGJhcmVseSBtb3ZlcyB0aGUgZyBjb21tYW5kIOKAlCB3aGlsZSBmdWxsIHN0aWNrIHN0aWxsXG4gICAgICogcmVhY2hlcyB0aGUgc3RydWN0dXJhbCBsaW1pdC5cbiAgICAgKiBgaW50ZWdyYWxMZWFrVGF1U2AgYmxlZWRzIHRoZSB0cmltIGludGVncmF0b3IgZG93biB3aGlsZSB0aGUgQW9BIGxpbWl0ZXIgaXNcbiAgICAgKiBhY3RpdmUsIHByZXZlbnRpbmcgd2luZC11cCBhZ2FpbnN0IHRoZSBsaW1pdCAodGhlIGNhdXNlIG9mIHRoZSBwaXRjaCBodW50aW5nKS5cbiAgICAgKi9cbiAgICBwaXRjaEdHYWluOiAwLjE0LFxuICAgIHBpdGNoSUdhaW46IDAuNixcbiAgICBwaXRjaFJhdGVEYW1wR2FpbjogMS4xLFxuICAgIHBpdGNoQW9hUmF0ZURhbXBHYWluOiA0LjUsXG4gICAgYW9hUmF0ZUZpbHRlclRhdVM6IDAuMDUsXG4gICAgcGl0Y2hTdGlja0V4cG86IDAuOTIsXG4gICAgaW50ZWdyYWxMZWFrVGF1UzogMC4zNSxcbiAgICBtYXhTdGFiaWxhdG9yUmFkOiAyNSAqIERFRyxcblxuICAgIC8qKiBSb2xsIGxvb3A6IHJhdGUgY29tbWFuZCBhbmQgcHJvcG9ydGlvbmFsIGdhaW4gdG8gYWlsZXJvbi90YWlsZXJvbi4gKi9cbiAgICBtYXhSb2xsUmF0ZURlZ1M6IEYxNl9QUk9GSUxFLm1heFJvbGxSYXRlRGVnUywgLy8gMzAwXG4gICAgcm9sbFJhdGVHYWluOiAwLjgsXG4gICAgcm9sbERhbXBlckdhaW46IDAuMDYsXG4gICAgLyoqIEZyYWN0aW9uIG9mIHJvbGwgY29tbWFuZCByb3V0ZWQgdG8gdGhlIGRpZmZlcmVudGlhbCBzdGFiaWxhdG9yICh0YWlsZXJvbikuICovXG4gICAgdGFpbGVyb25Sb2xsRnJhY3Rpb246IDAuMTIsXG5cbiAgICAvKiogWWF3IGxvb3A6IHBlZGFsIGF1dGhvcml0eSwgeWF3LXJhdGUgZGFtcGVyICh3YXNoZWQgb3V0KSwgYWlsZXJvbi1ydWRkZXIgaW50ZXJjb25uZWN0LiAqL1xuICAgIG1heFJ1ZGRlckNtZDogMS4wLFxuICAgIHlhd0RhbXBlckdhaW46IDEuNixcbiAgICB5YXdEYW1wZXJXYXNob3V0VGF1UzogMS4wLFxuICAgIGFyaUdhaW46IDAuMTAsXG5cbiAgICAvKiogQWN0dWF0b3IgZmlyc3Qtb3JkZXIgbGFnIHRpbWUgY29uc3RhbnQgKHMpLiAqL1xuICAgIGFjdHVhdG9yVGF1UzogMC4wNSxcbn0gYXMgY29uc3Q7XG4iLCIvKipcbiAqIEdlbmVyaWMgNi1ET0YgcmlnaWQgYm9keSBpbnRlZ3JhdG9yIChOZXd0b27igJNFdWxlcikuXG4gKlxuICogVHJhbnNsYXRpb25hbCBkeW5hbWljcyBhcmUgaW50ZWdyYXRlZCBpbiB0aGUgV09STEQgZnJhbWUgKHNvIHRoZSByZXN1bHQgbWFwc1xuICogZGlyZWN0bHkgb250byB0aGUgc2ltJ3Mgd29ybGQtc3BhY2UgdmVsb2NpdHkvcG9zaXRpb24pLiBSb3RhdGlvbmFsIGR5bmFtaWNzXG4gKiBhcmUgaW50ZWdyYXRlZCBpbiB0aGUgQk9EWSBmcmFtZSwgd2hpY2ggaXMgdGhlIG5hdHVyYWwgZnJhbWUgZm9yIHRoZSBpbmVydGlhXG4gKiB0ZW5zb3IgYW5kIGZvciBFdWxlcidzIGVxdWF0aW9uOlxuICpcbiAqICAgICBJIMK3IM+JzIcgPSBNIOKIkiDPiSDDlyAoSSDCtyDPiSlcbiAqXG4gKiB3aXRoIGEgZGlhZ29uYWwgaW5lcnRpYSB0ZW5zb3IgSSA9IGRpYWcoSXgsIEl5LCBJeikuIFRoZSDPiSDDlyAoScK3z4kpXG4gKiBneXJvc2NvcGljIHRlcm0gY291cGxlcyB0aGUgYXhlcyBhbmQgcmVwcm9kdWNlcyBlZmZlY3RzIHN1Y2ggYXMgaW5lcnRpYWxcbiAqIHBpdGNoLXVwIGluIGEgcm9sbGluZyBwdWxsLiBPcmllbnRhdGlvbiBpcyBhZHZhbmNlZCBieSBjb21wb3NpbmcgdGhlIGJvZHlcbiAqIHF1YXRlcm5pb24gd2l0aCB0aGUgaW5jcmVtZW50YWwgcm90YXRpb24gZXhwKMK9IM+JIGR0KS5cbiAqL1xuaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEluZXJ0aWFEaWFnb25hbCB7XG4gICAgLyoqIE1vbWVudCBvZiBpbmVydGlhIGFib3V0IGJvZHkgK1ggKFJJR0hUIC8gcGl0Y2ggYXhpcykuICovXG4gICAgeDogbnVtYmVyO1xuICAgIC8qKiBNb21lbnQgb2YgaW5lcnRpYSBhYm91dCBib2R5ICtZIChVUCAvIHlhdyBheGlzKS4gKi9cbiAgICB5OiBudW1iZXI7XG4gICAgLyoqIE1vbWVudCBvZiBpbmVydGlhIGFib3V0IGJvZHkgK1ogKEZPUldBUkQgLyByb2xsIGF4aXMpLiAqL1xuICAgIHo6IG51bWJlcjtcbn1cblxuZXhwb3J0IGNsYXNzIFJpZ2lkQm9keSB7XG4gICAgcmVhZG9ubHkgbWFzczogbnVtYmVyO1xuICAgIHJlYWRvbmx5IGluZXJ0aWE6IEluZXJ0aWFEaWFnb25hbDtcblxuICAgIC8qKiBPcmllbnRhdGlvbjogYm9keSDihpIgd29ybGQuICovXG4gICAgcmVhZG9ubHkgb3JpZW50YXRpb24gPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuICAgIC8qKiBMaW5lYXIgdmVsb2NpdHksIHdvcmxkIGZyYW1lIChtL3MpLiAqL1xuICAgIHJlYWRvbmx5IHZlbG9jaXR5V29ybGQgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIC8qKiBBbmd1bGFyIHZlbG9jaXR5LCBib2R5IGZyYW1lIChyYWQvcyk6IChwaXRjaCwgeWF3LCByb2xsKSBhYm91dCAoWCwgWSwgWikuICovXG4gICAgcmVhZG9ubHkgYW5ndWxhclZlbG9jaXR5Qm9keSA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IF9pdyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSByZWFkb25seSBfZ3lybyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSByZWFkb25seSBfYW5nQWNjZWwgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgX2RxID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9heGlzID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuICAgIGNvbnN0cnVjdG9yKG1hc3M6IG51bWJlciwgaW5lcnRpYTogSW5lcnRpYURpYWdvbmFsKSB7XG4gICAgICAgIHRoaXMubWFzcyA9IG1hc3M7XG4gICAgICAgIHRoaXMuaW5lcnRpYSA9IGluZXJ0aWE7XG4gICAgfVxuXG4gICAgcmVzZXQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMub3JpZW50YXRpb24uaWRlbnRpdHkoKTtcbiAgICAgICAgdGhpcy52ZWxvY2l0eVdvcmxkLnNldCgwLCAwLCAwKTtcbiAgICAgICAgdGhpcy5hbmd1bGFyVmVsb2NpdHlCb2R5LnNldCgwLCAwLCAwKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZHZhbmNlIHRoZSByb3RhdGlvbmFsIHN0YXRlLlxuICAgICAqIEBwYXJhbSBtb21lbnRCb2R5IE5ldCBtb21lbnQgYWJvdXQgdGhlIENHLCBib2R5IGZyYW1lIChOwrdtKS5cbiAgICAgKiBAcGFyYW0gZHQgICAgICAgICBUaW1lc3RlcCAocykuXG4gICAgICovXG4gICAgaW50ZWdyYXRlQW5ndWxhcihtb21lbnRCb2R5OiBUSFJFRS5WZWN0b3IzLCBkdDogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHcgPSB0aGlzLmFuZ3VsYXJWZWxvY2l0eUJvZHk7XG4gICAgICAgIGNvbnN0IEkgPSB0aGlzLmluZXJ0aWE7XG5cbiAgICAgICAgLy8gSc+JIGFuZCB0aGUgZ3lyb3Njb3BpYyB0ZXJtIM+JIMOXIChJz4kpLlxuICAgICAgICB0aGlzLl9pdy5zZXQoSS54ICogdy54LCBJLnkgKiB3LnksIEkueiAqIHcueik7XG4gICAgICAgIHRoaXMuX2d5cm8uY3Jvc3NWZWN0b3JzKHcsIHRoaXMuX2l3KTtcblxuICAgICAgICAvLyDPicyHID0gSeKBu8K5IChNIOKIkiDPiSDDlyBJz4kpXG4gICAgICAgIHRoaXMuX2FuZ0FjY2VsLnNldChcbiAgICAgICAgICAgIChtb21lbnRCb2R5LnggLSB0aGlzLl9neXJvLngpIC8gSS54LFxuICAgICAgICAgICAgKG1vbWVudEJvZHkueSAtIHRoaXMuX2d5cm8ueSkgLyBJLnksXG4gICAgICAgICAgICAobW9tZW50Qm9keS56IC0gdGhpcy5fZ3lyby56KSAvIEkueixcbiAgICAgICAgKTtcblxuICAgICAgICB3LmFkZFNjYWxlZFZlY3Rvcih0aGlzLl9hbmdBY2NlbCwgZHQpO1xuXG4gICAgICAgIC8vIEFkdmFuY2Ugb3JpZW50YXRpb24gYnkgdGhlIGluY3JlbWVudGFsIGJvZHktZnJhbWUgcm90YXRpb24uXG4gICAgICAgIGNvbnN0IG9tZWdhID0gdy5sZW5ndGgoKTtcbiAgICAgICAgaWYgKG9tZWdhID4gMWUtOSkge1xuICAgICAgICAgICAgdGhpcy5fYXhpcy5jb3B5KHcpLm11bHRpcGx5U2NhbGFyKDEgLyBvbWVnYSk7XG4gICAgICAgICAgICB0aGlzLl9kcS5zZXRGcm9tQXhpc0FuZ2xlKHRoaXMuX2F4aXMsIG9tZWdhICogZHQpO1xuICAgICAgICAgICAgdGhpcy5vcmllbnRhdGlvbi5tdWx0aXBseSh0aGlzLl9kcSk7IC8vIGJvZHktZnJhbWUgZGVsdGEgYXBwbGllZCBvbiB0aGUgcmlnaHRcbiAgICAgICAgICAgIHRoaXMub3JpZW50YXRpb24ubm9ybWFsaXplKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZHZhbmNlIHRoZSB0cmFuc2xhdGlvbmFsIHN0YXRlLlxuICAgICAqIEBwYXJhbSBmb3JjZVdvcmxkIE5ldCBmb3JjZSBpbiB0aGUgd29ybGQgZnJhbWUgKE4pLCBncmF2aXR5IGluY2x1ZGVkLlxuICAgICAqIEBwYXJhbSBkdCAgICAgICAgIFRpbWVzdGVwIChzKS5cbiAgICAgKiBAcGFyYW0gb3V0UG9zaXRpb24gUG9zaXRpb24gYWNjdW11bGF0b3IgdG8gYWR2YW5jZSAod29ybGQsIG0pLlxuICAgICAqL1xuICAgIGludGVncmF0ZUxpbmVhcihmb3JjZVdvcmxkOiBUSFJFRS5WZWN0b3IzLCBkdDogbnVtYmVyLCBvdXRQb3NpdGlvbjogVEhSRUUuVmVjdG9yMyk6IHZvaWQge1xuICAgICAgICAvLyBhID0gRiAvIG0gOyBzZW1pLWltcGxpY2l0IEV1bGVyICh1cGRhdGUgdmVsb2NpdHksIHRoZW4gcG9zaXRpb24pLlxuICAgICAgICB0aGlzLnZlbG9jaXR5V29ybGQuYWRkU2NhbGVkVmVjdG9yKGZvcmNlV29ybGQsIGR0IC8gdGhpcy5tYXNzKTtcbiAgICAgICAgb3V0UG9zaXRpb24uYWRkU2NhbGVkVmVjdG9yKHRoaXMudmVsb2NpdHlXb3JsZCwgZHQpO1xuICAgIH1cbn1cbiIsImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcbmltcG9ydCB7IFBJVENIX1JBVEUsIFBMQU5FX0RJU1RBTkNFX1RPX0dST1VORCwgUk9MTF9SQVRFLCBZQVdfUkFURSB9IGZyb20gXCIuLi8uLi9kZWZzXCI7XG5pbXBvcnQgeyBGT1JXQVJELCBQSV9PVkVSXzE4MCwgUklHSFQsIFVQLCBaRVJPLCBjYWxjdWxhdGVQaXRjaFJvbGwsIGNsYW1wLCBlYXNlT3V0Q2lyYywgaXNaZXJvLCByb3VuZFRvWmVybyB9IGZyb20gJy4uLy4uL3V0aWxzL21hdGgnO1xuaW1wb3J0IHsgRmxpZ2h0TW9kZWwgfSBmcm9tICcuL2ZsaWdodE1vZGVsJztcblxuXG5jb25zdCBUVVJOSU5HX1JBVEUgPSBNYXRoLlBJICogMS41OyAvLyBSYWRpYW5zL3NlY29uZFxuY29uc3QgU1RBTExfUkFURSA9IE1hdGguUEkgLyA2OyAvLyBSYWRpYW5zL3NlY29uZFxuY29uc3QgSU5EVUNFRF9EUkFHX0ZBQ1RPUiA9IDEwLjA7IC8vIFVuaXRsZXNzXG5jb25zdCBST0xMX0RSQUdfRkFDVE9SID0gMC4wNTsgLy8gVW5pdGxlc3NcbmNvbnN0IEdST1VORF9GUklDVElPTl9LSU5FVElDID0gMC4xNTsgLy8gVW5pdGxlc3NcbmNvbnN0IEdST1VORF9GUklDVElPTl9TVEFUSUMgPSAwLjI7IC8vIFVuaXRsZXNzXG5jb25zdCBHUk9VTkRfQlJBS0VfS0lORVRJQyA9IDEuODtcbmNvbnN0IEdST1VORF9CUkFLRV9TVEFUSUMgPSAxLjE3O1xuY29uc3QgVEhST1RUTEVfVVBfUkFURSA9IDAuMDI7IC8vIFVuaXRzL3NlY29uZFxuY29uc3QgVEhST1RUTEVfRE9XTl9SQVRFID0gMC4wNzsgLy8gVW5pdHMvc2Vjb25kXG5jb25zdCBZQVdfUkFURV9MQU5ERUQgPSBZQVdfUkFURSAqIDIuMDsgLy8gUmFkaWFucy9zZWNvbmRcblxuY29uc3QgTUFYX1RIUlVTVCA9IDIwOyAvLyBtL3NeMlxuY29uc3QgRFJZX01BU1M6IG51bWJlciA9IDIwMDAwOyAvLyBrZ1xuY29uc3QgV0lOR19BUkVBOiBudW1iZXIgPSA3ODsgLy8gbV4yXG5jb25zdCBHUk9VTkRfQUlSX0RFTlNJVFk6IG51bWJlciA9IDEuMjI1OyAvLyBrZy9tXjNcbmNvbnN0IEdSQVZJVFk6IG51bWJlciA9IDkuODsgLy8gbS9zXjJcbmNvbnN0IENEOiBudW1iZXIgPSAwLjE1OyAvLyBVbml0bGVzc1xuY29uc3QgQ0RfTEFORElOR19HRUFSX0ZBQ1RPUiA9IDAuNzU7IC8vIFVuaXRsZXNzLCBhZGRpdGl2ZVxuY29uc3QgQ0RfRkxBUFNfRkFDVE9SID0gMC40OyAvLyBVbml0bGVzcywgYWRkaXRpdmVcbmNvbnN0IExJRlRfRkxBUFNfRkFDVE9SID0gMS4yOyAvLyBVbml0bGVzc1xuY29uc3QgUk9MTF9GTEFQU19GQUNUT1IgPSAwLjY7IC8vIFVuaXRsZXNzXG5cbmNvbnN0IExBTkRFRF9NQVhfU1BFRUQgPSAxMDA7IC8vIG0vc1xuY29uc3QgTEFORElOR19NQVhfVlNQRUVEID0gNTsgLy8gbS9zXG5jb25zdCBMQU5ESU5HX01JTl9QSVRDSCA9IC01ICogUElfT1ZFUl8xODA7IC8vIFJhZGlhbnNcbmNvbnN0IExBTkRJTkdfTUFYX1JPTEwgPSA1ICogUElfT1ZFUl8xODA7IC8vIFJhZGlhbnNcblxuZXhwb3J0IGNsYXNzIEFyY2FkZUZsaWdodE1vZGVsIGV4dGVuZHMgRmxpZ2h0TW9kZWwge1xuXG4gICAgcHJpdmF0ZSBzdGFsbDogbnVtYmVyID0gMDtcblxuICAgIHByaXZhdGUgX3Y6IFRIUkVFLlZlY3RvcjMgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgX3EwOiBUSFJFRS5RdWF0ZXJuaW9uID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcbiAgICBwcml2YXRlIF9xMTogVEhSRUUuUXVhdGVybmlvbiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG4gICAgcHJpdmF0ZSBfbTogVEhSRUUuTWF0cml4NCA9IG5ldyBUSFJFRS5NYXRyaXg0KCk7XG5cbiAgICBwcml2YXRlIGRyYWc6IFRIUkVFLlZlY3RvcjMgPSBuZXcgVEhSRUUuVmVjdG9yMygpOyAvLyBOXG4gICAgcHJpdmF0ZSB0aHJ1c3Q6IFRIUkVFLlZlY3RvcjMgPSBuZXcgVEhSRUUuVmVjdG9yMygpOyAvLyBOXG4gICAgcHJpdmF0ZSB3ZWlnaHQ6IFRIUkVFLlZlY3RvcjMgPSBuZXcgVEhSRUUuVmVjdG9yMygpOyAvLyBOXG4gICAgcHJpdmF0ZSBmcmljdGlvbjogVEhSRUUuVmVjdG9yMyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7IC8vIE5cbiAgICBwcml2YXRlIGZvcmNlczogVEhSRUUuVmVjdG9yMyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7IC8vIE5cblxuICAgIHByaXZhdGUgZm9yd2FyZDogVEhSRUUuVmVjdG9yMyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSB1cDogVEhSRUUuVmVjdG9yMyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSByaWdodDogVEhSRUUuVmVjdG9yMyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cbiAgICBwcml2YXRlIHByakZvcndhcmQ6IFRIUkVFLlZlY3RvcjMgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgdmVsb2NpdHlVbml0OiBUSFJFRS5WZWN0b3IzID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLm9iai51cC5jb3B5KFVQKTtcbiAgICB9XG5cbiAgICBzdGVwKGRlbHRhOiBudW1iZXIpOiB2b2lkIHtcblxuICAgICAgICBpZiAodGhpcy5jcmFzaGVkKSByZXR1cm47XG5cbiAgICAgICAgaWYgKHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgPiB0aGlzLnRocm90dGxlKSB7XG4gICAgICAgICAgICB0aGlzLmVmZmVjdGl2ZVRocm90dGxlID0gTWF0aC5tYXgodGhpcy50aHJvdHRsZSwgdGhpcy5lZmZlY3RpdmVUaHJvdHRsZSAtIFRIUk9UVExFX0RPV05fUkFURSAqIGRlbHRhKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmVmZmVjdGl2ZVRocm90dGxlIDwgdGhpcy50aHJvdHRsZSkge1xuICAgICAgICAgICAgdGhpcy5lZmZlY3RpdmVUaHJvdHRsZSA9IE1hdGgubWluKHRoaXMudGhyb3R0bGUsIHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgKyBUSFJPVFRMRV9VUF9SQVRFICogZGVsdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5mb3J3YXJkID0gdGhpcy5mb3J3YXJkLmNvcHkoRk9SV0FSRCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMub2JqLnF1YXRlcm5pb24pO1xuICAgICAgICB0aGlzLnVwID0gdGhpcy51cC5jb3B5KFVQKS5hcHBseVF1YXRlcm5pb24odGhpcy5vYmoucXVhdGVybmlvbik7XG4gICAgICAgIHRoaXMucmlnaHQgPSB0aGlzLnJpZ2h0LmNvcHkoUklHSFQpLmFwcGx5UXVhdGVybmlvbih0aGlzLm9iai5xdWF0ZXJuaW9uKTtcblxuICAgICAgICB0aGlzLnByakZvcndhcmQgPSB0aGlzLnByakZvcndhcmQuY29weSh0aGlzLmZvcndhcmQpLnNldFkoMCk7XG4gICAgICAgIHRoaXMudmVsb2NpdHlVbml0ID0gdGhpcy52ZWxvY2l0eVVuaXQuY29weSh0aGlzLnZlbG9jaXR5KS5ub3JtYWxpemUoKTtcblxuICAgICAgICBjb25zdCBhaXJEZW5zaXR5OiBudW1iZXIgPSBHUk9VTkRfQUlSX0RFTlNJVFkgKiBNYXRoLmV4cCgtdGhpcy5vYmoucG9zaXRpb24ueSAvIDgwMDApOyAvLyBrZy9tXjNcbiAgICAgICAgLy8gVGFrZSBpbnRvIGFjY291bnQgbG93ZXIgYWlyIHRlbXBlcmF0dXJlIGF0IGhpZ2hlciBhbHRpdHVkZXNcbiAgICAgICAgY29uc3QgdGhydXN0RGVuc2l0eTogbnVtYmVyID0gR1JPVU5EX0FJUl9ERU5TSVRZICogTWF0aC5leHAoLXRoaXMub2JqLnBvc2l0aW9uLnkgKiAwLjI1IC8gODAwMCk7IC8vIGtnL21eM1xuICAgICAgICBjb25zdCBzcGVlZCA9IHRoaXMudmVsb2NpdHkubGVuZ3RoKCk7IC8vIG0vc1xuXG4gICAgICAgIGNvbnN0IHJpZ2h0UHJqVmVsb2NpdHkgPSB0aGlzLl92LmNvcHkodGhpcy52ZWxvY2l0eVVuaXQpLnByb2plY3RPblBsYW5lKHRoaXMucmlnaHQpO1xuICAgICAgICBjb25zdCBhb2FBbmdsZSA9IHJpZ2h0UHJqVmVsb2NpdHkuYW5nbGVUbyh0aGlzLmZvcndhcmQpO1xuICAgICAgICBjb25zdCBhb2FTaWduID0gcmlnaHRQcmpWZWxvY2l0eS5jcm9zcyh0aGlzLmZvcndhcmQpLmRvdCh0aGlzLnJpZ2h0KSA+IDAgPyAtMSA6IDE7XG4gICAgICAgIGNvbnN0IGFvYSA9IGFvYVNpZ24gKiBhb2FBbmdsZTtcblxuICAgICAgICAvLyBSb2xsIGNvbnRyb2xcbiAgICAgICAgaWYgKCFpc1plcm8odGhpcy5yb2xsKSAmJiAhdGhpcy5sYW5kZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IHJvbGxGbGFwRmFjdG9yID0gdGhpcy5mbGFwc0V4dGVuZGVkID8gUk9MTF9GTEFQU19GQUNUT1IgOiAxLjA7XG4gICAgICAgICAgICB0aGlzLm9iai5yb3RhdGVaKHRoaXMucm9sbCAqIFJPTExfUkFURSAqIHJvbGxGbGFwRmFjdG9yICogZGVsdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUGl0Y2ggY29udHJvbFxuICAgICAgICBpZiAoIWlzWmVybyh0aGlzLnBpdGNoKVxuICAgICAgICAgICAgJiYgISh0aGlzLmxhbmRlZCAmJiB0aGlzLnBpdGNoIDwgMCkgLy8gQ2FuJ3QgcGl0Y2ggZG93biB3aGVuIGxhbmRlZFxuICAgICAgICAgICAgJiYgKFxuICAgICAgICAgICAgICAgIHRoaXMuc3RhbGwgPCAwIHx8IC8vIENhbiBkbyBhbnl0aGluZyB3aGVuIGZseWluZyBhbmQgbm8gc3RhbGxpbmdcbiAgICAgICAgICAgICAgICAodGhpcy5waXRjaCA8IDAgJiYgdGhpcy51cC55ID4gMCkgfHwgLy8gQ2FuJ3QgcGl0Y2ggdXAgd2hlbiBzdGFsbGluZ1xuICAgICAgICAgICAgICAgICh0aGlzLnBpdGNoID4gMCAmJiB0aGlzLnVwLnkgPCAwKSAvLyBDYW4ndCBwaXRjaCB1cCB3aGVuIHN0YWxsaW5nXG4gICAgICAgICAgICApXG4gICAgICAgICkge1xuICAgICAgICAgICAgdGhpcy5vYmoucm90YXRlWCgtdGhpcy5waXRjaCAqIFBJVENIX1JBVEUgKiBkZWx0YSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBZYXcgY29udHJvbFxuICAgICAgICBpZiAoIWlzWmVybyh0aGlzLnlhdykgJiYgIWlzWmVybyhzcGVlZCkpIHtcbiAgICAgICAgICAgIHRoaXMub2JqLnJvdGF0ZVkoLXRoaXMueWF3ICogKHRoaXMubGFuZGVkID8gWUFXX1JBVEVfTEFOREVEIDogWUFXX1JBVEUpICogZGVsdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXV0b21hdGljIHlhdyB3aGVuIHJvbGxpbmdcbiAgICAgICAgaWYgKC0wLjk5IDwgdGhpcy5mb3J3YXJkLnkgJiYgdGhpcy5mb3J3YXJkLnkgPCAwLjk5KSB7XG4gICAgICAgICAgICBjb25zdCBwcmpVcCA9IHRoaXMuX3YuY29weSh0aGlzLnVwKS5wcm9qZWN0T25QbGFuZSh0aGlzLnByakZvcndhcmQpLnNldFkoMCk7XG4gICAgICAgICAgICBjb25zdCBzaWduID0gKHRoaXMucHJqRm9yd2FyZC54ICogcHJqVXAueiAtIHRoaXMucHJqRm9yd2FyZC56ICogcHJqVXAueCkgPiAwID8gLTEgOiAxO1xuICAgICAgICAgICAgdGhpcy5vYmoucm90YXRlT25Xb3JsZEF4aXMoVVAsIHNpZ24gKiBwcmpVcC5sZW5ndGgoKSAqIHByalVwLmxlbmd0aCgpICogdGhpcy5wcmpGb3J3YXJkLmxlbmd0aCgpICogMi4wICogWUFXX1JBVEUgKiBkZWx0YSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQb2ludCBkb3duIHdoZW4gc3RhbGxpbmdcbiAgICAgICAgaWYgKHRoaXMuc3RhbGwgPj0gMCAmJiAhdGhpcy5sYW5kZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IHkgPSB0aGlzLmZvcndhcmQueTtcbiAgICAgICAgICAgIGlmICh5ID4gLTAuOCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGdyb3VuZFJpZ2h0ID0gdGhpcy5fdi5jb3B5KHRoaXMuZm9yd2FyZCkuY3Jvc3ModGhpcy5wcmpGb3J3YXJkKS5ub3JtYWxpemUoKTtcbiAgICAgICAgICAgICAgICB0aGlzLm9iai5yb3RhdGVPbldvcmxkQXhpcyhncm91bmRSaWdodCwgU1RBTExfUkFURSAqIGRlbHRhICogKHkgPiAwID8gMSA6IC0xKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyEgVEhSVVNUXG4gICAgICAgIHJvdW5kVG9aZXJvKHRoaXMudGhydXN0LmNvcHkodGhpcy5mb3J3YXJkKS5tdWx0aXBseVNjYWxhcihcbiAgICAgICAgICAgIHRocnVzdERlbnNpdHkgKlxuICAgICAgICAgICAgTUFYX1RIUlVTVCAqXG4gICAgICAgICAgICB0aGlzLmVmZmVjdGl2ZVRocm90dGxlICpcbiAgICAgICAgICAgIERSWV9NQVNTKSk7XG4gICAgICAgIHRoaXMuZW5naW5lVGhydXN0TiA9IHRoaXMudGhydXN0Lmxlbmd0aCgpO1xuXG4gICAgICAgIC8vISBEUkFHXG4gICAgICAgIGNvbnN0IGFyY2FkZUluZHVjZWREcmFnID0gdGhpcy5mb3J3YXJkLmRvdCh0aGlzLnZlbG9jaXR5VW5pdCk7XG4gICAgICAgIGNvbnN0IGxpZnRJbmR1Y2VkRHJhZyA9IDEgLSBNYXRoLmNvcygyLjAgKiBhb2EpO1xuICAgICAgICBjb25zdCByb2xsRHJhZyA9IE1hdGguYWJzKHRoaXMucmlnaHQueSk7XG4gICAgICAgIGNvbnN0IGNkTXVsdGlwbGllciA9IDEuMCArICh0aGlzLmxhbmRpbmdHZWFyRGVwbG95ZWQgPyBDRF9MQU5ESU5HX0dFQVJfRkFDVE9SIDogMC4wKSArICh0aGlzLmZsYXBzRXh0ZW5kZWQgPyBDRF9GTEFQU19GQUNUT1IgOiAwLjApO1xuICAgICAgICByb3VuZFRvWmVybyh0aGlzLmRyYWdcbiAgICAgICAgICAgIC5jb3B5KHRoaXMudmVsb2NpdHlVbml0KVxuICAgICAgICAgICAgLm5lZ2F0ZSgpXG4gICAgICAgICAgICAubXVsdGlwbHlTY2FsYXIoXG4gICAgICAgICAgICAgICAgTWF0aC5wb3coXG4gICAgICAgICAgICAgICAgICAgIDAuNSAqIChDRCAqIGNkTXVsdGlwbGllciArIGxpZnRJbmR1Y2VkRHJhZykgKiBhaXJEZW5zaXR5ICogc3BlZWQgKiBzcGVlZCAqIFdJTkdfQVJFQSxcbiAgICAgICAgICAgICAgICAgICAgMS4wICsgSU5EVUNFRF9EUkFHX0ZBQ1RPUiAqICgxLjAgLSBhcmNhZGVJbmR1Y2VkRHJhZykgKyBST0xMX0RSQUdfRkFDVE9SICogcm9sbERyYWdcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICApXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8hIExJRlRcbiAgICAgICAgY29uc3QgYW9hTGlmdCA9IDAuMiAqIChhb2EgPCAoTWF0aC5QSSAvIDguMCkgfHwgYW9hID4gKDcgKiBNYXRoLlBJIC8gOC4wKSA/IE1hdGguc2luKDYuMCAqIGFvYSkgOiBNYXRoLnNpbigyLjAgKiBhb2EpKTtcbiAgICAgICAgY29uc3QgbWluTGlmdEZhY3RvciA9IDIuMCAqICgwLjc1ICogMC43NSArIDAuNzUpICogR1JPVU5EX0FJUl9ERU5TSVRZO1xuICAgICAgICBjb25zdCBmd2RZID0gdGhpcy5mb3J3YXJkLnk7XG4gICAgICAgIGNvbnN0IHJpZ2h0WSA9IE1hdGguYWJzKHRoaXMucmlnaHQueSk7XG4gICAgICAgIGNvbnN0IGxpZnRGYWN0b3IgPSAyICogKHNwZWVkIC8gMjU2LjApICogKCgtMC41ICogZndkWSArIDEuNSkgKiAoLTAuNSAqIHJpZ2h0WSArIDEuNSkgKyAoLTAuNSAqIHJpZ2h0WSArIDEuNSkpICogYWlyRGVuc2l0eTtcbiAgICAgICAgY29uc3QgbGlmdEZhY3Rvck11bHRpcGxpZXIgPSB0aGlzLmZsYXBzRXh0ZW5kZWQgPyBMSUZUX0ZMQVBTX0ZBQ1RPUiA6IDEuMDtcbiAgICAgICAgdGhpcy5zdGFsbCA9IC1jbGFtcChsaWZ0RmFjdG9yICogbGlmdEZhY3Rvck11bHRpcGxpZXIgLyBtaW5MaWZ0RmFjdG9yICsgYW9hTGlmdCAqICgxLjAgLSByaWdodFkpIC0gMS4wLCAtMS4wLCAxLjApO1xuXG4gICAgICAgIC8vISBXRUlHSFRcbiAgICAgICAgY29uc3Qgd2VpZ2h0RndkRmFjdG9yID0gLXRoaXMuZm9yd2FyZC55O1xuICAgICAgICAvLyBBY2NvdW50cyBmb3IgbGlmdC4gNTAwIGtub3RzIC0+IDI1NiBtL3NcbiAgICAgICAgY29uc3Qgd2VpZ2h0RG93bkZhY3RvciA9IC1lYXNlT3V0Q2lyYygxLjAgLSBjbGFtcCgoc3BlZWQgLyAyNTYpICogKDEuMCAtIE1hdGguYWJzKHRoaXMuZm9yd2FyZC55KSAqICgxLjAgLSBNYXRoLmFicyh0aGlzLnJpZ2h0LnkpKSksIDAsIDEpKTtcbiAgICAgICAgdGhpcy53ZWlnaHRcbiAgICAgICAgICAgIC5jb3B5KFVQKVxuICAgICAgICAgICAgLm11bHRpcGx5U2NhbGFyKHdlaWdodERvd25GYWN0b3IpXG4gICAgICAgICAgICAuYWRkU2NhbGVkVmVjdG9yKHRoaXMuZm9yd2FyZCwgd2VpZ2h0RndkRmFjdG9yKVxuICAgICAgICAgICAgLm11bHRpcGx5U2NhbGFyKERSWV9NQVNTICogR1JBVklUWSk7XG5cbiAgICAgICAgLy8hIE1hZ2ljIHZlbG9jaXR5IHJvdGF0aW9uXG4gICAgICAgIGlmICghaXNaZXJvKHNwZWVkKSkge1xuICAgICAgICAgICAgaWYgKHRoaXMubGFuZGVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy52ZWxvY2l0eS5jb3B5KHRoaXMuZm9yd2FyZCkubXVsdGlwbHlTY2FsYXIoc3BlZWQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhbHBoYSA9IHRoaXMudmVsb2NpdHlVbml0LmFuZ2xlVG8odGhpcy5mb3J3YXJkKTtcbiAgICAgICAgICAgICAgICBjb25zdCB0dXJuaW5nRmFjdG9yID0gYWxwaGEgKiBUVVJOSU5HX1JBVEUgKiBkZWx0YTtcbiAgICAgICAgICAgICAgICB0aGlzLl9tLmxvb2tBdChaRVJPLCB0aGlzLmZvcndhcmQsIHRoaXMudXApO1xuICAgICAgICAgICAgICAgIHRoaXMuX3ExID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKS5zZXRGcm9tUm90YXRpb25NYXRyaXgodGhpcy5fbSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbS5sb29rQXQoWkVSTywgdGhpcy52ZWxvY2l0eVVuaXQsIHRoaXMudXApO1xuICAgICAgICAgICAgICAgIHRoaXMuX3EwID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKS5zZXRGcm9tUm90YXRpb25NYXRyaXgodGhpcy5fbSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcTAucm90YXRlVG93YXJkcyh0aGlzLl9xMSwgdHVybmluZ0ZhY3Rvcik7XG4gICAgICAgICAgICAgICAgdGhpcy5fcTEuc2V0RnJvbVJvdGF0aW9uTWF0cml4KHRoaXMuX20uaW52ZXJ0KCkpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3YuY29weSh0aGlzLnZlbG9jaXR5VW5pdClcbiAgICAgICAgICAgICAgICAgICAgLmFwcGx5UXVhdGVybmlvbih0aGlzLl9xMSlcbiAgICAgICAgICAgICAgICAgICAgLmFwcGx5UXVhdGVybmlvbih0aGlzLl9xMCk7XG4gICAgICAgICAgICAgICAgdGhpcy52ZWxvY2l0eS5jb3B5KHRoaXMuX3YpLm11bHRpcGx5U2NhbGFyKHNwZWVkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vISBBbGwgZm9yY2VzXG4gICAgICAgIHRoaXMuZm9yY2VzLnNldCgwLCAwLCAwKS5hZGQodGhpcy50aHJ1c3QpLmFkZCh0aGlzLmRyYWcpLmFkZCh0aGlzLndlaWdodCk7XG5cbiAgICAgICAgLy8hIEZSSUNUSU9OXG4gICAgICAgIGNvbnN0IG9uR3JvdW5kID0gdGhpcy5vYmoucG9zaXRpb24ueSA8PSBQTEFORV9ESVNUQU5DRV9UT19HUk9VTkQgKyAwLjA1O1xuICAgICAgICBpZiAodGhpcy5sYW5kZWQgfHwgKHRoaXMud2hlZWxCcmFrZXNBcHBsaWVkICYmIG9uR3JvdW5kKSkge1xuICAgICAgICAgICAgY29uc3Qgd2VpZ2h0TWFnbml0dWRlID0gRFJZX01BU1MgKiBHUkFWSVRZO1xuICAgICAgICAgICAgY29uc3QgcHJqRm9yY2VzID0gdGhpcy5fdi5jb3B5KHRoaXMuZm9yY2VzKS5zZXRZKDApO1xuICAgICAgICAgICAgY29uc3QgcHJqRm9yY2VzTWFnbml0dWRlID0gcHJqRm9yY2VzLmxlbmd0aCgpO1xuICAgICAgICAgICAgY29uc3QgbWF4U3RhdGljRnJpY3Rpb24gPSAodGhpcy53aGVlbEJyYWtlc0FwcGxpZWQgPyBHUk9VTkRfQlJBS0VfU1RBVElDIDogR1JPVU5EX0ZSSUNUSU9OX1NUQVRJQykgKiB3ZWlnaHRNYWduaXR1ZGU7XG4gICAgICAgICAgICBjb25zdCBraW5ldGljRnJpY3Rpb24gPSAodGhpcy53aGVlbEJyYWtlc0FwcGxpZWQgPyBHUk9VTkRfQlJBS0VfS0lORVRJQyA6IEdST1VORF9GUklDVElPTl9LSU5FVElDKSAqIHdlaWdodE1hZ25pdHVkZTtcblxuICAgICAgICAgICAgaWYgKChpc1plcm8oc3BlZWQpICYmIHByakZvcmNlc01hZ25pdHVkZSA8IG1heFN0YXRpY0ZyaWN0aW9uKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZnJpY3Rpb24uY29weShwcmpGb3JjZXMpLm5lZ2F0ZSgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZyaWN0aW9uLmNvcHkodGhpcy52ZWxvY2l0eVVuaXQpLnNldFkoMCkubmVnYXRlKCkubm9ybWFsaXplKCkubXVsdGlwbHlTY2FsYXIoa2luZXRpY0ZyaWN0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJvdW5kVG9aZXJvKHRoaXMuZnJpY3Rpb24pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5mcmljdGlvbi5zZXQoMCwgMCwgMCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyEgVGltZXN0ZXBcbiAgICAgICAgY29uc3QgYWNjZWwgPSByb3VuZFRvWmVybyh0aGlzLmZvcmNlcy5hZGQodGhpcy5mcmljdGlvbikuZGl2aWRlU2NhbGFyKERSWV9NQVNTKSk7XG4gICAgICAgIHRoaXMudmVsb2NpdHkuYWRkU2NhbGVkVmVjdG9yKGFjY2VsLCBkZWx0YSk7XG4gICAgICAgIGlmICh0aGlzLmxhbmRlZCAmJiB0aGlzLnZlbG9jaXR5LnkgPCAwKSB7XG4gICAgICAgICAgICB0aGlzLnZlbG9jaXR5LnNldFkoMCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyEgQXBwbHlcbiAgICAgICAgdGhpcy5vYmoucG9zaXRpb24uYWRkU2NhbGVkVmVjdG9yKHJvdW5kVG9aZXJvKHRoaXMudmVsb2NpdHksIHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgPiAwID8gMC4wMSA6IDAuMSksIGRlbHRhKTtcbiAgICAgICAgaWYgKHRoaXMub2JqLnBvc2l0aW9uLnkgPiBQTEFORV9ESVNUQU5DRV9UT19HUk9VTkQpIHtcbiAgICAgICAgICAgIHRoaXMubGFuZGVkID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHcm91bmQgaW50ZXJhY3Rpb25cbiAgICAgICAgaWYgKHRoaXMub2JqLnBvc2l0aW9uLnkgPCBQTEFORV9ESVNUQU5DRV9UT19HUk9VTkQpIHtcbiAgICAgICAgICAgIHRoaXMub2JqLnBvc2l0aW9uLnkgPSBQTEFORV9ESVNUQU5DRV9UT19HUk9VTkQ7XG5cbiAgICAgICAgICAgIGNvbnN0IGZvcndhcmQgPSB0aGlzLl92LmNvcHkoRk9SV0FSRCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMub2JqLnF1YXRlcm5pb24pO1xuICAgICAgICAgICAgY29uc3QgcmlnaHQgPSB0aGlzLnJpZ2h0LmNvcHkoUklHSFQpLmFwcGx5UXVhdGVybmlvbih0aGlzLm9iai5xdWF0ZXJuaW9uKTtcblxuICAgICAgICAgICAgY29uc3QgcHJqRm9yd2FyZCA9IG5ldyBUSFJFRS5WZWN0b3IzKCkuY29weShmb3J3YXJkKS5zZXRZKDApLm5vcm1hbGl6ZSgpO1xuICAgICAgICAgICAgY29uc3QgcGl0Y2hBbmdsZSA9IGZvcndhcmQuYW5nbGVUbyhwcmpGb3J3YXJkKSAqIE1hdGguc2lnbihmb3J3YXJkLnkpO1xuXG4gICAgICAgICAgICBjb25zdCBwcmpSaWdodCA9IG5ldyBUSFJFRS5WZWN0b3IzKCkuY29weShyaWdodCkuc2V0WSgwKS5ub3JtYWxpemUoKTtcbiAgICAgICAgICAgIGNvbnN0IHJvbGxBbmdsZSA9IHJpZ2h0LmFuZ2xlVG8ocHJqUmlnaHQpICogTWF0aC5zaWduKHJpZ2h0LnkpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5sYW5kaW5nR2VhckRlcGxveWVkID09PSBmYWxzZSB8fFxuICAgICAgICAgICAgICAgIHNwZWVkID4gTEFOREVEX01BWF9TUEVFRCB8fFxuICAgICAgICAgICAgICAgIHRoaXMudmVsb2NpdHkueSA8IC1MQU5ESU5HX01BWF9WU1BFRUQgfHxcbiAgICAgICAgICAgICAgICBNYXRoLmFicyhyb2xsQW5nbGUpID4gTEFORElOR19NQVhfUk9MTCB8fFxuICAgICAgICAgICAgICAgIExBTkRJTkdfTUlOX1BJVENIID4gcGl0Y2hBbmdsZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY3Jhc2hlZCA9IHRydWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChmb3J3YXJkLnkgPCAwLjApIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaGVhZGluZyA9IG5ldyBUSFJFRS5WZWN0b3IzKCkuY29weShmb3J3YXJkKS5zZXRZKDApLm5vcm1hbGl6ZSgpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9iai5xdWF0ZXJuaW9uLnNldEZyb21Vbml0VmVjdG9ycyhGT1JXQVJELCBoZWFkaW5nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy52ZWxvY2l0eS5zZXRZKDApO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhbGwgPSAtMTtcbiAgICAgICAgICAgICAgICB0aGlzLmxhbmRlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXRTdGFsbFN0YXR1cygpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5zdGFsbDtcbiAgICB9XG59IiwiaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuaW1wb3J0IHsgTUFYX0FMVElUVURFLCBNQVhfU1BFRUQsIFBJVENIX1JBVEUsIFBMQU5FX0RJU1RBTkNFX1RPX0dST1VORCwgUk9MTF9SQVRFLCBZQVdfUkFURSB9IGZyb20gXCIuLi8uLi9kZWZzXCI7XG5pbXBvcnQgeyBGT1JXQVJELCBpc1plcm8sIFVQIH0gZnJvbSAnLi4vLi4vdXRpbHMvbWF0aCc7XG5pbXBvcnQgeyBGbGlnaHRNb2RlbCB9IGZyb20gJy4vZmxpZ2h0TW9kZWwnO1xuXG5leHBvcnQgY2xhc3MgRGVidWdGbGlnaHRNb2RlbCBleHRlbmRzIEZsaWdodE1vZGVsIHtcblxuICAgIHByaXZhdGUgc3BlZWQ6IG51bWJlciA9IDA7XG5cbiAgICBwcml2YXRlIF92OiBUSFJFRS5WZWN0b3IzID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIF93OiBUSFJFRS5WZWN0b3IzID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLm9iai51cC5jb3B5KFVQKTtcbiAgICB9XG5cbiAgICBzdGVwKGRlbHRhOiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuY3Jhc2hlZCkgcmV0dXJuO1xuXG4gICAgICAgIHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgPSB0aGlzLnRocm90dGxlO1xuICAgICAgICB0aGlzLmVuZ2luZVRocnVzdE4gPSAwO1xuXG4gICAgICAgIC8vIFJvbGwgY29udHJvbFxuICAgICAgICBpZiAoIWlzWmVybyh0aGlzLnJvbGwpKSB7XG4gICAgICAgICAgICB0aGlzLm9iai5yb3RhdGVaKHRoaXMucm9sbCAqIFJPTExfUkFURSAqIGRlbHRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFBpdGNoIGNvbnRyb2xcbiAgICAgICAgaWYgKCFpc1plcm8odGhpcy5waXRjaCkpIHtcbiAgICAgICAgICAgIHRoaXMub2JqLnJvdGF0ZVgoLXRoaXMucGl0Y2ggKiBQSVRDSF9SQVRFICogZGVsdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gWWF3IGNvbnRyb2xcbiAgICAgICAgaWYgKCFpc1plcm8odGhpcy55YXcpKSB7XG4gICAgICAgICAgICB0aGlzLm9iai5yb3RhdGVZKC10aGlzLnlhdyAqIFlBV19SQVRFICogZGVsdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXV0b21hdGljIHlhdyB3aGVuIHJvbGxpbmdcbiAgICAgICAgY29uc3QgZm9yd2FyZCA9IHRoaXMub2JqLmdldFdvcmxkRGlyZWN0aW9uKHRoaXMuX3YpO1xuICAgICAgICBpZiAoLTAuOTkgPCBmb3J3YXJkLnkgJiYgZm9yd2FyZC55IDwgMC45OSkge1xuICAgICAgICAgICAgY29uc3QgcHJqRm9yd2FyZCA9IGZvcndhcmQuc2V0WSgwKTtcbiAgICAgICAgICAgIGNvbnN0IHVwID0gdGhpcy5fdy5jb3B5KFVQKS5hcHBseVF1YXRlcm5pb24odGhpcy5vYmoucXVhdGVybmlvbik7XG4gICAgICAgICAgICBjb25zdCBwcmpVcCA9IHVwLnByb2plY3RPblBsYW5lKHByakZvcndhcmQpLnNldFkoMCk7XG4gICAgICAgICAgICBjb25zdCBzaWduID0gKHByakZvcndhcmQueCAqIHByalVwLnogLSBwcmpGb3J3YXJkLnogKiBwcmpVcC54KSA+IDAgPyAtMSA6IDE7XG4gICAgICAgICAgICB0aGlzLm9iai5yb3RhdGVPbldvcmxkQXhpcyhVUCwgc2lnbiAqIHByalVwLmxlbmd0aCgpICogcHJqVXAubGVuZ3RoKCkgKiBwcmpGb3J3YXJkLmxlbmd0aCgpICogMi4wICogWUFXX1JBVEUgKiBkZWx0YSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBNb3ZlbWVudFxuICAgICAgICB0aGlzLnNwZWVkID0gdGhpcy5lZmZlY3RpdmVUaHJvdHRsZSAqIE1BWF9TUEVFRDtcbiAgICAgICAgdGhpcy5vYmoudHJhbnNsYXRlWih0aGlzLnNwZWVkICogZGVsdGEpO1xuXG4gICAgICAgIC8vIEF2b2lkIGdyb3VuZCBjcmFzaGVzXG4gICAgICAgIGlmICh0aGlzLm9iai5wb3NpdGlvbi55IDwgUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5EKSB7XG4gICAgICAgICAgICB0aGlzLm9iai5wb3NpdGlvbi55ID0gUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5EO1xuICAgICAgICAgICAgY29uc3QgZCA9IHRoaXMub2JqLmdldFdvcmxkRGlyZWN0aW9uKHRoaXMuX3YpO1xuICAgICAgICAgICAgaWYgKGQueSA8IDAuMCkge1xuICAgICAgICAgICAgICAgIGQuc2V0WSgwKS5hZGQodGhpcy5vYmoucG9zaXRpb24pO1xuICAgICAgICAgICAgICAgIHRoaXMub2JqLmxvb2tBdChkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEF2b2lkIGZseWluZyB0b28gaGlnaFxuICAgICAgICBpZiAodGhpcy5vYmoucG9zaXRpb24ueSA+IE1BWF9BTFRJVFVERSkge1xuICAgICAgICAgICAgdGhpcy5vYmoucG9zaXRpb24ueSA9IE1BWF9BTFRJVFVERTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFZlbG9jaXR5XG4gICAgICAgIHRoaXMudmVsb2NpdHkuY29weShGT1JXQVJEKS5hcHBseVF1YXRlcm5pb24odGhpcy5vYmoucXVhdGVybmlvbikubXVsdGlwbHlTY2FsYXIodGhpcy5zcGVlZCk7XG5cbiAgICAgICAgdGhpcy5sYW5kZWQgPSB0aGlzLm9iai5wb3NpdGlvbi55IDw9IFBMQU5FX0RJU1RBTkNFX1RPX0dST1VORDtcbiAgICB9XG5cbiAgICBnZXRTdGFsbFN0YXR1cygpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gLTE7XG4gICAgfVxufVxuIiwiaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuaW1wb3J0IHsgVVAgfSBmcm9tICcuLi8uLi91dGlscy9tYXRoJztcblxuZXhwb3J0IGNvbnN0IFNJTV9GUFMgPSAxMjA7XG5jb25zdCBTSU1fREVMVEEgPSAxLjAgLyBTSU1fRlBTO1xuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgRmxpZ2h0TW9kZWwge1xuXG4gICAgcHJvdGVjdGVkIG9iaiA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuICAgIHByb3RlY3RlZCB2ZWxvY2l0eTogVEhSRUUuVmVjdG9yMyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7IC8vIG0vc1xuXG4gICAgcHJvdGVjdGVkIGNyYXNoZWQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICBwcm90ZWN0ZWQgbGFuZGVkOiBib29sZWFuID0gdHJ1ZTtcbiAgICBwcm90ZWN0ZWQgbGFuZGluZ0dlYXJEZXBsb3llZDogYm9vbGVhbiA9IHRydWU7XG4gICAgcHJvdGVjdGVkIGZsYXBzRXh0ZW5kZWQ6IGJvb2xlYW4gPSB0cnVlO1xuICAgIHByb3RlY3RlZCB3aGVlbEJyYWtlc0FwcGxpZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAgIHByb3RlY3RlZCBwaXRjaDogbnVtYmVyID0gMDsgLy8gWy0xLCAxXVxuICAgIHByb3RlY3RlZCByb2xsOiBudW1iZXIgPSAwOyAvLyBbLTEsIDFdXG4gICAgcHJvdGVjdGVkIHlhdzogbnVtYmVyID0gMDsgLy8gWy0xLCAxXVxuICAgIHByb3RlY3RlZCB0aHJvdHRsZTogbnVtYmVyID0gMDsgLy8gWzAsIDFdXG4gICAgcHJvdGVjdGVkIGVmZmVjdGl2ZVRocm90dGxlOiBudW1iZXIgPSAwOyAvLyBbMCwgMV1cblxuICAgIHByb3RlY3RlZCBhbmdsZU9mQXR0YWNrUmFkOiBudW1iZXIgPSAwO1xuICAgIHByb3RlY3RlZCBsb2FkRmFjdG9yRzogbnVtYmVyID0gMTtcbiAgICBwcm90ZWN0ZWQgZW5naW5lVGhydXN0TjogbnVtYmVyID0gMDtcblxuICAgIHByaXZhdGUgcHJldlBvc2l0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHByZXZRdWF0ZXJuaW9uID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcbiAgICBwcml2YXRlIHByZXZWZWxvY2l0eSA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSBkZWx0YVJlbWFpbmRlcjogbnVtYmVyID0gMDtcblxuICAgIGFic3RyYWN0IHN0ZXAoZGVsdGE6IG51bWJlcik6IHZvaWQ7XG5cbiAgICByZXNldCgpIHtcbiAgICAgICAgdGhpcy5vYmoucG9zaXRpb24uc2V0KDAsIDAsIDApO1xuICAgICAgICB0aGlzLm9iai5xdWF0ZXJuaW9uLnNldEZyb21BeGlzQW5nbGUoVVAsIDApO1xuICAgICAgICB0aGlzLnZlbG9jaXR5LnNldCgwLCAwLCAwKTtcbiAgICAgICAgdGhpcy5jcmFzaGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMubGFuZGVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5sYW5kaW5nR2VhckRlcGxveWVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5mbGFwc0V4dGVuZGVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy53aGVlbEJyYWtlc0FwcGxpZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5waXRjaCA9IDA7XG4gICAgICAgIHRoaXMucm9sbCA9IDA7XG4gICAgICAgIHRoaXMueWF3ID0gMDtcbiAgICAgICAgdGhpcy50aHJvdHRsZSA9IDA7XG4gICAgICAgIHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgPSAwO1xuICAgICAgICB0aGlzLmFuZ2xlT2ZBdHRhY2tSYWQgPSAwO1xuICAgICAgICB0aGlzLmxvYWRGYWN0b3JHID0gMTtcbiAgICAgICAgdGhpcy5lbmdpbmVUaHJ1c3ROID0gMDtcbiAgICAgICAgdGhpcy5kZWx0YVJlbWFpbmRlciA9IDA7XG4gICAgICAgIHRoaXMuc3luY1ByZXZpb3VzU3RhdGUoKTtcbiAgICB9XG5cbiAgICAvKiogQWxpZ24gcmVuZGVyIGludGVycG9sYXRpb24gYWZ0ZXIgdGVsZXBvcnQgb3IgYWlyYm9ybmUgc3Bhd24uICovXG4gICAgc25hcFBoeXNpY3NTdGF0ZSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5zeW5jUHJldmlvdXNTdGF0ZSgpO1xuICAgIH1cblxuICAgIHVwZGF0ZShkZWx0YTogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIHRoaXMuZGVsdGFSZW1haW5kZXIgKz0gZGVsdGE7XG4gICAgICAgIHdoaWxlICh0aGlzLmRlbHRhUmVtYWluZGVyID49IFNJTV9ERUxUQSkge1xuICAgICAgICAgICAgdGhpcy5zYXZlUHJldmlvdXNTdGF0ZSgpO1xuICAgICAgICAgICAgdGhpcy5zdGVwKFNJTV9ERUxUQSk7XG4gICAgICAgICAgICB0aGlzLmRlbHRhUmVtYWluZGVyIC09IFNJTV9ERUxUQTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiAxID0gbGF0ZXN0IHBoeXNpY3Mgc3RhdGUsIDAgPSBwcmV2aW91cyBwaHlzaWNzIHN0YXRlLiAqL1xuICAgIGdldFJlbmRlckludGVycG9sYXRpb25BbHBoYSgpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gMSAtIHRoaXMuZGVsdGFSZW1haW5kZXIgLyBTSU1fREVMVEE7XG4gICAgfVxuXG4gICAgZ2V0UmVuZGVyUG9zaXRpb24odGFyZ2V0OiBUSFJFRS5WZWN0b3IzKTogVEhSRUUuVmVjdG9yMyB7XG4gICAgICAgIHJldHVybiB0YXJnZXQubGVycFZlY3RvcnModGhpcy5wcmV2UG9zaXRpb24sIHRoaXMub2JqLnBvc2l0aW9uLCB0aGlzLmdldFJlbmRlckludGVycG9sYXRpb25BbHBoYSgpKTtcbiAgICB9XG5cbiAgICBnZXRSZW5kZXJRdWF0ZXJuaW9uKHRhcmdldDogVEhSRUUuUXVhdGVybmlvbik6IFRIUkVFLlF1YXRlcm5pb24ge1xuICAgICAgICByZXR1cm4gdGFyZ2V0LnNsZXJwUXVhdGVybmlvbnModGhpcy5wcmV2UXVhdGVybmlvbiwgdGhpcy5vYmoucXVhdGVybmlvbiwgdGhpcy5nZXRSZW5kZXJJbnRlcnBvbGF0aW9uQWxwaGEoKSk7XG4gICAgfVxuXG4gICAgZ2V0UmVuZGVyVmVsb2NpdHkodGFyZ2V0OiBUSFJFRS5WZWN0b3IzKTogVEhSRUUuVmVjdG9yMyB7XG4gICAgICAgIHJldHVybiB0YXJnZXQubGVycFZlY3RvcnModGhpcy5wcmV2VmVsb2NpdHksIHRoaXMudmVsb2NpdHksIHRoaXMuZ2V0UmVuZGVySW50ZXJwb2xhdGlvbkFscGhhKCkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2F2ZVByZXZpb3VzU3RhdGUoKTogdm9pZCB7XG4gICAgICAgIHRoaXMucHJldlBvc2l0aW9uLmNvcHkodGhpcy5vYmoucG9zaXRpb24pO1xuICAgICAgICB0aGlzLnByZXZRdWF0ZXJuaW9uLmNvcHkodGhpcy5vYmoucXVhdGVybmlvbik7XG4gICAgICAgIHRoaXMucHJldlZlbG9jaXR5LmNvcHkodGhpcy52ZWxvY2l0eSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzeW5jUHJldmlvdXNTdGF0ZSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5wcmV2UG9zaXRpb24uY29weSh0aGlzLm9iai5wb3NpdGlvbik7XG4gICAgICAgIHRoaXMucHJldlF1YXRlcm5pb24uY29weSh0aGlzLm9iai5xdWF0ZXJuaW9uKTtcbiAgICAgICAgdGhpcy5wcmV2VmVsb2NpdHkuY29weSh0aGlzLnZlbG9jaXR5KTtcbiAgICB9XG5cbiAgICBzZXRQaXRjaChwaXRjaDogbnVtYmVyKSB7XG4gICAgICAgIHRoaXMucGl0Y2ggPSBwaXRjaDtcbiAgICB9XG5cbiAgICBzZXRSb2xsKHJvbGw6IG51bWJlcikge1xuICAgICAgICB0aGlzLnJvbGwgPSByb2xsO1xuICAgIH1cblxuICAgIHNldFlhdyh5YXc6IG51bWJlcikge1xuICAgICAgICB0aGlzLnlhdyA9IHlhdztcbiAgICB9XG5cbiAgICBzZXRUaHJvdHRsZSh0aHJvdHRsZTogbnVtYmVyKSB7XG4gICAgICAgIHRoaXMudGhyb3R0bGUgPSB0aHJvdHRsZTtcbiAgICB9XG5cbiAgICAvKiogTWF0Y2ggc3Bvb2xlZCBlbmdpbmUgc3RhdGUgdG8gY29tbWFuZGVkIHRocm90dGxlIChlLmcuIGFpcmJvcm5lIHNwYXduKS4gKi9cbiAgICBzeW5jRWZmZWN0aXZlVGhyb3R0bGUoKSB7XG4gICAgICAgIHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgPSB0aGlzLnRocm90dGxlO1xuICAgIH1cblxuICAgIHNldExhbmRpbmdHZWFyRGVwbG95ZWQoZGVwbG95ZWQ6IGJvb2xlYW4pIHtcbiAgICAgICAgdGhpcy5sYW5kaW5nR2VhckRlcGxveWVkID0gZGVwbG95ZWQ7XG4gICAgfVxuXG4gICAgc2V0RmxhcHNFeHRlbmRlZChleHRlbmRlZDogYm9vbGVhbikge1xuICAgICAgICB0aGlzLmZsYXBzRXh0ZW5kZWQgPSBleHRlbmRlZDtcbiAgICB9XG5cbiAgICBzZXRXaGVlbEJyYWtlcyhhcHBsaWVkOiBib29sZWFuKSB7XG4gICAgICAgIHRoaXMud2hlZWxCcmFrZXNBcHBsaWVkID0gYXBwbGllZDtcbiAgICB9XG5cbiAgICBpc1doZWVsQnJha2VzQXBwbGllZCgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMud2hlZWxCcmFrZXNBcHBsaWVkO1xuICAgIH1cblxuICAgIHNldExhbmRlZChpc0xhbmRlZDogYm9vbGVhbikge1xuICAgICAgICB0aGlzLmxhbmRlZCA9IGlzTGFuZGVkO1xuICAgIH1cblxuICAgIGlzTGFuZGVkKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5sYW5kZWQ7XG4gICAgfVxuXG4gICAgc2V0Q3Jhc2hlZChpc0NyYXNoZWQ6IGJvb2xlYW4pIHtcbiAgICAgICAgdGhpcy5jcmFzaGVkID0gaXNDcmFzaGVkO1xuICAgIH1cblxuICAgIGlzQ3Jhc2hlZCgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3Jhc2hlZDtcbiAgICB9XG5cbiAgICBzZXQgcG9zaXRpb24ocDogVEhSRUUuVmVjdG9yMykge1xuICAgICAgICB0aGlzLm9iai5wb3NpdGlvbi5jb3B5KHApO1xuICAgIH1cblxuICAgIGdldCBwb3NpdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub2JqLnBvc2l0aW9uO1xuICAgIH1cblxuICAgIHNldCBxdWF0ZXJuaW9uKHE6IFRIUkVFLlF1YXRlcm5pb24pIHtcbiAgICAgICAgdGhpcy5vYmoucXVhdGVybmlvbi5jb3B5KHEpO1xuICAgIH1cblxuICAgIGdldCBxdWF0ZXJuaW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vYmoucXVhdGVybmlvbjtcbiAgICB9XG5cbiAgICBzZXQgdmVsb2NpdHlWZWN0b3IodjogVEhSRUUuVmVjdG9yMykge1xuICAgICAgICB0aGlzLnZlbG9jaXR5LmNvcHkodik7XG4gICAgfVxuXG4gICAgZ2V0IHZlbG9jaXR5VmVjdG9yKCkge1xuICAgICAgICByZXR1cm4gdGhpcy52ZWxvY2l0eTtcbiAgICB9XG5cbiAgICBnZXRFZmZlY3RpdmVUaHJvdHRsZSgpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5lZmZlY3RpdmVUaHJvdHRsZTtcbiAgICB9XG5cbiAgICAvLyBbLTEsMV0gLSBWYWx1ZXMgPj0gMCBtZWFuIHN0YWxsXG4gICAgYWJzdHJhY3QgZ2V0U3RhbGxTdGF0dXMoKTogbnVtYmVyO1xuXG4gICAgZ2V0QW5nbGVPZkF0dGFjaygpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5hbmdsZU9mQXR0YWNrUmFkO1xuICAgIH1cblxuICAgIGdldExvYWRGYWN0b3JHKCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLmxvYWRGYWN0b3JHO1xuICAgIH1cblxuICAgIGdldEVuZ2luZVRocnVzdEtuKCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLmVuZ2luZVRocnVzdE4gLyAxMDAwO1xuICAgIH1cblxuICAgIHVzZUYxNlRocm90dGxlRGV0ZW50cygpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHN0ZXBUaHJvdHRsZURldGVudChjdXJyZW50OiBudW1iZXIsIGRpcmVjdGlvbjogMSB8IC0xKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIE1hdGgubWF4KDAsIE1hdGgubWluKDEsIGN1cnJlbnQgKyBkaXJlY3Rpb24gKiAwLjAxKSk7XG4gICAgfVxuXG4gICAgaXNJblRocm90dGxlQWJEZXRlbnRCYW5kKF9sZXZlcjogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvKiogT3ZlcnJpZGUgaW4gbW9kZWxzIHdpdGggYSBub24tbGluZWFyIHRocm90dGxlIHF1YWRyYW50LiAqL1xuICAgIGFkanVzdFRocm90dGxlSW5wdXQoY3VycmVudDogbnVtYmVyLCBzdGVwOiBudW1iZXIpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gTWF0aC5tYXgoMCwgTWF0aC5taW4oMSwgY3VycmVudCArIHN0ZXApKTtcbiAgICB9XG5cbiAgICAvKiogT3ZlcnJpZGUgaW4gbW9kZWxzIHdpdGggYSBub24tbGluZWFyIHRocm90dGxlIHF1YWRyYW50LiAqL1xuICAgIGdldFRocm90dGxlSHVkVGV4dCgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gYFRIUiAkeygxMDAgKiB0aGlzLmVmZmVjdGl2ZVRocm90dGxlKS50b0ZpeGVkKDApfWA7XG4gICAgfVxuXG4gICAgLyoqIE5vcm1hbGl6ZWQgZW5naW5lIHBvd2VyIGZvciBhdWRpbyBbMCwgMV0uICovXG4gICAgZ2V0VGhyb3R0bGVBdWRpb0xldmVsKCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLmVmZmVjdGl2ZVRocm90dGxlO1xuICAgIH1cblxuICAgIC8qKiBDU1MgY29sb3IgZm9yIGVuZ2luZSBub3p6bGUgcmVuZGVyaW5nIChNSUwgYmxhY2sgYnkgZGVmYXVsdCkuICovXG4gICAgZ2V0RW5naW5lTm96emxlQ29sb3IoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuICcjMGEwYTBhJztcbiAgICB9XG59XG4iLCIvKipcbiAqIEZNMiDigJQgRi0xNkMgcmlnaWQtYm9keSBcInBhcnRzXCIgZmxpZ2h0IG1vZGVsLlxuICpcbiAqIFVubGlrZSB0aGUga2luZW1hdGljIFJlYWxpc3RpYyBtb2RlbCAod2hpY2ggcm90YXRlcyB0aGUgYWlyZnJhbWUgZGlyZWN0bHkgZnJvbVxuICogc3RpY2sgYXV0aG9yaXR5KSwgRk0yIGlzIGEgZ2VudWluZSA2LURPRiByaWdpZCBib2R5LiBFdmVyeSBhZXJvZHluYW1pYyBmb3JjZVxuICogaXMgcHJvZHVjZWQgYnkgYSBkaXNjcmV0ZSBsaWZ0aW5nIHN1cmZhY2UgYXQgaXRzIHJlYWwgbG9jYXRpb24sIHNvIGFsbCBtb21lbnRzXG4gKiDigJQgYW5kIHRoZSBwaXRjaC9yb2xsL3lhdyByYXRlIGRhbXBpbmcg4oCUIGVtZXJnZSBmcm9tIHRoZSBnZW9tZXRyeS4gQSBmbHktYnktd2lyZVxuICogbGF5ZXIgY2xvc2VzIHJhdGUvZyBsb29wcyBhcm91bmQgdGhlIGFpcmZyYW1lIHRvIGdpdmUgRi0xNiBoYW5kbGluZy4gTGFuZGluZ1xuICogZ2VhciBpcyBtb2RlbGxlZCBhcyBzcHJpbmctZGFtcGVyIGNvbnRhY3QgcG9pbnRzLCBzbyB3ZWlnaHQtb24td2hlZWxzLCB0YWtlb2ZmXG4gKiByb3RhdGlvbiBhbmQgZ3JvdW5kIHN0YWJpbGl0eSBhcmUgYWxzbyBqdXN0IHJpZ2lkLWJvZHkgcmVhY3Rpb25zLlxuICpcbiAqIFNlZSBwaHlzaWNzL2ZtMi8qIGZvciB0aGUgYnVpbGRpbmcgYmxvY2tzLlxuICovXG5pbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgeyBQTEFORV9ESVNUQU5DRV9UT19HUk9VTkQsIFRFUlJBSU5fTU9ERUxfU0laRSwgVEVSUkFJTl9TQ0FMRSB9IGZyb20gJy4uLy4uL2RlZnMnO1xuaW1wb3J0IHsgY2xhbXAsIEZPUldBUkQsIFJJR0hULCBVUCB9IGZyb20gJy4uLy4uL3V0aWxzL21hdGgnO1xuaW1wb3J0IHtcbiAgICBjb21wdXRlQWlyRGVuc2l0eSwgY29tcHV0ZUR5bmFtaWNQcmVzc3VyZSwgY29tcHV0ZUlzYUFpckRlbnNpdHksXG4gICAgY29tcHV0ZU1hY2hOdW1iZXIsXG59IGZyb20gJy4uL2Flcm9VdGlscyc7XG5pbXBvcnQge1xuICAgIGFkanVzdEYxNlRocm90dGxlSW5wdXQsIGNvbXB1dGVGMTZFbmdpbmVUaHJ1c3ROLCBmMTZUaHJvdHRsZUF1ZGlvTGV2ZWwsXG4gICAgZm9ybWF0RjE2VGhyb3R0bGVIdWQsIGdldEYxNkVuZ2luZU5venpsZUNvbG9yLCBnZXRGMTZUaHJvdHRsZVpvbmUsXG4gICAgaXNGMTZBYkRldGVudEJhbmQsIHN0ZXBGMTZUaHJvdHRsZURldGVudCxcbn0gZnJvbSAnLi4vZjE2RW5naW5lJztcbmltcG9ydCB7IEYxNl9QUk9GSUxFIH0gZnJvbSAnLi4vZjE2UHJvZmlsZSc7XG5pbXBvcnQgeyBBZXJvU3VyZmFjZSB9IGZyb20gJy4uL2ZtMi9hZXJvU3VyZmFjZSc7XG5pbXBvcnQgeyBGMTZGY3MgfSBmcm9tICcuLi9mbTIvZjE2RmNzJztcbmltcG9ydCB7XG4gICAgRk0yX0FJTEVST04sIEZNMl9CT0RZX0NEMCwgRk0yX0ZDUywgRk0yX0ZMQVBTLCBGTTJfR0VBUl9DRCwgRk0yX0dFT01FVFJZLFxuICAgIEZNMl9JTkVSVElBLCBGTTJfU1VSRkFDRVMsIEZNMl9XQVZFX0RSQUcsXG59IGZyb20gJy4uL2ZtMi9mMTZGbTJDb25maWcnO1xuaW1wb3J0IHsgUmlnaWRCb2R5IH0gZnJvbSAnLi4vZm0yL3JpZ2lkQm9keSc7XG5pbXBvcnQgeyBGbGlnaHRNb2RlbCB9IGZyb20gJy4vZmxpZ2h0TW9kZWwnO1xuXG5jb25zdCBHUkFWSVRZID0gOS44MDY2NTtcbmNvbnN0IERFRyA9IE1hdGguUEkgLyAxODA7XG5cbmNvbnN0IFRIUk9UVExFX1VQX1JBVEUgPSAwLjEwO1xuY29uc3QgVEhST1RUTEVfRE9XTl9SQVRFID0gMC4wNztcblxuY29uc3QgTUFYX1NUQUJJTEFUT1JfQU9BID0gRk0yX0ZDUy5tYXhTdGFiaWxhdG9yUmFkO1xuY29uc3QgTUFYX0FJTEVST05fQU9BID0gRk0yX0FJTEVST04ubWF4RGVmbGVjdGlvblJhZDtcbmNvbnN0IE1BWF9SVURERVJfQU9BID0gMjIgKiBERUc7XG5cbmNvbnN0IFFfUkVGID0gMC41ICogY29tcHV0ZUlzYUFpckRlbnNpdHkoRjE2X1BST0ZJTEUuY3J1aXNlQWx0aXR1ZGVNKSAqIEYxNl9QUk9GSUxFLmNydWlzZVNwZWVkTXBzICoqIDI7XG5jb25zdCBTVEFMTF9BT0EgPSBGMTZfUFJPRklMRS5zdGFsbEFvYURlZyAqIERFRztcbmNvbnN0IE1JTl9GTFlJTkdfU1BFRUQgPSBGMTZfUFJPRklMRS5taW5GbHlpbmdTcGVlZE1wcztcblxuLy8gTGFuZGluZy1nZWFyIHNwcmluZy1kYW1wZXIgY29udGFjdCBwb2ludHMgKGJvZHkgZnJhbWUsIG0pLiBZIOKJiCAtUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5ELlxuY29uc3QgR0VBUl9QT0lOVFM6IFtudW1iZXIsIG51bWJlciwgbnVtYmVyXVtdID0gW1xuICAgIFswLjAsIC1QTEFORV9ESVNUQU5DRV9UT19HUk9VTkQsIDIuNl0sICAgLy8gbm9zZVxuICAgIFstMS4yLCAtUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5ELCAtMC42XSwgLy8gbGVmdCBtYWluXG4gICAgWzEuMiwgLVBMQU5FX0RJU1RBTkNFX1RPX0dST1VORCwgLTAuNl0sICAvLyByaWdodCBtYWluXG5dO1xuY29uc3QgR0VBUl9TVElGRk5FU1MgPSA0LjBlNjsgICAvLyBOL21cbmNvbnN0IEdFQVJfREFNUElORyA9IDEuNmU1OyAgICAgLy8gTsK3cy9tXG5jb25zdCBHRUFSX1JPTExfRlJJQ1RJT04gPSAwLjA0O1xuY29uc3QgR0VBUl9CUkFLRV9GUklDVElPTiA9IDAuNTU7XG5jb25zdCBHRUFSX1NJREVfRlJJQ1RJT04gPSAwLjg7XG5cbi8vIFRvdWNoZG93biBsaW1pdHMgKGNyYXNoIG90aGVyd2lzZSksIG1pcnJvcmluZyB0aGUgRi0xNiBwcm9maWxlLlxuY29uc3QgTEFORElOR19NQVhfU1BFRUQgPSBGMTZfUFJPRklMRS5sYW5kaW5nTWF4U3BlZWRNcHM7XG5jb25zdCBMQU5ESU5HX01BWF9WU1BFRUQgPSBGMTZfUFJPRklMRS5sYW5kaW5nTWF4VmVydGljYWxTcGVlZE1wcztcbmNvbnN0IExBTkRJTkdfTUlOX1BJVENIID0gRjE2X1BST0ZJTEUubGFuZGluZ01pblBpdGNoRGVnICogREVHO1xuY29uc3QgTEFORElOR19NQVhfUk9MTCA9IEYxNl9QUk9GSUxFLmxhbmRpbmdNYXhSb2xsRGVnICogREVHO1xuXG5pbnRlcmZhY2UgU3VyZmFjZUNvbnRyb2xzIHtcbiAgICB3aW5nTGVmdEFvYTogbnVtYmVyO1xuICAgIHdpbmdSaWdodEFvYTogbnVtYmVyO1xuICAgIGh0YWlsTGVmdEFvYTogbnVtYmVyO1xuICAgIGh0YWlsUmlnaHRBb2E6IG51bWJlcjtcbiAgICB2dGFpbEFvYTogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgRm0yRmxpZ2h0TW9kZWwgZXh0ZW5kcyBGbGlnaHRNb2RlbCB7XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IHJiID0gbmV3IFJpZ2lkQm9keShGTTJfR0VPTUVUUlkubWFzc0tnLCB7XG4gICAgICAgIHg6IEZNMl9JTkVSVElBLnBpdGNoLFxuICAgICAgICB5OiBGTTJfSU5FUlRJQS55YXcsXG4gICAgICAgIHo6IEZNMl9JTkVSVElBLnJvbGwsXG4gICAgfSk7XG4gICAgcHJpdmF0ZSByZWFkb25seSBmY3MgPSBuZXcgRjE2RmNzKCk7XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IGZ1c2VsYWdlID0gbmV3IEFlcm9TdXJmYWNlKEZNMl9TVVJGQUNFUy5mdXNlbGFnZSk7XG4gICAgcHJpdmF0ZSByZWFkb25seSB3aW5nTGVmdCA9IG5ldyBBZXJvU3VyZmFjZShGTTJfU1VSRkFDRVMud2luZ0xlZnQpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgd2luZ1JpZ2h0ID0gbmV3IEFlcm9TdXJmYWNlKEZNMl9TVVJGQUNFUy53aW5nUmlnaHQpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgaHRhaWxMZWZ0ID0gbmV3IEFlcm9TdXJmYWNlKEZNMl9TVVJGQUNFUy5odGFpbExlZnQpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgaHRhaWxSaWdodCA9IG5ldyBBZXJvU3VyZmFjZShGTTJfU1VSRkFDRVMuaHRhaWxSaWdodCk7XG4gICAgcHJpdmF0ZSByZWFkb25seSB2dGFpbCA9IG5ldyBBZXJvU3VyZmFjZShGTTJfU1VSRkFDRVMudnRhaWwpO1xuXG4gICAgcHJpdmF0ZSBzdGFsbCA9IC0xO1xuXG4gICAgLy8gU2NyYXRjaCB2ZWN0b3JzIChhdm9pZCBwZXItc3RlcCBhbGxvY2F0aW9uIGluIHRoZSB3b3JrZXIpLlxuICAgIHByaXZhdGUgcmVhZG9ubHkgdmVsQm9keSA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSByZWFkb25seSBmb3JjZUJvZHkgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgbW9tZW50Qm9keSA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSByZWFkb25seSBmb3JjZVdvcmxkID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGdlYXJGb3JjZVdvcmxkID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGdlYXJNb21lbnRCb2R5ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGludk9yaWVudCA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG4gICAgcHJpdmF0ZSByZWFkb25seSBfdXAgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgX2Z3ZCA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSByZWFkb25seSBfcmlnaHQgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgX3YgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgX3YyID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9nZWFyV29ybGQgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgX2NvbnRhY3RWZWwgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgX29tZWdhV29ybGQgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgX2ZyaWN0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLm9iai51cC5jb3B5KFVQKTtcbiAgICB9XG5cbiAgICByZXNldCgpOiB2b2lkIHtcbiAgICAgICAgc3VwZXIucmVzZXQoKTtcbiAgICAgICAgdGhpcy5yYi5yZXNldCgpO1xuICAgICAgICB0aGlzLmZjcy5yZXNldCgpO1xuICAgICAgICB0aGlzLnN0YWxsID0gLTE7XG4gICAgfVxuXG4gICAgc3RlcChkZWx0YTogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLmNyYXNoZWQpIHJldHVybjtcblxuICAgICAgICB0aGlzLnNwb29sVGhyb3R0bGUoZGVsdGEpO1xuXG4gICAgICAgIC8vIEFkb3B0IGFueSBleHRlcm5hbGx5IHNldCBvcmllbnRhdGlvbiAvIHZlbG9jaXR5IGFzIHRoZSByaWdpZC1ib2R5IHN0YXRlLlxuICAgICAgICB0aGlzLnJiLm9yaWVudGF0aW9uLmNvcHkodGhpcy5vYmoucXVhdGVybmlvbik7XG4gICAgICAgIHRoaXMucmIudmVsb2NpdHlXb3JsZC5jb3B5KHRoaXMudmVsb2NpdHkpO1xuXG4gICAgICAgIGNvbnN0IGFsdGl0dWRlID0gdGhpcy5vYmoucG9zaXRpb24ueTtcbiAgICAgICAgY29uc3QgYWlyRGVuc2l0eSA9IGNvbXB1dGVBaXJEZW5zaXR5KGFsdGl0dWRlKTtcblxuICAgICAgICAvLyBCb2R5LWZyYW1lIHZlbG9jaXR5IHRocm91Z2ggdGhlIGFpci5cbiAgICAgICAgdGhpcy5pbnZPcmllbnQuY29weSh0aGlzLnJiLm9yaWVudGF0aW9uKS5pbnZlcnQoKTtcbiAgICAgICAgdGhpcy52ZWxCb2R5LmNvcHkodGhpcy5yYi52ZWxvY2l0eVdvcmxkKS5hcHBseVF1YXRlcm5pb24odGhpcy5pbnZPcmllbnQpO1xuICAgICAgICBjb25zdCBzcGVlZCA9IHRoaXMudmVsQm9keS5sZW5ndGgoKTtcblxuICAgICAgICAvLyBBaXJjcmFmdCBhbmdsZSBvZiBhdHRhY2sgKGluIHRoZSBib2R5IFgtcGxhbmUpIGFuZCBzaWRlc2xpcC5cbiAgICAgICAgY29uc3QgYW9hID0gc3BlZWQgPiAxID8gTWF0aC5hdGFuMigtdGhpcy52ZWxCb2R5LnksIHRoaXMudmVsQm9keS56KSA6IDA7XG4gICAgICAgIHRoaXMuYW5nbGVPZkF0dGFja1JhZCA9IGFvYTtcblxuICAgICAgICBjb25zdCBkeW5hbWljUHJlc3N1cmUgPSBjb21wdXRlRHluYW1pY1ByZXNzdXJlKGFpckRlbnNpdHksIHNwZWVkKTtcbiAgICAgICAgY29uc3QgbWFjaCA9IGNvbXB1dGVNYWNoTnVtYmVyKHNwZWVkLCBhbHRpdHVkZSk7XG5cbiAgICAgICAgLy8gRmx5LWJ5LXdpcmU6IHN0aWNrL3BlZGFscyArIHN0YXRlIOKGkiBzdXJmYWNlIGNvbW1hbmRzLlxuICAgICAgICBjb25zdCBmY3NPdXQgPSB0aGlzLmZjcy51cGRhdGUoe1xuICAgICAgICAgICAgcGl0Y2hTdGljazogdGhpcy5waXRjaCxcbiAgICAgICAgICAgIHJvbGxTdGljazogdGhpcy5yb2xsLFxuICAgICAgICAgICAgeWF3UGVkYWw6IHRoaXMueWF3LFxuICAgICAgICAgICAgcGl0Y2hSYXRlOiB0aGlzLnJiLmFuZ3VsYXJWZWxvY2l0eUJvZHkueCxcbiAgICAgICAgICAgIHlhd1JhdGU6IHRoaXMucmIuYW5ndWxhclZlbG9jaXR5Qm9keS55LFxuICAgICAgICAgICAgcm9sbFJhdGU6IHRoaXMucmIuYW5ndWxhclZlbG9jaXR5Qm9keS56LFxuICAgICAgICAgICAgbG9hZEZhY3Rvckc6IHRoaXMubG9hZEZhY3RvckcsXG4gICAgICAgICAgICBhb2FSYWQ6IGFvYSxcbiAgICAgICAgICAgIGR5bmFtaWNQcmVzc3VyZSxcbiAgICAgICAgICAgIHFSZWY6IFFfUkVGLFxuICAgICAgICAgICAgc3BlZWQsXG4gICAgICAgICAgICBhbHRpdHVkZU06IGFsdGl0dWRlLFxuICAgICAgICAgICAgZmxhcHNFeHRlbmRlZDogdGhpcy5mbGFwc0V4dGVuZGVkLFxuICAgICAgICAgICAgbGFuZGVkOiB0aGlzLmxhbmRlZCxcbiAgICAgICAgfSwgZGVsdGEpO1xuXG4gICAgICAgIGNvbnN0IGNvbnRyb2xzID0gdGhpcy5tYXBDb250cm9scyhmY3NPdXQuZWxldmF0b3IsIGZjc091dC5haWxlcm9uLCBmY3NPdXQucnVkZGVyKTtcblxuICAgICAgICAvLyAtLS0tIEFlcm9keW5hbWljIGZvcmNlICYgbW9tZW50IGJ1aWxkLXVwIGZyb20gdGhlIHJpZ2lkIHBhcnRzLiAtLS0tXG4gICAgICAgIHRoaXMuZm9yY2VCb2R5LnNldCgwLCAwLCAwKTtcbiAgICAgICAgdGhpcy5tb21lbnRCb2R5LnNldCgwLCAwLCAwKTtcblxuICAgICAgICBjb25zdCBjYW1iZXIgPSB0aGlzLmZsYXBzRXh0ZW5kZWQgPyBGTTJfRkxBUFMuYW9hQmlhc1JhZCA6IDA7XG4gICAgICAgIGNvbnN0IHN0YWxsU2hpZnQgPSB0aGlzLmZsYXBzRXh0ZW5kZWQgPyBGTTJfRkxBUFMuc3RhbGxSZWR1Y3Rpb25SYWQgOiAwO1xuICAgICAgICBjb25zdCB3aW5nRXh0cmFDZCA9IHRoaXMuZmxhcHNFeHRlbmRlZCA/IEZNMl9GTEFQUy5leHRyYUNkIDogMDtcblxuICAgICAgICAvLyBCbGVuZGVkIGxpZnRpbmcgYm9keSBhdCB0aGUgQ0cgKG5vIGZsYXBzLCBubyBjb250cm9sIGluY2lkZW5jZSkuXG4gICAgICAgIHRoaXMuYWNjdW11bGF0ZVN1cmZhY2UodGhpcy5mdXNlbGFnZSwgMCwgMCwgMCwgMCwgYWlyRGVuc2l0eSk7XG4gICAgICAgIHRoaXMuYWNjdW11bGF0ZVN1cmZhY2UodGhpcy53aW5nTGVmdCwgY29udHJvbHMud2luZ0xlZnRBb2EsIGNhbWJlciwgc3RhbGxTaGlmdCwgd2luZ0V4dHJhQ2QsIGFpckRlbnNpdHkpO1xuICAgICAgICB0aGlzLmFjY3VtdWxhdGVTdXJmYWNlKHRoaXMud2luZ1JpZ2h0LCBjb250cm9scy53aW5nUmlnaHRBb2EsIGNhbWJlciwgc3RhbGxTaGlmdCwgd2luZ0V4dHJhQ2QsIGFpckRlbnNpdHkpO1xuICAgICAgICB0aGlzLmFjY3VtdWxhdGVTdXJmYWNlKHRoaXMuaHRhaWxMZWZ0LCBjb250cm9scy5odGFpbExlZnRBb2EsIDAsIDAsIDAsIGFpckRlbnNpdHkpO1xuICAgICAgICB0aGlzLmFjY3VtdWxhdGVTdXJmYWNlKHRoaXMuaHRhaWxSaWdodCwgY29udHJvbHMuaHRhaWxSaWdodEFvYSwgMCwgMCwgMCwgYWlyRGVuc2l0eSk7XG4gICAgICAgIHRoaXMuYWNjdW11bGF0ZVN1cmZhY2UodGhpcy52dGFpbCwgY29udHJvbHMudnRhaWxBb2EsIDAsIDAsIDAsIGFpckRlbnNpdHkpO1xuXG4gICAgICAgIC8vIEZ1c2VsYWdlIC8gcGFyYXNpdGUgLyBnZWFyIC8gd2F2ZSBkcmFnIGFsb25nIHRoZSByZWxhdGl2ZSB3aW5kLlxuICAgICAgICB0aGlzLmFkZEJvZHlEcmFnKGR5bmFtaWNQcmVzc3VyZSwgc3BlZWQsIG1hY2gpO1xuXG4gICAgICAgIC8vIFRocnVzdCBhbG9uZyB0aGUgbm9zZSAoK1ogYm9keSkuXG4gICAgICAgIGNvbnN0IHRocnVzdE4gPSBjb21wdXRlRjE2RW5naW5lVGhydXN0Tih0aGlzLmVmZmVjdGl2ZVRocm90dGxlLCBhbHRpdHVkZSk7XG4gICAgICAgIHRoaXMuZW5naW5lVGhydXN0TiA9IHRocnVzdE47XG4gICAgICAgIHRoaXMuZm9yY2VCb2R5LnogKz0gdGhydXN0TjtcblxuICAgICAgICAvLyBMYW5kaW5nLWdlYXIgcmVhY3Rpb25zIChjb21wdXRlZCBpbiB3b3JsZCwgbW9tZW50IGZvbGRlZCBpbnRvIGJvZHkgZnJhbWUpLlxuICAgICAgICB0aGlzLmNvbXB1dGVHZWFyRm9yY2VzKCk7XG5cbiAgICAgICAgLy8gTG9hZCBmYWN0b3I6IHNwZWNpZmljIG5vcm1hbCAoYm9keS11cCkgZm9yY2UgLyBnLCBpbmNsLiBnZWFyIHJlYWN0aW9uLlxuICAgICAgICBjb25zdCBnZWFyQm9keVVwWSA9IHRoaXMuX3YuY29weSh0aGlzLmdlYXJGb3JjZVdvcmxkKS5hcHBseVF1YXRlcm5pb24odGhpcy5pbnZPcmllbnQpLnk7XG4gICAgICAgIHRoaXMubG9hZEZhY3RvckcgPSAodGhpcy5mb3JjZUJvZHkueSArIGdlYXJCb2R5VXBZKSAvIChGTTJfR0VPTUVUUlkubWFzc0tnICogR1JBVklUWSk7XG5cbiAgICAgICAgLy8gLS0tLSBJbnRlZ3JhdGUgcm90YXRpb25hbCBkeW5hbWljcyAoYm9keSBmcmFtZSkuIC0tLS1cbiAgICAgICAgdGhpcy5tb21lbnRCb2R5LmFkZCh0aGlzLmdlYXJNb21lbnRCb2R5KTtcbiAgICAgICAgdGhpcy5yYi5pbnRlZ3JhdGVBbmd1bGFyKHRoaXMubW9tZW50Qm9keSwgZGVsdGEpO1xuXG4gICAgICAgIC8vIC0tLS0gSW50ZWdyYXRlIHRyYW5zbGF0aW9uYWwgZHluYW1pY3MgKHdvcmxkIGZyYW1lKS4gLS0tLVxuICAgICAgICB0aGlzLmZvcmNlV29ybGQuY29weSh0aGlzLmZvcmNlQm9keSkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMucmIub3JpZW50YXRpb24pO1xuICAgICAgICB0aGlzLmZvcmNlV29ybGQuYWRkKHRoaXMuZ2VhckZvcmNlV29ybGQpO1xuICAgICAgICB0aGlzLmZvcmNlV29ybGQueSAtPSBGTTJfR0VPTUVUUlkubWFzc0tnICogR1JBVklUWTsgLy8gZ3Jhdml0eVxuICAgICAgICB0aGlzLnJiLmludGVncmF0ZUxpbmVhcih0aGlzLmZvcmNlV29ybGQsIGRlbHRhLCB0aGlzLm9iai5wb3NpdGlvbik7XG5cbiAgICAgICAgLy8gUHVibGlzaCByaWdpZC1ib2R5IHN0YXRlIGJhY2sgdG8gdGhlIGJhc2UgbW9kZWwuXG4gICAgICAgIHRoaXMub2JqLnF1YXRlcm5pb24uY29weSh0aGlzLnJiLm9yaWVudGF0aW9uKTtcbiAgICAgICAgdGhpcy52ZWxvY2l0eS5jb3B5KHRoaXMucmIudmVsb2NpdHlXb3JsZCk7XG5cbiAgICAgICAgdGhpcy51cGRhdGVTdGFsbFN0YXRlKHNwZWVkLCBhb2EsIGFsdGl0dWRlKTtcbiAgICAgICAgdGhpcy5oYW5kbGVHcm91bmRTdGF0ZSgpO1xuICAgICAgICB0aGlzLndyYXBQb3NpdGlvbigpO1xuICAgIH1cblxuICAgIHByaXZhdGUgc3Bvb2xUaHJvdHRsZShkZWx0YTogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLmVmZmVjdGl2ZVRocm90dGxlID4gdGhpcy50aHJvdHRsZSkge1xuICAgICAgICAgICAgdGhpcy5lZmZlY3RpdmVUaHJvdHRsZSA9IE1hdGgubWF4KHRoaXMudGhyb3R0bGUsIHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgLSBUSFJPVFRMRV9ET1dOX1JBVEUgKiBkZWx0YSk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5lZmZlY3RpdmVUaHJvdHRsZSA8IHRoaXMudGhyb3R0bGUpIHtcbiAgICAgICAgICAgIHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgPSBNYXRoLm1pbih0aGlzLnRocm90dGxlLCB0aGlzLmVmZmVjdGl2ZVRocm90dGxlICsgVEhST1RUTEVfVVBfUkFURSAqIGRlbHRhKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgbWFwQ29udHJvbHMoZWxldmF0b3I6IG51bWJlciwgYWlsZXJvbjogbnVtYmVyLCBydWRkZXI6IG51bWJlcik6IFN1cmZhY2VDb250cm9scyB7XG4gICAgICAgIC8vIEVsZXZhdG9yOiArY21kID0gbm9zZSB1cCDihpIgbmVnYXRpdmUgc3RhYmlsYXRvciBpbmNpZGVuY2UgKHRhaWwgbGlmdCBkb3duKS5cbiAgICAgICAgY29uc3QgZWxldmF0b3JBb2EgPSAtZWxldmF0b3IgKiBNQVhfU1RBQklMQVRPUl9BT0E7XG4gICAgICAgIC8vIERpZmZlcmVudGlhbCB0YWlsICh0YWlsZXJvbikgYXNzaXN0cyByb2xsLlxuICAgICAgICBjb25zdCB0YWlsZXJvbkFvYSA9IGFpbGVyb24gKiBGTTJfRkNTLnRhaWxlcm9uUm9sbEZyYWN0aW9uICogTUFYX1NUQUJJTEFUT1JfQU9BO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgd2luZ0xlZnRBb2E6IGFpbGVyb24gKiBNQVhfQUlMRVJPTl9BT0EsXG4gICAgICAgICAgICB3aW5nUmlnaHRBb2E6IC1haWxlcm9uICogTUFYX0FJTEVST05fQU9BLFxuICAgICAgICAgICAgaHRhaWxMZWZ0QW9hOiBlbGV2YXRvckFvYSArIHRhaWxlcm9uQW9hLFxuICAgICAgICAgICAgaHRhaWxSaWdodEFvYTogZWxldmF0b3JBb2EgLSB0YWlsZXJvbkFvYSxcbiAgICAgICAgICAgIHZ0YWlsQW9hOiAtcnVkZGVyICogTUFYX1JVRERFUl9BT0EsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhY2N1bXVsYXRlU3VyZmFjZShcbiAgICAgICAgc3VyZmFjZTogQWVyb1N1cmZhY2UsIGNvbnRyb2xBb2E6IG51bWJlciwgY2FtYmVyOiBudW1iZXIsXG4gICAgICAgIHN0YWxsU2hpZnQ6IG51bWJlciwgZXh0cmFDZDogbnVtYmVyLCBhaXJEZW5zaXR5OiBudW1iZXIsXG4gICAgKTogdm9pZCB7XG4gICAgICAgIHN1cmZhY2UuYWNjdW11bGF0ZSh7XG4gICAgICAgICAgICB2ZWxvY2l0eUJvZHk6IHRoaXMudmVsQm9keSxcbiAgICAgICAgICAgIGFuZ3VsYXJWZWxvY2l0eUJvZHk6IHRoaXMucmIuYW5ndWxhclZlbG9jaXR5Qm9keSxcbiAgICAgICAgICAgIGFpckRlbnNpdHksXG4gICAgICAgICAgICBjb250cm9sRGVsdGFBb2FSYWQ6IGNvbnRyb2xBb2EsXG4gICAgICAgICAgICBjYW1iZXJCaWFzUmFkOiBjYW1iZXIsXG4gICAgICAgICAgICBzdGFsbFNoaWZ0UmFkOiBzdGFsbFNoaWZ0LFxuICAgICAgICAgICAgZXh0cmFDZCxcbiAgICAgICAgfSwgdGhpcy5mb3JjZUJvZHksIHRoaXMubW9tZW50Qm9keSk7XG4gICAgfVxuXG4gICAgLyoqIFBhcmFzaXRlIChmdXNlbGFnZSArIGdlYXIpIGFuZCB0cmFuc29uaWMgd2F2ZSBkcmFnIGFsb25nIHRoZSByZWxhdGl2ZSB3aW5kLiAqL1xuICAgIHByaXZhdGUgYWRkQm9keURyYWcoZHluYW1pY1ByZXNzdXJlOiBudW1iZXIsIHNwZWVkOiBudW1iZXIsIG1hY2g6IG51bWJlcik6IHZvaWQge1xuICAgICAgICBpZiAoc3BlZWQgPCAxZS0zKSByZXR1cm47XG4gICAgICAgIGxldCBjZDAgPSBGTTJfQk9EWV9DRDAgKyAodGhpcy5sYW5kaW5nR2VhckRlcGxveWVkID8gRk0yX0dFQVJfQ0QgOiAwKTtcbiAgICAgICAgaWYgKG1hY2ggPiBGTTJfV0FWRV9EUkFHLm1hY2hPbnNldCkge1xuICAgICAgICAgICAgY29uc3QgZXhjZXNzID0gKG1hY2ggLSBGTTJfV0FWRV9EUkFHLm1hY2hPbnNldCkgLyBGTTJfV0FWRV9EUkFHLm1hY2hPbnNldDtcbiAgICAgICAgICAgIGNkMCArPSBGTTJfV0FWRV9EUkFHLnNjYWxlICogZXhjZXNzICogZXhjZXNzO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRyYWdOID0gZHluYW1pY1ByZXNzdXJlICogRk0yX0dFT01FVFJZLndpbmdBcmVhTTIgKiBjZDA7XG4gICAgICAgIC8vIE9wcG9zZXMgYm9keSB2ZWxvY2l0eSAoYWN0cyB0aHJvdWdoIENHLCBubyBtb21lbnQpLlxuICAgICAgICB0aGlzLl92LmNvcHkodGhpcy52ZWxCb2R5KS5tdWx0aXBseVNjYWxhcigtZHJhZ04gLyBzcGVlZCk7XG4gICAgICAgIHRoaXMuZm9yY2VCb2R5LmFkZCh0aGlzLl92KTtcbiAgICB9XG5cbiAgICAvKiogU3ByaW5nLWRhbXBlciBsYW5kaW5nIGdlYXIuIEFjY3VtdWxhdGVzIHdvcmxkIGZvcmNlIGFuZCBib2R5IG1vbWVudC4gKi9cbiAgICBwcml2YXRlIGNvbXB1dGVHZWFyRm9yY2VzKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmdlYXJGb3JjZVdvcmxkLnNldCgwLCAwLCAwKTtcbiAgICAgICAgdGhpcy5nZWFyTW9tZW50Qm9keS5zZXQoMCwgMCwgMCk7XG5cbiAgICAgICAgdGhpcy5fb21lZ2FXb3JsZC5jb3B5KHRoaXMucmIuYW5ndWxhclZlbG9jaXR5Qm9keSkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMucmIub3JpZW50YXRpb24pO1xuXG4gICAgICAgIGZvciAoY29uc3QgZ3Agb2YgR0VBUl9QT0lOVFMpIHtcbiAgICAgICAgICAgIHRoaXMuX3Yuc2V0KGdwWzBdLCBncFsxXSwgZ3BbMl0pLmFwcGx5UXVhdGVybmlvbih0aGlzLnJiLm9yaWVudGF0aW9uKTtcbiAgICAgICAgICAgIHRoaXMuX2dlYXJXb3JsZC5jb3B5KHRoaXMuX3YpLmFkZCh0aGlzLm9iai5wb3NpdGlvbik7XG4gICAgICAgICAgICBjb25zdCBwZW5ldHJhdGlvbiA9IC10aGlzLl9nZWFyV29ybGQueTsgLy8gZ3JvdW5kIHBsYW5lIGF0IHdvcmxkIHkgPSAwXG4gICAgICAgICAgICBpZiAocGVuZXRyYXRpb24gPD0gMCkgY29udGludWU7XG5cbiAgICAgICAgICAgIC8vIFZlbG9jaXR5IG9mIHRoZSBjb250YWN0IHBvaW50IHRocm91Z2ggdGhlIHdvcmxkLlxuICAgICAgICAgICAgdGhpcy5fY29udGFjdFZlbC5jcm9zc1ZlY3RvcnModGhpcy5fb21lZ2FXb3JsZCwgdGhpcy5fdikuYWRkKHRoaXMucmIudmVsb2NpdHlXb3JsZCk7XG5cbiAgICAgICAgICAgIC8vIE5vcm1hbCAodmVydGljYWwpIHNwcmluZy1kYW1wZXIgcmVhY3Rpb24uXG4gICAgICAgICAgICBsZXQgbm9ybWFsID0gR0VBUl9TVElGRk5FU1MgKiBwZW5ldHJhdGlvbiAtIEdFQVJfREFNUElORyAqIHRoaXMuX2NvbnRhY3RWZWwueTtcbiAgICAgICAgICAgIGlmIChub3JtYWwgPCAwKSBub3JtYWwgPSAwO1xuXG4gICAgICAgICAgICAvLyBIb3Jpem9udGFsIGZyaWN0aW9uIG9wcG9zaW5nIHRoZSBjb250YWN0IGdyb3VuZCB2ZWxvY2l0eS5cbiAgICAgICAgICAgIGNvbnN0IHZoeCA9IHRoaXMuX2NvbnRhY3RWZWwueDtcbiAgICAgICAgICAgIGNvbnN0IHZoeiA9IHRoaXMuX2NvbnRhY3RWZWwuejtcbiAgICAgICAgICAgIGNvbnN0IHZoID0gTWF0aC5oeXBvdCh2aHgsIHZoeik7XG4gICAgICAgICAgICB0aGlzLl9mcmljdGlvbi5zZXQoMCwgbm9ybWFsLCAwKTtcbiAgICAgICAgICAgIGlmICh2aCA+IDFlLTMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByb2xsaW5nID0gdGhpcy53aGVlbEJyYWtlc0FwcGxpZWQgPyBHRUFSX0JSQUtFX0ZSSUNUSU9OIDogR0VBUl9ST0xMX0ZSSUNUSU9OO1xuICAgICAgICAgICAgICAgIGNvbnN0IG11ID0gTWF0aC5tYXgocm9sbGluZywgR0VBUl9TSURFX0ZSSUNUSU9OICogdGhpcy5zaWRlU2xpcEZyYWN0aW9uKHZoeCwgdmh6KSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZk1hZyA9IG11ICogbm9ybWFsO1xuICAgICAgICAgICAgICAgIHRoaXMuX2ZyaWN0aW9uLnggPSAtZk1hZyAqIHZoeCAvIHZoO1xuICAgICAgICAgICAgICAgIHRoaXMuX2ZyaWN0aW9uLnogPSAtZk1hZyAqIHZoeiAvIHZoO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmdlYXJGb3JjZVdvcmxkLmFkZCh0aGlzLl9mcmljdGlvbik7XG5cbiAgICAgICAgICAgIC8vIE1vbWVudCBhYm91dCBDRzogcl93b3JsZCDDlyBGX3dvcmxkLCBleHByZXNzZWQgaW4gdGhlIGJvZHkgZnJhbWUuXG4gICAgICAgICAgICB0aGlzLl92Mi5jcm9zc1ZlY3RvcnModGhpcy5fdiwgdGhpcy5fZnJpY3Rpb24pLmFwcGx5UXVhdGVybmlvbih0aGlzLmludk9yaWVudCk7XG4gICAgICAgICAgICB0aGlzLmdlYXJNb21lbnRCb2R5LmFkZCh0aGlzLl92Mik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKiogSGlnaGVyIGVmZmVjdGl2ZSBmcmljdGlvbiBmb3Igc2lkZXdheXMgKG5vbi1yb2xsaW5nKSBjb250YWN0IG1vdGlvbi4gKi9cbiAgICBwcml2YXRlIHNpZGVTbGlwRnJhY3Rpb24odmh4OiBudW1iZXIsIHZoejogbnVtYmVyKTogbnVtYmVyIHtcbiAgICAgICAgdGhpcy5fZndkLmNvcHkoRk9SV0FSRCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMucmIub3JpZW50YXRpb24pO1xuICAgICAgICBjb25zdCBmd3ggPSB0aGlzLl9md2QueCwgZnd6ID0gdGhpcy5fZndkLno7XG4gICAgICAgIGNvbnN0IGZ3TGVuID0gTWF0aC5oeXBvdChmd3gsIGZ3eikgfHwgMTtcbiAgICAgICAgY29uc3QgdmggPSBNYXRoLmh5cG90KHZoeCwgdmh6KSB8fCAxO1xuICAgICAgICBjb25zdCBhbG9uZyA9IE1hdGguYWJzKCh2aHggKiBmd3ggKyB2aHogKiBmd3opIC8gKGZ3TGVuICogdmgpKTtcbiAgICAgICAgcmV0dXJuIGNsYW1wKDEgLSBhbG9uZywgMCwgMSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB1cGRhdGVTdGFsbFN0YXRlKHNwZWVkOiBudW1iZXIsIGFvYTogbnVtYmVyLCBhbHRpdHVkZTogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLmxhbmRlZCkgeyB0aGlzLnN0YWxsID0gLTE7IHJldHVybjsgfVxuICAgICAgICBjb25zdCBhb2FTdGFsbCA9IHNwZWVkID4gNSA/IGNsYW1wKChNYXRoLmFicyhhb2EpIC0gU1RBTExfQU9BICogMC44NSkgLyAoU1RBTExfQU9BICogMC4zKSwgMCwgMSkgOiAwO1xuICAgICAgICBjb25zdCBzcGVlZFN0YWxsID0gYWx0aXR1ZGUgPiBQTEFORV9ESVNUQU5DRV9UT19HUk9VTkQgKyA1XG4gICAgICAgICAgICA/IGNsYW1wKChNSU5fRkxZSU5HX1NQRUVEIC0gc3BlZWQpIC8gTUlOX0ZMWUlOR19TUEVFRCwgMCwgMSkgOiAwO1xuICAgICAgICBjb25zdCBsZXZlbCA9IE1hdGgubWF4KGFvYVN0YWxsLCBzcGVlZFN0YWxsKTtcbiAgICAgICAgdGhpcy5zdGFsbCA9IGxldmVsID4gMCA/IGxldmVsIDogLTE7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBoYW5kbGVHcm91bmRTdGF0ZSgpOiB2b2lkIHtcbiAgICAgICAgY29uc3Qgb25Hcm91bmQgPSB0aGlzLm9iai5wb3NpdGlvbi55IDw9IFBMQU5FX0RJU1RBTkNFX1RPX0dST1VORCArIDAuMjU7XG5cbiAgICAgICAgaWYgKHRoaXMub2JqLnBvc2l0aW9uLnkgPiBQTEFORV9ESVNUQU5DRV9UT19HUk9VTkQgKyAwLjMpIHtcbiAgICAgICAgICAgIHRoaXMubGFuZGVkID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBIYXJkIGZsb29yIHNvIHRoZSBnZWFyIHNwcmluZyBjYW4gbmV2ZXIgbGV0IHRoZSBib2R5IHR1bm5lbCB0aHJvdWdoLlxuICAgICAgICBjb25zdCBtaW5ZID0gUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5EIC0gMC42O1xuICAgICAgICBpZiAodGhpcy5vYmoucG9zaXRpb24ueSA8IG1pblkpIHtcbiAgICAgICAgICAgIHRoaXMub2JqLnBvc2l0aW9uLnkgPSBtaW5ZO1xuICAgICAgICAgICAgaWYgKHRoaXMudmVsb2NpdHkueSA8IDApIHRoaXMudmVsb2NpdHkueSA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIW9uR3JvdW5kKSByZXR1cm47XG5cbiAgICAgICAgdGhpcy5fZndkLmNvcHkoRk9SV0FSRCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMucmIub3JpZW50YXRpb24pO1xuICAgICAgICB0aGlzLl9yaWdodC5jb3B5KFJJR0hUKS5hcHBseVF1YXRlcm5pb24odGhpcy5yYi5vcmllbnRhdGlvbik7XG4gICAgICAgIGNvbnN0IHNwZWVkID0gdGhpcy52ZWxvY2l0eS5sZW5ndGgoKTtcbiAgICAgICAgY29uc3QgcGl0Y2hBbmdsZSA9IE1hdGguYXNpbihjbGFtcCh0aGlzLl9md2QueSwgLTEsIDEpKTtcbiAgICAgICAgY29uc3Qgcm9sbEFuZ2xlID0gTWF0aC5hc2luKGNsYW1wKHRoaXMuX3JpZ2h0LnksIC0xLCAxKSk7XG5cbiAgICAgICAgY29uc3QgaGFyZENvbnRhY3QgPSB0aGlzLnZlbG9jaXR5LnkgPCAtTEFORElOR19NQVhfVlNQRUVEO1xuICAgICAgICBjb25zdCBiYWRBdHRpdHVkZSA9IE1hdGguYWJzKHJvbGxBbmdsZSkgPiBMQU5ESU5HX01BWF9ST0xMIHx8IHBpdGNoQW5nbGUgPCBMQU5ESU5HX01JTl9QSVRDSDtcblxuICAgICAgICBpZiAoIXRoaXMubGFuZGVkICYmIChoYXJkQ29udGFjdCB8fCBzcGVlZCA+IExBTkRJTkdfTUFYX1NQRUVEKSkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmxhbmRpbmdHZWFyRGVwbG95ZWQgfHwgaGFyZENvbnRhY3QgfHwgYmFkQXR0aXR1ZGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNyYXNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMubGFuZGluZ0dlYXJEZXBsb3llZCAmJiB0aGlzLnZlbG9jaXR5LnkgPCAtMS4wKSB7XG4gICAgICAgICAgICB0aGlzLmNyYXNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzcGVlZCA8IExBTkRJTkdfTUFYX1NQRUVEICYmIE1hdGguYWJzKHJvbGxBbmdsZSkgPCBMQU5ESU5HX01BWF9ST0xMKSB7XG4gICAgICAgICAgICB0aGlzLmxhbmRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIHdyYXBQb3NpdGlvbigpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgaCA9IDIuNSAqIFRFUlJBSU5fU0NBTEUgKiBURVJSQUlOX01PREVMX1NJWkU7XG4gICAgICAgIGlmICh0aGlzLm9iai5wb3NpdGlvbi54ID4gaCkgdGhpcy5vYmoucG9zaXRpb24ueCA9IC1oO1xuICAgICAgICBpZiAodGhpcy5vYmoucG9zaXRpb24ueCA8IC1oKSB0aGlzLm9iai5wb3NpdGlvbi54ID0gaDtcbiAgICAgICAgaWYgKHRoaXMub2JqLnBvc2l0aW9uLnogPiBoKSB0aGlzLm9iai5wb3NpdGlvbi56ID0gLWg7XG4gICAgICAgIGlmICh0aGlzLm9iai5wb3NpdGlvbi56IDwgLWgpIHRoaXMub2JqLnBvc2l0aW9uLnogPSBoO1xuICAgIH1cblxuICAgIGdldFN0YWxsU3RhdHVzKCk6IG51bWJlciB7IHJldHVybiB0aGlzLnN0YWxsOyB9XG5cbiAgICAvLyAtLS0gRi0xNiB0aHJvdHRsZSBxdWFkcmFudCBiZWhhdmlvdXIgKHNoYXJlZCB3aXRoIHRoZSBSZWFsaXN0aWMgbW9kZWwpLiAtLS1cbiAgICBnZXRUaHJvdHRsZUh1ZFRleHQoKTogc3RyaW5nIHsgcmV0dXJuIGZvcm1hdEYxNlRocm90dGxlSHVkKHRoaXMudGhyb3R0bGUpOyB9XG4gICAgdXNlRjE2VGhyb3R0bGVEZXRlbnRzKCk6IGJvb2xlYW4geyByZXR1cm4gdHJ1ZTsgfVxuICAgIHN0ZXBUaHJvdHRsZURldGVudChjdXJyZW50OiBudW1iZXIsIGRpcmVjdGlvbjogMSB8IC0xKTogbnVtYmVyIHsgcmV0dXJuIHN0ZXBGMTZUaHJvdHRsZURldGVudChjdXJyZW50LCBkaXJlY3Rpb24pOyB9XG4gICAgaXNJblRocm90dGxlQWJEZXRlbnRCYW5kKGxldmVyOiBudW1iZXIpOiBib29sZWFuIHsgcmV0dXJuIGlzRjE2QWJEZXRlbnRCYW5kKGxldmVyKTsgfVxuICAgIGFkanVzdFRocm90dGxlSW5wdXQoY3VycmVudDogbnVtYmVyLCBzdGVwOiBudW1iZXIpOiBudW1iZXIgeyByZXR1cm4gYWRqdXN0RjE2VGhyb3R0bGVJbnB1dChjdXJyZW50LCBzdGVwKTsgfVxuICAgIGdldFRocm90dGxlWm9uZSgpOiBzdHJpbmcgeyByZXR1cm4gZ2V0RjE2VGhyb3R0bGVab25lKHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUpOyB9XG4gICAgZ2V0VGhyb3R0bGVBdWRpb0xldmVsKCk6IG51bWJlciB7IHJldHVybiBmMTZUaHJvdHRsZUF1ZGlvTGV2ZWwodGhpcy5lZmZlY3RpdmVUaHJvdHRsZSk7IH1cbiAgICBnZXRFbmdpbmVOb3p6bGVDb2xvcigpOiBzdHJpbmcgeyByZXR1cm4gZ2V0RjE2RW5naW5lTm96emxlQ29sb3IodGhpcy5lZmZlY3RpdmVUaHJvdHRsZSk7IH1cbn1cbiIsImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcbmltcG9ydCB7IFBJVENIX1JBVEUsIFBMQU5FX0RJU1RBTkNFX1RPX0dST1VORCwgVEVSUkFJTl9NT0RFTF9TSVpFLCBURVJSQUlOX1NDQUxFLCBZQVdfUkFURSB9IGZyb20gJy4uLy4uL2RlZnMnO1xuaW1wb3J0IHsgRk9SV0FSRCwgUElfT1ZFUl8xODAsIFJJR0hULCBVUCwgY2FsY3VsYXRlUGl0Y2hSb2xsLCBjbGFtcCwgaXNaZXJvLCByb3VuZFRvWmVybyB9IGZyb20gJy4uLy4uL3V0aWxzL21hdGgnO1xuaW1wb3J0IHsgY29tcHV0ZUFuZ2xlT2ZBdHRhY2ssIGNvbXB1dGVBaXJEZW5zaXR5LCBjb21wdXRlRHluYW1pY1ByZXNzdXJlLCBjb21wdXRlRHluYW1pY1ByZXNzdXJlRHJhZ1BlbmFsdHksIGNvbXB1dGVJc2FBaXJEZW5zaXR5LCBjb21wdXRlTG9hZEZhY3RvckcsIGNvbXB1dGVNYWNoTnVtYmVyIH0gZnJvbSAnLi4vYWVyb1V0aWxzJztcbmltcG9ydCB7IGNvbXB1dGVGMTZFbmdpbmVUaHJ1c3ROLCBmb3JtYXRGMTZUaHJvdHRsZUh1ZCwgZjE2VGhyb3R0bGVBdWRpb0xldmVsLCBnZXRGMTZFbmdpbmVOb3p6bGVDb2xvciwgZ2V0RjE2VGhyb3R0bGVab25lLCBhZGp1c3RGMTZUaHJvdHRsZUlucHV0LCBzdGVwRjE2VGhyb3R0bGVEZXRlbnQsIGlzRjE2QWJEZXRlbnRCYW5kIH0gZnJvbSAnLi4vZjE2RW5naW5lJztcbmltcG9ydCB7XG4gICAgY29tcHV0ZUYxNkNvbW1hbmRlZFJvbGxSYXRlLFxuICAgIGNvbXB1dGVGMTZSb2xsWWF3Q291cGxpbmcsXG4gICAgRjE2X1JPTExfQ0FUMSxcbiAgICBtYXhSb2xsUmF0ZVJhZCxcbiAgICBzdGVwRjE2Qm9keVJvbGxSYXRlLFxufSBmcm9tICcuLi9mMTZSb2xsQ29udHJvbCc7XG5pbXBvcnQgeyBjbGFtcExvYWRGYWN0b3JBY2NlbGVyYXRpb24sIGNvbXB1dGVGMTZQaXRjaEdMaW1pdCwgY29tcHV0ZUYxNlBpdGNoQW9hQXV0aG9yaXR5LCBjb21wdXRlRjE2QW9hUmVjb3ZlcnlSYXRlIH0gZnJvbSAnLi4vZjE2RmNzTGltaXRzJztcbmltcG9ydCB7IEYxNl9QUk9GSUxFIH0gZnJvbSAnLi4vZjE2UHJvZmlsZSc7XG5pbXBvcnQgeyBGbGlnaHRNb2RlbCB9IGZyb20gJy4vZmxpZ2h0TW9kZWwnO1xuXG5jb25zdCBUSFJPVFRMRV9VUF9SQVRFID0gMC4xMDtcbmNvbnN0IFRIUk9UVExFX0RPV05fUkFURSA9IDAuMDc7XG5jb25zdCBZQVdfUkFURV9MQU5ERUQgPSBZQVdfUkFURSAqIDIuMDtcblxuY29uc3QgRFJZX01BU1MgPSBGMTZfUFJPRklMRS5zaW1NYXNzS2c7XG5jb25zdCBXSU5HX0FSRUEgPSBGMTZfUFJPRklMRS53aW5nQXJlYU0yO1xuY29uc3QgQ0QwID0gRjE2X1BST0ZJTEUuY2QwO1xuY29uc3QgSU5EVUNFRF9EUkFHX0sgPSBGMTZfUFJPRklMRS5pbmR1Y2VkRHJhZ0s7XG5jb25zdCBDTDAgPSBGMTZfUFJPRklMRS5jbDA7XG5jb25zdCBDTF9BTFBIQSA9IEYxNl9QUk9GSUxFLmNsQWxwaGFQZXJSYWQ7XG5jb25zdCBTVEFMTF9BT0EgPSBGMTZfUFJPRklMRS5zdGFsbEFvYURlZyAqIE1hdGguUEkgLyAxODA7XG5jb25zdCBNQVhfQ0wgPSAxLjQ4O1xuY29uc3QgUV9SRUYgPSAwLjUgKiBjb21wdXRlSXNhQWlyRGVuc2l0eShGMTZfUFJPRklMRS5jcnVpc2VBbHRpdHVkZU0pICogRjE2X1BST0ZJTEUuY3J1aXNlU3BlZWRNcHMgKiBGMTZfUFJPRklMRS5jcnVpc2VTcGVlZE1wcztcbmNvbnN0IE1JTl9DT05UUk9MX1EgPSAwLjEyO1xuY29uc3QgTUFYX0NPTlRST0xfUSA9IDIuMjtcbmNvbnN0IE1JTl9GTFlJTkdfU1BFRUQgPSBGMTZfUFJPRklMRS5taW5GbHlpbmdTcGVlZE1wcztcbmNvbnN0IFNJREVfU0xJUF9EQU1QX1JBVEUgPSA0LjU7XG5jb25zdCBDWV9CRVRBID0gLTAuNjtcbmNvbnN0IFlBV19DT05UUk9MX1FfU0NBTEUgPSAwLjQ1O1xuXG5jb25zdCBDRF9MQU5ESU5HX0dFQVIgPSAwLjAzNTtcbmNvbnN0IENEX0ZMQVBTID0gMC4wODtcbmNvbnN0IENMX0ZMQVBTX0ZBQ1RPUiA9IDEuMjU7XG5cbmNvbnN0IEYxNl9ST0xMX0NPTkZJRyA9IHtcbiAgICBtYXhSb2xsUmF0ZURlZ1M6IEYxNl9QUk9GSUxFLm1heFJvbGxSYXRlRGVnUyxcbiAgICBhY3R1YXRvclRhdVM6IEYxNl9ST0xMX0NBVDEuYWN0dWF0b3JUYXVTLFxufTtcblxuY29uc3QgR1JPVU5EX0ZSSUNUSU9OX0tJTkVUSUMgPSAwLjE1O1xuY29uc3QgR1JPVU5EX0ZSSUNUSU9OX1NUQVRJQyA9IDAuMjtcbmNvbnN0IEdST1VORF9CUkFLRV9LSU5FVElDID0gMS44O1xuY29uc3QgR1JPVU5EX0JSQUtFX1NUQVRJQyA9IDEuMTc7XG5cbmNvbnN0IExBTkRFRF9NQVhfU1BFRUQgPSBGMTZfUFJPRklMRS5sYW5kaW5nTWF4U3BlZWRNcHM7XG5jb25zdCBMQU5ESU5HX01BWF9WU1BFRUQgPSBGMTZfUFJPRklMRS5sYW5kaW5nTWF4VmVydGljYWxTcGVlZE1wcztcbmNvbnN0IExBTkRJTkdfTUlOX1BJVENIID0gRjE2X1BST0ZJTEUubGFuZGluZ01pblBpdGNoRGVnICogUElfT1ZFUl8xODA7XG5jb25zdCBMQU5ESU5HX01BWF9ST0xMID0gRjE2X1BST0ZJTEUubGFuZGluZ01heFJvbGxEZWcgKiBQSV9PVkVSXzE4MDtcbmNvbnN0IFJPVEFUSU9OX1NQRUVEID0gRjE2X1BST0ZJTEUucm90YXRpb25TcGVlZE1wcztcblxuZnVuY3Rpb24gY29tcHV0ZUNsKGFvYTogbnVtYmVyLCBmbGFwc0V4dGVuZGVkOiBib29sZWFuKTogbnVtYmVyIHtcbiAgICBjb25zdCBmbGFwQm9vc3QgPSBmbGFwc0V4dGVuZGVkID8gQ0xfRkxBUFNfRkFDVE9SIDogMS4wO1xuICAgIGNvbnN0IHN0YWxsQW9hID0gZmxhcHNFeHRlbmRlZCA/IFNUQUxMX0FPQSAqIDEuMSA6IFNUQUxMX0FPQTtcbiAgICBjb25zdCBtYXhDbCA9IE1BWF9DTCAqIGZsYXBCb29zdDtcblxuICAgIGlmIChNYXRoLmFicyhhb2EpIDw9IHN0YWxsQW9hKSB7XG4gICAgICAgIHJldHVybiBjbGFtcChDTDAgKyBDTF9BTFBIQSAqIGFvYSAqIGZsYXBCb29zdCwgLW1heENsICogMC4zNSwgbWF4Q2wpO1xuICAgIH1cblxuICAgIGNvbnN0IHBlYWtDbCA9IChDTDAgKyBDTF9BTFBIQSAqIHN0YWxsQW9hICogTWF0aC5zaWduKGFvYSkpICogZmxhcEJvb3N0O1xuICAgIGNvbnN0IHBvc3RTdGFsbCA9IE1hdGguY29zKChNYXRoLmFicyhhb2EpIC0gc3RhbGxBb2EpICogNC4wKTtcbiAgICByZXR1cm4gcGVha0NsICogTWF0aC5tYXgoMCwgcG9zdFN0YWxsKTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZUluZHVjZWREcmFnKGNsOiBudW1iZXIpOiBudW1iZXIge1xuICAgIHJldHVybiBJTkRVQ0VEX0RSQUdfSyAqIGNsICogY2w7XG59XG5cbi8qKiBQaXRjaCByYXRlIHNjYWxlcyB3aXRoIGFpcnNwZWVkIHNvIGxvdy1zcGVlZCByb3RhdGlvbiBjYW5ub3Qgc25hcCB0byBkZWVwLXN0YWxsIEFPQS4gKi9cbmZ1bmN0aW9uIGNvbXB1dGVQaXRjaFNwZWVkQXV0aG9yaXR5KHNwZWVkOiBudW1iZXIsIGxhbmRlZDogYm9vbGVhbik6IG51bWJlciB7XG4gICAgbGV0IGF1dGhvcml0eSA9IGNsYW1wKHNwZWVkIC8gTUlOX0ZMWUlOR19TUEVFRCwgMCwgMSk7XG4gICAgaWYgKGxhbmRlZCAmJiBzcGVlZCA8IFJPVEFUSU9OX1NQRUVEKSB7XG4gICAgICAgIGF1dGhvcml0eSAqPSBjbGFtcChzcGVlZCAvIFJPVEFUSU9OX1NQRUVELCAwLCAxKTtcbiAgICB9XG4gICAgcmV0dXJuIGF1dGhvcml0eTtcbn1cblxuZXhwb3J0IGNsYXNzIFJlYWxpc3RpY0ZsaWdodE1vZGVsIGV4dGVuZHMgRmxpZ2h0TW9kZWwge1xuXG4gICAgcHJpdmF0ZSBzdGFsbCA9IC0xO1xuICAgIHByaXZhdGUgYm9keVJvbGxSYXRlUmFkID0gMDtcblxuICAgIHByaXZhdGUgZm9yd2FyZCA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSB1cCA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSByaWdodCA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSB2ZWxvY2l0eVVuaXQgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgdGhydXN0ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIGRyYWcgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgbGlmdCA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSB3ZWlnaHQgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgZnJpY3Rpb24gPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgZm9yY2VzID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHNpZGVGb3JjZSA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSBsaWZ0RGlyZWN0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIF92ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLm9iai51cC5jb3B5KFVQKTtcbiAgICB9XG5cbiAgICByZXNldCgpIHtcbiAgICAgICAgc3VwZXIucmVzZXQoKTtcbiAgICAgICAgdGhpcy5zdGFsbCA9IC0xO1xuICAgICAgICB0aGlzLmJvZHlSb2xsUmF0ZVJhZCA9IDA7XG4gICAgfVxuXG4gICAgc3RlcChkZWx0YTogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLmNyYXNoZWQpIHJldHVybjtcblxuICAgICAgICBpZiAodGhpcy5lZmZlY3RpdmVUaHJvdHRsZSA+IHRoaXMudGhyb3R0bGUpIHtcbiAgICAgICAgICAgIHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgPSBNYXRoLm1heCh0aGlzLnRocm90dGxlLCB0aGlzLmVmZmVjdGl2ZVRocm90dGxlIC0gVEhST1RUTEVfRE9XTl9SQVRFICogZGVsdGEpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgPCB0aGlzLnRocm90dGxlKSB7XG4gICAgICAgICAgICB0aGlzLmVmZmVjdGl2ZVRocm90dGxlID0gTWF0aC5taW4odGhpcy50aHJvdHRsZSwgdGhpcy5lZmZlY3RpdmVUaHJvdHRsZSArIFRIUk9UVExFX1VQX1JBVEUgKiBkZWx0YSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmZvcndhcmQuY29weShGT1JXQVJEKS5hcHBseVF1YXRlcm5pb24odGhpcy5vYmoucXVhdGVybmlvbik7XG4gICAgICAgIHRoaXMudXAuY29weShVUCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMub2JqLnF1YXRlcm5pb24pO1xuICAgICAgICB0aGlzLnJpZ2h0LmNvcHkoUklHSFQpLmFwcGx5UXVhdGVybmlvbih0aGlzLm9iai5xdWF0ZXJuaW9uKTtcblxuICAgICAgICBjb25zdCBhbHRpdHVkZSA9IHRoaXMub2JqLnBvc2l0aW9uLnk7XG4gICAgICAgIGNvbnN0IGFpckRlbnNpdHkgPSBjb21wdXRlQWlyRGVuc2l0eShhbHRpdHVkZSk7XG4gICAgICAgIGNvbnN0IHNwZWVkID0gdGhpcy52ZWxvY2l0eS5sZW5ndGgoKTtcbiAgICAgICAgY29uc3QgZHluYW1pY1ByZXNzdXJlID0gY29tcHV0ZUR5bmFtaWNQcmVzc3VyZShhaXJEZW5zaXR5LCBzcGVlZCk7XG4gICAgICAgIGNvbnN0IGNvbnRyb2xTY2FsZSA9IGNsYW1wKGR5bmFtaWNQcmVzc3VyZSAvIFFfUkVGLCBNSU5fQ09OVFJPTF9RLCBNQVhfQ09OVFJPTF9RKTtcblxuICAgICAgICBsZXQgYW9hID0gMDtcbiAgICAgICAgaWYgKHNwZWVkID4gMS4wKSB7XG4gICAgICAgICAgICBhb2EgPSBjb21wdXRlQW5nbGVPZkF0dGFjayh0aGlzLmZvcndhcmQsIHRoaXMucmlnaHQsIHRoaXMudmVsb2NpdHksIHRoaXMuX3YpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYW5nbGVPZkF0dGFja1JhZCA9IGFvYTtcblxuICAgICAgICBjb25zdCBjbCA9IGNvbXB1dGVDbChhb2EsIHRoaXMuZmxhcHNFeHRlbmRlZCk7XG4gICAgICAgIGNvbnN0IHdhdmVEcmFnID0gY29tcHV0ZUR5bmFtaWNQcmVzc3VyZURyYWdQZW5hbHR5KHNwZWVkLCBhbHRpdHVkZSk7XG4gICAgICAgIGNvbnN0IGNkID0gQ0QwICogKDEgKyB3YXZlRHJhZylcbiAgICAgICAgICAgICsgY29tcHV0ZUluZHVjZWREcmFnKGNsKVxuICAgICAgICAgICAgKyAodGhpcy5sYW5kaW5nR2VhckRlcGxveWVkID8gQ0RfTEFORElOR19HRUFSIDogMClcbiAgICAgICAgICAgICsgKHRoaXMuZmxhcHNFeHRlbmRlZCA/IENEX0ZMQVBTIDogMCk7XG5cbiAgICAgICAgdGhpcy51cGRhdGVTdGFsbFN0YXRlKHNwZWVkLCBhb2EsIGFsdGl0dWRlKTtcblxuICAgICAgICBjb25zdCBwaXRjaEF1dGhvcml0eSA9IHRoaXMuc3RhbGwgPj0gMCA/IDAuMzUgOiAxLjA7XG4gICAgICAgIGNvbnN0IHBpdGNoU3BlZWRBdXRob3JpdHkgPSBjb21wdXRlUGl0Y2hTcGVlZEF1dGhvcml0eShzcGVlZCwgdGhpcy5sYW5kZWQpO1xuICAgICAgICBjb25zdCBwaXRjaEdMaW1pdCA9IGNvbXB1dGVGMTZQaXRjaEdMaW1pdCh0aGlzLmxvYWRGYWN0b3JHLCB0aGlzLnBpdGNoLCBGMTZfUFJPRklMRS5tYXhMb2FkRmFjdG9yRyk7XG4gICAgICAgIGNvbnN0IHBpdGNoQW9hTGltaXQgPSBjb21wdXRlRjE2UGl0Y2hBb2FBdXRob3JpdHkoYW9hLCB0aGlzLnBpdGNoLCBTVEFMTF9BT0EpO1xuICAgICAgICBjb25zdCBhb2FSZWNvdmVyeSA9IGNvbXB1dGVGMTZBb2FSZWNvdmVyeVJhdGUoYW9hLCBTVEFMTF9BT0EsIHNwZWVkKTtcbiAgICAgICAgY29uc3QgeWF3Q29udHJvbFNjYWxlID0gTUlOX0NPTlRST0xfUSArIChjb250cm9sU2NhbGUgLSBNSU5fQ09OVFJPTF9RKSAqIFlBV19DT05UUk9MX1FfU0NBTEU7XG4gICAgICAgIGNvbnN0IG1hY2ggPSBjb21wdXRlTWFjaE51bWJlcihzcGVlZCwgYWx0aXR1ZGUpO1xuXG4gICAgICAgIGNvbnN0IGNvbW1hbmRlZFJvbGxSYXRlID0gY29tcHV0ZUYxNkNvbW1hbmRlZFJvbGxSYXRlKHtcbiAgICAgICAgICAgIHN0aWNrOiB0aGlzLnJvbGwsXG4gICAgICAgICAgICBkeW5hbWljUHJlc3N1cmUsXG4gICAgICAgICAgICBxUmVmOiBRX1JFRixcbiAgICAgICAgICAgIG1hY2gsXG4gICAgICAgICAgICBhbHRpdHVkZU06IGFsdGl0dWRlLFxuICAgICAgICAgICAgYW9hUmFkOiBhb2EsXG4gICAgICAgICAgICBmbGFwc0V4dGVuZGVkOiB0aGlzLmZsYXBzRXh0ZW5kZWQsXG4gICAgICAgICAgICBsYW5kZWQ6IHRoaXMubGFuZGVkLFxuICAgICAgICAgICAgY29uZmlnOiBGMTZfUk9MTF9DT05GSUcsXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmJvZHlSb2xsUmF0ZVJhZCA9IHN0ZXBGMTZCb2R5Um9sbFJhdGUoXG4gICAgICAgICAgICB0aGlzLmJvZHlSb2xsUmF0ZVJhZCxcbiAgICAgICAgICAgIGNvbW1hbmRlZFJvbGxSYXRlLFxuICAgICAgICAgICAgZGVsdGEsXG4gICAgICAgICAgICBGMTZfUk9MTF9DT05GSUcsXG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKCF0aGlzLmxhbmRlZCAmJiBNYXRoLmFicyh0aGlzLmJvZHlSb2xsUmF0ZVJhZCkgPiAxZS02KSB7XG4gICAgICAgICAgICB0aGlzLm9iai5yb3RhdGVaKHRoaXMuYm9keVJvbGxSYXRlUmFkICogZGVsdGEpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMubGFuZGVkKSB7XG4gICAgICAgICAgICB0aGlzLmJvZHlSb2xsUmF0ZVJhZCA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWlzWmVybyh0aGlzLnBpdGNoKVxuICAgICAgICAgICAgJiYgISh0aGlzLmxhbmRlZCAmJiB0aGlzLnBpdGNoIDwgMClcbiAgICAgICAgICAgICYmICh0aGlzLnN0YWxsIDwgMCB8fCAodGhpcy5waXRjaCA8IDAgJiYgdGhpcy51cC55ID4gMCkgfHwgKHRoaXMucGl0Y2ggPiAwICYmIHRoaXMudXAueSA8IDApKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIHRoaXMub2JqLnJvdGF0ZVgoLXRoaXMucGl0Y2ggKiBQSVRDSF9SQVRFICogY29udHJvbFNjYWxlICogcGl0Y2hBdXRob3JpdHkgKiBwaXRjaFNwZWVkQXV0aG9yaXR5ICogcGl0Y2hHTGltaXQgKiBwaXRjaEFvYUxpbWl0ICogZGVsdGEpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhb2FSZWNvdmVyeSAhPT0gMCkge1xuICAgICAgICAgICAgdGhpcy5vYmoucm90YXRlWChNYXRoLnNpZ24oYW9hKSAqIGFvYVJlY292ZXJ5ICogZGVsdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU3RhbGwgbm9zZS1kb3duIGVmZmVjdFxuICAgICAgICBpZiAodGhpcy5zdGFsbCA+IDAgJiYgIXRoaXMubGFuZGVkICYmIHRoaXMucGl0Y2ggPD0gMCkge1xuICAgICAgICAgICAgY29uc3Qgc3RhbGxOb3NlRG93biA9IHRoaXMuc3RhbGwgKiAwLjY7IC8vIHJhZC9zXG4gICAgICAgICAgICBjb25zdCBmb3J3YXJkID0gdGhpcy5mb3J3YXJkO1xuICAgICAgICAgICAgY29uc3QgcmlnaHQgPSB0aGlzLnJpZ2h0O1xuICAgICAgICAgICAgY29uc3QgZ3JvdW5kTm9ybWFsID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgLTEsIDApO1xuICAgICAgICAgICAgY29uc3QgcGl0Y2hEaXIgPSBuZXcgVEhSRUUuVmVjdG9yMygpLmNyb3NzVmVjdG9ycyhmb3J3YXJkLCBncm91bmROb3JtYWwpO1xuICAgICAgICAgICAgY29uc3QgZG90ID0gcGl0Y2hEaXIuZG90KHJpZ2h0KTtcbiAgICAgICAgICAgIHRoaXMub2JqLnJvdGF0ZVgoTWF0aC5zaWduKGRvdCkgKiBzdGFsbE5vc2VEb3duICogZGVsdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTGFuZGVkIG5vc2UtZG93biBlZmZlY3RcbiAgICAgICAgaWYgKHRoaXMubGFuZGVkICYmIHRoaXMucGl0Y2ggPD0gMCkge1xuICAgICAgICAgICAgY29uc3QgZm9yd2FyZCA9IHRoaXMuZm9yd2FyZDtcbiAgICAgICAgICAgIGNvbnN0IHByakZvcndhcmQgPSBuZXcgVEhSRUUuVmVjdG9yMygpLmNvcHkoZm9yd2FyZCkuc2V0WSgwKS5ub3JtYWxpemUoKTtcbiAgICAgICAgICAgIGNvbnN0IHBpdGNoQW5nbGUgPSBmb3J3YXJkLmFuZ2xlVG8ocHJqRm9yd2FyZCkgKiBNYXRoLnNpZ24oZm9yd2FyZC55KTtcblxuICAgICAgICAgICAgaWYgKHBpdGNoQW5nbGUgPiAwLjAwMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNwZWVkRmFjdG9yID0gY2xhbXAoMSAtIHNwZWVkIC8gUk9UQVRJT05fU1BFRUQsIDAsIDEpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZhbGxSYXRlID0gc3BlZWRGYWN0b3IgKiAwLjQ7IC8vIHJhZC9zXG4gICAgICAgICAgICAgICAgY29uc3Qgcm90YXRpb24gPSBNYXRoLm1pbihwaXRjaEFuZ2xlLCBmYWxsUmF0ZSAqIGRlbHRhKTtcbiAgICAgICAgICAgICAgICB0aGlzLm9iai5yb3RhdGVYKHJvdGF0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1heFJvbGxSYXRlID0gbWF4Um9sbFJhdGVSYWQoRjE2X1JPTExfQ09ORklHKTtcbiAgICAgICAgY29uc3Qgcm9sbFlhd0NvdXBsaW5nID0gIXRoaXMubGFuZGVkICYmICFpc1plcm8oc3BlZWQpXG4gICAgICAgICAgICA/IGNvbXB1dGVGMTZSb2xsWWF3Q291cGxpbmcodGhpcy5ib2R5Um9sbFJhdGVSYWQsIGFvYSwgbWF4Um9sbFJhdGUpXG4gICAgICAgICAgICA6IDA7XG5cbiAgICAgICAgaWYgKCFpc1plcm8oc3BlZWQpICYmICghaXNaZXJvKHRoaXMueWF3KSB8fCBNYXRoLmFicyhyb2xsWWF3Q291cGxpbmcpID4gMWUtNikpIHtcbiAgICAgICAgICAgIGNvbnN0IGVmZmVjdGl2ZVlhdyA9IGNsYW1wKHRoaXMueWF3ICsgcm9sbFlhd0NvdXBsaW5nLCAtMSwgMSk7XG4gICAgICAgICAgICB0aGlzLm9iai5yb3RhdGVZKC1lZmZlY3RpdmVZYXcgKiAodGhpcy5sYW5kZWQgPyBZQVdfUkFURV9MQU5ERUQgOiBZQVdfUkFURSkgKiB5YXdDb250cm9sU2NhbGUgKiBkZWx0YSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0aHJ1c3ROID0gY29tcHV0ZUYxNkVuZ2luZVRocnVzdE4odGhpcy5lZmZlY3RpdmVUaHJvdHRsZSwgYWx0aXR1ZGUpO1xuICAgICAgICByb3VuZFRvWmVybyh0aGlzLnRocnVzdC5jb3B5KHRoaXMuZm9yd2FyZCkubXVsdGlwbHlTY2FsYXIodGhydXN0TikpO1xuICAgICAgICB0aGlzLmVuZ2luZVRocnVzdE4gPSB0aHJ1c3ROO1xuXG4gICAgICAgIGlmIChzcGVlZCA+IDFlLTMpIHtcbiAgICAgICAgICAgIHRoaXMudmVsb2NpdHlVbml0LmNvcHkodGhpcy52ZWxvY2l0eSkubXVsdGlwbHlTY2FsYXIoMSAvIHNwZWVkKTtcbiAgICAgICAgICAgIHJvdW5kVG9aZXJvKHRoaXMuZHJhZy5jb3B5KHRoaXMudmVsb2NpdHlVbml0KS5uZWdhdGUoKS5tdWx0aXBseVNjYWxhcihkeW5hbWljUHJlc3N1cmUgKiBXSU5HX0FSRUEgKiBjZCkpO1xuXG4gICAgICAgICAgICBpZiAoc3BlZWQgPiAwLjUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxpZnREaXJlY3Rpb24uY3Jvc3NWZWN0b3JzKHRoaXMucmlnaHQsIHRoaXMudmVsb2NpdHlVbml0KTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5saWZ0RGlyZWN0aW9uLmxlbmd0aFNxKCkgPCAxZS02KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGlmdERpcmVjdGlvbi5jb3B5KHRoaXMudXApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGlmdERpcmVjdGlvbi5ub3JtYWxpemUoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMubGlmdERpcmVjdGlvbi5kb3QodGhpcy51cCkgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxpZnREaXJlY3Rpb24ubmVnYXRlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcm91bmRUb1plcm8odGhpcy5saWZ0LmNvcHkodGhpcy5saWZ0RGlyZWN0aW9uKS5tdWx0aXBseVNjYWxhcihkeW5hbWljUHJlc3N1cmUgKiBXSU5HX0FSRUEgKiBjbCkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxpZnQuc2V0KDAsIDAsIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5kcmFnLnNldCgwLCAwLCAwKTtcbiAgICAgICAgICAgIHRoaXMubGlmdC5zZXQoMCwgMCwgMCk7XG4gICAgICAgIH1cblxuICAgICAgICByb3VuZFRvWmVybyh0aGlzLndlaWdodC5zZXQoMCwgLURSWV9NQVNTICogOS44MDY2NSwgMCkpO1xuXG4gICAgICAgIGlmICghdGhpcy5sYW5kZWQgJiYgc3BlZWQgPiA1KSB7XG4gICAgICAgICAgICBjb25zdCBsYXRlcmFsU3BlZWQgPSB0aGlzLnZlbG9jaXR5LmRvdCh0aGlzLnJpZ2h0KTtcbiAgICAgICAgICAgIGNvbnN0IGZvcndhcmRTcGVlZCA9IHRoaXMudmVsb2NpdHkuZG90KHRoaXMuZm9yd2FyZCk7XG4gICAgICAgICAgICBjb25zdCBiZXRhID0gTWF0aC5hdGFuMihsYXRlcmFsU3BlZWQsIE1hdGgubWF4KE1hdGguYWJzKGZvcndhcmRTcGVlZCksIDUpKTtcbiAgICAgICAgICAgIGNvbnN0IGRhbXBGb3JjZSA9IC1sYXRlcmFsU3BlZWQgKiBTSURFX1NMSVBfREFNUF9SQVRFICogRFJZX01BU1M7XG4gICAgICAgICAgICBjb25zdCBiZXRhRm9yY2UgPSBDWV9CRVRBICogYmV0YSAqIGR5bmFtaWNQcmVzc3VyZSAqIFdJTkdfQVJFQTtcbiAgICAgICAgICAgIHJvdW5kVG9aZXJvKHRoaXMuc2lkZUZvcmNlLmNvcHkodGhpcy5yaWdodCkubXVsdGlwbHlTY2FsYXIoZGFtcEZvcmNlICsgYmV0YUZvcmNlKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNpZGVGb3JjZS5zZXQoMCwgMCwgMCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmZvcmNlcy5zZXQoMCwgMCwgMCkuYWRkKHRoaXMudGhydXN0KS5hZGQodGhpcy5kcmFnKS5hZGQodGhpcy5saWZ0KS5hZGQodGhpcy5zaWRlRm9yY2UpLmFkZCh0aGlzLndlaWdodCk7XG5cbiAgICAgICAgY29uc3Qgb25Hcm91bmQgPSB0aGlzLm9iai5wb3NpdGlvbi55IDw9IFBMQU5FX0RJU1RBTkNFX1RPX0dST1VORCArIDAuMDU7XG4gICAgICAgIGlmICh0aGlzLmxhbmRlZCB8fCAodGhpcy53aGVlbEJyYWtlc0FwcGxpZWQgJiYgb25Hcm91bmQpKSB7XG4gICAgICAgICAgICBjb25zdCB3ZWlnaHRNYWduaXR1ZGUgPSBEUllfTUFTUyAqIDkuODA2NjU7XG4gICAgICAgICAgICBjb25zdCBwcmpGb3JjZXMgPSB0aGlzLl92LmNvcHkodGhpcy5mb3JjZXMpLnNldFkoMCk7XG4gICAgICAgICAgICBjb25zdCBwcmpGb3JjZXNNYWduaXR1ZGUgPSBwcmpGb3JjZXMubGVuZ3RoKCk7XG4gICAgICAgICAgICBjb25zdCBtYXhTdGF0aWNGcmljdGlvbiA9ICh0aGlzLndoZWVsQnJha2VzQXBwbGllZCA/IEdST1VORF9CUkFLRV9TVEFUSUMgOiBHUk9VTkRfRlJJQ1RJT05fU1RBVElDKSAqIHdlaWdodE1hZ25pdHVkZTtcbiAgICAgICAgICAgIGNvbnN0IGtpbmV0aWNGcmljdGlvbiA9ICh0aGlzLndoZWVsQnJha2VzQXBwbGllZCA/IEdST1VORF9CUkFLRV9LSU5FVElDIDogR1JPVU5EX0ZSSUNUSU9OX0tJTkVUSUMpICogd2VpZ2h0TWFnbml0dWRlO1xuXG4gICAgICAgICAgICBpZiAoaXNaZXJvKHNwZWVkKSAmJiBwcmpGb3JjZXNNYWduaXR1ZGUgPCBtYXhTdGF0aWNGcmljdGlvbikge1xuICAgICAgICAgICAgICAgIHRoaXMuZnJpY3Rpb24uY29weShwcmpGb3JjZXMpLm5lZ2F0ZSgpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChzcGVlZCA+IDAuNSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZnJpY3Rpb24uY29weSh0aGlzLnZlbG9jaXR5VW5pdCkuc2V0WSgwKS5uZWdhdGUoKS5ub3JtYWxpemUoKS5tdWx0aXBseVNjYWxhcihraW5ldGljRnJpY3Rpb24pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZyaWN0aW9uLnNldCgwLCAwLCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJvdW5kVG9aZXJvKHRoaXMuZnJpY3Rpb24pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5mcmljdGlvbi5zZXQoMCwgMCwgMCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmZvcmNlcy5hZGQodGhpcy5mcmljdGlvbik7XG4gICAgICAgIGlmICh0aGlzLmxhbmRlZCAmJiB0aGlzLmZvcmNlcy55IDwgMCkge1xuICAgICAgICAgICAgdGhpcy5mb3JjZXMuc2V0WSgwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGFjY2VsID0gcm91bmRUb1plcm8odGhpcy5mb3JjZXMuZGl2aWRlU2NhbGFyKERSWV9NQVNTKSk7XG4gICAgICAgIHRoaXMudXAuY29weShVUCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMub2JqLnF1YXRlcm5pb24pO1xuICAgICAgICBjbGFtcExvYWRGYWN0b3JBY2NlbGVyYXRpb24oYWNjZWwsIHRoaXMudXAsIEYxNl9QUk9GSUxFLm1heExvYWRGYWN0b3JHKTtcbiAgICAgICAgdGhpcy5sb2FkRmFjdG9yRyA9IGNvbXB1dGVMb2FkRmFjdG9yRyhhY2NlbCwgdGhpcy51cCk7XG4gICAgICAgIHRoaXMudmVsb2NpdHkuYWRkU2NhbGVkVmVjdG9yKGFjY2VsLCBkZWx0YSk7XG5cbiAgICAgICAgaWYgKHRoaXMubGFuZGVkICYmIHRoaXMudmVsb2NpdHkueSA8IDApIHtcbiAgICAgICAgICAgIHRoaXMudmVsb2NpdHkuc2V0WSgwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMub2JqLnBvc2l0aW9uLmFkZFNjYWxlZFZlY3RvcihcbiAgICAgICAgICAgIHRoaXMubGFuZGVkID8gcm91bmRUb1plcm8odGhpcy52ZWxvY2l0eSwgMC4wMSkgOiB0aGlzLnZlbG9jaXR5LFxuICAgICAgICAgICAgZGVsdGFcbiAgICAgICAgKTtcblxuICAgICAgICBpZiAodGhpcy5vYmoucG9zaXRpb24ueSA+IFBMQU5FX0RJU1RBTkNFX1RPX0dST1VORCkge1xuICAgICAgICAgICAgdGhpcy5sYW5kZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaGFuZGxlR3JvdW5kQ29udGFjdChzcGVlZCk7XG5cbiAgICAgICAgdGhpcy53cmFwUG9zaXRpb24oKTtcbiAgICB9XG5cbiAgICBnZXRTdGFsbFN0YXR1cygpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5zdGFsbDtcbiAgICB9XG5cbiAgICBnZXRUaHJvdHRsZUh1ZFRleHQoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGZvcm1hdEYxNlRocm90dGxlSHVkKHRoaXMudGhyb3R0bGUpO1xuICAgIH1cblxuICAgIHVzZUYxNlRocm90dGxlRGV0ZW50cygpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgc3RlcFRocm90dGxlRGV0ZW50KGN1cnJlbnQ6IG51bWJlciwgZGlyZWN0aW9uOiAxIHwgLTEpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gc3RlcEYxNlRocm90dGxlRGV0ZW50KGN1cnJlbnQsIGRpcmVjdGlvbik7XG4gICAgfVxuXG4gICAgaXNJblRocm90dGxlQWJEZXRlbnRCYW5kKGxldmVyOiBudW1iZXIpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIGlzRjE2QWJEZXRlbnRCYW5kKGxldmVyKTtcbiAgICB9XG5cbiAgICBhZGp1c3RUaHJvdHRsZUlucHV0KGN1cnJlbnQ6IG51bWJlciwgc3RlcDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIGFkanVzdEYxNlRocm90dGxlSW5wdXQoY3VycmVudCwgc3RlcCk7XG4gICAgfVxuXG4gICAgZ2V0VGhyb3R0bGVab25lKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBnZXRGMTZUaHJvdHRsZVpvbmUodGhpcy5lZmZlY3RpdmVUaHJvdHRsZSk7XG4gICAgfVxuXG4gICAgZ2V0VGhyb3R0bGVBdWRpb0xldmVsKCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiBmMTZUaHJvdHRsZUF1ZGlvTGV2ZWwodGhpcy5lZmZlY3RpdmVUaHJvdHRsZSk7XG4gICAgfVxuXG4gICAgZ2V0RW5naW5lTm96emxlQ29sb3IoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGdldEYxNkVuZ2luZU5venpsZUNvbG9yKHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUpO1xuICAgIH1cblxuICAgIHByaXZhdGUgdXBkYXRlU3RhbGxTdGF0ZShzcGVlZDogbnVtYmVyLCBhb2E6IG51bWJlciwgYWx0aXR1ZGU6IG51bWJlcikge1xuICAgICAgICBpZiAodGhpcy5sYW5kZWQgfHwgc3BlZWQgPCA1KSB7XG4gICAgICAgICAgICB0aGlzLnN0YWxsID0gLTE7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhb2FTdGFsbCA9IGNsYW1wKChNYXRoLmFicyhhb2EpIC0gU1RBTExfQU9BICogMC43NSkgLyAoU1RBTExfQU9BICogMC4zNSksIDAsIDEpO1xuICAgICAgICBjb25zdCBzcGVlZFN0YWxsID0gY2xhbXAoKE1JTl9GTFlJTkdfU1BFRUQgLSBzcGVlZCkgLyBNSU5fRkxZSU5HX1NQRUVELCAwLCAxKTtcbiAgICAgICAgLy8gT25seSBjb25zaWRlciBzcGVlZC1iYXNlZCBzdGFsbCBpZiB3ZSBhcmUgaGlnaCBlbm91Z2ggdG8gYXZvaWQgaW50ZXJmZXJpbmcgd2l0aCB0YWtlb2ZmL2xhbmRpbmdcbiAgICAgICAgY29uc3Qgc3RhbGxMZXZlbCA9IE1hdGgubWF4KGFvYVN0YWxsLCBhbHRpdHVkZSA+IFBMQU5FX0RJU1RBTkNFX1RPX0dST1VORCArIDUgPyBzcGVlZFN0YWxsIDogMCk7XG4gICAgICAgIHRoaXMuc3RhbGwgPSBzdGFsbExldmVsID4gMCA/IHN0YWxsTGV2ZWwgOiAtMTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGhhbmRsZUdyb3VuZENvbnRhY3Qoc3BlZWQ6IG51bWJlcikge1xuICAgICAgICBpZiAodGhpcy5vYmoucG9zaXRpb24ueSA+PSBQTEFORV9ESVNUQU5DRV9UT19HUk9VTkQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMub2JqLnBvc2l0aW9uLnkgPSBQTEFORV9ESVNUQU5DRV9UT19HUk9VTkQ7XG5cbiAgICAgICAgY29uc3QgZm9yd2FyZCA9IHRoaXMuZm9yd2FyZC5jb3B5KEZPUldBUkQpLmFwcGx5UXVhdGVybmlvbih0aGlzLm9iai5xdWF0ZXJuaW9uKTtcbiAgICAgICAgY29uc3QgdXAgPSB0aGlzLnVwLmNvcHkoVVApLmFwcGx5UXVhdGVybmlvbih0aGlzLm9iai5xdWF0ZXJuaW9uKTtcbiAgICAgICAgY29uc3QgcmlnaHQgPSB0aGlzLnJpZ2h0LmNvcHkoUklHSFQpLmFwcGx5UXVhdGVybmlvbih0aGlzLm9iai5xdWF0ZXJuaW9uKTtcblxuICAgICAgICBjb25zdCBwcmpGb3J3YXJkID0gbmV3IFRIUkVFLlZlY3RvcjMoKS5jb3B5KGZvcndhcmQpLnNldFkoMCkubm9ybWFsaXplKCk7XG4gICAgICAgIGNvbnN0IHBpdGNoQW5nbGUgPSBmb3J3YXJkLmFuZ2xlVG8ocHJqRm9yd2FyZCkgKiBNYXRoLnNpZ24oZm9yd2FyZC55KTtcblxuICAgICAgICBjb25zdCBwcmpSaWdodCA9IG5ldyBUSFJFRS5WZWN0b3IzKCkuY29weShyaWdodCkuc2V0WSgwKS5ub3JtYWxpemUoKTtcbiAgICAgICAgY29uc3Qgcm9sbEFuZ2xlID0gcmlnaHQuYW5nbGVUbyhwcmpSaWdodCkgKiBNYXRoLnNpZ24ocmlnaHQueSk7XG5cbiAgICAgICAgaWYgKHRoaXMubGFuZGluZ0dlYXJEZXBsb3llZCA9PT0gZmFsc2VcbiAgICAgICAgICAgIHx8IHNwZWVkID4gTEFOREVEX01BWF9TUEVFRFxuICAgICAgICAgICAgfHwgdGhpcy52ZWxvY2l0eS55IDwgLUxBTkRJTkdfTUFYX1ZTUEVFRFxuICAgICAgICAgICAgfHwgTWF0aC5hYnMocm9sbEFuZ2xlKSA+IExBTkRJTkdfTUFYX1JPTExcbiAgICAgICAgICAgIHx8IExBTkRJTkdfTUlOX1BJVENIID4gcGl0Y2hBbmdsZSkge1xuICAgICAgICAgICAgdGhpcy5jcmFzaGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChmb3J3YXJkLnkgPCAwKSB7XG4gICAgICAgICAgICBjb25zdCBoZWFkaW5nID0gbmV3IFRIUkVFLlZlY3RvcjMoKS5jb3B5KGZvcndhcmQpLnNldFkoMCkubm9ybWFsaXplKCk7XG4gICAgICAgICAgICB0aGlzLm9iai5xdWF0ZXJuaW9uLnNldEZyb21Vbml0VmVjdG9ycyhGT1JXQVJELCBoZWFkaW5nKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnZlbG9jaXR5LnNldFkoMCk7XG4gICAgICAgIHRoaXMuc3RhbGwgPSAtMTtcbiAgICAgICAgdGhpcy5sYW5kZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIHByaXZhdGUgd3JhcFBvc2l0aW9uKCkge1xuICAgICAgICBjb25zdCB0ZXJyYWluSGFsZlNpemUgPSAyLjUgKiBURVJSQUlOX1NDQUxFICogVEVSUkFJTl9NT0RFTF9TSVpFO1xuICAgICAgICBpZiAodGhpcy5vYmoucG9zaXRpb24ueCA+IHRlcnJhaW5IYWxmU2l6ZSkgdGhpcy5vYmoucG9zaXRpb24ueCA9IC10ZXJyYWluSGFsZlNpemU7XG4gICAgICAgIGlmICh0aGlzLm9iai5wb3NpdGlvbi54IDwgLXRlcnJhaW5IYWxmU2l6ZSkgdGhpcy5vYmoucG9zaXRpb24ueCA9IHRlcnJhaW5IYWxmU2l6ZTtcbiAgICAgICAgaWYgKHRoaXMub2JqLnBvc2l0aW9uLnogPiB0ZXJyYWluSGFsZlNpemUpIHRoaXMub2JqLnBvc2l0aW9uLnogPSAtdGVycmFpbkhhbGZTaXplO1xuICAgICAgICBpZiAodGhpcy5vYmoucG9zaXRpb24ueiA8IC10ZXJyYWluSGFsZlNpemUpIHRoaXMub2JqLnBvc2l0aW9uLnogPSB0ZXJyYWluSGFsZlNpemU7XG4gICAgfVxufVxuIiwiaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuaW1wb3J0IHsgUmVhbGlzdGljRmxpZ2h0TW9kZWwgfSBmcm9tICcuLi9tb2RlbC9yZWFsaXN0aWNGbGlnaHRNb2RlbCc7XG5pbXBvcnQgeyBBcmNhZGVGbGlnaHRNb2RlbCB9IGZyb20gJy4uL21vZGVsL2FyY2FkZUZsaWdodE1vZGVsJztcbmltcG9ydCB7IERlYnVnRmxpZ2h0TW9kZWwgfSBmcm9tICcuLi9tb2RlbC9kZWJ1Z0ZsaWdodE1vZGVsJztcbmltcG9ydCB7IEZtMkZsaWdodE1vZGVsIH0gZnJvbSAnLi4vbW9kZWwvZm0yRmxpZ2h0TW9kZWwnO1xuaW1wb3J0IHsgRmxpZ2h0TW9kZWwgfSBmcm9tICcuLi9tb2RlbC9mbGlnaHRNb2RlbCc7XG5cbmxldCBmbGlnaHRNb2RlbDogRmxpZ2h0TW9kZWw7XG5cbnNlbGYub25tZXNzYWdlID0gKGV2ZW50OiBNZXNzYWdlRXZlbnQpID0+IHtcbiAgICB0cnkge1xuICAgICAgICBoYW5kbGVNZXNzYWdlKGV2ZW50LmRhdGEpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zdCBlID0gZXJyIGFzIEVycm9yO1xuICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHsgdHlwZTogJ2Vycm9yJywgbWVzc2FnZTogYCR7ZT8ubmFtZX06ICR7ZT8ubWVzc2FnZX1gLCBzdGFjazogZT8uc3RhY2sgfSk7XG4gICAgfVxufTtcblxuZnVuY3Rpb24gaGFuZGxlTWVzc2FnZShkYXRhOiBhbnkpIHtcbiAgICBzd2l0Y2ggKGRhdGEudHlwZSkge1xuICAgICAgICBjYXNlICdpbml0JzpcbiAgICAgICAgICAgIGlmIChkYXRhLm1vZGVsVHlwZSA9PT0gJ3JlYWxpc3RpYycpIHtcbiAgICAgICAgICAgICAgICBmbGlnaHRNb2RlbCA9IG5ldyBSZWFsaXN0aWNGbGlnaHRNb2RlbCgpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChkYXRhLm1vZGVsVHlwZSA9PT0gJ2ZtMicpIHtcbiAgICAgICAgICAgICAgICBmbGlnaHRNb2RlbCA9IG5ldyBGbTJGbGlnaHRNb2RlbCgpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChkYXRhLm1vZGVsVHlwZSA9PT0gJ2FyY2FkZScpIHtcbiAgICAgICAgICAgICAgICBmbGlnaHRNb2RlbCA9IG5ldyBBcmNhZGVGbGlnaHRNb2RlbCgpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChkYXRhLm1vZGVsVHlwZSA9PT0gJ2RlYnVnJykge1xuICAgICAgICAgICAgICAgIGZsaWdodE1vZGVsID0gbmV3IERlYnVnRmxpZ2h0TW9kZWwoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgJ3VwZGF0ZSc6XG4gICAgICAgICAgICBpZiAoIWZsaWdodE1vZGVsKSByZXR1cm47XG4gICAgICAgICAgICBmbGlnaHRNb2RlbC5zZXRQaXRjaChkYXRhLmlucHV0cy5waXRjaCk7XG4gICAgICAgICAgICBmbGlnaHRNb2RlbC5zZXRSb2xsKGRhdGEuaW5wdXRzLnJvbGwpO1xuICAgICAgICAgICAgZmxpZ2h0TW9kZWwuc2V0WWF3KGRhdGEuaW5wdXRzLnlhdyk7XG4gICAgICAgICAgICBmbGlnaHRNb2RlbC5zZXRUaHJvdHRsZShkYXRhLmlucHV0cy50aHJvdHRsZSk7XG4gICAgICAgICAgICBmbGlnaHRNb2RlbC5zZXRMYW5kaW5nR2VhckRlcGxveWVkKGRhdGEuaW5wdXRzLmxhbmRpbmdHZWFyRGVwbG95ZWQpO1xuICAgICAgICAgICAgZmxpZ2h0TW9kZWwuc2V0RmxhcHNFeHRlbmRlZChkYXRhLmlucHV0cy5mbGFwc0V4dGVuZGVkKTtcbiAgICAgICAgICAgIGZsaWdodE1vZGVsLnNldFdoZWVsQnJha2VzKGRhdGEuaW5wdXRzLndoZWVsQnJha2VzQXBwbGllZCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZsaWdodE1vZGVsLnVwZGF0ZShkYXRhLmRlbHRhKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc2VuZFN0YXRlKCk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICdyZXNldCc6XG4gICAgICAgICAgICBpZiAoIWZsaWdodE1vZGVsKSByZXR1cm47XG4gICAgICAgICAgICBmbGlnaHRNb2RlbC5yZXNldCgpO1xuICAgICAgICAgICAgZmxpZ2h0TW9kZWwucG9zaXRpb24uc2V0KGRhdGEucG9zaXRpb25bMF0sIGRhdGEucG9zaXRpb25bMV0sIGRhdGEucG9zaXRpb25bMl0pO1xuICAgICAgICAgICAgZmxpZ2h0TW9kZWwucXVhdGVybmlvbi5zZXQoZGF0YS5xdWF0ZXJuaW9uWzBdLCBkYXRhLnF1YXRlcm5pb25bMV0sIGRhdGEucXVhdGVybmlvblsyXSwgZGF0YS5xdWF0ZXJuaW9uWzNdKTtcbiAgICAgICAgICAgIGZsaWdodE1vZGVsLnZlbG9jaXR5VmVjdG9yLnNldChkYXRhLnZlbG9jaXR5WzBdLCBkYXRhLnZlbG9jaXR5WzFdLCBkYXRhLnZlbG9jaXR5WzJdKTtcbiAgICAgICAgICAgIGZsaWdodE1vZGVsLnNldExhbmRlZChkYXRhLmxhbmRlZCk7XG4gICAgICAgICAgICBmbGlnaHRNb2RlbC5zZXRUaHJvdHRsZShkYXRhLnRocm90dGxlKTtcbiAgICAgICAgICAgIHNlbmRTdGF0ZSgpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnc3luY0VmZmVjdGl2ZVRocm90dGxlJzpcbiAgICAgICAgICAgIGlmICghZmxpZ2h0TW9kZWwpIHJldHVybjtcbiAgICAgICAgICAgIGZsaWdodE1vZGVsLnNldFRocm90dGxlKGRhdGEudGhyb3R0bGUpO1xuICAgICAgICAgICAgZmxpZ2h0TW9kZWwuc3luY0VmZmVjdGl2ZVRocm90dGxlKCk7XG4gICAgICAgICAgICBzZW5kU3RhdGUoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgJ3NldFBvc2l0aW9uJzpcbiAgICAgICAgICAgIGlmICghZmxpZ2h0TW9kZWwpIHJldHVybjtcbiAgICAgICAgICAgIGZsaWdodE1vZGVsLnBvc2l0aW9uLnNldChkYXRhLnBvc2l0aW9uWzBdLCBkYXRhLnBvc2l0aW9uWzFdLCBkYXRhLnBvc2l0aW9uWzJdKTtcbiAgICAgICAgICAgIHNlbmRTdGF0ZSgpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnc2V0UXVhdGVybmlvbic6XG4gICAgICAgICAgICBpZiAoIWZsaWdodE1vZGVsKSByZXR1cm47XG4gICAgICAgICAgICBmbGlnaHRNb2RlbC5xdWF0ZXJuaW9uLnNldChkYXRhLnF1YXRlcm5pb25bMF0sIGRhdGEucXVhdGVybmlvblsxXSwgZGF0YS5xdWF0ZXJuaW9uWzJdLCBkYXRhLnF1YXRlcm5pb25bM10pO1xuICAgICAgICAgICAgc2VuZFN0YXRlKCk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICdzZXRWZWxvY2l0eSc6XG4gICAgICAgICAgICBpZiAoIWZsaWdodE1vZGVsKSByZXR1cm47XG4gICAgICAgICAgICBmbGlnaHRNb2RlbC52ZWxvY2l0eVZlY3Rvci5zZXQoZGF0YS52ZWxvY2l0eVswXSwgZGF0YS52ZWxvY2l0eVsxXSwgZGF0YS52ZWxvY2l0eVsyXSk7XG4gICAgICAgICAgICBzZW5kU3RhdGUoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgJ3NuYXBQaHlzaWNzU3RhdGUnOlxuICAgICAgICAgICAgaWYgKCFmbGlnaHRNb2RlbCkgcmV0dXJuO1xuICAgICAgICAgICAgZmxpZ2h0TW9kZWwuc25hcFBoeXNpY3NTdGF0ZSgpO1xuICAgICAgICAgICAgc2VuZFN0YXRlKCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG59O1xuXG5mdW5jdGlvbiBzZW5kU3RhdGUoKSB7XG4gICAgaWYgKCFmbGlnaHRNb2RlbCkgcmV0dXJuO1xuICAgIGNvbnN0IHN0YXRlID0ge1xuICAgICAgICBwb3NpdGlvbjogZmxpZ2h0TW9kZWwucG9zaXRpb24udG9BcnJheSgpLFxuICAgICAgICBxdWF0ZXJuaW9uOiBmbGlnaHRNb2RlbC5xdWF0ZXJuaW9uLnRvQXJyYXkoKSxcbiAgICAgICAgdmVsb2NpdHk6IGZsaWdodE1vZGVsLnZlbG9jaXR5VmVjdG9yLnRvQXJyYXkoKSxcbiAgICAgICAgLy8gQHRzLWlnbm9yZSAtIGFjY2Vzc2luZyBwcm90ZWN0ZWQgbWVtYmVycyBmb3IgdHJhbnNmZXJcbiAgICAgICAgcHJldlBvc2l0aW9uOiBmbGlnaHRNb2RlbC5wcmV2UG9zaXRpb24udG9BcnJheSgpLFxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHByZXZRdWF0ZXJuaW9uOiBmbGlnaHRNb2RlbC5wcmV2UXVhdGVybmlvbi50b0FycmF5KCksXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcHJldlZlbG9jaXR5OiBmbGlnaHRNb2RlbC5wcmV2VmVsb2NpdHkudG9BcnJheSgpLFxuICAgICAgICBjcmFzaGVkOiBmbGlnaHRNb2RlbC5pc0NyYXNoZWQoKSxcbiAgICAgICAgbGFuZGVkOiBmbGlnaHRNb2RlbC5pc0xhbmRlZCgpLFxuICAgICAgICBhbmdsZU9mQXR0YWNrUmFkOiBmbGlnaHRNb2RlbC5nZXRBbmdsZU9mQXR0YWNrKCksXG4gICAgICAgIGxvYWRGYWN0b3JHOiBmbGlnaHRNb2RlbC5nZXRMb2FkRmFjdG9yRygpLFxuICAgICAgICBlbmdpbmVUaHJ1c3ROOiBmbGlnaHRNb2RlbC5nZXRFbmdpbmVUaHJ1c3RLbigpICogMTAwMCxcbiAgICAgICAgZWZmZWN0aXZlVGhyb3R0bGU6IGZsaWdodE1vZGVsLmdldEVmZmVjdGl2ZVRocm90dGxlKCksXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgZGVsdGFSZW1haW5kZXI6IGZsaWdodE1vZGVsLmRlbHRhUmVtYWluZGVyLFxuICAgICAgICBzdGFsbDogZmxpZ2h0TW9kZWwuZ2V0U3RhbGxTdGF0dXMoKVxuICAgIH07XG5cbiAgICBzZWxmLnBvc3RNZXNzYWdlKHsgdHlwZTogJ3N0YXRlJywgc3RhdGUgfSk7XG59XG4iLCJpbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5cbmNvbnN0IF92ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbmNvbnN0IF93ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbmNvbnN0IF9xID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcblxuY29uc3QgRVBTSUxPTiA9IDAuMDAwMTtcblxuZXhwb3J0IGNvbnN0IFpFUk8gPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAwKTtcbmV4cG9ydCBjb25zdCBVUCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDEsIDApO1xuZXhwb3J0IGNvbnN0IEZPUldBUkQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAxKTtcbmV4cG9ydCBjb25zdCBSSUdIVCA9IG5ldyBUSFJFRS5WZWN0b3IzKDEsIDAsIDApO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNaZXJvKG46IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIHJldHVybiAtRVBTSUxPTiA8PSBuICYmIG4gPD0gRVBTSUxPTjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVxdWFscyhhOiBudW1iZXIsIGI6IG51bWJlciwgZXBzaWxvbjogbnVtYmVyID0gRVBTSUxPTik6IGJvb2xlYW4ge1xuICAgIHJldHVybiBhIC0gZXBzaWxvbiA8PSBiICYmIGIgPD0gYSArIGVwc2lsb247XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbGFtcChuOiBudW1iZXIsIG1pbjogbnVtYmVyLCBtYXg6IG51bWJlcik6IG51bWJlciB7XG4gICAgcmV0dXJuIE1hdGgubWF4KG1pbiwgTWF0aC5taW4obiwgbWF4KSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsZXJwKHQ6IG51bWJlciwgbjA6IG51bWJlciwgbjE6IG51bWJlcik6IG51bWJlciB7XG4gICAgcmV0dXJuIG4wICsgdCAqIChuMSAtIG4wKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHZlY3RvckhlYWRpbmcodjogVEhSRUUuVmVjdG9yMyk6IG51bWJlciB7XG4gICAgbGV0IGJlYXJpbmcgPSBNYXRoLnJvdW5kKE1hdGguYXRhbjIodi54LCAtdi56KSAvICgyICogTWF0aC5QSSkgKiAzNjApO1xuICAgIGlmIChiZWFyaW5nIDwgMCkge1xuICAgICAgICBiZWFyaW5nID0gMzYwICsgYmVhcmluZztcbiAgICB9XG4gICAgcmV0dXJuIGJlYXJpbmc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByb3VuZFRvWmVybyh2OiBUSFJFRS5WZWN0b3IzLCBlcHNpbG9uOiBudW1iZXIgPSBFUFNJTE9OKTogVEhSRUUuVmVjdG9yMyB7XG4gICAgaWYgKGVxdWFscyh2LngsIDAuMCwgZXBzaWxvbikpIHtcbiAgICAgICAgdi54ID0gMDtcbiAgICB9XG4gICAgaWYgKGVxdWFscyh2LnksIDAuMCwgZXBzaWxvbikpIHtcbiAgICAgICAgdi55ID0gMDtcbiAgICB9XG4gICAgaWYgKGVxdWFscyh2LnosIDAuMCwgZXBzaWxvbikpIHtcbiAgICAgICAgdi56ID0gMDtcbiAgICB9XG4gICAgcmV0dXJuIHY7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlYXNlT3V0Q2lyYyh4OiBudW1iZXIpOiBudW1iZXIge1xuICAgIHJldHVybiBNYXRoLnNxcnQoMSAtICh4IC0gMSkgKiAoeCAtIDEpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVhc2VPdXRRdWFkKHg6IG51bWJlcikge1xuICAgIHJldHVybiAxIC0gKDEgLSB4KSAqICgxIC0geCk7XG59XG5leHBvcnQgZnVuY3Rpb24gZWFzZU91dFF1aW50KHg6IG51bWJlcikge1xuICAgIHJldHVybiAxIC0gTWF0aC5wb3coMSAtIHgsIDUpO1xufVxuXG5leHBvcnQgY29uc3QgUElfT1ZFUl8xODAgPSBNYXRoLlBJIC8gMTgwLjA7XG5leHBvcnQgY29uc3QgTjE4MF9PVkVSX1BJID0gMTgwLjAgLyBNYXRoLlBJO1xuXG5leHBvcnQgZnVuY3Rpb24gdG9SYWRpYW5zKGRlZ3JlZXM6IG51bWJlcik6IG51bWJlciB7XG4gICAgcmV0dXJuIFBJX09WRVJfMTgwICogZGVncmVlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvRGVncmVlcyhyYWRpYW5zOiBudW1iZXIpOiBudW1iZXIge1xuICAgIHJldHVybiBOMTgwX09WRVJfUEkgKiByYWRpYW5zO1xufVxuXG4vLyBSZXR1cm5zIFtwaXRjaCwgcm9sbF0gaW4gcmFkaWFuc1xuZXhwb3J0IGZ1bmN0aW9uIGNhbGN1bGF0ZVBpdGNoUm9sbChhY3Rvcjoge1xuICAgIHF1YXRlcm5pb246IFRIUkVFLlF1YXRlcm5pb247XG4gICAgZ2V0V29ybGREaXJlY3Rpb246ICh2OiBUSFJFRS5WZWN0b3IzKSA9PiBUSFJFRS5WZWN0b3IzO1xufSk6IFtudW1iZXIsIG51bWJlcl0ge1xuICAgIGNvbnN0IGZvcndhcmQgPSBhY3Rvci5nZXRXb3JsZERpcmVjdGlvbihfdik7XG4gICAgY29uc3QgcHJqRm9yd2FyZCA9IF93LmNvcHkoZm9yd2FyZClcbiAgICAgICAgLnNldFkoMClcbiAgICAgICAgLm5vcm1hbGl6ZSgpO1xuICAgIGNvbnN0IHBpdGNoID0gZm9yd2FyZC5hbmdsZVRvKHByakZvcndhcmQpICogTWF0aC5zaWduKGZvcndhcmQueSk7XG5cbiAgICBfcS5zZXRGcm9tVW5pdFZlY3RvcnMoZm9yd2FyZCwgcHJqRm9yd2FyZCk7XG5cbiAgICBjb25zdCByaWdodCA9IF92LmNvcHkoUklHSFQpXG4gICAgICAgIC5hcHBseVF1YXRlcm5pb24oYWN0b3IucXVhdGVybmlvbilcbiAgICAgICAgLmFwcGx5UXVhdGVybmlvbihfcSk7XG4gICAgX3Euc2V0RnJvbVVuaXRWZWN0b3JzKHByakZvcndhcmQsIEZPUldBUkQpO1xuICAgIHJpZ2h0LmFwcGx5UXVhdGVybmlvbihfcSk7XG4gICAgbGV0IHJvbGwgPSBNYXRoLmFjb3MocmlnaHQueCkgKiBNYXRoLnNpZ24ocmlnaHQueSk7XG4gICAgcm9sbCA9IGlzTmFOKHJvbGwpID8gMC4wIDogcm9sbDtcblxuICAgIHJldHVybiBbcGl0Y2gsIHJvbGxdO1xufVxuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxuY29uc3QgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHRjb25zdCBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0Y29uc3QgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRpZiAoIShtb2R1bGVJZCBpbiBfX3dlYnBhY2tfbW9kdWxlc19fKSkge1xuXHRcdGRlbGV0ZSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRcdGNvbnN0IGUgPSBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiICsgbW9kdWxlSWQgKyBcIidcIik7XG5cdFx0ZS5jb2RlID0gJ01PRFVMRV9OT1RfRk9VTkQnO1xuXHRcdHRocm93IGU7XG5cdH1cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4vLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuX193ZWJwYWNrX3JlcXVpcmVfXy5tID0gX193ZWJwYWNrX21vZHVsZXNfXztcblxuLy8gdGhlIHN0YXJ0dXAgZnVuY3Rpb25cbl9fd2VicGFja19yZXF1aXJlX18ueCA9ICgpID0+IHtcblx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG5cdC8vIFRoaXMgZW50cnkgbW9kdWxlIGRlcGVuZHMgb24gb3RoZXIgbG9hZGVkIGNodW5rcyBhbmQgZXhlY3V0aW9uIG5lZWQgdG8gYmUgZGVsYXllZFxuXHRsZXQgX193ZWJwYWNrX2V4cG9ydHNfXyA9IF9fd2VicGFja19yZXF1aXJlX18uTyh1bmRlZmluZWQsIFtcInZlbmRvcnMtbm9kZV9tb2R1bGVzX3RocmVlX2J1aWxkX3RocmVlX21vZHVsZV9qc1wiXSwgKCkgPT4gKF9fd2VicGFja19yZXF1aXJlX18oXCIuL3NyYy9zY3JpcHQvcGh5c2ljcy93b3JrZXIvZmxpZ2h0V29ya2VyLnRzXCIpKSlcblx0X193ZWJwYWNrX2V4cG9ydHNfXyA9IF9fd2VicGFja19yZXF1aXJlX18uTyhfX3dlYnBhY2tfZXhwb3J0c19fKTtcblx0cmV0dXJuIF9fd2VicGFja19leHBvcnRzX187XG59O1xuXG4iLCJjb25zdCBkZWZlcnJlZCA9IFtdO1xuX193ZWJwYWNrX3JlcXVpcmVfXy5PID0gKHJlc3VsdCwgY2h1bmtJZHMsIGZuLCBwcmlvcml0eSkgPT4ge1xuXHRpZihjaHVua0lkcykge1xuXHRcdHByaW9yaXR5ID0gcHJpb3JpdHkgfHwgMDtcblx0XHRmb3IodmFyIGkgPSBkZWZlcnJlZC5sZW5ndGg7IGkgPiAwICYmIGRlZmVycmVkW2kgLSAxXVsyXSA+IHByaW9yaXR5OyBpLS0pIGRlZmVycmVkW2ldID0gZGVmZXJyZWRbaSAtIDFdO1xuXHRcdGRlZmVycmVkW2ldID0gW2NodW5rSWRzLCBmbiwgcHJpb3JpdHldO1xuXHRcdHJldHVybjtcblx0fVxuXHRsZXQgbm90RnVsZmlsbGVkID0gSW5maW5pdHk7XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgZGVmZXJyZWQubGVuZ3RoOyBpKyspIHtcblx0XHRsZXQgW2NodW5rSWRzLCBmbiwgcHJpb3JpdHldID0gZGVmZXJyZWRbaV07XG5cdFx0bGV0IGZ1bGZpbGxlZCA9IHRydWU7XG5cdFx0Zm9yICh2YXIgaiA9IDA7IGogPCBjaHVua0lkcy5sZW5ndGg7IGorKykge1xuXHRcdFx0aWYgKChwcmlvcml0eSAmIDEgPT09IDAgfHwgbm90RnVsZmlsbGVkID49IHByaW9yaXR5KSAmJiBPYmplY3Qua2V5cyhfX3dlYnBhY2tfcmVxdWlyZV9fLk8pLmV2ZXJ5KChrZXkpID0+IChfX3dlYnBhY2tfcmVxdWlyZV9fLk9ba2V5XShjaHVua0lkc1tqXSkpKSkge1xuXHRcdFx0XHRjaHVua0lkcy5zcGxpY2Uoai0tLCAxKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGZ1bGZpbGxlZCA9IGZhbHNlO1xuXHRcdFx0XHRpZihwcmlvcml0eSA8IG5vdEZ1bGZpbGxlZCkgbm90RnVsZmlsbGVkID0gcHJpb3JpdHk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmKGZ1bGZpbGxlZCkge1xuXHRcdFx0ZGVmZXJyZWQuc3BsaWNlKGktLSwgMSlcblx0XHRcdGNvbnN0IHIgPSBmbigpO1xuXHRcdFx0aWYgKHIgIT09IHVuZGVmaW5lZCkgcmVzdWx0ID0gcjtcblx0XHR9XG5cdH1cblx0cmV0dXJuIHJlc3VsdDtcbn07IiwiLy8gZGVmaW5lIGdldHRlci92YWx1ZSBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0aWYoQXJyYXkuaXNBcnJheShkZWZpbml0aW9uKSkge1xuXHRcdHZhciBpID0gMDtcblx0XHR3aGlsZShpIDwgZGVmaW5pdGlvbi5sZW5ndGgpIHtcblx0XHRcdHZhciBrZXkgPSBkZWZpbml0aW9uW2krK107XG5cdFx0XHR2YXIgYmluZGluZyA9IGRlZmluaXRpb25baSsrXTtcblx0XHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0XHRpZihiaW5kaW5nID09PSAwKSB7XG5cdFx0XHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCB2YWx1ZTogZGVmaW5pdGlvbltpKytdIH0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBiaW5kaW5nIH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYoYmluZGluZyA9PT0gMCkgeyBpKys7IH1cblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18uZiA9IHt9O1xuLy8gVGhpcyBmaWxlIGNvbnRhaW5zIG9ubHkgdGhlIGVudHJ5IGNodW5rLlxuLy8gVGhlIGNodW5rIGxvYWRpbmcgZnVuY3Rpb24gZm9yIGFkZGl0aW9uYWwgY2h1bmtzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmUgPSAoY2h1bmtJZCkgPT4ge1xuXHRyZXR1cm4gUHJvbWlzZS5hbGwoT2JqZWN0LmtleXMoX193ZWJwYWNrX3JlcXVpcmVfXy5mKS5yZWR1Y2UoKHByb21pc2VzLCBrZXkpID0+IHtcblx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmZba2V5XShjaHVua0lkLCBwcm9taXNlcyk7XG5cdFx0cmV0dXJuIHByb21pc2VzO1xuXHR9LCBbXSkpO1xufTsiLCIvLyBUaGlzIGZ1bmN0aW9uIGFsbG93IHRvIHJlZmVyZW5jZSBhc3luYyBjaHVua3MgYW5kIGNodW5rcyB0aGF0IHRoZSBlbnRyeXBvaW50IGRlcGVuZHMgb25cbl9fd2VicGFja19yZXF1aXJlX18udSA9IChjaHVua0lkKSA9PiB7XG5cdC8vIHJldHVybiB1cmwgZm9yIGZpbGVuYW1lcyBiYXNlZCBvbiB0ZW1wbGF0ZVxuXHRyZXR1cm4gXCJcIiArIGNodW5rSWQgKyBcIi5idW5kbGUuanNcIjtcbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5nID0gKGZ1bmN0aW9uKCkge1xuXHRpZiAodHlwZW9mIGdsb2JhbFRoaXMgPT09ICdvYmplY3QnKSByZXR1cm4gZ2xvYmFsVGhpcztcblx0dHJ5IHtcblx0XHRyZXR1cm4gdGhpcyB8fCBuZXcgRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdGlmICh0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JykgcmV0dXJuIHdpbmRvdztcblx0fVxufSkoKTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYoU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwibGV0IHNjcmlwdFVybDtcbmlmIChfX3dlYnBhY2tfcmVxdWlyZV9fLmcuaW1wb3J0U2NyaXB0cykgc2NyaXB0VXJsID0gX193ZWJwYWNrX3JlcXVpcmVfXy5nLmxvY2F0aW9uICsgXCJcIjtcbmNvbnN0IGRvY3VtZW50ID0gX193ZWJwYWNrX3JlcXVpcmVfXy5nLmRvY3VtZW50O1xuaWYgKCFzY3JpcHRVcmwgJiYgZG9jdW1lbnQpIHtcblx0aWYgKGRvY3VtZW50LmN1cnJlbnRTY3JpcHQ/LnRhZ05hbWUudG9VcHBlckNhc2UoKSA9PT0gJ1NDUklQVCcpXG5cdFx0c2NyaXB0VXJsID0gZG9jdW1lbnQuY3VycmVudFNjcmlwdC5zcmM7XG5cdGlmICghc2NyaXB0VXJsKSB7XG5cdFx0Y29uc3Qgc2NyaXB0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwic2NyaXB0XCIpO1xuXHRcdGlmKHNjcmlwdHMubGVuZ3RoKSB7XG5cdFx0XHRsZXQgaSA9IHNjcmlwdHMubGVuZ3RoIC0gMTtcblx0XHRcdHdoaWxlIChpID4gLTEgJiYgKCFzY3JpcHRVcmwgfHwgIS9eaHR0cChzPyk6Ly50ZXN0KHNjcmlwdFVybCkpKSBzY3JpcHRVcmwgPSBzY3JpcHRzW2ktLV0uc3JjO1xuXHRcdH1cblx0fVxufVxuLy8gV2hlbiBzdXBwb3J0aW5nIGJyb3dzZXJzIHdoZXJlIGFuIGF1dG9tYXRpYyBwdWJsaWNQYXRoIGlzIG5vdCBzdXBwb3J0ZWQgeW91IG11c3Qgc3BlY2lmeSBhbiBvdXRwdXQucHVibGljUGF0aCBtYW51YWxseSB2aWEgY29uZmlndXJhdGlvblxuLy8gb3IgcGFzcyBhbiBlbXB0eSBzdHJpbmcgKFwiXCIpIGFuZCBzZXQgdGhlIF9fd2VicGFja19wdWJsaWNfcGF0aF9fIHZhcmlhYmxlIGZyb20geW91ciBjb2RlIHRvIHVzZSB5b3VyIG93biBsb2dpYy5cbmlmICghc2NyaXB0VXJsKSB0aHJvdyBuZXcgRXJyb3IoXCJBdXRvbWF0aWMgcHVibGljUGF0aCBpcyBub3Qgc3VwcG9ydGVkIGluIHRoaXMgYnJvd3NlclwiKTtcbnNjcmlwdFVybCA9IHNjcmlwdFVybC5yZXBsYWNlKC9eYmxvYjovLCBcIlwiKS5yZXBsYWNlKC8jLiokLywgXCJcIikucmVwbGFjZSgvXFw/LiokLywgXCJcIikucmVwbGFjZSgvXFwvW15cXC9dKyQvLCBcIi9cIik7XG5fX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBzY3JpcHRVcmw7IiwiLy8gbm8gYmFzZVVSSVxuXG4vLyBvYmplY3QgdG8gc3RvcmUgbG9hZGVkIGNodW5rc1xuLy8gXCIxXCIgbWVhbnMgXCJhbHJlYWR5IGxvYWRlZFwiXG52YXIgaW5zdGFsbGVkQ2h1bmtzID0ge1xuXHRcInNyY19zY3JpcHRfcGh5c2ljc193b3JrZXJfZmxpZ2h0V29ya2VyX3RzXCI6IDFcbn07XG5cbi8vIGltcG9ydFNjcmlwdHMgY2h1bmsgbG9hZGluZ1xudmFyIGluc3RhbGxDaHVuayA9IChkYXRhKSA9PiB7XG5cdGxldCBbY2h1bmtJZHMsIG1vcmVNb2R1bGVzLCBydW50aW1lXSA9IGRhdGE7XG5cdGZvcih2YXIgbW9kdWxlSWQgaW4gbW9yZU1vZHVsZXMpIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8obW9yZU1vZHVsZXMsIG1vZHVsZUlkKSkge1xuXHRcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tW21vZHVsZUlkXSA9IG1vcmVNb2R1bGVzW21vZHVsZUlkXTtcblx0XHR9XG5cdH1cblx0aWYocnVudGltZSkgcnVudGltZShfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblx0d2hpbGUoY2h1bmtJZHMubGVuZ3RoKVxuXHRcdGluc3RhbGxlZENodW5rc1tjaHVua0lkcy5wb3AoKV0gPSAxO1xuXHRwYXJlbnRDaHVua0xvYWRpbmdGdW5jdGlvbihkYXRhKTtcbn07XG5fX3dlYnBhY2tfcmVxdWlyZV9fLmYuaSA9IChjaHVua0lkLCBwcm9taXNlcykgPT4ge1xuXHQvLyBcIjFcIiBpcyB0aGUgc2lnbmFsIGZvciBcImFscmVhZHkgbG9hZGVkXCJcblx0aWYoIWluc3RhbGxlZENodW5rc1tjaHVua0lkXSkge1xuXHRcdGlmKHRydWUpIHsgLy8gYWxsIGNodW5rcyBoYXZlIEpTXG5cdFx0XHRpbXBvcnRTY3JpcHRzKF9fd2VicGFja19yZXF1aXJlX18ucCArIF9fd2VicGFja19yZXF1aXJlX18udShjaHVua0lkKSk7XG5cdFx0fVxuXHR9XG59O1xuXG52YXIgY2h1bmtMb2FkaW5nR2xvYmFsID0gc2VsZltcIndlYnBhY2tDaHVua3JldHJvZmxpZ2h0c2ltXCJdID0gc2VsZltcIndlYnBhY2tDaHVua3JldHJvZmxpZ2h0c2ltXCJdIHx8IFtdO1xudmFyIHBhcmVudENodW5rTG9hZGluZ0Z1bmN0aW9uID0gY2h1bmtMb2FkaW5nR2xvYmFsLnB1c2guYmluZChjaHVua0xvYWRpbmdHbG9iYWwpO1xuY2h1bmtMb2FkaW5nR2xvYmFsLnB1c2ggPSBpbnN0YWxsQ2h1bms7XG5cbi8vIG5vIEhNUlxuXG4vLyBubyBITVIgbWFuaWZlc3QiLCJjb25zdCBuZXh0ID0gX193ZWJwYWNrX3JlcXVpcmVfXy54O1xuX193ZWJwYWNrX3JlcXVpcmVfXy54ID0gKCkgPT4ge1xuXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXy5lKFwidmVuZG9ycy1ub2RlX21vZHVsZXNfdGhyZWVfYnVpbGRfdGhyZWVfbW9kdWxlX2pzXCIpLnRoZW4obmV4dCk7XG59OyIsIiIsIi8vIHJ1biBzdGFydHVwXG52YXIgX193ZWJwYWNrX2V4cG9ydHNfXyA9IF9fd2VicGFja19yZXF1aXJlX18ueCgpO1xuIiwiIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9
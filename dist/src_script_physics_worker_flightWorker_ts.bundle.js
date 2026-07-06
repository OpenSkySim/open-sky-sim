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

/***/ "./src/script/physics/fm2/directFcs.ts"
/*!*********************************************!*\
  !*** ./src/script/physics/fm2/directFcs.ts ***!
  \*********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DirectFcs: () => (/* binding */ DirectFcs)
/* harmony export */ });
/* harmony import */ var _utils_math__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/math */ "./src/script/utils/math.ts");

class DirectFcs {
    constructor(cfg) {
        this.cfg = cfg;
        this.elevator = 0;
        this.aileron = 0;
        this.rudder = 0;
        this.yawRateLowPass = 0;
    }
    reset() {
        this.elevator = 0;
        this.aileron = 0;
        this.rudder = 0;
        this.yawRateLowPass = 0;
    }
    getState() {
        return { elevator: this.elevator, aileron: this.aileron, rudder: this.rudder };
    }
    update(input, dt) {
        const elevatorTarget = (0,_utils_math__WEBPACK_IMPORTED_MODULE_0__.clamp)(input.pitchStick + this.cfg.pitchRateDamp * input.pitchRate, -1, 1);
        const aileronTarget = (0,_utils_math__WEBPACK_IMPORTED_MODULE_0__.clamp)(input.rollStick - this.cfg.rollRateDamp * input.rollRate, -1, 1);
        const tau = Math.max(this.cfg.yawDamperWashoutTauS, 1e-3);
        const aw = dt <= 0 ? 1 : 1 - Math.exp(-dt / tau);
        this.yawRateLowPass += (input.yawRate - this.yawRateLowPass) * aw;
        const yawRateHighPass = input.yawRate - this.yawRateLowPass;
        const rudderTarget = (0,_utils_math__WEBPACK_IMPORTED_MODULE_0__.clamp)(input.yawPedal
            - this.cfg.yawDamperGain * yawRateHighPass
            + this.cfg.ariGain * aileronTarget, -1, 1);
        const a = dt <= 0 ? 1 : 1 - Math.exp(-dt / Math.max(this.cfg.actuatorTauS, 1e-3));
        this.elevator += (elevatorTarget - this.elevator) * a;
        this.aileron += (aileronTarget - this.aileron) * a;
        this.rudder += (rudderTarget - this.rudder) * a;
        return this.getState();
    }
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

/***/ "./src/script/physics/fm2/fm2AircraftConfig.ts"
/*!*****************************************************!*\
  !*** ./src/script/physics/fm2/fm2AircraftConfig.ts ***!
  \*****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   f16Fm2Config: () => (/* binding */ f16Fm2Config)
/* harmony export */ });
/* harmony import */ var _f16Fm2Config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./f16Fm2Config */ "./src/script/physics/fm2/f16Fm2Config.ts");
/* harmony import */ var _f16Profile__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../f16Profile */ "./src/script/physics/f16Profile.ts");
/* harmony import */ var _defs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../defs */ "./src/script/defs.ts");



const DEG = Math.PI / 180;
const f16Fm2Config = {
    geometry: {
        massKg: _f16Fm2Config__WEBPACK_IMPORTED_MODULE_0__.FM2_GEOMETRY.massKg,
        wingAreaM2: _f16Fm2Config__WEBPACK_IMPORTED_MODULE_0__.FM2_GEOMETRY.wingAreaM2,
        wingSpanM: _f16Fm2Config__WEBPACK_IMPORTED_MODULE_0__.FM2_GEOMETRY.wingSpanM,
        meanChordM: _f16Fm2Config__WEBPACK_IMPORTED_MODULE_0__.FM2_GEOMETRY.meanChordM,
    },
    inertia: {
        pitch: _f16Fm2Config__WEBPACK_IMPORTED_MODULE_0__.FM2_INERTIA.pitch,
        yaw: _f16Fm2Config__WEBPACK_IMPORTED_MODULE_0__.FM2_INERTIA.yaw,
        roll: _f16Fm2Config__WEBPACK_IMPORTED_MODULE_0__.FM2_INERTIA.roll,
    },
    surfaces: {
        fuselage: _f16Fm2Config__WEBPACK_IMPORTED_MODULE_0__.FM2_SURFACES.fuselage,
        wingLeft: _f16Fm2Config__WEBPACK_IMPORTED_MODULE_0__.FM2_SURFACES.wingLeft,
        wingRight: _f16Fm2Config__WEBPACK_IMPORTED_MODULE_0__.FM2_SURFACES.wingRight,
        htailLeft: _f16Fm2Config__WEBPACK_IMPORTED_MODULE_0__.FM2_SURFACES.htailLeft,
        htailRight: _f16Fm2Config__WEBPACK_IMPORTED_MODULE_0__.FM2_SURFACES.htailRight,
        vtail: _f16Fm2Config__WEBPACK_IMPORTED_MODULE_0__.FM2_SURFACES.vtail,
    },
    aileronMaxDeflectionRad: _f16Fm2Config__WEBPACK_IMPORTED_MODULE_0__.FM2_AILERON.maxDeflectionRad,
    flaps: {
        aoaBiasRad: _f16Fm2Config__WEBPACK_IMPORTED_MODULE_0__.FM2_FLAPS.aoaBiasRad,
        stallReductionRad: _f16Fm2Config__WEBPACK_IMPORTED_MODULE_0__.FM2_FLAPS.stallReductionRad,
        extraCd: _f16Fm2Config__WEBPACK_IMPORTED_MODULE_0__.FM2_FLAPS.extraCd,
    },
    gearCd: _f16Fm2Config__WEBPACK_IMPORTED_MODULE_0__.FM2_GEAR_CD,
    bodyCd0: _f16Fm2Config__WEBPACK_IMPORTED_MODULE_0__.FM2_BODY_CD0,
    waveDrag: { machOnset: _f16Fm2Config__WEBPACK_IMPORTED_MODULE_0__.FM2_WAVE_DRAG.machOnset, scale: _f16Fm2Config__WEBPACK_IMPORTED_MODULE_0__.FM2_WAVE_DRAG.scale },
    gear: {
        points: [
            [0.0, -_defs__WEBPACK_IMPORTED_MODULE_2__.PLANE_DISTANCE_TO_GROUND, 2.6],
            [-1.2, -_defs__WEBPACK_IMPORTED_MODULE_2__.PLANE_DISTANCE_TO_GROUND, -0.6],
            [1.2, -_defs__WEBPACK_IMPORTED_MODULE_2__.PLANE_DISTANCE_TO_GROUND, -0.6],
        ],
        stiffness: 4.0e6,
        damping: 1.6e5,
        rollFriction: 0.04,
        brakeFriction: 0.55,
        sideFriction: 0.8,
    },
    engine: {
        afterburner: true,
        idleThrustKn: 0.5,
        milThrustKn: 76.3,
        abMinThrustKn: 104.0,
        abMaxThrustKn: _f16Profile__WEBPACK_IMPORTED_MODULE_1__.F16_PROFILE.abThrustKn,
        milLeverEnd: _f16Profile__WEBPACK_IMPORTED_MODULE_1__.F16_PROFILE.milLeverEnd,
        abMinLeverEnd: _f16Profile__WEBPACK_IMPORTED_MODULE_1__.F16_PROFILE.abMinLeverEnd,
    },
    fcs: {
        mode: 'fbw',
        maxStabilatorRad: _f16Fm2Config__WEBPACK_IMPORTED_MODULE_0__.FM2_FCS.maxStabilatorRad,
        maxRudderRad: 22 * DEG,
        taileronRollFraction: _f16Fm2Config__WEBPACK_IMPORTED_MODULE_0__.FM2_FCS.taileronRollFraction,
    },
    envelope: {
        stallAoaRad: _f16Profile__WEBPACK_IMPORTED_MODULE_1__.F16_PROFILE.stallAoaDeg * DEG,
        minFlyingSpeedMps: _f16Profile__WEBPACK_IMPORTED_MODULE_1__.F16_PROFILE.minFlyingSpeedMps,
        cruiseAltitudeM: _f16Profile__WEBPACK_IMPORTED_MODULE_1__.F16_PROFILE.cruiseAltitudeM,
        cruiseSpeedMps: _f16Profile__WEBPACK_IMPORTED_MODULE_1__.F16_PROFILE.cruiseSpeedMps,
        maxLoadFactorG: _f16Profile__WEBPACK_IMPORTED_MODULE_1__.F16_PROFILE.maxLoadFactorG,
        landingMaxSpeedMps: _f16Profile__WEBPACK_IMPORTED_MODULE_1__.F16_PROFILE.landingMaxSpeedMps,
        landingMaxVerticalSpeedMps: _f16Profile__WEBPACK_IMPORTED_MODULE_1__.F16_PROFILE.landingMaxVerticalSpeedMps,
        landingMinPitchRad: _f16Profile__WEBPACK_IMPORTED_MODULE_1__.F16_PROFILE.landingMinPitchDeg * DEG,
        landingMaxRollRad: _f16Profile__WEBPACK_IMPORTED_MODULE_1__.F16_PROFILE.landingMaxRollDeg * DEG,
    },
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
    setAircraft(_config) {
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
/* harmony import */ var _fm2_aeroSurface__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../fm2/aeroSurface */ "./src/script/physics/fm2/aeroSurface.ts");
/* harmony import */ var _fm2_directFcs__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../fm2/directFcs */ "./src/script/physics/fm2/directFcs.ts");
/* harmony import */ var _fm2_f16Fcs__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../fm2/f16Fcs */ "./src/script/physics/fm2/f16Fcs.ts");
/* harmony import */ var _fm2_fm2AircraftConfig__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../fm2/fm2AircraftConfig */ "./src/script/physics/fm2/fm2AircraftConfig.ts");
/* harmony import */ var _fm2_rigidBody__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../fm2/rigidBody */ "./src/script/physics/fm2/rigidBody.ts");
/* harmony import */ var _flightModel__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./flightModel */ "./src/script/physics/model/flightModel.ts");











const GRAVITY = 9.80665;
const THROTTLE_UP_RATE = 0.10;
const THROTTLE_DOWN_RATE = 0.07;
const DEFAULT_DIRECT_FCS = {
    pitchRateDamp: 0.9,
    rollRateDamp: 0.12,
    yawDamperGain: 1.4,
    yawDamperWashoutTauS: 1.0,
    ariGain: 0.08,
    actuatorTauS: 0.06,
};
class Fm2FlightModel extends _flightModel__WEBPACK_IMPORTED_MODULE_10__.FlightModel {
    constructor(config = _fm2_fm2AircraftConfig__WEBPACK_IMPORTED_MODULE_8__.f16Fm2Config) {
        var _a;
        super();
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
        this.config = config;
        this.rb = new _fm2_rigidBody__WEBPACK_IMPORTED_MODULE_9__.RigidBody(config.geometry.massKg, {
            x: config.inertia.pitch,
            y: config.inertia.yaw,
            z: config.inertia.roll,
        });
        this.fcs = config.fcs.mode === 'direct'
            ? new _fm2_directFcs__WEBPACK_IMPORTED_MODULE_6__.DirectFcs((_a = config.fcs.direct) !== null && _a !== void 0 ? _a : DEFAULT_DIRECT_FCS)
            : new _fm2_f16Fcs__WEBPACK_IMPORTED_MODULE_7__.F16Fcs();
        this.fuselage = new _fm2_aeroSurface__WEBPACK_IMPORTED_MODULE_5__.AeroSurface(config.surfaces.fuselage);
        this.wingLeft = new _fm2_aeroSurface__WEBPACK_IMPORTED_MODULE_5__.AeroSurface(config.surfaces.wingLeft);
        this.wingRight = new _fm2_aeroSurface__WEBPACK_IMPORTED_MODULE_5__.AeroSurface(config.surfaces.wingRight);
        this.htailLeft = new _fm2_aeroSurface__WEBPACK_IMPORTED_MODULE_5__.AeroSurface(config.surfaces.htailLeft);
        this.htailRight = new _fm2_aeroSurface__WEBPACK_IMPORTED_MODULE_5__.AeroSurface(config.surfaces.htailRight);
        this.vtail = new _fm2_aeroSurface__WEBPACK_IMPORTED_MODULE_5__.AeroSurface(config.surfaces.vtail);
        this.qRef = 0.5 * (0,_aeroUtils__WEBPACK_IMPORTED_MODULE_3__.computeIsaAirDensity)(config.envelope.cruiseAltitudeM)
            * Math.pow(config.envelope.cruiseSpeedMps, 2);
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
            qRef: this.qRef,
            speed,
            altitudeM: altitude,
            flapsExtended: this.flapsExtended,
            landed: this.landed,
        }, delta);
        const controls = this.mapControls(fcsOut.elevator, fcsOut.aileron, fcsOut.rudder);
        this.forceBody.set(0, 0, 0);
        this.momentBody.set(0, 0, 0);
        const flaps = this.config.flaps;
        const camber = this.flapsExtended ? flaps.aoaBiasRad : 0;
        const stallShift = this.flapsExtended ? flaps.stallReductionRad : 0;
        const wingExtraCd = this.flapsExtended ? flaps.extraCd : 0;
        this.accumulateSurface(this.fuselage, 0, 0, 0, 0, airDensity);
        this.accumulateSurface(this.wingLeft, controls.wingLeftAoa, camber, stallShift, wingExtraCd, airDensity);
        this.accumulateSurface(this.wingRight, controls.wingRightAoa, camber, stallShift, wingExtraCd, airDensity);
        this.accumulateSurface(this.htailLeft, controls.htailLeftAoa, 0, 0, 0, airDensity);
        this.accumulateSurface(this.htailRight, controls.htailRightAoa, 0, 0, 0, airDensity);
        this.accumulateSurface(this.vtail, controls.vtailAoa, 0, 0, 0, airDensity);
        this.addBodyDrag(dynamicPressure, speed, mach);
        const thrustN = this.computeThrustN(this.effectiveThrottle, altitude);
        this.engineThrustN = thrustN;
        this.forceBody.z += thrustN;
        this.computeGearForces();
        const gearBodyUpY = this._v.copy(this.gearForceWorld).applyQuaternion(this.invOrient).y;
        this.loadFactorG = (this.forceBody.y + gearBodyUpY) / (this.config.geometry.massKg * GRAVITY);
        this.momentBody.add(this.gearMomentBody);
        this.rb.integrateAngular(this.momentBody, delta);
        this.forceWorld.copy(this.forceBody).applyQuaternion(this.rb.orientation);
        this.forceWorld.add(this.gearForceWorld);
        this.forceWorld.y -= this.config.geometry.massKg * GRAVITY;
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
        const maxStabilator = this.config.fcs.maxStabilatorRad;
        const maxAileron = this.config.aileronMaxDeflectionRad;
        const maxRudder = this.config.fcs.maxRudderRad;
        const elevatorAoa = -elevator * maxStabilator;
        const taileronAoa = aileron * this.config.fcs.taileronRollFraction * maxStabilator;
        return {
            wingLeftAoa: aileron * maxAileron,
            wingRightAoa: -aileron * maxAileron,
            htailLeftAoa: elevatorAoa + taileronAoa,
            htailRightAoa: elevatorAoa - taileronAoa,
            vtailAoa: -rudder * maxRudder,
        };
    }
    computeThrustN(lever, altitude) {
        const e = this.config.engine;
        if (e.afterburner) {
            return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_4__.computeF16EngineThrustN)(lever, altitude);
        }
        const slKn = e.idleThrustKn + (e.milThrustKn - e.idleThrustKn) * (0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.clamp)(lever, 0, 1);
        const rho = (0,_aeroUtils__WEBPACK_IMPORTED_MODULE_3__.computeAirDensity)(altitude);
        return slKn * 1000 * (0,_aeroUtils__WEBPACK_IMPORTED_MODULE_3__.computeThrustDensityFactor)(rho, altitude);
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
        const waveDrag = this.config.waveDrag;
        let cd0 = this.config.bodyCd0 + (this.landingGearDeployed ? this.config.gearCd : 0);
        if (mach > waveDrag.machOnset) {
            const excess = (mach - waveDrag.machOnset) / waveDrag.machOnset;
            cd0 += waveDrag.scale * excess * excess;
        }
        const dragN = dynamicPressure * this.config.geometry.wingAreaM2 * cd0;
        this._v.copy(this.velBody).multiplyScalar(-dragN / speed);
        this.forceBody.add(this._v);
    }
    computeGearForces() {
        this.gearForceWorld.set(0, 0, 0);
        this.gearMomentBody.set(0, 0, 0);
        this._omegaWorld.copy(this.rb.angularVelocityBody).applyQuaternion(this.rb.orientation);
        const gear = this.config.gear;
        for (const gp of gear.points) {
            this._v.set(gp[0], gp[1], gp[2]).applyQuaternion(this.rb.orientation);
            this._gearWorld.copy(this._v).add(this.obj.position);
            const penetration = -this._gearWorld.y;
            if (penetration <= 0)
                continue;
            this._contactVel.crossVectors(this._omegaWorld, this._v).add(this.rb.velocityWorld);
            let normal = gear.stiffness * penetration - gear.damping * this._contactVel.y;
            if (normal < 0)
                normal = 0;
            const vhx = this._contactVel.x;
            const vhz = this._contactVel.z;
            const vh = Math.hypot(vhx, vhz);
            this._friction.set(0, normal, 0);
            if (vh > 1e-3) {
                const rolling = this.wheelBrakesApplied ? gear.brakeFriction : gear.rollFriction;
                const mu = Math.max(rolling, gear.sideFriction * this.sideSlipFraction(vhx, vhz));
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
        const stallAoa = this.config.envelope.stallAoaRad;
        const minFlyingSpeed = this.config.envelope.minFlyingSpeedMps;
        const aoaStall = speed > 5 ? (0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.clamp)((Math.abs(aoa) - stallAoa * 0.85) / (stallAoa * 0.3), 0, 1) : 0;
        const speedStall = altitude > _defs__WEBPACK_IMPORTED_MODULE_1__.PLANE_DISTANCE_TO_GROUND + 5
            ? (0,_utils_math__WEBPACK_IMPORTED_MODULE_2__.clamp)((minFlyingSpeed - speed) / minFlyingSpeed, 0, 1) : 0;
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
        const env = this.config.envelope;
        const hardContact = this.velocity.y < -env.landingMaxVerticalSpeedMps;
        const badAttitude = Math.abs(rollAngle) > env.landingMaxRollRad || pitchAngle < env.landingMinPitchRad;
        if (!this.landed && (hardContact || speed > env.landingMaxSpeedMps)) {
            if (!this.landingGearDeployed || hardContact || badAttitude) {
                this.crashed = true;
                return;
            }
        }
        if (!this.landingGearDeployed && this.velocity.y < -1.0) {
            this.crashed = true;
            return;
        }
        if (speed < env.landingMaxSpeedMps && Math.abs(rollAngle) < env.landingMaxRollRad) {
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
    get afterburner() { return this.config.engine.afterburner; }
    getThrottleHudText() { return this.afterburner ? (0,_f16Engine__WEBPACK_IMPORTED_MODULE_4__.formatF16ThrottleHud)(this.throttle) : super.getThrottleHudText(); }
    useF16ThrottleDetents() { return this.afterburner; }
    stepThrottleDetent(current, direction) { return this.afterburner ? (0,_f16Engine__WEBPACK_IMPORTED_MODULE_4__.stepF16ThrottleDetent)(current, direction) : super.stepThrottleDetent(current, direction); }
    isInThrottleAbDetentBand(lever) { return this.afterburner ? (0,_f16Engine__WEBPACK_IMPORTED_MODULE_4__.isF16AbDetentBand)(lever) : super.isInThrottleAbDetentBand(lever); }
    adjustThrottleInput(current, step) { return this.afterburner ? (0,_f16Engine__WEBPACK_IMPORTED_MODULE_4__.adjustF16ThrottleInput)(current, step) : super.adjustThrottleInput(current, step); }
    getThrottleZone() { return this.afterburner ? (0,_f16Engine__WEBPACK_IMPORTED_MODULE_4__.getF16ThrottleZone)(this.effectiveThrottle) : 'mil'; }
    getThrottleAudioLevel() { return this.afterburner ? (0,_f16Engine__WEBPACK_IMPORTED_MODULE_4__.f16ThrottleAudioLevel)(this.effectiveThrottle) : super.getThrottleAudioLevel(); }
    getEngineNozzleColor() { return this.afterburner ? (0,_f16Engine__WEBPACK_IMPORTED_MODULE_4__.getF16EngineNozzleColor)(this.effectiveThrottle) : super.getEngineNozzleColor(); }
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
let modelType;
self.onmessage = (event) => {
    try {
        handleMessage(event.data);
    }
    catch (err) {
        const e = err;
        self.postMessage({ type: 'error', message: `${e === null || e === void 0 ? void 0 : e.name}: ${e === null || e === void 0 ? void 0 : e.message}`, stack: e === null || e === void 0 ? void 0 : e.stack });
    }
};
function buildModel(type, aircraftConfig) {
    if (type === 'realistic')
        return new _model_realisticFlightModel__WEBPACK_IMPORTED_MODULE_0__.RealisticFlightModel();
    if (type === 'fm2')
        return new _model_fm2FlightModel__WEBPACK_IMPORTED_MODULE_3__.Fm2FlightModel(aircraftConfig);
    if (type === 'arcade')
        return new _model_arcadeFlightModel__WEBPACK_IMPORTED_MODULE_1__.ArcadeFlightModel();
    if (type === 'debug')
        return new _model_debugFlightModel__WEBPACK_IMPORTED_MODULE_2__.DebugFlightModel();
    return undefined;
}
function preserveState(from, to) {
    to.reset();
    to.setCrashed(from.isCrashed());
    to.setLanded(from.isLanded());
    to.position = from.position;
    to.quaternion = from.quaternion;
    to.velocityVector = from.velocityVector;
}
function handleMessage(data) {
    switch (data.type) {
        case 'init': {
            modelType = data.modelType;
            const model = buildModel(data.modelType, data.aircraftConfig);
            if (model)
                flightModel = model;
            break;
        }
        case 'setAircraft': {
            if (modelType !== 'fm2' || !data.aircraftConfig)
                break;
            const next = new _model_fm2FlightModel__WEBPACK_IMPORTED_MODULE_3__.Fm2FlightModel(data.aircraftConfig);
            if (flightModel)
                preserveState(flightModel, next);
            flightModel = next;
            sendState();
            break;
        }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3JjX3NjcmlwdF9waHlzaWNzX3dvcmtlcl9mbGlnaHRXb3JrZXJfdHMuYnVuZGxlLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDTyxNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFFbkIsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDO0FBQ3JCLE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQztBQUNyQixNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUM7QUFDckIsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDO0FBRXJCLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQztBQUNsQixNQUFNLEtBQUssR0FBRyxHQUFHLENBQUM7QUFDbEIsTUFBTSxVQUFVLEdBQUcsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUM3QixNQUFNLFVBQVUsR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBRTdCLE1BQU0sYUFBYSxHQUFHLEtBQUssQ0FBQztBQUM1QixNQUFNLGtCQUFrQixHQUFHLEtBQUssQ0FBQztBQUVqQyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUMvQixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUM5QixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztBQUM5QixNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUM7QUFDeEIsTUFBTSxhQUFhLEdBQUcsRUFBRSxDQUFDO0FBQ3pCLE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQztBQUN2QixNQUFNLHdCQUF3QixHQUFHLEdBQUcsQ0FBQztBQUNyQyxNQUFNLHNCQUFzQixHQUFHLEdBQUcsQ0FBQztBQUNuQyxNQUFNLHNCQUFzQixHQUFHLEdBQUcsQ0FBQztBQUNuQyxNQUFNLFlBQVksR0FBRyxLQUFLLENBQUM7QUFFM0IsTUFBTSxXQUFXLEdBQUcsRUFBRSxDQUFDO0FB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LElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUVqRSxNQUFNLENBQUMsR0FBRyxHQUFHLEdBQUcsS0FBSyxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUM7UUFDM0MsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDOUIsTUFBTSxJQUFJLEdBQUcsQ0FBQyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFDM0IsTUFBTSxJQUFJLEdBQUcsQ0FBQyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFHM0IsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztRQUMzRCxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO1FBQzNELE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7UUFDM0QsUUFBUSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDakIsUUFBUSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDakIsUUFBUSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7UUFHakIsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUN2RSxTQUFTLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUNqQyxTQUFTLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxF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LElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQztnQkFDZCxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDakMsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FDcEMsRUFDSCxDQUFDO1lBQ0MsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLDZDQUFVLEdBQUcsS0FBSyxDQUFDLENBQUM7UUFDdkQsQ0FBQztRQUdELElBQUksQ0FBQyxtREFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLG1EQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUN0QyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLDJDQUFRLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQztRQUNyRixDQUFDO1FBR0QsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxJQUFJLEVBQUUsQ0FBQztZQUNsRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUUsTUFBTSxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxD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YnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy9hZXJvVXRpbHMudHMiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vLi9zcmMvc2NyaXB0L3BoeXNpY3MvZjE2RW5naW5lLnRzIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltLy4vc3JjL3NjcmlwdC9waHlzaWNzL2YxNkZjc0xpbWl0cy50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy9mMTZQYXBlckRhdGEudHMiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vLi9zcmMvc2NyaXB0L3BoeXNpY3MvZjE2UHJvZmlsZS50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy9mMTZSb2xsQ29udHJvbC50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy9mbTIvYWVyb1N1cmZhY2UudHMiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vLi9zcmMvc2NyaXB0L3BoeXNpY3MvZm0yL2RpcmVjdEZjcy50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy9mbTIvZjE2RmNzLnRzIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltLy4vc3JjL3NjcmlwdC9waHlzaWNzL2ZtMi9mMTZGbTJDb25maWcudHMiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vLi9zcmMvc2NyaXB0L3BoeXNpY3MvZm0yL2ZtMkFpcmNyYWZ0Q29uZmlnLnRzIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltLy4vc3JjL3NjcmlwdC9waHlzaWNzL2ZtMi9yaWdpZEJvZHkudHMiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vLi9zcmMvc2NyaXB0L3BoeXNpY3MvbW9kZWwvYXJjYWRlRmxpZ2h0TW9kZWwudHMiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vLi9zcmMvc2NyaXB0L3BoeXNpY3MvbW9kZWwvZGVidWdGbGlnaHRNb2RlbC50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy9tb2RlbC9mbGlnaHRNb2RlbC50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy9tb2RlbC9mbTJGbGlnaHRNb2RlbC50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy9tb2RlbC9yZWFsaXN0aWNGbGlnaHRNb2RlbC50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy93b3JrZXIvZmxpZ2h0V29ya2VyLnRzIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltLy4vc3JjL3NjcmlwdC91dGlscy9tYXRoLnRzIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svcnVudGltZS9jaHVuayBsb2FkZWQiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svcnVudGltZS9lbnN1cmUgY2h1bmsiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vd2VicGFjay9ydW50aW1lL2dldCBqYXZhc2NyaXB0IGNodW5rIGZpbGVuYW1lIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svcnVudGltZS9nbG9iYWwiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svcnVudGltZS9wdWJsaWNQYXRoIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svcnVudGltZS9pbXBvcnRTY3JpcHRzIGNodW5rIGxvYWRpbmciLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vd2VicGFjay9ydW50aW1lL3N0YXJ0dXAgY2h1bmsgZGVwZW5kZW5jaWVzIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svYmVmb3JlLXN0YXJ0dXAiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vd2VicGFjay9zdGFydHVwIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svYWZ0ZXItc3RhcnR1cCJdLCJzb3VyY2VzQ29udGVudCI6WyJcbmV4cG9ydCBjb25zdCBGUFNfQ0FQID0gMTU7IC8vIEZQU1xuXG5leHBvcnQgY29uc3QgTE9fSF9SRVMgPSAzMjA7XG5leHBvcnQgY29uc3QgTE9fVl9SRVMgPSAyMDA7XG5leHBvcnQgY29uc3QgSElfSF9SRVMgPSA2NDA7XG5leHBvcnQgY29uc3QgSElfVl9SRVMgPSA0MDA7XG5cbmV4cG9ydCBjb25zdCBIX1JFUyA9IDMyMDtcbmV4cG9ydCBjb25zdCBWX1JFUyA9IDIwMDtcbmV4cG9ydCBjb25zdCBIX1JFU19IQUxGID0gSF9SRVMgLyAyO1xuZXhwb3J0IGNvbnN0IFZfUkVTX0hBTEYgPSBWX1JFUyAvIDI7XG5cbmV4cG9ydCBjb25zdCBURVJSQUlOX1NDQUxFID0gMjAwLjA7XG5leHBvcnQgY29uc3QgVEVSUkFJTl9NT0RFTF9TSVpFID0gMTAwLjA7XG5cbmV4cG9ydCBjb25zdCBQSVRDSF9SQVRFID0gTWF0aC5QSSAvIDU7IC8vIFJhZGlhbnMvc1xuZXhwb3J0IGNvbnN0IFJPTExfUkFURSA9IE1hdGguUEkgLyAyOyAvLyBSYWRpYW5zL3MgKHdhcyDPgC8zLCArNTAlKVxuZXhwb3J0IGNvbnN0IFlBV19SQVRFID0gTWF0aC5QSSAvIDEyOyAvLyBSYWRpYW5zL3NcbmV4cG9ydCBjb25zdCBNQVhfU1BFRUQgPSAyNTAuMDsgLy8gV29ybGQgdW5pdHMvc1xuZXhwb3J0IGNvbnN0IFRIUk9UVExFX1JBVEUgPSAzMzsgLy8gUGVyY2VudGFnZSBvZiBtYXhpbXVtL3MgWzAsMTAwXVxuZXhwb3J0IGNvbnN0IFNUSUNLX1JBVEUgPSAxLjU7IC8vIEZ1bGwgc3RpY2sgZGVmbGVjdGlvbiBwZXIgc2Vjb25kXG5leHBvcnQgY29uc3QgUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5EID0gMi4wOyAvLyBXb3JsZCB1bml0c1xuZXhwb3J0IGNvbnN0IFBMQU5FX0NPQ0tQSVRfT0ZGU0VUX1kgPSAxLjA7IC8vIFdvcmxkIHVuaXRzXG5leHBvcnQgY29uc3QgUExBTkVfQ09DS1BJVF9PRkZTRVRfWiA9IDguMDsgLy8gV29ybGQgdW5pdHNcbmV4cG9ydCBjb25zdCBNQVhfQUxUSVRVREUgPSAxNDAwMDsgLy8gV29ybGQgdW5pdHNcblxuZXhwb3J0IGNvbnN0IENPQ0tQSVRfRk9WID0gNTA7XG5leHBvcnQgY29uc3QgQ09DS1BJVF9GQVIgPSA0MDAwMDtcblxuZXhwb3J0IGNvbnN0IEdST1VORF9TTU9LRV9QQVJUSUNMRV9DT1VOVCA9IDEwMDtcblxuZXhwb3J0IGNvbnN0IEFJUkJBU0VfUlVOV0FZID0geyB4OiAxNTAwLCB5OiAwLCB6OiAtODAwIH07XG5leHBvcnQgY29uc3QgUlVOV0FZX0hBTEZfTEVOR1RIX00gPSAxNTAwO1xuZXhwb3J0IGNvbnN0IEFQUFJPQUNIX0FMVElUVURFX00gPSA1MDA7XG5leHBvcnQgY29uc3QgQVBQUk9BQ0hfU1BFRURfS01IID0gMzAwO1xuZXhwb3J0IGNvbnN0IEFQUFJPQUNIX1NQRUVEX01QUyA9IEFQUFJPQUNIX1NQRUVEX0tNSCAvIDMuNjtcbmV4cG9ydCBjb25zdCBBUFBST0FDSF9GSU5BTF9ESVNUQU5DRV9NID0gNTAwMDtcbiIsImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcblxuY29uc3QgR1JBVklUWSA9IDkuODtcblxuZXhwb3J0IGNvbnN0IEdST1VORF9BSVJfREVOU0lUWSA9IDEuMjI1OyAvLyBrZy9twrMgYXQgc2VhIGxldmVsLCBJU0FcbmNvbnN0IFZORV9NQUNIID0gMC45NTsgLy8gdHJhbnNvbmljIGRyYWcgcmlzZSBvbnNldCAoc2ltIG9ubHk7IHBhcGVyIGvigoIgPSAwKVxuXG5jb25zdCBJU0FfU0VBX0xFVkVMX1BSRVNTVVJFID0gMTAxMzI1OyAvLyBQYVxuY29uc3QgSVNBX1NFQV9MRVZFTF9URU1QID0gMjg4LjE1OyAvLyBLXG5jb25zdCBJU0FfTEFQU0VfUkFURSA9IDAuMDA2NTsgLy8gSy9tXG5jb25zdCBJU0FfVFJPUE9QQVVTRV9BTFQgPSAxMTAwMDsgLy8gbVxuY29uc3QgSVNBX1RST1BPUEFVU0VfUFJFU1NVUkUgPSAyMjYzMi4xOyAvLyBQYVxuY29uc3QgSVNBX1RST1BPUEFVU0VfVEVNUCA9IDIxNi42NTsgLy8gS1xuY29uc3QgR1JBVklUWV9JU0EgPSA5LjgwNjY1OyAvLyBtL3PCslxuY29uc3QgR0FTX0NPTlNUQU5UID0gMjg3LjA1MzsgLy8gSi8oa2fCt0spXG5cbi8qKiBJU0EgZGVuc2l0eSAoa2cvbcKzKSDigJQgQW5kZXJzb24tc3R5bGUgcGVyZm9ybWFuY2UgYW5hbHlzaXMgYXRtb3NwaGVyZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlSXNhQWlyRGVuc2l0eShhbHRpdHVkZU1ldGVyczogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBjb25zdCBoID0gTWF0aC5tYXgoMCwgYWx0aXR1ZGVNZXRlcnMpO1xuICAgIGxldCB0ZW1wZXJhdHVyZTogbnVtYmVyO1xuICAgIGxldCBwcmVzc3VyZTogbnVtYmVyO1xuXG4gICAgaWYgKGggPD0gSVNBX1RST1BPUEFVU0VfQUxUKSB7XG4gICAgICAgIHRlbXBlcmF0dXJlID0gSVNBX1NFQV9MRVZFTF9URU1QIC0gSVNBX0xBUFNFX1JBVEUgKiBoO1xuICAgICAgICBwcmVzc3VyZSA9IElTQV9TRUFfTEVWRUxfUFJFU1NVUkUgKiBNYXRoLnBvdyhcbiAgICAgICAgICAgIHRlbXBlcmF0dXJlIC8gSVNBX1NFQV9MRVZFTF9URU1QLFxuICAgICAgICAgICAgR1JBVklUWV9JU0EgLyAoR0FTX0NPTlNUQU5UICogSVNBX0xBUFNFX1JBVEUpLFxuICAgICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRlbXBlcmF0dXJlID0gSVNBX1RST1BPUEFVU0VfVEVNUDtcbiAgICAgICAgcHJlc3N1cmUgPSBJU0FfVFJPUE9QQVVTRV9QUkVTU1VSRSAqIE1hdGguZXhwKFxuICAgICAgICAgICAgLUdSQVZJVFlfSVNBICogKGggLSBJU0FfVFJPUE9QQVVTRV9BTFQpIC8gKEdBU19DT05TVEFOVCAqIElTQV9UUk9QT1BBVVNFX1RFTVApLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiBwcmVzc3VyZSAvIChHQVNfQ09OU1RBTlQgKiB0ZW1wZXJhdHVyZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlQWlyRGVuc2l0eShhbHRpdHVkZU1ldGVyczogbnVtYmVyKTogbnVtYmVyIHtcbiAgICByZXR1cm4gY29tcHV0ZUlzYUFpckRlbnNpdHkoYWx0aXR1ZGVNZXRlcnMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUR5bmFtaWNQcmVzc3VyZShhaXJEZW5zaXR5OiBudW1iZXIsIHNwZWVkOiBudW1iZXIpOiBudW1iZXIge1xuICAgIHJldHVybiAwLjUgKiBhaXJEZW5zaXR5ICogc3BlZWQgKiBzcGVlZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVUaHJ1c3REZW5zaXR5RmFjdG9yKGFpckRlbnNpdHk6IG51bWJlciwgYWx0aXR1ZGVNZXRlcnMgPSAwKTogbnVtYmVyIHtcbiAgICBjb25zdCBzaWdtYSA9IGFpckRlbnNpdHkgLyBHUk9VTkRfQUlSX0RFTlNJVFk7XG4gICAgY29uc3QgbGFwc2UgPSBNYXRoLnBvdyhzaWdtYSwgMC43KTtcbiAgICBjb25zdCBvcHRpbXVtQWx0aXR1ZGUgPSAxMTAwMDsgLy8gbSwgfkZMMzYwIHRocnVzdC1saW1pdGVkIG9wdGltdW1cbiAgICBjb25zdCBhbHRQZW5hbHR5ID0gYWx0aXR1ZGVNZXRlcnMgPD0gb3B0aW11bUFsdGl0dWRlXG4gICAgICAgID8gMVxuICAgICAgICA6IE1hdGgubWF4KDAuMzUsIDEgLSAoYWx0aXR1ZGVNZXRlcnMgLSBvcHRpbXVtQWx0aXR1ZGUpIC8gOTAwMCk7XG4gICAgcmV0dXJuIGxhcHNlICogYWx0UGVuYWx0eTtcbn1cblxuY29uc3QgR0FNTUEgPSAxLjQ7XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlU3BlZWRPZlNvdW5kKGFsdGl0dWRlTWV0ZXJzOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IHRlbXBlcmF0dXJlID0gTWF0aC5tYXgoSVNBX1RST1BPUEFVU0VfVEVNUCwgSVNBX1NFQV9MRVZFTF9URU1QIC0gSVNBX0xBUFNFX1JBVEUgKiBhbHRpdHVkZU1ldGVycyk7XG4gICAgcmV0dXJuIE1hdGguc3FydChHQU1NQSAqIEdBU19DT05TVEFOVCAqIHRlbXBlcmF0dXJlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVNYWNoTnVtYmVyKHNwZWVkTXBzOiBudW1iZXIsIGFsdGl0dWRlTWV0ZXJzOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IHNwZWVkT2ZTb3VuZCA9IGNvbXB1dGVTcGVlZE9mU291bmQoYWx0aXR1ZGVNZXRlcnMpO1xuICAgIGlmIChzcGVlZE9mU291bmQgPD0gMCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgcmV0dXJuIHNwZWVkTXBzIC8gc3BlZWRPZlNvdW5kO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUR5bmFtaWNQcmVzc3VyZURyYWdQZW5hbHR5KHNwZWVkTXBzOiBudW1iZXIsIGFsdGl0dWRlTWV0ZXJzOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IHNwZWVkT2ZTb3VuZCA9IGNvbXB1dGVTcGVlZE9mU291bmQoYWx0aXR1ZGVNZXRlcnMpO1xuICAgIGlmIChzcGVlZE9mU291bmQgPD0gMCB8fCBzcGVlZE1wcyA8PSAwKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBjb25zdCBtYWNoID0gc3BlZWRNcHMgLyBzcGVlZE9mU291bmQ7XG4gICAgaWYgKG1hY2ggPD0gVk5FX01BQ0gpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGNvbnN0IGV4Y2VzcyA9IChtYWNoIC0gVk5FX01BQ0gpIC8gVk5FX01BQ0g7XG4gICAgcmV0dXJuIDAuNTUgKiBleGNlc3MgKiBleGNlc3M7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlTWF4RXF1aWxpYnJpdW1TcGVlZChcbiAgICBhaXJEZW5zaXR5OiBudW1iZXIsXG4gICAgdGhydXN0Rm9yY2U6IG51bWJlcixcbiAgICB3aW5nQXJlYTogbnVtYmVyLFxuICAgIGRyYWdDb2VmZmljaWVudDogbnVtYmVyLFxuKTogbnVtYmVyIHtcbiAgICBpZiAoYWlyRGVuc2l0eSA8PSAwIHx8IGRyYWdDb2VmZmljaWVudCA8PSAwIHx8IHRocnVzdEZvcmNlIDw9IDApIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIHJldHVybiBNYXRoLnNxcnQoMiAqIHRocnVzdEZvcmNlIC8gKGFpckRlbnNpdHkgKiB3aW5nQXJlYSAqIGRyYWdDb2VmZmljaWVudCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUFuZ2xlT2ZBdHRhY2soXG4gICAgZm9yd2FyZDogVEhSRUUuVmVjdG9yMyxcbiAgICByaWdodDogVEhSRUUuVmVjdG9yMyxcbiAgICB2ZWxvY2l0eTogVEhSRUUuVmVjdG9yMyxcbiAgICBzY3JhdGNoOiBUSFJFRS5WZWN0b3IzLFxuKTogbnVtYmVyIHtcbiAgICBjb25zdCBzcGVlZCA9IHZlbG9jaXR5Lmxlbmd0aCgpO1xuICAgIGlmIChzcGVlZCA8PSAxLjApIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgc2NyYXRjaC5jb3B5KHZlbG9jaXR5KS5tdWx0aXBseVNjYWxhcigxIC8gc3BlZWQpLnByb2plY3RPblBsYW5lKHJpZ2h0KTtcbiAgICBpZiAoc2NyYXRjaC5sZW5ndGhTcSgpIDw9IDFlLTYpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgc2NyYXRjaC5ub3JtYWxpemUoKTtcbiAgICBjb25zdCBhb2FBbmdsZSA9IHNjcmF0Y2guYW5nbGVUbyhmb3J3YXJkKTtcbiAgICBjb25zdCBhb2FTaWduID0gc2NyYXRjaC5jcm9zcyhmb3J3YXJkKS5kb3QocmlnaHQpID4gMCA/IC0xIDogMTtcbiAgICByZXR1cm4gYW9hU2lnbiAqIGFvYUFuZ2xlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUxvYWRGYWN0b3JHKGFjY2VsOiBUSFJFRS5WZWN0b3IzLCB1cDogVEhSRUUuVmVjdG9yMywgZ3Jhdml0eSA9IEdSQVZJVFkpOiBudW1iZXIge1xuICAgIHJldHVybiAoYWNjZWwueCAqIHVwLnggKyAoYWNjZWwueSArIGdyYXZpdHkpICogdXAueSArIGFjY2VsLnogKiB1cC56KSAvIGdyYXZpdHk7XG59XG4iLCIvKipcbiAqIEYxMDAtUFctMjI5IHRocm90dGxlIHF1YWRyYW50IGFuZCB0aHJ1c3Qgc2NoZWR1bGUgZm9yIEYtMTZDLlxuICogTGV2ZXIgWzAsIDFdIG1hcHMgdG8gMOKAkzEwMCU6IDA9TUlMIDIwJSwgOTg9TUlMIDEwMCUsIDk5PUFCMSwgMTAwPUFCMi5cbiAqL1xuaW1wb3J0IHsgY29tcHV0ZUFpckRlbnNpdHksIGNvbXB1dGVUaHJ1c3REZW5zaXR5RmFjdG9yIH0gZnJvbSAnLi9hZXJvVXRpbHMnO1xuaW1wb3J0IHsgRjE2X1BST0ZJTEUgfSBmcm9tICcuL2YxNlByb2ZpbGUnO1xuXG4vKiogRjEwMC1QVy0yMjkgc2VhLWxldmVsIHN0YXRpYyB0aHJ1c3QgKGtOKSwgVVNBRiAvIEphbmUncy4gKi9cbmV4cG9ydCBjb25zdCBGMTZfRU5HSU5FID0ge1xuICAgIC8qKiBGbGlnaHQgaWRsZSAoTUlMIDIwJSBvbiBxdWFkcmFudCkg4oCUIDAuNSBrTiBzZWEtbGV2ZWwgc3RhdGljLiAqL1xuICAgIGlkbGVUaHJ1c3RLbjogMC41LFxuICAgIG1pbFRocnVzdEtuOiA3Ni4zLFxuICAgIC8qKiBGaXJzdCBhZnRlcmJ1cm5lciBkZXRlbnQgKG1pbiBBQiAvIHpvbmUgNSkuICovXG4gICAgYWJNaW5UaHJ1c3RLbjogMTA0LjAsXG4gICAgYWJNYXhUaHJ1c3RLbjogRjE2X1BST0ZJTEUuYWJUaHJ1c3RLbixcbiAgICAvKiogTGV2ZXIgWzAsIDFdIGF0IDEwMCUgTUlMICg5OCBvbiBxdWFkcmFudCkuICovXG4gICAgbWlsTGV2ZXJFbmQ6IEYxNl9QUk9GSUxFLm1pbExldmVyRW5kLFxuICAgIC8qKiBMZXZlciBbMCwgMV0gYXQgQUIxIGRldGVudCAoOTkgb24gcXVhZHJhbnQpLiAqL1xuICAgIGFiTWluTGV2ZXJFbmQ6IEYxNl9QUk9GSUxFLmFiTWluTGV2ZXJFbmQsXG59IGFzIGNvbnN0O1xuXG5leHBvcnQgdHlwZSBGMTZUaHJvdHRsZVpvbmUgPSAnbWlsJyB8ICdhYi1taW4nIHwgJ2FiLW1heCc7XG5cbi8qKiBBZnRlcmJ1cm5lciBub3p6bGUgY29sb3JzIOKAlCBzb2xpZCwgbm8gYW5pbWF0aW9uLiAqL1xuZXhwb3J0IGNvbnN0IEYxNl9FTkdJTkVfTk9aWkxFX0NPTE9SUyA9IHtcbiAgICBtaWw6ICcjMGEwYTBhJyxcbiAgICBhYk1pbjogJyNmZjg4MDAnLFxuICAgIGFiTWF4OiAnI2ZmZmYwMCcsXG59IGFzIGNvbnN0O1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RjE2RW5naW5lTm96emxlQ29sb3IobGV2ZXI6IG51bWJlcik6IHN0cmluZyB7XG4gICAgY29uc3Qgem9uZSA9IGdldEYxNlRocm90dGxlWm9uZShsZXZlcik7XG4gICAgaWYgKHpvbmUgPT09ICdhYi1taW4nKSB7XG4gICAgICAgIHJldHVybiBGMTZfRU5HSU5FX05PWlpMRV9DT0xPUlMuYWJNaW47XG4gICAgfVxuICAgIGlmICh6b25lID09PSAnYWItbWF4Jykge1xuICAgICAgICByZXR1cm4gRjE2X0VOR0lORV9OT1paTEVfQ09MT1JTLmFiTWF4O1xuICAgIH1cbiAgICByZXR1cm4gRjE2X0VOR0lORV9OT1paTEVfQ09MT1JTLm1pbDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBGMTZBZnRlcmJ1cm5lckNvbmVEaXRoZXIge1xuICAgIHByaW1hcnk6IHN0cmluZztcbiAgICBzZWNvbmRhcnk6IHN0cmluZztcbn1cblxuLyoqIE9yYW5nZS95ZWxsb3cgY2hlY2tlcmJvYXJkIGRpdGhlciBmb3IgQUIgY29uZSBtZXNoZXM7IG51bGwgd2hlbiBNSUwgKGNvbmVzIGhpZGRlbikuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RjE2QWZ0ZXJidXJuZXJDb25lRGl0aGVyKGxldmVyOiBudW1iZXIpOiBGMTZBZnRlcmJ1cm5lckNvbmVEaXRoZXIgfCBudWxsIHtcbiAgICBjb25zdCB6b25lID0gZ2V0RjE2VGhyb3R0bGVab25lKGxldmVyKTtcbiAgICBpZiAoem9uZSA9PT0gJ2FiLW1pbicpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHByaW1hcnk6IEYxNl9FTkdJTkVfTk9aWkxFX0NPTE9SUy5hYk1pbixcbiAgICAgICAgICAgIHNlY29uZGFyeTogRjE2X0VOR0lORV9OT1paTEVfQ09MT1JTLmFiTWF4LFxuICAgICAgICB9O1xuICAgIH1cbiAgICBpZiAoem9uZSA9PT0gJ2FiLW1heCcpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHByaW1hcnk6IEYxNl9FTkdJTkVfTk9aWkxFX0NPTE9SUy5hYk1heCxcbiAgICAgICAgICAgIHNlY29uZGFyeTogRjE2X0VOR0lORV9OT1paTEVfQ09MT1JTLmFiTWluLFxuICAgICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRjE2QWZ0ZXJidXJuZXJBY3RpdmUobGV2ZXI6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIHJldHVybiBnZXRGMTZUaHJvdHRsZVpvbmUobGV2ZXIpICE9PSAnbWlsJztcbn1cblxuZXhwb3J0IGNvbnN0IEYxNl9BRlRFUkJVUk5FUl9DT05FX0xFTkdUSF9NID0ge1xuICAgIG1pbDogMCxcbiAgICBhYk1pbjogNCxcbiAgICBhYk1heDogNyxcbn0gYXMgY29uc3Q7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRGMTZBZnRlcmJ1cm5lckNvbmVMZW5ndGhNKGxldmVyOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IHpvbmUgPSBnZXRGMTZUaHJvdHRsZVpvbmUobGV2ZXIpO1xuICAgIGlmICh6b25lID09PSAnYWItbWluJykge1xuICAgICAgICByZXR1cm4gRjE2X0FGVEVSQlVSTkVSX0NPTkVfTEVOR1RIX00uYWJNaW47XG4gICAgfVxuICAgIGlmICh6b25lID09PSAnYWItbWF4Jykge1xuICAgICAgICByZXR1cm4gRjE2X0FGVEVSQlVSTkVSX0NPTkVfTEVOR1RIX00uYWJNYXg7XG4gICAgfVxuICAgIHJldHVybiBGMTZfQUZURVJCVVJORVJfQ09ORV9MRU5HVEhfTS5taWw7XG59XG5cbi8qKiBMZXZlciBbMCwgMV0gYXMgMOKAkzEwMCB0aHJvdHRsZSBxdWFkcmFudCBwb3NpdGlvbi4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsZXZlclRvUGVyY2VudChsZXZlcjogbnVtYmVyKTogbnVtYmVyIHtcbiAgICByZXR1cm4gY2xhbXBMZXZlcihsZXZlcikgKiAxMDA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0YxNkFiRGV0ZW50QmFuZChsZXZlcjogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGxldmVyVG9QZXJjZW50KGxldmVyKSA+PSA5ODtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEYxNlRocm90dGxlWm9uZShsZXZlcjogbnVtYmVyKTogRjE2VGhyb3R0bGVab25lIHtcbiAgICBjb25zdCBwY3QgPSBsZXZlclRvUGVyY2VudChsZXZlcik7XG4gICAgaWYgKHBjdCA8IDk5KSB7XG4gICAgICAgIHJldHVybiAnbWlsJztcbiAgICB9XG4gICAgaWYgKHBjdCA8IDEwMCkge1xuICAgICAgICByZXR1cm4gJ2FiLW1pbic7XG4gICAgfVxuICAgIHJldHVybiAnYWItbWF4Jztcbn1cblxuLyoqIFNlYS1sZXZlbCByYXRlZCB0aHJ1c3QgKGtOKSBmb3IgbGV2ZXIgcG9zaXRpb24sIGJlZm9yZSBhbHRpdHVkZSBsYXBzZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlRjE2U2xUaHJ1c3RLbihsZXZlcjogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBjb25zdCBwY3QgPSBsZXZlclRvUGVyY2VudChsZXZlcik7XG4gICAgY29uc3QgeyBpZGxlVGhydXN0S24sIG1pbFRocnVzdEtuLCBhYk1pblRocnVzdEtuLCBhYk1heFRocnVzdEtuIH0gPSBGMTZfRU5HSU5FO1xuXG4gICAgaWYgKHBjdCA8PSA5OCkge1xuICAgICAgICBjb25zdCBtaWxGcmFjdGlvbiA9IHBjdCAvIDk4O1xuICAgICAgICByZXR1cm4gaWRsZVRocnVzdEtuICsgKG1pbFRocnVzdEtuIC0gaWRsZVRocnVzdEtuKSAqIG1pbEZyYWN0aW9uO1xuICAgIH1cbiAgICBpZiAocGN0IDwgOTkpIHtcbiAgICAgICAgcmV0dXJuIG1pbFRocnVzdEtuO1xuICAgIH1cbiAgICBpZiAocGN0ID49IDEwMCkge1xuICAgICAgICByZXR1cm4gYWJNYXhUaHJ1c3RLbjtcbiAgICB9XG4gICAgcmV0dXJuIGFiTWluVGhydXN0S247XG59XG5cbi8qKiBEZWxpdmVyZWQgZW5naW5lIHRocnVzdCAoTikgYXQgYWx0aXR1ZGUgd2l0aCBJU0EgdHVyYm9mYW4gbGFwc2UuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUYxNkVuZ2luZVRocnVzdE4obGV2ZXI6IG51bWJlciwgYWx0aXR1ZGVNZXRlcnM6IG51bWJlcik6IG51bWJlciB7XG4gICAgY29uc3Qgc2xLbiA9IGNvbXB1dGVGMTZTbFRocnVzdEtuKGxldmVyKTtcbiAgICBjb25zdCByaG8gPSBjb21wdXRlQWlyRGVuc2l0eShhbHRpdHVkZU1ldGVycyk7XG4gICAgY29uc3QgZmFjdG9yID0gY29tcHV0ZVRocnVzdERlbnNpdHlGYWN0b3IocmhvLCBhbHRpdHVkZU1ldGVycyk7XG4gICAgcmV0dXJuIHNsS24gKiAxMDAwICogZmFjdG9yO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUYxNkVuZ2luZVRocnVzdEtuKGxldmVyOiBudW1iZXIsIGFsdGl0dWRlTWV0ZXJzOiBudW1iZXIpOiBudW1iZXIge1xuICAgIHJldHVybiBjb21wdXRlRjE2RW5naW5lVGhydXN0TihsZXZlciwgYWx0aXR1ZGVNZXRlcnMpIC8gMTAwMDtcbn1cblxuLyoqIEhVRCBsYWJlbDogTUlMIDIw4oCTMTAwJSDihpIgQUIxIOKGkiBBQjIuICovXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0RjE2VGhyb3R0bGVIdWQobGV2ZXI6IG51bWJlcik6IHN0cmluZyB7XG4gICAgY29uc3QgcGN0ID0gbGV2ZXJUb1BlcmNlbnQobGV2ZXIpO1xuICAgIGNvbnN0IHpvbmUgPSBnZXRGMTZUaHJvdHRsZVpvbmUobGV2ZXIpO1xuXG4gICAgaWYgKHpvbmUgPT09ICdtaWwnKSB7XG4gICAgICAgIGlmIChwY3QgPiA5OCkge1xuICAgICAgICAgICAgcmV0dXJuICdNSUwgMTAwJztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtaWxQY3QgPSBNYXRoLnJvdW5kKDIwICsgKHBjdCAvIDk4KSAqIDgwKTtcbiAgICAgICAgcmV0dXJuIGBNSUwgJHttaWxQY3R9YDtcbiAgICB9XG4gICAgaWYgKHpvbmUgPT09ICdhYi1taW4nKSB7XG4gICAgICAgIHJldHVybiAnQUIxJztcbiAgICB9XG4gICAgcmV0dXJuICdBQjInO1xufVxuXG4vKiogTWFwIGxldmVyIHRvIFswLCAxXSBmb3IgZW5naW5lIGF1ZGlvIChpZGxl4oaSbWls4oaSZnVsbCBBQikuICovXG5leHBvcnQgZnVuY3Rpb24gZjE2VGhyb3R0bGVBdWRpb0xldmVsKGxldmVyOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IHNsS24gPSBjb21wdXRlRjE2U2xUaHJ1c3RLbihsZXZlcik7XG4gICAgY29uc3QgeyBpZGxlVGhydXN0S24sIGFiTWF4VGhydXN0S24gfSA9IEYxNl9FTkdJTkU7XG4gICAgaWYgKGFiTWF4VGhydXN0S24gPD0gaWRsZVRocnVzdEtuKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICByZXR1cm4gY2xhbXBMZXZlcigoc2xLbiAtIGlkbGVUaHJ1c3RLbikgLyAoYWJNYXhUaHJ1c3RLbiAtIGlkbGVUaHJ1c3RLbikpO1xufVxuXG4vKiogQ29udGludW91cyBNSUwgcmFtcCBmb3IgaGVsZCBrZXlib2FyZCBpbnB1dCBiZWxvdyB0aGUgTUlMIHN0b3AuICovXG5leHBvcnQgZnVuY3Rpb24gYWRqdXN0RjE2VGhyb3R0bGVJbnB1dChsZXZlcjogbnVtYmVyLCBzdGVwOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IGN1cnJlbnQgPSBjbGFtcExldmVyKGxldmVyKTtcbiAgICBpZiAoc3RlcCA+IDApIHtcbiAgICAgICAgcmV0dXJuIHJhbXBGMTZUaHJvdHRsZVVwKGN1cnJlbnQsIHN0ZXApO1xuICAgIH1cbiAgICBpZiAoc3RlcCA8IDApIHtcbiAgICAgICAgcmV0dXJuIHJhbXBGMTZUaHJvdHRsZURvd24oY3VycmVudCwgLXN0ZXApO1xuICAgIH1cbiAgICByZXR1cm4gY3VycmVudDtcbn1cblxuLyoqIE9uZSBkZXRlbnQgcGVyIGtleSBwcmVzczogTUlMIDEwMCDihpIgQUIxIOKGkiBBQjIgKGFuZCByZXZlcnNlKS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdGVwRjE2VGhyb3R0bGVEZXRlbnQobGV2ZXI6IG51bWJlciwgZGlyZWN0aW9uOiAxIHwgLTEpOiBudW1iZXIge1xuICAgIGNvbnN0IHBjdCA9IGxldmVyVG9QZXJjZW50KGxldmVyKTtcbiAgICBpZiAoZGlyZWN0aW9uID4gMCkge1xuICAgICAgICBpZiAocGN0ID49IDk5KSB7XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocGN0ID49IDk4KSB7XG4gICAgICAgICAgICByZXR1cm4gRjE2X0VOR0lORS5hYk1pbkxldmVyRW5kO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBsZXZlcjtcbiAgICB9XG4gICAgaWYgKHBjdCA+PSAxMDApIHtcbiAgICAgICAgcmV0dXJuIEYxNl9FTkdJTkUuYWJNaW5MZXZlckVuZDtcbiAgICB9XG4gICAgaWYgKHBjdCA+PSA5OSkge1xuICAgICAgICByZXR1cm4gRjE2X0VOR0lORS5taWxMZXZlckVuZDtcbiAgICB9XG4gICAgcmV0dXJuIGxldmVyO1xufVxuXG5mdW5jdGlvbiByYW1wRjE2VGhyb3R0bGVVcChsZXZlcjogbnVtYmVyLCBzdGVwOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IHRhcmdldCA9IGxldmVyICsgc3RlcDtcbiAgICBpZiAodGFyZ2V0ID49IEYxNl9FTkdJTkUubWlsTGV2ZXJFbmQpIHtcbiAgICAgICAgcmV0dXJuIEYxNl9FTkdJTkUubWlsTGV2ZXJFbmQ7XG4gICAgfVxuICAgIHJldHVybiBjbGFtcExldmVyKHRhcmdldCk7XG59XG5cbmZ1bmN0aW9uIHJhbXBGMTZUaHJvdHRsZURvd24obGV2ZXI6IG51bWJlciwgc3RlcDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBjb25zdCBwY3QgPSBsZXZlclRvUGVyY2VudChsZXZlcik7XG4gICAgaWYgKHBjdCA+IDk4KSB7XG4gICAgICAgIHJldHVybiBGMTZfRU5HSU5FLm1pbExldmVyRW5kO1xuICAgIH1cbiAgICByZXR1cm4gY2xhbXBMZXZlcihsZXZlciAtIHN0ZXApO1xufVxuXG5mdW5jdGlvbiBjbGFtcExldmVyKGxldmVyOiBudW1iZXIpOiBudW1iZXIge1xuICAgIHJldHVybiBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCBsZXZlcikpO1xufVxuIiwiaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuaW1wb3J0IHsgY2xhbXAgfSBmcm9tICcuLi91dGlscy9tYXRoJztcblxuY29uc3QgR1JBVklUWSA9IDkuODtcblxuLyoqIEZCVyBlbnZlbG9wZSBtYXJnaW46IGZ1bGwgYXV0aG9yaXR5IHVudGlsIDFnIGJlbG93IGxpbWl0LCB0aGVuIGxpbmVhciBmYWRlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVGMTZFbnZlbG9wZUF1dGhvcml0eShjdXJyZW50RzogbnVtYmVyLCBtYXhHOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IG1hcmdpbiA9IG1heEcgLSBjdXJyZW50RztcbiAgICBpZiAobWFyZ2luID49IDEpIHtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICAgIGlmIChtYXJnaW4gPD0gMCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgcmV0dXJuIG1hcmdpbjtcbn1cblxuLyoqIFJlZHVjZSBub3NlLXVwIHBpdGNoIGNvbW1hbmQgYXMgcG9zaXRpdmUgZyBhcHByb2FjaGVzIHRoZSBGQ1MgY2FwLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVGMTZQaXRjaEdMaW1pdChjdXJyZW50RzogbnVtYmVyLCBwaXRjaFN0aWNrOiBudW1iZXIsIG1heEc6IG51bWJlcik6IG51bWJlciB7XG4gICAgaWYgKHBpdGNoU3RpY2sgPD0gMCkge1xuICAgICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXB1dGVGMTZFbnZlbG9wZUF1dGhvcml0eShjdXJyZW50RywgbWF4Ryk7XG59XG5cbi8qKiBGQlcgYWxwaGEgbGltaXRlcjogZmFkZSBub3NlLXVwIGNvbW1hbmQgYXMgQU9BIGFwcHJvYWNoZXMgdGhlIHN0YWxsLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVGMTZQaXRjaEFvYUF1dGhvcml0eShhb2FSYWQ6IG51bWJlciwgcGl0Y2hTdGljazogbnVtYmVyLCBzdGFsbEFvYVJhZDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBpZiAocGl0Y2hTdGljayA8PSAwKSB7XG4gICAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgICBjb25zdCBsaW1pdCA9IHN0YWxsQW9hUmFkICogMC45NTtcbiAgICBpZiAoYW9hUmFkIDw9IGxpbWl0KSB7XG4gICAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgICByZXR1cm4gY2xhbXAoMSAtIChhb2FSYWQgLSBsaW1pdCkgLyBzdGFsbEFvYVJhZCwgMCwgMSk7XG59XG5cbi8qKiBOb3NlLWRvd24gcmVjb3ZlcnkgcmF0ZSAocmFkL3MpIHdoZW4gfEFPQXwgZXhjZWVkcyB0aGUgc3RhbGwgbGltaXQuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUYxNkFvYVJlY292ZXJ5UmF0ZShhb2FSYWQ6IG51bWJlciwgc3RhbGxBb2FSYWQ6IG51bWJlciwgc3BlZWQ6IG51bWJlcik6IG51bWJlciB7XG4gICAgaWYgKHNwZWVkIDwgMTApIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGlmIChNYXRoLmFicyhhb2FSYWQpIDw9IHN0YWxsQW9hUmFkKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICByZXR1cm4gY2xhbXAoKE1hdGguYWJzKGFvYVJhZCkgLSBzdGFsbEFvYVJhZCkgLyBzdGFsbEFvYVJhZCwgMCwgMSkgKiAwLjM1O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUxvYWRGYWN0b3JHKGFjY2VsOiBUSFJFRS5WZWN0b3IzLCB1cDogVEhSRUUuVmVjdG9yMywgZ3Jhdml0eSA9IEdSQVZJVFkpOiBudW1iZXIge1xuICAgIHJldHVybiAoYWNjZWwueCAqIHVwLnggKyAoYWNjZWwueSArIGdyYXZpdHkpICogdXAueSArIGFjY2VsLnogKiB1cC56KSAvIGdyYXZpdHk7XG59XG5cbi8qKiBUcmltIGFjY2VsZXJhdGlvbiBhbG9uZyBib2R5IHVwIHNvIGxvYWQgZmFjdG9yIGRvZXMgbm90IGV4Y2VlZCB0aGUgRkNTIGVudmVsb3BlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsYW1wTG9hZEZhY3RvckFjY2VsZXJhdGlvbihcbiAgICBhY2NlbDogVEhSRUUuVmVjdG9yMyxcbiAgICB1cDogVEhSRUUuVmVjdG9yMyxcbiAgICBtYXhHOiBudW1iZXIsXG4gICAgZ3Jhdml0eSA9IEdSQVZJVFksXG4pOiB2b2lkIHtcbiAgICBjb25zdCBuID0gY29tcHV0ZUxvYWRGYWN0b3JHKGFjY2VsLCB1cCwgZ3Jhdml0eSk7XG4gICAgaWYgKG4gPD0gbWF4Rykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGFjY2VsLmFkZFNjYWxlZFZlY3Rvcih1cCwgKG1heEcgLSBuKSAqIGdyYXZpdHkpO1xufVxuIiwiLyoqXG4gKiBGLTE2QyBhZXJvZHluYW1pYyBkYXRhIGZyb206XG4gKiBSZWhtYW4sIFwiQWVyb2R5bmFtaWMgUGVyZm9ybWFuY2UgQW5hbHlzaXMgb2YgRi0xNkMgRmlnaHRpbmcgRmFsY29uXCIgKE5VU1QpLlxuICogQ2hhcnQgcmVmZXJlbmNlcyBjb21wdXRlZCB3aXRoIEFuZGVyc29uIElTQSArIHBhcGVyIEVxLiAoMuKAkzUpLCBr4oKCID0gMC5cbiAqL1xuXG5leHBvcnQgY29uc3QgRjE2X1BBUEVSX0FOQUxZVElDQUwgPSB7XG4gICAgLyoqIEVxLiAoMik6IENEMCA9IENmZSAqIFN3ZXQgLyBTcmVmICovXG4gICAgY2QwOiAwLjAxOCxcbiAgICAvKiogRXEuICgz4oCTNSk6IENEaSA9IEsgKiBDTMKyICovXG4gICAgaW5kdWNlZERyYWdLOiAwLjE0ODksXG4gICAgY2wwOiAwLjIsXG4gICAgLyoqIE5BQ0EgNjRBMjA0LCBwZXIgcmFkaWFuICovXG4gICAgY2xBbHBoYVBlclJhZDogNS43MyxcbiAgICAvKiogRmlnLiA3IHBlYWsgKi9cbiAgICBtYXhMaWZ0VG9EcmFnOiA5LjY2LFxuICAgIG1heExpZnRUb0RyYWdBbHBoYURlZzogMixcbiAgICAvKiogRmlnLiA5ICovXG4gICAgbWluR2xpZGVBbmdsZURlZzogNS45MSxcbiAgICAvKiogU2VjdGlvbiBJSUkgYXNzdW1wdGlvbnMg4oCUIGNydWlzZSBhdCBNVE9XICovXG4gICAgY3J1aXNlVmVsb2NpdHlGcHM6IDg0NixcbiAgICBjcnVpc2VBbHRpdHVkZUZ0OiAzMDAwMCxcbiAgICAvKiogSmFuZSdzIC8gbGl0ZXJhdHVyZSBzZXJ2aWNlIGNlaWxpbmcgKi9cbiAgICBzZXJ2aWNlQ2VpbGluZ0Z0OiA1MDAwMCxcbiAgICB3aW5nQXJlYUZ0MjogMzAwLFxuICAgIG10b3dMYjogNDIwMDAsXG59IGFzIGNvbnN0O1xuXG4vKiogT3BlblZTUCAvIFZTUEFlcm8gcmVzdWx0cyBjaXRlZCBpbiBTZWN0aW9uIElWLkIuICovXG5leHBvcnQgY29uc3QgRjE2X1BBUEVSX1ZTUEFFUk8gPSB7XG4gICAgY2QwOiAwLjAxMjQsXG4gICAgY2xBbHBoYVBlclJhZDogMy42MixcbiAgICAvKiogRGVyaXZlZCBmcm9tIEwvRCBtYXggPSAxNCBhdCDOsSDiiYggNMKwIHdpdGggQ0zigoAgPSAwLjIuICovXG4gICAgaW5kdWNlZERyYWdLOiAwLjA5NzMsXG4gICAgbWF4TGlmdFRvRHJhZzogMTQsXG4gICAgbWF4TGlmdFRvRHJhZ0FscGhhRGVnOiA0LFxufSBhcyBjb25zdDtcblxuZXhwb3J0IHR5cGUgRjE2UGFwZXJNZXRyaWMgPVxuICAgIHwgJ2xpZnRUb0RyYWcnXG4gICAgfCAnbWluR2xpZGVBbmdsZURlZydcbiAgICB8ICd0aHJ1c3RSZXF1aXJlZExiJ1xuICAgIHwgJ3RvdGFsRHJhZ0xiJ1xuICAgIHwgJ21pblRvdGFsRHJhZ0xiJ1xuICAgIHwgJ2NydWlzZVNwZWVkRnBzJ1xuICAgIHwgJ2NkMCdcbiAgICB8ICdjbEFscGhhUGVyUmFkJ1xuICAgIHwgJ3ZNaW5EcmFnRnBzJztcblxuZXhwb3J0IGludGVyZmFjZSBGMTZQYXBlckNoYXJ0Q2FzZSB7XG4gICAgaWQ6IHN0cmluZztcbiAgICBmaWd1cmU6IHN0cmluZztcbiAgICBkZXNjcmlwdGlvbjogc3RyaW5nO1xuICAgIG1ldHJpYzogRjE2UGFwZXJNZXRyaWM7XG4gICAgLyoqIEFuZ2xlIG9mIGF0dGFjayBmb3IgTC9EIGNhc2VzIChkZWdyZWVzKS4gKi9cbiAgICBhbHBoYURlZz86IG51bWJlcjtcbiAgICBhbHRpdHVkZUZ0OiBudW1iZXI7XG4gICAgd2VpZ2h0TGI6IG51bWJlcjtcbiAgICB2ZWxvY2l0eUZwczogbnVtYmVyO1xuICAgIHJlZmVyZW5jZTogbnVtYmVyO1xuICAgIHRvbGVyYW5jZTogbnVtYmVyO1xufVxuXG4vKipcbiAqIENoYXJ0IGNoZWNrcG9pbnRzIGZyb20gRmlncy4gNywgOSwgMTDigJMxMiwgMTbigJMxNy5cbiAqIERyYWcvdGhydXN0IHJlZmVyZW5jZXM6IElTQSArIHBhcGVyIHBvbGFyIGF0IHN0YXRlZCBWLCBoLCBXIChNQVRMQUIgbWV0aG9kb2xvZ3kpLlxuICovXG5leHBvcnQgY29uc3QgRjE2X1BBUEVSX0NIQVJUX0NBU0VTOiBGMTZQYXBlckNoYXJ0Q2FzZVtdID0gW1xuICAgIHtcbiAgICAgICAgaWQ6ICdmaWc3X2xkX21heCcsXG4gICAgICAgIGZpZ3VyZTogJ0ZpZy4gNycsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTWF4aW11bSBsaWZ0LXRvLWRyYWcgcmF0aW8nLFxuICAgICAgICBtZXRyaWM6ICdsaWZ0VG9EcmFnJyxcbiAgICAgICAgYWxwaGFEZWc6IDIsXG4gICAgICAgIGFsdGl0dWRlRnQ6IDAsXG4gICAgICAgIHdlaWdodExiOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5tdG93TGIsXG4gICAgICAgIHZlbG9jaXR5RnBzOiAwLFxuICAgICAgICByZWZlcmVuY2U6IDkuNjYsXG4gICAgICAgIHRvbGVyYW5jZTogMC4xNSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6ICdmaWc5X21pbl9nbGlkZScsXG4gICAgICAgIGZpZ3VyZTogJ0ZpZy4gOScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTWluaW11bSBnbGlkZSBhbmdsZScsXG4gICAgICAgIG1ldHJpYzogJ21pbkdsaWRlQW5nbGVEZWcnLFxuICAgICAgICBhbHRpdHVkZUZ0OiAzMDAwMCxcbiAgICAgICAgd2VpZ2h0TGI6IEYxNl9QQVBFUl9BTkFMWVRJQ0FMLm10b3dMYixcbiAgICAgICAgdmVsb2NpdHlGcHM6IDAsXG4gICAgICAgIHJlZmVyZW5jZTogNS45MSxcbiAgICAgICAgdG9sZXJhbmNlOiAwLjEsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGlkOiAnZmlnMTBfbWluX2RyYWdfMjBrJyxcbiAgICAgICAgZmlndXJlOiAnRmlnLiAxMCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTWluaW11bSB0b3RhbCBkcmFnIGF0IDIwLDAwMCBmdCAoTVRPVyknLFxuICAgICAgICBtZXRyaWM6ICdtaW5Ub3RhbERyYWdMYicsXG4gICAgICAgIGFsdGl0dWRlRnQ6IDIwMDAwLFxuICAgICAgICB3ZWlnaHRMYjogRjE2X1BBUEVSX0FOQUxZVElDQUwubXRvd0xiLFxuICAgICAgICB2ZWxvY2l0eUZwczogNzk3LFxuICAgICAgICByZWZlcmVuY2U6IDQzNDguNzQsXG4gICAgICAgIHRvbGVyYW5jZTogNTAsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGlkOiAnZmlnMTBfZHJhZ183NTBmcHMnLFxuICAgICAgICBmaWd1cmU6ICdGaWcuIDEwJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdUb3RhbCBkcmFnIGF0IDc1MCBmdC9zLCAyMCwwMDAgZnQgKE1UT1cpJyxcbiAgICAgICAgbWV0cmljOiAndG90YWxEcmFnTGInLFxuICAgICAgICBhbHRpdHVkZUZ0OiAyMDAwMCxcbiAgICAgICAgd2VpZ2h0TGI6IEYxNl9QQVBFUl9BTkFMWVRJQ0FMLm10b3dMYixcbiAgICAgICAgdmVsb2NpdHlGcHM6IDc1MCxcbiAgICAgICAgcmVmZXJlbmNlOiA0MzgxLjUwLFxuICAgICAgICB0b2xlcmFuY2U6IDUwLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2ZpZzExX21pbl9kcmFnXzMwaycsXG4gICAgICAgIGZpZ3VyZTogJ0ZpZy4gMTEnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ01pbmltdW0gdG90YWwgZHJhZyBhdCAzMCwwMDAgZnQgKE1UT1cpJyxcbiAgICAgICAgbWV0cmljOiAnbWluVG90YWxEcmFnTGInLFxuICAgICAgICBhbHRpdHVkZUZ0OiAzMDAwMCxcbiAgICAgICAgd2VpZ2h0TGI6IEYxNl9QQVBFUl9BTkFMWVRJQ0FMLm10b3dMYixcbiAgICAgICAgdmVsb2NpdHlGcHM6IDk1MixcbiAgICAgICAgcmVmZXJlbmNlOiA0MzQ4Ljc0LFxuICAgICAgICB0b2xlcmFuY2U6IDUwLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2ZpZzExX2RyYWdfOTAwZnBzJyxcbiAgICAgICAgZmlndXJlOiAnRmlnLiAxMScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnVG90YWwgZHJhZyBhdCA5MDAgZnQvcywgMzAsMDAwIGZ0IChNVE9XKScsXG4gICAgICAgIG1ldHJpYzogJ3RvdGFsRHJhZ0xiJyxcbiAgICAgICAgYWx0aXR1ZGVGdDogMzAwMDAsXG4gICAgICAgIHdlaWdodExiOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5tdG93TGIsXG4gICAgICAgIHZlbG9jaXR5RnBzOiA5MDAsXG4gICAgICAgIHJlZmVyZW5jZTogNDM3NS44NCxcbiAgICAgICAgdG9sZXJhbmNlOiA1MCxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6ICdmaWcxMl9taW5fZHJhZ180MGsnLFxuICAgICAgICBmaWd1cmU6ICdGaWcuIDEyJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdNaW5pbXVtIHRvdGFsIGRyYWcgYXQgNDAsMDAwIGZ0IChNVE9XKScsXG4gICAgICAgIG1ldHJpYzogJ21pblRvdGFsRHJhZ0xiJyxcbiAgICAgICAgYWx0aXR1ZGVGdDogNDAwMDAsXG4gICAgICAgIHdlaWdodExiOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5tdG93TGIsXG4gICAgICAgIHZlbG9jaXR5RnBzOiAxMTczLFxuICAgICAgICByZWZlcmVuY2U6IDQzNDguNzMsXG4gICAgICAgIHRvbGVyYW5jZTogNTAsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGlkOiAnZmlnMTJfZHJhZ18xMDAwZnBzJyxcbiAgICAgICAgZmlndXJlOiAnRmlnLiAxMicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnVG90YWwgZHJhZyBhdCAxLDAwMCBmdC9zLCA0MCwwMDAgZnQgKE1UT1cpJyxcbiAgICAgICAgbWV0cmljOiAndG90YWxEcmFnTGInLFxuICAgICAgICBhbHRpdHVkZUZ0OiA0MDAwMCxcbiAgICAgICAgd2VpZ2h0TGI6IEYxNl9QQVBFUl9BTkFMWVRJQ0FMLm10b3dMYixcbiAgICAgICAgdmVsb2NpdHlGcHM6IDEwMDAsXG4gICAgICAgIHJlZmVyZW5jZTogNDU3Mi41MyxcbiAgICAgICAgdG9sZXJhbmNlOiA1MCxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6ICdmaWcxNl90cl9taW5fMzVrbGInLFxuICAgICAgICBmaWd1cmU6ICdGaWcuIDE2JyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdNaW5pbXVtIHRocnVzdCByZXF1aXJlZCBhdCAzNSwwMDAgbGIgKDMwLDAwMCBmdCknLFxuICAgICAgICBtZXRyaWM6ICd0aHJ1c3RSZXF1aXJlZExiJyxcbiAgICAgICAgYWx0aXR1ZGVGdDogMzAwMDAsXG4gICAgICAgIHdlaWdodExiOiAzNTAwMCxcbiAgICAgICAgdmVsb2NpdHlGcHM6IDg3MCxcbiAgICAgICAgcmVmZXJlbmNlOiAzNjIzLjk2LFxuICAgICAgICB0b2xlcmFuY2U6IDUwLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2ZpZzE2X3RyXzM1a2xiXzkwMGZwcycsXG4gICAgICAgIGZpZ3VyZTogJ0ZpZy4gMTYnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1RocnVzdCByZXF1aXJlZCBhdCAzNSwwMDAgbGIsIDkwMCBmdC9zICgzMCwwMDAgZnQpJyxcbiAgICAgICAgbWV0cmljOiAndGhydXN0UmVxdWlyZWRMYicsXG4gICAgICAgIGFsdGl0dWRlRnQ6IDMwMDAwLFxuICAgICAgICB3ZWlnaHRMYjogMzUwMDAsXG4gICAgICAgIHZlbG9jaXR5RnBzOiA5MDAsXG4gICAgICAgIHJlZmVyZW5jZTogMzYzMy4wMSxcbiAgICAgICAgdG9sZXJhbmNlOiA1MCxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6ICdmaWcxNl90cl8zNWtsYl8xMDAwZnBzJyxcbiAgICAgICAgZmlndXJlOiAnRmlnLiAxNicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnVGhydXN0IHJlcXVpcmVkIGF0IDM1LDAwMCBsYiwgMSwwMDAgZnQvcyAoMzAsMDAwIGZ0KScsXG4gICAgICAgIG1ldHJpYzogJ3RocnVzdFJlcXVpcmVkTGInLFxuICAgICAgICBhbHRpdHVkZUZ0OiAzMDAwMCxcbiAgICAgICAgd2VpZ2h0TGI6IDM1MDAwLFxuICAgICAgICB2ZWxvY2l0eUZwczogMTAwMCxcbiAgICAgICAgcmVmZXJlbmNlOiAzNzY4LjQzLFxuICAgICAgICB0b2xlcmFuY2U6IDUwLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2ZpZzE3X3RyX21pbl8yMGsnLFxuICAgICAgICBmaWd1cmU6ICdGaWcuIDE3JyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdNaW5pbXVtIHRocnVzdCByZXF1aXJlZCBhdCAyMCwwMDAgZnQgKE1UT1cpJyxcbiAgICAgICAgbWV0cmljOiAndGhydXN0UmVxdWlyZWRMYicsXG4gICAgICAgIGFsdGl0dWRlRnQ6IDIwMDAwLFxuICAgICAgICB3ZWlnaHRMYjogRjE2X1BBUEVSX0FOQUxZVElDQUwubXRvd0xiLFxuICAgICAgICB2ZWxvY2l0eUZwczogNzk3LFxuICAgICAgICByZWZlcmVuY2U6IDQzNDguNzQsXG4gICAgICAgIHRvbGVyYW5jZTogNTAsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGlkOiAnZmlnMTdfdHJfbWluXzMwaycsXG4gICAgICAgIGZpZ3VyZTogJ0ZpZy4gMTcnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1RocnVzdCByZXF1aXJlZCBhdCAxLDAwMCBmdC9zLCAzMCwwMDAgZnQgKE1UT1cpJyxcbiAgICAgICAgbWV0cmljOiAndGhydXN0UmVxdWlyZWRMYicsXG4gICAgICAgIGFsdGl0dWRlRnQ6IDMwMDAwLFxuICAgICAgICB3ZWlnaHRMYjogRjE2X1BBUEVSX0FOQUxZVElDQUwubXRvd0xiLFxuICAgICAgICB2ZWxvY2l0eUZwczogMTAwMCxcbiAgICAgICAgcmVmZXJlbmNlOiA0MzcwLjEyLFxuICAgICAgICB0b2xlcmFuY2U6IDUwLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2ZpZzE3X3RyXzExNTBmcHNfNDBrJyxcbiAgICAgICAgZmlndXJlOiAnRmlnLiAxNycsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnVGhydXN0IHJlcXVpcmVkIGF0IDEsMTUwIGZ0L3MsIDQwLDAwMCBmdCAoTVRPVyknLFxuICAgICAgICBtZXRyaWM6ICd0aHJ1c3RSZXF1aXJlZExiJyxcbiAgICAgICAgYWx0aXR1ZGVGdDogNDAwMDAsXG4gICAgICAgIHdlaWdodExiOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5tdG93TGIsXG4gICAgICAgIHZlbG9jaXR5RnBzOiAxMTUwLFxuICAgICAgICByZWZlcmVuY2U6IDQzNTIuMjAsXG4gICAgICAgIHRvbGVyYW5jZTogNTAsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGlkOiAnYXNzdW1wdGlvbl9jcnVpc2Vfc3BlZWQnLFxuICAgICAgICBmaWd1cmU6ICdTZWN0aW9uIElJSScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQ3J1aXNlIHZlbG9jaXR5IGF0IDMwLDAwMCBmdCAoTVRPVyknLFxuICAgICAgICBtZXRyaWM6ICdjcnVpc2VTcGVlZEZwcycsXG4gICAgICAgIGFsdGl0dWRlRnQ6IEYxNl9QQVBFUl9BTkFMWVRJQ0FMLmNydWlzZUFsdGl0dWRlRnQsXG4gICAgICAgIHdlaWdodExiOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5tdG93TGIsXG4gICAgICAgIHZlbG9jaXR5RnBzOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5jcnVpc2VWZWxvY2l0eUZwcyxcbiAgICAgICAgcmVmZXJlbmNlOiA4NDYsXG4gICAgICAgIHRvbGVyYW5jZTogMC41LFxuICAgIH0sXG5dO1xuXG4vKiogVlNQQWVybyBjaGFydCBjaGVja3BvaW50cyAoRmlncy4gMTjigJMyMCkuICovXG5leHBvcnQgY29uc3QgRjE2X1BBUEVSX1ZTUEFFUk9fQ0FTRVM6IEYxNlBhcGVyQ2hhcnRDYXNlW10gPSBbXG4gICAge1xuICAgICAgICBpZDogJ2ZpZzIwX2xkX21heF92c3BhZXJvJyxcbiAgICAgICAgZmlndXJlOiAnRmlnLiAyMCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnVlNQQWVybyBtYXhpbXVtIEwvRCcsXG4gICAgICAgIG1ldHJpYzogJ2xpZnRUb0RyYWcnLFxuICAgICAgICBhbHBoYURlZzogNCxcbiAgICAgICAgYWx0aXR1ZGVGdDogMCxcbiAgICAgICAgd2VpZ2h0TGI6IEYxNl9QQVBFUl9BTkFMWVRJQ0FMLm10b3dMYixcbiAgICAgICAgdmVsb2NpdHlGcHM6IDAsXG4gICAgICAgIHJlZmVyZW5jZTogMTQsXG4gICAgICAgIHRvbGVyYW5jZTogMC4xNSxcbiAgICB9LFxuXTtcblxuZXhwb3J0IGNvbnN0IEZUX1RPX00gPSAwLjMwNDg7XG5leHBvcnQgY29uc3QgRlBTX1RPX01QUyA9IEZUX1RPX007XG5leHBvcnQgY29uc3QgTEJfVE9fTiA9IDQuNDQ4MjIxNjE1MztcbmV4cG9ydCBjb25zdCBMQl9UT19LRyA9IDAuNDUzNTkyMzc7XG4iLCIvKipcbiAqIEYtMTZDIHNpbSBwcm9maWxlIGFuZCByZWZlcmVuY2UgZGF0YS5cbiAqIEFuYWx5dGljYWwgYWVybzogUmVobWFuLCBcIkFlcm9keW5hbWljIFBlcmZvcm1hbmNlIEFuYWx5c2lzIG9mIEYtMTZDIEZpZ2h0aW5nIEZhbGNvblwiLlxuICogUGVyZm9ybWFuY2UgZW52ZWxvcGU6IFVTQUYgZmFjdCBzaGVldCAvIEphbmUncy5cbiAqL1xuaW1wb3J0IHsgRjE2X1BBUEVSX0FOQUxZVElDQUwgfSBmcm9tICcuL2YxNlBhcGVyRGF0YSc7XG5cbmV4cG9ydCBjb25zdCBGMTZfUFJPRklMRSA9IHtcbiAgICAvKiogTVRPVyBmb3IgcGFwZXIvZW52ZWxvcGUgYW5hbHlzaXMgKH40MiwwMDAgbGIpLiAqL1xuICAgIGNvbWJhdE1hc3NLZzogMTkwNTEsXG4gICAgLyoqIFR5cGljYWwgdGFrZW9mZiBncm9zcyB3ZWlnaHQgZm9yIHNpbSBkeW5hbWljcyAofjMwLDAwMCBsYikuICovXG4gICAgc2ltTWFzc0tnOiAxMzYwOCxcbiAgICB3aW5nQXJlYU0yOiAyNy44NyxcbiAgICB3aW5nU3Bhbk06IDkuNDUsXG4gICAgY2QwOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5jZDAsXG4gICAgaW5kdWNlZERyYWdLOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5pbmR1Y2VkRHJhZ0ssXG4gICAgY2wwOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5jbDAsXG4gICAgY2xBbHBoYVBlclJhZDogRjE2X1BBUEVSX0FOQUxZVElDQUwuY2xBbHBoYVBlclJhZCxcbiAgICBhYlRocnVzdEtuOiAxMjkuNCxcbiAgICBtaWxUaHJ1c3RLbjogNzYuMyxcbiAgICAvKiogTGV2ZXIgYXQgMTAwJSBtaWxpdGFyeSBwb3dlciAoOTggb24gMOKAkzEwMCBxdWFkcmFudCkuICovXG4gICAgbWlsTGV2ZXJFbmQ6IDAuOTgsXG4gICAgLyoqIExldmVyIGF0IEFCMSBkZXRlbnQgKDk5IG9uIDDigJMxMDAgcXVhZHJhbnQpLiAqL1xuICAgIGFiTWluTGV2ZXJFbmQ6IDAuOTksXG4gICAgbWluRmx5aW5nU3BlZWRNcHM6IDY4LFxuICAgIHN0YWxsQW9hRGVnOiAyMixcbiAgICBzZXJ2aWNlQ2VpbGluZ006IEYxNl9QQVBFUl9BTkFMWVRJQ0FMLnNlcnZpY2VDZWlsaW5nRnQgKiAwLjMwNDgsXG4gICAgY3J1aXNlQWx0aXR1ZGVNOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5jcnVpc2VBbHRpdHVkZUZ0ICogMC4zMDQ4LFxuICAgIGNydWlzZVNwZWVkTXBzOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5jcnVpc2VWZWxvY2l0eUZwcyAqIDAuMzA0OCxcbiAgICAvKiogQ2F0IEkgY2xlYW4tc2hpcCBGQlcgcm9sbC1yYXRlIGNhcCAoZGVnL3MpLiAqL1xuICAgIG1heFJvbGxSYXRlRGVnUzogMzAwLFxuICAgIC8qKiBDYXQgSUlJIGhlYXZ5IHN0b3JlcyByb2xsLXJhdGUgY2FwIChkZWcvcykuICovXG4gICAgY2F0M01heFJvbGxSYXRlRGVnUzogMTgwLFxuICAgIC8qKiBGQlcgcG9zaXRpdmUgc3RydWN0dXJhbCBnIGxpbWl0IChDYXQgSSkuICovXG4gICAgbWF4TG9hZEZhY3Rvckc6IDkuNSxcbiAgICAvKiogVGFrZW9mZiByb3RhdGlvbiBzcGVlZCAofjcwIGt0KS4gKi9cbiAgICByb3RhdGlvblNwZWVkTXBzOiA2NSxcbiAgICAvKiogTWF4IHRvdWNoZG93biBncm91bmRzcGVlZCB3aXRoIGdlYXIgZG93bi4gKi9cbiAgICBsYW5kaW5nTWF4U3BlZWRNcHM6IDkwLFxuICAgIC8qKiBNYXggc2luayByYXRlIGF0IHRvdWNoZG93biAobS9zKS4gKi9cbiAgICBsYW5kaW5nTWF4VmVydGljYWxTcGVlZE1wczogOCxcbiAgICAvKiogTWF4IGJhbmsgYXQgdG91Y2hkb3duIChkZWcpLiAqL1xuICAgIGxhbmRpbmdNYXhSb2xsRGVnOiAxMixcbiAgICAvKiogTWluaW11bSBwaXRjaCBhdCB0b3VjaGRvd24gKGRlZywgbm9zZS1kb3duIGxpbWl0KS4gKi9cbiAgICBsYW5kaW5nTWluUGl0Y2hEZWc6IC0xMixcbn0gYXMgY29uc3Q7XG5cbmV4cG9ydCB0eXBlIEYxNlJlZmVyZW5jZU1ldHJpYyA9XG4gICAgfCAnbWFzc0tnJ1xuICAgIHwgJ3dpbmdBcmVhTTInXG4gICAgfCAnd2luZ1NwYW5NJ1xuICAgIHwgJ2FiVGhydXN0S24nXG4gICAgfCAnbWF4TWFjaCdcbiAgICB8ICdtYXhTcGVlZEttaCdcbiAgICB8ICdtaW5GbHlpbmdTcGVlZEt0cydcbiAgICB8ICdwZWFrTWF4U3BlZWRBbHRpdHVkZU0nXG4gICAgfCAnY2QwJ1xuICAgIHwgJ2luZHVjZWREcmFnSydcbiAgICB8ICdjbEFscGhhUGVyUmFkJ1xuICAgIHwgJ21heExpZnRUb0RyYWcnXG4gICAgfCAnY3J1aXNlU3BlZWRNcHMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEYxNlJlZmVyZW5jZUNhc2Uge1xuICAgIGlkOiBzdHJpbmc7XG4gICAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgICBzb3VyY2U6IHN0cmluZztcbiAgICBtZXRyaWM6IEYxNlJlZmVyZW5jZU1ldHJpYztcbiAgICBhbHRpdHVkZU1ldGVyczogbnVtYmVyO1xuICAgIHJlZmVyZW5jZTogbnVtYmVyO1xuICAgIHRvbGVyYW5jZTogbnVtYmVyO1xuICAgIC8qKiBGb3IgTC9EIG1ldHJpYy4gKi9cbiAgICBhbHBoYURlZz86IG51bWJlcjtcbn1cblxuZXhwb3J0IGNvbnN0IEYxNl9SRUZFUkVOQ0VfQ0FTRVM6IEYxNlJlZmVyZW5jZUNhc2VbXSA9IFtcbiAgICB7XG4gICAgICAgIGlkOiAnY2QwX3BhcGVyJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdaZXJvLWxpZnQgZHJhZyBjb2VmZmljaWVudCAoRXEuIDIpJyxcbiAgICAgICAgc291cmNlOiAnUmVobWFuIHBhcGVyIGFuYWx5dGljYWwnLFxuICAgICAgICBtZXRyaWM6ICdjZDAnLFxuICAgICAgICBhbHRpdHVkZU1ldGVyczogMCxcbiAgICAgICAgcmVmZXJlbmNlOiAwLjAxOCxcbiAgICAgICAgdG9sZXJhbmNlOiAwLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2luZHVjZWRfa19wYXBlcicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnSW5kdWNlZCBkcmFnIGZhY3RvciBLIChFcS4gM+KAkzUpJyxcbiAgICAgICAgc291cmNlOiAnUmVobWFuIHBhcGVyIGFuYWx5dGljYWwnLFxuICAgICAgICBtZXRyaWM6ICdpbmR1Y2VkRHJhZ0snLFxuICAgICAgICBhbHRpdHVkZU1ldGVyczogMCxcbiAgICAgICAgcmVmZXJlbmNlOiAwLjE0ODksXG4gICAgICAgIHRvbGVyYW5jZTogMC4wMDAxLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2NsX2FscGhhX3BhcGVyJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdMaWZ0LWN1cnZlIHNsb3BlJyxcbiAgICAgICAgc291cmNlOiAnUmVobWFuIHBhcGVyIC8gTkFDQSA2NEEyMDQnLFxuICAgICAgICBtZXRyaWM6ICdjbEFscGhhUGVyUmFkJyxcbiAgICAgICAgYWx0aXR1ZGVNZXRlcnM6IDAsXG4gICAgICAgIHJlZmVyZW5jZTogNS43MyxcbiAgICAgICAgdG9sZXJhbmNlOiAwLjAxLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2xkX21heF9wYXBlcicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTWF4aW11bSBsaWZ0LXRvLWRyYWcgcmF0aW8gYXQgzrEg4omIIDLCsCcsXG4gICAgICAgIHNvdXJjZTogJ1JlaG1hbiBGaWcuIDcnLFxuICAgICAgICBtZXRyaWM6ICdtYXhMaWZ0VG9EcmFnJyxcbiAgICAgICAgYWx0aXR1ZGVNZXRlcnM6IDAsXG4gICAgICAgIGFscGhhRGVnOiAyLFxuICAgICAgICByZWZlcmVuY2U6IDkuNjYsXG4gICAgICAgIHRvbGVyYW5jZTogMC4zLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2NydWlzZV9zcGVlZF9wYXBlcicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQ3J1aXNlIHRydWUgYWlyc3BlZWQgYXQgMzAsMDAwIGZ0JyxcbiAgICAgICAgc291cmNlOiAnUmVobWFuIFNlY3Rpb24gSUlJICg4NDYgZnQvcyknLFxuICAgICAgICBtZXRyaWM6ICdjcnVpc2VTcGVlZE1wcycsXG4gICAgICAgIGFsdGl0dWRlTWV0ZXJzOiBGMTZfUFJPRklMRS5jcnVpc2VBbHRpdHVkZU0sXG4gICAgICAgIHJlZmVyZW5jZTogRjE2X1BST0ZJTEUuY3J1aXNlU3BlZWRNcHMsXG4gICAgICAgIHRvbGVyYW5jZTogMC41LFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ3dpbmdfYXJlYScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnV2luZyByZWZlcmVuY2UgYXJlYSAoMzAwIGZ0wrIpJyxcbiAgICAgICAgc291cmNlOiAnSmFuZVxcJ3MgLyBSZWhtYW4gcGFwZXInLFxuICAgICAgICBtZXRyaWM6ICd3aW5nQXJlYU0yJyxcbiAgICAgICAgYWx0aXR1ZGVNZXRlcnM6IDAsXG4gICAgICAgIHJlZmVyZW5jZTogMjcuODcsXG4gICAgICAgIHRvbGVyYW5jZTogMC4wNSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6ICdhYl90aHJ1c3Rfc2wnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0Z1bGwgYWZ0ZXJidXJuZXIgdGhydXN0IGF0IHNlYSBsZXZlbCcsXG4gICAgICAgIHNvdXJjZTogJ0YxMDAtUFctMjI5ICgxMjkuNCBrTiknLFxuICAgICAgICBtZXRyaWM6ICdhYlRocnVzdEtuJyxcbiAgICAgICAgYWx0aXR1ZGVNZXRlcnM6IDAsXG4gICAgICAgIHJlZmVyZW5jZTogMTI5LjQsXG4gICAgICAgIHRvbGVyYW5jZTogMi4wLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ21heF9tYWNoX2ZsNDAwJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdNYXhpbXVtIE1hY2ggYXQgNDAsMDAwIGZ0IChBQiwgdGhydXN04oCTZHJhZyBiYWxhbmNlKScsXG4gICAgICAgIHNvdXJjZTogJ1NpbSBlbnZlbG9wZSB3aXRoIEFuZGVyc29uIHBvbGFyICsgdHJhbnNvbmljIGRyYWcnLFxuICAgICAgICBtZXRyaWM6ICdtYXhNYWNoJyxcbiAgICAgICAgYWx0aXR1ZGVNZXRlcnM6IDEyMTkyLFxuICAgICAgICByZWZlcmVuY2U6IDEuODksXG4gICAgICAgIHRvbGVyYW5jZTogMC4xMixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6ICdwZWFrX3NwZWVkX2FsdGl0dWRlJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdBbHRpdHVkZSBvZiBwZWFrIGxldmVsLWZsaWdodCBtYXggc3BlZWQnLFxuICAgICAgICBzb3VyY2U6ICdTaW0gZW52ZWxvcGUgKElTQSB0aHJ1c3QgbGFwc2UpJyxcbiAgICAgICAgbWV0cmljOiAncGVha01heFNwZWVkQWx0aXR1ZGVNJyxcbiAgICAgICAgYWx0aXR1ZGVNZXRlcnM6IDAsXG4gICAgICAgIHJlZmVyZW5jZTogMTEwMDAsXG4gICAgICAgIHRvbGVyYW5jZTogNTAwLFxuICAgIH0sXG5dO1xuXG5leHBvcnQgY29uc3QgTVBTX1RPX0tUUyA9IDEuOTQzODQ7XG4iLCJpbXBvcnQgeyBjbGFtcCB9IGZyb20gJy4uL3V0aWxzL21hdGgnO1xuXG4vKiogRkJXIHJvbGwtYXhpcyBlbnZlbG9wZSAoQ2F0IEkgY2xlYW4pLiBDYXQgSUlJIGxvd2VycyBtYXggcmF0ZSBmb3IgaGVhdnkgc3RvcmVzLiAqL1xuZXhwb3J0IGludGVyZmFjZSBGMTZSb2xsQ29udHJvbENvbmZpZyB7XG4gICAgbWF4Um9sbFJhdGVEZWdTOiBudW1iZXI7XG4gICAgYWN0dWF0b3JUYXVTOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjb25zdCBGMTZfUk9MTF9DQVQxOiBGMTZSb2xsQ29udHJvbENvbmZpZyA9IHtcbiAgICBtYXhSb2xsUmF0ZURlZ1M6IDMwMCxcbiAgICBhY3R1YXRvclRhdVM6IDAuMDc1LFxufTtcblxuZXhwb3J0IGNvbnN0IEYxNl9ST0xMX0NBVDM6IEYxNlJvbGxDb250cm9sQ29uZmlnID0ge1xuICAgIG1heFJvbGxSYXRlRGVnUzogMTgwLFxuICAgIGFjdHVhdG9yVGF1UzogMC4wOSxcbn07XG5cbmNvbnN0IERFR19UT19SQUQgPSBNYXRoLlBJIC8gMTgwO1xuXG5jb25zdCBNSU5fUV9HQUlOID0gMC4xMjtcbmNvbnN0IE1BWF9RX0dBSU4gPSAxLjA7XG5cbmV4cG9ydCBmdW5jdGlvbiBtYXhSb2xsUmF0ZVJhZChjb25maWc6IEYxNlJvbGxDb250cm9sQ29uZmlnKTogbnVtYmVyIHtcbiAgICByZXR1cm4gY29uZmlnLm1heFJvbGxSYXRlRGVnUyAqIERFR19UT19SQUQ7XG59XG5cbi8qKiBHYWluIGZhbGxzIGFzIGR5bmFtaWMgcHJlc3N1cmUgcmlzZXMg4oCUIEZCVyBsaW1pdHMgY29tbWFuZCB0byBwcm90ZWN0IHN0cnVjdHVyZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlRjE2Um9sbER5bmFtaWNQcmVzc3VyZUdhaW4oZHluYW1pY1ByZXNzdXJlOiBudW1iZXIsIHFSZWY6IG51bWJlcik6IG51bWJlciB7XG4gICAgY29uc3QgcSA9IE1hdGgubWF4KGR5bmFtaWNQcmVzc3VyZSwgMSk7XG4gICAgY29uc3QgcmVmID0gTWF0aC5tYXgocVJlZiwgMSk7XG4gICAgY29uc3QgcmF3ID0gTUlOX1FfR0FJTiArIChNQVhfUV9HQUlOIC0gTUlOX1FfR0FJTikgKiBNYXRoLnNxcnQocmVmIC8gKHJlZiArIHEpKTtcbiAgICByZXR1cm4gY2xhbXAocmF3LCBNSU5fUV9HQUlOLCBNQVhfUV9HQUlOKTtcbn1cblxuZnVuY3Rpb24gbWFjaFJvbGxMaW1pdGVyKG1hY2g6IG51bWJlcik6IG51bWJlciB7XG4gICAgaWYgKG1hY2ggPD0gMC44NSkge1xuICAgICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgcmV0dXJuIGNsYW1wKDEgLSAobWFjaCAtIDAuODUpIC8gMC41NSwgMC4zNSwgMSk7XG59XG5cbmZ1bmN0aW9uIGFsdGl0dWRlUm9sbExpbWl0ZXIoYWx0aXR1ZGVNOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGlmIChhbHRpdHVkZU0gPD0gMTIwMDApIHtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICAgIHJldHVybiBjbGFtcCgxIC0gKGFsdGl0dWRlTSAtIDEyMDAwKSAvIDIwMDAwLCAwLjQ1LCAxKTtcbn1cblxuZnVuY3Rpb24gYW9hUm9sbExpbWl0ZXIoYW9hUmFkOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IGFvYURlZyA9IE1hdGguYWJzKGFvYVJhZCkgKiAoMTgwIC8gTWF0aC5QSSk7XG4gICAgaWYgKGFvYURlZyA8PSAxNSkge1xuICAgICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgcmV0dXJuIGNsYW1wKDEgLSAoYW9hRGVnIC0gMTUpIC8gMjIsIDAuMTUsIDEpO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEYxNlJvbGxDb21tYW5kSW5wdXRzIHtcbiAgICBzdGljazogbnVtYmVyO1xuICAgIGR5bmFtaWNQcmVzc3VyZTogbnVtYmVyO1xuICAgIHFSZWY6IG51bWJlcjtcbiAgICBtYWNoOiBudW1iZXI7XG4gICAgYWx0aXR1ZGVNOiBudW1iZXI7XG4gICAgYW9hUmFkOiBudW1iZXI7XG4gICAgZmxhcHNFeHRlbmRlZDogYm9vbGVhbjtcbiAgICBsYW5kZWQ6IGJvb2xlYW47XG4gICAgY29uZmlnOiBGMTZSb2xsQ29udHJvbENvbmZpZztcbn1cblxuLyoqIFN0aWNrIFstMSwgMV0g4oaSIGNvbW1hbmRlZCBib2R5IHJvbGwgcmF0ZSBwX2NtZCAocmFkL3MpLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVGMTZDb21tYW5kZWRSb2xsUmF0ZShpbnB1dHM6IEYxNlJvbGxDb21tYW5kSW5wdXRzKTogbnVtYmVyIHtcbiAgICBpZiAoaW5wdXRzLmxhbmRlZCB8fCBNYXRoLmFicyhpbnB1dHMuc3RpY2spIDwgMWUtNikge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICBjb25zdCBmbGFwRmFjdG9yID0gaW5wdXRzLmZsYXBzRXh0ZW5kZWQgPyAwLjY1IDogMTtcbiAgICBjb25zdCBsaW1pdGVyID0gbWFjaFJvbGxMaW1pdGVyKGlucHV0cy5tYWNoKVxuICAgICAgICAqIGFsdGl0dWRlUm9sbExpbWl0ZXIoaW5wdXRzLmFsdGl0dWRlTSlcbiAgICAgICAgKiBhb2FSb2xsTGltaXRlcihpbnB1dHMuYW9hUmFkKVxuICAgICAgICAqIGZsYXBGYWN0b3I7XG5cbiAgICBjb25zdCBxR2FpbiA9IGNvbXB1dGVGMTZSb2xsRHluYW1pY1ByZXNzdXJlR2FpbihpbnB1dHMuZHluYW1pY1ByZXNzdXJlLCBpbnB1dHMucVJlZik7XG4gICAgcmV0dXJuIGlucHV0cy5zdGljayAqIG1heFJvbGxSYXRlUmFkKGlucHV0cy5jb25maWcpICogcUdhaW4gKiBsaW1pdGVyO1xufVxuXG4vKiogRmlyc3Qtb3JkZXIgZmxhcGVyb24vYWN0dWF0b3IgbGFnIHRvd2FyZCBjb21tYW5kZWQgcmF0ZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdGVwRjE2Qm9keVJvbGxSYXRlKFxuICAgIGJvZHlSb2xsUmF0ZVJhZDogbnVtYmVyLFxuICAgIGNvbW1hbmRlZFJhdGVSYWQ6IG51bWJlcixcbiAgICBkZWx0YTogbnVtYmVyLFxuICAgIGNvbmZpZzogRjE2Um9sbENvbnRyb2xDb25maWcsXG4pOiBudW1iZXIge1xuICAgIGlmIChkZWx0YSA8PSAwKSB7XG4gICAgICAgIHJldHVybiBib2R5Um9sbFJhdGVSYWQ7XG4gICAgfVxuICAgIGNvbnN0IGFscGhhID0gMSAtIE1hdGguZXhwKC1kZWx0YSAvIE1hdGgubWF4KGNvbmZpZy5hY3R1YXRvclRhdVMsIDFlLTMpKTtcbiAgICByZXR1cm4gYm9keVJvbGxSYXRlUmFkICsgKGNvbW1hbmRlZFJhdGVSYWQgLSBib2R5Um9sbFJhdGVSYWQpICogYWxwaGE7XG59XG5cbi8qKiBIaWdoLUFvQSByb2xs4oCTeWF3IGNvdXBsaW5nOiBhdXRvIHJ1ZGRlciB0byBjb29yZGluYXRlIGFuZCBsaW1pdCBzaWRlc2xpcCBidWlsZHVwLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVGMTZSb2xsWWF3Q291cGxpbmcoYm9keVJvbGxSYXRlUmFkOiBudW1iZXIsIGFvYVJhZDogbnVtYmVyLCBtYXhSb2xsUmF0ZVJhZDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBjb25zdCBhb2FGYWN0b3IgPSBjbGFtcCgoTWF0aC5hYnMoYW9hUmFkKSAtIDAuMTIpIC8gMC40LCAwLCAxKTtcbiAgICBpZiAoYW9hRmFjdG9yIDw9IDAgfHwgbWF4Um9sbFJhdGVSYWQgPD0gMCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgY29uc3Qgbm9ybWFsaXplZFJvbGwgPSBjbGFtcChib2R5Um9sbFJhdGVSYWQgLyBtYXhSb2xsUmF0ZVJhZCwgLTEsIDEpO1xuICAgIHJldHVybiBub3JtYWxpemVkUm9sbCAqIDAuNCAqIGFvYUZhY3Rvcjtcbn1cbiIsIi8qKlxuICogQSBzaW5nbGUgcmlnaWQgYWVyb2R5bmFtaWMgc3VyZmFjZSBmb3IgdGhlIEZNMiBwYXJ0cyBtb2RlbC5cbiAqXG4gKiBHaXZlbiB0aGUgYWlyY3JhZnQncyBib2R5LWZyYW1lIGxpbmVhciB2ZWxvY2l0eSwgYm9keSBhbmd1bGFyIHZlbG9jaXR5IGFuZFxuICogdGhlIGxvY2FsIGFpciBkZW5zaXR5LCB0aGUgc3VyZmFjZSBjb21wdXRlcyB0aGUgbGlmdCArIGRyYWcgZm9yY2UgaXQgcHJvZHVjZXNcbiAqIGFuZCB0aGUgbW9tZW50IHRoYXQgZm9yY2UgZXhlcnRzIGFib3V0IHRoZSBDRy4gVGhlIGtleSBkZXRhaWwgdGhhdCBtYWtlcyB0aGVcbiAqIHdob2xlIG1vZGVsIGJlaGF2ZSBpcyB0aGF0IHRoZSBhaXJmbG93IHNlZW4gYnkgdGhlIHN1cmZhY2UgaW5jbHVkZXMgdGhlXG4gKiB2ZWxvY2l0eSBjb250cmlidXRlZCBieSByb3RhdGlvbiBhdCBpdHMgb3duIGxvY2F0aW9uOlxuICpcbiAqICAgICB1X2xvY2FsID0gdl9ib2R5ICsgz4kgw5cgclxuICpcbiAqIEEgcGl0Y2ggcmF0ZSB0aGVyZWZvcmUgcmFpc2VzIHRoZSBBb0Egb2YgdGhlIHRhaWwsIGEgcm9sbCByYXRlIHJhaXNlcyB0aGUgQW9BXG4gKiBvZiB0aGUgZG93bi1nb2luZyB3aW5nLCBhbmQgYSB5YXcgcmF0ZSBsb2FkcyB0aGUgZmluIOKAlCBpLmUuIHBpdGNoLCByb2xsIGFuZFxuICogeWF3IGFlcm9keW5hbWljIGRhbXBpbmcgYWxsIGFwcGVhciBhdXRvbWF0aWNhbGx5IGZyb20gdGhlIGdlb21ldHJ5LlxuICovXG5pbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgeyBTdXJmYWNlR2VvbWV0cnkgfSBmcm9tICcuL2YxNkZtMkNvbmZpZyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3VyZmFjZUlucHV0IHtcbiAgICAvKiogQm9keS1mcmFtZSB2ZWxvY2l0eSBvZiB0aGUgQ0cgdGhyb3VnaCB0aGUgYWlyIChtL3MpLiAqL1xuICAgIHZlbG9jaXR5Qm9keTogVEhSRUUuVmVjdG9yMztcbiAgICAvKiogQm9keS1mcmFtZSBhbmd1bGFyIHZlbG9jaXR5IChyYWQvcykuICovXG4gICAgYW5ndWxhclZlbG9jaXR5Qm9keTogVEhSRUUuVmVjdG9yMztcbiAgICAvKiogQWlyIGRlbnNpdHkgKGtnL23CsykuICovXG4gICAgYWlyRGVuc2l0eTogbnVtYmVyO1xuICAgIC8qKiBFZmZlY3RpdmUgaW5jaWRlbmNlIGFkZGVkIGJ5IGNvbnRyb2wgZGVmbGVjdGlvbiAocmFkKS4gKi9cbiAgICBjb250cm9sRGVsdGFBb2FSYWQ6IG51bWJlcjtcbiAgICAvKiogU3ltbWV0cmljIGNhbWJlciBiaWFzLCBlLmcuIGZsYXBzIChyYWQpLiAqL1xuICAgIGNhbWJlckJpYXNSYWQ6IG51bWJlcjtcbiAgICAvKiogUmVkdWN0aW9uIG9mIHRoZSBzdGFsbCBBb0EsIGUuZy4gZnJvbSBmbGFwcyAocmFkKS4gKi9cbiAgICBzdGFsbFNoaWZ0UmFkOiBudW1iZXI7XG4gICAgLyoqIEFkZGl0aW9uYWwgcHJvZmlsZSBkcmFnIGNvZWZmaWNpZW50IChyZWZlcmVuY2VkIHRvIHRoaXMgc3VyZmFjZSdzIGFyZWEpLiAqL1xuICAgIGV4dHJhQ2Q6IG51bWJlcjtcbn1cblxuZXhwb3J0IGNsYXNzIEFlcm9TdXJmYWNlIHtcbiAgICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSByZWFkb25seSBnZW9tOiBTdXJmYWNlR2VvbWV0cnk7XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IHBvc2l0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IHVwID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGZvcndhcmQgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgc3BhbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IF91ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9yb3QgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgX2RyYWdEaXIgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgX2xpZnREaXIgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG4gICAgLyoqIExhc3QgY29tcHV0ZWQgYW5nbGUgb2YgYXR0YWNrIGZvciB0aGlzIHN1cmZhY2UgKHJhZCk7IHVzZWZ1bCB0ZWxlbWV0cnkuICovXG4gICAgbGFzdEFvYVJhZCA9IDA7XG5cbiAgICBjb25zdHJ1Y3RvcihnZW9tOiBTdXJmYWNlR2VvbWV0cnkpIHtcbiAgICAgICAgdGhpcy5nZW9tID0gZ2VvbTtcbiAgICAgICAgdGhpcy5uYW1lID0gZ2VvbS5uYW1lO1xuICAgICAgICB0aGlzLnBvc2l0aW9uLmZyb21BcnJheShnZW9tLnBvc2l0aW9uKTtcbiAgICAgICAgdGhpcy51cC5mcm9tQXJyYXkoZ2VvbS51cCkubm9ybWFsaXplKCk7XG4gICAgICAgIHRoaXMuZm9yd2FyZC5mcm9tQXJyYXkoZ2VvbS5mb3J3YXJkKS5ub3JtYWxpemUoKTtcbiAgICAgICAgLy8gU3Bhbndpc2UgYXhpcyAodGhlIGRpcmVjdGlvbiB3ZSBpZ25vcmUgd2hlbiBtZWFzdXJpbmcgQW9BKS5cbiAgICAgICAgdGhpcy5zcGFuLmNvcHkodGhpcy51cCkuY3Jvc3ModGhpcy5mb3J3YXJkKS5ub3JtYWxpemUoKTtcbiAgICB9XG5cbiAgICBnZXQgcG9zaXRpb25Cb2R5KCk6IFRIUkVFLlZlY3RvcjMge1xuICAgICAgICByZXR1cm4gdGhpcy5wb3NpdGlvbjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBY2N1bXVsYXRlIHRoaXMgc3VyZmFjZSdzIGFlcm9keW5hbWljIGZvcmNlIGFuZCBtb21lbnQuXG4gICAgICogQHBhcmFtIGlucHV0ICAgICAgRmxpZ2h0IGNvbmRpdGlvbiBhbmQgY29udHJvbCBzdGF0ZS5cbiAgICAgKiBAcGFyYW0gb3V0Rm9yY2UgICBCb2R5LWZyYW1lIGZvcmNlIGFjY3VtdWxhdG9yIChOKSDigJQgYWRkZWQgdG8uXG4gICAgICogQHBhcmFtIG91dE1vbWVudCAgQm9keS1mcmFtZSBtb21lbnQtYWJvdXQtQ0cgYWNjdW11bGF0b3IgKE7Ct20pIOKAlCBhZGRlZCB0by5cbiAgICAgKi9cbiAgICBhY2N1bXVsYXRlKGlucHV0OiBTdXJmYWNlSW5wdXQsIG91dEZvcmNlOiBUSFJFRS5WZWN0b3IzLCBvdXRNb21lbnQ6IFRIUkVFLlZlY3RvcjMpOiB2b2lkIHtcbiAgICAgICAgLy8gTG9jYWwgdmVsb2NpdHkgdGhyb3VnaCB0aGUgYWlyIGF0IHRoZSBzdXJmYWNlOiB2ICsgz4kgw5cgci5cbiAgICAgICAgdGhpcy5fcm90LmNyb3NzVmVjdG9ycyhpbnB1dC5hbmd1bGFyVmVsb2NpdHlCb2R5LCB0aGlzLnBvc2l0aW9uKTtcbiAgICAgICAgdGhpcy5fdS5jb3B5KGlucHV0LnZlbG9jaXR5Qm9keSkuYWRkKHRoaXMuX3JvdCk7XG5cbiAgICAgICAgLy8gUmVtb3ZlIHRoZSBzcGFud2lzZSBjb21wb25lbnQgKHRoYXQgZmxvdyBkb2VzIG5vdCBtYWtlIGxpZnQgaGVyZSkuXG4gICAgICAgIGNvbnN0IHNwYW5Db21wID0gdGhpcy5fdS5kb3QodGhpcy5zcGFuKTtcbiAgICAgICAgdGhpcy5fdS5hZGRTY2FsZWRWZWN0b3IodGhpcy5zcGFuLCAtc3BhbkNvbXApO1xuXG4gICAgICAgIGNvbnN0IHNwZWVkU3EgPSB0aGlzLl91Lmxlbmd0aFNxKCk7XG4gICAgICAgIGlmIChzcGVlZFNxIDwgMWUtNCkge1xuICAgICAgICAgICAgdGhpcy5sYXN0QW9hUmFkID0gMDtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzcGVlZCA9IE1hdGguc3FydChzcGVlZFNxKTtcblxuICAgICAgICBjb25zdCB1ZiA9IHRoaXMuX3UuZG90KHRoaXMuZm9yd2FyZCk7XG4gICAgICAgIGNvbnN0IHV1ID0gdGhpcy5fdS5kb3QodGhpcy51cCk7XG4gICAgICAgIGNvbnN0IGFvYSA9IE1hdGguYXRhbjIoLXV1LCB1Zik7XG4gICAgICAgIHRoaXMubGFzdEFvYVJhZCA9IGFvYTtcblxuICAgICAgICBjb25zdCBlZmZlY3RpdmVBb2EgPSBhb2EgKyBpbnB1dC5jb250cm9sRGVsdGFBb2FSYWQgKyBpbnB1dC5jYW1iZXJCaWFzUmFkO1xuICAgICAgICBjb25zdCBzdGFsbCA9IHRoaXMuZ2VvbS5zdGFsbEFvYVJhZCAtIGlucHV0LnN0YWxsU2hpZnRSYWQ7XG4gICAgICAgIGNvbnN0IGNsID0gbGlmdENvZWZmaWNpZW50KGVmZmVjdGl2ZUFvYSwgdGhpcy5nZW9tLmxpZnRTbG9wZVBlclJhZCwgc3RhbGwpO1xuICAgICAgICBjb25zdCBzZXBhcmF0ZWQgPSBNYXRoLnNpbihlZmZlY3RpdmVBb2EpO1xuICAgICAgICBjb25zdCBjZCA9IHRoaXMuZ2VvbS5jZDAgKyBpbnB1dC5leHRyYUNkXG4gICAgICAgICAgICArIHRoaXMuZ2VvbS5pbmR1Y2VkSyAqIGNsICogY2xcbiAgICAgICAgICAgICsgMS4wICogc2VwYXJhdGVkICogc2VwYXJhdGVkO1xuXG4gICAgICAgIC8vIERyYWcgYWN0cyBkb3duc3RyZWFtIChkaXJlY3Rpb24gdGhlIGFpciBpcyBtb3ZpbmcgcmVsYXRpdmUgdG8gc3VyZmFjZSkuXG4gICAgICAgIHRoaXMuX2RyYWdEaXIuY29weSh0aGlzLl91KS5tdWx0aXBseVNjYWxhcigtMSAvIHNwZWVkKTtcbiAgICAgICAgLy8gTGlmdCBpcyBwZXJwZW5kaWN1bGFyIHRvIHRoZSByZWxhdGl2ZSB3aW5kLCBpbiB0aGUgc3VyZmFjZSdzIGxpZnQgcGxhbmUuXG4gICAgICAgIHRoaXMuX2xpZnREaXIuY3Jvc3NWZWN0b3JzKHRoaXMuc3BhbiwgdGhpcy5fZHJhZ0Rpcikubm9ybWFsaXplKCk7XG5cbiAgICAgICAgY29uc3QgcSA9IDAuNSAqIGlucHV0LmFpckRlbnNpdHkgKiBzcGVlZFNxO1xuICAgICAgICBjb25zdCBhcmVhID0gdGhpcy5nZW9tLmFyZWFNMjtcbiAgICAgICAgY29uc3QgbGlmdCA9IHEgKiBhcmVhICogY2w7XG4gICAgICAgIGNvbnN0IGRyYWcgPSBxICogYXJlYSAqIGNkO1xuXG4gICAgICAgIC8vIEZvcmNlIGNvbnRyaWJ1dGlvbi5cbiAgICAgICAgY29uc3QgZnggPSB0aGlzLl9saWZ0RGlyLnggKiBsaWZ0ICsgdGhpcy5fZHJhZ0Rpci54ICogZHJhZztcbiAgICAgICAgY29uc3QgZnkgPSB0aGlzLl9saWZ0RGlyLnkgKiBsaWZ0ICsgdGhpcy5fZHJhZ0Rpci55ICogZHJhZztcbiAgICAgICAgY29uc3QgZnogPSB0aGlzLl9saWZ0RGlyLnogKiBsaWZ0ICsgdGhpcy5fZHJhZ0Rpci56ICogZHJhZztcbiAgICAgICAgb3V0Rm9yY2UueCArPSBmeDtcbiAgICAgICAgb3V0Rm9yY2UueSArPSBmeTtcbiAgICAgICAgb3V0Rm9yY2UueiArPSBmejtcblxuICAgICAgICAvLyBNb21lbnQgYWJvdXQgQ0c6IHIgw5cgRi5cbiAgICAgICAgY29uc3QgcnggPSB0aGlzLnBvc2l0aW9uLngsIHJ5ID0gdGhpcy5wb3NpdGlvbi55LCByeiA9IHRoaXMucG9zaXRpb24uejtcbiAgICAgICAgb3V0TW9tZW50LnggKz0gcnkgKiBmeiAtIHJ6ICogZnk7XG4gICAgICAgIG91dE1vbWVudC55ICs9IHJ6ICogZnggLSByeCAqIGZ6O1xuICAgICAgICBvdXRNb21lbnQueiArPSByeCAqIGZ5IC0gcnkgKiBmeDtcbiAgICB9XG59XG5cbi8qKlxuICogTGlmdCBjb2VmZmljaWVudCB3aXRoIGEgbGluZWFyIHJhbmdlIGFuZCBhIHNtb290aCBwb3N0LXN0YWxsIGNvbGxhcHNlLlxuICogQmV5b25kIHRoZSBzdGFsbCBBb0EgdGhlIGNvZWZmaWNpZW50IGRlY2F5cyBsaWtlIGEgY29zaW5lIHNvIGxpZnQgZmFsbHMgb2ZmXG4gKiAoYW5kLCBjb21iaW5lZCB3aXRoIHRoZSBzZXBhcmF0ZWQtZmxvdyBkcmFnIHRlcm0sIHByb2R1Y2VzIGEgbm9zZSBkcm9wKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxpZnRDb2VmZmljaWVudChhb2FSYWQ6IG51bWJlciwgc2xvcGVQZXJSYWQ6IG51bWJlciwgc3RhbGxSYWQ6IG51bWJlcik6IG51bWJlciB7XG4gICAgY29uc3QgbWFnID0gTWF0aC5hYnMoYW9hUmFkKTtcbiAgICBjb25zdCBzaWduID0gTWF0aC5zaWduKGFvYVJhZCk7XG4gICAgaWYgKG1hZyA8PSBzdGFsbFJhZCkge1xuICAgICAgICByZXR1cm4gc2xvcGVQZXJSYWQgKiBhb2FSYWQ7XG4gICAgfVxuICAgIGNvbnN0IHBlYWsgPSBzbG9wZVBlclJhZCAqIHN0YWxsUmFkO1xuICAgIC8vIERlY2F5IHRvIH4wIG92ZXIgcm91Z2hseSB0aGUgbmV4dCAzNcKwLlxuICAgIGNvbnN0IGRlY2F5ID0gTWF0aC5jb3MoKG1hZyAtIHN0YWxsUmFkKSAqIDIuMik7XG4gICAgcmV0dXJuIHNpZ24gKiBwZWFrICogTWF0aC5tYXgoMCwgZGVjYXkpO1xufVxuIiwiLyoqXG4gKiBEaXJlY3QgKG1lY2hhbmljYWwpIGZsaWdodC1jb250cm9sIGxhd3MuXG4gKlxuICogVW5saWtlIHRoZSBGLTE2IGZseS1ieS13aXJlIHN5c3RlbSwgYSBjb252ZW50aW9uYWxseS1zdGFibGUgYWlyY3JhZnQgc3VjaCBhc1xuICogdGhlIEEtNEUgZmxpZXMgXCJjYWJsZXMgYW5kIHB1c2hyb2RzXCI6IHRoZSBzdGljayBtb3ZlcyB0aGUgc3VyZmFjZXMgbW9yZSBvclxuICogbGVzcyBkaXJlY3RseSwgYW5kIHRoZSBhaXJmcmFtZSdzIG93biBhZXJvZHluYW1pYyBzdGFiaWxpdHkgcHJvdmlkZXMgdGhlXG4gKiBoYW5kbGluZy4gVGhpcyBGQ1MgdGhlcmVmb3JlIG1hcHMgc3RpY2svcGVkYWwgc3RyYWlnaHQgdG8gc3VyZmFjZSBjb21tYW5kcyxcbiAqIHdpdGggb25seSBsaWdodCByYXRlIGRhbXBpbmcgYW5kIGEgd2FzaGVkLW91dCB5YXcgZGFtcGVyIHRvIHRha2UgdGhlIGVkZ2Ugb2ZmXG4gKiB0aGUgRHV0Y2ggcm9sbC4gVGhlcmUgaXMgbm8gZy1jb21tYW5kIGxvb3AsIEFvQSBsaW1pdGVyIG9yIHJvbGwtcmF0ZSBsb29wLlxuICovXG5pbXBvcnQgeyBjbGFtcCB9IGZyb20gJy4uLy4uL3V0aWxzL21hdGgnO1xuaW1wb3J0IHsgRm0yRGlyZWN0RmNzQ29uZmlnIH0gZnJvbSAnLi9mbTJBaXJjcmFmdENvbmZpZyc7XG5pbXBvcnQgeyBGY3MsIEZjc0lucHV0LCBGY3NPdXRwdXQgfSBmcm9tICcuL2Zjcyc7XG5cbmV4cG9ydCBjbGFzcyBEaXJlY3RGY3MgaW1wbGVtZW50cyBGY3Mge1xuICAgIHByaXZhdGUgZWxldmF0b3IgPSAwO1xuICAgIHByaXZhdGUgYWlsZXJvbiA9IDA7XG4gICAgcHJpdmF0ZSBydWRkZXIgPSAwO1xuICAgIHByaXZhdGUgeWF3UmF0ZUxvd1Bhc3MgPSAwO1xuXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBjZmc6IEZtMkRpcmVjdEZjc0NvbmZpZykgeyB9XG5cbiAgICByZXNldCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5lbGV2YXRvciA9IDA7XG4gICAgICAgIHRoaXMuYWlsZXJvbiA9IDA7XG4gICAgICAgIHRoaXMucnVkZGVyID0gMDtcbiAgICAgICAgdGhpcy55YXdSYXRlTG93UGFzcyA9IDA7XG4gICAgfVxuXG4gICAgZ2V0U3RhdGUoKTogRmNzT3V0cHV0IHtcbiAgICAgICAgcmV0dXJuIHsgZWxldmF0b3I6IHRoaXMuZWxldmF0b3IsIGFpbGVyb246IHRoaXMuYWlsZXJvbiwgcnVkZGVyOiB0aGlzLnJ1ZGRlciB9O1xuICAgIH1cblxuICAgIHVwZGF0ZShpbnB1dDogRmNzSW5wdXQsIGR0OiBudW1iZXIpOiBGY3NPdXRwdXQge1xuICAgICAgICAvLyBFbGV2YXRvcjogc3RpY2sgc3RyYWlnaHQgdGhyb3VnaCwgd2l0aCBhIHRvdWNoIG9mIHBpdGNoLXJhdGUgZGFtcGluZy5cbiAgICAgICAgLy8gcGl0Y2hSYXRlIGFib3V0ICtYIGlzIG5vc2UtZG93bi1wb3NpdGl2ZSwgc28gK3BpdGNoUmF0ZSBvcHBvc2VzIGFcbiAgICAgICAgLy8gbm9zZS11cCAocG9zaXRpdmUpIGVsZXZhdG9yIGNvbW1hbmQuXG4gICAgICAgIGNvbnN0IGVsZXZhdG9yVGFyZ2V0ID0gY2xhbXAoXG4gICAgICAgICAgICBpbnB1dC5waXRjaFN0aWNrICsgdGhpcy5jZmcucGl0Y2hSYXRlRGFtcCAqIGlucHV0LnBpdGNoUmF0ZSwgLTEsIDEpO1xuXG4gICAgICAgIC8vIEFpbGVyb246IHN0aWNrIHN0cmFpZ2h0IHRocm91Z2gsIHdpdGggcm9sbC1yYXRlIGRhbXBpbmcuXG4gICAgICAgIGNvbnN0IGFpbGVyb25UYXJnZXQgPSBjbGFtcChcbiAgICAgICAgICAgIGlucHV0LnJvbGxTdGljayAtIHRoaXMuY2ZnLnJvbGxSYXRlRGFtcCAqIGlucHV0LnJvbGxSYXRlLCAtMSwgMSk7XG5cbiAgICAgICAgLy8gUnVkZGVyOiBwZWRhbCArIHdhc2hlZC1vdXQgeWF3IGRhbXBlciArIGFpbGVyb24tcnVkZGVyIGludGVyY29ubmVjdC5cbiAgICAgICAgY29uc3QgdGF1ID0gTWF0aC5tYXgodGhpcy5jZmcueWF3RGFtcGVyV2FzaG91dFRhdVMsIDFlLTMpO1xuICAgICAgICBjb25zdCBhdyA9IGR0IDw9IDAgPyAxIDogMSAtIE1hdGguZXhwKC1kdCAvIHRhdSk7XG4gICAgICAgIHRoaXMueWF3UmF0ZUxvd1Bhc3MgKz0gKGlucHV0Lnlhd1JhdGUgLSB0aGlzLnlhd1JhdGVMb3dQYXNzKSAqIGF3O1xuICAgICAgICBjb25zdCB5YXdSYXRlSGlnaFBhc3MgPSBpbnB1dC55YXdSYXRlIC0gdGhpcy55YXdSYXRlTG93UGFzcztcbiAgICAgICAgY29uc3QgcnVkZGVyVGFyZ2V0ID0gY2xhbXAoXG4gICAgICAgICAgICBpbnB1dC55YXdQZWRhbFxuICAgICAgICAgICAgLSB0aGlzLmNmZy55YXdEYW1wZXJHYWluICogeWF3UmF0ZUhpZ2hQYXNzXG4gICAgICAgICAgICArIHRoaXMuY2ZnLmFyaUdhaW4gKiBhaWxlcm9uVGFyZ2V0LFxuICAgICAgICAgICAgLTEsIDEpO1xuXG4gICAgICAgIC8vIEZpcnN0LW9yZGVyIGFjdHVhdG9yIGxhZyB0b3dhcmQgdGhlIGNvbW1hbmRlZCBkZWZsZWN0aW9uLlxuICAgICAgICBjb25zdCBhID0gZHQgPD0gMCA/IDEgOiAxIC0gTWF0aC5leHAoLWR0IC8gTWF0aC5tYXgodGhpcy5jZmcuYWN0dWF0b3JUYXVTLCAxZS0zKSk7XG4gICAgICAgIHRoaXMuZWxldmF0b3IgKz0gKGVsZXZhdG9yVGFyZ2V0IC0gdGhpcy5lbGV2YXRvcikgKiBhO1xuICAgICAgICB0aGlzLmFpbGVyb24gKz0gKGFpbGVyb25UYXJnZXQgLSB0aGlzLmFpbGVyb24pICogYTtcbiAgICAgICAgdGhpcy5ydWRkZXIgKz0gKHJ1ZGRlclRhcmdldCAtIHRoaXMucnVkZGVyKSAqIGE7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0U3RhdGUoKTtcbiAgICB9XG59XG4iLCIvKipcbiAqIEZNMiBmbHktYnktd2lyZSAvIHN0YWJpbGl0eS1hdWdtZW50YXRpb24gY29udHJvbCBsYXdzLlxuICpcbiAqIFRoZSBiYXJlIEYtMTYgYWlyZnJhbWUgaXMgKGJ5IGRlc2lnbikgY2xvc2UgdG8gbmV1dHJhbGx5L25lZ2F0aXZlbHkgc3RhYmxlIGFuZFxuICogaXMgb25seSBmbHlhYmxlIHRocm91Z2ggaXRzIEZCVyBzeXN0ZW0uIFRoaXMgbW9kdWxlIG1hcHMgdGhlIHBpbG90J3Mgc3RpY2sgYW5kXG4gKiBwZWRhbCBpbnB1dHMgaW50byBjb250cm9sLXN1cmZhY2UgY29tbWFuZHMgYW5kIGNsb3NlcyByYXRlL2cgbG9vcHMgYXJvdW5kIHRoZVxuICogYWlyZnJhbWUgc28gdGhhdCB0aGUgaGFuZGxpbmcgcXVhbGl0aWVzIOKAlCBub3QgdGhlIHJhdyBhZXJvZHluYW1pY3Mg4oCUIGRlZmluZSB0aGVcbiAqIGZlZWw6XG4gKiAgIC0gUGl0Y2g6IGEgZy1jb21tYW5kIGxhdyB3aXRoIHBpdGNoLXJhdGUgZGFtcGluZywgYW4gYW5nbGUtb2YtYXR0YWNrIGxpbWl0ZXJcbiAqICAgICBhbmQgdGhlIHN0cnVjdHVyYWwgZyBlbnZlbG9wZS5cbiAqICAgLSBSb2xsOiBhIHJvbGwtcmF0ZSBjb21tYW5kIChjYXBwZWQgbmVhciB+MzAwwrAvcywgZmFkZWQgYnkgZHluYW1pYyBwcmVzc3VyZSxcbiAqICAgICBNYWNoLCBhbHRpdHVkZSBhbmQgQW9BKSBkcml2aW5nIGFpbGVyb25zIHBsdXMgYSBkaWZmZXJlbnRpYWwgc3RhYmlsYXRvci5cbiAqICAgLSBZYXc6IGEgd2FzaGVkLW91dCB5YXctcmF0ZSBkYW1wZXIgcGx1cyBhbiBhaWxlcm9uLXJ1ZGRlciBpbnRlcmNvbm5lY3QgZm9yXG4gKiAgICAgdHVybiBjb29yZGluYXRpb24sIHdpdGggZGlyZWN0IHBlZGFsIGF1dGhvcml0eSBvbiB0b3AuXG4gKlxuICogT3V0cHV0cyBhcmUgbm9ybWFsaXplZCBjb21tYW5kcyBpbiBbLTEsIDFdOyB0aGUgZmxpZ2h0IG1vZGVsIGNvbnZlcnRzIHRoZW0gaW50b1xuICogcGh5c2ljYWwgc3VyZmFjZSBpbmNpZGVuY2UgZm9yIHRoZSBhZXJvIHBhcnRzLiBGaXJzdC1vcmRlciBhY3R1YXRvciBsYWcgaXNcbiAqIGFwcGxpZWQgc28gc3VyZmFjZXMgY2Fubm90IHNuYXAgaW5zdGFudGFuZW91c2x5LlxuICovXG5pbXBvcnQgeyBjbGFtcCB9IGZyb20gJy4uLy4uL3V0aWxzL21hdGgnO1xuaW1wb3J0IHsgY29tcHV0ZU1hY2hOdW1iZXIgfSBmcm9tICcuLi9hZXJvVXRpbHMnO1xuaW1wb3J0IHsgY29tcHV0ZUYxNkNvbW1hbmRlZFJvbGxSYXRlLCBGMTZfUk9MTF9DQVQxIH0gZnJvbSAnLi4vZjE2Um9sbENvbnRyb2wnO1xuaW1wb3J0IHsgRk0yX0ZDUyB9IGZyb20gJy4vZjE2Rm0yQ29uZmlnJztcbmltcG9ydCB7IEZjcywgRmNzSW5wdXQsIEZjc091dHB1dCB9IGZyb20gJy4vZmNzJztcblxuY29uc3QgREVHID0gTWF0aC5QSSAvIDE4MDtcblxuZXhwb3J0IHR5cGUgeyBGY3NJbnB1dCwgRmNzT3V0cHV0IH07XG5cbmV4cG9ydCBjbGFzcyBGMTZGY3MgaW1wbGVtZW50cyBGY3Mge1xuICAgIHByaXZhdGUgZWxldmF0b3IgPSAwO1xuICAgIHByaXZhdGUgYWlsZXJvbiA9IDA7XG4gICAgcHJpdmF0ZSBydWRkZXIgPSAwO1xuICAgIHByaXZhdGUgeWF3UmF0ZUxvd1Bhc3MgPSAwO1xuICAgIHByaXZhdGUgcGl0Y2hJbnRlZ3JhbCA9IDA7XG4gICAgcHJpdmF0ZSBwcmV2QW9hID0gMDtcbiAgICBwcml2YXRlIGFvYVJhdGVGaWx0ID0gMDtcbiAgICBwcml2YXRlIHByZXZBb2FWYWxpZCA9IGZhbHNlO1xuXG4gICAgcmVzZXQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuZWxldmF0b3IgPSAwO1xuICAgICAgICB0aGlzLmFpbGVyb24gPSAwO1xuICAgICAgICB0aGlzLnJ1ZGRlciA9IDA7XG4gICAgICAgIHRoaXMueWF3UmF0ZUxvd1Bhc3MgPSAwO1xuICAgICAgICB0aGlzLnBpdGNoSW50ZWdyYWwgPSAwO1xuICAgICAgICB0aGlzLnByZXZBb2EgPSAwO1xuICAgICAgICB0aGlzLmFvYVJhdGVGaWx0ID0gMDtcbiAgICAgICAgdGhpcy5wcmV2QW9hVmFsaWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBnZXRTdGF0ZSgpOiBGY3NPdXRwdXQge1xuICAgICAgICByZXR1cm4geyBlbGV2YXRvcjogdGhpcy5lbGV2YXRvciwgYWlsZXJvbjogdGhpcy5haWxlcm9uLCBydWRkZXI6IHRoaXMucnVkZGVyIH07XG4gICAgfVxuXG4gICAgdXBkYXRlKGlucHV0OiBGY3NJbnB1dCwgZHQ6IG51bWJlcik6IEZjc091dHB1dCB7XG4gICAgICAgIGNvbnN0IGVsZXZhdG9yVGFyZ2V0ID0gdGhpcy5waXRjaExhdyhpbnB1dCwgZHQpO1xuICAgICAgICBjb25zdCBhaWxlcm9uVGFyZ2V0ID0gdGhpcy5yb2xsTGF3KGlucHV0KTtcbiAgICAgICAgY29uc3QgcnVkZGVyVGFyZ2V0ID0gdGhpcy55YXdMYXcoaW5wdXQsIGFpbGVyb25UYXJnZXQsIGR0KTtcblxuICAgICAgICAvLyBGaXJzdC1vcmRlciBhY3R1YXRvciBsYWcgdG93YXJkIHRoZSBjb21tYW5kZWQgZGVmbGVjdGlvbi5cbiAgICAgICAgY29uc3QgYSA9IGR0IDw9IDAgPyAxIDogMSAtIE1hdGguZXhwKC1kdCAvIE1hdGgubWF4KEZNMl9GQ1MuYWN0dWF0b3JUYXVTLCAxZS0zKSk7XG4gICAgICAgIHRoaXMuZWxldmF0b3IgKz0gKGVsZXZhdG9yVGFyZ2V0IC0gdGhpcy5lbGV2YXRvcikgKiBhO1xuICAgICAgICB0aGlzLmFpbGVyb24gKz0gKGFpbGVyb25UYXJnZXQgLSB0aGlzLmFpbGVyb24pICogYTtcbiAgICAgICAgdGhpcy5ydWRkZXIgKz0gKHJ1ZGRlclRhcmdldCAtIHRoaXMucnVkZGVyKSAqIGE7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0U3RhdGUoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBnLWNvbW1hbmQgcGl0Y2ggbGF3OiBhIFBJIHJlZ3VsYXRvciBkcml2ZXMgdGhlIGxvYWQgZmFjdG9yIHRvIHRoZSBjb21tYW5kZWRcbiAgICAgKiB2YWx1ZSAoc28gbmV1dHJhbCBzdGljayBob2xkcyAxIGcgLyBsZXZlbCBmbGlnaHQgd2l0aCBubyBzdGVhZHkgZXJyb3IsIGxpa2VcbiAgICAgKiB0aGUgRi0xNidzIGludGVncmFsIHRyaW0pLCB3aXRoIHBpdGNoLXJhdGUgZGFtcGluZyBhbmQgYW4gQW9BIGxpbWl0ZXIuXG4gICAgICovXG4gICAgcHJpdmF0ZSBwaXRjaExhdyhpbnB1dDogRmNzSW5wdXQsIGR0OiBudW1iZXIpOiBudW1iZXIge1xuICAgICAgICBjb25zdCB7IG1heENvbW1hbmRHLCBtaW5Db21tYW5kRywgcGl0Y2hHR2FpbiwgcGl0Y2hJR2FpbiwgcGl0Y2hSYXRlRGFtcEdhaW4gfSA9IEZNMl9GQ1M7XG5cbiAgICAgICAgLy8gU3RpY2sgc2hhcGluZzogYSBjdWJpYyBcImV4cG9cIiAobG9nYXJpdGhtaWMtc3R5bGUpIGN1cnZlLiBOZWFyIG5ldXRyYWwgdGhlXG4gICAgICAgIC8vIHJlc3BvbnNlIGlzIGRvbWluYXRlZCBieSB0aGUgc21hbGwgKDEtZSkgbGluZWFyIHRlcm0gc28gYSBsaWdodCBwdWxsIGJhcmVseVxuICAgICAgICAvLyBjaGFuZ2VzIHRoZSBnIGNvbW1hbmQ7IGF1dGhvcml0eSByYW1wcyB1cCBzdGVlcGx5IHRvd2FyZCB0aGUgZW5kcywgYW5kIGZ1bGxcbiAgICAgICAgLy8gc3RpY2sgKMKxMSkgc3RpbGwgbWFwcyB0byDCsTEgc28gdGhlIHN0cnVjdHVyYWwgbGltaXQgcmVtYWlucyByZWFjaGFibGUuIFRoaXNcbiAgICAgICAgLy8ga2VlcHMgZmluZSBwaXRjaCBjb3JyZWN0aW9ucyBhcm91bmQgY2VudHJlIGZyb20gaGF2aW5nIGFuIG91dHNpemVkIGltcGFjdC5cbiAgICAgICAgY29uc3QgZSA9IEZNMl9GQ1MucGl0Y2hTdGlja0V4cG87XG4gICAgICAgIGNvbnN0IHNoYXBlZFN0aWNrID0gKDEgLSBlKSAqIGlucHV0LnBpdGNoU3RpY2sgKyBlICogaW5wdXQucGl0Y2hTdGljayAqKiAzO1xuXG4gICAgICAgIC8vIFN0aWNrIOKGkiBjb21tYW5kZWQgbG9hZCBmYWN0b3IgKGFib3V0IDEgZyBhdCBuZXV0cmFsIHN0aWNrKS5cbiAgICAgICAgbGV0IGNvbW1hbmRlZEc6IG51bWJlcjtcbiAgICAgICAgaWYgKHNoYXBlZFN0aWNrID49IDApIHtcbiAgICAgICAgICAgIGNvbW1hbmRlZEcgPSAxICsgc2hhcGVkU3RpY2sgKiAobWF4Q29tbWFuZEcgLSAxKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbW1hbmRlZEcgPSAxICsgc2hhcGVkU3RpY2sgKiAoMSAtIG1pbkNvbW1hbmRHKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFuZ2xlLW9mLWF0dGFjayByYXRlICjOscyHKSwgbG93LXBhc3MgZmlsdGVyZWQuIFRoaXMgaXMgdGhlIHNob3J0LXBlcmlvZFxuICAgICAgICAvLyBkYW1wZXI6IHdoZW4gdGhlIGFpcmNyYWZ0IGlzIGVuZXJneS1saW1pdGVkIGl0IGNhbm5vdCBob2xkIHRoZSBjb21tYW5kZWRcbiAgICAgICAgLy8gZywgc28gdGhlIGxvYWQtZmFjdG9yIGxvb3AgYWxvbmUgaHVudHMgYXJvdW5kIHRoZSBBb0EgbGltaXQuIERhbXBpbmcgzrHMh1xuICAgICAgICAvLyBkaXJlY3RseSBraWxscyB0aGF0IG9zY2lsbGF0aW9uIHJlZ2FyZGxlc3Mgb2YgYXZhaWxhYmxlIHRocnVzdC5cbiAgICAgICAgbGV0IGFvYVJhdGUgPSAwO1xuICAgICAgICBpZiAodGhpcy5wcmV2QW9hVmFsaWQgJiYgZHQgPiAwKSB7XG4gICAgICAgICAgICBhb2FSYXRlID0gKGlucHV0LmFvYVJhZCAtIHRoaXMucHJldkFvYSkgLyBkdDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnByZXZBb2EgPSBpbnB1dC5hb2FSYWQ7XG4gICAgICAgIHRoaXMucHJldkFvYVZhbGlkID0gdHJ1ZTtcbiAgICAgICAgY29uc3QgZkFvYSA9IGR0IDw9IDAgPyAxIDogMSAtIE1hdGguZXhwKC1kdCAvIE1hdGgubWF4KEZNMl9GQ1MuYW9hUmF0ZUZpbHRlclRhdVMsIDFlLTMpKTtcbiAgICAgICAgdGhpcy5hb2FSYXRlRmlsdCArPSAoYW9hUmF0ZSAtIHRoaXMuYW9hUmF0ZUZpbHQpICogZkFvYTtcblxuICAgICAgICAvLyBBb0EgbGltaXRlcjogZmFkZSB0aGUgbm9zZS11cCBhdXRob3JpdHkgYXMgQW9BIGFwcHJvYWNoZXMgdGhlIGxpbWl0LlxuICAgICAgICBjb25zdCBhb2FEZWcgPSBpbnB1dC5hb2FSYWQgLyBERUc7XG4gICAgICAgIGNvbnN0IGFvYUxpbWl0ZXIgPSBjbGFtcChcbiAgICAgICAgICAgIChGTTJfRkNTLmFvYUxpbWl0RGVnIC0gYW9hRGVnKSAvIChGTTJfRkNTLmFvYUxpbWl0RGVnIC0gRk0yX0ZDUy5hb2FTb2Z0RGVnKSxcbiAgICAgICAgICAgIDAsIDEsXG4gICAgICAgICk7XG4gICAgICAgIGlmIChjb21tYW5kZWRHID4gMSkge1xuICAgICAgICAgICAgY29tbWFuZGVkRyA9IDEgKyAoY29tbWFuZGVkRyAtIDEpICogYW9hTGltaXRlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGdFcnJvciA9IGNvbW1hbmRlZEcgLSBpbnB1dC5sb2FkRmFjdG9yRztcbiAgICAgICAgLy8gcGl0Y2hSYXRlIGFib3V0ICtYIGlzIG5vc2UtZG93bi1wb3NpdGl2ZSwgc28gK3BpdGNoUmF0ZSBkYW1wcyBhIG5vc2UtdXBcbiAgICAgICAgLy8gY29tbWFuZDsgLc6xzIcgdGVybSBhZGRzIGRlZGljYXRlZCBzaG9ydC1wZXJpb2QgZGFtcGluZy5cbiAgICAgICAgY29uc3QgcHJvcG9ydGlvbmFsID0gcGl0Y2hHR2FpbiAqIGdFcnJvclxuICAgICAgICAgICAgKyBwaXRjaFJhdGVEYW1wR2FpbiAqIGlucHV0LnBpdGNoUmF0ZVxuICAgICAgICAgICAgLSBGTTJfRkNTLnBpdGNoQW9hUmF0ZURhbXBHYWluICogdGhpcy5hb2FSYXRlRmlsdDtcblxuICAgICAgICAvLyBJbnRlZ3JhbCB0cmltIHdpdGggYW50aS13aW5kdXAuIEZyZWV6ZSB0aGUgYWNjdW11bGF0b3Igd2hlbmV2ZXIgdGhlIEFvQVxuICAgICAgICAvLyBsaW1pdGVyIGlzIGFjdGl2ZSAoaW4gZWl0aGVyIGVycm9yIGRpcmVjdGlvbikgYW5kIGJsZWVkIGl0IGRvd24sIHNvIGl0XG4gICAgICAgIC8vIGNhbm5vdCB3aW5kIHVwIGJlbG93IHRoZSBsaW1pdGVyIGJhbmQgYW5kIGdldCBjaG9wcGVkIGFib3ZlIGl0IOKAlCB0aGVcbiAgICAgICAgLy8gcHVtcGluZyBhY3Rpb24gdGhhdCBkcml2ZXMgdGhlIGxvdy1zcGVlZCBwaXRjaCBsaW1pdCBjeWNsZS5cbiAgICAgICAgY29uc3QgbGltaXRlckFjdGl2ZSA9IGFvYUxpbWl0ZXIgPCAwLjk5OTtcbiAgICAgICAgY29uc3QgcmF3ID0gcHJvcG9ydGlvbmFsICsgcGl0Y2hJR2FpbiAqICh0aGlzLnBpdGNoSW50ZWdyYWwgKyBnRXJyb3IgKiBkdCk7XG4gICAgICAgIGNvbnN0IG91dHB1dFNhdHVyYXRlZCA9IHJhdyA8PSAtMSB8fCByYXcgPj0gMTtcbiAgICAgICAgaWYgKCFvdXRwdXRTYXR1cmF0ZWQgJiYgIWxpbWl0ZXJBY3RpdmUpIHtcbiAgICAgICAgICAgIHRoaXMucGl0Y2hJbnRlZ3JhbCA9IGNsYW1wKHRoaXMucGl0Y2hJbnRlZ3JhbCArIGdFcnJvciAqIGR0LCAtMywgMyk7XG4gICAgICAgIH0gZWxzZSBpZiAobGltaXRlckFjdGl2ZSkge1xuICAgICAgICAgICAgY29uc3QgbGVhayA9IGR0IDw9IDAgPyAxIDogMSAtIE1hdGguZXhwKC1kdCAvIE1hdGgubWF4KEZNMl9GQ1MuaW50ZWdyYWxMZWFrVGF1UywgMWUtMykpO1xuICAgICAgICAgICAgdGhpcy5waXRjaEludGVncmFsIC09IHRoaXMucGl0Y2hJbnRlZ3JhbCAqIGxlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZWxldmF0b3IgPSBwcm9wb3J0aW9uYWwgKyBwaXRjaElHYWluICogdGhpcy5waXRjaEludGVncmFsO1xuICAgICAgICByZXR1cm4gY2xhbXAoZWxldmF0b3IsIC0xLCAxKTtcbiAgICB9XG5cbiAgICAvKiogUm9sbC1yYXRlIGNvbW1hbmQgbGF3IOKGkiBhaWxlcm9uIChhbmQgZGlmZmVyZW50aWFsIHRhaWwgdmlhIHRoZSBtb2RlbCkuICovXG4gICAgcHJpdmF0ZSByb2xsTGF3KGlucHV0OiBGY3NJbnB1dCk6IG51bWJlciB7XG4gICAgICAgIGlmIChpbnB1dC5sYW5kZWQpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG1hY2ggPSBjb21wdXRlTWFjaE51bWJlcihpbnB1dC5zcGVlZCwgaW5wdXQuYWx0aXR1ZGVNKTtcbiAgICAgICAgY29uc3QgY29tbWFuZGVkUmF0ZVJhZCA9IGNvbXB1dGVGMTZDb21tYW5kZWRSb2xsUmF0ZSh7XG4gICAgICAgICAgICBzdGljazogaW5wdXQucm9sbFN0aWNrLFxuICAgICAgICAgICAgZHluYW1pY1ByZXNzdXJlOiBpbnB1dC5keW5hbWljUHJlc3N1cmUsXG4gICAgICAgICAgICBxUmVmOiBpbnB1dC5xUmVmLFxuICAgICAgICAgICAgbWFjaCxcbiAgICAgICAgICAgIGFsdGl0dWRlTTogaW5wdXQuYWx0aXR1ZGVNLFxuICAgICAgICAgICAgYW9hUmFkOiBpbnB1dC5hb2FSYWQsXG4gICAgICAgICAgICBmbGFwc0V4dGVuZGVkOiBpbnB1dC5mbGFwc0V4dGVuZGVkLFxuICAgICAgICAgICAgbGFuZGVkOiBpbnB1dC5sYW5kZWQsXG4gICAgICAgICAgICBjb25maWc6IEYxNl9ST0xMX0NBVDEsXG4gICAgICAgIH0pO1xuICAgICAgICAvLyBDbG9zZSB0aGUgbG9vcCBvbiBib2R5IHJvbGwgcmF0ZSAoYWJvdXQgK1opLiBBIHBvc2l0aXZlIGFpbGVyb24gY29tbWFuZFxuICAgICAgICAvLyBwcm9kdWNlcyBhIE5FR0FUSVZFIHJvbGwgbW9tZW50IChzZWUgdGhlIG1vZGVsJ3MgY29udHJvbCBtYXBwaW5nKSwgc28gdGhlXG4gICAgICAgIC8vIGVycm9yIGlzIChyYXRlIOKIkiBjb21tYW5kKSB0byBrZWVwIHRoZSBmZWVkYmFjayBuZWdhdGl2ZS5cbiAgICAgICAgY29uc3QgcmF0ZUVycm9yID0gaW5wdXQucm9sbFJhdGUgLSBjb21tYW5kZWRSYXRlUmFkO1xuICAgICAgICByZXR1cm4gY2xhbXAoRk0yX0ZDUy5yb2xsUmF0ZUdhaW4gKiByYXRlRXJyb3IsIC0xLCAxKTtcbiAgICB9XG5cbiAgICAvKiogWWF3IGRhbXBlciAod2FzaGVkIG91dCkgKyBhaWxlcm9uLXJ1ZGRlciBpbnRlcmNvbm5lY3QgKyBwZWRhbC4gKi9cbiAgICBwcml2YXRlIHlhd0xhdyhpbnB1dDogRmNzSW5wdXQsIGFpbGVyb25DbWQ6IG51bWJlciwgZHQ6IG51bWJlcik6IG51bWJlciB7XG4gICAgICAgIC8vIFdhc2hvdXQ6IGhpZ2gtcGFzcyB0aGUgeWF3IHJhdGUgc28gYSBzdGVhZHkgdHVybiBpcyBub3Qgb3Bwb3NlZC5cbiAgICAgICAgY29uc3QgdGF1ID0gTWF0aC5tYXgoRk0yX0ZDUy55YXdEYW1wZXJXYXNob3V0VGF1UywgMWUtMyk7XG4gICAgICAgIGNvbnN0IGEgPSBkdCA8PSAwID8gMSA6IDEgLSBNYXRoLmV4cCgtZHQgLyB0YXUpO1xuICAgICAgICB0aGlzLnlhd1JhdGVMb3dQYXNzICs9IChpbnB1dC55YXdSYXRlIC0gdGhpcy55YXdSYXRlTG93UGFzcykgKiBhO1xuICAgICAgICBjb25zdCB5YXdSYXRlSGlnaFBhc3MgPSBpbnB1dC55YXdSYXRlIC0gdGhpcy55YXdSYXRlTG93UGFzcztcblxuICAgICAgICBjb25zdCBkYW1wZXIgPSAtRk0yX0ZDUy55YXdEYW1wZXJHYWluICogeWF3UmF0ZUhpZ2hQYXNzO1xuICAgICAgICBjb25zdCBhcmkgPSBGTTJfRkNTLmFyaUdhaW4gKiBhaWxlcm9uQ21kOyAvLyBjb29yZGluYXRlIHR1cm5zXG4gICAgICAgIGNvbnN0IHBlZGFsID0gaW5wdXQueWF3UGVkYWwgKiBGTTJfRkNTLm1heFJ1ZGRlckNtZDtcbiAgICAgICAgcmV0dXJuIGNsYW1wKHBlZGFsICsgZGFtcGVyICsgYXJpLCAtMSwgMSk7XG4gICAgfVxufVxuIiwiLyoqXG4gKiBGTTIg4oCUIEYtMTZDIHJpZ2lkLWJvZHkgXCJwYXJ0c1wiIGZsaWdodCBtb2RlbCBjb25maWd1cmF0aW9uLlxuICpcbiAqIFRoaXMgbW9kZWwgdHJlYXRzIHRoZSBhaXJjcmFmdCBhcyBhIHNpbmdsZSByaWdpZCBib2R5IHdob3NlIGFlcm9keW5hbWljXG4gKiBmb3JjZXMgYXJlIGJ1aWx0IHVwIGZyb20gZGlzY3JldGUgbGlmdGluZyBzdXJmYWNlcyAoYSBjb21wb25lbnQgYnVpbGQtdXAgL1xuICogXCJwYXJ0c1wiIG1vZGVsKS4gRWFjaCBzdXJmYWNlIGdlbmVyYXRlcyBsaWZ0IGFuZCBkcmFnIGZyb20gdGhlIExPQ0FMIGFpcmZsb3dcbiAqIGl0IGV4cGVyaWVuY2VzLCB3aGljaCBpcyB0aGUgYWlyY3JhZnQgYm9keSB2ZWxvY2l0eSBQTFVTIHRoZSBjb250cmlidXRpb24gb2ZcbiAqIHRoZSBib2R5J3MgYW5ndWxhciB2ZWxvY2l0eSBhdCB0aGUgc3VyZmFjZSBsb2NhdGlvbiAoz4kgw5cgcikuIEJlY2F1c2UgZXZlcnlcbiAqIGZvcmNlIGlzIGFwcGxpZWQgYXQgdGhlIHN1cmZhY2UncyByZWFsIGxvY2F0aW9uLCBwaXRjaGluZy9yb2xsaW5nL3lhd2luZ1xuICogTU9NRU5UUyDigJQgYW5kLCBjcnVjaWFsbHksIHRoZSBhZXJvZHluYW1pYyBEQU1QSU5HIG9mIHRob3NlIHJhdGVzIOKAlCBlbWVyZ2VcbiAqIG5hdHVyYWxseSBmcm9tIHRoZSBnZW9tZXRyeSBpbnN0ZWFkIG9mIGJlaW5nIGhhbmQtYXV0aG9yZWQuXG4gKlxuICogQm9keSBheGVzIChtYXRjaGluZyB0aGUgc2ltJ3MgVEhSRUUuanMgY29udmVudGlvbiwgc2VlIHV0aWxzL21hdGgudHMpOlxuICogICArWCA9IFJJR0hUIChvdXQgdGhlIHJpZ2h0IHdpbmcpXG4gKiAgICtZID0gVVBcbiAqICAgK1ogPSBGT1JXQVJEIChvdXQgdGhlIG5vc2UpXG4gKiBUaGlzIGlzIGEgcmlnaHQtaGFuZGVkIGZyYW1lOiBSSUdIVCDDlyBVUCA9IEZPUldBUkQuXG4gKlxuICogUmVmZXJlbmNlIGRhdGE6XG4gKiAgIC0gR2VvbWV0cnkgLyBtYXNzOiBHZW5lcmFsIER5bmFtaWNzIEYtMTZDIChKYW5lJ3MsIFVTQUYgZmFjdCBzaGVldCkuXG4gKiAgIC0gSW5lcnRpYTogTkFTQSBUUC0xNTM4IC8gU3RldmVucyAmIExld2lzIFwiQWlyY3JhZnQgQ29udHJvbCBhbmQgU2ltdWxhdGlvblwiXG4gKiAgICAgbm9taW5hbCBGLTE2IChjb252ZXJ0ZWQgZnJvbSBzbHVnwrdmdMKyIGFuZCByb3RhdGVkIGludG8gdGhlIHNpbSBib2R5IGZyYW1lKS5cbiAqICAgLSBBZXJvIGNvZWZmaWNpZW50cyB0dW5lZCB0byBSZWhtYW4sIFwiQWVyb2R5bmFtaWMgUGVyZm9ybWFuY2UgQW5hbHlzaXMgb2ZcbiAqICAgICBGLTE2QyBGaWdodGluZyBGYWxjb25cIiAoQ0QwIOKJiCAwLjAxOCwgSyDiiYggMC4xNDksIENMzrEg4omIIDMuNuKAkzUuNy9yYWQsXG4gKiAgICAgTC9EX21heCDiiYggOS434oCTMTQpIGFuZCB0aGUgc2ltJ3MgZXhpc3RpbmcgRjE2X1BST0ZJTEUgZW52ZWxvcGUuXG4gKi9cbmltcG9ydCB7IEYxNl9QUk9GSUxFIH0gZnJvbSAnLi4vZjE2UHJvZmlsZSc7XG5cbmNvbnN0IERFRyA9IE1hdGguUEkgLyAxODA7XG5cbi8qKiBSZWZlcmVuY2UgZ2VvbWV0cnkgKFNJKS4gKi9cbmV4cG9ydCBjb25zdCBGTTJfR0VPTUVUUlkgPSB7XG4gICAgbWFzc0tnOiBGMTZfUFJPRklMRS5zaW1NYXNzS2csICAgICAgLy8gfjEzLDYwOCBrZyB0eXBpY2FsIHRha2VvZmYgZ3Jvc3NcbiAgICB3aW5nQXJlYU0yOiBGMTZfUFJPRklMRS53aW5nQXJlYU0yLCAvLyAyNy44NyBtwrIgcmVmZXJlbmNlIHBsYW5mb3JtXG4gICAgd2luZ1NwYW5NOiBGMTZfUFJPRklMRS53aW5nU3Bhbk0sICAgLy8gOS40NSBtXG4gICAgbWVhbkNob3JkTTogMy40NSwgICAgICAgICAgICAgICAgICAgLy8gbWVhbiBhZXJvZHluYW1pYyBjaG9yZCAofjExLjMgZnQpXG59IGFzIGNvbnN0O1xuXG4vKipcbiAqIFByaW5jaXBhbCBtb21lbnRzIG9mIGluZXJ0aWEgaW4gdGhlIFNJTSBib2R5IGZyYW1lIChrZ8K3bcKyKS5cbiAqXG4gKiBOQVNBL1N0ZXZlbnMtTGV3aXMgRi0xNiAoYWVyb3NwYWNlIFgtZndkLFktcmlnaHQsWi1kb3duKTpcbiAqICAgSXh4KHJvbGwpPTk0OTYsIEl5eShwaXRjaCk9NTU4MTQsIEl6eih5YXcpPTYzMTAwIHNsdWfCt2Z0wrIgICjDlyAxLjM1NTgyIOKGkiBrZ8K3bcKyKVxuICogTWFwcGluZyB0byBzaW0gYXhlczogcm9sbOKGlCtaLCBwaXRjaOKGlCtYLCB5YXfihpQrWS4gVGhlIHNtYWxsIEl4eiBwcm9kdWN0IG9mXG4gKiBpbmVydGlhICjiiYgxMzMxIGtnwrdtwrIpIGlzIG5lZ2xlY3RlZCDigJQgaXQgaXMgfjIlIG9mIHRoZSB5YXcvcm9sbCBpbmVydGlhcyBhbmRcbiAqIG9ubHkgcHJvZHVjZXMgbWlub3IgaW5lcnRpYWwgcm9sbOKGlHlhdyBjcm9zcy1jb3VwbGluZy5cbiAqL1xuZXhwb3J0IGNvbnN0IEZNMl9JTkVSVElBID0ge1xuICAgIHBpdGNoOiA1NTgxNCAqIDEuMzU1ODIsIC8vIGFib3V0ICtYIChSSUdIVCkgIOKJiCA3NSw2NzIga2fCt23CslxuICAgIHlhdzogNjMxMDAgKiAxLjM1NTgyLCAgIC8vIGFib3V0ICtZIChVUCkgICAgIOKJiCA4NSw1NTIga2fCt23CslxuICAgIHJvbGw6IDk0OTYgKiAxLjM1NTgyLCAgIC8vIGFib3V0ICtaIChGT1JXQVJEKSDiiYggMTIsODc0IGtnwrdtwrJcbn0gYXMgY29uc3Q7XG5cbi8qKiBIb3cgYSBzdXJmYWNlJ3MgbGlmdCBwbGFuZSBpcyBvcmllbnRlZCBpbiB0aGUgYm9keSBmcmFtZS4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU3VyZmFjZUdlb21ldHJ5IHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgLyoqIEFwcGxpY2F0aW9uIHBvaW50IHJlbGF0aXZlIHRvIENHLCBib2R5IGZyYW1lIChtKS4gKi9cbiAgICBwb3NpdGlvbjogW251bWJlciwgbnVtYmVyLCBudW1iZXJdO1xuICAgIC8qKiBMaWZ0IGRpcmVjdGlvbiBhdCBwb3NpdGl2ZSBBb0EsIGJvZHkgZnJhbWUgdW5pdCB2ZWN0b3IuICovXG4gICAgdXA6IFtudW1iZXIsIG51bWJlciwgbnVtYmVyXTtcbiAgICAvKiogQ2hvcmQgKHplcm8tbGlmdCByZWZlcmVuY2UpIGRpcmVjdGlvbiwgYm9keSBmcmFtZSB1bml0IHZlY3RvciAobm9taW5hbGx5ICtaKS4gKi9cbiAgICBmb3J3YXJkOiBbbnVtYmVyLCBudW1iZXIsIG51bWJlcl07XG4gICAgLyoqIFBsYW5mb3JtIGFyZWEgb2YgdGhpcyBzdXJmYWNlIChtwrIpLiAqL1xuICAgIGFyZWFNMjogbnVtYmVyO1xuICAgIC8qKiBMaWZ0LWN1cnZlIHNsb3BlIChwZXIgcmFkaWFuKSBpbiB0aGUgbGluZWFyIHJhbmdlLiAqL1xuICAgIGxpZnRTbG9wZVBlclJhZDogbnVtYmVyO1xuICAgIC8qKiBTdGFsbCBhbmdsZSBvZiBhdHRhY2sgKHJhZCkuIEJleW9uZCB0aGlzLCBDTCBjb2xsYXBzZXMuICovXG4gICAgc3RhbGxBb2FSYWQ6IG51bWJlcjtcbiAgICAvKiogUHJvZmlsZSAoemVyby1saWZ0KSBkcmFnIGNvZWZmaWNpZW50IG9mIHRoaXMgc3VyZmFjZS4gKi9cbiAgICBjZDA6IG51bWJlcjtcbiAgICAvKiogSW5kdWNlZC1kcmFnIGZhY3RvcjogQ0RfaSA9IGluZHVjZWRLIMK3IENMwrIuICovXG4gICAgaW5kdWNlZEs6IG51bWJlcjtcbiAgICAvKiogzpRBb0EgKHJhZCkgcHJvZHVjZWQgcGVyIHVuaXQgY29udHJvbCBkZWZsZWN0aW9uIFstMSwxXSAoMCA9IG5vIGNvbnRyb2wpLiAqL1xuICAgIGNvbnRyb2xFZmZlY3RpdmVuZXNzOiBudW1iZXI7XG59XG5cbi8qKlxuICogVGhlIEYtMTYgYXMgYSBzZXQgb2YgcmlnaWQgbGlmdGluZyBzdXJmYWNlcy5cbiAqXG4gKiBMYXRlcmFsIHNwbGl0IG9mIHRoZSB3aW5nIGFuZCBob3Jpem9udGFsIHRhaWwgaXMgZGVsaWJlcmF0ZTogaXQgbGV0cyByb2xsXG4gKiBkYW1waW5nLCBkaWZmZXJlbnRpYWwtdGFpbCAodGFpbGVyb24pIHJvbGwgYXV0aG9yaXR5IGFuZCBkaWhlZHJhbC9zaWRlc2xpcFxuICogZWZmZWN0cyBmYWxsIG91dCBvZiB0aGUgZ2VvbWV0cnkgcmF0aGVyIHRoYW4gYmVpbmcgZmFrZWQuIFRoZSBob3Jpem9udGFsIGFuZFxuICogdmVydGljYWwgdGFpbHMgc2l0IHdlbGwgYWZ0IG9mIHRoZSBDRyAo4oiSWikgd2hpY2ggcHJvdmlkZXMgdGhlIHN0YXRpYyBwaXRjaFxuICogYW5kIHlhdyBzdGFiaWxpdHkgYW5kIHRoZSBhZXJvZHluYW1pYyBwaXRjaC95YXcgcmF0ZSBkYW1waW5nLlxuICovXG5leHBvcnQgY29uc3QgRk0yX1NVUkZBQ0VTOiBSZWNvcmQ8c3RyaW5nLCBTdXJmYWNlR2VvbWV0cnk+ID0ge1xuICAgIC8qKlxuICAgICAqIEJsZW5kZWQgZnVzZWxhZ2UgLyBzdHJha2UgbGlmdGluZyBib2R5LiBUaGUgRi0xNiBpcyBhIGxpZnRpbmctYm9keSBkZXNpZ246XG4gICAgICogdGhlIHdpZGUgZm9yZWJvZHkgYW5kIGxlYWRpbmctZWRnZSBzdHJha2VzIGNhcnJ5IGEgbGFyZ2Ugc2hhcmUgb2YgdGhlIHRvdGFsXG4gICAgICogbGlmdC4gVGhpcyBzdXJmYWNlIGlzIHNpemVkIHNvIHRoZSBmdXNlbGFnZSBwcm9kdWNlcyB+MzAlIG9mIHRoZSBhaXJjcmFmdCdzXG4gICAgICogbGlmdCDigJQgaXRzIGxpZnQtY3VydmUgY29udHJpYnV0aW9uIChDTM6xwrdTID0gMi40IMOXIDE2LjAg4omIIDM4LjQpIGlzIDMvNyBvZiB0aGVcbiAgICAgKiBjb21iaW5lZCB3aW5nIGNvbnRyaWJ1dGlvbiAoMiDDlyA1LjIgw5cgOC42IOKJiCA4OS40KSwgc29cbiAgICAgKiAzOC40IC8gKDM4LjQgKyA4OS40KSDiiYggMC4zMCBvZiB0aGUgd2luZytib2R5IGxpZnQgdGhyb3VnaG91dCB0aGUgbGluZWFyXG4gICAgICogcmFuZ2UuIEl0IGFjdHMgYXQgdGhlIENHIChubyB0cmltIG1vbWVudCk7IHBhcmFzaXRlIGZvcm0gZHJhZyBzdGF5cyBpblxuICAgICAqIEZNMl9CT0RZX0NEMCwgc28gY2QwIGhlcmUgaXMgMCB0byBhdm9pZCBkb3VibGUtY291bnRpbmcuXG4gICAgICovXG4gICAgZnVzZWxhZ2U6IHtcbiAgICAgICAgbmFtZTogJ2Z1c2VsYWdlJyxcbiAgICAgICAgcG9zaXRpb246IFswLjAsIDAuMCwgMC4wXSxcbiAgICAgICAgdXA6IFswLCAxLCAwXSxcbiAgICAgICAgZm9yd2FyZDogWzAsIDAsIDFdLFxuICAgICAgICBhcmVhTTI6IDE2LjAsXG4gICAgICAgIGxpZnRTbG9wZVBlclJhZDogMi40LFxuICAgICAgICBzdGFsbEFvYVJhZDogNDAgKiBERUcsIC8vIGEgbG93LWFzcGVjdCBib2R5IHN0YWxscyBsYXRlIGFuZCBnZW50bHlcbiAgICAgICAgY2QwOiAwLjAsXG4gICAgICAgIGluZHVjZWRLOiAwLjI1LFxuICAgICAgICBjb250cm9sRWZmZWN0aXZlbmVzczogMCxcbiAgICB9LFxuICAgIHdpbmdMZWZ0OiB7XG4gICAgICAgIG5hbWU6ICd3aW5nTGVmdCcsXG4gICAgICAgIHBvc2l0aW9uOiBbLTIuMSwgMC4wLCAtMC4xNV0sXG4gICAgICAgIHVwOiBbMCwgMSwgMF0sXG4gICAgICAgIGZvcndhcmQ6IFswLCAwLCAxXSxcbiAgICAgICAgYXJlYU0yOiA4LjYsXG4gICAgICAgIGxpZnRTbG9wZVBlclJhZDogNS4yLFxuICAgICAgICBzdGFsbEFvYVJhZDogMjQgKiBERUcsXG4gICAgICAgIGNkMDogMC4wMDg1LFxuICAgICAgICBpbmR1Y2VkSzogMC4xMTgsXG4gICAgICAgIGNvbnRyb2xFZmZlY3RpdmVuZXNzOiAwLCAvLyBhaWxlcm9ucyBhcHBsaWVkIHNlcGFyYXRlbHkgYmVsb3dcbiAgICB9LFxuICAgIHdpbmdSaWdodDoge1xuICAgICAgICBuYW1lOiAnd2luZ1JpZ2h0JyxcbiAgICAgICAgcG9zaXRpb246IFsyLjEsIDAuMCwgLTAuMTVdLFxuICAgICAgICB1cDogWzAsIDEsIDBdLFxuICAgICAgICBmb3J3YXJkOiBbMCwgMCwgMV0sXG4gICAgICAgIGFyZWFNMjogOC42LFxuICAgICAgICBsaWZ0U2xvcGVQZXJSYWQ6IDUuMixcbiAgICAgICAgc3RhbGxBb2FSYWQ6IDI0ICogREVHLFxuICAgICAgICBjZDA6IDAuMDA4NSxcbiAgICAgICAgaW5kdWNlZEs6IDAuMTE4LFxuICAgICAgICBjb250cm9sRWZmZWN0aXZlbmVzczogMCxcbiAgICB9LFxuICAgIGh0YWlsTGVmdDoge1xuICAgICAgICBuYW1lOiAnaHRhaWxMZWZ0JyxcbiAgICAgICAgcG9zaXRpb246IFstMS41LCAwLjAsIC00LjZdLFxuICAgICAgICB1cDogWzAsIDEsIDBdLFxuICAgICAgICBmb3J3YXJkOiBbMCwgMCwgMV0sXG4gICAgICAgIGFyZWFNMjogMi45NSxcbiAgICAgICAgbGlmdFNsb3BlUGVyUmFkOiAzLjQsXG4gICAgICAgIHN0YWxsQW9hUmFkOiAyNiAqIERFRyxcbiAgICAgICAgY2QwOiAwLjAwNixcbiAgICAgICAgaW5kdWNlZEs6IDAuMTUsXG4gICAgICAgIGNvbnRyb2xFZmZlY3RpdmVuZXNzOiAwLjksIC8vIGFsbC1tb3Zpbmcgc3RhYmlsYXRvclxuICAgIH0sXG4gICAgaHRhaWxSaWdodDoge1xuICAgICAgICBuYW1lOiAnaHRhaWxSaWdodCcsXG4gICAgICAgIHBvc2l0aW9uOiBbMS41LCAwLjAsIC00LjZdLFxuICAgICAgICB1cDogWzAsIDEsIDBdLFxuICAgICAgICBmb3J3YXJkOiBbMCwgMCwgMV0sXG4gICAgICAgIGFyZWFNMjogMi45NSxcbiAgICAgICAgbGlmdFNsb3BlUGVyUmFkOiAzLjQsXG4gICAgICAgIHN0YWxsQW9hUmFkOiAyNiAqIERFRyxcbiAgICAgICAgY2QwOiAwLjAwNixcbiAgICAgICAgaW5kdWNlZEs6IDAuMTUsXG4gICAgICAgIGNvbnRyb2xFZmZlY3RpdmVuZXNzOiAwLjksXG4gICAgfSxcbiAgICB2dGFpbDoge1xuICAgICAgICBuYW1lOiAndnRhaWwnLFxuICAgICAgICBwb3NpdGlvbjogWzAuMCwgMS4xLCAtNC4zXSxcbiAgICAgICAgdXA6IFsxLCAwLCAwXSwgLy8gc2lkZSBmb3JjZSBhY3RzIGFsb25nICtYXG4gICAgICAgIGZvcndhcmQ6IFswLCAwLCAxXSxcbiAgICAgICAgYXJlYU0yOiA1LjEsXG4gICAgICAgIGxpZnRTbG9wZVBlclJhZDogMi45LFxuICAgICAgICBzdGFsbEFvYVJhZDogMzAgKiBERUcsXG4gICAgICAgIGNkMDogMC4wMDcsXG4gICAgICAgIGluZHVjZWRLOiAwLjE2LFxuICAgICAgICBjb250cm9sRWZmZWN0aXZlbmVzczogMC41NSwgLy8gcnVkZGVyXG4gICAgfSxcbn07XG5cbi8qKlxuICogQWlsZXJvbiAocm9sbCkgcGFyYW1ldGVycyDigJQgZGlmZmVyZW50aWFsIGluY2lkZW5jZSBhZGRlZCB0byBlYWNoIHdpbmcuXG4gKiBTaXplZCBzbyB0aGF0IGZ1bGwgZGVmbGVjdGlvbiBwcm9kdWNlcyByb3VnaGx5IHRoZSBGLTE2J3MgfjM2MMKwL3Mgb3Blbi1sb29wXG4gKiByb2xsIHJhdGUgKGFlcm8gcm9sbCBkYW1waW5nIGJhbGFuY2VzIGNvbnRyb2wgcG93ZXIpOyB0aGUgRkJXIHJhdGUgbG9vcCB0aGVuXG4gKiBjYXBzIHRoZSBjb21tYW5kZWQgcmF0ZSBuZWFyIDMwMMKwL3MuXG4gKi9cbmV4cG9ydCBjb25zdCBGTTJfQUlMRVJPTiA9IHtcbiAgICAvKiogzpRBb0EgKHJhZCkgYXQgZWFjaCB3aW5nIHBlciB1bml0IGFpbGVyb24gY29tbWFuZCBbLTEsMV0uICovXG4gICAgbWF4RGVmbGVjdGlvblJhZDogNC4yICogREVHLFxufSBhcyBjb25zdDtcblxuLyoqIFN5bW1ldHJpYyBmbGFwIGNhbWJlciBpbmNyZW1lbnQgKHJhZCBvZiBlZmZlY3RpdmUgd2luZyBpbmNpZGVuY2UpIHdpdGggZmxhcHMgZG93bi4gKi9cbmV4cG9ydCBjb25zdCBGTTJfRkxBUFMgPSB7XG4gICAgYW9hQmlhc1JhZDogOCAqIERFRyxcbiAgICBzdGFsbFJlZHVjdGlvblJhZDogMSAqIERFRyxcbiAgICBleHRyYUNkOiAwLjAyMCxcbn0gYXMgY29uc3Q7XG5cbi8qKiBMYW5kaW5nIGdlYXIgcGFyYXNpdGUgZHJhZyBpbmNyZW1lbnQgKENEIHJlZmVyZW5jZWQgdG8gd2luZyBhcmVhKS4gKi9cbmV4cG9ydCBjb25zdCBGTTJfR0VBUl9DRCA9IDAuMDIyO1xuXG4vKiogRnVzZWxhZ2UgLyBtaXNjZWxsYW5lb3VzIHBhcmFzaXRlIGRyYWcgKENEIHJlZmVyZW5jZWQgdG8gd2luZyBhcmVhKS4gKi9cbmV4cG9ydCBjb25zdCBGTTJfQk9EWV9DRDAgPSAwLjAxMDtcblxuLyoqIEV4dHJhIHRyYW5zb25pYy9zdXBlcnNvbmljIHdhdmUtZHJhZyBzY2FsZSBhcHBsaWVkIGFib3ZlIHRoZSBkaXZlcmdlbmNlIE1hY2guICovXG5leHBvcnQgY29uc3QgRk0yX1dBVkVfRFJBRyA9IHtcbiAgICBtYWNoT25zZXQ6IDAuOTUsXG4gICAgc2NhbGU6IDAuNTUsXG59IGFzIGNvbnN0O1xuXG4vKipcbiAqIEZseS1ieS13aXJlIGNvbnRyb2wtbGF3IGdhaW5zLiBUaGUgRi0xNiBpcyBhZXJvZHluYW1pY2FsbHkgcmVsYXhlZC1zdGFiaWxpdHlcbiAqIGFuZCBvbmx5IGZseWFibGUgdGhyb3VnaCBpdHMgRkJXIHN5c3RlbSwgc28gdGhlc2UgZ2FpbnMgYXJlIHdoYXQgZ2l2ZSB0aGVcbiAqIGFpcmNyYWZ0IGl0cyBoYW5kbGluZyBxdWFsaXRpZXMgKGNyaXNwIH4zMDDCsC9zIHJvbGwsIGcvQW9BLWxpbWl0ZWQgcGl0Y2gsXG4gKiBjb29yZGluYXRlZCB5YXcpIHJhdGhlciB0aGFuIHRoZSBiYXJlLWFpcmZyYW1lIHJlc3BvbnNlLlxuICovXG5leHBvcnQgY29uc3QgRk0yX0ZDUyA9IHtcbiAgICAvKiogUG9zaXRpdmUvbmVnYXRpdmUgc3RydWN0dXJhbCBnIGNvbW1hbmQgbGltaXRzLiAqL1xuICAgIG1heENvbW1hbmRHOiBGMTZfUFJPRklMRS5tYXhMb2FkRmFjdG9yRywgLy8gOS41XG4gICAgbWluQ29tbWFuZEc6IC0zLjAsXG4gICAgLyoqIENvbW1hbmQgQW9BIGxpbWl0ZXIgKGRlZykuIFdpZGVuZWQgZmFkZSBiYW5kIHNvIGF1dGhvcml0eSB0YXBlcnMgZ2VudGx5LiAqL1xuICAgIGFvYUxpbWl0RGVnOiAyNixcbiAgICBhb2FTb2Z0RGVnOiAxOCxcblxuICAgIC8qKlxuICAgICAqIFBpdGNoIGxvb3A6IHN0YWJpbGF0b3IgY29tbWFuZCBwZXIgdW5pdCBnIGVycm9yLCBpbnRlZ3JhbCB0cmltLCBwaXRjaC1yYXRlXG4gICAgICogZGFtcGluZywgYW5kIHN0aWNrIHNoYXBpbmcuXG4gICAgICpcbiAgICAgKiBgcGl0Y2hTdGlja0V4cG9gIGJsZW5kcyBhIGN1YmljIGludG8gdGhlIHN0aWNr4oaSZyBtYXAgKDAgPSBsaW5lYXIsIDEgPSBwdXJlXG4gICAgICogY3ViaWMpIHNvIHNtYWxsIGRlZmxlY3Rpb25zIGFyZSB2ZXJ5IGdlbnRsZSDigJQgYSBsb2dhcml0aG1pYy1zdHlsZSBmZWVsIHdoZXJlIGFcbiAgICAgKiBsaWdodCBwdWxsIG5lYXIgY2VudHJlIGJhcmVseSBtb3ZlcyB0aGUgZyBjb21tYW5kIOKAlCB3aGlsZSBmdWxsIHN0aWNrIHN0aWxsXG4gICAgICogcmVhY2hlcyB0aGUgc3RydWN0dXJhbCBsaW1pdC5cbiAgICAgKiBgaW50ZWdyYWxMZWFrVGF1U2AgYmxlZWRzIHRoZSB0cmltIGludGVncmF0b3IgZG93biB3aGlsZSB0aGUgQW9BIGxpbWl0ZXIgaXNcbiAgICAgKiBhY3RpdmUsIHByZXZlbnRpbmcgd2luZC11cCBhZ2FpbnN0IHRoZSBsaW1pdCAodGhlIGNhdXNlIG9mIHRoZSBwaXRjaCBodW50aW5nKS5cbiAgICAgKi9cbiAgICBwaXRjaEdHYWluOiAwLjE0LFxuICAgIHBpdGNoSUdhaW46IDAuNixcbiAgICBwaXRjaFJhdGVEYW1wR2FpbjogMS4xLFxuICAgIHBpdGNoQW9hUmF0ZURhbXBHYWluOiA0LjUsXG4gICAgYW9hUmF0ZUZpbHRlclRhdVM6IDAuMDUsXG4gICAgcGl0Y2hTdGlja0V4cG86IDAuOTIsXG4gICAgaW50ZWdyYWxMZWFrVGF1UzogMC4zNSxcbiAgICBtYXhTdGFiaWxhdG9yUmFkOiAyNSAqIERFRyxcblxuICAgIC8qKiBSb2xsIGxvb3A6IHJhdGUgY29tbWFuZCBhbmQgcHJvcG9ydGlvbmFsIGdhaW4gdG8gYWlsZXJvbi90YWlsZXJvbi4gKi9cbiAgICBtYXhSb2xsUmF0ZURlZ1M6IEYxNl9QUk9GSUxFLm1heFJvbGxSYXRlRGVnUywgLy8gMzAwXG4gICAgcm9sbFJhdGVHYWluOiAwLjgsXG4gICAgcm9sbERhbXBlckdhaW46IDAuMDYsXG4gICAgLyoqIEZyYWN0aW9uIG9mIHJvbGwgY29tbWFuZCByb3V0ZWQgdG8gdGhlIGRpZmZlcmVudGlhbCBzdGFiaWxhdG9yICh0YWlsZXJvbikuICovXG4gICAgdGFpbGVyb25Sb2xsRnJhY3Rpb246IDAuMTIsXG5cbiAgICAvKiogWWF3IGxvb3A6IHBlZGFsIGF1dGhvcml0eSwgeWF3LXJhdGUgZGFtcGVyICh3YXNoZWQgb3V0KSwgYWlsZXJvbi1ydWRkZXIgaW50ZXJjb25uZWN0LiAqL1xuICAgIG1heFJ1ZGRlckNtZDogMS4wLFxuICAgIHlhd0RhbXBlckdhaW46IDEuNixcbiAgICB5YXdEYW1wZXJXYXNob3V0VGF1UzogMS4wLFxuICAgIGFyaUdhaW46IDAuMTAsXG5cbiAgICAvKiogQWN0dWF0b3IgZmlyc3Qtb3JkZXIgbGFnIHRpbWUgY29uc3RhbnQgKHMpLiAqL1xuICAgIGFjdHVhdG9yVGF1UzogMC4wNSxcbn0gYXMgY29uc3Q7XG4iLCIvKipcbiAqIFBlci1haXJjcmFmdCBjb25maWd1cmF0aW9uIGZvciB0aGUgRk0yIHJpZ2lkLWJvZHkgXCJwYXJ0c1wiIGZsaWdodCBtb2RlbC5cbiAqXG4gKiBFdmVyeXRoaW5nIHRoZSBGTTIgbW9kZWwgbmVlZHMgdG8gZmx5IGEgc3BlY2lmaWMgYWlyZnJhbWUgaXMgY2FwdHVyZWQgaGVyZSBhc1xuICogcGxhaW4sIEpTT04tc2VyaWFsaXphYmxlIGRhdGEgc28gaXQgY2FuIGJlIGF1dGhvcmVkIGJ5IHRoZSBtb2QgaW1wb3J0ZXIgYW5kXG4gKiBzaGlwcGVkIHRocm91Z2ggdGhlIHdvcmtlci4gVGhlIEYtMTYgbnVtYmVycyB0aGF0IHVzZWQgdG8gbGl2ZSBhcyBtb2R1bGUtbGV2ZWxcbiAqIGNvbnN0YW50cyBhcmUgcGFja2FnZWQgYXMge0BsaW5rIGYxNkZtMkNvbmZpZ30gYmVsb3csIHNvIHRoZSBkZWZhdWx0IGFpcmNyYWZ0XG4gKiBmbGllcyBleGFjdGx5IGFzIGJlZm9yZS5cbiAqXG4gKiBCb2R5IGF4ZXMgKHNpbSBUSFJFRS5qcyBjb252ZW50aW9uLCBzZWUgdXRpbHMvbWF0aC50cyk6XG4gKiAgICtYID0gUklHSFQsICtZID0gVVAsICtaID0gRk9SV0FSRC4gUmlnaHQtaGFuZGVkOiBSSUdIVCDDlyBVUCA9IEZPUldBUkQuXG4gKi9cbmltcG9ydCB7XG4gICAgRk0yX0FJTEVST04sIEZNMl9CT0RZX0NEMCwgRk0yX0ZDUywgRk0yX0ZMQVBTLCBGTTJfR0VBUl9DRCwgRk0yX0dFT01FVFJZLFxuICAgIEZNMl9JTkVSVElBLCBGTTJfU1VSRkFDRVMsIEZNMl9XQVZFX0RSQUcsIFN1cmZhY2VHZW9tZXRyeSxcbn0gZnJvbSAnLi9mMTZGbTJDb25maWcnO1xuaW1wb3J0IHsgRjE2X1BST0ZJTEUgfSBmcm9tICcuLi9mMTZQcm9maWxlJztcbmltcG9ydCB7IFBMQU5FX0RJU1RBTkNFX1RPX0dST1VORCB9IGZyb20gJy4uLy4uL2RlZnMnO1xuXG5jb25zdCBERUcgPSBNYXRoLlBJIC8gMTgwO1xuXG5leHBvcnQgdHlwZSB7IFN1cmZhY2VHZW9tZXRyeSB9O1xuXG4vKiogUmVmZXJlbmNlIG1hc3MgLyBwbGFuZm9ybSBnZW9tZXRyeSAoU0kpLiAqL1xuZXhwb3J0IGludGVyZmFjZSBGbTJHZW9tZXRyeUNvbmZpZyB7XG4gICAgbWFzc0tnOiBudW1iZXI7XG4gICAgd2luZ0FyZWFNMjogbnVtYmVyO1xuICAgIHdpbmdTcGFuTTogbnVtYmVyO1xuICAgIG1lYW5DaG9yZE06IG51bWJlcjtcbn1cblxuLyoqIFByaW5jaXBhbCBtb21lbnRzIG9mIGluZXJ0aWEgaW4gdGhlIHNpbSBib2R5IGZyYW1lIChrZ8K3bcKyKS4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRm0ySW5lcnRpYUNvbmZpZyB7XG4gICAgcGl0Y2g6IG51bWJlcjsgLy8gYWJvdXQgK1ggKFJJR0hUKVxuICAgIHlhdzogbnVtYmVyOyAgIC8vIGFib3V0ICtZIChVUClcbiAgICByb2xsOiBudW1iZXI7ICAvLyBhYm91dCArWiAoRk9SV0FSRClcbn1cblxuLyoqIFRoZSBzZXQgb2YgcmlnaWQgbGlmdGluZyBzdXJmYWNlcyB0aGF0IGJ1aWxkIHVwIHRoZSBhaXJmcmFtZSBmb3JjZXMuICovXG5leHBvcnQgaW50ZXJmYWNlIEZtMlN1cmZhY2VTZXQge1xuICAgIGZ1c2VsYWdlOiBTdXJmYWNlR2VvbWV0cnk7XG4gICAgd2luZ0xlZnQ6IFN1cmZhY2VHZW9tZXRyeTtcbiAgICB3aW5nUmlnaHQ6IFN1cmZhY2VHZW9tZXRyeTtcbiAgICBodGFpbExlZnQ6IFN1cmZhY2VHZW9tZXRyeTtcbiAgICBodGFpbFJpZ2h0OiBTdXJmYWNlR2VvbWV0cnk7XG4gICAgdnRhaWw6IFN1cmZhY2VHZW9tZXRyeTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBGbTJGbGFwc0NvbmZpZyB7XG4gICAgYW9hQmlhc1JhZDogbnVtYmVyO1xuICAgIHN0YWxsUmVkdWN0aW9uUmFkOiBudW1iZXI7XG4gICAgZXh0cmFDZDogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEZtMldhdmVEcmFnQ29uZmlnIHtcbiAgICBtYWNoT25zZXQ6IG51bWJlcjtcbiAgICBzY2FsZTogbnVtYmVyO1xufVxuXG4vKiogU3ByaW5nLWRhbXBlciBsYW5kaW5nLWdlYXIgY29udGFjdCBtb2RlbC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRm0yR2VhckNvbmZpZyB7XG4gICAgLyoqIENvbnRhY3QgcG9pbnRzIGluIHRoZSBib2R5IGZyYW1lIChtKTsgWSDiiYggLVBMQU5FX0RJU1RBTkNFX1RPX0dST1VORC4gKi9cbiAgICBwb2ludHM6IFtudW1iZXIsIG51bWJlciwgbnVtYmVyXVtdO1xuICAgIHN0aWZmbmVzczogbnVtYmVyOyAgIC8vIE4vbVxuICAgIGRhbXBpbmc6IG51bWJlcjsgICAgIC8vIE7Ct3MvbVxuICAgIHJvbGxGcmljdGlvbjogbnVtYmVyO1xuICAgIGJyYWtlRnJpY3Rpb246IG51bWJlcjtcbiAgICBzaWRlRnJpY3Rpb246IG51bWJlcjtcbn1cblxuLyoqXG4gKiBFbmdpbmUgdGhydXN0IHNjaGVkdWxlLiBXaGVuIGBhZnRlcmJ1cm5lcmAgaXMgdHJ1ZSB0aGUgRi0xNiBGMTAwIHF1YWRyYW50IGFuZFxuICogdGhydXN0IGxhcHNlIGFyZSB1c2VkIHZlcmJhdGltOyBvdGhlcndpc2UgYSBzaW1wbGUgbGluZWFyIGlkbGXihpJtaWxpdGFyeVxuICogc2NoZWR1bGUgd2l0aCB0aGUgc2FtZSBJU0EgZGVuc2l0eSBsYXBzZSBpcyBhcHBsaWVkIGFuZCB0aGUgdGhyb3R0bGUgYmVoYXZlc1xuICogYXMgYSBwbGFpbiAw4oCTMTAwJSBsZXZlci5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBGbTJFbmdpbmVDb25maWcge1xuICAgIGFmdGVyYnVybmVyOiBib29sZWFuO1xuICAgIGlkbGVUaHJ1c3RLbjogbnVtYmVyO1xuICAgIG1pbFRocnVzdEtuOiBudW1iZXI7XG4gICAgYWJNaW5UaHJ1c3RLbjogbnVtYmVyO1xuICAgIGFiTWF4VGhydXN0S246IG51bWJlcjtcbiAgICBtaWxMZXZlckVuZDogbnVtYmVyO1xuICAgIGFiTWluTGV2ZXJFbmQ6IG51bWJlcjtcbn1cblxuZXhwb3J0IHR5cGUgRmNzTW9kZSA9ICdmYncnIHwgJ2RpcmVjdCc7XG5cbi8qKlxuICogRmxpZ2h0LWNvbnRyb2wtc3lzdGVtIGNvbmZpZ3VyYXRpb24uIGBmYndgIHNlbGVjdHMgdGhlIEYtMTYgZmx5LWJ5LXdpcmUgbGF3c1xuICogKHJlbGF4ZWQtc3RhYmlsaXR5IGcvcmF0ZSBjb21tYW5kKTsgYGRpcmVjdGAgaXMgYSBtZWNoYW5pY2FsIGNvbnRyb2wgcGF0aFxuICogKHN0aWNrIOKGkiBzdXJmYWNlLCBwbHVzIGEgeWF3IGRhbXBlcikgZm9yIGNvbnZlbnRpb25hbGx5LXN0YWJsZSBhaXJjcmFmdC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBGbTJGY3NDb25maWcge1xuICAgIG1vZGU6IEZjc01vZGU7XG4gICAgLyoqIE1heCBzdGFiaWxhdG9yIGluY2lkZW5jZSBhdCBmdWxsIHBpdGNoIGNvbW1hbmQgKHJhZCkuICovXG4gICAgbWF4U3RhYmlsYXRvclJhZDogbnVtYmVyO1xuICAgIC8qKiBNYXggcnVkZGVyLWVxdWl2YWxlbnQgZmluIGluY2lkZW5jZSBhdCBmdWxsIHlhdyBjb21tYW5kIChyYWQpLiAqL1xuICAgIG1heFJ1ZGRlclJhZDogbnVtYmVyO1xuICAgIC8qKiBGcmFjdGlvbiBvZiByb2xsIGNvbW1hbmQgcm91dGVkIHRvIHRoZSBkaWZmZXJlbnRpYWwgc3RhYmlsYXRvci4gKi9cbiAgICB0YWlsZXJvblJvbGxGcmFjdGlvbjogbnVtYmVyO1xuICAgIC8qKiBEaXJlY3QtbW9kZSBoYW5kbGluZyBnYWlucyAoaWdub3JlZCBpbiBmYncgbW9kZSkuICovXG4gICAgZGlyZWN0PzogRm0yRGlyZWN0RmNzQ29uZmlnO1xufVxuXG4vKiogRGlyZWN0IChtZWNoYW5pY2FsKSBjb250cm9sLWxhdyB0dW5pbmcuICovXG5leHBvcnQgaW50ZXJmYWNlIEZtMkRpcmVjdEZjc0NvbmZpZyB7XG4gICAgLyoqIFBpdGNoLXJhdGUgZGFtcGluZyAoYWJvdXQgK1gpIGZvbGRlZCBpbnRvIHRoZSBlbGV2YXRvciBjb21tYW5kLiAqL1xuICAgIHBpdGNoUmF0ZURhbXA6IG51bWJlcjtcbiAgICAvKiogUm9sbC1yYXRlIGRhbXBpbmcgKGFib3V0ICtaKSBmb2xkZWQgaW50byB0aGUgYWlsZXJvbiBjb21tYW5kLiAqL1xuICAgIHJvbGxSYXRlRGFtcDogbnVtYmVyO1xuICAgIC8qKiBXYXNoZWQtb3V0IHlhdy1yYXRlIGRhbXBlciBnYWluLiAqL1xuICAgIHlhd0RhbXBlckdhaW46IG51bWJlcjtcbiAgICB5YXdEYW1wZXJXYXNob3V0VGF1UzogbnVtYmVyO1xuICAgIC8qKiBBaWxlcm9u4oaScnVkZGVyIGludGVyY29ubmVjdCBmb3IgdHVybiBjb29yZGluYXRpb24uICovXG4gICAgYXJpR2FpbjogbnVtYmVyO1xuICAgIC8qKiBGaXJzdC1vcmRlciBhY3R1YXRvciBsYWcgKHMpLiAqL1xuICAgIGFjdHVhdG9yVGF1UzogbnVtYmVyO1xufVxuXG4vKiogU3BlZWQgLyBzdGFsbCAvIHRvdWNoZG93biBlbnZlbG9wZS4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRm0yRW52ZWxvcGVDb25maWcge1xuICAgIHN0YWxsQW9hUmFkOiBudW1iZXI7XG4gICAgbWluRmx5aW5nU3BlZWRNcHM6IG51bWJlcjtcbiAgICAvKiogUmVmZXJlbmNlIGNydWlzZSBjb25kaXRpb24gdXNlZCB0byBub3JtYWxpemUgRkJXIGR5bmFtaWMtcHJlc3N1cmUgZmFkZXMuICovXG4gICAgY3J1aXNlQWx0aXR1ZGVNOiBudW1iZXI7XG4gICAgY3J1aXNlU3BlZWRNcHM6IG51bWJlcjtcbiAgICBtYXhMb2FkRmFjdG9yRzogbnVtYmVyO1xuICAgIGxhbmRpbmdNYXhTcGVlZE1wczogbnVtYmVyO1xuICAgIGxhbmRpbmdNYXhWZXJ0aWNhbFNwZWVkTXBzOiBudW1iZXI7XG4gICAgbGFuZGluZ01pblBpdGNoUmFkOiBudW1iZXI7XG4gICAgbGFuZGluZ01heFJvbGxSYWQ6IG51bWJlcjtcbn1cblxuLyoqIEV2ZXJ5dGhpbmcgdGhlIEZNMiBtb2RlbCBuZWVkcyB0byBmbHkgb25lIHNwZWNpZmljIGFpcmZyYW1lLiAqL1xuZXhwb3J0IGludGVyZmFjZSBGbTJBaXJjcmFmdENvbmZpZyB7XG4gICAgZ2VvbWV0cnk6IEZtMkdlb21ldHJ5Q29uZmlnO1xuICAgIGluZXJ0aWE6IEZtMkluZXJ0aWFDb25maWc7XG4gICAgc3VyZmFjZXM6IEZtMlN1cmZhY2VTZXQ7XG4gICAgYWlsZXJvbk1heERlZmxlY3Rpb25SYWQ6IG51bWJlcjtcbiAgICBmbGFwczogRm0yRmxhcHNDb25maWc7XG4gICAgZ2VhckNkOiBudW1iZXI7XG4gICAgYm9keUNkMDogbnVtYmVyO1xuICAgIHdhdmVEcmFnOiBGbTJXYXZlRHJhZ0NvbmZpZztcbiAgICBnZWFyOiBGbTJHZWFyQ29uZmlnO1xuICAgIGVuZ2luZTogRm0yRW5naW5lQ29uZmlnO1xuICAgIGZjczogRm0yRmNzQ29uZmlnO1xuICAgIGVudmVsb3BlOiBGbTJFbnZlbG9wZUNvbmZpZztcbn1cblxuLyoqXG4gKiBUaGUgRi0xNkMsIGFzc2VtYmxlZCBmcm9tIHRoZSBleGlzdGluZyBGTTIgY29uc3RhbnQgdGFibGVzLiBVc2luZyB0aGlzIGNvbmZpZ1xuICogcmVwcm9kdWNlcyB0aGUgcHJldmlvdXMgaGFyZC1jb2RlZCBtb2RlbCBleGFjdGx5IChyZWdyZXNzaW9uIGd1YXJkIGZvciB0aGVcbiAqIGRlZmF1bHQgcGxheWVyIGFpcmNyYWZ0KS5cbiAqL1xuZXhwb3J0IGNvbnN0IGYxNkZtMkNvbmZpZzogRm0yQWlyY3JhZnRDb25maWcgPSB7XG4gICAgZ2VvbWV0cnk6IHtcbiAgICAgICAgbWFzc0tnOiBGTTJfR0VPTUVUUlkubWFzc0tnLFxuICAgICAgICB3aW5nQXJlYU0yOiBGTTJfR0VPTUVUUlkud2luZ0FyZWFNMixcbiAgICAgICAgd2luZ1NwYW5NOiBGTTJfR0VPTUVUUlkud2luZ1NwYW5NLFxuICAgICAgICBtZWFuQ2hvcmRNOiBGTTJfR0VPTUVUUlkubWVhbkNob3JkTSxcbiAgICB9LFxuICAgIGluZXJ0aWE6IHtcbiAgICAgICAgcGl0Y2g6IEZNMl9JTkVSVElBLnBpdGNoLFxuICAgICAgICB5YXc6IEZNMl9JTkVSVElBLnlhdyxcbiAgICAgICAgcm9sbDogRk0yX0lORVJUSUEucm9sbCxcbiAgICB9LFxuICAgIHN1cmZhY2VzOiB7XG4gICAgICAgIGZ1c2VsYWdlOiBGTTJfU1VSRkFDRVMuZnVzZWxhZ2UsXG4gICAgICAgIHdpbmdMZWZ0OiBGTTJfU1VSRkFDRVMud2luZ0xlZnQsXG4gICAgICAgIHdpbmdSaWdodDogRk0yX1NVUkZBQ0VTLndpbmdSaWdodCxcbiAgICAgICAgaHRhaWxMZWZ0OiBGTTJfU1VSRkFDRVMuaHRhaWxMZWZ0LFxuICAgICAgICBodGFpbFJpZ2h0OiBGTTJfU1VSRkFDRVMuaHRhaWxSaWdodCxcbiAgICAgICAgdnRhaWw6IEZNMl9TVVJGQUNFUy52dGFpbCxcbiAgICB9LFxuICAgIGFpbGVyb25NYXhEZWZsZWN0aW9uUmFkOiBGTTJfQUlMRVJPTi5tYXhEZWZsZWN0aW9uUmFkLFxuICAgIGZsYXBzOiB7XG4gICAgICAgIGFvYUJpYXNSYWQ6IEZNMl9GTEFQUy5hb2FCaWFzUmFkLFxuICAgICAgICBzdGFsbFJlZHVjdGlvblJhZDogRk0yX0ZMQVBTLnN0YWxsUmVkdWN0aW9uUmFkLFxuICAgICAgICBleHRyYUNkOiBGTTJfRkxBUFMuZXh0cmFDZCxcbiAgICB9LFxuICAgIGdlYXJDZDogRk0yX0dFQVJfQ0QsXG4gICAgYm9keUNkMDogRk0yX0JPRFlfQ0QwLFxuICAgIHdhdmVEcmFnOiB7IG1hY2hPbnNldDogRk0yX1dBVkVfRFJBRy5tYWNoT25zZXQsIHNjYWxlOiBGTTJfV0FWRV9EUkFHLnNjYWxlIH0sXG4gICAgZ2Vhcjoge1xuICAgICAgICBwb2ludHM6IFtcbiAgICAgICAgICAgIFswLjAsIC1QTEFORV9ESVNUQU5DRV9UT19HUk9VTkQsIDIuNl0sICAgLy8gbm9zZVxuICAgICAgICAgICAgWy0xLjIsIC1QTEFORV9ESVNUQU5DRV9UT19HUk9VTkQsIC0wLjZdLCAvLyBsZWZ0IG1haW5cbiAgICAgICAgICAgIFsxLjIsIC1QTEFORV9ESVNUQU5DRV9UT19HUk9VTkQsIC0wLjZdLCAgLy8gcmlnaHQgbWFpblxuICAgICAgICBdLFxuICAgICAgICBzdGlmZm5lc3M6IDQuMGU2LFxuICAgICAgICBkYW1waW5nOiAxLjZlNSxcbiAgICAgICAgcm9sbEZyaWN0aW9uOiAwLjA0LFxuICAgICAgICBicmFrZUZyaWN0aW9uOiAwLjU1LFxuICAgICAgICBzaWRlRnJpY3Rpb246IDAuOCxcbiAgICB9LFxuICAgIGVuZ2luZToge1xuICAgICAgICBhZnRlcmJ1cm5lcjogdHJ1ZSxcbiAgICAgICAgaWRsZVRocnVzdEtuOiAwLjUsXG4gICAgICAgIG1pbFRocnVzdEtuOiA3Ni4zLFxuICAgICAgICBhYk1pblRocnVzdEtuOiAxMDQuMCxcbiAgICAgICAgYWJNYXhUaHJ1c3RLbjogRjE2X1BST0ZJTEUuYWJUaHJ1c3RLbixcbiAgICAgICAgbWlsTGV2ZXJFbmQ6IEYxNl9QUk9GSUxFLm1pbExldmVyRW5kLFxuICAgICAgICBhYk1pbkxldmVyRW5kOiBGMTZfUFJPRklMRS5hYk1pbkxldmVyRW5kLFxuICAgIH0sXG4gICAgZmNzOiB7XG4gICAgICAgIG1vZGU6ICdmYncnLFxuICAgICAgICBtYXhTdGFiaWxhdG9yUmFkOiBGTTJfRkNTLm1heFN0YWJpbGF0b3JSYWQsXG4gICAgICAgIG1heFJ1ZGRlclJhZDogMjIgKiBERUcsXG4gICAgICAgIHRhaWxlcm9uUm9sbEZyYWN0aW9uOiBGTTJfRkNTLnRhaWxlcm9uUm9sbEZyYWN0aW9uLFxuICAgIH0sXG4gICAgZW52ZWxvcGU6IHtcbiAgICAgICAgc3RhbGxBb2FSYWQ6IEYxNl9QUk9GSUxFLnN0YWxsQW9hRGVnICogREVHLFxuICAgICAgICBtaW5GbHlpbmdTcGVlZE1wczogRjE2X1BST0ZJTEUubWluRmx5aW5nU3BlZWRNcHMsXG4gICAgICAgIGNydWlzZUFsdGl0dWRlTTogRjE2X1BST0ZJTEUuY3J1aXNlQWx0aXR1ZGVNLFxuICAgICAgICBjcnVpc2VTcGVlZE1wczogRjE2X1BST0ZJTEUuY3J1aXNlU3BlZWRNcHMsXG4gICAgICAgIG1heExvYWRGYWN0b3JHOiBGMTZfUFJPRklMRS5tYXhMb2FkRmFjdG9yRyxcbiAgICAgICAgbGFuZGluZ01heFNwZWVkTXBzOiBGMTZfUFJPRklMRS5sYW5kaW5nTWF4U3BlZWRNcHMsXG4gICAgICAgIGxhbmRpbmdNYXhWZXJ0aWNhbFNwZWVkTXBzOiBGMTZfUFJPRklMRS5sYW5kaW5nTWF4VmVydGljYWxTcGVlZE1wcyxcbiAgICAgICAgbGFuZGluZ01pblBpdGNoUmFkOiBGMTZfUFJPRklMRS5sYW5kaW5nTWluUGl0Y2hEZWcgKiBERUcsXG4gICAgICAgIGxhbmRpbmdNYXhSb2xsUmFkOiBGMTZfUFJPRklMRS5sYW5kaW5nTWF4Um9sbERlZyAqIERFRyxcbiAgICB9LFxufTtcbiIsIi8qKlxuICogR2VuZXJpYyA2LURPRiByaWdpZCBib2R5IGludGVncmF0b3IgKE5ld3RvbuKAk0V1bGVyKS5cbiAqXG4gKiBUcmFuc2xhdGlvbmFsIGR5bmFtaWNzIGFyZSBpbnRlZ3JhdGVkIGluIHRoZSBXT1JMRCBmcmFtZSAoc28gdGhlIHJlc3VsdCBtYXBzXG4gKiBkaXJlY3RseSBvbnRvIHRoZSBzaW0ncyB3b3JsZC1zcGFjZSB2ZWxvY2l0eS9wb3NpdGlvbikuIFJvdGF0aW9uYWwgZHluYW1pY3NcbiAqIGFyZSBpbnRlZ3JhdGVkIGluIHRoZSBCT0RZIGZyYW1lLCB3aGljaCBpcyB0aGUgbmF0dXJhbCBmcmFtZSBmb3IgdGhlIGluZXJ0aWFcbiAqIHRlbnNvciBhbmQgZm9yIEV1bGVyJ3MgZXF1YXRpb246XG4gKlxuICogICAgIEkgwrcgz4nMhyA9IE0g4oiSIM+JIMOXIChJIMK3IM+JKVxuICpcbiAqIHdpdGggYSBkaWFnb25hbCBpbmVydGlhIHRlbnNvciBJID0gZGlhZyhJeCwgSXksIEl6KS4gVGhlIM+JIMOXIChJwrfPiSlcbiAqIGd5cm9zY29waWMgdGVybSBjb3VwbGVzIHRoZSBheGVzIGFuZCByZXByb2R1Y2VzIGVmZmVjdHMgc3VjaCBhcyBpbmVydGlhbFxuICogcGl0Y2gtdXAgaW4gYSByb2xsaW5nIHB1bGwuIE9yaWVudGF0aW9uIGlzIGFkdmFuY2VkIGJ5IGNvbXBvc2luZyB0aGUgYm9keVxuICogcXVhdGVybmlvbiB3aXRoIHRoZSBpbmNyZW1lbnRhbCByb3RhdGlvbiBleHAowr0gz4kgZHQpLlxuICovXG5pbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW5lcnRpYURpYWdvbmFsIHtcbiAgICAvKiogTW9tZW50IG9mIGluZXJ0aWEgYWJvdXQgYm9keSArWCAoUklHSFQgLyBwaXRjaCBheGlzKS4gKi9cbiAgICB4OiBudW1iZXI7XG4gICAgLyoqIE1vbWVudCBvZiBpbmVydGlhIGFib3V0IGJvZHkgK1kgKFVQIC8geWF3IGF4aXMpLiAqL1xuICAgIHk6IG51bWJlcjtcbiAgICAvKiogTW9tZW50IG9mIGluZXJ0aWEgYWJvdXQgYm9keSArWiAoRk9SV0FSRCAvIHJvbGwgYXhpcykuICovXG4gICAgejogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgUmlnaWRCb2R5IHtcbiAgICByZWFkb25seSBtYXNzOiBudW1iZXI7XG4gICAgcmVhZG9ubHkgaW5lcnRpYTogSW5lcnRpYURpYWdvbmFsO1xuXG4gICAgLyoqIE9yaWVudGF0aW9uOiBib2R5IOKGkiB3b3JsZC4gKi9cbiAgICByZWFkb25seSBvcmllbnRhdGlvbiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG4gICAgLyoqIExpbmVhciB2ZWxvY2l0eSwgd29ybGQgZnJhbWUgKG0vcykuICovXG4gICAgcmVhZG9ubHkgdmVsb2NpdHlXb3JsZCA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgLyoqIEFuZ3VsYXIgdmVsb2NpdHksIGJvZHkgZnJhbWUgKHJhZC9zKTogKHBpdGNoLCB5YXcsIHJvbGwpIGFib3V0IChYLCBZLCBaKS4gKi9cbiAgICByZWFkb25seSBhbmd1bGFyVmVsb2NpdHlCb2R5ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuICAgIHByaXZhdGUgcmVhZG9ubHkgX2l3ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9neXJvID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9hbmdBY2NlbCA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSByZWFkb25seSBfZHEgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgX2F4aXMgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG4gICAgY29uc3RydWN0b3IobWFzczogbnVtYmVyLCBpbmVydGlhOiBJbmVydGlhRGlhZ29uYWwpIHtcbiAgICAgICAgdGhpcy5tYXNzID0gbWFzcztcbiAgICAgICAgdGhpcy5pbmVydGlhID0gaW5lcnRpYTtcbiAgICB9XG5cbiAgICByZXNldCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5vcmllbnRhdGlvbi5pZGVudGl0eSgpO1xuICAgICAgICB0aGlzLnZlbG9jaXR5V29ybGQuc2V0KDAsIDAsIDApO1xuICAgICAgICB0aGlzLmFuZ3VsYXJWZWxvY2l0eUJvZHkuc2V0KDAsIDAsIDApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkdmFuY2UgdGhlIHJvdGF0aW9uYWwgc3RhdGUuXG4gICAgICogQHBhcmFtIG1vbWVudEJvZHkgTmV0IG1vbWVudCBhYm91dCB0aGUgQ0csIGJvZHkgZnJhbWUgKE7Ct20pLlxuICAgICAqIEBwYXJhbSBkdCAgICAgICAgIFRpbWVzdGVwIChzKS5cbiAgICAgKi9cbiAgICBpbnRlZ3JhdGVBbmd1bGFyKG1vbWVudEJvZHk6IFRIUkVFLlZlY3RvcjMsIGR0OiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgdyA9IHRoaXMuYW5ndWxhclZlbG9jaXR5Qm9keTtcbiAgICAgICAgY29uc3QgSSA9IHRoaXMuaW5lcnRpYTtcblxuICAgICAgICAvLyBJz4kgYW5kIHRoZSBneXJvc2NvcGljIHRlcm0gz4kgw5cgKEnPiSkuXG4gICAgICAgIHRoaXMuX2l3LnNldChJLnggKiB3LngsIEkueSAqIHcueSwgSS56ICogdy56KTtcbiAgICAgICAgdGhpcy5fZ3lyby5jcm9zc1ZlY3RvcnModywgdGhpcy5faXcpO1xuXG4gICAgICAgIC8vIM+JzIcgPSBJ4oG7wrkgKE0g4oiSIM+JIMOXIEnPiSlcbiAgICAgICAgdGhpcy5fYW5nQWNjZWwuc2V0KFxuICAgICAgICAgICAgKG1vbWVudEJvZHkueCAtIHRoaXMuX2d5cm8ueCkgLyBJLngsXG4gICAgICAgICAgICAobW9tZW50Qm9keS55IC0gdGhpcy5fZ3lyby55KSAvIEkueSxcbiAgICAgICAgICAgIChtb21lbnRCb2R5LnogLSB0aGlzLl9neXJvLnopIC8gSS56LFxuICAgICAgICApO1xuXG4gICAgICAgIHcuYWRkU2NhbGVkVmVjdG9yKHRoaXMuX2FuZ0FjY2VsLCBkdCk7XG5cbiAgICAgICAgLy8gQWR2YW5jZSBvcmllbnRhdGlvbiBieSB0aGUgaW5jcmVtZW50YWwgYm9keS1mcmFtZSByb3RhdGlvbi5cbiAgICAgICAgY29uc3Qgb21lZ2EgPSB3Lmxlbmd0aCgpO1xuICAgICAgICBpZiAob21lZ2EgPiAxZS05KSB7XG4gICAgICAgICAgICB0aGlzLl9heGlzLmNvcHkodykubXVsdGlwbHlTY2FsYXIoMSAvIG9tZWdhKTtcbiAgICAgICAgICAgIHRoaXMuX2RxLnNldEZyb21BeGlzQW5nbGUodGhpcy5fYXhpcywgb21lZ2EgKiBkdCk7XG4gICAgICAgICAgICB0aGlzLm9yaWVudGF0aW9uLm11bHRpcGx5KHRoaXMuX2RxKTsgLy8gYm9keS1mcmFtZSBkZWx0YSBhcHBsaWVkIG9uIHRoZSByaWdodFxuICAgICAgICAgICAgdGhpcy5vcmllbnRhdGlvbi5ub3JtYWxpemUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkdmFuY2UgdGhlIHRyYW5zbGF0aW9uYWwgc3RhdGUuXG4gICAgICogQHBhcmFtIGZvcmNlV29ybGQgTmV0IGZvcmNlIGluIHRoZSB3b3JsZCBmcmFtZSAoTiksIGdyYXZpdHkgaW5jbHVkZWQuXG4gICAgICogQHBhcmFtIGR0ICAgICAgICAgVGltZXN0ZXAgKHMpLlxuICAgICAqIEBwYXJhbSBvdXRQb3NpdGlvbiBQb3NpdGlvbiBhY2N1bXVsYXRvciB0byBhZHZhbmNlICh3b3JsZCwgbSkuXG4gICAgICovXG4gICAgaW50ZWdyYXRlTGluZWFyKGZvcmNlV29ybGQ6IFRIUkVFLlZlY3RvcjMsIGR0OiBudW1iZXIsIG91dFBvc2l0aW9uOiBUSFJFRS5WZWN0b3IzKTogdm9pZCB7XG4gICAgICAgIC8vIGEgPSBGIC8gbSA7IHNlbWktaW1wbGljaXQgRXVsZXIgKHVwZGF0ZSB2ZWxvY2l0eSwgdGhlbiBwb3NpdGlvbikuXG4gICAgICAgIHRoaXMudmVsb2NpdHlXb3JsZC5hZGRTY2FsZWRWZWN0b3IoZm9yY2VXb3JsZCwgZHQgLyB0aGlzLm1hc3MpO1xuICAgICAgICBvdXRQb3NpdGlvbi5hZGRTY2FsZWRWZWN0b3IodGhpcy52ZWxvY2l0eVdvcmxkLCBkdCk7XG4gICAgfVxufVxuIiwiaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuaW1wb3J0IHsgUElUQ0hfUkFURSwgUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5ELCBST0xMX1JBVEUsIFlBV19SQVRFIH0gZnJvbSBcIi4uLy4uL2RlZnNcIjtcbmltcG9ydCB7IEZPUldBUkQsIFBJX09WRVJfMTgwLCBSSUdIVCwgVVAsIFpFUk8sIGNhbGN1bGF0ZVBpdGNoUm9sbCwgY2xhbXAsIGVhc2VPdXRDaXJjLCBpc1plcm8sIHJvdW5kVG9aZXJvIH0gZnJvbSAnLi4vLi4vdXRpbHMvbWF0aCc7XG5pbXBvcnQgeyBGbGlnaHRNb2RlbCB9IGZyb20gJy4vZmxpZ2h0TW9kZWwnO1xuXG5cbmNvbnN0IFRVUk5JTkdfUkFURSA9IE1hdGguUEkgKiAxLjU7IC8vIFJhZGlhbnMvc2Vjb25kXG5jb25zdCBTVEFMTF9SQVRFID0gTWF0aC5QSSAvIDY7IC8vIFJhZGlhbnMvc2Vjb25kXG5jb25zdCBJTkRVQ0VEX0RSQUdfRkFDVE9SID0gMTAuMDsgLy8gVW5pdGxlc3NcbmNvbnN0IFJPTExfRFJBR19GQUNUT1IgPSAwLjA1OyAvLyBVbml0bGVzc1xuY29uc3QgR1JPVU5EX0ZSSUNUSU9OX0tJTkVUSUMgPSAwLjE1OyAvLyBVbml0bGVzc1xuY29uc3QgR1JPVU5EX0ZSSUNUSU9OX1NUQVRJQyA9IDAuMjsgLy8gVW5pdGxlc3NcbmNvbnN0IEdST1VORF9CUkFLRV9LSU5FVElDID0gMS44O1xuY29uc3QgR1JPVU5EX0JSQUtFX1NUQVRJQyA9IDEuMTc7XG5jb25zdCBUSFJPVFRMRV9VUF9SQVRFID0gMC4wMjsgLy8gVW5pdHMvc2Vjb25kXG5jb25zdCBUSFJPVFRMRV9ET1dOX1JBVEUgPSAwLjA3OyAvLyBVbml0cy9zZWNvbmRcbmNvbnN0IFlBV19SQVRFX0xBTkRFRCA9IFlBV19SQVRFICogMi4wOyAvLyBSYWRpYW5zL3NlY29uZFxuXG5jb25zdCBNQVhfVEhSVVNUID0gMjA7IC8vIG0vc14yXG5jb25zdCBEUllfTUFTUzogbnVtYmVyID0gMjAwMDA7IC8vIGtnXG5jb25zdCBXSU5HX0FSRUE6IG51bWJlciA9IDc4OyAvLyBtXjJcbmNvbnN0IEdST1VORF9BSVJfREVOU0lUWTogbnVtYmVyID0gMS4yMjU7IC8vIGtnL21eM1xuY29uc3QgR1JBVklUWTogbnVtYmVyID0gOS44OyAvLyBtL3NeMlxuY29uc3QgQ0Q6IG51bWJlciA9IDAuMTU7IC8vIFVuaXRsZXNzXG5jb25zdCBDRF9MQU5ESU5HX0dFQVJfRkFDVE9SID0gMC43NTsgLy8gVW5pdGxlc3MsIGFkZGl0aXZlXG5jb25zdCBDRF9GTEFQU19GQUNUT1IgPSAwLjQ7IC8vIFVuaXRsZXNzLCBhZGRpdGl2ZVxuY29uc3QgTElGVF9GTEFQU19GQUNUT1IgPSAxLjI7IC8vIFVuaXRsZXNzXG5jb25zdCBST0xMX0ZMQVBTX0ZBQ1RPUiA9IDAuNjsgLy8gVW5pdGxlc3NcblxuY29uc3QgTEFOREVEX01BWF9TUEVFRCA9IDEwMDsgLy8gbS9zXG5jb25zdCBMQU5ESU5HX01BWF9WU1BFRUQgPSA1OyAvLyBtL3NcbmNvbnN0IExBTkRJTkdfTUlOX1BJVENIID0gLTUgKiBQSV9PVkVSXzE4MDsgLy8gUmFkaWFuc1xuY29uc3QgTEFORElOR19NQVhfUk9MTCA9IDUgKiBQSV9PVkVSXzE4MDsgLy8gUmFkaWFuc1xuXG5leHBvcnQgY2xhc3MgQXJjYWRlRmxpZ2h0TW9kZWwgZXh0ZW5kcyBGbGlnaHRNb2RlbCB7XG5cbiAgICBwcml2YXRlIHN0YWxsOiBudW1iZXIgPSAwO1xuXG4gICAgcHJpdmF0ZSBfdjogVEhSRUUuVmVjdG9yMyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSBfcTA6IFRIUkVFLlF1YXRlcm5pb24gPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuICAgIHByaXZhdGUgX3ExOiBUSFJFRS5RdWF0ZXJuaW9uID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcbiAgICBwcml2YXRlIF9tOiBUSFJFRS5NYXRyaXg0ID0gbmV3IFRIUkVFLk1hdHJpeDQoKTtcblxuICAgIHByaXZhdGUgZHJhZzogVEhSRUUuVmVjdG9yMyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7IC8vIE5cbiAgICBwcml2YXRlIHRocnVzdDogVEhSRUUuVmVjdG9yMyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7IC8vIE5cbiAgICBwcml2YXRlIHdlaWdodDogVEhSRUUuVmVjdG9yMyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7IC8vIE5cbiAgICBwcml2YXRlIGZyaWN0aW9uOiBUSFJFRS5WZWN0b3IzID0gbmV3IFRIUkVFLlZlY3RvcjMoKTsgLy8gTlxuICAgIHByaXZhdGUgZm9yY2VzOiBUSFJFRS5WZWN0b3IzID0gbmV3IFRIUkVFLlZlY3RvcjMoKTsgLy8gTlxuXG4gICAgcHJpdmF0ZSBmb3J3YXJkOiBUSFJFRS5WZWN0b3IzID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHVwOiBUSFJFRS5WZWN0b3IzID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJpZ2h0OiBUSFJFRS5WZWN0b3IzID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuICAgIHByaXZhdGUgcHJqRm9yd2FyZDogVEhSRUUuVmVjdG9yMyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSB2ZWxvY2l0eVVuaXQ6IFRIUkVFLlZlY3RvcjMgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMub2JqLnVwLmNvcHkoVVApO1xuICAgIH1cblxuICAgIHN0ZXAoZGVsdGE6IG51bWJlcik6IHZvaWQge1xuXG4gICAgICAgIGlmICh0aGlzLmNyYXNoZWQpIHJldHVybjtcblxuICAgICAgICBpZiAodGhpcy5lZmZlY3RpdmVUaHJvdHRsZSA+IHRoaXMudGhyb3R0bGUpIHtcbiAgICAgICAgICAgIHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgPSBNYXRoLm1heCh0aGlzLnRocm90dGxlLCB0aGlzLmVmZmVjdGl2ZVRocm90dGxlIC0gVEhST1RUTEVfRE9XTl9SQVRFICogZGVsdGEpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgPCB0aGlzLnRocm90dGxlKSB7XG4gICAgICAgICAgICB0aGlzLmVmZmVjdGl2ZVRocm90dGxlID0gTWF0aC5taW4odGhpcy50aHJvdHRsZSwgdGhpcy5lZmZlY3RpdmVUaHJvdHRsZSArIFRIUk9UVExFX1VQX1JBVEUgKiBkZWx0YSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmZvcndhcmQgPSB0aGlzLmZvcndhcmQuY29weShGT1JXQVJEKS5hcHBseVF1YXRlcm5pb24odGhpcy5vYmoucXVhdGVybmlvbik7XG4gICAgICAgIHRoaXMudXAgPSB0aGlzLnVwLmNvcHkoVVApLmFwcGx5UXVhdGVybmlvbih0aGlzLm9iai5xdWF0ZXJuaW9uKTtcbiAgICAgICAgdGhpcy5yaWdodCA9IHRoaXMucmlnaHQuY29weShSSUdIVCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMub2JqLnF1YXRlcm5pb24pO1xuXG4gICAgICAgIHRoaXMucHJqRm9yd2FyZCA9IHRoaXMucHJqRm9yd2FyZC5jb3B5KHRoaXMuZm9yd2FyZCkuc2V0WSgwKTtcbiAgICAgICAgdGhpcy52ZWxvY2l0eVVuaXQgPSB0aGlzLnZlbG9jaXR5VW5pdC5jb3B5KHRoaXMudmVsb2NpdHkpLm5vcm1hbGl6ZSgpO1xuXG4gICAgICAgIGNvbnN0IGFpckRlbnNpdHk6IG51bWJlciA9IEdST1VORF9BSVJfREVOU0lUWSAqIE1hdGguZXhwKC10aGlzLm9iai5wb3NpdGlvbi55IC8gODAwMCk7IC8vIGtnL21eM1xuICAgICAgICAvLyBUYWtlIGludG8gYWNjb3VudCBsb3dlciBhaXIgdGVtcGVyYXR1cmUgYXQgaGlnaGVyIGFsdGl0dWRlc1xuICAgICAgICBjb25zdCB0aHJ1c3REZW5zaXR5OiBudW1iZXIgPSBHUk9VTkRfQUlSX0RFTlNJVFkgKiBNYXRoLmV4cCgtdGhpcy5vYmoucG9zaXRpb24ueSAqIDAuMjUgLyA4MDAwKTsgLy8ga2cvbV4zXG4gICAgICAgIGNvbnN0IHNwZWVkID0gdGhpcy52ZWxvY2l0eS5sZW5ndGgoKTsgLy8gbS9zXG5cbiAgICAgICAgY29uc3QgcmlnaHRQcmpWZWxvY2l0eSA9IHRoaXMuX3YuY29weSh0aGlzLnZlbG9jaXR5VW5pdCkucHJvamVjdE9uUGxhbmUodGhpcy5yaWdodCk7XG4gICAgICAgIGNvbnN0IGFvYUFuZ2xlID0gcmlnaHRQcmpWZWxvY2l0eS5hbmdsZVRvKHRoaXMuZm9yd2FyZCk7XG4gICAgICAgIGNvbnN0IGFvYVNpZ24gPSByaWdodFByalZlbG9jaXR5LmNyb3NzKHRoaXMuZm9yd2FyZCkuZG90KHRoaXMucmlnaHQpID4gMCA/IC0xIDogMTtcbiAgICAgICAgY29uc3QgYW9hID0gYW9hU2lnbiAqIGFvYUFuZ2xlO1xuXG4gICAgICAgIC8vIFJvbGwgY29udHJvbFxuICAgICAgICBpZiAoIWlzWmVybyh0aGlzLnJvbGwpICYmICF0aGlzLmxhbmRlZCkge1xuICAgICAgICAgICAgY29uc3Qgcm9sbEZsYXBGYWN0b3IgPSB0aGlzLmZsYXBzRXh0ZW5kZWQgPyBST0xMX0ZMQVBTX0ZBQ1RPUiA6IDEuMDtcbiAgICAgICAgICAgIHRoaXMub2JqLnJvdGF0ZVoodGhpcy5yb2xsICogUk9MTF9SQVRFICogcm9sbEZsYXBGYWN0b3IgKiBkZWx0YSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQaXRjaCBjb250cm9sXG4gICAgICAgIGlmICghaXNaZXJvKHRoaXMucGl0Y2gpXG4gICAgICAgICAgICAmJiAhKHRoaXMubGFuZGVkICYmIHRoaXMucGl0Y2ggPCAwKSAvLyBDYW4ndCBwaXRjaCBkb3duIHdoZW4gbGFuZGVkXG4gICAgICAgICAgICAmJiAoXG4gICAgICAgICAgICAgICAgdGhpcy5zdGFsbCA8IDAgfHwgLy8gQ2FuIGRvIGFueXRoaW5nIHdoZW4gZmx5aW5nIGFuZCBubyBzdGFsbGluZ1xuICAgICAgICAgICAgICAgICh0aGlzLnBpdGNoIDwgMCAmJiB0aGlzLnVwLnkgPiAwKSB8fCAvLyBDYW4ndCBwaXRjaCB1cCB3aGVuIHN0YWxsaW5nXG4gICAgICAgICAgICAgICAgKHRoaXMucGl0Y2ggPiAwICYmIHRoaXMudXAueSA8IDApIC8vIENhbid0IHBpdGNoIHVwIHdoZW4gc3RhbGxpbmdcbiAgICAgICAgICAgIClcbiAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGlzLm9iai5yb3RhdGVYKC10aGlzLnBpdGNoICogUElUQ0hfUkFURSAqIGRlbHRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFlhdyBjb250cm9sXG4gICAgICAgIGlmICghaXNaZXJvKHRoaXMueWF3KSAmJiAhaXNaZXJvKHNwZWVkKSkge1xuICAgICAgICAgICAgdGhpcy5vYmoucm90YXRlWSgtdGhpcy55YXcgKiAodGhpcy5sYW5kZWQgPyBZQVdfUkFURV9MQU5ERUQgOiBZQVdfUkFURSkgKiBkZWx0YSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBdXRvbWF0aWMgeWF3IHdoZW4gcm9sbGluZ1xuICAgICAgICBpZiAoLTAuOTkgPCB0aGlzLmZvcndhcmQueSAmJiB0aGlzLmZvcndhcmQueSA8IDAuOTkpIHtcbiAgICAgICAgICAgIGNvbnN0IHByalVwID0gdGhpcy5fdi5jb3B5KHRoaXMudXApLnByb2plY3RPblBsYW5lKHRoaXMucHJqRm9yd2FyZCkuc2V0WSgwKTtcbiAgICAgICAgICAgIGNvbnN0IHNpZ24gPSAodGhpcy5wcmpGb3J3YXJkLnggKiBwcmpVcC56IC0gdGhpcy5wcmpGb3J3YXJkLnogKiBwcmpVcC54KSA+IDAgPyAtMSA6IDE7XG4gICAgICAgICAgICB0aGlzLm9iai5yb3RhdGVPbldvcmxkQXhpcyhVUCwgc2lnbiAqIHByalVwLmxlbmd0aCgpICogcHJqVXAubGVuZ3RoKCkgKiB0aGlzLnByakZvcndhcmQubGVuZ3RoKCkgKiAyLjAgKiBZQVdfUkFURSAqIGRlbHRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFBvaW50IGRvd24gd2hlbiBzdGFsbGluZ1xuICAgICAgICBpZiAodGhpcy5zdGFsbCA+PSAwICYmICF0aGlzLmxhbmRlZCkge1xuICAgICAgICAgICAgY29uc3QgeSA9IHRoaXMuZm9yd2FyZC55O1xuICAgICAgICAgICAgaWYgKHkgPiAtMC44KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZ3JvdW5kUmlnaHQgPSB0aGlzLl92LmNvcHkodGhpcy5mb3J3YXJkKS5jcm9zcyh0aGlzLnByakZvcndhcmQpLm5vcm1hbGl6ZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMub2JqLnJvdGF0ZU9uV29ybGRBeGlzKGdyb3VuZFJpZ2h0LCBTVEFMTF9SQVRFICogZGVsdGEgKiAoeSA+IDAgPyAxIDogLTEpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vISBUSFJVU1RcbiAgICAgICAgcm91bmRUb1plcm8odGhpcy50aHJ1c3QuY29weSh0aGlzLmZvcndhcmQpLm11bHRpcGx5U2NhbGFyKFxuICAgICAgICAgICAgdGhydXN0RGVuc2l0eSAqXG4gICAgICAgICAgICBNQVhfVEhSVVNUICpcbiAgICAgICAgICAgIHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgKlxuICAgICAgICAgICAgRFJZX01BU1MpKTtcbiAgICAgICAgdGhpcy5lbmdpbmVUaHJ1c3ROID0gdGhpcy50aHJ1c3QubGVuZ3RoKCk7XG5cbiAgICAgICAgLy8hIERSQUdcbiAgICAgICAgY29uc3QgYXJjYWRlSW5kdWNlZERyYWcgPSB0aGlzLmZvcndhcmQuZG90KHRoaXMudmVsb2NpdHlVbml0KTtcbiAgICAgICAgY29uc3QgbGlmdEluZHVjZWREcmFnID0gMSAtIE1hdGguY29zKDIuMCAqIGFvYSk7XG4gICAgICAgIGNvbnN0IHJvbGxEcmFnID0gTWF0aC5hYnModGhpcy5yaWdodC55KTtcbiAgICAgICAgY29uc3QgY2RNdWx0aXBsaWVyID0gMS4wICsgKHRoaXMubGFuZGluZ0dlYXJEZXBsb3llZCA/IENEX0xBTkRJTkdfR0VBUl9GQUNUT1IgOiAwLjApICsgKHRoaXMuZmxhcHNFeHRlbmRlZCA/IENEX0ZMQVBTX0ZBQ1RPUiA6IDAuMCk7XG4gICAgICAgIHJvdW5kVG9aZXJvKHRoaXMuZHJhZ1xuICAgICAgICAgICAgLmNvcHkodGhpcy52ZWxvY2l0eVVuaXQpXG4gICAgICAgICAgICAubmVnYXRlKClcbiAgICAgICAgICAgIC5tdWx0aXBseVNjYWxhcihcbiAgICAgICAgICAgICAgICBNYXRoLnBvdyhcbiAgICAgICAgICAgICAgICAgICAgMC41ICogKENEICogY2RNdWx0aXBsaWVyICsgbGlmdEluZHVjZWREcmFnKSAqIGFpckRlbnNpdHkgKiBzcGVlZCAqIHNwZWVkICogV0lOR19BUkVBLFxuICAgICAgICAgICAgICAgICAgICAxLjAgKyBJTkRVQ0VEX0RSQUdfRkFDVE9SICogKDEuMCAtIGFyY2FkZUluZHVjZWREcmFnKSArIFJPTExfRFJBR19GQUNUT1IgKiByb2xsRHJhZ1xuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgIClcbiAgICAgICAgKTtcblxuICAgICAgICAvLyEgTElGVFxuICAgICAgICBjb25zdCBhb2FMaWZ0ID0gMC4yICogKGFvYSA8IChNYXRoLlBJIC8gOC4wKSB8fCBhb2EgPiAoNyAqIE1hdGguUEkgLyA4LjApID8gTWF0aC5zaW4oNi4wICogYW9hKSA6IE1hdGguc2luKDIuMCAqIGFvYSkpO1xuICAgICAgICBjb25zdCBtaW5MaWZ0RmFjdG9yID0gMi4wICogKDAuNzUgKiAwLjc1ICsgMC43NSkgKiBHUk9VTkRfQUlSX0RFTlNJVFk7XG4gICAgICAgIGNvbnN0IGZ3ZFkgPSB0aGlzLmZvcndhcmQueTtcbiAgICAgICAgY29uc3QgcmlnaHRZID0gTWF0aC5hYnModGhpcy5yaWdodC55KTtcbiAgICAgICAgY29uc3QgbGlmdEZhY3RvciA9IDIgKiAoc3BlZWQgLyAyNTYuMCkgKiAoKC0wLjUgKiBmd2RZICsgMS41KSAqICgtMC41ICogcmlnaHRZICsgMS41KSArICgtMC41ICogcmlnaHRZICsgMS41KSkgKiBhaXJEZW5zaXR5O1xuICAgICAgICBjb25zdCBsaWZ0RmFjdG9yTXVsdGlwbGllciA9IHRoaXMuZmxhcHNFeHRlbmRlZCA/IExJRlRfRkxBUFNfRkFDVE9SIDogMS4wO1xuICAgICAgICB0aGlzLnN0YWxsID0gLWNsYW1wKGxpZnRGYWN0b3IgKiBsaWZ0RmFjdG9yTXVsdGlwbGllciAvIG1pbkxpZnRGYWN0b3IgKyBhb2FMaWZ0ICogKDEuMCAtIHJpZ2h0WSkgLSAxLjAsIC0xLjAsIDEuMCk7XG5cbiAgICAgICAgLy8hIFdFSUdIVFxuICAgICAgICBjb25zdCB3ZWlnaHRGd2RGYWN0b3IgPSAtdGhpcy5mb3J3YXJkLnk7XG4gICAgICAgIC8vIEFjY291bnRzIGZvciBsaWZ0LiA1MDAga25vdHMgLT4gMjU2IG0vc1xuICAgICAgICBjb25zdCB3ZWlnaHREb3duRmFjdG9yID0gLWVhc2VPdXRDaXJjKDEuMCAtIGNsYW1wKChzcGVlZCAvIDI1NikgKiAoMS4wIC0gTWF0aC5hYnModGhpcy5mb3J3YXJkLnkpICogKDEuMCAtIE1hdGguYWJzKHRoaXMucmlnaHQueSkpKSwgMCwgMSkpO1xuICAgICAgICB0aGlzLndlaWdodFxuICAgICAgICAgICAgLmNvcHkoVVApXG4gICAgICAgICAgICAubXVsdGlwbHlTY2FsYXIod2VpZ2h0RG93bkZhY3RvcilcbiAgICAgICAgICAgIC5hZGRTY2FsZWRWZWN0b3IodGhpcy5mb3J3YXJkLCB3ZWlnaHRGd2RGYWN0b3IpXG4gICAgICAgICAgICAubXVsdGlwbHlTY2FsYXIoRFJZX01BU1MgKiBHUkFWSVRZKTtcblxuICAgICAgICAvLyEgTWFnaWMgdmVsb2NpdHkgcm90YXRpb25cbiAgICAgICAgaWYgKCFpc1plcm8oc3BlZWQpKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5sYW5kZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnZlbG9jaXR5LmNvcHkodGhpcy5mb3J3YXJkKS5tdWx0aXBseVNjYWxhcihzcGVlZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFscGhhID0gdGhpcy52ZWxvY2l0eVVuaXQuYW5nbGVUbyh0aGlzLmZvcndhcmQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHR1cm5pbmdGYWN0b3IgPSBhbHBoYSAqIFRVUk5JTkdfUkFURSAqIGRlbHRhO1xuICAgICAgICAgICAgICAgIHRoaXMuX20ubG9va0F0KFpFUk8sIHRoaXMuZm9yd2FyZCwgdGhpcy51cCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcTEgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLnNldEZyb21Sb3RhdGlvbk1hdHJpeCh0aGlzLl9tKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9tLmxvb2tBdChaRVJPLCB0aGlzLnZlbG9jaXR5VW5pdCwgdGhpcy51cCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcTAgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLnNldEZyb21Sb3RhdGlvbk1hdHJpeCh0aGlzLl9tKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9xMC5yb3RhdGVUb3dhcmRzKHRoaXMuX3ExLCB0dXJuaW5nRmFjdG9yKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9xMS5zZXRGcm9tUm90YXRpb25NYXRyaXgodGhpcy5fbS5pbnZlcnQoKSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fdi5jb3B5KHRoaXMudmVsb2NpdHlVbml0KVxuICAgICAgICAgICAgICAgICAgICAuYXBwbHlRdWF0ZXJuaW9uKHRoaXMuX3ExKVxuICAgICAgICAgICAgICAgICAgICAuYXBwbHlRdWF0ZXJuaW9uKHRoaXMuX3EwKTtcbiAgICAgICAgICAgICAgICB0aGlzLnZlbG9jaXR5LmNvcHkodGhpcy5fdikubXVsdGlwbHlTY2FsYXIoc3BlZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8hIEFsbCBmb3JjZXNcbiAgICAgICAgdGhpcy5mb3JjZXMuc2V0KDAsIDAsIDApLmFkZCh0aGlzLnRocnVzdCkuYWRkKHRoaXMuZHJhZykuYWRkKHRoaXMud2VpZ2h0KTtcblxuICAgICAgICAvLyEgRlJJQ1RJT05cbiAgICAgICAgY29uc3Qgb25Hcm91bmQgPSB0aGlzLm9iai5wb3NpdGlvbi55IDw9IFBMQU5FX0RJU1RBTkNFX1RPX0dST1VORCArIDAuMDU7XG4gICAgICAgIGlmICh0aGlzLmxhbmRlZCB8fCAodGhpcy53aGVlbEJyYWtlc0FwcGxpZWQgJiYgb25Hcm91bmQpKSB7XG4gICAgICAgICAgICBjb25zdCB3ZWlnaHRNYWduaXR1ZGUgPSBEUllfTUFTUyAqIEdSQVZJVFk7XG4gICAgICAgICAgICBjb25zdCBwcmpGb3JjZXMgPSB0aGlzLl92LmNvcHkodGhpcy5mb3JjZXMpLnNldFkoMCk7XG4gICAgICAgICAgICBjb25zdCBwcmpGb3JjZXNNYWduaXR1ZGUgPSBwcmpGb3JjZXMubGVuZ3RoKCk7XG4gICAgICAgICAgICBjb25zdCBtYXhTdGF0aWNGcmljdGlvbiA9ICh0aGlzLndoZWVsQnJha2VzQXBwbGllZCA/IEdST1VORF9CUkFLRV9TVEFUSUMgOiBHUk9VTkRfRlJJQ1RJT05fU1RBVElDKSAqIHdlaWdodE1hZ25pdHVkZTtcbiAgICAgICAgICAgIGNvbnN0IGtpbmV0aWNGcmljdGlvbiA9ICh0aGlzLndoZWVsQnJha2VzQXBwbGllZCA/IEdST1VORF9CUkFLRV9LSU5FVElDIDogR1JPVU5EX0ZSSUNUSU9OX0tJTkVUSUMpICogd2VpZ2h0TWFnbml0dWRlO1xuXG4gICAgICAgICAgICBpZiAoKGlzWmVybyhzcGVlZCkgJiYgcHJqRm9yY2VzTWFnbml0dWRlIDwgbWF4U3RhdGljRnJpY3Rpb24pKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5mcmljdGlvbi5jb3B5KHByakZvcmNlcykubmVnYXRlKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZnJpY3Rpb24uY29weSh0aGlzLnZlbG9jaXR5VW5pdCkuc2V0WSgwKS5uZWdhdGUoKS5ub3JtYWxpemUoKS5tdWx0aXBseVNjYWxhcihraW5ldGljRnJpY3Rpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcm91bmRUb1plcm8odGhpcy5mcmljdGlvbik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmZyaWN0aW9uLnNldCgwLCAwLCAwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vISBUaW1lc3RlcFxuICAgICAgICBjb25zdCBhY2NlbCA9IHJvdW5kVG9aZXJvKHRoaXMuZm9yY2VzLmFkZCh0aGlzLmZyaWN0aW9uKS5kaXZpZGVTY2FsYXIoRFJZX01BU1MpKTtcbiAgICAgICAgdGhpcy52ZWxvY2l0eS5hZGRTY2FsZWRWZWN0b3IoYWNjZWwsIGRlbHRhKTtcbiAgICAgICAgaWYgKHRoaXMubGFuZGVkICYmIHRoaXMudmVsb2NpdHkueSA8IDApIHtcbiAgICAgICAgICAgIHRoaXMudmVsb2NpdHkuc2V0WSgwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vISBBcHBseVxuICAgICAgICB0aGlzLm9iai5wb3NpdGlvbi5hZGRTY2FsZWRWZWN0b3Iocm91bmRUb1plcm8odGhpcy52ZWxvY2l0eSwgdGhpcy5lZmZlY3RpdmVUaHJvdHRsZSA+IDAgPyAwLjAxIDogMC4xKSwgZGVsdGEpO1xuICAgICAgICBpZiAodGhpcy5vYmoucG9zaXRpb24ueSA+IFBMQU5FX0RJU1RBTkNFX1RPX0dST1VORCkge1xuICAgICAgICAgICAgdGhpcy5sYW5kZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdyb3VuZCBpbnRlcmFjdGlvblxuICAgICAgICBpZiAodGhpcy5vYmoucG9zaXRpb24ueSA8IFBMQU5FX0RJU1RBTkNFX1RPX0dST1VORCkge1xuICAgICAgICAgICAgdGhpcy5vYmoucG9zaXRpb24ueSA9IFBMQU5FX0RJU1RBTkNFX1RPX0dST1VORDtcblxuICAgICAgICAgICAgY29uc3QgZm9yd2FyZCA9IHRoaXMuX3YuY29weShGT1JXQVJEKS5hcHBseVF1YXRlcm5pb24odGhpcy5vYmoucXVhdGVybmlvbik7XG4gICAgICAgICAgICBjb25zdCByaWdodCA9IHRoaXMucmlnaHQuY29weShSSUdIVCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMub2JqLnF1YXRlcm5pb24pO1xuXG4gICAgICAgICAgICBjb25zdCBwcmpGb3J3YXJkID0gbmV3IFRIUkVFLlZlY3RvcjMoKS5jb3B5KGZvcndhcmQpLnNldFkoMCkubm9ybWFsaXplKCk7XG4gICAgICAgICAgICBjb25zdCBwaXRjaEFuZ2xlID0gZm9yd2FyZC5hbmdsZVRvKHByakZvcndhcmQpICogTWF0aC5zaWduKGZvcndhcmQueSk7XG5cbiAgICAgICAgICAgIGNvbnN0IHByalJpZ2h0ID0gbmV3IFRIUkVFLlZlY3RvcjMoKS5jb3B5KHJpZ2h0KS5zZXRZKDApLm5vcm1hbGl6ZSgpO1xuICAgICAgICAgICAgY29uc3Qgcm9sbEFuZ2xlID0gcmlnaHQuYW5nbGVUbyhwcmpSaWdodCkgKiBNYXRoLnNpZ24ocmlnaHQueSk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmxhbmRpbmdHZWFyRGVwbG95ZWQgPT09IGZhbHNlIHx8XG4gICAgICAgICAgICAgICAgc3BlZWQgPiBMQU5ERURfTUFYX1NQRUVEIHx8XG4gICAgICAgICAgICAgICAgdGhpcy52ZWxvY2l0eS55IDwgLUxBTkRJTkdfTUFYX1ZTUEVFRCB8fFxuICAgICAgICAgICAgICAgIE1hdGguYWJzKHJvbGxBbmdsZSkgPiBMQU5ESU5HX01BWF9ST0xMIHx8XG4gICAgICAgICAgICAgICAgTEFORElOR19NSU5fUElUQ0ggPiBwaXRjaEFuZ2xlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jcmFzaGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGZvcndhcmQueSA8IDAuMCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBoZWFkaW5nID0gbmV3IFRIUkVFLlZlY3RvcjMoKS5jb3B5KGZvcndhcmQpLnNldFkoMCkubm9ybWFsaXplKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub2JqLnF1YXRlcm5pb24uc2V0RnJvbVVuaXRWZWN0b3JzKEZPUldBUkQsIGhlYWRpbmcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnZlbG9jaXR5LnNldFkoMCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGFsbCA9IC0xO1xuICAgICAgICAgICAgICAgIHRoaXMubGFuZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldFN0YWxsU3RhdHVzKCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0YWxsO1xuICAgIH1cbn0iLCJpbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgeyBNQVhfQUxUSVRVREUsIE1BWF9TUEVFRCwgUElUQ0hfUkFURSwgUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5ELCBST0xMX1JBVEUsIFlBV19SQVRFIH0gZnJvbSBcIi4uLy4uL2RlZnNcIjtcbmltcG9ydCB7IEZPUldBUkQsIGlzWmVybywgVVAgfSBmcm9tICcuLi8uLi91dGlscy9tYXRoJztcbmltcG9ydCB7IEZsaWdodE1vZGVsIH0gZnJvbSAnLi9mbGlnaHRNb2RlbCc7XG5cbmV4cG9ydCBjbGFzcyBEZWJ1Z0ZsaWdodE1vZGVsIGV4dGVuZHMgRmxpZ2h0TW9kZWwge1xuXG4gICAgcHJpdmF0ZSBzcGVlZDogbnVtYmVyID0gMDtcblxuICAgIHByaXZhdGUgX3Y6IFRIUkVFLlZlY3RvcjMgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgX3c6IFRIUkVFLlZlY3RvcjMgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMub2JqLnVwLmNvcHkoVVApO1xuICAgIH1cblxuICAgIHN0ZXAoZGVsdGE6IG51bWJlcik6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5jcmFzaGVkKSByZXR1cm47XG5cbiAgICAgICAgdGhpcy5lZmZlY3RpdmVUaHJvdHRsZSA9IHRoaXMudGhyb3R0bGU7XG4gICAgICAgIHRoaXMuZW5naW5lVGhydXN0TiA9IDA7XG5cbiAgICAgICAgLy8gUm9sbCBjb250cm9sXG4gICAgICAgIGlmICghaXNaZXJvKHRoaXMucm9sbCkpIHtcbiAgICAgICAgICAgIHRoaXMub2JqLnJvdGF0ZVoodGhpcy5yb2xsICogUk9MTF9SQVRFICogZGVsdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUGl0Y2ggY29udHJvbFxuICAgICAgICBpZiAoIWlzWmVybyh0aGlzLnBpdGNoKSkge1xuICAgICAgICAgICAgdGhpcy5vYmoucm90YXRlWCgtdGhpcy5waXRjaCAqIFBJVENIX1JBVEUgKiBkZWx0YSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBZYXcgY29udHJvbFxuICAgICAgICBpZiAoIWlzWmVybyh0aGlzLnlhdykpIHtcbiAgICAgICAgICAgIHRoaXMub2JqLnJvdGF0ZVkoLXRoaXMueWF3ICogWUFXX1JBVEUgKiBkZWx0YSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBdXRvbWF0aWMgeWF3IHdoZW4gcm9sbGluZ1xuICAgICAgICBjb25zdCBmb3J3YXJkID0gdGhpcy5vYmouZ2V0V29ybGREaXJlY3Rpb24odGhpcy5fdik7XG4gICAgICAgIGlmICgtMC45OSA8IGZvcndhcmQueSAmJiBmb3J3YXJkLnkgPCAwLjk5KSB7XG4gICAgICAgICAgICBjb25zdCBwcmpGb3J3YXJkID0gZm9yd2FyZC5zZXRZKDApO1xuICAgICAgICAgICAgY29uc3QgdXAgPSB0aGlzLl93LmNvcHkoVVApLmFwcGx5UXVhdGVybmlvbih0aGlzLm9iai5xdWF0ZXJuaW9uKTtcbiAgICAgICAgICAgIGNvbnN0IHByalVwID0gdXAucHJvamVjdE9uUGxhbmUocHJqRm9yd2FyZCkuc2V0WSgwKTtcbiAgICAgICAgICAgIGNvbnN0IHNpZ24gPSAocHJqRm9yd2FyZC54ICogcHJqVXAueiAtIHByakZvcndhcmQueiAqIHByalVwLngpID4gMCA/IC0xIDogMTtcbiAgICAgICAgICAgIHRoaXMub2JqLnJvdGF0ZU9uV29ybGRBeGlzKFVQLCBzaWduICogcHJqVXAubGVuZ3RoKCkgKiBwcmpVcC5sZW5ndGgoKSAqIHByakZvcndhcmQubGVuZ3RoKCkgKiAyLjAgKiBZQVdfUkFURSAqIGRlbHRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE1vdmVtZW50XG4gICAgICAgIHRoaXMuc3BlZWQgPSB0aGlzLmVmZmVjdGl2ZVRocm90dGxlICogTUFYX1NQRUVEO1xuICAgICAgICB0aGlzLm9iai50cmFuc2xhdGVaKHRoaXMuc3BlZWQgKiBkZWx0YSk7XG5cbiAgICAgICAgLy8gQXZvaWQgZ3JvdW5kIGNyYXNoZXNcbiAgICAgICAgaWYgKHRoaXMub2JqLnBvc2l0aW9uLnkgPCBQTEFORV9ESVNUQU5DRV9UT19HUk9VTkQpIHtcbiAgICAgICAgICAgIHRoaXMub2JqLnBvc2l0aW9uLnkgPSBQTEFORV9ESVNUQU5DRV9UT19HUk9VTkQ7XG4gICAgICAgICAgICBjb25zdCBkID0gdGhpcy5vYmouZ2V0V29ybGREaXJlY3Rpb24odGhpcy5fdik7XG4gICAgICAgICAgICBpZiAoZC55IDwgMC4wKSB7XG4gICAgICAgICAgICAgICAgZC5zZXRZKDApLmFkZCh0aGlzLm9iai5wb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgdGhpcy5vYmoubG9va0F0KGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXZvaWQgZmx5aW5nIHRvbyBoaWdoXG4gICAgICAgIGlmICh0aGlzLm9iai5wb3NpdGlvbi55ID4gTUFYX0FMVElUVURFKSB7XG4gICAgICAgICAgICB0aGlzLm9iai5wb3NpdGlvbi55ID0gTUFYX0FMVElUVURFO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVmVsb2NpdHlcbiAgICAgICAgdGhpcy52ZWxvY2l0eS5jb3B5KEZPUldBUkQpLmFwcGx5UXVhdGVybmlvbih0aGlzLm9iai5xdWF0ZXJuaW9uKS5tdWx0aXBseVNjYWxhcih0aGlzLnNwZWVkKTtcblxuICAgICAgICB0aGlzLmxhbmRlZCA9IHRoaXMub2JqLnBvc2l0aW9uLnkgPD0gUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5EO1xuICAgIH1cblxuICAgIGdldFN0YWxsU3RhdHVzKCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9XG59XG4iLCJpbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgeyBVUCB9IGZyb20gJy4uLy4uL3V0aWxzL21hdGgnO1xuaW1wb3J0IHsgRm0yQWlyY3JhZnRDb25maWcgfSBmcm9tICcuLi9mbTIvZm0yQWlyY3JhZnRDb25maWcnO1xuXG5leHBvcnQgY29uc3QgU0lNX0ZQUyA9IDEyMDtcbmNvbnN0IFNJTV9ERUxUQSA9IDEuMCAvIFNJTV9GUFM7XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBGbGlnaHRNb2RlbCB7XG5cbiAgICBwcm90ZWN0ZWQgb2JqID0gbmV3IFRIUkVFLk9iamVjdDNEKCk7XG4gICAgcHJvdGVjdGVkIHZlbG9jaXR5OiBUSFJFRS5WZWN0b3IzID0gbmV3IFRIUkVFLlZlY3RvcjMoKTsgLy8gbS9zXG5cbiAgICBwcm90ZWN0ZWQgY3Jhc2hlZDogYm9vbGVhbiA9IGZhbHNlO1xuICAgIHByb3RlY3RlZCBsYW5kZWQ6IGJvb2xlYW4gPSB0cnVlO1xuICAgIHByb3RlY3RlZCBsYW5kaW5nR2VhckRlcGxveWVkOiBib29sZWFuID0gdHJ1ZTtcbiAgICBwcm90ZWN0ZWQgZmxhcHNFeHRlbmRlZDogYm9vbGVhbiA9IHRydWU7XG4gICAgcHJvdGVjdGVkIHdoZWVsQnJha2VzQXBwbGllZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gICAgcHJvdGVjdGVkIHBpdGNoOiBudW1iZXIgPSAwOyAvLyBbLTEsIDFdXG4gICAgcHJvdGVjdGVkIHJvbGw6IG51bWJlciA9IDA7IC8vIFstMSwgMV1cbiAgICBwcm90ZWN0ZWQgeWF3OiBudW1iZXIgPSAwOyAvLyBbLTEsIDFdXG4gICAgcHJvdGVjdGVkIHRocm90dGxlOiBudW1iZXIgPSAwOyAvLyBbMCwgMV1cbiAgICBwcm90ZWN0ZWQgZWZmZWN0aXZlVGhyb3R0bGU6IG51bWJlciA9IDA7IC8vIFswLCAxXVxuXG4gICAgcHJvdGVjdGVkIGFuZ2xlT2ZBdHRhY2tSYWQ6IG51bWJlciA9IDA7XG4gICAgcHJvdGVjdGVkIGxvYWRGYWN0b3JHOiBudW1iZXIgPSAxO1xuICAgIHByb3RlY3RlZCBlbmdpbmVUaHJ1c3ROOiBudW1iZXIgPSAwO1xuXG4gICAgcHJpdmF0ZSBwcmV2UG9zaXRpb24gPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcHJldlF1YXRlcm5pb24gPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuICAgIHByaXZhdGUgcHJldlZlbG9jaXR5ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIGRlbHRhUmVtYWluZGVyOiBudW1iZXIgPSAwO1xuXG4gICAgYWJzdHJhY3Qgc3RlcChkZWx0YTogbnVtYmVyKTogdm9pZDtcblxuICAgIHJlc2V0KCkge1xuICAgICAgICB0aGlzLm9iai5wb3NpdGlvbi5zZXQoMCwgMCwgMCk7XG4gICAgICAgIHRoaXMub2JqLnF1YXRlcm5pb24uc2V0RnJvbUF4aXNBbmdsZShVUCwgMCk7XG4gICAgICAgIHRoaXMudmVsb2NpdHkuc2V0KDAsIDAsIDApO1xuICAgICAgICB0aGlzLmNyYXNoZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5sYW5kZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLmxhbmRpbmdHZWFyRGVwbG95ZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLmZsYXBzRXh0ZW5kZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLndoZWVsQnJha2VzQXBwbGllZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnBpdGNoID0gMDtcbiAgICAgICAgdGhpcy5yb2xsID0gMDtcbiAgICAgICAgdGhpcy55YXcgPSAwO1xuICAgICAgICB0aGlzLnRocm90dGxlID0gMDtcbiAgICAgICAgdGhpcy5lZmZlY3RpdmVUaHJvdHRsZSA9IDA7XG4gICAgICAgIHRoaXMuYW5nbGVPZkF0dGFja1JhZCA9IDA7XG4gICAgICAgIHRoaXMubG9hZEZhY3RvckcgPSAxO1xuICAgICAgICB0aGlzLmVuZ2luZVRocnVzdE4gPSAwO1xuICAgICAgICB0aGlzLmRlbHRhUmVtYWluZGVyID0gMDtcbiAgICAgICAgdGhpcy5zeW5jUHJldmlvdXNTdGF0ZSgpO1xuICAgIH1cblxuICAgIC8qKiBBbGlnbiByZW5kZXIgaW50ZXJwb2xhdGlvbiBhZnRlciB0ZWxlcG9ydCBvciBhaXJib3JuZSBzcGF3bi4gKi9cbiAgICBzbmFwUGh5c2ljc1N0YXRlKCk6IHZvaWQge1xuICAgICAgICB0aGlzLnN5bmNQcmV2aW91c1N0YXRlKCk7XG4gICAgfVxuXG4gICAgdXBkYXRlKGRlbHRhOiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5kZWx0YVJlbWFpbmRlciArPSBkZWx0YTtcbiAgICAgICAgd2hpbGUgKHRoaXMuZGVsdGFSZW1haW5kZXIgPj0gU0lNX0RFTFRBKSB7XG4gICAgICAgICAgICB0aGlzLnNhdmVQcmV2aW91c1N0YXRlKCk7XG4gICAgICAgICAgICB0aGlzLnN0ZXAoU0lNX0RFTFRBKTtcbiAgICAgICAgICAgIHRoaXMuZGVsdGFSZW1haW5kZXIgLT0gU0lNX0RFTFRBO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqIDEgPSBsYXRlc3QgcGh5c2ljcyBzdGF0ZSwgMCA9IHByZXZpb3VzIHBoeXNpY3Mgc3RhdGUuICovXG4gICAgZ2V0UmVuZGVySW50ZXJwb2xhdGlvbkFscGhhKCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiAxIC0gdGhpcy5kZWx0YVJlbWFpbmRlciAvIFNJTV9ERUxUQTtcbiAgICB9XG5cbiAgICBnZXRSZW5kZXJQb3NpdGlvbih0YXJnZXQ6IFRIUkVFLlZlY3RvcjMpOiBUSFJFRS5WZWN0b3IzIHtcbiAgICAgICAgcmV0dXJuIHRhcmdldC5sZXJwVmVjdG9ycyh0aGlzLnByZXZQb3NpdGlvbiwgdGhpcy5vYmoucG9zaXRpb24sIHRoaXMuZ2V0UmVuZGVySW50ZXJwb2xhdGlvbkFscGhhKCkpO1xuICAgIH1cblxuICAgIGdldFJlbmRlclF1YXRlcm5pb24odGFyZ2V0OiBUSFJFRS5RdWF0ZXJuaW9uKTogVEhSRUUuUXVhdGVybmlvbiB7XG4gICAgICAgIHJldHVybiB0YXJnZXQuc2xlcnBRdWF0ZXJuaW9ucyh0aGlzLnByZXZRdWF0ZXJuaW9uLCB0aGlzLm9iai5xdWF0ZXJuaW9uLCB0aGlzLmdldFJlbmRlckludGVycG9sYXRpb25BbHBoYSgpKTtcbiAgICB9XG5cbiAgICBnZXRSZW5kZXJWZWxvY2l0eSh0YXJnZXQ6IFRIUkVFLlZlY3RvcjMpOiBUSFJFRS5WZWN0b3IzIHtcbiAgICAgICAgcmV0dXJuIHRhcmdldC5sZXJwVmVjdG9ycyh0aGlzLnByZXZWZWxvY2l0eSwgdGhpcy52ZWxvY2l0eSwgdGhpcy5nZXRSZW5kZXJJbnRlcnBvbGF0aW9uQWxwaGEoKSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzYXZlUHJldmlvdXNTdGF0ZSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5wcmV2UG9zaXRpb24uY29weSh0aGlzLm9iai5wb3NpdGlvbik7XG4gICAgICAgIHRoaXMucHJldlF1YXRlcm5pb24uY29weSh0aGlzLm9iai5xdWF0ZXJuaW9uKTtcbiAgICAgICAgdGhpcy5wcmV2VmVsb2NpdHkuY29weSh0aGlzLnZlbG9jaXR5KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHN5bmNQcmV2aW91c1N0YXRlKCk6IHZvaWQge1xuICAgICAgICB0aGlzLnByZXZQb3NpdGlvbi5jb3B5KHRoaXMub2JqLnBvc2l0aW9uKTtcbiAgICAgICAgdGhpcy5wcmV2UXVhdGVybmlvbi5jb3B5KHRoaXMub2JqLnF1YXRlcm5pb24pO1xuICAgICAgICB0aGlzLnByZXZWZWxvY2l0eS5jb3B5KHRoaXMudmVsb2NpdHkpO1xuICAgIH1cblxuICAgIHNldFBpdGNoKHBpdGNoOiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy5waXRjaCA9IHBpdGNoO1xuICAgIH1cblxuICAgIHNldFJvbGwocm9sbDogbnVtYmVyKSB7XG4gICAgICAgIHRoaXMucm9sbCA9IHJvbGw7XG4gICAgfVxuXG4gICAgc2V0WWF3KHlhdzogbnVtYmVyKSB7XG4gICAgICAgIHRoaXMueWF3ID0geWF3O1xuICAgIH1cblxuICAgIHNldFRocm90dGxlKHRocm90dGxlOiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy50aHJvdHRsZSA9IHRocm90dGxlO1xuICAgIH1cblxuICAgIC8qKiBNYXRjaCBzcG9vbGVkIGVuZ2luZSBzdGF0ZSB0byBjb21tYW5kZWQgdGhyb3R0bGUgKGUuZy4gYWlyYm9ybmUgc3Bhd24pLiAqL1xuICAgIHN5bmNFZmZlY3RpdmVUaHJvdHRsZSgpIHtcbiAgICAgICAgdGhpcy5lZmZlY3RpdmVUaHJvdHRsZSA9IHRoaXMudGhyb3R0bGU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2VsZWN0IHRoZSBhaXJjcmFmdCB0aGlzIG1vZGVsIHNob3VsZCBzaW11bGF0ZS4gT25seSB0aGUgRk0yIG1vZGVsIGlzXG4gICAgICogcGVyLWFpcmNyYWZ0IGZvciBub3c7IGV2ZXJ5IG90aGVyIG1vZGVsIGlnbm9yZXMgdGhpcyAoZ2VuZXJpYyBkeW5hbWljcykuXG4gICAgICovXG4gICAgc2V0QWlyY3JhZnQoX2NvbmZpZzogRm0yQWlyY3JhZnRDb25maWcpOiB2b2lkIHtcbiAgICAgICAgLy8gTm8tb3AgYnkgZGVmYXVsdC5cbiAgICB9XG5cbiAgICBzZXRMYW5kaW5nR2VhckRlcGxveWVkKGRlcGxveWVkOiBib29sZWFuKSB7XG4gICAgICAgIHRoaXMubGFuZGluZ0dlYXJEZXBsb3llZCA9IGRlcGxveWVkO1xuICAgIH1cblxuICAgIHNldEZsYXBzRXh0ZW5kZWQoZXh0ZW5kZWQ6IGJvb2xlYW4pIHtcbiAgICAgICAgdGhpcy5mbGFwc0V4dGVuZGVkID0gZXh0ZW5kZWQ7XG4gICAgfVxuXG4gICAgc2V0V2hlZWxCcmFrZXMoYXBwbGllZDogYm9vbGVhbikge1xuICAgICAgICB0aGlzLndoZWVsQnJha2VzQXBwbGllZCA9IGFwcGxpZWQ7XG4gICAgfVxuXG4gICAgaXNXaGVlbEJyYWtlc0FwcGxpZWQoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLndoZWVsQnJha2VzQXBwbGllZDtcbiAgICB9XG5cbiAgICBzZXRMYW5kZWQoaXNMYW5kZWQ6IGJvb2xlYW4pIHtcbiAgICAgICAgdGhpcy5sYW5kZWQgPSBpc0xhbmRlZDtcbiAgICB9XG5cbiAgICBpc0xhbmRlZCgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGFuZGVkO1xuICAgIH1cblxuICAgIHNldENyYXNoZWQoaXNDcmFzaGVkOiBib29sZWFuKSB7XG4gICAgICAgIHRoaXMuY3Jhc2hlZCA9IGlzQ3Jhc2hlZDtcbiAgICB9XG5cbiAgICBpc0NyYXNoZWQoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLmNyYXNoZWQ7XG4gICAgfVxuXG4gICAgc2V0IHBvc2l0aW9uKHA6IFRIUkVFLlZlY3RvcjMpIHtcbiAgICAgICAgdGhpcy5vYmoucG9zaXRpb24uY29weShwKTtcbiAgICB9XG5cbiAgICBnZXQgcG9zaXRpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9iai5wb3NpdGlvbjtcbiAgICB9XG5cbiAgICBzZXQgcXVhdGVybmlvbihxOiBUSFJFRS5RdWF0ZXJuaW9uKSB7XG4gICAgICAgIHRoaXMub2JqLnF1YXRlcm5pb24uY29weShxKTtcbiAgICB9XG5cbiAgICBnZXQgcXVhdGVybmlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub2JqLnF1YXRlcm5pb247XG4gICAgfVxuXG4gICAgc2V0IHZlbG9jaXR5VmVjdG9yKHY6IFRIUkVFLlZlY3RvcjMpIHtcbiAgICAgICAgdGhpcy52ZWxvY2l0eS5jb3B5KHYpO1xuICAgIH1cblxuICAgIGdldCB2ZWxvY2l0eVZlY3RvcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmVsb2NpdHk7XG4gICAgfVxuXG4gICAgZ2V0RWZmZWN0aXZlVGhyb3R0bGUoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWZmZWN0aXZlVGhyb3R0bGU7XG4gICAgfVxuXG4gICAgLy8gWy0xLDFdIC0gVmFsdWVzID49IDAgbWVhbiBzdGFsbFxuICAgIGFic3RyYWN0IGdldFN0YWxsU3RhdHVzKCk6IG51bWJlcjtcblxuICAgIGdldEFuZ2xlT2ZBdHRhY2soKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYW5nbGVPZkF0dGFja1JhZDtcbiAgICB9XG5cbiAgICBnZXRMb2FkRmFjdG9yRygpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5sb2FkRmFjdG9yRztcbiAgICB9XG5cbiAgICBnZXRFbmdpbmVUaHJ1c3RLbigpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5lbmdpbmVUaHJ1c3ROIC8gMTAwMDtcbiAgICB9XG5cbiAgICB1c2VGMTZUaHJvdHRsZURldGVudHMoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBzdGVwVGhyb3R0bGVEZXRlbnQoY3VycmVudDogbnVtYmVyLCBkaXJlY3Rpb246IDEgfCAtMSk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCBjdXJyZW50ICsgZGlyZWN0aW9uICogMC4wMSkpO1xuICAgIH1cblxuICAgIGlzSW5UaHJvdHRsZUFiRGV0ZW50QmFuZChfbGV2ZXI6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqIE92ZXJyaWRlIGluIG1vZGVscyB3aXRoIGEgbm9uLWxpbmVhciB0aHJvdHRsZSBxdWFkcmFudC4gKi9cbiAgICBhZGp1c3RUaHJvdHRsZUlucHV0KGN1cnJlbnQ6IG51bWJlciwgc3RlcDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIE1hdGgubWF4KDAsIE1hdGgubWluKDEsIGN1cnJlbnQgKyBzdGVwKSk7XG4gICAgfVxuXG4gICAgLyoqIE92ZXJyaWRlIGluIG1vZGVscyB3aXRoIGEgbm9uLWxpbmVhciB0aHJvdHRsZSBxdWFkcmFudC4gKi9cbiAgICBnZXRUaHJvdHRsZUh1ZFRleHQoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGBUSFIgJHsoMTAwICogdGhpcy5lZmZlY3RpdmVUaHJvdHRsZSkudG9GaXhlZCgwKX1gO1xuICAgIH1cblxuICAgIC8qKiBOb3JtYWxpemVkIGVuZ2luZSBwb3dlciBmb3IgYXVkaW8gWzAsIDFdLiAqL1xuICAgIGdldFRocm90dGxlQXVkaW9MZXZlbCgpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5lZmZlY3RpdmVUaHJvdHRsZTtcbiAgICB9XG5cbiAgICAvKiogQ1NTIGNvbG9yIGZvciBlbmdpbmUgbm96emxlIHJlbmRlcmluZyAoTUlMIGJsYWNrIGJ5IGRlZmF1bHQpLiAqL1xuICAgIGdldEVuZ2luZU5venpsZUNvbG9yKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiAnIzBhMGEwYSc7XG4gICAgfVxufVxuIiwiLyoqXG4gKiBGTTIg4oCUIEYtMTZDIHJpZ2lkLWJvZHkgXCJwYXJ0c1wiIGZsaWdodCBtb2RlbC5cbiAqXG4gKiBVbmxpa2UgdGhlIGtpbmVtYXRpYyBSZWFsaXN0aWMgbW9kZWwgKHdoaWNoIHJvdGF0ZXMgdGhlIGFpcmZyYW1lIGRpcmVjdGx5IGZyb21cbiAqIHN0aWNrIGF1dGhvcml0eSksIEZNMiBpcyBhIGdlbnVpbmUgNi1ET0YgcmlnaWQgYm9keS4gRXZlcnkgYWVyb2R5bmFtaWMgZm9yY2VcbiAqIGlzIHByb2R1Y2VkIGJ5IGEgZGlzY3JldGUgbGlmdGluZyBzdXJmYWNlIGF0IGl0cyByZWFsIGxvY2F0aW9uLCBzbyBhbGwgbW9tZW50c1xuICog4oCUIGFuZCB0aGUgcGl0Y2gvcm9sbC95YXcgcmF0ZSBkYW1waW5nIOKAlCBlbWVyZ2UgZnJvbSB0aGUgZ2VvbWV0cnkuIEEgZmx5LWJ5LXdpcmVcbiAqIGxheWVyIGNsb3NlcyByYXRlL2cgbG9vcHMgYXJvdW5kIHRoZSBhaXJmcmFtZSB0byBnaXZlIEYtMTYgaGFuZGxpbmcuIExhbmRpbmdcbiAqIGdlYXIgaXMgbW9kZWxsZWQgYXMgc3ByaW5nLWRhbXBlciBjb250YWN0IHBvaW50cywgc28gd2VpZ2h0LW9uLXdoZWVscywgdGFrZW9mZlxuICogcm90YXRpb24gYW5kIGdyb3VuZCBzdGFiaWxpdHkgYXJlIGFsc28ganVzdCByaWdpZC1ib2R5IHJlYWN0aW9ucy5cbiAqXG4gKiBTZWUgcGh5c2ljcy9mbTIvKiBmb3IgdGhlIGJ1aWxkaW5nIGJsb2Nrcy5cbiAqL1xuaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuaW1wb3J0IHsgUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5ELCBURVJSQUlOX01PREVMX1NJWkUsIFRFUlJBSU5fU0NBTEUgfSBmcm9tICcuLi8uLi9kZWZzJztcbmltcG9ydCB7IGNsYW1wLCBGT1JXQVJELCBSSUdIVCwgVVAgfSBmcm9tICcuLi8uLi91dGlscy9tYXRoJztcbmltcG9ydCB7XG4gICAgY29tcHV0ZUFpckRlbnNpdHksIGNvbXB1dGVEeW5hbWljUHJlc3N1cmUsIGNvbXB1dGVJc2FBaXJEZW5zaXR5LFxuICAgIGNvbXB1dGVNYWNoTnVtYmVyLCBjb21wdXRlVGhydXN0RGVuc2l0eUZhY3Rvcixcbn0gZnJvbSAnLi4vYWVyb1V0aWxzJztcbmltcG9ydCB7XG4gICAgYWRqdXN0RjE2VGhyb3R0bGVJbnB1dCwgY29tcHV0ZUYxNkVuZ2luZVRocnVzdE4sIGYxNlRocm90dGxlQXVkaW9MZXZlbCxcbiAgICBmb3JtYXRGMTZUaHJvdHRsZUh1ZCwgZ2V0RjE2RW5naW5lTm96emxlQ29sb3IsIGdldEYxNlRocm90dGxlWm9uZSxcbiAgICBpc0YxNkFiRGV0ZW50QmFuZCwgc3RlcEYxNlRocm90dGxlRGV0ZW50LFxufSBmcm9tICcuLi9mMTZFbmdpbmUnO1xuaW1wb3J0IHsgQWVyb1N1cmZhY2UgfSBmcm9tICcuLi9mbTIvYWVyb1N1cmZhY2UnO1xuaW1wb3J0IHsgRGlyZWN0RmNzIH0gZnJvbSAnLi4vZm0yL2RpcmVjdEZjcyc7XG5pbXBvcnQgeyBGY3MgfSBmcm9tICcuLi9mbTIvZmNzJztcbmltcG9ydCB7IEYxNkZjcyB9IGZyb20gJy4uL2ZtMi9mMTZGY3MnO1xuaW1wb3J0IHsgRm0yQWlyY3JhZnRDb25maWcsIEZtMkRpcmVjdEZjc0NvbmZpZywgZjE2Rm0yQ29uZmlnIH0gZnJvbSAnLi4vZm0yL2ZtMkFpcmNyYWZ0Q29uZmlnJztcbmltcG9ydCB7IFJpZ2lkQm9keSB9IGZyb20gJy4uL2ZtMi9yaWdpZEJvZHknO1xuaW1wb3J0IHsgRmxpZ2h0TW9kZWwgfSBmcm9tICcuL2ZsaWdodE1vZGVsJztcblxuY29uc3QgR1JBVklUWSA9IDkuODA2NjU7XG5cbmNvbnN0IFRIUk9UVExFX1VQX1JBVEUgPSAwLjEwO1xuY29uc3QgVEhST1RUTEVfRE9XTl9SQVRFID0gMC4wNztcblxuLy8gRmFsbGJhY2sgbWVjaGFuaWNhbCBGQ1MgdHVuaW5nIGZvciBhIGRpcmVjdC1tb2RlIGFpcmNyYWZ0IHRoYXQgb21pdHMgaXRzIG93bi5cbmNvbnN0IERFRkFVTFRfRElSRUNUX0ZDUzogRm0yRGlyZWN0RmNzQ29uZmlnID0ge1xuICAgIHBpdGNoUmF0ZURhbXA6IDAuOSxcbiAgICByb2xsUmF0ZURhbXA6IDAuMTIsXG4gICAgeWF3RGFtcGVyR2FpbjogMS40LFxuICAgIHlhd0RhbXBlcldhc2hvdXRUYXVTOiAxLjAsXG4gICAgYXJpR2FpbjogMC4wOCxcbiAgICBhY3R1YXRvclRhdVM6IDAuMDYsXG59O1xuXG5pbnRlcmZhY2UgU3VyZmFjZUNvbnRyb2xzIHtcbiAgICB3aW5nTGVmdEFvYTogbnVtYmVyO1xuICAgIHdpbmdSaWdodEFvYTogbnVtYmVyO1xuICAgIGh0YWlsTGVmdEFvYTogbnVtYmVyO1xuICAgIGh0YWlsUmlnaHRBb2E6IG51bWJlcjtcbiAgICB2dGFpbEFvYTogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgRm0yRmxpZ2h0TW9kZWwgZXh0ZW5kcyBGbGlnaHRNb2RlbCB7XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IGNvbmZpZzogRm0yQWlyY3JhZnRDb25maWc7XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IHJiOiBSaWdpZEJvZHk7XG4gICAgcHJpdmF0ZSByZWFkb25seSBmY3M6IEZjcztcblxuICAgIHByaXZhdGUgcmVhZG9ubHkgZnVzZWxhZ2U6IEFlcm9TdXJmYWNlO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgd2luZ0xlZnQ6IEFlcm9TdXJmYWNlO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgd2luZ1JpZ2h0OiBBZXJvU3VyZmFjZTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGh0YWlsTGVmdDogQWVyb1N1cmZhY2U7XG4gICAgcHJpdmF0ZSByZWFkb25seSBodGFpbFJpZ2h0OiBBZXJvU3VyZmFjZTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZ0YWlsOiBBZXJvU3VyZmFjZTtcblxuICAgIC8qKiBSZWZlcmVuY2UgZHluYW1pYyBwcmVzc3VyZSBhdCB0aGUgZGVzaWduIGNydWlzZSBjb25kaXRpb24gKFBhKS4gKi9cbiAgICBwcml2YXRlIHJlYWRvbmx5IHFSZWY6IG51bWJlcjtcblxuICAgIHByaXZhdGUgc3RhbGwgPSAtMTtcblxuICAgIC8vIFNjcmF0Y2ggdmVjdG9ycyAoYXZvaWQgcGVyLXN0ZXAgYWxsb2NhdGlvbiBpbiB0aGUgd29ya2VyKS5cbiAgICBwcml2YXRlIHJlYWRvbmx5IHZlbEJvZHkgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgZm9yY2VCb2R5ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IG1vbWVudEJvZHkgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgZm9yY2VXb3JsZCA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSByZWFkb25seSBnZWFyRm9yY2VXb3JsZCA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSByZWFkb25seSBnZWFyTW9tZW50Qm9keSA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSByZWFkb25seSBpbnZPcmllbnQgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgX3VwID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9md2QgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgX3JpZ2h0ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IF92ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IF92MiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSByZWFkb25seSBfZ2VhcldvcmxkID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9jb250YWN0VmVsID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9vbWVnYVdvcmxkID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9mcmljdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cbiAgICBjb25zdHJ1Y3Rvcihjb25maWc6IEZtMkFpcmNyYWZ0Q29uZmlnID0gZjE2Rm0yQ29uZmlnKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgICAgICB0aGlzLnJiID0gbmV3IFJpZ2lkQm9keShjb25maWcuZ2VvbWV0cnkubWFzc0tnLCB7XG4gICAgICAgICAgICB4OiBjb25maWcuaW5lcnRpYS5waXRjaCxcbiAgICAgICAgICAgIHk6IGNvbmZpZy5pbmVydGlhLnlhdyxcbiAgICAgICAgICAgIHo6IGNvbmZpZy5pbmVydGlhLnJvbGwsXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmZjcyA9IGNvbmZpZy5mY3MubW9kZSA9PT0gJ2RpcmVjdCdcbiAgICAgICAgICAgID8gbmV3IERpcmVjdEZjcyhjb25maWcuZmNzLmRpcmVjdCA/PyBERUZBVUxUX0RJUkVDVF9GQ1MpXG4gICAgICAgICAgICA6IG5ldyBGMTZGY3MoKTtcbiAgICAgICAgdGhpcy5mdXNlbGFnZSA9IG5ldyBBZXJvU3VyZmFjZShjb25maWcuc3VyZmFjZXMuZnVzZWxhZ2UpO1xuICAgICAgICB0aGlzLndpbmdMZWZ0ID0gbmV3IEFlcm9TdXJmYWNlKGNvbmZpZy5zdXJmYWNlcy53aW5nTGVmdCk7XG4gICAgICAgIHRoaXMud2luZ1JpZ2h0ID0gbmV3IEFlcm9TdXJmYWNlKGNvbmZpZy5zdXJmYWNlcy53aW5nUmlnaHQpO1xuICAgICAgICB0aGlzLmh0YWlsTGVmdCA9IG5ldyBBZXJvU3VyZmFjZShjb25maWcuc3VyZmFjZXMuaHRhaWxMZWZ0KTtcbiAgICAgICAgdGhpcy5odGFpbFJpZ2h0ID0gbmV3IEFlcm9TdXJmYWNlKGNvbmZpZy5zdXJmYWNlcy5odGFpbFJpZ2h0KTtcbiAgICAgICAgdGhpcy52dGFpbCA9IG5ldyBBZXJvU3VyZmFjZShjb25maWcuc3VyZmFjZXMudnRhaWwpO1xuICAgICAgICB0aGlzLnFSZWYgPSAwLjUgKiBjb21wdXRlSXNhQWlyRGVuc2l0eShjb25maWcuZW52ZWxvcGUuY3J1aXNlQWx0aXR1ZGVNKVxuICAgICAgICAgICAgKiBjb25maWcuZW52ZWxvcGUuY3J1aXNlU3BlZWRNcHMgKiogMjtcbiAgICAgICAgdGhpcy5vYmoudXAuY29weShVUCk7XG4gICAgfVxuXG4gICAgcmVzZXQoKTogdm9pZCB7XG4gICAgICAgIHN1cGVyLnJlc2V0KCk7XG4gICAgICAgIHRoaXMucmIucmVzZXQoKTtcbiAgICAgICAgdGhpcy5mY3MucmVzZXQoKTtcbiAgICAgICAgdGhpcy5zdGFsbCA9IC0xO1xuICAgIH1cblxuICAgIHN0ZXAoZGVsdGE6IG51bWJlcik6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5jcmFzaGVkKSByZXR1cm47XG5cbiAgICAgICAgdGhpcy5zcG9vbFRocm90dGxlKGRlbHRhKTtcblxuICAgICAgICAvLyBBZG9wdCBhbnkgZXh0ZXJuYWxseSBzZXQgb3JpZW50YXRpb24gLyB2ZWxvY2l0eSBhcyB0aGUgcmlnaWQtYm9keSBzdGF0ZS5cbiAgICAgICAgdGhpcy5yYi5vcmllbnRhdGlvbi5jb3B5KHRoaXMub2JqLnF1YXRlcm5pb24pO1xuICAgICAgICB0aGlzLnJiLnZlbG9jaXR5V29ybGQuY29weSh0aGlzLnZlbG9jaXR5KTtcblxuICAgICAgICBjb25zdCBhbHRpdHVkZSA9IHRoaXMub2JqLnBvc2l0aW9uLnk7XG4gICAgICAgIGNvbnN0IGFpckRlbnNpdHkgPSBjb21wdXRlQWlyRGVuc2l0eShhbHRpdHVkZSk7XG5cbiAgICAgICAgLy8gQm9keS1mcmFtZSB2ZWxvY2l0eSB0aHJvdWdoIHRoZSBhaXIuXG4gICAgICAgIHRoaXMuaW52T3JpZW50LmNvcHkodGhpcy5yYi5vcmllbnRhdGlvbikuaW52ZXJ0KCk7XG4gICAgICAgIHRoaXMudmVsQm9keS5jb3B5KHRoaXMucmIudmVsb2NpdHlXb3JsZCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMuaW52T3JpZW50KTtcbiAgICAgICAgY29uc3Qgc3BlZWQgPSB0aGlzLnZlbEJvZHkubGVuZ3RoKCk7XG5cbiAgICAgICAgLy8gQWlyY3JhZnQgYW5nbGUgb2YgYXR0YWNrIChpbiB0aGUgYm9keSBYLXBsYW5lKSBhbmQgc2lkZXNsaXAuXG4gICAgICAgIGNvbnN0IGFvYSA9IHNwZWVkID4gMSA/IE1hdGguYXRhbjIoLXRoaXMudmVsQm9keS55LCB0aGlzLnZlbEJvZHkueikgOiAwO1xuICAgICAgICB0aGlzLmFuZ2xlT2ZBdHRhY2tSYWQgPSBhb2E7XG5cbiAgICAgICAgY29uc3QgZHluYW1pY1ByZXNzdXJlID0gY29tcHV0ZUR5bmFtaWNQcmVzc3VyZShhaXJEZW5zaXR5LCBzcGVlZCk7XG4gICAgICAgIGNvbnN0IG1hY2ggPSBjb21wdXRlTWFjaE51bWJlcihzcGVlZCwgYWx0aXR1ZGUpO1xuXG4gICAgICAgIC8vIEZseS1ieS13aXJlOiBzdGljay9wZWRhbHMgKyBzdGF0ZSDihpIgc3VyZmFjZSBjb21tYW5kcy5cbiAgICAgICAgY29uc3QgZmNzT3V0ID0gdGhpcy5mY3MudXBkYXRlKHtcbiAgICAgICAgICAgIHBpdGNoU3RpY2s6IHRoaXMucGl0Y2gsXG4gICAgICAgICAgICByb2xsU3RpY2s6IHRoaXMucm9sbCxcbiAgICAgICAgICAgIHlhd1BlZGFsOiB0aGlzLnlhdyxcbiAgICAgICAgICAgIHBpdGNoUmF0ZTogdGhpcy5yYi5hbmd1bGFyVmVsb2NpdHlCb2R5LngsXG4gICAgICAgICAgICB5YXdSYXRlOiB0aGlzLnJiLmFuZ3VsYXJWZWxvY2l0eUJvZHkueSxcbiAgICAgICAgICAgIHJvbGxSYXRlOiB0aGlzLnJiLmFuZ3VsYXJWZWxvY2l0eUJvZHkueixcbiAgICAgICAgICAgIGxvYWRGYWN0b3JHOiB0aGlzLmxvYWRGYWN0b3JHLFxuICAgICAgICAgICAgYW9hUmFkOiBhb2EsXG4gICAgICAgICAgICBkeW5hbWljUHJlc3N1cmUsXG4gICAgICAgICAgICBxUmVmOiB0aGlzLnFSZWYsXG4gICAgICAgICAgICBzcGVlZCxcbiAgICAgICAgICAgIGFsdGl0dWRlTTogYWx0aXR1ZGUsXG4gICAgICAgICAgICBmbGFwc0V4dGVuZGVkOiB0aGlzLmZsYXBzRXh0ZW5kZWQsXG4gICAgICAgICAgICBsYW5kZWQ6IHRoaXMubGFuZGVkLFxuICAgICAgICB9LCBkZWx0YSk7XG5cbiAgICAgICAgY29uc3QgY29udHJvbHMgPSB0aGlzLm1hcENvbnRyb2xzKGZjc091dC5lbGV2YXRvciwgZmNzT3V0LmFpbGVyb24sIGZjc091dC5ydWRkZXIpO1xuXG4gICAgICAgIC8vIC0tLS0gQWVyb2R5bmFtaWMgZm9yY2UgJiBtb21lbnQgYnVpbGQtdXAgZnJvbSB0aGUgcmlnaWQgcGFydHMuIC0tLS1cbiAgICAgICAgdGhpcy5mb3JjZUJvZHkuc2V0KDAsIDAsIDApO1xuICAgICAgICB0aGlzLm1vbWVudEJvZHkuc2V0KDAsIDAsIDApO1xuXG4gICAgICAgIGNvbnN0IGZsYXBzID0gdGhpcy5jb25maWcuZmxhcHM7XG4gICAgICAgIGNvbnN0IGNhbWJlciA9IHRoaXMuZmxhcHNFeHRlbmRlZCA/IGZsYXBzLmFvYUJpYXNSYWQgOiAwO1xuICAgICAgICBjb25zdCBzdGFsbFNoaWZ0ID0gdGhpcy5mbGFwc0V4dGVuZGVkID8gZmxhcHMuc3RhbGxSZWR1Y3Rpb25SYWQgOiAwO1xuICAgICAgICBjb25zdCB3aW5nRXh0cmFDZCA9IHRoaXMuZmxhcHNFeHRlbmRlZCA/IGZsYXBzLmV4dHJhQ2QgOiAwO1xuXG4gICAgICAgIC8vIEJsZW5kZWQgbGlmdGluZyBib2R5IGF0IHRoZSBDRyAobm8gZmxhcHMsIG5vIGNvbnRyb2wgaW5jaWRlbmNlKS5cbiAgICAgICAgdGhpcy5hY2N1bXVsYXRlU3VyZmFjZSh0aGlzLmZ1c2VsYWdlLCAwLCAwLCAwLCAwLCBhaXJEZW5zaXR5KTtcbiAgICAgICAgdGhpcy5hY2N1bXVsYXRlU3VyZmFjZSh0aGlzLndpbmdMZWZ0LCBjb250cm9scy53aW5nTGVmdEFvYSwgY2FtYmVyLCBzdGFsbFNoaWZ0LCB3aW5nRXh0cmFDZCwgYWlyRGVuc2l0eSk7XG4gICAgICAgIHRoaXMuYWNjdW11bGF0ZVN1cmZhY2UodGhpcy53aW5nUmlnaHQsIGNvbnRyb2xzLndpbmdSaWdodEFvYSwgY2FtYmVyLCBzdGFsbFNoaWZ0LCB3aW5nRXh0cmFDZCwgYWlyRGVuc2l0eSk7XG4gICAgICAgIHRoaXMuYWNjdW11bGF0ZVN1cmZhY2UodGhpcy5odGFpbExlZnQsIGNvbnRyb2xzLmh0YWlsTGVmdEFvYSwgMCwgMCwgMCwgYWlyRGVuc2l0eSk7XG4gICAgICAgIHRoaXMuYWNjdW11bGF0ZVN1cmZhY2UodGhpcy5odGFpbFJpZ2h0LCBjb250cm9scy5odGFpbFJpZ2h0QW9hLCAwLCAwLCAwLCBhaXJEZW5zaXR5KTtcbiAgICAgICAgdGhpcy5hY2N1bXVsYXRlU3VyZmFjZSh0aGlzLnZ0YWlsLCBjb250cm9scy52dGFpbEFvYSwgMCwgMCwgMCwgYWlyRGVuc2l0eSk7XG5cbiAgICAgICAgLy8gRnVzZWxhZ2UgLyBwYXJhc2l0ZSAvIGdlYXIgLyB3YXZlIGRyYWcgYWxvbmcgdGhlIHJlbGF0aXZlIHdpbmQuXG4gICAgICAgIHRoaXMuYWRkQm9keURyYWcoZHluYW1pY1ByZXNzdXJlLCBzcGVlZCwgbWFjaCk7XG5cbiAgICAgICAgLy8gVGhydXN0IGFsb25nIHRoZSBub3NlICgrWiBib2R5KS5cbiAgICAgICAgY29uc3QgdGhydXN0TiA9IHRoaXMuY29tcHV0ZVRocnVzdE4odGhpcy5lZmZlY3RpdmVUaHJvdHRsZSwgYWx0aXR1ZGUpO1xuICAgICAgICB0aGlzLmVuZ2luZVRocnVzdE4gPSB0aHJ1c3ROO1xuICAgICAgICB0aGlzLmZvcmNlQm9keS56ICs9IHRocnVzdE47XG5cbiAgICAgICAgLy8gTGFuZGluZy1nZWFyIHJlYWN0aW9ucyAoY29tcHV0ZWQgaW4gd29ybGQsIG1vbWVudCBmb2xkZWQgaW50byBib2R5IGZyYW1lKS5cbiAgICAgICAgdGhpcy5jb21wdXRlR2VhckZvcmNlcygpO1xuXG4gICAgICAgIC8vIExvYWQgZmFjdG9yOiBzcGVjaWZpYyBub3JtYWwgKGJvZHktdXApIGZvcmNlIC8gZywgaW5jbC4gZ2VhciByZWFjdGlvbi5cbiAgICAgICAgY29uc3QgZ2VhckJvZHlVcFkgPSB0aGlzLl92LmNvcHkodGhpcy5nZWFyRm9yY2VXb3JsZCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMuaW52T3JpZW50KS55O1xuICAgICAgICB0aGlzLmxvYWRGYWN0b3JHID0gKHRoaXMuZm9yY2VCb2R5LnkgKyBnZWFyQm9keVVwWSkgLyAodGhpcy5jb25maWcuZ2VvbWV0cnkubWFzc0tnICogR1JBVklUWSk7XG5cbiAgICAgICAgLy8gLS0tLSBJbnRlZ3JhdGUgcm90YXRpb25hbCBkeW5hbWljcyAoYm9keSBmcmFtZSkuIC0tLS1cbiAgICAgICAgdGhpcy5tb21lbnRCb2R5LmFkZCh0aGlzLmdlYXJNb21lbnRCb2R5KTtcbiAgICAgICAgdGhpcy5yYi5pbnRlZ3JhdGVBbmd1bGFyKHRoaXMubW9tZW50Qm9keSwgZGVsdGEpO1xuXG4gICAgICAgIC8vIC0tLS0gSW50ZWdyYXRlIHRyYW5zbGF0aW9uYWwgZHluYW1pY3MgKHdvcmxkIGZyYW1lKS4gLS0tLVxuICAgICAgICB0aGlzLmZvcmNlV29ybGQuY29weSh0aGlzLmZvcmNlQm9keSkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMucmIub3JpZW50YXRpb24pO1xuICAgICAgICB0aGlzLmZvcmNlV29ybGQuYWRkKHRoaXMuZ2VhckZvcmNlV29ybGQpO1xuICAgICAgICB0aGlzLmZvcmNlV29ybGQueSAtPSB0aGlzLmNvbmZpZy5nZW9tZXRyeS5tYXNzS2cgKiBHUkFWSVRZOyAvLyBncmF2aXR5XG4gICAgICAgIHRoaXMucmIuaW50ZWdyYXRlTGluZWFyKHRoaXMuZm9yY2VXb3JsZCwgZGVsdGEsIHRoaXMub2JqLnBvc2l0aW9uKTtcblxuICAgICAgICAvLyBQdWJsaXNoIHJpZ2lkLWJvZHkgc3RhdGUgYmFjayB0byB0aGUgYmFzZSBtb2RlbC5cbiAgICAgICAgdGhpcy5vYmoucXVhdGVybmlvbi5jb3B5KHRoaXMucmIub3JpZW50YXRpb24pO1xuICAgICAgICB0aGlzLnZlbG9jaXR5LmNvcHkodGhpcy5yYi52ZWxvY2l0eVdvcmxkKTtcblxuICAgICAgICB0aGlzLnVwZGF0ZVN0YWxsU3RhdGUoc3BlZWQsIGFvYSwgYWx0aXR1ZGUpO1xuICAgICAgICB0aGlzLmhhbmRsZUdyb3VuZFN0YXRlKCk7XG4gICAgICAgIHRoaXMud3JhcFBvc2l0aW9uKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzcG9vbFRocm90dGxlKGRlbHRhOiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgPiB0aGlzLnRocm90dGxlKSB7XG4gICAgICAgICAgICB0aGlzLmVmZmVjdGl2ZVRocm90dGxlID0gTWF0aC5tYXgodGhpcy50aHJvdHRsZSwgdGhpcy5lZmZlY3RpdmVUaHJvdHRsZSAtIFRIUk9UVExFX0RPV05fUkFURSAqIGRlbHRhKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmVmZmVjdGl2ZVRocm90dGxlIDwgdGhpcy50aHJvdHRsZSkge1xuICAgICAgICAgICAgdGhpcy5lZmZlY3RpdmVUaHJvdHRsZSA9IE1hdGgubWluKHRoaXMudGhyb3R0bGUsIHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgKyBUSFJPVFRMRV9VUF9SQVRFICogZGVsdGEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBtYXBDb250cm9scyhlbGV2YXRvcjogbnVtYmVyLCBhaWxlcm9uOiBudW1iZXIsIHJ1ZGRlcjogbnVtYmVyKTogU3VyZmFjZUNvbnRyb2xzIHtcbiAgICAgICAgY29uc3QgbWF4U3RhYmlsYXRvciA9IHRoaXMuY29uZmlnLmZjcy5tYXhTdGFiaWxhdG9yUmFkO1xuICAgICAgICBjb25zdCBtYXhBaWxlcm9uID0gdGhpcy5jb25maWcuYWlsZXJvbk1heERlZmxlY3Rpb25SYWQ7XG4gICAgICAgIGNvbnN0IG1heFJ1ZGRlciA9IHRoaXMuY29uZmlnLmZjcy5tYXhSdWRkZXJSYWQ7XG4gICAgICAgIC8vIEVsZXZhdG9yOiArY21kID0gbm9zZSB1cCDihpIgbmVnYXRpdmUgc3RhYmlsYXRvciBpbmNpZGVuY2UgKHRhaWwgbGlmdCBkb3duKS5cbiAgICAgICAgY29uc3QgZWxldmF0b3JBb2EgPSAtZWxldmF0b3IgKiBtYXhTdGFiaWxhdG9yO1xuICAgICAgICAvLyBEaWZmZXJlbnRpYWwgdGFpbCAodGFpbGVyb24pIGFzc2lzdHMgcm9sbC5cbiAgICAgICAgY29uc3QgdGFpbGVyb25Bb2EgPSBhaWxlcm9uICogdGhpcy5jb25maWcuZmNzLnRhaWxlcm9uUm9sbEZyYWN0aW9uICogbWF4U3RhYmlsYXRvcjtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHdpbmdMZWZ0QW9hOiBhaWxlcm9uICogbWF4QWlsZXJvbixcbiAgICAgICAgICAgIHdpbmdSaWdodEFvYTogLWFpbGVyb24gKiBtYXhBaWxlcm9uLFxuICAgICAgICAgICAgaHRhaWxMZWZ0QW9hOiBlbGV2YXRvckFvYSArIHRhaWxlcm9uQW9hLFxuICAgICAgICAgICAgaHRhaWxSaWdodEFvYTogZWxldmF0b3JBb2EgLSB0YWlsZXJvbkFvYSxcbiAgICAgICAgICAgIHZ0YWlsQW9hOiAtcnVkZGVyICogbWF4UnVkZGVyLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKiBEZWxpdmVyZWQgdGhydXN0IChOKSBhdCBhbHRpdHVkZSBmb3IgdGhlIGNvbmZpZ3VyZWQgZW5naW5lLiAqL1xuICAgIHByaXZhdGUgY29tcHV0ZVRocnVzdE4obGV2ZXI6IG51bWJlciwgYWx0aXR1ZGU6IG51bWJlcik6IG51bWJlciB7XG4gICAgICAgIGNvbnN0IGUgPSB0aGlzLmNvbmZpZy5lbmdpbmU7XG4gICAgICAgIGlmIChlLmFmdGVyYnVybmVyKSB7XG4gICAgICAgICAgICAvLyBGLTE2IEYxMDAgcXVhZHJhbnQgKyBsYXBzZSwgdW5jaGFuZ2VkIGZvciB0aGUgZGVmYXVsdCBhaXJjcmFmdC5cbiAgICAgICAgICAgIHJldHVybiBjb21wdXRlRjE2RW5naW5lVGhydXN0TihsZXZlciwgYWx0aXR1ZGUpO1xuICAgICAgICB9XG4gICAgICAgIC8vIFBsYWluIGlkbGXihpJtaWxpdGFyeSBzY2hlZHVsZSB3aXRoIHRoZSBzYW1lIElTQSBkZW5zaXR5IGxhcHNlLlxuICAgICAgICBjb25zdCBzbEtuID0gZS5pZGxlVGhydXN0S24gKyAoZS5taWxUaHJ1c3RLbiAtIGUuaWRsZVRocnVzdEtuKSAqIGNsYW1wKGxldmVyLCAwLCAxKTtcbiAgICAgICAgY29uc3QgcmhvID0gY29tcHV0ZUFpckRlbnNpdHkoYWx0aXR1ZGUpO1xuICAgICAgICByZXR1cm4gc2xLbiAqIDEwMDAgKiBjb21wdXRlVGhydXN0RGVuc2l0eUZhY3RvcihyaG8sIGFsdGl0dWRlKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFjY3VtdWxhdGVTdXJmYWNlKFxuICAgICAgICBzdXJmYWNlOiBBZXJvU3VyZmFjZSwgY29udHJvbEFvYTogbnVtYmVyLCBjYW1iZXI6IG51bWJlcixcbiAgICAgICAgc3RhbGxTaGlmdDogbnVtYmVyLCBleHRyYUNkOiBudW1iZXIsIGFpckRlbnNpdHk6IG51bWJlcixcbiAgICApOiB2b2lkIHtcbiAgICAgICAgc3VyZmFjZS5hY2N1bXVsYXRlKHtcbiAgICAgICAgICAgIHZlbG9jaXR5Qm9keTogdGhpcy52ZWxCb2R5LFxuICAgICAgICAgICAgYW5ndWxhclZlbG9jaXR5Qm9keTogdGhpcy5yYi5hbmd1bGFyVmVsb2NpdHlCb2R5LFxuICAgICAgICAgICAgYWlyRGVuc2l0eSxcbiAgICAgICAgICAgIGNvbnRyb2xEZWx0YUFvYVJhZDogY29udHJvbEFvYSxcbiAgICAgICAgICAgIGNhbWJlckJpYXNSYWQ6IGNhbWJlcixcbiAgICAgICAgICAgIHN0YWxsU2hpZnRSYWQ6IHN0YWxsU2hpZnQsXG4gICAgICAgICAgICBleHRyYUNkLFxuICAgICAgICB9LCB0aGlzLmZvcmNlQm9keSwgdGhpcy5tb21lbnRCb2R5KTtcbiAgICB9XG5cbiAgICAvKiogUGFyYXNpdGUgKGZ1c2VsYWdlICsgZ2VhcikgYW5kIHRyYW5zb25pYyB3YXZlIGRyYWcgYWxvbmcgdGhlIHJlbGF0aXZlIHdpbmQuICovXG4gICAgcHJpdmF0ZSBhZGRCb2R5RHJhZyhkeW5hbWljUHJlc3N1cmU6IG51bWJlciwgc3BlZWQ6IG51bWJlciwgbWFjaDogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIGlmIChzcGVlZCA8IDFlLTMpIHJldHVybjtcbiAgICAgICAgY29uc3Qgd2F2ZURyYWcgPSB0aGlzLmNvbmZpZy53YXZlRHJhZztcbiAgICAgICAgbGV0IGNkMCA9IHRoaXMuY29uZmlnLmJvZHlDZDAgKyAodGhpcy5sYW5kaW5nR2VhckRlcGxveWVkID8gdGhpcy5jb25maWcuZ2VhckNkIDogMCk7XG4gICAgICAgIGlmIChtYWNoID4gd2F2ZURyYWcubWFjaE9uc2V0KSB7XG4gICAgICAgICAgICBjb25zdCBleGNlc3MgPSAobWFjaCAtIHdhdmVEcmFnLm1hY2hPbnNldCkgLyB3YXZlRHJhZy5tYWNoT25zZXQ7XG4gICAgICAgICAgICBjZDAgKz0gd2F2ZURyYWcuc2NhbGUgKiBleGNlc3MgKiBleGNlc3M7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZHJhZ04gPSBkeW5hbWljUHJlc3N1cmUgKiB0aGlzLmNvbmZpZy5nZW9tZXRyeS53aW5nQXJlYU0yICogY2QwO1xuICAgICAgICAvLyBPcHBvc2VzIGJvZHkgdmVsb2NpdHkgKGFjdHMgdGhyb3VnaCBDRywgbm8gbW9tZW50KS5cbiAgICAgICAgdGhpcy5fdi5jb3B5KHRoaXMudmVsQm9keSkubXVsdGlwbHlTY2FsYXIoLWRyYWdOIC8gc3BlZWQpO1xuICAgICAgICB0aGlzLmZvcmNlQm9keS5hZGQodGhpcy5fdik7XG4gICAgfVxuXG4gICAgLyoqIFNwcmluZy1kYW1wZXIgbGFuZGluZyBnZWFyLiBBY2N1bXVsYXRlcyB3b3JsZCBmb3JjZSBhbmQgYm9keSBtb21lbnQuICovXG4gICAgcHJpdmF0ZSBjb21wdXRlR2VhckZvcmNlcygpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5nZWFyRm9yY2VXb3JsZC5zZXQoMCwgMCwgMCk7XG4gICAgICAgIHRoaXMuZ2Vhck1vbWVudEJvZHkuc2V0KDAsIDAsIDApO1xuXG4gICAgICAgIHRoaXMuX29tZWdhV29ybGQuY29weSh0aGlzLnJiLmFuZ3VsYXJWZWxvY2l0eUJvZHkpLmFwcGx5UXVhdGVybmlvbih0aGlzLnJiLm9yaWVudGF0aW9uKTtcblxuICAgICAgICBjb25zdCBnZWFyID0gdGhpcy5jb25maWcuZ2VhcjtcbiAgICAgICAgZm9yIChjb25zdCBncCBvZiBnZWFyLnBvaW50cykge1xuICAgICAgICAgICAgdGhpcy5fdi5zZXQoZ3BbMF0sIGdwWzFdLCBncFsyXSkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMucmIub3JpZW50YXRpb24pO1xuICAgICAgICAgICAgdGhpcy5fZ2VhcldvcmxkLmNvcHkodGhpcy5fdikuYWRkKHRoaXMub2JqLnBvc2l0aW9uKTtcbiAgICAgICAgICAgIGNvbnN0IHBlbmV0cmF0aW9uID0gLXRoaXMuX2dlYXJXb3JsZC55OyAvLyBncm91bmQgcGxhbmUgYXQgd29ybGQgeSA9IDBcbiAgICAgICAgICAgIGlmIChwZW5ldHJhdGlvbiA8PSAwKSBjb250aW51ZTtcblxuICAgICAgICAgICAgLy8gVmVsb2NpdHkgb2YgdGhlIGNvbnRhY3QgcG9pbnQgdGhyb3VnaCB0aGUgd29ybGQuXG4gICAgICAgICAgICB0aGlzLl9jb250YWN0VmVsLmNyb3NzVmVjdG9ycyh0aGlzLl9vbWVnYVdvcmxkLCB0aGlzLl92KS5hZGQodGhpcy5yYi52ZWxvY2l0eVdvcmxkKTtcblxuICAgICAgICAgICAgLy8gTm9ybWFsICh2ZXJ0aWNhbCkgc3ByaW5nLWRhbXBlciByZWFjdGlvbi5cbiAgICAgICAgICAgIGxldCBub3JtYWwgPSBnZWFyLnN0aWZmbmVzcyAqIHBlbmV0cmF0aW9uIC0gZ2Vhci5kYW1waW5nICogdGhpcy5fY29udGFjdFZlbC55O1xuICAgICAgICAgICAgaWYgKG5vcm1hbCA8IDApIG5vcm1hbCA9IDA7XG5cbiAgICAgICAgICAgIC8vIEhvcml6b250YWwgZnJpY3Rpb24gb3Bwb3NpbmcgdGhlIGNvbnRhY3QgZ3JvdW5kIHZlbG9jaXR5LlxuICAgICAgICAgICAgY29uc3Qgdmh4ID0gdGhpcy5fY29udGFjdFZlbC54O1xuICAgICAgICAgICAgY29uc3Qgdmh6ID0gdGhpcy5fY29udGFjdFZlbC56O1xuICAgICAgICAgICAgY29uc3QgdmggPSBNYXRoLmh5cG90KHZoeCwgdmh6KTtcbiAgICAgICAgICAgIHRoaXMuX2ZyaWN0aW9uLnNldCgwLCBub3JtYWwsIDApO1xuICAgICAgICAgICAgaWYgKHZoID4gMWUtMykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJvbGxpbmcgPSB0aGlzLndoZWVsQnJha2VzQXBwbGllZCA/IGdlYXIuYnJha2VGcmljdGlvbiA6IGdlYXIucm9sbEZyaWN0aW9uO1xuICAgICAgICAgICAgICAgIGNvbnN0IG11ID0gTWF0aC5tYXgocm9sbGluZywgZ2Vhci5zaWRlRnJpY3Rpb24gKiB0aGlzLnNpZGVTbGlwRnJhY3Rpb24odmh4LCB2aHopKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmTWFnID0gbXUgKiBub3JtYWw7XG4gICAgICAgICAgICAgICAgdGhpcy5fZnJpY3Rpb24ueCA9IC1mTWFnICogdmh4IC8gdmg7XG4gICAgICAgICAgICAgICAgdGhpcy5fZnJpY3Rpb24ueiA9IC1mTWFnICogdmh6IC8gdmg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuZ2VhckZvcmNlV29ybGQuYWRkKHRoaXMuX2ZyaWN0aW9uKTtcblxuICAgICAgICAgICAgLy8gTW9tZW50IGFib3V0IENHOiByX3dvcmxkIMOXIEZfd29ybGQsIGV4cHJlc3NlZCBpbiB0aGUgYm9keSBmcmFtZS5cbiAgICAgICAgICAgIHRoaXMuX3YyLmNyb3NzVmVjdG9ycyh0aGlzLl92LCB0aGlzLl9mcmljdGlvbikuYXBwbHlRdWF0ZXJuaW9uKHRoaXMuaW52T3JpZW50KTtcbiAgICAgICAgICAgIHRoaXMuZ2Vhck1vbWVudEJvZHkuYWRkKHRoaXMuX3YyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBIaWdoZXIgZWZmZWN0aXZlIGZyaWN0aW9uIGZvciBzaWRld2F5cyAobm9uLXJvbGxpbmcpIGNvbnRhY3QgbW90aW9uLiAqL1xuICAgIHByaXZhdGUgc2lkZVNsaXBGcmFjdGlvbih2aHg6IG51bWJlciwgdmh6OiBudW1iZXIpOiBudW1iZXIge1xuICAgICAgICB0aGlzLl9md2QuY29weShGT1JXQVJEKS5hcHBseVF1YXRlcm5pb24odGhpcy5yYi5vcmllbnRhdGlvbik7XG4gICAgICAgIGNvbnN0IGZ3eCA9IHRoaXMuX2Z3ZC54LCBmd3ogPSB0aGlzLl9md2QuejtcbiAgICAgICAgY29uc3QgZndMZW4gPSBNYXRoLmh5cG90KGZ3eCwgZnd6KSB8fCAxO1xuICAgICAgICBjb25zdCB2aCA9IE1hdGguaHlwb3Qodmh4LCB2aHopIHx8IDE7XG4gICAgICAgIGNvbnN0IGFsb25nID0gTWF0aC5hYnMoKHZoeCAqIGZ3eCArIHZoeiAqIGZ3eikgLyAoZndMZW4gKiB2aCkpO1xuICAgICAgICByZXR1cm4gY2xhbXAoMSAtIGFsb25nLCAwLCAxKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHVwZGF0ZVN0YWxsU3RhdGUoc3BlZWQ6IG51bWJlciwgYW9hOiBudW1iZXIsIGFsdGl0dWRlOiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMubGFuZGVkKSB7IHRoaXMuc3RhbGwgPSAtMTsgcmV0dXJuOyB9XG4gICAgICAgIGNvbnN0IHN0YWxsQW9hID0gdGhpcy5jb25maWcuZW52ZWxvcGUuc3RhbGxBb2FSYWQ7XG4gICAgICAgIGNvbnN0IG1pbkZseWluZ1NwZWVkID0gdGhpcy5jb25maWcuZW52ZWxvcGUubWluRmx5aW5nU3BlZWRNcHM7XG4gICAgICAgIGNvbnN0IGFvYVN0YWxsID0gc3BlZWQgPiA1ID8gY2xhbXAoKE1hdGguYWJzKGFvYSkgLSBzdGFsbEFvYSAqIDAuODUpIC8gKHN0YWxsQW9hICogMC4zKSwgMCwgMSkgOiAwO1xuICAgICAgICBjb25zdCBzcGVlZFN0YWxsID0gYWx0aXR1ZGUgPiBQTEFORV9ESVNUQU5DRV9UT19HUk9VTkQgKyA1XG4gICAgICAgICAgICA/IGNsYW1wKChtaW5GbHlpbmdTcGVlZCAtIHNwZWVkKSAvIG1pbkZseWluZ1NwZWVkLCAwLCAxKSA6IDA7XG4gICAgICAgIGNvbnN0IGxldmVsID0gTWF0aC5tYXgoYW9hU3RhbGwsIHNwZWVkU3RhbGwpO1xuICAgICAgICB0aGlzLnN0YWxsID0gbGV2ZWwgPiAwID8gbGV2ZWwgOiAtMTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGhhbmRsZUdyb3VuZFN0YXRlKCk6IHZvaWQge1xuICAgICAgICBjb25zdCBvbkdyb3VuZCA9IHRoaXMub2JqLnBvc2l0aW9uLnkgPD0gUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5EICsgMC4yNTtcblxuICAgICAgICBpZiAodGhpcy5vYmoucG9zaXRpb24ueSA+IFBMQU5FX0RJU1RBTkNFX1RPX0dST1VORCArIDAuMykge1xuICAgICAgICAgICAgdGhpcy5sYW5kZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhcmQgZmxvb3Igc28gdGhlIGdlYXIgc3ByaW5nIGNhbiBuZXZlciBsZXQgdGhlIGJvZHkgdHVubmVsIHRocm91Z2guXG4gICAgICAgIGNvbnN0IG1pblkgPSBQTEFORV9ESVNUQU5DRV9UT19HUk9VTkQgLSAwLjY7XG4gICAgICAgIGlmICh0aGlzLm9iai5wb3NpdGlvbi55IDwgbWluWSkge1xuICAgICAgICAgICAgdGhpcy5vYmoucG9zaXRpb24ueSA9IG1pblk7XG4gICAgICAgICAgICBpZiAodGhpcy52ZWxvY2l0eS55IDwgMCkgdGhpcy52ZWxvY2l0eS55ID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghb25Hcm91bmQpIHJldHVybjtcblxuICAgICAgICB0aGlzLl9md2QuY29weShGT1JXQVJEKS5hcHBseVF1YXRlcm5pb24odGhpcy5yYi5vcmllbnRhdGlvbik7XG4gICAgICAgIHRoaXMuX3JpZ2h0LmNvcHkoUklHSFQpLmFwcGx5UXVhdGVybmlvbih0aGlzLnJiLm9yaWVudGF0aW9uKTtcbiAgICAgICAgY29uc3Qgc3BlZWQgPSB0aGlzLnZlbG9jaXR5Lmxlbmd0aCgpO1xuICAgICAgICBjb25zdCBwaXRjaEFuZ2xlID0gTWF0aC5hc2luKGNsYW1wKHRoaXMuX2Z3ZC55LCAtMSwgMSkpO1xuICAgICAgICBjb25zdCByb2xsQW5nbGUgPSBNYXRoLmFzaW4oY2xhbXAodGhpcy5fcmlnaHQueSwgLTEsIDEpKTtcblxuICAgICAgICBjb25zdCBlbnYgPSB0aGlzLmNvbmZpZy5lbnZlbG9wZTtcbiAgICAgICAgY29uc3QgaGFyZENvbnRhY3QgPSB0aGlzLnZlbG9jaXR5LnkgPCAtZW52LmxhbmRpbmdNYXhWZXJ0aWNhbFNwZWVkTXBzO1xuICAgICAgICBjb25zdCBiYWRBdHRpdHVkZSA9IE1hdGguYWJzKHJvbGxBbmdsZSkgPiBlbnYubGFuZGluZ01heFJvbGxSYWQgfHwgcGl0Y2hBbmdsZSA8IGVudi5sYW5kaW5nTWluUGl0Y2hSYWQ7XG5cbiAgICAgICAgaWYgKCF0aGlzLmxhbmRlZCAmJiAoaGFyZENvbnRhY3QgfHwgc3BlZWQgPiBlbnYubGFuZGluZ01heFNwZWVkTXBzKSkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmxhbmRpbmdHZWFyRGVwbG95ZWQgfHwgaGFyZENvbnRhY3QgfHwgYmFkQXR0aXR1ZGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNyYXNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMubGFuZGluZ0dlYXJEZXBsb3llZCAmJiB0aGlzLnZlbG9jaXR5LnkgPCAtMS4wKSB7XG4gICAgICAgICAgICB0aGlzLmNyYXNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzcGVlZCA8IGVudi5sYW5kaW5nTWF4U3BlZWRNcHMgJiYgTWF0aC5hYnMocm9sbEFuZ2xlKSA8IGVudi5sYW5kaW5nTWF4Um9sbFJhZCkge1xuICAgICAgICAgICAgdGhpcy5sYW5kZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB3cmFwUG9zaXRpb24oKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGggPSAyLjUgKiBURVJSQUlOX1NDQUxFICogVEVSUkFJTl9NT0RFTF9TSVpFO1xuICAgICAgICBpZiAodGhpcy5vYmoucG9zaXRpb24ueCA+IGgpIHRoaXMub2JqLnBvc2l0aW9uLnggPSAtaDtcbiAgICAgICAgaWYgKHRoaXMub2JqLnBvc2l0aW9uLnggPCAtaCkgdGhpcy5vYmoucG9zaXRpb24ueCA9IGg7XG4gICAgICAgIGlmICh0aGlzLm9iai5wb3NpdGlvbi56ID4gaCkgdGhpcy5vYmoucG9zaXRpb24ueiA9IC1oO1xuICAgICAgICBpZiAodGhpcy5vYmoucG9zaXRpb24ueiA8IC1oKSB0aGlzLm9iai5wb3NpdGlvbi56ID0gaDtcbiAgICB9XG5cbiAgICBnZXRTdGFsbFN0YXR1cygpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5zdGFsbDsgfVxuXG4gICAgLy8gLS0tIFRocm90dGxlIHF1YWRyYW50IGJlaGF2aW91ci4gQWZ0ZXJidXJuZXIgYWlyY3JhZnQgKEYtMTYpIHVzZSB0aGUgRjEwMFxuICAgIC8vIHF1YWRyYW50IHdpdGggTUlML0FCIGRldGVudHM7IG90aGVycyB1c2UgYSBwbGFpbiBsaW5lYXIgMOKAkzEwMCUgbGV2ZXIuIC0tLVxuICAgIHByaXZhdGUgZ2V0IGFmdGVyYnVybmVyKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5jb25maWcuZW5naW5lLmFmdGVyYnVybmVyOyB9XG4gICAgZ2V0VGhyb3R0bGVIdWRUZXh0KCk6IHN0cmluZyB7IHJldHVybiB0aGlzLmFmdGVyYnVybmVyID8gZm9ybWF0RjE2VGhyb3R0bGVIdWQodGhpcy50aHJvdHRsZSkgOiBzdXBlci5nZXRUaHJvdHRsZUh1ZFRleHQoKTsgfVxuICAgIHVzZUYxNlRocm90dGxlRGV0ZW50cygpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuYWZ0ZXJidXJuZXI7IH1cbiAgICBzdGVwVGhyb3R0bGVEZXRlbnQoY3VycmVudDogbnVtYmVyLCBkaXJlY3Rpb246IDEgfCAtMSk6IG51bWJlciB7IHJldHVybiB0aGlzLmFmdGVyYnVybmVyID8gc3RlcEYxNlRocm90dGxlRGV0ZW50KGN1cnJlbnQsIGRpcmVjdGlvbikgOiBzdXBlci5zdGVwVGhyb3R0bGVEZXRlbnQoY3VycmVudCwgZGlyZWN0aW9uKTsgfVxuICAgIGlzSW5UaHJvdHRsZUFiRGV0ZW50QmFuZChsZXZlcjogbnVtYmVyKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLmFmdGVyYnVybmVyID8gaXNGMTZBYkRldGVudEJhbmQobGV2ZXIpIDogc3VwZXIuaXNJblRocm90dGxlQWJEZXRlbnRCYW5kKGxldmVyKTsgfVxuICAgIGFkanVzdFRocm90dGxlSW5wdXQoY3VycmVudDogbnVtYmVyLCBzdGVwOiBudW1iZXIpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5hZnRlcmJ1cm5lciA/IGFkanVzdEYxNlRocm90dGxlSW5wdXQoY3VycmVudCwgc3RlcCkgOiBzdXBlci5hZGp1c3RUaHJvdHRsZUlucHV0KGN1cnJlbnQsIHN0ZXApOyB9XG4gICAgZ2V0VGhyb3R0bGVab25lKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLmFmdGVyYnVybmVyID8gZ2V0RjE2VGhyb3R0bGVab25lKHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUpIDogJ21pbCc7IH1cbiAgICBnZXRUaHJvdHRsZUF1ZGlvTGV2ZWwoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuYWZ0ZXJidXJuZXIgPyBmMTZUaHJvdHRsZUF1ZGlvTGV2ZWwodGhpcy5lZmZlY3RpdmVUaHJvdHRsZSkgOiBzdXBlci5nZXRUaHJvdHRsZUF1ZGlvTGV2ZWwoKTsgfVxuICAgIGdldEVuZ2luZU5venpsZUNvbG9yKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLmFmdGVyYnVybmVyID8gZ2V0RjE2RW5naW5lTm96emxlQ29sb3IodGhpcy5lZmZlY3RpdmVUaHJvdHRsZSkgOiBzdXBlci5nZXRFbmdpbmVOb3p6bGVDb2xvcigpOyB9XG59XG4iLCJpbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgeyBQSVRDSF9SQVRFLCBQTEFORV9ESVNUQU5DRV9UT19HUk9VTkQsIFRFUlJBSU5fTU9ERUxfU0laRSwgVEVSUkFJTl9TQ0FMRSwgWUFXX1JBVEUgfSBmcm9tICcuLi8uLi9kZWZzJztcbmltcG9ydCB7IEZPUldBUkQsIFBJX09WRVJfMTgwLCBSSUdIVCwgVVAsIGNhbGN1bGF0ZVBpdGNoUm9sbCwgY2xhbXAsIGlzWmVybywgcm91bmRUb1plcm8gfSBmcm9tICcuLi8uLi91dGlscy9tYXRoJztcbmltcG9ydCB7IGNvbXB1dGVBbmdsZU9mQXR0YWNrLCBjb21wdXRlQWlyRGVuc2l0eSwgY29tcHV0ZUR5bmFtaWNQcmVzc3VyZSwgY29tcHV0ZUR5bmFtaWNQcmVzc3VyZURyYWdQZW5hbHR5LCBjb21wdXRlSXNhQWlyRGVuc2l0eSwgY29tcHV0ZUxvYWRGYWN0b3JHLCBjb21wdXRlTWFjaE51bWJlciB9IGZyb20gJy4uL2Flcm9VdGlscyc7XG5pbXBvcnQgeyBjb21wdXRlRjE2RW5naW5lVGhydXN0TiwgZm9ybWF0RjE2VGhyb3R0bGVIdWQsIGYxNlRocm90dGxlQXVkaW9MZXZlbCwgZ2V0RjE2RW5naW5lTm96emxlQ29sb3IsIGdldEYxNlRocm90dGxlWm9uZSwgYWRqdXN0RjE2VGhyb3R0bGVJbnB1dCwgc3RlcEYxNlRocm90dGxlRGV0ZW50LCBpc0YxNkFiRGV0ZW50QmFuZCB9IGZyb20gJy4uL2YxNkVuZ2luZSc7XG5pbXBvcnQge1xuICAgIGNvbXB1dGVGMTZDb21tYW5kZWRSb2xsUmF0ZSxcbiAgICBjb21wdXRlRjE2Um9sbFlhd0NvdXBsaW5nLFxuICAgIEYxNl9ST0xMX0NBVDEsXG4gICAgbWF4Um9sbFJhdGVSYWQsXG4gICAgc3RlcEYxNkJvZHlSb2xsUmF0ZSxcbn0gZnJvbSAnLi4vZjE2Um9sbENvbnRyb2wnO1xuaW1wb3J0IHsgY2xhbXBMb2FkRmFjdG9yQWNjZWxlcmF0aW9uLCBjb21wdXRlRjE2UGl0Y2hHTGltaXQsIGNvbXB1dGVGMTZQaXRjaEFvYUF1dGhvcml0eSwgY29tcHV0ZUYxNkFvYVJlY292ZXJ5UmF0ZSB9IGZyb20gJy4uL2YxNkZjc0xpbWl0cyc7XG5pbXBvcnQgeyBGMTZfUFJPRklMRSB9IGZyb20gJy4uL2YxNlByb2ZpbGUnO1xuaW1wb3J0IHsgRmxpZ2h0TW9kZWwgfSBmcm9tICcuL2ZsaWdodE1vZGVsJztcblxuY29uc3QgVEhST1RUTEVfVVBfUkFURSA9IDAuMTA7XG5jb25zdCBUSFJPVFRMRV9ET1dOX1JBVEUgPSAwLjA3O1xuY29uc3QgWUFXX1JBVEVfTEFOREVEID0gWUFXX1JBVEUgKiAyLjA7XG5cbmNvbnN0IERSWV9NQVNTID0gRjE2X1BST0ZJTEUuc2ltTWFzc0tnO1xuY29uc3QgV0lOR19BUkVBID0gRjE2X1BST0ZJTEUud2luZ0FyZWFNMjtcbmNvbnN0IENEMCA9IEYxNl9QUk9GSUxFLmNkMDtcbmNvbnN0IElORFVDRURfRFJBR19LID0gRjE2X1BST0ZJTEUuaW5kdWNlZERyYWdLO1xuY29uc3QgQ0wwID0gRjE2X1BST0ZJTEUuY2wwO1xuY29uc3QgQ0xfQUxQSEEgPSBGMTZfUFJPRklMRS5jbEFscGhhUGVyUmFkO1xuY29uc3QgU1RBTExfQU9BID0gRjE2X1BST0ZJTEUuc3RhbGxBb2FEZWcgKiBNYXRoLlBJIC8gMTgwO1xuY29uc3QgTUFYX0NMID0gMS40ODtcbmNvbnN0IFFfUkVGID0gMC41ICogY29tcHV0ZUlzYUFpckRlbnNpdHkoRjE2X1BST0ZJTEUuY3J1aXNlQWx0aXR1ZGVNKSAqIEYxNl9QUk9GSUxFLmNydWlzZVNwZWVkTXBzICogRjE2X1BST0ZJTEUuY3J1aXNlU3BlZWRNcHM7XG5jb25zdCBNSU5fQ09OVFJPTF9RID0gMC4xMjtcbmNvbnN0IE1BWF9DT05UUk9MX1EgPSAyLjI7XG5jb25zdCBNSU5fRkxZSU5HX1NQRUVEID0gRjE2X1BST0ZJTEUubWluRmx5aW5nU3BlZWRNcHM7XG5jb25zdCBTSURFX1NMSVBfREFNUF9SQVRFID0gNC41O1xuY29uc3QgQ1lfQkVUQSA9IC0wLjY7XG5jb25zdCBZQVdfQ09OVFJPTF9RX1NDQUxFID0gMC40NTtcblxuY29uc3QgQ0RfTEFORElOR19HRUFSID0gMC4wMzU7XG5jb25zdCBDRF9GTEFQUyA9IDAuMDg7XG5jb25zdCBDTF9GTEFQU19GQUNUT1IgPSAxLjI1O1xuXG5jb25zdCBGMTZfUk9MTF9DT05GSUcgPSB7XG4gICAgbWF4Um9sbFJhdGVEZWdTOiBGMTZfUFJPRklMRS5tYXhSb2xsUmF0ZURlZ1MsXG4gICAgYWN0dWF0b3JUYXVTOiBGMTZfUk9MTF9DQVQxLmFjdHVhdG9yVGF1Uyxcbn07XG5cbmNvbnN0IEdST1VORF9GUklDVElPTl9LSU5FVElDID0gMC4xNTtcbmNvbnN0IEdST1VORF9GUklDVElPTl9TVEFUSUMgPSAwLjI7XG5jb25zdCBHUk9VTkRfQlJBS0VfS0lORVRJQyA9IDEuODtcbmNvbnN0IEdST1VORF9CUkFLRV9TVEFUSUMgPSAxLjE3O1xuXG5jb25zdCBMQU5ERURfTUFYX1NQRUVEID0gRjE2X1BST0ZJTEUubGFuZGluZ01heFNwZWVkTXBzO1xuY29uc3QgTEFORElOR19NQVhfVlNQRUVEID0gRjE2X1BST0ZJTEUubGFuZGluZ01heFZlcnRpY2FsU3BlZWRNcHM7XG5jb25zdCBMQU5ESU5HX01JTl9QSVRDSCA9IEYxNl9QUk9GSUxFLmxhbmRpbmdNaW5QaXRjaERlZyAqIFBJX09WRVJfMTgwO1xuY29uc3QgTEFORElOR19NQVhfUk9MTCA9IEYxNl9QUk9GSUxFLmxhbmRpbmdNYXhSb2xsRGVnICogUElfT1ZFUl8xODA7XG5jb25zdCBST1RBVElPTl9TUEVFRCA9IEYxNl9QUk9GSUxFLnJvdGF0aW9uU3BlZWRNcHM7XG5cbmZ1bmN0aW9uIGNvbXB1dGVDbChhb2E6IG51bWJlciwgZmxhcHNFeHRlbmRlZDogYm9vbGVhbik6IG51bWJlciB7XG4gICAgY29uc3QgZmxhcEJvb3N0ID0gZmxhcHNFeHRlbmRlZCA/IENMX0ZMQVBTX0ZBQ1RPUiA6IDEuMDtcbiAgICBjb25zdCBzdGFsbEFvYSA9IGZsYXBzRXh0ZW5kZWQgPyBTVEFMTF9BT0EgKiAxLjEgOiBTVEFMTF9BT0E7XG4gICAgY29uc3QgbWF4Q2wgPSBNQVhfQ0wgKiBmbGFwQm9vc3Q7XG5cbiAgICBpZiAoTWF0aC5hYnMoYW9hKSA8PSBzdGFsbEFvYSkge1xuICAgICAgICByZXR1cm4gY2xhbXAoQ0wwICsgQ0xfQUxQSEEgKiBhb2EgKiBmbGFwQm9vc3QsIC1tYXhDbCAqIDAuMzUsIG1heENsKTtcbiAgICB9XG5cbiAgICBjb25zdCBwZWFrQ2wgPSAoQ0wwICsgQ0xfQUxQSEEgKiBzdGFsbEFvYSAqIE1hdGguc2lnbihhb2EpKSAqIGZsYXBCb29zdDtcbiAgICBjb25zdCBwb3N0U3RhbGwgPSBNYXRoLmNvcygoTWF0aC5hYnMoYW9hKSAtIHN0YWxsQW9hKSAqIDQuMCk7XG4gICAgcmV0dXJuIHBlYWtDbCAqIE1hdGgubWF4KDAsIHBvc3RTdGFsbCk7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVJbmR1Y2VkRHJhZyhjbDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICByZXR1cm4gSU5EVUNFRF9EUkFHX0sgKiBjbCAqIGNsO1xufVxuXG4vKiogUGl0Y2ggcmF0ZSBzY2FsZXMgd2l0aCBhaXJzcGVlZCBzbyBsb3ctc3BlZWQgcm90YXRpb24gY2Fubm90IHNuYXAgdG8gZGVlcC1zdGFsbCBBT0EuICovXG5mdW5jdGlvbiBjb21wdXRlUGl0Y2hTcGVlZEF1dGhvcml0eShzcGVlZDogbnVtYmVyLCBsYW5kZWQ6IGJvb2xlYW4pOiBudW1iZXIge1xuICAgIGxldCBhdXRob3JpdHkgPSBjbGFtcChzcGVlZCAvIE1JTl9GTFlJTkdfU1BFRUQsIDAsIDEpO1xuICAgIGlmIChsYW5kZWQgJiYgc3BlZWQgPCBST1RBVElPTl9TUEVFRCkge1xuICAgICAgICBhdXRob3JpdHkgKj0gY2xhbXAoc3BlZWQgLyBST1RBVElPTl9TUEVFRCwgMCwgMSk7XG4gICAgfVxuICAgIHJldHVybiBhdXRob3JpdHk7XG59XG5cbmV4cG9ydCBjbGFzcyBSZWFsaXN0aWNGbGlnaHRNb2RlbCBleHRlbmRzIEZsaWdodE1vZGVsIHtcblxuICAgIHByaXZhdGUgc3RhbGwgPSAtMTtcbiAgICBwcml2YXRlIGJvZHlSb2xsUmF0ZVJhZCA9IDA7XG5cbiAgICBwcml2YXRlIGZvcndhcmQgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgdXAgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmlnaHQgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgdmVsb2NpdHlVbml0ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHRocnVzdCA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSBkcmFnID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIGxpZnQgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgd2VpZ2h0ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIGZyaWN0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIGZvcmNlcyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSBzaWRlRm9yY2UgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgbGlmdERpcmVjdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSBfdiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5vYmoudXAuY29weShVUCk7XG4gICAgfVxuXG4gICAgcmVzZXQoKSB7XG4gICAgICAgIHN1cGVyLnJlc2V0KCk7XG4gICAgICAgIHRoaXMuc3RhbGwgPSAtMTtcbiAgICAgICAgdGhpcy5ib2R5Um9sbFJhdGVSYWQgPSAwO1xuICAgIH1cblxuICAgIHN0ZXAoZGVsdGE6IG51bWJlcik6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5jcmFzaGVkKSByZXR1cm47XG5cbiAgICAgICAgaWYgKHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgPiB0aGlzLnRocm90dGxlKSB7XG4gICAgICAgICAgICB0aGlzLmVmZmVjdGl2ZVRocm90dGxlID0gTWF0aC5tYXgodGhpcy50aHJvdHRsZSwgdGhpcy5lZmZlY3RpdmVUaHJvdHRsZSAtIFRIUk9UVExFX0RPV05fUkFURSAqIGRlbHRhKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmVmZmVjdGl2ZVRocm90dGxlIDwgdGhpcy50aHJvdHRsZSkge1xuICAgICAgICAgICAgdGhpcy5lZmZlY3RpdmVUaHJvdHRsZSA9IE1hdGgubWluKHRoaXMudGhyb3R0bGUsIHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgKyBUSFJPVFRMRV9VUF9SQVRFICogZGVsdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5mb3J3YXJkLmNvcHkoRk9SV0FSRCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMub2JqLnF1YXRlcm5pb24pO1xuICAgICAgICB0aGlzLnVwLmNvcHkoVVApLmFwcGx5UXVhdGVybmlvbih0aGlzLm9iai5xdWF0ZXJuaW9uKTtcbiAgICAgICAgdGhpcy5yaWdodC5jb3B5KFJJR0hUKS5hcHBseVF1YXRlcm5pb24odGhpcy5vYmoucXVhdGVybmlvbik7XG5cbiAgICAgICAgY29uc3QgYWx0aXR1ZGUgPSB0aGlzLm9iai5wb3NpdGlvbi55O1xuICAgICAgICBjb25zdCBhaXJEZW5zaXR5ID0gY29tcHV0ZUFpckRlbnNpdHkoYWx0aXR1ZGUpO1xuICAgICAgICBjb25zdCBzcGVlZCA9IHRoaXMudmVsb2NpdHkubGVuZ3RoKCk7XG4gICAgICAgIGNvbnN0IGR5bmFtaWNQcmVzc3VyZSA9IGNvbXB1dGVEeW5hbWljUHJlc3N1cmUoYWlyRGVuc2l0eSwgc3BlZWQpO1xuICAgICAgICBjb25zdCBjb250cm9sU2NhbGUgPSBjbGFtcChkeW5hbWljUHJlc3N1cmUgLyBRX1JFRiwgTUlOX0NPTlRST0xfUSwgTUFYX0NPTlRST0xfUSk7XG5cbiAgICAgICAgbGV0IGFvYSA9IDA7XG4gICAgICAgIGlmIChzcGVlZCA+IDEuMCkge1xuICAgICAgICAgICAgYW9hID0gY29tcHV0ZUFuZ2xlT2ZBdHRhY2sodGhpcy5mb3J3YXJkLCB0aGlzLnJpZ2h0LCB0aGlzLnZlbG9jaXR5LCB0aGlzLl92KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmFuZ2xlT2ZBdHRhY2tSYWQgPSBhb2E7XG5cbiAgICAgICAgY29uc3QgY2wgPSBjb21wdXRlQ2woYW9hLCB0aGlzLmZsYXBzRXh0ZW5kZWQpO1xuICAgICAgICBjb25zdCB3YXZlRHJhZyA9IGNvbXB1dGVEeW5hbWljUHJlc3N1cmVEcmFnUGVuYWx0eShzcGVlZCwgYWx0aXR1ZGUpO1xuICAgICAgICBjb25zdCBjZCA9IENEMCAqICgxICsgd2F2ZURyYWcpXG4gICAgICAgICAgICArIGNvbXB1dGVJbmR1Y2VkRHJhZyhjbClcbiAgICAgICAgICAgICsgKHRoaXMubGFuZGluZ0dlYXJEZXBsb3llZCA/IENEX0xBTkRJTkdfR0VBUiA6IDApXG4gICAgICAgICAgICArICh0aGlzLmZsYXBzRXh0ZW5kZWQgPyBDRF9GTEFQUyA6IDApO1xuXG4gICAgICAgIHRoaXMudXBkYXRlU3RhbGxTdGF0ZShzcGVlZCwgYW9hLCBhbHRpdHVkZSk7XG5cbiAgICAgICAgY29uc3QgcGl0Y2hBdXRob3JpdHkgPSB0aGlzLnN0YWxsID49IDAgPyAwLjM1IDogMS4wO1xuICAgICAgICBjb25zdCBwaXRjaFNwZWVkQXV0aG9yaXR5ID0gY29tcHV0ZVBpdGNoU3BlZWRBdXRob3JpdHkoc3BlZWQsIHRoaXMubGFuZGVkKTtcbiAgICAgICAgY29uc3QgcGl0Y2hHTGltaXQgPSBjb21wdXRlRjE2UGl0Y2hHTGltaXQodGhpcy5sb2FkRmFjdG9yRywgdGhpcy5waXRjaCwgRjE2X1BST0ZJTEUubWF4TG9hZEZhY3RvckcpO1xuICAgICAgICBjb25zdCBwaXRjaEFvYUxpbWl0ID0gY29tcHV0ZUYxNlBpdGNoQW9hQXV0aG9yaXR5KGFvYSwgdGhpcy5waXRjaCwgU1RBTExfQU9BKTtcbiAgICAgICAgY29uc3QgYW9hUmVjb3ZlcnkgPSBjb21wdXRlRjE2QW9hUmVjb3ZlcnlSYXRlKGFvYSwgU1RBTExfQU9BLCBzcGVlZCk7XG4gICAgICAgIGNvbnN0IHlhd0NvbnRyb2xTY2FsZSA9IE1JTl9DT05UUk9MX1EgKyAoY29udHJvbFNjYWxlIC0gTUlOX0NPTlRST0xfUSkgKiBZQVdfQ09OVFJPTF9RX1NDQUxFO1xuICAgICAgICBjb25zdCBtYWNoID0gY29tcHV0ZU1hY2hOdW1iZXIoc3BlZWQsIGFsdGl0dWRlKTtcblxuICAgICAgICBjb25zdCBjb21tYW5kZWRSb2xsUmF0ZSA9IGNvbXB1dGVGMTZDb21tYW5kZWRSb2xsUmF0ZSh7XG4gICAgICAgICAgICBzdGljazogdGhpcy5yb2xsLFxuICAgICAgICAgICAgZHluYW1pY1ByZXNzdXJlLFxuICAgICAgICAgICAgcVJlZjogUV9SRUYsXG4gICAgICAgICAgICBtYWNoLFxuICAgICAgICAgICAgYWx0aXR1ZGVNOiBhbHRpdHVkZSxcbiAgICAgICAgICAgIGFvYVJhZDogYW9hLFxuICAgICAgICAgICAgZmxhcHNFeHRlbmRlZDogdGhpcy5mbGFwc0V4dGVuZGVkLFxuICAgICAgICAgICAgbGFuZGVkOiB0aGlzLmxhbmRlZCxcbiAgICAgICAgICAgIGNvbmZpZzogRjE2X1JPTExfQ09ORklHLFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5ib2R5Um9sbFJhdGVSYWQgPSBzdGVwRjE2Qm9keVJvbGxSYXRlKFxuICAgICAgICAgICAgdGhpcy5ib2R5Um9sbFJhdGVSYWQsXG4gICAgICAgICAgICBjb21tYW5kZWRSb2xsUmF0ZSxcbiAgICAgICAgICAgIGRlbHRhLFxuICAgICAgICAgICAgRjE2X1JPTExfQ09ORklHLFxuICAgICAgICApO1xuXG4gICAgICAgIGlmICghdGhpcy5sYW5kZWQgJiYgTWF0aC5hYnModGhpcy5ib2R5Um9sbFJhdGVSYWQpID4gMWUtNikge1xuICAgICAgICAgICAgdGhpcy5vYmoucm90YXRlWih0aGlzLmJvZHlSb2xsUmF0ZVJhZCAqIGRlbHRhKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmxhbmRlZCkge1xuICAgICAgICAgICAgdGhpcy5ib2R5Um9sbFJhdGVSYWQgPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFpc1plcm8odGhpcy5waXRjaClcbiAgICAgICAgICAgICYmICEodGhpcy5sYW5kZWQgJiYgdGhpcy5waXRjaCA8IDApXG4gICAgICAgICAgICAmJiAodGhpcy5zdGFsbCA8IDAgfHwgKHRoaXMucGl0Y2ggPCAwICYmIHRoaXMudXAueSA+IDApIHx8ICh0aGlzLnBpdGNoID4gMCAmJiB0aGlzLnVwLnkgPCAwKSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGlzLm9iai5yb3RhdGVYKC10aGlzLnBpdGNoICogUElUQ0hfUkFURSAqIGNvbnRyb2xTY2FsZSAqIHBpdGNoQXV0aG9yaXR5ICogcGl0Y2hTcGVlZEF1dGhvcml0eSAqIHBpdGNoR0xpbWl0ICogcGl0Y2hBb2FMaW1pdCAqIGRlbHRhKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYW9hUmVjb3ZlcnkgIT09IDApIHtcbiAgICAgICAgICAgIHRoaXMub2JqLnJvdGF0ZVgoTWF0aC5zaWduKGFvYSkgKiBhb2FSZWNvdmVyeSAqIGRlbHRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFN0YWxsIG5vc2UtZG93biBlZmZlY3RcbiAgICAgICAgaWYgKHRoaXMuc3RhbGwgPiAwICYmICF0aGlzLmxhbmRlZCAmJiB0aGlzLnBpdGNoIDw9IDApIHtcbiAgICAgICAgICAgIGNvbnN0IHN0YWxsTm9zZURvd24gPSB0aGlzLnN0YWxsICogMC42OyAvLyByYWQvc1xuICAgICAgICAgICAgY29uc3QgZm9yd2FyZCA9IHRoaXMuZm9yd2FyZDtcbiAgICAgICAgICAgIGNvbnN0IHJpZ2h0ID0gdGhpcy5yaWdodDtcbiAgICAgICAgICAgIGNvbnN0IGdyb3VuZE5vcm1hbCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIC0xLCAwKTtcbiAgICAgICAgICAgIGNvbnN0IHBpdGNoRGlyID0gbmV3IFRIUkVFLlZlY3RvcjMoKS5jcm9zc1ZlY3RvcnMoZm9yd2FyZCwgZ3JvdW5kTm9ybWFsKTtcbiAgICAgICAgICAgIGNvbnN0IGRvdCA9IHBpdGNoRGlyLmRvdChyaWdodCk7XG4gICAgICAgICAgICB0aGlzLm9iai5yb3RhdGVYKE1hdGguc2lnbihkb3QpICogc3RhbGxOb3NlRG93biAqIGRlbHRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIExhbmRlZCBub3NlLWRvd24gZWZmZWN0XG4gICAgICAgIGlmICh0aGlzLmxhbmRlZCAmJiB0aGlzLnBpdGNoIDw9IDApIHtcbiAgICAgICAgICAgIGNvbnN0IGZvcndhcmQgPSB0aGlzLmZvcndhcmQ7XG4gICAgICAgICAgICBjb25zdCBwcmpGb3J3YXJkID0gbmV3IFRIUkVFLlZlY3RvcjMoKS5jb3B5KGZvcndhcmQpLnNldFkoMCkubm9ybWFsaXplKCk7XG4gICAgICAgICAgICBjb25zdCBwaXRjaEFuZ2xlID0gZm9yd2FyZC5hbmdsZVRvKHByakZvcndhcmQpICogTWF0aC5zaWduKGZvcndhcmQueSk7XG5cbiAgICAgICAgICAgIGlmIChwaXRjaEFuZ2xlID4gMC4wMDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzcGVlZEZhY3RvciA9IGNsYW1wKDEgLSBzcGVlZCAvIFJPVEFUSU9OX1NQRUVELCAwLCAxKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmYWxsUmF0ZSA9IHNwZWVkRmFjdG9yICogMC40OyAvLyByYWQvc1xuICAgICAgICAgICAgICAgIGNvbnN0IHJvdGF0aW9uID0gTWF0aC5taW4ocGl0Y2hBbmdsZSwgZmFsbFJhdGUgKiBkZWx0YSk7XG4gICAgICAgICAgICAgICAgdGhpcy5vYmoucm90YXRlWChyb3RhdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBtYXhSb2xsUmF0ZSA9IG1heFJvbGxSYXRlUmFkKEYxNl9ST0xMX0NPTkZJRyk7XG4gICAgICAgIGNvbnN0IHJvbGxZYXdDb3VwbGluZyA9ICF0aGlzLmxhbmRlZCAmJiAhaXNaZXJvKHNwZWVkKVxuICAgICAgICAgICAgPyBjb21wdXRlRjE2Um9sbFlhd0NvdXBsaW5nKHRoaXMuYm9keVJvbGxSYXRlUmFkLCBhb2EsIG1heFJvbGxSYXRlKVxuICAgICAgICAgICAgOiAwO1xuXG4gICAgICAgIGlmICghaXNaZXJvKHNwZWVkKSAmJiAoIWlzWmVybyh0aGlzLnlhdykgfHwgTWF0aC5hYnMocm9sbFlhd0NvdXBsaW5nKSA+IDFlLTYpKSB7XG4gICAgICAgICAgICBjb25zdCBlZmZlY3RpdmVZYXcgPSBjbGFtcCh0aGlzLnlhdyArIHJvbGxZYXdDb3VwbGluZywgLTEsIDEpO1xuICAgICAgICAgICAgdGhpcy5vYmoucm90YXRlWSgtZWZmZWN0aXZlWWF3ICogKHRoaXMubGFuZGVkID8gWUFXX1JBVEVfTEFOREVEIDogWUFXX1JBVEUpICogeWF3Q29udHJvbFNjYWxlICogZGVsdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdGhydXN0TiA9IGNvbXB1dGVGMTZFbmdpbmVUaHJ1c3ROKHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUsIGFsdGl0dWRlKTtcbiAgICAgICAgcm91bmRUb1plcm8odGhpcy50aHJ1c3QuY29weSh0aGlzLmZvcndhcmQpLm11bHRpcGx5U2NhbGFyKHRocnVzdE4pKTtcbiAgICAgICAgdGhpcy5lbmdpbmVUaHJ1c3ROID0gdGhydXN0TjtcblxuICAgICAgICBpZiAoc3BlZWQgPiAxZS0zKSB7XG4gICAgICAgICAgICB0aGlzLnZlbG9jaXR5VW5pdC5jb3B5KHRoaXMudmVsb2NpdHkpLm11bHRpcGx5U2NhbGFyKDEgLyBzcGVlZCk7XG4gICAgICAgICAgICByb3VuZFRvWmVybyh0aGlzLmRyYWcuY29weSh0aGlzLnZlbG9jaXR5VW5pdCkubmVnYXRlKCkubXVsdGlwbHlTY2FsYXIoZHluYW1pY1ByZXNzdXJlICogV0lOR19BUkVBICogY2QpKTtcblxuICAgICAgICAgICAgaWYgKHNwZWVkID4gMC41KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5saWZ0RGlyZWN0aW9uLmNyb3NzVmVjdG9ycyh0aGlzLnJpZ2h0LCB0aGlzLnZlbG9jaXR5VW5pdCk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubGlmdERpcmVjdGlvbi5sZW5ndGhTcSgpIDwgMWUtNikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxpZnREaXJlY3Rpb24uY29weSh0aGlzLnVwKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxpZnREaXJlY3Rpb24ubm9ybWFsaXplKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmxpZnREaXJlY3Rpb24uZG90KHRoaXMudXApIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5saWZ0RGlyZWN0aW9uLm5lZ2F0ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJvdW5kVG9aZXJvKHRoaXMubGlmdC5jb3B5KHRoaXMubGlmdERpcmVjdGlvbikubXVsdGlwbHlTY2FsYXIoZHluYW1pY1ByZXNzdXJlICogV0lOR19BUkVBICogY2wpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5saWZ0LnNldCgwLCAwLCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZHJhZy5zZXQoMCwgMCwgMCk7XG4gICAgICAgICAgICB0aGlzLmxpZnQuc2V0KDAsIDAsIDApO1xuICAgICAgICB9XG5cbiAgICAgICAgcm91bmRUb1plcm8odGhpcy53ZWlnaHQuc2V0KDAsIC1EUllfTUFTUyAqIDkuODA2NjUsIDApKTtcblxuICAgICAgICBpZiAoIXRoaXMubGFuZGVkICYmIHNwZWVkID4gNSkge1xuICAgICAgICAgICAgY29uc3QgbGF0ZXJhbFNwZWVkID0gdGhpcy52ZWxvY2l0eS5kb3QodGhpcy5yaWdodCk7XG4gICAgICAgICAgICBjb25zdCBmb3J3YXJkU3BlZWQgPSB0aGlzLnZlbG9jaXR5LmRvdCh0aGlzLmZvcndhcmQpO1xuICAgICAgICAgICAgY29uc3QgYmV0YSA9IE1hdGguYXRhbjIobGF0ZXJhbFNwZWVkLCBNYXRoLm1heChNYXRoLmFicyhmb3J3YXJkU3BlZWQpLCA1KSk7XG4gICAgICAgICAgICBjb25zdCBkYW1wRm9yY2UgPSAtbGF0ZXJhbFNwZWVkICogU0lERV9TTElQX0RBTVBfUkFURSAqIERSWV9NQVNTO1xuICAgICAgICAgICAgY29uc3QgYmV0YUZvcmNlID0gQ1lfQkVUQSAqIGJldGEgKiBkeW5hbWljUHJlc3N1cmUgKiBXSU5HX0FSRUE7XG4gICAgICAgICAgICByb3VuZFRvWmVybyh0aGlzLnNpZGVGb3JjZS5jb3B5KHRoaXMucmlnaHQpLm11bHRpcGx5U2NhbGFyKGRhbXBGb3JjZSArIGJldGFGb3JjZSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zaWRlRm9yY2Uuc2V0KDAsIDAsIDApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5mb3JjZXMuc2V0KDAsIDAsIDApLmFkZCh0aGlzLnRocnVzdCkuYWRkKHRoaXMuZHJhZykuYWRkKHRoaXMubGlmdCkuYWRkKHRoaXMuc2lkZUZvcmNlKS5hZGQodGhpcy53ZWlnaHQpO1xuXG4gICAgICAgIGNvbnN0IG9uR3JvdW5kID0gdGhpcy5vYmoucG9zaXRpb24ueSA8PSBQTEFORV9ESVNUQU5DRV9UT19HUk9VTkQgKyAwLjA1O1xuICAgICAgICBpZiAodGhpcy5sYW5kZWQgfHwgKHRoaXMud2hlZWxCcmFrZXNBcHBsaWVkICYmIG9uR3JvdW5kKSkge1xuICAgICAgICAgICAgY29uc3Qgd2VpZ2h0TWFnbml0dWRlID0gRFJZX01BU1MgKiA5LjgwNjY1O1xuICAgICAgICAgICAgY29uc3QgcHJqRm9yY2VzID0gdGhpcy5fdi5jb3B5KHRoaXMuZm9yY2VzKS5zZXRZKDApO1xuICAgICAgICAgICAgY29uc3QgcHJqRm9yY2VzTWFnbml0dWRlID0gcHJqRm9yY2VzLmxlbmd0aCgpO1xuICAgICAgICAgICAgY29uc3QgbWF4U3RhdGljRnJpY3Rpb24gPSAodGhpcy53aGVlbEJyYWtlc0FwcGxpZWQgPyBHUk9VTkRfQlJBS0VfU1RBVElDIDogR1JPVU5EX0ZSSUNUSU9OX1NUQVRJQykgKiB3ZWlnaHRNYWduaXR1ZGU7XG4gICAgICAgICAgICBjb25zdCBraW5ldGljRnJpY3Rpb24gPSAodGhpcy53aGVlbEJyYWtlc0FwcGxpZWQgPyBHUk9VTkRfQlJBS0VfS0lORVRJQyA6IEdST1VORF9GUklDVElPTl9LSU5FVElDKSAqIHdlaWdodE1hZ25pdHVkZTtcblxuICAgICAgICAgICAgaWYgKGlzWmVybyhzcGVlZCkgJiYgcHJqRm9yY2VzTWFnbml0dWRlIDwgbWF4U3RhdGljRnJpY3Rpb24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZyaWN0aW9uLmNvcHkocHJqRm9yY2VzKS5uZWdhdGUoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc3BlZWQgPiAwLjUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZyaWN0aW9uLmNvcHkodGhpcy52ZWxvY2l0eVVuaXQpLnNldFkoMCkubmVnYXRlKCkubm9ybWFsaXplKCkubXVsdGlwbHlTY2FsYXIoa2luZXRpY0ZyaWN0aW9uKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5mcmljdGlvbi5zZXQoMCwgMCwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByb3VuZFRvWmVybyh0aGlzLmZyaWN0aW9uKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZnJpY3Rpb24uc2V0KDAsIDAsIDApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5mb3JjZXMuYWRkKHRoaXMuZnJpY3Rpb24pO1xuICAgICAgICBpZiAodGhpcy5sYW5kZWQgJiYgdGhpcy5mb3JjZXMueSA8IDApIHtcbiAgICAgICAgICAgIHRoaXMuZm9yY2VzLnNldFkoMCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhY2NlbCA9IHJvdW5kVG9aZXJvKHRoaXMuZm9yY2VzLmRpdmlkZVNjYWxhcihEUllfTUFTUykpO1xuICAgICAgICB0aGlzLnVwLmNvcHkoVVApLmFwcGx5UXVhdGVybmlvbih0aGlzLm9iai5xdWF0ZXJuaW9uKTtcbiAgICAgICAgY2xhbXBMb2FkRmFjdG9yQWNjZWxlcmF0aW9uKGFjY2VsLCB0aGlzLnVwLCBGMTZfUFJPRklMRS5tYXhMb2FkRmFjdG9yRyk7XG4gICAgICAgIHRoaXMubG9hZEZhY3RvckcgPSBjb21wdXRlTG9hZEZhY3RvckcoYWNjZWwsIHRoaXMudXApO1xuICAgICAgICB0aGlzLnZlbG9jaXR5LmFkZFNjYWxlZFZlY3RvcihhY2NlbCwgZGVsdGEpO1xuXG4gICAgICAgIGlmICh0aGlzLmxhbmRlZCAmJiB0aGlzLnZlbG9jaXR5LnkgPCAwKSB7XG4gICAgICAgICAgICB0aGlzLnZlbG9jaXR5LnNldFkoMCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm9iai5wb3NpdGlvbi5hZGRTY2FsZWRWZWN0b3IoXG4gICAgICAgICAgICB0aGlzLmxhbmRlZCA/IHJvdW5kVG9aZXJvKHRoaXMudmVsb2NpdHksIDAuMDEpIDogdGhpcy52ZWxvY2l0eSxcbiAgICAgICAgICAgIGRlbHRhXG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKHRoaXMub2JqLnBvc2l0aW9uLnkgPiBQTEFORV9ESVNUQU5DRV9UT19HUk9VTkQpIHtcbiAgICAgICAgICAgIHRoaXMubGFuZGVkID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmhhbmRsZUdyb3VuZENvbnRhY3Qoc3BlZWQpO1xuXG4gICAgICAgIHRoaXMud3JhcFBvc2l0aW9uKCk7XG4gICAgfVxuXG4gICAgZ2V0U3RhbGxTdGF0dXMoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhbGw7XG4gICAgfVxuXG4gICAgZ2V0VGhyb3R0bGVIdWRUZXh0KCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBmb3JtYXRGMTZUaHJvdHRsZUh1ZCh0aGlzLnRocm90dGxlKTtcbiAgICB9XG5cbiAgICB1c2VGMTZUaHJvdHRsZURldGVudHMoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHN0ZXBUaHJvdHRsZURldGVudChjdXJyZW50OiBudW1iZXIsIGRpcmVjdGlvbjogMSB8IC0xKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHN0ZXBGMTZUaHJvdHRsZURldGVudChjdXJyZW50LCBkaXJlY3Rpb24pO1xuICAgIH1cblxuICAgIGlzSW5UaHJvdHRsZUFiRGV0ZW50QmFuZChsZXZlcjogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiBpc0YxNkFiRGV0ZW50QmFuZChsZXZlcik7XG4gICAgfVxuXG4gICAgYWRqdXN0VGhyb3R0bGVJbnB1dChjdXJyZW50OiBudW1iZXIsIHN0ZXA6IG51bWJlcik6IG51bWJlciB7XG4gICAgICAgIHJldHVybiBhZGp1c3RGMTZUaHJvdHRsZUlucHV0KGN1cnJlbnQsIHN0ZXApO1xuICAgIH1cblxuICAgIGdldFRocm90dGxlWm9uZSgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gZ2V0RjE2VGhyb3R0bGVab25lKHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUpO1xuICAgIH1cblxuICAgIGdldFRocm90dGxlQXVkaW9MZXZlbCgpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gZjE2VGhyb3R0bGVBdWRpb0xldmVsKHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUpO1xuICAgIH1cblxuICAgIGdldEVuZ2luZU5venpsZUNvbG9yKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBnZXRGMTZFbmdpbmVOb3p6bGVDb2xvcih0aGlzLmVmZmVjdGl2ZVRocm90dGxlKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHVwZGF0ZVN0YWxsU3RhdGUoc3BlZWQ6IG51bWJlciwgYW9hOiBudW1iZXIsIGFsdGl0dWRlOiBudW1iZXIpIHtcbiAgICAgICAgaWYgKHRoaXMubGFuZGVkIHx8IHNwZWVkIDwgNSkge1xuICAgICAgICAgICAgdGhpcy5zdGFsbCA9IC0xO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYW9hU3RhbGwgPSBjbGFtcCgoTWF0aC5hYnMoYW9hKSAtIFNUQUxMX0FPQSAqIDAuNzUpIC8gKFNUQUxMX0FPQSAqIDAuMzUpLCAwLCAxKTtcbiAgICAgICAgY29uc3Qgc3BlZWRTdGFsbCA9IGNsYW1wKChNSU5fRkxZSU5HX1NQRUVEIC0gc3BlZWQpIC8gTUlOX0ZMWUlOR19TUEVFRCwgMCwgMSk7XG4gICAgICAgIC8vIE9ubHkgY29uc2lkZXIgc3BlZWQtYmFzZWQgc3RhbGwgaWYgd2UgYXJlIGhpZ2ggZW5vdWdoIHRvIGF2b2lkIGludGVyZmVyaW5nIHdpdGggdGFrZW9mZi9sYW5kaW5nXG4gICAgICAgIGNvbnN0IHN0YWxsTGV2ZWwgPSBNYXRoLm1heChhb2FTdGFsbCwgYWx0aXR1ZGUgPiBQTEFORV9ESVNUQU5DRV9UT19HUk9VTkQgKyA1ID8gc3BlZWRTdGFsbCA6IDApO1xuICAgICAgICB0aGlzLnN0YWxsID0gc3RhbGxMZXZlbCA+IDAgPyBzdGFsbExldmVsIDogLTE7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBoYW5kbGVHcm91bmRDb250YWN0KHNwZWVkOiBudW1iZXIpIHtcbiAgICAgICAgaWYgKHRoaXMub2JqLnBvc2l0aW9uLnkgPj0gUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5EKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm9iai5wb3NpdGlvbi55ID0gUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5EO1xuXG4gICAgICAgIGNvbnN0IGZvcndhcmQgPSB0aGlzLmZvcndhcmQuY29weShGT1JXQVJEKS5hcHBseVF1YXRlcm5pb24odGhpcy5vYmoucXVhdGVybmlvbik7XG4gICAgICAgIGNvbnN0IHVwID0gdGhpcy51cC5jb3B5KFVQKS5hcHBseVF1YXRlcm5pb24odGhpcy5vYmoucXVhdGVybmlvbik7XG4gICAgICAgIGNvbnN0IHJpZ2h0ID0gdGhpcy5yaWdodC5jb3B5KFJJR0hUKS5hcHBseVF1YXRlcm5pb24odGhpcy5vYmoucXVhdGVybmlvbik7XG5cbiAgICAgICAgY29uc3QgcHJqRm9yd2FyZCA9IG5ldyBUSFJFRS5WZWN0b3IzKCkuY29weShmb3J3YXJkKS5zZXRZKDApLm5vcm1hbGl6ZSgpO1xuICAgICAgICBjb25zdCBwaXRjaEFuZ2xlID0gZm9yd2FyZC5hbmdsZVRvKHByakZvcndhcmQpICogTWF0aC5zaWduKGZvcndhcmQueSk7XG5cbiAgICAgICAgY29uc3QgcHJqUmlnaHQgPSBuZXcgVEhSRUUuVmVjdG9yMygpLmNvcHkocmlnaHQpLnNldFkoMCkubm9ybWFsaXplKCk7XG4gICAgICAgIGNvbnN0IHJvbGxBbmdsZSA9IHJpZ2h0LmFuZ2xlVG8ocHJqUmlnaHQpICogTWF0aC5zaWduKHJpZ2h0LnkpO1xuXG4gICAgICAgIGlmICh0aGlzLmxhbmRpbmdHZWFyRGVwbG95ZWQgPT09IGZhbHNlXG4gICAgICAgICAgICB8fCBzcGVlZCA+IExBTkRFRF9NQVhfU1BFRURcbiAgICAgICAgICAgIHx8IHRoaXMudmVsb2NpdHkueSA8IC1MQU5ESU5HX01BWF9WU1BFRURcbiAgICAgICAgICAgIHx8IE1hdGguYWJzKHJvbGxBbmdsZSkgPiBMQU5ESU5HX01BWF9ST0xMXG4gICAgICAgICAgICB8fCBMQU5ESU5HX01JTl9QSVRDSCA+IHBpdGNoQW5nbGUpIHtcbiAgICAgICAgICAgIHRoaXMuY3Jhc2hlZCA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZm9yd2FyZC55IDwgMCkge1xuICAgICAgICAgICAgY29uc3QgaGVhZGluZyA9IG5ldyBUSFJFRS5WZWN0b3IzKCkuY29weShmb3J3YXJkKS5zZXRZKDApLm5vcm1hbGl6ZSgpO1xuICAgICAgICAgICAgdGhpcy5vYmoucXVhdGVybmlvbi5zZXRGcm9tVW5pdFZlY3RvcnMoRk9SV0FSRCwgaGVhZGluZyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy52ZWxvY2l0eS5zZXRZKDApO1xuICAgICAgICB0aGlzLnN0YWxsID0gLTE7XG4gICAgICAgIHRoaXMubGFuZGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHdyYXBQb3NpdGlvbigpIHtcbiAgICAgICAgY29uc3QgdGVycmFpbkhhbGZTaXplID0gMi41ICogVEVSUkFJTl9TQ0FMRSAqIFRFUlJBSU5fTU9ERUxfU0laRTtcbiAgICAgICAgaWYgKHRoaXMub2JqLnBvc2l0aW9uLnggPiB0ZXJyYWluSGFsZlNpemUpIHRoaXMub2JqLnBvc2l0aW9uLnggPSAtdGVycmFpbkhhbGZTaXplO1xuICAgICAgICBpZiAodGhpcy5vYmoucG9zaXRpb24ueCA8IC10ZXJyYWluSGFsZlNpemUpIHRoaXMub2JqLnBvc2l0aW9uLnggPSB0ZXJyYWluSGFsZlNpemU7XG4gICAgICAgIGlmICh0aGlzLm9iai5wb3NpdGlvbi56ID4gdGVycmFpbkhhbGZTaXplKSB0aGlzLm9iai5wb3NpdGlvbi56ID0gLXRlcnJhaW5IYWxmU2l6ZTtcbiAgICAgICAgaWYgKHRoaXMub2JqLnBvc2l0aW9uLnogPCAtdGVycmFpbkhhbGZTaXplKSB0aGlzLm9iai5wb3NpdGlvbi56ID0gdGVycmFpbkhhbGZTaXplO1xuICAgIH1cbn1cbiIsImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcbmltcG9ydCB7IFJlYWxpc3RpY0ZsaWdodE1vZGVsIH0gZnJvbSAnLi4vbW9kZWwvcmVhbGlzdGljRmxpZ2h0TW9kZWwnO1xuaW1wb3J0IHsgQXJjYWRlRmxpZ2h0TW9kZWwgfSBmcm9tICcuLi9tb2RlbC9hcmNhZGVGbGlnaHRNb2RlbCc7XG5pbXBvcnQgeyBEZWJ1Z0ZsaWdodE1vZGVsIH0gZnJvbSAnLi4vbW9kZWwvZGVidWdGbGlnaHRNb2RlbCc7XG5pbXBvcnQgeyBGbTJGbGlnaHRNb2RlbCB9IGZyb20gJy4uL21vZGVsL2ZtMkZsaWdodE1vZGVsJztcbmltcG9ydCB7IEZsaWdodE1vZGVsIH0gZnJvbSAnLi4vbW9kZWwvZmxpZ2h0TW9kZWwnO1xuaW1wb3J0IHsgRm0yQWlyY3JhZnRDb25maWcgfSBmcm9tICcuLi9mbTIvZm0yQWlyY3JhZnRDb25maWcnO1xuXG5sZXQgZmxpZ2h0TW9kZWw6IEZsaWdodE1vZGVsO1xubGV0IG1vZGVsVHlwZTogc3RyaW5nIHwgdW5kZWZpbmVkO1xuXG5zZWxmLm9ubWVzc2FnZSA9IChldmVudDogTWVzc2FnZUV2ZW50KSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgICAgaGFuZGxlTWVzc2FnZShldmVudC5kYXRhKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc3QgZSA9IGVyciBhcyBFcnJvcjtcbiAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7IHR5cGU6ICdlcnJvcicsIG1lc3NhZ2U6IGAke2U/Lm5hbWV9OiAke2U/Lm1lc3NhZ2V9YCwgc3RhY2s6IGU/LnN0YWNrIH0pO1xuICAgIH1cbn07XG5cbmZ1bmN0aW9uIGJ1aWxkTW9kZWwodHlwZTogc3RyaW5nLCBhaXJjcmFmdENvbmZpZz86IEZtMkFpcmNyYWZ0Q29uZmlnKTogRmxpZ2h0TW9kZWwgfCB1bmRlZmluZWQge1xuICAgIGlmICh0eXBlID09PSAncmVhbGlzdGljJykgcmV0dXJuIG5ldyBSZWFsaXN0aWNGbGlnaHRNb2RlbCgpO1xuICAgIGlmICh0eXBlID09PSAnZm0yJykgcmV0dXJuIG5ldyBGbTJGbGlnaHRNb2RlbChhaXJjcmFmdENvbmZpZyk7XG4gICAgaWYgKHR5cGUgPT09ICdhcmNhZGUnKSByZXR1cm4gbmV3IEFyY2FkZUZsaWdodE1vZGVsKCk7XG4gICAgaWYgKHR5cGUgPT09ICdkZWJ1ZycpIHJldHVybiBuZXcgRGVidWdGbGlnaHRNb2RlbCgpO1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG59XG5cbi8qKiBDb3B5IHRoZSBsaXZlIHJpZ2lkLWJvZHkgc3RhdGUgc28gYW4gYWlyY3JhZnQgc3dhcCBkb2VzIG5vdCB0ZWxlcG9ydC9yZXNldC4gKi9cbmZ1bmN0aW9uIHByZXNlcnZlU3RhdGUoZnJvbTogRmxpZ2h0TW9kZWwsIHRvOiBGbGlnaHRNb2RlbCkge1xuICAgIHRvLnJlc2V0KCk7XG4gICAgdG8uc2V0Q3Jhc2hlZChmcm9tLmlzQ3Jhc2hlZCgpKTtcbiAgICB0by5zZXRMYW5kZWQoZnJvbS5pc0xhbmRlZCgpKTtcbiAgICB0by5wb3NpdGlvbiA9IGZyb20ucG9zaXRpb247XG4gICAgdG8ucXVhdGVybmlvbiA9IGZyb20ucXVhdGVybmlvbjtcbiAgICB0by52ZWxvY2l0eVZlY3RvciA9IGZyb20udmVsb2NpdHlWZWN0b3I7XG59XG5cbmZ1bmN0aW9uIGhhbmRsZU1lc3NhZ2UoZGF0YTogYW55KSB7XG4gICAgc3dpdGNoIChkYXRhLnR5cGUpIHtcbiAgICAgICAgY2FzZSAnaW5pdCc6IHtcbiAgICAgICAgICAgIG1vZGVsVHlwZSA9IGRhdGEubW9kZWxUeXBlO1xuICAgICAgICAgICAgY29uc3QgbW9kZWwgPSBidWlsZE1vZGVsKGRhdGEubW9kZWxUeXBlLCBkYXRhLmFpcmNyYWZ0Q29uZmlnKTtcbiAgICAgICAgICAgIGlmIChtb2RlbCkgZmxpZ2h0TW9kZWwgPSBtb2RlbDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgY2FzZSAnc2V0QWlyY3JhZnQnOiB7XG4gICAgICAgICAgICAvLyBPbmx5IHRoZSBGTTIgbW9kZWwgaXMgcGVyLWFpcmNyYWZ0OyByZWJ1aWxkIGl0IHdpdGggdGhlIG5ldyBjb25maWdcbiAgICAgICAgICAgIC8vIHdoaWxlIGNhcnJ5aW5nIG92ZXIgdGhlIGN1cnJlbnQgZmxpZ2h0IHN0YXRlLlxuICAgICAgICAgICAgaWYgKG1vZGVsVHlwZSAhPT0gJ2ZtMicgfHwgIWRhdGEuYWlyY3JhZnRDb25maWcpIGJyZWFrO1xuICAgICAgICAgICAgY29uc3QgbmV4dCA9IG5ldyBGbTJGbGlnaHRNb2RlbChkYXRhLmFpcmNyYWZ0Q29uZmlnKTtcbiAgICAgICAgICAgIGlmIChmbGlnaHRNb2RlbCkgcHJlc2VydmVTdGF0ZShmbGlnaHRNb2RlbCwgbmV4dCk7XG4gICAgICAgICAgICBmbGlnaHRNb2RlbCA9IG5leHQ7XG4gICAgICAgICAgICBzZW5kU3RhdGUoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgY2FzZSAndXBkYXRlJzpcbiAgICAgICAgICAgIGlmICghZmxpZ2h0TW9kZWwpIHJldHVybjtcbiAgICAgICAgICAgIGZsaWdodE1vZGVsLnNldFBpdGNoKGRhdGEuaW5wdXRzLnBpdGNoKTtcbiAgICAgICAgICAgIGZsaWdodE1vZGVsLnNldFJvbGwoZGF0YS5pbnB1dHMucm9sbCk7XG4gICAgICAgICAgICBmbGlnaHRNb2RlbC5zZXRZYXcoZGF0YS5pbnB1dHMueWF3KTtcbiAgICAgICAgICAgIGZsaWdodE1vZGVsLnNldFRocm90dGxlKGRhdGEuaW5wdXRzLnRocm90dGxlKTtcbiAgICAgICAgICAgIGZsaWdodE1vZGVsLnNldExhbmRpbmdHZWFyRGVwbG95ZWQoZGF0YS5pbnB1dHMubGFuZGluZ0dlYXJEZXBsb3llZCk7XG4gICAgICAgICAgICBmbGlnaHRNb2RlbC5zZXRGbGFwc0V4dGVuZGVkKGRhdGEuaW5wdXRzLmZsYXBzRXh0ZW5kZWQpO1xuICAgICAgICAgICAgZmxpZ2h0TW9kZWwuc2V0V2hlZWxCcmFrZXMoZGF0YS5pbnB1dHMud2hlZWxCcmFrZXNBcHBsaWVkKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZmxpZ2h0TW9kZWwudXBkYXRlKGRhdGEuZGVsdGEpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBzZW5kU3RhdGUoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgJ3Jlc2V0JzpcbiAgICAgICAgICAgIGlmICghZmxpZ2h0TW9kZWwpIHJldHVybjtcbiAgICAgICAgICAgIGZsaWdodE1vZGVsLnJlc2V0KCk7XG4gICAgICAgICAgICBmbGlnaHRNb2RlbC5wb3NpdGlvbi5zZXQoZGF0YS5wb3NpdGlvblswXSwgZGF0YS5wb3NpdGlvblsxXSwgZGF0YS5wb3NpdGlvblsyXSk7XG4gICAgICAgICAgICBmbGlnaHRNb2RlbC5xdWF0ZXJuaW9uLnNldChkYXRhLnF1YXRlcm5pb25bMF0sIGRhdGEucXVhdGVybmlvblsxXSwgZGF0YS5xdWF0ZXJuaW9uWzJdLCBkYXRhLnF1YXRlcm5pb25bM10pO1xuICAgICAgICAgICAgZmxpZ2h0TW9kZWwudmVsb2NpdHlWZWN0b3Iuc2V0KGRhdGEudmVsb2NpdHlbMF0sIGRhdGEudmVsb2NpdHlbMV0sIGRhdGEudmVsb2NpdHlbMl0pO1xuICAgICAgICAgICAgZmxpZ2h0TW9kZWwuc2V0TGFuZGVkKGRhdGEubGFuZGVkKTtcbiAgICAgICAgICAgIGZsaWdodE1vZGVsLnNldFRocm90dGxlKGRhdGEudGhyb3R0bGUpO1xuICAgICAgICAgICAgc2VuZFN0YXRlKCk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICdzeW5jRWZmZWN0aXZlVGhyb3R0bGUnOlxuICAgICAgICAgICAgaWYgKCFmbGlnaHRNb2RlbCkgcmV0dXJuO1xuICAgICAgICAgICAgZmxpZ2h0TW9kZWwuc2V0VGhyb3R0bGUoZGF0YS50aHJvdHRsZSk7XG4gICAgICAgICAgICBmbGlnaHRNb2RlbC5zeW5jRWZmZWN0aXZlVGhyb3R0bGUoKTtcbiAgICAgICAgICAgIHNlbmRTdGF0ZSgpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnc2V0UG9zaXRpb24nOlxuICAgICAgICAgICAgaWYgKCFmbGlnaHRNb2RlbCkgcmV0dXJuO1xuICAgICAgICAgICAgZmxpZ2h0TW9kZWwucG9zaXRpb24uc2V0KGRhdGEucG9zaXRpb25bMF0sIGRhdGEucG9zaXRpb25bMV0sIGRhdGEucG9zaXRpb25bMl0pO1xuICAgICAgICAgICAgc2VuZFN0YXRlKCk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICdzZXRRdWF0ZXJuaW9uJzpcbiAgICAgICAgICAgIGlmICghZmxpZ2h0TW9kZWwpIHJldHVybjtcbiAgICAgICAgICAgIGZsaWdodE1vZGVsLnF1YXRlcm5pb24uc2V0KGRhdGEucXVhdGVybmlvblswXSwgZGF0YS5xdWF0ZXJuaW9uWzFdLCBkYXRhLnF1YXRlcm5pb25bMl0sIGRhdGEucXVhdGVybmlvblszXSk7XG4gICAgICAgICAgICBzZW5kU3RhdGUoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgJ3NldFZlbG9jaXR5JzpcbiAgICAgICAgICAgIGlmICghZmxpZ2h0TW9kZWwpIHJldHVybjtcbiAgICAgICAgICAgIGZsaWdodE1vZGVsLnZlbG9jaXR5VmVjdG9yLnNldChkYXRhLnZlbG9jaXR5WzBdLCBkYXRhLnZlbG9jaXR5WzFdLCBkYXRhLnZlbG9jaXR5WzJdKTtcbiAgICAgICAgICAgIHNlbmRTdGF0ZSgpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnc25hcFBoeXNpY3NTdGF0ZSc6XG4gICAgICAgICAgICBpZiAoIWZsaWdodE1vZGVsKSByZXR1cm47XG4gICAgICAgICAgICBmbGlnaHRNb2RlbC5zbmFwUGh5c2ljc1N0YXRlKCk7XG4gICAgICAgICAgICBzZW5kU3RhdGUoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbn07XG5cbmZ1bmN0aW9uIHNlbmRTdGF0ZSgpIHtcbiAgICBpZiAoIWZsaWdodE1vZGVsKSByZXR1cm47XG4gICAgY29uc3Qgc3RhdGUgPSB7XG4gICAgICAgIHBvc2l0aW9uOiBmbGlnaHRNb2RlbC5wb3NpdGlvbi50b0FycmF5KCksXG4gICAgICAgIHF1YXRlcm5pb246IGZsaWdodE1vZGVsLnF1YXRlcm5pb24udG9BcnJheSgpLFxuICAgICAgICB2ZWxvY2l0eTogZmxpZ2h0TW9kZWwudmVsb2NpdHlWZWN0b3IudG9BcnJheSgpLFxuICAgICAgICAvLyBAdHMtaWdub3JlIC0gYWNjZXNzaW5nIHByb3RlY3RlZCBtZW1iZXJzIGZvciB0cmFuc2ZlclxuICAgICAgICBwcmV2UG9zaXRpb246IGZsaWdodE1vZGVsLnByZXZQb3NpdGlvbi50b0FycmF5KCksXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcHJldlF1YXRlcm5pb246IGZsaWdodE1vZGVsLnByZXZRdWF0ZXJuaW9uLnRvQXJyYXkoKSxcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBwcmV2VmVsb2NpdHk6IGZsaWdodE1vZGVsLnByZXZWZWxvY2l0eS50b0FycmF5KCksXG4gICAgICAgIGNyYXNoZWQ6IGZsaWdodE1vZGVsLmlzQ3Jhc2hlZCgpLFxuICAgICAgICBsYW5kZWQ6IGZsaWdodE1vZGVsLmlzTGFuZGVkKCksXG4gICAgICAgIGFuZ2xlT2ZBdHRhY2tSYWQ6IGZsaWdodE1vZGVsLmdldEFuZ2xlT2ZBdHRhY2soKSxcbiAgICAgICAgbG9hZEZhY3Rvckc6IGZsaWdodE1vZGVsLmdldExvYWRGYWN0b3JHKCksXG4gICAgICAgIGVuZ2luZVRocnVzdE46IGZsaWdodE1vZGVsLmdldEVuZ2luZVRocnVzdEtuKCkgKiAxMDAwLFxuICAgICAgICBlZmZlY3RpdmVUaHJvdHRsZTogZmxpZ2h0TW9kZWwuZ2V0RWZmZWN0aXZlVGhyb3R0bGUoKSxcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBkZWx0YVJlbWFpbmRlcjogZmxpZ2h0TW9kZWwuZGVsdGFSZW1haW5kZXIsXG4gICAgICAgIHN0YWxsOiBmbGlnaHRNb2RlbC5nZXRTdGFsbFN0YXR1cygpXG4gICAgfTtcblxuICAgIHNlbGYucG9zdE1lc3NhZ2UoeyB0eXBlOiAnc3RhdGUnLCBzdGF0ZSB9KTtcbn1cbiIsImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcblxuY29uc3QgX3YgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuY29uc3QgX3cgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuY29uc3QgX3EgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuXG5jb25zdCBFUFNJTE9OID0gMC4wMDAxO1xuXG5leHBvcnQgY29uc3QgWkVSTyA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIDApO1xuZXhwb3J0IGNvbnN0IFVQID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMSwgMCk7XG5leHBvcnQgY29uc3QgRk9SV0FSRCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIDEpO1xuZXhwb3J0IGNvbnN0IFJJR0hUID0gbmV3IFRIUkVFLlZlY3RvcjMoMSwgMCwgMCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1plcm8objogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIC1FUFNJTE9OIDw9IG4gJiYgbiA8PSBFUFNJTE9OO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZXF1YWxzKGE6IG51bWJlciwgYjogbnVtYmVyLCBlcHNpbG9uOiBudW1iZXIgPSBFUFNJTE9OKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGEgLSBlcHNpbG9uIDw9IGIgJiYgYiA8PSBhICsgZXBzaWxvbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNsYW1wKG46IG51bWJlciwgbWluOiBudW1iZXIsIG1heDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICByZXR1cm4gTWF0aC5tYXgobWluLCBNYXRoLm1pbihuLCBtYXgpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxlcnAodDogbnVtYmVyLCBuMDogbnVtYmVyLCBuMTogbnVtYmVyKTogbnVtYmVyIHtcbiAgICByZXR1cm4gbjAgKyB0ICogKG4xIC0gbjApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdmVjdG9ySGVhZGluZyh2OiBUSFJFRS5WZWN0b3IzKTogbnVtYmVyIHtcbiAgICBsZXQgYmVhcmluZyA9IE1hdGgucm91bmQoTWF0aC5hdGFuMih2LngsIC12LnopIC8gKDIgKiBNYXRoLlBJKSAqIDM2MCk7XG4gICAgaWYgKGJlYXJpbmcgPCAwKSB7XG4gICAgICAgIGJlYXJpbmcgPSAzNjAgKyBiZWFyaW5nO1xuICAgIH1cbiAgICByZXR1cm4gYmVhcmluZztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJvdW5kVG9aZXJvKHY6IFRIUkVFLlZlY3RvcjMsIGVwc2lsb246IG51bWJlciA9IEVQU0lMT04pOiBUSFJFRS5WZWN0b3IzIHtcbiAgICBpZiAoZXF1YWxzKHYueCwgMC4wLCBlcHNpbG9uKSkge1xuICAgICAgICB2LnggPSAwO1xuICAgIH1cbiAgICBpZiAoZXF1YWxzKHYueSwgMC4wLCBlcHNpbG9uKSkge1xuICAgICAgICB2LnkgPSAwO1xuICAgIH1cbiAgICBpZiAoZXF1YWxzKHYueiwgMC4wLCBlcHNpbG9uKSkge1xuICAgICAgICB2LnogPSAwO1xuICAgIH1cbiAgICByZXR1cm4gdjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVhc2VPdXRDaXJjKHg6IG51bWJlcik6IG51bWJlciB7XG4gICAgcmV0dXJuIE1hdGguc3FydCgxIC0gKHggLSAxKSAqICh4IC0gMSkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZWFzZU91dFF1YWQoeDogbnVtYmVyKSB7XG4gICAgcmV0dXJuIDEgLSAoMSAtIHgpICogKDEgLSB4KTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBlYXNlT3V0UXVpbnQoeDogbnVtYmVyKSB7XG4gICAgcmV0dXJuIDEgLSBNYXRoLnBvdygxIC0geCwgNSk7XG59XG5cbmV4cG9ydCBjb25zdCBQSV9PVkVSXzE4MCA9IE1hdGguUEkgLyAxODAuMDtcbmV4cG9ydCBjb25zdCBOMTgwX09WRVJfUEkgPSAxODAuMCAvIE1hdGguUEk7XG5cbmV4cG9ydCBmdW5jdGlvbiB0b1JhZGlhbnMoZGVncmVlczogbnVtYmVyKTogbnVtYmVyIHtcbiAgICByZXR1cm4gUElfT1ZFUl8xODAgKiBkZWdyZWVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9EZWdyZWVzKHJhZGlhbnM6IG51bWJlcik6IG51bWJlciB7XG4gICAgcmV0dXJuIE4xODBfT1ZFUl9QSSAqIHJhZGlhbnM7XG59XG5cbi8vIFJldHVybnMgW3BpdGNoLCByb2xsXSBpbiByYWRpYW5zXG5leHBvcnQgZnVuY3Rpb24gY2FsY3VsYXRlUGl0Y2hSb2xsKGFjdG9yOiB7XG4gICAgcXVhdGVybmlvbjogVEhSRUUuUXVhdGVybmlvbjtcbiAgICBnZXRXb3JsZERpcmVjdGlvbjogKHY6IFRIUkVFLlZlY3RvcjMpID0+IFRIUkVFLlZlY3RvcjM7XG59KTogW251bWJlciwgbnVtYmVyXSB7XG4gICAgY29uc3QgZm9yd2FyZCA9IGFjdG9yLmdldFdvcmxkRGlyZWN0aW9uKF92KTtcbiAgICBjb25zdCBwcmpGb3J3YXJkID0gX3cuY29weShmb3J3YXJkKVxuICAgICAgICAuc2V0WSgwKVxuICAgICAgICAubm9ybWFsaXplKCk7XG4gICAgY29uc3QgcGl0Y2ggPSBmb3J3YXJkLmFuZ2xlVG8ocHJqRm9yd2FyZCkgKiBNYXRoLnNpZ24oZm9yd2FyZC55KTtcblxuICAgIF9xLnNldEZyb21Vbml0VmVjdG9ycyhmb3J3YXJkLCBwcmpGb3J3YXJkKTtcblxuICAgIGNvbnN0IHJpZ2h0ID0gX3YuY29weShSSUdIVClcbiAgICAgICAgLmFwcGx5UXVhdGVybmlvbihhY3Rvci5xdWF0ZXJuaW9uKVxuICAgICAgICAuYXBwbHlRdWF0ZXJuaW9uKF9xKTtcbiAgICBfcS5zZXRGcm9tVW5pdFZlY3RvcnMocHJqRm9yd2FyZCwgRk9SV0FSRCk7XG4gICAgcmlnaHQuYXBwbHlRdWF0ZXJuaW9uKF9xKTtcbiAgICBsZXQgcm9sbCA9IE1hdGguYWNvcyhyaWdodC54KSAqIE1hdGguc2lnbihyaWdodC55KTtcbiAgICByb2xsID0gaXNOYU4ocm9sbCkgPyAwLjAgOiByb2xsO1xuXG4gICAgcmV0dXJuIFtwaXRjaCwgcm9sbF07XG59XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG5jb25zdCBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdGNvbnN0IGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHRjb25zdCBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdGlmICghKG1vZHVsZUlkIGluIF9fd2VicGFja19tb2R1bGVzX18pKSB7XG5cdFx0ZGVsZXRlIF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdFx0Y29uc3QgZSA9IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIgKyBtb2R1bGVJZCArIFwiJ1wiKTtcblx0XHRlLmNvZGUgPSAnTU9EVUxFX05PVF9GT1VORCc7XG5cdFx0dGhyb3cgZTtcblx0fVxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbi8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG5fX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBfX3dlYnBhY2tfbW9kdWxlc19fO1xuXG4vLyB0aGUgc3RhcnR1cCBmdW5jdGlvblxuX193ZWJwYWNrX3JlcXVpcmVfXy54ID0gKCkgPT4ge1xuXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcblx0Ly8gVGhpcyBlbnRyeSBtb2R1bGUgZGVwZW5kcyBvbiBvdGhlciBsb2FkZWQgY2h1bmtzIGFuZCBleGVjdXRpb24gbmVlZCB0byBiZSBkZWxheWVkXG5cdGxldCBfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXy5PKHVuZGVmaW5lZCwgW1widmVuZG9ycy1ub2RlX21vZHVsZXNfdGhyZWVfYnVpbGRfdGhyZWVfbW9kdWxlX2pzXCJdLCAoKSA9PiAoX193ZWJwYWNrX3JlcXVpcmVfXyhcIi4vc3JjL3NjcmlwdC9waHlzaWNzL3dvcmtlci9mbGlnaHRXb3JrZXIudHNcIikpKVxuXHRfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXy5PKF9fd2VicGFja19leHBvcnRzX18pO1xuXHRyZXR1cm4gX193ZWJwYWNrX2V4cG9ydHNfXztcbn07XG5cbiIsImNvbnN0IGRlZmVycmVkID0gW107XG5fX3dlYnBhY2tfcmVxdWlyZV9fLk8gPSAocmVzdWx0LCBjaHVua0lkcywgZm4sIHByaW9yaXR5KSA9PiB7XG5cdGlmKGNodW5rSWRzKSB7XG5cdFx0cHJpb3JpdHkgPSBwcmlvcml0eSB8fCAwO1xuXHRcdGZvcih2YXIgaSA9IGRlZmVycmVkLmxlbmd0aDsgaSA+IDAgJiYgZGVmZXJyZWRbaSAtIDFdWzJdID4gcHJpb3JpdHk7IGktLSkgZGVmZXJyZWRbaV0gPSBkZWZlcnJlZFtpIC0gMV07XG5cdFx0ZGVmZXJyZWRbaV0gPSBbY2h1bmtJZHMsIGZuLCBwcmlvcml0eV07XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGxldCBub3RGdWxmaWxsZWQgPSBJbmZpbml0eTtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBkZWZlcnJlZC5sZW5ndGg7IGkrKykge1xuXHRcdGxldCBbY2h1bmtJZHMsIGZuLCBwcmlvcml0eV0gPSBkZWZlcnJlZFtpXTtcblx0XHRsZXQgZnVsZmlsbGVkID0gdHJ1ZTtcblx0XHRmb3IgKHZhciBqID0gMDsgaiA8IGNodW5rSWRzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRpZiAoKHByaW9yaXR5ICYgMSA9PT0gMCB8fCBub3RGdWxmaWxsZWQgPj0gcHJpb3JpdHkpICYmIE9iamVjdC5rZXlzKF9fd2VicGFja19yZXF1aXJlX18uTykuZXZlcnkoKGtleSkgPT4gKF9fd2VicGFja19yZXF1aXJlX18uT1trZXldKGNodW5rSWRzW2pdKSkpKSB7XG5cdFx0XHRcdGNodW5rSWRzLnNwbGljZShqLS0sIDEpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZnVsZmlsbGVkID0gZmFsc2U7XG5cdFx0XHRcdGlmKHByaW9yaXR5IDwgbm90RnVsZmlsbGVkKSBub3RGdWxmaWxsZWQgPSBwcmlvcml0eTtcblx0XHRcdH1cblx0XHR9XG5cdFx0aWYoZnVsZmlsbGVkKSB7XG5cdFx0XHRkZWZlcnJlZC5zcGxpY2UoaS0tLCAxKVxuXHRcdFx0Y29uc3QgciA9IGZuKCk7XG5cdFx0XHRpZiAociAhPT0gdW5kZWZpbmVkKSByZXN1bHQgPSByO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gcmVzdWx0O1xufTsiLCIvLyBkZWZpbmUgZ2V0dGVyL3ZhbHVlIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRpZihBcnJheS5pc0FycmF5KGRlZmluaXRpb24pKSB7XG5cdFx0dmFyIGkgPSAwO1xuXHRcdHdoaWxlKGkgPCBkZWZpbml0aW9uLmxlbmd0aCkge1xuXHRcdFx0dmFyIGtleSA9IGRlZmluaXRpb25baSsrXTtcblx0XHRcdHZhciBiaW5kaW5nID0gZGVmaW5pdGlvbltpKytdO1xuXHRcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRcdGlmKGJpbmRpbmcgPT09IDApIHtcblx0XHRcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiBkZWZpbml0aW9uW2krK10gfSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGJpbmRpbmcgfSk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZihiaW5kaW5nID09PSAwKSB7IGkrKzsgfVxuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHRcdH1cblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5mID0ge307XG4vLyBUaGlzIGZpbGUgY29udGFpbnMgb25seSB0aGUgZW50cnkgY2h1bmsuXG4vLyBUaGUgY2h1bmsgbG9hZGluZyBmdW5jdGlvbiBmb3IgYWRkaXRpb25hbCBjaHVua3Ncbl9fd2VicGFja19yZXF1aXJlX18uZSA9IChjaHVua0lkKSA9PiB7XG5cdHJldHVybiBQcm9taXNlLmFsbChPYmplY3Qua2V5cyhfX3dlYnBhY2tfcmVxdWlyZV9fLmYpLnJlZHVjZSgocHJvbWlzZXMsIGtleSkgPT4ge1xuXHRcdF9fd2VicGFja19yZXF1aXJlX18uZltrZXldKGNodW5rSWQsIHByb21pc2VzKTtcblx0XHRyZXR1cm4gcHJvbWlzZXM7XG5cdH0sIFtdKSk7XG59OyIsIi8vIFRoaXMgZnVuY3Rpb24gYWxsb3cgdG8gcmVmZXJlbmNlIGFzeW5jIGNodW5rcyBhbmQgY2h1bmtzIHRoYXQgdGhlIGVudHJ5cG9pbnQgZGVwZW5kcyBvblxuX193ZWJwYWNrX3JlcXVpcmVfXy51ID0gKGNodW5rSWQpID0+IHtcblx0Ly8gcmV0dXJuIHVybCBmb3IgZmlsZW5hbWVzIGJhc2VkIG9uIHRlbXBsYXRlXG5cdHJldHVybiBcIlwiICsgY2h1bmtJZCArIFwiLmJ1bmRsZS5qc1wiO1xufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmcgPSAoZnVuY3Rpb24oKSB7XG5cdGlmICh0eXBlb2YgZ2xvYmFsVGhpcyA9PT0gJ29iamVjdCcpIHJldHVybiBnbG9iYWxUaGlzO1xuXHR0cnkge1xuXHRcdHJldHVybiB0aGlzIHx8IG5ldyBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0aWYgKHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnKSByZXR1cm4gd2luZG93O1xuXHR9XG59KSgpOyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZihTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJsZXQgc2NyaXB0VXJsO1xuaWYgKF9fd2VicGFja19yZXF1aXJlX18uZy5pbXBvcnRTY3JpcHRzKSBzY3JpcHRVcmwgPSBfX3dlYnBhY2tfcmVxdWlyZV9fLmcubG9jYXRpb24gKyBcIlwiO1xuY29uc3QgZG9jdW1lbnQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fLmcuZG9jdW1lbnQ7XG5pZiAoIXNjcmlwdFVybCAmJiBkb2N1bWVudCkge1xuXHRpZiAoZG9jdW1lbnQuY3VycmVudFNjcmlwdD8udGFnTmFtZS50b1VwcGVyQ2FzZSgpID09PSAnU0NSSVBUJylcblx0XHRzY3JpcHRVcmwgPSBkb2N1bWVudC5jdXJyZW50U2NyaXB0LnNyYztcblx0aWYgKCFzY3JpcHRVcmwpIHtcblx0XHRjb25zdCBzY3JpcHRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzY3JpcHRcIik7XG5cdFx0aWYoc2NyaXB0cy5sZW5ndGgpIHtcblx0XHRcdGxldCBpID0gc2NyaXB0cy5sZW5ndGggLSAxO1xuXHRcdFx0d2hpbGUgKGkgPiAtMSAmJiAoIXNjcmlwdFVybCB8fCAhL15odHRwKHM/KTovLnRlc3Qoc2NyaXB0VXJsKSkpIHNjcmlwdFVybCA9IHNjcmlwdHNbaS0tXS5zcmM7XG5cdFx0fVxuXHR9XG59XG4vLyBXaGVuIHN1cHBvcnRpbmcgYnJvd3NlcnMgd2hlcmUgYW4gYXV0b21hdGljIHB1YmxpY1BhdGggaXMgbm90IHN1cHBvcnRlZCB5b3UgbXVzdCBzcGVjaWZ5IGFuIG91dHB1dC5wdWJsaWNQYXRoIG1hbnVhbGx5IHZpYSBjb25maWd1cmF0aW9uXG4vLyBvciBwYXNzIGFuIGVtcHR5IHN0cmluZyAoXCJcIikgYW5kIHNldCB0aGUgX193ZWJwYWNrX3B1YmxpY19wYXRoX18gdmFyaWFibGUgZnJvbSB5b3VyIGNvZGUgdG8gdXNlIHlvdXIgb3duIGxvZ2ljLlxuaWYgKCFzY3JpcHRVcmwpIHRocm93IG5ldyBFcnJvcihcIkF1dG9tYXRpYyBwdWJsaWNQYXRoIGlzIG5vdCBzdXBwb3J0ZWQgaW4gdGhpcyBicm93c2VyXCIpO1xuc2NyaXB0VXJsID0gc2NyaXB0VXJsLnJlcGxhY2UoL15ibG9iOi8sIFwiXCIpLnJlcGxhY2UoLyMuKiQvLCBcIlwiKS5yZXBsYWNlKC9cXD8uKiQvLCBcIlwiKS5yZXBsYWNlKC9cXC9bXlxcL10rJC8sIFwiL1wiKTtcbl9fd2VicGFja19yZXF1aXJlX18ucCA9IHNjcmlwdFVybDsiLCIvLyBubyBiYXNlVVJJXG5cbi8vIG9iamVjdCB0byBzdG9yZSBsb2FkZWQgY2h1bmtzXG4vLyBcIjFcIiBtZWFucyBcImFscmVhZHkgbG9hZGVkXCJcbnZhciBpbnN0YWxsZWRDaHVua3MgPSB7XG5cdFwic3JjX3NjcmlwdF9waHlzaWNzX3dvcmtlcl9mbGlnaHRXb3JrZXJfdHNcIjogMVxufTtcblxuLy8gaW1wb3J0U2NyaXB0cyBjaHVuayBsb2FkaW5nXG52YXIgaW5zdGFsbENodW5rID0gKGRhdGEpID0+IHtcblx0bGV0IFtjaHVua0lkcywgbW9yZU1vZHVsZXMsIHJ1bnRpbWVdID0gZGF0YTtcblx0Zm9yKHZhciBtb2R1bGVJZCBpbiBtb3JlTW9kdWxlcykge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhtb3JlTW9kdWxlcywgbW9kdWxlSWQpKSB7XG5cdFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLm1bbW9kdWxlSWRdID0gbW9yZU1vZHVsZXNbbW9kdWxlSWRdO1xuXHRcdH1cblx0fVxuXHRpZihydW50aW1lKSBydW50aW1lKF9fd2VicGFja19yZXF1aXJlX18pO1xuXHR3aGlsZShjaHVua0lkcy5sZW5ndGgpXG5cdFx0aW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRzLnBvcCgpXSA9IDE7XG5cdHBhcmVudENodW5rTG9hZGluZ0Z1bmN0aW9uKGRhdGEpO1xufTtcbl9fd2VicGFja19yZXF1aXJlX18uZi5pID0gKGNodW5rSWQsIHByb21pc2VzKSA9PiB7XG5cdC8vIFwiMVwiIGlzIHRoZSBzaWduYWwgZm9yIFwiYWxyZWFkeSBsb2FkZWRcIlxuXHRpZighaW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdKSB7XG5cdFx0aWYodHJ1ZSkgeyAvLyBhbGwgY2h1bmtzIGhhdmUgSlNcblx0XHRcdGltcG9ydFNjcmlwdHMoX193ZWJwYWNrX3JlcXVpcmVfXy5wICsgX193ZWJwYWNrX3JlcXVpcmVfXy51KGNodW5rSWQpKTtcblx0XHR9XG5cdH1cbn07XG5cbnZhciBjaHVua0xvYWRpbmdHbG9iYWwgPSBzZWxmW1wid2VicGFja0NodW5rcmV0cm9mbGlnaHRzaW1cIl0gPSBzZWxmW1wid2VicGFja0NodW5rcmV0cm9mbGlnaHRzaW1cIl0gfHwgW107XG52YXIgcGFyZW50Q2h1bmtMb2FkaW5nRnVuY3Rpb24gPSBjaHVua0xvYWRpbmdHbG9iYWwucHVzaC5iaW5kKGNodW5rTG9hZGluZ0dsb2JhbCk7XG5jaHVua0xvYWRpbmdHbG9iYWwucHVzaCA9IGluc3RhbGxDaHVuaztcblxuLy8gbm8gSE1SXG5cbi8vIG5vIEhNUiBtYW5pZmVzdCIsImNvbnN0IG5leHQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fLng7XG5fX3dlYnBhY2tfcmVxdWlyZV9fLnggPSAoKSA9PiB7XG5cdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fLmUoXCJ2ZW5kb3JzLW5vZGVfbW9kdWxlc190aHJlZV9idWlsZF90aHJlZV9tb2R1bGVfanNcIikudGhlbihuZXh0KTtcbn07IiwiIiwiLy8gcnVuIHN0YXJ0dXBcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXy54KCk7XG4iLCIiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/script/defs.ts":
/*!****************************!*\
  !*** ./src/script/defs.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "FPS_CAP": () => (/* binding */ FPS_CAP),
/* harmony export */   "LO_H_RES": () => (/* binding */ LO_H_RES),
/* harmony export */   "LO_V_RES": () => (/* binding */ LO_V_RES),
/* harmony export */   "HI_H_RES": () => (/* binding */ HI_H_RES),
/* harmony export */   "HI_V_RES": () => (/* binding */ HI_V_RES),
/* harmony export */   "H_RES": () => (/* binding */ H_RES),
/* harmony export */   "V_RES": () => (/* binding */ V_RES),
/* harmony export */   "H_RES_HALF": () => (/* binding */ H_RES_HALF),
/* harmony export */   "V_RES_HALF": () => (/* binding */ V_RES_HALF),
/* harmony export */   "TERRAIN_SCALE": () => (/* binding */ TERRAIN_SCALE),
/* harmony export */   "TERRAIN_MODEL_SIZE": () => (/* binding */ TERRAIN_MODEL_SIZE),
/* harmony export */   "PITCH_RATE": () => (/* binding */ PITCH_RATE),
/* harmony export */   "ROLL_RATE": () => (/* binding */ ROLL_RATE),
/* harmony export */   "YAW_RATE": () => (/* binding */ YAW_RATE),
/* harmony export */   "MAX_SPEED": () => (/* binding */ MAX_SPEED),
/* harmony export */   "THROTTLE_RATE": () => (/* binding */ THROTTLE_RATE),
/* harmony export */   "STICK_RATE": () => (/* binding */ STICK_RATE),
/* harmony export */   "PLANE_DISTANCE_TO_GROUND": () => (/* binding */ PLANE_DISTANCE_TO_GROUND),
/* harmony export */   "PLANE_COCKPIT_OFFSET_Y": () => (/* binding */ PLANE_COCKPIT_OFFSET_Y),
/* harmony export */   "PLANE_COCKPIT_OFFSET_Z": () => (/* binding */ PLANE_COCKPIT_OFFSET_Z),
/* harmony export */   "MAX_ALTITUDE": () => (/* binding */ MAX_ALTITUDE),
/* harmony export */   "COCKPIT_FOV": () => (/* binding */ COCKPIT_FOV),
/* harmony export */   "COCKPIT_FAR": () => (/* binding */ COCKPIT_FAR),
/* harmony export */   "GROUND_SMOKE_PARTICLE_COUNT": () => (/* binding */ GROUND_SMOKE_PARTICLE_COUNT),
/* harmony export */   "AIRBASE_RUNWAY": () => (/* binding */ AIRBASE_RUNWAY),
/* harmony export */   "RUNWAY_HALF_LENGTH_M": () => (/* binding */ RUNWAY_HALF_LENGTH_M),
/* harmony export */   "APPROACH_ALTITUDE_M": () => (/* binding */ APPROACH_ALTITUDE_M),
/* harmony export */   "APPROACH_SPEED_KMH": () => (/* binding */ APPROACH_SPEED_KMH),
/* harmony export */   "APPROACH_SPEED_MPS": () => (/* binding */ APPROACH_SPEED_MPS),
/* harmony export */   "APPROACH_FINAL_DISTANCE_M": () => (/* binding */ APPROACH_FINAL_DISTANCE_M)
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


/***/ }),

/***/ "./src/script/physics/aeroUtils.ts":
/*!*****************************************!*\
  !*** ./src/script/physics/aeroUtils.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "GROUND_AIR_DENSITY": () => (/* binding */ GROUND_AIR_DENSITY),
/* harmony export */   "computeIsaAirDensity": () => (/* binding */ computeIsaAirDensity),
/* harmony export */   "computeAirDensity": () => (/* binding */ computeAirDensity),
/* harmony export */   "computeDynamicPressure": () => (/* binding */ computeDynamicPressure),
/* harmony export */   "computeThrustDensityFactor": () => (/* binding */ computeThrustDensityFactor),
/* harmony export */   "computeSpeedOfSound": () => (/* binding */ computeSpeedOfSound),
/* harmony export */   "computeMachNumber": () => (/* binding */ computeMachNumber),
/* harmony export */   "computeDynamicPressureDragPenalty": () => (/* binding */ computeDynamicPressureDragPenalty),
/* harmony export */   "computeMaxEquilibriumSpeed": () => (/* binding */ computeMaxEquilibriumSpeed),
/* harmony export */   "computeAngleOfAttack": () => (/* binding */ computeAngleOfAttack),
/* harmony export */   "computeLoadFactorG": () => (/* binding */ computeLoadFactorG)
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


/***/ }),

/***/ "./src/script/physics/f16Engine.ts":
/*!*****************************************!*\
  !*** ./src/script/physics/f16Engine.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "F16_ENGINE": () => (/* binding */ F16_ENGINE),
/* harmony export */   "F16_ENGINE_NOZZLE_COLORS": () => (/* binding */ F16_ENGINE_NOZZLE_COLORS),
/* harmony export */   "getF16EngineNozzleColor": () => (/* binding */ getF16EngineNozzleColor),
/* harmony export */   "getF16AfterburnerConeDither": () => (/* binding */ getF16AfterburnerConeDither),
/* harmony export */   "isF16AfterburnerActive": () => (/* binding */ isF16AfterburnerActive),
/* harmony export */   "F16_AFTERBURNER_CONE_LENGTH_M": () => (/* binding */ F16_AFTERBURNER_CONE_LENGTH_M),
/* harmony export */   "getF16AfterburnerConeLengthM": () => (/* binding */ getF16AfterburnerConeLengthM),
/* harmony export */   "leverToPercent": () => (/* binding */ leverToPercent),
/* harmony export */   "isF16AbDetentBand": () => (/* binding */ isF16AbDetentBand),
/* harmony export */   "getF16ThrottleZone": () => (/* binding */ getF16ThrottleZone),
/* harmony export */   "computeF16SlThrustKn": () => (/* binding */ computeF16SlThrustKn),
/* harmony export */   "computeF16EngineThrustN": () => (/* binding */ computeF16EngineThrustN),
/* harmony export */   "computeF16EngineThrustKn": () => (/* binding */ computeF16EngineThrustKn),
/* harmony export */   "formatF16ThrottleHud": () => (/* binding */ formatF16ThrottleHud),
/* harmony export */   "f16ThrottleAudioLevel": () => (/* binding */ f16ThrottleAudioLevel),
/* harmony export */   "adjustF16ThrottleInput": () => (/* binding */ adjustF16ThrottleInput),
/* harmony export */   "stepF16ThrottleDetent": () => (/* binding */ stepF16ThrottleDetent)
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


/***/ }),

/***/ "./src/script/physics/f16FcsLimits.ts":
/*!********************************************!*\
  !*** ./src/script/physics/f16FcsLimits.ts ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "computeF16EnvelopeAuthority": () => (/* binding */ computeF16EnvelopeAuthority),
/* harmony export */   "computeF16PitchGLimit": () => (/* binding */ computeF16PitchGLimit),
/* harmony export */   "computeF16PitchAoaAuthority": () => (/* binding */ computeF16PitchAoaAuthority),
/* harmony export */   "computeF16AoaRecoveryRate": () => (/* binding */ computeF16AoaRecoveryRate),
/* harmony export */   "computeLoadFactorG": () => (/* binding */ computeLoadFactorG),
/* harmony export */   "clampLoadFactorAcceleration": () => (/* binding */ clampLoadFactorAcceleration)
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


/***/ }),

/***/ "./src/script/physics/f16PaperData.ts":
/*!********************************************!*\
  !*** ./src/script/physics/f16PaperData.ts ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "F16_PAPER_ANALYTICAL": () => (/* binding */ F16_PAPER_ANALYTICAL),
/* harmony export */   "F16_PAPER_VSPAERO": () => (/* binding */ F16_PAPER_VSPAERO),
/* harmony export */   "F16_PAPER_CHART_CASES": () => (/* binding */ F16_PAPER_CHART_CASES),
/* harmony export */   "F16_PAPER_VSPAERO_CASES": () => (/* binding */ F16_PAPER_VSPAERO_CASES),
/* harmony export */   "FT_TO_M": () => (/* binding */ FT_TO_M),
/* harmony export */   "FPS_TO_MPS": () => (/* binding */ FPS_TO_MPS),
/* harmony export */   "LB_TO_N": () => (/* binding */ LB_TO_N),
/* harmony export */   "LB_TO_KG": () => (/* binding */ LB_TO_KG)
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


/***/ }),

/***/ "./src/script/physics/f16Profile.ts":
/*!******************************************!*\
  !*** ./src/script/physics/f16Profile.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "F16_PROFILE": () => (/* binding */ F16_PROFILE),
/* harmony export */   "F16_REFERENCE_CASES": () => (/* binding */ F16_REFERENCE_CASES),
/* harmony export */   "MPS_TO_KTS": () => (/* binding */ MPS_TO_KTS)
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


/***/ }),

/***/ "./src/script/physics/f16RollControl.ts":
/*!**********************************************!*\
  !*** ./src/script/physics/f16RollControl.ts ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "F16_ROLL_CAT1": () => (/* binding */ F16_ROLL_CAT1),
/* harmony export */   "F16_ROLL_CAT3": () => (/* binding */ F16_ROLL_CAT3),
/* harmony export */   "maxRollRateRad": () => (/* binding */ maxRollRateRad),
/* harmony export */   "computeF16RollDynamicPressureGain": () => (/* binding */ computeF16RollDynamicPressureGain),
/* harmony export */   "computeF16CommandedRollRate": () => (/* binding */ computeF16CommandedRollRate),
/* harmony export */   "stepF16BodyRollRate": () => (/* binding */ stepF16BodyRollRate),
/* harmony export */   "computeF16RollYawCoupling": () => (/* binding */ computeF16RollYawCoupling)
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


/***/ }),

/***/ "./src/script/physics/model/arcadeFlightModel.ts":
/*!*******************************************************!*\
  !*** ./src/script/physics/model/arcadeFlightModel.ts ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ArcadeFlightModel": () => (/* binding */ ArcadeFlightModel)
/* harmony export */ });
/* harmony import */ var three__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! three */ "./node_modules/three/build/three.module.js");
/* harmony import */ var _defs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../defs */ "./src/script/defs.ts");
/* harmony import */ var _utils_math__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/math */ "./src/script/utils/math.ts");
/* harmony import */ var _flightModel__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./flightModel */ "./src/script/physics/model/flightModel.ts");




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
const YAW_RATE_LANDED = _defs__WEBPACK_IMPORTED_MODULE_0__.YAW_RATE * 2.0;
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
const LANDING_MIN_PITCH = -5 * _utils_math__WEBPACK_IMPORTED_MODULE_1__.PI_OVER_180;
const LANDING_MAX_ROLL = 5 * _utils_math__WEBPACK_IMPORTED_MODULE_1__.PI_OVER_180;
class ArcadeFlightModel extends _flightModel__WEBPACK_IMPORTED_MODULE_2__.FlightModel {
    constructor() {
        super();
        this.stall = 0;
        this._v = new three__WEBPACK_IMPORTED_MODULE_3__.Vector3();
        this._q0 = new three__WEBPACK_IMPORTED_MODULE_3__.Quaternion();
        this._q1 = new three__WEBPACK_IMPORTED_MODULE_3__.Quaternion();
        this._m = new three__WEBPACK_IMPORTED_MODULE_3__.Matrix4();
        this.drag = new three__WEBPACK_IMPORTED_MODULE_3__.Vector3();
        this.thrust = new three__WEBPACK_IMPORTED_MODULE_3__.Vector3();
        this.weight = new three__WEBPACK_IMPORTED_MODULE_3__.Vector3();
        this.friction = new three__WEBPACK_IMPORTED_MODULE_3__.Vector3();
        this.forces = new three__WEBPACK_IMPORTED_MODULE_3__.Vector3();
        this.forward = new three__WEBPACK_IMPORTED_MODULE_3__.Vector3();
        this.up = new three__WEBPACK_IMPORTED_MODULE_3__.Vector3();
        this.right = new three__WEBPACK_IMPORTED_MODULE_3__.Vector3();
        this.prjForward = new three__WEBPACK_IMPORTED_MODULE_3__.Vector3();
        this.velocityUnit = new three__WEBPACK_IMPORTED_MODULE_3__.Vector3();
        this.obj.up.copy(_utils_math__WEBPACK_IMPORTED_MODULE_1__.UP);
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
        this.forward = this.forward.copy(_utils_math__WEBPACK_IMPORTED_MODULE_1__.FORWARD).applyQuaternion(this.obj.quaternion);
        this.up = this.up.copy(_utils_math__WEBPACK_IMPORTED_MODULE_1__.UP).applyQuaternion(this.obj.quaternion);
        this.right = this.right.copy(_utils_math__WEBPACK_IMPORTED_MODULE_1__.RIGHT).applyQuaternion(this.obj.quaternion);
        this.prjForward = this.prjForward.copy(this.forward).setY(0);
        this.velocityUnit = this.velocityUnit.copy(this.velocity).normalize();
        const airDensity = GROUND_AIR_DENSITY * Math.exp(-this.obj.position.y / 8000);
        const thrustDensity = GROUND_AIR_DENSITY * Math.exp(-this.obj.position.y * 0.25 / 8000);
        const speed = this.velocity.length();
        const rightPrjVelocity = this._v.copy(this.velocityUnit).projectOnPlane(this.right);
        const aoaAngle = rightPrjVelocity.angleTo(this.forward);
        const aoaSign = rightPrjVelocity.cross(this.forward).dot(this.right) > 0 ? -1 : 1;
        const aoa = aoaSign * aoaAngle;
        if (!(0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.isZero)(this.roll) && !this.landed) {
            const rollFlapFactor = this.flapsExtended ? ROLL_FLAPS_FACTOR : 1.0;
            this.obj.rotateZ(this.roll * _defs__WEBPACK_IMPORTED_MODULE_0__.ROLL_RATE * rollFlapFactor * delta);
        }
        if (!(0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.isZero)(this.pitch)
            && !(this.landed && this.pitch < 0)
            && (this.stall < 0 ||
                (this.pitch < 0 && this.up.y > 0) ||
                (this.pitch > 0 && this.up.y < 0))) {
            this.obj.rotateX(-this.pitch * _defs__WEBPACK_IMPORTED_MODULE_0__.PITCH_RATE * delta);
        }
        if (!(0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.isZero)(this.yaw) && !(0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.isZero)(speed)) {
            this.obj.rotateY(-this.yaw * (this.landed ? YAW_RATE_LANDED : _defs__WEBPACK_IMPORTED_MODULE_0__.YAW_RATE) * delta);
        }
        if (-0.99 < this.forward.y && this.forward.y < 0.99) {
            const prjUp = this._v.copy(this.up).projectOnPlane(this.prjForward).setY(0);
            const sign = (this.prjForward.x * prjUp.z - this.prjForward.z * prjUp.x) > 0 ? -1 : 1;
            this.obj.rotateOnWorldAxis(_utils_math__WEBPACK_IMPORTED_MODULE_1__.UP, sign * prjUp.length() * prjUp.length() * this.prjForward.length() * 2.0 * _defs__WEBPACK_IMPORTED_MODULE_0__.YAW_RATE * delta);
        }
        if (this.stall >= 0 && !this.landed) {
            const y = this.forward.y;
            if (y > -0.8) {
                const groundRight = this._v.copy(this.forward).cross(this.prjForward).normalize();
                this.obj.rotateOnWorldAxis(groundRight, STALL_RATE * delta * (y > 0 ? 1 : -1));
            }
        }
        (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.roundToZero)(this.thrust.copy(this.forward).multiplyScalar(thrustDensity *
            MAX_THRUST *
            this.effectiveThrottle *
            DRY_MASS));
        this.engineThrustN = this.thrust.length();
        const arcadeInducedDrag = this.forward.dot(this.velocityUnit);
        const liftInducedDrag = 1 - Math.cos(2.0 * aoa);
        const rollDrag = Math.abs(this.right.y);
        const cdMultiplier = 1.0 + (this.landingGearDeployed ? CD_LANDING_GEAR_FACTOR : 0.0) + (this.flapsExtended ? CD_FLAPS_FACTOR : 0.0);
        (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.roundToZero)(this.drag
            .copy(this.velocityUnit)
            .negate()
            .multiplyScalar(Math.pow(0.5 * (CD * cdMultiplier + liftInducedDrag) * airDensity * speed * speed * WING_AREA, 1.0 + INDUCED_DRAG_FACTOR * (1.0 - arcadeInducedDrag) + ROLL_DRAG_FACTOR * rollDrag)));
        const aoaLift = 0.2 * (aoa < (Math.PI / 8.0) || aoa > (7 * Math.PI / 8.0) ? Math.sin(6.0 * aoa) : Math.sin(2.0 * aoa));
        const minLiftFactor = 2.0 * (0.75 * 0.75 + 0.75) * GROUND_AIR_DENSITY;
        const fwdY = this.forward.y;
        const rightY = Math.abs(this.right.y);
        const liftFactor = 2 * (speed / 256.0) * ((-0.5 * fwdY + 1.5) * (-0.5 * rightY + 1.5) + (-0.5 * rightY + 1.5)) * airDensity;
        const liftFactorMultiplier = this.flapsExtended ? LIFT_FLAPS_FACTOR : 1.0;
        this.stall = -(0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.clamp)(liftFactor * liftFactorMultiplier / minLiftFactor + aoaLift * (1.0 - rightY) - 1.0, -1.0, 1.0);
        const weightFwdFactor = -this.forward.y;
        const weightDownFactor = -(0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.easeOutCirc)(1.0 - (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.clamp)((speed / 256) * (1.0 - Math.abs(this.forward.y) * (1.0 - Math.abs(this.right.y))), 0, 1));
        this.weight
            .copy(_utils_math__WEBPACK_IMPORTED_MODULE_1__.UP)
            .multiplyScalar(weightDownFactor)
            .addScaledVector(this.forward, weightFwdFactor)
            .multiplyScalar(DRY_MASS * GRAVITY);
        if (!(0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.isZero)(speed)) {
            if (this.landed) {
                this.velocity.copy(this.forward).multiplyScalar(speed);
            }
            else {
                const alpha = this.velocityUnit.angleTo(this.forward);
                const turningFactor = alpha * TURNING_RATE * delta;
                this._m.lookAt(_utils_math__WEBPACK_IMPORTED_MODULE_1__.ZERO, this.forward, this.up);
                this._q1 = new three__WEBPACK_IMPORTED_MODULE_3__.Quaternion().setFromRotationMatrix(this._m);
                this._m.lookAt(_utils_math__WEBPACK_IMPORTED_MODULE_1__.ZERO, this.velocityUnit, this.up);
                this._q0 = new three__WEBPACK_IMPORTED_MODULE_3__.Quaternion().setFromRotationMatrix(this._m);
                this._q0.rotateTowards(this._q1, turningFactor);
                this._q1.setFromRotationMatrix(this._m.invert());
                this._v.copy(this.velocityUnit)
                    .applyQuaternion(this._q1)
                    .applyQuaternion(this._q0);
                this.velocity.copy(this._v).multiplyScalar(speed);
            }
        }
        this.forces.set(0, 0, 0).add(this.thrust).add(this.drag).add(this.weight);
        const onGround = this.obj.position.y <= _defs__WEBPACK_IMPORTED_MODULE_0__.PLANE_DISTANCE_TO_GROUND + 0.05;
        if (this.landed || (this.wheelBrakesApplied && onGround)) {
            const weightMagnitude = DRY_MASS * GRAVITY;
            const prjForces = this._v.copy(this.forces).setY(0);
            const prjForcesMagnitude = prjForces.length();
            const maxStaticFriction = (this.wheelBrakesApplied ? GROUND_BRAKE_STATIC : GROUND_FRICTION_STATIC) * weightMagnitude;
            const kineticFriction = (this.wheelBrakesApplied ? GROUND_BRAKE_KINETIC : GROUND_FRICTION_KINETIC) * weightMagnitude;
            if (((0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.isZero)(speed) && prjForcesMagnitude < maxStaticFriction)) {
                this.friction.copy(prjForces).negate();
            }
            else {
                this.friction.copy(this.velocityUnit).setY(0).negate().normalize().multiplyScalar(kineticFriction);
            }
            (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.roundToZero)(this.friction);
        }
        else {
            this.friction.set(0, 0, 0);
        }
        const accel = (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.roundToZero)(this.forces.add(this.friction).divideScalar(DRY_MASS));
        this.velocity.addScaledVector(accel, delta);
        if (this.landed && this.velocity.y < 0) {
            this.velocity.setY(0);
        }
        this.obj.position.addScaledVector((0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.roundToZero)(this.velocity, this.effectiveThrottle > 0 ? 0.01 : 0.1), delta);
        if (this.obj.position.y > _defs__WEBPACK_IMPORTED_MODULE_0__.PLANE_DISTANCE_TO_GROUND) {
            this.landed = false;
        }
        if (this.obj.position.y < _defs__WEBPACK_IMPORTED_MODULE_0__.PLANE_DISTANCE_TO_GROUND) {
            this.obj.position.y = _defs__WEBPACK_IMPORTED_MODULE_0__.PLANE_DISTANCE_TO_GROUND;
            const forward = this._v.copy(_utils_math__WEBPACK_IMPORTED_MODULE_1__.FORWARD).applyQuaternion(this.obj.quaternion);
            const right = this.right.copy(_utils_math__WEBPACK_IMPORTED_MODULE_1__.RIGHT).applyQuaternion(this.obj.quaternion);
            const prjForward = new three__WEBPACK_IMPORTED_MODULE_3__.Vector3().copy(forward).setY(0).normalize();
            const pitchAngle = forward.angleTo(prjForward) * Math.sign(forward.y);
            const prjRight = new three__WEBPACK_IMPORTED_MODULE_3__.Vector3().copy(right).setY(0).normalize();
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
                    const heading = new three__WEBPACK_IMPORTED_MODULE_3__.Vector3().copy(forward).setY(0).normalize();
                    this.obj.quaternion.setFromUnitVectors(_utils_math__WEBPACK_IMPORTED_MODULE_1__.FORWARD, heading);
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


/***/ }),

/***/ "./src/script/physics/model/debugFlightModel.ts":
/*!******************************************************!*\
  !*** ./src/script/physics/model/debugFlightModel.ts ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "DebugFlightModel": () => (/* binding */ DebugFlightModel)
/* harmony export */ });
/* harmony import */ var three__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! three */ "./node_modules/three/build/three.module.js");
/* harmony import */ var _defs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../defs */ "./src/script/defs.ts");
/* harmony import */ var _utils_math__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/math */ "./src/script/utils/math.ts");
/* harmony import */ var _flightModel__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./flightModel */ "./src/script/physics/model/flightModel.ts");




class DebugFlightModel extends _flightModel__WEBPACK_IMPORTED_MODULE_2__.FlightModel {
    constructor() {
        super();
        this.speed = 0;
        this._v = new three__WEBPACK_IMPORTED_MODULE_3__.Vector3();
        this._w = new three__WEBPACK_IMPORTED_MODULE_3__.Vector3();
        this.obj.up.copy(_utils_math__WEBPACK_IMPORTED_MODULE_1__.UP);
    }
    step(delta) {
        if (this.crashed)
            return;
        this.effectiveThrottle = this.throttle;
        this.engineThrustN = 0;
        if (!(0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.isZero)(this.roll)) {
            this.obj.rotateZ(this.roll * _defs__WEBPACK_IMPORTED_MODULE_0__.ROLL_RATE * delta);
        }
        if (!(0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.isZero)(this.pitch)) {
            this.obj.rotateX(-this.pitch * _defs__WEBPACK_IMPORTED_MODULE_0__.PITCH_RATE * delta);
        }
        if (!(0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.isZero)(this.yaw)) {
            this.obj.rotateY(-this.yaw * _defs__WEBPACK_IMPORTED_MODULE_0__.YAW_RATE * delta);
        }
        const forward = this.obj.getWorldDirection(this._v);
        if (-0.99 < forward.y && forward.y < 0.99) {
            const prjForward = forward.setY(0);
            const up = this._w.copy(_utils_math__WEBPACK_IMPORTED_MODULE_1__.UP).applyQuaternion(this.obj.quaternion);
            const prjUp = up.projectOnPlane(prjForward).setY(0);
            const sign = (prjForward.x * prjUp.z - prjForward.z * prjUp.x) > 0 ? -1 : 1;
            this.obj.rotateOnWorldAxis(_utils_math__WEBPACK_IMPORTED_MODULE_1__.UP, sign * prjUp.length() * prjUp.length() * prjForward.length() * 2.0 * _defs__WEBPACK_IMPORTED_MODULE_0__.YAW_RATE * delta);
        }
        this.speed = this.effectiveThrottle * _defs__WEBPACK_IMPORTED_MODULE_0__.MAX_SPEED;
        this.obj.translateZ(this.speed * delta);
        if (this.obj.position.y < _defs__WEBPACK_IMPORTED_MODULE_0__.PLANE_DISTANCE_TO_GROUND) {
            this.obj.position.y = _defs__WEBPACK_IMPORTED_MODULE_0__.PLANE_DISTANCE_TO_GROUND;
            const d = this.obj.getWorldDirection(this._v);
            if (d.y < 0.0) {
                d.setY(0).add(this.obj.position);
                this.obj.lookAt(d);
            }
        }
        if (this.obj.position.y > _defs__WEBPACK_IMPORTED_MODULE_0__.MAX_ALTITUDE) {
            this.obj.position.y = _defs__WEBPACK_IMPORTED_MODULE_0__.MAX_ALTITUDE;
        }
        this.velocity.copy(_utils_math__WEBPACK_IMPORTED_MODULE_1__.FORWARD).applyQuaternion(this.obj.quaternion).multiplyScalar(this.speed);
        this.landed = this.obj.position.y <= _defs__WEBPACK_IMPORTED_MODULE_0__.PLANE_DISTANCE_TO_GROUND;
    }
    getStallStatus() {
        return -1;
    }
}


/***/ }),

/***/ "./src/script/physics/model/flightModel.ts":
/*!*************************************************!*\
  !*** ./src/script/physics/model/flightModel.ts ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "SIM_FPS": () => (/* binding */ SIM_FPS),
/* harmony export */   "FlightModel": () => (/* binding */ FlightModel)
/* harmony export */ });
/* harmony import */ var three__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! three */ "./node_modules/three/build/three.module.js");
/* harmony import */ var _utils_math__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/math */ "./src/script/utils/math.ts");


const SIM_FPS = 120;
const SIM_DELTA = 1.0 / SIM_FPS;
class FlightModel {
    constructor() {
        this.obj = new three__WEBPACK_IMPORTED_MODULE_1__.Object3D();
        this.velocity = new three__WEBPACK_IMPORTED_MODULE_1__.Vector3();
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
        this.prevPosition = new three__WEBPACK_IMPORTED_MODULE_1__.Vector3();
        this.prevQuaternion = new three__WEBPACK_IMPORTED_MODULE_1__.Quaternion();
        this.prevVelocity = new three__WEBPACK_IMPORTED_MODULE_1__.Vector3();
        this.deltaRemainder = 0;
    }
    reset() {
        this.obj.position.set(0, 0, 0);
        this.obj.quaternion.setFromAxisAngle(_utils_math__WEBPACK_IMPORTED_MODULE_0__.UP, 0);
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


/***/ }),

/***/ "./src/script/physics/model/realisticFlightModel.ts":
/*!**********************************************************!*\
  !*** ./src/script/physics/model/realisticFlightModel.ts ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "RealisticFlightModel": () => (/* binding */ RealisticFlightModel)
/* harmony export */ });
/* harmony import */ var three__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! three */ "./node_modules/three/build/three.module.js");
/* harmony import */ var _defs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../defs */ "./src/script/defs.ts");
/* harmony import */ var _utils_math__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/math */ "./src/script/utils/math.ts");
/* harmony import */ var _aeroUtils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../aeroUtils */ "./src/script/physics/aeroUtils.ts");
/* harmony import */ var _f16Engine__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../f16Engine */ "./src/script/physics/f16Engine.ts");
/* harmony import */ var _f16RollControl__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../f16RollControl */ "./src/script/physics/f16RollControl.ts");
/* harmony import */ var _f16FcsLimits__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../f16FcsLimits */ "./src/script/physics/f16FcsLimits.ts");
/* harmony import */ var _f16Profile__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../f16Profile */ "./src/script/physics/f16Profile.ts");
/* harmony import */ var _flightModel__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./flightModel */ "./src/script/physics/model/flightModel.ts");









const THROTTLE_UP_RATE = 0.10;
const THROTTLE_DOWN_RATE = 0.07;
const YAW_RATE_LANDED = _defs__WEBPACK_IMPORTED_MODULE_0__.YAW_RATE * 2.0;
const DRY_MASS = _f16Profile__WEBPACK_IMPORTED_MODULE_6__.F16_PROFILE.simMassKg;
const WING_AREA = _f16Profile__WEBPACK_IMPORTED_MODULE_6__.F16_PROFILE.wingAreaM2;
const CD0 = _f16Profile__WEBPACK_IMPORTED_MODULE_6__.F16_PROFILE.cd0;
const INDUCED_DRAG_K = _f16Profile__WEBPACK_IMPORTED_MODULE_6__.F16_PROFILE.inducedDragK;
const CL0 = _f16Profile__WEBPACK_IMPORTED_MODULE_6__.F16_PROFILE.cl0;
const CL_ALPHA = _f16Profile__WEBPACK_IMPORTED_MODULE_6__.F16_PROFILE.clAlphaPerRad;
const STALL_AOA = _f16Profile__WEBPACK_IMPORTED_MODULE_6__.F16_PROFILE.stallAoaDeg * Math.PI / 180;
const MAX_CL = 1.48;
const Q_REF = 0.5 * (0,_aeroUtils__WEBPACK_IMPORTED_MODULE_2__.computeIsaAirDensity)(_f16Profile__WEBPACK_IMPORTED_MODULE_6__.F16_PROFILE.cruiseAltitudeM) * _f16Profile__WEBPACK_IMPORTED_MODULE_6__.F16_PROFILE.cruiseSpeedMps * _f16Profile__WEBPACK_IMPORTED_MODULE_6__.F16_PROFILE.cruiseSpeedMps;
const MIN_CONTROL_Q = 0.12;
const MAX_CONTROL_Q = 2.2;
const MIN_FLYING_SPEED = _f16Profile__WEBPACK_IMPORTED_MODULE_6__.F16_PROFILE.minFlyingSpeedMps;
const SIDE_SLIP_DAMP_RATE = 4.5;
const CY_BETA = -0.6;
const YAW_CONTROL_Q_SCALE = 0.45;
const CD_LANDING_GEAR = 0.035;
const CD_FLAPS = 0.08;
const CL_FLAPS_FACTOR = 1.25;
const F16_ROLL_CONFIG = {
    maxRollRateDegS: _f16Profile__WEBPACK_IMPORTED_MODULE_6__.F16_PROFILE.maxRollRateDegS,
    actuatorTauS: _f16RollControl__WEBPACK_IMPORTED_MODULE_4__.F16_ROLL_CAT1.actuatorTauS,
};
const GROUND_FRICTION_KINETIC = 0.15;
const GROUND_FRICTION_STATIC = 0.2;
const GROUND_BRAKE_KINETIC = 1.8;
const GROUND_BRAKE_STATIC = 1.17;
const LANDED_MAX_SPEED = _f16Profile__WEBPACK_IMPORTED_MODULE_6__.F16_PROFILE.landingMaxSpeedMps;
const LANDING_MAX_VSPEED = _f16Profile__WEBPACK_IMPORTED_MODULE_6__.F16_PROFILE.landingMaxVerticalSpeedMps;
const LANDING_MIN_PITCH = _f16Profile__WEBPACK_IMPORTED_MODULE_6__.F16_PROFILE.landingMinPitchDeg * _utils_math__WEBPACK_IMPORTED_MODULE_1__.PI_OVER_180;
const LANDING_MAX_ROLL = _f16Profile__WEBPACK_IMPORTED_MODULE_6__.F16_PROFILE.landingMaxRollDeg * _utils_math__WEBPACK_IMPORTED_MODULE_1__.PI_OVER_180;
const ROTATION_SPEED = _f16Profile__WEBPACK_IMPORTED_MODULE_6__.F16_PROFILE.rotationSpeedMps;
function computeCl(aoa, flapsExtended) {
    const flapBoost = flapsExtended ? CL_FLAPS_FACTOR : 1.0;
    const stallAoa = flapsExtended ? STALL_AOA * 1.1 : STALL_AOA;
    const maxCl = MAX_CL * flapBoost;
    if (Math.abs(aoa) <= stallAoa) {
        return (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.clamp)(CL0 + CL_ALPHA * aoa * flapBoost, -maxCl * 0.35, maxCl);
    }
    const peakCl = (CL0 + CL_ALPHA * stallAoa * Math.sign(aoa)) * flapBoost;
    const postStall = Math.cos((Math.abs(aoa) - stallAoa) * 4.0);
    return peakCl * Math.max(0, postStall);
}
function computeInducedDrag(cl) {
    return INDUCED_DRAG_K * cl * cl;
}
function computePitchSpeedAuthority(speed, landed) {
    let authority = (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.clamp)(speed / MIN_FLYING_SPEED, 0, 1);
    if (landed && speed < ROTATION_SPEED) {
        authority *= (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.clamp)(speed / ROTATION_SPEED, 0, 1);
    }
    return authority;
}
class RealisticFlightModel extends _flightModel__WEBPACK_IMPORTED_MODULE_7__.FlightModel {
    constructor() {
        super();
        this.stall = -1;
        this.bodyRollRateRad = 0;
        this.forward = new three__WEBPACK_IMPORTED_MODULE_8__.Vector3();
        this.up = new three__WEBPACK_IMPORTED_MODULE_8__.Vector3();
        this.right = new three__WEBPACK_IMPORTED_MODULE_8__.Vector3();
        this.velocityUnit = new three__WEBPACK_IMPORTED_MODULE_8__.Vector3();
        this.thrust = new three__WEBPACK_IMPORTED_MODULE_8__.Vector3();
        this.drag = new three__WEBPACK_IMPORTED_MODULE_8__.Vector3();
        this.lift = new three__WEBPACK_IMPORTED_MODULE_8__.Vector3();
        this.weight = new three__WEBPACK_IMPORTED_MODULE_8__.Vector3();
        this.friction = new three__WEBPACK_IMPORTED_MODULE_8__.Vector3();
        this.forces = new three__WEBPACK_IMPORTED_MODULE_8__.Vector3();
        this.sideForce = new three__WEBPACK_IMPORTED_MODULE_8__.Vector3();
        this.liftDirection = new three__WEBPACK_IMPORTED_MODULE_8__.Vector3();
        this._v = new three__WEBPACK_IMPORTED_MODULE_8__.Vector3();
        this.obj.up.copy(_utils_math__WEBPACK_IMPORTED_MODULE_1__.UP);
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
        this.forward.copy(_utils_math__WEBPACK_IMPORTED_MODULE_1__.FORWARD).applyQuaternion(this.obj.quaternion);
        this.up.copy(_utils_math__WEBPACK_IMPORTED_MODULE_1__.UP).applyQuaternion(this.obj.quaternion);
        this.right.copy(_utils_math__WEBPACK_IMPORTED_MODULE_1__.RIGHT).applyQuaternion(this.obj.quaternion);
        const altitude = this.obj.position.y;
        const airDensity = (0,_aeroUtils__WEBPACK_IMPORTED_MODULE_2__.computeAirDensity)(altitude);
        const speed = this.velocity.length();
        const dynamicPressure = (0,_aeroUtils__WEBPACK_IMPORTED_MODULE_2__.computeDynamicPressure)(airDensity, speed);
        const controlScale = (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.clamp)(dynamicPressure / Q_REF, MIN_CONTROL_Q, MAX_CONTROL_Q);
        let aoa = 0;
        if (speed > 1.0) {
            aoa = (0,_aeroUtils__WEBPACK_IMPORTED_MODULE_2__.computeAngleOfAttack)(this.forward, this.right, this.velocity, this._v);
        }
        this.angleOfAttackRad = aoa;
        const cl = computeCl(aoa, this.flapsExtended);
        const waveDrag = (0,_aeroUtils__WEBPACK_IMPORTED_MODULE_2__.computeDynamicPressureDragPenalty)(speed, altitude);
        const cd = CD0 * (1 + waveDrag)
            + computeInducedDrag(cl)
            + (this.landingGearDeployed ? CD_LANDING_GEAR : 0)
            + (this.flapsExtended ? CD_FLAPS : 0);
        this.updateStallState(speed, aoa, altitude);
        const pitchAuthority = this.stall >= 0 ? 0.35 : 1.0;
        const pitchSpeedAuthority = computePitchSpeedAuthority(speed, this.landed);
        const pitchGLimit = (0,_f16FcsLimits__WEBPACK_IMPORTED_MODULE_5__.computeF16PitchGLimit)(this.loadFactorG, this.pitch, _f16Profile__WEBPACK_IMPORTED_MODULE_6__.F16_PROFILE.maxLoadFactorG);
        const pitchAoaLimit = (0,_f16FcsLimits__WEBPACK_IMPORTED_MODULE_5__.computeF16PitchAoaAuthority)(aoa, this.pitch, STALL_AOA);
        const aoaRecovery = (0,_f16FcsLimits__WEBPACK_IMPORTED_MODULE_5__.computeF16AoaRecoveryRate)(aoa, STALL_AOA, speed);
        const yawControlScale = MIN_CONTROL_Q + (controlScale - MIN_CONTROL_Q) * YAW_CONTROL_Q_SCALE;
        const mach = (0,_aeroUtils__WEBPACK_IMPORTED_MODULE_2__.computeMachNumber)(speed, altitude);
        const commandedRollRate = (0,_f16RollControl__WEBPACK_IMPORTED_MODULE_4__.computeF16CommandedRollRate)({
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
        this.bodyRollRateRad = (0,_f16RollControl__WEBPACK_IMPORTED_MODULE_4__.stepF16BodyRollRate)(this.bodyRollRateRad, commandedRollRate, delta, F16_ROLL_CONFIG);
        if (!this.landed && Math.abs(this.bodyRollRateRad) > 1e-6) {
            this.obj.rotateZ(this.bodyRollRateRad * delta);
        }
        else if (this.landed) {
            this.bodyRollRateRad = 0;
        }
        if (!(0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.isZero)(this.pitch)
            && !(this.landed && this.pitch < 0)
            && (this.stall < 0 || (this.pitch < 0 && this.up.y > 0) || (this.pitch > 0 && this.up.y < 0))) {
            this.obj.rotateX(-this.pitch * _defs__WEBPACK_IMPORTED_MODULE_0__.PITCH_RATE * controlScale * pitchAuthority * pitchSpeedAuthority * pitchGLimit * pitchAoaLimit * delta);
        }
        if (aoaRecovery !== 0) {
            this.obj.rotateX(Math.sign(aoa) * aoaRecovery * delta);
        }
        if (this.stall > 0 && !this.landed && this.pitch <= 0) {
            const stallNoseDown = this.stall * 0.6;
            const forward = this.forward;
            const right = this.right;
            const groundNormal = new three__WEBPACK_IMPORTED_MODULE_8__.Vector3(0, -1, 0);
            const pitchDir = new three__WEBPACK_IMPORTED_MODULE_8__.Vector3().crossVectors(forward, groundNormal);
            const dot = pitchDir.dot(right);
            this.obj.rotateX(Math.sign(dot) * stallNoseDown * delta);
        }
        if (this.landed && this.pitch <= 0) {
            const forward = this.forward;
            const prjForward = new three__WEBPACK_IMPORTED_MODULE_8__.Vector3().copy(forward).setY(0).normalize();
            const pitchAngle = forward.angleTo(prjForward) * Math.sign(forward.y);
            if (pitchAngle > 0.001) {
                const speedFactor = (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.clamp)(1 - speed / ROTATION_SPEED, 0, 1);
                const fallRate = speedFactor * 0.4;
                const rotation = Math.min(pitchAngle, fallRate * delta);
                this.obj.rotateX(rotation);
            }
        }
        const maxRollRate = (0,_f16RollControl__WEBPACK_IMPORTED_MODULE_4__.maxRollRateRad)(F16_ROLL_CONFIG);
        const rollYawCoupling = !this.landed && !(0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.isZero)(speed)
            ? (0,_f16RollControl__WEBPACK_IMPORTED_MODULE_4__.computeF16RollYawCoupling)(this.bodyRollRateRad, aoa, maxRollRate)
            : 0;
        if (!(0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.isZero)(speed) && (!(0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.isZero)(this.yaw) || Math.abs(rollYawCoupling) > 1e-6)) {
            const effectiveYaw = (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.clamp)(this.yaw + rollYawCoupling, -1, 1);
            this.obj.rotateY(-effectiveYaw * (this.landed ? YAW_RATE_LANDED : _defs__WEBPACK_IMPORTED_MODULE_0__.YAW_RATE) * yawControlScale * delta);
        }
        const thrustN = (0,_f16Engine__WEBPACK_IMPORTED_MODULE_3__.computeF16EngineThrustN)(this.effectiveThrottle, altitude);
        (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.roundToZero)(this.thrust.copy(this.forward).multiplyScalar(thrustN));
        this.engineThrustN = thrustN;
        if (speed > 1e-3) {
            this.velocityUnit.copy(this.velocity).multiplyScalar(1 / speed);
            (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.roundToZero)(this.drag.copy(this.velocityUnit).negate().multiplyScalar(dynamicPressure * WING_AREA * cd));
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
                (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.roundToZero)(this.lift.copy(this.liftDirection).multiplyScalar(dynamicPressure * WING_AREA * cl));
            }
            else {
                this.lift.set(0, 0, 0);
            }
        }
        else {
            this.drag.set(0, 0, 0);
            this.lift.set(0, 0, 0);
        }
        (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.roundToZero)(this.weight.set(0, -DRY_MASS * 9.80665, 0));
        if (!this.landed && speed > 5) {
            const lateralSpeed = this.velocity.dot(this.right);
            const forwardSpeed = this.velocity.dot(this.forward);
            const beta = Math.atan2(lateralSpeed, Math.max(Math.abs(forwardSpeed), 5));
            const dampForce = -lateralSpeed * SIDE_SLIP_DAMP_RATE * DRY_MASS;
            const betaForce = CY_BETA * beta * dynamicPressure * WING_AREA;
            (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.roundToZero)(this.sideForce.copy(this.right).multiplyScalar(dampForce + betaForce));
        }
        else {
            this.sideForce.set(0, 0, 0);
        }
        this.forces.set(0, 0, 0).add(this.thrust).add(this.drag).add(this.lift).add(this.sideForce).add(this.weight);
        const onGround = this.obj.position.y <= _defs__WEBPACK_IMPORTED_MODULE_0__.PLANE_DISTANCE_TO_GROUND + 0.05;
        if (this.landed || (this.wheelBrakesApplied && onGround)) {
            const weightMagnitude = DRY_MASS * 9.80665;
            const prjForces = this._v.copy(this.forces).setY(0);
            const prjForcesMagnitude = prjForces.length();
            const maxStaticFriction = (this.wheelBrakesApplied ? GROUND_BRAKE_STATIC : GROUND_FRICTION_STATIC) * weightMagnitude;
            const kineticFriction = (this.wheelBrakesApplied ? GROUND_BRAKE_KINETIC : GROUND_FRICTION_KINETIC) * weightMagnitude;
            if ((0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.isZero)(speed) && prjForcesMagnitude < maxStaticFriction) {
                this.friction.copy(prjForces).negate();
            }
            else if (speed > 0.5) {
                this.friction.copy(this.velocityUnit).setY(0).negate().normalize().multiplyScalar(kineticFriction);
            }
            else {
                this.friction.set(0, 0, 0);
            }
            (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.roundToZero)(this.friction);
        }
        else {
            this.friction.set(0, 0, 0);
        }
        this.forces.add(this.friction);
        if (this.landed && this.forces.y < 0) {
            this.forces.setY(0);
        }
        const accel = (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.roundToZero)(this.forces.divideScalar(DRY_MASS));
        this.up.copy(_utils_math__WEBPACK_IMPORTED_MODULE_1__.UP).applyQuaternion(this.obj.quaternion);
        (0,_f16FcsLimits__WEBPACK_IMPORTED_MODULE_5__.clampLoadFactorAcceleration)(accel, this.up, _f16Profile__WEBPACK_IMPORTED_MODULE_6__.F16_PROFILE.maxLoadFactorG);
        this.loadFactorG = (0,_aeroUtils__WEBPACK_IMPORTED_MODULE_2__.computeLoadFactorG)(accel, this.up);
        this.velocity.addScaledVector(accel, delta);
        if (this.landed && this.velocity.y < 0) {
            this.velocity.setY(0);
        }
        this.obj.position.addScaledVector(this.landed ? (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.roundToZero)(this.velocity, 0.01) : this.velocity, delta);
        if (this.obj.position.y > _defs__WEBPACK_IMPORTED_MODULE_0__.PLANE_DISTANCE_TO_GROUND) {
            this.landed = false;
        }
        this.handleGroundContact(speed);
        this.wrapPosition();
    }
    getStallStatus() {
        return this.stall;
    }
    getThrottleHudText() {
        return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_3__.formatF16ThrottleHud)(this.throttle);
    }
    useF16ThrottleDetents() {
        return true;
    }
    stepThrottleDetent(current, direction) {
        return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_3__.stepF16ThrottleDetent)(current, direction);
    }
    isInThrottleAbDetentBand(lever) {
        return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_3__.isF16AbDetentBand)(lever);
    }
    adjustThrottleInput(current, step) {
        return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_3__.adjustF16ThrottleInput)(current, step);
    }
    getThrottleZone() {
        return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_3__.getF16ThrottleZone)(this.effectiveThrottle);
    }
    getThrottleAudioLevel() {
        return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_3__.f16ThrottleAudioLevel)(this.effectiveThrottle);
    }
    getEngineNozzleColor() {
        return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_3__.getF16EngineNozzleColor)(this.effectiveThrottle);
    }
    updateStallState(speed, aoa, altitude) {
        if (this.landed || speed < 5) {
            this.stall = -1;
            return;
        }
        const aoaStall = (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.clamp)((Math.abs(aoa) - STALL_AOA * 0.75) / (STALL_AOA * 0.35), 0, 1);
        const speedStall = (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.clamp)((MIN_FLYING_SPEED - speed) / MIN_FLYING_SPEED, 0, 1);
        const stallLevel = Math.max(aoaStall, altitude > _defs__WEBPACK_IMPORTED_MODULE_0__.PLANE_DISTANCE_TO_GROUND + 5 ? speedStall : 0);
        this.stall = stallLevel > 0 ? stallLevel : -1;
    }
    handleGroundContact(speed) {
        if (this.obj.position.y >= _defs__WEBPACK_IMPORTED_MODULE_0__.PLANE_DISTANCE_TO_GROUND) {
            return;
        }
        this.obj.position.y = _defs__WEBPACK_IMPORTED_MODULE_0__.PLANE_DISTANCE_TO_GROUND;
        const forward = this.forward.copy(_utils_math__WEBPACK_IMPORTED_MODULE_1__.FORWARD).applyQuaternion(this.obj.quaternion);
        const up = this.up.copy(_utils_math__WEBPACK_IMPORTED_MODULE_1__.UP).applyQuaternion(this.obj.quaternion);
        const right = this.right.copy(_utils_math__WEBPACK_IMPORTED_MODULE_1__.RIGHT).applyQuaternion(this.obj.quaternion);
        const prjForward = new three__WEBPACK_IMPORTED_MODULE_8__.Vector3().copy(forward).setY(0).normalize();
        const pitchAngle = forward.angleTo(prjForward) * Math.sign(forward.y);
        const prjRight = new three__WEBPACK_IMPORTED_MODULE_8__.Vector3().copy(right).setY(0).normalize();
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
            const heading = new three__WEBPACK_IMPORTED_MODULE_8__.Vector3().copy(forward).setY(0).normalize();
            this.obj.quaternion.setFromUnitVectors(_utils_math__WEBPACK_IMPORTED_MODULE_1__.FORWARD, heading);
        }
        this.velocity.setY(0);
        this.stall = -1;
        this.landed = true;
    }
    wrapPosition() {
        const terrainHalfSize = 2.5 * _defs__WEBPACK_IMPORTED_MODULE_0__.TERRAIN_SCALE * _defs__WEBPACK_IMPORTED_MODULE_0__.TERRAIN_MODEL_SIZE;
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


/***/ }),

/***/ "./src/script/physics/worker/flightWorker.ts":
/*!***************************************************!*\
  !*** ./src/script/physics/worker/flightWorker.ts ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _model_realisticFlightModel__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../model/realisticFlightModel */ "./src/script/physics/model/realisticFlightModel.ts");
/* harmony import */ var _model_arcadeFlightModel__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../model/arcadeFlightModel */ "./src/script/physics/model/arcadeFlightModel.ts");
/* harmony import */ var _model_debugFlightModel__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../model/debugFlightModel */ "./src/script/physics/model/debugFlightModel.ts");



let flightModel;
self.onmessage = (event) => {
    const data = event.data;
    switch (data.type) {
        case 'init':
            if (data.modelType === 'realistic') {
                flightModel = new _model_realisticFlightModel__WEBPACK_IMPORTED_MODULE_0__.RealisticFlightModel();
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
};
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


/***/ }),

/***/ "./src/script/utils/math.ts":
/*!**********************************!*\
  !*** ./src/script/utils/math.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ZERO": () => (/* binding */ ZERO),
/* harmony export */   "UP": () => (/* binding */ UP),
/* harmony export */   "FORWARD": () => (/* binding */ FORWARD),
/* harmony export */   "RIGHT": () => (/* binding */ RIGHT),
/* harmony export */   "isZero": () => (/* binding */ isZero),
/* harmony export */   "equals": () => (/* binding */ equals),
/* harmony export */   "clamp": () => (/* binding */ clamp),
/* harmony export */   "lerp": () => (/* binding */ lerp),
/* harmony export */   "vectorHeading": () => (/* binding */ vectorHeading),
/* harmony export */   "roundToZero": () => (/* binding */ roundToZero),
/* harmony export */   "easeOutCirc": () => (/* binding */ easeOutCirc),
/* harmony export */   "easeOutQuad": () => (/* binding */ easeOutQuad),
/* harmony export */   "easeOutQuint": () => (/* binding */ easeOutQuint),
/* harmony export */   "PI_OVER_180": () => (/* binding */ PI_OVER_180),
/* harmony export */   "N180_OVER_PI": () => (/* binding */ N180_OVER_PI),
/* harmony export */   "toRadians": () => (/* binding */ toRadians),
/* harmony export */   "toDegrees": () => (/* binding */ toDegrees),
/* harmony export */   "calculatePitchRoll": () => (/* binding */ calculatePitchRoll)
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


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
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
/******/ 		var __webpack_exports__ = __webpack_require__.O(undefined, ["vendors-node_modules_three_build_three_module_js"], () => (__webpack_require__("./src/script/physics/worker/flightWorker.ts")))
/******/ 		__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 		return __webpack_exports__;
/******/ 	};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
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
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
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
/******/ 		// This function allow to reference async chunks and sibling chunks for the entrypoint
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
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript)
/******/ 				scriptUrl = document.currentScript.src
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) scriptUrl = scripts[scripts.length - 1].src
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
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
/******/ 			var [chunkIds, moreModules, runtime] = data;
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
/******/ 		var next = __webpack_require__.x;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3JjX3NjcmlwdF9waHlzaWNzX3dvcmtlcl9mbGlnaHRXb3JrZXJfdHMuYnVuZGxlLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDTyxNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFFbkIsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDO0FBQ3JCLE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQztBQUNyQixNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUM7QUFDckIsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDO0FBRXJCLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQztBQUNsQixNQUFNLEtBQUssR0FBRyxHQUFHLENBQUM7QUFDbEIsTUFBTSxVQUFVLEdBQUcsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUM3QixNQUFNLFVBQVUsR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBRTdCLE1BQU0sYUFBYSxHQUFHLEtBQUssQ0FBQztBQUM1QixNQUFNLGtCQUFrQixHQUFHLEtBQUssQ0FBQztBQUVqQyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUMvQixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUM5QixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztBQUM5QixNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUM7QUFDeEIsTUFBTSxhQUFhLEdBQUcsRUFBRSxDQUFDO0FBQ3pCLE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQztBQUN2QixNQUFNLHdCQUF3QixHQUFHLEdBQUcsQ0FBQztBQUNyQyxNQUFNLHNCQUFzQixHQUFHLEdBQUcsQ0FBQztBQUNuQyxNQUFNLHNCQUFzQixHQUFHLEdBQUcsQ0FBQztBQUNuQyxNQUFNLFlBQVksR0FBRyxLQUFLLENBQUM7QUFFM0IsTUFBTSxXQUFXLEdBQUcsRUFBRSxDQUFDO0FB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QUFJLENBQUMsS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FDcEMsRUFDSDtZQUNFLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyw2Q0FBVSxHQUFHLEtBQUssQ0FBQyxDQUFDO1NBQ3REO1FBR0QsSUFBSSxDQUFDLG1EQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsbURBQU0sQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUNyQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLDJDQUFRLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQztTQUNwRjtRQUdELElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsSUFBSSxFQUFFO1lBQ2pELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1RSxNQUFNLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0RixJQUFJLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLDJDQUFFLEVBQUUsSUFBSSxHQUFHLEtBQUssQ0FBQyxNQUFNLEVB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Ly4vc3JjL3NjcmlwdC9kZWZzLnRzIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltLy4vc3JjL3NjcmlwdC9waHlzaWNzL2Flcm9VdGlscy50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy9mMTZFbmdpbmUudHMiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vLi9zcmMvc2NyaXB0L3BoeXNpY3MvZjE2RmNzTGltaXRzLnRzIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltLy4vc3JjL3NjcmlwdC9waHlzaWNzL2YxNlBhcGVyRGF0YS50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy9mMTZQcm9maWxlLnRzIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltLy4vc3JjL3NjcmlwdC9waHlzaWNzL2YxNlJvbGxDb250cm9sLnRzIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltLy4vc3JjL3NjcmlwdC9waHlzaWNzL21vZGVsL2FyY2FkZUZsaWdodE1vZGVsLnRzIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltLy4vc3JjL3NjcmlwdC9waHlzaWNzL21vZGVsL2RlYnVnRmxpZ2h0TW9kZWwudHMiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vLi9zcmMvc2NyaXB0L3BoeXNpY3MvbW9kZWwvZmxpZ2h0TW9kZWwudHMiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vLi9zcmMvc2NyaXB0L3BoeXNpY3MvbW9kZWwvcmVhbGlzdGljRmxpZ2h0TW9kZWwudHMiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vLi9zcmMvc2NyaXB0L3BoeXNpY3Mvd29ya2VyL2ZsaWdodFdvcmtlci50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvdXRpbHMvbWF0aC50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS93ZWJwYWNrL3J1bnRpbWUvY2h1bmsgbG9hZGVkIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS93ZWJwYWNrL3J1bnRpbWUvZW5zdXJlIGNodW5rIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svcnVudGltZS9nZXQgamF2YXNjcmlwdCBjaHVuayBmaWxlbmFtZSIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS93ZWJwYWNrL3J1bnRpbWUvZ2xvYmFsIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS93ZWJwYWNrL3J1bnRpbWUvcHVibGljUGF0aCIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS93ZWJwYWNrL3J1bnRpbWUvaW1wb3J0U2NyaXB0cyBjaHVuayBsb2FkaW5nIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svcnVudGltZS9zdGFydHVwIGNodW5rIGRlcGVuZGVuY2llcyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS93ZWJwYWNrL2JlZm9yZS1zdGFydHVwIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svc3RhcnR1cCIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS93ZWJwYWNrL2FmdGVyLXN0YXJ0dXAiXSwic291cmNlc0NvbnRlbnQiOlsiXG5leHBvcnQgY29uc3QgRlBTX0NBUCA9IDE1OyAvLyBGUFNcblxuZXhwb3J0IGNvbnN0IExPX0hfUkVTID0gMzIwO1xuZXhwb3J0IGNvbnN0IExPX1ZfUkVTID0gMjAwO1xuZXhwb3J0IGNvbnN0IEhJX0hfUkVTID0gNjQwO1xuZXhwb3J0IGNvbnN0IEhJX1ZfUkVTID0gNDAwO1xuXG5leHBvcnQgY29uc3QgSF9SRVMgPSAzMjA7XG5leHBvcnQgY29uc3QgVl9SRVMgPSAyMDA7XG5leHBvcnQgY29uc3QgSF9SRVNfSEFMRiA9IEhfUkVTIC8gMjtcbmV4cG9ydCBjb25zdCBWX1JFU19IQUxGID0gVl9SRVMgLyAyO1xuXG5leHBvcnQgY29uc3QgVEVSUkFJTl9TQ0FMRSA9IDIwMC4wO1xuZXhwb3J0IGNvbnN0IFRFUlJBSU5fTU9ERUxfU0laRSA9IDEwMC4wO1xuXG5leHBvcnQgY29uc3QgUElUQ0hfUkFURSA9IE1hdGguUEkgLyA1OyAvLyBSYWRpYW5zL3NcbmV4cG9ydCBjb25zdCBST0xMX1JBVEUgPSBNYXRoLlBJIC8gMjsgLy8gUmFkaWFucy9zICh3YXMgz4AvMywgKzUwJSlcbmV4cG9ydCBjb25zdCBZQVdfUkFURSA9IE1hdGguUEkgLyAxMjsgLy8gUmFkaWFucy9zXG5leHBvcnQgY29uc3QgTUFYX1NQRUVEID0gMjUwLjA7IC8vIFdvcmxkIHVuaXRzL3NcbmV4cG9ydCBjb25zdCBUSFJPVFRMRV9SQVRFID0gMzM7IC8vIFBlcmNlbnRhZ2Ugb2YgbWF4aW11bS9zIFswLDEwMF1cbmV4cG9ydCBjb25zdCBTVElDS19SQVRFID0gMS41OyAvLyBGdWxsIHN0aWNrIGRlZmxlY3Rpb24gcGVyIHNlY29uZFxuZXhwb3J0IGNvbnN0IFBMQU5FX0RJU1RBTkNFX1RPX0dST1VORCA9IDIuMDsgLy8gV29ybGQgdW5pdHNcbmV4cG9ydCBjb25zdCBQTEFORV9DT0NLUElUX09GRlNFVF9ZID0gMS4wOyAvLyBXb3JsZCB1bml0c1xuZXhwb3J0IGNvbnN0IFBMQU5FX0NPQ0tQSVRfT0ZGU0VUX1ogPSA4LjA7IC8vIFdvcmxkIHVuaXRzXG5leHBvcnQgY29uc3QgTUFYX0FMVElUVURFID0gMTQwMDA7IC8vIFdvcmxkIHVuaXRzXG5cbmV4cG9ydCBjb25zdCBDT0NLUElUX0ZPViA9IDUwO1xuZXhwb3J0IGNvbnN0IENPQ0tQSVRfRkFSID0gNDAwMDA7XG5cbmV4cG9ydCBjb25zdCBHUk9VTkRfU01PS0VfUEFSVElDTEVfQ09VTlQgPSAxMDA7XG5cbmV4cG9ydCBjb25zdCBBSVJCQVNFX1JVTldBWSA9IHsgeDogMTUwMCwgeTogMCwgejogLTgwMCB9O1xuZXhwb3J0IGNvbnN0IFJVTldBWV9IQUxGX0xFTkdUSF9NID0gMTUwMDtcbmV4cG9ydCBjb25zdCBBUFBST0FDSF9BTFRJVFVERV9NID0gNTAwO1xuZXhwb3J0IGNvbnN0IEFQUFJPQUNIX1NQRUVEX0tNSCA9IDMwMDtcbmV4cG9ydCBjb25zdCBBUFBST0FDSF9TUEVFRF9NUFMgPSBBUFBST0FDSF9TUEVFRF9LTUggLyAzLjY7XG5leHBvcnQgY29uc3QgQVBQUk9BQ0hfRklOQUxfRElTVEFOQ0VfTSA9IDUwMDA7XG4iLCJpbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5cbmNvbnN0IEdSQVZJVFkgPSA5Ljg7XG5cbmV4cG9ydCBjb25zdCBHUk9VTkRfQUlSX0RFTlNJVFkgPSAxLjIyNTsgLy8ga2cvbcKzIGF0IHNlYSBsZXZlbCwgSVNBXG5jb25zdCBWTkVfTUFDSCA9IDAuOTU7IC8vIHRyYW5zb25pYyBkcmFnIHJpc2Ugb25zZXQgKHNpbSBvbmx5OyBwYXBlciBr4oKCID0gMClcblxuY29uc3QgSVNBX1NFQV9MRVZFTF9QUkVTU1VSRSA9IDEwMTMyNTsgLy8gUGFcbmNvbnN0IElTQV9TRUFfTEVWRUxfVEVNUCA9IDI4OC4xNTsgLy8gS1xuY29uc3QgSVNBX0xBUFNFX1JBVEUgPSAwLjAwNjU7IC8vIEsvbVxuY29uc3QgSVNBX1RST1BPUEFVU0VfQUxUID0gMTEwMDA7IC8vIG1cbmNvbnN0IElTQV9UUk9QT1BBVVNFX1BSRVNTVVJFID0gMjI2MzIuMTsgLy8gUGFcbmNvbnN0IElTQV9UUk9QT1BBVVNFX1RFTVAgPSAyMTYuNjU7IC8vIEtcbmNvbnN0IEdSQVZJVFlfSVNBID0gOS44MDY2NTsgLy8gbS9zwrJcbmNvbnN0IEdBU19DT05TVEFOVCA9IDI4Ny4wNTM7IC8vIEovKGtnwrdLKVxuXG4vKiogSVNBIGRlbnNpdHkgKGtnL23Csykg4oCUIEFuZGVyc29uLXN0eWxlIHBlcmZvcm1hbmNlIGFuYWx5c2lzIGF0bW9zcGhlcmUuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUlzYUFpckRlbnNpdHkoYWx0aXR1ZGVNZXRlcnM6IG51bWJlcik6IG51bWJlciB7XG4gICAgY29uc3QgaCA9IE1hdGgubWF4KDAsIGFsdGl0dWRlTWV0ZXJzKTtcbiAgICBsZXQgdGVtcGVyYXR1cmU6IG51bWJlcjtcbiAgICBsZXQgcHJlc3N1cmU6IG51bWJlcjtcblxuICAgIGlmIChoIDw9IElTQV9UUk9QT1BBVVNFX0FMVCkge1xuICAgICAgICB0ZW1wZXJhdHVyZSA9IElTQV9TRUFfTEVWRUxfVEVNUCAtIElTQV9MQVBTRV9SQVRFICogaDtcbiAgICAgICAgcHJlc3N1cmUgPSBJU0FfU0VBX0xFVkVMX1BSRVNTVVJFICogTWF0aC5wb3coXG4gICAgICAgICAgICB0ZW1wZXJhdHVyZSAvIElTQV9TRUFfTEVWRUxfVEVNUCxcbiAgICAgICAgICAgIEdSQVZJVFlfSVNBIC8gKEdBU19DT05TVEFOVCAqIElTQV9MQVBTRV9SQVRFKSxcbiAgICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0ZW1wZXJhdHVyZSA9IElTQV9UUk9QT1BBVVNFX1RFTVA7XG4gICAgICAgIHByZXNzdXJlID0gSVNBX1RST1BPUEFVU0VfUFJFU1NVUkUgKiBNYXRoLmV4cChcbiAgICAgICAgICAgIC1HUkFWSVRZX0lTQSAqIChoIC0gSVNBX1RST1BPUEFVU0VfQUxUKSAvIChHQVNfQ09OU1RBTlQgKiBJU0FfVFJPUE9QQVVTRV9URU1QKSxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJlc3N1cmUgLyAoR0FTX0NPTlNUQU5UICogdGVtcGVyYXR1cmUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUFpckRlbnNpdHkoYWx0aXR1ZGVNZXRlcnM6IG51bWJlcik6IG51bWJlciB7XG4gICAgcmV0dXJuIGNvbXB1dGVJc2FBaXJEZW5zaXR5KGFsdGl0dWRlTWV0ZXJzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVEeW5hbWljUHJlc3N1cmUoYWlyRGVuc2l0eTogbnVtYmVyLCBzcGVlZDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICByZXR1cm4gMC41ICogYWlyRGVuc2l0eSAqIHNwZWVkICogc3BlZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlVGhydXN0RGVuc2l0eUZhY3RvcihhaXJEZW5zaXR5OiBudW1iZXIsIGFsdGl0dWRlTWV0ZXJzID0gMCk6IG51bWJlciB7XG4gICAgY29uc3Qgc2lnbWEgPSBhaXJEZW5zaXR5IC8gR1JPVU5EX0FJUl9ERU5TSVRZO1xuICAgIGNvbnN0IGxhcHNlID0gTWF0aC5wb3coc2lnbWEsIDAuNyk7XG4gICAgY29uc3Qgb3B0aW11bUFsdGl0dWRlID0gMTEwMDA7IC8vIG0sIH5GTDM2MCB0aHJ1c3QtbGltaXRlZCBvcHRpbXVtXG4gICAgY29uc3QgYWx0UGVuYWx0eSA9IGFsdGl0dWRlTWV0ZXJzIDw9IG9wdGltdW1BbHRpdHVkZVxuICAgICAgICA/IDFcbiAgICAgICAgOiBNYXRoLm1heCgwLjM1LCAxIC0gKGFsdGl0dWRlTWV0ZXJzIC0gb3B0aW11bUFsdGl0dWRlKSAvIDkwMDApO1xuICAgIHJldHVybiBsYXBzZSAqIGFsdFBlbmFsdHk7XG59XG5cbmNvbnN0IEdBTU1BID0gMS40O1xuXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZVNwZWVkT2ZTb3VuZChhbHRpdHVkZU1ldGVyczogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBjb25zdCB0ZW1wZXJhdHVyZSA9IE1hdGgubWF4KElTQV9UUk9QT1BBVVNFX1RFTVAsIElTQV9TRUFfTEVWRUxfVEVNUCAtIElTQV9MQVBTRV9SQVRFICogYWx0aXR1ZGVNZXRlcnMpO1xuICAgIHJldHVybiBNYXRoLnNxcnQoR0FNTUEgKiBHQVNfQ09OU1RBTlQgKiB0ZW1wZXJhdHVyZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlTWFjaE51bWJlcihzcGVlZE1wczogbnVtYmVyLCBhbHRpdHVkZU1ldGVyczogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBjb25zdCBzcGVlZE9mU291bmQgPSBjb21wdXRlU3BlZWRPZlNvdW5kKGFsdGl0dWRlTWV0ZXJzKTtcbiAgICBpZiAoc3BlZWRPZlNvdW5kIDw9IDApIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIHJldHVybiBzcGVlZE1wcyAvIHNwZWVkT2ZTb3VuZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVEeW5hbWljUHJlc3N1cmVEcmFnUGVuYWx0eShzcGVlZE1wczogbnVtYmVyLCBhbHRpdHVkZU1ldGVyczogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBjb25zdCBzcGVlZE9mU291bmQgPSBjb21wdXRlU3BlZWRPZlNvdW5kKGFsdGl0dWRlTWV0ZXJzKTtcbiAgICBpZiAoc3BlZWRPZlNvdW5kIDw9IDAgfHwgc3BlZWRNcHMgPD0gMCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgY29uc3QgbWFjaCA9IHNwZWVkTXBzIC8gc3BlZWRPZlNvdW5kO1xuICAgIGlmIChtYWNoIDw9IFZORV9NQUNIKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBjb25zdCBleGNlc3MgPSAobWFjaCAtIFZORV9NQUNIKSAvIFZORV9NQUNIO1xuICAgIHJldHVybiAwLjU1ICogZXhjZXNzICogZXhjZXNzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZU1heEVxdWlsaWJyaXVtU3BlZWQoXG4gICAgYWlyRGVuc2l0eTogbnVtYmVyLFxuICAgIHRocnVzdEZvcmNlOiBudW1iZXIsXG4gICAgd2luZ0FyZWE6IG51bWJlcixcbiAgICBkcmFnQ29lZmZpY2llbnQ6IG51bWJlcixcbik6IG51bWJlciB7XG4gICAgaWYgKGFpckRlbnNpdHkgPD0gMCB8fCBkcmFnQ29lZmZpY2llbnQgPD0gMCB8fCB0aHJ1c3RGb3JjZSA8PSAwKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICByZXR1cm4gTWF0aC5zcXJ0KDIgKiB0aHJ1c3RGb3JjZSAvIChhaXJEZW5zaXR5ICogd2luZ0FyZWEgKiBkcmFnQ29lZmZpY2llbnQpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVBbmdsZU9mQXR0YWNrKFxuICAgIGZvcndhcmQ6IFRIUkVFLlZlY3RvcjMsXG4gICAgcmlnaHQ6IFRIUkVFLlZlY3RvcjMsXG4gICAgdmVsb2NpdHk6IFRIUkVFLlZlY3RvcjMsXG4gICAgc2NyYXRjaDogVEhSRUUuVmVjdG9yMyxcbik6IG51bWJlciB7XG4gICAgY29uc3Qgc3BlZWQgPSB2ZWxvY2l0eS5sZW5ndGgoKTtcbiAgICBpZiAoc3BlZWQgPD0gMS4wKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIHNjcmF0Y2guY29weSh2ZWxvY2l0eSkubXVsdGlwbHlTY2FsYXIoMSAvIHNwZWVkKS5wcm9qZWN0T25QbGFuZShyaWdodCk7XG4gICAgaWYgKHNjcmF0Y2gubGVuZ3RoU3EoKSA8PSAxZS02KSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIHNjcmF0Y2gubm9ybWFsaXplKCk7XG4gICAgY29uc3QgYW9hQW5nbGUgPSBzY3JhdGNoLmFuZ2xlVG8oZm9yd2FyZCk7XG4gICAgY29uc3QgYW9hU2lnbiA9IHNjcmF0Y2guY3Jvc3MoZm9yd2FyZCkuZG90KHJpZ2h0KSA+IDAgPyAtMSA6IDE7XG4gICAgcmV0dXJuIGFvYVNpZ24gKiBhb2FBbmdsZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVMb2FkRmFjdG9yRyhhY2NlbDogVEhSRUUuVmVjdG9yMywgdXA6IFRIUkVFLlZlY3RvcjMsIGdyYXZpdHkgPSBHUkFWSVRZKTogbnVtYmVyIHtcbiAgICByZXR1cm4gKGFjY2VsLnggKiB1cC54ICsgKGFjY2VsLnkgKyBncmF2aXR5KSAqIHVwLnkgKyBhY2NlbC56ICogdXAueikgLyBncmF2aXR5O1xufVxuIiwiLyoqXG4gKiBGMTAwLVBXLTIyOSB0aHJvdHRsZSBxdWFkcmFudCBhbmQgdGhydXN0IHNjaGVkdWxlIGZvciBGLTE2Qy5cbiAqIExldmVyIFswLCAxXSBtYXBzIHRvIDDigJMxMDAlOiAwPU1JTCAyMCUsIDk4PU1JTCAxMDAlLCA5OT1BQjEsIDEwMD1BQjIuXG4gKi9cbmltcG9ydCB7IGNvbXB1dGVBaXJEZW5zaXR5LCBjb21wdXRlVGhydXN0RGVuc2l0eUZhY3RvciB9IGZyb20gJy4vYWVyb1V0aWxzJztcbmltcG9ydCB7IEYxNl9QUk9GSUxFIH0gZnJvbSAnLi9mMTZQcm9maWxlJztcblxuLyoqIEYxMDAtUFctMjI5IHNlYS1sZXZlbCBzdGF0aWMgdGhydXN0IChrTiksIFVTQUYgLyBKYW5lJ3MuICovXG5leHBvcnQgY29uc3QgRjE2X0VOR0lORSA9IHtcbiAgICAvKiogRmxpZ2h0IGlkbGUgKE1JTCAyMCUgb24gcXVhZHJhbnQpIOKAlCAwLjUga04gc2VhLWxldmVsIHN0YXRpYy4gKi9cbiAgICBpZGxlVGhydXN0S246IDAuNSxcbiAgICBtaWxUaHJ1c3RLbjogNzYuMyxcbiAgICAvKiogRmlyc3QgYWZ0ZXJidXJuZXIgZGV0ZW50IChtaW4gQUIgLyB6b25lIDUpLiAqL1xuICAgIGFiTWluVGhydXN0S246IDEwNC4wLFxuICAgIGFiTWF4VGhydXN0S246IEYxNl9QUk9GSUxFLmFiVGhydXN0S24sXG4gICAgLyoqIExldmVyIFswLCAxXSBhdCAxMDAlIE1JTCAoOTggb24gcXVhZHJhbnQpLiAqL1xuICAgIG1pbExldmVyRW5kOiBGMTZfUFJPRklMRS5taWxMZXZlckVuZCxcbiAgICAvKiogTGV2ZXIgWzAsIDFdIGF0IEFCMSBkZXRlbnQgKDk5IG9uIHF1YWRyYW50KS4gKi9cbiAgICBhYk1pbkxldmVyRW5kOiBGMTZfUFJPRklMRS5hYk1pbkxldmVyRW5kLFxufSBhcyBjb25zdDtcblxuZXhwb3J0IHR5cGUgRjE2VGhyb3R0bGVab25lID0gJ21pbCcgfCAnYWItbWluJyB8ICdhYi1tYXgnO1xuXG4vKiogQWZ0ZXJidXJuZXIgbm96emxlIGNvbG9ycyDigJQgc29saWQsIG5vIGFuaW1hdGlvbi4gKi9cbmV4cG9ydCBjb25zdCBGMTZfRU5HSU5FX05PWlpMRV9DT0xPUlMgPSB7XG4gICAgbWlsOiAnIzBhMGEwYScsXG4gICAgYWJNaW46ICcjZmY4ODAwJyxcbiAgICBhYk1heDogJyNmZmZmMDAnLFxufSBhcyBjb25zdDtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEYxNkVuZ2luZU5venpsZUNvbG9yKGxldmVyOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIGNvbnN0IHpvbmUgPSBnZXRGMTZUaHJvdHRsZVpvbmUobGV2ZXIpO1xuICAgIGlmICh6b25lID09PSAnYWItbWluJykge1xuICAgICAgICByZXR1cm4gRjE2X0VOR0lORV9OT1paTEVfQ09MT1JTLmFiTWluO1xuICAgIH1cbiAgICBpZiAoem9uZSA9PT0gJ2FiLW1heCcpIHtcbiAgICAgICAgcmV0dXJuIEYxNl9FTkdJTkVfTk9aWkxFX0NPTE9SUy5hYk1heDtcbiAgICB9XG4gICAgcmV0dXJuIEYxNl9FTkdJTkVfTk9aWkxFX0NPTE9SUy5taWw7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRjE2QWZ0ZXJidXJuZXJDb25lRGl0aGVyIHtcbiAgICBwcmltYXJ5OiBzdHJpbmc7XG4gICAgc2Vjb25kYXJ5OiBzdHJpbmc7XG59XG5cbi8qKiBPcmFuZ2UveWVsbG93IGNoZWNrZXJib2FyZCBkaXRoZXIgZm9yIEFCIGNvbmUgbWVzaGVzOyBudWxsIHdoZW4gTUlMIChjb25lcyBoaWRkZW4pLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEYxNkFmdGVyYnVybmVyQ29uZURpdGhlcihsZXZlcjogbnVtYmVyKTogRjE2QWZ0ZXJidXJuZXJDb25lRGl0aGVyIHwgbnVsbCB7XG4gICAgY29uc3Qgem9uZSA9IGdldEYxNlRocm90dGxlWm9uZShsZXZlcik7XG4gICAgaWYgKHpvbmUgPT09ICdhYi1taW4nKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBwcmltYXJ5OiBGMTZfRU5HSU5FX05PWlpMRV9DT0xPUlMuYWJNaW4sXG4gICAgICAgICAgICBzZWNvbmRhcnk6IEYxNl9FTkdJTkVfTk9aWkxFX0NPTE9SUy5hYk1heCxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgaWYgKHpvbmUgPT09ICdhYi1tYXgnKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBwcmltYXJ5OiBGMTZfRU5HSU5FX05PWlpMRV9DT0xPUlMuYWJNYXgsXG4gICAgICAgICAgICBzZWNvbmRhcnk6IEYxNl9FTkdJTkVfTk9aWkxFX0NPTE9SUy5hYk1pbixcbiAgICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0YxNkFmdGVyYnVybmVyQWN0aXZlKGxldmVyOiBudW1iZXIpOiBib29sZWFuIHtcbiAgICByZXR1cm4gZ2V0RjE2VGhyb3R0bGVab25lKGxldmVyKSAhPT0gJ21pbCc7XG59XG5cbmV4cG9ydCBjb25zdCBGMTZfQUZURVJCVVJORVJfQ09ORV9MRU5HVEhfTSA9IHtcbiAgICBtaWw6IDAsXG4gICAgYWJNaW46IDQsXG4gICAgYWJNYXg6IDcsXG59IGFzIGNvbnN0O1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RjE2QWZ0ZXJidXJuZXJDb25lTGVuZ3RoTShsZXZlcjogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBjb25zdCB6b25lID0gZ2V0RjE2VGhyb3R0bGVab25lKGxldmVyKTtcbiAgICBpZiAoem9uZSA9PT0gJ2FiLW1pbicpIHtcbiAgICAgICAgcmV0dXJuIEYxNl9BRlRFUkJVUk5FUl9DT05FX0xFTkdUSF9NLmFiTWluO1xuICAgIH1cbiAgICBpZiAoem9uZSA9PT0gJ2FiLW1heCcpIHtcbiAgICAgICAgcmV0dXJuIEYxNl9BRlRFUkJVUk5FUl9DT05FX0xFTkdUSF9NLmFiTWF4O1xuICAgIH1cbiAgICByZXR1cm4gRjE2X0FGVEVSQlVSTkVSX0NPTkVfTEVOR1RIX00ubWlsO1xufVxuXG4vKiogTGV2ZXIgWzAsIDFdIGFzIDDigJMxMDAgdGhyb3R0bGUgcXVhZHJhbnQgcG9zaXRpb24uICovXG5leHBvcnQgZnVuY3Rpb24gbGV2ZXJUb1BlcmNlbnQobGV2ZXI6IG51bWJlcik6IG51bWJlciB7XG4gICAgcmV0dXJuIGNsYW1wTGV2ZXIobGV2ZXIpICogMTAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNGMTZBYkRldGVudEJhbmQobGV2ZXI6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIHJldHVybiBsZXZlclRvUGVyY2VudChsZXZlcikgPj0gOTg7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRGMTZUaHJvdHRsZVpvbmUobGV2ZXI6IG51bWJlcik6IEYxNlRocm90dGxlWm9uZSB7XG4gICAgY29uc3QgcGN0ID0gbGV2ZXJUb1BlcmNlbnQobGV2ZXIpO1xuICAgIGlmIChwY3QgPCA5OSkge1xuICAgICAgICByZXR1cm4gJ21pbCc7XG4gICAgfVxuICAgIGlmIChwY3QgPCAxMDApIHtcbiAgICAgICAgcmV0dXJuICdhYi1taW4nO1xuICAgIH1cbiAgICByZXR1cm4gJ2FiLW1heCc7XG59XG5cbi8qKiBTZWEtbGV2ZWwgcmF0ZWQgdGhydXN0IChrTikgZm9yIGxldmVyIHBvc2l0aW9uLCBiZWZvcmUgYWx0aXR1ZGUgbGFwc2UuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUYxNlNsVGhydXN0S24obGV2ZXI6IG51bWJlcik6IG51bWJlciB7XG4gICAgY29uc3QgcGN0ID0gbGV2ZXJUb1BlcmNlbnQobGV2ZXIpO1xuICAgIGNvbnN0IHsgaWRsZVRocnVzdEtuLCBtaWxUaHJ1c3RLbiwgYWJNaW5UaHJ1c3RLbiwgYWJNYXhUaHJ1c3RLbiB9ID0gRjE2X0VOR0lORTtcblxuICAgIGlmIChwY3QgPD0gOTgpIHtcbiAgICAgICAgY29uc3QgbWlsRnJhY3Rpb24gPSBwY3QgLyA5ODtcbiAgICAgICAgcmV0dXJuIGlkbGVUaHJ1c3RLbiArIChtaWxUaHJ1c3RLbiAtIGlkbGVUaHJ1c3RLbikgKiBtaWxGcmFjdGlvbjtcbiAgICB9XG4gICAgaWYgKHBjdCA8IDk5KSB7XG4gICAgICAgIHJldHVybiBtaWxUaHJ1c3RLbjtcbiAgICB9XG4gICAgaWYgKHBjdCA+PSAxMDApIHtcbiAgICAgICAgcmV0dXJuIGFiTWF4VGhydXN0S247XG4gICAgfVxuICAgIHJldHVybiBhYk1pblRocnVzdEtuO1xufVxuXG4vKiogRGVsaXZlcmVkIGVuZ2luZSB0aHJ1c3QgKE4pIGF0IGFsdGl0dWRlIHdpdGggSVNBIHR1cmJvZmFuIGxhcHNlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVGMTZFbmdpbmVUaHJ1c3ROKGxldmVyOiBudW1iZXIsIGFsdGl0dWRlTWV0ZXJzOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IHNsS24gPSBjb21wdXRlRjE2U2xUaHJ1c3RLbihsZXZlcik7XG4gICAgY29uc3QgcmhvID0gY29tcHV0ZUFpckRlbnNpdHkoYWx0aXR1ZGVNZXRlcnMpO1xuICAgIGNvbnN0IGZhY3RvciA9IGNvbXB1dGVUaHJ1c3REZW5zaXR5RmFjdG9yKHJobywgYWx0aXR1ZGVNZXRlcnMpO1xuICAgIHJldHVybiBzbEtuICogMTAwMCAqIGZhY3Rvcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVGMTZFbmdpbmVUaHJ1c3RLbihsZXZlcjogbnVtYmVyLCBhbHRpdHVkZU1ldGVyczogbnVtYmVyKTogbnVtYmVyIHtcbiAgICByZXR1cm4gY29tcHV0ZUYxNkVuZ2luZVRocnVzdE4obGV2ZXIsIGFsdGl0dWRlTWV0ZXJzKSAvIDEwMDA7XG59XG5cbi8qKiBIVUQgbGFiZWw6IE1JTCAyMOKAkzEwMCUg4oaSIEFCMSDihpIgQUIyLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdEYxNlRocm90dGxlSHVkKGxldmVyOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIGNvbnN0IHBjdCA9IGxldmVyVG9QZXJjZW50KGxldmVyKTtcbiAgICBjb25zdCB6b25lID0gZ2V0RjE2VGhyb3R0bGVab25lKGxldmVyKTtcblxuICAgIGlmICh6b25lID09PSAnbWlsJykge1xuICAgICAgICBpZiAocGN0ID4gOTgpIHtcbiAgICAgICAgICAgIHJldHVybiAnTUlMIDEwMCc7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbWlsUGN0ID0gTWF0aC5yb3VuZCgyMCArIChwY3QgLyA5OCkgKiA4MCk7XG4gICAgICAgIHJldHVybiBgTUlMICR7bWlsUGN0fWA7XG4gICAgfVxuICAgIGlmICh6b25lID09PSAnYWItbWluJykge1xuICAgICAgICByZXR1cm4gJ0FCMSc7XG4gICAgfVxuICAgIHJldHVybiAnQUIyJztcbn1cblxuLyoqIE1hcCBsZXZlciB0byBbMCwgMV0gZm9yIGVuZ2luZSBhdWRpbyAoaWRsZeKGkm1pbOKGkmZ1bGwgQUIpLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGYxNlRocm90dGxlQXVkaW9MZXZlbChsZXZlcjogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBjb25zdCBzbEtuID0gY29tcHV0ZUYxNlNsVGhydXN0S24obGV2ZXIpO1xuICAgIGNvbnN0IHsgaWRsZVRocnVzdEtuLCBhYk1heFRocnVzdEtuIH0gPSBGMTZfRU5HSU5FO1xuICAgIGlmIChhYk1heFRocnVzdEtuIDw9IGlkbGVUaHJ1c3RLbikge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgcmV0dXJuIGNsYW1wTGV2ZXIoKHNsS24gLSBpZGxlVGhydXN0S24pIC8gKGFiTWF4VGhydXN0S24gLSBpZGxlVGhydXN0S24pKTtcbn1cblxuLyoqIENvbnRpbnVvdXMgTUlMIHJhbXAgZm9yIGhlbGQga2V5Ym9hcmQgaW5wdXQgYmVsb3cgdGhlIE1JTCBzdG9wLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkanVzdEYxNlRocm90dGxlSW5wdXQobGV2ZXI6IG51bWJlciwgc3RlcDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBjb25zdCBjdXJyZW50ID0gY2xhbXBMZXZlcihsZXZlcik7XG4gICAgaWYgKHN0ZXAgPiAwKSB7XG4gICAgICAgIHJldHVybiByYW1wRjE2VGhyb3R0bGVVcChjdXJyZW50LCBzdGVwKTtcbiAgICB9XG4gICAgaWYgKHN0ZXAgPCAwKSB7XG4gICAgICAgIHJldHVybiByYW1wRjE2VGhyb3R0bGVEb3duKGN1cnJlbnQsIC1zdGVwKTtcbiAgICB9XG4gICAgcmV0dXJuIGN1cnJlbnQ7XG59XG5cbi8qKiBPbmUgZGV0ZW50IHBlciBrZXkgcHJlc3M6IE1JTCAxMDAg4oaSIEFCMSDihpIgQUIyIChhbmQgcmV2ZXJzZSkuICovXG5leHBvcnQgZnVuY3Rpb24gc3RlcEYxNlRocm90dGxlRGV0ZW50KGxldmVyOiBudW1iZXIsIGRpcmVjdGlvbjogMSB8IC0xKTogbnVtYmVyIHtcbiAgICBjb25zdCBwY3QgPSBsZXZlclRvUGVyY2VudChsZXZlcik7XG4gICAgaWYgKGRpcmVjdGlvbiA+IDApIHtcbiAgICAgICAgaWYgKHBjdCA+PSA5OSkge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBjdCA+PSA5OCkge1xuICAgICAgICAgICAgcmV0dXJuIEYxNl9FTkdJTkUuYWJNaW5MZXZlckVuZDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbGV2ZXI7XG4gICAgfVxuICAgIGlmIChwY3QgPj0gMTAwKSB7XG4gICAgICAgIHJldHVybiBGMTZfRU5HSU5FLmFiTWluTGV2ZXJFbmQ7XG4gICAgfVxuICAgIGlmIChwY3QgPj0gOTkpIHtcbiAgICAgICAgcmV0dXJuIEYxNl9FTkdJTkUubWlsTGV2ZXJFbmQ7XG4gICAgfVxuICAgIHJldHVybiBsZXZlcjtcbn1cblxuZnVuY3Rpb24gcmFtcEYxNlRocm90dGxlVXAobGV2ZXI6IG51bWJlciwgc3RlcDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBjb25zdCB0YXJnZXQgPSBsZXZlciArIHN0ZXA7XG4gICAgaWYgKHRhcmdldCA+PSBGMTZfRU5HSU5FLm1pbExldmVyRW5kKSB7XG4gICAgICAgIHJldHVybiBGMTZfRU5HSU5FLm1pbExldmVyRW5kO1xuICAgIH1cbiAgICByZXR1cm4gY2xhbXBMZXZlcih0YXJnZXQpO1xufVxuXG5mdW5jdGlvbiByYW1wRjE2VGhyb3R0bGVEb3duKGxldmVyOiBudW1iZXIsIHN0ZXA6IG51bWJlcik6IG51bWJlciB7XG4gICAgY29uc3QgcGN0ID0gbGV2ZXJUb1BlcmNlbnQobGV2ZXIpO1xuICAgIGlmIChwY3QgPiA5OCkge1xuICAgICAgICByZXR1cm4gRjE2X0VOR0lORS5taWxMZXZlckVuZDtcbiAgICB9XG4gICAgcmV0dXJuIGNsYW1wTGV2ZXIobGV2ZXIgLSBzdGVwKTtcbn1cblxuZnVuY3Rpb24gY2xhbXBMZXZlcihsZXZlcjogbnVtYmVyKTogbnVtYmVyIHtcbiAgICByZXR1cm4gTWF0aC5tYXgoMCwgTWF0aC5taW4oMSwgbGV2ZXIpKTtcbn1cbiIsImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcbmltcG9ydCB7IGNsYW1wIH0gZnJvbSAnLi4vdXRpbHMvbWF0aCc7XG5cbmNvbnN0IEdSQVZJVFkgPSA5Ljg7XG5cbi8qKiBGQlcgZW52ZWxvcGUgbWFyZ2luOiBmdWxsIGF1dGhvcml0eSB1bnRpbCAxZyBiZWxvdyBsaW1pdCwgdGhlbiBsaW5lYXIgZmFkZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlRjE2RW52ZWxvcGVBdXRob3JpdHkoY3VycmVudEc6IG51bWJlciwgbWF4RzogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBjb25zdCBtYXJnaW4gPSBtYXhHIC0gY3VycmVudEc7XG4gICAgaWYgKG1hcmdpbiA+PSAxKSB7XG4gICAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgICBpZiAobWFyZ2luIDw9IDApIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIHJldHVybiBtYXJnaW47XG59XG5cbi8qKiBSZWR1Y2Ugbm9zZS11cCBwaXRjaCBjb21tYW5kIGFzIHBvc2l0aXZlIGcgYXBwcm9hY2hlcyB0aGUgRkNTIGNhcC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlRjE2UGl0Y2hHTGltaXQoY3VycmVudEc6IG51bWJlciwgcGl0Y2hTdGljazogbnVtYmVyLCBtYXhHOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGlmIChwaXRjaFN0aWNrIDw9IDApIHtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICAgIHJldHVybiBjb21wdXRlRjE2RW52ZWxvcGVBdXRob3JpdHkoY3VycmVudEcsIG1heEcpO1xufVxuXG4vKiogRkJXIGFscGhhIGxpbWl0ZXI6IGZhZGUgbm9zZS11cCBjb21tYW5kIGFzIEFPQSBhcHByb2FjaGVzIHRoZSBzdGFsbC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlRjE2UGl0Y2hBb2FBdXRob3JpdHkoYW9hUmFkOiBudW1iZXIsIHBpdGNoU3RpY2s6IG51bWJlciwgc3RhbGxBb2FSYWQ6IG51bWJlcik6IG51bWJlciB7XG4gICAgaWYgKHBpdGNoU3RpY2sgPD0gMCkge1xuICAgICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgY29uc3QgbGltaXQgPSBzdGFsbEFvYVJhZCAqIDAuOTU7XG4gICAgaWYgKGFvYVJhZCA8PSBsaW1pdCkge1xuICAgICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgcmV0dXJuIGNsYW1wKDEgLSAoYW9hUmFkIC0gbGltaXQpIC8gc3RhbGxBb2FSYWQsIDAsIDEpO1xufVxuXG4vKiogTm9zZS1kb3duIHJlY292ZXJ5IHJhdGUgKHJhZC9zKSB3aGVuIHxBT0F8IGV4Y2VlZHMgdGhlIHN0YWxsIGxpbWl0LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVGMTZBb2FSZWNvdmVyeVJhdGUoYW9hUmFkOiBudW1iZXIsIHN0YWxsQW9hUmFkOiBudW1iZXIsIHNwZWVkOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGlmIChzcGVlZCA8IDEwKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBpZiAoTWF0aC5hYnMoYW9hUmFkKSA8PSBzdGFsbEFvYVJhZCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgcmV0dXJuIGNsYW1wKChNYXRoLmFicyhhb2FSYWQpIC0gc3RhbGxBb2FSYWQpIC8gc3RhbGxBb2FSYWQsIDAsIDEpICogMC4zNTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVMb2FkRmFjdG9yRyhhY2NlbDogVEhSRUUuVmVjdG9yMywgdXA6IFRIUkVFLlZlY3RvcjMsIGdyYXZpdHkgPSBHUkFWSVRZKTogbnVtYmVyIHtcbiAgICByZXR1cm4gKGFjY2VsLnggKiB1cC54ICsgKGFjY2VsLnkgKyBncmF2aXR5KSAqIHVwLnkgKyBhY2NlbC56ICogdXAueikgLyBncmF2aXR5O1xufVxuXG4vKiogVHJpbSBhY2NlbGVyYXRpb24gYWxvbmcgYm9keSB1cCBzbyBsb2FkIGZhY3RvciBkb2VzIG5vdCBleGNlZWQgdGhlIEZDUyBlbnZlbG9wZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGFtcExvYWRGYWN0b3JBY2NlbGVyYXRpb24oXG4gICAgYWNjZWw6IFRIUkVFLlZlY3RvcjMsXG4gICAgdXA6IFRIUkVFLlZlY3RvcjMsXG4gICAgbWF4RzogbnVtYmVyLFxuICAgIGdyYXZpdHkgPSBHUkFWSVRZLFxuKTogdm9pZCB7XG4gICAgY29uc3QgbiA9IGNvbXB1dGVMb2FkRmFjdG9yRyhhY2NlbCwgdXAsIGdyYXZpdHkpO1xuICAgIGlmIChuIDw9IG1heEcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBhY2NlbC5hZGRTY2FsZWRWZWN0b3IodXAsIChtYXhHIC0gbikgKiBncmF2aXR5KTtcbn1cbiIsIi8qKlxuICogRi0xNkMgYWVyb2R5bmFtaWMgZGF0YSBmcm9tOlxuICogUmVobWFuLCBcIkFlcm9keW5hbWljIFBlcmZvcm1hbmNlIEFuYWx5c2lzIG9mIEYtMTZDIEZpZ2h0aW5nIEZhbGNvblwiIChOVVNUKS5cbiAqIENoYXJ0IHJlZmVyZW5jZXMgY29tcHV0ZWQgd2l0aCBBbmRlcnNvbiBJU0EgKyBwYXBlciBFcS4gKDLigJM1KSwga+KCgiA9IDAuXG4gKi9cblxuZXhwb3J0IGNvbnN0IEYxNl9QQVBFUl9BTkFMWVRJQ0FMID0ge1xuICAgIC8qKiBFcS4gKDIpOiBDRDAgPSBDZmUgKiBTd2V0IC8gU3JlZiAqL1xuICAgIGNkMDogMC4wMTgsXG4gICAgLyoqIEVxLiAoM+KAkzUpOiBDRGkgPSBLICogQ0zCsiAqL1xuICAgIGluZHVjZWREcmFnSzogMC4xNDg5LFxuICAgIGNsMDogMC4yLFxuICAgIC8qKiBOQUNBIDY0QTIwNCwgcGVyIHJhZGlhbiAqL1xuICAgIGNsQWxwaGFQZXJSYWQ6IDUuNzMsXG4gICAgLyoqIEZpZy4gNyBwZWFrICovXG4gICAgbWF4TGlmdFRvRHJhZzogOS42NixcbiAgICBtYXhMaWZ0VG9EcmFnQWxwaGFEZWc6IDIsXG4gICAgLyoqIEZpZy4gOSAqL1xuICAgIG1pbkdsaWRlQW5nbGVEZWc6IDUuOTEsXG4gICAgLyoqIFNlY3Rpb24gSUlJIGFzc3VtcHRpb25zIOKAlCBjcnVpc2UgYXQgTVRPVyAqL1xuICAgIGNydWlzZVZlbG9jaXR5RnBzOiA4NDYsXG4gICAgY3J1aXNlQWx0aXR1ZGVGdDogMzAwMDAsXG4gICAgLyoqIEphbmUncyAvIGxpdGVyYXR1cmUgc2VydmljZSBjZWlsaW5nICovXG4gICAgc2VydmljZUNlaWxpbmdGdDogNTAwMDAsXG4gICAgd2luZ0FyZWFGdDI6IDMwMCxcbiAgICBtdG93TGI6IDQyMDAwLFxufSBhcyBjb25zdDtcblxuLyoqIE9wZW5WU1AgLyBWU1BBZXJvIHJlc3VsdHMgY2l0ZWQgaW4gU2VjdGlvbiBJVi5CLiAqL1xuZXhwb3J0IGNvbnN0IEYxNl9QQVBFUl9WU1BBRVJPID0ge1xuICAgIGNkMDogMC4wMTI0LFxuICAgIGNsQWxwaGFQZXJSYWQ6IDMuNjIsXG4gICAgLyoqIERlcml2ZWQgZnJvbSBML0QgbWF4ID0gMTQgYXQgzrEg4omIIDTCsCB3aXRoIENM4oKAID0gMC4yLiAqL1xuICAgIGluZHVjZWREcmFnSzogMC4wOTczLFxuICAgIG1heExpZnRUb0RyYWc6IDE0LFxuICAgIG1heExpZnRUb0RyYWdBbHBoYURlZzogNCxcbn0gYXMgY29uc3Q7XG5cbmV4cG9ydCB0eXBlIEYxNlBhcGVyTWV0cmljID1cbiAgICB8ICdsaWZ0VG9EcmFnJ1xuICAgIHwgJ21pbkdsaWRlQW5nbGVEZWcnXG4gICAgfCAndGhydXN0UmVxdWlyZWRMYidcbiAgICB8ICd0b3RhbERyYWdMYidcbiAgICB8ICdtaW5Ub3RhbERyYWdMYidcbiAgICB8ICdjcnVpc2VTcGVlZEZwcydcbiAgICB8ICdjZDAnXG4gICAgfCAnY2xBbHBoYVBlclJhZCdcbiAgICB8ICd2TWluRHJhZ0Zwcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRjE2UGFwZXJDaGFydENhc2Uge1xuICAgIGlkOiBzdHJpbmc7XG4gICAgZmlndXJlOiBzdHJpbmc7XG4gICAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgICBtZXRyaWM6IEYxNlBhcGVyTWV0cmljO1xuICAgIC8qKiBBbmdsZSBvZiBhdHRhY2sgZm9yIEwvRCBjYXNlcyAoZGVncmVlcykuICovXG4gICAgYWxwaGFEZWc/OiBudW1iZXI7XG4gICAgYWx0aXR1ZGVGdDogbnVtYmVyO1xuICAgIHdlaWdodExiOiBudW1iZXI7XG4gICAgdmVsb2NpdHlGcHM6IG51bWJlcjtcbiAgICByZWZlcmVuY2U6IG51bWJlcjtcbiAgICB0b2xlcmFuY2U6IG51bWJlcjtcbn1cblxuLyoqXG4gKiBDaGFydCBjaGVja3BvaW50cyBmcm9tIEZpZ3MuIDcsIDksIDEw4oCTMTIsIDE24oCTMTcuXG4gKiBEcmFnL3RocnVzdCByZWZlcmVuY2VzOiBJU0EgKyBwYXBlciBwb2xhciBhdCBzdGF0ZWQgViwgaCwgVyAoTUFUTEFCIG1ldGhvZG9sb2d5KS5cbiAqL1xuZXhwb3J0IGNvbnN0IEYxNl9QQVBFUl9DSEFSVF9DQVNFUzogRjE2UGFwZXJDaGFydENhc2VbXSA9IFtcbiAgICB7XG4gICAgICAgIGlkOiAnZmlnN19sZF9tYXgnLFxuICAgICAgICBmaWd1cmU6ICdGaWcuIDcnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ01heGltdW0gbGlmdC10by1kcmFnIHJhdGlvJyxcbiAgICAgICAgbWV0cmljOiAnbGlmdFRvRHJhZycsXG4gICAgICAgIGFscGhhRGVnOiAyLFxuICAgICAgICBhbHRpdHVkZUZ0OiAwLFxuICAgICAgICB3ZWlnaHRMYjogRjE2X1BBUEVSX0FOQUxZVElDQUwubXRvd0xiLFxuICAgICAgICB2ZWxvY2l0eUZwczogMCxcbiAgICAgICAgcmVmZXJlbmNlOiA5LjY2LFxuICAgICAgICB0b2xlcmFuY2U6IDAuMTUsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGlkOiAnZmlnOV9taW5fZ2xpZGUnLFxuICAgICAgICBmaWd1cmU6ICdGaWcuIDknLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ01pbmltdW0gZ2xpZGUgYW5nbGUnLFxuICAgICAgICBtZXRyaWM6ICdtaW5HbGlkZUFuZ2xlRGVnJyxcbiAgICAgICAgYWx0aXR1ZGVGdDogMzAwMDAsXG4gICAgICAgIHdlaWdodExiOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5tdG93TGIsXG4gICAgICAgIHZlbG9jaXR5RnBzOiAwLFxuICAgICAgICByZWZlcmVuY2U6IDUuOTEsXG4gICAgICAgIHRvbGVyYW5jZTogMC4xLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2ZpZzEwX21pbl9kcmFnXzIwaycsXG4gICAgICAgIGZpZ3VyZTogJ0ZpZy4gMTAnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ01pbmltdW0gdG90YWwgZHJhZyBhdCAyMCwwMDAgZnQgKE1UT1cpJyxcbiAgICAgICAgbWV0cmljOiAnbWluVG90YWxEcmFnTGInLFxuICAgICAgICBhbHRpdHVkZUZ0OiAyMDAwMCxcbiAgICAgICAgd2VpZ2h0TGI6IEYxNl9QQVBFUl9BTkFMWVRJQ0FMLm10b3dMYixcbiAgICAgICAgdmVsb2NpdHlGcHM6IDc5NyxcbiAgICAgICAgcmVmZXJlbmNlOiA0MzQ4Ljc0LFxuICAgICAgICB0b2xlcmFuY2U6IDUwLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2ZpZzEwX2RyYWdfNzUwZnBzJyxcbiAgICAgICAgZmlndXJlOiAnRmlnLiAxMCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnVG90YWwgZHJhZyBhdCA3NTAgZnQvcywgMjAsMDAwIGZ0IChNVE9XKScsXG4gICAgICAgIG1ldHJpYzogJ3RvdGFsRHJhZ0xiJyxcbiAgICAgICAgYWx0aXR1ZGVGdDogMjAwMDAsXG4gICAgICAgIHdlaWdodExiOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5tdG93TGIsXG4gICAgICAgIHZlbG9jaXR5RnBzOiA3NTAsXG4gICAgICAgIHJlZmVyZW5jZTogNDM4MS41MCxcbiAgICAgICAgdG9sZXJhbmNlOiA1MCxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6ICdmaWcxMV9taW5fZHJhZ18zMGsnLFxuICAgICAgICBmaWd1cmU6ICdGaWcuIDExJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdNaW5pbXVtIHRvdGFsIGRyYWcgYXQgMzAsMDAwIGZ0IChNVE9XKScsXG4gICAgICAgIG1ldHJpYzogJ21pblRvdGFsRHJhZ0xiJyxcbiAgICAgICAgYWx0aXR1ZGVGdDogMzAwMDAsXG4gICAgICAgIHdlaWdodExiOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5tdG93TGIsXG4gICAgICAgIHZlbG9jaXR5RnBzOiA5NTIsXG4gICAgICAgIHJlZmVyZW5jZTogNDM0OC43NCxcbiAgICAgICAgdG9sZXJhbmNlOiA1MCxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6ICdmaWcxMV9kcmFnXzkwMGZwcycsXG4gICAgICAgIGZpZ3VyZTogJ0ZpZy4gMTEnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1RvdGFsIGRyYWcgYXQgOTAwIGZ0L3MsIDMwLDAwMCBmdCAoTVRPVyknLFxuICAgICAgICBtZXRyaWM6ICd0b3RhbERyYWdMYicsXG4gICAgICAgIGFsdGl0dWRlRnQ6IDMwMDAwLFxuICAgICAgICB3ZWlnaHRMYjogRjE2X1BBUEVSX0FOQUxZVElDQUwubXRvd0xiLFxuICAgICAgICB2ZWxvY2l0eUZwczogOTAwLFxuICAgICAgICByZWZlcmVuY2U6IDQzNzUuODQsXG4gICAgICAgIHRvbGVyYW5jZTogNTAsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGlkOiAnZmlnMTJfbWluX2RyYWdfNDBrJyxcbiAgICAgICAgZmlndXJlOiAnRmlnLiAxMicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTWluaW11bSB0b3RhbCBkcmFnIGF0IDQwLDAwMCBmdCAoTVRPVyknLFxuICAgICAgICBtZXRyaWM6ICdtaW5Ub3RhbERyYWdMYicsXG4gICAgICAgIGFsdGl0dWRlRnQ6IDQwMDAwLFxuICAgICAgICB3ZWlnaHRMYjogRjE2X1BBUEVSX0FOQUxZVElDQUwubXRvd0xiLFxuICAgICAgICB2ZWxvY2l0eUZwczogMTE3MyxcbiAgICAgICAgcmVmZXJlbmNlOiA0MzQ4LjczLFxuICAgICAgICB0b2xlcmFuY2U6IDUwLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2ZpZzEyX2RyYWdfMTAwMGZwcycsXG4gICAgICAgIGZpZ3VyZTogJ0ZpZy4gMTInLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1RvdGFsIGRyYWcgYXQgMSwwMDAgZnQvcywgNDAsMDAwIGZ0IChNVE9XKScsXG4gICAgICAgIG1ldHJpYzogJ3RvdGFsRHJhZ0xiJyxcbiAgICAgICAgYWx0aXR1ZGVGdDogNDAwMDAsXG4gICAgICAgIHdlaWdodExiOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5tdG93TGIsXG4gICAgICAgIHZlbG9jaXR5RnBzOiAxMDAwLFxuICAgICAgICByZWZlcmVuY2U6IDQ1NzIuNTMsXG4gICAgICAgIHRvbGVyYW5jZTogNTAsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGlkOiAnZmlnMTZfdHJfbWluXzM1a2xiJyxcbiAgICAgICAgZmlndXJlOiAnRmlnLiAxNicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTWluaW11bSB0aHJ1c3QgcmVxdWlyZWQgYXQgMzUsMDAwIGxiICgzMCwwMDAgZnQpJyxcbiAgICAgICAgbWV0cmljOiAndGhydXN0UmVxdWlyZWRMYicsXG4gICAgICAgIGFsdGl0dWRlRnQ6IDMwMDAwLFxuICAgICAgICB3ZWlnaHRMYjogMzUwMDAsXG4gICAgICAgIHZlbG9jaXR5RnBzOiA4NzAsXG4gICAgICAgIHJlZmVyZW5jZTogMzYyMy45NixcbiAgICAgICAgdG9sZXJhbmNlOiA1MCxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6ICdmaWcxNl90cl8zNWtsYl85MDBmcHMnLFxuICAgICAgICBmaWd1cmU6ICdGaWcuIDE2JyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdUaHJ1c3QgcmVxdWlyZWQgYXQgMzUsMDAwIGxiLCA5MDAgZnQvcyAoMzAsMDAwIGZ0KScsXG4gICAgICAgIG1ldHJpYzogJ3RocnVzdFJlcXVpcmVkTGInLFxuICAgICAgICBhbHRpdHVkZUZ0OiAzMDAwMCxcbiAgICAgICAgd2VpZ2h0TGI6IDM1MDAwLFxuICAgICAgICB2ZWxvY2l0eUZwczogOTAwLFxuICAgICAgICByZWZlcmVuY2U6IDM2MzMuMDEsXG4gICAgICAgIHRvbGVyYW5jZTogNTAsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGlkOiAnZmlnMTZfdHJfMzVrbGJfMTAwMGZwcycsXG4gICAgICAgIGZpZ3VyZTogJ0ZpZy4gMTYnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1RocnVzdCByZXF1aXJlZCBhdCAzNSwwMDAgbGIsIDEsMDAwIGZ0L3MgKDMwLDAwMCBmdCknLFxuICAgICAgICBtZXRyaWM6ICd0aHJ1c3RSZXF1aXJlZExiJyxcbiAgICAgICAgYWx0aXR1ZGVGdDogMzAwMDAsXG4gICAgICAgIHdlaWdodExiOiAzNTAwMCxcbiAgICAgICAgdmVsb2NpdHlGcHM6IDEwMDAsXG4gICAgICAgIHJlZmVyZW5jZTogMzc2OC40MyxcbiAgICAgICAgdG9sZXJhbmNlOiA1MCxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6ICdmaWcxN190cl9taW5fMjBrJyxcbiAgICAgICAgZmlndXJlOiAnRmlnLiAxNycsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTWluaW11bSB0aHJ1c3QgcmVxdWlyZWQgYXQgMjAsMDAwIGZ0IChNVE9XKScsXG4gICAgICAgIG1ldHJpYzogJ3RocnVzdFJlcXVpcmVkTGInLFxuICAgICAgICBhbHRpdHVkZUZ0OiAyMDAwMCxcbiAgICAgICAgd2VpZ2h0TGI6IEYxNl9QQVBFUl9BTkFMWVRJQ0FMLm10b3dMYixcbiAgICAgICAgdmVsb2NpdHlGcHM6IDc5NyxcbiAgICAgICAgcmVmZXJlbmNlOiA0MzQ4Ljc0LFxuICAgICAgICB0b2xlcmFuY2U6IDUwLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2ZpZzE3X3RyX21pbl8zMGsnLFxuICAgICAgICBmaWd1cmU6ICdGaWcuIDE3JyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdUaHJ1c3QgcmVxdWlyZWQgYXQgMSwwMDAgZnQvcywgMzAsMDAwIGZ0IChNVE9XKScsXG4gICAgICAgIG1ldHJpYzogJ3RocnVzdFJlcXVpcmVkTGInLFxuICAgICAgICBhbHRpdHVkZUZ0OiAzMDAwMCxcbiAgICAgICAgd2VpZ2h0TGI6IEYxNl9QQVBFUl9BTkFMWVRJQ0FMLm10b3dMYixcbiAgICAgICAgdmVsb2NpdHlGcHM6IDEwMDAsXG4gICAgICAgIHJlZmVyZW5jZTogNDM3MC4xMixcbiAgICAgICAgdG9sZXJhbmNlOiA1MCxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6ICdmaWcxN190cl8xMTUwZnBzXzQwaycsXG4gICAgICAgIGZpZ3VyZTogJ0ZpZy4gMTcnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1RocnVzdCByZXF1aXJlZCBhdCAxLDE1MCBmdC9zLCA0MCwwMDAgZnQgKE1UT1cpJyxcbiAgICAgICAgbWV0cmljOiAndGhydXN0UmVxdWlyZWRMYicsXG4gICAgICAgIGFsdGl0dWRlRnQ6IDQwMDAwLFxuICAgICAgICB3ZWlnaHRMYjogRjE2X1BBUEVSX0FOQUxZVElDQUwubXRvd0xiLFxuICAgICAgICB2ZWxvY2l0eUZwczogMTE1MCxcbiAgICAgICAgcmVmZXJlbmNlOiA0MzUyLjIwLFxuICAgICAgICB0b2xlcmFuY2U6IDUwLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2Fzc3VtcHRpb25fY3J1aXNlX3NwZWVkJyxcbiAgICAgICAgZmlndXJlOiAnU2VjdGlvbiBJSUknLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0NydWlzZSB2ZWxvY2l0eSBhdCAzMCwwMDAgZnQgKE1UT1cpJyxcbiAgICAgICAgbWV0cmljOiAnY3J1aXNlU3BlZWRGcHMnLFxuICAgICAgICBhbHRpdHVkZUZ0OiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5jcnVpc2VBbHRpdHVkZUZ0LFxuICAgICAgICB3ZWlnaHRMYjogRjE2X1BBUEVSX0FOQUxZVElDQUwubXRvd0xiLFxuICAgICAgICB2ZWxvY2l0eUZwczogRjE2X1BBUEVSX0FOQUxZVElDQUwuY3J1aXNlVmVsb2NpdHlGcHMsXG4gICAgICAgIHJlZmVyZW5jZTogODQ2LFxuICAgICAgICB0b2xlcmFuY2U6IDAuNSxcbiAgICB9LFxuXTtcblxuLyoqIFZTUEFlcm8gY2hhcnQgY2hlY2twb2ludHMgKEZpZ3MuIDE44oCTMjApLiAqL1xuZXhwb3J0IGNvbnN0IEYxNl9QQVBFUl9WU1BBRVJPX0NBU0VTOiBGMTZQYXBlckNoYXJ0Q2FzZVtdID0gW1xuICAgIHtcbiAgICAgICAgaWQ6ICdmaWcyMF9sZF9tYXhfdnNwYWVybycsXG4gICAgICAgIGZpZ3VyZTogJ0ZpZy4gMjAnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1ZTUEFlcm8gbWF4aW11bSBML0QnLFxuICAgICAgICBtZXRyaWM6ICdsaWZ0VG9EcmFnJyxcbiAgICAgICAgYWxwaGFEZWc6IDQsXG4gICAgICAgIGFsdGl0dWRlRnQ6IDAsXG4gICAgICAgIHdlaWdodExiOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5tdG93TGIsXG4gICAgICAgIHZlbG9jaXR5RnBzOiAwLFxuICAgICAgICByZWZlcmVuY2U6IDE0LFxuICAgICAgICB0b2xlcmFuY2U6IDAuMTUsXG4gICAgfSxcbl07XG5cbmV4cG9ydCBjb25zdCBGVF9UT19NID0gMC4zMDQ4O1xuZXhwb3J0IGNvbnN0IEZQU19UT19NUFMgPSBGVF9UT19NO1xuZXhwb3J0IGNvbnN0IExCX1RPX04gPSA0LjQ0ODIyMTYxNTM7XG5leHBvcnQgY29uc3QgTEJfVE9fS0cgPSAwLjQ1MzU5MjM3O1xuIiwiLyoqXG4gKiBGLTE2QyBzaW0gcHJvZmlsZSBhbmQgcmVmZXJlbmNlIGRhdGEuXG4gKiBBbmFseXRpY2FsIGFlcm86IFJlaG1hbiwgXCJBZXJvZHluYW1pYyBQZXJmb3JtYW5jZSBBbmFseXNpcyBvZiBGLTE2QyBGaWdodGluZyBGYWxjb25cIi5cbiAqIFBlcmZvcm1hbmNlIGVudmVsb3BlOiBVU0FGIGZhY3Qgc2hlZXQgLyBKYW5lJ3MuXG4gKi9cbmltcG9ydCB7IEYxNl9QQVBFUl9BTkFMWVRJQ0FMIH0gZnJvbSAnLi9mMTZQYXBlckRhdGEnO1xuXG5leHBvcnQgY29uc3QgRjE2X1BST0ZJTEUgPSB7XG4gICAgLyoqIE1UT1cgZm9yIHBhcGVyL2VudmVsb3BlIGFuYWx5c2lzICh+NDIsMDAwIGxiKS4gKi9cbiAgICBjb21iYXRNYXNzS2c6IDE5MDUxLFxuICAgIC8qKiBUeXBpY2FsIHRha2VvZmYgZ3Jvc3Mgd2VpZ2h0IGZvciBzaW0gZHluYW1pY3MgKH4zMCwwMDAgbGIpLiAqL1xuICAgIHNpbU1hc3NLZzogMTM2MDgsXG4gICAgd2luZ0FyZWFNMjogMjcuODcsXG4gICAgd2luZ1NwYW5NOiA5LjQ1LFxuICAgIGNkMDogRjE2X1BBUEVSX0FOQUxZVElDQUwuY2QwLFxuICAgIGluZHVjZWREcmFnSzogRjE2X1BBUEVSX0FOQUxZVElDQUwuaW5kdWNlZERyYWdLLFxuICAgIGNsMDogRjE2X1BBUEVSX0FOQUxZVElDQUwuY2wwLFxuICAgIGNsQWxwaGFQZXJSYWQ6IEYxNl9QQVBFUl9BTkFMWVRJQ0FMLmNsQWxwaGFQZXJSYWQsXG4gICAgYWJUaHJ1c3RLbjogMTI5LjQsXG4gICAgbWlsVGhydXN0S246IDc2LjMsXG4gICAgLyoqIExldmVyIGF0IDEwMCUgbWlsaXRhcnkgcG93ZXIgKDk4IG9uIDDigJMxMDAgcXVhZHJhbnQpLiAqL1xuICAgIG1pbExldmVyRW5kOiAwLjk4LFxuICAgIC8qKiBMZXZlciBhdCBBQjEgZGV0ZW50ICg5OSBvbiAw4oCTMTAwIHF1YWRyYW50KS4gKi9cbiAgICBhYk1pbkxldmVyRW5kOiAwLjk5LFxuICAgIG1pbkZseWluZ1NwZWVkTXBzOiA2OCxcbiAgICBzdGFsbEFvYURlZzogMjIsXG4gICAgc2VydmljZUNlaWxpbmdNOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5zZXJ2aWNlQ2VpbGluZ0Z0ICogMC4zMDQ4LFxuICAgIGNydWlzZUFsdGl0dWRlTTogRjE2X1BBUEVSX0FOQUxZVElDQUwuY3J1aXNlQWx0aXR1ZGVGdCAqIDAuMzA0OCxcbiAgICBjcnVpc2VTcGVlZE1wczogRjE2X1BBUEVSX0FOQUxZVElDQUwuY3J1aXNlVmVsb2NpdHlGcHMgKiAwLjMwNDgsXG4gICAgLyoqIENhdCBJIGNsZWFuLXNoaXAgRkJXIHJvbGwtcmF0ZSBjYXAgKGRlZy9zKS4gKi9cbiAgICBtYXhSb2xsUmF0ZURlZ1M6IDMwMCxcbiAgICAvKiogQ2F0IElJSSBoZWF2eSBzdG9yZXMgcm9sbC1yYXRlIGNhcCAoZGVnL3MpLiAqL1xuICAgIGNhdDNNYXhSb2xsUmF0ZURlZ1M6IDE4MCxcbiAgICAvKiogRkJXIHBvc2l0aXZlIHN0cnVjdHVyYWwgZyBsaW1pdCAoQ2F0IEkpLiAqL1xuICAgIG1heExvYWRGYWN0b3JHOiA5LjUsXG4gICAgLyoqIFRha2VvZmYgcm90YXRpb24gc3BlZWQgKH43MCBrdCkuICovXG4gICAgcm90YXRpb25TcGVlZE1wczogNjUsXG4gICAgLyoqIE1heCB0b3VjaGRvd24gZ3JvdW5kc3BlZWQgd2l0aCBnZWFyIGRvd24uICovXG4gICAgbGFuZGluZ01heFNwZWVkTXBzOiA5MCxcbiAgICAvKiogTWF4IHNpbmsgcmF0ZSBhdCB0b3VjaGRvd24gKG0vcykuICovXG4gICAgbGFuZGluZ01heFZlcnRpY2FsU3BlZWRNcHM6IDgsXG4gICAgLyoqIE1heCBiYW5rIGF0IHRvdWNoZG93biAoZGVnKS4gKi9cbiAgICBsYW5kaW5nTWF4Um9sbERlZzogMTIsXG4gICAgLyoqIE1pbmltdW0gcGl0Y2ggYXQgdG91Y2hkb3duIChkZWcsIG5vc2UtZG93biBsaW1pdCkuICovXG4gICAgbGFuZGluZ01pblBpdGNoRGVnOiAtMTIsXG59IGFzIGNvbnN0O1xuXG5leHBvcnQgdHlwZSBGMTZSZWZlcmVuY2VNZXRyaWMgPVxuICAgIHwgJ21hc3NLZydcbiAgICB8ICd3aW5nQXJlYU0yJ1xuICAgIHwgJ3dpbmdTcGFuTSdcbiAgICB8ICdhYlRocnVzdEtuJ1xuICAgIHwgJ21heE1hY2gnXG4gICAgfCAnbWF4U3BlZWRLbWgnXG4gICAgfCAnbWluRmx5aW5nU3BlZWRLdHMnXG4gICAgfCAncGVha01heFNwZWVkQWx0aXR1ZGVNJ1xuICAgIHwgJ2NkMCdcbiAgICB8ICdpbmR1Y2VkRHJhZ0snXG4gICAgfCAnY2xBbHBoYVBlclJhZCdcbiAgICB8ICdtYXhMaWZ0VG9EcmFnJ1xuICAgIHwgJ2NydWlzZVNwZWVkTXBzJztcblxuZXhwb3J0IGludGVyZmFjZSBGMTZSZWZlcmVuY2VDYXNlIHtcbiAgICBpZDogc3RyaW5nO1xuICAgIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG4gICAgc291cmNlOiBzdHJpbmc7XG4gICAgbWV0cmljOiBGMTZSZWZlcmVuY2VNZXRyaWM7XG4gICAgYWx0aXR1ZGVNZXRlcnM6IG51bWJlcjtcbiAgICByZWZlcmVuY2U6IG51bWJlcjtcbiAgICB0b2xlcmFuY2U6IG51bWJlcjtcbiAgICAvKiogRm9yIEwvRCBtZXRyaWMuICovXG4gICAgYWxwaGFEZWc/OiBudW1iZXI7XG59XG5cbmV4cG9ydCBjb25zdCBGMTZfUkVGRVJFTkNFX0NBU0VTOiBGMTZSZWZlcmVuY2VDYXNlW10gPSBbXG4gICAge1xuICAgICAgICBpZDogJ2NkMF9wYXBlcicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnWmVyby1saWZ0IGRyYWcgY29lZmZpY2llbnQgKEVxLiAyKScsXG4gICAgICAgIHNvdXJjZTogJ1JlaG1hbiBwYXBlciBhbmFseXRpY2FsJyxcbiAgICAgICAgbWV0cmljOiAnY2QwJyxcbiAgICAgICAgYWx0aXR1ZGVNZXRlcnM6IDAsXG4gICAgICAgIHJlZmVyZW5jZTogMC4wMTgsXG4gICAgICAgIHRvbGVyYW5jZTogMCxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6ICdpbmR1Y2VkX2tfcGFwZXInLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0luZHVjZWQgZHJhZyBmYWN0b3IgSyAoRXEuIDPigJM1KScsXG4gICAgICAgIHNvdXJjZTogJ1JlaG1hbiBwYXBlciBhbmFseXRpY2FsJyxcbiAgICAgICAgbWV0cmljOiAnaW5kdWNlZERyYWdLJyxcbiAgICAgICAgYWx0aXR1ZGVNZXRlcnM6IDAsXG4gICAgICAgIHJlZmVyZW5jZTogMC4xNDg5LFxuICAgICAgICB0b2xlcmFuY2U6IDAuMDAwMSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6ICdjbF9hbHBoYV9wYXBlcicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTGlmdC1jdXJ2ZSBzbG9wZScsXG4gICAgICAgIHNvdXJjZTogJ1JlaG1hbiBwYXBlciAvIE5BQ0EgNjRBMjA0JyxcbiAgICAgICAgbWV0cmljOiAnY2xBbHBoYVBlclJhZCcsXG4gICAgICAgIGFsdGl0dWRlTWV0ZXJzOiAwLFxuICAgICAgICByZWZlcmVuY2U6IDUuNzMsXG4gICAgICAgIHRvbGVyYW5jZTogMC4wMSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6ICdsZF9tYXhfcGFwZXInLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ01heGltdW0gbGlmdC10by1kcmFnIHJhdGlvIGF0IM6xIOKJiCAywrAnLFxuICAgICAgICBzb3VyY2U6ICdSZWhtYW4gRmlnLiA3JyxcbiAgICAgICAgbWV0cmljOiAnbWF4TGlmdFRvRHJhZycsXG4gICAgICAgIGFsdGl0dWRlTWV0ZXJzOiAwLFxuICAgICAgICBhbHBoYURlZzogMixcbiAgICAgICAgcmVmZXJlbmNlOiA5LjY2LFxuICAgICAgICB0b2xlcmFuY2U6IDAuMyxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6ICdjcnVpc2Vfc3BlZWRfcGFwZXInLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0NydWlzZSB0cnVlIGFpcnNwZWVkIGF0IDMwLDAwMCBmdCcsXG4gICAgICAgIHNvdXJjZTogJ1JlaG1hbiBTZWN0aW9uIElJSSAoODQ2IGZ0L3MpJyxcbiAgICAgICAgbWV0cmljOiAnY3J1aXNlU3BlZWRNcHMnLFxuICAgICAgICBhbHRpdHVkZU1ldGVyczogRjE2X1BST0ZJTEUuY3J1aXNlQWx0aXR1ZGVNLFxuICAgICAgICByZWZlcmVuY2U6IEYxNl9QUk9GSUxFLmNydWlzZVNwZWVkTXBzLFxuICAgICAgICB0b2xlcmFuY2U6IDAuNSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6ICd3aW5nX2FyZWEnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1dpbmcgcmVmZXJlbmNlIGFyZWEgKDMwMCBmdMKyKScsXG4gICAgICAgIHNvdXJjZTogJ0phbmVcXCdzIC8gUmVobWFuIHBhcGVyJyxcbiAgICAgICAgbWV0cmljOiAnd2luZ0FyZWFNMicsXG4gICAgICAgIGFsdGl0dWRlTWV0ZXJzOiAwLFxuICAgICAgICByZWZlcmVuY2U6IDI3Ljg3LFxuICAgICAgICB0b2xlcmFuY2U6IDAuMDUsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGlkOiAnYWJfdGhydXN0X3NsJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdGdWxsIGFmdGVyYnVybmVyIHRocnVzdCBhdCBzZWEgbGV2ZWwnLFxuICAgICAgICBzb3VyY2U6ICdGMTAwLVBXLTIyOSAoMTI5LjQga04pJyxcbiAgICAgICAgbWV0cmljOiAnYWJUaHJ1c3RLbicsXG4gICAgICAgIGFsdGl0dWRlTWV0ZXJzOiAwLFxuICAgICAgICByZWZlcmVuY2U6IDEyOS40LFxuICAgICAgICB0b2xlcmFuY2U6IDIuMCxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6ICdtYXhfbWFjaF9mbDQwMCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTWF4aW11bSBNYWNoIGF0IDQwLDAwMCBmdCAoQUIsIHRocnVzdOKAk2RyYWcgYmFsYW5jZSknLFxuICAgICAgICBzb3VyY2U6ICdTaW0gZW52ZWxvcGUgd2l0aCBBbmRlcnNvbiBwb2xhciArIHRyYW5zb25pYyBkcmFnJyxcbiAgICAgICAgbWV0cmljOiAnbWF4TWFjaCcsXG4gICAgICAgIGFsdGl0dWRlTWV0ZXJzOiAxMjE5MixcbiAgICAgICAgcmVmZXJlbmNlOiAxLjg5LFxuICAgICAgICB0b2xlcmFuY2U6IDAuMTIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGlkOiAncGVha19zcGVlZF9hbHRpdHVkZScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQWx0aXR1ZGUgb2YgcGVhayBsZXZlbC1mbGlnaHQgbWF4IHNwZWVkJyxcbiAgICAgICAgc291cmNlOiAnU2ltIGVudmVsb3BlIChJU0EgdGhydXN0IGxhcHNlKScsXG4gICAgICAgIG1ldHJpYzogJ3BlYWtNYXhTcGVlZEFsdGl0dWRlTScsXG4gICAgICAgIGFsdGl0dWRlTWV0ZXJzOiAwLFxuICAgICAgICByZWZlcmVuY2U6IDExMDAwLFxuICAgICAgICB0b2xlcmFuY2U6IDUwMCxcbiAgICB9LFxuXTtcblxuZXhwb3J0IGNvbnN0IE1QU19UT19LVFMgPSAxLjk0Mzg0O1xuIiwiaW1wb3J0IHsgY2xhbXAgfSBmcm9tICcuLi91dGlscy9tYXRoJztcblxuLyoqIEZCVyByb2xsLWF4aXMgZW52ZWxvcGUgKENhdCBJIGNsZWFuKS4gQ2F0IElJSSBsb3dlcnMgbWF4IHJhdGUgZm9yIGhlYXZ5IHN0b3Jlcy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRjE2Um9sbENvbnRyb2xDb25maWcge1xuICAgIG1heFJvbGxSYXRlRGVnUzogbnVtYmVyO1xuICAgIGFjdHVhdG9yVGF1UzogbnVtYmVyO1xufVxuXG5leHBvcnQgY29uc3QgRjE2X1JPTExfQ0FUMTogRjE2Um9sbENvbnRyb2xDb25maWcgPSB7XG4gICAgbWF4Um9sbFJhdGVEZWdTOiAzMDAsXG4gICAgYWN0dWF0b3JUYXVTOiAwLjA3NSxcbn07XG5cbmV4cG9ydCBjb25zdCBGMTZfUk9MTF9DQVQzOiBGMTZSb2xsQ29udHJvbENvbmZpZyA9IHtcbiAgICBtYXhSb2xsUmF0ZURlZ1M6IDE4MCxcbiAgICBhY3R1YXRvclRhdVM6IDAuMDksXG59O1xuXG5jb25zdCBERUdfVE9fUkFEID0gTWF0aC5QSSAvIDE4MDtcblxuY29uc3QgTUlOX1FfR0FJTiA9IDAuMTI7XG5jb25zdCBNQVhfUV9HQUlOID0gMS4wO1xuXG5leHBvcnQgZnVuY3Rpb24gbWF4Um9sbFJhdGVSYWQoY29uZmlnOiBGMTZSb2xsQ29udHJvbENvbmZpZyk6IG51bWJlciB7XG4gICAgcmV0dXJuIGNvbmZpZy5tYXhSb2xsUmF0ZURlZ1MgKiBERUdfVE9fUkFEO1xufVxuXG4vKiogR2FpbiBmYWxscyBhcyBkeW5hbWljIHByZXNzdXJlIHJpc2VzIOKAlCBGQlcgbGltaXRzIGNvbW1hbmQgdG8gcHJvdGVjdCBzdHJ1Y3R1cmUuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUYxNlJvbGxEeW5hbWljUHJlc3N1cmVHYWluKGR5bmFtaWNQcmVzc3VyZTogbnVtYmVyLCBxUmVmOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IHEgPSBNYXRoLm1heChkeW5hbWljUHJlc3N1cmUsIDEpO1xuICAgIGNvbnN0IHJlZiA9IE1hdGgubWF4KHFSZWYsIDEpO1xuICAgIGNvbnN0IHJhdyA9IE1JTl9RX0dBSU4gKyAoTUFYX1FfR0FJTiAtIE1JTl9RX0dBSU4pICogTWF0aC5zcXJ0KHJlZiAvIChyZWYgKyBxKSk7XG4gICAgcmV0dXJuIGNsYW1wKHJhdywgTUlOX1FfR0FJTiwgTUFYX1FfR0FJTik7XG59XG5cbmZ1bmN0aW9uIG1hY2hSb2xsTGltaXRlcihtYWNoOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGlmIChtYWNoIDw9IDAuODUpIHtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICAgIHJldHVybiBjbGFtcCgxIC0gKG1hY2ggLSAwLjg1KSAvIDAuNTUsIDAuMzUsIDEpO1xufVxuXG5mdW5jdGlvbiBhbHRpdHVkZVJvbGxMaW1pdGVyKGFsdGl0dWRlTTogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBpZiAoYWx0aXR1ZGVNIDw9IDEyMDAwKSB7XG4gICAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgICByZXR1cm4gY2xhbXAoMSAtIChhbHRpdHVkZU0gLSAxMjAwMCkgLyAyMDAwMCwgMC40NSwgMSk7XG59XG5cbmZ1bmN0aW9uIGFvYVJvbGxMaW1pdGVyKGFvYVJhZDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBjb25zdCBhb2FEZWcgPSBNYXRoLmFicyhhb2FSYWQpICogKDE4MCAvIE1hdGguUEkpO1xuICAgIGlmIChhb2FEZWcgPD0gMTUpIHtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICAgIHJldHVybiBjbGFtcCgxIC0gKGFvYURlZyAtIDE1KSAvIDIyLCAwLjE1LCAxKTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBGMTZSb2xsQ29tbWFuZElucHV0cyB7XG4gICAgc3RpY2s6IG51bWJlcjtcbiAgICBkeW5hbWljUHJlc3N1cmU6IG51bWJlcjtcbiAgICBxUmVmOiBudW1iZXI7XG4gICAgbWFjaDogbnVtYmVyO1xuICAgIGFsdGl0dWRlTTogbnVtYmVyO1xuICAgIGFvYVJhZDogbnVtYmVyO1xuICAgIGZsYXBzRXh0ZW5kZWQ6IGJvb2xlYW47XG4gICAgbGFuZGVkOiBib29sZWFuO1xuICAgIGNvbmZpZzogRjE2Um9sbENvbnRyb2xDb25maWc7XG59XG5cbi8qKiBTdGljayBbLTEsIDFdIOKGkiBjb21tYW5kZWQgYm9keSByb2xsIHJhdGUgcF9jbWQgKHJhZC9zKS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlRjE2Q29tbWFuZGVkUm9sbFJhdGUoaW5wdXRzOiBGMTZSb2xsQ29tbWFuZElucHV0cyk6IG51bWJlciB7XG4gICAgaWYgKGlucHV0cy5sYW5kZWQgfHwgTWF0aC5hYnMoaW5wdXRzLnN0aWNrKSA8IDFlLTYpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgY29uc3QgZmxhcEZhY3RvciA9IGlucHV0cy5mbGFwc0V4dGVuZGVkID8gMC42NSA6IDE7XG4gICAgY29uc3QgbGltaXRlciA9IG1hY2hSb2xsTGltaXRlcihpbnB1dHMubWFjaClcbiAgICAgICAgKiBhbHRpdHVkZVJvbGxMaW1pdGVyKGlucHV0cy5hbHRpdHVkZU0pXG4gICAgICAgICogYW9hUm9sbExpbWl0ZXIoaW5wdXRzLmFvYVJhZClcbiAgICAgICAgKiBmbGFwRmFjdG9yO1xuXG4gICAgY29uc3QgcUdhaW4gPSBjb21wdXRlRjE2Um9sbER5bmFtaWNQcmVzc3VyZUdhaW4oaW5wdXRzLmR5bmFtaWNQcmVzc3VyZSwgaW5wdXRzLnFSZWYpO1xuICAgIHJldHVybiBpbnB1dHMuc3RpY2sgKiBtYXhSb2xsUmF0ZVJhZChpbnB1dHMuY29uZmlnKSAqIHFHYWluICogbGltaXRlcjtcbn1cblxuLyoqIEZpcnN0LW9yZGVyIGZsYXBlcm9uL2FjdHVhdG9yIGxhZyB0b3dhcmQgY29tbWFuZGVkIHJhdGUuICovXG5leHBvcnQgZnVuY3Rpb24gc3RlcEYxNkJvZHlSb2xsUmF0ZShcbiAgICBib2R5Um9sbFJhdGVSYWQ6IG51bWJlcixcbiAgICBjb21tYW5kZWRSYXRlUmFkOiBudW1iZXIsXG4gICAgZGVsdGE6IG51bWJlcixcbiAgICBjb25maWc6IEYxNlJvbGxDb250cm9sQ29uZmlnLFxuKTogbnVtYmVyIHtcbiAgICBpZiAoZGVsdGEgPD0gMCkge1xuICAgICAgICByZXR1cm4gYm9keVJvbGxSYXRlUmFkO1xuICAgIH1cbiAgICBjb25zdCBhbHBoYSA9IDEgLSBNYXRoLmV4cCgtZGVsdGEgLyBNYXRoLm1heChjb25maWcuYWN0dWF0b3JUYXVTLCAxZS0zKSk7XG4gICAgcmV0dXJuIGJvZHlSb2xsUmF0ZVJhZCArIChjb21tYW5kZWRSYXRlUmFkIC0gYm9keVJvbGxSYXRlUmFkKSAqIGFscGhhO1xufVxuXG4vKiogSGlnaC1Bb0Egcm9sbOKAk3lhdyBjb3VwbGluZzogYXV0byBydWRkZXIgdG8gY29vcmRpbmF0ZSBhbmQgbGltaXQgc2lkZXNsaXAgYnVpbGR1cC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlRjE2Um9sbFlhd0NvdXBsaW5nKGJvZHlSb2xsUmF0ZVJhZDogbnVtYmVyLCBhb2FSYWQ6IG51bWJlciwgbWF4Um9sbFJhdGVSYWQ6IG51bWJlcik6IG51bWJlciB7XG4gICAgY29uc3QgYW9hRmFjdG9yID0gY2xhbXAoKE1hdGguYWJzKGFvYVJhZCkgLSAwLjEyKSAvIDAuNCwgMCwgMSk7XG4gICAgaWYgKGFvYUZhY3RvciA8PSAwIHx8IG1heFJvbGxSYXRlUmFkIDw9IDApIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGNvbnN0IG5vcm1hbGl6ZWRSb2xsID0gY2xhbXAoYm9keVJvbGxSYXRlUmFkIC8gbWF4Um9sbFJhdGVSYWQsIC0xLCAxKTtcbiAgICByZXR1cm4gbm9ybWFsaXplZFJvbGwgKiAwLjQgKiBhb2FGYWN0b3I7XG59XG4iLCJpbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgeyBQSVRDSF9SQVRFLCBQTEFORV9ESVNUQU5DRV9UT19HUk9VTkQsIFJPTExfUkFURSwgWUFXX1JBVEUgfSBmcm9tIFwiLi4vLi4vZGVmc1wiO1xuaW1wb3J0IHsgRk9SV0FSRCwgUElfT1ZFUl8xODAsIFJJR0hULCBVUCwgWkVSTywgY2FsY3VsYXRlUGl0Y2hSb2xsLCBjbGFtcCwgZWFzZU91dENpcmMsIGlzWmVybywgcm91bmRUb1plcm8gfSBmcm9tICcuLi8uLi91dGlscy9tYXRoJztcbmltcG9ydCB7IEZsaWdodE1vZGVsIH0gZnJvbSAnLi9mbGlnaHRNb2RlbCc7XG5cblxuY29uc3QgVFVSTklOR19SQVRFID0gTWF0aC5QSSAqIDEuNTsgLy8gUmFkaWFucy9zZWNvbmRcbmNvbnN0IFNUQUxMX1JBVEUgPSBNYXRoLlBJIC8gNjsgLy8gUmFkaWFucy9zZWNvbmRcbmNvbnN0IElORFVDRURfRFJBR19GQUNUT1IgPSAxMC4wOyAvLyBVbml0bGVzc1xuY29uc3QgUk9MTF9EUkFHX0ZBQ1RPUiA9IDAuMDU7IC8vIFVuaXRsZXNzXG5jb25zdCBHUk9VTkRfRlJJQ1RJT05fS0lORVRJQyA9IDAuMTU7IC8vIFVuaXRsZXNzXG5jb25zdCBHUk9VTkRfRlJJQ1RJT05fU1RBVElDID0gMC4yOyAvLyBVbml0bGVzc1xuY29uc3QgR1JPVU5EX0JSQUtFX0tJTkVUSUMgPSAxLjg7XG5jb25zdCBHUk9VTkRfQlJBS0VfU1RBVElDID0gMS4xNztcbmNvbnN0IFRIUk9UVExFX1VQX1JBVEUgPSAwLjAyOyAvLyBVbml0cy9zZWNvbmRcbmNvbnN0IFRIUk9UVExFX0RPV05fUkFURSA9IDAuMDc7IC8vIFVuaXRzL3NlY29uZFxuY29uc3QgWUFXX1JBVEVfTEFOREVEID0gWUFXX1JBVEUgKiAyLjA7IC8vIFJhZGlhbnMvc2Vjb25kXG5cbmNvbnN0IE1BWF9USFJVU1QgPSAyMDsgLy8gbS9zXjJcbmNvbnN0IERSWV9NQVNTOiBudW1iZXIgPSAyMDAwMDsgLy8ga2dcbmNvbnN0IFdJTkdfQVJFQTogbnVtYmVyID0gNzg7IC8vIG1eMlxuY29uc3QgR1JPVU5EX0FJUl9ERU5TSVRZOiBudW1iZXIgPSAxLjIyNTsgLy8ga2cvbV4zXG5jb25zdCBHUkFWSVRZOiBudW1iZXIgPSA5Ljg7IC8vIG0vc14yXG5jb25zdCBDRDogbnVtYmVyID0gMC4xNTsgLy8gVW5pdGxlc3NcbmNvbnN0IENEX0xBTkRJTkdfR0VBUl9GQUNUT1IgPSAwLjc1OyAvLyBVbml0bGVzcywgYWRkaXRpdmVcbmNvbnN0IENEX0ZMQVBTX0ZBQ1RPUiA9IDAuNDsgLy8gVW5pdGxlc3MsIGFkZGl0aXZlXG5jb25zdCBMSUZUX0ZMQVBTX0ZBQ1RPUiA9IDEuMjsgLy8gVW5pdGxlc3NcbmNvbnN0IFJPTExfRkxBUFNfRkFDVE9SID0gMC42OyAvLyBVbml0bGVzc1xuXG5jb25zdCBMQU5ERURfTUFYX1NQRUVEID0gMTAwOyAvLyBtL3NcbmNvbnN0IExBTkRJTkdfTUFYX1ZTUEVFRCA9IDU7IC8vIG0vc1xuY29uc3QgTEFORElOR19NSU5fUElUQ0ggPSAtNSAqIFBJX09WRVJfMTgwOyAvLyBSYWRpYW5zXG5jb25zdCBMQU5ESU5HX01BWF9ST0xMID0gNSAqIFBJX09WRVJfMTgwOyAvLyBSYWRpYW5zXG5cbmV4cG9ydCBjbGFzcyBBcmNhZGVGbGlnaHRNb2RlbCBleHRlbmRzIEZsaWdodE1vZGVsIHtcblxuICAgIHByaXZhdGUgc3RhbGw6IG51bWJlciA9IDA7XG5cbiAgICBwcml2YXRlIF92OiBUSFJFRS5WZWN0b3IzID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIF9xMDogVEhSRUUuUXVhdGVybmlvbiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG4gICAgcHJpdmF0ZSBfcTE6IFRIUkVFLlF1YXRlcm5pb24gPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuICAgIHByaXZhdGUgX206IFRIUkVFLk1hdHJpeDQgPSBuZXcgVEhSRUUuTWF0cml4NCgpO1xuXG4gICAgcHJpdmF0ZSBkcmFnOiBUSFJFRS5WZWN0b3IzID0gbmV3IFRIUkVFLlZlY3RvcjMoKTsgLy8gTlxuICAgIHByaXZhdGUgdGhydXN0OiBUSFJFRS5WZWN0b3IzID0gbmV3IFRIUkVFLlZlY3RvcjMoKTsgLy8gTlxuICAgIHByaXZhdGUgd2VpZ2h0OiBUSFJFRS5WZWN0b3IzID0gbmV3IFRIUkVFLlZlY3RvcjMoKTsgLy8gTlxuICAgIHByaXZhdGUgZnJpY3Rpb246IFRIUkVFLlZlY3RvcjMgPSBuZXcgVEhSRUUuVmVjdG9yMygpOyAvLyBOXG4gICAgcHJpdmF0ZSBmb3JjZXM6IFRIUkVFLlZlY3RvcjMgPSBuZXcgVEhSRUUuVmVjdG9yMygpOyAvLyBOXG5cbiAgICBwcml2YXRlIGZvcndhcmQ6IFRIUkVFLlZlY3RvcjMgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgdXA6IFRIUkVFLlZlY3RvcjMgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmlnaHQ6IFRIUkVFLlZlY3RvcjMgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG4gICAgcHJpdmF0ZSBwcmpGb3J3YXJkOiBUSFJFRS5WZWN0b3IzID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHZlbG9jaXR5VW5pdDogVEhSRUUuVmVjdG9yMyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5vYmoudXAuY29weShVUCk7XG4gICAgfVxuXG4gICAgc3RlcChkZWx0YTogbnVtYmVyKTogdm9pZCB7XG5cbiAgICAgICAgaWYgKHRoaXMuY3Jhc2hlZCkgcmV0dXJuO1xuXG4gICAgICAgIGlmICh0aGlzLmVmZmVjdGl2ZVRocm90dGxlID4gdGhpcy50aHJvdHRsZSkge1xuICAgICAgICAgICAgdGhpcy5lZmZlY3RpdmVUaHJvdHRsZSA9IE1hdGgubWF4KHRoaXMudGhyb3R0bGUsIHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgLSBUSFJPVFRMRV9ET1dOX1JBVEUgKiBkZWx0YSk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5lZmZlY3RpdmVUaHJvdHRsZSA8IHRoaXMudGhyb3R0bGUpIHtcbiAgICAgICAgICAgIHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgPSBNYXRoLm1pbih0aGlzLnRocm90dGxlLCB0aGlzLmVmZmVjdGl2ZVRocm90dGxlICsgVEhST1RUTEVfVVBfUkFURSAqIGRlbHRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZm9yd2FyZCA9IHRoaXMuZm9yd2FyZC5jb3B5KEZPUldBUkQpLmFwcGx5UXVhdGVybmlvbih0aGlzLm9iai5xdWF0ZXJuaW9uKTtcbiAgICAgICAgdGhpcy51cCA9IHRoaXMudXAuY29weShVUCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMub2JqLnF1YXRlcm5pb24pO1xuICAgICAgICB0aGlzLnJpZ2h0ID0gdGhpcy5yaWdodC5jb3B5KFJJR0hUKS5hcHBseVF1YXRlcm5pb24odGhpcy5vYmoucXVhdGVybmlvbik7XG5cbiAgICAgICAgdGhpcy5wcmpGb3J3YXJkID0gdGhpcy5wcmpGb3J3YXJkLmNvcHkodGhpcy5mb3J3YXJkKS5zZXRZKDApO1xuICAgICAgICB0aGlzLnZlbG9jaXR5VW5pdCA9IHRoaXMudmVsb2NpdHlVbml0LmNvcHkodGhpcy52ZWxvY2l0eSkubm9ybWFsaXplKCk7XG5cbiAgICAgICAgY29uc3QgYWlyRGVuc2l0eTogbnVtYmVyID0gR1JPVU5EX0FJUl9ERU5TSVRZICogTWF0aC5leHAoLXRoaXMub2JqLnBvc2l0aW9uLnkgLyA4MDAwKTsgLy8ga2cvbV4zXG4gICAgICAgIC8vIFRha2UgaW50byBhY2NvdW50IGxvd2VyIGFpciB0ZW1wZXJhdHVyZSBhdCBoaWdoZXIgYWx0aXR1ZGVzXG4gICAgICAgIGNvbnN0IHRocnVzdERlbnNpdHk6IG51bWJlciA9IEdST1VORF9BSVJfREVOU0lUWSAqIE1hdGguZXhwKC10aGlzLm9iai5wb3NpdGlvbi55ICogMC4yNSAvIDgwMDApOyAvLyBrZy9tXjNcbiAgICAgICAgY29uc3Qgc3BlZWQgPSB0aGlzLnZlbG9jaXR5Lmxlbmd0aCgpOyAvLyBtL3NcblxuICAgICAgICBjb25zdCByaWdodFByalZlbG9jaXR5ID0gdGhpcy5fdi5jb3B5KHRoaXMudmVsb2NpdHlVbml0KS5wcm9qZWN0T25QbGFuZSh0aGlzLnJpZ2h0KTtcbiAgICAgICAgY29uc3QgYW9hQW5nbGUgPSByaWdodFByalZlbG9jaXR5LmFuZ2xlVG8odGhpcy5mb3J3YXJkKTtcbiAgICAgICAgY29uc3QgYW9hU2lnbiA9IHJpZ2h0UHJqVmVsb2NpdHkuY3Jvc3ModGhpcy5mb3J3YXJkKS5kb3QodGhpcy5yaWdodCkgPiAwID8gLTEgOiAxO1xuICAgICAgICBjb25zdCBhb2EgPSBhb2FTaWduICogYW9hQW5nbGU7XG5cbiAgICAgICAgLy8gUm9sbCBjb250cm9sXG4gICAgICAgIGlmICghaXNaZXJvKHRoaXMucm9sbCkgJiYgIXRoaXMubGFuZGVkKSB7XG4gICAgICAgICAgICBjb25zdCByb2xsRmxhcEZhY3RvciA9IHRoaXMuZmxhcHNFeHRlbmRlZCA/IFJPTExfRkxBUFNfRkFDVE9SIDogMS4wO1xuICAgICAgICAgICAgdGhpcy5vYmoucm90YXRlWih0aGlzLnJvbGwgKiBST0xMX1JBVEUgKiByb2xsRmxhcEZhY3RvciAqIGRlbHRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFBpdGNoIGNvbnRyb2xcbiAgICAgICAgaWYgKCFpc1plcm8odGhpcy5waXRjaClcbiAgICAgICAgICAgICYmICEodGhpcy5sYW5kZWQgJiYgdGhpcy5waXRjaCA8IDApIC8vIENhbid0IHBpdGNoIGRvd24gd2hlbiBsYW5kZWRcbiAgICAgICAgICAgICYmIChcbiAgICAgICAgICAgICAgICB0aGlzLnN0YWxsIDwgMCB8fCAvLyBDYW4gZG8gYW55dGhpbmcgd2hlbiBmbHlpbmcgYW5kIG5vIHN0YWxsaW5nXG4gICAgICAgICAgICAgICAgKHRoaXMucGl0Y2ggPCAwICYmIHRoaXMudXAueSA+IDApIHx8IC8vIENhbid0IHBpdGNoIHVwIHdoZW4gc3RhbGxpbmdcbiAgICAgICAgICAgICAgICAodGhpcy5waXRjaCA+IDAgJiYgdGhpcy51cC55IDwgMCkgLy8gQ2FuJ3QgcGl0Y2ggdXAgd2hlbiBzdGFsbGluZ1xuICAgICAgICAgICAgKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIHRoaXMub2JqLnJvdGF0ZVgoLXRoaXMucGl0Y2ggKiBQSVRDSF9SQVRFICogZGVsdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gWWF3IGNvbnRyb2xcbiAgICAgICAgaWYgKCFpc1plcm8odGhpcy55YXcpICYmICFpc1plcm8oc3BlZWQpKSB7XG4gICAgICAgICAgICB0aGlzLm9iai5yb3RhdGVZKC10aGlzLnlhdyAqICh0aGlzLmxhbmRlZCA/IFlBV19SQVRFX0xBTkRFRCA6IFlBV19SQVRFKSAqIGRlbHRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEF1dG9tYXRpYyB5YXcgd2hlbiByb2xsaW5nXG4gICAgICAgIGlmICgtMC45OSA8IHRoaXMuZm9yd2FyZC55ICYmIHRoaXMuZm9yd2FyZC55IDwgMC45OSkge1xuICAgICAgICAgICAgY29uc3QgcHJqVXAgPSB0aGlzLl92LmNvcHkodGhpcy51cCkucHJvamVjdE9uUGxhbmUodGhpcy5wcmpGb3J3YXJkKS5zZXRZKDApO1xuICAgICAgICAgICAgY29uc3Qgc2lnbiA9ICh0aGlzLnByakZvcndhcmQueCAqIHByalVwLnogLSB0aGlzLnByakZvcndhcmQueiAqIHByalVwLngpID4gMCA/IC0xIDogMTtcbiAgICAgICAgICAgIHRoaXMub2JqLnJvdGF0ZU9uV29ybGRBeGlzKFVQLCBzaWduICogcHJqVXAubGVuZ3RoKCkgKiBwcmpVcC5sZW5ndGgoKSAqIHRoaXMucHJqRm9yd2FyZC5sZW5ndGgoKSAqIDIuMCAqIFlBV19SQVRFICogZGVsdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUG9pbnQgZG93biB3aGVuIHN0YWxsaW5nXG4gICAgICAgIGlmICh0aGlzLnN0YWxsID49IDAgJiYgIXRoaXMubGFuZGVkKSB7XG4gICAgICAgICAgICBjb25zdCB5ID0gdGhpcy5mb3J3YXJkLnk7XG4gICAgICAgICAgICBpZiAoeSA+IC0wLjgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBncm91bmRSaWdodCA9IHRoaXMuX3YuY29weSh0aGlzLmZvcndhcmQpLmNyb3NzKHRoaXMucHJqRm9yd2FyZCkubm9ybWFsaXplKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5vYmoucm90YXRlT25Xb3JsZEF4aXMoZ3JvdW5kUmlnaHQsIFNUQUxMX1JBVEUgKiBkZWx0YSAqICh5ID4gMCA/IDEgOiAtMSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8hIFRIUlVTVFxuICAgICAgICByb3VuZFRvWmVybyh0aGlzLnRocnVzdC5jb3B5KHRoaXMuZm9yd2FyZCkubXVsdGlwbHlTY2FsYXIoXG4gICAgICAgICAgICB0aHJ1c3REZW5zaXR5ICpcbiAgICAgICAgICAgIE1BWF9USFJVU1QgKlxuICAgICAgICAgICAgdGhpcy5lZmZlY3RpdmVUaHJvdHRsZSAqXG4gICAgICAgICAgICBEUllfTUFTUykpO1xuICAgICAgICB0aGlzLmVuZ2luZVRocnVzdE4gPSB0aGlzLnRocnVzdC5sZW5ndGgoKTtcblxuICAgICAgICAvLyEgRFJBR1xuICAgICAgICBjb25zdCBhcmNhZGVJbmR1Y2VkRHJhZyA9IHRoaXMuZm9yd2FyZC5kb3QodGhpcy52ZWxvY2l0eVVuaXQpO1xuICAgICAgICBjb25zdCBsaWZ0SW5kdWNlZERyYWcgPSAxIC0gTWF0aC5jb3MoMi4wICogYW9hKTtcbiAgICAgICAgY29uc3Qgcm9sbERyYWcgPSBNYXRoLmFicyh0aGlzLnJpZ2h0LnkpO1xuICAgICAgICBjb25zdCBjZE11bHRpcGxpZXIgPSAxLjAgKyAodGhpcy5sYW5kaW5nR2VhckRlcGxveWVkID8gQ0RfTEFORElOR19HRUFSX0ZBQ1RPUiA6IDAuMCkgKyAodGhpcy5mbGFwc0V4dGVuZGVkID8gQ0RfRkxBUFNfRkFDVE9SIDogMC4wKTtcbiAgICAgICAgcm91bmRUb1plcm8odGhpcy5kcmFnXG4gICAgICAgICAgICAuY29weSh0aGlzLnZlbG9jaXR5VW5pdClcbiAgICAgICAgICAgIC5uZWdhdGUoKVxuICAgICAgICAgICAgLm11bHRpcGx5U2NhbGFyKFxuICAgICAgICAgICAgICAgIE1hdGgucG93KFxuICAgICAgICAgICAgICAgICAgICAwLjUgKiAoQ0QgKiBjZE11bHRpcGxpZXIgKyBsaWZ0SW5kdWNlZERyYWcpICogYWlyRGVuc2l0eSAqIHNwZWVkICogc3BlZWQgKiBXSU5HX0FSRUEsXG4gICAgICAgICAgICAgICAgICAgIDEuMCArIElORFVDRURfRFJBR19GQUNUT1IgKiAoMS4wIC0gYXJjYWRlSW5kdWNlZERyYWcpICsgUk9MTF9EUkFHX0ZBQ1RPUiAqIHJvbGxEcmFnXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKVxuICAgICAgICApO1xuXG4gICAgICAgIC8vISBMSUZUXG4gICAgICAgIGNvbnN0IGFvYUxpZnQgPSAwLjIgKiAoYW9hIDwgKE1hdGguUEkgLyA4LjApIHx8IGFvYSA+ICg3ICogTWF0aC5QSSAvIDguMCkgPyBNYXRoLnNpbig2LjAgKiBhb2EpIDogTWF0aC5zaW4oMi4wICogYW9hKSk7XG4gICAgICAgIGNvbnN0IG1pbkxpZnRGYWN0b3IgPSAyLjAgKiAoMC43NSAqIDAuNzUgKyAwLjc1KSAqIEdST1VORF9BSVJfREVOU0lUWTtcbiAgICAgICAgY29uc3QgZndkWSA9IHRoaXMuZm9yd2FyZC55O1xuICAgICAgICBjb25zdCByaWdodFkgPSBNYXRoLmFicyh0aGlzLnJpZ2h0LnkpO1xuICAgICAgICBjb25zdCBsaWZ0RmFjdG9yID0gMiAqIChzcGVlZCAvIDI1Ni4wKSAqICgoLTAuNSAqIGZ3ZFkgKyAxLjUpICogKC0wLjUgKiByaWdodFkgKyAxLjUpICsgKC0wLjUgKiByaWdodFkgKyAxLjUpKSAqIGFpckRlbnNpdHk7XG4gICAgICAgIGNvbnN0IGxpZnRGYWN0b3JNdWx0aXBsaWVyID0gdGhpcy5mbGFwc0V4dGVuZGVkID8gTElGVF9GTEFQU19GQUNUT1IgOiAxLjA7XG4gICAgICAgIHRoaXMuc3RhbGwgPSAtY2xhbXAobGlmdEZhY3RvciAqIGxpZnRGYWN0b3JNdWx0aXBsaWVyIC8gbWluTGlmdEZhY3RvciArIGFvYUxpZnQgKiAoMS4wIC0gcmlnaHRZKSAtIDEuMCwgLTEuMCwgMS4wKTtcblxuICAgICAgICAvLyEgV0VJR0hUXG4gICAgICAgIGNvbnN0IHdlaWdodEZ3ZEZhY3RvciA9IC10aGlzLmZvcndhcmQueTtcbiAgICAgICAgLy8gQWNjb3VudHMgZm9yIGxpZnQuIDUwMCBrbm90cyAtPiAyNTYgbS9zXG4gICAgICAgIGNvbnN0IHdlaWdodERvd25GYWN0b3IgPSAtZWFzZU91dENpcmMoMS4wIC0gY2xhbXAoKHNwZWVkIC8gMjU2KSAqICgxLjAgLSBNYXRoLmFicyh0aGlzLmZvcndhcmQueSkgKiAoMS4wIC0gTWF0aC5hYnModGhpcy5yaWdodC55KSkpLCAwLCAxKSk7XG4gICAgICAgIHRoaXMud2VpZ2h0XG4gICAgICAgICAgICAuY29weShVUClcbiAgICAgICAgICAgIC5tdWx0aXBseVNjYWxhcih3ZWlnaHREb3duRmFjdG9yKVxuICAgICAgICAgICAgLmFkZFNjYWxlZFZlY3Rvcih0aGlzLmZvcndhcmQsIHdlaWdodEZ3ZEZhY3RvcilcbiAgICAgICAgICAgIC5tdWx0aXBseVNjYWxhcihEUllfTUFTUyAqIEdSQVZJVFkpO1xuXG4gICAgICAgIC8vISBNYWdpYyB2ZWxvY2l0eSByb3RhdGlvblxuICAgICAgICBpZiAoIWlzWmVybyhzcGVlZCkpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmxhbmRlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMudmVsb2NpdHkuY29weSh0aGlzLmZvcndhcmQpLm11bHRpcGx5U2NhbGFyKHNwZWVkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWxwaGEgPSB0aGlzLnZlbG9jaXR5VW5pdC5hbmdsZVRvKHRoaXMuZm9yd2FyZCk7XG4gICAgICAgICAgICAgICAgY29uc3QgdHVybmluZ0ZhY3RvciA9IGFscGhhICogVFVSTklOR19SQVRFICogZGVsdGE7XG4gICAgICAgICAgICAgICAgdGhpcy5fbS5sb29rQXQoWkVSTywgdGhpcy5mb3J3YXJkLCB0aGlzLnVwKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9xMSA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuc2V0RnJvbVJvdGF0aW9uTWF0cml4KHRoaXMuX20pO1xuICAgICAgICAgICAgICAgIHRoaXMuX20ubG9va0F0KFpFUk8sIHRoaXMudmVsb2NpdHlVbml0LCB0aGlzLnVwKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9xMCA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuc2V0RnJvbVJvdGF0aW9uTWF0cml4KHRoaXMuX20pO1xuICAgICAgICAgICAgICAgIHRoaXMuX3EwLnJvdGF0ZVRvd2FyZHModGhpcy5fcTEsIHR1cm5pbmdGYWN0b3IpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3ExLnNldEZyb21Sb3RhdGlvbk1hdHJpeCh0aGlzLl9tLmludmVydCgpKTtcbiAgICAgICAgICAgICAgICB0aGlzLl92LmNvcHkodGhpcy52ZWxvY2l0eVVuaXQpXG4gICAgICAgICAgICAgICAgICAgIC5hcHBseVF1YXRlcm5pb24odGhpcy5fcTEpXG4gICAgICAgICAgICAgICAgICAgIC5hcHBseVF1YXRlcm5pb24odGhpcy5fcTApO1xuICAgICAgICAgICAgICAgIHRoaXMudmVsb2NpdHkuY29weSh0aGlzLl92KS5tdWx0aXBseVNjYWxhcihzcGVlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyEgQWxsIGZvcmNlc1xuICAgICAgICB0aGlzLmZvcmNlcy5zZXQoMCwgMCwgMCkuYWRkKHRoaXMudGhydXN0KS5hZGQodGhpcy5kcmFnKS5hZGQodGhpcy53ZWlnaHQpO1xuXG4gICAgICAgIC8vISBGUklDVElPTlxuICAgICAgICBjb25zdCBvbkdyb3VuZCA9IHRoaXMub2JqLnBvc2l0aW9uLnkgPD0gUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5EICsgMC4wNTtcbiAgICAgICAgaWYgKHRoaXMubGFuZGVkIHx8ICh0aGlzLndoZWVsQnJha2VzQXBwbGllZCAmJiBvbkdyb3VuZCkpIHtcbiAgICAgICAgICAgIGNvbnN0IHdlaWdodE1hZ25pdHVkZSA9IERSWV9NQVNTICogR1JBVklUWTtcbiAgICAgICAgICAgIGNvbnN0IHByakZvcmNlcyA9IHRoaXMuX3YuY29weSh0aGlzLmZvcmNlcykuc2V0WSgwKTtcbiAgICAgICAgICAgIGNvbnN0IHByakZvcmNlc01hZ25pdHVkZSA9IHByakZvcmNlcy5sZW5ndGgoKTtcbiAgICAgICAgICAgIGNvbnN0IG1heFN0YXRpY0ZyaWN0aW9uID0gKHRoaXMud2hlZWxCcmFrZXNBcHBsaWVkID8gR1JPVU5EX0JSQUtFX1NUQVRJQyA6IEdST1VORF9GUklDVElPTl9TVEFUSUMpICogd2VpZ2h0TWFnbml0dWRlO1xuICAgICAgICAgICAgY29uc3Qga2luZXRpY0ZyaWN0aW9uID0gKHRoaXMud2hlZWxCcmFrZXNBcHBsaWVkID8gR1JPVU5EX0JSQUtFX0tJTkVUSUMgOiBHUk9VTkRfRlJJQ1RJT05fS0lORVRJQykgKiB3ZWlnaHRNYWduaXR1ZGU7XG5cbiAgICAgICAgICAgIGlmICgoaXNaZXJvKHNwZWVkKSAmJiBwcmpGb3JjZXNNYWduaXR1ZGUgPCBtYXhTdGF0aWNGcmljdGlvbikpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZyaWN0aW9uLmNvcHkocHJqRm9yY2VzKS5uZWdhdGUoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5mcmljdGlvbi5jb3B5KHRoaXMudmVsb2NpdHlVbml0KS5zZXRZKDApLm5lZ2F0ZSgpLm5vcm1hbGl6ZSgpLm11bHRpcGx5U2NhbGFyKGtpbmV0aWNGcmljdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByb3VuZFRvWmVybyh0aGlzLmZyaWN0aW9uKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZnJpY3Rpb24uc2V0KDAsIDAsIDApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8hIFRpbWVzdGVwXG4gICAgICAgIGNvbnN0IGFjY2VsID0gcm91bmRUb1plcm8odGhpcy5mb3JjZXMuYWRkKHRoaXMuZnJpY3Rpb24pLmRpdmlkZVNjYWxhcihEUllfTUFTUykpO1xuICAgICAgICB0aGlzLnZlbG9jaXR5LmFkZFNjYWxlZFZlY3RvcihhY2NlbCwgZGVsdGEpO1xuICAgICAgICBpZiAodGhpcy5sYW5kZWQgJiYgdGhpcy52ZWxvY2l0eS55IDwgMCkge1xuICAgICAgICAgICAgdGhpcy52ZWxvY2l0eS5zZXRZKDApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8hIEFwcGx5XG4gICAgICAgIHRoaXMub2JqLnBvc2l0aW9uLmFkZFNjYWxlZFZlY3Rvcihyb3VuZFRvWmVybyh0aGlzLnZlbG9jaXR5LCB0aGlzLmVmZmVjdGl2ZVRocm90dGxlID4gMCA/IDAuMDEgOiAwLjEpLCBkZWx0YSk7XG4gICAgICAgIGlmICh0aGlzLm9iai5wb3NpdGlvbi55ID4gUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5EKSB7XG4gICAgICAgICAgICB0aGlzLmxhbmRlZCA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gR3JvdW5kIGludGVyYWN0aW9uXG4gICAgICAgIGlmICh0aGlzLm9iai5wb3NpdGlvbi55IDwgUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5EKSB7XG4gICAgICAgICAgICB0aGlzLm9iai5wb3NpdGlvbi55ID0gUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5EO1xuXG4gICAgICAgICAgICBjb25zdCBmb3J3YXJkID0gdGhpcy5fdi5jb3B5KEZPUldBUkQpLmFwcGx5UXVhdGVybmlvbih0aGlzLm9iai5xdWF0ZXJuaW9uKTtcbiAgICAgICAgICAgIGNvbnN0IHJpZ2h0ID0gdGhpcy5yaWdodC5jb3B5KFJJR0hUKS5hcHBseVF1YXRlcm5pb24odGhpcy5vYmoucXVhdGVybmlvbik7XG5cbiAgICAgICAgICAgIGNvbnN0IHByakZvcndhcmQgPSBuZXcgVEhSRUUuVmVjdG9yMygpLmNvcHkoZm9yd2FyZCkuc2V0WSgwKS5ub3JtYWxpemUoKTtcbiAgICAgICAgICAgIGNvbnN0IHBpdGNoQW5nbGUgPSBmb3J3YXJkLmFuZ2xlVG8ocHJqRm9yd2FyZCkgKiBNYXRoLnNpZ24oZm9yd2FyZC55KTtcblxuICAgICAgICAgICAgY29uc3QgcHJqUmlnaHQgPSBuZXcgVEhSRUUuVmVjdG9yMygpLmNvcHkocmlnaHQpLnNldFkoMCkubm9ybWFsaXplKCk7XG4gICAgICAgICAgICBjb25zdCByb2xsQW5nbGUgPSByaWdodC5hbmdsZVRvKHByalJpZ2h0KSAqIE1hdGguc2lnbihyaWdodC55KTtcblxuICAgICAgICAgICAgaWYgKHRoaXMubGFuZGluZ0dlYXJEZXBsb3llZCA9PT0gZmFsc2UgfHxcbiAgICAgICAgICAgICAgICBzcGVlZCA+IExBTkRFRF9NQVhfU1BFRUQgfHxcbiAgICAgICAgICAgICAgICB0aGlzLnZlbG9jaXR5LnkgPCAtTEFORElOR19NQVhfVlNQRUVEIHx8XG4gICAgICAgICAgICAgICAgTWF0aC5hYnMocm9sbEFuZ2xlKSA+IExBTkRJTkdfTUFYX1JPTEwgfHxcbiAgICAgICAgICAgICAgICBMQU5ESU5HX01JTl9QSVRDSCA+IHBpdGNoQW5nbGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNyYXNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoZm9yd2FyZC55IDwgMC4wKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGhlYWRpbmcgPSBuZXcgVEhSRUUuVmVjdG9yMygpLmNvcHkoZm9yd2FyZCkuc2V0WSgwKS5ub3JtYWxpemUoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vYmoucXVhdGVybmlvbi5zZXRGcm9tVW5pdFZlY3RvcnMoRk9SV0FSRCwgaGVhZGluZyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMudmVsb2NpdHkuc2V0WSgwKTtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YWxsID0gLTE7XG4gICAgICAgICAgICAgICAgdGhpcy5sYW5kZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0U3RhbGxTdGF0dXMoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhbGw7XG4gICAgfVxufSIsImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcbmltcG9ydCB7IE1BWF9BTFRJVFVERSwgTUFYX1NQRUVELCBQSVRDSF9SQVRFLCBQTEFORV9ESVNUQU5DRV9UT19HUk9VTkQsIFJPTExfUkFURSwgWUFXX1JBVEUgfSBmcm9tIFwiLi4vLi4vZGVmc1wiO1xuaW1wb3J0IHsgRk9SV0FSRCwgaXNaZXJvLCBVUCB9IGZyb20gJy4uLy4uL3V0aWxzL21hdGgnO1xuaW1wb3J0IHsgRmxpZ2h0TW9kZWwgfSBmcm9tICcuL2ZsaWdodE1vZGVsJztcblxuZXhwb3J0IGNsYXNzIERlYnVnRmxpZ2h0TW9kZWwgZXh0ZW5kcyBGbGlnaHRNb2RlbCB7XG5cbiAgICBwcml2YXRlIHNwZWVkOiBudW1iZXIgPSAwO1xuXG4gICAgcHJpdmF0ZSBfdjogVEhSRUUuVmVjdG9yMyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSBfdzogVEhSRUUuVmVjdG9yMyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5vYmoudXAuY29weShVUCk7XG4gICAgfVxuXG4gICAgc3RlcChkZWx0YTogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLmNyYXNoZWQpIHJldHVybjtcblxuICAgICAgICB0aGlzLmVmZmVjdGl2ZVRocm90dGxlID0gdGhpcy50aHJvdHRsZTtcbiAgICAgICAgdGhpcy5lbmdpbmVUaHJ1c3ROID0gMDtcblxuICAgICAgICAvLyBSb2xsIGNvbnRyb2xcbiAgICAgICAgaWYgKCFpc1plcm8odGhpcy5yb2xsKSkge1xuICAgICAgICAgICAgdGhpcy5vYmoucm90YXRlWih0aGlzLnJvbGwgKiBST0xMX1JBVEUgKiBkZWx0YSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQaXRjaCBjb250cm9sXG4gICAgICAgIGlmICghaXNaZXJvKHRoaXMucGl0Y2gpKSB7XG4gICAgICAgICAgICB0aGlzLm9iai5yb3RhdGVYKC10aGlzLnBpdGNoICogUElUQ0hfUkFURSAqIGRlbHRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFlhdyBjb250cm9sXG4gICAgICAgIGlmICghaXNaZXJvKHRoaXMueWF3KSkge1xuICAgICAgICAgICAgdGhpcy5vYmoucm90YXRlWSgtdGhpcy55YXcgKiBZQVdfUkFURSAqIGRlbHRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEF1dG9tYXRpYyB5YXcgd2hlbiByb2xsaW5nXG4gICAgICAgIGNvbnN0IGZvcndhcmQgPSB0aGlzLm9iai5nZXRXb3JsZERpcmVjdGlvbih0aGlzLl92KTtcbiAgICAgICAgaWYgKC0wLjk5IDwgZm9yd2FyZC55ICYmIGZvcndhcmQueSA8IDAuOTkpIHtcbiAgICAgICAgICAgIGNvbnN0IHByakZvcndhcmQgPSBmb3J3YXJkLnNldFkoMCk7XG4gICAgICAgICAgICBjb25zdCB1cCA9IHRoaXMuX3cuY29weShVUCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMub2JqLnF1YXRlcm5pb24pO1xuICAgICAgICAgICAgY29uc3QgcHJqVXAgPSB1cC5wcm9qZWN0T25QbGFuZShwcmpGb3J3YXJkKS5zZXRZKDApO1xuICAgICAgICAgICAgY29uc3Qgc2lnbiA9IChwcmpGb3J3YXJkLnggKiBwcmpVcC56IC0gcHJqRm9yd2FyZC56ICogcHJqVXAueCkgPiAwID8gLTEgOiAxO1xuICAgICAgICAgICAgdGhpcy5vYmoucm90YXRlT25Xb3JsZEF4aXMoVVAsIHNpZ24gKiBwcmpVcC5sZW5ndGgoKSAqIHByalVwLmxlbmd0aCgpICogcHJqRm9yd2FyZC5sZW5ndGgoKSAqIDIuMCAqIFlBV19SQVRFICogZGVsdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTW92ZW1lbnRcbiAgICAgICAgdGhpcy5zcGVlZCA9IHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgKiBNQVhfU1BFRUQ7XG4gICAgICAgIHRoaXMub2JqLnRyYW5zbGF0ZVoodGhpcy5zcGVlZCAqIGRlbHRhKTtcblxuICAgICAgICAvLyBBdm9pZCBncm91bmQgY3Jhc2hlc1xuICAgICAgICBpZiAodGhpcy5vYmoucG9zaXRpb24ueSA8IFBMQU5FX0RJU1RBTkNFX1RPX0dST1VORCkge1xuICAgICAgICAgICAgdGhpcy5vYmoucG9zaXRpb24ueSA9IFBMQU5FX0RJU1RBTkNFX1RPX0dST1VORDtcbiAgICAgICAgICAgIGNvbnN0IGQgPSB0aGlzLm9iai5nZXRXb3JsZERpcmVjdGlvbih0aGlzLl92KTtcbiAgICAgICAgICAgIGlmIChkLnkgPCAwLjApIHtcbiAgICAgICAgICAgICAgICBkLnNldFkoMCkuYWRkKHRoaXMub2JqLnBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICB0aGlzLm9iai5sb29rQXQoZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBdm9pZCBmbHlpbmcgdG9vIGhpZ2hcbiAgICAgICAgaWYgKHRoaXMub2JqLnBvc2l0aW9uLnkgPiBNQVhfQUxUSVRVREUpIHtcbiAgICAgICAgICAgIHRoaXMub2JqLnBvc2l0aW9uLnkgPSBNQVhfQUxUSVRVREU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBWZWxvY2l0eVxuICAgICAgICB0aGlzLnZlbG9jaXR5LmNvcHkoRk9SV0FSRCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMub2JqLnF1YXRlcm5pb24pLm11bHRpcGx5U2NhbGFyKHRoaXMuc3BlZWQpO1xuXG4gICAgICAgIHRoaXMubGFuZGVkID0gdGhpcy5vYmoucG9zaXRpb24ueSA8PSBQTEFORV9ESVNUQU5DRV9UT19HUk9VTkQ7XG4gICAgfVxuXG4gICAgZ2V0U3RhbGxTdGF0dXMoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbn1cbiIsImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcbmltcG9ydCB7IFVQIH0gZnJvbSAnLi4vLi4vdXRpbHMvbWF0aCc7XG5cbmV4cG9ydCBjb25zdCBTSU1fRlBTID0gMTIwO1xuY29uc3QgU0lNX0RFTFRBID0gMS4wIC8gU0lNX0ZQUztcblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEZsaWdodE1vZGVsIHtcblxuICAgIHByb3RlY3RlZCBvYmogPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcbiAgICBwcm90ZWN0ZWQgdmVsb2NpdHk6IFRIUkVFLlZlY3RvcjMgPSBuZXcgVEhSRUUuVmVjdG9yMygpOyAvLyBtL3NcblxuICAgIHByb3RlY3RlZCBjcmFzaGVkOiBib29sZWFuID0gZmFsc2U7XG4gICAgcHJvdGVjdGVkIGxhbmRlZDogYm9vbGVhbiA9IHRydWU7XG4gICAgcHJvdGVjdGVkIGxhbmRpbmdHZWFyRGVwbG95ZWQ6IGJvb2xlYW4gPSB0cnVlO1xuICAgIHByb3RlY3RlZCBmbGFwc0V4dGVuZGVkOiBib29sZWFuID0gdHJ1ZTtcbiAgICBwcm90ZWN0ZWQgd2hlZWxCcmFrZXNBcHBsaWVkOiBib29sZWFuID0gZmFsc2U7XG5cbiAgICBwcm90ZWN0ZWQgcGl0Y2g6IG51bWJlciA9IDA7IC8vIFstMSwgMV1cbiAgICBwcm90ZWN0ZWQgcm9sbDogbnVtYmVyID0gMDsgLy8gWy0xLCAxXVxuICAgIHByb3RlY3RlZCB5YXc6IG51bWJlciA9IDA7IC8vIFstMSwgMV1cbiAgICBwcm90ZWN0ZWQgdGhyb3R0bGU6IG51bWJlciA9IDA7IC8vIFswLCAxXVxuICAgIHByb3RlY3RlZCBlZmZlY3RpdmVUaHJvdHRsZTogbnVtYmVyID0gMDsgLy8gWzAsIDFdXG5cbiAgICBwcm90ZWN0ZWQgYW5nbGVPZkF0dGFja1JhZDogbnVtYmVyID0gMDtcbiAgICBwcm90ZWN0ZWQgbG9hZEZhY3Rvckc6IG51bWJlciA9IDE7XG4gICAgcHJvdGVjdGVkIGVuZ2luZVRocnVzdE46IG51bWJlciA9IDA7XG5cbiAgICBwcml2YXRlIHByZXZQb3NpdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSBwcmV2UXVhdGVybmlvbiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG4gICAgcHJpdmF0ZSBwcmV2VmVsb2NpdHkgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgZGVsdGFSZW1haW5kZXI6IG51bWJlciA9IDA7XG5cbiAgICBhYnN0cmFjdCBzdGVwKGRlbHRhOiBudW1iZXIpOiB2b2lkO1xuXG4gICAgcmVzZXQoKSB7XG4gICAgICAgIHRoaXMub2JqLnBvc2l0aW9uLnNldCgwLCAwLCAwKTtcbiAgICAgICAgdGhpcy5vYmoucXVhdGVybmlvbi5zZXRGcm9tQXhpc0FuZ2xlKFVQLCAwKTtcbiAgICAgICAgdGhpcy52ZWxvY2l0eS5zZXQoMCwgMCwgMCk7XG4gICAgICAgIHRoaXMuY3Jhc2hlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmxhbmRlZCA9IHRydWU7XG4gICAgICAgIHRoaXMubGFuZGluZ0dlYXJEZXBsb3llZCA9IHRydWU7XG4gICAgICAgIHRoaXMuZmxhcHNFeHRlbmRlZCA9IHRydWU7XG4gICAgICAgIHRoaXMud2hlZWxCcmFrZXNBcHBsaWVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMucGl0Y2ggPSAwO1xuICAgICAgICB0aGlzLnJvbGwgPSAwO1xuICAgICAgICB0aGlzLnlhdyA9IDA7XG4gICAgICAgIHRoaXMudGhyb3R0bGUgPSAwO1xuICAgICAgICB0aGlzLmVmZmVjdGl2ZVRocm90dGxlID0gMDtcbiAgICAgICAgdGhpcy5hbmdsZU9mQXR0YWNrUmFkID0gMDtcbiAgICAgICAgdGhpcy5sb2FkRmFjdG9yRyA9IDE7XG4gICAgICAgIHRoaXMuZW5naW5lVGhydXN0TiA9IDA7XG4gICAgICAgIHRoaXMuZGVsdGFSZW1haW5kZXIgPSAwO1xuICAgICAgICB0aGlzLnN5bmNQcmV2aW91c1N0YXRlKCk7XG4gICAgfVxuXG4gICAgLyoqIEFsaWduIHJlbmRlciBpbnRlcnBvbGF0aW9uIGFmdGVyIHRlbGVwb3J0IG9yIGFpcmJvcm5lIHNwYXduLiAqL1xuICAgIHNuYXBQaHlzaWNzU3RhdGUoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuc3luY1ByZXZpb3VzU3RhdGUoKTtcbiAgICB9XG5cbiAgICB1cGRhdGUoZGVsdGE6IG51bWJlcik6IHZvaWQge1xuICAgICAgICB0aGlzLmRlbHRhUmVtYWluZGVyICs9IGRlbHRhO1xuICAgICAgICB3aGlsZSAodGhpcy5kZWx0YVJlbWFpbmRlciA+PSBTSU1fREVMVEEpIHtcbiAgICAgICAgICAgIHRoaXMuc2F2ZVByZXZpb3VzU3RhdGUoKTtcbiAgICAgICAgICAgIHRoaXMuc3RlcChTSU1fREVMVEEpO1xuICAgICAgICAgICAgdGhpcy5kZWx0YVJlbWFpbmRlciAtPSBTSU1fREVMVEE7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKiogMSA9IGxhdGVzdCBwaHlzaWNzIHN0YXRlLCAwID0gcHJldmlvdXMgcGh5c2ljcyBzdGF0ZS4gKi9cbiAgICBnZXRSZW5kZXJJbnRlcnBvbGF0aW9uQWxwaGEoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIDEgLSB0aGlzLmRlbHRhUmVtYWluZGVyIC8gU0lNX0RFTFRBO1xuICAgIH1cblxuICAgIGdldFJlbmRlclBvc2l0aW9uKHRhcmdldDogVEhSRUUuVmVjdG9yMyk6IFRIUkVFLlZlY3RvcjMge1xuICAgICAgICByZXR1cm4gdGFyZ2V0LmxlcnBWZWN0b3JzKHRoaXMucHJldlBvc2l0aW9uLCB0aGlzLm9iai5wb3NpdGlvbiwgdGhpcy5nZXRSZW5kZXJJbnRlcnBvbGF0aW9uQWxwaGEoKSk7XG4gICAgfVxuXG4gICAgZ2V0UmVuZGVyUXVhdGVybmlvbih0YXJnZXQ6IFRIUkVFLlF1YXRlcm5pb24pOiBUSFJFRS5RdWF0ZXJuaW9uIHtcbiAgICAgICAgcmV0dXJuIHRhcmdldC5zbGVycFF1YXRlcm5pb25zKHRoaXMucHJldlF1YXRlcm5pb24sIHRoaXMub2JqLnF1YXRlcm5pb24sIHRoaXMuZ2V0UmVuZGVySW50ZXJwb2xhdGlvbkFscGhhKCkpO1xuICAgIH1cblxuICAgIGdldFJlbmRlclZlbG9jaXR5KHRhcmdldDogVEhSRUUuVmVjdG9yMyk6IFRIUkVFLlZlY3RvcjMge1xuICAgICAgICByZXR1cm4gdGFyZ2V0LmxlcnBWZWN0b3JzKHRoaXMucHJldlZlbG9jaXR5LCB0aGlzLnZlbG9jaXR5LCB0aGlzLmdldFJlbmRlckludGVycG9sYXRpb25BbHBoYSgpKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHNhdmVQcmV2aW91c1N0YXRlKCk6IHZvaWQge1xuICAgICAgICB0aGlzLnByZXZQb3NpdGlvbi5jb3B5KHRoaXMub2JqLnBvc2l0aW9uKTtcbiAgICAgICAgdGhpcy5wcmV2UXVhdGVybmlvbi5jb3B5KHRoaXMub2JqLnF1YXRlcm5pb24pO1xuICAgICAgICB0aGlzLnByZXZWZWxvY2l0eS5jb3B5KHRoaXMudmVsb2NpdHkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgc3luY1ByZXZpb3VzU3RhdGUoKTogdm9pZCB7XG4gICAgICAgIHRoaXMucHJldlBvc2l0aW9uLmNvcHkodGhpcy5vYmoucG9zaXRpb24pO1xuICAgICAgICB0aGlzLnByZXZRdWF0ZXJuaW9uLmNvcHkodGhpcy5vYmoucXVhdGVybmlvbik7XG4gICAgICAgIHRoaXMucHJldlZlbG9jaXR5LmNvcHkodGhpcy52ZWxvY2l0eSk7XG4gICAgfVxuXG4gICAgc2V0UGl0Y2gocGl0Y2g6IG51bWJlcikge1xuICAgICAgICB0aGlzLnBpdGNoID0gcGl0Y2g7XG4gICAgfVxuXG4gICAgc2V0Um9sbChyb2xsOiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy5yb2xsID0gcm9sbDtcbiAgICB9XG5cbiAgICBzZXRZYXcoeWF3OiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy55YXcgPSB5YXc7XG4gICAgfVxuXG4gICAgc2V0VGhyb3R0bGUodGhyb3R0bGU6IG51bWJlcikge1xuICAgICAgICB0aGlzLnRocm90dGxlID0gdGhyb3R0bGU7XG4gICAgfVxuXG4gICAgLyoqIE1hdGNoIHNwb29sZWQgZW5naW5lIHN0YXRlIHRvIGNvbW1hbmRlZCB0aHJvdHRsZSAoZS5nLiBhaXJib3JuZSBzcGF3bikuICovXG4gICAgc3luY0VmZmVjdGl2ZVRocm90dGxlKCkge1xuICAgICAgICB0aGlzLmVmZmVjdGl2ZVRocm90dGxlID0gdGhpcy50aHJvdHRsZTtcbiAgICB9XG5cbiAgICBzZXRMYW5kaW5nR2VhckRlcGxveWVkKGRlcGxveWVkOiBib29sZWFuKSB7XG4gICAgICAgIHRoaXMubGFuZGluZ0dlYXJEZXBsb3llZCA9IGRlcGxveWVkO1xuICAgIH1cblxuICAgIHNldEZsYXBzRXh0ZW5kZWQoZXh0ZW5kZWQ6IGJvb2xlYW4pIHtcbiAgICAgICAgdGhpcy5mbGFwc0V4dGVuZGVkID0gZXh0ZW5kZWQ7XG4gICAgfVxuXG4gICAgc2V0V2hlZWxCcmFrZXMoYXBwbGllZDogYm9vbGVhbikge1xuICAgICAgICB0aGlzLndoZWVsQnJha2VzQXBwbGllZCA9IGFwcGxpZWQ7XG4gICAgfVxuXG4gICAgaXNXaGVlbEJyYWtlc0FwcGxpZWQoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLndoZWVsQnJha2VzQXBwbGllZDtcbiAgICB9XG5cbiAgICBzZXRMYW5kZWQoaXNMYW5kZWQ6IGJvb2xlYW4pIHtcbiAgICAgICAgdGhpcy5sYW5kZWQgPSBpc0xhbmRlZDtcbiAgICB9XG5cbiAgICBpc0xhbmRlZCgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGFuZGVkO1xuICAgIH1cblxuICAgIHNldENyYXNoZWQoaXNDcmFzaGVkOiBib29sZWFuKSB7XG4gICAgICAgIHRoaXMuY3Jhc2hlZCA9IGlzQ3Jhc2hlZDtcbiAgICB9XG5cbiAgICBpc0NyYXNoZWQoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLmNyYXNoZWQ7XG4gICAgfVxuXG4gICAgc2V0IHBvc2l0aW9uKHA6IFRIUkVFLlZlY3RvcjMpIHtcbiAgICAgICAgdGhpcy5vYmoucG9zaXRpb24uY29weShwKTtcbiAgICB9XG5cbiAgICBnZXQgcG9zaXRpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9iai5wb3NpdGlvbjtcbiAgICB9XG5cbiAgICBzZXQgcXVhdGVybmlvbihxOiBUSFJFRS5RdWF0ZXJuaW9uKSB7XG4gICAgICAgIHRoaXMub2JqLnF1YXRlcm5pb24uY29weShxKTtcbiAgICB9XG5cbiAgICBnZXQgcXVhdGVybmlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub2JqLnF1YXRlcm5pb247XG4gICAgfVxuXG4gICAgc2V0IHZlbG9jaXR5VmVjdG9yKHY6IFRIUkVFLlZlY3RvcjMpIHtcbiAgICAgICAgdGhpcy52ZWxvY2l0eS5jb3B5KHYpO1xuICAgIH1cblxuICAgIGdldCB2ZWxvY2l0eVZlY3RvcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmVsb2NpdHk7XG4gICAgfVxuXG4gICAgZ2V0RWZmZWN0aXZlVGhyb3R0bGUoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWZmZWN0aXZlVGhyb3R0bGU7XG4gICAgfVxuXG4gICAgLy8gWy0xLDFdIC0gVmFsdWVzID49IDAgbWVhbiBzdGFsbFxuICAgIGFic3RyYWN0IGdldFN0YWxsU3RhdHVzKCk6IG51bWJlcjtcblxuICAgIGdldEFuZ2xlT2ZBdHRhY2soKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYW5nbGVPZkF0dGFja1JhZDtcbiAgICB9XG5cbiAgICBnZXRMb2FkRmFjdG9yRygpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5sb2FkRmFjdG9yRztcbiAgICB9XG5cbiAgICBnZXRFbmdpbmVUaHJ1c3RLbigpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5lbmdpbmVUaHJ1c3ROIC8gMTAwMDtcbiAgICB9XG5cbiAgICB1c2VGMTZUaHJvdHRsZURldGVudHMoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBzdGVwVGhyb3R0bGVEZXRlbnQoY3VycmVudDogbnVtYmVyLCBkaXJlY3Rpb246IDEgfCAtMSk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCBjdXJyZW50ICsgZGlyZWN0aW9uICogMC4wMSkpO1xuICAgIH1cblxuICAgIGlzSW5UaHJvdHRsZUFiRGV0ZW50QmFuZChfbGV2ZXI6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqIE92ZXJyaWRlIGluIG1vZGVscyB3aXRoIGEgbm9uLWxpbmVhciB0aHJvdHRsZSBxdWFkcmFudC4gKi9cbiAgICBhZGp1c3RUaHJvdHRsZUlucHV0KGN1cnJlbnQ6IG51bWJlciwgc3RlcDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIE1hdGgubWF4KDAsIE1hdGgubWluKDEsIGN1cnJlbnQgKyBzdGVwKSk7XG4gICAgfVxuXG4gICAgLyoqIE92ZXJyaWRlIGluIG1vZGVscyB3aXRoIGEgbm9uLWxpbmVhciB0aHJvdHRsZSBxdWFkcmFudC4gKi9cbiAgICBnZXRUaHJvdHRsZUh1ZFRleHQoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGBUSFIgJHsoMTAwICogdGhpcy5lZmZlY3RpdmVUaHJvdHRsZSkudG9GaXhlZCgwKX1gO1xuICAgIH1cblxuICAgIC8qKiBOb3JtYWxpemVkIGVuZ2luZSBwb3dlciBmb3IgYXVkaW8gWzAsIDFdLiAqL1xuICAgIGdldFRocm90dGxlQXVkaW9MZXZlbCgpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5lZmZlY3RpdmVUaHJvdHRsZTtcbiAgICB9XG5cbiAgICAvKiogQ1NTIGNvbG9yIGZvciBlbmdpbmUgbm96emxlIHJlbmRlcmluZyAoTUlMIGJsYWNrIGJ5IGRlZmF1bHQpLiAqL1xuICAgIGdldEVuZ2luZU5venpsZUNvbG9yKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiAnIzBhMGEwYSc7XG4gICAgfVxufVxuIiwiaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuaW1wb3J0IHsgUElUQ0hfUkFURSwgUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5ELCBURVJSQUlOX01PREVMX1NJWkUsIFRFUlJBSU5fU0NBTEUsIFlBV19SQVRFIH0gZnJvbSAnLi4vLi4vZGVmcyc7XG5pbXBvcnQgeyBGT1JXQVJELCBQSV9PVkVSXzE4MCwgUklHSFQsIFVQLCBjYWxjdWxhdGVQaXRjaFJvbGwsIGNsYW1wLCBpc1plcm8sIHJvdW5kVG9aZXJvIH0gZnJvbSAnLi4vLi4vdXRpbHMvbWF0aCc7XG5pbXBvcnQgeyBjb21wdXRlQW5nbGVPZkF0dGFjaywgY29tcHV0ZUFpckRlbnNpdHksIGNvbXB1dGVEeW5hbWljUHJlc3N1cmUsIGNvbXB1dGVEeW5hbWljUHJlc3N1cmVEcmFnUGVuYWx0eSwgY29tcHV0ZUlzYUFpckRlbnNpdHksIGNvbXB1dGVMb2FkRmFjdG9yRywgY29tcHV0ZU1hY2hOdW1iZXIgfSBmcm9tICcuLi9hZXJvVXRpbHMnO1xuaW1wb3J0IHsgY29tcHV0ZUYxNkVuZ2luZVRocnVzdE4sIGZvcm1hdEYxNlRocm90dGxlSHVkLCBmMTZUaHJvdHRsZUF1ZGlvTGV2ZWwsIGdldEYxNkVuZ2luZU5venpsZUNvbG9yLCBnZXRGMTZUaHJvdHRsZVpvbmUsIGFkanVzdEYxNlRocm90dGxlSW5wdXQsIHN0ZXBGMTZUaHJvdHRsZURldGVudCwgaXNGMTZBYkRldGVudEJhbmQgfSBmcm9tICcuLi9mMTZFbmdpbmUnO1xuaW1wb3J0IHtcbiAgICBjb21wdXRlRjE2Q29tbWFuZGVkUm9sbFJhdGUsXG4gICAgY29tcHV0ZUYxNlJvbGxZYXdDb3VwbGluZyxcbiAgICBGMTZfUk9MTF9DQVQxLFxuICAgIG1heFJvbGxSYXRlUmFkLFxuICAgIHN0ZXBGMTZCb2R5Um9sbFJhdGUsXG59IGZyb20gJy4uL2YxNlJvbGxDb250cm9sJztcbmltcG9ydCB7IGNsYW1wTG9hZEZhY3RvckFjY2VsZXJhdGlvbiwgY29tcHV0ZUYxNlBpdGNoR0xpbWl0LCBjb21wdXRlRjE2UGl0Y2hBb2FBdXRob3JpdHksIGNvbXB1dGVGMTZBb2FSZWNvdmVyeVJhdGUgfSBmcm9tICcuLi9mMTZGY3NMaW1pdHMnO1xuaW1wb3J0IHsgRjE2X1BST0ZJTEUgfSBmcm9tICcuLi9mMTZQcm9maWxlJztcbmltcG9ydCB7IEZsaWdodE1vZGVsIH0gZnJvbSAnLi9mbGlnaHRNb2RlbCc7XG5cbmNvbnN0IFRIUk9UVExFX1VQX1JBVEUgPSAwLjEwO1xuY29uc3QgVEhST1RUTEVfRE9XTl9SQVRFID0gMC4wNztcbmNvbnN0IFlBV19SQVRFX0xBTkRFRCA9IFlBV19SQVRFICogMi4wO1xuXG5jb25zdCBEUllfTUFTUyA9IEYxNl9QUk9GSUxFLnNpbU1hc3NLZztcbmNvbnN0IFdJTkdfQVJFQSA9IEYxNl9QUk9GSUxFLndpbmdBcmVhTTI7XG5jb25zdCBDRDAgPSBGMTZfUFJPRklMRS5jZDA7XG5jb25zdCBJTkRVQ0VEX0RSQUdfSyA9IEYxNl9QUk9GSUxFLmluZHVjZWREcmFnSztcbmNvbnN0IENMMCA9IEYxNl9QUk9GSUxFLmNsMDtcbmNvbnN0IENMX0FMUEhBID0gRjE2X1BST0ZJTEUuY2xBbHBoYVBlclJhZDtcbmNvbnN0IFNUQUxMX0FPQSA9IEYxNl9QUk9GSUxFLnN0YWxsQW9hRGVnICogTWF0aC5QSSAvIDE4MDtcbmNvbnN0IE1BWF9DTCA9IDEuNDg7XG5jb25zdCBRX1JFRiA9IDAuNSAqIGNvbXB1dGVJc2FBaXJEZW5zaXR5KEYxNl9QUk9GSUxFLmNydWlzZUFsdGl0dWRlTSkgKiBGMTZfUFJPRklMRS5jcnVpc2VTcGVlZE1wcyAqIEYxNl9QUk9GSUxFLmNydWlzZVNwZWVkTXBzO1xuY29uc3QgTUlOX0NPTlRST0xfUSA9IDAuMTI7XG5jb25zdCBNQVhfQ09OVFJPTF9RID0gMi4yO1xuY29uc3QgTUlOX0ZMWUlOR19TUEVFRCA9IEYxNl9QUk9GSUxFLm1pbkZseWluZ1NwZWVkTXBzO1xuY29uc3QgU0lERV9TTElQX0RBTVBfUkFURSA9IDQuNTtcbmNvbnN0IENZX0JFVEEgPSAtMC42O1xuY29uc3QgWUFXX0NPTlRST0xfUV9TQ0FMRSA9IDAuNDU7XG5cbmNvbnN0IENEX0xBTkRJTkdfR0VBUiA9IDAuMDM1O1xuY29uc3QgQ0RfRkxBUFMgPSAwLjA4O1xuY29uc3QgQ0xfRkxBUFNfRkFDVE9SID0gMS4yNTtcblxuY29uc3QgRjE2X1JPTExfQ09ORklHID0ge1xuICAgIG1heFJvbGxSYXRlRGVnUzogRjE2X1BST0ZJTEUubWF4Um9sbFJhdGVEZWdTLFxuICAgIGFjdHVhdG9yVGF1UzogRjE2X1JPTExfQ0FUMS5hY3R1YXRvclRhdVMsXG59O1xuXG5jb25zdCBHUk9VTkRfRlJJQ1RJT05fS0lORVRJQyA9IDAuMTU7XG5jb25zdCBHUk9VTkRfRlJJQ1RJT05fU1RBVElDID0gMC4yO1xuY29uc3QgR1JPVU5EX0JSQUtFX0tJTkVUSUMgPSAxLjg7XG5jb25zdCBHUk9VTkRfQlJBS0VfU1RBVElDID0gMS4xNztcblxuY29uc3QgTEFOREVEX01BWF9TUEVFRCA9IEYxNl9QUk9GSUxFLmxhbmRpbmdNYXhTcGVlZE1wcztcbmNvbnN0IExBTkRJTkdfTUFYX1ZTUEVFRCA9IEYxNl9QUk9GSUxFLmxhbmRpbmdNYXhWZXJ0aWNhbFNwZWVkTXBzO1xuY29uc3QgTEFORElOR19NSU5fUElUQ0ggPSBGMTZfUFJPRklMRS5sYW5kaW5nTWluUGl0Y2hEZWcgKiBQSV9PVkVSXzE4MDtcbmNvbnN0IExBTkRJTkdfTUFYX1JPTEwgPSBGMTZfUFJPRklMRS5sYW5kaW5nTWF4Um9sbERlZyAqIFBJX09WRVJfMTgwO1xuY29uc3QgUk9UQVRJT05fU1BFRUQgPSBGMTZfUFJPRklMRS5yb3RhdGlvblNwZWVkTXBzO1xuXG5mdW5jdGlvbiBjb21wdXRlQ2woYW9hOiBudW1iZXIsIGZsYXBzRXh0ZW5kZWQ6IGJvb2xlYW4pOiBudW1iZXIge1xuICAgIGNvbnN0IGZsYXBCb29zdCA9IGZsYXBzRXh0ZW5kZWQgPyBDTF9GTEFQU19GQUNUT1IgOiAxLjA7XG4gICAgY29uc3Qgc3RhbGxBb2EgPSBmbGFwc0V4dGVuZGVkID8gU1RBTExfQU9BICogMS4xIDogU1RBTExfQU9BO1xuICAgIGNvbnN0IG1heENsID0gTUFYX0NMICogZmxhcEJvb3N0O1xuXG4gICAgaWYgKE1hdGguYWJzKGFvYSkgPD0gc3RhbGxBb2EpIHtcbiAgICAgICAgcmV0dXJuIGNsYW1wKENMMCArIENMX0FMUEhBICogYW9hICogZmxhcEJvb3N0LCAtbWF4Q2wgKiAwLjM1LCBtYXhDbCk7XG4gICAgfVxuXG4gICAgY29uc3QgcGVha0NsID0gKENMMCArIENMX0FMUEhBICogc3RhbGxBb2EgKiBNYXRoLnNpZ24oYW9hKSkgKiBmbGFwQm9vc3Q7XG4gICAgY29uc3QgcG9zdFN0YWxsID0gTWF0aC5jb3MoKE1hdGguYWJzKGFvYSkgLSBzdGFsbEFvYSkgKiA0LjApO1xuICAgIHJldHVybiBwZWFrQ2wgKiBNYXRoLm1heCgwLCBwb3N0U3RhbGwpO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlSW5kdWNlZERyYWcoY2w6IG51bWJlcik6IG51bWJlciB7XG4gICAgcmV0dXJuIElORFVDRURfRFJBR19LICogY2wgKiBjbDtcbn1cblxuLyoqIFBpdGNoIHJhdGUgc2NhbGVzIHdpdGggYWlyc3BlZWQgc28gbG93LXNwZWVkIHJvdGF0aW9uIGNhbm5vdCBzbmFwIHRvIGRlZXAtc3RhbGwgQU9BLiAqL1xuZnVuY3Rpb24gY29tcHV0ZVBpdGNoU3BlZWRBdXRob3JpdHkoc3BlZWQ6IG51bWJlciwgbGFuZGVkOiBib29sZWFuKTogbnVtYmVyIHtcbiAgICBsZXQgYXV0aG9yaXR5ID0gY2xhbXAoc3BlZWQgLyBNSU5fRkxZSU5HX1NQRUVELCAwLCAxKTtcbiAgICBpZiAobGFuZGVkICYmIHNwZWVkIDwgUk9UQVRJT05fU1BFRUQpIHtcbiAgICAgICAgYXV0aG9yaXR5ICo9IGNsYW1wKHNwZWVkIC8gUk9UQVRJT05fU1BFRUQsIDAsIDEpO1xuICAgIH1cbiAgICByZXR1cm4gYXV0aG9yaXR5O1xufVxuXG5leHBvcnQgY2xhc3MgUmVhbGlzdGljRmxpZ2h0TW9kZWwgZXh0ZW5kcyBGbGlnaHRNb2RlbCB7XG5cbiAgICBwcml2YXRlIHN0YWxsID0gLTE7XG4gICAgcHJpdmF0ZSBib2R5Um9sbFJhdGVSYWQgPSAwO1xuXG4gICAgcHJpdmF0ZSBmb3J3YXJkID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHVwID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJpZ2h0ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHZlbG9jaXR5VW5pdCA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSB0aHJ1c3QgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgZHJhZyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSBsaWZ0ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHdlaWdodCA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSBmcmljdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSBmb3JjZXMgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgc2lkZUZvcmNlID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIGxpZnREaXJlY3Rpb24gPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgX3YgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMub2JqLnVwLmNvcHkoVVApO1xuICAgIH1cblxuICAgIHJlc2V0KCkge1xuICAgICAgICBzdXBlci5yZXNldCgpO1xuICAgICAgICB0aGlzLnN0YWxsID0gLTE7XG4gICAgICAgIHRoaXMuYm9keVJvbGxSYXRlUmFkID0gMDtcbiAgICB9XG5cbiAgICBzdGVwKGRlbHRhOiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuY3Jhc2hlZCkgcmV0dXJuO1xuXG4gICAgICAgIGlmICh0aGlzLmVmZmVjdGl2ZVRocm90dGxlID4gdGhpcy50aHJvdHRsZSkge1xuICAgICAgICAgICAgdGhpcy5lZmZlY3RpdmVUaHJvdHRsZSA9IE1hdGgubWF4KHRoaXMudGhyb3R0bGUsIHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgLSBUSFJPVFRMRV9ET1dOX1JBVEUgKiBkZWx0YSk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5lZmZlY3RpdmVUaHJvdHRsZSA8IHRoaXMudGhyb3R0bGUpIHtcbiAgICAgICAgICAgIHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgPSBNYXRoLm1pbih0aGlzLnRocm90dGxlLCB0aGlzLmVmZmVjdGl2ZVRocm90dGxlICsgVEhST1RUTEVfVVBfUkFURSAqIGRlbHRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZm9yd2FyZC5jb3B5KEZPUldBUkQpLmFwcGx5UXVhdGVybmlvbih0aGlzLm9iai5xdWF0ZXJuaW9uKTtcbiAgICAgICAgdGhpcy51cC5jb3B5KFVQKS5hcHBseVF1YXRlcm5pb24odGhpcy5vYmoucXVhdGVybmlvbik7XG4gICAgICAgIHRoaXMucmlnaHQuY29weShSSUdIVCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMub2JqLnF1YXRlcm5pb24pO1xuXG4gICAgICAgIGNvbnN0IGFsdGl0dWRlID0gdGhpcy5vYmoucG9zaXRpb24ueTtcbiAgICAgICAgY29uc3QgYWlyRGVuc2l0eSA9IGNvbXB1dGVBaXJEZW5zaXR5KGFsdGl0dWRlKTtcbiAgICAgICAgY29uc3Qgc3BlZWQgPSB0aGlzLnZlbG9jaXR5Lmxlbmd0aCgpO1xuICAgICAgICBjb25zdCBkeW5hbWljUHJlc3N1cmUgPSBjb21wdXRlRHluYW1pY1ByZXNzdXJlKGFpckRlbnNpdHksIHNwZWVkKTtcbiAgICAgICAgY29uc3QgY29udHJvbFNjYWxlID0gY2xhbXAoZHluYW1pY1ByZXNzdXJlIC8gUV9SRUYsIE1JTl9DT05UUk9MX1EsIE1BWF9DT05UUk9MX1EpO1xuXG4gICAgICAgIGxldCBhb2EgPSAwO1xuICAgICAgICBpZiAoc3BlZWQgPiAxLjApIHtcbiAgICAgICAgICAgIGFvYSA9IGNvbXB1dGVBbmdsZU9mQXR0YWNrKHRoaXMuZm9yd2FyZCwgdGhpcy5yaWdodCwgdGhpcy52ZWxvY2l0eSwgdGhpcy5fdik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hbmdsZU9mQXR0YWNrUmFkID0gYW9hO1xuXG4gICAgICAgIGNvbnN0IGNsID0gY29tcHV0ZUNsKGFvYSwgdGhpcy5mbGFwc0V4dGVuZGVkKTtcbiAgICAgICAgY29uc3Qgd2F2ZURyYWcgPSBjb21wdXRlRHluYW1pY1ByZXNzdXJlRHJhZ1BlbmFsdHkoc3BlZWQsIGFsdGl0dWRlKTtcbiAgICAgICAgY29uc3QgY2QgPSBDRDAgKiAoMSArIHdhdmVEcmFnKVxuICAgICAgICAgICAgKyBjb21wdXRlSW5kdWNlZERyYWcoY2wpXG4gICAgICAgICAgICArICh0aGlzLmxhbmRpbmdHZWFyRGVwbG95ZWQgPyBDRF9MQU5ESU5HX0dFQVIgOiAwKVxuICAgICAgICAgICAgKyAodGhpcy5mbGFwc0V4dGVuZGVkID8gQ0RfRkxBUFMgOiAwKTtcblxuICAgICAgICB0aGlzLnVwZGF0ZVN0YWxsU3RhdGUoc3BlZWQsIGFvYSwgYWx0aXR1ZGUpO1xuXG4gICAgICAgIGNvbnN0IHBpdGNoQXV0aG9yaXR5ID0gdGhpcy5zdGFsbCA+PSAwID8gMC4zNSA6IDEuMDtcbiAgICAgICAgY29uc3QgcGl0Y2hTcGVlZEF1dGhvcml0eSA9IGNvbXB1dGVQaXRjaFNwZWVkQXV0aG9yaXR5KHNwZWVkLCB0aGlzLmxhbmRlZCk7XG4gICAgICAgIGNvbnN0IHBpdGNoR0xpbWl0ID0gY29tcHV0ZUYxNlBpdGNoR0xpbWl0KHRoaXMubG9hZEZhY3RvckcsIHRoaXMucGl0Y2gsIEYxNl9QUk9GSUxFLm1heExvYWRGYWN0b3JHKTtcbiAgICAgICAgY29uc3QgcGl0Y2hBb2FMaW1pdCA9IGNvbXB1dGVGMTZQaXRjaEFvYUF1dGhvcml0eShhb2EsIHRoaXMucGl0Y2gsIFNUQUxMX0FPQSk7XG4gICAgICAgIGNvbnN0IGFvYVJlY292ZXJ5ID0gY29tcHV0ZUYxNkFvYVJlY292ZXJ5UmF0ZShhb2EsIFNUQUxMX0FPQSwgc3BlZWQpO1xuICAgICAgICBjb25zdCB5YXdDb250cm9sU2NhbGUgPSBNSU5fQ09OVFJPTF9RICsgKGNvbnRyb2xTY2FsZSAtIE1JTl9DT05UUk9MX1EpICogWUFXX0NPTlRST0xfUV9TQ0FMRTtcbiAgICAgICAgY29uc3QgbWFjaCA9IGNvbXB1dGVNYWNoTnVtYmVyKHNwZWVkLCBhbHRpdHVkZSk7XG5cbiAgICAgICAgY29uc3QgY29tbWFuZGVkUm9sbFJhdGUgPSBjb21wdXRlRjE2Q29tbWFuZGVkUm9sbFJhdGUoe1xuICAgICAgICAgICAgc3RpY2s6IHRoaXMucm9sbCxcbiAgICAgICAgICAgIGR5bmFtaWNQcmVzc3VyZSxcbiAgICAgICAgICAgIHFSZWY6IFFfUkVGLFxuICAgICAgICAgICAgbWFjaCxcbiAgICAgICAgICAgIGFsdGl0dWRlTTogYWx0aXR1ZGUsXG4gICAgICAgICAgICBhb2FSYWQ6IGFvYSxcbiAgICAgICAgICAgIGZsYXBzRXh0ZW5kZWQ6IHRoaXMuZmxhcHNFeHRlbmRlZCxcbiAgICAgICAgICAgIGxhbmRlZDogdGhpcy5sYW5kZWQsXG4gICAgICAgICAgICBjb25maWc6IEYxNl9ST0xMX0NPTkZJRyxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuYm9keVJvbGxSYXRlUmFkID0gc3RlcEYxNkJvZHlSb2xsUmF0ZShcbiAgICAgICAgICAgIHRoaXMuYm9keVJvbGxSYXRlUmFkLFxuICAgICAgICAgICAgY29tbWFuZGVkUm9sbFJhdGUsXG4gICAgICAgICAgICBkZWx0YSxcbiAgICAgICAgICAgIEYxNl9ST0xMX0NPTkZJRyxcbiAgICAgICAgKTtcblxuICAgICAgICBpZiAoIXRoaXMubGFuZGVkICYmIE1hdGguYWJzKHRoaXMuYm9keVJvbGxSYXRlUmFkKSA+IDFlLTYpIHtcbiAgICAgICAgICAgIHRoaXMub2JqLnJvdGF0ZVoodGhpcy5ib2R5Um9sbFJhdGVSYWQgKiBkZWx0YSk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5sYW5kZWQpIHtcbiAgICAgICAgICAgIHRoaXMuYm9keVJvbGxSYXRlUmFkID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghaXNaZXJvKHRoaXMucGl0Y2gpXG4gICAgICAgICAgICAmJiAhKHRoaXMubGFuZGVkICYmIHRoaXMucGl0Y2ggPCAwKVxuICAgICAgICAgICAgJiYgKHRoaXMuc3RhbGwgPCAwIHx8ICh0aGlzLnBpdGNoIDwgMCAmJiB0aGlzLnVwLnkgPiAwKSB8fCAodGhpcy5waXRjaCA+IDAgJiYgdGhpcy51cC55IDwgMCkpXG4gICAgICAgICkge1xuICAgICAgICAgICAgdGhpcy5vYmoucm90YXRlWCgtdGhpcy5waXRjaCAqIFBJVENIX1JBVEUgKiBjb250cm9sU2NhbGUgKiBwaXRjaEF1dGhvcml0eSAqIHBpdGNoU3BlZWRBdXRob3JpdHkgKiBwaXRjaEdMaW1pdCAqIHBpdGNoQW9hTGltaXQgKiBkZWx0YSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFvYVJlY292ZXJ5ICE9PSAwKSB7XG4gICAgICAgICAgICB0aGlzLm9iai5yb3RhdGVYKE1hdGguc2lnbihhb2EpICogYW9hUmVjb3ZlcnkgKiBkZWx0YSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTdGFsbCBub3NlLWRvd24gZWZmZWN0XG4gICAgICAgIGlmICh0aGlzLnN0YWxsID4gMCAmJiAhdGhpcy5sYW5kZWQgJiYgdGhpcy5waXRjaCA8PSAwKSB7XG4gICAgICAgICAgICBjb25zdCBzdGFsbE5vc2VEb3duID0gdGhpcy5zdGFsbCAqIDAuNjsgLy8gcmFkL3NcbiAgICAgICAgICAgIGNvbnN0IGZvcndhcmQgPSB0aGlzLmZvcndhcmQ7XG4gICAgICAgICAgICBjb25zdCByaWdodCA9IHRoaXMucmlnaHQ7XG4gICAgICAgICAgICBjb25zdCBncm91bmROb3JtYWwgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAtMSwgMCk7XG4gICAgICAgICAgICBjb25zdCBwaXRjaERpciA9IG5ldyBUSFJFRS5WZWN0b3IzKCkuY3Jvc3NWZWN0b3JzKGZvcndhcmQsIGdyb3VuZE5vcm1hbCk7XG4gICAgICAgICAgICBjb25zdCBkb3QgPSBwaXRjaERpci5kb3QocmlnaHQpO1xuICAgICAgICAgICAgdGhpcy5vYmoucm90YXRlWChNYXRoLnNpZ24oZG90KSAqIHN0YWxsTm9zZURvd24gKiBkZWx0YSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBMYW5kZWQgbm9zZS1kb3duIGVmZmVjdFxuICAgICAgICBpZiAodGhpcy5sYW5kZWQgJiYgdGhpcy5waXRjaCA8PSAwKSB7XG4gICAgICAgICAgICBjb25zdCBmb3J3YXJkID0gdGhpcy5mb3J3YXJkO1xuICAgICAgICAgICAgY29uc3QgcHJqRm9yd2FyZCA9IG5ldyBUSFJFRS5WZWN0b3IzKCkuY29weShmb3J3YXJkKS5zZXRZKDApLm5vcm1hbGl6ZSgpO1xuICAgICAgICAgICAgY29uc3QgcGl0Y2hBbmdsZSA9IGZvcndhcmQuYW5nbGVUbyhwcmpGb3J3YXJkKSAqIE1hdGguc2lnbihmb3J3YXJkLnkpO1xuXG4gICAgICAgICAgICBpZiAocGl0Y2hBbmdsZSA+IDAuMDAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3BlZWRGYWN0b3IgPSBjbGFtcCgxIC0gc3BlZWQgLyBST1RBVElPTl9TUEVFRCwgMCwgMSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZmFsbFJhdGUgPSBzcGVlZEZhY3RvciAqIDAuNDsgLy8gcmFkL3NcbiAgICAgICAgICAgICAgICBjb25zdCByb3RhdGlvbiA9IE1hdGgubWluKHBpdGNoQW5nbGUsIGZhbGxSYXRlICogZGVsdGEpO1xuICAgICAgICAgICAgICAgIHRoaXMub2JqLnJvdGF0ZVgocm90YXRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbWF4Um9sbFJhdGUgPSBtYXhSb2xsUmF0ZVJhZChGMTZfUk9MTF9DT05GSUcpO1xuICAgICAgICBjb25zdCByb2xsWWF3Q291cGxpbmcgPSAhdGhpcy5sYW5kZWQgJiYgIWlzWmVybyhzcGVlZClcbiAgICAgICAgICAgID8gY29tcHV0ZUYxNlJvbGxZYXdDb3VwbGluZyh0aGlzLmJvZHlSb2xsUmF0ZVJhZCwgYW9hLCBtYXhSb2xsUmF0ZSlcbiAgICAgICAgICAgIDogMDtcblxuICAgICAgICBpZiAoIWlzWmVybyhzcGVlZCkgJiYgKCFpc1plcm8odGhpcy55YXcpIHx8IE1hdGguYWJzKHJvbGxZYXdDb3VwbGluZykgPiAxZS02KSkge1xuICAgICAgICAgICAgY29uc3QgZWZmZWN0aXZlWWF3ID0gY2xhbXAodGhpcy55YXcgKyByb2xsWWF3Q291cGxpbmcsIC0xLCAxKTtcbiAgICAgICAgICAgIHRoaXMub2JqLnJvdGF0ZVkoLWVmZmVjdGl2ZVlhdyAqICh0aGlzLmxhbmRlZCA/IFlBV19SQVRFX0xBTkRFRCA6IFlBV19SQVRFKSAqIHlhd0NvbnRyb2xTY2FsZSAqIGRlbHRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRocnVzdE4gPSBjb21wdXRlRjE2RW5naW5lVGhydXN0Tih0aGlzLmVmZmVjdGl2ZVRocm90dGxlLCBhbHRpdHVkZSk7XG4gICAgICAgIHJvdW5kVG9aZXJvKHRoaXMudGhydXN0LmNvcHkodGhpcy5mb3J3YXJkKS5tdWx0aXBseVNjYWxhcih0aHJ1c3ROKSk7XG4gICAgICAgIHRoaXMuZW5naW5lVGhydXN0TiA9IHRocnVzdE47XG5cbiAgICAgICAgaWYgKHNwZWVkID4gMWUtMykge1xuICAgICAgICAgICAgdGhpcy52ZWxvY2l0eVVuaXQuY29weSh0aGlzLnZlbG9jaXR5KS5tdWx0aXBseVNjYWxhcigxIC8gc3BlZWQpO1xuICAgICAgICAgICAgcm91bmRUb1plcm8odGhpcy5kcmFnLmNvcHkodGhpcy52ZWxvY2l0eVVuaXQpLm5lZ2F0ZSgpLm11bHRpcGx5U2NhbGFyKGR5bmFtaWNQcmVzc3VyZSAqIFdJTkdfQVJFQSAqIGNkKSk7XG5cbiAgICAgICAgICAgIGlmIChzcGVlZCA+IDAuNSkge1xuICAgICAgICAgICAgICAgIHRoaXMubGlmdERpcmVjdGlvbi5jcm9zc1ZlY3RvcnModGhpcy5yaWdodCwgdGhpcy52ZWxvY2l0eVVuaXQpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmxpZnREaXJlY3Rpb24ubGVuZ3RoU3EoKSA8IDFlLTYpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5saWZ0RGlyZWN0aW9uLmNvcHkodGhpcy51cCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5saWZ0RGlyZWN0aW9uLm5vcm1hbGl6ZSgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5saWZ0RGlyZWN0aW9uLmRvdCh0aGlzLnVwKSA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubGlmdERpcmVjdGlvbi5uZWdhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByb3VuZFRvWmVybyh0aGlzLmxpZnQuY29weSh0aGlzLmxpZnREaXJlY3Rpb24pLm11bHRpcGx5U2NhbGFyKGR5bmFtaWNQcmVzc3VyZSAqIFdJTkdfQVJFQSAqIGNsKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMubGlmdC5zZXQoMCwgMCwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmRyYWcuc2V0KDAsIDAsIDApO1xuICAgICAgICAgICAgdGhpcy5saWZ0LnNldCgwLCAwLCAwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJvdW5kVG9aZXJvKHRoaXMud2VpZ2h0LnNldCgwLCAtRFJZX01BU1MgKiA5LjgwNjY1LCAwKSk7XG5cbiAgICAgICAgaWYgKCF0aGlzLmxhbmRlZCAmJiBzcGVlZCA+IDUpIHtcbiAgICAgICAgICAgIGNvbnN0IGxhdGVyYWxTcGVlZCA9IHRoaXMudmVsb2NpdHkuZG90KHRoaXMucmlnaHQpO1xuICAgICAgICAgICAgY29uc3QgZm9yd2FyZFNwZWVkID0gdGhpcy52ZWxvY2l0eS5kb3QodGhpcy5mb3J3YXJkKTtcbiAgICAgICAgICAgIGNvbnN0IGJldGEgPSBNYXRoLmF0YW4yKGxhdGVyYWxTcGVlZCwgTWF0aC5tYXgoTWF0aC5hYnMoZm9yd2FyZFNwZWVkKSwgNSkpO1xuICAgICAgICAgICAgY29uc3QgZGFtcEZvcmNlID0gLWxhdGVyYWxTcGVlZCAqIFNJREVfU0xJUF9EQU1QX1JBVEUgKiBEUllfTUFTUztcbiAgICAgICAgICAgIGNvbnN0IGJldGFGb3JjZSA9IENZX0JFVEEgKiBiZXRhICogZHluYW1pY1ByZXNzdXJlICogV0lOR19BUkVBO1xuICAgICAgICAgICAgcm91bmRUb1plcm8odGhpcy5zaWRlRm9yY2UuY29weSh0aGlzLnJpZ2h0KS5tdWx0aXBseVNjYWxhcihkYW1wRm9yY2UgKyBiZXRhRm9yY2UpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2lkZUZvcmNlLnNldCgwLCAwLCAwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZm9yY2VzLnNldCgwLCAwLCAwKS5hZGQodGhpcy50aHJ1c3QpLmFkZCh0aGlzLmRyYWcpLmFkZCh0aGlzLmxpZnQpLmFkZCh0aGlzLnNpZGVGb3JjZSkuYWRkKHRoaXMud2VpZ2h0KTtcblxuICAgICAgICBjb25zdCBvbkdyb3VuZCA9IHRoaXMub2JqLnBvc2l0aW9uLnkgPD0gUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5EICsgMC4wNTtcbiAgICAgICAgaWYgKHRoaXMubGFuZGVkIHx8ICh0aGlzLndoZWVsQnJha2VzQXBwbGllZCAmJiBvbkdyb3VuZCkpIHtcbiAgICAgICAgICAgIGNvbnN0IHdlaWdodE1hZ25pdHVkZSA9IERSWV9NQVNTICogOS44MDY2NTtcbiAgICAgICAgICAgIGNvbnN0IHByakZvcmNlcyA9IHRoaXMuX3YuY29weSh0aGlzLmZvcmNlcykuc2V0WSgwKTtcbiAgICAgICAgICAgIGNvbnN0IHByakZvcmNlc01hZ25pdHVkZSA9IHByakZvcmNlcy5sZW5ndGgoKTtcbiAgICAgICAgICAgIGNvbnN0IG1heFN0YXRpY0ZyaWN0aW9uID0gKHRoaXMud2hlZWxCcmFrZXNBcHBsaWVkID8gR1JPVU5EX0JSQUtFX1NUQVRJQyA6IEdST1VORF9GUklDVElPTl9TVEFUSUMpICogd2VpZ2h0TWFnbml0dWRlO1xuICAgICAgICAgICAgY29uc3Qga2luZXRpY0ZyaWN0aW9uID0gKHRoaXMud2hlZWxCcmFrZXNBcHBsaWVkID8gR1JPVU5EX0JSQUtFX0tJTkVUSUMgOiBHUk9VTkRfRlJJQ1RJT05fS0lORVRJQykgKiB3ZWlnaHRNYWduaXR1ZGU7XG5cbiAgICAgICAgICAgIGlmIChpc1plcm8oc3BlZWQpICYmIHByakZvcmNlc01hZ25pdHVkZSA8IG1heFN0YXRpY0ZyaWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5mcmljdGlvbi5jb3B5KHByakZvcmNlcykubmVnYXRlKCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHNwZWVkID4gMC41KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5mcmljdGlvbi5jb3B5KHRoaXMudmVsb2NpdHlVbml0KS5zZXRZKDApLm5lZ2F0ZSgpLm5vcm1hbGl6ZSgpLm11bHRpcGx5U2NhbGFyKGtpbmV0aWNGcmljdGlvbik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZnJpY3Rpb24uc2V0KDAsIDAsIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcm91bmRUb1plcm8odGhpcy5mcmljdGlvbik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmZyaWN0aW9uLnNldCgwLCAwLCAwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZm9yY2VzLmFkZCh0aGlzLmZyaWN0aW9uKTtcbiAgICAgICAgaWYgKHRoaXMubGFuZGVkICYmIHRoaXMuZm9yY2VzLnkgPCAwKSB7XG4gICAgICAgICAgICB0aGlzLmZvcmNlcy5zZXRZKDApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYWNjZWwgPSByb3VuZFRvWmVybyh0aGlzLmZvcmNlcy5kaXZpZGVTY2FsYXIoRFJZX01BU1MpKTtcbiAgICAgICAgdGhpcy51cC5jb3B5KFVQKS5hcHBseVF1YXRlcm5pb24odGhpcy5vYmoucXVhdGVybmlvbik7XG4gICAgICAgIGNsYW1wTG9hZEZhY3RvckFjY2VsZXJhdGlvbihhY2NlbCwgdGhpcy51cCwgRjE2X1BST0ZJTEUubWF4TG9hZEZhY3RvckcpO1xuICAgICAgICB0aGlzLmxvYWRGYWN0b3JHID0gY29tcHV0ZUxvYWRGYWN0b3JHKGFjY2VsLCB0aGlzLnVwKTtcbiAgICAgICAgdGhpcy52ZWxvY2l0eS5hZGRTY2FsZWRWZWN0b3IoYWNjZWwsIGRlbHRhKTtcblxuICAgICAgICBpZiAodGhpcy5sYW5kZWQgJiYgdGhpcy52ZWxvY2l0eS55IDwgMCkge1xuICAgICAgICAgICAgdGhpcy52ZWxvY2l0eS5zZXRZKDApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5vYmoucG9zaXRpb24uYWRkU2NhbGVkVmVjdG9yKFxuICAgICAgICAgICAgdGhpcy5sYW5kZWQgPyByb3VuZFRvWmVybyh0aGlzLnZlbG9jaXR5LCAwLjAxKSA6IHRoaXMudmVsb2NpdHksXG4gICAgICAgICAgICBkZWx0YVxuICAgICAgICApO1xuXG4gICAgICAgIGlmICh0aGlzLm9iai5wb3NpdGlvbi55ID4gUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5EKSB7XG4gICAgICAgICAgICB0aGlzLmxhbmRlZCA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5oYW5kbGVHcm91bmRDb250YWN0KHNwZWVkKTtcblxuICAgICAgICB0aGlzLndyYXBQb3NpdGlvbigpO1xuICAgIH1cblxuICAgIGdldFN0YWxsU3RhdHVzKCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0YWxsO1xuICAgIH1cblxuICAgIGdldFRocm90dGxlSHVkVGV4dCgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gZm9ybWF0RjE2VGhyb3R0bGVIdWQodGhpcy50aHJvdHRsZSk7XG4gICAgfVxuXG4gICAgdXNlRjE2VGhyb3R0bGVEZXRlbnRzKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBzdGVwVGhyb3R0bGVEZXRlbnQoY3VycmVudDogbnVtYmVyLCBkaXJlY3Rpb246IDEgfCAtMSk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiBzdGVwRjE2VGhyb3R0bGVEZXRlbnQoY3VycmVudCwgZGlyZWN0aW9uKTtcbiAgICB9XG5cbiAgICBpc0luVGhyb3R0bGVBYkRldGVudEJhbmQobGV2ZXI6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gaXNGMTZBYkRldGVudEJhbmQobGV2ZXIpO1xuICAgIH1cblxuICAgIGFkanVzdFRocm90dGxlSW5wdXQoY3VycmVudDogbnVtYmVyLCBzdGVwOiBudW1iZXIpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gYWRqdXN0RjE2VGhyb3R0bGVJbnB1dChjdXJyZW50LCBzdGVwKTtcbiAgICB9XG5cbiAgICBnZXRUaHJvdHRsZVpvbmUoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGdldEYxNlRocm90dGxlWm9uZSh0aGlzLmVmZmVjdGl2ZVRocm90dGxlKTtcbiAgICB9XG5cbiAgICBnZXRUaHJvdHRsZUF1ZGlvTGV2ZWwoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIGYxNlRocm90dGxlQXVkaW9MZXZlbCh0aGlzLmVmZmVjdGl2ZVRocm90dGxlKTtcbiAgICB9XG5cbiAgICBnZXRFbmdpbmVOb3p6bGVDb2xvcigpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gZ2V0RjE2RW5naW5lTm96emxlQ29sb3IodGhpcy5lZmZlY3RpdmVUaHJvdHRsZSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB1cGRhdGVTdGFsbFN0YXRlKHNwZWVkOiBudW1iZXIsIGFvYTogbnVtYmVyLCBhbHRpdHVkZTogbnVtYmVyKSB7XG4gICAgICAgIGlmICh0aGlzLmxhbmRlZCB8fCBzcGVlZCA8IDUpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhbGwgPSAtMTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGFvYVN0YWxsID0gY2xhbXAoKE1hdGguYWJzKGFvYSkgLSBTVEFMTF9BT0EgKiAwLjc1KSAvIChTVEFMTF9BT0EgKiAwLjM1KSwgMCwgMSk7XG4gICAgICAgIGNvbnN0IHNwZWVkU3RhbGwgPSBjbGFtcCgoTUlOX0ZMWUlOR19TUEVFRCAtIHNwZWVkKSAvIE1JTl9GTFlJTkdfU1BFRUQsIDAsIDEpO1xuICAgICAgICAvLyBPbmx5IGNvbnNpZGVyIHNwZWVkLWJhc2VkIHN0YWxsIGlmIHdlIGFyZSBoaWdoIGVub3VnaCB0byBhdm9pZCBpbnRlcmZlcmluZyB3aXRoIHRha2VvZmYvbGFuZGluZ1xuICAgICAgICBjb25zdCBzdGFsbExldmVsID0gTWF0aC5tYXgoYW9hU3RhbGwsIGFsdGl0dWRlID4gUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5EICsgNSA/IHNwZWVkU3RhbGwgOiAwKTtcbiAgICAgICAgdGhpcy5zdGFsbCA9IHN0YWxsTGV2ZWwgPiAwID8gc3RhbGxMZXZlbCA6IC0xO1xuICAgIH1cblxuICAgIHByaXZhdGUgaGFuZGxlR3JvdW5kQ29udGFjdChzcGVlZDogbnVtYmVyKSB7XG4gICAgICAgIGlmICh0aGlzLm9iai5wb3NpdGlvbi55ID49IFBMQU5FX0RJU1RBTkNFX1RPX0dST1VORCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5vYmoucG9zaXRpb24ueSA9IFBMQU5FX0RJU1RBTkNFX1RPX0dST1VORDtcblxuICAgICAgICBjb25zdCBmb3J3YXJkID0gdGhpcy5mb3J3YXJkLmNvcHkoRk9SV0FSRCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMub2JqLnF1YXRlcm5pb24pO1xuICAgICAgICBjb25zdCB1cCA9IHRoaXMudXAuY29weShVUCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMub2JqLnF1YXRlcm5pb24pO1xuICAgICAgICBjb25zdCByaWdodCA9IHRoaXMucmlnaHQuY29weShSSUdIVCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMub2JqLnF1YXRlcm5pb24pO1xuXG4gICAgICAgIGNvbnN0IHByakZvcndhcmQgPSBuZXcgVEhSRUUuVmVjdG9yMygpLmNvcHkoZm9yd2FyZCkuc2V0WSgwKS5ub3JtYWxpemUoKTtcbiAgICAgICAgY29uc3QgcGl0Y2hBbmdsZSA9IGZvcndhcmQuYW5nbGVUbyhwcmpGb3J3YXJkKSAqIE1hdGguc2lnbihmb3J3YXJkLnkpO1xuXG4gICAgICAgIGNvbnN0IHByalJpZ2h0ID0gbmV3IFRIUkVFLlZlY3RvcjMoKS5jb3B5KHJpZ2h0KS5zZXRZKDApLm5vcm1hbGl6ZSgpO1xuICAgICAgICBjb25zdCByb2xsQW5nbGUgPSByaWdodC5hbmdsZVRvKHByalJpZ2h0KSAqIE1hdGguc2lnbihyaWdodC55KTtcblxuICAgICAgICBpZiAodGhpcy5sYW5kaW5nR2VhckRlcGxveWVkID09PSBmYWxzZVxuICAgICAgICAgICAgfHwgc3BlZWQgPiBMQU5ERURfTUFYX1NQRUVEXG4gICAgICAgICAgICB8fCB0aGlzLnZlbG9jaXR5LnkgPCAtTEFORElOR19NQVhfVlNQRUVEXG4gICAgICAgICAgICB8fCBNYXRoLmFicyhyb2xsQW5nbGUpID4gTEFORElOR19NQVhfUk9MTFxuICAgICAgICAgICAgfHwgTEFORElOR19NSU5fUElUQ0ggPiBwaXRjaEFuZ2xlKSB7XG4gICAgICAgICAgICB0aGlzLmNyYXNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGZvcndhcmQueSA8IDApIHtcbiAgICAgICAgICAgIGNvbnN0IGhlYWRpbmcgPSBuZXcgVEhSRUUuVmVjdG9yMygpLmNvcHkoZm9yd2FyZCkuc2V0WSgwKS5ub3JtYWxpemUoKTtcbiAgICAgICAgICAgIHRoaXMub2JqLnF1YXRlcm5pb24uc2V0RnJvbVVuaXRWZWN0b3JzKEZPUldBUkQsIGhlYWRpbmcpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudmVsb2NpdHkuc2V0WSgwKTtcbiAgICAgICAgdGhpcy5zdGFsbCA9IC0xO1xuICAgICAgICB0aGlzLmxhbmRlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB3cmFwUG9zaXRpb24oKSB7XG4gICAgICAgIGNvbnN0IHRlcnJhaW5IYWxmU2l6ZSA9IDIuNSAqIFRFUlJBSU5fU0NBTEUgKiBURVJSQUlOX01PREVMX1NJWkU7XG4gICAgICAgIGlmICh0aGlzLm9iai5wb3NpdGlvbi54ID4gdGVycmFpbkhhbGZTaXplKSB0aGlzLm9iai5wb3NpdGlvbi54ID0gLXRlcnJhaW5IYWxmU2l6ZTtcbiAgICAgICAgaWYgKHRoaXMub2JqLnBvc2l0aW9uLnggPCAtdGVycmFpbkhhbGZTaXplKSB0aGlzLm9iai5wb3NpdGlvbi54ID0gdGVycmFpbkhhbGZTaXplO1xuICAgICAgICBpZiAodGhpcy5vYmoucG9zaXRpb24ueiA+IHRlcnJhaW5IYWxmU2l6ZSkgdGhpcy5vYmoucG9zaXRpb24ueiA9IC10ZXJyYWluSGFsZlNpemU7XG4gICAgICAgIGlmICh0aGlzLm9iai5wb3NpdGlvbi56IDwgLXRlcnJhaW5IYWxmU2l6ZSkgdGhpcy5vYmoucG9zaXRpb24ueiA9IHRlcnJhaW5IYWxmU2l6ZTtcbiAgICB9XG59XG4iLCJpbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgeyBSZWFsaXN0aWNGbGlnaHRNb2RlbCB9IGZyb20gJy4uL21vZGVsL3JlYWxpc3RpY0ZsaWdodE1vZGVsJztcbmltcG9ydCB7IEFyY2FkZUZsaWdodE1vZGVsIH0gZnJvbSAnLi4vbW9kZWwvYXJjYWRlRmxpZ2h0TW9kZWwnO1xuaW1wb3J0IHsgRGVidWdGbGlnaHRNb2RlbCB9IGZyb20gJy4uL21vZGVsL2RlYnVnRmxpZ2h0TW9kZWwnO1xuaW1wb3J0IHsgRmxpZ2h0TW9kZWwgfSBmcm9tICcuLi9tb2RlbC9mbGlnaHRNb2RlbCc7XG5cbmxldCBmbGlnaHRNb2RlbDogRmxpZ2h0TW9kZWw7XG5cbnNlbGYub25tZXNzYWdlID0gKGV2ZW50OiBNZXNzYWdlRXZlbnQpID0+IHtcbiAgICBjb25zdCBkYXRhID0gZXZlbnQuZGF0YTtcblxuICAgIHN3aXRjaCAoZGF0YS50eXBlKSB7XG4gICAgICAgIGNhc2UgJ2luaXQnOlxuICAgICAgICAgICAgaWYgKGRhdGEubW9kZWxUeXBlID09PSAncmVhbGlzdGljJykge1xuICAgICAgICAgICAgICAgIGZsaWdodE1vZGVsID0gbmV3IFJlYWxpc3RpY0ZsaWdodE1vZGVsKCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGRhdGEubW9kZWxUeXBlID09PSAnYXJjYWRlJykge1xuICAgICAgICAgICAgICAgIGZsaWdodE1vZGVsID0gbmV3IEFyY2FkZUZsaWdodE1vZGVsKCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGRhdGEubW9kZWxUeXBlID09PSAnZGVidWcnKSB7XG4gICAgICAgICAgICAgICAgZmxpZ2h0TW9kZWwgPSBuZXcgRGVidWdGbGlnaHRNb2RlbCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAndXBkYXRlJzpcbiAgICAgICAgICAgIGlmICghZmxpZ2h0TW9kZWwpIHJldHVybjtcbiAgICAgICAgICAgIGZsaWdodE1vZGVsLnNldFBpdGNoKGRhdGEuaW5wdXRzLnBpdGNoKTtcbiAgICAgICAgICAgIGZsaWdodE1vZGVsLnNldFJvbGwoZGF0YS5pbnB1dHMucm9sbCk7XG4gICAgICAgICAgICBmbGlnaHRNb2RlbC5zZXRZYXcoZGF0YS5pbnB1dHMueWF3KTtcbiAgICAgICAgICAgIGZsaWdodE1vZGVsLnNldFRocm90dGxlKGRhdGEuaW5wdXRzLnRocm90dGxlKTtcbiAgICAgICAgICAgIGZsaWdodE1vZGVsLnNldExhbmRpbmdHZWFyRGVwbG95ZWQoZGF0YS5pbnB1dHMubGFuZGluZ0dlYXJEZXBsb3llZCk7XG4gICAgICAgICAgICBmbGlnaHRNb2RlbC5zZXRGbGFwc0V4dGVuZGVkKGRhdGEuaW5wdXRzLmZsYXBzRXh0ZW5kZWQpO1xuICAgICAgICAgICAgZmxpZ2h0TW9kZWwuc2V0V2hlZWxCcmFrZXMoZGF0YS5pbnB1dHMud2hlZWxCcmFrZXNBcHBsaWVkKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZmxpZ2h0TW9kZWwudXBkYXRlKGRhdGEuZGVsdGEpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBzZW5kU3RhdGUoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgJ3Jlc2V0JzpcbiAgICAgICAgICAgIGlmICghZmxpZ2h0TW9kZWwpIHJldHVybjtcbiAgICAgICAgICAgIGZsaWdodE1vZGVsLnJlc2V0KCk7XG4gICAgICAgICAgICBmbGlnaHRNb2RlbC5wb3NpdGlvbi5zZXQoZGF0YS5wb3NpdGlvblswXSwgZGF0YS5wb3NpdGlvblsxXSwgZGF0YS5wb3NpdGlvblsyXSk7XG4gICAgICAgICAgICBmbGlnaHRNb2RlbC5xdWF0ZXJuaW9uLnNldChkYXRhLnF1YXRlcm5pb25bMF0sIGRhdGEucXVhdGVybmlvblsxXSwgZGF0YS5xdWF0ZXJuaW9uWzJdLCBkYXRhLnF1YXRlcm5pb25bM10pO1xuICAgICAgICAgICAgZmxpZ2h0TW9kZWwudmVsb2NpdHlWZWN0b3Iuc2V0KGRhdGEudmVsb2NpdHlbMF0sIGRhdGEudmVsb2NpdHlbMV0sIGRhdGEudmVsb2NpdHlbMl0pO1xuICAgICAgICAgICAgZmxpZ2h0TW9kZWwuc2V0TGFuZGVkKGRhdGEubGFuZGVkKTtcbiAgICAgICAgICAgIGZsaWdodE1vZGVsLnNldFRocm90dGxlKGRhdGEudGhyb3R0bGUpO1xuICAgICAgICAgICAgc2VuZFN0YXRlKCk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICdzeW5jRWZmZWN0aXZlVGhyb3R0bGUnOlxuICAgICAgICAgICAgaWYgKCFmbGlnaHRNb2RlbCkgcmV0dXJuO1xuICAgICAgICAgICAgZmxpZ2h0TW9kZWwuc2V0VGhyb3R0bGUoZGF0YS50aHJvdHRsZSk7XG4gICAgICAgICAgICBmbGlnaHRNb2RlbC5zeW5jRWZmZWN0aXZlVGhyb3R0bGUoKTtcbiAgICAgICAgICAgIHNlbmRTdGF0ZSgpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnc2V0UG9zaXRpb24nOlxuICAgICAgICAgICAgaWYgKCFmbGlnaHRNb2RlbCkgcmV0dXJuO1xuICAgICAgICAgICAgZmxpZ2h0TW9kZWwucG9zaXRpb24uc2V0KGRhdGEucG9zaXRpb25bMF0sIGRhdGEucG9zaXRpb25bMV0sIGRhdGEucG9zaXRpb25bMl0pO1xuICAgICAgICAgICAgc2VuZFN0YXRlKCk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICdzZXRRdWF0ZXJuaW9uJzpcbiAgICAgICAgICAgIGlmICghZmxpZ2h0TW9kZWwpIHJldHVybjtcbiAgICAgICAgICAgIGZsaWdodE1vZGVsLnF1YXRlcm5pb24uc2V0KGRhdGEucXVhdGVybmlvblswXSwgZGF0YS5xdWF0ZXJuaW9uWzFdLCBkYXRhLnF1YXRlcm5pb25bMl0sIGRhdGEucXVhdGVybmlvblszXSk7XG4gICAgICAgICAgICBzZW5kU3RhdGUoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgJ3NldFZlbG9jaXR5JzpcbiAgICAgICAgICAgIGlmICghZmxpZ2h0TW9kZWwpIHJldHVybjtcbiAgICAgICAgICAgIGZsaWdodE1vZGVsLnZlbG9jaXR5VmVjdG9yLnNldChkYXRhLnZlbG9jaXR5WzBdLCBkYXRhLnZlbG9jaXR5WzFdLCBkYXRhLnZlbG9jaXR5WzJdKTtcbiAgICAgICAgICAgIHNlbmRTdGF0ZSgpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnc25hcFBoeXNpY3NTdGF0ZSc6XG4gICAgICAgICAgICBpZiAoIWZsaWdodE1vZGVsKSByZXR1cm47XG4gICAgICAgICAgICBmbGlnaHRNb2RlbC5zbmFwUGh5c2ljc1N0YXRlKCk7XG4gICAgICAgICAgICBzZW5kU3RhdGUoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbn07XG5cbmZ1bmN0aW9uIHNlbmRTdGF0ZSgpIHtcbiAgICBpZiAoIWZsaWdodE1vZGVsKSByZXR1cm47XG4gICAgY29uc3Qgc3RhdGUgPSB7XG4gICAgICAgIHBvc2l0aW9uOiBmbGlnaHRNb2RlbC5wb3NpdGlvbi50b0FycmF5KCksXG4gICAgICAgIHF1YXRlcm5pb246IGZsaWdodE1vZGVsLnF1YXRlcm5pb24udG9BcnJheSgpLFxuICAgICAgICB2ZWxvY2l0eTogZmxpZ2h0TW9kZWwudmVsb2NpdHlWZWN0b3IudG9BcnJheSgpLFxuICAgICAgICAvLyBAdHMtaWdub3JlIC0gYWNjZXNzaW5nIHByb3RlY3RlZCBtZW1iZXJzIGZvciB0cmFuc2ZlclxuICAgICAgICBwcmV2UG9zaXRpb246IGZsaWdodE1vZGVsLnByZXZQb3NpdGlvbi50b0FycmF5KCksXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcHJldlF1YXRlcm5pb246IGZsaWdodE1vZGVsLnByZXZRdWF0ZXJuaW9uLnRvQXJyYXkoKSxcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBwcmV2VmVsb2NpdHk6IGZsaWdodE1vZGVsLnByZXZWZWxvY2l0eS50b0FycmF5KCksXG4gICAgICAgIGNyYXNoZWQ6IGZsaWdodE1vZGVsLmlzQ3Jhc2hlZCgpLFxuICAgICAgICBsYW5kZWQ6IGZsaWdodE1vZGVsLmlzTGFuZGVkKCksXG4gICAgICAgIGFuZ2xlT2ZBdHRhY2tSYWQ6IGZsaWdodE1vZGVsLmdldEFuZ2xlT2ZBdHRhY2soKSxcbiAgICAgICAgbG9hZEZhY3Rvckc6IGZsaWdodE1vZGVsLmdldExvYWRGYWN0b3JHKCksXG4gICAgICAgIGVuZ2luZVRocnVzdE46IGZsaWdodE1vZGVsLmdldEVuZ2luZVRocnVzdEtuKCkgKiAxMDAwLFxuICAgICAgICBlZmZlY3RpdmVUaHJvdHRsZTogZmxpZ2h0TW9kZWwuZ2V0RWZmZWN0aXZlVGhyb3R0bGUoKSxcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBkZWx0YVJlbWFpbmRlcjogZmxpZ2h0TW9kZWwuZGVsdGFSZW1haW5kZXIsXG4gICAgICAgIHN0YWxsOiBmbGlnaHRNb2RlbC5nZXRTdGFsbFN0YXR1cygpXG4gICAgfTtcblxuICAgIHNlbGYucG9zdE1lc3NhZ2UoeyB0eXBlOiAnc3RhdGUnLCBzdGF0ZSB9KTtcbn1cbiIsImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcblxuY29uc3QgX3YgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuY29uc3QgX3cgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuY29uc3QgX3EgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuXG5jb25zdCBFUFNJTE9OID0gMC4wMDAxO1xuXG5leHBvcnQgY29uc3QgWkVSTyA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIDApO1xuZXhwb3J0IGNvbnN0IFVQID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMSwgMCk7XG5leHBvcnQgY29uc3QgRk9SV0FSRCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIDEpO1xuZXhwb3J0IGNvbnN0IFJJR0hUID0gbmV3IFRIUkVFLlZlY3RvcjMoMSwgMCwgMCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1plcm8objogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIC1FUFNJTE9OIDw9IG4gJiYgbiA8PSBFUFNJTE9OO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZXF1YWxzKGE6IG51bWJlciwgYjogbnVtYmVyLCBlcHNpbG9uOiBudW1iZXIgPSBFUFNJTE9OKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGEgLSBlcHNpbG9uIDw9IGIgJiYgYiA8PSBhICsgZXBzaWxvbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNsYW1wKG46IG51bWJlciwgbWluOiBudW1iZXIsIG1heDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICByZXR1cm4gTWF0aC5tYXgobWluLCBNYXRoLm1pbihuLCBtYXgpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxlcnAodDogbnVtYmVyLCBuMDogbnVtYmVyLCBuMTogbnVtYmVyKTogbnVtYmVyIHtcbiAgICByZXR1cm4gbjAgKyB0ICogKG4xIC0gbjApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdmVjdG9ySGVhZGluZyh2OiBUSFJFRS5WZWN0b3IzKTogbnVtYmVyIHtcbiAgICBsZXQgYmVhcmluZyA9IE1hdGgucm91bmQoTWF0aC5hdGFuMih2LngsIC12LnopIC8gKDIgKiBNYXRoLlBJKSAqIDM2MCk7XG4gICAgaWYgKGJlYXJpbmcgPCAwKSB7XG4gICAgICAgIGJlYXJpbmcgPSAzNjAgKyBiZWFyaW5nO1xuICAgIH1cbiAgICByZXR1cm4gYmVhcmluZztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJvdW5kVG9aZXJvKHY6IFRIUkVFLlZlY3RvcjMsIGVwc2lsb246IG51bWJlciA9IEVQU0lMT04pOiBUSFJFRS5WZWN0b3IzIHtcbiAgICBpZiAoZXF1YWxzKHYueCwgMC4wLCBlcHNpbG9uKSkge1xuICAgICAgICB2LnggPSAwO1xuICAgIH1cbiAgICBpZiAoZXF1YWxzKHYueSwgMC4wLCBlcHNpbG9uKSkge1xuICAgICAgICB2LnkgPSAwO1xuICAgIH1cbiAgICBpZiAoZXF1YWxzKHYueiwgMC4wLCBlcHNpbG9uKSkge1xuICAgICAgICB2LnogPSAwO1xuICAgIH1cbiAgICByZXR1cm4gdjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVhc2VPdXRDaXJjKHg6IG51bWJlcik6IG51bWJlciB7XG4gICAgcmV0dXJuIE1hdGguc3FydCgxIC0gKHggLSAxKSAqICh4IC0gMSkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZWFzZU91dFF1YWQoeDogbnVtYmVyKSB7XG4gICAgcmV0dXJuIDEgLSAoMSAtIHgpICogKDEgLSB4KTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBlYXNlT3V0UXVpbnQoeDogbnVtYmVyKSB7XG4gICAgcmV0dXJuIDEgLSBNYXRoLnBvdygxIC0geCwgNSk7XG59XG5cbmV4cG9ydCBjb25zdCBQSV9PVkVSXzE4MCA9IE1hdGguUEkgLyAxODAuMDtcbmV4cG9ydCBjb25zdCBOMTgwX09WRVJfUEkgPSAxODAuMCAvIE1hdGguUEk7XG5cbmV4cG9ydCBmdW5jdGlvbiB0b1JhZGlhbnMoZGVncmVlczogbnVtYmVyKTogbnVtYmVyIHtcbiAgICByZXR1cm4gUElfT1ZFUl8xODAgKiBkZWdyZWVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9EZWdyZWVzKHJhZGlhbnM6IG51bWJlcik6IG51bWJlciB7XG4gICAgcmV0dXJuIE4xODBfT1ZFUl9QSSAqIHJhZGlhbnM7XG59XG5cbi8vIFJldHVybnMgW3BpdGNoLCByb2xsXSBpbiByYWRpYW5zXG5leHBvcnQgZnVuY3Rpb24gY2FsY3VsYXRlUGl0Y2hSb2xsKGFjdG9yOiB7XG4gICAgcXVhdGVybmlvbjogVEhSRUUuUXVhdGVybmlvbjtcbiAgICBnZXRXb3JsZERpcmVjdGlvbjogKHY6IFRIUkVFLlZlY3RvcjMpID0+IFRIUkVFLlZlY3RvcjM7XG59KTogW251bWJlciwgbnVtYmVyXSB7XG4gICAgY29uc3QgZm9yd2FyZCA9IGFjdG9yLmdldFdvcmxkRGlyZWN0aW9uKF92KTtcbiAgICBjb25zdCBwcmpGb3J3YXJkID0gX3cuY29weShmb3J3YXJkKVxuICAgICAgICAuc2V0WSgwKVxuICAgICAgICAubm9ybWFsaXplKCk7XG4gICAgY29uc3QgcGl0Y2ggPSBmb3J3YXJkLmFuZ2xlVG8ocHJqRm9yd2FyZCkgKiBNYXRoLnNpZ24oZm9yd2FyZC55KTtcblxuICAgIF9xLnNldEZyb21Vbml0VmVjdG9ycyhmb3J3YXJkLCBwcmpGb3J3YXJkKTtcblxuICAgIGNvbnN0IHJpZ2h0ID0gX3YuY29weShSSUdIVClcbiAgICAgICAgLmFwcGx5UXVhdGVybmlvbihhY3Rvci5xdWF0ZXJuaW9uKVxuICAgICAgICAuYXBwbHlRdWF0ZXJuaW9uKF9xKTtcbiAgICBfcS5zZXRGcm9tVW5pdFZlY3RvcnMocHJqRm9yd2FyZCwgRk9SV0FSRCk7XG4gICAgcmlnaHQuYXBwbHlRdWF0ZXJuaW9uKF9xKTtcbiAgICBsZXQgcm9sbCA9IE1hdGguYWNvcyhyaWdodC54KSAqIE1hdGguc2lnbihyaWdodC55KTtcbiAgICByb2xsID0gaXNOYU4ocm9sbCkgPyAwLjAgOiByb2xsO1xuXG4gICAgcmV0dXJuIFtwaXRjaCwgcm9sbF07XG59XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuLy8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbl9fd2VicGFja19yZXF1aXJlX18ubSA9IF9fd2VicGFja19tb2R1bGVzX187XG5cbi8vIHRoZSBzdGFydHVwIGZ1bmN0aW9uXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnggPSAoKSA9PiB7XG5cdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuXHQvLyBUaGlzIGVudHJ5IG1vZHVsZSBkZXBlbmRzIG9uIG90aGVyIGxvYWRlZCBjaHVua3MgYW5kIGV4ZWN1dGlvbiBuZWVkIHRvIGJlIGRlbGF5ZWRcblx0dmFyIF9fd2VicGFja19leHBvcnRzX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fLk8odW5kZWZpbmVkLCBbXCJ2ZW5kb3JzLW5vZGVfbW9kdWxlc190aHJlZV9idWlsZF90aHJlZV9tb2R1bGVfanNcIl0sICgpID0+IChfX3dlYnBhY2tfcmVxdWlyZV9fKFwiLi9zcmMvc2NyaXB0L3BoeXNpY3Mvd29ya2VyL2ZsaWdodFdvcmtlci50c1wiKSkpXG5cdF9fd2VicGFja19leHBvcnRzX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fLk8oX193ZWJwYWNrX2V4cG9ydHNfXyk7XG5cdHJldHVybiBfX3dlYnBhY2tfZXhwb3J0c19fO1xufTtcblxuIiwidmFyIGRlZmVycmVkID0gW107XG5fX3dlYnBhY2tfcmVxdWlyZV9fLk8gPSAocmVzdWx0LCBjaHVua0lkcywgZm4sIHByaW9yaXR5KSA9PiB7XG5cdGlmKGNodW5rSWRzKSB7XG5cdFx0cHJpb3JpdHkgPSBwcmlvcml0eSB8fCAwO1xuXHRcdGZvcih2YXIgaSA9IGRlZmVycmVkLmxlbmd0aDsgaSA+IDAgJiYgZGVmZXJyZWRbaSAtIDFdWzJdID4gcHJpb3JpdHk7IGktLSkgZGVmZXJyZWRbaV0gPSBkZWZlcnJlZFtpIC0gMV07XG5cdFx0ZGVmZXJyZWRbaV0gPSBbY2h1bmtJZHMsIGZuLCBwcmlvcml0eV07XG5cdFx0cmV0dXJuO1xuXHR9XG5cdHZhciBub3RGdWxmaWxsZWQgPSBJbmZpbml0eTtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBkZWZlcnJlZC5sZW5ndGg7IGkrKykge1xuXHRcdHZhciBbY2h1bmtJZHMsIGZuLCBwcmlvcml0eV0gPSBkZWZlcnJlZFtpXTtcblx0XHR2YXIgZnVsZmlsbGVkID0gdHJ1ZTtcblx0XHRmb3IgKHZhciBqID0gMDsgaiA8IGNodW5rSWRzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRpZiAoKHByaW9yaXR5ICYgMSA9PT0gMCB8fCBub3RGdWxmaWxsZWQgPj0gcHJpb3JpdHkpICYmIE9iamVjdC5rZXlzKF9fd2VicGFja19yZXF1aXJlX18uTykuZXZlcnkoKGtleSkgPT4gKF9fd2VicGFja19yZXF1aXJlX18uT1trZXldKGNodW5rSWRzW2pdKSkpKSB7XG5cdFx0XHRcdGNodW5rSWRzLnNwbGljZShqLS0sIDEpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZnVsZmlsbGVkID0gZmFsc2U7XG5cdFx0XHRcdGlmKHByaW9yaXR5IDwgbm90RnVsZmlsbGVkKSBub3RGdWxmaWxsZWQgPSBwcmlvcml0eTtcblx0XHRcdH1cblx0XHR9XG5cdFx0aWYoZnVsZmlsbGVkKSB7XG5cdFx0XHRkZWZlcnJlZC5zcGxpY2UoaS0tLCAxKVxuXHRcdFx0dmFyIHIgPSBmbigpO1xuXHRcdFx0aWYgKHIgIT09IHVuZGVmaW5lZCkgcmVzdWx0ID0gcjtcblx0XHR9XG5cdH1cblx0cmV0dXJuIHJlc3VsdDtcbn07IiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5mID0ge307XG4vLyBUaGlzIGZpbGUgY29udGFpbnMgb25seSB0aGUgZW50cnkgY2h1bmsuXG4vLyBUaGUgY2h1bmsgbG9hZGluZyBmdW5jdGlvbiBmb3IgYWRkaXRpb25hbCBjaHVua3Ncbl9fd2VicGFja19yZXF1aXJlX18uZSA9IChjaHVua0lkKSA9PiB7XG5cdHJldHVybiBQcm9taXNlLmFsbChPYmplY3Qua2V5cyhfX3dlYnBhY2tfcmVxdWlyZV9fLmYpLnJlZHVjZSgocHJvbWlzZXMsIGtleSkgPT4ge1xuXHRcdF9fd2VicGFja19yZXF1aXJlX18uZltrZXldKGNodW5rSWQsIHByb21pc2VzKTtcblx0XHRyZXR1cm4gcHJvbWlzZXM7XG5cdH0sIFtdKSk7XG59OyIsIi8vIFRoaXMgZnVuY3Rpb24gYWxsb3cgdG8gcmVmZXJlbmNlIGFzeW5jIGNodW5rcyBhbmQgc2libGluZyBjaHVua3MgZm9yIHRoZSBlbnRyeXBvaW50XG5fX3dlYnBhY2tfcmVxdWlyZV9fLnUgPSAoY2h1bmtJZCkgPT4ge1xuXHQvLyByZXR1cm4gdXJsIGZvciBmaWxlbmFtZXMgYmFzZWQgb24gdGVtcGxhdGVcblx0cmV0dXJuIFwiXCIgKyBjaHVua0lkICsgXCIuYnVuZGxlLmpzXCI7XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18uZyA9IChmdW5jdGlvbigpIHtcblx0aWYgKHR5cGVvZiBnbG9iYWxUaGlzID09PSAnb2JqZWN0JykgcmV0dXJuIGdsb2JhbFRoaXM7XG5cdHRyeSB7XG5cdFx0cmV0dXJuIHRoaXMgfHwgbmV3IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHRpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcpIHJldHVybiB3aW5kb3c7XG5cdH1cbn0pKCk7IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsInZhciBzY3JpcHRVcmw7XG5pZiAoX193ZWJwYWNrX3JlcXVpcmVfXy5nLmltcG9ydFNjcmlwdHMpIHNjcmlwdFVybCA9IF9fd2VicGFja19yZXF1aXJlX18uZy5sb2NhdGlvbiArIFwiXCI7XG52YXIgZG9jdW1lbnQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fLmcuZG9jdW1lbnQ7XG5pZiAoIXNjcmlwdFVybCAmJiBkb2N1bWVudCkge1xuXHRpZiAoZG9jdW1lbnQuY3VycmVudFNjcmlwdClcblx0XHRzY3JpcHRVcmwgPSBkb2N1bWVudC5jdXJyZW50U2NyaXB0LnNyY1xuXHRpZiAoIXNjcmlwdFVybCkge1xuXHRcdHZhciBzY3JpcHRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzY3JpcHRcIik7XG5cdFx0aWYoc2NyaXB0cy5sZW5ndGgpIHNjcmlwdFVybCA9IHNjcmlwdHNbc2NyaXB0cy5sZW5ndGggLSAxXS5zcmNcblx0fVxufVxuLy8gV2hlbiBzdXBwb3J0aW5nIGJyb3dzZXJzIHdoZXJlIGFuIGF1dG9tYXRpYyBwdWJsaWNQYXRoIGlzIG5vdCBzdXBwb3J0ZWQgeW91IG11c3Qgc3BlY2lmeSBhbiBvdXRwdXQucHVibGljUGF0aCBtYW51YWxseSB2aWEgY29uZmlndXJhdGlvblxuLy8gb3IgcGFzcyBhbiBlbXB0eSBzdHJpbmcgKFwiXCIpIGFuZCBzZXQgdGhlIF9fd2VicGFja19wdWJsaWNfcGF0aF9fIHZhcmlhYmxlIGZyb20geW91ciBjb2RlIHRvIHVzZSB5b3VyIG93biBsb2dpYy5cbmlmICghc2NyaXB0VXJsKSB0aHJvdyBuZXcgRXJyb3IoXCJBdXRvbWF0aWMgcHVibGljUGF0aCBpcyBub3Qgc3VwcG9ydGVkIGluIHRoaXMgYnJvd3NlclwiKTtcbnNjcmlwdFVybCA9IHNjcmlwdFVybC5yZXBsYWNlKC8jLiokLywgXCJcIikucmVwbGFjZSgvXFw/LiokLywgXCJcIikucmVwbGFjZSgvXFwvW15cXC9dKyQvLCBcIi9cIik7XG5fX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBzY3JpcHRVcmw7IiwiLy8gbm8gYmFzZVVSSVxuXG4vLyBvYmplY3QgdG8gc3RvcmUgbG9hZGVkIGNodW5rc1xuLy8gXCIxXCIgbWVhbnMgXCJhbHJlYWR5IGxvYWRlZFwiXG52YXIgaW5zdGFsbGVkQ2h1bmtzID0ge1xuXHRcInNyY19zY3JpcHRfcGh5c2ljc193b3JrZXJfZmxpZ2h0V29ya2VyX3RzXCI6IDFcbn07XG5cbi8vIGltcG9ydFNjcmlwdHMgY2h1bmsgbG9hZGluZ1xudmFyIGluc3RhbGxDaHVuayA9IChkYXRhKSA9PiB7XG5cdHZhciBbY2h1bmtJZHMsIG1vcmVNb2R1bGVzLCBydW50aW1lXSA9IGRhdGE7XG5cdGZvcih2YXIgbW9kdWxlSWQgaW4gbW9yZU1vZHVsZXMpIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8obW9yZU1vZHVsZXMsIG1vZHVsZUlkKSkge1xuXHRcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tW21vZHVsZUlkXSA9IG1vcmVNb2R1bGVzW21vZHVsZUlkXTtcblx0XHR9XG5cdH1cblx0aWYocnVudGltZSkgcnVudGltZShfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblx0d2hpbGUoY2h1bmtJZHMubGVuZ3RoKVxuXHRcdGluc3RhbGxlZENodW5rc1tjaHVua0lkcy5wb3AoKV0gPSAxO1xuXHRwYXJlbnRDaHVua0xvYWRpbmdGdW5jdGlvbihkYXRhKTtcbn07XG5fX3dlYnBhY2tfcmVxdWlyZV9fLmYuaSA9IChjaHVua0lkLCBwcm9taXNlcykgPT4ge1xuXHQvLyBcIjFcIiBpcyB0aGUgc2lnbmFsIGZvciBcImFscmVhZHkgbG9hZGVkXCJcblx0aWYoIWluc3RhbGxlZENodW5rc1tjaHVua0lkXSkge1xuXHRcdGlmKHRydWUpIHsgLy8gYWxsIGNodW5rcyBoYXZlIEpTXG5cdFx0XHRpbXBvcnRTY3JpcHRzKF9fd2VicGFja19yZXF1aXJlX18ucCArIF9fd2VicGFja19yZXF1aXJlX18udShjaHVua0lkKSk7XG5cdFx0fVxuXHR9XG59O1xuXG52YXIgY2h1bmtMb2FkaW5nR2xvYmFsID0gc2VsZltcIndlYnBhY2tDaHVua3JldHJvZmxpZ2h0c2ltXCJdID0gc2VsZltcIndlYnBhY2tDaHVua3JldHJvZmxpZ2h0c2ltXCJdIHx8IFtdO1xudmFyIHBhcmVudENodW5rTG9hZGluZ0Z1bmN0aW9uID0gY2h1bmtMb2FkaW5nR2xvYmFsLnB1c2guYmluZChjaHVua0xvYWRpbmdHbG9iYWwpO1xuY2h1bmtMb2FkaW5nR2xvYmFsLnB1c2ggPSBpbnN0YWxsQ2h1bms7XG5cbi8vIG5vIEhNUlxuXG4vLyBubyBITVIgbWFuaWZlc3QiLCJ2YXIgbmV4dCA9IF9fd2VicGFja19yZXF1aXJlX18ueDtcbl9fd2VicGFja19yZXF1aXJlX18ueCA9ICgpID0+IHtcblx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18uZShcInZlbmRvcnMtbm9kZV9tb2R1bGVzX3RocmVlX2J1aWxkX3RocmVlX21vZHVsZV9qc1wiKS50aGVuKG5leHQpO1xufTsiLCIiLCIvLyBydW4gc3RhcnR1cFxudmFyIF9fd2VicGFja19leHBvcnRzX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fLngoKTtcbiIsIiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==
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

/***/ "./src/script/physics/fm2/aeroSurface.ts":
/*!***********************************************!*\
  !*** ./src/script/physics/fm2/aeroSurface.ts ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AeroSurface": () => (/* binding */ AeroSurface),
/* harmony export */   "liftCoefficient": () => (/* binding */ liftCoefficient)
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


/***/ }),

/***/ "./src/script/physics/fm2/f16Fcs.ts":
/*!******************************************!*\
  !*** ./src/script/physics/fm2/f16Fcs.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "F16Fcs": () => (/* binding */ F16Fcs)
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


/***/ }),

/***/ "./src/script/physics/fm2/f16Fm2Config.ts":
/*!************************************************!*\
  !*** ./src/script/physics/fm2/f16Fm2Config.ts ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "FM2_GEOMETRY": () => (/* binding */ FM2_GEOMETRY),
/* harmony export */   "FM2_INERTIA": () => (/* binding */ FM2_INERTIA),
/* harmony export */   "FM2_SURFACES": () => (/* binding */ FM2_SURFACES),
/* harmony export */   "FM2_AILERON": () => (/* binding */ FM2_AILERON),
/* harmony export */   "FM2_FLAPS": () => (/* binding */ FM2_FLAPS),
/* harmony export */   "FM2_GEAR_CD": () => (/* binding */ FM2_GEAR_CD),
/* harmony export */   "FM2_BODY_CD0": () => (/* binding */ FM2_BODY_CD0),
/* harmony export */   "FM2_WAVE_DRAG": () => (/* binding */ FM2_WAVE_DRAG),
/* harmony export */   "FM2_FCS": () => (/* binding */ FM2_FCS)
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
    pitchStickExpo: 0.8,
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


/***/ }),

/***/ "./src/script/physics/fm2/rigidBody.ts":
/*!*********************************************!*\
  !*** ./src/script/physics/fm2/rigidBody.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "RigidBody": () => (/* binding */ RigidBody)
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

/***/ "./src/script/physics/model/fm2FlightModel.ts":
/*!****************************************************!*\
  !*** ./src/script/physics/model/fm2FlightModel.ts ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Fm2FlightModel": () => (/* binding */ Fm2FlightModel)
/* harmony export */ });
/* harmony import */ var three__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! three */ "./node_modules/three/build/three.module.js");
/* harmony import */ var _defs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../defs */ "./src/script/defs.ts");
/* harmony import */ var _utils_math__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/math */ "./src/script/utils/math.ts");
/* harmony import */ var _aeroUtils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../aeroUtils */ "./src/script/physics/aeroUtils.ts");
/* harmony import */ var _f16Engine__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../f16Engine */ "./src/script/physics/f16Engine.ts");
/* harmony import */ var _f16Profile__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../f16Profile */ "./src/script/physics/f16Profile.ts");
/* harmony import */ var _fm2_aeroSurface__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../fm2/aeroSurface */ "./src/script/physics/fm2/aeroSurface.ts");
/* harmony import */ var _fm2_f16Fcs__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../fm2/f16Fcs */ "./src/script/physics/fm2/f16Fcs.ts");
/* harmony import */ var _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../fm2/f16Fm2Config */ "./src/script/physics/fm2/f16Fm2Config.ts");
/* harmony import */ var _fm2_rigidBody__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../fm2/rigidBody */ "./src/script/physics/fm2/rigidBody.ts");
/* harmony import */ var _flightModel__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./flightModel */ "./src/script/physics/model/flightModel.ts");











const GRAVITY = 9.80665;
const DEG = Math.PI / 180;
const THROTTLE_UP_RATE = 0.10;
const THROTTLE_DOWN_RATE = 0.07;
const MAX_STABILATOR_AOA = _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_7__.FM2_FCS.maxStabilatorRad;
const MAX_AILERON_AOA = _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_7__.FM2_AILERON.maxDeflectionRad;
const MAX_RUDDER_AOA = 22 * DEG;
const Q_REF = 0.5 * (0,_aeroUtils__WEBPACK_IMPORTED_MODULE_2__.computeIsaAirDensity)(_f16Profile__WEBPACK_IMPORTED_MODULE_4__.F16_PROFILE.cruiseAltitudeM) * Math.pow(_f16Profile__WEBPACK_IMPORTED_MODULE_4__.F16_PROFILE.cruiseSpeedMps, 2);
const STALL_AOA = _f16Profile__WEBPACK_IMPORTED_MODULE_4__.F16_PROFILE.stallAoaDeg * DEG;
const MIN_FLYING_SPEED = _f16Profile__WEBPACK_IMPORTED_MODULE_4__.F16_PROFILE.minFlyingSpeedMps;
const GEAR_POINTS = [
    [0.0, -_defs__WEBPACK_IMPORTED_MODULE_0__.PLANE_DISTANCE_TO_GROUND, 2.6],
    [-1.2, -_defs__WEBPACK_IMPORTED_MODULE_0__.PLANE_DISTANCE_TO_GROUND, -0.6],
    [1.2, -_defs__WEBPACK_IMPORTED_MODULE_0__.PLANE_DISTANCE_TO_GROUND, -0.6],
];
const GEAR_STIFFNESS = 4.0e6;
const GEAR_DAMPING = 1.6e5;
const GEAR_ROLL_FRICTION = 0.04;
const GEAR_BRAKE_FRICTION = 0.55;
const GEAR_SIDE_FRICTION = 0.8;
const LANDING_MAX_SPEED = _f16Profile__WEBPACK_IMPORTED_MODULE_4__.F16_PROFILE.landingMaxSpeedMps;
const LANDING_MAX_VSPEED = _f16Profile__WEBPACK_IMPORTED_MODULE_4__.F16_PROFILE.landingMaxVerticalSpeedMps;
const LANDING_MIN_PITCH = _f16Profile__WEBPACK_IMPORTED_MODULE_4__.F16_PROFILE.landingMinPitchDeg * DEG;
const LANDING_MAX_ROLL = _f16Profile__WEBPACK_IMPORTED_MODULE_4__.F16_PROFILE.landingMaxRollDeg * DEG;
class Fm2FlightModel extends _flightModel__WEBPACK_IMPORTED_MODULE_9__.FlightModel {
    constructor() {
        super();
        this.rb = new _fm2_rigidBody__WEBPACK_IMPORTED_MODULE_8__.RigidBody(_fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_7__.FM2_GEOMETRY.massKg, {
            x: _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_7__.FM2_INERTIA.pitch,
            y: _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_7__.FM2_INERTIA.yaw,
            z: _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_7__.FM2_INERTIA.roll,
        });
        this.fcs = new _fm2_f16Fcs__WEBPACK_IMPORTED_MODULE_6__.F16Fcs();
        this.wingLeft = new _fm2_aeroSurface__WEBPACK_IMPORTED_MODULE_5__.AeroSurface(_fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_7__.FM2_SURFACES.wingLeft);
        this.wingRight = new _fm2_aeroSurface__WEBPACK_IMPORTED_MODULE_5__.AeroSurface(_fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_7__.FM2_SURFACES.wingRight);
        this.htailLeft = new _fm2_aeroSurface__WEBPACK_IMPORTED_MODULE_5__.AeroSurface(_fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_7__.FM2_SURFACES.htailLeft);
        this.htailRight = new _fm2_aeroSurface__WEBPACK_IMPORTED_MODULE_5__.AeroSurface(_fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_7__.FM2_SURFACES.htailRight);
        this.vtail = new _fm2_aeroSurface__WEBPACK_IMPORTED_MODULE_5__.AeroSurface(_fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_7__.FM2_SURFACES.vtail);
        this.stall = -1;
        this.velBody = new three__WEBPACK_IMPORTED_MODULE_10__.Vector3();
        this.forceBody = new three__WEBPACK_IMPORTED_MODULE_10__.Vector3();
        this.momentBody = new three__WEBPACK_IMPORTED_MODULE_10__.Vector3();
        this.forceWorld = new three__WEBPACK_IMPORTED_MODULE_10__.Vector3();
        this.gearForceWorld = new three__WEBPACK_IMPORTED_MODULE_10__.Vector3();
        this.gearMomentBody = new three__WEBPACK_IMPORTED_MODULE_10__.Vector3();
        this.invOrient = new three__WEBPACK_IMPORTED_MODULE_10__.Quaternion();
        this._up = new three__WEBPACK_IMPORTED_MODULE_10__.Vector3();
        this._fwd = new three__WEBPACK_IMPORTED_MODULE_10__.Vector3();
        this._right = new three__WEBPACK_IMPORTED_MODULE_10__.Vector3();
        this._v = new three__WEBPACK_IMPORTED_MODULE_10__.Vector3();
        this._v2 = new three__WEBPACK_IMPORTED_MODULE_10__.Vector3();
        this._gearWorld = new three__WEBPACK_IMPORTED_MODULE_10__.Vector3();
        this._contactVel = new three__WEBPACK_IMPORTED_MODULE_10__.Vector3();
        this._omegaWorld = new three__WEBPACK_IMPORTED_MODULE_10__.Vector3();
        this._friction = new three__WEBPACK_IMPORTED_MODULE_10__.Vector3();
        this.obj.up.copy(_utils_math__WEBPACK_IMPORTED_MODULE_1__.UP);
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
        const airDensity = (0,_aeroUtils__WEBPACK_IMPORTED_MODULE_2__.computeAirDensity)(altitude);
        this.invOrient.copy(this.rb.orientation).invert();
        this.velBody.copy(this.rb.velocityWorld).applyQuaternion(this.invOrient);
        const speed = this.velBody.length();
        const aoa = speed > 1 ? Math.atan2(-this.velBody.y, this.velBody.z) : 0;
        this.angleOfAttackRad = aoa;
        const dynamicPressure = (0,_aeroUtils__WEBPACK_IMPORTED_MODULE_2__.computeDynamicPressure)(airDensity, speed);
        const mach = (0,_aeroUtils__WEBPACK_IMPORTED_MODULE_2__.computeMachNumber)(speed, altitude);
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
        const camber = this.flapsExtended ? _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_7__.FM2_FLAPS.aoaBiasRad : 0;
        const stallShift = this.flapsExtended ? _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_7__.FM2_FLAPS.stallReductionRad : 0;
        const wingExtraCd = this.flapsExtended ? _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_7__.FM2_FLAPS.extraCd : 0;
        this.accumulateSurface(this.wingLeft, controls.wingLeftAoa, camber, stallShift, wingExtraCd, airDensity);
        this.accumulateSurface(this.wingRight, controls.wingRightAoa, camber, stallShift, wingExtraCd, airDensity);
        this.accumulateSurface(this.htailLeft, controls.htailLeftAoa, 0, 0, 0, airDensity);
        this.accumulateSurface(this.htailRight, controls.htailRightAoa, 0, 0, 0, airDensity);
        this.accumulateSurface(this.vtail, controls.vtailAoa, 0, 0, 0, airDensity);
        this.addBodyDrag(dynamicPressure, speed, mach);
        const thrustN = (0,_f16Engine__WEBPACK_IMPORTED_MODULE_3__.computeF16EngineThrustN)(this.effectiveThrottle, altitude);
        this.engineThrustN = thrustN;
        this.forceBody.z += thrustN;
        this.computeGearForces();
        const gearBodyUpY = this._v.copy(this.gearForceWorld).applyQuaternion(this.invOrient).y;
        this.loadFactorG = (this.forceBody.y + gearBodyUpY) / (_fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_7__.FM2_GEOMETRY.massKg * GRAVITY);
        this.momentBody.add(this.gearMomentBody);
        this.rb.integrateAngular(this.momentBody, delta);
        this.forceWorld.copy(this.forceBody).applyQuaternion(this.rb.orientation);
        this.forceWorld.add(this.gearForceWorld);
        this.forceWorld.y -= _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_7__.FM2_GEOMETRY.massKg * GRAVITY;
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
        const taileronAoa = aileron * _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_7__.FM2_FCS.taileronRollFraction * MAX_STABILATOR_AOA;
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
        let cd0 = _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_7__.FM2_BODY_CD0 + (this.landingGearDeployed ? _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_7__.FM2_GEAR_CD : 0);
        if (mach > _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_7__.FM2_WAVE_DRAG.machOnset) {
            const excess = (mach - _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_7__.FM2_WAVE_DRAG.machOnset) / _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_7__.FM2_WAVE_DRAG.machOnset;
            cd0 += _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_7__.FM2_WAVE_DRAG.scale * excess * excess;
        }
        const dragN = dynamicPressure * _fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_7__.FM2_GEOMETRY.wingAreaM2 * cd0;
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
        this._fwd.copy(_utils_math__WEBPACK_IMPORTED_MODULE_1__.FORWARD).applyQuaternion(this.rb.orientation);
        const fwx = this._fwd.x, fwz = this._fwd.z;
        const fwLen = Math.hypot(fwx, fwz) || 1;
        const vh = Math.hypot(vhx, vhz) || 1;
        const along = Math.abs((vhx * fwx + vhz * fwz) / (fwLen * vh));
        return (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.clamp)(1 - along, 0, 1);
    }
    updateStallState(speed, aoa, altitude) {
        if (this.landed) {
            this.stall = -1;
            return;
        }
        const aoaStall = speed > 5 ? (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.clamp)((Math.abs(aoa) - STALL_AOA * 0.85) / (STALL_AOA * 0.3), 0, 1) : 0;
        const speedStall = altitude > _defs__WEBPACK_IMPORTED_MODULE_0__.PLANE_DISTANCE_TO_GROUND + 5
            ? (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.clamp)((MIN_FLYING_SPEED - speed) / MIN_FLYING_SPEED, 0, 1) : 0;
        const level = Math.max(aoaStall, speedStall);
        this.stall = level > 0 ? level : -1;
    }
    handleGroundState() {
        const onGround = this.obj.position.y <= _defs__WEBPACK_IMPORTED_MODULE_0__.PLANE_DISTANCE_TO_GROUND + 0.25;
        if (this.obj.position.y > _defs__WEBPACK_IMPORTED_MODULE_0__.PLANE_DISTANCE_TO_GROUND + 0.3) {
            this.landed = false;
        }
        const minY = _defs__WEBPACK_IMPORTED_MODULE_0__.PLANE_DISTANCE_TO_GROUND - 0.6;
        if (this.obj.position.y < minY) {
            this.obj.position.y = minY;
            if (this.velocity.y < 0)
                this.velocity.y = 0;
        }
        if (!onGround)
            return;
        this._fwd.copy(_utils_math__WEBPACK_IMPORTED_MODULE_1__.FORWARD).applyQuaternion(this.rb.orientation);
        this._right.copy(_utils_math__WEBPACK_IMPORTED_MODULE_1__.RIGHT).applyQuaternion(this.rb.orientation);
        const speed = this.velocity.length();
        const pitchAngle = Math.asin((0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.clamp)(this._fwd.y, -1, 1));
        const rollAngle = Math.asin((0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.clamp)(this._right.y, -1, 1));
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
        const h = 2.5 * _defs__WEBPACK_IMPORTED_MODULE_0__.TERRAIN_SCALE * _defs__WEBPACK_IMPORTED_MODULE_0__.TERRAIN_MODEL_SIZE;
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
    getThrottleHudText() { return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_3__.formatF16ThrottleHud)(this.throttle); }
    useF16ThrottleDetents() { return true; }
    stepThrottleDetent(current, direction) { return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_3__.stepF16ThrottleDetent)(current, direction); }
    isInThrottleAbDetentBand(lever) { return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_3__.isF16AbDetentBand)(lever); }
    adjustThrottleInput(current, step) { return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_3__.adjustF16ThrottleInput)(current, step); }
    getThrottleZone() { return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_3__.getF16ThrottleZone)(this.effectiveThrottle); }
    getThrottleAudioLevel() { return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_3__.f16ThrottleAudioLevel)(this.effectiveThrottle); }
    getEngineNozzleColor() { return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_3__.getF16EngineNozzleColor)(this.effectiveThrottle); }
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
/* harmony import */ var three__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! three */ "./node_modules/three/build/three.module.js");
/* harmony import */ var _defs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../defs */ "./src/script/defs.ts");
/* harmony import */ var _utils_math__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/math */ "./src/script/utils/math.ts");
/* harmony import */ var _aeroUtils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../aeroUtils */ "./src/script/physics/aeroUtils.ts");
/* harmony import */ var _f16Engine__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../f16Engine */ "./src/script/physics/f16Engine.ts");
/* harmony import */ var _f16Profile__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../f16Profile */ "./src/script/physics/f16Profile.ts");
/* harmony import */ var _flightModel__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./flightModel */ "./src/script/physics/model/flightModel.ts");







const THROTTLE_UP_RATE = 0.10;
const THROTTLE_DOWN_RATE = 0.07;
const YAW_RATE_LANDED = _defs__WEBPACK_IMPORTED_MODULE_0__.YAW_RATE * 2.0;
const DRY_MASS = _f16Profile__WEBPACK_IMPORTED_MODULE_4__.F16_PROFILE.simMassKg;
const WING_AREA = _f16Profile__WEBPACK_IMPORTED_MODULE_4__.F16_PROFILE.wingAreaM2;
const CD0 = _f16Profile__WEBPACK_IMPORTED_MODULE_4__.F16_PROFILE.cd0;
const INDUCED_DRAG_K = _f16Profile__WEBPACK_IMPORTED_MODULE_4__.F16_PROFILE.inducedDragK;
const CL0 = _f16Profile__WEBPACK_IMPORTED_MODULE_4__.F16_PROFILE.cl0;
const CL_ALPHA = _f16Profile__WEBPACK_IMPORTED_MODULE_4__.F16_PROFILE.clAlphaPerRad;
const STALL_AOA = _f16Profile__WEBPACK_IMPORTED_MODULE_4__.F16_PROFILE.stallAoaDeg * Math.PI / 180;
const MAX_CL = 1.48;
const Q_REF = 0.5 * (0,_aeroUtils__WEBPACK_IMPORTED_MODULE_2__.computeIsaAirDensity)(_f16Profile__WEBPACK_IMPORTED_MODULE_4__.F16_PROFILE.cruiseAltitudeM) * Math.pow(_f16Profile__WEBPACK_IMPORTED_MODULE_4__.F16_PROFILE.cruiseSpeedMps, 2);
const MIN_CONTROL_Q = 0.12;
const MAX_CONTROL_Q = 2.2;
const MIN_FLYING_SPEED = _f16Profile__WEBPACK_IMPORTED_MODULE_4__.F16_PROFILE.minFlyingSpeedMps;
const CD_LANDING_GEAR = 0.035;
const CD_FLAPS = 0.08;
const CL_FLAPS_FACTOR = 1.25;
const GROUND_FRICTION_KINETIC = 0.15;
const GROUND_FRICTION_STATIC = 0.2;
const GROUND_BRAKE_KINETIC = 1.8;
const GROUND_BRAKE_STATIC = 1.17;
const LANDED_MAX_SPEED = _f16Profile__WEBPACK_IMPORTED_MODULE_4__.F16_PROFILE.landingMaxSpeedMps;
const LANDING_MAX_VSPEED = _f16Profile__WEBPACK_IMPORTED_MODULE_4__.F16_PROFILE.landingMaxVerticalSpeedMps;
const LANDING_MIN_PITCH = _f16Profile__WEBPACK_IMPORTED_MODULE_4__.F16_PROFILE.landingMinPitchDeg * _utils_math__WEBPACK_IMPORTED_MODULE_1__.PI_OVER_180;
const LANDING_MAX_ROLL = _f16Profile__WEBPACK_IMPORTED_MODULE_4__.F16_PROFILE.landingMaxRollDeg * _utils_math__WEBPACK_IMPORTED_MODULE_1__.PI_OVER_180;
const ROTATION_SPEED = _f16Profile__WEBPACK_IMPORTED_MODULE_4__.F16_PROFILE.rotationSpeedMps;
function computeCl(aoa, flapsExtended) {
    const flapBoost = flapsExtended ? CL_FLAPS_FACTOR : 1.0;
    const stallAoa = flapsExtended ? STALL_AOA * 1.1 : STALL_AOA;
    const maxCl = MAX_CL * flapBoost;
    if (Math.abs(aoa) <= stallAoa) {
        return (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.clamp)(CL0 + CL_ALPHA * aoa * flapBoost, -maxCl * 0.35, maxCl);
    }
    const peakCl = (CL0 + CL_ALPHA * stallAoa * Math.sign(aoa)) * flapBoost;
    return peakCl * Math.max(0, Math.cos((Math.abs(aoa) - stallAoa) * 4.0));
}
function computePitchSpeedAuthority(speed, landed) {
    let a = (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.clamp)(speed / MIN_FLYING_SPEED, 0, 1);
    if (landed && speed < ROTATION_SPEED)
        a *= (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.clamp)(speed / ROTATION_SPEED, 0, 1);
    return a;
}
class RealisticFlightModel extends _flightModel__WEBPACK_IMPORTED_MODULE_5__.FlightModel {
    constructor() {
        super();
        this.stall = -1;
        this.forward = new three__WEBPACK_IMPORTED_MODULE_6__.Vector3();
        this.up = new three__WEBPACK_IMPORTED_MODULE_6__.Vector3();
        this.right = new three__WEBPACK_IMPORTED_MODULE_6__.Vector3();
        this.velocityUnit = new three__WEBPACK_IMPORTED_MODULE_6__.Vector3();
        this.thrust = new three__WEBPACK_IMPORTED_MODULE_6__.Vector3();
        this.drag = new three__WEBPACK_IMPORTED_MODULE_6__.Vector3();
        this.lift = new three__WEBPACK_IMPORTED_MODULE_6__.Vector3();
        this.friction = new three__WEBPACK_IMPORTED_MODULE_6__.Vector3();
        this.forces = new three__WEBPACK_IMPORTED_MODULE_6__.Vector3();
        this._v = new three__WEBPACK_IMPORTED_MODULE_6__.Vector3();
        this._v2 = new three__WEBPACK_IMPORTED_MODULE_6__.Vector3();
        this.obj.up.copy(_utils_math__WEBPACK_IMPORTED_MODULE_1__.UP);
    }
    reset() {
        super.reset();
        this.stall = -1;
    }
    step(delta) {
        if (this.crashed)
            return;
        this.effectiveThrottle = this.throttle > this.effectiveThrottle
            ? Math.min(this.throttle, this.effectiveThrottle + THROTTLE_UP_RATE * delta)
            : Math.max(this.throttle, this.effectiveThrottle - THROTTLE_DOWN_RATE * delta);
        const altitude = this.obj.position.y;
        const speed = this.velocity.length();
        const dynamicPressure = (0,_aeroUtils__WEBPACK_IMPORTED_MODULE_2__.computeDynamicPressure)((0,_aeroUtils__WEBPACK_IMPORTED_MODULE_2__.computeAirDensity)(altitude), speed);
        const controlScale = (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.clamp)(dynamicPressure / Q_REF, MIN_CONTROL_Q, MAX_CONTROL_Q);
        this.forward.copy(_utils_math__WEBPACK_IMPORTED_MODULE_1__.FORWARD).applyQuaternion(this.obj.quaternion);
        this.up.copy(_utils_math__WEBPACK_IMPORTED_MODULE_1__.UP).applyQuaternion(this.obj.quaternion);
        this.right.copy(_utils_math__WEBPACK_IMPORTED_MODULE_1__.RIGHT).applyQuaternion(this.obj.quaternion);
        const aoa = speed > 1.0
            ? (0,_aeroUtils__WEBPACK_IMPORTED_MODULE_2__.computeAngleOfAttack)(this.forward, this.right, this.velocity, this._v)
            : 0;
        this.angleOfAttackRad = aoa;
        this.updateStallState(speed, aoa, altitude);
        if (!this.landed)
            this.obj.rotateZ(this.roll * _defs__WEBPACK_IMPORTED_MODULE_0__.ROLL_RATE * delta);
        const pitchAuthority = this.stall >= 0 ? 0.35 : 1.0;
        if (!(this.landed && this.pitch < 0)
            && (this.stall < 0 || (this.pitch < 0 && this.up.y > 0) || (this.pitch > 0 && this.up.y < 0))) {
            this.obj.rotateX(-this.pitch * _defs__WEBPACK_IMPORTED_MODULE_0__.PITCH_RATE * controlScale * pitchAuthority
                * computePitchSpeedAuthority(speed, this.landed) * delta);
        }
        if (this.forward.y > 0.001 && this.pitch <= 0 && (this.stall > 0 || this.landed)) {
            this._v2.crossVectors(this.forward, this._v.set(0, -1, 0)).normalize();
            const pitchAngle = Math.asin((0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.clamp)(this.forward.y, -1, 1));
            this.obj.rotateOnWorldAxis(this._v2, Math.min(pitchAngle, (this.landed ? 0.5 : this.stall * 0.6) * delta));
        }
        if (!(0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.isZero)(speed)) {
            this.obj.rotateY(-this.yaw * (this.landed ? YAW_RATE_LANDED : _defs__WEBPACK_IMPORTED_MODULE_0__.YAW_RATE) * delta);
        }
        this.forward.copy(_utils_math__WEBPACK_IMPORTED_MODULE_1__.FORWARD).applyQuaternion(this.obj.quaternion);
        this.up.copy(_utils_math__WEBPACK_IMPORTED_MODULE_1__.UP).applyQuaternion(this.obj.quaternion);
        this.right.copy(_utils_math__WEBPACK_IMPORTED_MODULE_1__.RIGHT).applyQuaternion(this.obj.quaternion);
        const cl = computeCl(aoa, this.flapsExtended);
        const cd = CD0 + INDUCED_DRAG_K * cl * cl
            + (this.landingGearDeployed ? CD_LANDING_GEAR : 0)
            + (this.flapsExtended ? CD_FLAPS : 0);
        const thrustN = (0,_f16Engine__WEBPACK_IMPORTED_MODULE_3__.computeF16EngineThrustN)(this.effectiveThrottle, altitude);
        (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.roundToZero)(this.thrust.copy(this.forward).multiplyScalar(thrustN));
        this.engineThrustN = thrustN;
        if (speed > 0.5) {
            this.velocityUnit.copy(this.velocity).multiplyScalar(1 / speed);
            (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.roundToZero)(this.drag.copy(this.velocityUnit).negate().multiplyScalar(dynamicPressure * WING_AREA * cd));
            (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.roundToZero)(this.lift.copy(this.up).multiplyScalar(dynamicPressure * WING_AREA * cl));
        }
        else {
            this.drag.set(0, 0, 0);
            this.lift.set(0, 0, 0);
        }
        this.forces.set(0, -DRY_MASS * 9.80665, 0).add(this.thrust).add(this.drag).add(this.lift);
        if (this.landed || (this.wheelBrakesApplied && this.obj.position.y <= _defs__WEBPACK_IMPORTED_MODULE_0__.PLANE_DISTANCE_TO_GROUND + 0.05)) {
            const W = DRY_MASS * 9.80665;
            const kinetic = (this.wheelBrakesApplied ? GROUND_BRAKE_KINETIC : GROUND_FRICTION_KINETIC) * W;
            const prjF = this._v.copy(this.forces).setY(0);
            if ((0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.isZero)(speed) && prjF.length() < (this.wheelBrakesApplied ? GROUND_BRAKE_STATIC : GROUND_FRICTION_STATIC) * W) {
                this.friction.copy(prjF).negate();
            }
            else {
                this.friction.copy(this.velocityUnit).setY(0).negate().normalize().multiplyScalar(kinetic);
            }
            (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.roundToZero)(this.friction);
        }
        else {
            this.friction.set(0, 0, 0);
        }
        this.forces.add(this.friction);
        if (this.landed && this.forces.y < 0)
            this.forces.setY(0);
        const accel = (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.roundToZero)(this.forces.divideScalar(DRY_MASS));
        this.loadFactorG = (0,_aeroUtils__WEBPACK_IMPORTED_MODULE_2__.computeLoadFactorG)(accel, this.up);
        this.velocity.addScaledVector(accel, delta);
        if (this.landed && this.velocity.y < 0)
            this.velocity.setY(0);
        this.obj.position.addScaledVector(this.landed ? (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.roundToZero)(this.velocity, 0.0001) : this.velocity, delta);
        if (this.obj.position.y > _defs__WEBPACK_IMPORTED_MODULE_0__.PLANE_DISTANCE_TO_GROUND + 0.01)
            this.landed = false;
        this.handleGroundContact(speed);
        this.wrapPosition();
    }
    getStallStatus() { return this.stall; }
    getThrottleHudText() { return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_3__.formatF16ThrottleHud)(this.throttle); }
    useF16ThrottleDetents() { return true; }
    stepThrottleDetent(current, direction) { return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_3__.stepF16ThrottleDetent)(current, direction); }
    isInThrottleAbDetentBand(lever) { return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_3__.isF16AbDetentBand)(lever); }
    adjustThrottleInput(current, step) { return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_3__.adjustF16ThrottleInput)(current, step); }
    getThrottleZone() { return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_3__.getF16ThrottleZone)(this.effectiveThrottle); }
    getThrottleAudioLevel() { return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_3__.f16ThrottleAudioLevel)(this.effectiveThrottle); }
    getEngineNozzleColor() { return (0,_f16Engine__WEBPACK_IMPORTED_MODULE_3__.getF16EngineNozzleColor)(this.effectiveThrottle); }
    updateStallState(speed, aoa, altitude) {
        if (this.landed) {
            this.stall = -1;
            return;
        }
        const aoaStall = speed > 5 ? (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.clamp)((Math.abs(aoa) - STALL_AOA * 0.75) / (STALL_AOA * 0.35), 0, 1) : 0;
        const speedStall = (0,_utils_math__WEBPACK_IMPORTED_MODULE_1__.clamp)((MIN_FLYING_SPEED - speed) / MIN_FLYING_SPEED, 0, 1);
        const level = Math.max(aoaStall, altitude > _defs__WEBPACK_IMPORTED_MODULE_0__.PLANE_DISTANCE_TO_GROUND + 5 ? speedStall : 0);
        this.stall = level > 0 ? level : -1;
    }
    handleGroundContact(speed) {
        if (this.obj.position.y >= _defs__WEBPACK_IMPORTED_MODULE_0__.PLANE_DISTANCE_TO_GROUND)
            return;
        this.obj.position.y = _defs__WEBPACK_IMPORTED_MODULE_0__.PLANE_DISTANCE_TO_GROUND;
        this.forward.copy(_utils_math__WEBPACK_IMPORTED_MODULE_1__.FORWARD).applyQuaternion(this.obj.quaternion);
        this.right.copy(_utils_math__WEBPACK_IMPORTED_MODULE_1__.RIGHT).applyQuaternion(this.obj.quaternion);
        const prjFwd = this._v.copy(this.forward).setY(0).normalize();
        const prjRight = this._v2.copy(this.right).setY(0).normalize();
        if (!this.landingGearDeployed
            || speed > LANDED_MAX_SPEED
            || this.velocity.y < -LANDING_MAX_VSPEED
            || this.right.angleTo(prjRight) * Math.sign(this.right.y) > LANDING_MAX_ROLL
            || LANDING_MIN_PITCH > this.forward.angleTo(prjFwd) * Math.sign(this.forward.y)) {
            this.crashed = true;
            return;
        }
        if (this.forward.y < 0)
            this.obj.quaternion.setFromUnitVectors(_utils_math__WEBPACK_IMPORTED_MODULE_1__.FORWARD, prjFwd);
        this.velocity.setY(0);
        this.stall = -1;
        this.landed = true;
    }
    wrapPosition() {
        const h = 2.5 * _defs__WEBPACK_IMPORTED_MODULE_0__.TERRAIN_SCALE * _defs__WEBPACK_IMPORTED_MODULE_0__.TERRAIN_MODEL_SIZE;
        if (this.obj.position.x > h)
            this.obj.position.x = -h;
        if (this.obj.position.x < -h)
            this.obj.position.x = h;
        if (this.obj.position.z > h)
            this.obj.position.z = -h;
        if (this.obj.position.z < -h)
            this.obj.position.z = h;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3JjX3NjcmlwdF9waHlzaWNzX3dvcmtlcl9mbGlnaHRXb3JrZXJfdHMuYnVuZGxlLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDTyxNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFFbkIsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDO0FBQ3JCLE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQztBQUNyQixNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUM7QUFDckIsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDO0FBRXJCLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQztBQUNsQixNQUFNLEtBQUssR0FBRyxHQUFHLENBQUM7QUFDbEIsTUFBTSxVQUFVLEdBQUcsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUM3QixNQUFNLFVBQVUsR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBRTdCLE1BQU0sYUFBYSxHQUFHLEtBQUssQ0FBQztBQUM1QixNQUFNLGtCQUFrQixHQUFHLEtBQUssQ0FBQztBQUVqQyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUMvQixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUM5QixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztBQUM5QixNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUM7QUFDeEIsTUFBTSxhQUFhLEdBQUcsRUFBRSxDQUFDO0FBQ3pCLE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQztBQUN2QixNQUFNLHdCQUF3QixHQUFHLEdBQUcsQ0FBQztBQUNyQyxNQUFNLHNCQUFzQixHQUFHLEdBQUcsQ0FBQztBQUNuQyxNQUFNLHNCQUFzQixHQUFHLEdBQUcsQ0FBQztBQUNuQyxNQUFNLFlBQVksR0FBRyxLQUFLLENBQUM7QUFFM0IsTUFBTSxXQUFXLEdBQUcsRUFBRSxDQUFDO0FB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Q0FBd0M7V0FDakY7V0FDQTtXQUNBOzs7OztXQ1BBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EsRUFBRTtXQUNGOzs7OztXQ1JBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7Ozs7O1dDSkE7V0FDQTtXQUNBO1dBQ0E7V0FDQSxHQUFHO1dBQ0g7V0FDQTtXQUNBLENBQUM7Ozs7O1dDUEQ7Ozs7O1dDQUE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdEOzs7OztXQ05BO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBOzs7OztXQ2ZBOztXQUVBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7O1dBRUE7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQSxhQUFhO1dBQ2I7V0FDQTtXQUNBO1dBQ0E7O1dBRUE7V0FDQTtXQUNBOztXQUVBOztXQUVBOzs7OztXQ3BDQTtXQUNBO1dBQ0E7V0FDQTs7Ozs7VUVIQTtVQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vLi9zcmMvc2NyaXB0L2RlZnMudHMiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vLi9zcmMvc2NyaXB0L3BoeXNpY3MvYWVyb1V0aWxzLnRzIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltLy4vc3JjL3NjcmlwdC9waHlzaWNzL2YxNkVuZ2luZS50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy9mMTZQYXBlckRhdGEudHMiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vLi9zcmMvc2NyaXB0L3BoeXNpY3MvZjE2UHJvZmlsZS50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy9mMTZSb2xsQ29udHJvbC50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy9mbTIvYWVyb1N1cmZhY2UudHMiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vLi9zcmMvc2NyaXB0L3BoeXNpY3MvZm0yL2YxNkZjcy50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy9mbTIvZjE2Rm0yQ29uZmlnLnRzIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltLy4vc3JjL3NjcmlwdC9waHlzaWNzL2ZtMi9yaWdpZEJvZHkudHMiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vLi9zcmMvc2NyaXB0L3BoeXNpY3MvbW9kZWwvYXJjYWRlRmxpZ2h0TW9kZWwudHMiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vLi9zcmMvc2NyaXB0L3BoeXNpY3MvbW9kZWwvZGVidWdGbGlnaHRNb2RlbC50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy9tb2RlbC9mbGlnaHRNb2RlbC50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy9tb2RlbC9mbTJGbGlnaHRNb2RlbC50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy9tb2RlbC9yZWFsaXN0aWNGbGlnaHRNb2RlbC50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy93b3JrZXIvZmxpZ2h0V29ya2VyLnRzIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltLy4vc3JjL3NjcmlwdC91dGlscy9tYXRoLnRzIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svcnVudGltZS9jaHVuayBsb2FkZWQiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svcnVudGltZS9lbnN1cmUgY2h1bmsiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vd2VicGFjay9ydW50aW1lL2dldCBqYXZhc2NyaXB0IGNodW5rIGZpbGVuYW1lIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svcnVudGltZS9nbG9iYWwiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svcnVudGltZS9wdWJsaWNQYXRoIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svcnVudGltZS9pbXBvcnRTY3JpcHRzIGNodW5rIGxvYWRpbmciLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vd2VicGFjay9ydW50aW1lL3N0YXJ0dXAgY2h1bmsgZGVwZW5kZW5jaWVzIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svYmVmb3JlLXN0YXJ0dXAiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vd2VicGFjay9zdGFydHVwIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svYWZ0ZXItc3RhcnR1cCJdLCJzb3VyY2VzQ29udGVudCI6WyJcbmV4cG9ydCBjb25zdCBGUFNfQ0FQID0gMTU7IC8vIEZQU1xuXG5leHBvcnQgY29uc3QgTE9fSF9SRVMgPSAzMjA7XG5leHBvcnQgY29uc3QgTE9fVl9SRVMgPSAyMDA7XG5leHBvcnQgY29uc3QgSElfSF9SRVMgPSA2NDA7XG5leHBvcnQgY29uc3QgSElfVl9SRVMgPSA0MDA7XG5cbmV4cG9ydCBjb25zdCBIX1JFUyA9IDMyMDtcbmV4cG9ydCBjb25zdCBWX1JFUyA9IDIwMDtcbmV4cG9ydCBjb25zdCBIX1JFU19IQUxGID0gSF9SRVMgLyAyO1xuZXhwb3J0IGNvbnN0IFZfUkVTX0hBTEYgPSBWX1JFUyAvIDI7XG5cbmV4cG9ydCBjb25zdCBURVJSQUlOX1NDQUxFID0gMjAwLjA7XG5leHBvcnQgY29uc3QgVEVSUkFJTl9NT0RFTF9TSVpFID0gMTAwLjA7XG5cbmV4cG9ydCBjb25zdCBQSVRDSF9SQVRFID0gTWF0aC5QSSAvIDU7IC8vIFJhZGlhbnMvc1xuZXhwb3J0IGNvbnN0IFJPTExfUkFURSA9IE1hdGguUEkgLyAyOyAvLyBSYWRpYW5zL3MgKHdhcyDPgC8zLCArNTAlKVxuZXhwb3J0IGNvbnN0IFlBV19SQVRFID0gTWF0aC5QSSAvIDEyOyAvLyBSYWRpYW5zL3NcbmV4cG9ydCBjb25zdCBNQVhfU1BFRUQgPSAyNTAuMDsgLy8gV29ybGQgdW5pdHMvc1xuZXhwb3J0IGNvbnN0IFRIUk9UVExFX1JBVEUgPSAzMzsgLy8gUGVyY2VudGFnZSBvZiBtYXhpbXVtL3MgWzAsMTAwXVxuZXhwb3J0IGNvbnN0IFNUSUNLX1JBVEUgPSAxLjU7IC8vIEZ1bGwgc3RpY2sgZGVmbGVjdGlvbiBwZXIgc2Vjb25kXG5leHBvcnQgY29uc3QgUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5EID0gMi4wOyAvLyBXb3JsZCB1bml0c1xuZXhwb3J0IGNvbnN0IFBMQU5FX0NPQ0tQSVRfT0ZGU0VUX1kgPSAxLjA7IC8vIFdvcmxkIHVuaXRzXG5leHBvcnQgY29uc3QgUExBTkVfQ09DS1BJVF9PRkZTRVRfWiA9IDguMDsgLy8gV29ybGQgdW5pdHNcbmV4cG9ydCBjb25zdCBNQVhfQUxUSVRVREUgPSAxNDAwMDsgLy8gV29ybGQgdW5pdHNcblxuZXhwb3J0IGNvbnN0IENPQ0tQSVRfRk9WID0gNTA7XG5leHBvcnQgY29uc3QgQ09DS1BJVF9GQVIgPSA0MDAwMDtcblxuZXhwb3J0IGNvbnN0IEdST1VORF9TTU9LRV9QQVJUSUNMRV9DT1VOVCA9IDEwMDtcblxuZXhwb3J0IGNvbnN0IEFJUkJBU0VfUlVOV0FZID0geyB4OiAxNTAwLCB5OiAwLCB6OiAtODAwIH07XG5leHBvcnQgY29uc3QgUlVOV0FZX0hBTEZfTEVOR1RIX00gPSAxNTAwO1xuZXhwb3J0IGNvbnN0IEFQUFJPQUNIX0FMVElUVURFX00gPSA1MDA7XG5leHBvcnQgY29uc3QgQVBQUk9BQ0hfU1BFRURfS01IID0gMzAwO1xuZXhwb3J0IGNvbnN0IEFQUFJPQUNIX1NQRUVEX01QUyA9IEFQUFJPQUNIX1NQRUVEX0tNSCAvIDMuNjtcbmV4cG9ydCBjb25zdCBBUFBST0FDSF9GSU5BTF9ESVNUQU5DRV9NID0gNTAwMDtcbiIsImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcblxuY29uc3QgR1JBVklUWSA9IDkuODtcblxuZXhwb3J0IGNvbnN0IEdST1VORF9BSVJfREVOU0lUWSA9IDEuMjI1OyAvLyBrZy9twrMgYXQgc2VhIGxldmVsLCBJU0FcbmNvbnN0IFZORV9NQUNIID0gMC45NTsgLy8gdHJhbnNvbmljIGRyYWcgcmlzZSBvbnNldCAoc2ltIG9ubHk7IHBhcGVyIGvigoIgPSAwKVxuXG5jb25zdCBJU0FfU0VBX0xFVkVMX1BSRVNTVVJFID0gMTAxMzI1OyAvLyBQYVxuY29uc3QgSVNBX1NFQV9MRVZFTF9URU1QID0gMjg4LjE1OyAvLyBLXG5jb25zdCBJU0FfTEFQU0VfUkFURSA9IDAuMDA2NTsgLy8gSy9tXG5jb25zdCBJU0FfVFJPUE9QQVVTRV9BTFQgPSAxMTAwMDsgLy8gbVxuY29uc3QgSVNBX1RST1BPUEFVU0VfUFJFU1NVUkUgPSAyMjYzMi4xOyAvLyBQYVxuY29uc3QgSVNBX1RST1BPUEFVU0VfVEVNUCA9IDIxNi42NTsgLy8gS1xuY29uc3QgR1JBVklUWV9JU0EgPSA5LjgwNjY1OyAvLyBtL3PCslxuY29uc3QgR0FTX0NPTlNUQU5UID0gMjg3LjA1MzsgLy8gSi8oa2fCt0spXG5cbi8qKiBJU0EgZGVuc2l0eSAoa2cvbcKzKSDigJQgQW5kZXJzb24tc3R5bGUgcGVyZm9ybWFuY2UgYW5hbHlzaXMgYXRtb3NwaGVyZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlSXNhQWlyRGVuc2l0eShhbHRpdHVkZU1ldGVyczogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBjb25zdCBoID0gTWF0aC5tYXgoMCwgYWx0aXR1ZGVNZXRlcnMpO1xuICAgIGxldCB0ZW1wZXJhdHVyZTogbnVtYmVyO1xuICAgIGxldCBwcmVzc3VyZTogbnVtYmVyO1xuXG4gICAgaWYgKGggPD0gSVNBX1RST1BPUEFVU0VfQUxUKSB7XG4gICAgICAgIHRlbXBlcmF0dXJlID0gSVNBX1NFQV9MRVZFTF9URU1QIC0gSVNBX0xBUFNFX1JBVEUgKiBoO1xuICAgICAgICBwcmVzc3VyZSA9IElTQV9TRUFfTEVWRUxfUFJFU1NVUkUgKiBNYXRoLnBvdyhcbiAgICAgICAgICAgIHRlbXBlcmF0dXJlIC8gSVNBX1NFQV9MRVZFTF9URU1QLFxuICAgICAgICAgICAgR1JBVklUWV9JU0EgLyAoR0FTX0NPTlNUQU5UICogSVNBX0xBUFNFX1JBVEUpLFxuICAgICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRlbXBlcmF0dXJlID0gSVNBX1RST1BPUEFVU0VfVEVNUDtcbiAgICAgICAgcHJlc3N1cmUgPSBJU0FfVFJPUE9QQVVTRV9QUkVTU1VSRSAqIE1hdGguZXhwKFxuICAgICAgICAgICAgLUdSQVZJVFlfSVNBICogKGggLSBJU0FfVFJPUE9QQVVTRV9BTFQpIC8gKEdBU19DT05TVEFOVCAqIElTQV9UUk9QT1BBVVNFX1RFTVApLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiBwcmVzc3VyZSAvIChHQVNfQ09OU1RBTlQgKiB0ZW1wZXJhdHVyZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlQWlyRGVuc2l0eShhbHRpdHVkZU1ldGVyczogbnVtYmVyKTogbnVtYmVyIHtcbiAgICByZXR1cm4gY29tcHV0ZUlzYUFpckRlbnNpdHkoYWx0aXR1ZGVNZXRlcnMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUR5bmFtaWNQcmVzc3VyZShhaXJEZW5zaXR5OiBudW1iZXIsIHNwZWVkOiBudW1iZXIpOiBudW1iZXIge1xuICAgIHJldHVybiAwLjUgKiBhaXJEZW5zaXR5ICogc3BlZWQgKiBzcGVlZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVUaHJ1c3REZW5zaXR5RmFjdG9yKGFpckRlbnNpdHk6IG51bWJlciwgYWx0aXR1ZGVNZXRlcnMgPSAwKTogbnVtYmVyIHtcbiAgICBjb25zdCBzaWdtYSA9IGFpckRlbnNpdHkgLyBHUk9VTkRfQUlSX0RFTlNJVFk7XG4gICAgY29uc3QgbGFwc2UgPSBNYXRoLnBvdyhzaWdtYSwgMC43KTtcbiAgICBjb25zdCBvcHRpbXVtQWx0aXR1ZGUgPSAxMTAwMDsgLy8gbSwgfkZMMzYwIHRocnVzdC1saW1pdGVkIG9wdGltdW1cbiAgICBjb25zdCBhbHRQZW5hbHR5ID0gYWx0aXR1ZGVNZXRlcnMgPD0gb3B0aW11bUFsdGl0dWRlXG4gICAgICAgID8gMVxuICAgICAgICA6IE1hdGgubWF4KDAuMzUsIDEgLSAoYWx0aXR1ZGVNZXRlcnMgLSBvcHRpbXVtQWx0aXR1ZGUpIC8gOTAwMCk7XG4gICAgcmV0dXJuIGxhcHNlICogYWx0UGVuYWx0eTtcbn1cblxuY29uc3QgR0FNTUEgPSAxLjQ7XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlU3BlZWRPZlNvdW5kKGFsdGl0dWRlTWV0ZXJzOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IHRlbXBlcmF0dXJlID0gTWF0aC5tYXgoSVNBX1RST1BPUEFVU0VfVEVNUCwgSVNBX1NFQV9MRVZFTF9URU1QIC0gSVNBX0xBUFNFX1JBVEUgKiBhbHRpdHVkZU1ldGVycyk7XG4gICAgcmV0dXJuIE1hdGguc3FydChHQU1NQSAqIEdBU19DT05TVEFOVCAqIHRlbXBlcmF0dXJlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVNYWNoTnVtYmVyKHNwZWVkTXBzOiBudW1iZXIsIGFsdGl0dWRlTWV0ZXJzOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IHNwZWVkT2ZTb3VuZCA9IGNvbXB1dGVTcGVlZE9mU291bmQoYWx0aXR1ZGVNZXRlcnMpO1xuICAgIGlmIChzcGVlZE9mU291bmQgPD0gMCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgcmV0dXJuIHNwZWVkTXBzIC8gc3BlZWRPZlNvdW5kO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUR5bmFtaWNQcmVzc3VyZURyYWdQZW5hbHR5KHNwZWVkTXBzOiBudW1iZXIsIGFsdGl0dWRlTWV0ZXJzOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IHNwZWVkT2ZTb3VuZCA9IGNvbXB1dGVTcGVlZE9mU291bmQoYWx0aXR1ZGVNZXRlcnMpO1xuICAgIGlmIChzcGVlZE9mU291bmQgPD0gMCB8fCBzcGVlZE1wcyA8PSAwKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBjb25zdCBtYWNoID0gc3BlZWRNcHMgLyBzcGVlZE9mU291bmQ7XG4gICAgaWYgKG1hY2ggPD0gVk5FX01BQ0gpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGNvbnN0IGV4Y2VzcyA9IChtYWNoIC0gVk5FX01BQ0gpIC8gVk5FX01BQ0g7XG4gICAgcmV0dXJuIDAuNTUgKiBleGNlc3MgKiBleGNlc3M7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlTWF4RXF1aWxpYnJpdW1TcGVlZChcbiAgICBhaXJEZW5zaXR5OiBudW1iZXIsXG4gICAgdGhydXN0Rm9yY2U6IG51bWJlcixcbiAgICB3aW5nQXJlYTogbnVtYmVyLFxuICAgIGRyYWdDb2VmZmljaWVudDogbnVtYmVyLFxuKTogbnVtYmVyIHtcbiAgICBpZiAoYWlyRGVuc2l0eSA8PSAwIHx8IGRyYWdDb2VmZmljaWVudCA8PSAwIHx8IHRocnVzdEZvcmNlIDw9IDApIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIHJldHVybiBNYXRoLnNxcnQoMiAqIHRocnVzdEZvcmNlIC8gKGFpckRlbnNpdHkgKiB3aW5nQXJlYSAqIGRyYWdDb2VmZmljaWVudCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUFuZ2xlT2ZBdHRhY2soXG4gICAgZm9yd2FyZDogVEhSRUUuVmVjdG9yMyxcbiAgICByaWdodDogVEhSRUUuVmVjdG9yMyxcbiAgICB2ZWxvY2l0eTogVEhSRUUuVmVjdG9yMyxcbiAgICBzY3JhdGNoOiBUSFJFRS5WZWN0b3IzLFxuKTogbnVtYmVyIHtcbiAgICBjb25zdCBzcGVlZCA9IHZlbG9jaXR5Lmxlbmd0aCgpO1xuICAgIGlmIChzcGVlZCA8PSAxLjApIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgc2NyYXRjaC5jb3B5KHZlbG9jaXR5KS5tdWx0aXBseVNjYWxhcigxIC8gc3BlZWQpLnByb2plY3RPblBsYW5lKHJpZ2h0KTtcbiAgICBpZiAoc2NyYXRjaC5sZW5ndGhTcSgpIDw9IDFlLTYpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgc2NyYXRjaC5ub3JtYWxpemUoKTtcbiAgICBjb25zdCBhb2FBbmdsZSA9IHNjcmF0Y2guYW5nbGVUbyhmb3J3YXJkKTtcbiAgICBjb25zdCBhb2FTaWduID0gc2NyYXRjaC5jcm9zcyhmb3J3YXJkKS5kb3QocmlnaHQpID4gMCA/IC0xIDogMTtcbiAgICByZXR1cm4gYW9hU2lnbiAqIGFvYUFuZ2xlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUxvYWRGYWN0b3JHKGFjY2VsOiBUSFJFRS5WZWN0b3IzLCB1cDogVEhSRUUuVmVjdG9yMywgZ3Jhdml0eSA9IEdSQVZJVFkpOiBudW1iZXIge1xuICAgIHJldHVybiAoYWNjZWwueCAqIHVwLnggKyAoYWNjZWwueSArIGdyYXZpdHkpICogdXAueSArIGFjY2VsLnogKiB1cC56KSAvIGdyYXZpdHk7XG59XG4iLCIvKipcbiAqIEYxMDAtUFctMjI5IHRocm90dGxlIHF1YWRyYW50IGFuZCB0aHJ1c3Qgc2NoZWR1bGUgZm9yIEYtMTZDLlxuICogTGV2ZXIgWzAsIDFdIG1hcHMgdG8gMOKAkzEwMCU6IDA9TUlMIDIwJSwgOTg9TUlMIDEwMCUsIDk5PUFCMSwgMTAwPUFCMi5cbiAqL1xuaW1wb3J0IHsgY29tcHV0ZUFpckRlbnNpdHksIGNvbXB1dGVUaHJ1c3REZW5zaXR5RmFjdG9yIH0gZnJvbSAnLi9hZXJvVXRpbHMnO1xuaW1wb3J0IHsgRjE2X1BST0ZJTEUgfSBmcm9tICcuL2YxNlByb2ZpbGUnO1xuXG4vKiogRjEwMC1QVy0yMjkgc2VhLWxldmVsIHN0YXRpYyB0aHJ1c3QgKGtOKSwgVVNBRiAvIEphbmUncy4gKi9cbmV4cG9ydCBjb25zdCBGMTZfRU5HSU5FID0ge1xuICAgIC8qKiBGbGlnaHQgaWRsZSAoTUlMIDIwJSBvbiBxdWFkcmFudCkg4oCUIDAuNSBrTiBzZWEtbGV2ZWwgc3RhdGljLiAqL1xuICAgIGlkbGVUaHJ1c3RLbjogMC41LFxuICAgIG1pbFRocnVzdEtuOiA3Ni4zLFxuICAgIC8qKiBGaXJzdCBhZnRlcmJ1cm5lciBkZXRlbnQgKG1pbiBBQiAvIHpvbmUgNSkuICovXG4gICAgYWJNaW5UaHJ1c3RLbjogMTA0LjAsXG4gICAgYWJNYXhUaHJ1c3RLbjogRjE2X1BST0ZJTEUuYWJUaHJ1c3RLbixcbiAgICAvKiogTGV2ZXIgWzAsIDFdIGF0IDEwMCUgTUlMICg5OCBvbiBxdWFkcmFudCkuICovXG4gICAgbWlsTGV2ZXJFbmQ6IEYxNl9QUk9GSUxFLm1pbExldmVyRW5kLFxuICAgIC8qKiBMZXZlciBbMCwgMV0gYXQgQUIxIGRldGVudCAoOTkgb24gcXVhZHJhbnQpLiAqL1xuICAgIGFiTWluTGV2ZXJFbmQ6IEYxNl9QUk9GSUxFLmFiTWluTGV2ZXJFbmQsXG59IGFzIGNvbnN0O1xuXG5leHBvcnQgdHlwZSBGMTZUaHJvdHRsZVpvbmUgPSAnbWlsJyB8ICdhYi1taW4nIHwgJ2FiLW1heCc7XG5cbi8qKiBBZnRlcmJ1cm5lciBub3p6bGUgY29sb3JzIOKAlCBzb2xpZCwgbm8gYW5pbWF0aW9uLiAqL1xuZXhwb3J0IGNvbnN0IEYxNl9FTkdJTkVfTk9aWkxFX0NPTE9SUyA9IHtcbiAgICBtaWw6ICcjMGEwYTBhJyxcbiAgICBhYk1pbjogJyNmZjg4MDAnLFxuICAgIGFiTWF4OiAnI2ZmZmYwMCcsXG59IGFzIGNvbnN0O1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RjE2RW5naW5lTm96emxlQ29sb3IobGV2ZXI6IG51bWJlcik6IHN0cmluZyB7XG4gICAgY29uc3Qgem9uZSA9IGdldEYxNlRocm90dGxlWm9uZShsZXZlcik7XG4gICAgaWYgKHpvbmUgPT09ICdhYi1taW4nKSB7XG4gICAgICAgIHJldHVybiBGMTZfRU5HSU5FX05PWlpMRV9DT0xPUlMuYWJNaW47XG4gICAgfVxuICAgIGlmICh6b25lID09PSAnYWItbWF4Jykge1xuICAgICAgICByZXR1cm4gRjE2X0VOR0lORV9OT1paTEVfQ09MT1JTLmFiTWF4O1xuICAgIH1cbiAgICByZXR1cm4gRjE2X0VOR0lORV9OT1paTEVfQ09MT1JTLm1pbDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBGMTZBZnRlcmJ1cm5lckNvbmVEaXRoZXIge1xuICAgIHByaW1hcnk6IHN0cmluZztcbiAgICBzZWNvbmRhcnk6IHN0cmluZztcbn1cblxuLyoqIE9yYW5nZS95ZWxsb3cgY2hlY2tlcmJvYXJkIGRpdGhlciBmb3IgQUIgY29uZSBtZXNoZXM7IG51bGwgd2hlbiBNSUwgKGNvbmVzIGhpZGRlbikuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RjE2QWZ0ZXJidXJuZXJDb25lRGl0aGVyKGxldmVyOiBudW1iZXIpOiBGMTZBZnRlcmJ1cm5lckNvbmVEaXRoZXIgfCBudWxsIHtcbiAgICBjb25zdCB6b25lID0gZ2V0RjE2VGhyb3R0bGVab25lKGxldmVyKTtcbiAgICBpZiAoem9uZSA9PT0gJ2FiLW1pbicpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHByaW1hcnk6IEYxNl9FTkdJTkVfTk9aWkxFX0NPTE9SUy5hYk1pbixcbiAgICAgICAgICAgIHNlY29uZGFyeTogRjE2X0VOR0lORV9OT1paTEVfQ09MT1JTLmFiTWF4LFxuICAgICAgICB9O1xuICAgIH1cbiAgICBpZiAoem9uZSA9PT0gJ2FiLW1heCcpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHByaW1hcnk6IEYxNl9FTkdJTkVfTk9aWkxFX0NPTE9SUy5hYk1heCxcbiAgICAgICAgICAgIHNlY29uZGFyeTogRjE2X0VOR0lORV9OT1paTEVfQ09MT1JTLmFiTWluLFxuICAgICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRjE2QWZ0ZXJidXJuZXJBY3RpdmUobGV2ZXI6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIHJldHVybiBnZXRGMTZUaHJvdHRsZVpvbmUobGV2ZXIpICE9PSAnbWlsJztcbn1cblxuZXhwb3J0IGNvbnN0IEYxNl9BRlRFUkJVUk5FUl9DT05FX0xFTkdUSF9NID0ge1xuICAgIG1pbDogMCxcbiAgICBhYk1pbjogNCxcbiAgICBhYk1heDogNyxcbn0gYXMgY29uc3Q7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRGMTZBZnRlcmJ1cm5lckNvbmVMZW5ndGhNKGxldmVyOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IHpvbmUgPSBnZXRGMTZUaHJvdHRsZVpvbmUobGV2ZXIpO1xuICAgIGlmICh6b25lID09PSAnYWItbWluJykge1xuICAgICAgICByZXR1cm4gRjE2X0FGVEVSQlVSTkVSX0NPTkVfTEVOR1RIX00uYWJNaW47XG4gICAgfVxuICAgIGlmICh6b25lID09PSAnYWItbWF4Jykge1xuICAgICAgICByZXR1cm4gRjE2X0FGVEVSQlVSTkVSX0NPTkVfTEVOR1RIX00uYWJNYXg7XG4gICAgfVxuICAgIHJldHVybiBGMTZfQUZURVJCVVJORVJfQ09ORV9MRU5HVEhfTS5taWw7XG59XG5cbi8qKiBMZXZlciBbMCwgMV0gYXMgMOKAkzEwMCB0aHJvdHRsZSBxdWFkcmFudCBwb3NpdGlvbi4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsZXZlclRvUGVyY2VudChsZXZlcjogbnVtYmVyKTogbnVtYmVyIHtcbiAgICByZXR1cm4gY2xhbXBMZXZlcihsZXZlcikgKiAxMDA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0YxNkFiRGV0ZW50QmFuZChsZXZlcjogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGxldmVyVG9QZXJjZW50KGxldmVyKSA+PSA5ODtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEYxNlRocm90dGxlWm9uZShsZXZlcjogbnVtYmVyKTogRjE2VGhyb3R0bGVab25lIHtcbiAgICBjb25zdCBwY3QgPSBsZXZlclRvUGVyY2VudChsZXZlcik7XG4gICAgaWYgKHBjdCA8IDk5KSB7XG4gICAgICAgIHJldHVybiAnbWlsJztcbiAgICB9XG4gICAgaWYgKHBjdCA8IDEwMCkge1xuICAgICAgICByZXR1cm4gJ2FiLW1pbic7XG4gICAgfVxuICAgIHJldHVybiAnYWItbWF4Jztcbn1cblxuLyoqIFNlYS1sZXZlbCByYXRlZCB0aHJ1c3QgKGtOKSBmb3IgbGV2ZXIgcG9zaXRpb24sIGJlZm9yZSBhbHRpdHVkZSBsYXBzZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlRjE2U2xUaHJ1c3RLbihsZXZlcjogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBjb25zdCBwY3QgPSBsZXZlclRvUGVyY2VudChsZXZlcik7XG4gICAgY29uc3QgeyBpZGxlVGhydXN0S24sIG1pbFRocnVzdEtuLCBhYk1pblRocnVzdEtuLCBhYk1heFRocnVzdEtuIH0gPSBGMTZfRU5HSU5FO1xuXG4gICAgaWYgKHBjdCA8PSA5OCkge1xuICAgICAgICBjb25zdCBtaWxGcmFjdGlvbiA9IHBjdCAvIDk4O1xuICAgICAgICByZXR1cm4gaWRsZVRocnVzdEtuICsgKG1pbFRocnVzdEtuIC0gaWRsZVRocnVzdEtuKSAqIG1pbEZyYWN0aW9uO1xuICAgIH1cbiAgICBpZiAocGN0IDwgOTkpIHtcbiAgICAgICAgcmV0dXJuIG1pbFRocnVzdEtuO1xuICAgIH1cbiAgICBpZiAocGN0ID49IDEwMCkge1xuICAgICAgICByZXR1cm4gYWJNYXhUaHJ1c3RLbjtcbiAgICB9XG4gICAgcmV0dXJuIGFiTWluVGhydXN0S247XG59XG5cbi8qKiBEZWxpdmVyZWQgZW5naW5lIHRocnVzdCAoTikgYXQgYWx0aXR1ZGUgd2l0aCBJU0EgdHVyYm9mYW4gbGFwc2UuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUYxNkVuZ2luZVRocnVzdE4obGV2ZXI6IG51bWJlciwgYWx0aXR1ZGVNZXRlcnM6IG51bWJlcik6IG51bWJlciB7XG4gICAgY29uc3Qgc2xLbiA9IGNvbXB1dGVGMTZTbFRocnVzdEtuKGxldmVyKTtcbiAgICBjb25zdCByaG8gPSBjb21wdXRlQWlyRGVuc2l0eShhbHRpdHVkZU1ldGVycyk7XG4gICAgY29uc3QgZmFjdG9yID0gY29tcHV0ZVRocnVzdERlbnNpdHlGYWN0b3IocmhvLCBhbHRpdHVkZU1ldGVycyk7XG4gICAgcmV0dXJuIHNsS24gKiAxMDAwICogZmFjdG9yO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUYxNkVuZ2luZVRocnVzdEtuKGxldmVyOiBudW1iZXIsIGFsdGl0dWRlTWV0ZXJzOiBudW1iZXIpOiBudW1iZXIge1xuICAgIHJldHVybiBjb21wdXRlRjE2RW5naW5lVGhydXN0TihsZXZlciwgYWx0aXR1ZGVNZXRlcnMpIC8gMTAwMDtcbn1cblxuLyoqIEhVRCBsYWJlbDogTUlMIDIw4oCTMTAwJSDihpIgQUIxIOKGkiBBQjIuICovXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0RjE2VGhyb3R0bGVIdWQobGV2ZXI6IG51bWJlcik6IHN0cmluZyB7XG4gICAgY29uc3QgcGN0ID0gbGV2ZXJUb1BlcmNlbnQobGV2ZXIpO1xuICAgIGNvbnN0IHpvbmUgPSBnZXRGMTZUaHJvdHRsZVpvbmUobGV2ZXIpO1xuXG4gICAgaWYgKHpvbmUgPT09ICdtaWwnKSB7XG4gICAgICAgIGlmIChwY3QgPiA5OCkge1xuICAgICAgICAgICAgcmV0dXJuICdNSUwgMTAwJztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtaWxQY3QgPSBNYXRoLnJvdW5kKDIwICsgKHBjdCAvIDk4KSAqIDgwKTtcbiAgICAgICAgcmV0dXJuIGBNSUwgJHttaWxQY3R9YDtcbiAgICB9XG4gICAgaWYgKHpvbmUgPT09ICdhYi1taW4nKSB7XG4gICAgICAgIHJldHVybiAnQUIxJztcbiAgICB9XG4gICAgcmV0dXJuICdBQjInO1xufVxuXG4vKiogTWFwIGxldmVyIHRvIFswLCAxXSBmb3IgZW5naW5lIGF1ZGlvIChpZGxl4oaSbWls4oaSZnVsbCBBQikuICovXG5leHBvcnQgZnVuY3Rpb24gZjE2VGhyb3R0bGVBdWRpb0xldmVsKGxldmVyOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IHNsS24gPSBjb21wdXRlRjE2U2xUaHJ1c3RLbihsZXZlcik7XG4gICAgY29uc3QgeyBpZGxlVGhydXN0S24sIGFiTWF4VGhydXN0S24gfSA9IEYxNl9FTkdJTkU7XG4gICAgaWYgKGFiTWF4VGhydXN0S24gPD0gaWRsZVRocnVzdEtuKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICByZXR1cm4gY2xhbXBMZXZlcigoc2xLbiAtIGlkbGVUaHJ1c3RLbikgLyAoYWJNYXhUaHJ1c3RLbiAtIGlkbGVUaHJ1c3RLbikpO1xufVxuXG4vKiogQ29udGludW91cyBNSUwgcmFtcCBmb3IgaGVsZCBrZXlib2FyZCBpbnB1dCBiZWxvdyB0aGUgTUlMIHN0b3AuICovXG5leHBvcnQgZnVuY3Rpb24gYWRqdXN0RjE2VGhyb3R0bGVJbnB1dChsZXZlcjogbnVtYmVyLCBzdGVwOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IGN1cnJlbnQgPSBjbGFtcExldmVyKGxldmVyKTtcbiAgICBpZiAoc3RlcCA+IDApIHtcbiAgICAgICAgcmV0dXJuIHJhbXBGMTZUaHJvdHRsZVVwKGN1cnJlbnQsIHN0ZXApO1xuICAgIH1cbiAgICBpZiAoc3RlcCA8IDApIHtcbiAgICAgICAgcmV0dXJuIHJhbXBGMTZUaHJvdHRsZURvd24oY3VycmVudCwgLXN0ZXApO1xuICAgIH1cbiAgICByZXR1cm4gY3VycmVudDtcbn1cblxuLyoqIE9uZSBkZXRlbnQgcGVyIGtleSBwcmVzczogTUlMIDEwMCDihpIgQUIxIOKGkiBBQjIgKGFuZCByZXZlcnNlKS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdGVwRjE2VGhyb3R0bGVEZXRlbnQobGV2ZXI6IG51bWJlciwgZGlyZWN0aW9uOiAxIHwgLTEpOiBudW1iZXIge1xuICAgIGNvbnN0IHBjdCA9IGxldmVyVG9QZXJjZW50KGxldmVyKTtcbiAgICBpZiAoZGlyZWN0aW9uID4gMCkge1xuICAgICAgICBpZiAocGN0ID49IDk5KSB7XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocGN0ID49IDk4KSB7XG4gICAgICAgICAgICByZXR1cm4gRjE2X0VOR0lORS5hYk1pbkxldmVyRW5kO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBsZXZlcjtcbiAgICB9XG4gICAgaWYgKHBjdCA+PSAxMDApIHtcbiAgICAgICAgcmV0dXJuIEYxNl9FTkdJTkUuYWJNaW5MZXZlckVuZDtcbiAgICB9XG4gICAgaWYgKHBjdCA+PSA5OSkge1xuICAgICAgICByZXR1cm4gRjE2X0VOR0lORS5taWxMZXZlckVuZDtcbiAgICB9XG4gICAgcmV0dXJuIGxldmVyO1xufVxuXG5mdW5jdGlvbiByYW1wRjE2VGhyb3R0bGVVcChsZXZlcjogbnVtYmVyLCBzdGVwOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IHRhcmdldCA9IGxldmVyICsgc3RlcDtcbiAgICBpZiAodGFyZ2V0ID49IEYxNl9FTkdJTkUubWlsTGV2ZXJFbmQpIHtcbiAgICAgICAgcmV0dXJuIEYxNl9FTkdJTkUubWlsTGV2ZXJFbmQ7XG4gICAgfVxuICAgIHJldHVybiBjbGFtcExldmVyKHRhcmdldCk7XG59XG5cbmZ1bmN0aW9uIHJhbXBGMTZUaHJvdHRsZURvd24obGV2ZXI6IG51bWJlciwgc3RlcDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBjb25zdCBwY3QgPSBsZXZlclRvUGVyY2VudChsZXZlcik7XG4gICAgaWYgKHBjdCA+IDk4KSB7XG4gICAgICAgIHJldHVybiBGMTZfRU5HSU5FLm1pbExldmVyRW5kO1xuICAgIH1cbiAgICByZXR1cm4gY2xhbXBMZXZlcihsZXZlciAtIHN0ZXApO1xufVxuXG5mdW5jdGlvbiBjbGFtcExldmVyKGxldmVyOiBudW1iZXIpOiBudW1iZXIge1xuICAgIHJldHVybiBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCBsZXZlcikpO1xufVxuIiwiLyoqXG4gKiBGLTE2QyBhZXJvZHluYW1pYyBkYXRhIGZyb206XG4gKiBSZWhtYW4sIFwiQWVyb2R5bmFtaWMgUGVyZm9ybWFuY2UgQW5hbHlzaXMgb2YgRi0xNkMgRmlnaHRpbmcgRmFsY29uXCIgKE5VU1QpLlxuICogQ2hhcnQgcmVmZXJlbmNlcyBjb21wdXRlZCB3aXRoIEFuZGVyc29uIElTQSArIHBhcGVyIEVxLiAoMuKAkzUpLCBr4oKCID0gMC5cbiAqL1xuXG5leHBvcnQgY29uc3QgRjE2X1BBUEVSX0FOQUxZVElDQUwgPSB7XG4gICAgLyoqIEVxLiAoMik6IENEMCA9IENmZSAqIFN3ZXQgLyBTcmVmICovXG4gICAgY2QwOiAwLjAxOCxcbiAgICAvKiogRXEuICgz4oCTNSk6IENEaSA9IEsgKiBDTMKyICovXG4gICAgaW5kdWNlZERyYWdLOiAwLjE0ODksXG4gICAgY2wwOiAwLjIsXG4gICAgLyoqIE5BQ0EgNjRBMjA0LCBwZXIgcmFkaWFuICovXG4gICAgY2xBbHBoYVBlclJhZDogNS43MyxcbiAgICAvKiogRmlnLiA3IHBlYWsgKi9cbiAgICBtYXhMaWZ0VG9EcmFnOiA5LjY2LFxuICAgIG1heExpZnRUb0RyYWdBbHBoYURlZzogMixcbiAgICAvKiogRmlnLiA5ICovXG4gICAgbWluR2xpZGVBbmdsZURlZzogNS45MSxcbiAgICAvKiogU2VjdGlvbiBJSUkgYXNzdW1wdGlvbnMg4oCUIGNydWlzZSBhdCBNVE9XICovXG4gICAgY3J1aXNlVmVsb2NpdHlGcHM6IDg0NixcbiAgICBjcnVpc2VBbHRpdHVkZUZ0OiAzMDAwMCxcbiAgICAvKiogSmFuZSdzIC8gbGl0ZXJhdHVyZSBzZXJ2aWNlIGNlaWxpbmcgKi9cbiAgICBzZXJ2aWNlQ2VpbGluZ0Z0OiA1MDAwMCxcbiAgICB3aW5nQXJlYUZ0MjogMzAwLFxuICAgIG10b3dMYjogNDIwMDAsXG59IGFzIGNvbnN0O1xuXG4vKiogT3BlblZTUCAvIFZTUEFlcm8gcmVzdWx0cyBjaXRlZCBpbiBTZWN0aW9uIElWLkIuICovXG5leHBvcnQgY29uc3QgRjE2X1BBUEVSX1ZTUEFFUk8gPSB7XG4gICAgY2QwOiAwLjAxMjQsXG4gICAgY2xBbHBoYVBlclJhZDogMy42MixcbiAgICAvKiogRGVyaXZlZCBmcm9tIEwvRCBtYXggPSAxNCBhdCDOsSDiiYggNMKwIHdpdGggQ0zigoAgPSAwLjIuICovXG4gICAgaW5kdWNlZERyYWdLOiAwLjA5NzMsXG4gICAgbWF4TGlmdFRvRHJhZzogMTQsXG4gICAgbWF4TGlmdFRvRHJhZ0FscGhhRGVnOiA0LFxufSBhcyBjb25zdDtcblxuZXhwb3J0IHR5cGUgRjE2UGFwZXJNZXRyaWMgPVxuICAgIHwgJ2xpZnRUb0RyYWcnXG4gICAgfCAnbWluR2xpZGVBbmdsZURlZydcbiAgICB8ICd0aHJ1c3RSZXF1aXJlZExiJ1xuICAgIHwgJ3RvdGFsRHJhZ0xiJ1xuICAgIHwgJ21pblRvdGFsRHJhZ0xiJ1xuICAgIHwgJ2NydWlzZVNwZWVkRnBzJ1xuICAgIHwgJ2NkMCdcbiAgICB8ICdjbEFscGhhUGVyUmFkJ1xuICAgIHwgJ3ZNaW5EcmFnRnBzJztcblxuZXhwb3J0IGludGVyZmFjZSBGMTZQYXBlckNoYXJ0Q2FzZSB7XG4gICAgaWQ6IHN0cmluZztcbiAgICBmaWd1cmU6IHN0cmluZztcbiAgICBkZXNjcmlwdGlvbjogc3RyaW5nO1xuICAgIG1ldHJpYzogRjE2UGFwZXJNZXRyaWM7XG4gICAgLyoqIEFuZ2xlIG9mIGF0dGFjayBmb3IgTC9EIGNhc2VzIChkZWdyZWVzKS4gKi9cbiAgICBhbHBoYURlZz86IG51bWJlcjtcbiAgICBhbHRpdHVkZUZ0OiBudW1iZXI7XG4gICAgd2VpZ2h0TGI6IG51bWJlcjtcbiAgICB2ZWxvY2l0eUZwczogbnVtYmVyO1xuICAgIHJlZmVyZW5jZTogbnVtYmVyO1xuICAgIHRvbGVyYW5jZTogbnVtYmVyO1xufVxuXG4vKipcbiAqIENoYXJ0IGNoZWNrcG9pbnRzIGZyb20gRmlncy4gNywgOSwgMTDigJMxMiwgMTbigJMxNy5cbiAqIERyYWcvdGhydXN0IHJlZmVyZW5jZXM6IElTQSArIHBhcGVyIHBvbGFyIGF0IHN0YXRlZCBWLCBoLCBXIChNQVRMQUIgbWV0aG9kb2xvZ3kpLlxuICovXG5leHBvcnQgY29uc3QgRjE2X1BBUEVSX0NIQVJUX0NBU0VTOiBGMTZQYXBlckNoYXJ0Q2FzZVtdID0gW1xuICAgIHtcbiAgICAgICAgaWQ6ICdmaWc3X2xkX21heCcsXG4gICAgICAgIGZpZ3VyZTogJ0ZpZy4gNycsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTWF4aW11bSBsaWZ0LXRvLWRyYWcgcmF0aW8nLFxuICAgICAgICBtZXRyaWM6ICdsaWZ0VG9EcmFnJyxcbiAgICAgICAgYWxwaGFEZWc6IDIsXG4gICAgICAgIGFsdGl0dWRlRnQ6IDAsXG4gICAgICAgIHdlaWdodExiOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5tdG93TGIsXG4gICAgICAgIHZlbG9jaXR5RnBzOiAwLFxuICAgICAgICByZWZlcmVuY2U6IDkuNjYsXG4gICAgICAgIHRvbGVyYW5jZTogMC4xNSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6ICdmaWc5X21pbl9nbGlkZScsXG4gICAgICAgIGZpZ3VyZTogJ0ZpZy4gOScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTWluaW11bSBnbGlkZSBhbmdsZScsXG4gICAgICAgIG1ldHJpYzogJ21pbkdsaWRlQW5nbGVEZWcnLFxuICAgICAgICBhbHRpdHVkZUZ0OiAzMDAwMCxcbiAgICAgICAgd2VpZ2h0TGI6IEYxNl9QQVBFUl9BTkFMWVRJQ0FMLm10b3dMYixcbiAgICAgICAgdmVsb2NpdHlGcHM6IDAsXG4gICAgICAgIHJlZmVyZW5jZTogNS45MSxcbiAgICAgICAgdG9sZXJhbmNlOiAwLjEsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGlkOiAnZmlnMTBfbWluX2RyYWdfMjBrJyxcbiAgICAgICAgZmlndXJlOiAnRmlnLiAxMCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTWluaW11bSB0b3RhbCBkcmFnIGF0IDIwLDAwMCBmdCAoTVRPVyknLFxuICAgICAgICBtZXRyaWM6ICdtaW5Ub3RhbERyYWdMYicsXG4gICAgICAgIGFsdGl0dWRlRnQ6IDIwMDAwLFxuICAgICAgICB3ZWlnaHRMYjogRjE2X1BBUEVSX0FOQUxZVElDQUwubXRvd0xiLFxuICAgICAgICB2ZWxvY2l0eUZwczogNzk3LFxuICAgICAgICByZWZlcmVuY2U6IDQzNDguNzQsXG4gICAgICAgIHRvbGVyYW5jZTogNTAsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGlkOiAnZmlnMTBfZHJhZ183NTBmcHMnLFxuICAgICAgICBmaWd1cmU6ICdGaWcuIDEwJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdUb3RhbCBkcmFnIGF0IDc1MCBmdC9zLCAyMCwwMDAgZnQgKE1UT1cpJyxcbiAgICAgICAgbWV0cmljOiAndG90YWxEcmFnTGInLFxuICAgICAgICBhbHRpdHVkZUZ0OiAyMDAwMCxcbiAgICAgICAgd2VpZ2h0TGI6IEYxNl9QQVBFUl9BTkFMWVRJQ0FMLm10b3dMYixcbiAgICAgICAgdmVsb2NpdHlGcHM6IDc1MCxcbiAgICAgICAgcmVmZXJlbmNlOiA0MzgxLjUwLFxuICAgICAgICB0b2xlcmFuY2U6IDUwLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2ZpZzExX21pbl9kcmFnXzMwaycsXG4gICAgICAgIGZpZ3VyZTogJ0ZpZy4gMTEnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ01pbmltdW0gdG90YWwgZHJhZyBhdCAzMCwwMDAgZnQgKE1UT1cpJyxcbiAgICAgICAgbWV0cmljOiAnbWluVG90YWxEcmFnTGInLFxuICAgICAgICBhbHRpdHVkZUZ0OiAzMDAwMCxcbiAgICAgICAgd2VpZ2h0TGI6IEYxNl9QQVBFUl9BTkFMWVRJQ0FMLm10b3dMYixcbiAgICAgICAgdmVsb2NpdHlGcHM6IDk1MixcbiAgICAgICAgcmVmZXJlbmNlOiA0MzQ4Ljc0LFxuICAgICAgICB0b2xlcmFuY2U6IDUwLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2ZpZzExX2RyYWdfOTAwZnBzJyxcbiAgICAgICAgZmlndXJlOiAnRmlnLiAxMScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnVG90YWwgZHJhZyBhdCA5MDAgZnQvcywgMzAsMDAwIGZ0IChNVE9XKScsXG4gICAgICAgIG1ldHJpYzogJ3RvdGFsRHJhZ0xiJyxcbiAgICAgICAgYWx0aXR1ZGVGdDogMzAwMDAsXG4gICAgICAgIHdlaWdodExiOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5tdG93TGIsXG4gICAgICAgIHZlbG9jaXR5RnBzOiA5MDAsXG4gICAgICAgIHJlZmVyZW5jZTogNDM3NS44NCxcbiAgICAgICAgdG9sZXJhbmNlOiA1MCxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6ICdmaWcxMl9taW5fZHJhZ180MGsnLFxuICAgICAgICBmaWd1cmU6ICdGaWcuIDEyJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdNaW5pbXVtIHRvdGFsIGRyYWcgYXQgNDAsMDAwIGZ0IChNVE9XKScsXG4gICAgICAgIG1ldHJpYzogJ21pblRvdGFsRHJhZ0xiJyxcbiAgICAgICAgYWx0aXR1ZGVGdDogNDAwMDAsXG4gICAgICAgIHdlaWdodExiOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5tdG93TGIsXG4gICAgICAgIHZlbG9jaXR5RnBzOiAxMTczLFxuICAgICAgICByZWZlcmVuY2U6IDQzNDguNzMsXG4gICAgICAgIHRvbGVyYW5jZTogNTAsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGlkOiAnZmlnMTJfZHJhZ18xMDAwZnBzJyxcbiAgICAgICAgZmlndXJlOiAnRmlnLiAxMicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnVG90YWwgZHJhZyBhdCAxLDAwMCBmdC9zLCA0MCwwMDAgZnQgKE1UT1cpJyxcbiAgICAgICAgbWV0cmljOiAndG90YWxEcmFnTGInLFxuICAgICAgICBhbHRpdHVkZUZ0OiA0MDAwMCxcbiAgICAgICAgd2VpZ2h0TGI6IEYxNl9QQVBFUl9BTkFMWVRJQ0FMLm10b3dMYixcbiAgICAgICAgdmVsb2NpdHlGcHM6IDEwMDAsXG4gICAgICAgIHJlZmVyZW5jZTogNDU3Mi41MyxcbiAgICAgICAgdG9sZXJhbmNlOiA1MCxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6ICdmaWcxNl90cl9taW5fMzVrbGInLFxuICAgICAgICBmaWd1cmU6ICdGaWcuIDE2JyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdNaW5pbXVtIHRocnVzdCByZXF1aXJlZCBhdCAzNSwwMDAgbGIgKDMwLDAwMCBmdCknLFxuICAgICAgICBtZXRyaWM6ICd0aHJ1c3RSZXF1aXJlZExiJyxcbiAgICAgICAgYWx0aXR1ZGVGdDogMzAwMDAsXG4gICAgICAgIHdlaWdodExiOiAzNTAwMCxcbiAgICAgICAgdmVsb2NpdHlGcHM6IDg3MCxcbiAgICAgICAgcmVmZXJlbmNlOiAzNjIzLjk2LFxuICAgICAgICB0b2xlcmFuY2U6IDUwLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2ZpZzE2X3RyXzM1a2xiXzkwMGZwcycsXG4gICAgICAgIGZpZ3VyZTogJ0ZpZy4gMTYnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1RocnVzdCByZXF1aXJlZCBhdCAzNSwwMDAgbGIsIDkwMCBmdC9zICgzMCwwMDAgZnQpJyxcbiAgICAgICAgbWV0cmljOiAndGhydXN0UmVxdWlyZWRMYicsXG4gICAgICAgIGFsdGl0dWRlRnQ6IDMwMDAwLFxuICAgICAgICB3ZWlnaHRMYjogMzUwMDAsXG4gICAgICAgIHZlbG9jaXR5RnBzOiA5MDAsXG4gICAgICAgIHJlZmVyZW5jZTogMzYzMy4wMSxcbiAgICAgICAgdG9sZXJhbmNlOiA1MCxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6ICdmaWcxNl90cl8zNWtsYl8xMDAwZnBzJyxcbiAgICAgICAgZmlndXJlOiAnRmlnLiAxNicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnVGhydXN0IHJlcXVpcmVkIGF0IDM1LDAwMCBsYiwgMSwwMDAgZnQvcyAoMzAsMDAwIGZ0KScsXG4gICAgICAgIG1ldHJpYzogJ3RocnVzdFJlcXVpcmVkTGInLFxuICAgICAgICBhbHRpdHVkZUZ0OiAzMDAwMCxcbiAgICAgICAgd2VpZ2h0TGI6IDM1MDAwLFxuICAgICAgICB2ZWxvY2l0eUZwczogMTAwMCxcbiAgICAgICAgcmVmZXJlbmNlOiAzNzY4LjQzLFxuICAgICAgICB0b2xlcmFuY2U6IDUwLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2ZpZzE3X3RyX21pbl8yMGsnLFxuICAgICAgICBmaWd1cmU6ICdGaWcuIDE3JyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdNaW5pbXVtIHRocnVzdCByZXF1aXJlZCBhdCAyMCwwMDAgZnQgKE1UT1cpJyxcbiAgICAgICAgbWV0cmljOiAndGhydXN0UmVxdWlyZWRMYicsXG4gICAgICAgIGFsdGl0dWRlRnQ6IDIwMDAwLFxuICAgICAgICB3ZWlnaHRMYjogRjE2X1BBUEVSX0FOQUxZVElDQUwubXRvd0xiLFxuICAgICAgICB2ZWxvY2l0eUZwczogNzk3LFxuICAgICAgICByZWZlcmVuY2U6IDQzNDguNzQsXG4gICAgICAgIHRvbGVyYW5jZTogNTAsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGlkOiAnZmlnMTdfdHJfbWluXzMwaycsXG4gICAgICAgIGZpZ3VyZTogJ0ZpZy4gMTcnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1RocnVzdCByZXF1aXJlZCBhdCAxLDAwMCBmdC9zLCAzMCwwMDAgZnQgKE1UT1cpJyxcbiAgICAgICAgbWV0cmljOiAndGhydXN0UmVxdWlyZWRMYicsXG4gICAgICAgIGFsdGl0dWRlRnQ6IDMwMDAwLFxuICAgICAgICB3ZWlnaHRMYjogRjE2X1BBUEVSX0FOQUxZVElDQUwubXRvd0xiLFxuICAgICAgICB2ZWxvY2l0eUZwczogMTAwMCxcbiAgICAgICAgcmVmZXJlbmNlOiA0MzcwLjEyLFxuICAgICAgICB0b2xlcmFuY2U6IDUwLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2ZpZzE3X3RyXzExNTBmcHNfNDBrJyxcbiAgICAgICAgZmlndXJlOiAnRmlnLiAxNycsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnVGhydXN0IHJlcXVpcmVkIGF0IDEsMTUwIGZ0L3MsIDQwLDAwMCBmdCAoTVRPVyknLFxuICAgICAgICBtZXRyaWM6ICd0aHJ1c3RSZXF1aXJlZExiJyxcbiAgICAgICAgYWx0aXR1ZGVGdDogNDAwMDAsXG4gICAgICAgIHdlaWdodExiOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5tdG93TGIsXG4gICAgICAgIHZlbG9jaXR5RnBzOiAxMTUwLFxuICAgICAgICByZWZlcmVuY2U6IDQzNTIuMjAsXG4gICAgICAgIHRvbGVyYW5jZTogNTAsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGlkOiAnYXNzdW1wdGlvbl9jcnVpc2Vfc3BlZWQnLFxuICAgICAgICBmaWd1cmU6ICdTZWN0aW9uIElJSScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQ3J1aXNlIHZlbG9jaXR5IGF0IDMwLDAwMCBmdCAoTVRPVyknLFxuICAgICAgICBtZXRyaWM6ICdjcnVpc2VTcGVlZEZwcycsXG4gICAgICAgIGFsdGl0dWRlRnQ6IEYxNl9QQVBFUl9BTkFMWVRJQ0FMLmNydWlzZUFsdGl0dWRlRnQsXG4gICAgICAgIHdlaWdodExiOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5tdG93TGIsXG4gICAgICAgIHZlbG9jaXR5RnBzOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5jcnVpc2VWZWxvY2l0eUZwcyxcbiAgICAgICAgcmVmZXJlbmNlOiA4NDYsXG4gICAgICAgIHRvbGVyYW5jZTogMC41LFxuICAgIH0sXG5dO1xuXG4vKiogVlNQQWVybyBjaGFydCBjaGVja3BvaW50cyAoRmlncy4gMTjigJMyMCkuICovXG5leHBvcnQgY29uc3QgRjE2X1BBUEVSX1ZTUEFFUk9fQ0FTRVM6IEYxNlBhcGVyQ2hhcnRDYXNlW10gPSBbXG4gICAge1xuICAgICAgICBpZDogJ2ZpZzIwX2xkX21heF92c3BhZXJvJyxcbiAgICAgICAgZmlndXJlOiAnRmlnLiAyMCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnVlNQQWVybyBtYXhpbXVtIEwvRCcsXG4gICAgICAgIG1ldHJpYzogJ2xpZnRUb0RyYWcnLFxuICAgICAgICBhbHBoYURlZzogNCxcbiAgICAgICAgYWx0aXR1ZGVGdDogMCxcbiAgICAgICAgd2VpZ2h0TGI6IEYxNl9QQVBFUl9BTkFMWVRJQ0FMLm10b3dMYixcbiAgICAgICAgdmVsb2NpdHlGcHM6IDAsXG4gICAgICAgIHJlZmVyZW5jZTogMTQsXG4gICAgICAgIHRvbGVyYW5jZTogMC4xNSxcbiAgICB9LFxuXTtcblxuZXhwb3J0IGNvbnN0IEZUX1RPX00gPSAwLjMwNDg7XG5leHBvcnQgY29uc3QgRlBTX1RPX01QUyA9IEZUX1RPX007XG5leHBvcnQgY29uc3QgTEJfVE9fTiA9IDQuNDQ4MjIxNjE1MztcbmV4cG9ydCBjb25zdCBMQl9UT19LRyA9IDAuNDUzNTkyMzc7XG4iLCIvKipcbiAqIEYtMTZDIHNpbSBwcm9maWxlIGFuZCByZWZlcmVuY2UgZGF0YS5cbiAqIEFuYWx5dGljYWwgYWVybzogUmVobWFuLCBcIkFlcm9keW5hbWljIFBlcmZvcm1hbmNlIEFuYWx5c2lzIG9mIEYtMTZDIEZpZ2h0aW5nIEZhbGNvblwiLlxuICogUGVyZm9ybWFuY2UgZW52ZWxvcGU6IFVTQUYgZmFjdCBzaGVldCAvIEphbmUncy5cbiAqL1xuaW1wb3J0IHsgRjE2X1BBUEVSX0FOQUxZVElDQUwgfSBmcm9tICcuL2YxNlBhcGVyRGF0YSc7XG5cbmV4cG9ydCBjb25zdCBGMTZfUFJPRklMRSA9IHtcbiAgICAvKiogTVRPVyBmb3IgcGFwZXIvZW52ZWxvcGUgYW5hbHlzaXMgKH40MiwwMDAgbGIpLiAqL1xuICAgIGNvbWJhdE1hc3NLZzogMTkwNTEsXG4gICAgLyoqIFR5cGljYWwgdGFrZW9mZiBncm9zcyB3ZWlnaHQgZm9yIHNpbSBkeW5hbWljcyAofjMwLDAwMCBsYikuICovXG4gICAgc2ltTWFzc0tnOiAxMzYwOCxcbiAgICB3aW5nQXJlYU0yOiAyNy44NyxcbiAgICB3aW5nU3Bhbk06IDkuNDUsXG4gICAgY2QwOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5jZDAsXG4gICAgaW5kdWNlZERyYWdLOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5pbmR1Y2VkRHJhZ0ssXG4gICAgY2wwOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5jbDAsXG4gICAgY2xBbHBoYVBlclJhZDogRjE2X1BBUEVSX0FOQUxZVElDQUwuY2xBbHBoYVBlclJhZCxcbiAgICBhYlRocnVzdEtuOiAxMjkuNCxcbiAgICBtaWxUaHJ1c3RLbjogNzYuMyxcbiAgICAvKiogTGV2ZXIgYXQgMTAwJSBtaWxpdGFyeSBwb3dlciAoOTggb24gMOKAkzEwMCBxdWFkcmFudCkuICovXG4gICAgbWlsTGV2ZXJFbmQ6IDAuOTgsXG4gICAgLyoqIExldmVyIGF0IEFCMSBkZXRlbnQgKDk5IG9uIDDigJMxMDAgcXVhZHJhbnQpLiAqL1xuICAgIGFiTWluTGV2ZXJFbmQ6IDAuOTksXG4gICAgbWluRmx5aW5nU3BlZWRNcHM6IDY4LFxuICAgIHN0YWxsQW9hRGVnOiAyMixcbiAgICBzZXJ2aWNlQ2VpbGluZ006IEYxNl9QQVBFUl9BTkFMWVRJQ0FMLnNlcnZpY2VDZWlsaW5nRnQgKiAwLjMwNDgsXG4gICAgY3J1aXNlQWx0aXR1ZGVNOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5jcnVpc2VBbHRpdHVkZUZ0ICogMC4zMDQ4LFxuICAgIGNydWlzZVNwZWVkTXBzOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5jcnVpc2VWZWxvY2l0eUZwcyAqIDAuMzA0OCxcbiAgICAvKiogQ2F0IEkgY2xlYW4tc2hpcCBGQlcgcm9sbC1yYXRlIGNhcCAoZGVnL3MpLiAqL1xuICAgIG1heFJvbGxSYXRlRGVnUzogMzAwLFxuICAgIC8qKiBDYXQgSUlJIGhlYXZ5IHN0b3JlcyByb2xsLXJhdGUgY2FwIChkZWcvcykuICovXG4gICAgY2F0M01heFJvbGxSYXRlRGVnUzogMTgwLFxuICAgIC8qKiBGQlcgcG9zaXRpdmUgc3RydWN0dXJhbCBnIGxpbWl0IChDYXQgSSkuICovXG4gICAgbWF4TG9hZEZhY3Rvckc6IDkuNSxcbiAgICAvKiogVGFrZW9mZiByb3RhdGlvbiBzcGVlZCAofjcwIGt0KS4gKi9cbiAgICByb3RhdGlvblNwZWVkTXBzOiA2NSxcbiAgICAvKiogTWF4IHRvdWNoZG93biBncm91bmRzcGVlZCB3aXRoIGdlYXIgZG93bi4gKi9cbiAgICBsYW5kaW5nTWF4U3BlZWRNcHM6IDkwLFxuICAgIC8qKiBNYXggc2luayByYXRlIGF0IHRvdWNoZG93biAobS9zKS4gKi9cbiAgICBsYW5kaW5nTWF4VmVydGljYWxTcGVlZE1wczogOCxcbiAgICAvKiogTWF4IGJhbmsgYXQgdG91Y2hkb3duIChkZWcpLiAqL1xuICAgIGxhbmRpbmdNYXhSb2xsRGVnOiAxMixcbiAgICAvKiogTWluaW11bSBwaXRjaCBhdCB0b3VjaGRvd24gKGRlZywgbm9zZS1kb3duIGxpbWl0KS4gKi9cbiAgICBsYW5kaW5nTWluUGl0Y2hEZWc6IC0xMixcbn0gYXMgY29uc3Q7XG5cbmV4cG9ydCB0eXBlIEYxNlJlZmVyZW5jZU1ldHJpYyA9XG4gICAgfCAnbWFzc0tnJ1xuICAgIHwgJ3dpbmdBcmVhTTInXG4gICAgfCAnd2luZ1NwYW5NJ1xuICAgIHwgJ2FiVGhydXN0S24nXG4gICAgfCAnbWF4TWFjaCdcbiAgICB8ICdtYXhTcGVlZEttaCdcbiAgICB8ICdtaW5GbHlpbmdTcGVlZEt0cydcbiAgICB8ICdwZWFrTWF4U3BlZWRBbHRpdHVkZU0nXG4gICAgfCAnY2QwJ1xuICAgIHwgJ2luZHVjZWREcmFnSydcbiAgICB8ICdjbEFscGhhUGVyUmFkJ1xuICAgIHwgJ21heExpZnRUb0RyYWcnXG4gICAgfCAnY3J1aXNlU3BlZWRNcHMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEYxNlJlZmVyZW5jZUNhc2Uge1xuICAgIGlkOiBzdHJpbmc7XG4gICAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgICBzb3VyY2U6IHN0cmluZztcbiAgICBtZXRyaWM6IEYxNlJlZmVyZW5jZU1ldHJpYztcbiAgICBhbHRpdHVkZU1ldGVyczogbnVtYmVyO1xuICAgIHJlZmVyZW5jZTogbnVtYmVyO1xuICAgIHRvbGVyYW5jZTogbnVtYmVyO1xuICAgIC8qKiBGb3IgTC9EIG1ldHJpYy4gKi9cbiAgICBhbHBoYURlZz86IG51bWJlcjtcbn1cblxuZXhwb3J0IGNvbnN0IEYxNl9SRUZFUkVOQ0VfQ0FTRVM6IEYxNlJlZmVyZW5jZUNhc2VbXSA9IFtcbiAgICB7XG4gICAgICAgIGlkOiAnY2QwX3BhcGVyJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdaZXJvLWxpZnQgZHJhZyBjb2VmZmljaWVudCAoRXEuIDIpJyxcbiAgICAgICAgc291cmNlOiAnUmVobWFuIHBhcGVyIGFuYWx5dGljYWwnLFxuICAgICAgICBtZXRyaWM6ICdjZDAnLFxuICAgICAgICBhbHRpdHVkZU1ldGVyczogMCxcbiAgICAgICAgcmVmZXJlbmNlOiAwLjAxOCxcbiAgICAgICAgdG9sZXJhbmNlOiAwLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2luZHVjZWRfa19wYXBlcicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnSW5kdWNlZCBkcmFnIGZhY3RvciBLIChFcS4gM+KAkzUpJyxcbiAgICAgICAgc291cmNlOiAnUmVobWFuIHBhcGVyIGFuYWx5dGljYWwnLFxuICAgICAgICBtZXRyaWM6ICdpbmR1Y2VkRHJhZ0snLFxuICAgICAgICBhbHRpdHVkZU1ldGVyczogMCxcbiAgICAgICAgcmVmZXJlbmNlOiAwLjE0ODksXG4gICAgICAgIHRvbGVyYW5jZTogMC4wMDAxLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2NsX2FscGhhX3BhcGVyJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdMaWZ0LWN1cnZlIHNsb3BlJyxcbiAgICAgICAgc291cmNlOiAnUmVobWFuIHBhcGVyIC8gTkFDQSA2NEEyMDQnLFxuICAgICAgICBtZXRyaWM6ICdjbEFscGhhUGVyUmFkJyxcbiAgICAgICAgYWx0aXR1ZGVNZXRlcnM6IDAsXG4gICAgICAgIHJlZmVyZW5jZTogNS43MyxcbiAgICAgICAgdG9sZXJhbmNlOiAwLjAxLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2xkX21heF9wYXBlcicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTWF4aW11bSBsaWZ0LXRvLWRyYWcgcmF0aW8gYXQgzrEg4omIIDLCsCcsXG4gICAgICAgIHNvdXJjZTogJ1JlaG1hbiBGaWcuIDcnLFxuICAgICAgICBtZXRyaWM6ICdtYXhMaWZ0VG9EcmFnJyxcbiAgICAgICAgYWx0aXR1ZGVNZXRlcnM6IDAsXG4gICAgICAgIGFscGhhRGVnOiAyLFxuICAgICAgICByZWZlcmVuY2U6IDkuNjYsXG4gICAgICAgIHRvbGVyYW5jZTogMC4zLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2NydWlzZV9zcGVlZF9wYXBlcicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQ3J1aXNlIHRydWUgYWlyc3BlZWQgYXQgMzAsMDAwIGZ0JyxcbiAgICAgICAgc291cmNlOiAnUmVobWFuIFNlY3Rpb24gSUlJICg4NDYgZnQvcyknLFxuICAgICAgICBtZXRyaWM6ICdjcnVpc2VTcGVlZE1wcycsXG4gICAgICAgIGFsdGl0dWRlTWV0ZXJzOiBGMTZfUFJPRklMRS5jcnVpc2VBbHRpdHVkZU0sXG4gICAgICAgIHJlZmVyZW5jZTogRjE2X1BST0ZJTEUuY3J1aXNlU3BlZWRNcHMsXG4gICAgICAgIHRvbGVyYW5jZTogMC41LFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ3dpbmdfYXJlYScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnV2luZyByZWZlcmVuY2UgYXJlYSAoMzAwIGZ0wrIpJyxcbiAgICAgICAgc291cmNlOiAnSmFuZVxcJ3MgLyBSZWhtYW4gcGFwZXInLFxuICAgICAgICBtZXRyaWM6ICd3aW5nQXJlYU0yJyxcbiAgICAgICAgYWx0aXR1ZGVNZXRlcnM6IDAsXG4gICAgICAgIHJlZmVyZW5jZTogMjcuODcsXG4gICAgICAgIHRvbGVyYW5jZTogMC4wNSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6ICdhYl90aHJ1c3Rfc2wnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0Z1bGwgYWZ0ZXJidXJuZXIgdGhydXN0IGF0IHNlYSBsZXZlbCcsXG4gICAgICAgIHNvdXJjZTogJ0YxMDAtUFctMjI5ICgxMjkuNCBrTiknLFxuICAgICAgICBtZXRyaWM6ICdhYlRocnVzdEtuJyxcbiAgICAgICAgYWx0aXR1ZGVNZXRlcnM6IDAsXG4gICAgICAgIHJlZmVyZW5jZTogMTI5LjQsXG4gICAgICAgIHRvbGVyYW5jZTogMi4wLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ21heF9tYWNoX2ZsNDAwJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdNYXhpbXVtIE1hY2ggYXQgNDAsMDAwIGZ0IChBQiwgdGhydXN04oCTZHJhZyBiYWxhbmNlKScsXG4gICAgICAgIHNvdXJjZTogJ1NpbSBlbnZlbG9wZSB3aXRoIEFuZGVyc29uIHBvbGFyICsgdHJhbnNvbmljIGRyYWcnLFxuICAgICAgICBtZXRyaWM6ICdtYXhNYWNoJyxcbiAgICAgICAgYWx0aXR1ZGVNZXRlcnM6IDEyMTkyLFxuICAgICAgICByZWZlcmVuY2U6IDEuODksXG4gICAgICAgIHRvbGVyYW5jZTogMC4xMixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6ICdwZWFrX3NwZWVkX2FsdGl0dWRlJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdBbHRpdHVkZSBvZiBwZWFrIGxldmVsLWZsaWdodCBtYXggc3BlZWQnLFxuICAgICAgICBzb3VyY2U6ICdTaW0gZW52ZWxvcGUgKElTQSB0aHJ1c3QgbGFwc2UpJyxcbiAgICAgICAgbWV0cmljOiAncGVha01heFNwZWVkQWx0aXR1ZGVNJyxcbiAgICAgICAgYWx0aXR1ZGVNZXRlcnM6IDAsXG4gICAgICAgIHJlZmVyZW5jZTogMTEwMDAsXG4gICAgICAgIHRvbGVyYW5jZTogNTAwLFxuICAgIH0sXG5dO1xuXG5leHBvcnQgY29uc3QgTVBTX1RPX0tUUyA9IDEuOTQzODQ7XG4iLCJpbXBvcnQgeyBjbGFtcCB9IGZyb20gJy4uL3V0aWxzL21hdGgnO1xuXG4vKiogRkJXIHJvbGwtYXhpcyBlbnZlbG9wZSAoQ2F0IEkgY2xlYW4pLiBDYXQgSUlJIGxvd2VycyBtYXggcmF0ZSBmb3IgaGVhdnkgc3RvcmVzLiAqL1xuZXhwb3J0IGludGVyZmFjZSBGMTZSb2xsQ29udHJvbENvbmZpZyB7XG4gICAgbWF4Um9sbFJhdGVEZWdTOiBudW1iZXI7XG4gICAgYWN0dWF0b3JUYXVTOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjb25zdCBGMTZfUk9MTF9DQVQxOiBGMTZSb2xsQ29udHJvbENvbmZpZyA9IHtcbiAgICBtYXhSb2xsUmF0ZURlZ1M6IDMwMCxcbiAgICBhY3R1YXRvclRhdVM6IDAuMDc1LFxufTtcblxuZXhwb3J0IGNvbnN0IEYxNl9ST0xMX0NBVDM6IEYxNlJvbGxDb250cm9sQ29uZmlnID0ge1xuICAgIG1heFJvbGxSYXRlRGVnUzogMTgwLFxuICAgIGFjdHVhdG9yVGF1UzogMC4wOSxcbn07XG5cbmNvbnN0IERFR19UT19SQUQgPSBNYXRoLlBJIC8gMTgwO1xuXG5jb25zdCBNSU5fUV9HQUlOID0gMC4xMjtcbmNvbnN0IE1BWF9RX0dBSU4gPSAxLjA7XG5cbmV4cG9ydCBmdW5jdGlvbiBtYXhSb2xsUmF0ZVJhZChjb25maWc6IEYxNlJvbGxDb250cm9sQ29uZmlnKTogbnVtYmVyIHtcbiAgICByZXR1cm4gY29uZmlnLm1heFJvbGxSYXRlRGVnUyAqIERFR19UT19SQUQ7XG59XG5cbi8qKiBHYWluIGZhbGxzIGFzIGR5bmFtaWMgcHJlc3N1cmUgcmlzZXMg4oCUIEZCVyBsaW1pdHMgY29tbWFuZCB0byBwcm90ZWN0IHN0cnVjdHVyZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlRjE2Um9sbER5bmFtaWNQcmVzc3VyZUdhaW4oZHluYW1pY1ByZXNzdXJlOiBudW1iZXIsIHFSZWY6IG51bWJlcik6IG51bWJlciB7XG4gICAgY29uc3QgcSA9IE1hdGgubWF4KGR5bmFtaWNQcmVzc3VyZSwgMSk7XG4gICAgY29uc3QgcmVmID0gTWF0aC5tYXgocVJlZiwgMSk7XG4gICAgY29uc3QgcmF3ID0gTUlOX1FfR0FJTiArIChNQVhfUV9HQUlOIC0gTUlOX1FfR0FJTikgKiBNYXRoLnNxcnQocmVmIC8gKHJlZiArIHEpKTtcbiAgICByZXR1cm4gY2xhbXAocmF3LCBNSU5fUV9HQUlOLCBNQVhfUV9HQUlOKTtcbn1cblxuZnVuY3Rpb24gbWFjaFJvbGxMaW1pdGVyKG1hY2g6IG51bWJlcik6IG51bWJlciB7XG4gICAgaWYgKG1hY2ggPD0gMC44NSkge1xuICAgICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgcmV0dXJuIGNsYW1wKDEgLSAobWFjaCAtIDAuODUpIC8gMC41NSwgMC4zNSwgMSk7XG59XG5cbmZ1bmN0aW9uIGFsdGl0dWRlUm9sbExpbWl0ZXIoYWx0aXR1ZGVNOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGlmIChhbHRpdHVkZU0gPD0gMTIwMDApIHtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICAgIHJldHVybiBjbGFtcCgxIC0gKGFsdGl0dWRlTSAtIDEyMDAwKSAvIDIwMDAwLCAwLjQ1LCAxKTtcbn1cblxuZnVuY3Rpb24gYW9hUm9sbExpbWl0ZXIoYW9hUmFkOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IGFvYURlZyA9IE1hdGguYWJzKGFvYVJhZCkgKiAoMTgwIC8gTWF0aC5QSSk7XG4gICAgaWYgKGFvYURlZyA8PSAxNSkge1xuICAgICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgcmV0dXJuIGNsYW1wKDEgLSAoYW9hRGVnIC0gMTUpIC8gMjIsIDAuMTUsIDEpO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEYxNlJvbGxDb21tYW5kSW5wdXRzIHtcbiAgICBzdGljazogbnVtYmVyO1xuICAgIGR5bmFtaWNQcmVzc3VyZTogbnVtYmVyO1xuICAgIHFSZWY6IG51bWJlcjtcbiAgICBtYWNoOiBudW1iZXI7XG4gICAgYWx0aXR1ZGVNOiBudW1iZXI7XG4gICAgYW9hUmFkOiBudW1iZXI7XG4gICAgZmxhcHNFeHRlbmRlZDogYm9vbGVhbjtcbiAgICBsYW5kZWQ6IGJvb2xlYW47XG4gICAgY29uZmlnOiBGMTZSb2xsQ29udHJvbENvbmZpZztcbn1cblxuLyoqIFN0aWNrIFstMSwgMV0g4oaSIGNvbW1hbmRlZCBib2R5IHJvbGwgcmF0ZSBwX2NtZCAocmFkL3MpLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVGMTZDb21tYW5kZWRSb2xsUmF0ZShpbnB1dHM6IEYxNlJvbGxDb21tYW5kSW5wdXRzKTogbnVtYmVyIHtcbiAgICBpZiAoaW5wdXRzLmxhbmRlZCB8fCBNYXRoLmFicyhpbnB1dHMuc3RpY2spIDwgMWUtNikge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICBjb25zdCBmbGFwRmFjdG9yID0gaW5wdXRzLmZsYXBzRXh0ZW5kZWQgPyAwLjY1IDogMTtcbiAgICBjb25zdCBsaW1pdGVyID0gbWFjaFJvbGxMaW1pdGVyKGlucHV0cy5tYWNoKVxuICAgICAgICAqIGFsdGl0dWRlUm9sbExpbWl0ZXIoaW5wdXRzLmFsdGl0dWRlTSlcbiAgICAgICAgKiBhb2FSb2xsTGltaXRlcihpbnB1dHMuYW9hUmFkKVxuICAgICAgICAqIGZsYXBGYWN0b3I7XG5cbiAgICBjb25zdCBxR2FpbiA9IGNvbXB1dGVGMTZSb2xsRHluYW1pY1ByZXNzdXJlR2FpbihpbnB1dHMuZHluYW1pY1ByZXNzdXJlLCBpbnB1dHMucVJlZik7XG4gICAgcmV0dXJuIGlucHV0cy5zdGljayAqIG1heFJvbGxSYXRlUmFkKGlucHV0cy5jb25maWcpICogcUdhaW4gKiBsaW1pdGVyO1xufVxuXG4vKiogRmlyc3Qtb3JkZXIgZmxhcGVyb24vYWN0dWF0b3IgbGFnIHRvd2FyZCBjb21tYW5kZWQgcmF0ZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdGVwRjE2Qm9keVJvbGxSYXRlKFxuICAgIGJvZHlSb2xsUmF0ZVJhZDogbnVtYmVyLFxuICAgIGNvbW1hbmRlZFJhdGVSYWQ6IG51bWJlcixcbiAgICBkZWx0YTogbnVtYmVyLFxuICAgIGNvbmZpZzogRjE2Um9sbENvbnRyb2xDb25maWcsXG4pOiBudW1iZXIge1xuICAgIGlmIChkZWx0YSA8PSAwKSB7XG4gICAgICAgIHJldHVybiBib2R5Um9sbFJhdGVSYWQ7XG4gICAgfVxuICAgIGNvbnN0IGFscGhhID0gMSAtIE1hdGguZXhwKC1kZWx0YSAvIE1hdGgubWF4KGNvbmZpZy5hY3R1YXRvclRhdVMsIDFlLTMpKTtcbiAgICByZXR1cm4gYm9keVJvbGxSYXRlUmFkICsgKGNvbW1hbmRlZFJhdGVSYWQgLSBib2R5Um9sbFJhdGVSYWQpICogYWxwaGE7XG59XG5cbi8qKiBIaWdoLUFvQSByb2xs4oCTeWF3IGNvdXBsaW5nOiBhdXRvIHJ1ZGRlciB0byBjb29yZGluYXRlIGFuZCBsaW1pdCBzaWRlc2xpcCBidWlsZHVwLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVGMTZSb2xsWWF3Q291cGxpbmcoYm9keVJvbGxSYXRlUmFkOiBudW1iZXIsIGFvYVJhZDogbnVtYmVyLCBtYXhSb2xsUmF0ZVJhZDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBjb25zdCBhb2FGYWN0b3IgPSBjbGFtcCgoTWF0aC5hYnMoYW9hUmFkKSAtIDAuMTIpIC8gMC40LCAwLCAxKTtcbiAgICBpZiAoYW9hRmFjdG9yIDw9IDAgfHwgbWF4Um9sbFJhdGVSYWQgPD0gMCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgY29uc3Qgbm9ybWFsaXplZFJvbGwgPSBjbGFtcChib2R5Um9sbFJhdGVSYWQgLyBtYXhSb2xsUmF0ZVJhZCwgLTEsIDEpO1xuICAgIHJldHVybiBub3JtYWxpemVkUm9sbCAqIDAuNCAqIGFvYUZhY3Rvcjtcbn1cbiIsIi8qKlxuICogQSBzaW5nbGUgcmlnaWQgYWVyb2R5bmFtaWMgc3VyZmFjZSBmb3IgdGhlIEZNMiBwYXJ0cyBtb2RlbC5cbiAqXG4gKiBHaXZlbiB0aGUgYWlyY3JhZnQncyBib2R5LWZyYW1lIGxpbmVhciB2ZWxvY2l0eSwgYm9keSBhbmd1bGFyIHZlbG9jaXR5IGFuZFxuICogdGhlIGxvY2FsIGFpciBkZW5zaXR5LCB0aGUgc3VyZmFjZSBjb21wdXRlcyB0aGUgbGlmdCArIGRyYWcgZm9yY2UgaXQgcHJvZHVjZXNcbiAqIGFuZCB0aGUgbW9tZW50IHRoYXQgZm9yY2UgZXhlcnRzIGFib3V0IHRoZSBDRy4gVGhlIGtleSBkZXRhaWwgdGhhdCBtYWtlcyB0aGVcbiAqIHdob2xlIG1vZGVsIGJlaGF2ZSBpcyB0aGF0IHRoZSBhaXJmbG93IHNlZW4gYnkgdGhlIHN1cmZhY2UgaW5jbHVkZXMgdGhlXG4gKiB2ZWxvY2l0eSBjb250cmlidXRlZCBieSByb3RhdGlvbiBhdCBpdHMgb3duIGxvY2F0aW9uOlxuICpcbiAqICAgICB1X2xvY2FsID0gdl9ib2R5ICsgz4kgw5cgclxuICpcbiAqIEEgcGl0Y2ggcmF0ZSB0aGVyZWZvcmUgcmFpc2VzIHRoZSBBb0Egb2YgdGhlIHRhaWwsIGEgcm9sbCByYXRlIHJhaXNlcyB0aGUgQW9BXG4gKiBvZiB0aGUgZG93bi1nb2luZyB3aW5nLCBhbmQgYSB5YXcgcmF0ZSBsb2FkcyB0aGUgZmluIOKAlCBpLmUuIHBpdGNoLCByb2xsIGFuZFxuICogeWF3IGFlcm9keW5hbWljIGRhbXBpbmcgYWxsIGFwcGVhciBhdXRvbWF0aWNhbGx5IGZyb20gdGhlIGdlb21ldHJ5LlxuICovXG5pbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgeyBTdXJmYWNlR2VvbWV0cnkgfSBmcm9tICcuL2YxNkZtMkNvbmZpZyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3VyZmFjZUlucHV0IHtcbiAgICAvKiogQm9keS1mcmFtZSB2ZWxvY2l0eSBvZiB0aGUgQ0cgdGhyb3VnaCB0aGUgYWlyIChtL3MpLiAqL1xuICAgIHZlbG9jaXR5Qm9keTogVEhSRUUuVmVjdG9yMztcbiAgICAvKiogQm9keS1mcmFtZSBhbmd1bGFyIHZlbG9jaXR5IChyYWQvcykuICovXG4gICAgYW5ndWxhclZlbG9jaXR5Qm9keTogVEhSRUUuVmVjdG9yMztcbiAgICAvKiogQWlyIGRlbnNpdHkgKGtnL23CsykuICovXG4gICAgYWlyRGVuc2l0eTogbnVtYmVyO1xuICAgIC8qKiBFZmZlY3RpdmUgaW5jaWRlbmNlIGFkZGVkIGJ5IGNvbnRyb2wgZGVmbGVjdGlvbiAocmFkKS4gKi9cbiAgICBjb250cm9sRGVsdGFBb2FSYWQ6IG51bWJlcjtcbiAgICAvKiogU3ltbWV0cmljIGNhbWJlciBiaWFzLCBlLmcuIGZsYXBzIChyYWQpLiAqL1xuICAgIGNhbWJlckJpYXNSYWQ6IG51bWJlcjtcbiAgICAvKiogUmVkdWN0aW9uIG9mIHRoZSBzdGFsbCBBb0EsIGUuZy4gZnJvbSBmbGFwcyAocmFkKS4gKi9cbiAgICBzdGFsbFNoaWZ0UmFkOiBudW1iZXI7XG4gICAgLyoqIEFkZGl0aW9uYWwgcHJvZmlsZSBkcmFnIGNvZWZmaWNpZW50IChyZWZlcmVuY2VkIHRvIHRoaXMgc3VyZmFjZSdzIGFyZWEpLiAqL1xuICAgIGV4dHJhQ2Q6IG51bWJlcjtcbn1cblxuZXhwb3J0IGNsYXNzIEFlcm9TdXJmYWNlIHtcbiAgICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSByZWFkb25seSBnZW9tOiBTdXJmYWNlR2VvbWV0cnk7XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IHBvc2l0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IHVwID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGZvcndhcmQgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgc3BhbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IF91ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9yb3QgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgX2RyYWdEaXIgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgX2xpZnREaXIgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG4gICAgLyoqIExhc3QgY29tcHV0ZWQgYW5nbGUgb2YgYXR0YWNrIGZvciB0aGlzIHN1cmZhY2UgKHJhZCk7IHVzZWZ1bCB0ZWxlbWV0cnkuICovXG4gICAgbGFzdEFvYVJhZCA9IDA7XG5cbiAgICBjb25zdHJ1Y3RvcihnZW9tOiBTdXJmYWNlR2VvbWV0cnkpIHtcbiAgICAgICAgdGhpcy5nZW9tID0gZ2VvbTtcbiAgICAgICAgdGhpcy5uYW1lID0gZ2VvbS5uYW1lO1xuICAgICAgICB0aGlzLnBvc2l0aW9uLmZyb21BcnJheShnZW9tLnBvc2l0aW9uKTtcbiAgICAgICAgdGhpcy51cC5mcm9tQXJyYXkoZ2VvbS51cCkubm9ybWFsaXplKCk7XG4gICAgICAgIHRoaXMuZm9yd2FyZC5mcm9tQXJyYXkoZ2VvbS5mb3J3YXJkKS5ub3JtYWxpemUoKTtcbiAgICAgICAgLy8gU3Bhbndpc2UgYXhpcyAodGhlIGRpcmVjdGlvbiB3ZSBpZ25vcmUgd2hlbiBtZWFzdXJpbmcgQW9BKS5cbiAgICAgICAgdGhpcy5zcGFuLmNvcHkodGhpcy51cCkuY3Jvc3ModGhpcy5mb3J3YXJkKS5ub3JtYWxpemUoKTtcbiAgICB9XG5cbiAgICBnZXQgcG9zaXRpb25Cb2R5KCk6IFRIUkVFLlZlY3RvcjMge1xuICAgICAgICByZXR1cm4gdGhpcy5wb3NpdGlvbjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBY2N1bXVsYXRlIHRoaXMgc3VyZmFjZSdzIGFlcm9keW5hbWljIGZvcmNlIGFuZCBtb21lbnQuXG4gICAgICogQHBhcmFtIGlucHV0ICAgICAgRmxpZ2h0IGNvbmRpdGlvbiBhbmQgY29udHJvbCBzdGF0ZS5cbiAgICAgKiBAcGFyYW0gb3V0Rm9yY2UgICBCb2R5LWZyYW1lIGZvcmNlIGFjY3VtdWxhdG9yIChOKSDigJQgYWRkZWQgdG8uXG4gICAgICogQHBhcmFtIG91dE1vbWVudCAgQm9keS1mcmFtZSBtb21lbnQtYWJvdXQtQ0cgYWNjdW11bGF0b3IgKE7Ct20pIOKAlCBhZGRlZCB0by5cbiAgICAgKi9cbiAgICBhY2N1bXVsYXRlKGlucHV0OiBTdXJmYWNlSW5wdXQsIG91dEZvcmNlOiBUSFJFRS5WZWN0b3IzLCBvdXRNb21lbnQ6IFRIUkVFLlZlY3RvcjMpOiB2b2lkIHtcbiAgICAgICAgLy8gTG9jYWwgdmVsb2NpdHkgdGhyb3VnaCB0aGUgYWlyIGF0IHRoZSBzdXJmYWNlOiB2ICsgz4kgw5cgci5cbiAgICAgICAgdGhpcy5fcm90LmNyb3NzVmVjdG9ycyhpbnB1dC5hbmd1bGFyVmVsb2NpdHlCb2R5LCB0aGlzLnBvc2l0aW9uKTtcbiAgICAgICAgdGhpcy5fdS5jb3B5KGlucHV0LnZlbG9jaXR5Qm9keSkuYWRkKHRoaXMuX3JvdCk7XG5cbiAgICAgICAgLy8gUmVtb3ZlIHRoZSBzcGFud2lzZSBjb21wb25lbnQgKHRoYXQgZmxvdyBkb2VzIG5vdCBtYWtlIGxpZnQgaGVyZSkuXG4gICAgICAgIGNvbnN0IHNwYW5Db21wID0gdGhpcy5fdS5kb3QodGhpcy5zcGFuKTtcbiAgICAgICAgdGhpcy5fdS5hZGRTY2FsZWRWZWN0b3IodGhpcy5zcGFuLCAtc3BhbkNvbXApO1xuXG4gICAgICAgIGNvbnN0IHNwZWVkU3EgPSB0aGlzLl91Lmxlbmd0aFNxKCk7XG4gICAgICAgIGlmIChzcGVlZFNxIDwgMWUtNCkge1xuICAgICAgICAgICAgdGhpcy5sYXN0QW9hUmFkID0gMDtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzcGVlZCA9IE1hdGguc3FydChzcGVlZFNxKTtcblxuICAgICAgICBjb25zdCB1ZiA9IHRoaXMuX3UuZG90KHRoaXMuZm9yd2FyZCk7XG4gICAgICAgIGNvbnN0IHV1ID0gdGhpcy5fdS5kb3QodGhpcy51cCk7XG4gICAgICAgIGNvbnN0IGFvYSA9IE1hdGguYXRhbjIoLXV1LCB1Zik7XG4gICAgICAgIHRoaXMubGFzdEFvYVJhZCA9IGFvYTtcblxuICAgICAgICBjb25zdCBlZmZlY3RpdmVBb2EgPSBhb2EgKyBpbnB1dC5jb250cm9sRGVsdGFBb2FSYWQgKyBpbnB1dC5jYW1iZXJCaWFzUmFkO1xuICAgICAgICBjb25zdCBzdGFsbCA9IHRoaXMuZ2VvbS5zdGFsbEFvYVJhZCAtIGlucHV0LnN0YWxsU2hpZnRSYWQ7XG4gICAgICAgIGNvbnN0IGNsID0gbGlmdENvZWZmaWNpZW50KGVmZmVjdGl2ZUFvYSwgdGhpcy5nZW9tLmxpZnRTbG9wZVBlclJhZCwgc3RhbGwpO1xuICAgICAgICBjb25zdCBzZXBhcmF0ZWQgPSBNYXRoLnNpbihlZmZlY3RpdmVBb2EpO1xuICAgICAgICBjb25zdCBjZCA9IHRoaXMuZ2VvbS5jZDAgKyBpbnB1dC5leHRyYUNkXG4gICAgICAgICAgICArIHRoaXMuZ2VvbS5pbmR1Y2VkSyAqIGNsICogY2xcbiAgICAgICAgICAgICsgMS4wICogc2VwYXJhdGVkICogc2VwYXJhdGVkO1xuXG4gICAgICAgIC8vIERyYWcgYWN0cyBkb3duc3RyZWFtIChkaXJlY3Rpb24gdGhlIGFpciBpcyBtb3ZpbmcgcmVsYXRpdmUgdG8gc3VyZmFjZSkuXG4gICAgICAgIHRoaXMuX2RyYWdEaXIuY29weSh0aGlzLl91KS5tdWx0aXBseVNjYWxhcigtMSAvIHNwZWVkKTtcbiAgICAgICAgLy8gTGlmdCBpcyBwZXJwZW5kaWN1bGFyIHRvIHRoZSByZWxhdGl2ZSB3aW5kLCBpbiB0aGUgc3VyZmFjZSdzIGxpZnQgcGxhbmUuXG4gICAgICAgIHRoaXMuX2xpZnREaXIuY3Jvc3NWZWN0b3JzKHRoaXMuc3BhbiwgdGhpcy5fZHJhZ0Rpcikubm9ybWFsaXplKCk7XG5cbiAgICAgICAgY29uc3QgcSA9IDAuNSAqIGlucHV0LmFpckRlbnNpdHkgKiBzcGVlZFNxO1xuICAgICAgICBjb25zdCBhcmVhID0gdGhpcy5nZW9tLmFyZWFNMjtcbiAgICAgICAgY29uc3QgbGlmdCA9IHEgKiBhcmVhICogY2w7XG4gICAgICAgIGNvbnN0IGRyYWcgPSBxICogYXJlYSAqIGNkO1xuXG4gICAgICAgIC8vIEZvcmNlIGNvbnRyaWJ1dGlvbi5cbiAgICAgICAgY29uc3QgZnggPSB0aGlzLl9saWZ0RGlyLnggKiBsaWZ0ICsgdGhpcy5fZHJhZ0Rpci54ICogZHJhZztcbiAgICAgICAgY29uc3QgZnkgPSB0aGlzLl9saWZ0RGlyLnkgKiBsaWZ0ICsgdGhpcy5fZHJhZ0Rpci55ICogZHJhZztcbiAgICAgICAgY29uc3QgZnogPSB0aGlzLl9saWZ0RGlyLnogKiBsaWZ0ICsgdGhpcy5fZHJhZ0Rpci56ICogZHJhZztcbiAgICAgICAgb3V0Rm9yY2UueCArPSBmeDtcbiAgICAgICAgb3V0Rm9yY2UueSArPSBmeTtcbiAgICAgICAgb3V0Rm9yY2UueiArPSBmejtcblxuICAgICAgICAvLyBNb21lbnQgYWJvdXQgQ0c6IHIgw5cgRi5cbiAgICAgICAgY29uc3QgcnggPSB0aGlzLnBvc2l0aW9uLngsIHJ5ID0gdGhpcy5wb3NpdGlvbi55LCByeiA9IHRoaXMucG9zaXRpb24uejtcbiAgICAgICAgb3V0TW9tZW50LnggKz0gcnkgKiBmeiAtIHJ6ICogZnk7XG4gICAgICAgIG91dE1vbWVudC55ICs9IHJ6ICogZnggLSByeCAqIGZ6O1xuICAgICAgICBvdXRNb21lbnQueiArPSByeCAqIGZ5IC0gcnkgKiBmeDtcbiAgICB9XG59XG5cbi8qKlxuICogTGlmdCBjb2VmZmljaWVudCB3aXRoIGEgbGluZWFyIHJhbmdlIGFuZCBhIHNtb290aCBwb3N0LXN0YWxsIGNvbGxhcHNlLlxuICogQmV5b25kIHRoZSBzdGFsbCBBb0EgdGhlIGNvZWZmaWNpZW50IGRlY2F5cyBsaWtlIGEgY29zaW5lIHNvIGxpZnQgZmFsbHMgb2ZmXG4gKiAoYW5kLCBjb21iaW5lZCB3aXRoIHRoZSBzZXBhcmF0ZWQtZmxvdyBkcmFnIHRlcm0sIHByb2R1Y2VzIGEgbm9zZSBkcm9wKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxpZnRDb2VmZmljaWVudChhb2FSYWQ6IG51bWJlciwgc2xvcGVQZXJSYWQ6IG51bWJlciwgc3RhbGxSYWQ6IG51bWJlcik6IG51bWJlciB7XG4gICAgY29uc3QgbWFnID0gTWF0aC5hYnMoYW9hUmFkKTtcbiAgICBjb25zdCBzaWduID0gTWF0aC5zaWduKGFvYVJhZCk7XG4gICAgaWYgKG1hZyA8PSBzdGFsbFJhZCkge1xuICAgICAgICByZXR1cm4gc2xvcGVQZXJSYWQgKiBhb2FSYWQ7XG4gICAgfVxuICAgIGNvbnN0IHBlYWsgPSBzbG9wZVBlclJhZCAqIHN0YWxsUmFkO1xuICAgIC8vIERlY2F5IHRvIH4wIG92ZXIgcm91Z2hseSB0aGUgbmV4dCAzNcKwLlxuICAgIGNvbnN0IGRlY2F5ID0gTWF0aC5jb3MoKG1hZyAtIHN0YWxsUmFkKSAqIDIuMik7XG4gICAgcmV0dXJuIHNpZ24gKiBwZWFrICogTWF0aC5tYXgoMCwgZGVjYXkpO1xufVxuIiwiLyoqXG4gKiBGTTIgZmx5LWJ5LXdpcmUgLyBzdGFiaWxpdHktYXVnbWVudGF0aW9uIGNvbnRyb2wgbGF3cy5cbiAqXG4gKiBUaGUgYmFyZSBGLTE2IGFpcmZyYW1lIGlzIChieSBkZXNpZ24pIGNsb3NlIHRvIG5ldXRyYWxseS9uZWdhdGl2ZWx5IHN0YWJsZSBhbmRcbiAqIGlzIG9ubHkgZmx5YWJsZSB0aHJvdWdoIGl0cyBGQlcgc3lzdGVtLiBUaGlzIG1vZHVsZSBtYXBzIHRoZSBwaWxvdCdzIHN0aWNrIGFuZFxuICogcGVkYWwgaW5wdXRzIGludG8gY29udHJvbC1zdXJmYWNlIGNvbW1hbmRzIGFuZCBjbG9zZXMgcmF0ZS9nIGxvb3BzIGFyb3VuZCB0aGVcbiAqIGFpcmZyYW1lIHNvIHRoYXQgdGhlIGhhbmRsaW5nIHF1YWxpdGllcyDigJQgbm90IHRoZSByYXcgYWVyb2R5bmFtaWNzIOKAlCBkZWZpbmUgdGhlXG4gKiBmZWVsOlxuICogICAtIFBpdGNoOiBhIGctY29tbWFuZCBsYXcgd2l0aCBwaXRjaC1yYXRlIGRhbXBpbmcsIGFuIGFuZ2xlLW9mLWF0dGFjayBsaW1pdGVyXG4gKiAgICAgYW5kIHRoZSBzdHJ1Y3R1cmFsIGcgZW52ZWxvcGUuXG4gKiAgIC0gUm9sbDogYSByb2xsLXJhdGUgY29tbWFuZCAoY2FwcGVkIG5lYXIgfjMwMMKwL3MsIGZhZGVkIGJ5IGR5bmFtaWMgcHJlc3N1cmUsXG4gKiAgICAgTWFjaCwgYWx0aXR1ZGUgYW5kIEFvQSkgZHJpdmluZyBhaWxlcm9ucyBwbHVzIGEgZGlmZmVyZW50aWFsIHN0YWJpbGF0b3IuXG4gKiAgIC0gWWF3OiBhIHdhc2hlZC1vdXQgeWF3LXJhdGUgZGFtcGVyIHBsdXMgYW4gYWlsZXJvbi1ydWRkZXIgaW50ZXJjb25uZWN0IGZvclxuICogICAgIHR1cm4gY29vcmRpbmF0aW9uLCB3aXRoIGRpcmVjdCBwZWRhbCBhdXRob3JpdHkgb24gdG9wLlxuICpcbiAqIE91dHB1dHMgYXJlIG5vcm1hbGl6ZWQgY29tbWFuZHMgaW4gWy0xLCAxXTsgdGhlIGZsaWdodCBtb2RlbCBjb252ZXJ0cyB0aGVtIGludG9cbiAqIHBoeXNpY2FsIHN1cmZhY2UgaW5jaWRlbmNlIGZvciB0aGUgYWVybyBwYXJ0cy4gRmlyc3Qtb3JkZXIgYWN0dWF0b3IgbGFnIGlzXG4gKiBhcHBsaWVkIHNvIHN1cmZhY2VzIGNhbm5vdCBzbmFwIGluc3RhbnRhbmVvdXNseS5cbiAqL1xuaW1wb3J0IHsgY2xhbXAgfSBmcm9tICcuLi8uLi91dGlscy9tYXRoJztcbmltcG9ydCB7IGNvbXB1dGVNYWNoTnVtYmVyIH0gZnJvbSAnLi4vYWVyb1V0aWxzJztcbmltcG9ydCB7IGNvbXB1dGVGMTZDb21tYW5kZWRSb2xsUmF0ZSwgRjE2X1JPTExfQ0FUMSB9IGZyb20gJy4uL2YxNlJvbGxDb250cm9sJztcbmltcG9ydCB7IEZNMl9GQ1MgfSBmcm9tICcuL2YxNkZtMkNvbmZpZyc7XG5cbmNvbnN0IERFRyA9IE1hdGguUEkgLyAxODA7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRmNzSW5wdXQge1xuICAgIHBpdGNoU3RpY2s6IG51bWJlcjsgLy8gWy0xLCAxXSBwb3NpdGl2ZSA9IG5vc2UgdXAgLyBwdWxsXG4gICAgcm9sbFN0aWNrOiBudW1iZXI7ICAvLyBbLTEsIDFdIHBvc2l0aXZlID0gcm9sbCByaWdodFxuICAgIHlhd1BlZGFsOiBudW1iZXI7ICAgLy8gWy0xLCAxXSBwb3NpdGl2ZSA9IG5vc2UgcmlnaHRcbiAgICAvKiogQm9keSBhbmd1bGFyIHZlbG9jaXR5IGNvbXBvbmVudHMgKHJhZC9zKS4gKi9cbiAgICBwaXRjaFJhdGU6IG51bWJlcjsgIC8vIGFib3V0ICtYXG4gICAgeWF3UmF0ZTogbnVtYmVyOyAgICAvLyBhYm91dCArWVxuICAgIHJvbGxSYXRlOiBudW1iZXI7ICAgLy8gYWJvdXQgK1pcbiAgICBsb2FkRmFjdG9yRzogbnVtYmVyO1xuICAgIGFvYVJhZDogbnVtYmVyO1xuICAgIGR5bmFtaWNQcmVzc3VyZTogbnVtYmVyO1xuICAgIHFSZWY6IG51bWJlcjtcbiAgICBzcGVlZDogbnVtYmVyO1xuICAgIGFsdGl0dWRlTTogbnVtYmVyO1xuICAgIGZsYXBzRXh0ZW5kZWQ6IGJvb2xlYW47XG4gICAgbGFuZGVkOiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEZjc091dHB1dCB7XG4gICAgLyoqIEVsZXZhdG9yIGNvbW1hbmQsIHBvc2l0aXZlID0gbm9zZSB1cC4gKi9cbiAgICBlbGV2YXRvcjogbnVtYmVyO1xuICAgIC8qKiBBaWxlcm9uIGNvbW1hbmQsIHBvc2l0aXZlID0gcm9sbCByaWdodC4gKi9cbiAgICBhaWxlcm9uOiBudW1iZXI7XG4gICAgLyoqIFJ1ZGRlciBjb21tYW5kLCBwb3NpdGl2ZSA9IG5vc2UgcmlnaHQuICovXG4gICAgcnVkZGVyOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBGMTZGY3Mge1xuICAgIHByaXZhdGUgZWxldmF0b3IgPSAwO1xuICAgIHByaXZhdGUgYWlsZXJvbiA9IDA7XG4gICAgcHJpdmF0ZSBydWRkZXIgPSAwO1xuICAgIHByaXZhdGUgeWF3UmF0ZUxvd1Bhc3MgPSAwO1xuICAgIHByaXZhdGUgcGl0Y2hJbnRlZ3JhbCA9IDA7XG4gICAgcHJpdmF0ZSBwcmV2QW9hID0gMDtcbiAgICBwcml2YXRlIGFvYVJhdGVGaWx0ID0gMDtcbiAgICBwcml2YXRlIHByZXZBb2FWYWxpZCA9IGZhbHNlO1xuXG4gICAgcmVzZXQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuZWxldmF0b3IgPSAwO1xuICAgICAgICB0aGlzLmFpbGVyb24gPSAwO1xuICAgICAgICB0aGlzLnJ1ZGRlciA9IDA7XG4gICAgICAgIHRoaXMueWF3UmF0ZUxvd1Bhc3MgPSAwO1xuICAgICAgICB0aGlzLnBpdGNoSW50ZWdyYWwgPSAwO1xuICAgICAgICB0aGlzLnByZXZBb2EgPSAwO1xuICAgICAgICB0aGlzLmFvYVJhdGVGaWx0ID0gMDtcbiAgICAgICAgdGhpcy5wcmV2QW9hVmFsaWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBnZXRTdGF0ZSgpOiBGY3NPdXRwdXQge1xuICAgICAgICByZXR1cm4geyBlbGV2YXRvcjogdGhpcy5lbGV2YXRvciwgYWlsZXJvbjogdGhpcy5haWxlcm9uLCBydWRkZXI6IHRoaXMucnVkZGVyIH07XG4gICAgfVxuXG4gICAgdXBkYXRlKGlucHV0OiBGY3NJbnB1dCwgZHQ6IG51bWJlcik6IEZjc091dHB1dCB7XG4gICAgICAgIGNvbnN0IGVsZXZhdG9yVGFyZ2V0ID0gdGhpcy5waXRjaExhdyhpbnB1dCwgZHQpO1xuICAgICAgICBjb25zdCBhaWxlcm9uVGFyZ2V0ID0gdGhpcy5yb2xsTGF3KGlucHV0KTtcbiAgICAgICAgY29uc3QgcnVkZGVyVGFyZ2V0ID0gdGhpcy55YXdMYXcoaW5wdXQsIGFpbGVyb25UYXJnZXQsIGR0KTtcblxuICAgICAgICAvLyBGaXJzdC1vcmRlciBhY3R1YXRvciBsYWcgdG93YXJkIHRoZSBjb21tYW5kZWQgZGVmbGVjdGlvbi5cbiAgICAgICAgY29uc3QgYSA9IGR0IDw9IDAgPyAxIDogMSAtIE1hdGguZXhwKC1kdCAvIE1hdGgubWF4KEZNMl9GQ1MuYWN0dWF0b3JUYXVTLCAxZS0zKSk7XG4gICAgICAgIHRoaXMuZWxldmF0b3IgKz0gKGVsZXZhdG9yVGFyZ2V0IC0gdGhpcy5lbGV2YXRvcikgKiBhO1xuICAgICAgICB0aGlzLmFpbGVyb24gKz0gKGFpbGVyb25UYXJnZXQgLSB0aGlzLmFpbGVyb24pICogYTtcbiAgICAgICAgdGhpcy5ydWRkZXIgKz0gKHJ1ZGRlclRhcmdldCAtIHRoaXMucnVkZGVyKSAqIGE7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0U3RhdGUoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBnLWNvbW1hbmQgcGl0Y2ggbGF3OiBhIFBJIHJlZ3VsYXRvciBkcml2ZXMgdGhlIGxvYWQgZmFjdG9yIHRvIHRoZSBjb21tYW5kZWRcbiAgICAgKiB2YWx1ZSAoc28gbmV1dHJhbCBzdGljayBob2xkcyAxIGcgLyBsZXZlbCBmbGlnaHQgd2l0aCBubyBzdGVhZHkgZXJyb3IsIGxpa2VcbiAgICAgKiB0aGUgRi0xNidzIGludGVncmFsIHRyaW0pLCB3aXRoIHBpdGNoLXJhdGUgZGFtcGluZyBhbmQgYW4gQW9BIGxpbWl0ZXIuXG4gICAgICovXG4gICAgcHJpdmF0ZSBwaXRjaExhdyhpbnB1dDogRmNzSW5wdXQsIGR0OiBudW1iZXIpOiBudW1iZXIge1xuICAgICAgICBjb25zdCB7IG1heENvbW1hbmRHLCBtaW5Db21tYW5kRywgcGl0Y2hHR2FpbiwgcGl0Y2hJR2FpbiwgcGl0Y2hSYXRlRGFtcEdhaW4gfSA9IEZNMl9GQ1M7XG5cbiAgICAgICAgLy8gU3RpY2sgc2hhcGluZzogZXhwbyBzbyBhIGxpZ2h0IHB1bGwgaXMgZ2VudGxlIHdoaWxlIGZ1bGwgc3RpY2sgc3RpbGxcbiAgICAgICAgLy8gcmVhY2hlcyB0aGUgc3RydWN0dXJhbCBsaW1pdCAoYSBzbWFsbCBkZWZsZWN0aW9uIG5vIGxvbmdlciBkZW1hbmRzIGFcbiAgICAgICAgLy8gaGlnaCBnIHRoZSBqZXQgY2Fubm90IGhvbGQgYXQgYXBwcm9hY2ggc3BlZWQpLlxuICAgICAgICBjb25zdCBlID0gRk0yX0ZDUy5waXRjaFN0aWNrRXhwbztcbiAgICAgICAgY29uc3Qgc2hhcGVkU3RpY2sgPSAoMSAtIGUpICogaW5wdXQucGl0Y2hTdGljayArIGUgKiBpbnB1dC5waXRjaFN0aWNrICoqIDM7XG5cbiAgICAgICAgLy8gU3RpY2sg4oaSIGNvbW1hbmRlZCBsb2FkIGZhY3RvciAoYWJvdXQgMSBnIGF0IG5ldXRyYWwgc3RpY2spLlxuICAgICAgICBsZXQgY29tbWFuZGVkRzogbnVtYmVyO1xuICAgICAgICBpZiAoc2hhcGVkU3RpY2sgPj0gMCkge1xuICAgICAgICAgICAgY29tbWFuZGVkRyA9IDEgKyBzaGFwZWRTdGljayAqIChtYXhDb21tYW5kRyAtIDEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29tbWFuZGVkRyA9IDEgKyBzaGFwZWRTdGljayAqICgxIC0gbWluQ29tbWFuZEcpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQW5nbGUtb2YtYXR0YWNrIHJhdGUgKM6xzIcpLCBsb3ctcGFzcyBmaWx0ZXJlZC4gVGhpcyBpcyB0aGUgc2hvcnQtcGVyaW9kXG4gICAgICAgIC8vIGRhbXBlcjogd2hlbiB0aGUgYWlyY3JhZnQgaXMgZW5lcmd5LWxpbWl0ZWQgaXQgY2Fubm90IGhvbGQgdGhlIGNvbW1hbmRlZFxuICAgICAgICAvLyBnLCBzbyB0aGUgbG9hZC1mYWN0b3IgbG9vcCBhbG9uZSBodW50cyBhcm91bmQgdGhlIEFvQSBsaW1pdC4gRGFtcGluZyDOscyHXG4gICAgICAgIC8vIGRpcmVjdGx5IGtpbGxzIHRoYXQgb3NjaWxsYXRpb24gcmVnYXJkbGVzcyBvZiBhdmFpbGFibGUgdGhydXN0LlxuICAgICAgICBsZXQgYW9hUmF0ZSA9IDA7XG4gICAgICAgIGlmICh0aGlzLnByZXZBb2FWYWxpZCAmJiBkdCA+IDApIHtcbiAgICAgICAgICAgIGFvYVJhdGUgPSAoaW5wdXQuYW9hUmFkIC0gdGhpcy5wcmV2QW9hKSAvIGR0O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucHJldkFvYSA9IGlucHV0LmFvYVJhZDtcbiAgICAgICAgdGhpcy5wcmV2QW9hVmFsaWQgPSB0cnVlO1xuICAgICAgICBjb25zdCBmQW9hID0gZHQgPD0gMCA/IDEgOiAxIC0gTWF0aC5leHAoLWR0IC8gTWF0aC5tYXgoRk0yX0ZDUy5hb2FSYXRlRmlsdGVyVGF1UywgMWUtMykpO1xuICAgICAgICB0aGlzLmFvYVJhdGVGaWx0ICs9IChhb2FSYXRlIC0gdGhpcy5hb2FSYXRlRmlsdCkgKiBmQW9hO1xuXG4gICAgICAgIC8vIEFvQSBsaW1pdGVyOiBmYWRlIHRoZSBub3NlLXVwIGF1dGhvcml0eSBhcyBBb0EgYXBwcm9hY2hlcyB0aGUgbGltaXQuXG4gICAgICAgIGNvbnN0IGFvYURlZyA9IGlucHV0LmFvYVJhZCAvIERFRztcbiAgICAgICAgY29uc3QgYW9hTGltaXRlciA9IGNsYW1wKFxuICAgICAgICAgICAgKEZNMl9GQ1MuYW9hTGltaXREZWcgLSBhb2FEZWcpIC8gKEZNMl9GQ1MuYW9hTGltaXREZWcgLSBGTTJfRkNTLmFvYVNvZnREZWcpLFxuICAgICAgICAgICAgMCwgMSxcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKGNvbW1hbmRlZEcgPiAxKSB7XG4gICAgICAgICAgICBjb21tYW5kZWRHID0gMSArIChjb21tYW5kZWRHIC0gMSkgKiBhb2FMaW1pdGVyO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZ0Vycm9yID0gY29tbWFuZGVkRyAtIGlucHV0LmxvYWRGYWN0b3JHO1xuICAgICAgICAvLyBwaXRjaFJhdGUgYWJvdXQgK1ggaXMgbm9zZS1kb3duLXBvc2l0aXZlLCBzbyArcGl0Y2hSYXRlIGRhbXBzIGEgbm9zZS11cFxuICAgICAgICAvLyBjb21tYW5kOyAtzrHMhyB0ZXJtIGFkZHMgZGVkaWNhdGVkIHNob3J0LXBlcmlvZCBkYW1waW5nLlxuICAgICAgICBjb25zdCBwcm9wb3J0aW9uYWwgPSBwaXRjaEdHYWluICogZ0Vycm9yXG4gICAgICAgICAgICArIHBpdGNoUmF0ZURhbXBHYWluICogaW5wdXQucGl0Y2hSYXRlXG4gICAgICAgICAgICAtIEZNMl9GQ1MucGl0Y2hBb2FSYXRlRGFtcEdhaW4gKiB0aGlzLmFvYVJhdGVGaWx0O1xuXG4gICAgICAgIC8vIEludGVncmFsIHRyaW0gd2l0aCBhbnRpLXdpbmR1cC4gRnJlZXplIHRoZSBhY2N1bXVsYXRvciB3aGVuZXZlciB0aGUgQW9BXG4gICAgICAgIC8vIGxpbWl0ZXIgaXMgYWN0aXZlIChpbiBlaXRoZXIgZXJyb3IgZGlyZWN0aW9uKSBhbmQgYmxlZWQgaXQgZG93biwgc28gaXRcbiAgICAgICAgLy8gY2Fubm90IHdpbmQgdXAgYmVsb3cgdGhlIGxpbWl0ZXIgYmFuZCBhbmQgZ2V0IGNob3BwZWQgYWJvdmUgaXQg4oCUIHRoZVxuICAgICAgICAvLyBwdW1waW5nIGFjdGlvbiB0aGF0IGRyaXZlcyB0aGUgbG93LXNwZWVkIHBpdGNoIGxpbWl0IGN5Y2xlLlxuICAgICAgICBjb25zdCBsaW1pdGVyQWN0aXZlID0gYW9hTGltaXRlciA8IDAuOTk5O1xuICAgICAgICBjb25zdCByYXcgPSBwcm9wb3J0aW9uYWwgKyBwaXRjaElHYWluICogKHRoaXMucGl0Y2hJbnRlZ3JhbCArIGdFcnJvciAqIGR0KTtcbiAgICAgICAgY29uc3Qgb3V0cHV0U2F0dXJhdGVkID0gcmF3IDw9IC0xIHx8IHJhdyA+PSAxO1xuICAgICAgICBpZiAoIW91dHB1dFNhdHVyYXRlZCAmJiAhbGltaXRlckFjdGl2ZSkge1xuICAgICAgICAgICAgdGhpcy5waXRjaEludGVncmFsID0gY2xhbXAodGhpcy5waXRjaEludGVncmFsICsgZ0Vycm9yICogZHQsIC0zLCAzKTtcbiAgICAgICAgfSBlbHNlIGlmIChsaW1pdGVyQWN0aXZlKSB7XG4gICAgICAgICAgICBjb25zdCBsZWFrID0gZHQgPD0gMCA/IDEgOiAxIC0gTWF0aC5leHAoLWR0IC8gTWF0aC5tYXgoRk0yX0ZDUy5pbnRlZ3JhbExlYWtUYXVTLCAxZS0zKSk7XG4gICAgICAgICAgICB0aGlzLnBpdGNoSW50ZWdyYWwgLT0gdGhpcy5waXRjaEludGVncmFsICogbGVhaztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBlbGV2YXRvciA9IHByb3BvcnRpb25hbCArIHBpdGNoSUdhaW4gKiB0aGlzLnBpdGNoSW50ZWdyYWw7XG4gICAgICAgIHJldHVybiBjbGFtcChlbGV2YXRvciwgLTEsIDEpO1xuICAgIH1cblxuICAgIC8qKiBSb2xsLXJhdGUgY29tbWFuZCBsYXcg4oaSIGFpbGVyb24gKGFuZCBkaWZmZXJlbnRpYWwgdGFpbCB2aWEgdGhlIG1vZGVsKS4gKi9cbiAgICBwcml2YXRlIHJvbGxMYXcoaW5wdXQ6IEZjc0lucHV0KTogbnVtYmVyIHtcbiAgICAgICAgaWYgKGlucHV0LmxhbmRlZCkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbWFjaCA9IGNvbXB1dGVNYWNoTnVtYmVyKGlucHV0LnNwZWVkLCBpbnB1dC5hbHRpdHVkZU0pO1xuICAgICAgICBjb25zdCBjb21tYW5kZWRSYXRlUmFkID0gY29tcHV0ZUYxNkNvbW1hbmRlZFJvbGxSYXRlKHtcbiAgICAgICAgICAgIHN0aWNrOiBpbnB1dC5yb2xsU3RpY2ssXG4gICAgICAgICAgICBkeW5hbWljUHJlc3N1cmU6IGlucHV0LmR5bmFtaWNQcmVzc3VyZSxcbiAgICAgICAgICAgIHFSZWY6IGlucHV0LnFSZWYsXG4gICAgICAgICAgICBtYWNoLFxuICAgICAgICAgICAgYWx0aXR1ZGVNOiBpbnB1dC5hbHRpdHVkZU0sXG4gICAgICAgICAgICBhb2FSYWQ6IGlucHV0LmFvYVJhZCxcbiAgICAgICAgICAgIGZsYXBzRXh0ZW5kZWQ6IGlucHV0LmZsYXBzRXh0ZW5kZWQsXG4gICAgICAgICAgICBsYW5kZWQ6IGlucHV0LmxhbmRlZCxcbiAgICAgICAgICAgIGNvbmZpZzogRjE2X1JPTExfQ0FUMSxcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIENsb3NlIHRoZSBsb29wIG9uIGJvZHkgcm9sbCByYXRlIChhYm91dCArWikuIEEgcG9zaXRpdmUgYWlsZXJvbiBjb21tYW5kXG4gICAgICAgIC8vIHByb2R1Y2VzIGEgTkVHQVRJVkUgcm9sbCBtb21lbnQgKHNlZSB0aGUgbW9kZWwncyBjb250cm9sIG1hcHBpbmcpLCBzbyB0aGVcbiAgICAgICAgLy8gZXJyb3IgaXMgKHJhdGUg4oiSIGNvbW1hbmQpIHRvIGtlZXAgdGhlIGZlZWRiYWNrIG5lZ2F0aXZlLlxuICAgICAgICBjb25zdCByYXRlRXJyb3IgPSBpbnB1dC5yb2xsUmF0ZSAtIGNvbW1hbmRlZFJhdGVSYWQ7XG4gICAgICAgIHJldHVybiBjbGFtcChGTTJfRkNTLnJvbGxSYXRlR2FpbiAqIHJhdGVFcnJvciwgLTEsIDEpO1xuICAgIH1cblxuICAgIC8qKiBZYXcgZGFtcGVyICh3YXNoZWQgb3V0KSArIGFpbGVyb24tcnVkZGVyIGludGVyY29ubmVjdCArIHBlZGFsLiAqL1xuICAgIHByaXZhdGUgeWF3TGF3KGlucHV0OiBGY3NJbnB1dCwgYWlsZXJvbkNtZDogbnVtYmVyLCBkdDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICAgICAgLy8gV2FzaG91dDogaGlnaC1wYXNzIHRoZSB5YXcgcmF0ZSBzbyBhIHN0ZWFkeSB0dXJuIGlzIG5vdCBvcHBvc2VkLlxuICAgICAgICBjb25zdCB0YXUgPSBNYXRoLm1heChGTTJfRkNTLnlhd0RhbXBlcldhc2hvdXRUYXVTLCAxZS0zKTtcbiAgICAgICAgY29uc3QgYSA9IGR0IDw9IDAgPyAxIDogMSAtIE1hdGguZXhwKC1kdCAvIHRhdSk7XG4gICAgICAgIHRoaXMueWF3UmF0ZUxvd1Bhc3MgKz0gKGlucHV0Lnlhd1JhdGUgLSB0aGlzLnlhd1JhdGVMb3dQYXNzKSAqIGE7XG4gICAgICAgIGNvbnN0IHlhd1JhdGVIaWdoUGFzcyA9IGlucHV0Lnlhd1JhdGUgLSB0aGlzLnlhd1JhdGVMb3dQYXNzO1xuXG4gICAgICAgIGNvbnN0IGRhbXBlciA9IC1GTTJfRkNTLnlhd0RhbXBlckdhaW4gKiB5YXdSYXRlSGlnaFBhc3M7XG4gICAgICAgIGNvbnN0IGFyaSA9IEZNMl9GQ1MuYXJpR2FpbiAqIGFpbGVyb25DbWQ7IC8vIGNvb3JkaW5hdGUgdHVybnNcbiAgICAgICAgY29uc3QgcGVkYWwgPSBpbnB1dC55YXdQZWRhbCAqIEZNMl9GQ1MubWF4UnVkZGVyQ21kO1xuICAgICAgICByZXR1cm4gY2xhbXAocGVkYWwgKyBkYW1wZXIgKyBhcmksIC0xLCAxKTtcbiAgICB9XG59XG4iLCIvKipcbiAqIEZNMiDigJQgRi0xNkMgcmlnaWQtYm9keSBcInBhcnRzXCIgZmxpZ2h0IG1vZGVsIGNvbmZpZ3VyYXRpb24uXG4gKlxuICogVGhpcyBtb2RlbCB0cmVhdHMgdGhlIGFpcmNyYWZ0IGFzIGEgc2luZ2xlIHJpZ2lkIGJvZHkgd2hvc2UgYWVyb2R5bmFtaWNcbiAqIGZvcmNlcyBhcmUgYnVpbHQgdXAgZnJvbSBkaXNjcmV0ZSBsaWZ0aW5nIHN1cmZhY2VzIChhIGNvbXBvbmVudCBidWlsZC11cCAvXG4gKiBcInBhcnRzXCIgbW9kZWwpLiBFYWNoIHN1cmZhY2UgZ2VuZXJhdGVzIGxpZnQgYW5kIGRyYWcgZnJvbSB0aGUgTE9DQUwgYWlyZmxvd1xuICogaXQgZXhwZXJpZW5jZXMsIHdoaWNoIGlzIHRoZSBhaXJjcmFmdCBib2R5IHZlbG9jaXR5IFBMVVMgdGhlIGNvbnRyaWJ1dGlvbiBvZlxuICogdGhlIGJvZHkncyBhbmd1bGFyIHZlbG9jaXR5IGF0IHRoZSBzdXJmYWNlIGxvY2F0aW9uICjPiSDDlyByKS4gQmVjYXVzZSBldmVyeVxuICogZm9yY2UgaXMgYXBwbGllZCBhdCB0aGUgc3VyZmFjZSdzIHJlYWwgbG9jYXRpb24sIHBpdGNoaW5nL3JvbGxpbmcveWF3aW5nXG4gKiBNT01FTlRTIOKAlCBhbmQsIGNydWNpYWxseSwgdGhlIGFlcm9keW5hbWljIERBTVBJTkcgb2YgdGhvc2UgcmF0ZXMg4oCUIGVtZXJnZVxuICogbmF0dXJhbGx5IGZyb20gdGhlIGdlb21ldHJ5IGluc3RlYWQgb2YgYmVpbmcgaGFuZC1hdXRob3JlZC5cbiAqXG4gKiBCb2R5IGF4ZXMgKG1hdGNoaW5nIHRoZSBzaW0ncyBUSFJFRS5qcyBjb252ZW50aW9uLCBzZWUgdXRpbHMvbWF0aC50cyk6XG4gKiAgICtYID0gUklHSFQgKG91dCB0aGUgcmlnaHQgd2luZylcbiAqICAgK1kgPSBVUFxuICogICArWiA9IEZPUldBUkQgKG91dCB0aGUgbm9zZSlcbiAqIFRoaXMgaXMgYSByaWdodC1oYW5kZWQgZnJhbWU6IFJJR0hUIMOXIFVQID0gRk9SV0FSRC5cbiAqXG4gKiBSZWZlcmVuY2UgZGF0YTpcbiAqICAgLSBHZW9tZXRyeSAvIG1hc3M6IEdlbmVyYWwgRHluYW1pY3MgRi0xNkMgKEphbmUncywgVVNBRiBmYWN0IHNoZWV0KS5cbiAqICAgLSBJbmVydGlhOiBOQVNBIFRQLTE1MzggLyBTdGV2ZW5zICYgTGV3aXMgXCJBaXJjcmFmdCBDb250cm9sIGFuZCBTaW11bGF0aW9uXCJcbiAqICAgICBub21pbmFsIEYtMTYgKGNvbnZlcnRlZCBmcm9tIHNsdWfCt2Z0wrIgYW5kIHJvdGF0ZWQgaW50byB0aGUgc2ltIGJvZHkgZnJhbWUpLlxuICogICAtIEFlcm8gY29lZmZpY2llbnRzIHR1bmVkIHRvIFJlaG1hbiwgXCJBZXJvZHluYW1pYyBQZXJmb3JtYW5jZSBBbmFseXNpcyBvZlxuICogICAgIEYtMTZDIEZpZ2h0aW5nIEZhbGNvblwiIChDRDAg4omIIDAuMDE4LCBLIOKJiCAwLjE0OSwgQ0zOsSDiiYggMy424oCTNS43L3JhZCxcbiAqICAgICBML0RfbWF4IOKJiCA5LjfigJMxNCkgYW5kIHRoZSBzaW0ncyBleGlzdGluZyBGMTZfUFJPRklMRSBlbnZlbG9wZS5cbiAqL1xuaW1wb3J0IHsgRjE2X1BST0ZJTEUgfSBmcm9tICcuLi9mMTZQcm9maWxlJztcblxuY29uc3QgREVHID0gTWF0aC5QSSAvIDE4MDtcblxuLyoqIFJlZmVyZW5jZSBnZW9tZXRyeSAoU0kpLiAqL1xuZXhwb3J0IGNvbnN0IEZNMl9HRU9NRVRSWSA9IHtcbiAgICBtYXNzS2c6IEYxNl9QUk9GSUxFLnNpbU1hc3NLZywgICAgICAvLyB+MTMsNjA4IGtnIHR5cGljYWwgdGFrZW9mZiBncm9zc1xuICAgIHdpbmdBcmVhTTI6IEYxNl9QUk9GSUxFLndpbmdBcmVhTTIsIC8vIDI3Ljg3IG3CsiByZWZlcmVuY2UgcGxhbmZvcm1cbiAgICB3aW5nU3Bhbk06IEYxNl9QUk9GSUxFLndpbmdTcGFuTSwgICAvLyA5LjQ1IG1cbiAgICBtZWFuQ2hvcmRNOiAzLjQ1LCAgICAgICAgICAgICAgICAgICAvLyBtZWFuIGFlcm9keW5hbWljIGNob3JkICh+MTEuMyBmdClcbn0gYXMgY29uc3Q7XG5cbi8qKlxuICogUHJpbmNpcGFsIG1vbWVudHMgb2YgaW5lcnRpYSBpbiB0aGUgU0lNIGJvZHkgZnJhbWUgKGtnwrdtwrIpLlxuICpcbiAqIE5BU0EvU3RldmVucy1MZXdpcyBGLTE2IChhZXJvc3BhY2UgWC1md2QsWS1yaWdodCxaLWRvd24pOlxuICogICBJeHgocm9sbCk9OTQ5NiwgSXl5KHBpdGNoKT01NTgxNCwgSXp6KHlhdyk9NjMxMDAgc2x1Z8K3ZnTCsiAgKMOXIDEuMzU1ODIg4oaSIGtnwrdtwrIpXG4gKiBNYXBwaW5nIHRvIHNpbSBheGVzOiByb2xs4oaUK1osIHBpdGNo4oaUK1gsIHlhd+KGlCtZLiBUaGUgc21hbGwgSXh6IHByb2R1Y3Qgb2ZcbiAqIGluZXJ0aWEgKOKJiDEzMzEga2fCt23CsikgaXMgbmVnbGVjdGVkIOKAlCBpdCBpcyB+MiUgb2YgdGhlIHlhdy9yb2xsIGluZXJ0aWFzIGFuZFxuICogb25seSBwcm9kdWNlcyBtaW5vciBpbmVydGlhbCByb2xs4oaUeWF3IGNyb3NzLWNvdXBsaW5nLlxuICovXG5leHBvcnQgY29uc3QgRk0yX0lORVJUSUEgPSB7XG4gICAgcGl0Y2g6IDU1ODE0ICogMS4zNTU4MiwgLy8gYWJvdXQgK1ggKFJJR0hUKSAg4omIIDc1LDY3MiBrZ8K3bcKyXG4gICAgeWF3OiA2MzEwMCAqIDEuMzU1ODIsICAgLy8gYWJvdXQgK1kgKFVQKSAgICAg4omIIDg1LDU1MiBrZ8K3bcKyXG4gICAgcm9sbDogOTQ5NiAqIDEuMzU1ODIsICAgLy8gYWJvdXQgK1ogKEZPUldBUkQpIOKJiCAxMiw4NzQga2fCt23CslxufSBhcyBjb25zdDtcblxuLyoqIEhvdyBhIHN1cmZhY2UncyBsaWZ0IHBsYW5lIGlzIG9yaWVudGVkIGluIHRoZSBib2R5IGZyYW1lLiAqL1xuZXhwb3J0IGludGVyZmFjZSBTdXJmYWNlR2VvbWV0cnkge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICAvKiogQXBwbGljYXRpb24gcG9pbnQgcmVsYXRpdmUgdG8gQ0csIGJvZHkgZnJhbWUgKG0pLiAqL1xuICAgIHBvc2l0aW9uOiBbbnVtYmVyLCBudW1iZXIsIG51bWJlcl07XG4gICAgLyoqIExpZnQgZGlyZWN0aW9uIGF0IHBvc2l0aXZlIEFvQSwgYm9keSBmcmFtZSB1bml0IHZlY3Rvci4gKi9cbiAgICB1cDogW251bWJlciwgbnVtYmVyLCBudW1iZXJdO1xuICAgIC8qKiBDaG9yZCAoemVyby1saWZ0IHJlZmVyZW5jZSkgZGlyZWN0aW9uLCBib2R5IGZyYW1lIHVuaXQgdmVjdG9yIChub21pbmFsbHkgK1opLiAqL1xuICAgIGZvcndhcmQ6IFtudW1iZXIsIG51bWJlciwgbnVtYmVyXTtcbiAgICAvKiogUGxhbmZvcm0gYXJlYSBvZiB0aGlzIHN1cmZhY2UgKG3CsikuICovXG4gICAgYXJlYU0yOiBudW1iZXI7XG4gICAgLyoqIExpZnQtY3VydmUgc2xvcGUgKHBlciByYWRpYW4pIGluIHRoZSBsaW5lYXIgcmFuZ2UuICovXG4gICAgbGlmdFNsb3BlUGVyUmFkOiBudW1iZXI7XG4gICAgLyoqIFN0YWxsIGFuZ2xlIG9mIGF0dGFjayAocmFkKS4gQmV5b25kIHRoaXMsIENMIGNvbGxhcHNlcy4gKi9cbiAgICBzdGFsbEFvYVJhZDogbnVtYmVyO1xuICAgIC8qKiBQcm9maWxlICh6ZXJvLWxpZnQpIGRyYWcgY29lZmZpY2llbnQgb2YgdGhpcyBzdXJmYWNlLiAqL1xuICAgIGNkMDogbnVtYmVyO1xuICAgIC8qKiBJbmR1Y2VkLWRyYWcgZmFjdG9yOiBDRF9pID0gaW5kdWNlZEsgwrcgQ0zCsi4gKi9cbiAgICBpbmR1Y2VkSzogbnVtYmVyO1xuICAgIC8qKiDOlEFvQSAocmFkKSBwcm9kdWNlZCBwZXIgdW5pdCBjb250cm9sIGRlZmxlY3Rpb24gWy0xLDFdICgwID0gbm8gY29udHJvbCkuICovXG4gICAgY29udHJvbEVmZmVjdGl2ZW5lc3M6IG51bWJlcjtcbn1cblxuLyoqXG4gKiBUaGUgRi0xNiBhcyBhIHNldCBvZiByaWdpZCBsaWZ0aW5nIHN1cmZhY2VzLlxuICpcbiAqIExhdGVyYWwgc3BsaXQgb2YgdGhlIHdpbmcgYW5kIGhvcml6b250YWwgdGFpbCBpcyBkZWxpYmVyYXRlOiBpdCBsZXRzIHJvbGxcbiAqIGRhbXBpbmcsIGRpZmZlcmVudGlhbC10YWlsICh0YWlsZXJvbikgcm9sbCBhdXRob3JpdHkgYW5kIGRpaGVkcmFsL3NpZGVzbGlwXG4gKiBlZmZlY3RzIGZhbGwgb3V0IG9mIHRoZSBnZW9tZXRyeSByYXRoZXIgdGhhbiBiZWluZyBmYWtlZC4gVGhlIGhvcml6b250YWwgYW5kXG4gKiB2ZXJ0aWNhbCB0YWlscyBzaXQgd2VsbCBhZnQgb2YgdGhlIENHICjiiJJaKSB3aGljaCBwcm92aWRlcyB0aGUgc3RhdGljIHBpdGNoXG4gKiBhbmQgeWF3IHN0YWJpbGl0eSBhbmQgdGhlIGFlcm9keW5hbWljIHBpdGNoL3lhdyByYXRlIGRhbXBpbmcuXG4gKi9cbmV4cG9ydCBjb25zdCBGTTJfU1VSRkFDRVM6IFJlY29yZDxzdHJpbmcsIFN1cmZhY2VHZW9tZXRyeT4gPSB7XG4gICAgd2luZ0xlZnQ6IHtcbiAgICAgICAgbmFtZTogJ3dpbmdMZWZ0JyxcbiAgICAgICAgcG9zaXRpb246IFstMi4xLCAwLjAsIC0wLjE1XSxcbiAgICAgICAgdXA6IFswLCAxLCAwXSxcbiAgICAgICAgZm9yd2FyZDogWzAsIDAsIDFdLFxuICAgICAgICBhcmVhTTI6IDguNixcbiAgICAgICAgbGlmdFNsb3BlUGVyUmFkOiA1LjIsXG4gICAgICAgIHN0YWxsQW9hUmFkOiAyNCAqIERFRyxcbiAgICAgICAgY2QwOiAwLjAwODUsXG4gICAgICAgIGluZHVjZWRLOiAwLjExOCxcbiAgICAgICAgY29udHJvbEVmZmVjdGl2ZW5lc3M6IDAsIC8vIGFpbGVyb25zIGFwcGxpZWQgc2VwYXJhdGVseSBiZWxvd1xuICAgIH0sXG4gICAgd2luZ1JpZ2h0OiB7XG4gICAgICAgIG5hbWU6ICd3aW5nUmlnaHQnLFxuICAgICAgICBwb3NpdGlvbjogWzIuMSwgMC4wLCAtMC4xNV0sXG4gICAgICAgIHVwOiBbMCwgMSwgMF0sXG4gICAgICAgIGZvcndhcmQ6IFswLCAwLCAxXSxcbiAgICAgICAgYXJlYU0yOiA4LjYsXG4gICAgICAgIGxpZnRTbG9wZVBlclJhZDogNS4yLFxuICAgICAgICBzdGFsbEFvYVJhZDogMjQgKiBERUcsXG4gICAgICAgIGNkMDogMC4wMDg1LFxuICAgICAgICBpbmR1Y2VkSzogMC4xMTgsXG4gICAgICAgIGNvbnRyb2xFZmZlY3RpdmVuZXNzOiAwLFxuICAgIH0sXG4gICAgaHRhaWxMZWZ0OiB7XG4gICAgICAgIG5hbWU6ICdodGFpbExlZnQnLFxuICAgICAgICBwb3NpdGlvbjogWy0xLjUsIDAuMCwgLTQuNl0sXG4gICAgICAgIHVwOiBbMCwgMSwgMF0sXG4gICAgICAgIGZvcndhcmQ6IFswLCAwLCAxXSxcbiAgICAgICAgYXJlYU0yOiAyLjk1LFxuICAgICAgICBsaWZ0U2xvcGVQZXJSYWQ6IDMuNCxcbiAgICAgICAgc3RhbGxBb2FSYWQ6IDI2ICogREVHLFxuICAgICAgICBjZDA6IDAuMDA2LFxuICAgICAgICBpbmR1Y2VkSzogMC4xNSxcbiAgICAgICAgY29udHJvbEVmZmVjdGl2ZW5lc3M6IDAuOSwgLy8gYWxsLW1vdmluZyBzdGFiaWxhdG9yXG4gICAgfSxcbiAgICBodGFpbFJpZ2h0OiB7XG4gICAgICAgIG5hbWU6ICdodGFpbFJpZ2h0JyxcbiAgICAgICAgcG9zaXRpb246IFsxLjUsIDAuMCwgLTQuNl0sXG4gICAgICAgIHVwOiBbMCwgMSwgMF0sXG4gICAgICAgIGZvcndhcmQ6IFswLCAwLCAxXSxcbiAgICAgICAgYXJlYU0yOiAyLjk1LFxuICAgICAgICBsaWZ0U2xvcGVQZXJSYWQ6IDMuNCxcbiAgICAgICAgc3RhbGxBb2FSYWQ6IDI2ICogREVHLFxuICAgICAgICBjZDA6IDAuMDA2LFxuICAgICAgICBpbmR1Y2VkSzogMC4xNSxcbiAgICAgICAgY29udHJvbEVmZmVjdGl2ZW5lc3M6IDAuOSxcbiAgICB9LFxuICAgIHZ0YWlsOiB7XG4gICAgICAgIG5hbWU6ICd2dGFpbCcsXG4gICAgICAgIHBvc2l0aW9uOiBbMC4wLCAxLjEsIC00LjNdLFxuICAgICAgICB1cDogWzEsIDAsIDBdLCAvLyBzaWRlIGZvcmNlIGFjdHMgYWxvbmcgK1hcbiAgICAgICAgZm9yd2FyZDogWzAsIDAsIDFdLFxuICAgICAgICBhcmVhTTI6IDUuMSxcbiAgICAgICAgbGlmdFNsb3BlUGVyUmFkOiAyLjksXG4gICAgICAgIHN0YWxsQW9hUmFkOiAzMCAqIERFRyxcbiAgICAgICAgY2QwOiAwLjAwNyxcbiAgICAgICAgaW5kdWNlZEs6IDAuMTYsXG4gICAgICAgIGNvbnRyb2xFZmZlY3RpdmVuZXNzOiAwLjU1LCAvLyBydWRkZXJcbiAgICB9LFxufTtcblxuLyoqXG4gKiBBaWxlcm9uIChyb2xsKSBwYXJhbWV0ZXJzIOKAlCBkaWZmZXJlbnRpYWwgaW5jaWRlbmNlIGFkZGVkIHRvIGVhY2ggd2luZy5cbiAqIFNpemVkIHNvIHRoYXQgZnVsbCBkZWZsZWN0aW9uIHByb2R1Y2VzIHJvdWdobHkgdGhlIEYtMTYncyB+MzYwwrAvcyBvcGVuLWxvb3BcbiAqIHJvbGwgcmF0ZSAoYWVybyByb2xsIGRhbXBpbmcgYmFsYW5jZXMgY29udHJvbCBwb3dlcik7IHRoZSBGQlcgcmF0ZSBsb29wIHRoZW5cbiAqIGNhcHMgdGhlIGNvbW1hbmRlZCByYXRlIG5lYXIgMzAwwrAvcy5cbiAqL1xuZXhwb3J0IGNvbnN0IEZNMl9BSUxFUk9OID0ge1xuICAgIC8qKiDOlEFvQSAocmFkKSBhdCBlYWNoIHdpbmcgcGVyIHVuaXQgYWlsZXJvbiBjb21tYW5kIFstMSwxXS4gKi9cbiAgICBtYXhEZWZsZWN0aW9uUmFkOiA0LjIgKiBERUcsXG59IGFzIGNvbnN0O1xuXG4vKiogU3ltbWV0cmljIGZsYXAgY2FtYmVyIGluY3JlbWVudCAocmFkIG9mIGVmZmVjdGl2ZSB3aW5nIGluY2lkZW5jZSkgd2l0aCBmbGFwcyBkb3duLiAqL1xuZXhwb3J0IGNvbnN0IEZNMl9GTEFQUyA9IHtcbiAgICBhb2FCaWFzUmFkOiA4ICogREVHLFxuICAgIHN0YWxsUmVkdWN0aW9uUmFkOiAxICogREVHLFxuICAgIGV4dHJhQ2Q6IDAuMDIwLFxufSBhcyBjb25zdDtcblxuLyoqIExhbmRpbmcgZ2VhciBwYXJhc2l0ZSBkcmFnIGluY3JlbWVudCAoQ0QgcmVmZXJlbmNlZCB0byB3aW5nIGFyZWEpLiAqL1xuZXhwb3J0IGNvbnN0IEZNMl9HRUFSX0NEID0gMC4wMjI7XG5cbi8qKiBGdXNlbGFnZSAvIG1pc2NlbGxhbmVvdXMgcGFyYXNpdGUgZHJhZyAoQ0QgcmVmZXJlbmNlZCB0byB3aW5nIGFyZWEpLiAqL1xuZXhwb3J0IGNvbnN0IEZNMl9CT0RZX0NEMCA9IDAuMDEwO1xuXG4vKiogRXh0cmEgdHJhbnNvbmljL3N1cGVyc29uaWMgd2F2ZS1kcmFnIHNjYWxlIGFwcGxpZWQgYWJvdmUgdGhlIGRpdmVyZ2VuY2UgTWFjaC4gKi9cbmV4cG9ydCBjb25zdCBGTTJfV0FWRV9EUkFHID0ge1xuICAgIG1hY2hPbnNldDogMC45NSxcbiAgICBzY2FsZTogMC41NSxcbn0gYXMgY29uc3Q7XG5cbi8qKlxuICogRmx5LWJ5LXdpcmUgY29udHJvbC1sYXcgZ2FpbnMuIFRoZSBGLTE2IGlzIGFlcm9keW5hbWljYWxseSByZWxheGVkLXN0YWJpbGl0eVxuICogYW5kIG9ubHkgZmx5YWJsZSB0aHJvdWdoIGl0cyBGQlcgc3lzdGVtLCBzbyB0aGVzZSBnYWlucyBhcmUgd2hhdCBnaXZlIHRoZVxuICogYWlyY3JhZnQgaXRzIGhhbmRsaW5nIHF1YWxpdGllcyAoY3Jpc3AgfjMwMMKwL3Mgcm9sbCwgZy9Bb0EtbGltaXRlZCBwaXRjaCxcbiAqIGNvb3JkaW5hdGVkIHlhdykgcmF0aGVyIHRoYW4gdGhlIGJhcmUtYWlyZnJhbWUgcmVzcG9uc2UuXG4gKi9cbmV4cG9ydCBjb25zdCBGTTJfRkNTID0ge1xuICAgIC8qKiBQb3NpdGl2ZS9uZWdhdGl2ZSBzdHJ1Y3R1cmFsIGcgY29tbWFuZCBsaW1pdHMuICovXG4gICAgbWF4Q29tbWFuZEc6IEYxNl9QUk9GSUxFLm1heExvYWRGYWN0b3JHLCAvLyA5LjVcbiAgICBtaW5Db21tYW5kRzogLTMuMCxcbiAgICAvKiogQ29tbWFuZCBBb0EgbGltaXRlciAoZGVnKS4gV2lkZW5lZCBmYWRlIGJhbmQgc28gYXV0aG9yaXR5IHRhcGVycyBnZW50bHkuICovXG4gICAgYW9hTGltaXREZWc6IDI2LFxuICAgIGFvYVNvZnREZWc6IDE4LFxuXG4gICAgLyoqXG4gICAgICogUGl0Y2ggbG9vcDogc3RhYmlsYXRvciBjb21tYW5kIHBlciB1bml0IGcgZXJyb3IsIGludGVncmFsIHRyaW0sIHBpdGNoLXJhdGVcbiAgICAgKiBkYW1waW5nLCBhbmQgc3RpY2sgc2hhcGluZy5cbiAgICAgKlxuICAgICAqIGBwaXRjaFN0aWNrRXhwb2AgYmxlbmRzIGEgY3ViaWMgaW50byB0aGUgc3RpY2vihpJnIG1hcCBzbyBzbWFsbCBkZWZsZWN0aW9ucyBhcmVcbiAgICAgKiBnZW50bGUgKGEgbGlnaHQgcHVsbCBubyBsb25nZXIgZGVtYW5kcyBhIG5lYXItbWF4LWcgdGhlIGpldCBjYW4ndCBob2xkIGF0XG4gICAgICogYXBwcm9hY2ggc3BlZWQpIHdoaWxlIGZ1bGwgc3RpY2sgc3RpbGwgcmVhY2hlcyB0aGUgc3RydWN0dXJhbCBsaW1pdC5cbiAgICAgKiBgaW50ZWdyYWxMZWFrVGF1U2AgYmxlZWRzIHRoZSB0cmltIGludGVncmF0b3IgZG93biB3aGlsZSB0aGUgQW9BIGxpbWl0ZXIgaXNcbiAgICAgKiBhY3RpdmUsIHByZXZlbnRpbmcgd2luZC11cCBhZ2FpbnN0IHRoZSBsaW1pdCAodGhlIGNhdXNlIG9mIHRoZSBwaXRjaCBodW50aW5nKS5cbiAgICAgKi9cbiAgICBwaXRjaEdHYWluOiAwLjE0LFxuICAgIHBpdGNoSUdhaW46IDAuNixcbiAgICBwaXRjaFJhdGVEYW1wR2FpbjogMS4xLFxuICAgIHBpdGNoQW9hUmF0ZURhbXBHYWluOiA0LjUsXG4gICAgYW9hUmF0ZUZpbHRlclRhdVM6IDAuMDUsXG4gICAgcGl0Y2hTdGlja0V4cG86IDAuOCxcbiAgICBpbnRlZ3JhbExlYWtUYXVTOiAwLjM1LFxuICAgIG1heFN0YWJpbGF0b3JSYWQ6IDI1ICogREVHLFxuXG4gICAgLyoqIFJvbGwgbG9vcDogcmF0ZSBjb21tYW5kIGFuZCBwcm9wb3J0aW9uYWwgZ2FpbiB0byBhaWxlcm9uL3RhaWxlcm9uLiAqL1xuICAgIG1heFJvbGxSYXRlRGVnUzogRjE2X1BST0ZJTEUubWF4Um9sbFJhdGVEZWdTLCAvLyAzMDBcbiAgICByb2xsUmF0ZUdhaW46IDAuOCxcbiAgICByb2xsRGFtcGVyR2FpbjogMC4wNixcbiAgICAvKiogRnJhY3Rpb24gb2Ygcm9sbCBjb21tYW5kIHJvdXRlZCB0byB0aGUgZGlmZmVyZW50aWFsIHN0YWJpbGF0b3IgKHRhaWxlcm9uKS4gKi9cbiAgICB0YWlsZXJvblJvbGxGcmFjdGlvbjogMC4xMixcblxuICAgIC8qKiBZYXcgbG9vcDogcGVkYWwgYXV0aG9yaXR5LCB5YXctcmF0ZSBkYW1wZXIgKHdhc2hlZCBvdXQpLCBhaWxlcm9uLXJ1ZGRlciBpbnRlcmNvbm5lY3QuICovXG4gICAgbWF4UnVkZGVyQ21kOiAxLjAsXG4gICAgeWF3RGFtcGVyR2FpbjogMS42LFxuICAgIHlhd0RhbXBlcldhc2hvdXRUYXVTOiAxLjAsXG4gICAgYXJpR2FpbjogMC4xMCxcblxuICAgIC8qKiBBY3R1YXRvciBmaXJzdC1vcmRlciBsYWcgdGltZSBjb25zdGFudCAocykuICovXG4gICAgYWN0dWF0b3JUYXVTOiAwLjA1LFxufSBhcyBjb25zdDtcbiIsIi8qKlxuICogR2VuZXJpYyA2LURPRiByaWdpZCBib2R5IGludGVncmF0b3IgKE5ld3RvbuKAk0V1bGVyKS5cbiAqXG4gKiBUcmFuc2xhdGlvbmFsIGR5bmFtaWNzIGFyZSBpbnRlZ3JhdGVkIGluIHRoZSBXT1JMRCBmcmFtZSAoc28gdGhlIHJlc3VsdCBtYXBzXG4gKiBkaXJlY3RseSBvbnRvIHRoZSBzaW0ncyB3b3JsZC1zcGFjZSB2ZWxvY2l0eS9wb3NpdGlvbikuIFJvdGF0aW9uYWwgZHluYW1pY3NcbiAqIGFyZSBpbnRlZ3JhdGVkIGluIHRoZSBCT0RZIGZyYW1lLCB3aGljaCBpcyB0aGUgbmF0dXJhbCBmcmFtZSBmb3IgdGhlIGluZXJ0aWFcbiAqIHRlbnNvciBhbmQgZm9yIEV1bGVyJ3MgZXF1YXRpb246XG4gKlxuICogICAgIEkgwrcgz4nMhyA9IE0g4oiSIM+JIMOXIChJIMK3IM+JKVxuICpcbiAqIHdpdGggYSBkaWFnb25hbCBpbmVydGlhIHRlbnNvciBJID0gZGlhZyhJeCwgSXksIEl6KS4gVGhlIM+JIMOXIChJwrfPiSlcbiAqIGd5cm9zY29waWMgdGVybSBjb3VwbGVzIHRoZSBheGVzIGFuZCByZXByb2R1Y2VzIGVmZmVjdHMgc3VjaCBhcyBpbmVydGlhbFxuICogcGl0Y2gtdXAgaW4gYSByb2xsaW5nIHB1bGwuIE9yaWVudGF0aW9uIGlzIGFkdmFuY2VkIGJ5IGNvbXBvc2luZyB0aGUgYm9keVxuICogcXVhdGVybmlvbiB3aXRoIHRoZSBpbmNyZW1lbnRhbCByb3RhdGlvbiBleHAowr0gz4kgZHQpLlxuICovXG5pbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW5lcnRpYURpYWdvbmFsIHtcbiAgICAvKiogTW9tZW50IG9mIGluZXJ0aWEgYWJvdXQgYm9keSArWCAoUklHSFQgLyBwaXRjaCBheGlzKS4gKi9cbiAgICB4OiBudW1iZXI7XG4gICAgLyoqIE1vbWVudCBvZiBpbmVydGlhIGFib3V0IGJvZHkgK1kgKFVQIC8geWF3IGF4aXMpLiAqL1xuICAgIHk6IG51bWJlcjtcbiAgICAvKiogTW9tZW50IG9mIGluZXJ0aWEgYWJvdXQgYm9keSArWiAoRk9SV0FSRCAvIHJvbGwgYXhpcykuICovXG4gICAgejogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgUmlnaWRCb2R5IHtcbiAgICByZWFkb25seSBtYXNzOiBudW1iZXI7XG4gICAgcmVhZG9ubHkgaW5lcnRpYTogSW5lcnRpYURpYWdvbmFsO1xuXG4gICAgLyoqIE9yaWVudGF0aW9uOiBib2R5IOKGkiB3b3JsZC4gKi9cbiAgICByZWFkb25seSBvcmllbnRhdGlvbiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG4gICAgLyoqIExpbmVhciB2ZWxvY2l0eSwgd29ybGQgZnJhbWUgKG0vcykuICovXG4gICAgcmVhZG9ubHkgdmVsb2NpdHlXb3JsZCA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgLyoqIEFuZ3VsYXIgdmVsb2NpdHksIGJvZHkgZnJhbWUgKHJhZC9zKTogKHBpdGNoLCB5YXcsIHJvbGwpIGFib3V0IChYLCBZLCBaKS4gKi9cbiAgICByZWFkb25seSBhbmd1bGFyVmVsb2NpdHlCb2R5ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuICAgIHByaXZhdGUgcmVhZG9ubHkgX2l3ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9neXJvID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9hbmdBY2NlbCA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSByZWFkb25seSBfZHEgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgX2F4aXMgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG4gICAgY29uc3RydWN0b3IobWFzczogbnVtYmVyLCBpbmVydGlhOiBJbmVydGlhRGlhZ29uYWwpIHtcbiAgICAgICAgdGhpcy5tYXNzID0gbWFzcztcbiAgICAgICAgdGhpcy5pbmVydGlhID0gaW5lcnRpYTtcbiAgICB9XG5cbiAgICByZXNldCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5vcmllbnRhdGlvbi5pZGVudGl0eSgpO1xuICAgICAgICB0aGlzLnZlbG9jaXR5V29ybGQuc2V0KDAsIDAsIDApO1xuICAgICAgICB0aGlzLmFuZ3VsYXJWZWxvY2l0eUJvZHkuc2V0KDAsIDAsIDApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkdmFuY2UgdGhlIHJvdGF0aW9uYWwgc3RhdGUuXG4gICAgICogQHBhcmFtIG1vbWVudEJvZHkgTmV0IG1vbWVudCBhYm91dCB0aGUgQ0csIGJvZHkgZnJhbWUgKE7Ct20pLlxuICAgICAqIEBwYXJhbSBkdCAgICAgICAgIFRpbWVzdGVwIChzKS5cbiAgICAgKi9cbiAgICBpbnRlZ3JhdGVBbmd1bGFyKG1vbWVudEJvZHk6IFRIUkVFLlZlY3RvcjMsIGR0OiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgdyA9IHRoaXMuYW5ndWxhclZlbG9jaXR5Qm9keTtcbiAgICAgICAgY29uc3QgSSA9IHRoaXMuaW5lcnRpYTtcblxuICAgICAgICAvLyBJz4kgYW5kIHRoZSBneXJvc2NvcGljIHRlcm0gz4kgw5cgKEnPiSkuXG4gICAgICAgIHRoaXMuX2l3LnNldChJLnggKiB3LngsIEkueSAqIHcueSwgSS56ICogdy56KTtcbiAgICAgICAgdGhpcy5fZ3lyby5jcm9zc1ZlY3RvcnModywgdGhpcy5faXcpO1xuXG4gICAgICAgIC8vIM+JzIcgPSBJ4oG7wrkgKE0g4oiSIM+JIMOXIEnPiSlcbiAgICAgICAgdGhpcy5fYW5nQWNjZWwuc2V0KFxuICAgICAgICAgICAgKG1vbWVudEJvZHkueCAtIHRoaXMuX2d5cm8ueCkgLyBJLngsXG4gICAgICAgICAgICAobW9tZW50Qm9keS55IC0gdGhpcy5fZ3lyby55KSAvIEkueSxcbiAgICAgICAgICAgIChtb21lbnRCb2R5LnogLSB0aGlzLl9neXJvLnopIC8gSS56LFxuICAgICAgICApO1xuXG4gICAgICAgIHcuYWRkU2NhbGVkVmVjdG9yKHRoaXMuX2FuZ0FjY2VsLCBkdCk7XG5cbiAgICAgICAgLy8gQWR2YW5jZSBvcmllbnRhdGlvbiBieSB0aGUgaW5jcmVtZW50YWwgYm9keS1mcmFtZSByb3RhdGlvbi5cbiAgICAgICAgY29uc3Qgb21lZ2EgPSB3Lmxlbmd0aCgpO1xuICAgICAgICBpZiAob21lZ2EgPiAxZS05KSB7XG4gICAgICAgICAgICB0aGlzLl9heGlzLmNvcHkodykubXVsdGlwbHlTY2FsYXIoMSAvIG9tZWdhKTtcbiAgICAgICAgICAgIHRoaXMuX2RxLnNldEZyb21BeGlzQW5nbGUodGhpcy5fYXhpcywgb21lZ2EgKiBkdCk7XG4gICAgICAgICAgICB0aGlzLm9yaWVudGF0aW9uLm11bHRpcGx5KHRoaXMuX2RxKTsgLy8gYm9keS1mcmFtZSBkZWx0YSBhcHBsaWVkIG9uIHRoZSByaWdodFxuICAgICAgICAgICAgdGhpcy5vcmllbnRhdGlvbi5ub3JtYWxpemUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkdmFuY2UgdGhlIHRyYW5zbGF0aW9uYWwgc3RhdGUuXG4gICAgICogQHBhcmFtIGZvcmNlV29ybGQgTmV0IGZvcmNlIGluIHRoZSB3b3JsZCBmcmFtZSAoTiksIGdyYXZpdHkgaW5jbHVkZWQuXG4gICAgICogQHBhcmFtIGR0ICAgICAgICAgVGltZXN0ZXAgKHMpLlxuICAgICAqIEBwYXJhbSBvdXRQb3NpdGlvbiBQb3NpdGlvbiBhY2N1bXVsYXRvciB0byBhZHZhbmNlICh3b3JsZCwgbSkuXG4gICAgICovXG4gICAgaW50ZWdyYXRlTGluZWFyKGZvcmNlV29ybGQ6IFRIUkVFLlZlY3RvcjMsIGR0OiBudW1iZXIsIG91dFBvc2l0aW9uOiBUSFJFRS5WZWN0b3IzKTogdm9pZCB7XG4gICAgICAgIC8vIGEgPSBGIC8gbSA7IHNlbWktaW1wbGljaXQgRXVsZXIgKHVwZGF0ZSB2ZWxvY2l0eSwgdGhlbiBwb3NpdGlvbikuXG4gICAgICAgIHRoaXMudmVsb2NpdHlXb3JsZC5hZGRTY2FsZWRWZWN0b3IoZm9yY2VXb3JsZCwgZHQgLyB0aGlzLm1hc3MpO1xuICAgICAgICBvdXRQb3NpdGlvbi5hZGRTY2FsZWRWZWN0b3IodGhpcy52ZWxvY2l0eVdvcmxkLCBkdCk7XG4gICAgfVxufVxuIiwiaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuaW1wb3J0IHsgUElUQ0hfUkFURSwgUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5ELCBST0xMX1JBVEUsIFlBV19SQVRFIH0gZnJvbSBcIi4uLy4uL2RlZnNcIjtcbmltcG9ydCB7IEZPUldBUkQsIFBJX09WRVJfMTgwLCBSSUdIVCwgVVAsIFpFUk8sIGNhbGN1bGF0ZVBpdGNoUm9sbCwgY2xhbXAsIGVhc2VPdXRDaXJjLCBpc1plcm8sIHJvdW5kVG9aZXJvIH0gZnJvbSAnLi4vLi4vdXRpbHMvbWF0aCc7XG5pbXBvcnQgeyBGbGlnaHRNb2RlbCB9IGZyb20gJy4vZmxpZ2h0TW9kZWwnO1xuXG5cbmNvbnN0IFRVUk5JTkdfUkFURSA9IE1hdGguUEkgKiAxLjU7IC8vIFJhZGlhbnMvc2Vjb25kXG5jb25zdCBTVEFMTF9SQVRFID0gTWF0aC5QSSAvIDY7IC8vIFJhZGlhbnMvc2Vjb25kXG5jb25zdCBJTkRVQ0VEX0RSQUdfRkFDVE9SID0gMTAuMDsgLy8gVW5pdGxlc3NcbmNvbnN0IFJPTExfRFJBR19GQUNUT1IgPSAwLjA1OyAvLyBVbml0bGVzc1xuY29uc3QgR1JPVU5EX0ZSSUNUSU9OX0tJTkVUSUMgPSAwLjE1OyAvLyBVbml0bGVzc1xuY29uc3QgR1JPVU5EX0ZSSUNUSU9OX1NUQVRJQyA9IDAuMjsgLy8gVW5pdGxlc3NcbmNvbnN0IEdST1VORF9CUkFLRV9LSU5FVElDID0gMS44O1xuY29uc3QgR1JPVU5EX0JSQUtFX1NUQVRJQyA9IDEuMTc7XG5jb25zdCBUSFJPVFRMRV9VUF9SQVRFID0gMC4wMjsgLy8gVW5pdHMvc2Vjb25kXG5jb25zdCBUSFJPVFRMRV9ET1dOX1JBVEUgPSAwLjA3OyAvLyBVbml0cy9zZWNvbmRcbmNvbnN0IFlBV19SQVRFX0xBTkRFRCA9IFlBV19SQVRFICogMi4wOyAvLyBSYWRpYW5zL3NlY29uZFxuXG5jb25zdCBNQVhfVEhSVVNUID0gMjA7IC8vIG0vc14yXG5jb25zdCBEUllfTUFTUzogbnVtYmVyID0gMjAwMDA7IC8vIGtnXG5jb25zdCBXSU5HX0FSRUE6IG51bWJlciA9IDc4OyAvLyBtXjJcbmNvbnN0IEdST1VORF9BSVJfREVOU0lUWTogbnVtYmVyID0gMS4yMjU7IC8vIGtnL21eM1xuY29uc3QgR1JBVklUWTogbnVtYmVyID0gOS44OyAvLyBtL3NeMlxuY29uc3QgQ0Q6IG51bWJlciA9IDAuMTU7IC8vIFVuaXRsZXNzXG5jb25zdCBDRF9MQU5ESU5HX0dFQVJfRkFDVE9SID0gMC43NTsgLy8gVW5pdGxlc3MsIGFkZGl0aXZlXG5jb25zdCBDRF9GTEFQU19GQUNUT1IgPSAwLjQ7IC8vIFVuaXRsZXNzLCBhZGRpdGl2ZVxuY29uc3QgTElGVF9GTEFQU19GQUNUT1IgPSAxLjI7IC8vIFVuaXRsZXNzXG5jb25zdCBST0xMX0ZMQVBTX0ZBQ1RPUiA9IDAuNjsgLy8gVW5pdGxlc3NcblxuY29uc3QgTEFOREVEX01BWF9TUEVFRCA9IDEwMDsgLy8gbS9zXG5jb25zdCBMQU5ESU5HX01BWF9WU1BFRUQgPSA1OyAvLyBtL3NcbmNvbnN0IExBTkRJTkdfTUlOX1BJVENIID0gLTUgKiBQSV9PVkVSXzE4MDsgLy8gUmFkaWFuc1xuY29uc3QgTEFORElOR19NQVhfUk9MTCA9IDUgKiBQSV9PVkVSXzE4MDsgLy8gUmFkaWFuc1xuXG5leHBvcnQgY2xhc3MgQXJjYWRlRmxpZ2h0TW9kZWwgZXh0ZW5kcyBGbGlnaHRNb2RlbCB7XG5cbiAgICBwcml2YXRlIHN0YWxsOiBudW1iZXIgPSAwO1xuXG4gICAgcHJpdmF0ZSBfdjogVEhSRUUuVmVjdG9yMyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSBfcTA6IFRIUkVFLlF1YXRlcm5pb24gPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuICAgIHByaXZhdGUgX3ExOiBUSFJFRS5RdWF0ZXJuaW9uID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcbiAgICBwcml2YXRlIF9tOiBUSFJFRS5NYXRyaXg0ID0gbmV3IFRIUkVFLk1hdHJpeDQoKTtcblxuICAgIHByaXZhdGUgZHJhZzogVEhSRUUuVmVjdG9yMyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7IC8vIE5cbiAgICBwcml2YXRlIHRocnVzdDogVEhSRUUuVmVjdG9yMyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7IC8vIE5cbiAgICBwcml2YXRlIHdlaWdodDogVEhSRUUuVmVjdG9yMyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7IC8vIE5cbiAgICBwcml2YXRlIGZyaWN0aW9uOiBUSFJFRS5WZWN0b3IzID0gbmV3IFRIUkVFLlZlY3RvcjMoKTsgLy8gTlxuICAgIHByaXZhdGUgZm9yY2VzOiBUSFJFRS5WZWN0b3IzID0gbmV3IFRIUkVFLlZlY3RvcjMoKTsgLy8gTlxuXG4gICAgcHJpdmF0ZSBmb3J3YXJkOiBUSFJFRS5WZWN0b3IzID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHVwOiBUSFJFRS5WZWN0b3IzID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJpZ2h0OiBUSFJFRS5WZWN0b3IzID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuICAgIHByaXZhdGUgcHJqRm9yd2FyZDogVEhSRUUuVmVjdG9yMyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSB2ZWxvY2l0eVVuaXQ6IFRIUkVFLlZlY3RvcjMgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMub2JqLnVwLmNvcHkoVVApO1xuICAgIH1cblxuICAgIHN0ZXAoZGVsdGE6IG51bWJlcik6IHZvaWQge1xuXG4gICAgICAgIGlmICh0aGlzLmNyYXNoZWQpIHJldHVybjtcblxuICAgICAgICBpZiAodGhpcy5lZmZlY3RpdmVUaHJvdHRsZSA+IHRoaXMudGhyb3R0bGUpIHtcbiAgICAgICAgICAgIHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgPSBNYXRoLm1heCh0aGlzLnRocm90dGxlLCB0aGlzLmVmZmVjdGl2ZVRocm90dGxlIC0gVEhST1RUTEVfRE9XTl9SQVRFICogZGVsdGEpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgPCB0aGlzLnRocm90dGxlKSB7XG4gICAgICAgICAgICB0aGlzLmVmZmVjdGl2ZVRocm90dGxlID0gTWF0aC5taW4odGhpcy50aHJvdHRsZSwgdGhpcy5lZmZlY3RpdmVUaHJvdHRsZSArIFRIUk9UVExFX1VQX1JBVEUgKiBkZWx0YSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmZvcndhcmQgPSB0aGlzLmZvcndhcmQuY29weShGT1JXQVJEKS5hcHBseVF1YXRlcm5pb24odGhpcy5vYmoucXVhdGVybmlvbik7XG4gICAgICAgIHRoaXMudXAgPSB0aGlzLnVwLmNvcHkoVVApLmFwcGx5UXVhdGVybmlvbih0aGlzLm9iai5xdWF0ZXJuaW9uKTtcbiAgICAgICAgdGhpcy5yaWdodCA9IHRoaXMucmlnaHQuY29weShSSUdIVCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMub2JqLnF1YXRlcm5pb24pO1xuXG4gICAgICAgIHRoaXMucHJqRm9yd2FyZCA9IHRoaXMucHJqRm9yd2FyZC5jb3B5KHRoaXMuZm9yd2FyZCkuc2V0WSgwKTtcbiAgICAgICAgdGhpcy52ZWxvY2l0eVVuaXQgPSB0aGlzLnZlbG9jaXR5VW5pdC5jb3B5KHRoaXMudmVsb2NpdHkpLm5vcm1hbGl6ZSgpO1xuXG4gICAgICAgIGNvbnN0IGFpckRlbnNpdHk6IG51bWJlciA9IEdST1VORF9BSVJfREVOU0lUWSAqIE1hdGguZXhwKC10aGlzLm9iai5wb3NpdGlvbi55IC8gODAwMCk7IC8vIGtnL21eM1xuICAgICAgICAvLyBUYWtlIGludG8gYWNjb3VudCBsb3dlciBhaXIgdGVtcGVyYXR1cmUgYXQgaGlnaGVyIGFsdGl0dWRlc1xuICAgICAgICBjb25zdCB0aHJ1c3REZW5zaXR5OiBudW1iZXIgPSBHUk9VTkRfQUlSX0RFTlNJVFkgKiBNYXRoLmV4cCgtdGhpcy5vYmoucG9zaXRpb24ueSAqIDAuMjUgLyA4MDAwKTsgLy8ga2cvbV4zXG4gICAgICAgIGNvbnN0IHNwZWVkID0gdGhpcy52ZWxvY2l0eS5sZW5ndGgoKTsgLy8gbS9zXG5cbiAgICAgICAgY29uc3QgcmlnaHRQcmpWZWxvY2l0eSA9IHRoaXMuX3YuY29weSh0aGlzLnZlbG9jaXR5VW5pdCkucHJvamVjdE9uUGxhbmUodGhpcy5yaWdodCk7XG4gICAgICAgIGNvbnN0IGFvYUFuZ2xlID0gcmlnaHRQcmpWZWxvY2l0eS5hbmdsZVRvKHRoaXMuZm9yd2FyZCk7XG4gICAgICAgIGNvbnN0IGFvYVNpZ24gPSByaWdodFByalZlbG9jaXR5LmNyb3NzKHRoaXMuZm9yd2FyZCkuZG90KHRoaXMucmlnaHQpID4gMCA/IC0xIDogMTtcbiAgICAgICAgY29uc3QgYW9hID0gYW9hU2lnbiAqIGFvYUFuZ2xlO1xuXG4gICAgICAgIC8vIFJvbGwgY29udHJvbFxuICAgICAgICBpZiAoIWlzWmVybyh0aGlzLnJvbGwpICYmICF0aGlzLmxhbmRlZCkge1xuICAgICAgICAgICAgY29uc3Qgcm9sbEZsYXBGYWN0b3IgPSB0aGlzLmZsYXBzRXh0ZW5kZWQgPyBST0xMX0ZMQVBTX0ZBQ1RPUiA6IDEuMDtcbiAgICAgICAgICAgIHRoaXMub2JqLnJvdGF0ZVoodGhpcy5yb2xsICogUk9MTF9SQVRFICogcm9sbEZsYXBGYWN0b3IgKiBkZWx0YSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQaXRjaCBjb250cm9sXG4gICAgICAgIGlmICghaXNaZXJvKHRoaXMucGl0Y2gpXG4gICAgICAgICAgICAmJiAhKHRoaXMubGFuZGVkICYmIHRoaXMucGl0Y2ggPCAwKSAvLyBDYW4ndCBwaXRjaCBkb3duIHdoZW4gbGFuZGVkXG4gICAgICAgICAgICAmJiAoXG4gICAgICAgICAgICAgICAgdGhpcy5zdGFsbCA8IDAgfHwgLy8gQ2FuIGRvIGFueXRoaW5nIHdoZW4gZmx5aW5nIGFuZCBubyBzdGFsbGluZ1xuICAgICAgICAgICAgICAgICh0aGlzLnBpdGNoIDwgMCAmJiB0aGlzLnVwLnkgPiAwKSB8fCAvLyBDYW4ndCBwaXRjaCB1cCB3aGVuIHN0YWxsaW5nXG4gICAgICAgICAgICAgICAgKHRoaXMucGl0Y2ggPiAwICYmIHRoaXMudXAueSA8IDApIC8vIENhbid0IHBpdGNoIHVwIHdoZW4gc3RhbGxpbmdcbiAgICAgICAgICAgIClcbiAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGlzLm9iai5yb3RhdGVYKC10aGlzLnBpdGNoICogUElUQ0hfUkFURSAqIGRlbHRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFlhdyBjb250cm9sXG4gICAgICAgIGlmICghaXNaZXJvKHRoaXMueWF3KSAmJiAhaXNaZXJvKHNwZWVkKSkge1xuICAgICAgICAgICAgdGhpcy5vYmoucm90YXRlWSgtdGhpcy55YXcgKiAodGhpcy5sYW5kZWQgPyBZQVdfUkFURV9MQU5ERUQgOiBZQVdfUkFURSkgKiBkZWx0YSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBdXRvbWF0aWMgeWF3IHdoZW4gcm9sbGluZ1xuICAgICAgICBpZiAoLTAuOTkgPCB0aGlzLmZvcndhcmQueSAmJiB0aGlzLmZvcndhcmQueSA8IDAuOTkpIHtcbiAgICAgICAgICAgIGNvbnN0IHByalVwID0gdGhpcy5fdi5jb3B5KHRoaXMudXApLnByb2plY3RPblBsYW5lKHRoaXMucHJqRm9yd2FyZCkuc2V0WSgwKTtcbiAgICAgICAgICAgIGNvbnN0IHNpZ24gPSAodGhpcy5wcmpGb3J3YXJkLnggKiBwcmpVcC56IC0gdGhpcy5wcmpGb3J3YXJkLnogKiBwcmpVcC54KSA+IDAgPyAtMSA6IDE7XG4gICAgICAgICAgICB0aGlzLm9iai5yb3RhdGVPbldvcmxkQXhpcyhVUCwgc2lnbiAqIHByalVwLmxlbmd0aCgpICogcHJqVXAubGVuZ3RoKCkgKiB0aGlzLnByakZvcndhcmQubGVuZ3RoKCkgKiAyLjAgKiBZQVdfUkFURSAqIGRlbHRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFBvaW50IGRvd24gd2hlbiBzdGFsbGluZ1xuICAgICAgICBpZiAodGhpcy5zdGFsbCA+PSAwICYmICF0aGlzLmxhbmRlZCkge1xuICAgICAgICAgICAgY29uc3QgeSA9IHRoaXMuZm9yd2FyZC55O1xuICAgICAgICAgICAgaWYgKHkgPiAtMC44KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZ3JvdW5kUmlnaHQgPSB0aGlzLl92LmNvcHkodGhpcy5mb3J3YXJkKS5jcm9zcyh0aGlzLnByakZvcndhcmQpLm5vcm1hbGl6ZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMub2JqLnJvdGF0ZU9uV29ybGRBeGlzKGdyb3VuZFJpZ2h0LCBTVEFMTF9SQVRFICogZGVsdGEgKiAoeSA+IDAgPyAxIDogLTEpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vISBUSFJVU1RcbiAgICAgICAgcm91bmRUb1plcm8odGhpcy50aHJ1c3QuY29weSh0aGlzLmZvcndhcmQpLm11bHRpcGx5U2NhbGFyKFxuICAgICAgICAgICAgdGhydXN0RGVuc2l0eSAqXG4gICAgICAgICAgICBNQVhfVEhSVVNUICpcbiAgICAgICAgICAgIHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgKlxuICAgICAgICAgICAgRFJZX01BU1MpKTtcbiAgICAgICAgdGhpcy5lbmdpbmVUaHJ1c3ROID0gdGhpcy50aHJ1c3QubGVuZ3RoKCk7XG5cbiAgICAgICAgLy8hIERSQUdcbiAgICAgICAgY29uc3QgYXJjYWRlSW5kdWNlZERyYWcgPSB0aGlzLmZvcndhcmQuZG90KHRoaXMudmVsb2NpdHlVbml0KTtcbiAgICAgICAgY29uc3QgbGlmdEluZHVjZWREcmFnID0gMSAtIE1hdGguY29zKDIuMCAqIGFvYSk7XG4gICAgICAgIGNvbnN0IHJvbGxEcmFnID0gTWF0aC5hYnModGhpcy5yaWdodC55KTtcbiAgICAgICAgY29uc3QgY2RNdWx0aXBsaWVyID0gMS4wICsgKHRoaXMubGFuZGluZ0dlYXJEZXBsb3llZCA/IENEX0xBTkRJTkdfR0VBUl9GQUNUT1IgOiAwLjApICsgKHRoaXMuZmxhcHNFeHRlbmRlZCA/IENEX0ZMQVBTX0ZBQ1RPUiA6IDAuMCk7XG4gICAgICAgIHJvdW5kVG9aZXJvKHRoaXMuZHJhZ1xuICAgICAgICAgICAgLmNvcHkodGhpcy52ZWxvY2l0eVVuaXQpXG4gICAgICAgICAgICAubmVnYXRlKClcbiAgICAgICAgICAgIC5tdWx0aXBseVNjYWxhcihcbiAgICAgICAgICAgICAgICBNYXRoLnBvdyhcbiAgICAgICAgICAgICAgICAgICAgMC41ICogKENEICogY2RNdWx0aXBsaWVyICsgbGlmdEluZHVjZWREcmFnKSAqIGFpckRlbnNpdHkgKiBzcGVlZCAqIHNwZWVkICogV0lOR19BUkVBLFxuICAgICAgICAgICAgICAgICAgICAxLjAgKyBJTkRVQ0VEX0RSQUdfRkFDVE9SICogKDEuMCAtIGFyY2FkZUluZHVjZWREcmFnKSArIFJPTExfRFJBR19GQUNUT1IgKiByb2xsRHJhZ1xuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgIClcbiAgICAgICAgKTtcblxuICAgICAgICAvLyEgTElGVFxuICAgICAgICBjb25zdCBhb2FMaWZ0ID0gMC4yICogKGFvYSA8IChNYXRoLlBJIC8gOC4wKSB8fCBhb2EgPiAoNyAqIE1hdGguUEkgLyA4LjApID8gTWF0aC5zaW4oNi4wICogYW9hKSA6IE1hdGguc2luKDIuMCAqIGFvYSkpO1xuICAgICAgICBjb25zdCBtaW5MaWZ0RmFjdG9yID0gMi4wICogKDAuNzUgKiAwLjc1ICsgMC43NSkgKiBHUk9VTkRfQUlSX0RFTlNJVFk7XG4gICAgICAgIGNvbnN0IGZ3ZFkgPSB0aGlzLmZvcndhcmQueTtcbiAgICAgICAgY29uc3QgcmlnaHRZID0gTWF0aC5hYnModGhpcy5yaWdodC55KTtcbiAgICAgICAgY29uc3QgbGlmdEZhY3RvciA9IDIgKiAoc3BlZWQgLyAyNTYuMCkgKiAoKC0wLjUgKiBmd2RZICsgMS41KSAqICgtMC41ICogcmlnaHRZICsgMS41KSArICgtMC41ICogcmlnaHRZICsgMS41KSkgKiBhaXJEZW5zaXR5O1xuICAgICAgICBjb25zdCBsaWZ0RmFjdG9yTXVsdGlwbGllciA9IHRoaXMuZmxhcHNFeHRlbmRlZCA/IExJRlRfRkxBUFNfRkFDVE9SIDogMS4wO1xuICAgICAgICB0aGlzLnN0YWxsID0gLWNsYW1wKGxpZnRGYWN0b3IgKiBsaWZ0RmFjdG9yTXVsdGlwbGllciAvIG1pbkxpZnRGYWN0b3IgKyBhb2FMaWZ0ICogKDEuMCAtIHJpZ2h0WSkgLSAxLjAsIC0xLjAsIDEuMCk7XG5cbiAgICAgICAgLy8hIFdFSUdIVFxuICAgICAgICBjb25zdCB3ZWlnaHRGd2RGYWN0b3IgPSAtdGhpcy5mb3J3YXJkLnk7XG4gICAgICAgIC8vIEFjY291bnRzIGZvciBsaWZ0LiA1MDAga25vdHMgLT4gMjU2IG0vc1xuICAgICAgICBjb25zdCB3ZWlnaHREb3duRmFjdG9yID0gLWVhc2VPdXRDaXJjKDEuMCAtIGNsYW1wKChzcGVlZCAvIDI1NikgKiAoMS4wIC0gTWF0aC5hYnModGhpcy5mb3J3YXJkLnkpICogKDEuMCAtIE1hdGguYWJzKHRoaXMucmlnaHQueSkpKSwgMCwgMSkpO1xuICAgICAgICB0aGlzLndlaWdodFxuICAgICAgICAgICAgLmNvcHkoVVApXG4gICAgICAgICAgICAubXVsdGlwbHlTY2FsYXIod2VpZ2h0RG93bkZhY3RvcilcbiAgICAgICAgICAgIC5hZGRTY2FsZWRWZWN0b3IodGhpcy5mb3J3YXJkLCB3ZWlnaHRGd2RGYWN0b3IpXG4gICAgICAgICAgICAubXVsdGlwbHlTY2FsYXIoRFJZX01BU1MgKiBHUkFWSVRZKTtcblxuICAgICAgICAvLyEgTWFnaWMgdmVsb2NpdHkgcm90YXRpb25cbiAgICAgICAgaWYgKCFpc1plcm8oc3BlZWQpKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5sYW5kZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnZlbG9jaXR5LmNvcHkodGhpcy5mb3J3YXJkKS5tdWx0aXBseVNjYWxhcihzcGVlZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFscGhhID0gdGhpcy52ZWxvY2l0eVVuaXQuYW5nbGVUbyh0aGlzLmZvcndhcmQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHR1cm5pbmdGYWN0b3IgPSBhbHBoYSAqIFRVUk5JTkdfUkFURSAqIGRlbHRhO1xuICAgICAgICAgICAgICAgIHRoaXMuX20ubG9va0F0KFpFUk8sIHRoaXMuZm9yd2FyZCwgdGhpcy51cCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcTEgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLnNldEZyb21Sb3RhdGlvbk1hdHJpeCh0aGlzLl9tKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9tLmxvb2tBdChaRVJPLCB0aGlzLnZlbG9jaXR5VW5pdCwgdGhpcy51cCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcTAgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLnNldEZyb21Sb3RhdGlvbk1hdHJpeCh0aGlzLl9tKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9xMC5yb3RhdGVUb3dhcmRzKHRoaXMuX3ExLCB0dXJuaW5nRmFjdG9yKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9xMS5zZXRGcm9tUm90YXRpb25NYXRyaXgodGhpcy5fbS5pbnZlcnQoKSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fdi5jb3B5KHRoaXMudmVsb2NpdHlVbml0KVxuICAgICAgICAgICAgICAgICAgICAuYXBwbHlRdWF0ZXJuaW9uKHRoaXMuX3ExKVxuICAgICAgICAgICAgICAgICAgICAuYXBwbHlRdWF0ZXJuaW9uKHRoaXMuX3EwKTtcbiAgICAgICAgICAgICAgICB0aGlzLnZlbG9jaXR5LmNvcHkodGhpcy5fdikubXVsdGlwbHlTY2FsYXIoc3BlZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8hIEFsbCBmb3JjZXNcbiAgICAgICAgdGhpcy5mb3JjZXMuc2V0KDAsIDAsIDApLmFkZCh0aGlzLnRocnVzdCkuYWRkKHRoaXMuZHJhZykuYWRkKHRoaXMud2VpZ2h0KTtcblxuICAgICAgICAvLyEgRlJJQ1RJT05cbiAgICAgICAgY29uc3Qgb25Hcm91bmQgPSB0aGlzLm9iai5wb3NpdGlvbi55IDw9IFBMQU5FX0RJU1RBTkNFX1RPX0dST1VORCArIDAuMDU7XG4gICAgICAgIGlmICh0aGlzLmxhbmRlZCB8fCAodGhpcy53aGVlbEJyYWtlc0FwcGxpZWQgJiYgb25Hcm91bmQpKSB7XG4gICAgICAgICAgICBjb25zdCB3ZWlnaHRNYWduaXR1ZGUgPSBEUllfTUFTUyAqIEdSQVZJVFk7XG4gICAgICAgICAgICBjb25zdCBwcmpGb3JjZXMgPSB0aGlzLl92LmNvcHkodGhpcy5mb3JjZXMpLnNldFkoMCk7XG4gICAgICAgICAgICBjb25zdCBwcmpGb3JjZXNNYWduaXR1ZGUgPSBwcmpGb3JjZXMubGVuZ3RoKCk7XG4gICAgICAgICAgICBjb25zdCBtYXhTdGF0aWNGcmljdGlvbiA9ICh0aGlzLndoZWVsQnJha2VzQXBwbGllZCA/IEdST1VORF9CUkFLRV9TVEFUSUMgOiBHUk9VTkRfRlJJQ1RJT05fU1RBVElDKSAqIHdlaWdodE1hZ25pdHVkZTtcbiAgICAgICAgICAgIGNvbnN0IGtpbmV0aWNGcmljdGlvbiA9ICh0aGlzLndoZWVsQnJha2VzQXBwbGllZCA/IEdST1VORF9CUkFLRV9LSU5FVElDIDogR1JPVU5EX0ZSSUNUSU9OX0tJTkVUSUMpICogd2VpZ2h0TWFnbml0dWRlO1xuXG4gICAgICAgICAgICBpZiAoKGlzWmVybyhzcGVlZCkgJiYgcHJqRm9yY2VzTWFnbml0dWRlIDwgbWF4U3RhdGljRnJpY3Rpb24pKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5mcmljdGlvbi5jb3B5KHByakZvcmNlcykubmVnYXRlKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZnJpY3Rpb24uY29weSh0aGlzLnZlbG9jaXR5VW5pdCkuc2V0WSgwKS5uZWdhdGUoKS5ub3JtYWxpemUoKS5tdWx0aXBseVNjYWxhcihraW5ldGljRnJpY3Rpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcm91bmRUb1plcm8odGhpcy5mcmljdGlvbik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmZyaWN0aW9uLnNldCgwLCAwLCAwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vISBUaW1lc3RlcFxuICAgICAgICBjb25zdCBhY2NlbCA9IHJvdW5kVG9aZXJvKHRoaXMuZm9yY2VzLmFkZCh0aGlzLmZyaWN0aW9uKS5kaXZpZGVTY2FsYXIoRFJZX01BU1MpKTtcbiAgICAgICAgdGhpcy52ZWxvY2l0eS5hZGRTY2FsZWRWZWN0b3IoYWNjZWwsIGRlbHRhKTtcbiAgICAgICAgaWYgKHRoaXMubGFuZGVkICYmIHRoaXMudmVsb2NpdHkueSA8IDApIHtcbiAgICAgICAgICAgIHRoaXMudmVsb2NpdHkuc2V0WSgwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vISBBcHBseVxuICAgICAgICB0aGlzLm9iai5wb3NpdGlvbi5hZGRTY2FsZWRWZWN0b3Iocm91bmRUb1plcm8odGhpcy52ZWxvY2l0eSwgdGhpcy5lZmZlY3RpdmVUaHJvdHRsZSA+IDAgPyAwLjAxIDogMC4xKSwgZGVsdGEpO1xuICAgICAgICBpZiAodGhpcy5vYmoucG9zaXRpb24ueSA+IFBMQU5FX0RJU1RBTkNFX1RPX0dST1VORCkge1xuICAgICAgICAgICAgdGhpcy5sYW5kZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdyb3VuZCBpbnRlcmFjdGlvblxuICAgICAgICBpZiAodGhpcy5vYmoucG9zaXRpb24ueSA8IFBMQU5FX0RJU1RBTkNFX1RPX0dST1VORCkge1xuICAgICAgICAgICAgdGhpcy5vYmoucG9zaXRpb24ueSA9IFBMQU5FX0RJU1RBTkNFX1RPX0dST1VORDtcblxuICAgICAgICAgICAgY29uc3QgZm9yd2FyZCA9IHRoaXMuX3YuY29weShGT1JXQVJEKS5hcHBseVF1YXRlcm5pb24odGhpcy5vYmoucXVhdGVybmlvbik7XG4gICAgICAgICAgICBjb25zdCByaWdodCA9IHRoaXMucmlnaHQuY29weShSSUdIVCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMub2JqLnF1YXRlcm5pb24pO1xuXG4gICAgICAgICAgICBjb25zdCBwcmpGb3J3YXJkID0gbmV3IFRIUkVFLlZlY3RvcjMoKS5jb3B5KGZvcndhcmQpLnNldFkoMCkubm9ybWFsaXplKCk7XG4gICAgICAgICAgICBjb25zdCBwaXRjaEFuZ2xlID0gZm9yd2FyZC5hbmdsZVRvKHByakZvcndhcmQpICogTWF0aC5zaWduKGZvcndhcmQueSk7XG5cbiAgICAgICAgICAgIGNvbnN0IHByalJpZ2h0ID0gbmV3IFRIUkVFLlZlY3RvcjMoKS5jb3B5KHJpZ2h0KS5zZXRZKDApLm5vcm1hbGl6ZSgpO1xuICAgICAgICAgICAgY29uc3Qgcm9sbEFuZ2xlID0gcmlnaHQuYW5nbGVUbyhwcmpSaWdodCkgKiBNYXRoLnNpZ24ocmlnaHQueSk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmxhbmRpbmdHZWFyRGVwbG95ZWQgPT09IGZhbHNlIHx8XG4gICAgICAgICAgICAgICAgc3BlZWQgPiBMQU5ERURfTUFYX1NQRUVEIHx8XG4gICAgICAgICAgICAgICAgdGhpcy52ZWxvY2l0eS55IDwgLUxBTkRJTkdfTUFYX1ZTUEVFRCB8fFxuICAgICAgICAgICAgICAgIE1hdGguYWJzKHJvbGxBbmdsZSkgPiBMQU5ESU5HX01BWF9ST0xMIHx8XG4gICAgICAgICAgICAgICAgTEFORElOR19NSU5fUElUQ0ggPiBwaXRjaEFuZ2xlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jcmFzaGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGZvcndhcmQueSA8IDAuMCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBoZWFkaW5nID0gbmV3IFRIUkVFLlZlY3RvcjMoKS5jb3B5KGZvcndhcmQpLnNldFkoMCkubm9ybWFsaXplKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub2JqLnF1YXRlcm5pb24uc2V0RnJvbVVuaXRWZWN0b3JzKEZPUldBUkQsIGhlYWRpbmcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnZlbG9jaXR5LnNldFkoMCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGFsbCA9IC0xO1xuICAgICAgICAgICAgICAgIHRoaXMubGFuZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldFN0YWxsU3RhdHVzKCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0YWxsO1xuICAgIH1cbn0iLCJpbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgeyBNQVhfQUxUSVRVREUsIE1BWF9TUEVFRCwgUElUQ0hfUkFURSwgUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5ELCBST0xMX1JBVEUsIFlBV19SQVRFIH0gZnJvbSBcIi4uLy4uL2RlZnNcIjtcbmltcG9ydCB7IEZPUldBUkQsIGlzWmVybywgVVAgfSBmcm9tICcuLi8uLi91dGlscy9tYXRoJztcbmltcG9ydCB7IEZsaWdodE1vZGVsIH0gZnJvbSAnLi9mbGlnaHRNb2RlbCc7XG5cbmV4cG9ydCBjbGFzcyBEZWJ1Z0ZsaWdodE1vZGVsIGV4dGVuZHMgRmxpZ2h0TW9kZWwge1xuXG4gICAgcHJpdmF0ZSBzcGVlZDogbnVtYmVyID0gMDtcblxuICAgIHByaXZhdGUgX3Y6IFRIUkVFLlZlY3RvcjMgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgX3c6IFRIUkVFLlZlY3RvcjMgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMub2JqLnVwLmNvcHkoVVApO1xuICAgIH1cblxuICAgIHN0ZXAoZGVsdGE6IG51bWJlcik6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5jcmFzaGVkKSByZXR1cm47XG5cbiAgICAgICAgdGhpcy5lZmZlY3RpdmVUaHJvdHRsZSA9IHRoaXMudGhyb3R0bGU7XG4gICAgICAgIHRoaXMuZW5naW5lVGhydXN0TiA9IDA7XG5cbiAgICAgICAgLy8gUm9sbCBjb250cm9sXG4gICAgICAgIGlmICghaXNaZXJvKHRoaXMucm9sbCkpIHtcbiAgICAgICAgICAgIHRoaXMub2JqLnJvdGF0ZVoodGhpcy5yb2xsICogUk9MTF9SQVRFICogZGVsdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUGl0Y2ggY29udHJvbFxuICAgICAgICBpZiAoIWlzWmVybyh0aGlzLnBpdGNoKSkge1xuICAgICAgICAgICAgdGhpcy5vYmoucm90YXRlWCgtdGhpcy5waXRjaCAqIFBJVENIX1JBVEUgKiBkZWx0YSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBZYXcgY29udHJvbFxuICAgICAgICBpZiAoIWlzWmVybyh0aGlzLnlhdykpIHtcbiAgICAgICAgICAgIHRoaXMub2JqLnJvdGF0ZVkoLXRoaXMueWF3ICogWUFXX1JBVEUgKiBkZWx0YSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBdXRvbWF0aWMgeWF3IHdoZW4gcm9sbGluZ1xuICAgICAgICBjb25zdCBmb3J3YXJkID0gdGhpcy5vYmouZ2V0V29ybGREaXJlY3Rpb24odGhpcy5fdik7XG4gICAgICAgIGlmICgtMC45OSA8IGZvcndhcmQueSAmJiBmb3J3YXJkLnkgPCAwLjk5KSB7XG4gICAgICAgICAgICBjb25zdCBwcmpGb3J3YXJkID0gZm9yd2FyZC5zZXRZKDApO1xuICAgICAgICAgICAgY29uc3QgdXAgPSB0aGlzLl93LmNvcHkoVVApLmFwcGx5UXVhdGVybmlvbih0aGlzLm9iai5xdWF0ZXJuaW9uKTtcbiAgICAgICAgICAgIGNvbnN0IHByalVwID0gdXAucHJvamVjdE9uUGxhbmUocHJqRm9yd2FyZCkuc2V0WSgwKTtcbiAgICAgICAgICAgIGNvbnN0IHNpZ24gPSAocHJqRm9yd2FyZC54ICogcHJqVXAueiAtIHByakZvcndhcmQueiAqIHByalVwLngpID4gMCA/IC0xIDogMTtcbiAgICAgICAgICAgIHRoaXMub2JqLnJvdGF0ZU9uV29ybGRBeGlzKFVQLCBzaWduICogcHJqVXAubGVuZ3RoKCkgKiBwcmpVcC5sZW5ndGgoKSAqIHByakZvcndhcmQubGVuZ3RoKCkgKiAyLjAgKiBZQVdfUkFURSAqIGRlbHRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE1vdmVtZW50XG4gICAgICAgIHRoaXMuc3BlZWQgPSB0aGlzLmVmZmVjdGl2ZVRocm90dGxlICogTUFYX1NQRUVEO1xuICAgICAgICB0aGlzLm9iai50cmFuc2xhdGVaKHRoaXMuc3BlZWQgKiBkZWx0YSk7XG5cbiAgICAgICAgLy8gQXZvaWQgZ3JvdW5kIGNyYXNoZXNcbiAgICAgICAgaWYgKHRoaXMub2JqLnBvc2l0aW9uLnkgPCBQTEFORV9ESVNUQU5DRV9UT19HUk9VTkQpIHtcbiAgICAgICAgICAgIHRoaXMub2JqLnBvc2l0aW9uLnkgPSBQTEFORV9ESVNUQU5DRV9UT19HUk9VTkQ7XG4gICAgICAgICAgICBjb25zdCBkID0gdGhpcy5vYmouZ2V0V29ybGREaXJlY3Rpb24odGhpcy5fdik7XG4gICAgICAgICAgICBpZiAoZC55IDwgMC4wKSB7XG4gICAgICAgICAgICAgICAgZC5zZXRZKDApLmFkZCh0aGlzLm9iai5wb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgdGhpcy5vYmoubG9va0F0KGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXZvaWQgZmx5aW5nIHRvbyBoaWdoXG4gICAgICAgIGlmICh0aGlzLm9iai5wb3NpdGlvbi55ID4gTUFYX0FMVElUVURFKSB7XG4gICAgICAgICAgICB0aGlzLm9iai5wb3NpdGlvbi55ID0gTUFYX0FMVElUVURFO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVmVsb2NpdHlcbiAgICAgICAgdGhpcy52ZWxvY2l0eS5jb3B5KEZPUldBUkQpLmFwcGx5UXVhdGVybmlvbih0aGlzLm9iai5xdWF0ZXJuaW9uKS5tdWx0aXBseVNjYWxhcih0aGlzLnNwZWVkKTtcblxuICAgICAgICB0aGlzLmxhbmRlZCA9IHRoaXMub2JqLnBvc2l0aW9uLnkgPD0gUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5EO1xuICAgIH1cblxuICAgIGdldFN0YWxsU3RhdHVzKCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9XG59XG4iLCJpbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgeyBVUCB9IGZyb20gJy4uLy4uL3V0aWxzL21hdGgnO1xuXG5leHBvcnQgY29uc3QgU0lNX0ZQUyA9IDEyMDtcbmNvbnN0IFNJTV9ERUxUQSA9IDEuMCAvIFNJTV9GUFM7XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBGbGlnaHRNb2RlbCB7XG5cbiAgICBwcm90ZWN0ZWQgb2JqID0gbmV3IFRIUkVFLk9iamVjdDNEKCk7XG4gICAgcHJvdGVjdGVkIHZlbG9jaXR5OiBUSFJFRS5WZWN0b3IzID0gbmV3IFRIUkVFLlZlY3RvcjMoKTsgLy8gbS9zXG5cbiAgICBwcm90ZWN0ZWQgY3Jhc2hlZDogYm9vbGVhbiA9IGZhbHNlO1xuICAgIHByb3RlY3RlZCBsYW5kZWQ6IGJvb2xlYW4gPSB0cnVlO1xuICAgIHByb3RlY3RlZCBsYW5kaW5nR2VhckRlcGxveWVkOiBib29sZWFuID0gdHJ1ZTtcbiAgICBwcm90ZWN0ZWQgZmxhcHNFeHRlbmRlZDogYm9vbGVhbiA9IHRydWU7XG4gICAgcHJvdGVjdGVkIHdoZWVsQnJha2VzQXBwbGllZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gICAgcHJvdGVjdGVkIHBpdGNoOiBudW1iZXIgPSAwOyAvLyBbLTEsIDFdXG4gICAgcHJvdGVjdGVkIHJvbGw6IG51bWJlciA9IDA7IC8vIFstMSwgMV1cbiAgICBwcm90ZWN0ZWQgeWF3OiBudW1iZXIgPSAwOyAvLyBbLTEsIDFdXG4gICAgcHJvdGVjdGVkIHRocm90dGxlOiBudW1iZXIgPSAwOyAvLyBbMCwgMV1cbiAgICBwcm90ZWN0ZWQgZWZmZWN0aXZlVGhyb3R0bGU6IG51bWJlciA9IDA7IC8vIFswLCAxXVxuXG4gICAgcHJvdGVjdGVkIGFuZ2xlT2ZBdHRhY2tSYWQ6IG51bWJlciA9IDA7XG4gICAgcHJvdGVjdGVkIGxvYWRGYWN0b3JHOiBudW1iZXIgPSAxO1xuICAgIHByb3RlY3RlZCBlbmdpbmVUaHJ1c3ROOiBudW1iZXIgPSAwO1xuXG4gICAgcHJpdmF0ZSBwcmV2UG9zaXRpb24gPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcHJldlF1YXRlcm5pb24gPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuICAgIHByaXZhdGUgcHJldlZlbG9jaXR5ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIGRlbHRhUmVtYWluZGVyOiBudW1iZXIgPSAwO1xuXG4gICAgYWJzdHJhY3Qgc3RlcChkZWx0YTogbnVtYmVyKTogdm9pZDtcblxuICAgIHJlc2V0KCkge1xuICAgICAgICB0aGlzLm9iai5wb3NpdGlvbi5zZXQoMCwgMCwgMCk7XG4gICAgICAgIHRoaXMub2JqLnF1YXRlcm5pb24uc2V0RnJvbUF4aXNBbmdsZShVUCwgMCk7XG4gICAgICAgIHRoaXMudmVsb2NpdHkuc2V0KDAsIDAsIDApO1xuICAgICAgICB0aGlzLmNyYXNoZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5sYW5kZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLmxhbmRpbmdHZWFyRGVwbG95ZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLmZsYXBzRXh0ZW5kZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLndoZWVsQnJha2VzQXBwbGllZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnBpdGNoID0gMDtcbiAgICAgICAgdGhpcy5yb2xsID0gMDtcbiAgICAgICAgdGhpcy55YXcgPSAwO1xuICAgICAgICB0aGlzLnRocm90dGxlID0gMDtcbiAgICAgICAgdGhpcy5lZmZlY3RpdmVUaHJvdHRsZSA9IDA7XG4gICAgICAgIHRoaXMuYW5nbGVPZkF0dGFja1JhZCA9IDA7XG4gICAgICAgIHRoaXMubG9hZEZhY3RvckcgPSAxO1xuICAgICAgICB0aGlzLmVuZ2luZVRocnVzdE4gPSAwO1xuICAgICAgICB0aGlzLmRlbHRhUmVtYWluZGVyID0gMDtcbiAgICAgICAgdGhpcy5zeW5jUHJldmlvdXNTdGF0ZSgpO1xuICAgIH1cblxuICAgIC8qKiBBbGlnbiByZW5kZXIgaW50ZXJwb2xhdGlvbiBhZnRlciB0ZWxlcG9ydCBvciBhaXJib3JuZSBzcGF3bi4gKi9cbiAgICBzbmFwUGh5c2ljc1N0YXRlKCk6IHZvaWQge1xuICAgICAgICB0aGlzLnN5bmNQcmV2aW91c1N0YXRlKCk7XG4gICAgfVxuXG4gICAgdXBkYXRlKGRlbHRhOiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5kZWx0YVJlbWFpbmRlciArPSBkZWx0YTtcbiAgICAgICAgd2hpbGUgKHRoaXMuZGVsdGFSZW1haW5kZXIgPj0gU0lNX0RFTFRBKSB7XG4gICAgICAgICAgICB0aGlzLnNhdmVQcmV2aW91c1N0YXRlKCk7XG4gICAgICAgICAgICB0aGlzLnN0ZXAoU0lNX0RFTFRBKTtcbiAgICAgICAgICAgIHRoaXMuZGVsdGFSZW1haW5kZXIgLT0gU0lNX0RFTFRBO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqIDEgPSBsYXRlc3QgcGh5c2ljcyBzdGF0ZSwgMCA9IHByZXZpb3VzIHBoeXNpY3Mgc3RhdGUuICovXG4gICAgZ2V0UmVuZGVySW50ZXJwb2xhdGlvbkFscGhhKCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiAxIC0gdGhpcy5kZWx0YVJlbWFpbmRlciAvIFNJTV9ERUxUQTtcbiAgICB9XG5cbiAgICBnZXRSZW5kZXJQb3NpdGlvbih0YXJnZXQ6IFRIUkVFLlZlY3RvcjMpOiBUSFJFRS5WZWN0b3IzIHtcbiAgICAgICAgcmV0dXJuIHRhcmdldC5sZXJwVmVjdG9ycyh0aGlzLnByZXZQb3NpdGlvbiwgdGhpcy5vYmoucG9zaXRpb24sIHRoaXMuZ2V0UmVuZGVySW50ZXJwb2xhdGlvbkFscGhhKCkpO1xuICAgIH1cblxuICAgIGdldFJlbmRlclF1YXRlcm5pb24odGFyZ2V0OiBUSFJFRS5RdWF0ZXJuaW9uKTogVEhSRUUuUXVhdGVybmlvbiB7XG4gICAgICAgIHJldHVybiB0YXJnZXQuc2xlcnBRdWF0ZXJuaW9ucyh0aGlzLnByZXZRdWF0ZXJuaW9uLCB0aGlzLm9iai5xdWF0ZXJuaW9uLCB0aGlzLmdldFJlbmRlckludGVycG9sYXRpb25BbHBoYSgpKTtcbiAgICB9XG5cbiAgICBnZXRSZW5kZXJWZWxvY2l0eSh0YXJnZXQ6IFRIUkVFLlZlY3RvcjMpOiBUSFJFRS5WZWN0b3IzIHtcbiAgICAgICAgcmV0dXJuIHRhcmdldC5sZXJwVmVjdG9ycyh0aGlzLnByZXZWZWxvY2l0eSwgdGhpcy52ZWxvY2l0eSwgdGhpcy5nZXRSZW5kZXJJbnRlcnBvbGF0aW9uQWxwaGEoKSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzYXZlUHJldmlvdXNTdGF0ZSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5wcmV2UG9zaXRpb24uY29weSh0aGlzLm9iai5wb3NpdGlvbik7XG4gICAgICAgIHRoaXMucHJldlF1YXRlcm5pb24uY29weSh0aGlzLm9iai5xdWF0ZXJuaW9uKTtcbiAgICAgICAgdGhpcy5wcmV2VmVsb2NpdHkuY29weSh0aGlzLnZlbG9jaXR5KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHN5bmNQcmV2aW91c1N0YXRlKCk6IHZvaWQge1xuICAgICAgICB0aGlzLnByZXZQb3NpdGlvbi5jb3B5KHRoaXMub2JqLnBvc2l0aW9uKTtcbiAgICAgICAgdGhpcy5wcmV2UXVhdGVybmlvbi5jb3B5KHRoaXMub2JqLnF1YXRlcm5pb24pO1xuICAgICAgICB0aGlzLnByZXZWZWxvY2l0eS5jb3B5KHRoaXMudmVsb2NpdHkpO1xuICAgIH1cblxuICAgIHNldFBpdGNoKHBpdGNoOiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy5waXRjaCA9IHBpdGNoO1xuICAgIH1cblxuICAgIHNldFJvbGwocm9sbDogbnVtYmVyKSB7XG4gICAgICAgIHRoaXMucm9sbCA9IHJvbGw7XG4gICAgfVxuXG4gICAgc2V0WWF3KHlhdzogbnVtYmVyKSB7XG4gICAgICAgIHRoaXMueWF3ID0geWF3O1xuICAgIH1cblxuICAgIHNldFRocm90dGxlKHRocm90dGxlOiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy50aHJvdHRsZSA9IHRocm90dGxlO1xuICAgIH1cblxuICAgIC8qKiBNYXRjaCBzcG9vbGVkIGVuZ2luZSBzdGF0ZSB0byBjb21tYW5kZWQgdGhyb3R0bGUgKGUuZy4gYWlyYm9ybmUgc3Bhd24pLiAqL1xuICAgIHN5bmNFZmZlY3RpdmVUaHJvdHRsZSgpIHtcbiAgICAgICAgdGhpcy5lZmZlY3RpdmVUaHJvdHRsZSA9IHRoaXMudGhyb3R0bGU7XG4gICAgfVxuXG4gICAgc2V0TGFuZGluZ0dlYXJEZXBsb3llZChkZXBsb3llZDogYm9vbGVhbikge1xuICAgICAgICB0aGlzLmxhbmRpbmdHZWFyRGVwbG95ZWQgPSBkZXBsb3llZDtcbiAgICB9XG5cbiAgICBzZXRGbGFwc0V4dGVuZGVkKGV4dGVuZGVkOiBib29sZWFuKSB7XG4gICAgICAgIHRoaXMuZmxhcHNFeHRlbmRlZCA9IGV4dGVuZGVkO1xuICAgIH1cblxuICAgIHNldFdoZWVsQnJha2VzKGFwcGxpZWQ6IGJvb2xlYW4pIHtcbiAgICAgICAgdGhpcy53aGVlbEJyYWtlc0FwcGxpZWQgPSBhcHBsaWVkO1xuICAgIH1cblxuICAgIGlzV2hlZWxCcmFrZXNBcHBsaWVkKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy53aGVlbEJyYWtlc0FwcGxpZWQ7XG4gICAgfVxuXG4gICAgc2V0TGFuZGVkKGlzTGFuZGVkOiBib29sZWFuKSB7XG4gICAgICAgIHRoaXMubGFuZGVkID0gaXNMYW5kZWQ7XG4gICAgfVxuXG4gICAgaXNMYW5kZWQoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLmxhbmRlZDtcbiAgICB9XG5cbiAgICBzZXRDcmFzaGVkKGlzQ3Jhc2hlZDogYm9vbGVhbikge1xuICAgICAgICB0aGlzLmNyYXNoZWQgPSBpc0NyYXNoZWQ7XG4gICAgfVxuXG4gICAgaXNDcmFzaGVkKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5jcmFzaGVkO1xuICAgIH1cblxuICAgIHNldCBwb3NpdGlvbihwOiBUSFJFRS5WZWN0b3IzKSB7XG4gICAgICAgIHRoaXMub2JqLnBvc2l0aW9uLmNvcHkocCk7XG4gICAgfVxuXG4gICAgZ2V0IHBvc2l0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vYmoucG9zaXRpb247XG4gICAgfVxuXG4gICAgc2V0IHF1YXRlcm5pb24ocTogVEhSRUUuUXVhdGVybmlvbikge1xuICAgICAgICB0aGlzLm9iai5xdWF0ZXJuaW9uLmNvcHkocSk7XG4gICAgfVxuXG4gICAgZ2V0IHF1YXRlcm5pb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9iai5xdWF0ZXJuaW9uO1xuICAgIH1cblxuICAgIHNldCB2ZWxvY2l0eVZlY3Rvcih2OiBUSFJFRS5WZWN0b3IzKSB7XG4gICAgICAgIHRoaXMudmVsb2NpdHkuY29weSh2KTtcbiAgICB9XG5cbiAgICBnZXQgdmVsb2NpdHlWZWN0b3IoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZlbG9jaXR5O1xuICAgIH1cblxuICAgIGdldEVmZmVjdGl2ZVRocm90dGxlKCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLmVmZmVjdGl2ZVRocm90dGxlO1xuICAgIH1cblxuICAgIC8vIFstMSwxXSAtIFZhbHVlcyA+PSAwIG1lYW4gc3RhbGxcbiAgICBhYnN0cmFjdCBnZXRTdGFsbFN0YXR1cygpOiBudW1iZXI7XG5cbiAgICBnZXRBbmdsZU9mQXR0YWNrKCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLmFuZ2xlT2ZBdHRhY2tSYWQ7XG4gICAgfVxuXG4gICAgZ2V0TG9hZEZhY3RvckcoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9hZEZhY3Rvckc7XG4gICAgfVxuXG4gICAgZ2V0RW5naW5lVGhydXN0S24oKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZW5naW5lVGhydXN0TiAvIDEwMDA7XG4gICAgfVxuXG4gICAgdXNlRjE2VGhyb3R0bGVEZXRlbnRzKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgc3RlcFRocm90dGxlRGV0ZW50KGN1cnJlbnQ6IG51bWJlciwgZGlyZWN0aW9uOiAxIHwgLTEpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gTWF0aC5tYXgoMCwgTWF0aC5taW4oMSwgY3VycmVudCArIGRpcmVjdGlvbiAqIDAuMDEpKTtcbiAgICB9XG5cbiAgICBpc0luVGhyb3R0bGVBYkRldGVudEJhbmQoX2xldmVyOiBudW1iZXIpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8qKiBPdmVycmlkZSBpbiBtb2RlbHMgd2l0aCBhIG5vbi1saW5lYXIgdGhyb3R0bGUgcXVhZHJhbnQuICovXG4gICAgYWRqdXN0VGhyb3R0bGVJbnB1dChjdXJyZW50OiBudW1iZXIsIHN0ZXA6IG51bWJlcik6IG51bWJlciB7XG4gICAgICAgIHJldHVybiBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCBjdXJyZW50ICsgc3RlcCkpO1xuICAgIH1cblxuICAgIC8qKiBPdmVycmlkZSBpbiBtb2RlbHMgd2l0aCBhIG5vbi1saW5lYXIgdGhyb3R0bGUgcXVhZHJhbnQuICovXG4gICAgZ2V0VGhyb3R0bGVIdWRUZXh0KCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBgVEhSICR7KDEwMCAqIHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUpLnRvRml4ZWQoMCl9YDtcbiAgICB9XG5cbiAgICAvKiogTm9ybWFsaXplZCBlbmdpbmUgcG93ZXIgZm9yIGF1ZGlvIFswLCAxXS4gKi9cbiAgICBnZXRUaHJvdHRsZUF1ZGlvTGV2ZWwoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWZmZWN0aXZlVGhyb3R0bGU7XG4gICAgfVxuXG4gICAgLyoqIENTUyBjb2xvciBmb3IgZW5naW5lIG5venpsZSByZW5kZXJpbmcgKE1JTCBibGFjayBieSBkZWZhdWx0KS4gKi9cbiAgICBnZXRFbmdpbmVOb3p6bGVDb2xvcigpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gJyMwYTBhMGEnO1xuICAgIH1cbn1cbiIsIi8qKlxuICogRk0yIOKAlCBGLTE2QyByaWdpZC1ib2R5IFwicGFydHNcIiBmbGlnaHQgbW9kZWwuXG4gKlxuICogVW5saWtlIHRoZSBraW5lbWF0aWMgUmVhbGlzdGljIG1vZGVsICh3aGljaCByb3RhdGVzIHRoZSBhaXJmcmFtZSBkaXJlY3RseSBmcm9tXG4gKiBzdGljayBhdXRob3JpdHkpLCBGTTIgaXMgYSBnZW51aW5lIDYtRE9GIHJpZ2lkIGJvZHkuIEV2ZXJ5IGFlcm9keW5hbWljIGZvcmNlXG4gKiBpcyBwcm9kdWNlZCBieSBhIGRpc2NyZXRlIGxpZnRpbmcgc3VyZmFjZSBhdCBpdHMgcmVhbCBsb2NhdGlvbiwgc28gYWxsIG1vbWVudHNcbiAqIOKAlCBhbmQgdGhlIHBpdGNoL3JvbGwveWF3IHJhdGUgZGFtcGluZyDigJQgZW1lcmdlIGZyb20gdGhlIGdlb21ldHJ5LiBBIGZseS1ieS13aXJlXG4gKiBsYXllciBjbG9zZXMgcmF0ZS9nIGxvb3BzIGFyb3VuZCB0aGUgYWlyZnJhbWUgdG8gZ2l2ZSBGLTE2IGhhbmRsaW5nLiBMYW5kaW5nXG4gKiBnZWFyIGlzIG1vZGVsbGVkIGFzIHNwcmluZy1kYW1wZXIgY29udGFjdCBwb2ludHMsIHNvIHdlaWdodC1vbi13aGVlbHMsIHRha2VvZmZcbiAqIHJvdGF0aW9uIGFuZCBncm91bmQgc3RhYmlsaXR5IGFyZSBhbHNvIGp1c3QgcmlnaWQtYm9keSByZWFjdGlvbnMuXG4gKlxuICogU2VlIHBoeXNpY3MvZm0yLyogZm9yIHRoZSBidWlsZGluZyBibG9ja3MuXG4gKi9cbmltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcbmltcG9ydCB7IFBMQU5FX0RJU1RBTkNFX1RPX0dST1VORCwgVEVSUkFJTl9NT0RFTF9TSVpFLCBURVJSQUlOX1NDQUxFIH0gZnJvbSAnLi4vLi4vZGVmcyc7XG5pbXBvcnQgeyBjbGFtcCwgRk9SV0FSRCwgUklHSFQsIFVQIH0gZnJvbSAnLi4vLi4vdXRpbHMvbWF0aCc7XG5pbXBvcnQge1xuICAgIGNvbXB1dGVBaXJEZW5zaXR5LCBjb21wdXRlRHluYW1pY1ByZXNzdXJlLCBjb21wdXRlSXNhQWlyRGVuc2l0eSxcbiAgICBjb21wdXRlTWFjaE51bWJlcixcbn0gZnJvbSAnLi4vYWVyb1V0aWxzJztcbmltcG9ydCB7XG4gICAgYWRqdXN0RjE2VGhyb3R0bGVJbnB1dCwgY29tcHV0ZUYxNkVuZ2luZVRocnVzdE4sIGYxNlRocm90dGxlQXVkaW9MZXZlbCxcbiAgICBmb3JtYXRGMTZUaHJvdHRsZUh1ZCwgZ2V0RjE2RW5naW5lTm96emxlQ29sb3IsIGdldEYxNlRocm90dGxlWm9uZSxcbiAgICBpc0YxNkFiRGV0ZW50QmFuZCwgc3RlcEYxNlRocm90dGxlRGV0ZW50LFxufSBmcm9tICcuLi9mMTZFbmdpbmUnO1xuaW1wb3J0IHsgRjE2X1BST0ZJTEUgfSBmcm9tICcuLi9mMTZQcm9maWxlJztcbmltcG9ydCB7IEFlcm9TdXJmYWNlIH0gZnJvbSAnLi4vZm0yL2Flcm9TdXJmYWNlJztcbmltcG9ydCB7IEYxNkZjcyB9IGZyb20gJy4uL2ZtMi9mMTZGY3MnO1xuaW1wb3J0IHtcbiAgICBGTTJfQUlMRVJPTiwgRk0yX0JPRFlfQ0QwLCBGTTJfRkNTLCBGTTJfRkxBUFMsIEZNMl9HRUFSX0NELCBGTTJfR0VPTUVUUlksXG4gICAgRk0yX0lORVJUSUEsIEZNMl9TVVJGQUNFUywgRk0yX1dBVkVfRFJBRyxcbn0gZnJvbSAnLi4vZm0yL2YxNkZtMkNvbmZpZyc7XG5pbXBvcnQgeyBSaWdpZEJvZHkgfSBmcm9tICcuLi9mbTIvcmlnaWRCb2R5JztcbmltcG9ydCB7IEZsaWdodE1vZGVsIH0gZnJvbSAnLi9mbGlnaHRNb2RlbCc7XG5cbmNvbnN0IEdSQVZJVFkgPSA5LjgwNjY1O1xuY29uc3QgREVHID0gTWF0aC5QSSAvIDE4MDtcblxuY29uc3QgVEhST1RUTEVfVVBfUkFURSA9IDAuMTA7XG5jb25zdCBUSFJPVFRMRV9ET1dOX1JBVEUgPSAwLjA3O1xuXG5jb25zdCBNQVhfU1RBQklMQVRPUl9BT0EgPSBGTTJfRkNTLm1heFN0YWJpbGF0b3JSYWQ7XG5jb25zdCBNQVhfQUlMRVJPTl9BT0EgPSBGTTJfQUlMRVJPTi5tYXhEZWZsZWN0aW9uUmFkO1xuY29uc3QgTUFYX1JVRERFUl9BT0EgPSAyMiAqIERFRztcblxuY29uc3QgUV9SRUYgPSAwLjUgKiBjb21wdXRlSXNhQWlyRGVuc2l0eShGMTZfUFJPRklMRS5jcnVpc2VBbHRpdHVkZU0pICogRjE2X1BST0ZJTEUuY3J1aXNlU3BlZWRNcHMgKiogMjtcbmNvbnN0IFNUQUxMX0FPQSA9IEYxNl9QUk9GSUxFLnN0YWxsQW9hRGVnICogREVHO1xuY29uc3QgTUlOX0ZMWUlOR19TUEVFRCA9IEYxNl9QUk9GSUxFLm1pbkZseWluZ1NwZWVkTXBzO1xuXG4vLyBMYW5kaW5nLWdlYXIgc3ByaW5nLWRhbXBlciBjb250YWN0IHBvaW50cyAoYm9keSBmcmFtZSwgbSkuIFkg4omIIC1QTEFORV9ESVNUQU5DRV9UT19HUk9VTkQuXG5jb25zdCBHRUFSX1BPSU5UUzogW251bWJlciwgbnVtYmVyLCBudW1iZXJdW10gPSBbXG4gICAgWzAuMCwgLVBMQU5FX0RJU1RBTkNFX1RPX0dST1VORCwgMi42XSwgICAvLyBub3NlXG4gICAgWy0xLjIsIC1QTEFORV9ESVNUQU5DRV9UT19HUk9VTkQsIC0wLjZdLCAvLyBsZWZ0IG1haW5cbiAgICBbMS4yLCAtUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5ELCAtMC42XSwgIC8vIHJpZ2h0IG1haW5cbl07XG5jb25zdCBHRUFSX1NUSUZGTkVTUyA9IDQuMGU2OyAgIC8vIE4vbVxuY29uc3QgR0VBUl9EQU1QSU5HID0gMS42ZTU7ICAgICAvLyBOwrdzL21cbmNvbnN0IEdFQVJfUk9MTF9GUklDVElPTiA9IDAuMDQ7XG5jb25zdCBHRUFSX0JSQUtFX0ZSSUNUSU9OID0gMC41NTtcbmNvbnN0IEdFQVJfU0lERV9GUklDVElPTiA9IDAuODtcblxuLy8gVG91Y2hkb3duIGxpbWl0cyAoY3Jhc2ggb3RoZXJ3aXNlKSwgbWlycm9yaW5nIHRoZSBGLTE2IHByb2ZpbGUuXG5jb25zdCBMQU5ESU5HX01BWF9TUEVFRCA9IEYxNl9QUk9GSUxFLmxhbmRpbmdNYXhTcGVlZE1wcztcbmNvbnN0IExBTkRJTkdfTUFYX1ZTUEVFRCA9IEYxNl9QUk9GSUxFLmxhbmRpbmdNYXhWZXJ0aWNhbFNwZWVkTXBzO1xuY29uc3QgTEFORElOR19NSU5fUElUQ0ggPSBGMTZfUFJPRklMRS5sYW5kaW5nTWluUGl0Y2hEZWcgKiBERUc7XG5jb25zdCBMQU5ESU5HX01BWF9ST0xMID0gRjE2X1BST0ZJTEUubGFuZGluZ01heFJvbGxEZWcgKiBERUc7XG5cbmludGVyZmFjZSBTdXJmYWNlQ29udHJvbHMge1xuICAgIHdpbmdMZWZ0QW9hOiBudW1iZXI7XG4gICAgd2luZ1JpZ2h0QW9hOiBudW1iZXI7XG4gICAgaHRhaWxMZWZ0QW9hOiBudW1iZXI7XG4gICAgaHRhaWxSaWdodEFvYTogbnVtYmVyO1xuICAgIHZ0YWlsQW9hOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBGbTJGbGlnaHRNb2RlbCBleHRlbmRzIEZsaWdodE1vZGVsIHtcblxuICAgIHByaXZhdGUgcmVhZG9ubHkgcmIgPSBuZXcgUmlnaWRCb2R5KEZNMl9HRU9NRVRSWS5tYXNzS2csIHtcbiAgICAgICAgeDogRk0yX0lORVJUSUEucGl0Y2gsXG4gICAgICAgIHk6IEZNMl9JTkVSVElBLnlhdyxcbiAgICAgICAgejogRk0yX0lORVJUSUEucm9sbCxcbiAgICB9KTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGZjcyA9IG5ldyBGMTZGY3MoKTtcblxuICAgIHByaXZhdGUgcmVhZG9ubHkgd2luZ0xlZnQgPSBuZXcgQWVyb1N1cmZhY2UoRk0yX1NVUkZBQ0VTLndpbmdMZWZ0KTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IHdpbmdSaWdodCA9IG5ldyBBZXJvU3VyZmFjZShGTTJfU1VSRkFDRVMud2luZ1JpZ2h0KTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGh0YWlsTGVmdCA9IG5ldyBBZXJvU3VyZmFjZShGTTJfU1VSRkFDRVMuaHRhaWxMZWZ0KTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGh0YWlsUmlnaHQgPSBuZXcgQWVyb1N1cmZhY2UoRk0yX1NVUkZBQ0VTLmh0YWlsUmlnaHQpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgdnRhaWwgPSBuZXcgQWVyb1N1cmZhY2UoRk0yX1NVUkZBQ0VTLnZ0YWlsKTtcblxuICAgIHByaXZhdGUgc3RhbGwgPSAtMTtcblxuICAgIC8vIFNjcmF0Y2ggdmVjdG9ycyAoYXZvaWQgcGVyLXN0ZXAgYWxsb2NhdGlvbiBpbiB0aGUgd29ya2VyKS5cbiAgICBwcml2YXRlIHJlYWRvbmx5IHZlbEJvZHkgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgZm9yY2VCb2R5ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IG1vbWVudEJvZHkgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgZm9yY2VXb3JsZCA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSByZWFkb25seSBnZWFyRm9yY2VXb3JsZCA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSByZWFkb25seSBnZWFyTW9tZW50Qm9keSA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSByZWFkb25seSBpbnZPcmllbnQgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgX3VwID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9md2QgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgX3JpZ2h0ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IF92ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IF92MiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSByZWFkb25seSBfZ2VhcldvcmxkID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9jb250YWN0VmVsID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9vbWVnYVdvcmxkID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9mcmljdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5vYmoudXAuY29weShVUCk7XG4gICAgfVxuXG4gICAgcmVzZXQoKTogdm9pZCB7XG4gICAgICAgIHN1cGVyLnJlc2V0KCk7XG4gICAgICAgIHRoaXMucmIucmVzZXQoKTtcbiAgICAgICAgdGhpcy5mY3MucmVzZXQoKTtcbiAgICAgICAgdGhpcy5zdGFsbCA9IC0xO1xuICAgIH1cblxuICAgIHN0ZXAoZGVsdGE6IG51bWJlcik6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5jcmFzaGVkKSByZXR1cm47XG5cbiAgICAgICAgdGhpcy5zcG9vbFRocm90dGxlKGRlbHRhKTtcblxuICAgICAgICAvLyBBZG9wdCBhbnkgZXh0ZXJuYWxseSBzZXQgb3JpZW50YXRpb24gLyB2ZWxvY2l0eSBhcyB0aGUgcmlnaWQtYm9keSBzdGF0ZS5cbiAgICAgICAgdGhpcy5yYi5vcmllbnRhdGlvbi5jb3B5KHRoaXMub2JqLnF1YXRlcm5pb24pO1xuICAgICAgICB0aGlzLnJiLnZlbG9jaXR5V29ybGQuY29weSh0aGlzLnZlbG9jaXR5KTtcblxuICAgICAgICBjb25zdCBhbHRpdHVkZSA9IHRoaXMub2JqLnBvc2l0aW9uLnk7XG4gICAgICAgIGNvbnN0IGFpckRlbnNpdHkgPSBjb21wdXRlQWlyRGVuc2l0eShhbHRpdHVkZSk7XG5cbiAgICAgICAgLy8gQm9keS1mcmFtZSB2ZWxvY2l0eSB0aHJvdWdoIHRoZSBhaXIuXG4gICAgICAgIHRoaXMuaW52T3JpZW50LmNvcHkodGhpcy5yYi5vcmllbnRhdGlvbikuaW52ZXJ0KCk7XG4gICAgICAgIHRoaXMudmVsQm9keS5jb3B5KHRoaXMucmIudmVsb2NpdHlXb3JsZCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMuaW52T3JpZW50KTtcbiAgICAgICAgY29uc3Qgc3BlZWQgPSB0aGlzLnZlbEJvZHkubGVuZ3RoKCk7XG5cbiAgICAgICAgLy8gQWlyY3JhZnQgYW5nbGUgb2YgYXR0YWNrIChpbiB0aGUgYm9keSBYLXBsYW5lKSBhbmQgc2lkZXNsaXAuXG4gICAgICAgIGNvbnN0IGFvYSA9IHNwZWVkID4gMSA/IE1hdGguYXRhbjIoLXRoaXMudmVsQm9keS55LCB0aGlzLnZlbEJvZHkueikgOiAwO1xuICAgICAgICB0aGlzLmFuZ2xlT2ZBdHRhY2tSYWQgPSBhb2E7XG5cbiAgICAgICAgY29uc3QgZHluYW1pY1ByZXNzdXJlID0gY29tcHV0ZUR5bmFtaWNQcmVzc3VyZShhaXJEZW5zaXR5LCBzcGVlZCk7XG4gICAgICAgIGNvbnN0IG1hY2ggPSBjb21wdXRlTWFjaE51bWJlcihzcGVlZCwgYWx0aXR1ZGUpO1xuXG4gICAgICAgIC8vIEZseS1ieS13aXJlOiBzdGljay9wZWRhbHMgKyBzdGF0ZSDihpIgc3VyZmFjZSBjb21tYW5kcy5cbiAgICAgICAgY29uc3QgZmNzT3V0ID0gdGhpcy5mY3MudXBkYXRlKHtcbiAgICAgICAgICAgIHBpdGNoU3RpY2s6IHRoaXMucGl0Y2gsXG4gICAgICAgICAgICByb2xsU3RpY2s6IHRoaXMucm9sbCxcbiAgICAgICAgICAgIHlhd1BlZGFsOiB0aGlzLnlhdyxcbiAgICAgICAgICAgIHBpdGNoUmF0ZTogdGhpcy5yYi5hbmd1bGFyVmVsb2NpdHlCb2R5LngsXG4gICAgICAgICAgICB5YXdSYXRlOiB0aGlzLnJiLmFuZ3VsYXJWZWxvY2l0eUJvZHkueSxcbiAgICAgICAgICAgIHJvbGxSYXRlOiB0aGlzLnJiLmFuZ3VsYXJWZWxvY2l0eUJvZHkueixcbiAgICAgICAgICAgIGxvYWRGYWN0b3JHOiB0aGlzLmxvYWRGYWN0b3JHLFxuICAgICAgICAgICAgYW9hUmFkOiBhb2EsXG4gICAgICAgICAgICBkeW5hbWljUHJlc3N1cmUsXG4gICAgICAgICAgICBxUmVmOiBRX1JFRixcbiAgICAgICAgICAgIHNwZWVkLFxuICAgICAgICAgICAgYWx0aXR1ZGVNOiBhbHRpdHVkZSxcbiAgICAgICAgICAgIGZsYXBzRXh0ZW5kZWQ6IHRoaXMuZmxhcHNFeHRlbmRlZCxcbiAgICAgICAgICAgIGxhbmRlZDogdGhpcy5sYW5kZWQsXG4gICAgICAgIH0sIGRlbHRhKTtcblxuICAgICAgICBjb25zdCBjb250cm9scyA9IHRoaXMubWFwQ29udHJvbHMoZmNzT3V0LmVsZXZhdG9yLCBmY3NPdXQuYWlsZXJvbiwgZmNzT3V0LnJ1ZGRlcik7XG5cbiAgICAgICAgLy8gLS0tLSBBZXJvZHluYW1pYyBmb3JjZSAmIG1vbWVudCBidWlsZC11cCBmcm9tIHRoZSByaWdpZCBwYXJ0cy4gLS0tLVxuICAgICAgICB0aGlzLmZvcmNlQm9keS5zZXQoMCwgMCwgMCk7XG4gICAgICAgIHRoaXMubW9tZW50Qm9keS5zZXQoMCwgMCwgMCk7XG5cbiAgICAgICAgY29uc3QgY2FtYmVyID0gdGhpcy5mbGFwc0V4dGVuZGVkID8gRk0yX0ZMQVBTLmFvYUJpYXNSYWQgOiAwO1xuICAgICAgICBjb25zdCBzdGFsbFNoaWZ0ID0gdGhpcy5mbGFwc0V4dGVuZGVkID8gRk0yX0ZMQVBTLnN0YWxsUmVkdWN0aW9uUmFkIDogMDtcbiAgICAgICAgY29uc3Qgd2luZ0V4dHJhQ2QgPSB0aGlzLmZsYXBzRXh0ZW5kZWQgPyBGTTJfRkxBUFMuZXh0cmFDZCA6IDA7XG5cbiAgICAgICAgdGhpcy5hY2N1bXVsYXRlU3VyZmFjZSh0aGlzLndpbmdMZWZ0LCBjb250cm9scy53aW5nTGVmdEFvYSwgY2FtYmVyLCBzdGFsbFNoaWZ0LCB3aW5nRXh0cmFDZCwgYWlyRGVuc2l0eSk7XG4gICAgICAgIHRoaXMuYWNjdW11bGF0ZVN1cmZhY2UodGhpcy53aW5nUmlnaHQsIGNvbnRyb2xzLndpbmdSaWdodEFvYSwgY2FtYmVyLCBzdGFsbFNoaWZ0LCB3aW5nRXh0cmFDZCwgYWlyRGVuc2l0eSk7XG4gICAgICAgIHRoaXMuYWNjdW11bGF0ZVN1cmZhY2UodGhpcy5odGFpbExlZnQsIGNvbnRyb2xzLmh0YWlsTGVmdEFvYSwgMCwgMCwgMCwgYWlyRGVuc2l0eSk7XG4gICAgICAgIHRoaXMuYWNjdW11bGF0ZVN1cmZhY2UodGhpcy5odGFpbFJpZ2h0LCBjb250cm9scy5odGFpbFJpZ2h0QW9hLCAwLCAwLCAwLCBhaXJEZW5zaXR5KTtcbiAgICAgICAgdGhpcy5hY2N1bXVsYXRlU3VyZmFjZSh0aGlzLnZ0YWlsLCBjb250cm9scy52dGFpbEFvYSwgMCwgMCwgMCwgYWlyRGVuc2l0eSk7XG5cbiAgICAgICAgLy8gRnVzZWxhZ2UgLyBwYXJhc2l0ZSAvIGdlYXIgLyB3YXZlIGRyYWcgYWxvbmcgdGhlIHJlbGF0aXZlIHdpbmQuXG4gICAgICAgIHRoaXMuYWRkQm9keURyYWcoZHluYW1pY1ByZXNzdXJlLCBzcGVlZCwgbWFjaCk7XG5cbiAgICAgICAgLy8gVGhydXN0IGFsb25nIHRoZSBub3NlICgrWiBib2R5KS5cbiAgICAgICAgY29uc3QgdGhydXN0TiA9IGNvbXB1dGVGMTZFbmdpbmVUaHJ1c3ROKHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUsIGFsdGl0dWRlKTtcbiAgICAgICAgdGhpcy5lbmdpbmVUaHJ1c3ROID0gdGhydXN0TjtcbiAgICAgICAgdGhpcy5mb3JjZUJvZHkueiArPSB0aHJ1c3ROO1xuXG4gICAgICAgIC8vIExhbmRpbmctZ2VhciByZWFjdGlvbnMgKGNvbXB1dGVkIGluIHdvcmxkLCBtb21lbnQgZm9sZGVkIGludG8gYm9keSBmcmFtZSkuXG4gICAgICAgIHRoaXMuY29tcHV0ZUdlYXJGb3JjZXMoKTtcblxuICAgICAgICAvLyBMb2FkIGZhY3Rvcjogc3BlY2lmaWMgbm9ybWFsIChib2R5LXVwKSBmb3JjZSAvIGcsIGluY2wuIGdlYXIgcmVhY3Rpb24uXG4gICAgICAgIGNvbnN0IGdlYXJCb2R5VXBZID0gdGhpcy5fdi5jb3B5KHRoaXMuZ2VhckZvcmNlV29ybGQpLmFwcGx5UXVhdGVybmlvbih0aGlzLmludk9yaWVudCkueTtcbiAgICAgICAgdGhpcy5sb2FkRmFjdG9yRyA9ICh0aGlzLmZvcmNlQm9keS55ICsgZ2VhckJvZHlVcFkpIC8gKEZNMl9HRU9NRVRSWS5tYXNzS2cgKiBHUkFWSVRZKTtcblxuICAgICAgICAvLyAtLS0tIEludGVncmF0ZSByb3RhdGlvbmFsIGR5bmFtaWNzIChib2R5IGZyYW1lKS4gLS0tLVxuICAgICAgICB0aGlzLm1vbWVudEJvZHkuYWRkKHRoaXMuZ2Vhck1vbWVudEJvZHkpO1xuICAgICAgICB0aGlzLnJiLmludGVncmF0ZUFuZ3VsYXIodGhpcy5tb21lbnRCb2R5LCBkZWx0YSk7XG5cbiAgICAgICAgLy8gLS0tLSBJbnRlZ3JhdGUgdHJhbnNsYXRpb25hbCBkeW5hbWljcyAod29ybGQgZnJhbWUpLiAtLS0tXG4gICAgICAgIHRoaXMuZm9yY2VXb3JsZC5jb3B5KHRoaXMuZm9yY2VCb2R5KS5hcHBseVF1YXRlcm5pb24odGhpcy5yYi5vcmllbnRhdGlvbik7XG4gICAgICAgIHRoaXMuZm9yY2VXb3JsZC5hZGQodGhpcy5nZWFyRm9yY2VXb3JsZCk7XG4gICAgICAgIHRoaXMuZm9yY2VXb3JsZC55IC09IEZNMl9HRU9NRVRSWS5tYXNzS2cgKiBHUkFWSVRZOyAvLyBncmF2aXR5XG4gICAgICAgIHRoaXMucmIuaW50ZWdyYXRlTGluZWFyKHRoaXMuZm9yY2VXb3JsZCwgZGVsdGEsIHRoaXMub2JqLnBvc2l0aW9uKTtcblxuICAgICAgICAvLyBQdWJsaXNoIHJpZ2lkLWJvZHkgc3RhdGUgYmFjayB0byB0aGUgYmFzZSBtb2RlbC5cbiAgICAgICAgdGhpcy5vYmoucXVhdGVybmlvbi5jb3B5KHRoaXMucmIub3JpZW50YXRpb24pO1xuICAgICAgICB0aGlzLnZlbG9jaXR5LmNvcHkodGhpcy5yYi52ZWxvY2l0eVdvcmxkKTtcblxuICAgICAgICB0aGlzLnVwZGF0ZVN0YWxsU3RhdGUoc3BlZWQsIGFvYSwgYWx0aXR1ZGUpO1xuICAgICAgICB0aGlzLmhhbmRsZUdyb3VuZFN0YXRlKCk7XG4gICAgICAgIHRoaXMud3JhcFBvc2l0aW9uKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzcG9vbFRocm90dGxlKGRlbHRhOiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgPiB0aGlzLnRocm90dGxlKSB7XG4gICAgICAgICAgICB0aGlzLmVmZmVjdGl2ZVRocm90dGxlID0gTWF0aC5tYXgodGhpcy50aHJvdHRsZSwgdGhpcy5lZmZlY3RpdmVUaHJvdHRsZSAtIFRIUk9UVExFX0RPV05fUkFURSAqIGRlbHRhKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmVmZmVjdGl2ZVRocm90dGxlIDwgdGhpcy50aHJvdHRsZSkge1xuICAgICAgICAgICAgdGhpcy5lZmZlY3RpdmVUaHJvdHRsZSA9IE1hdGgubWluKHRoaXMudGhyb3R0bGUsIHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgKyBUSFJPVFRMRV9VUF9SQVRFICogZGVsdGEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBtYXBDb250cm9scyhlbGV2YXRvcjogbnVtYmVyLCBhaWxlcm9uOiBudW1iZXIsIHJ1ZGRlcjogbnVtYmVyKTogU3VyZmFjZUNvbnRyb2xzIHtcbiAgICAgICAgLy8gRWxldmF0b3I6ICtjbWQgPSBub3NlIHVwIOKGkiBuZWdhdGl2ZSBzdGFiaWxhdG9yIGluY2lkZW5jZSAodGFpbCBsaWZ0IGRvd24pLlxuICAgICAgICBjb25zdCBlbGV2YXRvckFvYSA9IC1lbGV2YXRvciAqIE1BWF9TVEFCSUxBVE9SX0FPQTtcbiAgICAgICAgLy8gRGlmZmVyZW50aWFsIHRhaWwgKHRhaWxlcm9uKSBhc3Npc3RzIHJvbGwuXG4gICAgICAgIGNvbnN0IHRhaWxlcm9uQW9hID0gYWlsZXJvbiAqIEZNMl9GQ1MudGFpbGVyb25Sb2xsRnJhY3Rpb24gKiBNQVhfU1RBQklMQVRPUl9BT0E7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB3aW5nTGVmdEFvYTogYWlsZXJvbiAqIE1BWF9BSUxFUk9OX0FPQSxcbiAgICAgICAgICAgIHdpbmdSaWdodEFvYTogLWFpbGVyb24gKiBNQVhfQUlMRVJPTl9BT0EsXG4gICAgICAgICAgICBodGFpbExlZnRBb2E6IGVsZXZhdG9yQW9hICsgdGFpbGVyb25Bb2EsXG4gICAgICAgICAgICBodGFpbFJpZ2h0QW9hOiBlbGV2YXRvckFvYSAtIHRhaWxlcm9uQW9hLFxuICAgICAgICAgICAgdnRhaWxBb2E6IC1ydWRkZXIgKiBNQVhfUlVEREVSX0FPQSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFjY3VtdWxhdGVTdXJmYWNlKFxuICAgICAgICBzdXJmYWNlOiBBZXJvU3VyZmFjZSwgY29udHJvbEFvYTogbnVtYmVyLCBjYW1iZXI6IG51bWJlcixcbiAgICAgICAgc3RhbGxTaGlmdDogbnVtYmVyLCBleHRyYUNkOiBudW1iZXIsIGFpckRlbnNpdHk6IG51bWJlcixcbiAgICApOiB2b2lkIHtcbiAgICAgICAgc3VyZmFjZS5hY2N1bXVsYXRlKHtcbiAgICAgICAgICAgIHZlbG9jaXR5Qm9keTogdGhpcy52ZWxCb2R5LFxuICAgICAgICAgICAgYW5ndWxhclZlbG9jaXR5Qm9keTogdGhpcy5yYi5hbmd1bGFyVmVsb2NpdHlCb2R5LFxuICAgICAgICAgICAgYWlyRGVuc2l0eSxcbiAgICAgICAgICAgIGNvbnRyb2xEZWx0YUFvYVJhZDogY29udHJvbEFvYSxcbiAgICAgICAgICAgIGNhbWJlckJpYXNSYWQ6IGNhbWJlcixcbiAgICAgICAgICAgIHN0YWxsU2hpZnRSYWQ6IHN0YWxsU2hpZnQsXG4gICAgICAgICAgICBleHRyYUNkLFxuICAgICAgICB9LCB0aGlzLmZvcmNlQm9keSwgdGhpcy5tb21lbnRCb2R5KTtcbiAgICB9XG5cbiAgICAvKiogUGFyYXNpdGUgKGZ1c2VsYWdlICsgZ2VhcikgYW5kIHRyYW5zb25pYyB3YXZlIGRyYWcgYWxvbmcgdGhlIHJlbGF0aXZlIHdpbmQuICovXG4gICAgcHJpdmF0ZSBhZGRCb2R5RHJhZyhkeW5hbWljUHJlc3N1cmU6IG51bWJlciwgc3BlZWQ6IG51bWJlciwgbWFjaDogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIGlmIChzcGVlZCA8IDFlLTMpIHJldHVybjtcbiAgICAgICAgbGV0IGNkMCA9IEZNMl9CT0RZX0NEMCArICh0aGlzLmxhbmRpbmdHZWFyRGVwbG95ZWQgPyBGTTJfR0VBUl9DRCA6IDApO1xuICAgICAgICBpZiAobWFjaCA+IEZNMl9XQVZFX0RSQUcubWFjaE9uc2V0KSB7XG4gICAgICAgICAgICBjb25zdCBleGNlc3MgPSAobWFjaCAtIEZNMl9XQVZFX0RSQUcubWFjaE9uc2V0KSAvIEZNMl9XQVZFX0RSQUcubWFjaE9uc2V0O1xuICAgICAgICAgICAgY2QwICs9IEZNMl9XQVZFX0RSQUcuc2NhbGUgKiBleGNlc3MgKiBleGNlc3M7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZHJhZ04gPSBkeW5hbWljUHJlc3N1cmUgKiBGTTJfR0VPTUVUUlkud2luZ0FyZWFNMiAqIGNkMDtcbiAgICAgICAgLy8gT3Bwb3NlcyBib2R5IHZlbG9jaXR5IChhY3RzIHRocm91Z2ggQ0csIG5vIG1vbWVudCkuXG4gICAgICAgIHRoaXMuX3YuY29weSh0aGlzLnZlbEJvZHkpLm11bHRpcGx5U2NhbGFyKC1kcmFnTiAvIHNwZWVkKTtcbiAgICAgICAgdGhpcy5mb3JjZUJvZHkuYWRkKHRoaXMuX3YpO1xuICAgIH1cblxuICAgIC8qKiBTcHJpbmctZGFtcGVyIGxhbmRpbmcgZ2Vhci4gQWNjdW11bGF0ZXMgd29ybGQgZm9yY2UgYW5kIGJvZHkgbW9tZW50LiAqL1xuICAgIHByaXZhdGUgY29tcHV0ZUdlYXJGb3JjZXMoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuZ2VhckZvcmNlV29ybGQuc2V0KDAsIDAsIDApO1xuICAgICAgICB0aGlzLmdlYXJNb21lbnRCb2R5LnNldCgwLCAwLCAwKTtcblxuICAgICAgICB0aGlzLl9vbWVnYVdvcmxkLmNvcHkodGhpcy5yYi5hbmd1bGFyVmVsb2NpdHlCb2R5KS5hcHBseVF1YXRlcm5pb24odGhpcy5yYi5vcmllbnRhdGlvbik7XG5cbiAgICAgICAgZm9yIChjb25zdCBncCBvZiBHRUFSX1BPSU5UUykge1xuICAgICAgICAgICAgdGhpcy5fdi5zZXQoZ3BbMF0sIGdwWzFdLCBncFsyXSkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMucmIub3JpZW50YXRpb24pO1xuICAgICAgICAgICAgdGhpcy5fZ2VhcldvcmxkLmNvcHkodGhpcy5fdikuYWRkKHRoaXMub2JqLnBvc2l0aW9uKTtcbiAgICAgICAgICAgIGNvbnN0IHBlbmV0cmF0aW9uID0gLXRoaXMuX2dlYXJXb3JsZC55OyAvLyBncm91bmQgcGxhbmUgYXQgd29ybGQgeSA9IDBcbiAgICAgICAgICAgIGlmIChwZW5ldHJhdGlvbiA8PSAwKSBjb250aW51ZTtcblxuICAgICAgICAgICAgLy8gVmVsb2NpdHkgb2YgdGhlIGNvbnRhY3QgcG9pbnQgdGhyb3VnaCB0aGUgd29ybGQuXG4gICAgICAgICAgICB0aGlzLl9jb250YWN0VmVsLmNyb3NzVmVjdG9ycyh0aGlzLl9vbWVnYVdvcmxkLCB0aGlzLl92KS5hZGQodGhpcy5yYi52ZWxvY2l0eVdvcmxkKTtcblxuICAgICAgICAgICAgLy8gTm9ybWFsICh2ZXJ0aWNhbCkgc3ByaW5nLWRhbXBlciByZWFjdGlvbi5cbiAgICAgICAgICAgIGxldCBub3JtYWwgPSBHRUFSX1NUSUZGTkVTUyAqIHBlbmV0cmF0aW9uIC0gR0VBUl9EQU1QSU5HICogdGhpcy5fY29udGFjdFZlbC55O1xuICAgICAgICAgICAgaWYgKG5vcm1hbCA8IDApIG5vcm1hbCA9IDA7XG5cbiAgICAgICAgICAgIC8vIEhvcml6b250YWwgZnJpY3Rpb24gb3Bwb3NpbmcgdGhlIGNvbnRhY3QgZ3JvdW5kIHZlbG9jaXR5LlxuICAgICAgICAgICAgY29uc3Qgdmh4ID0gdGhpcy5fY29udGFjdFZlbC54O1xuICAgICAgICAgICAgY29uc3Qgdmh6ID0gdGhpcy5fY29udGFjdFZlbC56O1xuICAgICAgICAgICAgY29uc3QgdmggPSBNYXRoLmh5cG90KHZoeCwgdmh6KTtcbiAgICAgICAgICAgIHRoaXMuX2ZyaWN0aW9uLnNldCgwLCBub3JtYWwsIDApO1xuICAgICAgICAgICAgaWYgKHZoID4gMWUtMykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJvbGxpbmcgPSB0aGlzLndoZWVsQnJha2VzQXBwbGllZCA/IEdFQVJfQlJBS0VfRlJJQ1RJT04gOiBHRUFSX1JPTExfRlJJQ1RJT047XG4gICAgICAgICAgICAgICAgY29uc3QgbXUgPSBNYXRoLm1heChyb2xsaW5nLCBHRUFSX1NJREVfRlJJQ1RJT04gKiB0aGlzLnNpZGVTbGlwRnJhY3Rpb24odmh4LCB2aHopKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmTWFnID0gbXUgKiBub3JtYWw7XG4gICAgICAgICAgICAgICAgdGhpcy5fZnJpY3Rpb24ueCA9IC1mTWFnICogdmh4IC8gdmg7XG4gICAgICAgICAgICAgICAgdGhpcy5fZnJpY3Rpb24ueiA9IC1mTWFnICogdmh6IC8gdmg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuZ2VhckZvcmNlV29ybGQuYWRkKHRoaXMuX2ZyaWN0aW9uKTtcblxuICAgICAgICAgICAgLy8gTW9tZW50IGFib3V0IENHOiByX3dvcmxkIMOXIEZfd29ybGQsIGV4cHJlc3NlZCBpbiB0aGUgYm9keSBmcmFtZS5cbiAgICAgICAgICAgIHRoaXMuX3YyLmNyb3NzVmVjdG9ycyh0aGlzLl92LCB0aGlzLl9mcmljdGlvbikuYXBwbHlRdWF0ZXJuaW9uKHRoaXMuaW52T3JpZW50KTtcbiAgICAgICAgICAgIHRoaXMuZ2Vhck1vbWVudEJvZHkuYWRkKHRoaXMuX3YyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBIaWdoZXIgZWZmZWN0aXZlIGZyaWN0aW9uIGZvciBzaWRld2F5cyAobm9uLXJvbGxpbmcpIGNvbnRhY3QgbW90aW9uLiAqL1xuICAgIHByaXZhdGUgc2lkZVNsaXBGcmFjdGlvbih2aHg6IG51bWJlciwgdmh6OiBudW1iZXIpOiBudW1iZXIge1xuICAgICAgICB0aGlzLl9md2QuY29weShGT1JXQVJEKS5hcHBseVF1YXRlcm5pb24odGhpcy5yYi5vcmllbnRhdGlvbik7XG4gICAgICAgIGNvbnN0IGZ3eCA9IHRoaXMuX2Z3ZC54LCBmd3ogPSB0aGlzLl9md2QuejtcbiAgICAgICAgY29uc3QgZndMZW4gPSBNYXRoLmh5cG90KGZ3eCwgZnd6KSB8fCAxO1xuICAgICAgICBjb25zdCB2aCA9IE1hdGguaHlwb3Qodmh4LCB2aHopIHx8IDE7XG4gICAgICAgIGNvbnN0IGFsb25nID0gTWF0aC5hYnMoKHZoeCAqIGZ3eCArIHZoeiAqIGZ3eikgLyAoZndMZW4gKiB2aCkpO1xuICAgICAgICByZXR1cm4gY2xhbXAoMSAtIGFsb25nLCAwLCAxKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHVwZGF0ZVN0YWxsU3RhdGUoc3BlZWQ6IG51bWJlciwgYW9hOiBudW1iZXIsIGFsdGl0dWRlOiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMubGFuZGVkKSB7IHRoaXMuc3RhbGwgPSAtMTsgcmV0dXJuOyB9XG4gICAgICAgIGNvbnN0IGFvYVN0YWxsID0gc3BlZWQgPiA1ID8gY2xhbXAoKE1hdGguYWJzKGFvYSkgLSBTVEFMTF9BT0EgKiAwLjg1KSAvIChTVEFMTF9BT0EgKiAwLjMpLCAwLCAxKSA6IDA7XG4gICAgICAgIGNvbnN0IHNwZWVkU3RhbGwgPSBhbHRpdHVkZSA+IFBMQU5FX0RJU1RBTkNFX1RPX0dST1VORCArIDVcbiAgICAgICAgICAgID8gY2xhbXAoKE1JTl9GTFlJTkdfU1BFRUQgLSBzcGVlZCkgLyBNSU5fRkxZSU5HX1NQRUVELCAwLCAxKSA6IDA7XG4gICAgICAgIGNvbnN0IGxldmVsID0gTWF0aC5tYXgoYW9hU3RhbGwsIHNwZWVkU3RhbGwpO1xuICAgICAgICB0aGlzLnN0YWxsID0gbGV2ZWwgPiAwID8gbGV2ZWwgOiAtMTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGhhbmRsZUdyb3VuZFN0YXRlKCk6IHZvaWQge1xuICAgICAgICBjb25zdCBvbkdyb3VuZCA9IHRoaXMub2JqLnBvc2l0aW9uLnkgPD0gUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5EICsgMC4yNTtcblxuICAgICAgICBpZiAodGhpcy5vYmoucG9zaXRpb24ueSA+IFBMQU5FX0RJU1RBTkNFX1RPX0dST1VORCArIDAuMykge1xuICAgICAgICAgICAgdGhpcy5sYW5kZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhcmQgZmxvb3Igc28gdGhlIGdlYXIgc3ByaW5nIGNhbiBuZXZlciBsZXQgdGhlIGJvZHkgdHVubmVsIHRocm91Z2guXG4gICAgICAgIGNvbnN0IG1pblkgPSBQTEFORV9ESVNUQU5DRV9UT19HUk9VTkQgLSAwLjY7XG4gICAgICAgIGlmICh0aGlzLm9iai5wb3NpdGlvbi55IDwgbWluWSkge1xuICAgICAgICAgICAgdGhpcy5vYmoucG9zaXRpb24ueSA9IG1pblk7XG4gICAgICAgICAgICBpZiAodGhpcy52ZWxvY2l0eS55IDwgMCkgdGhpcy52ZWxvY2l0eS55ID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghb25Hcm91bmQpIHJldHVybjtcblxuICAgICAgICB0aGlzLl9md2QuY29weShGT1JXQVJEKS5hcHBseVF1YXRlcm5pb24odGhpcy5yYi5vcmllbnRhdGlvbik7XG4gICAgICAgIHRoaXMuX3JpZ2h0LmNvcHkoUklHSFQpLmFwcGx5UXVhdGVybmlvbih0aGlzLnJiLm9yaWVudGF0aW9uKTtcbiAgICAgICAgY29uc3Qgc3BlZWQgPSB0aGlzLnZlbG9jaXR5Lmxlbmd0aCgpO1xuICAgICAgICBjb25zdCBwaXRjaEFuZ2xlID0gTWF0aC5hc2luKGNsYW1wKHRoaXMuX2Z3ZC55LCAtMSwgMSkpO1xuICAgICAgICBjb25zdCByb2xsQW5nbGUgPSBNYXRoLmFzaW4oY2xhbXAodGhpcy5fcmlnaHQueSwgLTEsIDEpKTtcblxuICAgICAgICBjb25zdCBoYXJkQ29udGFjdCA9IHRoaXMudmVsb2NpdHkueSA8IC1MQU5ESU5HX01BWF9WU1BFRUQ7XG4gICAgICAgIGNvbnN0IGJhZEF0dGl0dWRlID0gTWF0aC5hYnMocm9sbEFuZ2xlKSA+IExBTkRJTkdfTUFYX1JPTEwgfHwgcGl0Y2hBbmdsZSA8IExBTkRJTkdfTUlOX1BJVENIO1xuXG4gICAgICAgIGlmICghdGhpcy5sYW5kZWQgJiYgKGhhcmRDb250YWN0IHx8IHNwZWVkID4gTEFORElOR19NQVhfU1BFRUQpKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMubGFuZGluZ0dlYXJEZXBsb3llZCB8fCBoYXJkQ29udGFjdCB8fCBiYWRBdHRpdHVkZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY3Jhc2hlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5sYW5kaW5nR2VhckRlcGxveWVkICYmIHRoaXMudmVsb2NpdHkueSA8IC0xLjApIHtcbiAgICAgICAgICAgIHRoaXMuY3Jhc2hlZCA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNwZWVkIDwgTEFORElOR19NQVhfU1BFRUQgJiYgTWF0aC5hYnMocm9sbEFuZ2xlKSA8IExBTkRJTkdfTUFYX1JPTEwpIHtcbiAgICAgICAgICAgIHRoaXMubGFuZGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgd3JhcFBvc2l0aW9uKCk6IHZvaWQge1xuICAgICAgICBjb25zdCBoID0gMi41ICogVEVSUkFJTl9TQ0FMRSAqIFRFUlJBSU5fTU9ERUxfU0laRTtcbiAgICAgICAgaWYgKHRoaXMub2JqLnBvc2l0aW9uLnggPiBoKSB0aGlzLm9iai5wb3NpdGlvbi54ID0gLWg7XG4gICAgICAgIGlmICh0aGlzLm9iai5wb3NpdGlvbi54IDwgLWgpIHRoaXMub2JqLnBvc2l0aW9uLnggPSBoO1xuICAgICAgICBpZiAodGhpcy5vYmoucG9zaXRpb24ueiA+IGgpIHRoaXMub2JqLnBvc2l0aW9uLnogPSAtaDtcbiAgICAgICAgaWYgKHRoaXMub2JqLnBvc2l0aW9uLnogPCAtaCkgdGhpcy5vYmoucG9zaXRpb24ueiA9IGg7XG4gICAgfVxuXG4gICAgZ2V0U3RhbGxTdGF0dXMoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuc3RhbGw7IH1cblxuICAgIC8vIC0tLSBGLTE2IHRocm90dGxlIHF1YWRyYW50IGJlaGF2aW91ciAoc2hhcmVkIHdpdGggdGhlIFJlYWxpc3RpYyBtb2RlbCkuIC0tLVxuICAgIGdldFRocm90dGxlSHVkVGV4dCgpOiBzdHJpbmcgeyByZXR1cm4gZm9ybWF0RjE2VGhyb3R0bGVIdWQodGhpcy50aHJvdHRsZSk7IH1cbiAgICB1c2VGMTZUaHJvdHRsZURldGVudHMoKTogYm9vbGVhbiB7IHJldHVybiB0cnVlOyB9XG4gICAgc3RlcFRocm90dGxlRGV0ZW50KGN1cnJlbnQ6IG51bWJlciwgZGlyZWN0aW9uOiAxIHwgLTEpOiBudW1iZXIgeyByZXR1cm4gc3RlcEYxNlRocm90dGxlRGV0ZW50KGN1cnJlbnQsIGRpcmVjdGlvbik7IH1cbiAgICBpc0luVGhyb3R0bGVBYkRldGVudEJhbmQobGV2ZXI6IG51bWJlcik6IGJvb2xlYW4geyByZXR1cm4gaXNGMTZBYkRldGVudEJhbmQobGV2ZXIpOyB9XG4gICAgYWRqdXN0VGhyb3R0bGVJbnB1dChjdXJyZW50OiBudW1iZXIsIHN0ZXA6IG51bWJlcik6IG51bWJlciB7IHJldHVybiBhZGp1c3RGMTZUaHJvdHRsZUlucHV0KGN1cnJlbnQsIHN0ZXApOyB9XG4gICAgZ2V0VGhyb3R0bGVab25lKCk6IHN0cmluZyB7IHJldHVybiBnZXRGMTZUaHJvdHRsZVpvbmUodGhpcy5lZmZlY3RpdmVUaHJvdHRsZSk7IH1cbiAgICBnZXRUaHJvdHRsZUF1ZGlvTGV2ZWwoKTogbnVtYmVyIHsgcmV0dXJuIGYxNlRocm90dGxlQXVkaW9MZXZlbCh0aGlzLmVmZmVjdGl2ZVRocm90dGxlKTsgfVxuICAgIGdldEVuZ2luZU5venpsZUNvbG9yKCk6IHN0cmluZyB7IHJldHVybiBnZXRGMTZFbmdpbmVOb3p6bGVDb2xvcih0aGlzLmVmZmVjdGl2ZVRocm90dGxlKTsgfVxufVxuIiwiaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuaW1wb3J0IHsgUElUQ0hfUkFURSwgUk9MTF9SQVRFLCBQTEFORV9ESVNUQU5DRV9UT19HUk9VTkQsIFRFUlJBSU5fTU9ERUxfU0laRSwgVEVSUkFJTl9TQ0FMRSwgWUFXX1JBVEUgfSBmcm9tICcuLi8uLi9kZWZzJztcbmltcG9ydCB7IEZPUldBUkQsIFBJX09WRVJfMTgwLCBSSUdIVCwgVVAsIGNsYW1wLCBpc1plcm8sIHJvdW5kVG9aZXJvIH0gZnJvbSAnLi4vLi4vdXRpbHMvbWF0aCc7XG5pbXBvcnQgeyBjb21wdXRlQW5nbGVPZkF0dGFjaywgY29tcHV0ZUFpckRlbnNpdHksIGNvbXB1dGVEeW5hbWljUHJlc3N1cmUsIGNvbXB1dGVJc2FBaXJEZW5zaXR5LCBjb21wdXRlTG9hZEZhY3RvckcgfSBmcm9tICcuLi9hZXJvVXRpbHMnO1xuaW1wb3J0IHsgY29tcHV0ZUYxNkVuZ2luZVRocnVzdE4sIGZvcm1hdEYxNlRocm90dGxlSHVkLCBmMTZUaHJvdHRsZUF1ZGlvTGV2ZWwsIGdldEYxNkVuZ2luZU5venpsZUNvbG9yLCBnZXRGMTZUaHJvdHRsZVpvbmUsIGFkanVzdEYxNlRocm90dGxlSW5wdXQsIHN0ZXBGMTZUaHJvdHRsZURldGVudCwgaXNGMTZBYkRldGVudEJhbmQgfSBmcm9tICcuLi9mMTZFbmdpbmUnO1xuaW1wb3J0IHsgRjE2X1BST0ZJTEUgfSBmcm9tICcuLi9mMTZQcm9maWxlJztcbmltcG9ydCB7IEZsaWdodE1vZGVsIH0gZnJvbSAnLi9mbGlnaHRNb2RlbCc7XG5cbmNvbnN0IFRIUk9UVExFX1VQX1JBVEUgICA9IDAuMTA7XG5jb25zdCBUSFJPVFRMRV9ET1dOX1JBVEUgPSAwLjA3O1xuY29uc3QgWUFXX1JBVEVfTEFOREVEICAgID0gWUFXX1JBVEUgKiAyLjA7XG5cbmNvbnN0IERSWV9NQVNTICAgPSBGMTZfUFJPRklMRS5zaW1NYXNzS2c7XG5jb25zdCBXSU5HX0FSRUEgID0gRjE2X1BST0ZJTEUud2luZ0FyZWFNMjtcbmNvbnN0IENEMCAgICAgICAgPSBGMTZfUFJPRklMRS5jZDA7XG5jb25zdCBJTkRVQ0VEX0RSQUdfSyA9IEYxNl9QUk9GSUxFLmluZHVjZWREcmFnSztcbmNvbnN0IENMMCAgICAgICAgPSBGMTZfUFJPRklMRS5jbDA7XG5jb25zdCBDTF9BTFBIQSAgID0gRjE2X1BST0ZJTEUuY2xBbHBoYVBlclJhZDtcbmNvbnN0IFNUQUxMX0FPQSAgPSBGMTZfUFJPRklMRS5zdGFsbEFvYURlZyAqIE1hdGguUEkgLyAxODA7XG5jb25zdCBNQVhfQ0wgICAgID0gMS40ODtcbmNvbnN0IFFfUkVGICAgICAgPSAwLjUgKiBjb21wdXRlSXNhQWlyRGVuc2l0eShGMTZfUFJPRklMRS5jcnVpc2VBbHRpdHVkZU0pICogRjE2X1BST0ZJTEUuY3J1aXNlU3BlZWRNcHMgKiogMjtcbmNvbnN0IE1JTl9DT05UUk9MX1EgICAgPSAwLjEyO1xuY29uc3QgTUFYX0NPTlRST0xfUSAgICA9IDIuMjtcbmNvbnN0IE1JTl9GTFlJTkdfU1BFRUQgPSBGMTZfUFJPRklMRS5taW5GbHlpbmdTcGVlZE1wcztcbmNvbnN0IENEX0xBTkRJTkdfR0VBUiAgPSAwLjAzNTtcbmNvbnN0IENEX0ZMQVBTICAgICAgICAgPSAwLjA4O1xuY29uc3QgQ0xfRkxBUFNfRkFDVE9SICA9IDEuMjU7XG5cbmNvbnN0IEdST1VORF9GUklDVElPTl9LSU5FVElDID0gMC4xNTtcbmNvbnN0IEdST1VORF9GUklDVElPTl9TVEFUSUMgID0gMC4yO1xuY29uc3QgR1JPVU5EX0JSQUtFX0tJTkVUSUMgICAgPSAxLjg7XG5jb25zdCBHUk9VTkRfQlJBS0VfU1RBVElDICAgICA9IDEuMTc7XG5jb25zdCBMQU5ERURfTUFYX1NQRUVEICAgPSBGMTZfUFJPRklMRS5sYW5kaW5nTWF4U3BlZWRNcHM7XG5jb25zdCBMQU5ESU5HX01BWF9WU1BFRUQgPSBGMTZfUFJPRklMRS5sYW5kaW5nTWF4VmVydGljYWxTcGVlZE1wcztcbmNvbnN0IExBTkRJTkdfTUlOX1BJVENIICA9IEYxNl9QUk9GSUxFLmxhbmRpbmdNaW5QaXRjaERlZyAqIFBJX09WRVJfMTgwO1xuY29uc3QgTEFORElOR19NQVhfUk9MTCAgID0gRjE2X1BST0ZJTEUubGFuZGluZ01heFJvbGxEZWcgICogUElfT1ZFUl8xODA7XG5jb25zdCBST1RBVElPTl9TUEVFRCAgICAgPSBGMTZfUFJPRklMRS5yb3RhdGlvblNwZWVkTXBzO1xuXG5mdW5jdGlvbiBjb21wdXRlQ2woYW9hOiBudW1iZXIsIGZsYXBzRXh0ZW5kZWQ6IGJvb2xlYW4pOiBudW1iZXIge1xuICAgIGNvbnN0IGZsYXBCb29zdCA9IGZsYXBzRXh0ZW5kZWQgPyBDTF9GTEFQU19GQUNUT1IgOiAxLjA7XG4gICAgY29uc3Qgc3RhbGxBb2EgID0gZmxhcHNFeHRlbmRlZCA/IFNUQUxMX0FPQSAqIDEuMSA6IFNUQUxMX0FPQTtcbiAgICBjb25zdCBtYXhDbCAgICAgPSBNQVhfQ0wgKiBmbGFwQm9vc3Q7XG4gICAgaWYgKE1hdGguYWJzKGFvYSkgPD0gc3RhbGxBb2EpIHtcbiAgICAgICAgcmV0dXJuIGNsYW1wKENMMCArIENMX0FMUEhBICogYW9hICogZmxhcEJvb3N0LCAtbWF4Q2wgKiAwLjM1LCBtYXhDbCk7XG4gICAgfVxuICAgIGNvbnN0IHBlYWtDbCA9IChDTDAgKyBDTF9BTFBIQSAqIHN0YWxsQW9hICogTWF0aC5zaWduKGFvYSkpICogZmxhcEJvb3N0O1xuICAgIHJldHVybiBwZWFrQ2wgKiBNYXRoLm1heCgwLCBNYXRoLmNvcygoTWF0aC5hYnMoYW9hKSAtIHN0YWxsQW9hKSAqIDQuMCkpO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlUGl0Y2hTcGVlZEF1dGhvcml0eShzcGVlZDogbnVtYmVyLCBsYW5kZWQ6IGJvb2xlYW4pOiBudW1iZXIge1xuICAgIGxldCBhID0gY2xhbXAoc3BlZWQgLyBNSU5fRkxZSU5HX1NQRUVELCAwLCAxKTtcbiAgICBpZiAobGFuZGVkICYmIHNwZWVkIDwgUk9UQVRJT05fU1BFRUQpIGEgKj0gY2xhbXAoc3BlZWQgLyBST1RBVElPTl9TUEVFRCwgMCwgMSk7XG4gICAgcmV0dXJuIGE7XG59XG5cbmV4cG9ydCBjbGFzcyBSZWFsaXN0aWNGbGlnaHRNb2RlbCBleHRlbmRzIEZsaWdodE1vZGVsIHtcblxuICAgIHByaXZhdGUgc3RhbGwgPSAtMTtcblxuICAgIHByaXZhdGUgZm9yd2FyZCA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSB1cCAgICAgID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJpZ2h0ICAgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgdmVsb2NpdHlVbml0ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHRocnVzdCAgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgZHJhZyAgICA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSBsaWZ0ICAgID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIGZyaWN0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIGZvcmNlcyAgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgX3YgID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIF92MiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5vYmoudXAuY29weShVUCk7XG4gICAgfVxuXG4gICAgcmVzZXQoKSB7XG4gICAgICAgIHN1cGVyLnJlc2V0KCk7XG4gICAgICAgIHRoaXMuc3RhbGwgPSAtMTtcbiAgICB9XG5cbiAgICBzdGVwKGRlbHRhOiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuY3Jhc2hlZCkgcmV0dXJuO1xuXG4gICAgICAgIHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgPSB0aGlzLnRocm90dGxlID4gdGhpcy5lZmZlY3RpdmVUaHJvdHRsZVxuICAgICAgICAgICAgPyBNYXRoLm1pbih0aGlzLnRocm90dGxlLCB0aGlzLmVmZmVjdGl2ZVRocm90dGxlICsgVEhST1RUTEVfVVBfUkFURSAqIGRlbHRhKVxuICAgICAgICAgICAgOiBNYXRoLm1heCh0aGlzLnRocm90dGxlLCB0aGlzLmVmZmVjdGl2ZVRocm90dGxlIC0gVEhST1RUTEVfRE9XTl9SQVRFICogZGVsdGEpO1xuXG4gICAgICAgIGNvbnN0IGFsdGl0dWRlID0gdGhpcy5vYmoucG9zaXRpb24ueTtcbiAgICAgICAgY29uc3Qgc3BlZWQgICAgPSB0aGlzLnZlbG9jaXR5Lmxlbmd0aCgpO1xuICAgICAgICBjb25zdCBkeW5hbWljUHJlc3N1cmUgPSBjb21wdXRlRHluYW1pY1ByZXNzdXJlKGNvbXB1dGVBaXJEZW5zaXR5KGFsdGl0dWRlKSwgc3BlZWQpO1xuICAgICAgICBjb25zdCBjb250cm9sU2NhbGUgPSBjbGFtcChkeW5hbWljUHJlc3N1cmUgLyBRX1JFRiwgTUlOX0NPTlRST0xfUSwgTUFYX0NPTlRST0xfUSk7XG5cbiAgICAgICAgdGhpcy5mb3J3YXJkLmNvcHkoRk9SV0FSRCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMub2JqLnF1YXRlcm5pb24pO1xuICAgICAgICB0aGlzLnVwLmNvcHkoVVApLmFwcGx5UXVhdGVybmlvbih0aGlzLm9iai5xdWF0ZXJuaW9uKTtcbiAgICAgICAgdGhpcy5yaWdodC5jb3B5KFJJR0hUKS5hcHBseVF1YXRlcm5pb24odGhpcy5vYmoucXVhdGVybmlvbik7XG5cbiAgICAgICAgY29uc3QgYW9hID0gc3BlZWQgPiAxLjBcbiAgICAgICAgICAgID8gY29tcHV0ZUFuZ2xlT2ZBdHRhY2sodGhpcy5mb3J3YXJkLCB0aGlzLnJpZ2h0LCB0aGlzLnZlbG9jaXR5LCB0aGlzLl92KVxuICAgICAgICAgICAgOiAwO1xuICAgICAgICB0aGlzLmFuZ2xlT2ZBdHRhY2tSYWQgPSBhb2E7XG5cbiAgICAgICAgdGhpcy51cGRhdGVTdGFsbFN0YXRlKHNwZWVkLCBhb2EsIGFsdGl0dWRlKTtcblxuICAgICAgICAvLyBSb2xsXG4gICAgICAgIGlmICghdGhpcy5sYW5kZWQpIHRoaXMub2JqLnJvdGF0ZVoodGhpcy5yb2xsICogUk9MTF9SQVRFICogZGVsdGEpO1xuXG4gICAgICAgIC8vIFBpdGNoIChibG9ja2VkIHdoZW4gc3RhbGxpbmcgYW5kIHRyeWluZyB0byBwdWxsIHVwKVxuICAgICAgICBjb25zdCBwaXRjaEF1dGhvcml0eSA9IHRoaXMuc3RhbGwgPj0gMCA/IDAuMzUgOiAxLjA7XG4gICAgICAgIGlmICghKHRoaXMubGFuZGVkICYmIHRoaXMucGl0Y2ggPCAwKVxuICAgICAgICAgICAgJiYgKHRoaXMuc3RhbGwgPCAwIHx8ICh0aGlzLnBpdGNoIDwgMCAmJiB0aGlzLnVwLnkgPiAwKSB8fCAodGhpcy5waXRjaCA+IDAgJiYgdGhpcy51cC55IDwgMCkpXG4gICAgICAgICkge1xuICAgICAgICAgICAgdGhpcy5vYmoucm90YXRlWCgtdGhpcy5waXRjaCAqIFBJVENIX1JBVEUgKiBjb250cm9sU2NhbGUgKiBwaXRjaEF1dGhvcml0eVxuICAgICAgICAgICAgICAgICogY29tcHV0ZVBpdGNoU3BlZWRBdXRob3JpdHkoc3BlZWQsIHRoaXMubGFuZGVkKSAqIGRlbHRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdyYXZpdHkgbm9zZS1kb3duOiBzdGFsbGluZyBpbiBhaXIgT1Igb24gZ3JvdW5kIHdpdGggbm9zZSBhYm92ZSBob3Jpem9udGFsXG4gICAgICAgIGlmICh0aGlzLmZvcndhcmQueSA+IDAuMDAxICYmIHRoaXMucGl0Y2ggPD0gMCAmJiAodGhpcy5zdGFsbCA+IDAgfHwgdGhpcy5sYW5kZWQpKSB7XG4gICAgICAgICAgICB0aGlzLl92Mi5jcm9zc1ZlY3RvcnModGhpcy5mb3J3YXJkLCB0aGlzLl92LnNldCgwLCAtMSwgMCkpLm5vcm1hbGl6ZSgpO1xuICAgICAgICAgICAgY29uc3QgcGl0Y2hBbmdsZSA9IE1hdGguYXNpbihjbGFtcCh0aGlzLmZvcndhcmQueSwgLTEsIDEpKTtcbiAgICAgICAgICAgIHRoaXMub2JqLnJvdGF0ZU9uV29ybGRBeGlzKHRoaXMuX3YyLCBNYXRoLm1pbihwaXRjaEFuZ2xlLCAodGhpcy5sYW5kZWQgPyAwLjUgOiB0aGlzLnN0YWxsICogMC42KSAqIGRlbHRhKSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBZYXdcbiAgICAgICAgaWYgKCFpc1plcm8oc3BlZWQpKSB7XG4gICAgICAgICAgICB0aGlzLm9iai5yb3RhdGVZKC10aGlzLnlhdyAqICh0aGlzLmxhbmRlZCA/IFlBV19SQVRFX0xBTkRFRCA6IFlBV19SQVRFKSAqIGRlbHRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlZnJlc2ggYXhlcyBhZnRlciBhbGwgYXR0aXR1ZGUgcm90YXRpb25zXG4gICAgICAgIHRoaXMuZm9yd2FyZC5jb3B5KEZPUldBUkQpLmFwcGx5UXVhdGVybmlvbih0aGlzLm9iai5xdWF0ZXJuaW9uKTtcbiAgICAgICAgdGhpcy51cC5jb3B5KFVQKS5hcHBseVF1YXRlcm5pb24odGhpcy5vYmoucXVhdGVybmlvbik7XG4gICAgICAgIHRoaXMucmlnaHQuY29weShSSUdIVCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMub2JqLnF1YXRlcm5pb24pO1xuXG4gICAgICAgIC8vIEFlcm9keW5hbWljIGZvcmNlc1xuICAgICAgICBjb25zdCBjbCA9IGNvbXB1dGVDbChhb2EsIHRoaXMuZmxhcHNFeHRlbmRlZCk7XG4gICAgICAgIGNvbnN0IGNkID0gQ0QwICsgSU5EVUNFRF9EUkFHX0sgKiBjbCAqIGNsXG4gICAgICAgICAgICArICh0aGlzLmxhbmRpbmdHZWFyRGVwbG95ZWQgPyBDRF9MQU5ESU5HX0dFQVIgOiAwKVxuICAgICAgICAgICAgKyAodGhpcy5mbGFwc0V4dGVuZGVkID8gQ0RfRkxBUFMgOiAwKTtcblxuICAgICAgICBjb25zdCB0aHJ1c3ROID0gY29tcHV0ZUYxNkVuZ2luZVRocnVzdE4odGhpcy5lZmZlY3RpdmVUaHJvdHRsZSwgYWx0aXR1ZGUpO1xuICAgICAgICByb3VuZFRvWmVybyh0aGlzLnRocnVzdC5jb3B5KHRoaXMuZm9yd2FyZCkubXVsdGlwbHlTY2FsYXIodGhydXN0TikpO1xuICAgICAgICB0aGlzLmVuZ2luZVRocnVzdE4gPSB0aHJ1c3ROO1xuXG4gICAgICAgIGlmIChzcGVlZCA+IDAuNSkge1xuICAgICAgICAgICAgdGhpcy52ZWxvY2l0eVVuaXQuY29weSh0aGlzLnZlbG9jaXR5KS5tdWx0aXBseVNjYWxhcigxIC8gc3BlZWQpO1xuICAgICAgICAgICAgcm91bmRUb1plcm8odGhpcy5kcmFnLmNvcHkodGhpcy52ZWxvY2l0eVVuaXQpLm5lZ2F0ZSgpLm11bHRpcGx5U2NhbGFyKGR5bmFtaWNQcmVzc3VyZSAqIFdJTkdfQVJFQSAqIGNkKSk7XG4gICAgICAgICAgICByb3VuZFRvWmVybyh0aGlzLmxpZnQuY29weSh0aGlzLnVwKS5tdWx0aXBseVNjYWxhcihkeW5hbWljUHJlc3N1cmUgKiBXSU5HX0FSRUEgKiBjbCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5kcmFnLnNldCgwLCAwLCAwKTtcbiAgICAgICAgICAgIHRoaXMubGlmdC5zZXQoMCwgMCwgMCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTdW06IHRocnVzdCArIGRyYWcgKyBsaWZ0ICsgZ3Jhdml0eVxuICAgICAgICB0aGlzLmZvcmNlcy5zZXQoMCwgLURSWV9NQVNTICogOS44MDY2NSwgMCkuYWRkKHRoaXMudGhydXN0KS5hZGQodGhpcy5kcmFnKS5hZGQodGhpcy5saWZ0KTtcblxuICAgICAgICAvLyBHcm91bmQgZnJpY3Rpb25cbiAgICAgICAgaWYgKHRoaXMubGFuZGVkIHx8ICh0aGlzLndoZWVsQnJha2VzQXBwbGllZCAmJiB0aGlzLm9iai5wb3NpdGlvbi55IDw9IFBMQU5FX0RJU1RBTkNFX1RPX0dST1VORCArIDAuMDUpKSB7XG4gICAgICAgICAgICBjb25zdCBXICAgICAgPSBEUllfTUFTUyAqIDkuODA2NjU7XG4gICAgICAgICAgICBjb25zdCBraW5ldGljID0gKHRoaXMud2hlZWxCcmFrZXNBcHBsaWVkID8gR1JPVU5EX0JSQUtFX0tJTkVUSUMgOiBHUk9VTkRfRlJJQ1RJT05fS0lORVRJQykgKiBXO1xuICAgICAgICAgICAgY29uc3QgcHJqRiAgID0gdGhpcy5fdi5jb3B5KHRoaXMuZm9yY2VzKS5zZXRZKDApO1xuICAgICAgICAgICAgaWYgKGlzWmVybyhzcGVlZCkgJiYgcHJqRi5sZW5ndGgoKSA8ICh0aGlzLndoZWVsQnJha2VzQXBwbGllZCA/IEdST1VORF9CUkFLRV9TVEFUSUMgOiBHUk9VTkRfRlJJQ1RJT05fU1RBVElDKSAqIFcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZyaWN0aW9uLmNvcHkocHJqRikubmVnYXRlKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZnJpY3Rpb24uY29weSh0aGlzLnZlbG9jaXR5VW5pdCkuc2V0WSgwKS5uZWdhdGUoKS5ub3JtYWxpemUoKS5tdWx0aXBseVNjYWxhcihraW5ldGljKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJvdW5kVG9aZXJvKHRoaXMuZnJpY3Rpb24pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5mcmljdGlvbi5zZXQoMCwgMCwgMCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmZvcmNlcy5hZGQodGhpcy5mcmljdGlvbik7XG4gICAgICAgIGlmICh0aGlzLmxhbmRlZCAmJiB0aGlzLmZvcmNlcy55IDwgMCkgdGhpcy5mb3JjZXMuc2V0WSgwKTtcblxuICAgICAgICBjb25zdCBhY2NlbCA9IHJvdW5kVG9aZXJvKHRoaXMuZm9yY2VzLmRpdmlkZVNjYWxhcihEUllfTUFTUykpO1xuICAgICAgICB0aGlzLmxvYWRGYWN0b3JHID0gY29tcHV0ZUxvYWRGYWN0b3JHKGFjY2VsLCB0aGlzLnVwKTtcbiAgICAgICAgdGhpcy52ZWxvY2l0eS5hZGRTY2FsZWRWZWN0b3IoYWNjZWwsIGRlbHRhKTtcbiAgICAgICAgaWYgKHRoaXMubGFuZGVkICYmIHRoaXMudmVsb2NpdHkueSA8IDApIHRoaXMudmVsb2NpdHkuc2V0WSgwKTtcblxuICAgICAgICB0aGlzLm9iai5wb3NpdGlvbi5hZGRTY2FsZWRWZWN0b3IoXG4gICAgICAgICAgICB0aGlzLmxhbmRlZCA/IHJvdW5kVG9aZXJvKHRoaXMudmVsb2NpdHksIDAuMDAwMSkgOiB0aGlzLnZlbG9jaXR5LFxuICAgICAgICAgICAgZGVsdGFcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKHRoaXMub2JqLnBvc2l0aW9uLnkgPiBQTEFORV9ESVNUQU5DRV9UT19HUk9VTkQgKyAwLjAxKSB0aGlzLmxhbmRlZCA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuaGFuZGxlR3JvdW5kQ29udGFjdChzcGVlZCk7XG4gICAgICAgIHRoaXMud3JhcFBvc2l0aW9uKCk7XG4gICAgfVxuXG4gICAgZ2V0U3RhbGxTdGF0dXMoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuc3RhbGw7IH1cblxuICAgIGdldFRocm90dGxlSHVkVGV4dCgpOiBzdHJpbmcgeyByZXR1cm4gZm9ybWF0RjE2VGhyb3R0bGVIdWQodGhpcy50aHJvdHRsZSk7IH1cbiAgICB1c2VGMTZUaHJvdHRsZURldGVudHMoKTogYm9vbGVhbiB7IHJldHVybiB0cnVlOyB9XG4gICAgc3RlcFRocm90dGxlRGV0ZW50KGN1cnJlbnQ6IG51bWJlciwgZGlyZWN0aW9uOiAxIHwgLTEpOiBudW1iZXIgeyByZXR1cm4gc3RlcEYxNlRocm90dGxlRGV0ZW50KGN1cnJlbnQsIGRpcmVjdGlvbik7IH1cbiAgICBpc0luVGhyb3R0bGVBYkRldGVudEJhbmQobGV2ZXI6IG51bWJlcik6IGJvb2xlYW4geyByZXR1cm4gaXNGMTZBYkRldGVudEJhbmQobGV2ZXIpOyB9XG4gICAgYWRqdXN0VGhyb3R0bGVJbnB1dChjdXJyZW50OiBudW1iZXIsIHN0ZXA6IG51bWJlcik6IG51bWJlciB7IHJldHVybiBhZGp1c3RGMTZUaHJvdHRsZUlucHV0KGN1cnJlbnQsIHN0ZXApOyB9XG4gICAgZ2V0VGhyb3R0bGVab25lKCk6IHN0cmluZyB7IHJldHVybiBnZXRGMTZUaHJvdHRsZVpvbmUodGhpcy5lZmZlY3RpdmVUaHJvdHRsZSk7IH1cbiAgICBnZXRUaHJvdHRsZUF1ZGlvTGV2ZWwoKTogbnVtYmVyIHsgcmV0dXJuIGYxNlRocm90dGxlQXVkaW9MZXZlbCh0aGlzLmVmZmVjdGl2ZVRocm90dGxlKTsgfVxuICAgIGdldEVuZ2luZU5venpsZUNvbG9yKCk6IHN0cmluZyB7IHJldHVybiBnZXRGMTZFbmdpbmVOb3p6bGVDb2xvcih0aGlzLmVmZmVjdGl2ZVRocm90dGxlKTsgfVxuXG4gICAgcHJpdmF0ZSB1cGRhdGVTdGFsbFN0YXRlKHNwZWVkOiBudW1iZXIsIGFvYTogbnVtYmVyLCBhbHRpdHVkZTogbnVtYmVyKSB7XG4gICAgICAgIGlmICh0aGlzLmxhbmRlZCkgeyB0aGlzLnN0YWxsID0gLTE7IHJldHVybjsgfVxuICAgICAgICBjb25zdCBhb2FTdGFsbCAgID0gc3BlZWQgPiA1ID8gY2xhbXAoKE1hdGguYWJzKGFvYSkgLSBTVEFMTF9BT0EgKiAwLjc1KSAvIChTVEFMTF9BT0EgKiAwLjM1KSwgMCwgMSkgOiAwO1xuICAgICAgICBjb25zdCBzcGVlZFN0YWxsID0gY2xhbXAoKE1JTl9GTFlJTkdfU1BFRUQgLSBzcGVlZCkgLyBNSU5fRkxZSU5HX1NQRUVELCAwLCAxKTtcbiAgICAgICAgY29uc3QgbGV2ZWwgICAgICA9IE1hdGgubWF4KGFvYVN0YWxsLCBhbHRpdHVkZSA+IFBMQU5FX0RJU1RBTkNFX1RPX0dST1VORCArIDUgPyBzcGVlZFN0YWxsIDogMCk7XG4gICAgICAgIHRoaXMuc3RhbGwgPSBsZXZlbCA+IDAgPyBsZXZlbCA6IC0xO1xuICAgIH1cblxuICAgIHByaXZhdGUgaGFuZGxlR3JvdW5kQ29udGFjdChzcGVlZDogbnVtYmVyKSB7XG4gICAgICAgIGlmICh0aGlzLm9iai5wb3NpdGlvbi55ID49IFBMQU5FX0RJU1RBTkNFX1RPX0dST1VORCkgcmV0dXJuO1xuICAgICAgICB0aGlzLm9iai5wb3NpdGlvbi55ID0gUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5EO1xuXG4gICAgICAgIHRoaXMuZm9yd2FyZC5jb3B5KEZPUldBUkQpLmFwcGx5UXVhdGVybmlvbih0aGlzLm9iai5xdWF0ZXJuaW9uKTtcbiAgICAgICAgdGhpcy5yaWdodC5jb3B5KFJJR0hUKS5hcHBseVF1YXRlcm5pb24odGhpcy5vYmoucXVhdGVybmlvbik7XG5cbiAgICAgICAgY29uc3QgcHJqRndkICAgPSB0aGlzLl92LmNvcHkodGhpcy5mb3J3YXJkKS5zZXRZKDApLm5vcm1hbGl6ZSgpO1xuICAgICAgICBjb25zdCBwcmpSaWdodCA9IHRoaXMuX3YyLmNvcHkodGhpcy5yaWdodCkuc2V0WSgwKS5ub3JtYWxpemUoKTtcblxuICAgICAgICBpZiAoIXRoaXMubGFuZGluZ0dlYXJEZXBsb3llZFxuICAgICAgICAgICAgfHwgc3BlZWQgPiBMQU5ERURfTUFYX1NQRUVEXG4gICAgICAgICAgICB8fCB0aGlzLnZlbG9jaXR5LnkgPCAtTEFORElOR19NQVhfVlNQRUVEXG4gICAgICAgICAgICB8fCB0aGlzLnJpZ2h0LmFuZ2xlVG8ocHJqUmlnaHQpICogTWF0aC5zaWduKHRoaXMucmlnaHQueSkgPiBMQU5ESU5HX01BWF9ST0xMXG4gICAgICAgICAgICB8fCBMQU5ESU5HX01JTl9QSVRDSCA+IHRoaXMuZm9yd2FyZC5hbmdsZVRvKHByakZ3ZCkgKiBNYXRoLnNpZ24odGhpcy5mb3J3YXJkLnkpKSB7XG4gICAgICAgICAgICB0aGlzLmNyYXNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZm9yd2FyZC55IDwgMCkgdGhpcy5vYmoucXVhdGVybmlvbi5zZXRGcm9tVW5pdFZlY3RvcnMoRk9SV0FSRCwgcHJqRndkKTtcbiAgICAgICAgdGhpcy52ZWxvY2l0eS5zZXRZKDApO1xuICAgICAgICB0aGlzLnN0YWxsICA9IC0xO1xuICAgICAgICB0aGlzLmxhbmRlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB3cmFwUG9zaXRpb24oKSB7XG4gICAgICAgIGNvbnN0IGggPSAyLjUgKiBURVJSQUlOX1NDQUxFICogVEVSUkFJTl9NT0RFTF9TSVpFO1xuICAgICAgICBpZiAodGhpcy5vYmoucG9zaXRpb24ueCA+ICBoKSB0aGlzLm9iai5wb3NpdGlvbi54ID0gLWg7XG4gICAgICAgIGlmICh0aGlzLm9iai5wb3NpdGlvbi54IDwgLWgpIHRoaXMub2JqLnBvc2l0aW9uLnggPSAgaDtcbiAgICAgICAgaWYgKHRoaXMub2JqLnBvc2l0aW9uLnogPiAgaCkgdGhpcy5vYmoucG9zaXRpb24ueiA9IC1oO1xuICAgICAgICBpZiAodGhpcy5vYmoucG9zaXRpb24ueiA8IC1oKSB0aGlzLm9iai5wb3NpdGlvbi56ID0gIGg7XG4gICAgfVxufVxuIiwiaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuaW1wb3J0IHsgUmVhbGlzdGljRmxpZ2h0TW9kZWwgfSBmcm9tICcuLi9tb2RlbC9yZWFsaXN0aWNGbGlnaHRNb2RlbCc7XG5pbXBvcnQgeyBBcmNhZGVGbGlnaHRNb2RlbCB9IGZyb20gJy4uL21vZGVsL2FyY2FkZUZsaWdodE1vZGVsJztcbmltcG9ydCB7IERlYnVnRmxpZ2h0TW9kZWwgfSBmcm9tICcuLi9tb2RlbC9kZWJ1Z0ZsaWdodE1vZGVsJztcbmltcG9ydCB7IEZtMkZsaWdodE1vZGVsIH0gZnJvbSAnLi4vbW9kZWwvZm0yRmxpZ2h0TW9kZWwnO1xuaW1wb3J0IHsgRmxpZ2h0TW9kZWwgfSBmcm9tICcuLi9tb2RlbC9mbGlnaHRNb2RlbCc7XG5cbmxldCBmbGlnaHRNb2RlbDogRmxpZ2h0TW9kZWw7XG5cbnNlbGYub25tZXNzYWdlID0gKGV2ZW50OiBNZXNzYWdlRXZlbnQpID0+IHtcbiAgICB0cnkge1xuICAgICAgICBoYW5kbGVNZXNzYWdlKGV2ZW50LmRhdGEpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zdCBlID0gZXJyIGFzIEVycm9yO1xuICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHsgdHlwZTogJ2Vycm9yJywgbWVzc2FnZTogYCR7ZT8ubmFtZX06ICR7ZT8ubWVzc2FnZX1gLCBzdGFjazogZT8uc3RhY2sgfSk7XG4gICAgfVxufTtcblxuZnVuY3Rpb24gaGFuZGxlTWVzc2FnZShkYXRhOiBhbnkpIHtcbiAgICBzd2l0Y2ggKGRhdGEudHlwZSkge1xuICAgICAgICBjYXNlICdpbml0JzpcbiAgICAgICAgICAgIGlmIChkYXRhLm1vZGVsVHlwZSA9PT0gJ3JlYWxpc3RpYycpIHtcbiAgICAgICAgICAgICAgICBmbGlnaHRNb2RlbCA9IG5ldyBSZWFsaXN0aWNGbGlnaHRNb2RlbCgpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChkYXRhLm1vZGVsVHlwZSA9PT0gJ2ZtMicpIHtcbiAgICAgICAgICAgICAgICBmbGlnaHRNb2RlbCA9IG5ldyBGbTJGbGlnaHRNb2RlbCgpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChkYXRhLm1vZGVsVHlwZSA9PT0gJ2FyY2FkZScpIHtcbiAgICAgICAgICAgICAgICBmbGlnaHRNb2RlbCA9IG5ldyBBcmNhZGVGbGlnaHRNb2RlbCgpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChkYXRhLm1vZGVsVHlwZSA9PT0gJ2RlYnVnJykge1xuICAgICAgICAgICAgICAgIGZsaWdodE1vZGVsID0gbmV3IERlYnVnRmxpZ2h0TW9kZWwoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgJ3VwZGF0ZSc6XG4gICAgICAgICAgICBpZiAoIWZsaWdodE1vZGVsKSByZXR1cm47XG4gICAgICAgICAgICBmbGlnaHRNb2RlbC5zZXRQaXRjaChkYXRhLmlucHV0cy5waXRjaCk7XG4gICAgICAgICAgICBmbGlnaHRNb2RlbC5zZXRSb2xsKGRhdGEuaW5wdXRzLnJvbGwpO1xuICAgICAgICAgICAgZmxpZ2h0TW9kZWwuc2V0WWF3KGRhdGEuaW5wdXRzLnlhdyk7XG4gICAgICAgICAgICBmbGlnaHRNb2RlbC5zZXRUaHJvdHRsZShkYXRhLmlucHV0cy50aHJvdHRsZSk7XG4gICAgICAgICAgICBmbGlnaHRNb2RlbC5zZXRMYW5kaW5nR2VhckRlcGxveWVkKGRhdGEuaW5wdXRzLmxhbmRpbmdHZWFyRGVwbG95ZWQpO1xuICAgICAgICAgICAgZmxpZ2h0TW9kZWwuc2V0RmxhcHNFeHRlbmRlZChkYXRhLmlucHV0cy5mbGFwc0V4dGVuZGVkKTtcbiAgICAgICAgICAgIGZsaWdodE1vZGVsLnNldFdoZWVsQnJha2VzKGRhdGEuaW5wdXRzLndoZWVsQnJha2VzQXBwbGllZCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZsaWdodE1vZGVsLnVwZGF0ZShkYXRhLmRlbHRhKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc2VuZFN0YXRlKCk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICdyZXNldCc6XG4gICAgICAgICAgICBpZiAoIWZsaWdodE1vZGVsKSByZXR1cm47XG4gICAgICAgICAgICBmbGlnaHRNb2RlbC5yZXNldCgpO1xuICAgICAgICAgICAgZmxpZ2h0TW9kZWwucG9zaXRpb24uc2V0KGRhdGEucG9zaXRpb25bMF0sIGRhdGEucG9zaXRpb25bMV0sIGRhdGEucG9zaXRpb25bMl0pO1xuICAgICAgICAgICAgZmxpZ2h0TW9kZWwucXVhdGVybmlvbi5zZXQoZGF0YS5xdWF0ZXJuaW9uWzBdLCBkYXRhLnF1YXRlcm5pb25bMV0sIGRhdGEucXVhdGVybmlvblsyXSwgZGF0YS5xdWF0ZXJuaW9uWzNdKTtcbiAgICAgICAgICAgIGZsaWdodE1vZGVsLnZlbG9jaXR5VmVjdG9yLnNldChkYXRhLnZlbG9jaXR5WzBdLCBkYXRhLnZlbG9jaXR5WzFdLCBkYXRhLnZlbG9jaXR5WzJdKTtcbiAgICAgICAgICAgIGZsaWdodE1vZGVsLnNldExhbmRlZChkYXRhLmxhbmRlZCk7XG4gICAgICAgICAgICBmbGlnaHRNb2RlbC5zZXRUaHJvdHRsZShkYXRhLnRocm90dGxlKTtcbiAgICAgICAgICAgIHNlbmRTdGF0ZSgpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnc3luY0VmZmVjdGl2ZVRocm90dGxlJzpcbiAgICAgICAgICAgIGlmICghZmxpZ2h0TW9kZWwpIHJldHVybjtcbiAgICAgICAgICAgIGZsaWdodE1vZGVsLnNldFRocm90dGxlKGRhdGEudGhyb3R0bGUpO1xuICAgICAgICAgICAgZmxpZ2h0TW9kZWwuc3luY0VmZmVjdGl2ZVRocm90dGxlKCk7XG4gICAgICAgICAgICBzZW5kU3RhdGUoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgJ3NldFBvc2l0aW9uJzpcbiAgICAgICAgICAgIGlmICghZmxpZ2h0TW9kZWwpIHJldHVybjtcbiAgICAgICAgICAgIGZsaWdodE1vZGVsLnBvc2l0aW9uLnNldChkYXRhLnBvc2l0aW9uWzBdLCBkYXRhLnBvc2l0aW9uWzFdLCBkYXRhLnBvc2l0aW9uWzJdKTtcbiAgICAgICAgICAgIHNlbmRTdGF0ZSgpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnc2V0UXVhdGVybmlvbic6XG4gICAgICAgICAgICBpZiAoIWZsaWdodE1vZGVsKSByZXR1cm47XG4gICAgICAgICAgICBmbGlnaHRNb2RlbC5xdWF0ZXJuaW9uLnNldChkYXRhLnF1YXRlcm5pb25bMF0sIGRhdGEucXVhdGVybmlvblsxXSwgZGF0YS5xdWF0ZXJuaW9uWzJdLCBkYXRhLnF1YXRlcm5pb25bM10pO1xuICAgICAgICAgICAgc2VuZFN0YXRlKCk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICdzZXRWZWxvY2l0eSc6XG4gICAgICAgICAgICBpZiAoIWZsaWdodE1vZGVsKSByZXR1cm47XG4gICAgICAgICAgICBmbGlnaHRNb2RlbC52ZWxvY2l0eVZlY3Rvci5zZXQoZGF0YS52ZWxvY2l0eVswXSwgZGF0YS52ZWxvY2l0eVsxXSwgZGF0YS52ZWxvY2l0eVsyXSk7XG4gICAgICAgICAgICBzZW5kU3RhdGUoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgJ3NuYXBQaHlzaWNzU3RhdGUnOlxuICAgICAgICAgICAgaWYgKCFmbGlnaHRNb2RlbCkgcmV0dXJuO1xuICAgICAgICAgICAgZmxpZ2h0TW9kZWwuc25hcFBoeXNpY3NTdGF0ZSgpO1xuICAgICAgICAgICAgc2VuZFN0YXRlKCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG59O1xuXG5mdW5jdGlvbiBzZW5kU3RhdGUoKSB7XG4gICAgaWYgKCFmbGlnaHRNb2RlbCkgcmV0dXJuO1xuICAgIGNvbnN0IHN0YXRlID0ge1xuICAgICAgICBwb3NpdGlvbjogZmxpZ2h0TW9kZWwucG9zaXRpb24udG9BcnJheSgpLFxuICAgICAgICBxdWF0ZXJuaW9uOiBmbGlnaHRNb2RlbC5xdWF0ZXJuaW9uLnRvQXJyYXkoKSxcbiAgICAgICAgdmVsb2NpdHk6IGZsaWdodE1vZGVsLnZlbG9jaXR5VmVjdG9yLnRvQXJyYXkoKSxcbiAgICAgICAgLy8gQHRzLWlnbm9yZSAtIGFjY2Vzc2luZyBwcm90ZWN0ZWQgbWVtYmVycyBmb3IgdHJhbnNmZXJcbiAgICAgICAgcHJldlBvc2l0aW9uOiBmbGlnaHRNb2RlbC5wcmV2UG9zaXRpb24udG9BcnJheSgpLFxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHByZXZRdWF0ZXJuaW9uOiBmbGlnaHRNb2RlbC5wcmV2UXVhdGVybmlvbi50b0FycmF5KCksXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcHJldlZlbG9jaXR5OiBmbGlnaHRNb2RlbC5wcmV2VmVsb2NpdHkudG9BcnJheSgpLFxuICAgICAgICBjcmFzaGVkOiBmbGlnaHRNb2RlbC5pc0NyYXNoZWQoKSxcbiAgICAgICAgbGFuZGVkOiBmbGlnaHRNb2RlbC5pc0xhbmRlZCgpLFxuICAgICAgICBhbmdsZU9mQXR0YWNrUmFkOiBmbGlnaHRNb2RlbC5nZXRBbmdsZU9mQXR0YWNrKCksXG4gICAgICAgIGxvYWRGYWN0b3JHOiBmbGlnaHRNb2RlbC5nZXRMb2FkRmFjdG9yRygpLFxuICAgICAgICBlbmdpbmVUaHJ1c3ROOiBmbGlnaHRNb2RlbC5nZXRFbmdpbmVUaHJ1c3RLbigpICogMTAwMCxcbiAgICAgICAgZWZmZWN0aXZlVGhyb3R0bGU6IGZsaWdodE1vZGVsLmdldEVmZmVjdGl2ZVRocm90dGxlKCksXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgZGVsdGFSZW1haW5kZXI6IGZsaWdodE1vZGVsLmRlbHRhUmVtYWluZGVyLFxuICAgICAgICBzdGFsbDogZmxpZ2h0TW9kZWwuZ2V0U3RhbGxTdGF0dXMoKVxuICAgIH07XG5cbiAgICBzZWxmLnBvc3RNZXNzYWdlKHsgdHlwZTogJ3N0YXRlJywgc3RhdGUgfSk7XG59XG4iLCJpbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5cbmNvbnN0IF92ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbmNvbnN0IF93ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbmNvbnN0IF9xID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcblxuY29uc3QgRVBTSUxPTiA9IDAuMDAwMTtcblxuZXhwb3J0IGNvbnN0IFpFUk8gPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAwKTtcbmV4cG9ydCBjb25zdCBVUCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDEsIDApO1xuZXhwb3J0IGNvbnN0IEZPUldBUkQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAxKTtcbmV4cG9ydCBjb25zdCBSSUdIVCA9IG5ldyBUSFJFRS5WZWN0b3IzKDEsIDAsIDApO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNaZXJvKG46IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIHJldHVybiAtRVBTSUxPTiA8PSBuICYmIG4gPD0gRVBTSUxPTjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVxdWFscyhhOiBudW1iZXIsIGI6IG51bWJlciwgZXBzaWxvbjogbnVtYmVyID0gRVBTSUxPTik6IGJvb2xlYW4ge1xuICAgIHJldHVybiBhIC0gZXBzaWxvbiA8PSBiICYmIGIgPD0gYSArIGVwc2lsb247XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbGFtcChuOiBudW1iZXIsIG1pbjogbnVtYmVyLCBtYXg6IG51bWJlcik6IG51bWJlciB7XG4gICAgcmV0dXJuIE1hdGgubWF4KG1pbiwgTWF0aC5taW4obiwgbWF4KSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsZXJwKHQ6IG51bWJlciwgbjA6IG51bWJlciwgbjE6IG51bWJlcik6IG51bWJlciB7XG4gICAgcmV0dXJuIG4wICsgdCAqIChuMSAtIG4wKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHZlY3RvckhlYWRpbmcodjogVEhSRUUuVmVjdG9yMyk6IG51bWJlciB7XG4gICAgbGV0IGJlYXJpbmcgPSBNYXRoLnJvdW5kKE1hdGguYXRhbjIodi54LCAtdi56KSAvICgyICogTWF0aC5QSSkgKiAzNjApO1xuICAgIGlmIChiZWFyaW5nIDwgMCkge1xuICAgICAgICBiZWFyaW5nID0gMzYwICsgYmVhcmluZztcbiAgICB9XG4gICAgcmV0dXJuIGJlYXJpbmc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByb3VuZFRvWmVybyh2OiBUSFJFRS5WZWN0b3IzLCBlcHNpbG9uOiBudW1iZXIgPSBFUFNJTE9OKTogVEhSRUUuVmVjdG9yMyB7XG4gICAgaWYgKGVxdWFscyh2LngsIDAuMCwgZXBzaWxvbikpIHtcbiAgICAgICAgdi54ID0gMDtcbiAgICB9XG4gICAgaWYgKGVxdWFscyh2LnksIDAuMCwgZXBzaWxvbikpIHtcbiAgICAgICAgdi55ID0gMDtcbiAgICB9XG4gICAgaWYgKGVxdWFscyh2LnosIDAuMCwgZXBzaWxvbikpIHtcbiAgICAgICAgdi56ID0gMDtcbiAgICB9XG4gICAgcmV0dXJuIHY7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlYXNlT3V0Q2lyYyh4OiBudW1iZXIpOiBudW1iZXIge1xuICAgIHJldHVybiBNYXRoLnNxcnQoMSAtICh4IC0gMSkgKiAoeCAtIDEpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVhc2VPdXRRdWFkKHg6IG51bWJlcikge1xuICAgIHJldHVybiAxIC0gKDEgLSB4KSAqICgxIC0geCk7XG59XG5leHBvcnQgZnVuY3Rpb24gZWFzZU91dFF1aW50KHg6IG51bWJlcikge1xuICAgIHJldHVybiAxIC0gTWF0aC5wb3coMSAtIHgsIDUpO1xufVxuXG5leHBvcnQgY29uc3QgUElfT1ZFUl8xODAgPSBNYXRoLlBJIC8gMTgwLjA7XG5leHBvcnQgY29uc3QgTjE4MF9PVkVSX1BJID0gMTgwLjAgLyBNYXRoLlBJO1xuXG5leHBvcnQgZnVuY3Rpb24gdG9SYWRpYW5zKGRlZ3JlZXM6IG51bWJlcik6IG51bWJlciB7XG4gICAgcmV0dXJuIFBJX09WRVJfMTgwICogZGVncmVlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvRGVncmVlcyhyYWRpYW5zOiBudW1iZXIpOiBudW1iZXIge1xuICAgIHJldHVybiBOMTgwX09WRVJfUEkgKiByYWRpYW5zO1xufVxuXG4vLyBSZXR1cm5zIFtwaXRjaCwgcm9sbF0gaW4gcmFkaWFuc1xuZXhwb3J0IGZ1bmN0aW9uIGNhbGN1bGF0ZVBpdGNoUm9sbChhY3Rvcjoge1xuICAgIHF1YXRlcm5pb246IFRIUkVFLlF1YXRlcm5pb247XG4gICAgZ2V0V29ybGREaXJlY3Rpb246ICh2OiBUSFJFRS5WZWN0b3IzKSA9PiBUSFJFRS5WZWN0b3IzO1xufSk6IFtudW1iZXIsIG51bWJlcl0ge1xuICAgIGNvbnN0IGZvcndhcmQgPSBhY3Rvci5nZXRXb3JsZERpcmVjdGlvbihfdik7XG4gICAgY29uc3QgcHJqRm9yd2FyZCA9IF93LmNvcHkoZm9yd2FyZClcbiAgICAgICAgLnNldFkoMClcbiAgICAgICAgLm5vcm1hbGl6ZSgpO1xuICAgIGNvbnN0IHBpdGNoID0gZm9yd2FyZC5hbmdsZVRvKHByakZvcndhcmQpICogTWF0aC5zaWduKGZvcndhcmQueSk7XG5cbiAgICBfcS5zZXRGcm9tVW5pdFZlY3RvcnMoZm9yd2FyZCwgcHJqRm9yd2FyZCk7XG5cbiAgICBjb25zdCByaWdodCA9IF92LmNvcHkoUklHSFQpXG4gICAgICAgIC5hcHBseVF1YXRlcm5pb24oYWN0b3IucXVhdGVybmlvbilcbiAgICAgICAgLmFwcGx5UXVhdGVybmlvbihfcSk7XG4gICAgX3Euc2V0RnJvbVVuaXRWZWN0b3JzKHByakZvcndhcmQsIEZPUldBUkQpO1xuICAgIHJpZ2h0LmFwcGx5UXVhdGVybmlvbihfcSk7XG4gICAgbGV0IHJvbGwgPSBNYXRoLmFjb3MocmlnaHQueCkgKiBNYXRoLnNpZ24ocmlnaHQueSk7XG4gICAgcm9sbCA9IGlzTmFOKHJvbGwpID8gMC4wIDogcm9sbDtcblxuICAgIHJldHVybiBbcGl0Y2gsIHJvbGxdO1xufVxuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbi8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG5fX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBfX3dlYnBhY2tfbW9kdWxlc19fO1xuXG4vLyB0aGUgc3RhcnR1cCBmdW5jdGlvblxuX193ZWJwYWNrX3JlcXVpcmVfXy54ID0gKCkgPT4ge1xuXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcblx0Ly8gVGhpcyBlbnRyeSBtb2R1bGUgZGVwZW5kcyBvbiBvdGhlciBsb2FkZWQgY2h1bmtzIGFuZCBleGVjdXRpb24gbmVlZCB0byBiZSBkZWxheWVkXG5cdHZhciBfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXy5PKHVuZGVmaW5lZCwgW1widmVuZG9ycy1ub2RlX21vZHVsZXNfdGhyZWVfYnVpbGRfdGhyZWVfbW9kdWxlX2pzXCJdLCAoKSA9PiAoX193ZWJwYWNrX3JlcXVpcmVfXyhcIi4vc3JjL3NjcmlwdC9waHlzaWNzL3dvcmtlci9mbGlnaHRXb3JrZXIudHNcIikpKVxuXHRfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXy5PKF9fd2VicGFja19leHBvcnRzX18pO1xuXHRyZXR1cm4gX193ZWJwYWNrX2V4cG9ydHNfXztcbn07XG5cbiIsInZhciBkZWZlcnJlZCA9IFtdO1xuX193ZWJwYWNrX3JlcXVpcmVfXy5PID0gKHJlc3VsdCwgY2h1bmtJZHMsIGZuLCBwcmlvcml0eSkgPT4ge1xuXHRpZihjaHVua0lkcykge1xuXHRcdHByaW9yaXR5ID0gcHJpb3JpdHkgfHwgMDtcblx0XHRmb3IodmFyIGkgPSBkZWZlcnJlZC5sZW5ndGg7IGkgPiAwICYmIGRlZmVycmVkW2kgLSAxXVsyXSA+IHByaW9yaXR5OyBpLS0pIGRlZmVycmVkW2ldID0gZGVmZXJyZWRbaSAtIDFdO1xuXHRcdGRlZmVycmVkW2ldID0gW2NodW5rSWRzLCBmbiwgcHJpb3JpdHldO1xuXHRcdHJldHVybjtcblx0fVxuXHR2YXIgbm90RnVsZmlsbGVkID0gSW5maW5pdHk7XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgZGVmZXJyZWQubGVuZ3RoOyBpKyspIHtcblx0XHR2YXIgW2NodW5rSWRzLCBmbiwgcHJpb3JpdHldID0gZGVmZXJyZWRbaV07XG5cdFx0dmFyIGZ1bGZpbGxlZCA9IHRydWU7XG5cdFx0Zm9yICh2YXIgaiA9IDA7IGogPCBjaHVua0lkcy5sZW5ndGg7IGorKykge1xuXHRcdFx0aWYgKChwcmlvcml0eSAmIDEgPT09IDAgfHwgbm90RnVsZmlsbGVkID49IHByaW9yaXR5KSAmJiBPYmplY3Qua2V5cyhfX3dlYnBhY2tfcmVxdWlyZV9fLk8pLmV2ZXJ5KChrZXkpID0+IChfX3dlYnBhY2tfcmVxdWlyZV9fLk9ba2V5XShjaHVua0lkc1tqXSkpKSkge1xuXHRcdFx0XHRjaHVua0lkcy5zcGxpY2Uoai0tLCAxKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGZ1bGZpbGxlZCA9IGZhbHNlO1xuXHRcdFx0XHRpZihwcmlvcml0eSA8IG5vdEZ1bGZpbGxlZCkgbm90RnVsZmlsbGVkID0gcHJpb3JpdHk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmKGZ1bGZpbGxlZCkge1xuXHRcdFx0ZGVmZXJyZWQuc3BsaWNlKGktLSwgMSlcblx0XHRcdHZhciByID0gZm4oKTtcblx0XHRcdGlmIChyICE9PSB1bmRlZmluZWQpIHJlc3VsdCA9IHI7XG5cdFx0fVxuXHR9XG5cdHJldHVybiByZXN1bHQ7XG59OyIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18uZiA9IHt9O1xuLy8gVGhpcyBmaWxlIGNvbnRhaW5zIG9ubHkgdGhlIGVudHJ5IGNodW5rLlxuLy8gVGhlIGNodW5rIGxvYWRpbmcgZnVuY3Rpb24gZm9yIGFkZGl0aW9uYWwgY2h1bmtzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmUgPSAoY2h1bmtJZCkgPT4ge1xuXHRyZXR1cm4gUHJvbWlzZS5hbGwoT2JqZWN0LmtleXMoX193ZWJwYWNrX3JlcXVpcmVfXy5mKS5yZWR1Y2UoKHByb21pc2VzLCBrZXkpID0+IHtcblx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmZba2V5XShjaHVua0lkLCBwcm9taXNlcyk7XG5cdFx0cmV0dXJuIHByb21pc2VzO1xuXHR9LCBbXSkpO1xufTsiLCIvLyBUaGlzIGZ1bmN0aW9uIGFsbG93IHRvIHJlZmVyZW5jZSBhc3luYyBjaHVua3MgYW5kIHNpYmxpbmcgY2h1bmtzIGZvciB0aGUgZW50cnlwb2ludFxuX193ZWJwYWNrX3JlcXVpcmVfXy51ID0gKGNodW5rSWQpID0+IHtcblx0Ly8gcmV0dXJuIHVybCBmb3IgZmlsZW5hbWVzIGJhc2VkIG9uIHRlbXBsYXRlXG5cdHJldHVybiBcIlwiICsgY2h1bmtJZCArIFwiLmJ1bmRsZS5qc1wiO1xufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmcgPSAoZnVuY3Rpb24oKSB7XG5cdGlmICh0eXBlb2YgZ2xvYmFsVGhpcyA9PT0gJ29iamVjdCcpIHJldHVybiBnbG9iYWxUaGlzO1xuXHR0cnkge1xuXHRcdHJldHVybiB0aGlzIHx8IG5ldyBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0aWYgKHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnKSByZXR1cm4gd2luZG93O1xuXHR9XG59KSgpOyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJ2YXIgc2NyaXB0VXJsO1xuaWYgKF9fd2VicGFja19yZXF1aXJlX18uZy5pbXBvcnRTY3JpcHRzKSBzY3JpcHRVcmwgPSBfX3dlYnBhY2tfcmVxdWlyZV9fLmcubG9jYXRpb24gKyBcIlwiO1xudmFyIGRvY3VtZW50ID0gX193ZWJwYWNrX3JlcXVpcmVfXy5nLmRvY3VtZW50O1xuaWYgKCFzY3JpcHRVcmwgJiYgZG9jdW1lbnQpIHtcblx0aWYgKGRvY3VtZW50LmN1cnJlbnRTY3JpcHQpXG5cdFx0c2NyaXB0VXJsID0gZG9jdW1lbnQuY3VycmVudFNjcmlwdC5zcmNcblx0aWYgKCFzY3JpcHRVcmwpIHtcblx0XHR2YXIgc2NyaXB0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwic2NyaXB0XCIpO1xuXHRcdGlmKHNjcmlwdHMubGVuZ3RoKSBzY3JpcHRVcmwgPSBzY3JpcHRzW3NjcmlwdHMubGVuZ3RoIC0gMV0uc3JjXG5cdH1cbn1cbi8vIFdoZW4gc3VwcG9ydGluZyBicm93c2VycyB3aGVyZSBhbiBhdXRvbWF0aWMgcHVibGljUGF0aCBpcyBub3Qgc3VwcG9ydGVkIHlvdSBtdXN0IHNwZWNpZnkgYW4gb3V0cHV0LnB1YmxpY1BhdGggbWFudWFsbHkgdmlhIGNvbmZpZ3VyYXRpb25cbi8vIG9yIHBhc3MgYW4gZW1wdHkgc3RyaW5nIChcIlwiKSBhbmQgc2V0IHRoZSBfX3dlYnBhY2tfcHVibGljX3BhdGhfXyB2YXJpYWJsZSBmcm9tIHlvdXIgY29kZSB0byB1c2UgeW91ciBvd24gbG9naWMuXG5pZiAoIXNjcmlwdFVybCkgdGhyb3cgbmV3IEVycm9yKFwiQXV0b21hdGljIHB1YmxpY1BhdGggaXMgbm90IHN1cHBvcnRlZCBpbiB0aGlzIGJyb3dzZXJcIik7XG5zY3JpcHRVcmwgPSBzY3JpcHRVcmwucmVwbGFjZSgvIy4qJC8sIFwiXCIpLnJlcGxhY2UoL1xcPy4qJC8sIFwiXCIpLnJlcGxhY2UoL1xcL1teXFwvXSskLywgXCIvXCIpO1xuX193ZWJwYWNrX3JlcXVpcmVfXy5wID0gc2NyaXB0VXJsOyIsIi8vIG5vIGJhc2VVUklcblxuLy8gb2JqZWN0IHRvIHN0b3JlIGxvYWRlZCBjaHVua3Ncbi8vIFwiMVwiIG1lYW5zIFwiYWxyZWFkeSBsb2FkZWRcIlxudmFyIGluc3RhbGxlZENodW5rcyA9IHtcblx0XCJzcmNfc2NyaXB0X3BoeXNpY3Nfd29ya2VyX2ZsaWdodFdvcmtlcl90c1wiOiAxXG59O1xuXG4vLyBpbXBvcnRTY3JpcHRzIGNodW5rIGxvYWRpbmdcbnZhciBpbnN0YWxsQ2h1bmsgPSAoZGF0YSkgPT4ge1xuXHR2YXIgW2NodW5rSWRzLCBtb3JlTW9kdWxlcywgcnVudGltZV0gPSBkYXRhO1xuXHRmb3IodmFyIG1vZHVsZUlkIGluIG1vcmVNb2R1bGVzKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKG1vcmVNb2R1bGVzLCBtb2R1bGVJZCkpIHtcblx0XHRcdF9fd2VicGFja19yZXF1aXJlX18ubVttb2R1bGVJZF0gPSBtb3JlTW9kdWxlc1ttb2R1bGVJZF07XG5cdFx0fVxuXHR9XG5cdGlmKHJ1bnRpbWUpIHJ1bnRpbWUoX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cdHdoaWxlKGNodW5rSWRzLmxlbmd0aClcblx0XHRpbnN0YWxsZWRDaHVua3NbY2h1bmtJZHMucG9wKCldID0gMTtcblx0cGFyZW50Q2h1bmtMb2FkaW5nRnVuY3Rpb24oZGF0YSk7XG59O1xuX193ZWJwYWNrX3JlcXVpcmVfXy5mLmkgPSAoY2h1bmtJZCwgcHJvbWlzZXMpID0+IHtcblx0Ly8gXCIxXCIgaXMgdGhlIHNpZ25hbCBmb3IgXCJhbHJlYWR5IGxvYWRlZFwiXG5cdGlmKCFpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0pIHtcblx0XHRpZih0cnVlKSB7IC8vIGFsbCBjaHVua3MgaGF2ZSBKU1xuXHRcdFx0aW1wb3J0U2NyaXB0cyhfX3dlYnBhY2tfcmVxdWlyZV9fLnAgKyBfX3dlYnBhY2tfcmVxdWlyZV9fLnUoY2h1bmtJZCkpO1xuXHRcdH1cblx0fVxufTtcblxudmFyIGNodW5rTG9hZGluZ0dsb2JhbCA9IHNlbGZbXCJ3ZWJwYWNrQ2h1bmtyZXRyb2ZsaWdodHNpbVwiXSA9IHNlbGZbXCJ3ZWJwYWNrQ2h1bmtyZXRyb2ZsaWdodHNpbVwiXSB8fCBbXTtcbnZhciBwYXJlbnRDaHVua0xvYWRpbmdGdW5jdGlvbiA9IGNodW5rTG9hZGluZ0dsb2JhbC5wdXNoLmJpbmQoY2h1bmtMb2FkaW5nR2xvYmFsKTtcbmNodW5rTG9hZGluZ0dsb2JhbC5wdXNoID0gaW5zdGFsbENodW5rO1xuXG4vLyBubyBITVJcblxuLy8gbm8gSE1SIG1hbmlmZXN0IiwidmFyIG5leHQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fLng7XG5fX3dlYnBhY2tfcmVxdWlyZV9fLnggPSAoKSA9PiB7XG5cdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fLmUoXCJ2ZW5kb3JzLW5vZGVfbW9kdWxlc190aHJlZV9idWlsZF90aHJlZV9tb2R1bGVfanNcIikudGhlbihuZXh0KTtcbn07IiwiIiwiLy8gcnVuIHN0YXJ0dXBcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXy54KCk7XG4iLCIiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=
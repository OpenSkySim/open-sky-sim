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
        this.fuselage = new _fm2_aeroSurface__WEBPACK_IMPORTED_MODULE_5__.AeroSurface(_fm2_f16Fm2Config__WEBPACK_IMPORTED_MODULE_7__.FM2_SURFACES.fuselage);
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
        this.accumulateSurface(this.fuselage, 0, 0, 0, 0, airDensity);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3JjX3NjcmlwdF9waHlzaWNzX3dvcmtlcl9mbGlnaHRXb3JrZXJfdHMuYnVuZGxlLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDTyxNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFFbkIsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDO0FBQ3JCLE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQztBQUNyQixNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUM7QUFDckIsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDO0FBRXJCLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQztBQUNsQixNQUFNLEtBQUssR0FBRyxHQUFHLENBQUM7QUFDbEIsTUFBTSxVQUFVLEdBQUcsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUM3QixNQUFNLFVBQVUsR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBRTdCLE1BQU0sYUFBYSxHQUFHLEtBQUssQ0FBQztBQUM1QixNQUFNLGtCQUFrQixHQUFHLEtBQUssQ0FBQztBQUVqQyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUMvQixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUM5QixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztBQUM5QixNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUM7QUFDeEIsTUFBTSxhQUFhLEdBQUcsRUFBRSxDQUFDO0FBQ3pCLE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQztBQUN2QixNQUFNLHdCQUF3QixHQUFHLEdBQUcsQ0FBQztBQUNyQyxNQUFNLHNCQUFzQixHQUFHLEdBQUcsQ0FBQztBQUNuQyxNQUFNLHNCQUFzQixHQUFHLEdBQUcsQ0FBQztBQUNuQyxNQUFNLFlBQVksR0FBRyxLQUFLLENBQUM7QUFFM0IsTUFBTSxXQUFXLEdBQUcsRUFBRSxDQUFDO0FB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V0FDQTtXQUNBO1dBQ0E7V0FDQSxhQUFhO1dBQ2I7V0FDQTtXQUNBO1dBQ0E7O1dBRUE7V0FDQTtXQUNBOztXQUVBOztXQUVBOzs7OztXQ3BDQTtXQUNBO1dBQ0E7V0FDQTs7Ozs7VUVIQTtVQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vLi9zcmMvc2NyaXB0L2RlZnMudHMiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vLi9zcmMvc2NyaXB0L3BoeXNpY3MvYWVyb1V0aWxzLnRzIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltLy4vc3JjL3NjcmlwdC9waHlzaWNzL2YxNkVuZ2luZS50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy9mMTZQYXBlckRhdGEudHMiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vLi9zcmMvc2NyaXB0L3BoeXNpY3MvZjE2UHJvZmlsZS50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy9mMTZSb2xsQ29udHJvbC50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy9mbTIvYWVyb1N1cmZhY2UudHMiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vLi9zcmMvc2NyaXB0L3BoeXNpY3MvZm0yL2YxNkZjcy50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy9mbTIvZjE2Rm0yQ29uZmlnLnRzIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltLy4vc3JjL3NjcmlwdC9waHlzaWNzL2ZtMi9yaWdpZEJvZHkudHMiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vLi9zcmMvc2NyaXB0L3BoeXNpY3MvbW9kZWwvYXJjYWRlRmxpZ2h0TW9kZWwudHMiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vLi9zcmMvc2NyaXB0L3BoeXNpY3MvbW9kZWwvZGVidWdGbGlnaHRNb2RlbC50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy9tb2RlbC9mbGlnaHRNb2RlbC50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy9tb2RlbC9mbTJGbGlnaHRNb2RlbC50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy9tb2RlbC9yZWFsaXN0aWNGbGlnaHRNb2RlbC50cyIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS8uL3NyYy9zY3JpcHQvcGh5c2ljcy93b3JrZXIvZmxpZ2h0V29ya2VyLnRzIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltLy4vc3JjL3NjcmlwdC91dGlscy9tYXRoLnRzIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svcnVudGltZS9jaHVuayBsb2FkZWQiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svcnVudGltZS9lbnN1cmUgY2h1bmsiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vd2VicGFjay9ydW50aW1lL2dldCBqYXZhc2NyaXB0IGNodW5rIGZpbGVuYW1lIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svcnVudGltZS9nbG9iYWwiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9yZXRyb2ZsaWdodHNpbS93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svcnVudGltZS9wdWJsaWNQYXRoIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svcnVudGltZS9pbXBvcnRTY3JpcHRzIGNodW5rIGxvYWRpbmciLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vd2VicGFjay9ydW50aW1lL3N0YXJ0dXAgY2h1bmsgZGVwZW5kZW5jaWVzIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svYmVmb3JlLXN0YXJ0dXAiLCJ3ZWJwYWNrOi8vcmV0cm9mbGlnaHRzaW0vd2VicGFjay9zdGFydHVwIiwid2VicGFjazovL3JldHJvZmxpZ2h0c2ltL3dlYnBhY2svYWZ0ZXItc3RhcnR1cCJdLCJzb3VyY2VzQ29udGVudCI6WyJcbmV4cG9ydCBjb25zdCBGUFNfQ0FQID0gMTU7IC8vIEZQU1xuXG5leHBvcnQgY29uc3QgTE9fSF9SRVMgPSAzMjA7XG5leHBvcnQgY29uc3QgTE9fVl9SRVMgPSAyMDA7XG5leHBvcnQgY29uc3QgSElfSF9SRVMgPSA2NDA7XG5leHBvcnQgY29uc3QgSElfVl9SRVMgPSA0MDA7XG5cbmV4cG9ydCBjb25zdCBIX1JFUyA9IDMyMDtcbmV4cG9ydCBjb25zdCBWX1JFUyA9IDIwMDtcbmV4cG9ydCBjb25zdCBIX1JFU19IQUxGID0gSF9SRVMgLyAyO1xuZXhwb3J0IGNvbnN0IFZfUkVTX0hBTEYgPSBWX1JFUyAvIDI7XG5cbmV4cG9ydCBjb25zdCBURVJSQUlOX1NDQUxFID0gMjAwLjA7XG5leHBvcnQgY29uc3QgVEVSUkFJTl9NT0RFTF9TSVpFID0gMTAwLjA7XG5cbmV4cG9ydCBjb25zdCBQSVRDSF9SQVRFID0gTWF0aC5QSSAvIDU7IC8vIFJhZGlhbnMvc1xuZXhwb3J0IGNvbnN0IFJPTExfUkFURSA9IE1hdGguUEkgLyAyOyAvLyBSYWRpYW5zL3MgKHdhcyDPgC8zLCArNTAlKVxuZXhwb3J0IGNvbnN0IFlBV19SQVRFID0gTWF0aC5QSSAvIDEyOyAvLyBSYWRpYW5zL3NcbmV4cG9ydCBjb25zdCBNQVhfU1BFRUQgPSAyNTAuMDsgLy8gV29ybGQgdW5pdHMvc1xuZXhwb3J0IGNvbnN0IFRIUk9UVExFX1JBVEUgPSAzMzsgLy8gUGVyY2VudGFnZSBvZiBtYXhpbXVtL3MgWzAsMTAwXVxuZXhwb3J0IGNvbnN0IFNUSUNLX1JBVEUgPSAxLjU7IC8vIEZ1bGwgc3RpY2sgZGVmbGVjdGlvbiBwZXIgc2Vjb25kXG5leHBvcnQgY29uc3QgUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5EID0gMi4wOyAvLyBXb3JsZCB1bml0c1xuZXhwb3J0IGNvbnN0IFBMQU5FX0NPQ0tQSVRfT0ZGU0VUX1kgPSAxLjA7IC8vIFdvcmxkIHVuaXRzXG5leHBvcnQgY29uc3QgUExBTkVfQ09DS1BJVF9PRkZTRVRfWiA9IDguMDsgLy8gV29ybGQgdW5pdHNcbmV4cG9ydCBjb25zdCBNQVhfQUxUSVRVREUgPSAxNDAwMDsgLy8gV29ybGQgdW5pdHNcblxuZXhwb3J0IGNvbnN0IENPQ0tQSVRfRk9WID0gNTA7XG5leHBvcnQgY29uc3QgQ09DS1BJVF9GQVIgPSA0MDAwMDtcblxuZXhwb3J0IGNvbnN0IEdST1VORF9TTU9LRV9QQVJUSUNMRV9DT1VOVCA9IDEwMDtcblxuZXhwb3J0IGNvbnN0IEFJUkJBU0VfUlVOV0FZID0geyB4OiAxNTAwLCB5OiAwLCB6OiAtODAwIH07XG5leHBvcnQgY29uc3QgUlVOV0FZX0hBTEZfTEVOR1RIX00gPSAxNTAwO1xuZXhwb3J0IGNvbnN0IEFQUFJPQUNIX0FMVElUVURFX00gPSA1MDA7XG5leHBvcnQgY29uc3QgQVBQUk9BQ0hfU1BFRURfS01IID0gMzAwO1xuZXhwb3J0IGNvbnN0IEFQUFJPQUNIX1NQRUVEX01QUyA9IEFQUFJPQUNIX1NQRUVEX0tNSCAvIDMuNjtcbmV4cG9ydCBjb25zdCBBUFBST0FDSF9GSU5BTF9ESVNUQU5DRV9NID0gNTAwMDtcbiIsImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcblxuY29uc3QgR1JBVklUWSA9IDkuODtcblxuZXhwb3J0IGNvbnN0IEdST1VORF9BSVJfREVOU0lUWSA9IDEuMjI1OyAvLyBrZy9twrMgYXQgc2VhIGxldmVsLCBJU0FcbmNvbnN0IFZORV9NQUNIID0gMC45NTsgLy8gdHJhbnNvbmljIGRyYWcgcmlzZSBvbnNldCAoc2ltIG9ubHk7IHBhcGVyIGvigoIgPSAwKVxuXG5jb25zdCBJU0FfU0VBX0xFVkVMX1BSRVNTVVJFID0gMTAxMzI1OyAvLyBQYVxuY29uc3QgSVNBX1NFQV9MRVZFTF9URU1QID0gMjg4LjE1OyAvLyBLXG5jb25zdCBJU0FfTEFQU0VfUkFURSA9IDAuMDA2NTsgLy8gSy9tXG5jb25zdCBJU0FfVFJPUE9QQVVTRV9BTFQgPSAxMTAwMDsgLy8gbVxuY29uc3QgSVNBX1RST1BPUEFVU0VfUFJFU1NVUkUgPSAyMjYzMi4xOyAvLyBQYVxuY29uc3QgSVNBX1RST1BPUEFVU0VfVEVNUCA9IDIxNi42NTsgLy8gS1xuY29uc3QgR1JBVklUWV9JU0EgPSA5LjgwNjY1OyAvLyBtL3PCslxuY29uc3QgR0FTX0NPTlNUQU5UID0gMjg3LjA1MzsgLy8gSi8oa2fCt0spXG5cbi8qKiBJU0EgZGVuc2l0eSAoa2cvbcKzKSDigJQgQW5kZXJzb24tc3R5bGUgcGVyZm9ybWFuY2UgYW5hbHlzaXMgYXRtb3NwaGVyZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlSXNhQWlyRGVuc2l0eShhbHRpdHVkZU1ldGVyczogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBjb25zdCBoID0gTWF0aC5tYXgoMCwgYWx0aXR1ZGVNZXRlcnMpO1xuICAgIGxldCB0ZW1wZXJhdHVyZTogbnVtYmVyO1xuICAgIGxldCBwcmVzc3VyZTogbnVtYmVyO1xuXG4gICAgaWYgKGggPD0gSVNBX1RST1BPUEFVU0VfQUxUKSB7XG4gICAgICAgIHRlbXBlcmF0dXJlID0gSVNBX1NFQV9MRVZFTF9URU1QIC0gSVNBX0xBUFNFX1JBVEUgKiBoO1xuICAgICAgICBwcmVzc3VyZSA9IElTQV9TRUFfTEVWRUxfUFJFU1NVUkUgKiBNYXRoLnBvdyhcbiAgICAgICAgICAgIHRlbXBlcmF0dXJlIC8gSVNBX1NFQV9MRVZFTF9URU1QLFxuICAgICAgICAgICAgR1JBVklUWV9JU0EgLyAoR0FTX0NPTlNUQU5UICogSVNBX0xBUFNFX1JBVEUpLFxuICAgICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRlbXBlcmF0dXJlID0gSVNBX1RST1BPUEFVU0VfVEVNUDtcbiAgICAgICAgcHJlc3N1cmUgPSBJU0FfVFJPUE9QQVVTRV9QUkVTU1VSRSAqIE1hdGguZXhwKFxuICAgICAgICAgICAgLUdSQVZJVFlfSVNBICogKGggLSBJU0FfVFJPUE9QQVVTRV9BTFQpIC8gKEdBU19DT05TVEFOVCAqIElTQV9UUk9QT1BBVVNFX1RFTVApLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiBwcmVzc3VyZSAvIChHQVNfQ09OU1RBTlQgKiB0ZW1wZXJhdHVyZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlQWlyRGVuc2l0eShhbHRpdHVkZU1ldGVyczogbnVtYmVyKTogbnVtYmVyIHtcbiAgICByZXR1cm4gY29tcHV0ZUlzYUFpckRlbnNpdHkoYWx0aXR1ZGVNZXRlcnMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUR5bmFtaWNQcmVzc3VyZShhaXJEZW5zaXR5OiBudW1iZXIsIHNwZWVkOiBudW1iZXIpOiBudW1iZXIge1xuICAgIHJldHVybiAwLjUgKiBhaXJEZW5zaXR5ICogc3BlZWQgKiBzcGVlZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVUaHJ1c3REZW5zaXR5RmFjdG9yKGFpckRlbnNpdHk6IG51bWJlciwgYWx0aXR1ZGVNZXRlcnMgPSAwKTogbnVtYmVyIHtcbiAgICBjb25zdCBzaWdtYSA9IGFpckRlbnNpdHkgLyBHUk9VTkRfQUlSX0RFTlNJVFk7XG4gICAgY29uc3QgbGFwc2UgPSBNYXRoLnBvdyhzaWdtYSwgMC43KTtcbiAgICBjb25zdCBvcHRpbXVtQWx0aXR1ZGUgPSAxMTAwMDsgLy8gbSwgfkZMMzYwIHRocnVzdC1saW1pdGVkIG9wdGltdW1cbiAgICBjb25zdCBhbHRQZW5hbHR5ID0gYWx0aXR1ZGVNZXRlcnMgPD0gb3B0aW11bUFsdGl0dWRlXG4gICAgICAgID8gMVxuICAgICAgICA6IE1hdGgubWF4KDAuMzUsIDEgLSAoYWx0aXR1ZGVNZXRlcnMgLSBvcHRpbXVtQWx0aXR1ZGUpIC8gOTAwMCk7XG4gICAgcmV0dXJuIGxhcHNlICogYWx0UGVuYWx0eTtcbn1cblxuY29uc3QgR0FNTUEgPSAxLjQ7XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlU3BlZWRPZlNvdW5kKGFsdGl0dWRlTWV0ZXJzOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IHRlbXBlcmF0dXJlID0gTWF0aC5tYXgoSVNBX1RST1BPUEFVU0VfVEVNUCwgSVNBX1NFQV9MRVZFTF9URU1QIC0gSVNBX0xBUFNFX1JBVEUgKiBhbHRpdHVkZU1ldGVycyk7XG4gICAgcmV0dXJuIE1hdGguc3FydChHQU1NQSAqIEdBU19DT05TVEFOVCAqIHRlbXBlcmF0dXJlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVNYWNoTnVtYmVyKHNwZWVkTXBzOiBudW1iZXIsIGFsdGl0dWRlTWV0ZXJzOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IHNwZWVkT2ZTb3VuZCA9IGNvbXB1dGVTcGVlZE9mU291bmQoYWx0aXR1ZGVNZXRlcnMpO1xuICAgIGlmIChzcGVlZE9mU291bmQgPD0gMCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgcmV0dXJuIHNwZWVkTXBzIC8gc3BlZWRPZlNvdW5kO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUR5bmFtaWNQcmVzc3VyZURyYWdQZW5hbHR5KHNwZWVkTXBzOiBudW1iZXIsIGFsdGl0dWRlTWV0ZXJzOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IHNwZWVkT2ZTb3VuZCA9IGNvbXB1dGVTcGVlZE9mU291bmQoYWx0aXR1ZGVNZXRlcnMpO1xuICAgIGlmIChzcGVlZE9mU291bmQgPD0gMCB8fCBzcGVlZE1wcyA8PSAwKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBjb25zdCBtYWNoID0gc3BlZWRNcHMgLyBzcGVlZE9mU291bmQ7XG4gICAgaWYgKG1hY2ggPD0gVk5FX01BQ0gpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGNvbnN0IGV4Y2VzcyA9IChtYWNoIC0gVk5FX01BQ0gpIC8gVk5FX01BQ0g7XG4gICAgcmV0dXJuIDAuNTUgKiBleGNlc3MgKiBleGNlc3M7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlTWF4RXF1aWxpYnJpdW1TcGVlZChcbiAgICBhaXJEZW5zaXR5OiBudW1iZXIsXG4gICAgdGhydXN0Rm9yY2U6IG51bWJlcixcbiAgICB3aW5nQXJlYTogbnVtYmVyLFxuICAgIGRyYWdDb2VmZmljaWVudDogbnVtYmVyLFxuKTogbnVtYmVyIHtcbiAgICBpZiAoYWlyRGVuc2l0eSA8PSAwIHx8IGRyYWdDb2VmZmljaWVudCA8PSAwIHx8IHRocnVzdEZvcmNlIDw9IDApIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIHJldHVybiBNYXRoLnNxcnQoMiAqIHRocnVzdEZvcmNlIC8gKGFpckRlbnNpdHkgKiB3aW5nQXJlYSAqIGRyYWdDb2VmZmljaWVudCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUFuZ2xlT2ZBdHRhY2soXG4gICAgZm9yd2FyZDogVEhSRUUuVmVjdG9yMyxcbiAgICByaWdodDogVEhSRUUuVmVjdG9yMyxcbiAgICB2ZWxvY2l0eTogVEhSRUUuVmVjdG9yMyxcbiAgICBzY3JhdGNoOiBUSFJFRS5WZWN0b3IzLFxuKTogbnVtYmVyIHtcbiAgICBjb25zdCBzcGVlZCA9IHZlbG9jaXR5Lmxlbmd0aCgpO1xuICAgIGlmIChzcGVlZCA8PSAxLjApIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgc2NyYXRjaC5jb3B5KHZlbG9jaXR5KS5tdWx0aXBseVNjYWxhcigxIC8gc3BlZWQpLnByb2plY3RPblBsYW5lKHJpZ2h0KTtcbiAgICBpZiAoc2NyYXRjaC5sZW5ndGhTcSgpIDw9IDFlLTYpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgc2NyYXRjaC5ub3JtYWxpemUoKTtcbiAgICBjb25zdCBhb2FBbmdsZSA9IHNjcmF0Y2guYW5nbGVUbyhmb3J3YXJkKTtcbiAgICBjb25zdCBhb2FTaWduID0gc2NyYXRjaC5jcm9zcyhmb3J3YXJkKS5kb3QocmlnaHQpID4gMCA/IC0xIDogMTtcbiAgICByZXR1cm4gYW9hU2lnbiAqIGFvYUFuZ2xlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUxvYWRGYWN0b3JHKGFjY2VsOiBUSFJFRS5WZWN0b3IzLCB1cDogVEhSRUUuVmVjdG9yMywgZ3Jhdml0eSA9IEdSQVZJVFkpOiBudW1iZXIge1xuICAgIHJldHVybiAoYWNjZWwueCAqIHVwLnggKyAoYWNjZWwueSArIGdyYXZpdHkpICogdXAueSArIGFjY2VsLnogKiB1cC56KSAvIGdyYXZpdHk7XG59XG4iLCIvKipcbiAqIEYxMDAtUFctMjI5IHRocm90dGxlIHF1YWRyYW50IGFuZCB0aHJ1c3Qgc2NoZWR1bGUgZm9yIEYtMTZDLlxuICogTGV2ZXIgWzAsIDFdIG1hcHMgdG8gMOKAkzEwMCU6IDA9TUlMIDIwJSwgOTg9TUlMIDEwMCUsIDk5PUFCMSwgMTAwPUFCMi5cbiAqL1xuaW1wb3J0IHsgY29tcHV0ZUFpckRlbnNpdHksIGNvbXB1dGVUaHJ1c3REZW5zaXR5RmFjdG9yIH0gZnJvbSAnLi9hZXJvVXRpbHMnO1xuaW1wb3J0IHsgRjE2X1BST0ZJTEUgfSBmcm9tICcuL2YxNlByb2ZpbGUnO1xuXG4vKiogRjEwMC1QVy0yMjkgc2VhLWxldmVsIHN0YXRpYyB0aHJ1c3QgKGtOKSwgVVNBRiAvIEphbmUncy4gKi9cbmV4cG9ydCBjb25zdCBGMTZfRU5HSU5FID0ge1xuICAgIC8qKiBGbGlnaHQgaWRsZSAoTUlMIDIwJSBvbiBxdWFkcmFudCkg4oCUIDAuNSBrTiBzZWEtbGV2ZWwgc3RhdGljLiAqL1xuICAgIGlkbGVUaHJ1c3RLbjogMC41LFxuICAgIG1pbFRocnVzdEtuOiA3Ni4zLFxuICAgIC8qKiBGaXJzdCBhZnRlcmJ1cm5lciBkZXRlbnQgKG1pbiBBQiAvIHpvbmUgNSkuICovXG4gICAgYWJNaW5UaHJ1c3RLbjogMTA0LjAsXG4gICAgYWJNYXhUaHJ1c3RLbjogRjE2X1BST0ZJTEUuYWJUaHJ1c3RLbixcbiAgICAvKiogTGV2ZXIgWzAsIDFdIGF0IDEwMCUgTUlMICg5OCBvbiBxdWFkcmFudCkuICovXG4gICAgbWlsTGV2ZXJFbmQ6IEYxNl9QUk9GSUxFLm1pbExldmVyRW5kLFxuICAgIC8qKiBMZXZlciBbMCwgMV0gYXQgQUIxIGRldGVudCAoOTkgb24gcXVhZHJhbnQpLiAqL1xuICAgIGFiTWluTGV2ZXJFbmQ6IEYxNl9QUk9GSUxFLmFiTWluTGV2ZXJFbmQsXG59IGFzIGNvbnN0O1xuXG5leHBvcnQgdHlwZSBGMTZUaHJvdHRsZVpvbmUgPSAnbWlsJyB8ICdhYi1taW4nIHwgJ2FiLW1heCc7XG5cbi8qKiBBZnRlcmJ1cm5lciBub3p6bGUgY29sb3JzIOKAlCBzb2xpZCwgbm8gYW5pbWF0aW9uLiAqL1xuZXhwb3J0IGNvbnN0IEYxNl9FTkdJTkVfTk9aWkxFX0NPTE9SUyA9IHtcbiAgICBtaWw6ICcjMGEwYTBhJyxcbiAgICBhYk1pbjogJyNmZjg4MDAnLFxuICAgIGFiTWF4OiAnI2ZmZmYwMCcsXG59IGFzIGNvbnN0O1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RjE2RW5naW5lTm96emxlQ29sb3IobGV2ZXI6IG51bWJlcik6IHN0cmluZyB7XG4gICAgY29uc3Qgem9uZSA9IGdldEYxNlRocm90dGxlWm9uZShsZXZlcik7XG4gICAgaWYgKHpvbmUgPT09ICdhYi1taW4nKSB7XG4gICAgICAgIHJldHVybiBGMTZfRU5HSU5FX05PWlpMRV9DT0xPUlMuYWJNaW47XG4gICAgfVxuICAgIGlmICh6b25lID09PSAnYWItbWF4Jykge1xuICAgICAgICByZXR1cm4gRjE2X0VOR0lORV9OT1paTEVfQ09MT1JTLmFiTWF4O1xuICAgIH1cbiAgICByZXR1cm4gRjE2X0VOR0lORV9OT1paTEVfQ09MT1JTLm1pbDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBGMTZBZnRlcmJ1cm5lckNvbmVEaXRoZXIge1xuICAgIHByaW1hcnk6IHN0cmluZztcbiAgICBzZWNvbmRhcnk6IHN0cmluZztcbn1cblxuLyoqIE9yYW5nZS95ZWxsb3cgY2hlY2tlcmJvYXJkIGRpdGhlciBmb3IgQUIgY29uZSBtZXNoZXM7IG51bGwgd2hlbiBNSUwgKGNvbmVzIGhpZGRlbikuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RjE2QWZ0ZXJidXJuZXJDb25lRGl0aGVyKGxldmVyOiBudW1iZXIpOiBGMTZBZnRlcmJ1cm5lckNvbmVEaXRoZXIgfCBudWxsIHtcbiAgICBjb25zdCB6b25lID0gZ2V0RjE2VGhyb3R0bGVab25lKGxldmVyKTtcbiAgICBpZiAoem9uZSA9PT0gJ2FiLW1pbicpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHByaW1hcnk6IEYxNl9FTkdJTkVfTk9aWkxFX0NPTE9SUy5hYk1pbixcbiAgICAgICAgICAgIHNlY29uZGFyeTogRjE2X0VOR0lORV9OT1paTEVfQ09MT1JTLmFiTWF4LFxuICAgICAgICB9O1xuICAgIH1cbiAgICBpZiAoem9uZSA9PT0gJ2FiLW1heCcpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHByaW1hcnk6IEYxNl9FTkdJTkVfTk9aWkxFX0NPTE9SUy5hYk1heCxcbiAgICAgICAgICAgIHNlY29uZGFyeTogRjE2X0VOR0lORV9OT1paTEVfQ09MT1JTLmFiTWluLFxuICAgICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRjE2QWZ0ZXJidXJuZXJBY3RpdmUobGV2ZXI6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIHJldHVybiBnZXRGMTZUaHJvdHRsZVpvbmUobGV2ZXIpICE9PSAnbWlsJztcbn1cblxuZXhwb3J0IGNvbnN0IEYxNl9BRlRFUkJVUk5FUl9DT05FX0xFTkdUSF9NID0ge1xuICAgIG1pbDogMCxcbiAgICBhYk1pbjogNCxcbiAgICBhYk1heDogNyxcbn0gYXMgY29uc3Q7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRGMTZBZnRlcmJ1cm5lckNvbmVMZW5ndGhNKGxldmVyOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IHpvbmUgPSBnZXRGMTZUaHJvdHRsZVpvbmUobGV2ZXIpO1xuICAgIGlmICh6b25lID09PSAnYWItbWluJykge1xuICAgICAgICByZXR1cm4gRjE2X0FGVEVSQlVSTkVSX0NPTkVfTEVOR1RIX00uYWJNaW47XG4gICAgfVxuICAgIGlmICh6b25lID09PSAnYWItbWF4Jykge1xuICAgICAgICByZXR1cm4gRjE2X0FGVEVSQlVSTkVSX0NPTkVfTEVOR1RIX00uYWJNYXg7XG4gICAgfVxuICAgIHJldHVybiBGMTZfQUZURVJCVVJORVJfQ09ORV9MRU5HVEhfTS5taWw7XG59XG5cbi8qKiBMZXZlciBbMCwgMV0gYXMgMOKAkzEwMCB0aHJvdHRsZSBxdWFkcmFudCBwb3NpdGlvbi4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsZXZlclRvUGVyY2VudChsZXZlcjogbnVtYmVyKTogbnVtYmVyIHtcbiAgICByZXR1cm4gY2xhbXBMZXZlcihsZXZlcikgKiAxMDA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0YxNkFiRGV0ZW50QmFuZChsZXZlcjogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGxldmVyVG9QZXJjZW50KGxldmVyKSA+PSA5ODtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEYxNlRocm90dGxlWm9uZShsZXZlcjogbnVtYmVyKTogRjE2VGhyb3R0bGVab25lIHtcbiAgICBjb25zdCBwY3QgPSBsZXZlclRvUGVyY2VudChsZXZlcik7XG4gICAgaWYgKHBjdCA8IDk5KSB7XG4gICAgICAgIHJldHVybiAnbWlsJztcbiAgICB9XG4gICAgaWYgKHBjdCA8IDEwMCkge1xuICAgICAgICByZXR1cm4gJ2FiLW1pbic7XG4gICAgfVxuICAgIHJldHVybiAnYWItbWF4Jztcbn1cblxuLyoqIFNlYS1sZXZlbCByYXRlZCB0aHJ1c3QgKGtOKSBmb3IgbGV2ZXIgcG9zaXRpb24sIGJlZm9yZSBhbHRpdHVkZSBsYXBzZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlRjE2U2xUaHJ1c3RLbihsZXZlcjogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBjb25zdCBwY3QgPSBsZXZlclRvUGVyY2VudChsZXZlcik7XG4gICAgY29uc3QgeyBpZGxlVGhydXN0S24sIG1pbFRocnVzdEtuLCBhYk1pblRocnVzdEtuLCBhYk1heFRocnVzdEtuIH0gPSBGMTZfRU5HSU5FO1xuXG4gICAgaWYgKHBjdCA8PSA5OCkge1xuICAgICAgICBjb25zdCBtaWxGcmFjdGlvbiA9IHBjdCAvIDk4O1xuICAgICAgICByZXR1cm4gaWRsZVRocnVzdEtuICsgKG1pbFRocnVzdEtuIC0gaWRsZVRocnVzdEtuKSAqIG1pbEZyYWN0aW9uO1xuICAgIH1cbiAgICBpZiAocGN0IDwgOTkpIHtcbiAgICAgICAgcmV0dXJuIG1pbFRocnVzdEtuO1xuICAgIH1cbiAgICBpZiAocGN0ID49IDEwMCkge1xuICAgICAgICByZXR1cm4gYWJNYXhUaHJ1c3RLbjtcbiAgICB9XG4gICAgcmV0dXJuIGFiTWluVGhydXN0S247XG59XG5cbi8qKiBEZWxpdmVyZWQgZW5naW5lIHRocnVzdCAoTikgYXQgYWx0aXR1ZGUgd2l0aCBJU0EgdHVyYm9mYW4gbGFwc2UuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUYxNkVuZ2luZVRocnVzdE4obGV2ZXI6IG51bWJlciwgYWx0aXR1ZGVNZXRlcnM6IG51bWJlcik6IG51bWJlciB7XG4gICAgY29uc3Qgc2xLbiA9IGNvbXB1dGVGMTZTbFRocnVzdEtuKGxldmVyKTtcbiAgICBjb25zdCByaG8gPSBjb21wdXRlQWlyRGVuc2l0eShhbHRpdHVkZU1ldGVycyk7XG4gICAgY29uc3QgZmFjdG9yID0gY29tcHV0ZVRocnVzdERlbnNpdHlGYWN0b3IocmhvLCBhbHRpdHVkZU1ldGVycyk7XG4gICAgcmV0dXJuIHNsS24gKiAxMDAwICogZmFjdG9yO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUYxNkVuZ2luZVRocnVzdEtuKGxldmVyOiBudW1iZXIsIGFsdGl0dWRlTWV0ZXJzOiBudW1iZXIpOiBudW1iZXIge1xuICAgIHJldHVybiBjb21wdXRlRjE2RW5naW5lVGhydXN0TihsZXZlciwgYWx0aXR1ZGVNZXRlcnMpIC8gMTAwMDtcbn1cblxuLyoqIEhVRCBsYWJlbDogTUlMIDIw4oCTMTAwJSDihpIgQUIxIOKGkiBBQjIuICovXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0RjE2VGhyb3R0bGVIdWQobGV2ZXI6IG51bWJlcik6IHN0cmluZyB7XG4gICAgY29uc3QgcGN0ID0gbGV2ZXJUb1BlcmNlbnQobGV2ZXIpO1xuICAgIGNvbnN0IHpvbmUgPSBnZXRGMTZUaHJvdHRsZVpvbmUobGV2ZXIpO1xuXG4gICAgaWYgKHpvbmUgPT09ICdtaWwnKSB7XG4gICAgICAgIGlmIChwY3QgPiA5OCkge1xuICAgICAgICAgICAgcmV0dXJuICdNSUwgMTAwJztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtaWxQY3QgPSBNYXRoLnJvdW5kKDIwICsgKHBjdCAvIDk4KSAqIDgwKTtcbiAgICAgICAgcmV0dXJuIGBNSUwgJHttaWxQY3R9YDtcbiAgICB9XG4gICAgaWYgKHpvbmUgPT09ICdhYi1taW4nKSB7XG4gICAgICAgIHJldHVybiAnQUIxJztcbiAgICB9XG4gICAgcmV0dXJuICdBQjInO1xufVxuXG4vKiogTWFwIGxldmVyIHRvIFswLCAxXSBmb3IgZW5naW5lIGF1ZGlvIChpZGxl4oaSbWls4oaSZnVsbCBBQikuICovXG5leHBvcnQgZnVuY3Rpb24gZjE2VGhyb3R0bGVBdWRpb0xldmVsKGxldmVyOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IHNsS24gPSBjb21wdXRlRjE2U2xUaHJ1c3RLbihsZXZlcik7XG4gICAgY29uc3QgeyBpZGxlVGhydXN0S24sIGFiTWF4VGhydXN0S24gfSA9IEYxNl9FTkdJTkU7XG4gICAgaWYgKGFiTWF4VGhydXN0S24gPD0gaWRsZVRocnVzdEtuKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICByZXR1cm4gY2xhbXBMZXZlcigoc2xLbiAtIGlkbGVUaHJ1c3RLbikgLyAoYWJNYXhUaHJ1c3RLbiAtIGlkbGVUaHJ1c3RLbikpO1xufVxuXG4vKiogQ29udGludW91cyBNSUwgcmFtcCBmb3IgaGVsZCBrZXlib2FyZCBpbnB1dCBiZWxvdyB0aGUgTUlMIHN0b3AuICovXG5leHBvcnQgZnVuY3Rpb24gYWRqdXN0RjE2VGhyb3R0bGVJbnB1dChsZXZlcjogbnVtYmVyLCBzdGVwOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IGN1cnJlbnQgPSBjbGFtcExldmVyKGxldmVyKTtcbiAgICBpZiAoc3RlcCA+IDApIHtcbiAgICAgICAgcmV0dXJuIHJhbXBGMTZUaHJvdHRsZVVwKGN1cnJlbnQsIHN0ZXApO1xuICAgIH1cbiAgICBpZiAoc3RlcCA8IDApIHtcbiAgICAgICAgcmV0dXJuIHJhbXBGMTZUaHJvdHRsZURvd24oY3VycmVudCwgLXN0ZXApO1xuICAgIH1cbiAgICByZXR1cm4gY3VycmVudDtcbn1cblxuLyoqIE9uZSBkZXRlbnQgcGVyIGtleSBwcmVzczogTUlMIDEwMCDihpIgQUIxIOKGkiBBQjIgKGFuZCByZXZlcnNlKS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdGVwRjE2VGhyb3R0bGVEZXRlbnQobGV2ZXI6IG51bWJlciwgZGlyZWN0aW9uOiAxIHwgLTEpOiBudW1iZXIge1xuICAgIGNvbnN0IHBjdCA9IGxldmVyVG9QZXJjZW50KGxldmVyKTtcbiAgICBpZiAoZGlyZWN0aW9uID4gMCkge1xuICAgICAgICBpZiAocGN0ID49IDk5KSB7XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocGN0ID49IDk4KSB7XG4gICAgICAgICAgICByZXR1cm4gRjE2X0VOR0lORS5hYk1pbkxldmVyRW5kO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBsZXZlcjtcbiAgICB9XG4gICAgaWYgKHBjdCA+PSAxMDApIHtcbiAgICAgICAgcmV0dXJuIEYxNl9FTkdJTkUuYWJNaW5MZXZlckVuZDtcbiAgICB9XG4gICAgaWYgKHBjdCA+PSA5OSkge1xuICAgICAgICByZXR1cm4gRjE2X0VOR0lORS5taWxMZXZlckVuZDtcbiAgICB9XG4gICAgcmV0dXJuIGxldmVyO1xufVxuXG5mdW5jdGlvbiByYW1wRjE2VGhyb3R0bGVVcChsZXZlcjogbnVtYmVyLCBzdGVwOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IHRhcmdldCA9IGxldmVyICsgc3RlcDtcbiAgICBpZiAodGFyZ2V0ID49IEYxNl9FTkdJTkUubWlsTGV2ZXJFbmQpIHtcbiAgICAgICAgcmV0dXJuIEYxNl9FTkdJTkUubWlsTGV2ZXJFbmQ7XG4gICAgfVxuICAgIHJldHVybiBjbGFtcExldmVyKHRhcmdldCk7XG59XG5cbmZ1bmN0aW9uIHJhbXBGMTZUaHJvdHRsZURvd24obGV2ZXI6IG51bWJlciwgc3RlcDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBjb25zdCBwY3QgPSBsZXZlclRvUGVyY2VudChsZXZlcik7XG4gICAgaWYgKHBjdCA+IDk4KSB7XG4gICAgICAgIHJldHVybiBGMTZfRU5HSU5FLm1pbExldmVyRW5kO1xuICAgIH1cbiAgICByZXR1cm4gY2xhbXBMZXZlcihsZXZlciAtIHN0ZXApO1xufVxuXG5mdW5jdGlvbiBjbGFtcExldmVyKGxldmVyOiBudW1iZXIpOiBudW1iZXIge1xuICAgIHJldHVybiBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCBsZXZlcikpO1xufVxuIiwiLyoqXG4gKiBGLTE2QyBhZXJvZHluYW1pYyBkYXRhIGZyb206XG4gKiBSZWhtYW4sIFwiQWVyb2R5bmFtaWMgUGVyZm9ybWFuY2UgQW5hbHlzaXMgb2YgRi0xNkMgRmlnaHRpbmcgRmFsY29uXCIgKE5VU1QpLlxuICogQ2hhcnQgcmVmZXJlbmNlcyBjb21wdXRlZCB3aXRoIEFuZGVyc29uIElTQSArIHBhcGVyIEVxLiAoMuKAkzUpLCBr4oKCID0gMC5cbiAqL1xuXG5leHBvcnQgY29uc3QgRjE2X1BBUEVSX0FOQUxZVElDQUwgPSB7XG4gICAgLyoqIEVxLiAoMik6IENEMCA9IENmZSAqIFN3ZXQgLyBTcmVmICovXG4gICAgY2QwOiAwLjAxOCxcbiAgICAvKiogRXEuICgz4oCTNSk6IENEaSA9IEsgKiBDTMKyICovXG4gICAgaW5kdWNlZERyYWdLOiAwLjE0ODksXG4gICAgY2wwOiAwLjIsXG4gICAgLyoqIE5BQ0EgNjRBMjA0LCBwZXIgcmFkaWFuICovXG4gICAgY2xBbHBoYVBlclJhZDogNS43MyxcbiAgICAvKiogRmlnLiA3IHBlYWsgKi9cbiAgICBtYXhMaWZ0VG9EcmFnOiA5LjY2LFxuICAgIG1heExpZnRUb0RyYWdBbHBoYURlZzogMixcbiAgICAvKiogRmlnLiA5ICovXG4gICAgbWluR2xpZGVBbmdsZURlZzogNS45MSxcbiAgICAvKiogU2VjdGlvbiBJSUkgYXNzdW1wdGlvbnMg4oCUIGNydWlzZSBhdCBNVE9XICovXG4gICAgY3J1aXNlVmVsb2NpdHlGcHM6IDg0NixcbiAgICBjcnVpc2VBbHRpdHVkZUZ0OiAzMDAwMCxcbiAgICAvKiogSmFuZSdzIC8gbGl0ZXJhdHVyZSBzZXJ2aWNlIGNlaWxpbmcgKi9cbiAgICBzZXJ2aWNlQ2VpbGluZ0Z0OiA1MDAwMCxcbiAgICB3aW5nQXJlYUZ0MjogMzAwLFxuICAgIG10b3dMYjogNDIwMDAsXG59IGFzIGNvbnN0O1xuXG4vKiogT3BlblZTUCAvIFZTUEFlcm8gcmVzdWx0cyBjaXRlZCBpbiBTZWN0aW9uIElWLkIuICovXG5leHBvcnQgY29uc3QgRjE2X1BBUEVSX1ZTUEFFUk8gPSB7XG4gICAgY2QwOiAwLjAxMjQsXG4gICAgY2xBbHBoYVBlclJhZDogMy42MixcbiAgICAvKiogRGVyaXZlZCBmcm9tIEwvRCBtYXggPSAxNCBhdCDOsSDiiYggNMKwIHdpdGggQ0zigoAgPSAwLjIuICovXG4gICAgaW5kdWNlZERyYWdLOiAwLjA5NzMsXG4gICAgbWF4TGlmdFRvRHJhZzogMTQsXG4gICAgbWF4TGlmdFRvRHJhZ0FscGhhRGVnOiA0LFxufSBhcyBjb25zdDtcblxuZXhwb3J0IHR5cGUgRjE2UGFwZXJNZXRyaWMgPVxuICAgIHwgJ2xpZnRUb0RyYWcnXG4gICAgfCAnbWluR2xpZGVBbmdsZURlZydcbiAgICB8ICd0aHJ1c3RSZXF1aXJlZExiJ1xuICAgIHwgJ3RvdGFsRHJhZ0xiJ1xuICAgIHwgJ21pblRvdGFsRHJhZ0xiJ1xuICAgIHwgJ2NydWlzZVNwZWVkRnBzJ1xuICAgIHwgJ2NkMCdcbiAgICB8ICdjbEFscGhhUGVyUmFkJ1xuICAgIHwgJ3ZNaW5EcmFnRnBzJztcblxuZXhwb3J0IGludGVyZmFjZSBGMTZQYXBlckNoYXJ0Q2FzZSB7XG4gICAgaWQ6IHN0cmluZztcbiAgICBmaWd1cmU6IHN0cmluZztcbiAgICBkZXNjcmlwdGlvbjogc3RyaW5nO1xuICAgIG1ldHJpYzogRjE2UGFwZXJNZXRyaWM7XG4gICAgLyoqIEFuZ2xlIG9mIGF0dGFjayBmb3IgTC9EIGNhc2VzIChkZWdyZWVzKS4gKi9cbiAgICBhbHBoYURlZz86IG51bWJlcjtcbiAgICBhbHRpdHVkZUZ0OiBudW1iZXI7XG4gICAgd2VpZ2h0TGI6IG51bWJlcjtcbiAgICB2ZWxvY2l0eUZwczogbnVtYmVyO1xuICAgIHJlZmVyZW5jZTogbnVtYmVyO1xuICAgIHRvbGVyYW5jZTogbnVtYmVyO1xufVxuXG4vKipcbiAqIENoYXJ0IGNoZWNrcG9pbnRzIGZyb20gRmlncy4gNywgOSwgMTDigJMxMiwgMTbigJMxNy5cbiAqIERyYWcvdGhydXN0IHJlZmVyZW5jZXM6IElTQSArIHBhcGVyIHBvbGFyIGF0IHN0YXRlZCBWLCBoLCBXIChNQVRMQUIgbWV0aG9kb2xvZ3kpLlxuICovXG5leHBvcnQgY29uc3QgRjE2X1BBUEVSX0NIQVJUX0NBU0VTOiBGMTZQYXBlckNoYXJ0Q2FzZVtdID0gW1xuICAgIHtcbiAgICAgICAgaWQ6ICdmaWc3X2xkX21heCcsXG4gICAgICAgIGZpZ3VyZTogJ0ZpZy4gNycsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTWF4aW11bSBsaWZ0LXRvLWRyYWcgcmF0aW8nLFxuICAgICAgICBtZXRyaWM6ICdsaWZ0VG9EcmFnJyxcbiAgICAgICAgYWxwaGFEZWc6IDIsXG4gICAgICAgIGFsdGl0dWRlRnQ6IDAsXG4gICAgICAgIHdlaWdodExiOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5tdG93TGIsXG4gICAgICAgIHZlbG9jaXR5RnBzOiAwLFxuICAgICAgICByZWZlcmVuY2U6IDkuNjYsXG4gICAgICAgIHRvbGVyYW5jZTogMC4xNSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6ICdmaWc5X21pbl9nbGlkZScsXG4gICAgICAgIGZpZ3VyZTogJ0ZpZy4gOScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTWluaW11bSBnbGlkZSBhbmdsZScsXG4gICAgICAgIG1ldHJpYzogJ21pbkdsaWRlQW5nbGVEZWcnLFxuICAgICAgICBhbHRpdHVkZUZ0OiAzMDAwMCxcbiAgICAgICAgd2VpZ2h0TGI6IEYxNl9QQVBFUl9BTkFMWVRJQ0FMLm10b3dMYixcbiAgICAgICAgdmVsb2NpdHlGcHM6IDAsXG4gICAgICAgIHJlZmVyZW5jZTogNS45MSxcbiAgICAgICAgdG9sZXJhbmNlOiAwLjEsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGlkOiAnZmlnMTBfbWluX2RyYWdfMjBrJyxcbiAgICAgICAgZmlndXJlOiAnRmlnLiAxMCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTWluaW11bSB0b3RhbCBkcmFnIGF0IDIwLDAwMCBmdCAoTVRPVyknLFxuICAgICAgICBtZXRyaWM6ICdtaW5Ub3RhbERyYWdMYicsXG4gICAgICAgIGFsdGl0dWRlRnQ6IDIwMDAwLFxuICAgICAgICB3ZWlnaHRMYjogRjE2X1BBUEVSX0FOQUxZVElDQUwubXRvd0xiLFxuICAgICAgICB2ZWxvY2l0eUZwczogNzk3LFxuICAgICAgICByZWZlcmVuY2U6IDQzNDguNzQsXG4gICAgICAgIHRvbGVyYW5jZTogNTAsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGlkOiAnZmlnMTBfZHJhZ183NTBmcHMnLFxuICAgICAgICBmaWd1cmU6ICdGaWcuIDEwJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdUb3RhbCBkcmFnIGF0IDc1MCBmdC9zLCAyMCwwMDAgZnQgKE1UT1cpJyxcbiAgICAgICAgbWV0cmljOiAndG90YWxEcmFnTGInLFxuICAgICAgICBhbHRpdHVkZUZ0OiAyMDAwMCxcbiAgICAgICAgd2VpZ2h0TGI6IEYxNl9QQVBFUl9BTkFMWVRJQ0FMLm10b3dMYixcbiAgICAgICAgdmVsb2NpdHlGcHM6IDc1MCxcbiAgICAgICAgcmVmZXJlbmNlOiA0MzgxLjUwLFxuICAgICAgICB0b2xlcmFuY2U6IDUwLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2ZpZzExX21pbl9kcmFnXzMwaycsXG4gICAgICAgIGZpZ3VyZTogJ0ZpZy4gMTEnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ01pbmltdW0gdG90YWwgZHJhZyBhdCAzMCwwMDAgZnQgKE1UT1cpJyxcbiAgICAgICAgbWV0cmljOiAnbWluVG90YWxEcmFnTGInLFxuICAgICAgICBhbHRpdHVkZUZ0OiAzMDAwMCxcbiAgICAgICAgd2VpZ2h0TGI6IEYxNl9QQVBFUl9BTkFMWVRJQ0FMLm10b3dMYixcbiAgICAgICAgdmVsb2NpdHlGcHM6IDk1MixcbiAgICAgICAgcmVmZXJlbmNlOiA0MzQ4Ljc0LFxuICAgICAgICB0b2xlcmFuY2U6IDUwLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2ZpZzExX2RyYWdfOTAwZnBzJyxcbiAgICAgICAgZmlndXJlOiAnRmlnLiAxMScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnVG90YWwgZHJhZyBhdCA5MDAgZnQvcywgMzAsMDAwIGZ0IChNVE9XKScsXG4gICAgICAgIG1ldHJpYzogJ3RvdGFsRHJhZ0xiJyxcbiAgICAgICAgYWx0aXR1ZGVGdDogMzAwMDAsXG4gICAgICAgIHdlaWdodExiOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5tdG93TGIsXG4gICAgICAgIHZlbG9jaXR5RnBzOiA5MDAsXG4gICAgICAgIHJlZmVyZW5jZTogNDM3NS44NCxcbiAgICAgICAgdG9sZXJhbmNlOiA1MCxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6ICdmaWcxMl9taW5fZHJhZ180MGsnLFxuICAgICAgICBmaWd1cmU6ICdGaWcuIDEyJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdNaW5pbXVtIHRvdGFsIGRyYWcgYXQgNDAsMDAwIGZ0IChNVE9XKScsXG4gICAgICAgIG1ldHJpYzogJ21pblRvdGFsRHJhZ0xiJyxcbiAgICAgICAgYWx0aXR1ZGVGdDogNDAwMDAsXG4gICAgICAgIHdlaWdodExiOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5tdG93TGIsXG4gICAgICAgIHZlbG9jaXR5RnBzOiAxMTczLFxuICAgICAgICByZWZlcmVuY2U6IDQzNDguNzMsXG4gICAgICAgIHRvbGVyYW5jZTogNTAsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGlkOiAnZmlnMTJfZHJhZ18xMDAwZnBzJyxcbiAgICAgICAgZmlndXJlOiAnRmlnLiAxMicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnVG90YWwgZHJhZyBhdCAxLDAwMCBmdC9zLCA0MCwwMDAgZnQgKE1UT1cpJyxcbiAgICAgICAgbWV0cmljOiAndG90YWxEcmFnTGInLFxuICAgICAgICBhbHRpdHVkZUZ0OiA0MDAwMCxcbiAgICAgICAgd2VpZ2h0TGI6IEYxNl9QQVBFUl9BTkFMWVRJQ0FMLm10b3dMYixcbiAgICAgICAgdmVsb2NpdHlGcHM6IDEwMDAsXG4gICAgICAgIHJlZmVyZW5jZTogNDU3Mi41MyxcbiAgICAgICAgdG9sZXJhbmNlOiA1MCxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6ICdmaWcxNl90cl9taW5fMzVrbGInLFxuICAgICAgICBmaWd1cmU6ICdGaWcuIDE2JyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdNaW5pbXVtIHRocnVzdCByZXF1aXJlZCBhdCAzNSwwMDAgbGIgKDMwLDAwMCBmdCknLFxuICAgICAgICBtZXRyaWM6ICd0aHJ1c3RSZXF1aXJlZExiJyxcbiAgICAgICAgYWx0aXR1ZGVGdDogMzAwMDAsXG4gICAgICAgIHdlaWdodExiOiAzNTAwMCxcbiAgICAgICAgdmVsb2NpdHlGcHM6IDg3MCxcbiAgICAgICAgcmVmZXJlbmNlOiAzNjIzLjk2LFxuICAgICAgICB0b2xlcmFuY2U6IDUwLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2ZpZzE2X3RyXzM1a2xiXzkwMGZwcycsXG4gICAgICAgIGZpZ3VyZTogJ0ZpZy4gMTYnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1RocnVzdCByZXF1aXJlZCBhdCAzNSwwMDAgbGIsIDkwMCBmdC9zICgzMCwwMDAgZnQpJyxcbiAgICAgICAgbWV0cmljOiAndGhydXN0UmVxdWlyZWRMYicsXG4gICAgICAgIGFsdGl0dWRlRnQ6IDMwMDAwLFxuICAgICAgICB3ZWlnaHRMYjogMzUwMDAsXG4gICAgICAgIHZlbG9jaXR5RnBzOiA5MDAsXG4gICAgICAgIHJlZmVyZW5jZTogMzYzMy4wMSxcbiAgICAgICAgdG9sZXJhbmNlOiA1MCxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6ICdmaWcxNl90cl8zNWtsYl8xMDAwZnBzJyxcbiAgICAgICAgZmlndXJlOiAnRmlnLiAxNicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnVGhydXN0IHJlcXVpcmVkIGF0IDM1LDAwMCBsYiwgMSwwMDAgZnQvcyAoMzAsMDAwIGZ0KScsXG4gICAgICAgIG1ldHJpYzogJ3RocnVzdFJlcXVpcmVkTGInLFxuICAgICAgICBhbHRpdHVkZUZ0OiAzMDAwMCxcbiAgICAgICAgd2VpZ2h0TGI6IDM1MDAwLFxuICAgICAgICB2ZWxvY2l0eUZwczogMTAwMCxcbiAgICAgICAgcmVmZXJlbmNlOiAzNzY4LjQzLFxuICAgICAgICB0b2xlcmFuY2U6IDUwLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2ZpZzE3X3RyX21pbl8yMGsnLFxuICAgICAgICBmaWd1cmU6ICdGaWcuIDE3JyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdNaW5pbXVtIHRocnVzdCByZXF1aXJlZCBhdCAyMCwwMDAgZnQgKE1UT1cpJyxcbiAgICAgICAgbWV0cmljOiAndGhydXN0UmVxdWlyZWRMYicsXG4gICAgICAgIGFsdGl0dWRlRnQ6IDIwMDAwLFxuICAgICAgICB3ZWlnaHRMYjogRjE2X1BBUEVSX0FOQUxZVElDQUwubXRvd0xiLFxuICAgICAgICB2ZWxvY2l0eUZwczogNzk3LFxuICAgICAgICByZWZlcmVuY2U6IDQzNDguNzQsXG4gICAgICAgIHRvbGVyYW5jZTogNTAsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGlkOiAnZmlnMTdfdHJfbWluXzMwaycsXG4gICAgICAgIGZpZ3VyZTogJ0ZpZy4gMTcnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1RocnVzdCByZXF1aXJlZCBhdCAxLDAwMCBmdC9zLCAzMCwwMDAgZnQgKE1UT1cpJyxcbiAgICAgICAgbWV0cmljOiAndGhydXN0UmVxdWlyZWRMYicsXG4gICAgICAgIGFsdGl0dWRlRnQ6IDMwMDAwLFxuICAgICAgICB3ZWlnaHRMYjogRjE2X1BBUEVSX0FOQUxZVElDQUwubXRvd0xiLFxuICAgICAgICB2ZWxvY2l0eUZwczogMTAwMCxcbiAgICAgICAgcmVmZXJlbmNlOiA0MzcwLjEyLFxuICAgICAgICB0b2xlcmFuY2U6IDUwLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2ZpZzE3X3RyXzExNTBmcHNfNDBrJyxcbiAgICAgICAgZmlndXJlOiAnRmlnLiAxNycsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnVGhydXN0IHJlcXVpcmVkIGF0IDEsMTUwIGZ0L3MsIDQwLDAwMCBmdCAoTVRPVyknLFxuICAgICAgICBtZXRyaWM6ICd0aHJ1c3RSZXF1aXJlZExiJyxcbiAgICAgICAgYWx0aXR1ZGVGdDogNDAwMDAsXG4gICAgICAgIHdlaWdodExiOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5tdG93TGIsXG4gICAgICAgIHZlbG9jaXR5RnBzOiAxMTUwLFxuICAgICAgICByZWZlcmVuY2U6IDQzNTIuMjAsXG4gICAgICAgIHRvbGVyYW5jZTogNTAsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGlkOiAnYXNzdW1wdGlvbl9jcnVpc2Vfc3BlZWQnLFxuICAgICAgICBmaWd1cmU6ICdTZWN0aW9uIElJSScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQ3J1aXNlIHZlbG9jaXR5IGF0IDMwLDAwMCBmdCAoTVRPVyknLFxuICAgICAgICBtZXRyaWM6ICdjcnVpc2VTcGVlZEZwcycsXG4gICAgICAgIGFsdGl0dWRlRnQ6IEYxNl9QQVBFUl9BTkFMWVRJQ0FMLmNydWlzZUFsdGl0dWRlRnQsXG4gICAgICAgIHdlaWdodExiOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5tdG93TGIsXG4gICAgICAgIHZlbG9jaXR5RnBzOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5jcnVpc2VWZWxvY2l0eUZwcyxcbiAgICAgICAgcmVmZXJlbmNlOiA4NDYsXG4gICAgICAgIHRvbGVyYW5jZTogMC41LFxuICAgIH0sXG5dO1xuXG4vKiogVlNQQWVybyBjaGFydCBjaGVja3BvaW50cyAoRmlncy4gMTjigJMyMCkuICovXG5leHBvcnQgY29uc3QgRjE2X1BBUEVSX1ZTUEFFUk9fQ0FTRVM6IEYxNlBhcGVyQ2hhcnRDYXNlW10gPSBbXG4gICAge1xuICAgICAgICBpZDogJ2ZpZzIwX2xkX21heF92c3BhZXJvJyxcbiAgICAgICAgZmlndXJlOiAnRmlnLiAyMCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnVlNQQWVybyBtYXhpbXVtIEwvRCcsXG4gICAgICAgIG1ldHJpYzogJ2xpZnRUb0RyYWcnLFxuICAgICAgICBhbHBoYURlZzogNCxcbiAgICAgICAgYWx0aXR1ZGVGdDogMCxcbiAgICAgICAgd2VpZ2h0TGI6IEYxNl9QQVBFUl9BTkFMWVRJQ0FMLm10b3dMYixcbiAgICAgICAgdmVsb2NpdHlGcHM6IDAsXG4gICAgICAgIHJlZmVyZW5jZTogMTQsXG4gICAgICAgIHRvbGVyYW5jZTogMC4xNSxcbiAgICB9LFxuXTtcblxuZXhwb3J0IGNvbnN0IEZUX1RPX00gPSAwLjMwNDg7XG5leHBvcnQgY29uc3QgRlBTX1RPX01QUyA9IEZUX1RPX007XG5leHBvcnQgY29uc3QgTEJfVE9fTiA9IDQuNDQ4MjIxNjE1MztcbmV4cG9ydCBjb25zdCBMQl9UT19LRyA9IDAuNDUzNTkyMzc7XG4iLCIvKipcbiAqIEYtMTZDIHNpbSBwcm9maWxlIGFuZCByZWZlcmVuY2UgZGF0YS5cbiAqIEFuYWx5dGljYWwgYWVybzogUmVobWFuLCBcIkFlcm9keW5hbWljIFBlcmZvcm1hbmNlIEFuYWx5c2lzIG9mIEYtMTZDIEZpZ2h0aW5nIEZhbGNvblwiLlxuICogUGVyZm9ybWFuY2UgZW52ZWxvcGU6IFVTQUYgZmFjdCBzaGVldCAvIEphbmUncy5cbiAqL1xuaW1wb3J0IHsgRjE2X1BBUEVSX0FOQUxZVElDQUwgfSBmcm9tICcuL2YxNlBhcGVyRGF0YSc7XG5cbmV4cG9ydCBjb25zdCBGMTZfUFJPRklMRSA9IHtcbiAgICAvKiogTVRPVyBmb3IgcGFwZXIvZW52ZWxvcGUgYW5hbHlzaXMgKH40MiwwMDAgbGIpLiAqL1xuICAgIGNvbWJhdE1hc3NLZzogMTkwNTEsXG4gICAgLyoqIFR5cGljYWwgdGFrZW9mZiBncm9zcyB3ZWlnaHQgZm9yIHNpbSBkeW5hbWljcyAofjMwLDAwMCBsYikuICovXG4gICAgc2ltTWFzc0tnOiAxMzYwOCxcbiAgICB3aW5nQXJlYU0yOiAyNy44NyxcbiAgICB3aW5nU3Bhbk06IDkuNDUsXG4gICAgY2QwOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5jZDAsXG4gICAgaW5kdWNlZERyYWdLOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5pbmR1Y2VkRHJhZ0ssXG4gICAgY2wwOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5jbDAsXG4gICAgY2xBbHBoYVBlclJhZDogRjE2X1BBUEVSX0FOQUxZVElDQUwuY2xBbHBoYVBlclJhZCxcbiAgICBhYlRocnVzdEtuOiAxMjkuNCxcbiAgICBtaWxUaHJ1c3RLbjogNzYuMyxcbiAgICAvKiogTGV2ZXIgYXQgMTAwJSBtaWxpdGFyeSBwb3dlciAoOTggb24gMOKAkzEwMCBxdWFkcmFudCkuICovXG4gICAgbWlsTGV2ZXJFbmQ6IDAuOTgsXG4gICAgLyoqIExldmVyIGF0IEFCMSBkZXRlbnQgKDk5IG9uIDDigJMxMDAgcXVhZHJhbnQpLiAqL1xuICAgIGFiTWluTGV2ZXJFbmQ6IDAuOTksXG4gICAgbWluRmx5aW5nU3BlZWRNcHM6IDY4LFxuICAgIHN0YWxsQW9hRGVnOiAyMixcbiAgICBzZXJ2aWNlQ2VpbGluZ006IEYxNl9QQVBFUl9BTkFMWVRJQ0FMLnNlcnZpY2VDZWlsaW5nRnQgKiAwLjMwNDgsXG4gICAgY3J1aXNlQWx0aXR1ZGVNOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5jcnVpc2VBbHRpdHVkZUZ0ICogMC4zMDQ4LFxuICAgIGNydWlzZVNwZWVkTXBzOiBGMTZfUEFQRVJfQU5BTFlUSUNBTC5jcnVpc2VWZWxvY2l0eUZwcyAqIDAuMzA0OCxcbiAgICAvKiogQ2F0IEkgY2xlYW4tc2hpcCBGQlcgcm9sbC1yYXRlIGNhcCAoZGVnL3MpLiAqL1xuICAgIG1heFJvbGxSYXRlRGVnUzogMzAwLFxuICAgIC8qKiBDYXQgSUlJIGhlYXZ5IHN0b3JlcyByb2xsLXJhdGUgY2FwIChkZWcvcykuICovXG4gICAgY2F0M01heFJvbGxSYXRlRGVnUzogMTgwLFxuICAgIC8qKiBGQlcgcG9zaXRpdmUgc3RydWN0dXJhbCBnIGxpbWl0IChDYXQgSSkuICovXG4gICAgbWF4TG9hZEZhY3Rvckc6IDkuNSxcbiAgICAvKiogVGFrZW9mZiByb3RhdGlvbiBzcGVlZCAofjcwIGt0KS4gKi9cbiAgICByb3RhdGlvblNwZWVkTXBzOiA2NSxcbiAgICAvKiogTWF4IHRvdWNoZG93biBncm91bmRzcGVlZCB3aXRoIGdlYXIgZG93bi4gKi9cbiAgICBsYW5kaW5nTWF4U3BlZWRNcHM6IDkwLFxuICAgIC8qKiBNYXggc2luayByYXRlIGF0IHRvdWNoZG93biAobS9zKS4gKi9cbiAgICBsYW5kaW5nTWF4VmVydGljYWxTcGVlZE1wczogOCxcbiAgICAvKiogTWF4IGJhbmsgYXQgdG91Y2hkb3duIChkZWcpLiAqL1xuICAgIGxhbmRpbmdNYXhSb2xsRGVnOiAxMixcbiAgICAvKiogTWluaW11bSBwaXRjaCBhdCB0b3VjaGRvd24gKGRlZywgbm9zZS1kb3duIGxpbWl0KS4gKi9cbiAgICBsYW5kaW5nTWluUGl0Y2hEZWc6IC0xMixcbn0gYXMgY29uc3Q7XG5cbmV4cG9ydCB0eXBlIEYxNlJlZmVyZW5jZU1ldHJpYyA9XG4gICAgfCAnbWFzc0tnJ1xuICAgIHwgJ3dpbmdBcmVhTTInXG4gICAgfCAnd2luZ1NwYW5NJ1xuICAgIHwgJ2FiVGhydXN0S24nXG4gICAgfCAnbWF4TWFjaCdcbiAgICB8ICdtYXhTcGVlZEttaCdcbiAgICB8ICdtaW5GbHlpbmdTcGVlZEt0cydcbiAgICB8ICdwZWFrTWF4U3BlZWRBbHRpdHVkZU0nXG4gICAgfCAnY2QwJ1xuICAgIHwgJ2luZHVjZWREcmFnSydcbiAgICB8ICdjbEFscGhhUGVyUmFkJ1xuICAgIHwgJ21heExpZnRUb0RyYWcnXG4gICAgfCAnY3J1aXNlU3BlZWRNcHMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEYxNlJlZmVyZW5jZUNhc2Uge1xuICAgIGlkOiBzdHJpbmc7XG4gICAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgICBzb3VyY2U6IHN0cmluZztcbiAgICBtZXRyaWM6IEYxNlJlZmVyZW5jZU1ldHJpYztcbiAgICBhbHRpdHVkZU1ldGVyczogbnVtYmVyO1xuICAgIHJlZmVyZW5jZTogbnVtYmVyO1xuICAgIHRvbGVyYW5jZTogbnVtYmVyO1xuICAgIC8qKiBGb3IgTC9EIG1ldHJpYy4gKi9cbiAgICBhbHBoYURlZz86IG51bWJlcjtcbn1cblxuZXhwb3J0IGNvbnN0IEYxNl9SRUZFUkVOQ0VfQ0FTRVM6IEYxNlJlZmVyZW5jZUNhc2VbXSA9IFtcbiAgICB7XG4gICAgICAgIGlkOiAnY2QwX3BhcGVyJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdaZXJvLWxpZnQgZHJhZyBjb2VmZmljaWVudCAoRXEuIDIpJyxcbiAgICAgICAgc291cmNlOiAnUmVobWFuIHBhcGVyIGFuYWx5dGljYWwnLFxuICAgICAgICBtZXRyaWM6ICdjZDAnLFxuICAgICAgICBhbHRpdHVkZU1ldGVyczogMCxcbiAgICAgICAgcmVmZXJlbmNlOiAwLjAxOCxcbiAgICAgICAgdG9sZXJhbmNlOiAwLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2luZHVjZWRfa19wYXBlcicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnSW5kdWNlZCBkcmFnIGZhY3RvciBLIChFcS4gM+KAkzUpJyxcbiAgICAgICAgc291cmNlOiAnUmVobWFuIHBhcGVyIGFuYWx5dGljYWwnLFxuICAgICAgICBtZXRyaWM6ICdpbmR1Y2VkRHJhZ0snLFxuICAgICAgICBhbHRpdHVkZU1ldGVyczogMCxcbiAgICAgICAgcmVmZXJlbmNlOiAwLjE0ODksXG4gICAgICAgIHRvbGVyYW5jZTogMC4wMDAxLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2NsX2FscGhhX3BhcGVyJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdMaWZ0LWN1cnZlIHNsb3BlJyxcbiAgICAgICAgc291cmNlOiAnUmVobWFuIHBhcGVyIC8gTkFDQSA2NEEyMDQnLFxuICAgICAgICBtZXRyaWM6ICdjbEFscGhhUGVyUmFkJyxcbiAgICAgICAgYWx0aXR1ZGVNZXRlcnM6IDAsXG4gICAgICAgIHJlZmVyZW5jZTogNS43MyxcbiAgICAgICAgdG9sZXJhbmNlOiAwLjAxLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2xkX21heF9wYXBlcicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTWF4aW11bSBsaWZ0LXRvLWRyYWcgcmF0aW8gYXQgzrEg4omIIDLCsCcsXG4gICAgICAgIHNvdXJjZTogJ1JlaG1hbiBGaWcuIDcnLFxuICAgICAgICBtZXRyaWM6ICdtYXhMaWZ0VG9EcmFnJyxcbiAgICAgICAgYWx0aXR1ZGVNZXRlcnM6IDAsXG4gICAgICAgIGFscGhhRGVnOiAyLFxuICAgICAgICByZWZlcmVuY2U6IDkuNjYsXG4gICAgICAgIHRvbGVyYW5jZTogMC4zLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ2NydWlzZV9zcGVlZF9wYXBlcicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQ3J1aXNlIHRydWUgYWlyc3BlZWQgYXQgMzAsMDAwIGZ0JyxcbiAgICAgICAgc291cmNlOiAnUmVobWFuIFNlY3Rpb24gSUlJICg4NDYgZnQvcyknLFxuICAgICAgICBtZXRyaWM6ICdjcnVpc2VTcGVlZE1wcycsXG4gICAgICAgIGFsdGl0dWRlTWV0ZXJzOiBGMTZfUFJPRklMRS5jcnVpc2VBbHRpdHVkZU0sXG4gICAgICAgIHJlZmVyZW5jZTogRjE2X1BST0ZJTEUuY3J1aXNlU3BlZWRNcHMsXG4gICAgICAgIHRvbGVyYW5jZTogMC41LFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ3dpbmdfYXJlYScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnV2luZyByZWZlcmVuY2UgYXJlYSAoMzAwIGZ0wrIpJyxcbiAgICAgICAgc291cmNlOiAnSmFuZVxcJ3MgLyBSZWhtYW4gcGFwZXInLFxuICAgICAgICBtZXRyaWM6ICd3aW5nQXJlYU0yJyxcbiAgICAgICAgYWx0aXR1ZGVNZXRlcnM6IDAsXG4gICAgICAgIHJlZmVyZW5jZTogMjcuODcsXG4gICAgICAgIHRvbGVyYW5jZTogMC4wNSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6ICdhYl90aHJ1c3Rfc2wnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0Z1bGwgYWZ0ZXJidXJuZXIgdGhydXN0IGF0IHNlYSBsZXZlbCcsXG4gICAgICAgIHNvdXJjZTogJ0YxMDAtUFctMjI5ICgxMjkuNCBrTiknLFxuICAgICAgICBtZXRyaWM6ICdhYlRocnVzdEtuJyxcbiAgICAgICAgYWx0aXR1ZGVNZXRlcnM6IDAsXG4gICAgICAgIHJlZmVyZW5jZTogMTI5LjQsXG4gICAgICAgIHRvbGVyYW5jZTogMi4wLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpZDogJ21heF9tYWNoX2ZsNDAwJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdNYXhpbXVtIE1hY2ggYXQgNDAsMDAwIGZ0IChBQiwgdGhydXN04oCTZHJhZyBiYWxhbmNlKScsXG4gICAgICAgIHNvdXJjZTogJ1NpbSBlbnZlbG9wZSB3aXRoIEFuZGVyc29uIHBvbGFyICsgdHJhbnNvbmljIGRyYWcnLFxuICAgICAgICBtZXRyaWM6ICdtYXhNYWNoJyxcbiAgICAgICAgYWx0aXR1ZGVNZXRlcnM6IDEyMTkyLFxuICAgICAgICByZWZlcmVuY2U6IDEuODksXG4gICAgICAgIHRvbGVyYW5jZTogMC4xMixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaWQ6ICdwZWFrX3NwZWVkX2FsdGl0dWRlJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdBbHRpdHVkZSBvZiBwZWFrIGxldmVsLWZsaWdodCBtYXggc3BlZWQnLFxuICAgICAgICBzb3VyY2U6ICdTaW0gZW52ZWxvcGUgKElTQSB0aHJ1c3QgbGFwc2UpJyxcbiAgICAgICAgbWV0cmljOiAncGVha01heFNwZWVkQWx0aXR1ZGVNJyxcbiAgICAgICAgYWx0aXR1ZGVNZXRlcnM6IDAsXG4gICAgICAgIHJlZmVyZW5jZTogMTEwMDAsXG4gICAgICAgIHRvbGVyYW5jZTogNTAwLFxuICAgIH0sXG5dO1xuXG5leHBvcnQgY29uc3QgTVBTX1RPX0tUUyA9IDEuOTQzODQ7XG4iLCJpbXBvcnQgeyBjbGFtcCB9IGZyb20gJy4uL3V0aWxzL21hdGgnO1xuXG4vKiogRkJXIHJvbGwtYXhpcyBlbnZlbG9wZSAoQ2F0IEkgY2xlYW4pLiBDYXQgSUlJIGxvd2VycyBtYXggcmF0ZSBmb3IgaGVhdnkgc3RvcmVzLiAqL1xuZXhwb3J0IGludGVyZmFjZSBGMTZSb2xsQ29udHJvbENvbmZpZyB7XG4gICAgbWF4Um9sbFJhdGVEZWdTOiBudW1iZXI7XG4gICAgYWN0dWF0b3JUYXVTOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjb25zdCBGMTZfUk9MTF9DQVQxOiBGMTZSb2xsQ29udHJvbENvbmZpZyA9IHtcbiAgICBtYXhSb2xsUmF0ZURlZ1M6IDMwMCxcbiAgICBhY3R1YXRvclRhdVM6IDAuMDc1LFxufTtcblxuZXhwb3J0IGNvbnN0IEYxNl9ST0xMX0NBVDM6IEYxNlJvbGxDb250cm9sQ29uZmlnID0ge1xuICAgIG1heFJvbGxSYXRlRGVnUzogMTgwLFxuICAgIGFjdHVhdG9yVGF1UzogMC4wOSxcbn07XG5cbmNvbnN0IERFR19UT19SQUQgPSBNYXRoLlBJIC8gMTgwO1xuXG5jb25zdCBNSU5fUV9HQUlOID0gMC4xMjtcbmNvbnN0IE1BWF9RX0dBSU4gPSAxLjA7XG5cbmV4cG9ydCBmdW5jdGlvbiBtYXhSb2xsUmF0ZVJhZChjb25maWc6IEYxNlJvbGxDb250cm9sQ29uZmlnKTogbnVtYmVyIHtcbiAgICByZXR1cm4gY29uZmlnLm1heFJvbGxSYXRlRGVnUyAqIERFR19UT19SQUQ7XG59XG5cbi8qKiBHYWluIGZhbGxzIGFzIGR5bmFtaWMgcHJlc3N1cmUgcmlzZXMg4oCUIEZCVyBsaW1pdHMgY29tbWFuZCB0byBwcm90ZWN0IHN0cnVjdHVyZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlRjE2Um9sbER5bmFtaWNQcmVzc3VyZUdhaW4oZHluYW1pY1ByZXNzdXJlOiBudW1iZXIsIHFSZWY6IG51bWJlcik6IG51bWJlciB7XG4gICAgY29uc3QgcSA9IE1hdGgubWF4KGR5bmFtaWNQcmVzc3VyZSwgMSk7XG4gICAgY29uc3QgcmVmID0gTWF0aC5tYXgocVJlZiwgMSk7XG4gICAgY29uc3QgcmF3ID0gTUlOX1FfR0FJTiArIChNQVhfUV9HQUlOIC0gTUlOX1FfR0FJTikgKiBNYXRoLnNxcnQocmVmIC8gKHJlZiArIHEpKTtcbiAgICByZXR1cm4gY2xhbXAocmF3LCBNSU5fUV9HQUlOLCBNQVhfUV9HQUlOKTtcbn1cblxuZnVuY3Rpb24gbWFjaFJvbGxMaW1pdGVyKG1hY2g6IG51bWJlcik6IG51bWJlciB7XG4gICAgaWYgKG1hY2ggPD0gMC44NSkge1xuICAgICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgcmV0dXJuIGNsYW1wKDEgLSAobWFjaCAtIDAuODUpIC8gMC41NSwgMC4zNSwgMSk7XG59XG5cbmZ1bmN0aW9uIGFsdGl0dWRlUm9sbExpbWl0ZXIoYWx0aXR1ZGVNOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGlmIChhbHRpdHVkZU0gPD0gMTIwMDApIHtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICAgIHJldHVybiBjbGFtcCgxIC0gKGFsdGl0dWRlTSAtIDEyMDAwKSAvIDIwMDAwLCAwLjQ1LCAxKTtcbn1cblxuZnVuY3Rpb24gYW9hUm9sbExpbWl0ZXIoYW9hUmFkOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IGFvYURlZyA9IE1hdGguYWJzKGFvYVJhZCkgKiAoMTgwIC8gTWF0aC5QSSk7XG4gICAgaWYgKGFvYURlZyA8PSAxNSkge1xuICAgICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgcmV0dXJuIGNsYW1wKDEgLSAoYW9hRGVnIC0gMTUpIC8gMjIsIDAuMTUsIDEpO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEYxNlJvbGxDb21tYW5kSW5wdXRzIHtcbiAgICBzdGljazogbnVtYmVyO1xuICAgIGR5bmFtaWNQcmVzc3VyZTogbnVtYmVyO1xuICAgIHFSZWY6IG51bWJlcjtcbiAgICBtYWNoOiBudW1iZXI7XG4gICAgYWx0aXR1ZGVNOiBudW1iZXI7XG4gICAgYW9hUmFkOiBudW1iZXI7XG4gICAgZmxhcHNFeHRlbmRlZDogYm9vbGVhbjtcbiAgICBsYW5kZWQ6IGJvb2xlYW47XG4gICAgY29uZmlnOiBGMTZSb2xsQ29udHJvbENvbmZpZztcbn1cblxuLyoqIFN0aWNrIFstMSwgMV0g4oaSIGNvbW1hbmRlZCBib2R5IHJvbGwgcmF0ZSBwX2NtZCAocmFkL3MpLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVGMTZDb21tYW5kZWRSb2xsUmF0ZShpbnB1dHM6IEYxNlJvbGxDb21tYW5kSW5wdXRzKTogbnVtYmVyIHtcbiAgICBpZiAoaW5wdXRzLmxhbmRlZCB8fCBNYXRoLmFicyhpbnB1dHMuc3RpY2spIDwgMWUtNikge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICBjb25zdCBmbGFwRmFjdG9yID0gaW5wdXRzLmZsYXBzRXh0ZW5kZWQgPyAwLjY1IDogMTtcbiAgICBjb25zdCBsaW1pdGVyID0gbWFjaFJvbGxMaW1pdGVyKGlucHV0cy5tYWNoKVxuICAgICAgICAqIGFsdGl0dWRlUm9sbExpbWl0ZXIoaW5wdXRzLmFsdGl0dWRlTSlcbiAgICAgICAgKiBhb2FSb2xsTGltaXRlcihpbnB1dHMuYW9hUmFkKVxuICAgICAgICAqIGZsYXBGYWN0b3I7XG5cbiAgICBjb25zdCBxR2FpbiA9IGNvbXB1dGVGMTZSb2xsRHluYW1pY1ByZXNzdXJlR2FpbihpbnB1dHMuZHluYW1pY1ByZXNzdXJlLCBpbnB1dHMucVJlZik7XG4gICAgcmV0dXJuIGlucHV0cy5zdGljayAqIG1heFJvbGxSYXRlUmFkKGlucHV0cy5jb25maWcpICogcUdhaW4gKiBsaW1pdGVyO1xufVxuXG4vKiogRmlyc3Qtb3JkZXIgZmxhcGVyb24vYWN0dWF0b3IgbGFnIHRvd2FyZCBjb21tYW5kZWQgcmF0ZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdGVwRjE2Qm9keVJvbGxSYXRlKFxuICAgIGJvZHlSb2xsUmF0ZVJhZDogbnVtYmVyLFxuICAgIGNvbW1hbmRlZFJhdGVSYWQ6IG51bWJlcixcbiAgICBkZWx0YTogbnVtYmVyLFxuICAgIGNvbmZpZzogRjE2Um9sbENvbnRyb2xDb25maWcsXG4pOiBudW1iZXIge1xuICAgIGlmIChkZWx0YSA8PSAwKSB7XG4gICAgICAgIHJldHVybiBib2R5Um9sbFJhdGVSYWQ7XG4gICAgfVxuICAgIGNvbnN0IGFscGhhID0gMSAtIE1hdGguZXhwKC1kZWx0YSAvIE1hdGgubWF4KGNvbmZpZy5hY3R1YXRvclRhdVMsIDFlLTMpKTtcbiAgICByZXR1cm4gYm9keVJvbGxSYXRlUmFkICsgKGNvbW1hbmRlZFJhdGVSYWQgLSBib2R5Um9sbFJhdGVSYWQpICogYWxwaGE7XG59XG5cbi8qKiBIaWdoLUFvQSByb2xs4oCTeWF3IGNvdXBsaW5nOiBhdXRvIHJ1ZGRlciB0byBjb29yZGluYXRlIGFuZCBsaW1pdCBzaWRlc2xpcCBidWlsZHVwLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVGMTZSb2xsWWF3Q291cGxpbmcoYm9keVJvbGxSYXRlUmFkOiBudW1iZXIsIGFvYVJhZDogbnVtYmVyLCBtYXhSb2xsUmF0ZVJhZDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBjb25zdCBhb2FGYWN0b3IgPSBjbGFtcCgoTWF0aC5hYnMoYW9hUmFkKSAtIDAuMTIpIC8gMC40LCAwLCAxKTtcbiAgICBpZiAoYW9hRmFjdG9yIDw9IDAgfHwgbWF4Um9sbFJhdGVSYWQgPD0gMCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgY29uc3Qgbm9ybWFsaXplZFJvbGwgPSBjbGFtcChib2R5Um9sbFJhdGVSYWQgLyBtYXhSb2xsUmF0ZVJhZCwgLTEsIDEpO1xuICAgIHJldHVybiBub3JtYWxpemVkUm9sbCAqIDAuNCAqIGFvYUZhY3Rvcjtcbn1cbiIsIi8qKlxuICogQSBzaW5nbGUgcmlnaWQgYWVyb2R5bmFtaWMgc3VyZmFjZSBmb3IgdGhlIEZNMiBwYXJ0cyBtb2RlbC5cbiAqXG4gKiBHaXZlbiB0aGUgYWlyY3JhZnQncyBib2R5LWZyYW1lIGxpbmVhciB2ZWxvY2l0eSwgYm9keSBhbmd1bGFyIHZlbG9jaXR5IGFuZFxuICogdGhlIGxvY2FsIGFpciBkZW5zaXR5LCB0aGUgc3VyZmFjZSBjb21wdXRlcyB0aGUgbGlmdCArIGRyYWcgZm9yY2UgaXQgcHJvZHVjZXNcbiAqIGFuZCB0aGUgbW9tZW50IHRoYXQgZm9yY2UgZXhlcnRzIGFib3V0IHRoZSBDRy4gVGhlIGtleSBkZXRhaWwgdGhhdCBtYWtlcyB0aGVcbiAqIHdob2xlIG1vZGVsIGJlaGF2ZSBpcyB0aGF0IHRoZSBhaXJmbG93IHNlZW4gYnkgdGhlIHN1cmZhY2UgaW5jbHVkZXMgdGhlXG4gKiB2ZWxvY2l0eSBjb250cmlidXRlZCBieSByb3RhdGlvbiBhdCBpdHMgb3duIGxvY2F0aW9uOlxuICpcbiAqICAgICB1X2xvY2FsID0gdl9ib2R5ICsgz4kgw5cgclxuICpcbiAqIEEgcGl0Y2ggcmF0ZSB0aGVyZWZvcmUgcmFpc2VzIHRoZSBBb0Egb2YgdGhlIHRhaWwsIGEgcm9sbCByYXRlIHJhaXNlcyB0aGUgQW9BXG4gKiBvZiB0aGUgZG93bi1nb2luZyB3aW5nLCBhbmQgYSB5YXcgcmF0ZSBsb2FkcyB0aGUgZmluIOKAlCBpLmUuIHBpdGNoLCByb2xsIGFuZFxuICogeWF3IGFlcm9keW5hbWljIGRhbXBpbmcgYWxsIGFwcGVhciBhdXRvbWF0aWNhbGx5IGZyb20gdGhlIGdlb21ldHJ5LlxuICovXG5pbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgeyBTdXJmYWNlR2VvbWV0cnkgfSBmcm9tICcuL2YxNkZtMkNvbmZpZyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3VyZmFjZUlucHV0IHtcbiAgICAvKiogQm9keS1mcmFtZSB2ZWxvY2l0eSBvZiB0aGUgQ0cgdGhyb3VnaCB0aGUgYWlyIChtL3MpLiAqL1xuICAgIHZlbG9jaXR5Qm9keTogVEhSRUUuVmVjdG9yMztcbiAgICAvKiogQm9keS1mcmFtZSBhbmd1bGFyIHZlbG9jaXR5IChyYWQvcykuICovXG4gICAgYW5ndWxhclZlbG9jaXR5Qm9keTogVEhSRUUuVmVjdG9yMztcbiAgICAvKiogQWlyIGRlbnNpdHkgKGtnL23CsykuICovXG4gICAgYWlyRGVuc2l0eTogbnVtYmVyO1xuICAgIC8qKiBFZmZlY3RpdmUgaW5jaWRlbmNlIGFkZGVkIGJ5IGNvbnRyb2wgZGVmbGVjdGlvbiAocmFkKS4gKi9cbiAgICBjb250cm9sRGVsdGFBb2FSYWQ6IG51bWJlcjtcbiAgICAvKiogU3ltbWV0cmljIGNhbWJlciBiaWFzLCBlLmcuIGZsYXBzIChyYWQpLiAqL1xuICAgIGNhbWJlckJpYXNSYWQ6IG51bWJlcjtcbiAgICAvKiogUmVkdWN0aW9uIG9mIHRoZSBzdGFsbCBBb0EsIGUuZy4gZnJvbSBmbGFwcyAocmFkKS4gKi9cbiAgICBzdGFsbFNoaWZ0UmFkOiBudW1iZXI7XG4gICAgLyoqIEFkZGl0aW9uYWwgcHJvZmlsZSBkcmFnIGNvZWZmaWNpZW50IChyZWZlcmVuY2VkIHRvIHRoaXMgc3VyZmFjZSdzIGFyZWEpLiAqL1xuICAgIGV4dHJhQ2Q6IG51bWJlcjtcbn1cblxuZXhwb3J0IGNsYXNzIEFlcm9TdXJmYWNlIHtcbiAgICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSByZWFkb25seSBnZW9tOiBTdXJmYWNlR2VvbWV0cnk7XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IHBvc2l0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IHVwID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGZvcndhcmQgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgc3BhbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IF91ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9yb3QgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgX2RyYWdEaXIgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgX2xpZnREaXIgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG4gICAgLyoqIExhc3QgY29tcHV0ZWQgYW5nbGUgb2YgYXR0YWNrIGZvciB0aGlzIHN1cmZhY2UgKHJhZCk7IHVzZWZ1bCB0ZWxlbWV0cnkuICovXG4gICAgbGFzdEFvYVJhZCA9IDA7XG5cbiAgICBjb25zdHJ1Y3RvcihnZW9tOiBTdXJmYWNlR2VvbWV0cnkpIHtcbiAgICAgICAgdGhpcy5nZW9tID0gZ2VvbTtcbiAgICAgICAgdGhpcy5uYW1lID0gZ2VvbS5uYW1lO1xuICAgICAgICB0aGlzLnBvc2l0aW9uLmZyb21BcnJheShnZW9tLnBvc2l0aW9uKTtcbiAgICAgICAgdGhpcy51cC5mcm9tQXJyYXkoZ2VvbS51cCkubm9ybWFsaXplKCk7XG4gICAgICAgIHRoaXMuZm9yd2FyZC5mcm9tQXJyYXkoZ2VvbS5mb3J3YXJkKS5ub3JtYWxpemUoKTtcbiAgICAgICAgLy8gU3Bhbndpc2UgYXhpcyAodGhlIGRpcmVjdGlvbiB3ZSBpZ25vcmUgd2hlbiBtZWFzdXJpbmcgQW9BKS5cbiAgICAgICAgdGhpcy5zcGFuLmNvcHkodGhpcy51cCkuY3Jvc3ModGhpcy5mb3J3YXJkKS5ub3JtYWxpemUoKTtcbiAgICB9XG5cbiAgICBnZXQgcG9zaXRpb25Cb2R5KCk6IFRIUkVFLlZlY3RvcjMge1xuICAgICAgICByZXR1cm4gdGhpcy5wb3NpdGlvbjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBY2N1bXVsYXRlIHRoaXMgc3VyZmFjZSdzIGFlcm9keW5hbWljIGZvcmNlIGFuZCBtb21lbnQuXG4gICAgICogQHBhcmFtIGlucHV0ICAgICAgRmxpZ2h0IGNvbmRpdGlvbiBhbmQgY29udHJvbCBzdGF0ZS5cbiAgICAgKiBAcGFyYW0gb3V0Rm9yY2UgICBCb2R5LWZyYW1lIGZvcmNlIGFjY3VtdWxhdG9yIChOKSDigJQgYWRkZWQgdG8uXG4gICAgICogQHBhcmFtIG91dE1vbWVudCAgQm9keS1mcmFtZSBtb21lbnQtYWJvdXQtQ0cgYWNjdW11bGF0b3IgKE7Ct20pIOKAlCBhZGRlZCB0by5cbiAgICAgKi9cbiAgICBhY2N1bXVsYXRlKGlucHV0OiBTdXJmYWNlSW5wdXQsIG91dEZvcmNlOiBUSFJFRS5WZWN0b3IzLCBvdXRNb21lbnQ6IFRIUkVFLlZlY3RvcjMpOiB2b2lkIHtcbiAgICAgICAgLy8gTG9jYWwgdmVsb2NpdHkgdGhyb3VnaCB0aGUgYWlyIGF0IHRoZSBzdXJmYWNlOiB2ICsgz4kgw5cgci5cbiAgICAgICAgdGhpcy5fcm90LmNyb3NzVmVjdG9ycyhpbnB1dC5hbmd1bGFyVmVsb2NpdHlCb2R5LCB0aGlzLnBvc2l0aW9uKTtcbiAgICAgICAgdGhpcy5fdS5jb3B5KGlucHV0LnZlbG9jaXR5Qm9keSkuYWRkKHRoaXMuX3JvdCk7XG5cbiAgICAgICAgLy8gUmVtb3ZlIHRoZSBzcGFud2lzZSBjb21wb25lbnQgKHRoYXQgZmxvdyBkb2VzIG5vdCBtYWtlIGxpZnQgaGVyZSkuXG4gICAgICAgIGNvbnN0IHNwYW5Db21wID0gdGhpcy5fdS5kb3QodGhpcy5zcGFuKTtcbiAgICAgICAgdGhpcy5fdS5hZGRTY2FsZWRWZWN0b3IodGhpcy5zcGFuLCAtc3BhbkNvbXApO1xuXG4gICAgICAgIGNvbnN0IHNwZWVkU3EgPSB0aGlzLl91Lmxlbmd0aFNxKCk7XG4gICAgICAgIGlmIChzcGVlZFNxIDwgMWUtNCkge1xuICAgICAgICAgICAgdGhpcy5sYXN0QW9hUmFkID0gMDtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzcGVlZCA9IE1hdGguc3FydChzcGVlZFNxKTtcblxuICAgICAgICBjb25zdCB1ZiA9IHRoaXMuX3UuZG90KHRoaXMuZm9yd2FyZCk7XG4gICAgICAgIGNvbnN0IHV1ID0gdGhpcy5fdS5kb3QodGhpcy51cCk7XG4gICAgICAgIGNvbnN0IGFvYSA9IE1hdGguYXRhbjIoLXV1LCB1Zik7XG4gICAgICAgIHRoaXMubGFzdEFvYVJhZCA9IGFvYTtcblxuICAgICAgICBjb25zdCBlZmZlY3RpdmVBb2EgPSBhb2EgKyBpbnB1dC5jb250cm9sRGVsdGFBb2FSYWQgKyBpbnB1dC5jYW1iZXJCaWFzUmFkO1xuICAgICAgICBjb25zdCBzdGFsbCA9IHRoaXMuZ2VvbS5zdGFsbEFvYVJhZCAtIGlucHV0LnN0YWxsU2hpZnRSYWQ7XG4gICAgICAgIGNvbnN0IGNsID0gbGlmdENvZWZmaWNpZW50KGVmZmVjdGl2ZUFvYSwgdGhpcy5nZW9tLmxpZnRTbG9wZVBlclJhZCwgc3RhbGwpO1xuICAgICAgICBjb25zdCBzZXBhcmF0ZWQgPSBNYXRoLnNpbihlZmZlY3RpdmVBb2EpO1xuICAgICAgICBjb25zdCBjZCA9IHRoaXMuZ2VvbS5jZDAgKyBpbnB1dC5leHRyYUNkXG4gICAgICAgICAgICArIHRoaXMuZ2VvbS5pbmR1Y2VkSyAqIGNsICogY2xcbiAgICAgICAgICAgICsgMS4wICogc2VwYXJhdGVkICogc2VwYXJhdGVkO1xuXG4gICAgICAgIC8vIERyYWcgYWN0cyBkb3duc3RyZWFtIChkaXJlY3Rpb24gdGhlIGFpciBpcyBtb3ZpbmcgcmVsYXRpdmUgdG8gc3VyZmFjZSkuXG4gICAgICAgIHRoaXMuX2RyYWdEaXIuY29weSh0aGlzLl91KS5tdWx0aXBseVNjYWxhcigtMSAvIHNwZWVkKTtcbiAgICAgICAgLy8gTGlmdCBpcyBwZXJwZW5kaWN1bGFyIHRvIHRoZSByZWxhdGl2ZSB3aW5kLCBpbiB0aGUgc3VyZmFjZSdzIGxpZnQgcGxhbmUuXG4gICAgICAgIHRoaXMuX2xpZnREaXIuY3Jvc3NWZWN0b3JzKHRoaXMuc3BhbiwgdGhpcy5fZHJhZ0Rpcikubm9ybWFsaXplKCk7XG5cbiAgICAgICAgY29uc3QgcSA9IDAuNSAqIGlucHV0LmFpckRlbnNpdHkgKiBzcGVlZFNxO1xuICAgICAgICBjb25zdCBhcmVhID0gdGhpcy5nZW9tLmFyZWFNMjtcbiAgICAgICAgY29uc3QgbGlmdCA9IHEgKiBhcmVhICogY2w7XG4gICAgICAgIGNvbnN0IGRyYWcgPSBxICogYXJlYSAqIGNkO1xuXG4gICAgICAgIC8vIEZvcmNlIGNvbnRyaWJ1dGlvbi5cbiAgICAgICAgY29uc3QgZnggPSB0aGlzLl9saWZ0RGlyLnggKiBsaWZ0ICsgdGhpcy5fZHJhZ0Rpci54ICogZHJhZztcbiAgICAgICAgY29uc3QgZnkgPSB0aGlzLl9saWZ0RGlyLnkgKiBsaWZ0ICsgdGhpcy5fZHJhZ0Rpci55ICogZHJhZztcbiAgICAgICAgY29uc3QgZnogPSB0aGlzLl9saWZ0RGlyLnogKiBsaWZ0ICsgdGhpcy5fZHJhZ0Rpci56ICogZHJhZztcbiAgICAgICAgb3V0Rm9yY2UueCArPSBmeDtcbiAgICAgICAgb3V0Rm9yY2UueSArPSBmeTtcbiAgICAgICAgb3V0Rm9yY2UueiArPSBmejtcblxuICAgICAgICAvLyBNb21lbnQgYWJvdXQgQ0c6IHIgw5cgRi5cbiAgICAgICAgY29uc3QgcnggPSB0aGlzLnBvc2l0aW9uLngsIHJ5ID0gdGhpcy5wb3NpdGlvbi55LCByeiA9IHRoaXMucG9zaXRpb24uejtcbiAgICAgICAgb3V0TW9tZW50LnggKz0gcnkgKiBmeiAtIHJ6ICogZnk7XG4gICAgICAgIG91dE1vbWVudC55ICs9IHJ6ICogZnggLSByeCAqIGZ6O1xuICAgICAgICBvdXRNb21lbnQueiArPSByeCAqIGZ5IC0gcnkgKiBmeDtcbiAgICB9XG59XG5cbi8qKlxuICogTGlmdCBjb2VmZmljaWVudCB3aXRoIGEgbGluZWFyIHJhbmdlIGFuZCBhIHNtb290aCBwb3N0LXN0YWxsIGNvbGxhcHNlLlxuICogQmV5b25kIHRoZSBzdGFsbCBBb0EgdGhlIGNvZWZmaWNpZW50IGRlY2F5cyBsaWtlIGEgY29zaW5lIHNvIGxpZnQgZmFsbHMgb2ZmXG4gKiAoYW5kLCBjb21iaW5lZCB3aXRoIHRoZSBzZXBhcmF0ZWQtZmxvdyBkcmFnIHRlcm0sIHByb2R1Y2VzIGEgbm9zZSBkcm9wKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxpZnRDb2VmZmljaWVudChhb2FSYWQ6IG51bWJlciwgc2xvcGVQZXJSYWQ6IG51bWJlciwgc3RhbGxSYWQ6IG51bWJlcik6IG51bWJlciB7XG4gICAgY29uc3QgbWFnID0gTWF0aC5hYnMoYW9hUmFkKTtcbiAgICBjb25zdCBzaWduID0gTWF0aC5zaWduKGFvYVJhZCk7XG4gICAgaWYgKG1hZyA8PSBzdGFsbFJhZCkge1xuICAgICAgICByZXR1cm4gc2xvcGVQZXJSYWQgKiBhb2FSYWQ7XG4gICAgfVxuICAgIGNvbnN0IHBlYWsgPSBzbG9wZVBlclJhZCAqIHN0YWxsUmFkO1xuICAgIC8vIERlY2F5IHRvIH4wIG92ZXIgcm91Z2hseSB0aGUgbmV4dCAzNcKwLlxuICAgIGNvbnN0IGRlY2F5ID0gTWF0aC5jb3MoKG1hZyAtIHN0YWxsUmFkKSAqIDIuMik7XG4gICAgcmV0dXJuIHNpZ24gKiBwZWFrICogTWF0aC5tYXgoMCwgZGVjYXkpO1xufVxuIiwiLyoqXG4gKiBGTTIgZmx5LWJ5LXdpcmUgLyBzdGFiaWxpdHktYXVnbWVudGF0aW9uIGNvbnRyb2wgbGF3cy5cbiAqXG4gKiBUaGUgYmFyZSBGLTE2IGFpcmZyYW1lIGlzIChieSBkZXNpZ24pIGNsb3NlIHRvIG5ldXRyYWxseS9uZWdhdGl2ZWx5IHN0YWJsZSBhbmRcbiAqIGlzIG9ubHkgZmx5YWJsZSB0aHJvdWdoIGl0cyBGQlcgc3lzdGVtLiBUaGlzIG1vZHVsZSBtYXBzIHRoZSBwaWxvdCdzIHN0aWNrIGFuZFxuICogcGVkYWwgaW5wdXRzIGludG8gY29udHJvbC1zdXJmYWNlIGNvbW1hbmRzIGFuZCBjbG9zZXMgcmF0ZS9nIGxvb3BzIGFyb3VuZCB0aGVcbiAqIGFpcmZyYW1lIHNvIHRoYXQgdGhlIGhhbmRsaW5nIHF1YWxpdGllcyDigJQgbm90IHRoZSByYXcgYWVyb2R5bmFtaWNzIOKAlCBkZWZpbmUgdGhlXG4gKiBmZWVsOlxuICogICAtIFBpdGNoOiBhIGctY29tbWFuZCBsYXcgd2l0aCBwaXRjaC1yYXRlIGRhbXBpbmcsIGFuIGFuZ2xlLW9mLWF0dGFjayBsaW1pdGVyXG4gKiAgICAgYW5kIHRoZSBzdHJ1Y3R1cmFsIGcgZW52ZWxvcGUuXG4gKiAgIC0gUm9sbDogYSByb2xsLXJhdGUgY29tbWFuZCAoY2FwcGVkIG5lYXIgfjMwMMKwL3MsIGZhZGVkIGJ5IGR5bmFtaWMgcHJlc3N1cmUsXG4gKiAgICAgTWFjaCwgYWx0aXR1ZGUgYW5kIEFvQSkgZHJpdmluZyBhaWxlcm9ucyBwbHVzIGEgZGlmZmVyZW50aWFsIHN0YWJpbGF0b3IuXG4gKiAgIC0gWWF3OiBhIHdhc2hlZC1vdXQgeWF3LXJhdGUgZGFtcGVyIHBsdXMgYW4gYWlsZXJvbi1ydWRkZXIgaW50ZXJjb25uZWN0IGZvclxuICogICAgIHR1cm4gY29vcmRpbmF0aW9uLCB3aXRoIGRpcmVjdCBwZWRhbCBhdXRob3JpdHkgb24gdG9wLlxuICpcbiAqIE91dHB1dHMgYXJlIG5vcm1hbGl6ZWQgY29tbWFuZHMgaW4gWy0xLCAxXTsgdGhlIGZsaWdodCBtb2RlbCBjb252ZXJ0cyB0aGVtIGludG9cbiAqIHBoeXNpY2FsIHN1cmZhY2UgaW5jaWRlbmNlIGZvciB0aGUgYWVybyBwYXJ0cy4gRmlyc3Qtb3JkZXIgYWN0dWF0b3IgbGFnIGlzXG4gKiBhcHBsaWVkIHNvIHN1cmZhY2VzIGNhbm5vdCBzbmFwIGluc3RhbnRhbmVvdXNseS5cbiAqL1xuaW1wb3J0IHsgY2xhbXAgfSBmcm9tICcuLi8uLi91dGlscy9tYXRoJztcbmltcG9ydCB7IGNvbXB1dGVNYWNoTnVtYmVyIH0gZnJvbSAnLi4vYWVyb1V0aWxzJztcbmltcG9ydCB7IGNvbXB1dGVGMTZDb21tYW5kZWRSb2xsUmF0ZSwgRjE2X1JPTExfQ0FUMSB9IGZyb20gJy4uL2YxNlJvbGxDb250cm9sJztcbmltcG9ydCB7IEZNMl9GQ1MgfSBmcm9tICcuL2YxNkZtMkNvbmZpZyc7XG5cbmNvbnN0IERFRyA9IE1hdGguUEkgLyAxODA7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRmNzSW5wdXQge1xuICAgIHBpdGNoU3RpY2s6IG51bWJlcjsgLy8gWy0xLCAxXSBwb3NpdGl2ZSA9IG5vc2UgdXAgLyBwdWxsXG4gICAgcm9sbFN0aWNrOiBudW1iZXI7ICAvLyBbLTEsIDFdIHBvc2l0aXZlID0gcm9sbCByaWdodFxuICAgIHlhd1BlZGFsOiBudW1iZXI7ICAgLy8gWy0xLCAxXSBwb3NpdGl2ZSA9IG5vc2UgcmlnaHRcbiAgICAvKiogQm9keSBhbmd1bGFyIHZlbG9jaXR5IGNvbXBvbmVudHMgKHJhZC9zKS4gKi9cbiAgICBwaXRjaFJhdGU6IG51bWJlcjsgIC8vIGFib3V0ICtYXG4gICAgeWF3UmF0ZTogbnVtYmVyOyAgICAvLyBhYm91dCArWVxuICAgIHJvbGxSYXRlOiBudW1iZXI7ICAgLy8gYWJvdXQgK1pcbiAgICBsb2FkRmFjdG9yRzogbnVtYmVyO1xuICAgIGFvYVJhZDogbnVtYmVyO1xuICAgIGR5bmFtaWNQcmVzc3VyZTogbnVtYmVyO1xuICAgIHFSZWY6IG51bWJlcjtcbiAgICBzcGVlZDogbnVtYmVyO1xuICAgIGFsdGl0dWRlTTogbnVtYmVyO1xuICAgIGZsYXBzRXh0ZW5kZWQ6IGJvb2xlYW47XG4gICAgbGFuZGVkOiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEZjc091dHB1dCB7XG4gICAgLyoqIEVsZXZhdG9yIGNvbW1hbmQsIHBvc2l0aXZlID0gbm9zZSB1cC4gKi9cbiAgICBlbGV2YXRvcjogbnVtYmVyO1xuICAgIC8qKiBBaWxlcm9uIGNvbW1hbmQsIHBvc2l0aXZlID0gcm9sbCByaWdodC4gKi9cbiAgICBhaWxlcm9uOiBudW1iZXI7XG4gICAgLyoqIFJ1ZGRlciBjb21tYW5kLCBwb3NpdGl2ZSA9IG5vc2UgcmlnaHQuICovXG4gICAgcnVkZGVyOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBGMTZGY3Mge1xuICAgIHByaXZhdGUgZWxldmF0b3IgPSAwO1xuICAgIHByaXZhdGUgYWlsZXJvbiA9IDA7XG4gICAgcHJpdmF0ZSBydWRkZXIgPSAwO1xuICAgIHByaXZhdGUgeWF3UmF0ZUxvd1Bhc3MgPSAwO1xuICAgIHByaXZhdGUgcGl0Y2hJbnRlZ3JhbCA9IDA7XG4gICAgcHJpdmF0ZSBwcmV2QW9hID0gMDtcbiAgICBwcml2YXRlIGFvYVJhdGVGaWx0ID0gMDtcbiAgICBwcml2YXRlIHByZXZBb2FWYWxpZCA9IGZhbHNlO1xuXG4gICAgcmVzZXQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuZWxldmF0b3IgPSAwO1xuICAgICAgICB0aGlzLmFpbGVyb24gPSAwO1xuICAgICAgICB0aGlzLnJ1ZGRlciA9IDA7XG4gICAgICAgIHRoaXMueWF3UmF0ZUxvd1Bhc3MgPSAwO1xuICAgICAgICB0aGlzLnBpdGNoSW50ZWdyYWwgPSAwO1xuICAgICAgICB0aGlzLnByZXZBb2EgPSAwO1xuICAgICAgICB0aGlzLmFvYVJhdGVGaWx0ID0gMDtcbiAgICAgICAgdGhpcy5wcmV2QW9hVmFsaWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBnZXRTdGF0ZSgpOiBGY3NPdXRwdXQge1xuICAgICAgICByZXR1cm4geyBlbGV2YXRvcjogdGhpcy5lbGV2YXRvciwgYWlsZXJvbjogdGhpcy5haWxlcm9uLCBydWRkZXI6IHRoaXMucnVkZGVyIH07XG4gICAgfVxuXG4gICAgdXBkYXRlKGlucHV0OiBGY3NJbnB1dCwgZHQ6IG51bWJlcik6IEZjc091dHB1dCB7XG4gICAgICAgIGNvbnN0IGVsZXZhdG9yVGFyZ2V0ID0gdGhpcy5waXRjaExhdyhpbnB1dCwgZHQpO1xuICAgICAgICBjb25zdCBhaWxlcm9uVGFyZ2V0ID0gdGhpcy5yb2xsTGF3KGlucHV0KTtcbiAgICAgICAgY29uc3QgcnVkZGVyVGFyZ2V0ID0gdGhpcy55YXdMYXcoaW5wdXQsIGFpbGVyb25UYXJnZXQsIGR0KTtcblxuICAgICAgICAvLyBGaXJzdC1vcmRlciBhY3R1YXRvciBsYWcgdG93YXJkIHRoZSBjb21tYW5kZWQgZGVmbGVjdGlvbi5cbiAgICAgICAgY29uc3QgYSA9IGR0IDw9IDAgPyAxIDogMSAtIE1hdGguZXhwKC1kdCAvIE1hdGgubWF4KEZNMl9GQ1MuYWN0dWF0b3JUYXVTLCAxZS0zKSk7XG4gICAgICAgIHRoaXMuZWxldmF0b3IgKz0gKGVsZXZhdG9yVGFyZ2V0IC0gdGhpcy5lbGV2YXRvcikgKiBhO1xuICAgICAgICB0aGlzLmFpbGVyb24gKz0gKGFpbGVyb25UYXJnZXQgLSB0aGlzLmFpbGVyb24pICogYTtcbiAgICAgICAgdGhpcy5ydWRkZXIgKz0gKHJ1ZGRlclRhcmdldCAtIHRoaXMucnVkZGVyKSAqIGE7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0U3RhdGUoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBnLWNvbW1hbmQgcGl0Y2ggbGF3OiBhIFBJIHJlZ3VsYXRvciBkcml2ZXMgdGhlIGxvYWQgZmFjdG9yIHRvIHRoZSBjb21tYW5kZWRcbiAgICAgKiB2YWx1ZSAoc28gbmV1dHJhbCBzdGljayBob2xkcyAxIGcgLyBsZXZlbCBmbGlnaHQgd2l0aCBubyBzdGVhZHkgZXJyb3IsIGxpa2VcbiAgICAgKiB0aGUgRi0xNidzIGludGVncmFsIHRyaW0pLCB3aXRoIHBpdGNoLXJhdGUgZGFtcGluZyBhbmQgYW4gQW9BIGxpbWl0ZXIuXG4gICAgICovXG4gICAgcHJpdmF0ZSBwaXRjaExhdyhpbnB1dDogRmNzSW5wdXQsIGR0OiBudW1iZXIpOiBudW1iZXIge1xuICAgICAgICBjb25zdCB7IG1heENvbW1hbmRHLCBtaW5Db21tYW5kRywgcGl0Y2hHR2FpbiwgcGl0Y2hJR2FpbiwgcGl0Y2hSYXRlRGFtcEdhaW4gfSA9IEZNMl9GQ1M7XG5cbiAgICAgICAgLy8gU3RpY2sgc2hhcGluZzogYSBjdWJpYyBcImV4cG9cIiAobG9nYXJpdGhtaWMtc3R5bGUpIGN1cnZlLiBOZWFyIG5ldXRyYWwgdGhlXG4gICAgICAgIC8vIHJlc3BvbnNlIGlzIGRvbWluYXRlZCBieSB0aGUgc21hbGwgKDEtZSkgbGluZWFyIHRlcm0gc28gYSBsaWdodCBwdWxsIGJhcmVseVxuICAgICAgICAvLyBjaGFuZ2VzIHRoZSBnIGNvbW1hbmQ7IGF1dGhvcml0eSByYW1wcyB1cCBzdGVlcGx5IHRvd2FyZCB0aGUgZW5kcywgYW5kIGZ1bGxcbiAgICAgICAgLy8gc3RpY2sgKMKxMSkgc3RpbGwgbWFwcyB0byDCsTEgc28gdGhlIHN0cnVjdHVyYWwgbGltaXQgcmVtYWlucyByZWFjaGFibGUuIFRoaXNcbiAgICAgICAgLy8ga2VlcHMgZmluZSBwaXRjaCBjb3JyZWN0aW9ucyBhcm91bmQgY2VudHJlIGZyb20gaGF2aW5nIGFuIG91dHNpemVkIGltcGFjdC5cbiAgICAgICAgY29uc3QgZSA9IEZNMl9GQ1MucGl0Y2hTdGlja0V4cG87XG4gICAgICAgIGNvbnN0IHNoYXBlZFN0aWNrID0gKDEgLSBlKSAqIGlucHV0LnBpdGNoU3RpY2sgKyBlICogaW5wdXQucGl0Y2hTdGljayAqKiAzO1xuXG4gICAgICAgIC8vIFN0aWNrIOKGkiBjb21tYW5kZWQgbG9hZCBmYWN0b3IgKGFib3V0IDEgZyBhdCBuZXV0cmFsIHN0aWNrKS5cbiAgICAgICAgbGV0IGNvbW1hbmRlZEc6IG51bWJlcjtcbiAgICAgICAgaWYgKHNoYXBlZFN0aWNrID49IDApIHtcbiAgICAgICAgICAgIGNvbW1hbmRlZEcgPSAxICsgc2hhcGVkU3RpY2sgKiAobWF4Q29tbWFuZEcgLSAxKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbW1hbmRlZEcgPSAxICsgc2hhcGVkU3RpY2sgKiAoMSAtIG1pbkNvbW1hbmRHKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFuZ2xlLW9mLWF0dGFjayByYXRlICjOscyHKSwgbG93LXBhc3MgZmlsdGVyZWQuIFRoaXMgaXMgdGhlIHNob3J0LXBlcmlvZFxuICAgICAgICAvLyBkYW1wZXI6IHdoZW4gdGhlIGFpcmNyYWZ0IGlzIGVuZXJneS1saW1pdGVkIGl0IGNhbm5vdCBob2xkIHRoZSBjb21tYW5kZWRcbiAgICAgICAgLy8gZywgc28gdGhlIGxvYWQtZmFjdG9yIGxvb3AgYWxvbmUgaHVudHMgYXJvdW5kIHRoZSBBb0EgbGltaXQuIERhbXBpbmcgzrHMh1xuICAgICAgICAvLyBkaXJlY3RseSBraWxscyB0aGF0IG9zY2lsbGF0aW9uIHJlZ2FyZGxlc3Mgb2YgYXZhaWxhYmxlIHRocnVzdC5cbiAgICAgICAgbGV0IGFvYVJhdGUgPSAwO1xuICAgICAgICBpZiAodGhpcy5wcmV2QW9hVmFsaWQgJiYgZHQgPiAwKSB7XG4gICAgICAgICAgICBhb2FSYXRlID0gKGlucHV0LmFvYVJhZCAtIHRoaXMucHJldkFvYSkgLyBkdDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnByZXZBb2EgPSBpbnB1dC5hb2FSYWQ7XG4gICAgICAgIHRoaXMucHJldkFvYVZhbGlkID0gdHJ1ZTtcbiAgICAgICAgY29uc3QgZkFvYSA9IGR0IDw9IDAgPyAxIDogMSAtIE1hdGguZXhwKC1kdCAvIE1hdGgubWF4KEZNMl9GQ1MuYW9hUmF0ZUZpbHRlclRhdVMsIDFlLTMpKTtcbiAgICAgICAgdGhpcy5hb2FSYXRlRmlsdCArPSAoYW9hUmF0ZSAtIHRoaXMuYW9hUmF0ZUZpbHQpICogZkFvYTtcblxuICAgICAgICAvLyBBb0EgbGltaXRlcjogZmFkZSB0aGUgbm9zZS11cCBhdXRob3JpdHkgYXMgQW9BIGFwcHJvYWNoZXMgdGhlIGxpbWl0LlxuICAgICAgICBjb25zdCBhb2FEZWcgPSBpbnB1dC5hb2FSYWQgLyBERUc7XG4gICAgICAgIGNvbnN0IGFvYUxpbWl0ZXIgPSBjbGFtcChcbiAgICAgICAgICAgIChGTTJfRkNTLmFvYUxpbWl0RGVnIC0gYW9hRGVnKSAvIChGTTJfRkNTLmFvYUxpbWl0RGVnIC0gRk0yX0ZDUy5hb2FTb2Z0RGVnKSxcbiAgICAgICAgICAgIDAsIDEsXG4gICAgICAgICk7XG4gICAgICAgIGlmIChjb21tYW5kZWRHID4gMSkge1xuICAgICAgICAgICAgY29tbWFuZGVkRyA9IDEgKyAoY29tbWFuZGVkRyAtIDEpICogYW9hTGltaXRlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGdFcnJvciA9IGNvbW1hbmRlZEcgLSBpbnB1dC5sb2FkRmFjdG9yRztcbiAgICAgICAgLy8gcGl0Y2hSYXRlIGFib3V0ICtYIGlzIG5vc2UtZG93bi1wb3NpdGl2ZSwgc28gK3BpdGNoUmF0ZSBkYW1wcyBhIG5vc2UtdXBcbiAgICAgICAgLy8gY29tbWFuZDsgLc6xzIcgdGVybSBhZGRzIGRlZGljYXRlZCBzaG9ydC1wZXJpb2QgZGFtcGluZy5cbiAgICAgICAgY29uc3QgcHJvcG9ydGlvbmFsID0gcGl0Y2hHR2FpbiAqIGdFcnJvclxuICAgICAgICAgICAgKyBwaXRjaFJhdGVEYW1wR2FpbiAqIGlucHV0LnBpdGNoUmF0ZVxuICAgICAgICAgICAgLSBGTTJfRkNTLnBpdGNoQW9hUmF0ZURhbXBHYWluICogdGhpcy5hb2FSYXRlRmlsdDtcblxuICAgICAgICAvLyBJbnRlZ3JhbCB0cmltIHdpdGggYW50aS13aW5kdXAuIEZyZWV6ZSB0aGUgYWNjdW11bGF0b3Igd2hlbmV2ZXIgdGhlIEFvQVxuICAgICAgICAvLyBsaW1pdGVyIGlzIGFjdGl2ZSAoaW4gZWl0aGVyIGVycm9yIGRpcmVjdGlvbikgYW5kIGJsZWVkIGl0IGRvd24sIHNvIGl0XG4gICAgICAgIC8vIGNhbm5vdCB3aW5kIHVwIGJlbG93IHRoZSBsaW1pdGVyIGJhbmQgYW5kIGdldCBjaG9wcGVkIGFib3ZlIGl0IOKAlCB0aGVcbiAgICAgICAgLy8gcHVtcGluZyBhY3Rpb24gdGhhdCBkcml2ZXMgdGhlIGxvdy1zcGVlZCBwaXRjaCBsaW1pdCBjeWNsZS5cbiAgICAgICAgY29uc3QgbGltaXRlckFjdGl2ZSA9IGFvYUxpbWl0ZXIgPCAwLjk5OTtcbiAgICAgICAgY29uc3QgcmF3ID0gcHJvcG9ydGlvbmFsICsgcGl0Y2hJR2FpbiAqICh0aGlzLnBpdGNoSW50ZWdyYWwgKyBnRXJyb3IgKiBkdCk7XG4gICAgICAgIGNvbnN0IG91dHB1dFNhdHVyYXRlZCA9IHJhdyA8PSAtMSB8fCByYXcgPj0gMTtcbiAgICAgICAgaWYgKCFvdXRwdXRTYXR1cmF0ZWQgJiYgIWxpbWl0ZXJBY3RpdmUpIHtcbiAgICAgICAgICAgIHRoaXMucGl0Y2hJbnRlZ3JhbCA9IGNsYW1wKHRoaXMucGl0Y2hJbnRlZ3JhbCArIGdFcnJvciAqIGR0LCAtMywgMyk7XG4gICAgICAgIH0gZWxzZSBpZiAobGltaXRlckFjdGl2ZSkge1xuICAgICAgICAgICAgY29uc3QgbGVhayA9IGR0IDw9IDAgPyAxIDogMSAtIE1hdGguZXhwKC1kdCAvIE1hdGgubWF4KEZNMl9GQ1MuaW50ZWdyYWxMZWFrVGF1UywgMWUtMykpO1xuICAgICAgICAgICAgdGhpcy5waXRjaEludGVncmFsIC09IHRoaXMucGl0Y2hJbnRlZ3JhbCAqIGxlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZWxldmF0b3IgPSBwcm9wb3J0aW9uYWwgKyBwaXRjaElHYWluICogdGhpcy5waXRjaEludGVncmFsO1xuICAgICAgICByZXR1cm4gY2xhbXAoZWxldmF0b3IsIC0xLCAxKTtcbiAgICB9XG5cbiAgICAvKiogUm9sbC1yYXRlIGNvbW1hbmQgbGF3IOKGkiBhaWxlcm9uIChhbmQgZGlmZmVyZW50aWFsIHRhaWwgdmlhIHRoZSBtb2RlbCkuICovXG4gICAgcHJpdmF0ZSByb2xsTGF3KGlucHV0OiBGY3NJbnB1dCk6IG51bWJlciB7XG4gICAgICAgIGlmIChpbnB1dC5sYW5kZWQpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG1hY2ggPSBjb21wdXRlTWFjaE51bWJlcihpbnB1dC5zcGVlZCwgaW5wdXQuYWx0aXR1ZGVNKTtcbiAgICAgICAgY29uc3QgY29tbWFuZGVkUmF0ZVJhZCA9IGNvbXB1dGVGMTZDb21tYW5kZWRSb2xsUmF0ZSh7XG4gICAgICAgICAgICBzdGljazogaW5wdXQucm9sbFN0aWNrLFxuICAgICAgICAgICAgZHluYW1pY1ByZXNzdXJlOiBpbnB1dC5keW5hbWljUHJlc3N1cmUsXG4gICAgICAgICAgICBxUmVmOiBpbnB1dC5xUmVmLFxuICAgICAgICAgICAgbWFjaCxcbiAgICAgICAgICAgIGFsdGl0dWRlTTogaW5wdXQuYWx0aXR1ZGVNLFxuICAgICAgICAgICAgYW9hUmFkOiBpbnB1dC5hb2FSYWQsXG4gICAgICAgICAgICBmbGFwc0V4dGVuZGVkOiBpbnB1dC5mbGFwc0V4dGVuZGVkLFxuICAgICAgICAgICAgbGFuZGVkOiBpbnB1dC5sYW5kZWQsXG4gICAgICAgICAgICBjb25maWc6IEYxNl9ST0xMX0NBVDEsXG4gICAgICAgIH0pO1xuICAgICAgICAvLyBDbG9zZSB0aGUgbG9vcCBvbiBib2R5IHJvbGwgcmF0ZSAoYWJvdXQgK1opLiBBIHBvc2l0aXZlIGFpbGVyb24gY29tbWFuZFxuICAgICAgICAvLyBwcm9kdWNlcyBhIE5FR0FUSVZFIHJvbGwgbW9tZW50IChzZWUgdGhlIG1vZGVsJ3MgY29udHJvbCBtYXBwaW5nKSwgc28gdGhlXG4gICAgICAgIC8vIGVycm9yIGlzIChyYXRlIOKIkiBjb21tYW5kKSB0byBrZWVwIHRoZSBmZWVkYmFjayBuZWdhdGl2ZS5cbiAgICAgICAgY29uc3QgcmF0ZUVycm9yID0gaW5wdXQucm9sbFJhdGUgLSBjb21tYW5kZWRSYXRlUmFkO1xuICAgICAgICByZXR1cm4gY2xhbXAoRk0yX0ZDUy5yb2xsUmF0ZUdhaW4gKiByYXRlRXJyb3IsIC0xLCAxKTtcbiAgICB9XG5cbiAgICAvKiogWWF3IGRhbXBlciAod2FzaGVkIG91dCkgKyBhaWxlcm9uLXJ1ZGRlciBpbnRlcmNvbm5lY3QgKyBwZWRhbC4gKi9cbiAgICBwcml2YXRlIHlhd0xhdyhpbnB1dDogRmNzSW5wdXQsIGFpbGVyb25DbWQ6IG51bWJlciwgZHQ6IG51bWJlcik6IG51bWJlciB7XG4gICAgICAgIC8vIFdhc2hvdXQ6IGhpZ2gtcGFzcyB0aGUgeWF3IHJhdGUgc28gYSBzdGVhZHkgdHVybiBpcyBub3Qgb3Bwb3NlZC5cbiAgICAgICAgY29uc3QgdGF1ID0gTWF0aC5tYXgoRk0yX0ZDUy55YXdEYW1wZXJXYXNob3V0VGF1UywgMWUtMyk7XG4gICAgICAgIGNvbnN0IGEgPSBkdCA8PSAwID8gMSA6IDEgLSBNYXRoLmV4cCgtZHQgLyB0YXUpO1xuICAgICAgICB0aGlzLnlhd1JhdGVMb3dQYXNzICs9IChpbnB1dC55YXdSYXRlIC0gdGhpcy55YXdSYXRlTG93UGFzcykgKiBhO1xuICAgICAgICBjb25zdCB5YXdSYXRlSGlnaFBhc3MgPSBpbnB1dC55YXdSYXRlIC0gdGhpcy55YXdSYXRlTG93UGFzcztcblxuICAgICAgICBjb25zdCBkYW1wZXIgPSAtRk0yX0ZDUy55YXdEYW1wZXJHYWluICogeWF3UmF0ZUhpZ2hQYXNzO1xuICAgICAgICBjb25zdCBhcmkgPSBGTTJfRkNTLmFyaUdhaW4gKiBhaWxlcm9uQ21kOyAvLyBjb29yZGluYXRlIHR1cm5zXG4gICAgICAgIGNvbnN0IHBlZGFsID0gaW5wdXQueWF3UGVkYWwgKiBGTTJfRkNTLm1heFJ1ZGRlckNtZDtcbiAgICAgICAgcmV0dXJuIGNsYW1wKHBlZGFsICsgZGFtcGVyICsgYXJpLCAtMSwgMSk7XG4gICAgfVxufVxuIiwiLyoqXG4gKiBGTTIg4oCUIEYtMTZDIHJpZ2lkLWJvZHkgXCJwYXJ0c1wiIGZsaWdodCBtb2RlbCBjb25maWd1cmF0aW9uLlxuICpcbiAqIFRoaXMgbW9kZWwgdHJlYXRzIHRoZSBhaXJjcmFmdCBhcyBhIHNpbmdsZSByaWdpZCBib2R5IHdob3NlIGFlcm9keW5hbWljXG4gKiBmb3JjZXMgYXJlIGJ1aWx0IHVwIGZyb20gZGlzY3JldGUgbGlmdGluZyBzdXJmYWNlcyAoYSBjb21wb25lbnQgYnVpbGQtdXAgL1xuICogXCJwYXJ0c1wiIG1vZGVsKS4gRWFjaCBzdXJmYWNlIGdlbmVyYXRlcyBsaWZ0IGFuZCBkcmFnIGZyb20gdGhlIExPQ0FMIGFpcmZsb3dcbiAqIGl0IGV4cGVyaWVuY2VzLCB3aGljaCBpcyB0aGUgYWlyY3JhZnQgYm9keSB2ZWxvY2l0eSBQTFVTIHRoZSBjb250cmlidXRpb24gb2ZcbiAqIHRoZSBib2R5J3MgYW5ndWxhciB2ZWxvY2l0eSBhdCB0aGUgc3VyZmFjZSBsb2NhdGlvbiAoz4kgw5cgcikuIEJlY2F1c2UgZXZlcnlcbiAqIGZvcmNlIGlzIGFwcGxpZWQgYXQgdGhlIHN1cmZhY2UncyByZWFsIGxvY2F0aW9uLCBwaXRjaGluZy9yb2xsaW5nL3lhd2luZ1xuICogTU9NRU5UUyDigJQgYW5kLCBjcnVjaWFsbHksIHRoZSBhZXJvZHluYW1pYyBEQU1QSU5HIG9mIHRob3NlIHJhdGVzIOKAlCBlbWVyZ2VcbiAqIG5hdHVyYWxseSBmcm9tIHRoZSBnZW9tZXRyeSBpbnN0ZWFkIG9mIGJlaW5nIGhhbmQtYXV0aG9yZWQuXG4gKlxuICogQm9keSBheGVzIChtYXRjaGluZyB0aGUgc2ltJ3MgVEhSRUUuanMgY29udmVudGlvbiwgc2VlIHV0aWxzL21hdGgudHMpOlxuICogICArWCA9IFJJR0hUIChvdXQgdGhlIHJpZ2h0IHdpbmcpXG4gKiAgICtZID0gVVBcbiAqICAgK1ogPSBGT1JXQVJEIChvdXQgdGhlIG5vc2UpXG4gKiBUaGlzIGlzIGEgcmlnaHQtaGFuZGVkIGZyYW1lOiBSSUdIVCDDlyBVUCA9IEZPUldBUkQuXG4gKlxuICogUmVmZXJlbmNlIGRhdGE6XG4gKiAgIC0gR2VvbWV0cnkgLyBtYXNzOiBHZW5lcmFsIER5bmFtaWNzIEYtMTZDIChKYW5lJ3MsIFVTQUYgZmFjdCBzaGVldCkuXG4gKiAgIC0gSW5lcnRpYTogTkFTQSBUUC0xNTM4IC8gU3RldmVucyAmIExld2lzIFwiQWlyY3JhZnQgQ29udHJvbCBhbmQgU2ltdWxhdGlvblwiXG4gKiAgICAgbm9taW5hbCBGLTE2IChjb252ZXJ0ZWQgZnJvbSBzbHVnwrdmdMKyIGFuZCByb3RhdGVkIGludG8gdGhlIHNpbSBib2R5IGZyYW1lKS5cbiAqICAgLSBBZXJvIGNvZWZmaWNpZW50cyB0dW5lZCB0byBSZWhtYW4sIFwiQWVyb2R5bmFtaWMgUGVyZm9ybWFuY2UgQW5hbHlzaXMgb2ZcbiAqICAgICBGLTE2QyBGaWdodGluZyBGYWxjb25cIiAoQ0QwIOKJiCAwLjAxOCwgSyDiiYggMC4xNDksIENMzrEg4omIIDMuNuKAkzUuNy9yYWQsXG4gKiAgICAgTC9EX21heCDiiYggOS434oCTMTQpIGFuZCB0aGUgc2ltJ3MgZXhpc3RpbmcgRjE2X1BST0ZJTEUgZW52ZWxvcGUuXG4gKi9cbmltcG9ydCB7IEYxNl9QUk9GSUxFIH0gZnJvbSAnLi4vZjE2UHJvZmlsZSc7XG5cbmNvbnN0IERFRyA9IE1hdGguUEkgLyAxODA7XG5cbi8qKiBSZWZlcmVuY2UgZ2VvbWV0cnkgKFNJKS4gKi9cbmV4cG9ydCBjb25zdCBGTTJfR0VPTUVUUlkgPSB7XG4gICAgbWFzc0tnOiBGMTZfUFJPRklMRS5zaW1NYXNzS2csICAgICAgLy8gfjEzLDYwOCBrZyB0eXBpY2FsIHRha2VvZmYgZ3Jvc3NcbiAgICB3aW5nQXJlYU0yOiBGMTZfUFJPRklMRS53aW5nQXJlYU0yLCAvLyAyNy44NyBtwrIgcmVmZXJlbmNlIHBsYW5mb3JtXG4gICAgd2luZ1NwYW5NOiBGMTZfUFJPRklMRS53aW5nU3Bhbk0sICAgLy8gOS40NSBtXG4gICAgbWVhbkNob3JkTTogMy40NSwgICAgICAgICAgICAgICAgICAgLy8gbWVhbiBhZXJvZHluYW1pYyBjaG9yZCAofjExLjMgZnQpXG59IGFzIGNvbnN0O1xuXG4vKipcbiAqIFByaW5jaXBhbCBtb21lbnRzIG9mIGluZXJ0aWEgaW4gdGhlIFNJTSBib2R5IGZyYW1lIChrZ8K3bcKyKS5cbiAqXG4gKiBOQVNBL1N0ZXZlbnMtTGV3aXMgRi0xNiAoYWVyb3NwYWNlIFgtZndkLFktcmlnaHQsWi1kb3duKTpcbiAqICAgSXh4KHJvbGwpPTk0OTYsIEl5eShwaXRjaCk9NTU4MTQsIEl6eih5YXcpPTYzMTAwIHNsdWfCt2Z0wrIgICjDlyAxLjM1NTgyIOKGkiBrZ8K3bcKyKVxuICogTWFwcGluZyB0byBzaW0gYXhlczogcm9sbOKGlCtaLCBwaXRjaOKGlCtYLCB5YXfihpQrWS4gVGhlIHNtYWxsIEl4eiBwcm9kdWN0IG9mXG4gKiBpbmVydGlhICjiiYgxMzMxIGtnwrdtwrIpIGlzIG5lZ2xlY3RlZCDigJQgaXQgaXMgfjIlIG9mIHRoZSB5YXcvcm9sbCBpbmVydGlhcyBhbmRcbiAqIG9ubHkgcHJvZHVjZXMgbWlub3IgaW5lcnRpYWwgcm9sbOKGlHlhdyBjcm9zcy1jb3VwbGluZy5cbiAqL1xuZXhwb3J0IGNvbnN0IEZNMl9JTkVSVElBID0ge1xuICAgIHBpdGNoOiA1NTgxNCAqIDEuMzU1ODIsIC8vIGFib3V0ICtYIChSSUdIVCkgIOKJiCA3NSw2NzIga2fCt23CslxuICAgIHlhdzogNjMxMDAgKiAxLjM1NTgyLCAgIC8vIGFib3V0ICtZIChVUCkgICAgIOKJiCA4NSw1NTIga2fCt23CslxuICAgIHJvbGw6IDk0OTYgKiAxLjM1NTgyLCAgIC8vIGFib3V0ICtaIChGT1JXQVJEKSDiiYggMTIsODc0IGtnwrdtwrJcbn0gYXMgY29uc3Q7XG5cbi8qKiBIb3cgYSBzdXJmYWNlJ3MgbGlmdCBwbGFuZSBpcyBvcmllbnRlZCBpbiB0aGUgYm9keSBmcmFtZS4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU3VyZmFjZUdlb21ldHJ5IHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgLyoqIEFwcGxpY2F0aW9uIHBvaW50IHJlbGF0aXZlIHRvIENHLCBib2R5IGZyYW1lIChtKS4gKi9cbiAgICBwb3NpdGlvbjogW251bWJlciwgbnVtYmVyLCBudW1iZXJdO1xuICAgIC8qKiBMaWZ0IGRpcmVjdGlvbiBhdCBwb3NpdGl2ZSBBb0EsIGJvZHkgZnJhbWUgdW5pdCB2ZWN0b3IuICovXG4gICAgdXA6IFtudW1iZXIsIG51bWJlciwgbnVtYmVyXTtcbiAgICAvKiogQ2hvcmQgKHplcm8tbGlmdCByZWZlcmVuY2UpIGRpcmVjdGlvbiwgYm9keSBmcmFtZSB1bml0IHZlY3RvciAobm9taW5hbGx5ICtaKS4gKi9cbiAgICBmb3J3YXJkOiBbbnVtYmVyLCBudW1iZXIsIG51bWJlcl07XG4gICAgLyoqIFBsYW5mb3JtIGFyZWEgb2YgdGhpcyBzdXJmYWNlIChtwrIpLiAqL1xuICAgIGFyZWFNMjogbnVtYmVyO1xuICAgIC8qKiBMaWZ0LWN1cnZlIHNsb3BlIChwZXIgcmFkaWFuKSBpbiB0aGUgbGluZWFyIHJhbmdlLiAqL1xuICAgIGxpZnRTbG9wZVBlclJhZDogbnVtYmVyO1xuICAgIC8qKiBTdGFsbCBhbmdsZSBvZiBhdHRhY2sgKHJhZCkuIEJleW9uZCB0aGlzLCBDTCBjb2xsYXBzZXMuICovXG4gICAgc3RhbGxBb2FSYWQ6IG51bWJlcjtcbiAgICAvKiogUHJvZmlsZSAoemVyby1saWZ0KSBkcmFnIGNvZWZmaWNpZW50IG9mIHRoaXMgc3VyZmFjZS4gKi9cbiAgICBjZDA6IG51bWJlcjtcbiAgICAvKiogSW5kdWNlZC1kcmFnIGZhY3RvcjogQ0RfaSA9IGluZHVjZWRLIMK3IENMwrIuICovXG4gICAgaW5kdWNlZEs6IG51bWJlcjtcbiAgICAvKiogzpRBb0EgKHJhZCkgcHJvZHVjZWQgcGVyIHVuaXQgY29udHJvbCBkZWZsZWN0aW9uIFstMSwxXSAoMCA9IG5vIGNvbnRyb2wpLiAqL1xuICAgIGNvbnRyb2xFZmZlY3RpdmVuZXNzOiBudW1iZXI7XG59XG5cbi8qKlxuICogVGhlIEYtMTYgYXMgYSBzZXQgb2YgcmlnaWQgbGlmdGluZyBzdXJmYWNlcy5cbiAqXG4gKiBMYXRlcmFsIHNwbGl0IG9mIHRoZSB3aW5nIGFuZCBob3Jpem9udGFsIHRhaWwgaXMgZGVsaWJlcmF0ZTogaXQgbGV0cyByb2xsXG4gKiBkYW1waW5nLCBkaWZmZXJlbnRpYWwtdGFpbCAodGFpbGVyb24pIHJvbGwgYXV0aG9yaXR5IGFuZCBkaWhlZHJhbC9zaWRlc2xpcFxuICogZWZmZWN0cyBmYWxsIG91dCBvZiB0aGUgZ2VvbWV0cnkgcmF0aGVyIHRoYW4gYmVpbmcgZmFrZWQuIFRoZSBob3Jpem9udGFsIGFuZFxuICogdmVydGljYWwgdGFpbHMgc2l0IHdlbGwgYWZ0IG9mIHRoZSBDRyAo4oiSWikgd2hpY2ggcHJvdmlkZXMgdGhlIHN0YXRpYyBwaXRjaFxuICogYW5kIHlhdyBzdGFiaWxpdHkgYW5kIHRoZSBhZXJvZHluYW1pYyBwaXRjaC95YXcgcmF0ZSBkYW1waW5nLlxuICovXG5leHBvcnQgY29uc3QgRk0yX1NVUkZBQ0VTOiBSZWNvcmQ8c3RyaW5nLCBTdXJmYWNlR2VvbWV0cnk+ID0ge1xuICAgIC8qKlxuICAgICAqIEJsZW5kZWQgZnVzZWxhZ2UgLyBzdHJha2UgbGlmdGluZyBib2R5LiBUaGUgRi0xNiBpcyBhIGxpZnRpbmctYm9keSBkZXNpZ246XG4gICAgICogdGhlIHdpZGUgZm9yZWJvZHkgYW5kIGxlYWRpbmctZWRnZSBzdHJha2VzIGNhcnJ5IGEgbGFyZ2Ugc2hhcmUgb2YgdGhlIHRvdGFsXG4gICAgICogbGlmdC4gVGhpcyBzdXJmYWNlIGlzIHNpemVkIHNvIHRoZSBmdXNlbGFnZSBwcm9kdWNlcyB+MzAlIG9mIHRoZSBhaXJjcmFmdCdzXG4gICAgICogbGlmdCDigJQgaXRzIGxpZnQtY3VydmUgY29udHJpYnV0aW9uIChDTM6xwrdTID0gMi40IMOXIDE2LjAg4omIIDM4LjQpIGlzIDMvNyBvZiB0aGVcbiAgICAgKiBjb21iaW5lZCB3aW5nIGNvbnRyaWJ1dGlvbiAoMiDDlyA1LjIgw5cgOC42IOKJiCA4OS40KSwgc29cbiAgICAgKiAzOC40IC8gKDM4LjQgKyA4OS40KSDiiYggMC4zMCBvZiB0aGUgd2luZytib2R5IGxpZnQgdGhyb3VnaG91dCB0aGUgbGluZWFyXG4gICAgICogcmFuZ2UuIEl0IGFjdHMgYXQgdGhlIENHIChubyB0cmltIG1vbWVudCk7IHBhcmFzaXRlIGZvcm0gZHJhZyBzdGF5cyBpblxuICAgICAqIEZNMl9CT0RZX0NEMCwgc28gY2QwIGhlcmUgaXMgMCB0byBhdm9pZCBkb3VibGUtY291bnRpbmcuXG4gICAgICovXG4gICAgZnVzZWxhZ2U6IHtcbiAgICAgICAgbmFtZTogJ2Z1c2VsYWdlJyxcbiAgICAgICAgcG9zaXRpb246IFswLjAsIDAuMCwgMC4wXSxcbiAgICAgICAgdXA6IFswLCAxLCAwXSxcbiAgICAgICAgZm9yd2FyZDogWzAsIDAsIDFdLFxuICAgICAgICBhcmVhTTI6IDE2LjAsXG4gICAgICAgIGxpZnRTbG9wZVBlclJhZDogMi40LFxuICAgICAgICBzdGFsbEFvYVJhZDogNDAgKiBERUcsIC8vIGEgbG93LWFzcGVjdCBib2R5IHN0YWxscyBsYXRlIGFuZCBnZW50bHlcbiAgICAgICAgY2QwOiAwLjAsXG4gICAgICAgIGluZHVjZWRLOiAwLjI1LFxuICAgICAgICBjb250cm9sRWZmZWN0aXZlbmVzczogMCxcbiAgICB9LFxuICAgIHdpbmdMZWZ0OiB7XG4gICAgICAgIG5hbWU6ICd3aW5nTGVmdCcsXG4gICAgICAgIHBvc2l0aW9uOiBbLTIuMSwgMC4wLCAtMC4xNV0sXG4gICAgICAgIHVwOiBbMCwgMSwgMF0sXG4gICAgICAgIGZvcndhcmQ6IFswLCAwLCAxXSxcbiAgICAgICAgYXJlYU0yOiA4LjYsXG4gICAgICAgIGxpZnRTbG9wZVBlclJhZDogNS4yLFxuICAgICAgICBzdGFsbEFvYVJhZDogMjQgKiBERUcsXG4gICAgICAgIGNkMDogMC4wMDg1LFxuICAgICAgICBpbmR1Y2VkSzogMC4xMTgsXG4gICAgICAgIGNvbnRyb2xFZmZlY3RpdmVuZXNzOiAwLCAvLyBhaWxlcm9ucyBhcHBsaWVkIHNlcGFyYXRlbHkgYmVsb3dcbiAgICB9LFxuICAgIHdpbmdSaWdodDoge1xuICAgICAgICBuYW1lOiAnd2luZ1JpZ2h0JyxcbiAgICAgICAgcG9zaXRpb246IFsyLjEsIDAuMCwgLTAuMTVdLFxuICAgICAgICB1cDogWzAsIDEsIDBdLFxuICAgICAgICBmb3J3YXJkOiBbMCwgMCwgMV0sXG4gICAgICAgIGFyZWFNMjogOC42LFxuICAgICAgICBsaWZ0U2xvcGVQZXJSYWQ6IDUuMixcbiAgICAgICAgc3RhbGxBb2FSYWQ6IDI0ICogREVHLFxuICAgICAgICBjZDA6IDAuMDA4NSxcbiAgICAgICAgaW5kdWNlZEs6IDAuMTE4LFxuICAgICAgICBjb250cm9sRWZmZWN0aXZlbmVzczogMCxcbiAgICB9LFxuICAgIGh0YWlsTGVmdDoge1xuICAgICAgICBuYW1lOiAnaHRhaWxMZWZ0JyxcbiAgICAgICAgcG9zaXRpb246IFstMS41LCAwLjAsIC00LjZdLFxuICAgICAgICB1cDogWzAsIDEsIDBdLFxuICAgICAgICBmb3J3YXJkOiBbMCwgMCwgMV0sXG4gICAgICAgIGFyZWFNMjogMi45NSxcbiAgICAgICAgbGlmdFNsb3BlUGVyUmFkOiAzLjQsXG4gICAgICAgIHN0YWxsQW9hUmFkOiAyNiAqIERFRyxcbiAgICAgICAgY2QwOiAwLjAwNixcbiAgICAgICAgaW5kdWNlZEs6IDAuMTUsXG4gICAgICAgIGNvbnRyb2xFZmZlY3RpdmVuZXNzOiAwLjksIC8vIGFsbC1tb3Zpbmcgc3RhYmlsYXRvclxuICAgIH0sXG4gICAgaHRhaWxSaWdodDoge1xuICAgICAgICBuYW1lOiAnaHRhaWxSaWdodCcsXG4gICAgICAgIHBvc2l0aW9uOiBbMS41LCAwLjAsIC00LjZdLFxuICAgICAgICB1cDogWzAsIDEsIDBdLFxuICAgICAgICBmb3J3YXJkOiBbMCwgMCwgMV0sXG4gICAgICAgIGFyZWFNMjogMi45NSxcbiAgICAgICAgbGlmdFNsb3BlUGVyUmFkOiAzLjQsXG4gICAgICAgIHN0YWxsQW9hUmFkOiAyNiAqIERFRyxcbiAgICAgICAgY2QwOiAwLjAwNixcbiAgICAgICAgaW5kdWNlZEs6IDAuMTUsXG4gICAgICAgIGNvbnRyb2xFZmZlY3RpdmVuZXNzOiAwLjksXG4gICAgfSxcbiAgICB2dGFpbDoge1xuICAgICAgICBuYW1lOiAndnRhaWwnLFxuICAgICAgICBwb3NpdGlvbjogWzAuMCwgMS4xLCAtNC4zXSxcbiAgICAgICAgdXA6IFsxLCAwLCAwXSwgLy8gc2lkZSBmb3JjZSBhY3RzIGFsb25nICtYXG4gICAgICAgIGZvcndhcmQ6IFswLCAwLCAxXSxcbiAgICAgICAgYXJlYU0yOiA1LjEsXG4gICAgICAgIGxpZnRTbG9wZVBlclJhZDogMi45LFxuICAgICAgICBzdGFsbEFvYVJhZDogMzAgKiBERUcsXG4gICAgICAgIGNkMDogMC4wMDcsXG4gICAgICAgIGluZHVjZWRLOiAwLjE2LFxuICAgICAgICBjb250cm9sRWZmZWN0aXZlbmVzczogMC41NSwgLy8gcnVkZGVyXG4gICAgfSxcbn07XG5cbi8qKlxuICogQWlsZXJvbiAocm9sbCkgcGFyYW1ldGVycyDigJQgZGlmZmVyZW50aWFsIGluY2lkZW5jZSBhZGRlZCB0byBlYWNoIHdpbmcuXG4gKiBTaXplZCBzbyB0aGF0IGZ1bGwgZGVmbGVjdGlvbiBwcm9kdWNlcyByb3VnaGx5IHRoZSBGLTE2J3MgfjM2MMKwL3Mgb3Blbi1sb29wXG4gKiByb2xsIHJhdGUgKGFlcm8gcm9sbCBkYW1waW5nIGJhbGFuY2VzIGNvbnRyb2wgcG93ZXIpOyB0aGUgRkJXIHJhdGUgbG9vcCB0aGVuXG4gKiBjYXBzIHRoZSBjb21tYW5kZWQgcmF0ZSBuZWFyIDMwMMKwL3MuXG4gKi9cbmV4cG9ydCBjb25zdCBGTTJfQUlMRVJPTiA9IHtcbiAgICAvKiogzpRBb0EgKHJhZCkgYXQgZWFjaCB3aW5nIHBlciB1bml0IGFpbGVyb24gY29tbWFuZCBbLTEsMV0uICovXG4gICAgbWF4RGVmbGVjdGlvblJhZDogNC4yICogREVHLFxufSBhcyBjb25zdDtcblxuLyoqIFN5bW1ldHJpYyBmbGFwIGNhbWJlciBpbmNyZW1lbnQgKHJhZCBvZiBlZmZlY3RpdmUgd2luZyBpbmNpZGVuY2UpIHdpdGggZmxhcHMgZG93bi4gKi9cbmV4cG9ydCBjb25zdCBGTTJfRkxBUFMgPSB7XG4gICAgYW9hQmlhc1JhZDogOCAqIERFRyxcbiAgICBzdGFsbFJlZHVjdGlvblJhZDogMSAqIERFRyxcbiAgICBleHRyYUNkOiAwLjAyMCxcbn0gYXMgY29uc3Q7XG5cbi8qKiBMYW5kaW5nIGdlYXIgcGFyYXNpdGUgZHJhZyBpbmNyZW1lbnQgKENEIHJlZmVyZW5jZWQgdG8gd2luZyBhcmVhKS4gKi9cbmV4cG9ydCBjb25zdCBGTTJfR0VBUl9DRCA9IDAuMDIyO1xuXG4vKiogRnVzZWxhZ2UgLyBtaXNjZWxsYW5lb3VzIHBhcmFzaXRlIGRyYWcgKENEIHJlZmVyZW5jZWQgdG8gd2luZyBhcmVhKS4gKi9cbmV4cG9ydCBjb25zdCBGTTJfQk9EWV9DRDAgPSAwLjAxMDtcblxuLyoqIEV4dHJhIHRyYW5zb25pYy9zdXBlcnNvbmljIHdhdmUtZHJhZyBzY2FsZSBhcHBsaWVkIGFib3ZlIHRoZSBkaXZlcmdlbmNlIE1hY2guICovXG5leHBvcnQgY29uc3QgRk0yX1dBVkVfRFJBRyA9IHtcbiAgICBtYWNoT25zZXQ6IDAuOTUsXG4gICAgc2NhbGU6IDAuNTUsXG59IGFzIGNvbnN0O1xuXG4vKipcbiAqIEZseS1ieS13aXJlIGNvbnRyb2wtbGF3IGdhaW5zLiBUaGUgRi0xNiBpcyBhZXJvZHluYW1pY2FsbHkgcmVsYXhlZC1zdGFiaWxpdHlcbiAqIGFuZCBvbmx5IGZseWFibGUgdGhyb3VnaCBpdHMgRkJXIHN5c3RlbSwgc28gdGhlc2UgZ2FpbnMgYXJlIHdoYXQgZ2l2ZSB0aGVcbiAqIGFpcmNyYWZ0IGl0cyBoYW5kbGluZyBxdWFsaXRpZXMgKGNyaXNwIH4zMDDCsC9zIHJvbGwsIGcvQW9BLWxpbWl0ZWQgcGl0Y2gsXG4gKiBjb29yZGluYXRlZCB5YXcpIHJhdGhlciB0aGFuIHRoZSBiYXJlLWFpcmZyYW1lIHJlc3BvbnNlLlxuICovXG5leHBvcnQgY29uc3QgRk0yX0ZDUyA9IHtcbiAgICAvKiogUG9zaXRpdmUvbmVnYXRpdmUgc3RydWN0dXJhbCBnIGNvbW1hbmQgbGltaXRzLiAqL1xuICAgIG1heENvbW1hbmRHOiBGMTZfUFJPRklMRS5tYXhMb2FkRmFjdG9yRywgLy8gOS41XG4gICAgbWluQ29tbWFuZEc6IC0zLjAsXG4gICAgLyoqIENvbW1hbmQgQW9BIGxpbWl0ZXIgKGRlZykuIFdpZGVuZWQgZmFkZSBiYW5kIHNvIGF1dGhvcml0eSB0YXBlcnMgZ2VudGx5LiAqL1xuICAgIGFvYUxpbWl0RGVnOiAyNixcbiAgICBhb2FTb2Z0RGVnOiAxOCxcblxuICAgIC8qKlxuICAgICAqIFBpdGNoIGxvb3A6IHN0YWJpbGF0b3IgY29tbWFuZCBwZXIgdW5pdCBnIGVycm9yLCBpbnRlZ3JhbCB0cmltLCBwaXRjaC1yYXRlXG4gICAgICogZGFtcGluZywgYW5kIHN0aWNrIHNoYXBpbmcuXG4gICAgICpcbiAgICAgKiBgcGl0Y2hTdGlja0V4cG9gIGJsZW5kcyBhIGN1YmljIGludG8gdGhlIHN0aWNr4oaSZyBtYXAgKDAgPSBsaW5lYXIsIDEgPSBwdXJlXG4gICAgICogY3ViaWMpIHNvIHNtYWxsIGRlZmxlY3Rpb25zIGFyZSB2ZXJ5IGdlbnRsZSDigJQgYSBsb2dhcml0aG1pYy1zdHlsZSBmZWVsIHdoZXJlIGFcbiAgICAgKiBsaWdodCBwdWxsIG5lYXIgY2VudHJlIGJhcmVseSBtb3ZlcyB0aGUgZyBjb21tYW5kIOKAlCB3aGlsZSBmdWxsIHN0aWNrIHN0aWxsXG4gICAgICogcmVhY2hlcyB0aGUgc3RydWN0dXJhbCBsaW1pdC5cbiAgICAgKiBgaW50ZWdyYWxMZWFrVGF1U2AgYmxlZWRzIHRoZSB0cmltIGludGVncmF0b3IgZG93biB3aGlsZSB0aGUgQW9BIGxpbWl0ZXIgaXNcbiAgICAgKiBhY3RpdmUsIHByZXZlbnRpbmcgd2luZC11cCBhZ2FpbnN0IHRoZSBsaW1pdCAodGhlIGNhdXNlIG9mIHRoZSBwaXRjaCBodW50aW5nKS5cbiAgICAgKi9cbiAgICBwaXRjaEdHYWluOiAwLjE0LFxuICAgIHBpdGNoSUdhaW46IDAuNixcbiAgICBwaXRjaFJhdGVEYW1wR2FpbjogMS4xLFxuICAgIHBpdGNoQW9hUmF0ZURhbXBHYWluOiA0LjUsXG4gICAgYW9hUmF0ZUZpbHRlclRhdVM6IDAuMDUsXG4gICAgcGl0Y2hTdGlja0V4cG86IDAuOTIsXG4gICAgaW50ZWdyYWxMZWFrVGF1UzogMC4zNSxcbiAgICBtYXhTdGFiaWxhdG9yUmFkOiAyNSAqIERFRyxcblxuICAgIC8qKiBSb2xsIGxvb3A6IHJhdGUgY29tbWFuZCBhbmQgcHJvcG9ydGlvbmFsIGdhaW4gdG8gYWlsZXJvbi90YWlsZXJvbi4gKi9cbiAgICBtYXhSb2xsUmF0ZURlZ1M6IEYxNl9QUk9GSUxFLm1heFJvbGxSYXRlRGVnUywgLy8gMzAwXG4gICAgcm9sbFJhdGVHYWluOiAwLjgsXG4gICAgcm9sbERhbXBlckdhaW46IDAuMDYsXG4gICAgLyoqIEZyYWN0aW9uIG9mIHJvbGwgY29tbWFuZCByb3V0ZWQgdG8gdGhlIGRpZmZlcmVudGlhbCBzdGFiaWxhdG9yICh0YWlsZXJvbikuICovXG4gICAgdGFpbGVyb25Sb2xsRnJhY3Rpb246IDAuMTIsXG5cbiAgICAvKiogWWF3IGxvb3A6IHBlZGFsIGF1dGhvcml0eSwgeWF3LXJhdGUgZGFtcGVyICh3YXNoZWQgb3V0KSwgYWlsZXJvbi1ydWRkZXIgaW50ZXJjb25uZWN0LiAqL1xuICAgIG1heFJ1ZGRlckNtZDogMS4wLFxuICAgIHlhd0RhbXBlckdhaW46IDEuNixcbiAgICB5YXdEYW1wZXJXYXNob3V0VGF1UzogMS4wLFxuICAgIGFyaUdhaW46IDAuMTAsXG5cbiAgICAvKiogQWN0dWF0b3IgZmlyc3Qtb3JkZXIgbGFnIHRpbWUgY29uc3RhbnQgKHMpLiAqL1xuICAgIGFjdHVhdG9yVGF1UzogMC4wNSxcbn0gYXMgY29uc3Q7XG4iLCIvKipcbiAqIEdlbmVyaWMgNi1ET0YgcmlnaWQgYm9keSBpbnRlZ3JhdG9yIChOZXd0b27igJNFdWxlcikuXG4gKlxuICogVHJhbnNsYXRpb25hbCBkeW5hbWljcyBhcmUgaW50ZWdyYXRlZCBpbiB0aGUgV09STEQgZnJhbWUgKHNvIHRoZSByZXN1bHQgbWFwc1xuICogZGlyZWN0bHkgb250byB0aGUgc2ltJ3Mgd29ybGQtc3BhY2UgdmVsb2NpdHkvcG9zaXRpb24pLiBSb3RhdGlvbmFsIGR5bmFtaWNzXG4gKiBhcmUgaW50ZWdyYXRlZCBpbiB0aGUgQk9EWSBmcmFtZSwgd2hpY2ggaXMgdGhlIG5hdHVyYWwgZnJhbWUgZm9yIHRoZSBpbmVydGlhXG4gKiB0ZW5zb3IgYW5kIGZvciBFdWxlcidzIGVxdWF0aW9uOlxuICpcbiAqICAgICBJIMK3IM+JzIcgPSBNIOKIkiDPiSDDlyAoSSDCtyDPiSlcbiAqXG4gKiB3aXRoIGEgZGlhZ29uYWwgaW5lcnRpYSB0ZW5zb3IgSSA9IGRpYWcoSXgsIEl5LCBJeikuIFRoZSDPiSDDlyAoScK3z4kpXG4gKiBneXJvc2NvcGljIHRlcm0gY291cGxlcyB0aGUgYXhlcyBhbmQgcmVwcm9kdWNlcyBlZmZlY3RzIHN1Y2ggYXMgaW5lcnRpYWxcbiAqIHBpdGNoLXVwIGluIGEgcm9sbGluZyBwdWxsLiBPcmllbnRhdGlvbiBpcyBhZHZhbmNlZCBieSBjb21wb3NpbmcgdGhlIGJvZHlcbiAqIHF1YXRlcm5pb24gd2l0aCB0aGUgaW5jcmVtZW50YWwgcm90YXRpb24gZXhwKMK9IM+JIGR0KS5cbiAqL1xuaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEluZXJ0aWFEaWFnb25hbCB7XG4gICAgLyoqIE1vbWVudCBvZiBpbmVydGlhIGFib3V0IGJvZHkgK1ggKFJJR0hUIC8gcGl0Y2ggYXhpcykuICovXG4gICAgeDogbnVtYmVyO1xuICAgIC8qKiBNb21lbnQgb2YgaW5lcnRpYSBhYm91dCBib2R5ICtZIChVUCAvIHlhdyBheGlzKS4gKi9cbiAgICB5OiBudW1iZXI7XG4gICAgLyoqIE1vbWVudCBvZiBpbmVydGlhIGFib3V0IGJvZHkgK1ogKEZPUldBUkQgLyByb2xsIGF4aXMpLiAqL1xuICAgIHo6IG51bWJlcjtcbn1cblxuZXhwb3J0IGNsYXNzIFJpZ2lkQm9keSB7XG4gICAgcmVhZG9ubHkgbWFzczogbnVtYmVyO1xuICAgIHJlYWRvbmx5IGluZXJ0aWE6IEluZXJ0aWFEaWFnb25hbDtcblxuICAgIC8qKiBPcmllbnRhdGlvbjogYm9keSDihpIgd29ybGQuICovXG4gICAgcmVhZG9ubHkgb3JpZW50YXRpb24gPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuICAgIC8qKiBMaW5lYXIgdmVsb2NpdHksIHdvcmxkIGZyYW1lIChtL3MpLiAqL1xuICAgIHJlYWRvbmx5IHZlbG9jaXR5V29ybGQgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIC8qKiBBbmd1bGFyIHZlbG9jaXR5LCBib2R5IGZyYW1lIChyYWQvcyk6IChwaXRjaCwgeWF3LCByb2xsKSBhYm91dCAoWCwgWSwgWikuICovXG4gICAgcmVhZG9ubHkgYW5ndWxhclZlbG9jaXR5Qm9keSA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IF9pdyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSByZWFkb25seSBfZ3lybyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSByZWFkb25seSBfYW5nQWNjZWwgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgX2RxID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9heGlzID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuICAgIGNvbnN0cnVjdG9yKG1hc3M6IG51bWJlciwgaW5lcnRpYTogSW5lcnRpYURpYWdvbmFsKSB7XG4gICAgICAgIHRoaXMubWFzcyA9IG1hc3M7XG4gICAgICAgIHRoaXMuaW5lcnRpYSA9IGluZXJ0aWE7XG4gICAgfVxuXG4gICAgcmVzZXQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMub3JpZW50YXRpb24uaWRlbnRpdHkoKTtcbiAgICAgICAgdGhpcy52ZWxvY2l0eVdvcmxkLnNldCgwLCAwLCAwKTtcbiAgICAgICAgdGhpcy5hbmd1bGFyVmVsb2NpdHlCb2R5LnNldCgwLCAwLCAwKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZHZhbmNlIHRoZSByb3RhdGlvbmFsIHN0YXRlLlxuICAgICAqIEBwYXJhbSBtb21lbnRCb2R5IE5ldCBtb21lbnQgYWJvdXQgdGhlIENHLCBib2R5IGZyYW1lIChOwrdtKS5cbiAgICAgKiBAcGFyYW0gZHQgICAgICAgICBUaW1lc3RlcCAocykuXG4gICAgICovXG4gICAgaW50ZWdyYXRlQW5ndWxhcihtb21lbnRCb2R5OiBUSFJFRS5WZWN0b3IzLCBkdDogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHcgPSB0aGlzLmFuZ3VsYXJWZWxvY2l0eUJvZHk7XG4gICAgICAgIGNvbnN0IEkgPSB0aGlzLmluZXJ0aWE7XG5cbiAgICAgICAgLy8gSc+JIGFuZCB0aGUgZ3lyb3Njb3BpYyB0ZXJtIM+JIMOXIChJz4kpLlxuICAgICAgICB0aGlzLl9pdy5zZXQoSS54ICogdy54LCBJLnkgKiB3LnksIEkueiAqIHcueik7XG4gICAgICAgIHRoaXMuX2d5cm8uY3Jvc3NWZWN0b3JzKHcsIHRoaXMuX2l3KTtcblxuICAgICAgICAvLyDPicyHID0gSeKBu8K5IChNIOKIkiDPiSDDlyBJz4kpXG4gICAgICAgIHRoaXMuX2FuZ0FjY2VsLnNldChcbiAgICAgICAgICAgIChtb21lbnRCb2R5LnggLSB0aGlzLl9neXJvLngpIC8gSS54LFxuICAgICAgICAgICAgKG1vbWVudEJvZHkueSAtIHRoaXMuX2d5cm8ueSkgLyBJLnksXG4gICAgICAgICAgICAobW9tZW50Qm9keS56IC0gdGhpcy5fZ3lyby56KSAvIEkueixcbiAgICAgICAgKTtcblxuICAgICAgICB3LmFkZFNjYWxlZFZlY3Rvcih0aGlzLl9hbmdBY2NlbCwgZHQpO1xuXG4gICAgICAgIC8vIEFkdmFuY2Ugb3JpZW50YXRpb24gYnkgdGhlIGluY3JlbWVudGFsIGJvZHktZnJhbWUgcm90YXRpb24uXG4gICAgICAgIGNvbnN0IG9tZWdhID0gdy5sZW5ndGgoKTtcbiAgICAgICAgaWYgKG9tZWdhID4gMWUtOSkge1xuICAgICAgICAgICAgdGhpcy5fYXhpcy5jb3B5KHcpLm11bHRpcGx5U2NhbGFyKDEgLyBvbWVnYSk7XG4gICAgICAgICAgICB0aGlzLl9kcS5zZXRGcm9tQXhpc0FuZ2xlKHRoaXMuX2F4aXMsIG9tZWdhICogZHQpO1xuICAgICAgICAgICAgdGhpcy5vcmllbnRhdGlvbi5tdWx0aXBseSh0aGlzLl9kcSk7IC8vIGJvZHktZnJhbWUgZGVsdGEgYXBwbGllZCBvbiB0aGUgcmlnaHRcbiAgICAgICAgICAgIHRoaXMub3JpZW50YXRpb24ubm9ybWFsaXplKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZHZhbmNlIHRoZSB0cmFuc2xhdGlvbmFsIHN0YXRlLlxuICAgICAqIEBwYXJhbSBmb3JjZVdvcmxkIE5ldCBmb3JjZSBpbiB0aGUgd29ybGQgZnJhbWUgKE4pLCBncmF2aXR5IGluY2x1ZGVkLlxuICAgICAqIEBwYXJhbSBkdCAgICAgICAgIFRpbWVzdGVwIChzKS5cbiAgICAgKiBAcGFyYW0gb3V0UG9zaXRpb24gUG9zaXRpb24gYWNjdW11bGF0b3IgdG8gYWR2YW5jZSAod29ybGQsIG0pLlxuICAgICAqL1xuICAgIGludGVncmF0ZUxpbmVhcihmb3JjZVdvcmxkOiBUSFJFRS5WZWN0b3IzLCBkdDogbnVtYmVyLCBvdXRQb3NpdGlvbjogVEhSRUUuVmVjdG9yMyk6IHZvaWQge1xuICAgICAgICAvLyBhID0gRiAvIG0gOyBzZW1pLWltcGxpY2l0IEV1bGVyICh1cGRhdGUgdmVsb2NpdHksIHRoZW4gcG9zaXRpb24pLlxuICAgICAgICB0aGlzLnZlbG9jaXR5V29ybGQuYWRkU2NhbGVkVmVjdG9yKGZvcmNlV29ybGQsIGR0IC8gdGhpcy5tYXNzKTtcbiAgICAgICAgb3V0UG9zaXRpb24uYWRkU2NhbGVkVmVjdG9yKHRoaXMudmVsb2NpdHlXb3JsZCwgZHQpO1xuICAgIH1cbn1cbiIsImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcbmltcG9ydCB7IFBJVENIX1JBVEUsIFBMQU5FX0RJU1RBTkNFX1RPX0dST1VORCwgUk9MTF9SQVRFLCBZQVdfUkFURSB9IGZyb20gXCIuLi8uLi9kZWZzXCI7XG5pbXBvcnQgeyBGT1JXQVJELCBQSV9PVkVSXzE4MCwgUklHSFQsIFVQLCBaRVJPLCBjYWxjdWxhdGVQaXRjaFJvbGwsIGNsYW1wLCBlYXNlT3V0Q2lyYywgaXNaZXJvLCByb3VuZFRvWmVybyB9IGZyb20gJy4uLy4uL3V0aWxzL21hdGgnO1xuaW1wb3J0IHsgRmxpZ2h0TW9kZWwgfSBmcm9tICcuL2ZsaWdodE1vZGVsJztcblxuXG5jb25zdCBUVVJOSU5HX1JBVEUgPSBNYXRoLlBJICogMS41OyAvLyBSYWRpYW5zL3NlY29uZFxuY29uc3QgU1RBTExfUkFURSA9IE1hdGguUEkgLyA2OyAvLyBSYWRpYW5zL3NlY29uZFxuY29uc3QgSU5EVUNFRF9EUkFHX0ZBQ1RPUiA9IDEwLjA7IC8vIFVuaXRsZXNzXG5jb25zdCBST0xMX0RSQUdfRkFDVE9SID0gMC4wNTsgLy8gVW5pdGxlc3NcbmNvbnN0IEdST1VORF9GUklDVElPTl9LSU5FVElDID0gMC4xNTsgLy8gVW5pdGxlc3NcbmNvbnN0IEdST1VORF9GUklDVElPTl9TVEFUSUMgPSAwLjI7IC8vIFVuaXRsZXNzXG5jb25zdCBHUk9VTkRfQlJBS0VfS0lORVRJQyA9IDEuODtcbmNvbnN0IEdST1VORF9CUkFLRV9TVEFUSUMgPSAxLjE3O1xuY29uc3QgVEhST1RUTEVfVVBfUkFURSA9IDAuMDI7IC8vIFVuaXRzL3NlY29uZFxuY29uc3QgVEhST1RUTEVfRE9XTl9SQVRFID0gMC4wNzsgLy8gVW5pdHMvc2Vjb25kXG5jb25zdCBZQVdfUkFURV9MQU5ERUQgPSBZQVdfUkFURSAqIDIuMDsgLy8gUmFkaWFucy9zZWNvbmRcblxuY29uc3QgTUFYX1RIUlVTVCA9IDIwOyAvLyBtL3NeMlxuY29uc3QgRFJZX01BU1M6IG51bWJlciA9IDIwMDAwOyAvLyBrZ1xuY29uc3QgV0lOR19BUkVBOiBudW1iZXIgPSA3ODsgLy8gbV4yXG5jb25zdCBHUk9VTkRfQUlSX0RFTlNJVFk6IG51bWJlciA9IDEuMjI1OyAvLyBrZy9tXjNcbmNvbnN0IEdSQVZJVFk6IG51bWJlciA9IDkuODsgLy8gbS9zXjJcbmNvbnN0IENEOiBudW1iZXIgPSAwLjE1OyAvLyBVbml0bGVzc1xuY29uc3QgQ0RfTEFORElOR19HRUFSX0ZBQ1RPUiA9IDAuNzU7IC8vIFVuaXRsZXNzLCBhZGRpdGl2ZVxuY29uc3QgQ0RfRkxBUFNfRkFDVE9SID0gMC40OyAvLyBVbml0bGVzcywgYWRkaXRpdmVcbmNvbnN0IExJRlRfRkxBUFNfRkFDVE9SID0gMS4yOyAvLyBVbml0bGVzc1xuY29uc3QgUk9MTF9GTEFQU19GQUNUT1IgPSAwLjY7IC8vIFVuaXRsZXNzXG5cbmNvbnN0IExBTkRFRF9NQVhfU1BFRUQgPSAxMDA7IC8vIG0vc1xuY29uc3QgTEFORElOR19NQVhfVlNQRUVEID0gNTsgLy8gbS9zXG5jb25zdCBMQU5ESU5HX01JTl9QSVRDSCA9IC01ICogUElfT1ZFUl8xODA7IC8vIFJhZGlhbnNcbmNvbnN0IExBTkRJTkdfTUFYX1JPTEwgPSA1ICogUElfT1ZFUl8xODA7IC8vIFJhZGlhbnNcblxuZXhwb3J0IGNsYXNzIEFyY2FkZUZsaWdodE1vZGVsIGV4dGVuZHMgRmxpZ2h0TW9kZWwge1xuXG4gICAgcHJpdmF0ZSBzdGFsbDogbnVtYmVyID0gMDtcblxuICAgIHByaXZhdGUgX3Y6IFRIUkVFLlZlY3RvcjMgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgX3EwOiBUSFJFRS5RdWF0ZXJuaW9uID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcbiAgICBwcml2YXRlIF9xMTogVEhSRUUuUXVhdGVybmlvbiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG4gICAgcHJpdmF0ZSBfbTogVEhSRUUuTWF0cml4NCA9IG5ldyBUSFJFRS5NYXRyaXg0KCk7XG5cbiAgICBwcml2YXRlIGRyYWc6IFRIUkVFLlZlY3RvcjMgPSBuZXcgVEhSRUUuVmVjdG9yMygpOyAvLyBOXG4gICAgcHJpdmF0ZSB0aHJ1c3Q6IFRIUkVFLlZlY3RvcjMgPSBuZXcgVEhSRUUuVmVjdG9yMygpOyAvLyBOXG4gICAgcHJpdmF0ZSB3ZWlnaHQ6IFRIUkVFLlZlY3RvcjMgPSBuZXcgVEhSRUUuVmVjdG9yMygpOyAvLyBOXG4gICAgcHJpdmF0ZSBmcmljdGlvbjogVEhSRUUuVmVjdG9yMyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7IC8vIE5cbiAgICBwcml2YXRlIGZvcmNlczogVEhSRUUuVmVjdG9yMyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7IC8vIE5cblxuICAgIHByaXZhdGUgZm9yd2FyZDogVEhSRUUuVmVjdG9yMyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSB1cDogVEhSRUUuVmVjdG9yMyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSByaWdodDogVEhSRUUuVmVjdG9yMyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cbiAgICBwcml2YXRlIHByakZvcndhcmQ6IFRIUkVFLlZlY3RvcjMgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgdmVsb2NpdHlVbml0OiBUSFJFRS5WZWN0b3IzID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLm9iai51cC5jb3B5KFVQKTtcbiAgICB9XG5cbiAgICBzdGVwKGRlbHRhOiBudW1iZXIpOiB2b2lkIHtcblxuICAgICAgICBpZiAodGhpcy5jcmFzaGVkKSByZXR1cm47XG5cbiAgICAgICAgaWYgKHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgPiB0aGlzLnRocm90dGxlKSB7XG4gICAgICAgICAgICB0aGlzLmVmZmVjdGl2ZVRocm90dGxlID0gTWF0aC5tYXgodGhpcy50aHJvdHRsZSwgdGhpcy5lZmZlY3RpdmVUaHJvdHRsZSAtIFRIUk9UVExFX0RPV05fUkFURSAqIGRlbHRhKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmVmZmVjdGl2ZVRocm90dGxlIDwgdGhpcy50aHJvdHRsZSkge1xuICAgICAgICAgICAgdGhpcy5lZmZlY3RpdmVUaHJvdHRsZSA9IE1hdGgubWluKHRoaXMudGhyb3R0bGUsIHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgKyBUSFJPVFRMRV9VUF9SQVRFICogZGVsdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5mb3J3YXJkID0gdGhpcy5mb3J3YXJkLmNvcHkoRk9SV0FSRCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMub2JqLnF1YXRlcm5pb24pO1xuICAgICAgICB0aGlzLnVwID0gdGhpcy51cC5jb3B5KFVQKS5hcHBseVF1YXRlcm5pb24odGhpcy5vYmoucXVhdGVybmlvbik7XG4gICAgICAgIHRoaXMucmlnaHQgPSB0aGlzLnJpZ2h0LmNvcHkoUklHSFQpLmFwcGx5UXVhdGVybmlvbih0aGlzLm9iai5xdWF0ZXJuaW9uKTtcblxuICAgICAgICB0aGlzLnByakZvcndhcmQgPSB0aGlzLnByakZvcndhcmQuY29weSh0aGlzLmZvcndhcmQpLnNldFkoMCk7XG4gICAgICAgIHRoaXMudmVsb2NpdHlVbml0ID0gdGhpcy52ZWxvY2l0eVVuaXQuY29weSh0aGlzLnZlbG9jaXR5KS5ub3JtYWxpemUoKTtcblxuICAgICAgICBjb25zdCBhaXJEZW5zaXR5OiBudW1iZXIgPSBHUk9VTkRfQUlSX0RFTlNJVFkgKiBNYXRoLmV4cCgtdGhpcy5vYmoucG9zaXRpb24ueSAvIDgwMDApOyAvLyBrZy9tXjNcbiAgICAgICAgLy8gVGFrZSBpbnRvIGFjY291bnQgbG93ZXIgYWlyIHRlbXBlcmF0dXJlIGF0IGhpZ2hlciBhbHRpdHVkZXNcbiAgICAgICAgY29uc3QgdGhydXN0RGVuc2l0eTogbnVtYmVyID0gR1JPVU5EX0FJUl9ERU5TSVRZICogTWF0aC5leHAoLXRoaXMub2JqLnBvc2l0aW9uLnkgKiAwLjI1IC8gODAwMCk7IC8vIGtnL21eM1xuICAgICAgICBjb25zdCBzcGVlZCA9IHRoaXMudmVsb2NpdHkubGVuZ3RoKCk7IC8vIG0vc1xuXG4gICAgICAgIGNvbnN0IHJpZ2h0UHJqVmVsb2NpdHkgPSB0aGlzLl92LmNvcHkodGhpcy52ZWxvY2l0eVVuaXQpLnByb2plY3RPblBsYW5lKHRoaXMucmlnaHQpO1xuICAgICAgICBjb25zdCBhb2FBbmdsZSA9IHJpZ2h0UHJqVmVsb2NpdHkuYW5nbGVUbyh0aGlzLmZvcndhcmQpO1xuICAgICAgICBjb25zdCBhb2FTaWduID0gcmlnaHRQcmpWZWxvY2l0eS5jcm9zcyh0aGlzLmZvcndhcmQpLmRvdCh0aGlzLnJpZ2h0KSA+IDAgPyAtMSA6IDE7XG4gICAgICAgIGNvbnN0IGFvYSA9IGFvYVNpZ24gKiBhb2FBbmdsZTtcblxuICAgICAgICAvLyBSb2xsIGNvbnRyb2xcbiAgICAgICAgaWYgKCFpc1plcm8odGhpcy5yb2xsKSAmJiAhdGhpcy5sYW5kZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IHJvbGxGbGFwRmFjdG9yID0gdGhpcy5mbGFwc0V4dGVuZGVkID8gUk9MTF9GTEFQU19GQUNUT1IgOiAxLjA7XG4gICAgICAgICAgICB0aGlzLm9iai5yb3RhdGVaKHRoaXMucm9sbCAqIFJPTExfUkFURSAqIHJvbGxGbGFwRmFjdG9yICogZGVsdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUGl0Y2ggY29udHJvbFxuICAgICAgICBpZiAoIWlzWmVybyh0aGlzLnBpdGNoKVxuICAgICAgICAgICAgJiYgISh0aGlzLmxhbmRlZCAmJiB0aGlzLnBpdGNoIDwgMCkgLy8gQ2FuJ3QgcGl0Y2ggZG93biB3aGVuIGxhbmRlZFxuICAgICAgICAgICAgJiYgKFxuICAgICAgICAgICAgICAgIHRoaXMuc3RhbGwgPCAwIHx8IC8vIENhbiBkbyBhbnl0aGluZyB3aGVuIGZseWluZyBhbmQgbm8gc3RhbGxpbmdcbiAgICAgICAgICAgICAgICAodGhpcy5waXRjaCA8IDAgJiYgdGhpcy51cC55ID4gMCkgfHwgLy8gQ2FuJ3QgcGl0Y2ggdXAgd2hlbiBzdGFsbGluZ1xuICAgICAgICAgICAgICAgICh0aGlzLnBpdGNoID4gMCAmJiB0aGlzLnVwLnkgPCAwKSAvLyBDYW4ndCBwaXRjaCB1cCB3aGVuIHN0YWxsaW5nXG4gICAgICAgICAgICApXG4gICAgICAgICkge1xuICAgICAgICAgICAgdGhpcy5vYmoucm90YXRlWCgtdGhpcy5waXRjaCAqIFBJVENIX1JBVEUgKiBkZWx0YSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBZYXcgY29udHJvbFxuICAgICAgICBpZiAoIWlzWmVybyh0aGlzLnlhdykgJiYgIWlzWmVybyhzcGVlZCkpIHtcbiAgICAgICAgICAgIHRoaXMub2JqLnJvdGF0ZVkoLXRoaXMueWF3ICogKHRoaXMubGFuZGVkID8gWUFXX1JBVEVfTEFOREVEIDogWUFXX1JBVEUpICogZGVsdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXV0b21hdGljIHlhdyB3aGVuIHJvbGxpbmdcbiAgICAgICAgaWYgKC0wLjk5IDwgdGhpcy5mb3J3YXJkLnkgJiYgdGhpcy5mb3J3YXJkLnkgPCAwLjk5KSB7XG4gICAgICAgICAgICBjb25zdCBwcmpVcCA9IHRoaXMuX3YuY29weSh0aGlzLnVwKS5wcm9qZWN0T25QbGFuZSh0aGlzLnByakZvcndhcmQpLnNldFkoMCk7XG4gICAgICAgICAgICBjb25zdCBzaWduID0gKHRoaXMucHJqRm9yd2FyZC54ICogcHJqVXAueiAtIHRoaXMucHJqRm9yd2FyZC56ICogcHJqVXAueCkgPiAwID8gLTEgOiAxO1xuICAgICAgICAgICAgdGhpcy5vYmoucm90YXRlT25Xb3JsZEF4aXMoVVAsIHNpZ24gKiBwcmpVcC5sZW5ndGgoKSAqIHByalVwLmxlbmd0aCgpICogdGhpcy5wcmpGb3J3YXJkLmxlbmd0aCgpICogMi4wICogWUFXX1JBVEUgKiBkZWx0YSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQb2ludCBkb3duIHdoZW4gc3RhbGxpbmdcbiAgICAgICAgaWYgKHRoaXMuc3RhbGwgPj0gMCAmJiAhdGhpcy5sYW5kZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IHkgPSB0aGlzLmZvcndhcmQueTtcbiAgICAgICAgICAgIGlmICh5ID4gLTAuOCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGdyb3VuZFJpZ2h0ID0gdGhpcy5fdi5jb3B5KHRoaXMuZm9yd2FyZCkuY3Jvc3ModGhpcy5wcmpGb3J3YXJkKS5ub3JtYWxpemUoKTtcbiAgICAgICAgICAgICAgICB0aGlzLm9iai5yb3RhdGVPbldvcmxkQXhpcyhncm91bmRSaWdodCwgU1RBTExfUkFURSAqIGRlbHRhICogKHkgPiAwID8gMSA6IC0xKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyEgVEhSVVNUXG4gICAgICAgIHJvdW5kVG9aZXJvKHRoaXMudGhydXN0LmNvcHkodGhpcy5mb3J3YXJkKS5tdWx0aXBseVNjYWxhcihcbiAgICAgICAgICAgIHRocnVzdERlbnNpdHkgKlxuICAgICAgICAgICAgTUFYX1RIUlVTVCAqXG4gICAgICAgICAgICB0aGlzLmVmZmVjdGl2ZVRocm90dGxlICpcbiAgICAgICAgICAgIERSWV9NQVNTKSk7XG4gICAgICAgIHRoaXMuZW5naW5lVGhydXN0TiA9IHRoaXMudGhydXN0Lmxlbmd0aCgpO1xuXG4gICAgICAgIC8vISBEUkFHXG4gICAgICAgIGNvbnN0IGFyY2FkZUluZHVjZWREcmFnID0gdGhpcy5mb3J3YXJkLmRvdCh0aGlzLnZlbG9jaXR5VW5pdCk7XG4gICAgICAgIGNvbnN0IGxpZnRJbmR1Y2VkRHJhZyA9IDEgLSBNYXRoLmNvcygyLjAgKiBhb2EpO1xuICAgICAgICBjb25zdCByb2xsRHJhZyA9IE1hdGguYWJzKHRoaXMucmlnaHQueSk7XG4gICAgICAgIGNvbnN0IGNkTXVsdGlwbGllciA9IDEuMCArICh0aGlzLmxhbmRpbmdHZWFyRGVwbG95ZWQgPyBDRF9MQU5ESU5HX0dFQVJfRkFDVE9SIDogMC4wKSArICh0aGlzLmZsYXBzRXh0ZW5kZWQgPyBDRF9GTEFQU19GQUNUT1IgOiAwLjApO1xuICAgICAgICByb3VuZFRvWmVybyh0aGlzLmRyYWdcbiAgICAgICAgICAgIC5jb3B5KHRoaXMudmVsb2NpdHlVbml0KVxuICAgICAgICAgICAgLm5lZ2F0ZSgpXG4gICAgICAgICAgICAubXVsdGlwbHlTY2FsYXIoXG4gICAgICAgICAgICAgICAgTWF0aC5wb3coXG4gICAgICAgICAgICAgICAgICAgIDAuNSAqIChDRCAqIGNkTXVsdGlwbGllciArIGxpZnRJbmR1Y2VkRHJhZykgKiBhaXJEZW5zaXR5ICogc3BlZWQgKiBzcGVlZCAqIFdJTkdfQVJFQSxcbiAgICAgICAgICAgICAgICAgICAgMS4wICsgSU5EVUNFRF9EUkFHX0ZBQ1RPUiAqICgxLjAgLSBhcmNhZGVJbmR1Y2VkRHJhZykgKyBST0xMX0RSQUdfRkFDVE9SICogcm9sbERyYWdcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICApXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8hIExJRlRcbiAgICAgICAgY29uc3QgYW9hTGlmdCA9IDAuMiAqIChhb2EgPCAoTWF0aC5QSSAvIDguMCkgfHwgYW9hID4gKDcgKiBNYXRoLlBJIC8gOC4wKSA/IE1hdGguc2luKDYuMCAqIGFvYSkgOiBNYXRoLnNpbigyLjAgKiBhb2EpKTtcbiAgICAgICAgY29uc3QgbWluTGlmdEZhY3RvciA9IDIuMCAqICgwLjc1ICogMC43NSArIDAuNzUpICogR1JPVU5EX0FJUl9ERU5TSVRZO1xuICAgICAgICBjb25zdCBmd2RZID0gdGhpcy5mb3J3YXJkLnk7XG4gICAgICAgIGNvbnN0IHJpZ2h0WSA9IE1hdGguYWJzKHRoaXMucmlnaHQueSk7XG4gICAgICAgIGNvbnN0IGxpZnRGYWN0b3IgPSAyICogKHNwZWVkIC8gMjU2LjApICogKCgtMC41ICogZndkWSArIDEuNSkgKiAoLTAuNSAqIHJpZ2h0WSArIDEuNSkgKyAoLTAuNSAqIHJpZ2h0WSArIDEuNSkpICogYWlyRGVuc2l0eTtcbiAgICAgICAgY29uc3QgbGlmdEZhY3Rvck11bHRpcGxpZXIgPSB0aGlzLmZsYXBzRXh0ZW5kZWQgPyBMSUZUX0ZMQVBTX0ZBQ1RPUiA6IDEuMDtcbiAgICAgICAgdGhpcy5zdGFsbCA9IC1jbGFtcChsaWZ0RmFjdG9yICogbGlmdEZhY3Rvck11bHRpcGxpZXIgLyBtaW5MaWZ0RmFjdG9yICsgYW9hTGlmdCAqICgxLjAgLSByaWdodFkpIC0gMS4wLCAtMS4wLCAxLjApO1xuXG4gICAgICAgIC8vISBXRUlHSFRcbiAgICAgICAgY29uc3Qgd2VpZ2h0RndkRmFjdG9yID0gLXRoaXMuZm9yd2FyZC55O1xuICAgICAgICAvLyBBY2NvdW50cyBmb3IgbGlmdC4gNTAwIGtub3RzIC0+IDI1NiBtL3NcbiAgICAgICAgY29uc3Qgd2VpZ2h0RG93bkZhY3RvciA9IC1lYXNlT3V0Q2lyYygxLjAgLSBjbGFtcCgoc3BlZWQgLyAyNTYpICogKDEuMCAtIE1hdGguYWJzKHRoaXMuZm9yd2FyZC55KSAqICgxLjAgLSBNYXRoLmFicyh0aGlzLnJpZ2h0LnkpKSksIDAsIDEpKTtcbiAgICAgICAgdGhpcy53ZWlnaHRcbiAgICAgICAgICAgIC5jb3B5KFVQKVxuICAgICAgICAgICAgLm11bHRpcGx5U2NhbGFyKHdlaWdodERvd25GYWN0b3IpXG4gICAgICAgICAgICAuYWRkU2NhbGVkVmVjdG9yKHRoaXMuZm9yd2FyZCwgd2VpZ2h0RndkRmFjdG9yKVxuICAgICAgICAgICAgLm11bHRpcGx5U2NhbGFyKERSWV9NQVNTICogR1JBVklUWSk7XG5cbiAgICAgICAgLy8hIE1hZ2ljIHZlbG9jaXR5IHJvdGF0aW9uXG4gICAgICAgIGlmICghaXNaZXJvKHNwZWVkKSkge1xuICAgICAgICAgICAgaWYgKHRoaXMubGFuZGVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy52ZWxvY2l0eS5jb3B5KHRoaXMuZm9yd2FyZCkubXVsdGlwbHlTY2FsYXIoc3BlZWQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhbHBoYSA9IHRoaXMudmVsb2NpdHlVbml0LmFuZ2xlVG8odGhpcy5mb3J3YXJkKTtcbiAgICAgICAgICAgICAgICBjb25zdCB0dXJuaW5nRmFjdG9yID0gYWxwaGEgKiBUVVJOSU5HX1JBVEUgKiBkZWx0YTtcbiAgICAgICAgICAgICAgICB0aGlzLl9tLmxvb2tBdChaRVJPLCB0aGlzLmZvcndhcmQsIHRoaXMudXApO1xuICAgICAgICAgICAgICAgIHRoaXMuX3ExID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKS5zZXRGcm9tUm90YXRpb25NYXRyaXgodGhpcy5fbSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbS5sb29rQXQoWkVSTywgdGhpcy52ZWxvY2l0eVVuaXQsIHRoaXMudXApO1xuICAgICAgICAgICAgICAgIHRoaXMuX3EwID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKS5zZXRGcm9tUm90YXRpb25NYXRyaXgodGhpcy5fbSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcTAucm90YXRlVG93YXJkcyh0aGlzLl9xMSwgdHVybmluZ0ZhY3Rvcik7XG4gICAgICAgICAgICAgICAgdGhpcy5fcTEuc2V0RnJvbVJvdGF0aW9uTWF0cml4KHRoaXMuX20uaW52ZXJ0KCkpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3YuY29weSh0aGlzLnZlbG9jaXR5VW5pdClcbiAgICAgICAgICAgICAgICAgICAgLmFwcGx5UXVhdGVybmlvbih0aGlzLl9xMSlcbiAgICAgICAgICAgICAgICAgICAgLmFwcGx5UXVhdGVybmlvbih0aGlzLl9xMCk7XG4gICAgICAgICAgICAgICAgdGhpcy52ZWxvY2l0eS5jb3B5KHRoaXMuX3YpLm11bHRpcGx5U2NhbGFyKHNwZWVkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vISBBbGwgZm9yY2VzXG4gICAgICAgIHRoaXMuZm9yY2VzLnNldCgwLCAwLCAwKS5hZGQodGhpcy50aHJ1c3QpLmFkZCh0aGlzLmRyYWcpLmFkZCh0aGlzLndlaWdodCk7XG5cbiAgICAgICAgLy8hIEZSSUNUSU9OXG4gICAgICAgIGNvbnN0IG9uR3JvdW5kID0gdGhpcy5vYmoucG9zaXRpb24ueSA8PSBQTEFORV9ESVNUQU5DRV9UT19HUk9VTkQgKyAwLjA1O1xuICAgICAgICBpZiAodGhpcy5sYW5kZWQgfHwgKHRoaXMud2hlZWxCcmFrZXNBcHBsaWVkICYmIG9uR3JvdW5kKSkge1xuICAgICAgICAgICAgY29uc3Qgd2VpZ2h0TWFnbml0dWRlID0gRFJZX01BU1MgKiBHUkFWSVRZO1xuICAgICAgICAgICAgY29uc3QgcHJqRm9yY2VzID0gdGhpcy5fdi5jb3B5KHRoaXMuZm9yY2VzKS5zZXRZKDApO1xuICAgICAgICAgICAgY29uc3QgcHJqRm9yY2VzTWFnbml0dWRlID0gcHJqRm9yY2VzLmxlbmd0aCgpO1xuICAgICAgICAgICAgY29uc3QgbWF4U3RhdGljRnJpY3Rpb24gPSAodGhpcy53aGVlbEJyYWtlc0FwcGxpZWQgPyBHUk9VTkRfQlJBS0VfU1RBVElDIDogR1JPVU5EX0ZSSUNUSU9OX1NUQVRJQykgKiB3ZWlnaHRNYWduaXR1ZGU7XG4gICAgICAgICAgICBjb25zdCBraW5ldGljRnJpY3Rpb24gPSAodGhpcy53aGVlbEJyYWtlc0FwcGxpZWQgPyBHUk9VTkRfQlJBS0VfS0lORVRJQyA6IEdST1VORF9GUklDVElPTl9LSU5FVElDKSAqIHdlaWdodE1hZ25pdHVkZTtcblxuICAgICAgICAgICAgaWYgKChpc1plcm8oc3BlZWQpICYmIHByakZvcmNlc01hZ25pdHVkZSA8IG1heFN0YXRpY0ZyaWN0aW9uKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZnJpY3Rpb24uY29weShwcmpGb3JjZXMpLm5lZ2F0ZSgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZyaWN0aW9uLmNvcHkodGhpcy52ZWxvY2l0eVVuaXQpLnNldFkoMCkubmVnYXRlKCkubm9ybWFsaXplKCkubXVsdGlwbHlTY2FsYXIoa2luZXRpY0ZyaWN0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJvdW5kVG9aZXJvKHRoaXMuZnJpY3Rpb24pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5mcmljdGlvbi5zZXQoMCwgMCwgMCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyEgVGltZXN0ZXBcbiAgICAgICAgY29uc3QgYWNjZWwgPSByb3VuZFRvWmVybyh0aGlzLmZvcmNlcy5hZGQodGhpcy5mcmljdGlvbikuZGl2aWRlU2NhbGFyKERSWV9NQVNTKSk7XG4gICAgICAgIHRoaXMudmVsb2NpdHkuYWRkU2NhbGVkVmVjdG9yKGFjY2VsLCBkZWx0YSk7XG4gICAgICAgIGlmICh0aGlzLmxhbmRlZCAmJiB0aGlzLnZlbG9jaXR5LnkgPCAwKSB7XG4gICAgICAgICAgICB0aGlzLnZlbG9jaXR5LnNldFkoMCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyEgQXBwbHlcbiAgICAgICAgdGhpcy5vYmoucG9zaXRpb24uYWRkU2NhbGVkVmVjdG9yKHJvdW5kVG9aZXJvKHRoaXMudmVsb2NpdHksIHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgPiAwID8gMC4wMSA6IDAuMSksIGRlbHRhKTtcbiAgICAgICAgaWYgKHRoaXMub2JqLnBvc2l0aW9uLnkgPiBQTEFORV9ESVNUQU5DRV9UT19HUk9VTkQpIHtcbiAgICAgICAgICAgIHRoaXMubGFuZGVkID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHcm91bmQgaW50ZXJhY3Rpb25cbiAgICAgICAgaWYgKHRoaXMub2JqLnBvc2l0aW9uLnkgPCBQTEFORV9ESVNUQU5DRV9UT19HUk9VTkQpIHtcbiAgICAgICAgICAgIHRoaXMub2JqLnBvc2l0aW9uLnkgPSBQTEFORV9ESVNUQU5DRV9UT19HUk9VTkQ7XG5cbiAgICAgICAgICAgIGNvbnN0IGZvcndhcmQgPSB0aGlzLl92LmNvcHkoRk9SV0FSRCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMub2JqLnF1YXRlcm5pb24pO1xuICAgICAgICAgICAgY29uc3QgcmlnaHQgPSB0aGlzLnJpZ2h0LmNvcHkoUklHSFQpLmFwcGx5UXVhdGVybmlvbih0aGlzLm9iai5xdWF0ZXJuaW9uKTtcblxuICAgICAgICAgICAgY29uc3QgcHJqRm9yd2FyZCA9IG5ldyBUSFJFRS5WZWN0b3IzKCkuY29weShmb3J3YXJkKS5zZXRZKDApLm5vcm1hbGl6ZSgpO1xuICAgICAgICAgICAgY29uc3QgcGl0Y2hBbmdsZSA9IGZvcndhcmQuYW5nbGVUbyhwcmpGb3J3YXJkKSAqIE1hdGguc2lnbihmb3J3YXJkLnkpO1xuXG4gICAgICAgICAgICBjb25zdCBwcmpSaWdodCA9IG5ldyBUSFJFRS5WZWN0b3IzKCkuY29weShyaWdodCkuc2V0WSgwKS5ub3JtYWxpemUoKTtcbiAgICAgICAgICAgIGNvbnN0IHJvbGxBbmdsZSA9IHJpZ2h0LmFuZ2xlVG8ocHJqUmlnaHQpICogTWF0aC5zaWduKHJpZ2h0LnkpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5sYW5kaW5nR2VhckRlcGxveWVkID09PSBmYWxzZSB8fFxuICAgICAgICAgICAgICAgIHNwZWVkID4gTEFOREVEX01BWF9TUEVFRCB8fFxuICAgICAgICAgICAgICAgIHRoaXMudmVsb2NpdHkueSA8IC1MQU5ESU5HX01BWF9WU1BFRUQgfHxcbiAgICAgICAgICAgICAgICBNYXRoLmFicyhyb2xsQW5nbGUpID4gTEFORElOR19NQVhfUk9MTCB8fFxuICAgICAgICAgICAgICAgIExBTkRJTkdfTUlOX1BJVENIID4gcGl0Y2hBbmdsZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY3Jhc2hlZCA9IHRydWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChmb3J3YXJkLnkgPCAwLjApIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaGVhZGluZyA9IG5ldyBUSFJFRS5WZWN0b3IzKCkuY29weShmb3J3YXJkKS5zZXRZKDApLm5vcm1hbGl6ZSgpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9iai5xdWF0ZXJuaW9uLnNldEZyb21Vbml0VmVjdG9ycyhGT1JXQVJELCBoZWFkaW5nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy52ZWxvY2l0eS5zZXRZKDApO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhbGwgPSAtMTtcbiAgICAgICAgICAgICAgICB0aGlzLmxhbmRlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXRTdGFsbFN0YXR1cygpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5zdGFsbDtcbiAgICB9XG59IiwiaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuaW1wb3J0IHsgTUFYX0FMVElUVURFLCBNQVhfU1BFRUQsIFBJVENIX1JBVEUsIFBMQU5FX0RJU1RBTkNFX1RPX0dST1VORCwgUk9MTF9SQVRFLCBZQVdfUkFURSB9IGZyb20gXCIuLi8uLi9kZWZzXCI7XG5pbXBvcnQgeyBGT1JXQVJELCBpc1plcm8sIFVQIH0gZnJvbSAnLi4vLi4vdXRpbHMvbWF0aCc7XG5pbXBvcnQgeyBGbGlnaHRNb2RlbCB9IGZyb20gJy4vZmxpZ2h0TW9kZWwnO1xuXG5leHBvcnQgY2xhc3MgRGVidWdGbGlnaHRNb2RlbCBleHRlbmRzIEZsaWdodE1vZGVsIHtcblxuICAgIHByaXZhdGUgc3BlZWQ6IG51bWJlciA9IDA7XG5cbiAgICBwcml2YXRlIF92OiBUSFJFRS5WZWN0b3IzID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIF93OiBUSFJFRS5WZWN0b3IzID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLm9iai51cC5jb3B5KFVQKTtcbiAgICB9XG5cbiAgICBzdGVwKGRlbHRhOiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuY3Jhc2hlZCkgcmV0dXJuO1xuXG4gICAgICAgIHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgPSB0aGlzLnRocm90dGxlO1xuICAgICAgICB0aGlzLmVuZ2luZVRocnVzdE4gPSAwO1xuXG4gICAgICAgIC8vIFJvbGwgY29udHJvbFxuICAgICAgICBpZiAoIWlzWmVybyh0aGlzLnJvbGwpKSB7XG4gICAgICAgICAgICB0aGlzLm9iai5yb3RhdGVaKHRoaXMucm9sbCAqIFJPTExfUkFURSAqIGRlbHRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFBpdGNoIGNvbnRyb2xcbiAgICAgICAgaWYgKCFpc1plcm8odGhpcy5waXRjaCkpIHtcbiAgICAgICAgICAgIHRoaXMub2JqLnJvdGF0ZVgoLXRoaXMucGl0Y2ggKiBQSVRDSF9SQVRFICogZGVsdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gWWF3IGNvbnRyb2xcbiAgICAgICAgaWYgKCFpc1plcm8odGhpcy55YXcpKSB7XG4gICAgICAgICAgICB0aGlzLm9iai5yb3RhdGVZKC10aGlzLnlhdyAqIFlBV19SQVRFICogZGVsdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXV0b21hdGljIHlhdyB3aGVuIHJvbGxpbmdcbiAgICAgICAgY29uc3QgZm9yd2FyZCA9IHRoaXMub2JqLmdldFdvcmxkRGlyZWN0aW9uKHRoaXMuX3YpO1xuICAgICAgICBpZiAoLTAuOTkgPCBmb3J3YXJkLnkgJiYgZm9yd2FyZC55IDwgMC45OSkge1xuICAgICAgICAgICAgY29uc3QgcHJqRm9yd2FyZCA9IGZvcndhcmQuc2V0WSgwKTtcbiAgICAgICAgICAgIGNvbnN0IHVwID0gdGhpcy5fdy5jb3B5KFVQKS5hcHBseVF1YXRlcm5pb24odGhpcy5vYmoucXVhdGVybmlvbik7XG4gICAgICAgICAgICBjb25zdCBwcmpVcCA9IHVwLnByb2plY3RPblBsYW5lKHByakZvcndhcmQpLnNldFkoMCk7XG4gICAgICAgICAgICBjb25zdCBzaWduID0gKHByakZvcndhcmQueCAqIHByalVwLnogLSBwcmpGb3J3YXJkLnogKiBwcmpVcC54KSA+IDAgPyAtMSA6IDE7XG4gICAgICAgICAgICB0aGlzLm9iai5yb3RhdGVPbldvcmxkQXhpcyhVUCwgc2lnbiAqIHByalVwLmxlbmd0aCgpICogcHJqVXAubGVuZ3RoKCkgKiBwcmpGb3J3YXJkLmxlbmd0aCgpICogMi4wICogWUFXX1JBVEUgKiBkZWx0YSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBNb3ZlbWVudFxuICAgICAgICB0aGlzLnNwZWVkID0gdGhpcy5lZmZlY3RpdmVUaHJvdHRsZSAqIE1BWF9TUEVFRDtcbiAgICAgICAgdGhpcy5vYmoudHJhbnNsYXRlWih0aGlzLnNwZWVkICogZGVsdGEpO1xuXG4gICAgICAgIC8vIEF2b2lkIGdyb3VuZCBjcmFzaGVzXG4gICAgICAgIGlmICh0aGlzLm9iai5wb3NpdGlvbi55IDwgUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5EKSB7XG4gICAgICAgICAgICB0aGlzLm9iai5wb3NpdGlvbi55ID0gUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5EO1xuICAgICAgICAgICAgY29uc3QgZCA9IHRoaXMub2JqLmdldFdvcmxkRGlyZWN0aW9uKHRoaXMuX3YpO1xuICAgICAgICAgICAgaWYgKGQueSA8IDAuMCkge1xuICAgICAgICAgICAgICAgIGQuc2V0WSgwKS5hZGQodGhpcy5vYmoucG9zaXRpb24pO1xuICAgICAgICAgICAgICAgIHRoaXMub2JqLmxvb2tBdChkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEF2b2lkIGZseWluZyB0b28gaGlnaFxuICAgICAgICBpZiAodGhpcy5vYmoucG9zaXRpb24ueSA+IE1BWF9BTFRJVFVERSkge1xuICAgICAgICAgICAgdGhpcy5vYmoucG9zaXRpb24ueSA9IE1BWF9BTFRJVFVERTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFZlbG9jaXR5XG4gICAgICAgIHRoaXMudmVsb2NpdHkuY29weShGT1JXQVJEKS5hcHBseVF1YXRlcm5pb24odGhpcy5vYmoucXVhdGVybmlvbikubXVsdGlwbHlTY2FsYXIodGhpcy5zcGVlZCk7XG5cbiAgICAgICAgdGhpcy5sYW5kZWQgPSB0aGlzLm9iai5wb3NpdGlvbi55IDw9IFBMQU5FX0RJU1RBTkNFX1RPX0dST1VORDtcbiAgICB9XG5cbiAgICBnZXRTdGFsbFN0YXR1cygpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gLTE7XG4gICAgfVxufVxuIiwiaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuaW1wb3J0IHsgVVAgfSBmcm9tICcuLi8uLi91dGlscy9tYXRoJztcblxuZXhwb3J0IGNvbnN0IFNJTV9GUFMgPSAxMjA7XG5jb25zdCBTSU1fREVMVEEgPSAxLjAgLyBTSU1fRlBTO1xuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgRmxpZ2h0TW9kZWwge1xuXG4gICAgcHJvdGVjdGVkIG9iaiA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuICAgIHByb3RlY3RlZCB2ZWxvY2l0eTogVEhSRUUuVmVjdG9yMyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7IC8vIG0vc1xuXG4gICAgcHJvdGVjdGVkIGNyYXNoZWQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICBwcm90ZWN0ZWQgbGFuZGVkOiBib29sZWFuID0gdHJ1ZTtcbiAgICBwcm90ZWN0ZWQgbGFuZGluZ0dlYXJEZXBsb3llZDogYm9vbGVhbiA9IHRydWU7XG4gICAgcHJvdGVjdGVkIGZsYXBzRXh0ZW5kZWQ6IGJvb2xlYW4gPSB0cnVlO1xuICAgIHByb3RlY3RlZCB3aGVlbEJyYWtlc0FwcGxpZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAgIHByb3RlY3RlZCBwaXRjaDogbnVtYmVyID0gMDsgLy8gWy0xLCAxXVxuICAgIHByb3RlY3RlZCByb2xsOiBudW1iZXIgPSAwOyAvLyBbLTEsIDFdXG4gICAgcHJvdGVjdGVkIHlhdzogbnVtYmVyID0gMDsgLy8gWy0xLCAxXVxuICAgIHByb3RlY3RlZCB0aHJvdHRsZTogbnVtYmVyID0gMDsgLy8gWzAsIDFdXG4gICAgcHJvdGVjdGVkIGVmZmVjdGl2ZVRocm90dGxlOiBudW1iZXIgPSAwOyAvLyBbMCwgMV1cblxuICAgIHByb3RlY3RlZCBhbmdsZU9mQXR0YWNrUmFkOiBudW1iZXIgPSAwO1xuICAgIHByb3RlY3RlZCBsb2FkRmFjdG9yRzogbnVtYmVyID0gMTtcbiAgICBwcm90ZWN0ZWQgZW5naW5lVGhydXN0TjogbnVtYmVyID0gMDtcblxuICAgIHByaXZhdGUgcHJldlBvc2l0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHByZXZRdWF0ZXJuaW9uID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcbiAgICBwcml2YXRlIHByZXZWZWxvY2l0eSA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSBkZWx0YVJlbWFpbmRlcjogbnVtYmVyID0gMDtcblxuICAgIGFic3RyYWN0IHN0ZXAoZGVsdGE6IG51bWJlcik6IHZvaWQ7XG5cbiAgICByZXNldCgpIHtcbiAgICAgICAgdGhpcy5vYmoucG9zaXRpb24uc2V0KDAsIDAsIDApO1xuICAgICAgICB0aGlzLm9iai5xdWF0ZXJuaW9uLnNldEZyb21BeGlzQW5nbGUoVVAsIDApO1xuICAgICAgICB0aGlzLnZlbG9jaXR5LnNldCgwLCAwLCAwKTtcbiAgICAgICAgdGhpcy5jcmFzaGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMubGFuZGVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5sYW5kaW5nR2VhckRlcGxveWVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5mbGFwc0V4dGVuZGVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy53aGVlbEJyYWtlc0FwcGxpZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5waXRjaCA9IDA7XG4gICAgICAgIHRoaXMucm9sbCA9IDA7XG4gICAgICAgIHRoaXMueWF3ID0gMDtcbiAgICAgICAgdGhpcy50aHJvdHRsZSA9IDA7XG4gICAgICAgIHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgPSAwO1xuICAgICAgICB0aGlzLmFuZ2xlT2ZBdHRhY2tSYWQgPSAwO1xuICAgICAgICB0aGlzLmxvYWRGYWN0b3JHID0gMTtcbiAgICAgICAgdGhpcy5lbmdpbmVUaHJ1c3ROID0gMDtcbiAgICAgICAgdGhpcy5kZWx0YVJlbWFpbmRlciA9IDA7XG4gICAgICAgIHRoaXMuc3luY1ByZXZpb3VzU3RhdGUoKTtcbiAgICB9XG5cbiAgICAvKiogQWxpZ24gcmVuZGVyIGludGVycG9sYXRpb24gYWZ0ZXIgdGVsZXBvcnQgb3IgYWlyYm9ybmUgc3Bhd24uICovXG4gICAgc25hcFBoeXNpY3NTdGF0ZSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5zeW5jUHJldmlvdXNTdGF0ZSgpO1xuICAgIH1cblxuICAgIHVwZGF0ZShkZWx0YTogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIHRoaXMuZGVsdGFSZW1haW5kZXIgKz0gZGVsdGE7XG4gICAgICAgIHdoaWxlICh0aGlzLmRlbHRhUmVtYWluZGVyID49IFNJTV9ERUxUQSkge1xuICAgICAgICAgICAgdGhpcy5zYXZlUHJldmlvdXNTdGF0ZSgpO1xuICAgICAgICAgICAgdGhpcy5zdGVwKFNJTV9ERUxUQSk7XG4gICAgICAgICAgICB0aGlzLmRlbHRhUmVtYWluZGVyIC09IFNJTV9ERUxUQTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiAxID0gbGF0ZXN0IHBoeXNpY3Mgc3RhdGUsIDAgPSBwcmV2aW91cyBwaHlzaWNzIHN0YXRlLiAqL1xuICAgIGdldFJlbmRlckludGVycG9sYXRpb25BbHBoYSgpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gMSAtIHRoaXMuZGVsdGFSZW1haW5kZXIgLyBTSU1fREVMVEE7XG4gICAgfVxuXG4gICAgZ2V0UmVuZGVyUG9zaXRpb24odGFyZ2V0OiBUSFJFRS5WZWN0b3IzKTogVEhSRUUuVmVjdG9yMyB7XG4gICAgICAgIHJldHVybiB0YXJnZXQubGVycFZlY3RvcnModGhpcy5wcmV2UG9zaXRpb24sIHRoaXMub2JqLnBvc2l0aW9uLCB0aGlzLmdldFJlbmRlckludGVycG9sYXRpb25BbHBoYSgpKTtcbiAgICB9XG5cbiAgICBnZXRSZW5kZXJRdWF0ZXJuaW9uKHRhcmdldDogVEhSRUUuUXVhdGVybmlvbik6IFRIUkVFLlF1YXRlcm5pb24ge1xuICAgICAgICByZXR1cm4gdGFyZ2V0LnNsZXJwUXVhdGVybmlvbnModGhpcy5wcmV2UXVhdGVybmlvbiwgdGhpcy5vYmoucXVhdGVybmlvbiwgdGhpcy5nZXRSZW5kZXJJbnRlcnBvbGF0aW9uQWxwaGEoKSk7XG4gICAgfVxuXG4gICAgZ2V0UmVuZGVyVmVsb2NpdHkodGFyZ2V0OiBUSFJFRS5WZWN0b3IzKTogVEhSRUUuVmVjdG9yMyB7XG4gICAgICAgIHJldHVybiB0YXJnZXQubGVycFZlY3RvcnModGhpcy5wcmV2VmVsb2NpdHksIHRoaXMudmVsb2NpdHksIHRoaXMuZ2V0UmVuZGVySW50ZXJwb2xhdGlvbkFscGhhKCkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2F2ZVByZXZpb3VzU3RhdGUoKTogdm9pZCB7XG4gICAgICAgIHRoaXMucHJldlBvc2l0aW9uLmNvcHkodGhpcy5vYmoucG9zaXRpb24pO1xuICAgICAgICB0aGlzLnByZXZRdWF0ZXJuaW9uLmNvcHkodGhpcy5vYmoucXVhdGVybmlvbik7XG4gICAgICAgIHRoaXMucHJldlZlbG9jaXR5LmNvcHkodGhpcy52ZWxvY2l0eSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzeW5jUHJldmlvdXNTdGF0ZSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5wcmV2UG9zaXRpb24uY29weSh0aGlzLm9iai5wb3NpdGlvbik7XG4gICAgICAgIHRoaXMucHJldlF1YXRlcm5pb24uY29weSh0aGlzLm9iai5xdWF0ZXJuaW9uKTtcbiAgICAgICAgdGhpcy5wcmV2VmVsb2NpdHkuY29weSh0aGlzLnZlbG9jaXR5KTtcbiAgICB9XG5cbiAgICBzZXRQaXRjaChwaXRjaDogbnVtYmVyKSB7XG4gICAgICAgIHRoaXMucGl0Y2ggPSBwaXRjaDtcbiAgICB9XG5cbiAgICBzZXRSb2xsKHJvbGw6IG51bWJlcikge1xuICAgICAgICB0aGlzLnJvbGwgPSByb2xsO1xuICAgIH1cblxuICAgIHNldFlhdyh5YXc6IG51bWJlcikge1xuICAgICAgICB0aGlzLnlhdyA9IHlhdztcbiAgICB9XG5cbiAgICBzZXRUaHJvdHRsZSh0aHJvdHRsZTogbnVtYmVyKSB7XG4gICAgICAgIHRoaXMudGhyb3R0bGUgPSB0aHJvdHRsZTtcbiAgICB9XG5cbiAgICAvKiogTWF0Y2ggc3Bvb2xlZCBlbmdpbmUgc3RhdGUgdG8gY29tbWFuZGVkIHRocm90dGxlIChlLmcuIGFpcmJvcm5lIHNwYXduKS4gKi9cbiAgICBzeW5jRWZmZWN0aXZlVGhyb3R0bGUoKSB7XG4gICAgICAgIHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgPSB0aGlzLnRocm90dGxlO1xuICAgIH1cblxuICAgIHNldExhbmRpbmdHZWFyRGVwbG95ZWQoZGVwbG95ZWQ6IGJvb2xlYW4pIHtcbiAgICAgICAgdGhpcy5sYW5kaW5nR2VhckRlcGxveWVkID0gZGVwbG95ZWQ7XG4gICAgfVxuXG4gICAgc2V0RmxhcHNFeHRlbmRlZChleHRlbmRlZDogYm9vbGVhbikge1xuICAgICAgICB0aGlzLmZsYXBzRXh0ZW5kZWQgPSBleHRlbmRlZDtcbiAgICB9XG5cbiAgICBzZXRXaGVlbEJyYWtlcyhhcHBsaWVkOiBib29sZWFuKSB7XG4gICAgICAgIHRoaXMud2hlZWxCcmFrZXNBcHBsaWVkID0gYXBwbGllZDtcbiAgICB9XG5cbiAgICBpc1doZWVsQnJha2VzQXBwbGllZCgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMud2hlZWxCcmFrZXNBcHBsaWVkO1xuICAgIH1cblxuICAgIHNldExhbmRlZChpc0xhbmRlZDogYm9vbGVhbikge1xuICAgICAgICB0aGlzLmxhbmRlZCA9IGlzTGFuZGVkO1xuICAgIH1cblxuICAgIGlzTGFuZGVkKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5sYW5kZWQ7XG4gICAgfVxuXG4gICAgc2V0Q3Jhc2hlZChpc0NyYXNoZWQ6IGJvb2xlYW4pIHtcbiAgICAgICAgdGhpcy5jcmFzaGVkID0gaXNDcmFzaGVkO1xuICAgIH1cblxuICAgIGlzQ3Jhc2hlZCgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3Jhc2hlZDtcbiAgICB9XG5cbiAgICBzZXQgcG9zaXRpb24ocDogVEhSRUUuVmVjdG9yMykge1xuICAgICAgICB0aGlzLm9iai5wb3NpdGlvbi5jb3B5KHApO1xuICAgIH1cblxuICAgIGdldCBwb3NpdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub2JqLnBvc2l0aW9uO1xuICAgIH1cblxuICAgIHNldCBxdWF0ZXJuaW9uKHE6IFRIUkVFLlF1YXRlcm5pb24pIHtcbiAgICAgICAgdGhpcy5vYmoucXVhdGVybmlvbi5jb3B5KHEpO1xuICAgIH1cblxuICAgIGdldCBxdWF0ZXJuaW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vYmoucXVhdGVybmlvbjtcbiAgICB9XG5cbiAgICBzZXQgdmVsb2NpdHlWZWN0b3IodjogVEhSRUUuVmVjdG9yMykge1xuICAgICAgICB0aGlzLnZlbG9jaXR5LmNvcHkodik7XG4gICAgfVxuXG4gICAgZ2V0IHZlbG9jaXR5VmVjdG9yKCkge1xuICAgICAgICByZXR1cm4gdGhpcy52ZWxvY2l0eTtcbiAgICB9XG5cbiAgICBnZXRFZmZlY3RpdmVUaHJvdHRsZSgpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5lZmZlY3RpdmVUaHJvdHRsZTtcbiAgICB9XG5cbiAgICAvLyBbLTEsMV0gLSBWYWx1ZXMgPj0gMCBtZWFuIHN0YWxsXG4gICAgYWJzdHJhY3QgZ2V0U3RhbGxTdGF0dXMoKTogbnVtYmVyO1xuXG4gICAgZ2V0QW5nbGVPZkF0dGFjaygpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5hbmdsZU9mQXR0YWNrUmFkO1xuICAgIH1cblxuICAgIGdldExvYWRGYWN0b3JHKCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLmxvYWRGYWN0b3JHO1xuICAgIH1cblxuICAgIGdldEVuZ2luZVRocnVzdEtuKCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLmVuZ2luZVRocnVzdE4gLyAxMDAwO1xuICAgIH1cblxuICAgIHVzZUYxNlRocm90dGxlRGV0ZW50cygpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHN0ZXBUaHJvdHRsZURldGVudChjdXJyZW50OiBudW1iZXIsIGRpcmVjdGlvbjogMSB8IC0xKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIE1hdGgubWF4KDAsIE1hdGgubWluKDEsIGN1cnJlbnQgKyBkaXJlY3Rpb24gKiAwLjAxKSk7XG4gICAgfVxuXG4gICAgaXNJblRocm90dGxlQWJEZXRlbnRCYW5kKF9sZXZlcjogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvKiogT3ZlcnJpZGUgaW4gbW9kZWxzIHdpdGggYSBub24tbGluZWFyIHRocm90dGxlIHF1YWRyYW50LiAqL1xuICAgIGFkanVzdFRocm90dGxlSW5wdXQoY3VycmVudDogbnVtYmVyLCBzdGVwOiBudW1iZXIpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gTWF0aC5tYXgoMCwgTWF0aC5taW4oMSwgY3VycmVudCArIHN0ZXApKTtcbiAgICB9XG5cbiAgICAvKiogT3ZlcnJpZGUgaW4gbW9kZWxzIHdpdGggYSBub24tbGluZWFyIHRocm90dGxlIHF1YWRyYW50LiAqL1xuICAgIGdldFRocm90dGxlSHVkVGV4dCgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gYFRIUiAkeygxMDAgKiB0aGlzLmVmZmVjdGl2ZVRocm90dGxlKS50b0ZpeGVkKDApfWA7XG4gICAgfVxuXG4gICAgLyoqIE5vcm1hbGl6ZWQgZW5naW5lIHBvd2VyIGZvciBhdWRpbyBbMCwgMV0uICovXG4gICAgZ2V0VGhyb3R0bGVBdWRpb0xldmVsKCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLmVmZmVjdGl2ZVRocm90dGxlO1xuICAgIH1cblxuICAgIC8qKiBDU1MgY29sb3IgZm9yIGVuZ2luZSBub3p6bGUgcmVuZGVyaW5nIChNSUwgYmxhY2sgYnkgZGVmYXVsdCkuICovXG4gICAgZ2V0RW5naW5lTm96emxlQ29sb3IoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuICcjMGEwYTBhJztcbiAgICB9XG59XG4iLCIvKipcbiAqIEZNMiDigJQgRi0xNkMgcmlnaWQtYm9keSBcInBhcnRzXCIgZmxpZ2h0IG1vZGVsLlxuICpcbiAqIFVubGlrZSB0aGUga2luZW1hdGljIFJlYWxpc3RpYyBtb2RlbCAod2hpY2ggcm90YXRlcyB0aGUgYWlyZnJhbWUgZGlyZWN0bHkgZnJvbVxuICogc3RpY2sgYXV0aG9yaXR5KSwgRk0yIGlzIGEgZ2VudWluZSA2LURPRiByaWdpZCBib2R5LiBFdmVyeSBhZXJvZHluYW1pYyBmb3JjZVxuICogaXMgcHJvZHVjZWQgYnkgYSBkaXNjcmV0ZSBsaWZ0aW5nIHN1cmZhY2UgYXQgaXRzIHJlYWwgbG9jYXRpb24sIHNvIGFsbCBtb21lbnRzXG4gKiDigJQgYW5kIHRoZSBwaXRjaC9yb2xsL3lhdyByYXRlIGRhbXBpbmcg4oCUIGVtZXJnZSBmcm9tIHRoZSBnZW9tZXRyeS4gQSBmbHktYnktd2lyZVxuICogbGF5ZXIgY2xvc2VzIHJhdGUvZyBsb29wcyBhcm91bmQgdGhlIGFpcmZyYW1lIHRvIGdpdmUgRi0xNiBoYW5kbGluZy4gTGFuZGluZ1xuICogZ2VhciBpcyBtb2RlbGxlZCBhcyBzcHJpbmctZGFtcGVyIGNvbnRhY3QgcG9pbnRzLCBzbyB3ZWlnaHQtb24td2hlZWxzLCB0YWtlb2ZmXG4gKiByb3RhdGlvbiBhbmQgZ3JvdW5kIHN0YWJpbGl0eSBhcmUgYWxzbyBqdXN0IHJpZ2lkLWJvZHkgcmVhY3Rpb25zLlxuICpcbiAqIFNlZSBwaHlzaWNzL2ZtMi8qIGZvciB0aGUgYnVpbGRpbmcgYmxvY2tzLlxuICovXG5pbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgeyBQTEFORV9ESVNUQU5DRV9UT19HUk9VTkQsIFRFUlJBSU5fTU9ERUxfU0laRSwgVEVSUkFJTl9TQ0FMRSB9IGZyb20gJy4uLy4uL2RlZnMnO1xuaW1wb3J0IHsgY2xhbXAsIEZPUldBUkQsIFJJR0hULCBVUCB9IGZyb20gJy4uLy4uL3V0aWxzL21hdGgnO1xuaW1wb3J0IHtcbiAgICBjb21wdXRlQWlyRGVuc2l0eSwgY29tcHV0ZUR5bmFtaWNQcmVzc3VyZSwgY29tcHV0ZUlzYUFpckRlbnNpdHksXG4gICAgY29tcHV0ZU1hY2hOdW1iZXIsXG59IGZyb20gJy4uL2Flcm9VdGlscyc7XG5pbXBvcnQge1xuICAgIGFkanVzdEYxNlRocm90dGxlSW5wdXQsIGNvbXB1dGVGMTZFbmdpbmVUaHJ1c3ROLCBmMTZUaHJvdHRsZUF1ZGlvTGV2ZWwsXG4gICAgZm9ybWF0RjE2VGhyb3R0bGVIdWQsIGdldEYxNkVuZ2luZU5venpsZUNvbG9yLCBnZXRGMTZUaHJvdHRsZVpvbmUsXG4gICAgaXNGMTZBYkRldGVudEJhbmQsIHN0ZXBGMTZUaHJvdHRsZURldGVudCxcbn0gZnJvbSAnLi4vZjE2RW5naW5lJztcbmltcG9ydCB7IEYxNl9QUk9GSUxFIH0gZnJvbSAnLi4vZjE2UHJvZmlsZSc7XG5pbXBvcnQgeyBBZXJvU3VyZmFjZSB9IGZyb20gJy4uL2ZtMi9hZXJvU3VyZmFjZSc7XG5pbXBvcnQgeyBGMTZGY3MgfSBmcm9tICcuLi9mbTIvZjE2RmNzJztcbmltcG9ydCB7XG4gICAgRk0yX0FJTEVST04sIEZNMl9CT0RZX0NEMCwgRk0yX0ZDUywgRk0yX0ZMQVBTLCBGTTJfR0VBUl9DRCwgRk0yX0dFT01FVFJZLFxuICAgIEZNMl9JTkVSVElBLCBGTTJfU1VSRkFDRVMsIEZNMl9XQVZFX0RSQUcsXG59IGZyb20gJy4uL2ZtMi9mMTZGbTJDb25maWcnO1xuaW1wb3J0IHsgUmlnaWRCb2R5IH0gZnJvbSAnLi4vZm0yL3JpZ2lkQm9keSc7XG5pbXBvcnQgeyBGbGlnaHRNb2RlbCB9IGZyb20gJy4vZmxpZ2h0TW9kZWwnO1xuXG5jb25zdCBHUkFWSVRZID0gOS44MDY2NTtcbmNvbnN0IERFRyA9IE1hdGguUEkgLyAxODA7XG5cbmNvbnN0IFRIUk9UVExFX1VQX1JBVEUgPSAwLjEwO1xuY29uc3QgVEhST1RUTEVfRE9XTl9SQVRFID0gMC4wNztcblxuY29uc3QgTUFYX1NUQUJJTEFUT1JfQU9BID0gRk0yX0ZDUy5tYXhTdGFiaWxhdG9yUmFkO1xuY29uc3QgTUFYX0FJTEVST05fQU9BID0gRk0yX0FJTEVST04ubWF4RGVmbGVjdGlvblJhZDtcbmNvbnN0IE1BWF9SVURERVJfQU9BID0gMjIgKiBERUc7XG5cbmNvbnN0IFFfUkVGID0gMC41ICogY29tcHV0ZUlzYUFpckRlbnNpdHkoRjE2X1BST0ZJTEUuY3J1aXNlQWx0aXR1ZGVNKSAqIEYxNl9QUk9GSUxFLmNydWlzZVNwZWVkTXBzICoqIDI7XG5jb25zdCBTVEFMTF9BT0EgPSBGMTZfUFJPRklMRS5zdGFsbEFvYURlZyAqIERFRztcbmNvbnN0IE1JTl9GTFlJTkdfU1BFRUQgPSBGMTZfUFJPRklMRS5taW5GbHlpbmdTcGVlZE1wcztcblxuLy8gTGFuZGluZy1nZWFyIHNwcmluZy1kYW1wZXIgY29udGFjdCBwb2ludHMgKGJvZHkgZnJhbWUsIG0pLiBZIOKJiCAtUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5ELlxuY29uc3QgR0VBUl9QT0lOVFM6IFtudW1iZXIsIG51bWJlciwgbnVtYmVyXVtdID0gW1xuICAgIFswLjAsIC1QTEFORV9ESVNUQU5DRV9UT19HUk9VTkQsIDIuNl0sICAgLy8gbm9zZVxuICAgIFstMS4yLCAtUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5ELCAtMC42XSwgLy8gbGVmdCBtYWluXG4gICAgWzEuMiwgLVBMQU5FX0RJU1RBTkNFX1RPX0dST1VORCwgLTAuNl0sICAvLyByaWdodCBtYWluXG5dO1xuY29uc3QgR0VBUl9TVElGRk5FU1MgPSA0LjBlNjsgICAvLyBOL21cbmNvbnN0IEdFQVJfREFNUElORyA9IDEuNmU1OyAgICAgLy8gTsK3cy9tXG5jb25zdCBHRUFSX1JPTExfRlJJQ1RJT04gPSAwLjA0O1xuY29uc3QgR0VBUl9CUkFLRV9GUklDVElPTiA9IDAuNTU7XG5jb25zdCBHRUFSX1NJREVfRlJJQ1RJT04gPSAwLjg7XG5cbi8vIFRvdWNoZG93biBsaW1pdHMgKGNyYXNoIG90aGVyd2lzZSksIG1pcnJvcmluZyB0aGUgRi0xNiBwcm9maWxlLlxuY29uc3QgTEFORElOR19NQVhfU1BFRUQgPSBGMTZfUFJPRklMRS5sYW5kaW5nTWF4U3BlZWRNcHM7XG5jb25zdCBMQU5ESU5HX01BWF9WU1BFRUQgPSBGMTZfUFJPRklMRS5sYW5kaW5nTWF4VmVydGljYWxTcGVlZE1wcztcbmNvbnN0IExBTkRJTkdfTUlOX1BJVENIID0gRjE2X1BST0ZJTEUubGFuZGluZ01pblBpdGNoRGVnICogREVHO1xuY29uc3QgTEFORElOR19NQVhfUk9MTCA9IEYxNl9QUk9GSUxFLmxhbmRpbmdNYXhSb2xsRGVnICogREVHO1xuXG5pbnRlcmZhY2UgU3VyZmFjZUNvbnRyb2xzIHtcbiAgICB3aW5nTGVmdEFvYTogbnVtYmVyO1xuICAgIHdpbmdSaWdodEFvYTogbnVtYmVyO1xuICAgIGh0YWlsTGVmdEFvYTogbnVtYmVyO1xuICAgIGh0YWlsUmlnaHRBb2E6IG51bWJlcjtcbiAgICB2dGFpbEFvYTogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgRm0yRmxpZ2h0TW9kZWwgZXh0ZW5kcyBGbGlnaHRNb2RlbCB7XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IHJiID0gbmV3IFJpZ2lkQm9keShGTTJfR0VPTUVUUlkubWFzc0tnLCB7XG4gICAgICAgIHg6IEZNMl9JTkVSVElBLnBpdGNoLFxuICAgICAgICB5OiBGTTJfSU5FUlRJQS55YXcsXG4gICAgICAgIHo6IEZNMl9JTkVSVElBLnJvbGwsXG4gICAgfSk7XG4gICAgcHJpdmF0ZSByZWFkb25seSBmY3MgPSBuZXcgRjE2RmNzKCk7XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IGZ1c2VsYWdlID0gbmV3IEFlcm9TdXJmYWNlKEZNMl9TVVJGQUNFUy5mdXNlbGFnZSk7XG4gICAgcHJpdmF0ZSByZWFkb25seSB3aW5nTGVmdCA9IG5ldyBBZXJvU3VyZmFjZShGTTJfU1VSRkFDRVMud2luZ0xlZnQpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgd2luZ1JpZ2h0ID0gbmV3IEFlcm9TdXJmYWNlKEZNMl9TVVJGQUNFUy53aW5nUmlnaHQpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgaHRhaWxMZWZ0ID0gbmV3IEFlcm9TdXJmYWNlKEZNMl9TVVJGQUNFUy5odGFpbExlZnQpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgaHRhaWxSaWdodCA9IG5ldyBBZXJvU3VyZmFjZShGTTJfU1VSRkFDRVMuaHRhaWxSaWdodCk7XG4gICAgcHJpdmF0ZSByZWFkb25seSB2dGFpbCA9IG5ldyBBZXJvU3VyZmFjZShGTTJfU1VSRkFDRVMudnRhaWwpO1xuXG4gICAgcHJpdmF0ZSBzdGFsbCA9IC0xO1xuXG4gICAgLy8gU2NyYXRjaCB2ZWN0b3JzIChhdm9pZCBwZXItc3RlcCBhbGxvY2F0aW9uIGluIHRoZSB3b3JrZXIpLlxuICAgIHByaXZhdGUgcmVhZG9ubHkgdmVsQm9keSA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSByZWFkb25seSBmb3JjZUJvZHkgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgbW9tZW50Qm9keSA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSByZWFkb25seSBmb3JjZVdvcmxkID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGdlYXJGb3JjZVdvcmxkID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGdlYXJNb21lbnRCb2R5ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGludk9yaWVudCA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG4gICAgcHJpdmF0ZSByZWFkb25seSBfdXAgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgX2Z3ZCA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSByZWFkb25seSBfcmlnaHQgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgX3YgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgX3YyID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9nZWFyV29ybGQgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgX2NvbnRhY3RWZWwgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgX29tZWdhV29ybGQgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgX2ZyaWN0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLm9iai51cC5jb3B5KFVQKTtcbiAgICB9XG5cbiAgICByZXNldCgpOiB2b2lkIHtcbiAgICAgICAgc3VwZXIucmVzZXQoKTtcbiAgICAgICAgdGhpcy5yYi5yZXNldCgpO1xuICAgICAgICB0aGlzLmZjcy5yZXNldCgpO1xuICAgICAgICB0aGlzLnN0YWxsID0gLTE7XG4gICAgfVxuXG4gICAgc3RlcChkZWx0YTogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLmNyYXNoZWQpIHJldHVybjtcblxuICAgICAgICB0aGlzLnNwb29sVGhyb3R0bGUoZGVsdGEpO1xuXG4gICAgICAgIC8vIEFkb3B0IGFueSBleHRlcm5hbGx5IHNldCBvcmllbnRhdGlvbiAvIHZlbG9jaXR5IGFzIHRoZSByaWdpZC1ib2R5IHN0YXRlLlxuICAgICAgICB0aGlzLnJiLm9yaWVudGF0aW9uLmNvcHkodGhpcy5vYmoucXVhdGVybmlvbik7XG4gICAgICAgIHRoaXMucmIudmVsb2NpdHlXb3JsZC5jb3B5KHRoaXMudmVsb2NpdHkpO1xuXG4gICAgICAgIGNvbnN0IGFsdGl0dWRlID0gdGhpcy5vYmoucG9zaXRpb24ueTtcbiAgICAgICAgY29uc3QgYWlyRGVuc2l0eSA9IGNvbXB1dGVBaXJEZW5zaXR5KGFsdGl0dWRlKTtcblxuICAgICAgICAvLyBCb2R5LWZyYW1lIHZlbG9jaXR5IHRocm91Z2ggdGhlIGFpci5cbiAgICAgICAgdGhpcy5pbnZPcmllbnQuY29weSh0aGlzLnJiLm9yaWVudGF0aW9uKS5pbnZlcnQoKTtcbiAgICAgICAgdGhpcy52ZWxCb2R5LmNvcHkodGhpcy5yYi52ZWxvY2l0eVdvcmxkKS5hcHBseVF1YXRlcm5pb24odGhpcy5pbnZPcmllbnQpO1xuICAgICAgICBjb25zdCBzcGVlZCA9IHRoaXMudmVsQm9keS5sZW5ndGgoKTtcblxuICAgICAgICAvLyBBaXJjcmFmdCBhbmdsZSBvZiBhdHRhY2sgKGluIHRoZSBib2R5IFgtcGxhbmUpIGFuZCBzaWRlc2xpcC5cbiAgICAgICAgY29uc3QgYW9hID0gc3BlZWQgPiAxID8gTWF0aC5hdGFuMigtdGhpcy52ZWxCb2R5LnksIHRoaXMudmVsQm9keS56KSA6IDA7XG4gICAgICAgIHRoaXMuYW5nbGVPZkF0dGFja1JhZCA9IGFvYTtcblxuICAgICAgICBjb25zdCBkeW5hbWljUHJlc3N1cmUgPSBjb21wdXRlRHluYW1pY1ByZXNzdXJlKGFpckRlbnNpdHksIHNwZWVkKTtcbiAgICAgICAgY29uc3QgbWFjaCA9IGNvbXB1dGVNYWNoTnVtYmVyKHNwZWVkLCBhbHRpdHVkZSk7XG5cbiAgICAgICAgLy8gRmx5LWJ5LXdpcmU6IHN0aWNrL3BlZGFscyArIHN0YXRlIOKGkiBzdXJmYWNlIGNvbW1hbmRzLlxuICAgICAgICBjb25zdCBmY3NPdXQgPSB0aGlzLmZjcy51cGRhdGUoe1xuICAgICAgICAgICAgcGl0Y2hTdGljazogdGhpcy5waXRjaCxcbiAgICAgICAgICAgIHJvbGxTdGljazogdGhpcy5yb2xsLFxuICAgICAgICAgICAgeWF3UGVkYWw6IHRoaXMueWF3LFxuICAgICAgICAgICAgcGl0Y2hSYXRlOiB0aGlzLnJiLmFuZ3VsYXJWZWxvY2l0eUJvZHkueCxcbiAgICAgICAgICAgIHlhd1JhdGU6IHRoaXMucmIuYW5ndWxhclZlbG9jaXR5Qm9keS55LFxuICAgICAgICAgICAgcm9sbFJhdGU6IHRoaXMucmIuYW5ndWxhclZlbG9jaXR5Qm9keS56LFxuICAgICAgICAgICAgbG9hZEZhY3Rvckc6IHRoaXMubG9hZEZhY3RvckcsXG4gICAgICAgICAgICBhb2FSYWQ6IGFvYSxcbiAgICAgICAgICAgIGR5bmFtaWNQcmVzc3VyZSxcbiAgICAgICAgICAgIHFSZWY6IFFfUkVGLFxuICAgICAgICAgICAgc3BlZWQsXG4gICAgICAgICAgICBhbHRpdHVkZU06IGFsdGl0dWRlLFxuICAgICAgICAgICAgZmxhcHNFeHRlbmRlZDogdGhpcy5mbGFwc0V4dGVuZGVkLFxuICAgICAgICAgICAgbGFuZGVkOiB0aGlzLmxhbmRlZCxcbiAgICAgICAgfSwgZGVsdGEpO1xuXG4gICAgICAgIGNvbnN0IGNvbnRyb2xzID0gdGhpcy5tYXBDb250cm9scyhmY3NPdXQuZWxldmF0b3IsIGZjc091dC5haWxlcm9uLCBmY3NPdXQucnVkZGVyKTtcblxuICAgICAgICAvLyAtLS0tIEFlcm9keW5hbWljIGZvcmNlICYgbW9tZW50IGJ1aWxkLXVwIGZyb20gdGhlIHJpZ2lkIHBhcnRzLiAtLS0tXG4gICAgICAgIHRoaXMuZm9yY2VCb2R5LnNldCgwLCAwLCAwKTtcbiAgICAgICAgdGhpcy5tb21lbnRCb2R5LnNldCgwLCAwLCAwKTtcblxuICAgICAgICBjb25zdCBjYW1iZXIgPSB0aGlzLmZsYXBzRXh0ZW5kZWQgPyBGTTJfRkxBUFMuYW9hQmlhc1JhZCA6IDA7XG4gICAgICAgIGNvbnN0IHN0YWxsU2hpZnQgPSB0aGlzLmZsYXBzRXh0ZW5kZWQgPyBGTTJfRkxBUFMuc3RhbGxSZWR1Y3Rpb25SYWQgOiAwO1xuICAgICAgICBjb25zdCB3aW5nRXh0cmFDZCA9IHRoaXMuZmxhcHNFeHRlbmRlZCA/IEZNMl9GTEFQUy5leHRyYUNkIDogMDtcblxuICAgICAgICAvLyBCbGVuZGVkIGxpZnRpbmcgYm9keSBhdCB0aGUgQ0cgKG5vIGZsYXBzLCBubyBjb250cm9sIGluY2lkZW5jZSkuXG4gICAgICAgIHRoaXMuYWNjdW11bGF0ZVN1cmZhY2UodGhpcy5mdXNlbGFnZSwgMCwgMCwgMCwgMCwgYWlyRGVuc2l0eSk7XG4gICAgICAgIHRoaXMuYWNjdW11bGF0ZVN1cmZhY2UodGhpcy53aW5nTGVmdCwgY29udHJvbHMud2luZ0xlZnRBb2EsIGNhbWJlciwgc3RhbGxTaGlmdCwgd2luZ0V4dHJhQ2QsIGFpckRlbnNpdHkpO1xuICAgICAgICB0aGlzLmFjY3VtdWxhdGVTdXJmYWNlKHRoaXMud2luZ1JpZ2h0LCBjb250cm9scy53aW5nUmlnaHRBb2EsIGNhbWJlciwgc3RhbGxTaGlmdCwgd2luZ0V4dHJhQ2QsIGFpckRlbnNpdHkpO1xuICAgICAgICB0aGlzLmFjY3VtdWxhdGVTdXJmYWNlKHRoaXMuaHRhaWxMZWZ0LCBjb250cm9scy5odGFpbExlZnRBb2EsIDAsIDAsIDAsIGFpckRlbnNpdHkpO1xuICAgICAgICB0aGlzLmFjY3VtdWxhdGVTdXJmYWNlKHRoaXMuaHRhaWxSaWdodCwgY29udHJvbHMuaHRhaWxSaWdodEFvYSwgMCwgMCwgMCwgYWlyRGVuc2l0eSk7XG4gICAgICAgIHRoaXMuYWNjdW11bGF0ZVN1cmZhY2UodGhpcy52dGFpbCwgY29udHJvbHMudnRhaWxBb2EsIDAsIDAsIDAsIGFpckRlbnNpdHkpO1xuXG4gICAgICAgIC8vIEZ1c2VsYWdlIC8gcGFyYXNpdGUgLyBnZWFyIC8gd2F2ZSBkcmFnIGFsb25nIHRoZSByZWxhdGl2ZSB3aW5kLlxuICAgICAgICB0aGlzLmFkZEJvZHlEcmFnKGR5bmFtaWNQcmVzc3VyZSwgc3BlZWQsIG1hY2gpO1xuXG4gICAgICAgIC8vIFRocnVzdCBhbG9uZyB0aGUgbm9zZSAoK1ogYm9keSkuXG4gICAgICAgIGNvbnN0IHRocnVzdE4gPSBjb21wdXRlRjE2RW5naW5lVGhydXN0Tih0aGlzLmVmZmVjdGl2ZVRocm90dGxlLCBhbHRpdHVkZSk7XG4gICAgICAgIHRoaXMuZW5naW5lVGhydXN0TiA9IHRocnVzdE47XG4gICAgICAgIHRoaXMuZm9yY2VCb2R5LnogKz0gdGhydXN0TjtcblxuICAgICAgICAvLyBMYW5kaW5nLWdlYXIgcmVhY3Rpb25zIChjb21wdXRlZCBpbiB3b3JsZCwgbW9tZW50IGZvbGRlZCBpbnRvIGJvZHkgZnJhbWUpLlxuICAgICAgICB0aGlzLmNvbXB1dGVHZWFyRm9yY2VzKCk7XG5cbiAgICAgICAgLy8gTG9hZCBmYWN0b3I6IHNwZWNpZmljIG5vcm1hbCAoYm9keS11cCkgZm9yY2UgLyBnLCBpbmNsLiBnZWFyIHJlYWN0aW9uLlxuICAgICAgICBjb25zdCBnZWFyQm9keVVwWSA9IHRoaXMuX3YuY29weSh0aGlzLmdlYXJGb3JjZVdvcmxkKS5hcHBseVF1YXRlcm5pb24odGhpcy5pbnZPcmllbnQpLnk7XG4gICAgICAgIHRoaXMubG9hZEZhY3RvckcgPSAodGhpcy5mb3JjZUJvZHkueSArIGdlYXJCb2R5VXBZKSAvIChGTTJfR0VPTUVUUlkubWFzc0tnICogR1JBVklUWSk7XG5cbiAgICAgICAgLy8gLS0tLSBJbnRlZ3JhdGUgcm90YXRpb25hbCBkeW5hbWljcyAoYm9keSBmcmFtZSkuIC0tLS1cbiAgICAgICAgdGhpcy5tb21lbnRCb2R5LmFkZCh0aGlzLmdlYXJNb21lbnRCb2R5KTtcbiAgICAgICAgdGhpcy5yYi5pbnRlZ3JhdGVBbmd1bGFyKHRoaXMubW9tZW50Qm9keSwgZGVsdGEpO1xuXG4gICAgICAgIC8vIC0tLS0gSW50ZWdyYXRlIHRyYW5zbGF0aW9uYWwgZHluYW1pY3MgKHdvcmxkIGZyYW1lKS4gLS0tLVxuICAgICAgICB0aGlzLmZvcmNlV29ybGQuY29weSh0aGlzLmZvcmNlQm9keSkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMucmIub3JpZW50YXRpb24pO1xuICAgICAgICB0aGlzLmZvcmNlV29ybGQuYWRkKHRoaXMuZ2VhckZvcmNlV29ybGQpO1xuICAgICAgICB0aGlzLmZvcmNlV29ybGQueSAtPSBGTTJfR0VPTUVUUlkubWFzc0tnICogR1JBVklUWTsgLy8gZ3Jhdml0eVxuICAgICAgICB0aGlzLnJiLmludGVncmF0ZUxpbmVhcih0aGlzLmZvcmNlV29ybGQsIGRlbHRhLCB0aGlzLm9iai5wb3NpdGlvbik7XG5cbiAgICAgICAgLy8gUHVibGlzaCByaWdpZC1ib2R5IHN0YXRlIGJhY2sgdG8gdGhlIGJhc2UgbW9kZWwuXG4gICAgICAgIHRoaXMub2JqLnF1YXRlcm5pb24uY29weSh0aGlzLnJiLm9yaWVudGF0aW9uKTtcbiAgICAgICAgdGhpcy52ZWxvY2l0eS5jb3B5KHRoaXMucmIudmVsb2NpdHlXb3JsZCk7XG5cbiAgICAgICAgdGhpcy51cGRhdGVTdGFsbFN0YXRlKHNwZWVkLCBhb2EsIGFsdGl0dWRlKTtcbiAgICAgICAgdGhpcy5oYW5kbGVHcm91bmRTdGF0ZSgpO1xuICAgICAgICB0aGlzLndyYXBQb3NpdGlvbigpO1xuICAgIH1cblxuICAgIHByaXZhdGUgc3Bvb2xUaHJvdHRsZShkZWx0YTogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLmVmZmVjdGl2ZVRocm90dGxlID4gdGhpcy50aHJvdHRsZSkge1xuICAgICAgICAgICAgdGhpcy5lZmZlY3RpdmVUaHJvdHRsZSA9IE1hdGgubWF4KHRoaXMudGhyb3R0bGUsIHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgLSBUSFJPVFRMRV9ET1dOX1JBVEUgKiBkZWx0YSk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5lZmZlY3RpdmVUaHJvdHRsZSA8IHRoaXMudGhyb3R0bGUpIHtcbiAgICAgICAgICAgIHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUgPSBNYXRoLm1pbih0aGlzLnRocm90dGxlLCB0aGlzLmVmZmVjdGl2ZVRocm90dGxlICsgVEhST1RUTEVfVVBfUkFURSAqIGRlbHRhKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgbWFwQ29udHJvbHMoZWxldmF0b3I6IG51bWJlciwgYWlsZXJvbjogbnVtYmVyLCBydWRkZXI6IG51bWJlcik6IFN1cmZhY2VDb250cm9scyB7XG4gICAgICAgIC8vIEVsZXZhdG9yOiArY21kID0gbm9zZSB1cCDihpIgbmVnYXRpdmUgc3RhYmlsYXRvciBpbmNpZGVuY2UgKHRhaWwgbGlmdCBkb3duKS5cbiAgICAgICAgY29uc3QgZWxldmF0b3JBb2EgPSAtZWxldmF0b3IgKiBNQVhfU1RBQklMQVRPUl9BT0E7XG4gICAgICAgIC8vIERpZmZlcmVudGlhbCB0YWlsICh0YWlsZXJvbikgYXNzaXN0cyByb2xsLlxuICAgICAgICBjb25zdCB0YWlsZXJvbkFvYSA9IGFpbGVyb24gKiBGTTJfRkNTLnRhaWxlcm9uUm9sbEZyYWN0aW9uICogTUFYX1NUQUJJTEFUT1JfQU9BO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgd2luZ0xlZnRBb2E6IGFpbGVyb24gKiBNQVhfQUlMRVJPTl9BT0EsXG4gICAgICAgICAgICB3aW5nUmlnaHRBb2E6IC1haWxlcm9uICogTUFYX0FJTEVST05fQU9BLFxuICAgICAgICAgICAgaHRhaWxMZWZ0QW9hOiBlbGV2YXRvckFvYSArIHRhaWxlcm9uQW9hLFxuICAgICAgICAgICAgaHRhaWxSaWdodEFvYTogZWxldmF0b3JBb2EgLSB0YWlsZXJvbkFvYSxcbiAgICAgICAgICAgIHZ0YWlsQW9hOiAtcnVkZGVyICogTUFYX1JVRERFUl9BT0EsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhY2N1bXVsYXRlU3VyZmFjZShcbiAgICAgICAgc3VyZmFjZTogQWVyb1N1cmZhY2UsIGNvbnRyb2xBb2E6IG51bWJlciwgY2FtYmVyOiBudW1iZXIsXG4gICAgICAgIHN0YWxsU2hpZnQ6IG51bWJlciwgZXh0cmFDZDogbnVtYmVyLCBhaXJEZW5zaXR5OiBudW1iZXIsXG4gICAgKTogdm9pZCB7XG4gICAgICAgIHN1cmZhY2UuYWNjdW11bGF0ZSh7XG4gICAgICAgICAgICB2ZWxvY2l0eUJvZHk6IHRoaXMudmVsQm9keSxcbiAgICAgICAgICAgIGFuZ3VsYXJWZWxvY2l0eUJvZHk6IHRoaXMucmIuYW5ndWxhclZlbG9jaXR5Qm9keSxcbiAgICAgICAgICAgIGFpckRlbnNpdHksXG4gICAgICAgICAgICBjb250cm9sRGVsdGFBb2FSYWQ6IGNvbnRyb2xBb2EsXG4gICAgICAgICAgICBjYW1iZXJCaWFzUmFkOiBjYW1iZXIsXG4gICAgICAgICAgICBzdGFsbFNoaWZ0UmFkOiBzdGFsbFNoaWZ0LFxuICAgICAgICAgICAgZXh0cmFDZCxcbiAgICAgICAgfSwgdGhpcy5mb3JjZUJvZHksIHRoaXMubW9tZW50Qm9keSk7XG4gICAgfVxuXG4gICAgLyoqIFBhcmFzaXRlIChmdXNlbGFnZSArIGdlYXIpIGFuZCB0cmFuc29uaWMgd2F2ZSBkcmFnIGFsb25nIHRoZSByZWxhdGl2ZSB3aW5kLiAqL1xuICAgIHByaXZhdGUgYWRkQm9keURyYWcoZHluYW1pY1ByZXNzdXJlOiBudW1iZXIsIHNwZWVkOiBudW1iZXIsIG1hY2g6IG51bWJlcik6IHZvaWQge1xuICAgICAgICBpZiAoc3BlZWQgPCAxZS0zKSByZXR1cm47XG4gICAgICAgIGxldCBjZDAgPSBGTTJfQk9EWV9DRDAgKyAodGhpcy5sYW5kaW5nR2VhckRlcGxveWVkID8gRk0yX0dFQVJfQ0QgOiAwKTtcbiAgICAgICAgaWYgKG1hY2ggPiBGTTJfV0FWRV9EUkFHLm1hY2hPbnNldCkge1xuICAgICAgICAgICAgY29uc3QgZXhjZXNzID0gKG1hY2ggLSBGTTJfV0FWRV9EUkFHLm1hY2hPbnNldCkgLyBGTTJfV0FWRV9EUkFHLm1hY2hPbnNldDtcbiAgICAgICAgICAgIGNkMCArPSBGTTJfV0FWRV9EUkFHLnNjYWxlICogZXhjZXNzICogZXhjZXNzO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRyYWdOID0gZHluYW1pY1ByZXNzdXJlICogRk0yX0dFT01FVFJZLndpbmdBcmVhTTIgKiBjZDA7XG4gICAgICAgIC8vIE9wcG9zZXMgYm9keSB2ZWxvY2l0eSAoYWN0cyB0aHJvdWdoIENHLCBubyBtb21lbnQpLlxuICAgICAgICB0aGlzLl92LmNvcHkodGhpcy52ZWxCb2R5KS5tdWx0aXBseVNjYWxhcigtZHJhZ04gLyBzcGVlZCk7XG4gICAgICAgIHRoaXMuZm9yY2VCb2R5LmFkZCh0aGlzLl92KTtcbiAgICB9XG5cbiAgICAvKiogU3ByaW5nLWRhbXBlciBsYW5kaW5nIGdlYXIuIEFjY3VtdWxhdGVzIHdvcmxkIGZvcmNlIGFuZCBib2R5IG1vbWVudC4gKi9cbiAgICBwcml2YXRlIGNvbXB1dGVHZWFyRm9yY2VzKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmdlYXJGb3JjZVdvcmxkLnNldCgwLCAwLCAwKTtcbiAgICAgICAgdGhpcy5nZWFyTW9tZW50Qm9keS5zZXQoMCwgMCwgMCk7XG5cbiAgICAgICAgdGhpcy5fb21lZ2FXb3JsZC5jb3B5KHRoaXMucmIuYW5ndWxhclZlbG9jaXR5Qm9keSkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMucmIub3JpZW50YXRpb24pO1xuXG4gICAgICAgIGZvciAoY29uc3QgZ3Agb2YgR0VBUl9QT0lOVFMpIHtcbiAgICAgICAgICAgIHRoaXMuX3Yuc2V0KGdwWzBdLCBncFsxXSwgZ3BbMl0pLmFwcGx5UXVhdGVybmlvbih0aGlzLnJiLm9yaWVudGF0aW9uKTtcbiAgICAgICAgICAgIHRoaXMuX2dlYXJXb3JsZC5jb3B5KHRoaXMuX3YpLmFkZCh0aGlzLm9iai5wb3NpdGlvbik7XG4gICAgICAgICAgICBjb25zdCBwZW5ldHJhdGlvbiA9IC10aGlzLl9nZWFyV29ybGQueTsgLy8gZ3JvdW5kIHBsYW5lIGF0IHdvcmxkIHkgPSAwXG4gICAgICAgICAgICBpZiAocGVuZXRyYXRpb24gPD0gMCkgY29udGludWU7XG5cbiAgICAgICAgICAgIC8vIFZlbG9jaXR5IG9mIHRoZSBjb250YWN0IHBvaW50IHRocm91Z2ggdGhlIHdvcmxkLlxuICAgICAgICAgICAgdGhpcy5fY29udGFjdFZlbC5jcm9zc1ZlY3RvcnModGhpcy5fb21lZ2FXb3JsZCwgdGhpcy5fdikuYWRkKHRoaXMucmIudmVsb2NpdHlXb3JsZCk7XG5cbiAgICAgICAgICAgIC8vIE5vcm1hbCAodmVydGljYWwpIHNwcmluZy1kYW1wZXIgcmVhY3Rpb24uXG4gICAgICAgICAgICBsZXQgbm9ybWFsID0gR0VBUl9TVElGRk5FU1MgKiBwZW5ldHJhdGlvbiAtIEdFQVJfREFNUElORyAqIHRoaXMuX2NvbnRhY3RWZWwueTtcbiAgICAgICAgICAgIGlmIChub3JtYWwgPCAwKSBub3JtYWwgPSAwO1xuXG4gICAgICAgICAgICAvLyBIb3Jpem9udGFsIGZyaWN0aW9uIG9wcG9zaW5nIHRoZSBjb250YWN0IGdyb3VuZCB2ZWxvY2l0eS5cbiAgICAgICAgICAgIGNvbnN0IHZoeCA9IHRoaXMuX2NvbnRhY3RWZWwueDtcbiAgICAgICAgICAgIGNvbnN0IHZoeiA9IHRoaXMuX2NvbnRhY3RWZWwuejtcbiAgICAgICAgICAgIGNvbnN0IHZoID0gTWF0aC5oeXBvdCh2aHgsIHZoeik7XG4gICAgICAgICAgICB0aGlzLl9mcmljdGlvbi5zZXQoMCwgbm9ybWFsLCAwKTtcbiAgICAgICAgICAgIGlmICh2aCA+IDFlLTMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByb2xsaW5nID0gdGhpcy53aGVlbEJyYWtlc0FwcGxpZWQgPyBHRUFSX0JSQUtFX0ZSSUNUSU9OIDogR0VBUl9ST0xMX0ZSSUNUSU9OO1xuICAgICAgICAgICAgICAgIGNvbnN0IG11ID0gTWF0aC5tYXgocm9sbGluZywgR0VBUl9TSURFX0ZSSUNUSU9OICogdGhpcy5zaWRlU2xpcEZyYWN0aW9uKHZoeCwgdmh6KSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZk1hZyA9IG11ICogbm9ybWFsO1xuICAgICAgICAgICAgICAgIHRoaXMuX2ZyaWN0aW9uLnggPSAtZk1hZyAqIHZoeCAvIHZoO1xuICAgICAgICAgICAgICAgIHRoaXMuX2ZyaWN0aW9uLnogPSAtZk1hZyAqIHZoeiAvIHZoO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmdlYXJGb3JjZVdvcmxkLmFkZCh0aGlzLl9mcmljdGlvbik7XG5cbiAgICAgICAgICAgIC8vIE1vbWVudCBhYm91dCBDRzogcl93b3JsZCDDlyBGX3dvcmxkLCBleHByZXNzZWQgaW4gdGhlIGJvZHkgZnJhbWUuXG4gICAgICAgICAgICB0aGlzLl92Mi5jcm9zc1ZlY3RvcnModGhpcy5fdiwgdGhpcy5fZnJpY3Rpb24pLmFwcGx5UXVhdGVybmlvbih0aGlzLmludk9yaWVudCk7XG4gICAgICAgICAgICB0aGlzLmdlYXJNb21lbnRCb2R5LmFkZCh0aGlzLl92Mik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKiogSGlnaGVyIGVmZmVjdGl2ZSBmcmljdGlvbiBmb3Igc2lkZXdheXMgKG5vbi1yb2xsaW5nKSBjb250YWN0IG1vdGlvbi4gKi9cbiAgICBwcml2YXRlIHNpZGVTbGlwRnJhY3Rpb24odmh4OiBudW1iZXIsIHZoejogbnVtYmVyKTogbnVtYmVyIHtcbiAgICAgICAgdGhpcy5fZndkLmNvcHkoRk9SV0FSRCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMucmIub3JpZW50YXRpb24pO1xuICAgICAgICBjb25zdCBmd3ggPSB0aGlzLl9md2QueCwgZnd6ID0gdGhpcy5fZndkLno7XG4gICAgICAgIGNvbnN0IGZ3TGVuID0gTWF0aC5oeXBvdChmd3gsIGZ3eikgfHwgMTtcbiAgICAgICAgY29uc3QgdmggPSBNYXRoLmh5cG90KHZoeCwgdmh6KSB8fCAxO1xuICAgICAgICBjb25zdCBhbG9uZyA9IE1hdGguYWJzKCh2aHggKiBmd3ggKyB2aHogKiBmd3opIC8gKGZ3TGVuICogdmgpKTtcbiAgICAgICAgcmV0dXJuIGNsYW1wKDEgLSBhbG9uZywgMCwgMSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB1cGRhdGVTdGFsbFN0YXRlKHNwZWVkOiBudW1iZXIsIGFvYTogbnVtYmVyLCBhbHRpdHVkZTogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLmxhbmRlZCkgeyB0aGlzLnN0YWxsID0gLTE7IHJldHVybjsgfVxuICAgICAgICBjb25zdCBhb2FTdGFsbCA9IHNwZWVkID4gNSA/IGNsYW1wKChNYXRoLmFicyhhb2EpIC0gU1RBTExfQU9BICogMC44NSkgLyAoU1RBTExfQU9BICogMC4zKSwgMCwgMSkgOiAwO1xuICAgICAgICBjb25zdCBzcGVlZFN0YWxsID0gYWx0aXR1ZGUgPiBQTEFORV9ESVNUQU5DRV9UT19HUk9VTkQgKyA1XG4gICAgICAgICAgICA/IGNsYW1wKChNSU5fRkxZSU5HX1NQRUVEIC0gc3BlZWQpIC8gTUlOX0ZMWUlOR19TUEVFRCwgMCwgMSkgOiAwO1xuICAgICAgICBjb25zdCBsZXZlbCA9IE1hdGgubWF4KGFvYVN0YWxsLCBzcGVlZFN0YWxsKTtcbiAgICAgICAgdGhpcy5zdGFsbCA9IGxldmVsID4gMCA/IGxldmVsIDogLTE7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBoYW5kbGVHcm91bmRTdGF0ZSgpOiB2b2lkIHtcbiAgICAgICAgY29uc3Qgb25Hcm91bmQgPSB0aGlzLm9iai5wb3NpdGlvbi55IDw9IFBMQU5FX0RJU1RBTkNFX1RPX0dST1VORCArIDAuMjU7XG5cbiAgICAgICAgaWYgKHRoaXMub2JqLnBvc2l0aW9uLnkgPiBQTEFORV9ESVNUQU5DRV9UT19HUk9VTkQgKyAwLjMpIHtcbiAgICAgICAgICAgIHRoaXMubGFuZGVkID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBIYXJkIGZsb29yIHNvIHRoZSBnZWFyIHNwcmluZyBjYW4gbmV2ZXIgbGV0IHRoZSBib2R5IHR1bm5lbCB0aHJvdWdoLlxuICAgICAgICBjb25zdCBtaW5ZID0gUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5EIC0gMC42O1xuICAgICAgICBpZiAodGhpcy5vYmoucG9zaXRpb24ueSA8IG1pblkpIHtcbiAgICAgICAgICAgIHRoaXMub2JqLnBvc2l0aW9uLnkgPSBtaW5ZO1xuICAgICAgICAgICAgaWYgKHRoaXMudmVsb2NpdHkueSA8IDApIHRoaXMudmVsb2NpdHkueSA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIW9uR3JvdW5kKSByZXR1cm47XG5cbiAgICAgICAgdGhpcy5fZndkLmNvcHkoRk9SV0FSRCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMucmIub3JpZW50YXRpb24pO1xuICAgICAgICB0aGlzLl9yaWdodC5jb3B5KFJJR0hUKS5hcHBseVF1YXRlcm5pb24odGhpcy5yYi5vcmllbnRhdGlvbik7XG4gICAgICAgIGNvbnN0IHNwZWVkID0gdGhpcy52ZWxvY2l0eS5sZW5ndGgoKTtcbiAgICAgICAgY29uc3QgcGl0Y2hBbmdsZSA9IE1hdGguYXNpbihjbGFtcCh0aGlzLl9md2QueSwgLTEsIDEpKTtcbiAgICAgICAgY29uc3Qgcm9sbEFuZ2xlID0gTWF0aC5hc2luKGNsYW1wKHRoaXMuX3JpZ2h0LnksIC0xLCAxKSk7XG5cbiAgICAgICAgY29uc3QgaGFyZENvbnRhY3QgPSB0aGlzLnZlbG9jaXR5LnkgPCAtTEFORElOR19NQVhfVlNQRUVEO1xuICAgICAgICBjb25zdCBiYWRBdHRpdHVkZSA9IE1hdGguYWJzKHJvbGxBbmdsZSkgPiBMQU5ESU5HX01BWF9ST0xMIHx8IHBpdGNoQW5nbGUgPCBMQU5ESU5HX01JTl9QSVRDSDtcblxuICAgICAgICBpZiAoIXRoaXMubGFuZGVkICYmIChoYXJkQ29udGFjdCB8fCBzcGVlZCA+IExBTkRJTkdfTUFYX1NQRUVEKSkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmxhbmRpbmdHZWFyRGVwbG95ZWQgfHwgaGFyZENvbnRhY3QgfHwgYmFkQXR0aXR1ZGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNyYXNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMubGFuZGluZ0dlYXJEZXBsb3llZCAmJiB0aGlzLnZlbG9jaXR5LnkgPCAtMS4wKSB7XG4gICAgICAgICAgICB0aGlzLmNyYXNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzcGVlZCA8IExBTkRJTkdfTUFYX1NQRUVEICYmIE1hdGguYWJzKHJvbGxBbmdsZSkgPCBMQU5ESU5HX01BWF9ST0xMKSB7XG4gICAgICAgICAgICB0aGlzLmxhbmRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIHdyYXBQb3NpdGlvbigpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgaCA9IDIuNSAqIFRFUlJBSU5fU0NBTEUgKiBURVJSQUlOX01PREVMX1NJWkU7XG4gICAgICAgIGlmICh0aGlzLm9iai5wb3NpdGlvbi54ID4gaCkgdGhpcy5vYmoucG9zaXRpb24ueCA9IC1oO1xuICAgICAgICBpZiAodGhpcy5vYmoucG9zaXRpb24ueCA8IC1oKSB0aGlzLm9iai5wb3NpdGlvbi54ID0gaDtcbiAgICAgICAgaWYgKHRoaXMub2JqLnBvc2l0aW9uLnogPiBoKSB0aGlzLm9iai5wb3NpdGlvbi56ID0gLWg7XG4gICAgICAgIGlmICh0aGlzLm9iai5wb3NpdGlvbi56IDwgLWgpIHRoaXMub2JqLnBvc2l0aW9uLnogPSBoO1xuICAgIH1cblxuICAgIGdldFN0YWxsU3RhdHVzKCk6IG51bWJlciB7IHJldHVybiB0aGlzLnN0YWxsOyB9XG5cbiAgICAvLyAtLS0gRi0xNiB0aHJvdHRsZSBxdWFkcmFudCBiZWhhdmlvdXIgKHNoYXJlZCB3aXRoIHRoZSBSZWFsaXN0aWMgbW9kZWwpLiAtLS1cbiAgICBnZXRUaHJvdHRsZUh1ZFRleHQoKTogc3RyaW5nIHsgcmV0dXJuIGZvcm1hdEYxNlRocm90dGxlSHVkKHRoaXMudGhyb3R0bGUpOyB9XG4gICAgdXNlRjE2VGhyb3R0bGVEZXRlbnRzKCk6IGJvb2xlYW4geyByZXR1cm4gdHJ1ZTsgfVxuICAgIHN0ZXBUaHJvdHRsZURldGVudChjdXJyZW50OiBudW1iZXIsIGRpcmVjdGlvbjogMSB8IC0xKTogbnVtYmVyIHsgcmV0dXJuIHN0ZXBGMTZUaHJvdHRsZURldGVudChjdXJyZW50LCBkaXJlY3Rpb24pOyB9XG4gICAgaXNJblRocm90dGxlQWJEZXRlbnRCYW5kKGxldmVyOiBudW1iZXIpOiBib29sZWFuIHsgcmV0dXJuIGlzRjE2QWJEZXRlbnRCYW5kKGxldmVyKTsgfVxuICAgIGFkanVzdFRocm90dGxlSW5wdXQoY3VycmVudDogbnVtYmVyLCBzdGVwOiBudW1iZXIpOiBudW1iZXIgeyByZXR1cm4gYWRqdXN0RjE2VGhyb3R0bGVJbnB1dChjdXJyZW50LCBzdGVwKTsgfVxuICAgIGdldFRocm90dGxlWm9uZSgpOiBzdHJpbmcgeyByZXR1cm4gZ2V0RjE2VGhyb3R0bGVab25lKHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUpOyB9XG4gICAgZ2V0VGhyb3R0bGVBdWRpb0xldmVsKCk6IG51bWJlciB7IHJldHVybiBmMTZUaHJvdHRsZUF1ZGlvTGV2ZWwodGhpcy5lZmZlY3RpdmVUaHJvdHRsZSk7IH1cbiAgICBnZXRFbmdpbmVOb3p6bGVDb2xvcigpOiBzdHJpbmcgeyByZXR1cm4gZ2V0RjE2RW5naW5lTm96emxlQ29sb3IodGhpcy5lZmZlY3RpdmVUaHJvdHRsZSk7IH1cbn1cbiIsImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcbmltcG9ydCB7IFBJVENIX1JBVEUsIFJPTExfUkFURSwgUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5ELCBURVJSQUlOX01PREVMX1NJWkUsIFRFUlJBSU5fU0NBTEUsIFlBV19SQVRFIH0gZnJvbSAnLi4vLi4vZGVmcyc7XG5pbXBvcnQgeyBGT1JXQVJELCBQSV9PVkVSXzE4MCwgUklHSFQsIFVQLCBjbGFtcCwgaXNaZXJvLCByb3VuZFRvWmVybyB9IGZyb20gJy4uLy4uL3V0aWxzL21hdGgnO1xuaW1wb3J0IHsgY29tcHV0ZUFuZ2xlT2ZBdHRhY2ssIGNvbXB1dGVBaXJEZW5zaXR5LCBjb21wdXRlRHluYW1pY1ByZXNzdXJlLCBjb21wdXRlSXNhQWlyRGVuc2l0eSwgY29tcHV0ZUxvYWRGYWN0b3JHIH0gZnJvbSAnLi4vYWVyb1V0aWxzJztcbmltcG9ydCB7IGNvbXB1dGVGMTZFbmdpbmVUaHJ1c3ROLCBmb3JtYXRGMTZUaHJvdHRsZUh1ZCwgZjE2VGhyb3R0bGVBdWRpb0xldmVsLCBnZXRGMTZFbmdpbmVOb3p6bGVDb2xvciwgZ2V0RjE2VGhyb3R0bGVab25lLCBhZGp1c3RGMTZUaHJvdHRsZUlucHV0LCBzdGVwRjE2VGhyb3R0bGVEZXRlbnQsIGlzRjE2QWJEZXRlbnRCYW5kIH0gZnJvbSAnLi4vZjE2RW5naW5lJztcbmltcG9ydCB7IEYxNl9QUk9GSUxFIH0gZnJvbSAnLi4vZjE2UHJvZmlsZSc7XG5pbXBvcnQgeyBGbGlnaHRNb2RlbCB9IGZyb20gJy4vZmxpZ2h0TW9kZWwnO1xuXG5jb25zdCBUSFJPVFRMRV9VUF9SQVRFICAgPSAwLjEwO1xuY29uc3QgVEhST1RUTEVfRE9XTl9SQVRFID0gMC4wNztcbmNvbnN0IFlBV19SQVRFX0xBTkRFRCAgICA9IFlBV19SQVRFICogMi4wO1xuXG5jb25zdCBEUllfTUFTUyAgID0gRjE2X1BST0ZJTEUuc2ltTWFzc0tnO1xuY29uc3QgV0lOR19BUkVBICA9IEYxNl9QUk9GSUxFLndpbmdBcmVhTTI7XG5jb25zdCBDRDAgICAgICAgID0gRjE2X1BST0ZJTEUuY2QwO1xuY29uc3QgSU5EVUNFRF9EUkFHX0sgPSBGMTZfUFJPRklMRS5pbmR1Y2VkRHJhZ0s7XG5jb25zdCBDTDAgICAgICAgID0gRjE2X1BST0ZJTEUuY2wwO1xuY29uc3QgQ0xfQUxQSEEgICA9IEYxNl9QUk9GSUxFLmNsQWxwaGFQZXJSYWQ7XG5jb25zdCBTVEFMTF9BT0EgID0gRjE2X1BST0ZJTEUuc3RhbGxBb2FEZWcgKiBNYXRoLlBJIC8gMTgwO1xuY29uc3QgTUFYX0NMICAgICA9IDEuNDg7XG5jb25zdCBRX1JFRiAgICAgID0gMC41ICogY29tcHV0ZUlzYUFpckRlbnNpdHkoRjE2X1BST0ZJTEUuY3J1aXNlQWx0aXR1ZGVNKSAqIEYxNl9QUk9GSUxFLmNydWlzZVNwZWVkTXBzICoqIDI7XG5jb25zdCBNSU5fQ09OVFJPTF9RICAgID0gMC4xMjtcbmNvbnN0IE1BWF9DT05UUk9MX1EgICAgPSAyLjI7XG5jb25zdCBNSU5fRkxZSU5HX1NQRUVEID0gRjE2X1BST0ZJTEUubWluRmx5aW5nU3BlZWRNcHM7XG5jb25zdCBDRF9MQU5ESU5HX0dFQVIgID0gMC4wMzU7XG5jb25zdCBDRF9GTEFQUyAgICAgICAgID0gMC4wODtcbmNvbnN0IENMX0ZMQVBTX0ZBQ1RPUiAgPSAxLjI1O1xuXG5jb25zdCBHUk9VTkRfRlJJQ1RJT05fS0lORVRJQyA9IDAuMTU7XG5jb25zdCBHUk9VTkRfRlJJQ1RJT05fU1RBVElDICA9IDAuMjtcbmNvbnN0IEdST1VORF9CUkFLRV9LSU5FVElDICAgID0gMS44O1xuY29uc3QgR1JPVU5EX0JSQUtFX1NUQVRJQyAgICAgPSAxLjE3O1xuY29uc3QgTEFOREVEX01BWF9TUEVFRCAgID0gRjE2X1BST0ZJTEUubGFuZGluZ01heFNwZWVkTXBzO1xuY29uc3QgTEFORElOR19NQVhfVlNQRUVEID0gRjE2X1BST0ZJTEUubGFuZGluZ01heFZlcnRpY2FsU3BlZWRNcHM7XG5jb25zdCBMQU5ESU5HX01JTl9QSVRDSCAgPSBGMTZfUFJPRklMRS5sYW5kaW5nTWluUGl0Y2hEZWcgKiBQSV9PVkVSXzE4MDtcbmNvbnN0IExBTkRJTkdfTUFYX1JPTEwgICA9IEYxNl9QUk9GSUxFLmxhbmRpbmdNYXhSb2xsRGVnICAqIFBJX09WRVJfMTgwO1xuY29uc3QgUk9UQVRJT05fU1BFRUQgICAgID0gRjE2X1BST0ZJTEUucm90YXRpb25TcGVlZE1wcztcblxuZnVuY3Rpb24gY29tcHV0ZUNsKGFvYTogbnVtYmVyLCBmbGFwc0V4dGVuZGVkOiBib29sZWFuKTogbnVtYmVyIHtcbiAgICBjb25zdCBmbGFwQm9vc3QgPSBmbGFwc0V4dGVuZGVkID8gQ0xfRkxBUFNfRkFDVE9SIDogMS4wO1xuICAgIGNvbnN0IHN0YWxsQW9hICA9IGZsYXBzRXh0ZW5kZWQgPyBTVEFMTF9BT0EgKiAxLjEgOiBTVEFMTF9BT0E7XG4gICAgY29uc3QgbWF4Q2wgICAgID0gTUFYX0NMICogZmxhcEJvb3N0O1xuICAgIGlmIChNYXRoLmFicyhhb2EpIDw9IHN0YWxsQW9hKSB7XG4gICAgICAgIHJldHVybiBjbGFtcChDTDAgKyBDTF9BTFBIQSAqIGFvYSAqIGZsYXBCb29zdCwgLW1heENsICogMC4zNSwgbWF4Q2wpO1xuICAgIH1cbiAgICBjb25zdCBwZWFrQ2wgPSAoQ0wwICsgQ0xfQUxQSEEgKiBzdGFsbEFvYSAqIE1hdGguc2lnbihhb2EpKSAqIGZsYXBCb29zdDtcbiAgICByZXR1cm4gcGVha0NsICogTWF0aC5tYXgoMCwgTWF0aC5jb3MoKE1hdGguYWJzKGFvYSkgLSBzdGFsbEFvYSkgKiA0LjApKTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZVBpdGNoU3BlZWRBdXRob3JpdHkoc3BlZWQ6IG51bWJlciwgbGFuZGVkOiBib29sZWFuKTogbnVtYmVyIHtcbiAgICBsZXQgYSA9IGNsYW1wKHNwZWVkIC8gTUlOX0ZMWUlOR19TUEVFRCwgMCwgMSk7XG4gICAgaWYgKGxhbmRlZCAmJiBzcGVlZCA8IFJPVEFUSU9OX1NQRUVEKSBhICo9IGNsYW1wKHNwZWVkIC8gUk9UQVRJT05fU1BFRUQsIDAsIDEpO1xuICAgIHJldHVybiBhO1xufVxuXG5leHBvcnQgY2xhc3MgUmVhbGlzdGljRmxpZ2h0TW9kZWwgZXh0ZW5kcyBGbGlnaHRNb2RlbCB7XG5cbiAgICBwcml2YXRlIHN0YWxsID0gLTE7XG5cbiAgICBwcml2YXRlIGZvcndhcmQgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgdXAgICAgICA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSByaWdodCAgID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHZlbG9jaXR5VW5pdCA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSB0aHJ1c3QgID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIGRyYWcgICAgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgbGlmdCAgICA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSBmcmljdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSBmb3JjZXMgID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIF92ICA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSBfdjIgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMub2JqLnVwLmNvcHkoVVApO1xuICAgIH1cblxuICAgIHJlc2V0KCkge1xuICAgICAgICBzdXBlci5yZXNldCgpO1xuICAgICAgICB0aGlzLnN0YWxsID0gLTE7XG4gICAgfVxuXG4gICAgc3RlcChkZWx0YTogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLmNyYXNoZWQpIHJldHVybjtcblxuICAgICAgICB0aGlzLmVmZmVjdGl2ZVRocm90dGxlID0gdGhpcy50aHJvdHRsZSA+IHRoaXMuZWZmZWN0aXZlVGhyb3R0bGVcbiAgICAgICAgICAgID8gTWF0aC5taW4odGhpcy50aHJvdHRsZSwgdGhpcy5lZmZlY3RpdmVUaHJvdHRsZSArIFRIUk9UVExFX1VQX1JBVEUgKiBkZWx0YSlcbiAgICAgICAgICAgIDogTWF0aC5tYXgodGhpcy50aHJvdHRsZSwgdGhpcy5lZmZlY3RpdmVUaHJvdHRsZSAtIFRIUk9UVExFX0RPV05fUkFURSAqIGRlbHRhKTtcblxuICAgICAgICBjb25zdCBhbHRpdHVkZSA9IHRoaXMub2JqLnBvc2l0aW9uLnk7XG4gICAgICAgIGNvbnN0IHNwZWVkICAgID0gdGhpcy52ZWxvY2l0eS5sZW5ndGgoKTtcbiAgICAgICAgY29uc3QgZHluYW1pY1ByZXNzdXJlID0gY29tcHV0ZUR5bmFtaWNQcmVzc3VyZShjb21wdXRlQWlyRGVuc2l0eShhbHRpdHVkZSksIHNwZWVkKTtcbiAgICAgICAgY29uc3QgY29udHJvbFNjYWxlID0gY2xhbXAoZHluYW1pY1ByZXNzdXJlIC8gUV9SRUYsIE1JTl9DT05UUk9MX1EsIE1BWF9DT05UUk9MX1EpO1xuXG4gICAgICAgIHRoaXMuZm9yd2FyZC5jb3B5KEZPUldBUkQpLmFwcGx5UXVhdGVybmlvbih0aGlzLm9iai5xdWF0ZXJuaW9uKTtcbiAgICAgICAgdGhpcy51cC5jb3B5KFVQKS5hcHBseVF1YXRlcm5pb24odGhpcy5vYmoucXVhdGVybmlvbik7XG4gICAgICAgIHRoaXMucmlnaHQuY29weShSSUdIVCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMub2JqLnF1YXRlcm5pb24pO1xuXG4gICAgICAgIGNvbnN0IGFvYSA9IHNwZWVkID4gMS4wXG4gICAgICAgICAgICA/IGNvbXB1dGVBbmdsZU9mQXR0YWNrKHRoaXMuZm9yd2FyZCwgdGhpcy5yaWdodCwgdGhpcy52ZWxvY2l0eSwgdGhpcy5fdilcbiAgICAgICAgICAgIDogMDtcbiAgICAgICAgdGhpcy5hbmdsZU9mQXR0YWNrUmFkID0gYW9hO1xuXG4gICAgICAgIHRoaXMudXBkYXRlU3RhbGxTdGF0ZShzcGVlZCwgYW9hLCBhbHRpdHVkZSk7XG5cbiAgICAgICAgLy8gUm9sbFxuICAgICAgICBpZiAoIXRoaXMubGFuZGVkKSB0aGlzLm9iai5yb3RhdGVaKHRoaXMucm9sbCAqIFJPTExfUkFURSAqIGRlbHRhKTtcblxuICAgICAgICAvLyBQaXRjaCAoYmxvY2tlZCB3aGVuIHN0YWxsaW5nIGFuZCB0cnlpbmcgdG8gcHVsbCB1cClcbiAgICAgICAgY29uc3QgcGl0Y2hBdXRob3JpdHkgPSB0aGlzLnN0YWxsID49IDAgPyAwLjM1IDogMS4wO1xuICAgICAgICBpZiAoISh0aGlzLmxhbmRlZCAmJiB0aGlzLnBpdGNoIDwgMClcbiAgICAgICAgICAgICYmICh0aGlzLnN0YWxsIDwgMCB8fCAodGhpcy5waXRjaCA8IDAgJiYgdGhpcy51cC55ID4gMCkgfHwgKHRoaXMucGl0Y2ggPiAwICYmIHRoaXMudXAueSA8IDApKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIHRoaXMub2JqLnJvdGF0ZVgoLXRoaXMucGl0Y2ggKiBQSVRDSF9SQVRFICogY29udHJvbFNjYWxlICogcGl0Y2hBdXRob3JpdHlcbiAgICAgICAgICAgICAgICAqIGNvbXB1dGVQaXRjaFNwZWVkQXV0aG9yaXR5KHNwZWVkLCB0aGlzLmxhbmRlZCkgKiBkZWx0YSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHcmF2aXR5IG5vc2UtZG93bjogc3RhbGxpbmcgaW4gYWlyIE9SIG9uIGdyb3VuZCB3aXRoIG5vc2UgYWJvdmUgaG9yaXpvbnRhbFxuICAgICAgICBpZiAodGhpcy5mb3J3YXJkLnkgPiAwLjAwMSAmJiB0aGlzLnBpdGNoIDw9IDAgJiYgKHRoaXMuc3RhbGwgPiAwIHx8IHRoaXMubGFuZGVkKSkge1xuICAgICAgICAgICAgdGhpcy5fdjIuY3Jvc3NWZWN0b3JzKHRoaXMuZm9yd2FyZCwgdGhpcy5fdi5zZXQoMCwgLTEsIDApKS5ub3JtYWxpemUoKTtcbiAgICAgICAgICAgIGNvbnN0IHBpdGNoQW5nbGUgPSBNYXRoLmFzaW4oY2xhbXAodGhpcy5mb3J3YXJkLnksIC0xLCAxKSk7XG4gICAgICAgICAgICB0aGlzLm9iai5yb3RhdGVPbldvcmxkQXhpcyh0aGlzLl92MiwgTWF0aC5taW4ocGl0Y2hBbmdsZSwgKHRoaXMubGFuZGVkID8gMC41IDogdGhpcy5zdGFsbCAqIDAuNikgKiBkZWx0YSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gWWF3XG4gICAgICAgIGlmICghaXNaZXJvKHNwZWVkKSkge1xuICAgICAgICAgICAgdGhpcy5vYmoucm90YXRlWSgtdGhpcy55YXcgKiAodGhpcy5sYW5kZWQgPyBZQVdfUkFURV9MQU5ERUQgOiBZQVdfUkFURSkgKiBkZWx0YSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZWZyZXNoIGF4ZXMgYWZ0ZXIgYWxsIGF0dGl0dWRlIHJvdGF0aW9uc1xuICAgICAgICB0aGlzLmZvcndhcmQuY29weShGT1JXQVJEKS5hcHBseVF1YXRlcm5pb24odGhpcy5vYmoucXVhdGVybmlvbik7XG4gICAgICAgIHRoaXMudXAuY29weShVUCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMub2JqLnF1YXRlcm5pb24pO1xuICAgICAgICB0aGlzLnJpZ2h0LmNvcHkoUklHSFQpLmFwcGx5UXVhdGVybmlvbih0aGlzLm9iai5xdWF0ZXJuaW9uKTtcblxuICAgICAgICAvLyBBZXJvZHluYW1pYyBmb3JjZXNcbiAgICAgICAgY29uc3QgY2wgPSBjb21wdXRlQ2woYW9hLCB0aGlzLmZsYXBzRXh0ZW5kZWQpO1xuICAgICAgICBjb25zdCBjZCA9IENEMCArIElORFVDRURfRFJBR19LICogY2wgKiBjbFxuICAgICAgICAgICAgKyAodGhpcy5sYW5kaW5nR2VhckRlcGxveWVkID8gQ0RfTEFORElOR19HRUFSIDogMClcbiAgICAgICAgICAgICsgKHRoaXMuZmxhcHNFeHRlbmRlZCA/IENEX0ZMQVBTIDogMCk7XG5cbiAgICAgICAgY29uc3QgdGhydXN0TiA9IGNvbXB1dGVGMTZFbmdpbmVUaHJ1c3ROKHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUsIGFsdGl0dWRlKTtcbiAgICAgICAgcm91bmRUb1plcm8odGhpcy50aHJ1c3QuY29weSh0aGlzLmZvcndhcmQpLm11bHRpcGx5U2NhbGFyKHRocnVzdE4pKTtcbiAgICAgICAgdGhpcy5lbmdpbmVUaHJ1c3ROID0gdGhydXN0TjtcblxuICAgICAgICBpZiAoc3BlZWQgPiAwLjUpIHtcbiAgICAgICAgICAgIHRoaXMudmVsb2NpdHlVbml0LmNvcHkodGhpcy52ZWxvY2l0eSkubXVsdGlwbHlTY2FsYXIoMSAvIHNwZWVkKTtcbiAgICAgICAgICAgIHJvdW5kVG9aZXJvKHRoaXMuZHJhZy5jb3B5KHRoaXMudmVsb2NpdHlVbml0KS5uZWdhdGUoKS5tdWx0aXBseVNjYWxhcihkeW5hbWljUHJlc3N1cmUgKiBXSU5HX0FSRUEgKiBjZCkpO1xuICAgICAgICAgICAgcm91bmRUb1plcm8odGhpcy5saWZ0LmNvcHkodGhpcy51cCkubXVsdGlwbHlTY2FsYXIoZHluYW1pY1ByZXNzdXJlICogV0lOR19BUkVBICogY2wpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZHJhZy5zZXQoMCwgMCwgMCk7XG4gICAgICAgICAgICB0aGlzLmxpZnQuc2V0KDAsIDAsIDApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU3VtOiB0aHJ1c3QgKyBkcmFnICsgbGlmdCArIGdyYXZpdHlcbiAgICAgICAgdGhpcy5mb3JjZXMuc2V0KDAsIC1EUllfTUFTUyAqIDkuODA2NjUsIDApLmFkZCh0aGlzLnRocnVzdCkuYWRkKHRoaXMuZHJhZykuYWRkKHRoaXMubGlmdCk7XG5cbiAgICAgICAgLy8gR3JvdW5kIGZyaWN0aW9uXG4gICAgICAgIGlmICh0aGlzLmxhbmRlZCB8fCAodGhpcy53aGVlbEJyYWtlc0FwcGxpZWQgJiYgdGhpcy5vYmoucG9zaXRpb24ueSA8PSBQTEFORV9ESVNUQU5DRV9UT19HUk9VTkQgKyAwLjA1KSkge1xuICAgICAgICAgICAgY29uc3QgVyAgICAgID0gRFJZX01BU1MgKiA5LjgwNjY1O1xuICAgICAgICAgICAgY29uc3Qga2luZXRpYyA9ICh0aGlzLndoZWVsQnJha2VzQXBwbGllZCA/IEdST1VORF9CUkFLRV9LSU5FVElDIDogR1JPVU5EX0ZSSUNUSU9OX0tJTkVUSUMpICogVztcbiAgICAgICAgICAgIGNvbnN0IHByakYgICA9IHRoaXMuX3YuY29weSh0aGlzLmZvcmNlcykuc2V0WSgwKTtcbiAgICAgICAgICAgIGlmIChpc1plcm8oc3BlZWQpICYmIHByakYubGVuZ3RoKCkgPCAodGhpcy53aGVlbEJyYWtlc0FwcGxpZWQgPyBHUk9VTkRfQlJBS0VfU1RBVElDIDogR1JPVU5EX0ZSSUNUSU9OX1NUQVRJQykgKiBXKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5mcmljdGlvbi5jb3B5KHByakYpLm5lZ2F0ZSgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZyaWN0aW9uLmNvcHkodGhpcy52ZWxvY2l0eVVuaXQpLnNldFkoMCkubmVnYXRlKCkubm9ybWFsaXplKCkubXVsdGlwbHlTY2FsYXIoa2luZXRpYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByb3VuZFRvWmVybyh0aGlzLmZyaWN0aW9uKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZnJpY3Rpb24uc2V0KDAsIDAsIDApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5mb3JjZXMuYWRkKHRoaXMuZnJpY3Rpb24pO1xuICAgICAgICBpZiAodGhpcy5sYW5kZWQgJiYgdGhpcy5mb3JjZXMueSA8IDApIHRoaXMuZm9yY2VzLnNldFkoMCk7XG5cbiAgICAgICAgY29uc3QgYWNjZWwgPSByb3VuZFRvWmVybyh0aGlzLmZvcmNlcy5kaXZpZGVTY2FsYXIoRFJZX01BU1MpKTtcbiAgICAgICAgdGhpcy5sb2FkRmFjdG9yRyA9IGNvbXB1dGVMb2FkRmFjdG9yRyhhY2NlbCwgdGhpcy51cCk7XG4gICAgICAgIHRoaXMudmVsb2NpdHkuYWRkU2NhbGVkVmVjdG9yKGFjY2VsLCBkZWx0YSk7XG4gICAgICAgIGlmICh0aGlzLmxhbmRlZCAmJiB0aGlzLnZlbG9jaXR5LnkgPCAwKSB0aGlzLnZlbG9jaXR5LnNldFkoMCk7XG5cbiAgICAgICAgdGhpcy5vYmoucG9zaXRpb24uYWRkU2NhbGVkVmVjdG9yKFxuICAgICAgICAgICAgdGhpcy5sYW5kZWQgPyByb3VuZFRvWmVybyh0aGlzLnZlbG9jaXR5LCAwLjAwMDEpIDogdGhpcy52ZWxvY2l0eSxcbiAgICAgICAgICAgIGRlbHRhXG4gICAgICAgICk7XG4gICAgICAgIGlmICh0aGlzLm9iai5wb3NpdGlvbi55ID4gUExBTkVfRElTVEFOQ0VfVE9fR1JPVU5EICsgMC4wMSkgdGhpcy5sYW5kZWQgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLmhhbmRsZUdyb3VuZENvbnRhY3Qoc3BlZWQpO1xuICAgICAgICB0aGlzLndyYXBQb3NpdGlvbigpO1xuICAgIH1cblxuICAgIGdldFN0YWxsU3RhdHVzKCk6IG51bWJlciB7IHJldHVybiB0aGlzLnN0YWxsOyB9XG5cbiAgICBnZXRUaHJvdHRsZUh1ZFRleHQoKTogc3RyaW5nIHsgcmV0dXJuIGZvcm1hdEYxNlRocm90dGxlSHVkKHRoaXMudGhyb3R0bGUpOyB9XG4gICAgdXNlRjE2VGhyb3R0bGVEZXRlbnRzKCk6IGJvb2xlYW4geyByZXR1cm4gdHJ1ZTsgfVxuICAgIHN0ZXBUaHJvdHRsZURldGVudChjdXJyZW50OiBudW1iZXIsIGRpcmVjdGlvbjogMSB8IC0xKTogbnVtYmVyIHsgcmV0dXJuIHN0ZXBGMTZUaHJvdHRsZURldGVudChjdXJyZW50LCBkaXJlY3Rpb24pOyB9XG4gICAgaXNJblRocm90dGxlQWJEZXRlbnRCYW5kKGxldmVyOiBudW1iZXIpOiBib29sZWFuIHsgcmV0dXJuIGlzRjE2QWJEZXRlbnRCYW5kKGxldmVyKTsgfVxuICAgIGFkanVzdFRocm90dGxlSW5wdXQoY3VycmVudDogbnVtYmVyLCBzdGVwOiBudW1iZXIpOiBudW1iZXIgeyByZXR1cm4gYWRqdXN0RjE2VGhyb3R0bGVJbnB1dChjdXJyZW50LCBzdGVwKTsgfVxuICAgIGdldFRocm90dGxlWm9uZSgpOiBzdHJpbmcgeyByZXR1cm4gZ2V0RjE2VGhyb3R0bGVab25lKHRoaXMuZWZmZWN0aXZlVGhyb3R0bGUpOyB9XG4gICAgZ2V0VGhyb3R0bGVBdWRpb0xldmVsKCk6IG51bWJlciB7IHJldHVybiBmMTZUaHJvdHRsZUF1ZGlvTGV2ZWwodGhpcy5lZmZlY3RpdmVUaHJvdHRsZSk7IH1cbiAgICBnZXRFbmdpbmVOb3p6bGVDb2xvcigpOiBzdHJpbmcgeyByZXR1cm4gZ2V0RjE2RW5naW5lTm96emxlQ29sb3IodGhpcy5lZmZlY3RpdmVUaHJvdHRsZSk7IH1cblxuICAgIHByaXZhdGUgdXBkYXRlU3RhbGxTdGF0ZShzcGVlZDogbnVtYmVyLCBhb2E6IG51bWJlciwgYWx0aXR1ZGU6IG51bWJlcikge1xuICAgICAgICBpZiAodGhpcy5sYW5kZWQpIHsgdGhpcy5zdGFsbCA9IC0xOyByZXR1cm47IH1cbiAgICAgICAgY29uc3QgYW9hU3RhbGwgICA9IHNwZWVkID4gNSA/IGNsYW1wKChNYXRoLmFicyhhb2EpIC0gU1RBTExfQU9BICogMC43NSkgLyAoU1RBTExfQU9BICogMC4zNSksIDAsIDEpIDogMDtcbiAgICAgICAgY29uc3Qgc3BlZWRTdGFsbCA9IGNsYW1wKChNSU5fRkxZSU5HX1NQRUVEIC0gc3BlZWQpIC8gTUlOX0ZMWUlOR19TUEVFRCwgMCwgMSk7XG4gICAgICAgIGNvbnN0IGxldmVsICAgICAgPSBNYXRoLm1heChhb2FTdGFsbCwgYWx0aXR1ZGUgPiBQTEFORV9ESVNUQU5DRV9UT19HUk9VTkQgKyA1ID8gc3BlZWRTdGFsbCA6IDApO1xuICAgICAgICB0aGlzLnN0YWxsID0gbGV2ZWwgPiAwID8gbGV2ZWwgOiAtMTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGhhbmRsZUdyb3VuZENvbnRhY3Qoc3BlZWQ6IG51bWJlcikge1xuICAgICAgICBpZiAodGhpcy5vYmoucG9zaXRpb24ueSA+PSBQTEFORV9ESVNUQU5DRV9UT19HUk9VTkQpIHJldHVybjtcbiAgICAgICAgdGhpcy5vYmoucG9zaXRpb24ueSA9IFBMQU5FX0RJU1RBTkNFX1RPX0dST1VORDtcblxuICAgICAgICB0aGlzLmZvcndhcmQuY29weShGT1JXQVJEKS5hcHBseVF1YXRlcm5pb24odGhpcy5vYmoucXVhdGVybmlvbik7XG4gICAgICAgIHRoaXMucmlnaHQuY29weShSSUdIVCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMub2JqLnF1YXRlcm5pb24pO1xuXG4gICAgICAgIGNvbnN0IHByakZ3ZCAgID0gdGhpcy5fdi5jb3B5KHRoaXMuZm9yd2FyZCkuc2V0WSgwKS5ub3JtYWxpemUoKTtcbiAgICAgICAgY29uc3QgcHJqUmlnaHQgPSB0aGlzLl92Mi5jb3B5KHRoaXMucmlnaHQpLnNldFkoMCkubm9ybWFsaXplKCk7XG5cbiAgICAgICAgaWYgKCF0aGlzLmxhbmRpbmdHZWFyRGVwbG95ZWRcbiAgICAgICAgICAgIHx8IHNwZWVkID4gTEFOREVEX01BWF9TUEVFRFxuICAgICAgICAgICAgfHwgdGhpcy52ZWxvY2l0eS55IDwgLUxBTkRJTkdfTUFYX1ZTUEVFRFxuICAgICAgICAgICAgfHwgdGhpcy5yaWdodC5hbmdsZVRvKHByalJpZ2h0KSAqIE1hdGguc2lnbih0aGlzLnJpZ2h0LnkpID4gTEFORElOR19NQVhfUk9MTFxuICAgICAgICAgICAgfHwgTEFORElOR19NSU5fUElUQ0ggPiB0aGlzLmZvcndhcmQuYW5nbGVUbyhwcmpGd2QpICogTWF0aC5zaWduKHRoaXMuZm9yd2FyZC55KSkge1xuICAgICAgICAgICAgdGhpcy5jcmFzaGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmZvcndhcmQueSA8IDApIHRoaXMub2JqLnF1YXRlcm5pb24uc2V0RnJvbVVuaXRWZWN0b3JzKEZPUldBUkQsIHByakZ3ZCk7XG4gICAgICAgIHRoaXMudmVsb2NpdHkuc2V0WSgwKTtcbiAgICAgICAgdGhpcy5zdGFsbCAgPSAtMTtcbiAgICAgICAgdGhpcy5sYW5kZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIHByaXZhdGUgd3JhcFBvc2l0aW9uKCkge1xuICAgICAgICBjb25zdCBoID0gMi41ICogVEVSUkFJTl9TQ0FMRSAqIFRFUlJBSU5fTU9ERUxfU0laRTtcbiAgICAgICAgaWYgKHRoaXMub2JqLnBvc2l0aW9uLnggPiAgaCkgdGhpcy5vYmoucG9zaXRpb24ueCA9IC1oO1xuICAgICAgICBpZiAodGhpcy5vYmoucG9zaXRpb24ueCA8IC1oKSB0aGlzLm9iai5wb3NpdGlvbi54ID0gIGg7XG4gICAgICAgIGlmICh0aGlzLm9iai5wb3NpdGlvbi56ID4gIGgpIHRoaXMub2JqLnBvc2l0aW9uLnogPSAtaDtcbiAgICAgICAgaWYgKHRoaXMub2JqLnBvc2l0aW9uLnogPCAtaCkgdGhpcy5vYmoucG9zaXRpb24ueiA9ICBoO1xuICAgIH1cbn1cbiIsImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcbmltcG9ydCB7IFJlYWxpc3RpY0ZsaWdodE1vZGVsIH0gZnJvbSAnLi4vbW9kZWwvcmVhbGlzdGljRmxpZ2h0TW9kZWwnO1xuaW1wb3J0IHsgQXJjYWRlRmxpZ2h0TW9kZWwgfSBmcm9tICcuLi9tb2RlbC9hcmNhZGVGbGlnaHRNb2RlbCc7XG5pbXBvcnQgeyBEZWJ1Z0ZsaWdodE1vZGVsIH0gZnJvbSAnLi4vbW9kZWwvZGVidWdGbGlnaHRNb2RlbCc7XG5pbXBvcnQgeyBGbTJGbGlnaHRNb2RlbCB9IGZyb20gJy4uL21vZGVsL2ZtMkZsaWdodE1vZGVsJztcbmltcG9ydCB7IEZsaWdodE1vZGVsIH0gZnJvbSAnLi4vbW9kZWwvZmxpZ2h0TW9kZWwnO1xuXG5sZXQgZmxpZ2h0TW9kZWw6IEZsaWdodE1vZGVsO1xuXG5zZWxmLm9ubWVzc2FnZSA9IChldmVudDogTWVzc2FnZUV2ZW50KSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgICAgaGFuZGxlTWVzc2FnZShldmVudC5kYXRhKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc3QgZSA9IGVyciBhcyBFcnJvcjtcbiAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7IHR5cGU6ICdlcnJvcicsIG1lc3NhZ2U6IGAke2U/Lm5hbWV9OiAke2U/Lm1lc3NhZ2V9YCwgc3RhY2s6IGU/LnN0YWNrIH0pO1xuICAgIH1cbn07XG5cbmZ1bmN0aW9uIGhhbmRsZU1lc3NhZ2UoZGF0YTogYW55KSB7XG4gICAgc3dpdGNoIChkYXRhLnR5cGUpIHtcbiAgICAgICAgY2FzZSAnaW5pdCc6XG4gICAgICAgICAgICBpZiAoZGF0YS5tb2RlbFR5cGUgPT09ICdyZWFsaXN0aWMnKSB7XG4gICAgICAgICAgICAgICAgZmxpZ2h0TW9kZWwgPSBuZXcgUmVhbGlzdGljRmxpZ2h0TW9kZWwoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZGF0YS5tb2RlbFR5cGUgPT09ICdmbTInKSB7XG4gICAgICAgICAgICAgICAgZmxpZ2h0TW9kZWwgPSBuZXcgRm0yRmxpZ2h0TW9kZWwoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZGF0YS5tb2RlbFR5cGUgPT09ICdhcmNhZGUnKSB7XG4gICAgICAgICAgICAgICAgZmxpZ2h0TW9kZWwgPSBuZXcgQXJjYWRlRmxpZ2h0TW9kZWwoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZGF0YS5tb2RlbFR5cGUgPT09ICdkZWJ1ZycpIHtcbiAgICAgICAgICAgICAgICBmbGlnaHRNb2RlbCA9IG5ldyBEZWJ1Z0ZsaWdodE1vZGVsKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICd1cGRhdGUnOlxuICAgICAgICAgICAgaWYgKCFmbGlnaHRNb2RlbCkgcmV0dXJuO1xuICAgICAgICAgICAgZmxpZ2h0TW9kZWwuc2V0UGl0Y2goZGF0YS5pbnB1dHMucGl0Y2gpO1xuICAgICAgICAgICAgZmxpZ2h0TW9kZWwuc2V0Um9sbChkYXRhLmlucHV0cy5yb2xsKTtcbiAgICAgICAgICAgIGZsaWdodE1vZGVsLnNldFlhdyhkYXRhLmlucHV0cy55YXcpO1xuICAgICAgICAgICAgZmxpZ2h0TW9kZWwuc2V0VGhyb3R0bGUoZGF0YS5pbnB1dHMudGhyb3R0bGUpO1xuICAgICAgICAgICAgZmxpZ2h0TW9kZWwuc2V0TGFuZGluZ0dlYXJEZXBsb3llZChkYXRhLmlucHV0cy5sYW5kaW5nR2VhckRlcGxveWVkKTtcbiAgICAgICAgICAgIGZsaWdodE1vZGVsLnNldEZsYXBzRXh0ZW5kZWQoZGF0YS5pbnB1dHMuZmxhcHNFeHRlbmRlZCk7XG4gICAgICAgICAgICBmbGlnaHRNb2RlbC5zZXRXaGVlbEJyYWtlcyhkYXRhLmlucHV0cy53aGVlbEJyYWtlc0FwcGxpZWQpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBmbGlnaHRNb2RlbC51cGRhdGUoZGF0YS5kZWx0YSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHNlbmRTdGF0ZSgpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAncmVzZXQnOlxuICAgICAgICAgICAgaWYgKCFmbGlnaHRNb2RlbCkgcmV0dXJuO1xuICAgICAgICAgICAgZmxpZ2h0TW9kZWwucmVzZXQoKTtcbiAgICAgICAgICAgIGZsaWdodE1vZGVsLnBvc2l0aW9uLnNldChkYXRhLnBvc2l0aW9uWzBdLCBkYXRhLnBvc2l0aW9uWzFdLCBkYXRhLnBvc2l0aW9uWzJdKTtcbiAgICAgICAgICAgIGZsaWdodE1vZGVsLnF1YXRlcm5pb24uc2V0KGRhdGEucXVhdGVybmlvblswXSwgZGF0YS5xdWF0ZXJuaW9uWzFdLCBkYXRhLnF1YXRlcm5pb25bMl0sIGRhdGEucXVhdGVybmlvblszXSk7XG4gICAgICAgICAgICBmbGlnaHRNb2RlbC52ZWxvY2l0eVZlY3Rvci5zZXQoZGF0YS52ZWxvY2l0eVswXSwgZGF0YS52ZWxvY2l0eVsxXSwgZGF0YS52ZWxvY2l0eVsyXSk7XG4gICAgICAgICAgICBmbGlnaHRNb2RlbC5zZXRMYW5kZWQoZGF0YS5sYW5kZWQpO1xuICAgICAgICAgICAgZmxpZ2h0TW9kZWwuc2V0VGhyb3R0bGUoZGF0YS50aHJvdHRsZSk7XG4gICAgICAgICAgICBzZW5kU3RhdGUoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgJ3N5bmNFZmZlY3RpdmVUaHJvdHRsZSc6XG4gICAgICAgICAgICBpZiAoIWZsaWdodE1vZGVsKSByZXR1cm47XG4gICAgICAgICAgICBmbGlnaHRNb2RlbC5zZXRUaHJvdHRsZShkYXRhLnRocm90dGxlKTtcbiAgICAgICAgICAgIGZsaWdodE1vZGVsLnN5bmNFZmZlY3RpdmVUaHJvdHRsZSgpO1xuICAgICAgICAgICAgc2VuZFN0YXRlKCk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICdzZXRQb3NpdGlvbic6XG4gICAgICAgICAgICBpZiAoIWZsaWdodE1vZGVsKSByZXR1cm47XG4gICAgICAgICAgICBmbGlnaHRNb2RlbC5wb3NpdGlvbi5zZXQoZGF0YS5wb3NpdGlvblswXSwgZGF0YS5wb3NpdGlvblsxXSwgZGF0YS5wb3NpdGlvblsyXSk7XG4gICAgICAgICAgICBzZW5kU3RhdGUoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgJ3NldFF1YXRlcm5pb24nOlxuICAgICAgICAgICAgaWYgKCFmbGlnaHRNb2RlbCkgcmV0dXJuO1xuICAgICAgICAgICAgZmxpZ2h0TW9kZWwucXVhdGVybmlvbi5zZXQoZGF0YS5xdWF0ZXJuaW9uWzBdLCBkYXRhLnF1YXRlcm5pb25bMV0sIGRhdGEucXVhdGVybmlvblsyXSwgZGF0YS5xdWF0ZXJuaW9uWzNdKTtcbiAgICAgICAgICAgIHNlbmRTdGF0ZSgpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnc2V0VmVsb2NpdHknOlxuICAgICAgICAgICAgaWYgKCFmbGlnaHRNb2RlbCkgcmV0dXJuO1xuICAgICAgICAgICAgZmxpZ2h0TW9kZWwudmVsb2NpdHlWZWN0b3Iuc2V0KGRhdGEudmVsb2NpdHlbMF0sIGRhdGEudmVsb2NpdHlbMV0sIGRhdGEudmVsb2NpdHlbMl0pO1xuICAgICAgICAgICAgc2VuZFN0YXRlKCk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICdzbmFwUGh5c2ljc1N0YXRlJzpcbiAgICAgICAgICAgIGlmICghZmxpZ2h0TW9kZWwpIHJldHVybjtcbiAgICAgICAgICAgIGZsaWdodE1vZGVsLnNuYXBQaHlzaWNzU3RhdGUoKTtcbiAgICAgICAgICAgIHNlbmRTdGF0ZSgpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxufTtcblxuZnVuY3Rpb24gc2VuZFN0YXRlKCkge1xuICAgIGlmICghZmxpZ2h0TW9kZWwpIHJldHVybjtcbiAgICBjb25zdCBzdGF0ZSA9IHtcbiAgICAgICAgcG9zaXRpb246IGZsaWdodE1vZGVsLnBvc2l0aW9uLnRvQXJyYXkoKSxcbiAgICAgICAgcXVhdGVybmlvbjogZmxpZ2h0TW9kZWwucXVhdGVybmlvbi50b0FycmF5KCksXG4gICAgICAgIHZlbG9jaXR5OiBmbGlnaHRNb2RlbC52ZWxvY2l0eVZlY3Rvci50b0FycmF5KCksXG4gICAgICAgIC8vIEB0cy1pZ25vcmUgLSBhY2Nlc3NpbmcgcHJvdGVjdGVkIG1lbWJlcnMgZm9yIHRyYW5zZmVyXG4gICAgICAgIHByZXZQb3NpdGlvbjogZmxpZ2h0TW9kZWwucHJldlBvc2l0aW9uLnRvQXJyYXkoKSxcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBwcmV2UXVhdGVybmlvbjogZmxpZ2h0TW9kZWwucHJldlF1YXRlcm5pb24udG9BcnJheSgpLFxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHByZXZWZWxvY2l0eTogZmxpZ2h0TW9kZWwucHJldlZlbG9jaXR5LnRvQXJyYXkoKSxcbiAgICAgICAgY3Jhc2hlZDogZmxpZ2h0TW9kZWwuaXNDcmFzaGVkKCksXG4gICAgICAgIGxhbmRlZDogZmxpZ2h0TW9kZWwuaXNMYW5kZWQoKSxcbiAgICAgICAgYW5nbGVPZkF0dGFja1JhZDogZmxpZ2h0TW9kZWwuZ2V0QW5nbGVPZkF0dGFjaygpLFxuICAgICAgICBsb2FkRmFjdG9yRzogZmxpZ2h0TW9kZWwuZ2V0TG9hZEZhY3RvckcoKSxcbiAgICAgICAgZW5naW5lVGhydXN0TjogZmxpZ2h0TW9kZWwuZ2V0RW5naW5lVGhydXN0S24oKSAqIDEwMDAsXG4gICAgICAgIGVmZmVjdGl2ZVRocm90dGxlOiBmbGlnaHRNb2RlbC5nZXRFZmZlY3RpdmVUaHJvdHRsZSgpLFxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGRlbHRhUmVtYWluZGVyOiBmbGlnaHRNb2RlbC5kZWx0YVJlbWFpbmRlcixcbiAgICAgICAgc3RhbGw6IGZsaWdodE1vZGVsLmdldFN0YWxsU3RhdHVzKClcbiAgICB9O1xuXG4gICAgc2VsZi5wb3N0TWVzc2FnZSh7IHR5cGU6ICdzdGF0ZScsIHN0YXRlIH0pO1xufVxuIiwiaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuXG5jb25zdCBfdiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5jb25zdCBfdyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5jb25zdCBfcSA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG5cbmNvbnN0IEVQU0lMT04gPSAwLjAwMDE7XG5cbmV4cG9ydCBjb25zdCBaRVJPID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgMCk7XG5leHBvcnQgY29uc3QgVVAgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAxLCAwKTtcbmV4cG9ydCBjb25zdCBGT1JXQVJEID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgMSk7XG5leHBvcnQgY29uc3QgUklHSFQgPSBuZXcgVEhSRUUuVmVjdG9yMygxLCAwLCAwKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGlzWmVybyhuOiBudW1iZXIpOiBib29sZWFuIHtcbiAgICByZXR1cm4gLUVQU0lMT04gPD0gbiAmJiBuIDw9IEVQU0lMT047XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlcXVhbHMoYTogbnVtYmVyLCBiOiBudW1iZXIsIGVwc2lsb246IG51bWJlciA9IEVQU0lMT04pOiBib29sZWFuIHtcbiAgICByZXR1cm4gYSAtIGVwc2lsb24gPD0gYiAmJiBiIDw9IGEgKyBlcHNpbG9uO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2xhbXAobjogbnVtYmVyLCBtaW46IG51bWJlciwgbWF4OiBudW1iZXIpOiBudW1iZXIge1xuICAgIHJldHVybiBNYXRoLm1heChtaW4sIE1hdGgubWluKG4sIG1heCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbGVycCh0OiBudW1iZXIsIG4wOiBudW1iZXIsIG4xOiBudW1iZXIpOiBudW1iZXIge1xuICAgIHJldHVybiBuMCArIHQgKiAobjEgLSBuMCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB2ZWN0b3JIZWFkaW5nKHY6IFRIUkVFLlZlY3RvcjMpOiBudW1iZXIge1xuICAgIGxldCBiZWFyaW5nID0gTWF0aC5yb3VuZChNYXRoLmF0YW4yKHYueCwgLXYueikgLyAoMiAqIE1hdGguUEkpICogMzYwKTtcbiAgICBpZiAoYmVhcmluZyA8IDApIHtcbiAgICAgICAgYmVhcmluZyA9IDM2MCArIGJlYXJpbmc7XG4gICAgfVxuICAgIHJldHVybiBiZWFyaW5nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcm91bmRUb1plcm8odjogVEhSRUUuVmVjdG9yMywgZXBzaWxvbjogbnVtYmVyID0gRVBTSUxPTik6IFRIUkVFLlZlY3RvcjMge1xuICAgIGlmIChlcXVhbHModi54LCAwLjAsIGVwc2lsb24pKSB7XG4gICAgICAgIHYueCA9IDA7XG4gICAgfVxuICAgIGlmIChlcXVhbHModi55LCAwLjAsIGVwc2lsb24pKSB7XG4gICAgICAgIHYueSA9IDA7XG4gICAgfVxuICAgIGlmIChlcXVhbHModi56LCAwLjAsIGVwc2lsb24pKSB7XG4gICAgICAgIHYueiA9IDA7XG4gICAgfVxuICAgIHJldHVybiB2O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZWFzZU91dENpcmMoeDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KDEgLSAoeCAtIDEpICogKHggLSAxKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlYXNlT3V0UXVhZCh4OiBudW1iZXIpIHtcbiAgICByZXR1cm4gMSAtICgxIC0geCkgKiAoMSAtIHgpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGVhc2VPdXRRdWludCh4OiBudW1iZXIpIHtcbiAgICByZXR1cm4gMSAtIE1hdGgucG93KDEgLSB4LCA1KTtcbn1cblxuZXhwb3J0IGNvbnN0IFBJX09WRVJfMTgwID0gTWF0aC5QSSAvIDE4MC4wO1xuZXhwb3J0IGNvbnN0IE4xODBfT1ZFUl9QSSA9IDE4MC4wIC8gTWF0aC5QSTtcblxuZXhwb3J0IGZ1bmN0aW9uIHRvUmFkaWFucyhkZWdyZWVzOiBudW1iZXIpOiBudW1iZXIge1xuICAgIHJldHVybiBQSV9PVkVSXzE4MCAqIGRlZ3JlZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0RlZ3JlZXMocmFkaWFuczogbnVtYmVyKTogbnVtYmVyIHtcbiAgICByZXR1cm4gTjE4MF9PVkVSX1BJICogcmFkaWFucztcbn1cblxuLy8gUmV0dXJucyBbcGl0Y2gsIHJvbGxdIGluIHJhZGlhbnNcbmV4cG9ydCBmdW5jdGlvbiBjYWxjdWxhdGVQaXRjaFJvbGwoYWN0b3I6IHtcbiAgICBxdWF0ZXJuaW9uOiBUSFJFRS5RdWF0ZXJuaW9uO1xuICAgIGdldFdvcmxkRGlyZWN0aW9uOiAodjogVEhSRUUuVmVjdG9yMykgPT4gVEhSRUUuVmVjdG9yMztcbn0pOiBbbnVtYmVyLCBudW1iZXJdIHtcbiAgICBjb25zdCBmb3J3YXJkID0gYWN0b3IuZ2V0V29ybGREaXJlY3Rpb24oX3YpO1xuICAgIGNvbnN0IHByakZvcndhcmQgPSBfdy5jb3B5KGZvcndhcmQpXG4gICAgICAgIC5zZXRZKDApXG4gICAgICAgIC5ub3JtYWxpemUoKTtcbiAgICBjb25zdCBwaXRjaCA9IGZvcndhcmQuYW5nbGVUbyhwcmpGb3J3YXJkKSAqIE1hdGguc2lnbihmb3J3YXJkLnkpO1xuXG4gICAgX3Euc2V0RnJvbVVuaXRWZWN0b3JzKGZvcndhcmQsIHByakZvcndhcmQpO1xuXG4gICAgY29uc3QgcmlnaHQgPSBfdi5jb3B5KFJJR0hUKVxuICAgICAgICAuYXBwbHlRdWF0ZXJuaW9uKGFjdG9yLnF1YXRlcm5pb24pXG4gICAgICAgIC5hcHBseVF1YXRlcm5pb24oX3EpO1xuICAgIF9xLnNldEZyb21Vbml0VmVjdG9ycyhwcmpGb3J3YXJkLCBGT1JXQVJEKTtcbiAgICByaWdodC5hcHBseVF1YXRlcm5pb24oX3EpO1xuICAgIGxldCByb2xsID0gTWF0aC5hY29zKHJpZ2h0LngpICogTWF0aC5zaWduKHJpZ2h0LnkpO1xuICAgIHJvbGwgPSBpc05hTihyb2xsKSA/IDAuMCA6IHJvbGw7XG5cbiAgICByZXR1cm4gW3BpdGNoLCByb2xsXTtcbn1cbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4vLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuX193ZWJwYWNrX3JlcXVpcmVfXy5tID0gX193ZWJwYWNrX21vZHVsZXNfXztcblxuLy8gdGhlIHN0YXJ0dXAgZnVuY3Rpb25cbl9fd2VicGFja19yZXF1aXJlX18ueCA9ICgpID0+IHtcblx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG5cdC8vIFRoaXMgZW50cnkgbW9kdWxlIGRlcGVuZHMgb24gb3RoZXIgbG9hZGVkIGNodW5rcyBhbmQgZXhlY3V0aW9uIG5lZWQgdG8gYmUgZGVsYXllZFxuXHR2YXIgX193ZWJwYWNrX2V4cG9ydHNfXyA9IF9fd2VicGFja19yZXF1aXJlX18uTyh1bmRlZmluZWQsIFtcInZlbmRvcnMtbm9kZV9tb2R1bGVzX3RocmVlX2J1aWxkX3RocmVlX21vZHVsZV9qc1wiXSwgKCkgPT4gKF9fd2VicGFja19yZXF1aXJlX18oXCIuL3NyYy9zY3JpcHQvcGh5c2ljcy93b3JrZXIvZmxpZ2h0V29ya2VyLnRzXCIpKSlcblx0X193ZWJwYWNrX2V4cG9ydHNfXyA9IF9fd2VicGFja19yZXF1aXJlX18uTyhfX3dlYnBhY2tfZXhwb3J0c19fKTtcblx0cmV0dXJuIF9fd2VicGFja19leHBvcnRzX187XG59O1xuXG4iLCJ2YXIgZGVmZXJyZWQgPSBbXTtcbl9fd2VicGFja19yZXF1aXJlX18uTyA9IChyZXN1bHQsIGNodW5rSWRzLCBmbiwgcHJpb3JpdHkpID0+IHtcblx0aWYoY2h1bmtJZHMpIHtcblx0XHRwcmlvcml0eSA9IHByaW9yaXR5IHx8IDA7XG5cdFx0Zm9yKHZhciBpID0gZGVmZXJyZWQubGVuZ3RoOyBpID4gMCAmJiBkZWZlcnJlZFtpIC0gMV1bMl0gPiBwcmlvcml0eTsgaS0tKSBkZWZlcnJlZFtpXSA9IGRlZmVycmVkW2kgLSAxXTtcblx0XHRkZWZlcnJlZFtpXSA9IFtjaHVua0lkcywgZm4sIHByaW9yaXR5XTtcblx0XHRyZXR1cm47XG5cdH1cblx0dmFyIG5vdEZ1bGZpbGxlZCA9IEluZmluaXR5O1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IGRlZmVycmVkLmxlbmd0aDsgaSsrKSB7XG5cdFx0dmFyIFtjaHVua0lkcywgZm4sIHByaW9yaXR5XSA9IGRlZmVycmVkW2ldO1xuXHRcdHZhciBmdWxmaWxsZWQgPSB0cnVlO1xuXHRcdGZvciAodmFyIGogPSAwOyBqIDwgY2h1bmtJZHMubGVuZ3RoOyBqKyspIHtcblx0XHRcdGlmICgocHJpb3JpdHkgJiAxID09PSAwIHx8IG5vdEZ1bGZpbGxlZCA+PSBwcmlvcml0eSkgJiYgT2JqZWN0LmtleXMoX193ZWJwYWNrX3JlcXVpcmVfXy5PKS5ldmVyeSgoa2V5KSA9PiAoX193ZWJwYWNrX3JlcXVpcmVfXy5PW2tleV0oY2h1bmtJZHNbal0pKSkpIHtcblx0XHRcdFx0Y2h1bmtJZHMuc3BsaWNlKGotLSwgMSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRmdWxmaWxsZWQgPSBmYWxzZTtcblx0XHRcdFx0aWYocHJpb3JpdHkgPCBub3RGdWxmaWxsZWQpIG5vdEZ1bGZpbGxlZCA9IHByaW9yaXR5O1xuXHRcdFx0fVxuXHRcdH1cblx0XHRpZihmdWxmaWxsZWQpIHtcblx0XHRcdGRlZmVycmVkLnNwbGljZShpLS0sIDEpXG5cdFx0XHR2YXIgciA9IGZuKCk7XG5cdFx0XHRpZiAociAhPT0gdW5kZWZpbmVkKSByZXN1bHQgPSByO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gcmVzdWx0O1xufTsiLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmYgPSB7fTtcbi8vIFRoaXMgZmlsZSBjb250YWlucyBvbmx5IHRoZSBlbnRyeSBjaHVuay5cbi8vIFRoZSBjaHVuayBsb2FkaW5nIGZ1bmN0aW9uIGZvciBhZGRpdGlvbmFsIGNodW5rc1xuX193ZWJwYWNrX3JlcXVpcmVfXy5lID0gKGNodW5rSWQpID0+IHtcblx0cmV0dXJuIFByb21pc2UuYWxsKE9iamVjdC5rZXlzKF9fd2VicGFja19yZXF1aXJlX18uZikucmVkdWNlKChwcm9taXNlcywga2V5KSA9PiB7XG5cdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5mW2tleV0oY2h1bmtJZCwgcHJvbWlzZXMpO1xuXHRcdHJldHVybiBwcm9taXNlcztcblx0fSwgW10pKTtcbn07IiwiLy8gVGhpcyBmdW5jdGlvbiBhbGxvdyB0byByZWZlcmVuY2UgYXN5bmMgY2h1bmtzIGFuZCBzaWJsaW5nIGNodW5rcyBmb3IgdGhlIGVudHJ5cG9pbnRcbl9fd2VicGFja19yZXF1aXJlX18udSA9IChjaHVua0lkKSA9PiB7XG5cdC8vIHJldHVybiB1cmwgZm9yIGZpbGVuYW1lcyBiYXNlZCBvbiB0ZW1wbGF0ZVxuXHRyZXR1cm4gXCJcIiArIGNodW5rSWQgKyBcIi5idW5kbGUuanNcIjtcbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5nID0gKGZ1bmN0aW9uKCkge1xuXHRpZiAodHlwZW9mIGdsb2JhbFRoaXMgPT09ICdvYmplY3QnKSByZXR1cm4gZ2xvYmFsVGhpcztcblx0dHJ5IHtcblx0XHRyZXR1cm4gdGhpcyB8fCBuZXcgRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdGlmICh0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JykgcmV0dXJuIHdpbmRvdztcblx0fVxufSkoKTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwidmFyIHNjcmlwdFVybDtcbmlmIChfX3dlYnBhY2tfcmVxdWlyZV9fLmcuaW1wb3J0U2NyaXB0cykgc2NyaXB0VXJsID0gX193ZWJwYWNrX3JlcXVpcmVfXy5nLmxvY2F0aW9uICsgXCJcIjtcbnZhciBkb2N1bWVudCA9IF9fd2VicGFja19yZXF1aXJlX18uZy5kb2N1bWVudDtcbmlmICghc2NyaXB0VXJsICYmIGRvY3VtZW50KSB7XG5cdGlmIChkb2N1bWVudC5jdXJyZW50U2NyaXB0KVxuXHRcdHNjcmlwdFVybCA9IGRvY3VtZW50LmN1cnJlbnRTY3JpcHQuc3JjXG5cdGlmICghc2NyaXB0VXJsKSB7XG5cdFx0dmFyIHNjcmlwdHMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcInNjcmlwdFwiKTtcblx0XHRpZihzY3JpcHRzLmxlbmd0aCkgc2NyaXB0VXJsID0gc2NyaXB0c1tzY3JpcHRzLmxlbmd0aCAtIDFdLnNyY1xuXHR9XG59XG4vLyBXaGVuIHN1cHBvcnRpbmcgYnJvd3NlcnMgd2hlcmUgYW4gYXV0b21hdGljIHB1YmxpY1BhdGggaXMgbm90IHN1cHBvcnRlZCB5b3UgbXVzdCBzcGVjaWZ5IGFuIG91dHB1dC5wdWJsaWNQYXRoIG1hbnVhbGx5IHZpYSBjb25maWd1cmF0aW9uXG4vLyBvciBwYXNzIGFuIGVtcHR5IHN0cmluZyAoXCJcIikgYW5kIHNldCB0aGUgX193ZWJwYWNrX3B1YmxpY19wYXRoX18gdmFyaWFibGUgZnJvbSB5b3VyIGNvZGUgdG8gdXNlIHlvdXIgb3duIGxvZ2ljLlxuaWYgKCFzY3JpcHRVcmwpIHRocm93IG5ldyBFcnJvcihcIkF1dG9tYXRpYyBwdWJsaWNQYXRoIGlzIG5vdCBzdXBwb3J0ZWQgaW4gdGhpcyBicm93c2VyXCIpO1xuc2NyaXB0VXJsID0gc2NyaXB0VXJsLnJlcGxhY2UoLyMuKiQvLCBcIlwiKS5yZXBsYWNlKC9cXD8uKiQvLCBcIlwiKS5yZXBsYWNlKC9cXC9bXlxcL10rJC8sIFwiL1wiKTtcbl9fd2VicGFja19yZXF1aXJlX18ucCA9IHNjcmlwdFVybDsiLCIvLyBubyBiYXNlVVJJXG5cbi8vIG9iamVjdCB0byBzdG9yZSBsb2FkZWQgY2h1bmtzXG4vLyBcIjFcIiBtZWFucyBcImFscmVhZHkgbG9hZGVkXCJcbnZhciBpbnN0YWxsZWRDaHVua3MgPSB7XG5cdFwic3JjX3NjcmlwdF9waHlzaWNzX3dvcmtlcl9mbGlnaHRXb3JrZXJfdHNcIjogMVxufTtcblxuLy8gaW1wb3J0U2NyaXB0cyBjaHVuayBsb2FkaW5nXG52YXIgaW5zdGFsbENodW5rID0gKGRhdGEpID0+IHtcblx0dmFyIFtjaHVua0lkcywgbW9yZU1vZHVsZXMsIHJ1bnRpbWVdID0gZGF0YTtcblx0Zm9yKHZhciBtb2R1bGVJZCBpbiBtb3JlTW9kdWxlcykge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhtb3JlTW9kdWxlcywgbW9kdWxlSWQpKSB7XG5cdFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLm1bbW9kdWxlSWRdID0gbW9yZU1vZHVsZXNbbW9kdWxlSWRdO1xuXHRcdH1cblx0fVxuXHRpZihydW50aW1lKSBydW50aW1lKF9fd2VicGFja19yZXF1aXJlX18pO1xuXHR3aGlsZShjaHVua0lkcy5sZW5ndGgpXG5cdFx0aW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRzLnBvcCgpXSA9IDE7XG5cdHBhcmVudENodW5rTG9hZGluZ0Z1bmN0aW9uKGRhdGEpO1xufTtcbl9fd2VicGFja19yZXF1aXJlX18uZi5pID0gKGNodW5rSWQsIHByb21pc2VzKSA9PiB7XG5cdC8vIFwiMVwiIGlzIHRoZSBzaWduYWwgZm9yIFwiYWxyZWFkeSBsb2FkZWRcIlxuXHRpZighaW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdKSB7XG5cdFx0aWYodHJ1ZSkgeyAvLyBhbGwgY2h1bmtzIGhhdmUgSlNcblx0XHRcdGltcG9ydFNjcmlwdHMoX193ZWJwYWNrX3JlcXVpcmVfXy5wICsgX193ZWJwYWNrX3JlcXVpcmVfXy51KGNodW5rSWQpKTtcblx0XHR9XG5cdH1cbn07XG5cbnZhciBjaHVua0xvYWRpbmdHbG9iYWwgPSBzZWxmW1wid2VicGFja0NodW5rcmV0cm9mbGlnaHRzaW1cIl0gPSBzZWxmW1wid2VicGFja0NodW5rcmV0cm9mbGlnaHRzaW1cIl0gfHwgW107XG52YXIgcGFyZW50Q2h1bmtMb2FkaW5nRnVuY3Rpb24gPSBjaHVua0xvYWRpbmdHbG9iYWwucHVzaC5iaW5kKGNodW5rTG9hZGluZ0dsb2JhbCk7XG5jaHVua0xvYWRpbmdHbG9iYWwucHVzaCA9IGluc3RhbGxDaHVuaztcblxuLy8gbm8gSE1SXG5cbi8vIG5vIEhNUiBtYW5pZmVzdCIsInZhciBuZXh0ID0gX193ZWJwYWNrX3JlcXVpcmVfXy54O1xuX193ZWJwYWNrX3JlcXVpcmVfXy54ID0gKCkgPT4ge1xuXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXy5lKFwidmVuZG9ycy1ub2RlX21vZHVsZXNfdGhyZWVfYnVpbGRfdGhyZWVfbW9kdWxlX2pzXCIpLnRoZW4obmV4dCk7XG59OyIsIiIsIi8vIHJ1biBzdGFydHVwXG52YXIgX193ZWJwYWNrX2V4cG9ydHNfXyA9IF9fd2VicGFja19yZXF1aXJlX18ueCgpO1xuIiwiIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9
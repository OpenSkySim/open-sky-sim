/**
 * Debug configuration for switching between barricade solver implementations.
 *
 * Allows running both particle-based and rigid-body-based solvers
 * in parallel to compare output and validate physics.
 */

export enum BarricadeSolverMode {
    /** Current particle-based XPBD solver */
    PARTICLE = 'particle',
    /** New rigid-body-based constraint solver */
    RIGID_BODY = 'rigid_body',
    /** Run both solvers in parallel for comparison (renderer uses PARTICLE output) */
    PARALLEL_DEBUG = 'parallel_debug',
}

export interface BarricadeDebugConfig {
    /** Active solver mode */
    solverMode: BarricadeSolverMode;
    /** Enable detailed logging of constraint violations */
    logConstraintViolations: boolean;
    /** Enable logging of tension profiles per wire */
    logTensionProfiles: boolean;
    /** Log frame-by-frame position deltas */
    logPositionDeltas: boolean;
    /** Enable performance timing for solver */
    profileSolverTime: boolean;
    /** Test mode: measure and compare outputs from both solvers */
    validateAgainstParticle: boolean;
    /** Maximum allowed position difference between solvers (meters) */
    validationTolerance: number;
}

export const DEFAULT_DEBUG_CONFIG: BarricadeDebugConfig = {
    solverMode: BarricadeSolverMode.PARTICLE,
    logConstraintViolations: false,
    logTensionProfiles: false,
    logPositionDeltas: false,
    profileSolverTime: false,
    validateAgainstParticle: false,
    validationTolerance: 0.05, // 5cm
};

/**
 * Runtime debug state for barricade system.
 *
 * Tracks metrics and comparisons when validation is enabled.
 */
export interface BarricadeDebugMetrics {
    /** Frame count since last reset */
    frameCount: number;
    /** Total solver time in ms */
    totalSolverTimeMs: number;
    /** Maximum position difference observed */
    maxPositionDelta: number;
    /** Average position difference */
    avgPositionDelta: number;
    /** Number of validation failures */
    validationFailures: number;
    /** Wire tension values from current frame */
    wireTensions: number[];
    /** Whether current frame had any constraint violations */
    hasConstraintViolations: boolean;
}

export function createDefaultMetrics(): BarricadeDebugMetrics {
    return {
        frameCount: 0,
        totalSolverTimeMs: 0,
        maxPositionDelta: 0,
        avgPositionDelta: 0,
        validationFailures: 0,
        wireTensions: [0, 0, 0, 0],
        hasConstraintViolations: false,
    };
}

/**
 * Get solver mode from URL or environment for quick testing.
 *
 * Supports:
 * - URL param: ?barricadeSolver=rigid_body
 * - Query: ?barricadeSolver=parallel_debug
 */
export function getSolverModeFromEnvironment(): BarricadeSolverMode {
    if (typeof window === 'undefined') {
        return DEFAULT_DEBUG_CONFIG.solverMode;
    }

    const params = new URLSearchParams(window.location.search);
    const solverParam = params.get('barricadeSolver');

    if (solverParam === 'rigid_body') {
        return BarricadeSolverMode.RIGID_BODY;
    }
    if (solverParam === 'parallel_debug') {
        return BarricadeSolverMode.PARALLEL_DEBUG;
    }

    return DEFAULT_DEBUG_CONFIG.solverMode;
}

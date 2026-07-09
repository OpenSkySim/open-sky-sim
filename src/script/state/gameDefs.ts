
export enum TechProfiles {
    CGA = 'CGA',
    EGA = 'EGA',
    VGA = 'VGA',
    SVGA = 'SVGA',
    HD = 'HD',
}

/**
 * Every aircraft flies the single FM2 rigid-body "parts" model; handling
 * differences (fly-by-wire vs mechanical, etc.) are expressed purely as
 * per-aircraft config. FM2 is the full 6-DOF aerodynamic model; DEBUG selects the
 * same model's no-aerodynamics "free-fly" mode (stick rotates the airframe
 * directly) for inspecting scenery and models.
 */
export enum FlightModels {
    FM2 = 'FM2',
    DEBUG = 'DEBUG'
}

export enum UnitSystems {
    METRIC = 'METRIC',
    IMPERIAL = 'IMPERIAL',
}

export enum HUDFocusMode {
    DISABLED,
    PARTIAL,
    FULL,
    _LENGTH
}

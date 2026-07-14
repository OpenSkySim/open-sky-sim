import * as THREE from 'three';
import { ConfigService } from '../../../config/configService';
import { Palette, PaletteCategory, PaletteColor } from "../../../config/palettes/palette";
import { COCKPIT_FOV, PITCH_STICK_AFT_UNITS, PITCH_STICK_FWD_UNITS } from '../../../defs';
import { CanvasPainter } from "../../../render/screen/canvasPainter";
import { Font, TextAlignment } from "../../../render/screen/text";
import { HUDFocusMode, UnitSystems } from '../../../state/gameDefs';
import { calculatePitchRoll, clamp, FORWARD, toDegrees, toRadians, UP, vectorHeading } from '../../../utils/math';
import { computeMachNumber } from '../../../physics/aeroUtils';
import { FcsPitchLimiter } from '../../../physics/fm2/fcs';
import { Entity } from "../../entity";
import { Scene, SceneLayers } from "../../scene";
import { GroundTargetEntity } from '../groundTarget';
import { PlayerEntity } from "../player";
import { formatHeading, getOverlayLayout, getOverlayLogicalHeight, getOverlayTickStep, OverlayLayout, toFeet } from './overlayUtils';
import { DisplayUnits } from './displayUnits';


const ALTITUDE_HEIGHT = 32;
const ALTITUDE_HALF_HEIGHT = ALTITUDE_HEIGHT / 2;

const HEADING_WIDTH = 26;
// Do not change these...
const HEADING_HALF_WIDTH = HEADING_WIDTH / 2;
const HEADING_SPACING = 5;
const HEADING_STEP = 5;

const AIRSPEED_HEIGHT = 32;
const AIRSPEED_HALF_HEIGHT = AIRSPEED_HEIGHT / 2;

const AOA_STALL_DEG = 22;

const LADDER_EXTRA_MARKERS = 2;
const LADDER_HORIZON_HALF_GAP = 12;
const LADDER_SIZE = 100;
const LADDER_WIDTH = 164;
const LADDER_HEIGHT = 70;
// Do not change these...
const LADDER_SIZE_HALF = Math.floor(LADDER_SIZE / 2);
const LADDER_HALF_WIDTH = Math.floor(LADDER_WIDTH / 2);
const LADDER_HALF_HEIGHT = Math.floor(LADDER_HEIGHT / 2);

const TARGET_HALF_WIDTH = 8; // Pixels
const TARGET_WIDTH = TARGET_HALF_WIDTH * 2 + 1;

/** Short HUD tag for each pitch AoA/g limiter strategy (keys 1/2/3). */
const FCS_MODE_LABELS: Record<number, string> = {
    [FcsPitchLimiter.SOFT]: 'FCS1 SOFT',
    [FcsPitchLimiter.PREDICTIVE]: 'FCS2 PRED',
    [FcsPitchLimiter.SMOOTH]: 'FCS3 SMTH',
};

//const HALF_CHAR = Math.floor(CHAR_HEIGHT / 2);


export class HUDEntity implements Entity {

    private displayUnits: DisplayUnits;
    private readonly onUnitSystemChange = (system: UnitSystems) => {
        this.displayUnits.setSystem(system);
    };

    constructor(private actor: PlayerEntity, config: ConfigService) {
        this.displayUnits = new DisplayUnits(config.unitSystem.getActive());
        config.unitSystem.addChangeListener(this.onUnitSystemChange);
    }

    private heading: number = 0; // degrees, 0 is North, increases CW
    private altitude: number = 0; // display units (m or ft)
    private altitudeMeters: number = 0; // raw sim altitude for debug
    private engineThrustKn: number = 0;
    private renderFps: number = 0;
    private throttle: number = 0; // Normalised percentage [0, 1]
    private speed: number = 0; // display units (km/h or kt)
    private verticalSpeed: number = 0; // m/s or ft/min
    private velocityDirection: THREE.Vector3 = new THREE.Vector3();
    private weaponsTarget: GroundTargetEntity | undefined;
    private stallStatus: number = -1; // [-1,1]. Values >= 0 indicate stall
    private angleOfAttack: number = 0; // radians
    private loadFactorG: number = 1;
    private machNumber: number = 0;
    private isLanded: boolean = true;
    private isAutopilotEnabled: boolean = false;
    private hasGun: boolean = false;
    private gunAmmo: number = 0;
    private healthFraction: number = 1;
    private pitch: number = 0; // radians
    private roll: number = 0; // radians
    private pitchInput: number = 0; // [-1, 1]
    private rollInput: number = 0; // [-1, 1]
    private yawInput: number = 0; // [-1, 1]
    private elevatorLimitHigh: number = 1; // [-1, 1] nose-up elevator-command clamp
    private elevatorLimitLow: number = -1; // [-1, 1] nose-down elevator-command clamp
    private elapsed: number = 0; // Seconds
    private lastRenderTime: number = 0;

    private _v = new THREE.Vector3();
    private _w = new THREE.Vector3();
    private _plane = new THREE.Plane();

    readonly tags: string[] = [];

    enabled: boolean = true;

    init(scene: Scene): void {
        //
    }

    update(delta: number): void {
        this.weaponsTarget = this.actor.weaponsTarget;

        this.stallStatus = this.actor.stallStatus;
        this.angleOfAttack = this.actor.angleOfAttack;
        this.loadFactorG = this.actor.loadFactorG;
        this.isLanded = this.actor.isLanded;
        this.isAutopilotEnabled = this.actor.isAutopilotEnabled;
        this.hasGun = this.actor.hasGun;
        this.gunAmmo = this.actor.gunAmmo;
        this.healthFraction = this.actor.healthFraction;

        this.pitchInput = this.actor.pitchInput;
        this.rollInput = this.actor.rollInput;
        this.yawInput = this.actor.yawInput;
        this.elevatorLimitHigh = this.actor.elevatorLimitHigh;
        this.elevatorLimitLow = this.actor.elevatorLimitLow;

        this.elapsed += delta;
    }

    private refreshVisualState(): void {
        const now = performance.now();
        if (this.lastRenderTime > 0) {
            const instantFps = 1000 / (now - this.lastRenderTime);
            this.renderFps = this.renderFps > 0
                ? this.renderFps * 0.9 + instantFps * 0.1
                : instantFps;
        }
        this.lastRenderTime = now;

        const displayPos = this.actor.getDisplayPosition();
        const displayQuat = this.actor.getDisplayQuaternion();
        const displayVel = this.actor.getDisplayVelocity();

        this.altitude = Math.round(this.displayUnits.altitudeFromMeters(displayPos.y) * 10) / 10;
        this.altitudeMeters = displayPos.y;
        this.engineThrustKn = this.actor.engineThrustKn;

        this._v.copy(FORWARD)
            .applyQuaternion(displayQuat)
            .setY(0)
            .normalize();
        this.heading = vectorHeading(this._v);

        [this.pitch, this.roll] = calculatePitchRoll({
            quaternion: displayQuat,
            getWorldDirection: (v) => this.actor.getDisplayWorldDirection(v),
        });

        this.speed = this.displayUnits.speedFromMps(displayVel.length());
        this.verticalSpeed = this.displayUnits.verticalSpeedFromMps(displayVel.y);

        if (displayVel.lengthSq() > 1e-6) {
            this.velocityDirection.copy(displayVel).normalize();
        }

        this.machNumber = computeMachNumber(displayVel.length(), displayPos.y);
    }

    render3D(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Map<string, THREE.Scene>, palette: Palette): void {
        // Nothing
    }

    render2D(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Set<string>, painter: CanvasPainter, palette: Palette): void {
        if (!lists.has(SceneLayers.Overlay)) return;

        this.refreshVisualState();
        this.throttle = this.actor.throttleUnit;

        const layout = getOverlayLayout(targetWidth, targetHeight);
        const { detailScale, layoutScale } = layout;
        const tickStep = getOverlayTickStep(layout);

        const font = layoutScale > 1 ? Font.HUD_LARGE : Font.HUD_SMALL;
        const fontSmall = layoutScale > 1 ? Font.HUD_MEDIUM : Font.HUD_SMALL;
        const hudColor = PaletteColor(palette, PaletteCategory.HUD_TEXT);
        const hudSecondaryColor = PaletteColor(palette, PaletteCategory.HUD_TEXT_SECONDARY);
        const hudWarnColor = PaletteColor(palette, PaletteCategory.HUD_TEXT_WARN);
        const hudLimitColor = PaletteColor(palette, PaletteCategory.LIGHT_RED);
        painter.setColor(hudColor);

        const halfWidth = targetWidth / 2;
        const halfHeight = targetHeight / 2;
        const ladderSpread = layoutScale > 1 ? Math.max(1.5, layoutScale / detailScale) : 1;

        const geomScale = layoutScale / detailScale;

        this.renderPitchLadder(layout, halfWidth, halfHeight, painter, hudColor, hudSecondaryColor, fontSmall);

        const altitudeX = halfWidth + Math.ceil((LADDER_HALF_WIDTH + 6) * ladderSpread);
        const altitudeY = halfHeight;
        if (this.actor.hudFocusMode === HUDFocusMode.DISABLED) {
            this.renderAltitude(layout, tickStep, altitudeX, altitudeY, targetWidth, painter, hudColor, font, fontSmall);
        } else {
            this.renderAltitudeFocusMode(altitudeX, altitudeY, painter, hudColor, font);
        }

        const headingX = halfWidth;
        const headingY = halfHeight - layoutScale * (LADDER_HALF_HEIGHT + 2);
        if (this.actor.hudFocusMode !== HUDFocusMode.FULL) {
            this.renderHeading(layout, headingX, headingY, painter, hudColor, font);
        } else {
            this.renderHeadingFocusMode(headingX, headingY, painter, hudColor, font);
        }

        const airSpeedX = halfWidth - Math.floor((LADDER_HALF_WIDTH + 6) * ladderSpread);
        const airSpeedY = halfHeight;
        if (this.actor.hudFocusMode === HUDFocusMode.DISABLED) {
            this.renderAirSpeed(layout, tickStep, airSpeedX, airSpeedY, painter, hudColor, font, fontSmall);
        } else {
            this.renderAirSpeedFocusMode(airSpeedX, airSpeedY, painter, hudColor, font);
        }

        const throttleX = airSpeedX - (font.charWidth + font.charSpacing) * 4 - 1;
        const throttleY = headingY - font.charHeight - 3;
        this.renderThrottle(throttleX, throttleY, painter, hudColor, font);

        if (this.isAutopilotEnabled) {
            painter.text(font, throttleX, throttleY - font.charHeight - 2, 'AP', hudColor);
        }

        this.renderFlightDataIndicators(layout, airSpeedX, airSpeedY, painter, hudColor, hudWarnColor, fontSmall);

        const stickArm = Math.max(8, Math.round(11 * geomScale));
        const stickGap = Math.round(10 * geomScale);
        const stickLabelMargin = (fontSmall.charWidth + fontSmall.charSpacing) * 4 + 6;
        const stickCenterX = Math.min(
            altitudeX + stickLabelMargin + stickGap + stickArm,
            targetWidth - stickArm - 2,
        );
        const stickCenterY = halfHeight;
        this.renderStickIndicator(stickCenterX, stickCenterY, stickArm, geomScale, painter, hudColor, hudSecondaryColor, hudLimitColor, fontSmall);

        this.renderTarget(targetWidth, targetHeight, halfWidth, halfHeight, painter, camera, geomScale);
        this.renderBoresight(halfWidth, halfHeight, painter, geomScale);
        this.renderGunReticle(halfWidth, halfHeight, painter, geomScale, hudColor, hudWarnColor, font);
        this.renderFlightPathMarker(targetWidth, targetHeight, halfWidth, halfHeight, painter, camera, geomScale);
        this.renderStallWarning(layout, airSpeedX, airSpeedY, painter, hudColor, hudWarnColor, font);

        if (this.actor.hudFocusMode === HUDFocusMode.DISABLED) {
            this.renderStallStatus(layout, airSpeedX, airSpeedY, painter, hudColor, hudWarnColor);
            this.renderVerticalVelocityIndicator(layout, tickStep, altitudeX, altitudeY, painter, hudColor, hudWarnColor);
        }

        this.renderAltitudeDebug(targetWidth, layoutScale, painter, hudSecondaryColor, fontSmall);
    }

    private renderAltitudeDebug(
        targetWidth: number,
        layoutScale: number,
        painter: CanvasPainter,
        hudColor: string,
        font: Font,
    ) {
        const margin = Math.max(4, Math.round(4 * layoutScale));
        const lineHeight = font.charHeight + font.charSpacing;
        const x = targetWidth - margin;
        const altitudeFeet = toFeet(this.altitudeMeters);

        painter.text(font, x, margin, `${this.altitudeMeters.toFixed(1)}M`, hudColor, TextAlignment.RIGHT);
        painter.text(font, x, margin + lineHeight, `${altitudeFeet.toFixed(0)}FT`, hudColor, TextAlignment.RIGHT);
        painter.text(font, x, margin + lineHeight * 2, `${this.engineThrustKn.toFixed(1)}KN`, hudColor, TextAlignment.RIGHT);
        painter.text(font, x, margin + lineHeight * 3, `${this.renderFps.toFixed(0)}FPS`, hudColor, TextAlignment.RIGHT);
    }

    private renderFlightDataIndicators(
        layout: OverlayLayout,
        airSpeedX: number,
        airSpeedY: number,
        painter: CanvasPainter,
        hudColor: string,
        hudWarnColor: string,
        font: Font,
    ) {
        const lineHeight = font.charHeight + font.charSpacing;
        const ladderBottom = airSpeedY + layout.layoutScale * AIRSPEED_HALF_HEIGHT * 2;
        const x = airSpeedX + 9;
        const y = ladderBottom + font.charSpacing + 2;
        const aoaDeg = toDegrees(this.angleOfAttack);

        this.renderFlightDataIndicator(x, y, 'Mach:', this.machNumber.toFixed(1), painter, hudColor, font);
        this.renderFlightDataIndicator(x, y + lineHeight, 'AoA:', aoaDeg.toFixed(0),
            painter, aoaDeg >= AOA_STALL_DEG - 2 ? hudWarnColor : hudColor, font);
        this.renderFlightDataIndicator(x, y + lineHeight * 2, 'G:', this.loadFactorG.toFixed(1),
            painter, this.loadFactorG >= 4 || this.loadFactorG < 0 ? hudWarnColor : hudColor, font);
    }

    private renderFlightDataIndicator(x: number, y: number, label: string, value: string, painter: CanvasPainter, color: string, font: Font) {
        const charStep = font.charWidth + font.charSpacing;
        const valueX = x + charStep * 6;
        painter.text(font, x, y, label, color);
        painter.text(font, valueX, y, value, color);
    }

    private renderAltitude(layout: OverlayLayout, tickStep: number, x: number, y: number, width: number, painter: CanvasPainter, hudColor: string, font: Font, fontSmall: Font) {
        const { detailScale, layoutScale } = layout;
        const altitudeStep = this.displayUnits.altitudeStep;
        const altitudeLowThreshold = this.displayUnits.altitudeLowThreshold;
        const lowp = this.displayUnits.useBarometricAltitude && this.altitude >= altitudeLowThreshold;
        const markerScale = lowp ? 10 : 1;
        const tapeUnit = altitudeStep * markerScale;
        const tapeOrigin = tapeUnit * Math.floor(this.altitude / tapeUnit);
        const scrollOffset = tapeUnit > 0
            ? ((this.altitude - tapeOrigin) / tapeUnit) * tickStep
            : 0;
        const labelInterval = this.displayUnits.altitudeTapeLabelInterval * markerScale;
        const charHeightHalf = Math.trunc(font.charHeight / 2);

        const batch = painter.batch();
        for (let i = ALTITUDE_HALF_HEIGHT * detailScale; i >= -ALTITUDE_HALF_HEIGHT * detailScale; i--) {
            const current = tapeOrigin + i * altitudeStep;
            if (current >= 0 || lowp) {
                const barWidth = this.displayUnits.getAltitudeTickWidth(current, markerScale);
                if (barWidth > 0) {
                    batch.hLine(x, x + barWidth, y - i * tickStep + scrollOffset);
                }
            }
        }
        batch.hLine(x - 5, x - 2, y);
        batch.commit();

        const clip = painter.clip();
        clip.rectangle(x, y - ALTITUDE_HEIGHT * layoutScale, width - x, (ALTITUDE_HEIGHT * 2 + 3) * layoutScale).clip();
        for (let i = detailScale * (ALTITUDE_HALF_HEIGHT + 1) + 1; i >= -detailScale * (ALTITUDE_HALF_HEIGHT + 1) - 1; i--) {
            const current = tapeOrigin + i * altitudeStep;
            if ((current >= 0 || lowp) && current % labelInterval === 0) {
                painter.text(fontSmall,
                    x + 6 + (fontSmall.charWidth + fontSmall.charSpacing) * 3,
                    y - i * tickStep + scrollOffset - charHeightHalf,
                    this.displayUnits.formatAltitudeTape(current, lowp), hudColor, TextAlignment.RIGHT);
            }
        }
        clip.clear();

        painter.text(font, x - 8, y - Math.floor(font.charHeight / 2),
            this.displayUnits.formatAltitudeReadout(this.altitude), hudColor, TextAlignment.RIGHT);
    }

    private renderAltitudeFocusMode(x: number, y: number, painter: CanvasPainter, hudColor: string, font: Font) {
        const textX = x + font.charWidth * 4;
        const textY = y - Math.floor(font.charHeight / 2);
        painter.text(font, textX, textY, this.displayUnits.formatAltitudeReadout(this.altitude), hudColor, TextAlignment.RIGHT);
        painter.rectangle(
            textX - ((font.charWidth + font.charSpacing) * 5 + font.charSpacing + 1),
            textY - font.charSpacing * 2 - 1,
            (font.charWidth + font.charSpacing) * 5 + font.charSpacing * 3 + 2,
            2 + font.charSpacing * 4 + font.charHeight);
    }

    private renderVerticalVelocityIndicator(layout: OverlayLayout, tickStep: number, x: number, y: number, painter: CanvasPainter, hudColor: string, hudWarnColor: string) {
        const { layoutScale } = layout;
        const maxPixels = ALTITUDE_HEIGHT * layoutScale;
        const pixelLength = clamp(layoutScale * this.verticalSpeed / this.displayUnits.verticalSpeedBarDivisor, -maxPixels, maxPixels);
        painter.setColor(hudWarnColor);
        painter.vLine(x - 1, y, y - pixelLength);
        painter.setColor(hudColor);
    }

    private renderHeading(layout: OverlayLayout, x: number, y: number, painter: CanvasPainter, hudColor: string, font: Font) {
        const { detailScale, layoutScale } = layout;
        const headingSpacing = HEADING_SPACING * layoutScale / detailScale;
        const offset = this.heading % HEADING_SPACING;
        const batch = painter.batch();
        for (let i = -HEADING_HALF_WIDTH; i <= HEADING_HALF_WIDTH; i++) {
            const height = (this.heading + i * HEADING_STEP - offset) % 10 === 0 ? 2 * layoutScale / detailScale : 0;
            batch.vLine(x + i * headingSpacing - offset, y - height, y);
        }
        batch.vLine(x, y + 2 * layoutScale / detailScale, y + 4 * layoutScale / detailScale);
        batch.commit();

        const clip = painter.clip()
            .rectangle(x - HEADING_HALF_WIDTH * headingSpacing - font.charWidth - 1,
                y - font.charHeight - 4 * layoutScale / detailScale,
                HEADING_WIDTH * headingSpacing + 2 * font.charWidth,
                font.charHeight + 3 * layoutScale / detailScale)
            .clip();
        for (let i = -HEADING_HALF_WIDTH - 1 - detailScale; i <= HEADING_HALF_WIDTH + 1 + detailScale; i++) {
            const value = this.heading + i * HEADING_STEP - offset;
            if (value % 45 === 0) {
                painter.text(font,
                    x + i * headingSpacing - offset,
                    y - font.charHeight - 3 * layoutScale / detailScale,
                    formatHeading(value), hudColor, TextAlignment.CENTER);
            }
        }
        clip.clear();
    }

    private renderHeadingFocusMode(x: number, y: number, painter: CanvasPainter, hudColor: string, font: Font) {
        const textY = y - font.charHeight;
        painter.text(font,
            x,
            textY,
            formatHeading(this.heading), hudColor, TextAlignment.CENTER);
        painter.rectangle(
            x - (Math.trunc(font.charWidth * 1.5) + 1 + font.charSpacing * 2 + 1),
            textY - font.charSpacing * 2 - 1,
            (font.charWidth + font.charSpacing) * 3 + font.charSpacing * 3 + 2,
            2 + font.charSpacing * 4 + font.charHeight);
    }

    private renderAirSpeed(layout: OverlayLayout, tickStep: number, x: number, y: number, painter: CanvasPainter, hudColor: string, font: Font, fontSmall: Font) {
        const { detailScale, layoutScale } = layout;
        const airspeedStep = this.displayUnits.airspeedStep;
        const airspeedScale = this.displayUnits.airspeedScale;
        const airspeed = airspeedScale * airspeedStep * Math.floor(this.speed / airspeedStep);
        const tmp = 25 * Math.floor(this.speed * 10 / 25);
        const offset = tmp % 50 === 0 ? 0 : 1;
        const labelsRes = detailScale > 1 ? 1000 : 500;
        const charHeightHalf = Math.trunc(font.charHeight / 2);
        const smallCharHeightHalf = Math.trunc(fontSmall.charHeight / 2);

        const batch = painter.batch();
        for (let i = AIRSPEED_HALF_HEIGHT * detailScale; i >= -AIRSPEED_HALF_HEIGHT * detailScale; i--) {
            const current = airspeed + (i * 2 - offset) * airspeedStep * airspeedScale;
            if (current >= 0) {
                let barWidth = 0;
                if (current % 500 === 0) {
                    barWidth = 2;
                } else if (current % 250 === 0) {
                    barWidth = 1;
                }
                batch.hLine(x - barWidth, x, y - i * tickStep + offset);
            }
        }
        batch.hLine(x + 2, x + 5, y);
        batch.commit();

        const clip = painter.clip();
        clip.rectangle(0, y - AIRSPEED_HEIGHT * layoutScale, x, layoutScale * AIRSPEED_HEIGHT * 2 + 3).clip();
        for (let i = detailScale * (AIRSPEED_HALF_HEIGHT + 1) + 1; i >= -detailScale * (AIRSPEED_HALF_HEIGHT + 1) - 1; i--) {
            const current = airspeed + (i * 2 - offset) * airspeedStep * airspeedScale;
            if (current >= 0 && current % labelsRes === 0) {
                painter.text(fontSmall,
                    x - 6,
                    y - i * tickStep + offset - smallCharHeightHalf,
                    (current / airspeedScale).toFixed(0), hudColor, TextAlignment.RIGHT);
            }
        }
        clip.clear();

        painter.text(font,
            x + 9,
            y - charHeightHalf,
            Math.floor(this.speed).toString(),
            hudColor,
            TextAlignment.LEFT);
    }

    private renderAirSpeedFocusMode(x: number, y: number, painter: CanvasPainter, hudColor: string, font: Font) {
        const textX = x - font.charWidth * 4;
        const textY = y - Math.trunc(font.charHeight / 2);
        painter.text(font,
            textX,
            y - Math.trunc(font.charHeight / 2),
            Math.floor(this.speed).toString(),
            hudColor,
            TextAlignment.LEFT);

        painter.rectangle(
            textX - (font.charSpacing * 2 + 1),
            textY - font.charSpacing * 2 - 1,
            (font.charWidth + font.charSpacing) * 5 + font.charSpacing * 3 + 2,
            2 + font.charSpacing * 4 + font.charHeight);
    }

    private renderThrottle(x: number, y: number, painter: CanvasPainter, hudColor: string, font: Font) {
        painter.text(font, x, y, this.actor.throttleHudText, hudColor);
    }

    private renderStickIndicator(centerX: number, centerY: number, arm: number, geomScale: number, painter: CanvasPainter, hudColor: string, hudSecondaryColor: string, hudLimitColor: string, font: Font) {
        const rollTravel = arm - Math.max(2, Math.round(2 * geomScale));
        const pitchTotalUnits = PITCH_STICK_FWD_UNITS + PITCH_STICK_AFT_UNITS;
        const pitchTotalSpan = Math.max(arm * 2, Math.round(40 * geomScale));
        const pitchFwdTravel = Math.round(pitchTotalSpan * PITCH_STICK_FWD_UNITS / pitchTotalUnits);
        const pitchAftTravel = pitchTotalSpan - pitchFwdTravel;
        const pitch = this.pitchInput;
        const roll = this.rollInput;
        const yaw = this.yawInput;
        const throttle = this.actor.throttleUnit;
        const crossArm = Math.max(2, Math.round(2 * geomScale));
        const gap = Math.max(2, Math.round(2 * geomScale));

        painter.setColor(hudSecondaryColor);
        painter.batch()
            .hLine(centerX - arm, centerX + arm, centerY)
            .vLine(centerX, centerY - pitchFwdTravel, centerY + pitchAftTravel)
            .commit();

        // Max/min elevator-command clamp lines (where the FCS limits the pitch
        // input). Cross span and stick marker both follow PITCH_STICK_FWD/AFT_UNITS.
        const pitchCmdYOffset = (v: number) => v >= 0 ? v * pitchAftTravel : v * pitchFwdTravel;
        const limitY = (v: number) => Math.max(
            centerY - pitchFwdTravel,
            Math.min(centerY + pitchAftTravel, Math.round(centerY + pitchCmdYOffset(v))),
        );
        const limitHiY = limitY(this.elevatorLimitHigh);
        const limitLoY = limitY(this.elevatorLimitLow);
        painter.setColor(hudLimitColor);
        painter.batch()
            .hLine(centerX - arm, centerX + arm, limitHiY)
            .hLine(centerX - arm, centerX + arm, limitLoY)
            .commit();

        const stickX = centerX + roll * rollTravel;
        const stickY = centerY + pitchCmdYOffset(pitch);
        painter.setColor(hudColor);
        painter.circle(Math.round(stickX), Math.round(stickY), crossArm);

        const rudderY = centerY + pitchAftTravel + gap;
        painter.setColor(hudSecondaryColor);
        painter.hLine(centerX - arm, centerX + arm, rudderY);
        painter.setColor(hudColor);
        painter.vLine(centerX + yaw * (arm - 1), rudderY - 1, rudderY + 1);

        const throttleX = centerX - arm - gap;
        painter.setColor(hudSecondaryColor);
        painter.vLine(throttleX, centerY - arm, centerY + arm);
        painter.setColor(hudColor);
        const throttleY = centerY + arm - 1 - throttle * (arm * 2 - 1);
        painter.hLine(throttleX - 1, throttleX + 1, throttleY);

        const limitersOn = this.actor.fcsLimitersEnabled;
        const label = limitersOn
            ? (FCS_MODE_LABELS[this.actor.fcsPitchLimiterMode] ?? '')
            : 'FCS OFF';
        const labelColor = limitersOn ? hudColor : hudLimitColor;
        const labelY = rudderY + gap + 2;
        painter.text(font, centerX, labelY, label, labelColor, TextAlignment.CENTER);
    }

    private renderPitchLadder(layout: OverlayLayout, x: number, y: number, painter: CanvasPainter, hudColor: string, hudSecondaryColor: string, font: Font) {
        const { detailScale, layoutScale } = layout;
        const fov = toRadians(COCKPIT_FOV);
        const logicalHeight = getOverlayLogicalHeight(layout);
        const current = toDegrees(-this.pitch) / 10 * detailScale;
        const minMarker = Math.max(Math.ceil(current) - LADDER_EXTRA_MARKERS * detailScale, -9 * detailScale);
        const maxMarker = Math.min(Math.floor(current) + LADDER_EXTRA_MARKERS * detailScale, 9 * detailScale);

        painter.setColor(hudSecondaryColor);

        const ladderSpread = layoutScale > 1 ? Math.max(1.5, layoutScale / detailScale) : 1;
        const clip = painter.clip()
            .rectangle(x - Math.floor(LADDER_HALF_WIDTH * ladderSpread),
                y - LADDER_HALF_HEIGHT * layoutScale,
                Math.floor(LADDER_WIDTH * ladderSpread),
                (LADDER_HEIGHT + font.charHeight) * layoutScale)
            .clip();

        const geomScale = layoutScale / detailScale;

        for (let i = minMarker; i <= maxMarker; i++) {
            const offset = ((this.pitch + toRadians(i * 10 / detailScale)) / fov) * logicalHeight;
            const center = this._w.set(x, 0, y);

            const normal = this._v.copy(FORWARD)
                .negate()
                .applyAxisAngle(UP, this.roll);
            center.addScaledVector(normal, -offset);

            const ladderHalf = LADDER_SIZE_HALF * geomScale;
            normal.multiplyScalar(ladderHalf);

            const C0_X = center.x + normal.z;
            const C0_Y = center.z + -normal.x;
            const C1_X = center.x + -normal.z;
            const C1_Y = center.z + normal.x;

            normal.divideScalar(ladderHalf);

            const batch = painter.batch();

            if (i >= 0) { // Gap in the middle
                const horizonVerticalOffset = ladderHalf + LADDER_HORIZON_HALF_GAP * geomScale;
                batch.line(
                    C0_X, C0_Y,
                    C1_X + normal.z * horizonVerticalOffset,
                    C1_Y + -normal.x * horizonVerticalOffset
                );
                batch.line(
                    C0_X + -normal.z * horizonVerticalOffset,
                    C0_Y + normal.x * horizonVerticalOffset,
                    C1_X, C1_Y
                );
            } else { // Single line
                batch.line(C0_X, C0_Y, C1_X, C1_Y);
            }
            if (i !== 0) {
                const sign = Math.sign(i);
                const chevron = 5 * geomScale;
                const nX = sign * normal.x * chevron;
                const nY = sign * normal.z * chevron;
                batch.line(C0_X, C0_Y, C0_X + nX, C0_Y + nY);
                batch.line(C1_X, C1_Y, C1_X + nX, C1_Y + nY);
            }
            batch.commit();

            if (i === 0 && detailScale > 1) continue;

            const str = (i === 0) ? '00' : `${Math.round(i * -10 / detailScale)}`;
            const charHeightHalf = Math.trunc(font.charHeight / 2);
            const tX = Math.round(normal.x * charHeightHalf);
            const tY = Math.round(normal.z * charHeightHalf);
            const labelOffset = 2 * (font.charWidth + font.charSpacing) * geomScale;
            const T0_X = Math.floor(normal.z * labelOffset);
            const T0_Y = Math.round(-normal.x * labelOffset);
            const T1_X = Math.floor(-normal.z * labelOffset);
            const T1_Y = Math.round(normal.x * labelOffset);
            painter.text(font, C0_X + tX + T0_X, C0_Y + tY + T0_Y, str, hudSecondaryColor, TextAlignment.CENTER);
            painter.text(font, C1_X + tX + T1_X, C1_Y + tY + T1_Y, str, hudSecondaryColor, TextAlignment.CENTER);
        }
        clip.clear();

        painter.setColor(hudColor);
    }

    private renderTarget(width: number, height: number, halfWidth: number, halfHeight: number, painter: CanvasPainter, camera: THREE.Camera, geomScale: number) {
        if (this.weaponsTarget === undefined) return;

        const targetHalfWidth = Math.round(TARGET_HALF_WIDTH * geomScale);
        const targetWidth = targetHalfWidth * 2 + 1;

        camera.getWorldDirection(this._v);
        this._plane.setFromNormalAndCoplanarPoint(this._v, camera.position);
        if (this._plane.distanceToPoint(this.weaponsTarget.position) > 0) {
            this._v.copy(this.weaponsTarget.position);
            this._v.project(camera);
            const x = Math.round((this._v.x * halfWidth) + halfWidth);
            const y = Math.round(-(this._v.y * halfHeight) + halfHeight);
            if (0 <= x && x < width &&
                0 <= y && y < height) {
                painter.rectangle(x - targetHalfWidth, y - targetHalfWidth, targetWidth, targetWidth);
            }
        }
    }

    /** Gun pipper (a ring around the boresight) plus an ammo/health readout. */
    private renderGunReticle(halfWidth: number, halfHeight: number, painter: CanvasPainter, geomScale: number, hudColor: string, hudWarnColor: string, font: Font) {
        if (!this.hasGun) {
            return;
        }
        const u = geomScale;
        const r = Math.round(7 * u);
        // A square "pipper" bracket around the boresight to frame the gun aim.
        painter.batch()
            .hLine(halfWidth - r, halfWidth - r + 3 * u, halfHeight - r)
            .hLine(halfWidth + r - 3 * u, halfWidth + r, halfHeight - r)
            .hLine(halfWidth - r, halfWidth - r + 3 * u, halfHeight + r)
            .hLine(halfWidth + r - 3 * u, halfWidth + r, halfHeight + r)
            .vLine(halfWidth - r, halfHeight - r, halfHeight - r + 3 * u)
            .vLine(halfWidth - r, halfHeight + r - 3 * u, halfHeight + r)
            .vLine(halfWidth + r, halfHeight - r, halfHeight - r + 3 * u)
            .vLine(halfWidth + r, halfHeight + r - 3 * u, halfHeight + r)
            .commit();

        const lineHeight = font.charHeight + font.charSpacing;
        const x = Math.max(4, Math.round(4 * geomScale));
        const y = halfHeight * 2 - lineHeight * 2 - 2;
        const hpPct = Math.round(this.healthFraction * 100);
        painter.text(font, x, y, `GUN ${this.gunAmmo}`, this.gunAmmo > 0 ? hudColor : hudWarnColor, TextAlignment.LEFT);
        painter.text(font, x, y + lineHeight, `HULL ${hpPct}%`, hpPct <= 30 ? hudWarnColor : hudColor, TextAlignment.LEFT);
    }

    private renderBoresight(halfWidth: number, halfHeight: number, painter: CanvasPainter, geomScale: number) {
        const u = geomScale;
        painter.batch()
            .hLine(halfWidth - 5 * u - 5 * u, halfWidth - 5 * u, halfHeight)
            .hLine(halfWidth + 5 * u, halfWidth + 5 * u + 5 * u, halfHeight)
            .vLine(halfWidth, halfHeight - 3 * u - 3 * u, halfHeight - 3 * u)
            .vLine(halfWidth, halfHeight + 3 * u, halfHeight + 3 * u + 3 * u)
            .commit();
    }

    private renderFlightPathMarker(width: number, height: number, halfWidth: number, halfHeight: number, painter: CanvasPainter, camera: THREE.Camera, geomScale: number) {
        const u = geomScale;
        this._v.copy(camera.position)
            .add(this.velocityDirection)
            .project(camera);
        const x = (this._v.x * halfWidth) + halfWidth;
        const y = -(this._v.y * halfHeight) + halfHeight;
        if (0 <= x && x < width &&
            0 <= y && y < height) {
            painter.batch()
                .hLine(x - u, x + u, y - 2 * u)
                .hLine(x - u, x + u, y + 2 * u)
                .vLine(x - 2 * u, y - u, y + u)
                .vLine(x + 2 * u, y - u, y + u)
                .hLine(x - 5 * u, x - 3 * u, y)
                .hLine(x + 3 * u, x + 5 * u, y)
                .vLine(x, y - 4 * u, y - 3 * u)
                .commit();
        }
    }

    private renderStallStatus(layout: OverlayLayout, x: number, y: number, painter: CanvasPainter, hudColor: string, hudWarnColor: string) {
        const HALF_HEIGHT_PIXELS = layout.layoutScale * AIRSPEED_HALF_HEIGHT * 2;
        painter.setColor(hudWarnColor);
        painter.vLine(x + 1, y + HALF_HEIGHT_PIXELS + 1, y + HALF_HEIGHT_PIXELS + 1 - Math.floor((this.stallStatus + 1.0) * (HALF_HEIGHT_PIXELS + 1)));
        painter.setColor(hudColor);
    }

    private renderStallWarning(layout: OverlayLayout, x: number, y: number, painter: CanvasPainter, hudColor: string, hudWarnColor: string, font: Font) {
        const HALF_HEIGHT_PIXELS = layout.layoutScale * AIRSPEED_HALF_HEIGHT * 2;
        painter.setColor(hudWarnColor);
        const blink = Math.round(this.elapsed * 15) % 2 === 0;
        if (this.stallStatus >= 0 && !this.isLanded && blink) {
            painter.text(font, x + 9,
                y + HALF_HEIGHT_PIXELS + 1 - font.charHeight + font.charSpacing,
                'STALL',
                hudWarnColor,
                TextAlignment.LEFT);
        }
        painter.setColor(hudColor);
    }
}
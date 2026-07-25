import { KernelTask } from "../../core/kernel";
import { CombatSimClient } from "../../physics/sim/combatSimClient";
import { SimProxyFlightModel } from "../../physics/model/simProxyFlightModel";
import { PLAYER_SIM_ID } from "../../physics/sim/simIds";
import { PlayerEntity } from "../../scene/entities/player";
import { clamp, equals } from "../../utils/math";


const AXIS_ROLL = 0;
const AXIS_PITCH = 1;
const AXIS_THROTTLE = 2;
const AXIS_YAW = 3;

export type JoystickStatusListener = (connected: boolean) => void;

export class JoystickControlDevice implements KernelTask {

    private connected: boolean = false;
    private id: string = '';
    private index = 0;
    private axisCount: number = 0;
    private listener: JoystickStatusListener = () => { };

    private lastPitch: number = 0;
    private lastRoll: number = 0;
    private lastYaw: number = 0;
    private lastThrottle: number = 0;

    constructor(
        private readonly combatSim: CombatSimClient,
        private readonly player: PlayerEntity,
        private readonly simId: string = PLAYER_SIM_ID,
        private readonly isWorkerControlled: () => boolean = () =>
            player.getFlightModel() instanceof SimProxyFlightModel,
    ) {
        this.setupEvents();
    }

    update(_delta: number) {
        if (!this.player.controlsEnabled || this.player.isAutopilotEnabled) {
            if (this.isWorkerControlled()) {
                this.combatSim.postGamepadAxes(this.simId, 0, 0, 0, 0, false);
            }
            return;
        }

        if (this.isWorkerControlled()) {
            if (!this.connected) {
                this.combatSim.postGamepadAxes(this.simId, 0, 0, 0, 0, false);
                return;
            }
            const gamepad = navigator.getGamepads()[this.index];
            if (!gamepad) {
                this.combatSim.postGamepadAxes(this.simId, 0, 0, 0, 0, false);
                return;
            }
            let pitch = 0;
            let roll = 0;
            let yaw = 0;
            let throttle = 0;
            if (this.axisCount > AXIS_YAW) {
                yaw = clamp(gamepad.axes[AXIS_YAW], -1, 1);
            }
            if (this.axisCount > AXIS_THROTTLE) {
                throttle = clamp((gamepad.axes[AXIS_THROTTLE] * -1 + 1) * 0.5, 0, 1);
            }
            if (this.axisCount > AXIS_PITCH) {
                pitch = clamp(gamepad.axes[AXIS_PITCH], -1, 1);
            }
            if (this.axisCount > AXIS_ROLL) {
                roll = clamp(gamepad.axes[AXIS_ROLL], -1, 1);
            }
            this.combatSim.postGamepadAxes(this.simId, pitch, roll, yaw, throttle, true);
            return;
        }

        if (!this.connected) return;

        const gamepad = navigator.getGamepads()[this.index];
        if (!gamepad) return;

        if (this.axisCount > AXIS_YAW) {
            const yaw = clamp(gamepad.axes[AXIS_YAW], -1, 1);
            if (!equals(yaw, this.lastYaw)) {
                this.lastYaw = yaw;
                this.player.setYaw(yaw);
            }
        }
        if (this.axisCount > AXIS_THROTTLE) {
            const throttle = clamp((gamepad.axes[AXIS_THROTTLE] * -1 + 1) * 0.5, 0, 1);
            if (!equals(throttle, this.lastThrottle)) {
                this.lastThrottle = throttle;
                this.player.setThrottle(throttle);
            }
        }
        if (this.axisCount > AXIS_PITCH) {
            const pitch = clamp(gamepad.axes[AXIS_PITCH], -1, 1);
            if (!equals(pitch, this.lastPitch)) {
                this.lastPitch = pitch;
                this.player.setPitch(pitch);
            }
        }
        if (this.axisCount > AXIS_ROLL) {
            const roll = clamp(gamepad.axes[AXIS_ROLL], -1, 1);
            if (!equals(roll, this.lastRoll)) {
                this.lastRoll = roll;
                this.player.setRoll(roll);
            }
        }
    }

    isConnected(): boolean {
        return this.connected;
    }

    getDeviceId(): string {
        return this.id;
    }

    getAxisCount(): number {
        return this.axisCount;
    }

    setListener(listener: JoystickStatusListener) {
        this.listener = listener;
    }

    private setupEvents() {
        window.addEventListener("gamepadconnected", event => {
            this.connected = true;
            this.id = event.gamepad.id;
            this.index = event.gamepad.index;
            this.axisCount = event.gamepad.axes.length;
            this.listener(true);
        });
        window.addEventListener("gamepaddisconnected", () => {
            this.connected = false;
            this.id = '';
            this.index = 0;
            this.axisCount = 0;
            this.lastPitch = 0;
            this.lastRoll = 0;
            this.lastYaw = 0;
            this.lastThrottle = 0;
            this.listener(false);
            if (this.isWorkerControlled()) {
                this.combatSim.postGamepadAxes(this.simId, 0, 0, 0, 0, false);
            }
        });
    }
}

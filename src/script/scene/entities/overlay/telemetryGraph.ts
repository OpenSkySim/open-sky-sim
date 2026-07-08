import { clamp } from '../../../utils/math';

export const TELEMETRY_HISTORY_SECONDS = 5;
const SAMPLE_HZ = 20;
const BUFFER_SIZE = TELEMETRY_HISTORY_SECONDS * SAMPLE_HZ;
const LABEL_FONT = '10px monospace';
const LABEL_LINE_HEIGHT = 12;

const GRAPH_COLORS = {
    g: '#ff4040',
    aoa: '#4080ff',
    accel: '#b060ff',
    pitch: '#ffff60',
} as const;

type ChannelKey = keyof typeof GRAPH_COLORS;

interface TelemetryChannel {
    key: ChannelKey;
    color: string;
    normalize: (value: number) => number;
    format: (value: number) => string;
}

const CHANNELS: TelemetryChannel[] = [
    {
        key: 'g',
        color: GRAPH_COLORS.g,
        normalize: (value) => (value + 1) / 10,
        format: (value) => `g:${value.toFixed(1)}g`,
    },
    {
        key: 'aoa',
        color: GRAPH_COLORS.aoa,
        normalize: (value) => (value + 180) / 360,
        format: (value) => `\u03B1:${value.toFixed(0)}`,
    },
    {
        key: 'accel',
        color: GRAPH_COLORS.accel,
        normalize: (value) => value / 10,
        format: (value) => `acc:${value.toFixed(1)}g`,
    },
    {
        key: 'pitch',
        color: GRAPH_COLORS.pitch,
        normalize: (value) => (value + 1) / 2,
        format: (value) => `elev:${value.toFixed(1)}`,
    },
];

export interface TelemetrySample {
    g: number;
    aoaDeg: number;
    accelG: number;
    pitch: number;
}

export class TelemetryGraph {
    private readonly g = new Float32Array(BUFFER_SIZE);
    private readonly aoa = new Float32Array(BUFFER_SIZE);
    private readonly accel = new Float32Array(BUFFER_SIZE);
    private readonly pitch = new Float32Array(BUFFER_SIZE);
    private head = 0;
    private count = 0;
    private sampleAccum = 0;
    private latest: TelemetrySample = { g: 1, aoaDeg: 0, accelG: 0, pitch: 0 };

    record(delta: number, sample: TelemetrySample): void {
        this.latest = sample;
        this.sampleAccum += delta;
        const sampleDt = 1 / SAMPLE_HZ;
        while (this.sampleAccum >= sampleDt) {
            this.sampleAccum -= sampleDt;
            this.push(sample);
        }
    }

    private push(sample: TelemetrySample): void {
        const idx = this.head % BUFFER_SIZE;
        this.g[idx] = sample.g;
        this.aoa[idx] = sample.aoaDeg;
        this.accel[idx] = sample.accelG;
        this.pitch[idx] = sample.pitch;
        this.head++;
        this.count = Math.min(this.count + 1, BUFFER_SIZE);
    }

    private channelData(key: ChannelKey): Float32Array {
        switch (key) {
            case 'g': return this.g;
            case 'aoa': return this.aoa;
            case 'accel': return this.accel;
            case 'pitch': return this.pitch;
        }
    }

    private sampleIndex(age: number): number {
        const start = (this.head - this.count + BUFFER_SIZE) % BUFFER_SIZE;
        return (start + age) % BUFFER_SIZE;
    }

    private latestValue(key: ChannelKey): number {
        switch (key) {
            case 'g': return this.latest.g;
            case 'aoa': return this.latest.aoaDeg;
            case 'accel': return this.latest.accelG;
            case 'pitch': return this.latest.pitch;
        }
    }

    private valuePlotY(plotY: number, plotH: number, channel: TelemetryChannel, value: number): number {
        const norm = clamp(channel.normalize(value), 0, 1);
        return plotY + plotH - norm * plotH;
    }

    private labelReserve(ctx: CanvasRenderingContext2D): number {
        ctx.font = LABEL_FONT;
        let maxWidth = 0;
        for (const channel of CHANNELS) {
            const width = ctx.measureText(channel.format(this.latestValue(channel.key))).width;
            maxWidth = Math.max(maxWidth, width);
        }
        return Math.ceil(maxWidth);
    }

    renderToCanvas(
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        borderColor: string,
        showFrame = true,
    ): void {
        const plotPad = 2;
        const labelPad = 2;
        const labelGap = 1;
        const plotX = plotPad;
        const plotY = plotPad;
        const plotW = width - plotPad * 2;
        const plotH = height - plotPad * 2;
        if (plotW < 2 || plotH < 2) {
            return;
        }

        if (showFrame) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
            ctx.fillRect(0, 0, width, height);
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
        }

        ctx.font = LABEL_FONT;
        const labelReserve = this.labelReserve(ctx) + labelPad;
        const lineRight = plotX + Math.max(2, plotW - labelReserve);
        const labelX = width - labelPad;

        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(plotX + 0.5, plotY);
        ctx.lineTo(plotX + 0.5, plotY + plotH);
        ctx.stroke();

        if (this.count >= 2) {
            for (const channel of CHANNELS) {
                const data = this.channelData(channel.key);
                ctx.strokeStyle = channel.color;
                ctx.lineWidth = 1;
                ctx.beginPath();
                for (let i = 0; i < this.count - 1; i++) {
                    const idx0 = this.sampleIndex(i);
                    const idx1 = this.sampleIndex(i + 1);
                    const x0 = plotX + (i / (this.count - 1)) * (lineRight - plotX);
                    const x1 = plotX + ((i + 1) / (this.count - 1)) * (lineRight - plotX);
                    const y0 = this.valuePlotY(plotY, plotH, channel, data[idx0]);
                    const y1 = this.valuePlotY(plotY, plotH, channel, data[idx1]);
                    ctx.moveTo(Math.round(x0), Math.round(y0));
                    ctx.lineTo(Math.round(x1), Math.round(y1));
                }
                ctx.stroke();
            }
        }

        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        const minLabelY = plotY;
        const maxLabelY = plotY + plotH - LABEL_LINE_HEIGHT;
        for (const channel of CHANNELS) {
            const value = this.latestValue(channel.key);
            const traceY = this.valuePlotY(plotY, plotH, channel, value);
            const labelY = clamp(
                Math.round(traceY - LABEL_LINE_HEIGHT - labelGap),
                minLabelY,
                maxLabelY,
            );
            ctx.fillStyle = channel.color;
            ctx.fillText(channel.format(value), labelX, labelY);
        }
    }
}

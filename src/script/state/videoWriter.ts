import { ArrayBufferTarget, Muxer } from 'mp4-muxer';

/** Seconds between key frames: often enough to scrub, rare enough to stay small. */
const KEYFRAME_INTERVAL_S = 2;
/** Encoder queue depth past which addFrame waits, so memory stays flat. */
const MAX_QUEUE = 8;

/**
 * Bits per second for an export: about 0.13 bit per pixel per frame, which
 * keeps terrain detail through fast motion (16 Mbit/s at 1080p60).
 */
export function exportBitrate(width: number, height: number, fps: number): number {
    return Math.round(width * height * fps * 0.13);
}

interface CodecChoice {
    /** WebCodecs codec string. */
    encoder: string;
    /** mp4-muxer's name for it. */
    muxer: 'avc' | 'vp9';
}

/** H.264 first (plays everywhere); VP9 in MP4 where H.264 encoding is missing. */
function codecCandidates(width: number, height: number): CodecChoice[] {
    // High profile; level 4.2 covers 1080p60, 5.2 covers 4K60.
    const level = width * height > 1920 * 1088 ? '34' : '2a';
    return [
        { encoder: `avc1.6400${level}`, muxer: 'avc' },
        { encoder: `avc1.4d00${level}`, muxer: 'avc' },
        { encoder: 'vp09.00.51.08', muxer: 'vp9' },
    ];
}

/** Whether this browser can export video at all. */
export function videoExportSupported(): boolean {
    return typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined';
}

/**
 * Frame-by-frame MP4 writer over WebCodecs. Frames get timestamps from their
 * index, never the wall clock, so the file plays at exactly `fps` however
 * long each frame took to render.
 */
export class Mp4VideoWriter {
    private frameIndex = 0;
    private failure: Error | undefined;

    private constructor(
        private readonly encoder: VideoEncoder,
        private readonly muxer: Muxer<ArrayBufferTarget>,
        private readonly fps: number,
        readonly width: number,
        readonly height: number,
    ) {}

    static async create(width: number, height: number, fps: number): Promise<Mp4VideoWriter> {
        if (!videoExportSupported()) {
            throw new Error('This browser cannot encode video (no WebCodecs).');
        }
        if (width % 2 || height % 2) {
            throw new Error(`Video size must be even, got ${width}x${height}.`);
        }
        const bitrate = exportBitrate(width, height, fps);
        let chosen: { codec: CodecChoice; config: VideoEncoderConfig } | undefined;
        for (const codec of codecCandidates(width, height)) {
            const config: VideoEncoderConfig = {
                codec: codec.encoder, width, height, bitrate, framerate: fps,
                bitrateMode: 'variable', latencyMode: 'quality',
                ...(codec.muxer === 'avc' ? { avc: { format: 'avc' } } : {}),
            };
            const support = await VideoEncoder.isConfigSupported(config).catch(() => undefined);
            if (support?.supported) {
                chosen = { codec, config };
                break;
            }
        }
        if (!chosen) {
            throw new Error(`No video encoder for ${width}x${height} in this browser.`);
        }
        const muxer = new Muxer({
            target: new ArrayBufferTarget(),
            video: { codec: chosen.codec.muxer, width, height, frameRate: fps },
            fastStart: 'in-memory',
            firstTimestampBehavior: 'offset',
        });
        let writer: Mp4VideoWriter | undefined;
        const encoder = new VideoEncoder({
            output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
            error: e => {
                if (writer) writer.failure = e instanceof Error ? e : new Error(String(e));
            },
        });
        encoder.configure(chosen.config);
        writer = new Mp4VideoWriter(encoder, muxer, fps, width, height);
        return writer;
    }

    get framesWritten(): number {
        return this.frameIndex;
    }

    /**
     * Grab `canvas` as the next frame. The grab itself happens before the
     * first await, so call this in the same task as the render that drew it.
     */
    async addFrame(canvas: HTMLCanvasElement): Promise<void> {
        if (this.failure) throw this.failure;
        const usPerFrame = 1e6 / this.fps;
        const frame = new VideoFrame(canvas, {
            timestamp: Math.round(this.frameIndex * usPerFrame),
            duration: Math.round(usPerFrame),
        });
        try {
            const keyFrame = this.frameIndex % Math.round(KEYFRAME_INTERVAL_S * this.fps) === 0;
            this.encoder.encode(frame, { keyFrame });
        } finally {
            frame.close();
        }
        this.frameIndex++;
        while (this.encoder.encodeQueueSize > MAX_QUEUE) {
            await new Promise<void>(resolve => this.encoder.addEventListener('dequeue', () => resolve(), { once: true }));
        }
        if (this.failure) throw this.failure;
    }

    /** Flush and wrap everything written so far into an MP4. */
    async finish(): Promise<Blob> {
        await this.encoder.flush();
        if (this.failure) throw this.failure;
        this.encoder.close();
        this.muxer.finalize();
        return new Blob([this.muxer.target.buffer], { type: 'video/mp4' });
    }

    cancel(): void {
        if (this.encoder.state !== 'closed') {
            this.encoder.close();
        }
    }
}

/** Hand `blob` to the browser as a download named `name`. */
export function downloadBlob(blob: Blob, name: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Long enough for the download to take its copy.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

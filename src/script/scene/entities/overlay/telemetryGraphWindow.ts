import { TelemetryGraph } from './telemetryGraph';

const WINDOW_NAME = 'retroflightsim-telemetry';
const POPUP_WIDTH = 420;
const POPUP_HEIGHT = 240;

export class TelemetryGraphWindow {
    private popup: Window | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private rafId = 0;
    private graph: TelemetryGraph | null = null;
    private borderColor = '#808080';
    private readonly resize = () => this.syncCanvasSize();
    private readonly onUnload = () => this.close();

    open(graph: TelemetryGraph, borderColor: string): void {
        if (this.popup && !this.popup.closed) {
            this.popup.focus();
            return;
        }

        this.graph = graph;
        this.borderColor = borderColor;
        this.popup = window.open(
            '',
            WINDOW_NAME,
            `popup,width=${POPUP_WIDTH},height=${POPUP_HEIGHT},resizable=yes`,
        );
        if (!this.popup) {
            return;
        }

        const doc = this.popup.document;
        doc.title = 'Telemetry';
        doc.open();
        doc.write(
            '<!DOCTYPE html><html><head><style>'
            + 'html,body{margin:0;width:100%;height:100%;background:#000;overflow:hidden;}'
            + 'canvas{display:block;width:100%;height:100%;}'
            + '</style></head><body><canvas></canvas></body></html>',
        );
        doc.close();

        this.canvas = doc.querySelector('canvas');
        if (!this.canvas) {
            this.close();
            return;
        }

        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            this.close();
            return;
        }

        this.ctx = ctx;
        this.popup.addEventListener('resize', this.resize);
        this.popup.addEventListener('beforeunload', this.onUnload);
        this.syncCanvasSize();
        this.scheduleFrame();
    }

    close(): void {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
        if (this.popup) {
            this.popup.removeEventListener('resize', this.resize);
            this.popup.removeEventListener('beforeunload', this.onUnload);
            if (!this.popup.closed) {
                this.popup.close();
            }
        }
        this.rafId = 0;
        this.ctx = null;
        this.canvas = null;
        this.graph = null;
        this.popup = null;
    }

    isOpen(): boolean {
        return this.popup !== null && !this.popup.closed;
    }

    private syncCanvasSize(): void {
        if (!this.popup || !this.canvas || this.popup.closed) {
            return;
        }
        const width = this.popup.innerWidth || POPUP_WIDTH;
        const height = this.popup.innerHeight || POPUP_HEIGHT;
        if (width < 2 || height < 2) {
            return;
        }
        if (this.canvas.width === width && this.canvas.height === height) {
            return;
        }
        this.canvas.width = width;
        this.canvas.height = height;
    }

    private scheduleFrame(): void {
        this.rafId = requestAnimationFrame(() => this.renderFrame());
    }

    private renderFrame(): void {
        if (!this.popup || this.popup.closed) {
            this.close();
            return;
        }
        if (!this.ctx || !this.canvas || !this.graph) {
            this.scheduleFrame();
            return;
        }

        this.syncCanvasSize();
        if (this.canvas.width < 2 || this.canvas.height < 2) {
            this.scheduleFrame();
            return;
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.graph.renderToCanvas(
            this.ctx,
            this.canvas.width,
            this.canvas.height,
            this.borderColor,
        );
        this.scheduleFrame();
    }
}

declare module 'cdt2d' {
    type Point = [number, number];
    type Edge = [number, number];
    type Cell = [number, number, number];

    interface Cdt2dOptions {
        delaunay?: boolean;
        interior?: boolean;
        exterior?: boolean;
        infinity?: boolean;
    }

    function cdt2d(
        points: Point[],
        edges?: Edge[],
        options?: Cdt2dOptions,
    ): Cell[];

    export = cdt2d;
}

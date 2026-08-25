declare module 'clean-pslg' {
    type Point = [number, number];
    type Edge = [number, number];

    function cleanPslg(
        points: Point[],
        edges: Edge[],
        colors?: number[],
    ): boolean;

    export = cleanPslg;
}

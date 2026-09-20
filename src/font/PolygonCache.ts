import opentype from 'opentype.js';
import Vec2 from "../geometry/vec2";
import fontUrl from './NotoEmoji-VariableFont_wght.ttf?url';

async function initFont(): Promise<opentype.Font> {
    const response = await fetch(fontUrl);
    if (!response.ok) {
        throw new Error(`Failed to load font: ${response.status} ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    return opentype.parse(buffer);  
}

const font = await initFont();

export default class PolygonCache {
    private polyCache: Record<string, readonly Vec2[]> = {}
    private charCache: Map<string, OffscreenCanvas> = new Map();


    public getPolygon(char: string, size: number): readonly Vec2[]{
        // returns counter-clockwise vertices

        if (!(char in this.polyCache)){
            var polygon = this.polygonFromFont(char); // size is 1
            var convexPolygon = this.convexHull(polygon);
            this.polyCache[char] = convexPolygon;
        } 

        return this.polyCache[char]!.map(num => new Vec2(num.x * size, num.y * size)); // make a copy of the list
    }

    // https://github.com/opentypejs/opentype.js
    // https://opentype.js.org/
    private polygonFromFont(char: string): Vec2[] {
        const path: opentype.Path = font.getPath(char, 0, 0, 1);
        const coords: Vec2[] = [];

        // https://www.w3schools.com/graphics/svg_path.asp 
        // "M":moveto  | "L":lineto  | "C":curveto  | "Q":quadratic Bézier curve | "Z":closepath 
        for (const item of path.commands) {
            if (item.type !== "Z") {
                coords.push(new Vec2(item.x, item.y));
            }
        }

        // center the polygon
        if (coords.length === 0) 
            throw ("Font has no paths");

        let minX = coords[0]!.x;
        let maxX = coords[0]!.x;
        let minY = coords[0]!.y;
        let maxY = coords[0]!.y;

        for (let i = 1; i < coords.length; i++) {
            const pt = coords[i]!;
            minX = Math.min(pt.x, minX);
            maxX = Math.max(pt.x, maxX);
            minY = Math.min(pt.y, minY);
            maxY = Math.max(pt.y, maxY);
        }

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        for (const pt of coords) {
            pt.x -= centerX;
            pt.y -= centerY;
        }


        return coords;
    }

    // Convex Hull using Graham Scan
    // https://www.geeksforgeeks.org/dsa/convex-hull-using-graham-scan/
    private convexHull(points: Vec2[]): Vec2[] {
        if (points.length < 3) throw("Hull not possible: fewer than 3 points");
    

    
        // Find the point with the lowest y-coordinate (and leftmost if tie)
        const p0: Vec2 = points.reduce((min, p) => 
            (p.y < min!.y || (p.y === min!.y && p.x < min!.x)) ? p : min, points[0])!;
    
        // Sort the points by polar angle with respect to p0
        points.sort((a, b) => {
            const o = Vec2.orientation(p0, a, b);
    
            // If collinear, place the farther point later
            if (o === 0) {
                return p0.sqDistanceFrom(a) - p0.sqDistanceFrom(b);
            }
    
            // Otherwise, order based on counter-clockwise direction
            return o < 0 ? -1 : 1;
        });
    
        // Remove duplicate collinear points (keep farthest one)
        let m = 1;
        for (let i = 1; i < points.length; i++) {
    
            // Skip closer collinear points
            while (i < points.length - 1 && Vec2.orientation(p0, points[i]!, points[i + 1]!) === 0) {
                i++;
            }
    
            // Keep current point in place
            points[m] = points[i]!;
            m++;
        }
    
        // If fewer than 3 points remain, hull is not possible
        if (m < 3) throw("Hull not possible: fewer than 3 remaining points");
    
        // Initialize the convex hull stack with first two points
        const st: Vec2[] = [points[0]!, points[1]!];
    
        // Process the remaining points
        for (let i = 2; i < m; i++) {
    
            // While the last three points do not make a left turn, pop the middle one
            while (st.length > 1 && Vec2.orientation(st[st.length - 2]!, st[st.length - 1]!, points[i]!) >= 0) {
                st.pop();
            }
    
            // Add current point to stack
            st.push(points[i]!);
        }
    
        return st;
    }

    getCanvas(char: string): OffscreenCanvas{
        if(char in this.charCache)
            return this.charCache.get(char)!;

        var size = 32;
        const offCanvas:  OffscreenCanvas = new OffscreenCanvas(size * 2, size * 2);
        const oCtx: OffscreenCanvasRenderingContext2D = offCanvas.getContext('2d')!;

        oCtx.font = `${size}px monospace`;
        oCtx.fillStyle = 'blue';
        oCtx.textAlign = 'center';
        oCtx.textBaseline = 'middle';

        oCtx.fillText(char, size, size);
        this.charCache.set(char, offCanvas);
        return offCanvas;
    }

}
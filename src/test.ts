import opentype from 'opentype.js';
import { Vec2 } from './geometry/vec2.js';

// Using async/await syntax
async function initFont(): Promise<opentype.Font> {
    const response = await fetch('fonts/Samaano-Bold.ttf');
    const buffer = await response.arrayBuffer();
    return opentype.parse(buffer);  
}

const Font = await initFont();

export default function getpolygon(char: string): Vec2[] {
    const path: opentype.Path = Font.getPath(char, 0, 0, 100);
    const coords: Vec2[] = [];

    for (const item of path.commands) {
        coords.push(new Vec2(item.x, item.y));
    }

    if (coords.length === 0) return coords;

    let minX = coords[0].x;
    let maxX = coords[0].x;
    let minY = coords[0].y;
    let maxY = coords[0].y;

    for (let i = 1; i < coords.length; i++) {
        const pt = coords[i];
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.y > maxY) maxY = pt.y;
    }

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    for (const pt of coords) {
        pt.x -= centerX;
        pt.y -= centerY;
    }

    return coords;
}

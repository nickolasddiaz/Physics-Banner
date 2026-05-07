import type { PhysicsObject } from '../entity/PhysicsObject.js';
import { Vec2 } from '../geometry/vec2.js';

const ELASTICITY: number = 0.7;


export function checkCollision(rectA: PhysicsObject, rectB: PhysicsObject): void {
        // passed AABB detection

        // PIP (Point-in-Polygon) detection using Ray Casting (Even-Odd Rule)

        for (const pt of rectA.vertices){
            let inside: boolean = false;

            const verts = rectB.vertices;
            const n = verts.length;
            if (n === 0) continue;

            for (let i = 0, j = n - 1; i < n; j = i++){
                const vi = verts[i]!;
                const vj = verts[j]!;

                if ((vi.y > pt.y) !== (vj.y > pt.y)) {
                    const xIntersect = (vj.x - vi.x) * (pt.y - vi.y) / (vj.y - vi.y) + vi.x;
                    if (pt.x < xIntersect) {
                        inside = !inside;
                    }
                }
            }
            if (inside){
                console.log("collided");
                return;
            }
        }
    }

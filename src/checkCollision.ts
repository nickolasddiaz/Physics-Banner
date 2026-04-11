import type { Entity, Vec2_4, } from "./entity.js";
import { Vec2 } from "./vec2.js";

const elasticity: number = 0.7;

const tmp0: Vec2 = new Vec2();

// reusable variables
let impulse = new Vec2();
let mtv = new Vec2();
let collArm1 = new Vec2();
let collArm2 = new Vec2();
let normal = new Vec2();
let relVel = new Vec2();
let rotVel1 = new Vec2();
let rotVel2 = new Vec2();
let closVel1 = new Vec2();
let closVel2 = new Vec2();
let contact = new Vec2();
let mtvAxis = new Vec2();

export function checkCollision(rectA: Entity, rectB: Entity): void {
        if (!rectA.bounding_rect.intersects(rectB.bounding_rect)) return;

        // passed AABB detection
        // starting SAP detection

        rectA.computeAxes(rectB);

        const axes: Vec2_4 = [rectA.axes[0], rectA.axes[1], rectB.axes[0], rectB.axes[1]];

        let minOverlap: number = Infinity;
        mtvAxis.setXY(0,0);
        let foundAxis = false;

        for (let i: number = 0; i < 4; i++) {
            const axis: Vec2 = axes[i]!;

            if (axis.x === 0 && axis.y === 0) continue;

            rectA.projectInto(axis);
            rectB.projectInto(axis);

            if (rectA.projMax < rectB.projMin || rectB.projMax < rectA.projMin) {
                return;
            }

            // shapes collided
            // collision resolution of the shapes
            // getting the Minimum Translation Vector

            const overlap: number = Math.min(rectA.projMax, rectB.projMax)
                        - Math.max(rectA.projMin, rectB.projMin);


            if (overlap < minOverlap) {
                minOverlap = overlap;
                mtvAxis.set(axis);
                foundAxis = true;
            }
        }

        if (!foundAxis || !isFinite(minOverlap)) return;

        tmp0.subtrTo(rectA.pos, rectB.pos);
        if (Vec2.dot(tmp0, mtvAxis) < 0) {
            mtvAxis.x = -mtvAxis.x;
            mtvAxis.y = -mtvAxis.y;
        }

        mtv.setXY(mtvAxis.x * minOverlap, mtvAxis.y * minOverlap);

        // getting rotational collision
        // collision normal

        normal.set(mtvAxis);

        // closing velocity
        let bestDist: number = -Infinity;
        contact.setXY(0,0);
        for (const v of rectB.vertex) {
            const dist = Vec2.dot(v, mtvAxis);
            if (dist > bestDist) {
                bestDist = dist;
                contact.set(v);
            }
        }

        collArm1.subtrTo(contact, rectA.center);
        collArm2.subtrTo(contact, rectB.center);

        rotVel1.setXY(-rectA.angVel * collArm1.y, rectA.angVel * collArm1.x);
        rotVel2.setXY(-rectB.angVel * collArm2.y, rectB.angVel * collArm2.x);

        closVel1.addTo(rectA.vel, rotVel1);
        closVel2.addTo(rectB.vel, rotVel2);


        // impulse augmentation
        let impAug1 = Vec2.perp(collArm1, normal) ** 2 * rectA.inv_inertia;
        let impAug2 = Vec2.perp(collArm2, normal) ** 2 * rectB.inv_inertia;


        // final impulse
        relVel.subtrTo(closVel1, closVel2);
        const sepVel = Vec2.dot(relVel, normal);
        const new_sepVel = -sepVel * elasticity;
        const vsep_diff = new_sepVel - sepVel;

        const impulseN: number = vsep_diff / ((rectA.mass + rectB.mass) + impAug1 + impAug2);
        impulse.setXY(normal.x * impulseN, normal.y * impulseN);

        // apply the velocities
        rectA.vel.add(impulse);
        rectB.vel.sub(impulse);

        rectA.angVel  += Vec2.perp(collArm1, impulse) * rectA.inv_inertia;
        rectB.angVel  -= Vec2.perp(collArm2, impulse) * rectB.inv_inertia;
        
        // move the positions back so they are not touching
        mtv.scaleMult(0.5);
        rectA.pos.add(mtv);
        rectB.pos.sub(mtv);
    }
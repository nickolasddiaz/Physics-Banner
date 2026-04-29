import type { Entity } from '../entity/entity.js';
import { Vec2 } from '../geometry/vec2.js';

const ELASTICITY: number = 0.7;


// reusable variables
const tmp0: Vec2 = new Vec2();
const impulse = new Vec2();
const mtv = new Vec2();
const collArm1 = new Vec2();
const collArm2 = new Vec2();
const normal = new Vec2();
const relVel = new Vec2();
const rotVel1 = new Vec2();
const rotVel2 = new Vec2();
const closVel1 = new Vec2();
const closVel2 = new Vec2();
const contact = new Vec2();
const mtvAxis = new Vec2();

// SAT Theorem
// https://github.com/danielszabo88/mocorgo/blob/master/15%20-%20Separating%20Axis%20Theorem/script.js
// https://dyn4j.org/2010/01/sat/

// Minimum Translation Vector
// https://github.com/danielszabo88/mocorgo/blob/master/16%20-%20Minimum%20Translation%20Vector/script.js

// Rotational Collision
// https://github.com/danielszabo88/mocorgo/blob/master/14%20-%20Rotational%20Collision/script.js

export function checkCollision(rectA: Entity, rectB: Entity): void {
        if (!rectA.bounding_rect.intersects(rectB.bounding_rect)) return;

        // passed AABB detection
        // starting SAT detection

        rectA.computeAxes(rectB);

        let minOverlap: number = Infinity;
        mtvAxis.setXY(0,0);
        let foundAxis = false;

        // for all axes, the shape’s projections overlap, then we can conclude that the shapes are intersecting
        for (const axis of chain(rectA.axes, rectB.axes)) {
            if (axis.x === 0 && axis.y === 0) continue;

            // sets projection
            rectA.projectInto(axis);
            rectB.projectInto(axis);

            // test if the projections does not overlap
            if (!Vec2.overlap(rectA.projection, rectB.projection)) {
                return;
            }

            const overlap: number = Math.min(rectA.projection.max, rectB.projection.max)
                        - Math.max(rectA.projection.min, rectB.projection.min);


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

        // collision normal: unit vector pointing directly away from the surface of the collision
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

        // Collision Arm: extending from the center of mass, to the point of impact
        collArm1.subtrTo(contact, rectA.pos);
        collArm2.subtrTo(contact, rectB.pos);

        // Rotational Velocity: tangential velocity caused by its rotation
        rotVel1.setXY(-rectA.angVel * collArm1.y, rectA.angVel * collArm1.x);
        rotVel2.setXY(-rectB.angVel * collArm2.y, rectB.angVel * collArm2.x);

        // Closing Velocity: absolute velocity from the point of impact
        // The linear velocity plus tangential velocity caused by its rotation
        closVel1.addTo(rectA.vel, rotVel1);
        closVel2.addTo(rectB.vel, rotVel2);


        // Impulse Augmentation: how much the impact will be absorbed by rotation instead of translation
        let impAug1 = Vec2.cross(collArm1, normal) ** 2 * rectA.inv_inertia;
        let impAug2 = Vec2.cross(collArm2, normal) ** 2 * rectB.inv_inertia;


        // Relative Velocity: difference in the contact velocities of the two objects
        relVel.subtrTo(closVel1, closVel2);

        // Separating Velocity: relative velocity that lies exactly along the collision normal
        // How fast the objects are moving towards each other
        const sepVel = Vec2.dot(relVel, normal);
        const new_sepVel = -sepVel * ELASTICITY;
        const vsep_diff = new_sepVel - sepVel;


        const impulseN: number = vsep_diff / ((rectA.inv_mass + rectB.inv_mass) + impAug1 + impAug2);
        impulse.setXY(normal.x * impulseN, normal.y * impulseN);

        // apply the velocities
        rectA.vel.scaleMultAdd(rectA.inv_mass, impulse);
        rectB.vel.scaleMultSub(rectB.inv_mass, impulse);

        rectA.angVel += Vec2.cross(collArm1, impulse) * rectA.inv_inertia;
        rectB.angVel -= Vec2.cross(collArm2, impulse) * rectB.inv_inertia;
        
        // Penatration Resolution: move the positions back so they are not touching
        mtv.scaleMult(0.5);
        rectA.pos.scaleMultAdd(rectA.inv_mass, mtv);
        rectB.pos.scaleMultSub(rectB.inv_mass, mtv);
    }


function* chain<T>(...lists: readonly T[][]): IterableIterator<T> {
    for (const list of lists) {
        for (const item of list) {
            yield item;
        }
    }
}
import type PhysicsObject from './PhysicsObject.js';
import Vec2 from '../geometry/vec2.js';

const ELASTICITY: number = 0.7;


// pooled variables
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

export function checkCollision(objectA: PhysicsObject, objectB: PhysicsObject): void {
        // passed AABB detection
        // starting SAT detection

        objectA.computeAxes(objectB);

        let minOverlap: number = Infinity;
        mtvAxis.setXY(0,0);
        let foundAxis = false;

        // for all axes, the shape’s projections overlap, then we can conclude that the shapes are intersecting
        for (const axis of chain(objectA.axes, objectB.axes)) {
            if (axis.x === 0 && axis.y === 0) continue;

            // sets projection
            objectA.projectInto(axis);
            objectB.projectInto(axis);

            // test if the projections does not overlap
            if (!Vec2.overlap(objectA.projection, objectB.projection)) {
                return;
            }

            const overlap: number = Math.min(objectA.projection.max, objectB.projection.max)
                        - Math.max(objectA.projection.min, objectB.projection.min);


            if (overlap < minOverlap) {
                minOverlap = overlap;
                mtvAxis.set(axis);
                foundAxis = true;
            }
        }

        if (!foundAxis || !isFinite(minOverlap)) return;

        tmp0.subtrTo(objectA.center_pos, objectB.center_pos);
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
        for (const v of objectB.vertices) {
            const dist = Vec2.dot(v, mtvAxis);
            if (dist > bestDist) {
                bestDist = dist;
                contact.set(v);
            }
        }

        // Collision Arm: extending from the center of mass, to the point of impact
        collArm1.subtrTo(contact, objectA.center_pos);
        collArm2.subtrTo(contact, objectB.center_pos);

        // Rotational Velocity: tangential velocity caused by its rotation
        rotVel1.setXY(-objectA.angVel * collArm1.y, objectA.angVel * collArm1.x);
        rotVel2.setXY(-objectB.angVel * collArm2.y, objectB.angVel * collArm2.x);

        // Closing Velocity: absolute velocity from the point of impact
        // The linear velocity plus tangential velocity caused by its rotation
        closVel1.addTo(objectA.vel, rotVel1);
        closVel2.addTo(objectB.vel, rotVel2);


        // Impulse Augmentation: how much the impact will be absorbed by rotation instead of translation
        let impAug1 = Vec2.cross(collArm1, normal) ** 2 * objectA.inv_inertia;
        let impAug2 = Vec2.cross(collArm2, normal) ** 2 * objectB.inv_inertia;


        // Relative Velocity: difference in the contact velocities of the two objects
        relVel.subtrTo(closVel1, closVel2);

        // Separating Velocity: relative velocity that lies exactly along the collision normal
        // How fast the objects are moving towards each other
        const sepVel = Vec2.dot(relVel, normal);
        const new_sepVel = -sepVel * ELASTICITY;
        const vsep_diff = new_sepVel - sepVel;


        const impulseN: number = vsep_diff / ((objectA.inv_mass + objectB.inv_mass) + impAug1 + impAug2);
        impulse.setXY(normal.x * impulseN, normal.y * impulseN);

        // apply the velocities
        objectA.vel.scaleMultAdd(objectA.inv_mass, impulse);
        objectB.vel.scaleMultSub(objectB.inv_mass, impulse);

        objectA.angVel += Vec2.cross(collArm1, impulse) * objectA.inv_inertia;
        objectB.angVel -= Vec2.cross(collArm2, impulse) * objectB.inv_inertia;
        
        // Penatration Resolution: move the positions back so they are not touching
        mtv.scaleMult(0.5);
        objectA.center_pos.scaleMultAdd(objectA.inv_mass, mtv);
        objectB.center_pos.scaleMultSub(objectB.inv_mass, mtv);
    }


function* chain<T>(...lists: readonly T[][]): IterableIterator<T> {
    for (const list of lists) {
        for (const item of list) {
            yield item;
        }
    }
}
import { Vec2 } from './vec2.js';

const DAMPING = 0.95;
const STIFFNESS = 1;
let force = new Vec2();
let posChange = new Vec2();

export class SpringPoint{
    pos: Vec2;
    vel: Vec2;
    constructor(x: number, y: number){
        this.pos = new Vec2(x, y);
        this.vel = new Vec2(0, 0);
    }
}

export class SpringConnection{
    sp1: SpringPoint;
    sp2: SpringPoint;
    restLength: number;

    constructor(spring1: SpringPoint, spring2: SpringPoint){
        this.sp1 = spring1;
        this.sp2 = spring2;
        this.restLength = spring1.pos.distanceFrom(spring2.pos);

    }

    updateSpring(deltaTime: number): void {
        const damping = Math.pow(DAMPING, deltaTime);

        force.subtrTo(this.sp1.pos, this.sp2.pos);
        const distanceN = this.sp1.pos.distanceFrom(this.sp2.pos) || 1; // Prevent division by zero

        // Hooke's law: pull stretched springs together, push compressed springs apart
        const forceN = (this.restLength - distanceN) * STIFFNESS;

        // force = distanceN / (restlenght - distanceN)

        force.scaleDiv(distanceN);
        force.scaleMult(forceN * 0.5);

        // point 1
        // velocity -= force
        // velocity *= damping
        // position += velocity * deltaTime
        this.sp1.vel.add(force);
        this.sp1.vel.scaleMult(damping);
        posChange.set(this.sp1.vel);
        posChange.scaleMult(deltaTime);
        this.sp1.pos.add(posChange);
        

        // point 2
        this.sp2.vel.sub(force);
        this.sp2.vel.scaleMult(damping);
        posChange.set(this.sp2.vel);
        posChange.scaleMult(deltaTime);
        this.sp2.pos.add(posChange);
    }
}

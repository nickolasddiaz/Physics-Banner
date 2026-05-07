import { PhysicsObject, TAU } from './PhysicsObject.js';

import { border_W, border_H } from '../main.js';
import { Vec2 } from '../geometry/vec2.js';


export class RigidBody extends PhysicsObject{
    vel: Vec2;
    ang: number = 0;
    angVel: number = 0;
    constructor(posX: number, posY: number, velX: number, velY: number, char: string,
        width: number, height: number, mass: number
    ){
        const vertex: Vec2[] = [
            new Vec2(width, height), 
            new Vec2(-width, height), 
            new Vec2(-width, -height), 
            new Vec2(width, -height)
        ];
        super(posX, posY, char, mass, vertex);

        this.vel = new Vec2(velX, velY);

    }

    update(deltaTime: number): void {
        if (this.pos.x > border_W) {
            this.pos.x = 0;
        } else if (this.pos.x < 0) {
            this.pos.x = border_W;
        }

        if (this.pos.y > border_H) {
            this.pos.y = 0;
        } else if (this.pos.y < 0) {
            this.pos.y = border_H;
        }

        this.pos.x += this.vel.x * deltaTime;
        this.pos.y += this.vel.y * deltaTime;

        this.ang += this.angVel * deltaTime;
        this.ang %= TAU;

        this.update_vertex();
        this.update_size();
        this.update_bounding_rectangle();
    
    }

    update_vertex(): void {
        const cosA: number = Math.cos(this.ang);
        const sinA: number = Math.sin(this.ang);

        // 2x2 rotation matrix
        // vx  =    [ cos0  -sin0 ][vx] + [px]
        // vy       [ sin0   cos0 ][vy] + [py]

        // rotate the polygon then add position
        for(let i = 0; i < this.polygon.length; i++){
            const poly = this.polygon[i]!;
            this.vertices[i]!.x = ((poly.x * cosA) - (poly.y * sinA)) + this.pos.x;
            this.vertices[i]!.y = ((poly.x * sinA) + (poly.y * cosA)) + this.pos.y;
        }
    }

}
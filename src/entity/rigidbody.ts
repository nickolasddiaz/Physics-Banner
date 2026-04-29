import { Entity, TAU } from './entity.js';

import { border_W, border_H } from '../main.js';
import { Vec2 } from '../geometry/vec2.js';


export class RigidBody extends Entity{
    constructor(posX: number, posY: number, velX: number, velY: number, char: string,
        width: number, height: number, mass: number
    ){
        const vertex: Vec2[] = [new Vec2(), new Vec2(), new Vec2(), new Vec2()];
        const axes: Vec2[] = [new Vec2(), new Vec2()]
        super(posX, posY, velX, velY, char, width, height, mass, vertex, axes);
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
        this.update_bounding_rectangle();
    
    }

    update_vertex(): void {
        const cosA: number = Math.cos(this.ang);
        const sinA: number = Math.sin(this.ang);

        const cx: number = this.pos.x;
        const cy: number = this.pos.y;

        const rotatePoint = (x: number, y: number, index: number): void => {
            const dx: number = x - cx;
            const dy: number = y - cy;
            this.vertex[index]!.x = dx * cosA - dy * sinA + cx;
            this.vertex[index]!.y = dx * sinA + dy * cosA + cy;
        };
        // 2x2 rotation matrix
        // vx  =    [ cos0  -sin0 ][vx] + [px]
        // vy       [ sin0   cos0 ][vy] + [py]

        rotatePoint(this.pos.x + this.half_width, this.pos.y + this.half_width, 0);
        rotatePoint(this.pos.x - this.half_width, this.pos.y + this.half_width, 1);
        rotatePoint(this.pos.x - this.half_width, this.pos.y - this.half_height, 2);
        rotatePoint(this.pos.x + this.half_width, this.pos.y - this.half_height, 3);
    }

    computeAxes(rectB: Entity): void {
        const a = this.vertex;
        const b = rectB.vertex;

        const ax0 = this.axes[0]!;
        const ax1 = this.axes[1]!;
        const ax2 = rectB.axes[0]!;
        const ax3 = rectB.axes[1]!;

        ax0.subtrTo(a[1]!, a[0]!);
        ax0.normalMut();

        ax1.subtrTo(a[2]!, a[1]!);
        ax1.normalMut();

        ax2.subtrTo(b[1]!, a[0]!);
        ax2.normalMut();

        ax3.subtrTo(b[2]!, a[1]!);
        ax3.normalMut();
    }
}
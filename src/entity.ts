import { Vec2, Point } from './vec2.js';
import { Rectangle } from './quadtree.js';
import { charCache } from './const.js';
import { border_W, border_H } from './main.js';



let id: number = 0;
const TAU = Math.PI * 2;

// SAP Theorem
// https://github.com/danielszabo88/mocorgo/blob/master/15%20-%20Separating%20Axis%20Theorem/script.js

// Minimum Translation Vector
// https://github.com/danielszabo88/mocorgo/blob/master/16%20-%20Minimum%20Translation%20Vector/script.js

// Rotational Collision
// https://github.com/danielszabo88/mocorgo/blob/master/14%20-%20Rotational%20Collision/script.js

export type Vec2_4 = [Vec2, Vec2, Vec2, Vec2];

export class Entity {
    projMin = 0;
    projMax = 0;
    readonly char: string;
    pos: Vec2;
    vel: Vec2;
    ang: number;
    angVel: number;
    id: number;
    center: Point;
    bounding_rect: Rectangle;
    readonly vertex: Vec2_4;
    readonly axes: Vec2_4;
    height: number;
    width: number;
    max_side: number;
    mass: number;
    inv_inertia: any;
    constructor(posX: number, posY: number, velX: number, velY: number, char: string, 
        width: number, height: number, mass: number
    ) {
        this.height = height;
        this.width = width;
        this.max_side = Math.sqrt(width ** 2 + height ** 2);
        this.mass = mass;
        const inertia = (mass * (width ** 2 + height ** 2)) / 12;
        this.inv_inertia = 1 / inertia;

        this.char = char;
        this.pos = new Vec2(posX, posY);
        this.vel = new Vec2(velX, velY);

        this.ang = 0;
        this.angVel = 0;
        id += 1;
        this.id = id;
        this.center = new Point(0, 0, this);
        this.bounding_rect = new Rectangle(0, 0, 0, 0);

        this.vertex = [
            new Vec2(this.pos.x, this.pos.y),
            new Vec2(this.pos.x + width, this.pos.y),
            new Vec2(this.pos.x + width, this.pos.y + height),
            new Vec2(this.pos.x, this.pos.y + height),
        ];

        this.axes = [new Vec2(), new Vec2(), new Vec2(), new Vec2()];

        this.set_vertex();
    }

    render(ctx: CanvasRenderingContext2D): void {
        const sprite: OffscreenCanvas = charCache.get(this.char)!;
        const cos: number = Math.cos(this.ang);
        const sin: number = Math.sin(this.ang);

        ctx.setTransform(cos, sin, -sin, cos, this.pos.x, this.center.y);
        ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
    }

    set_vertex(): void {
        this.center.x = this.pos.x + this.width / 2;
        this.center.y = this.pos.y + this.height / 2;

        const cosA: number = Math.cos(this.ang);
        const sinA: number = Math.sin(this.ang);
        const cx: number = this.center.x;
        const cy: number = this.center.y;

        const rotatePoint = (x: number, y: number, index: number): void => {
            const dx: number = x - cx;
            const dy: number = y - cy;
            this.vertex[index]!.x = dx * cosA - dy * sinA + cx;
            this.vertex[index]!.y = dx * sinA + dy * cosA + cy;
        };

        rotatePoint(this.pos.x, this.pos.y, 0);
        rotatePoint(this.pos.x + this.width, this.pos.y, 1);
        rotatePoint(this.pos.x + this.width, this.pos.y + this.height, 2);
        rotatePoint(this.pos.x, this.pos.y + this.height, 3);
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

        this.set_vertex();
        this.set_bounding_rect();
    }

    set_bounding_rect(): void {
        this.bounding_rect.set_rect(
            this.center.x,
            this.center.y,
            this.max_side * 2,
            this.max_side * 2
        );
    }

    //Compute 4 SAT axes into pre-allocated this.axes and rectB.axes.
    computeAxes(rectB: Entity): void {
        const a = this.vertex;
        const b = rectB.vertex;

        const ax0 = this.axes[0];
        const ax1 = this.axes[1];
        const ax2 = rectB.axes[0];
        const ax3 = rectB.axes[1];

        ax0.subtrTo(a[1], a[0]);
        ax0.normalMut();

        ax1.subtrTo(a[2], a[1]);
        ax1.normalMut();

        ax2.subtrTo(b[1], a[0]);
        ax2.normalMut();

        ax3.subtrTo(b[2], a[1]);
        ax3.normalMut();
    }

    projectInto(axis: Vec2): void {
        let min: number = Vec2.dot(axis, this.vertex[0]);
        let max: number = min;
        for (let i: number = 1; i < this.vertex.length; i++) {
            const p: number = Vec2.dot(axis, this.vertex[i]!);
            if (p < min) min = p;
            if (p > max) max = p;
        }
        this.projMin = min;
        this.projMax = max;
    }
}
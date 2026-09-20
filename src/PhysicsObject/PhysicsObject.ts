import Point from '../geometry/point.js';
import Rectangle from '../collision/rectangle.js';
import Vec2 from '../geometry/vec2.js';
import { border_H, border_W, charCache } from '../main.js';
import type PolygonCache from '../font/PolygonCache.js';


let id: number = 0;
export const TAU = Math.PI * 2;

export default class PhysicsObject {
    projection: Vec2 = new Vec2();
    sizeX: Vec2 = new Vec2();
    sizeY: Vec2 = new Vec2();

    char: string;
    center_pos: Point;
    id: number;
    bounding_rect: Rectangle = new Rectangle();

    private readonly polygon: readonly Vec2[]; // counter-clockwise 
    public vertices: readonly Vec2[];
    private _mass!: number;
    private _inv_mass!: number;
    private _inertia!: number;
    private _inv_inertia!: number;
    readonly axes: Vec2[];
    vel: Vec2;
    angVel: number = 0.0;
    ang: number = 0.0;
    constructor(posX: number, posY: number, char: string , velX: number, velY: number, mass: number, size: number) {
        id += 1;
        this.id = id;
        this.char = char;
        this.center_pos = new Point(posX, posY, this);

        this.polygon = charCache.getPolygon(char, size);
        this.vertices = this.polygon.map(vec => vec.clone());
        this.vel = new Vec2(velX, velY);

        this.mass = mass;
        this.update_max_min();
        const width = this.sizeX.dist;
        const height = this.sizeY.dist;
        this.inertia = (this._mass * (width ** 2 + height ** 2)) / 12;
        this.axes = [];

        this.update_bounding_rectangle();
    }

    set mass(mass: number){
        if (mass == 0){
            mass = 1;
            console.error("Mass Cannot be 0");
        }
        this._mass = mass;
        this._inv_mass = 1 / mass;
    }

    get mass(): number{
        return this._mass;
    }

    get inv_mass(): number{
        return this._inv_mass;
    }

    set inertia(inertia: number){
        this._inertia = inertia;
        this._inv_inertia = 1 / inertia;
    }

    get inertia(): number{
        return this._inertia;
    }

    get inv_inertia(): number{
        return this._inv_inertia;
    }

    private update_max_min(){
        this.sizeX.min = this.vertices[0]!.x;
        this.sizeX.max = this.sizeX.min;
        this.sizeY.min = this.vertices[0]!.y;
        this.sizeY.max = this.sizeY.min;

        for(const vertex of this.vertices){
            this.sizeX.min = Math.min(this.sizeX.min, vertex.x);
            this.sizeX.max = Math.max(this.sizeX.max, vertex.x);
            this.sizeY.min = Math.min(this.sizeY.min, vertex.y);
            this.sizeY.max = Math.max(this.sizeY.max, vertex.y);
        }
    }

    // for quadtree
    private update_bounding_rectangle(): void {
        this.bounding_rect.set_rect(
            this.sizeX.min,
            this.sizeX.max,
            this.sizeY.min,
            this.sizeY.max,
        );
    }

    // private enforce_looping(){
    //     if (this.pos.x > border_W) {
    //         this.pos.x = 0;
    //     } else if (this.pos.x < 0) {
    //         this.pos.x = border_W;
    //     }

    //     if (this.pos.y > border_H) {
    //         this.pos.y = 0;
    //     } else if (this.pos.y < 0) {
    //         this.pos.y = border_H;
    //     }
    // }

    private enforce_container(){
        if (this.center_pos.x > border_W) {
            this.vel.x = -Math.abs(this.vel.x);
        } else if (this.center_pos.x < 0) {
            this.vel.x = Math.abs(this.vel.x);
        }

        if (this.center_pos.y > border_H) {
            this.vel.y = -Math.abs(this.vel.y);
        } else if (this.center_pos.y < 0) {
            this.vel.y = Math.abs(this.vel.y);
        }
    }

    update(deltaTime: number): void {
        this.enforce_container();
        // this.enforce_looping();

        this.center_pos.x += this.vel.x * deltaTime;
        this.center_pos.y += this.vel.y * deltaTime;

        this.ang += this.angVel * deltaTime;
        this.ang %= TAU;

        this.update_vertex();
        this.update_max_min();
        this.update_bounding_rectangle();
    
    }

    private update_vertex(): void {
        const cosA: number = Math.cos(this.ang);
        const sinA: number = Math.sin(this.ang);

        // 2x2 rotation matrix
        // vx  =    [ cos0  -sin0 ][vx] + [px]
        // vy       [ sin0   cos0 ][vy] + [py]

        // rotate the polygon then add position
        for(let i = 0; i < this.polygon.length; i++){
            const poly = this.polygon[i]!;
            this.vertices[i]!.x = ((poly.x * cosA) - (poly.y * sinA)) + this.center_pos.x;
            this.vertices[i]!.y = ((poly.x * sinA) + (poly.y * cosA)) + this.center_pos.y;
        }
    }

    projectInto(axis: Vec2): void {
        let min: number = Infinity;
        let max: number = -Infinity;
        for(const vertex of this.vertices){
            const p: number = Vec2.dot(axis, vertex);
            if (p < min) min = p;
            if (p > max) max = p;
        }
        this.projection.min = min;
        this.projection.max = max;
    }

    computeAxes(objectB: PhysicsObject): void {
        this.axes.length = 0;
        objectB.axes.length = 0;

        for (const object of [this, objectB]) {
            const vertices = object.vertices;

            for (let index = 0; index < vertices.length; index++) {
                const vertex = vertices[index]!;
                const nextVertex = vertices[(index + 1) % vertices.length]!;
                const edge = new Vec2(
                    nextVertex.x - vertex.x,
                    nextVertex.y - vertex.y,
                );

                object.axes.push(edge.normalMut());
            }
        }
    }

    debug_render(ctx: CanvasRenderingContext2D): void {
        // drawing polygon
        ctx.beginPath();
        const vertex = this.vertices;
        ctx.moveTo(vertex[0]!.x, vertex[0]!.y);

        for(let i = 1; i < vertex.length; i++){
            ctx.lineTo(vertex[i]!.x, vertex[i]!.y);
        }

        ctx.closePath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'blue';
        ctx.stroke();

        this.bounding_rect.debug_draw(ctx);
    }

    render(ctx: CanvasRenderingContext2D, charCache: PolygonCache): void {
        const sprite: OffscreenCanvas = charCache.getCanvas(this.char)!;
        const cos: number = Math.cos(this.ang);
        const sin: number = Math.sin(this.ang);

        // ctx.save and ctx.restore somehow fixes the debug_render drawing in the wrong places
        ctx.save();
        ctx.setTransform(cos, sin, -sin, cos, this.center_pos.x, this.center_pos.y);
        ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
        ctx.restore();
    }
}

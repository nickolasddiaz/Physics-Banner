import { Point } from '../geometry/point.js';
import { Rectangle } from '../collision/rectangle.js';
import { Vec2 } from '../geometry/vec2.js';



let id: number = 0;
export const TAU = Math.PI * 2;

export abstract class Entity {
    projection: Vec2 = new Vec2();

    char: string;
    pos: Point;
    vel: Vec2;
    ang: number = 0;
    angVel: number = 0;
    id: number;
    bounding_rect: Rectangle = new Rectangle(0, 0, 0, 0);
    readonly vertex: Vec2[];
    readonly axes: Vec2[];
    private _half_height!: number;
    private _half_width!: number;
    private _max_side!: number;
    private _width!: number;
    private _height!: number;
    private _mass!: number;
    private _inv_mass!: number;
    private _inertia!: number;
    private _inv_inertia!: number;
    constructor(posX: number, posY: number, velX: number, velY: number, char: string, 
        width: number, height: number, mass: number, vertex: Vec2[], axes: Vec2[]
    ) {
        id += 1;
        this.id = id;
        this.char = char;
        this.pos = new Point(posX, posY, this);
        this.vel = new Vec2(velX, velY);

        this.vertex = vertex;
        this.axes = axes;

        this.mass = mass;
        this.set_width_height(width, height);

        this.update_vertex();
        this.update_bounding_rectangle()
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

    calc_inertia(): number{
        // approximation using formula of a rectange
        return (this._mass * (this._width ** 2 + this._height ** 2)) / 12;
    }

    private set_inertia(){
        const inertia = this.calc_inertia();
        this._inertia = inertia;
        this._inv_inertia = 1 / inertia;
    }

    get inertia(): number{
        return this._inertia;
    }

    get inv_inertia(): number{
        return this._inv_inertia;
    }

    get width(): number{
        return this._width;
    }

    get height(): number{
        return this._height;
    }

    set width(width: number){
        if (width == 0){
            width = 1;
            console.error("Width Cannot be 0");
        }
        this._width = width;
        this._half_width = width / 2;
        this.set_max_side();
        this.set_inertia();
    }

    set height(height: number){
        if (height == 0){
            height = 1;
            console.error("Height Cannot be 0");
        }
        this._height = height;
        this._half_height = height / 2;
        this.set_max_side();
        this.set_inertia();
    }

    private set_max_side(){
        this._max_side = Math.sqrt(this._width ** 2 + this._height ** 2);  // used for AABB detection
    }

    get max_side(): number{
        return this._max_side;
    }

    get half_width(): number{
        return this._half_width;
    }

    get half_height(): number{
        return this._half_height;
    }

    set_width_height(width: number, height: number){
        if (width == 0){
            width = 1;
            console.error("Width Cannot be 0");
        }
        if (height == 0){
            height = 1;
            console.error("Height Cannot be 0");
        }
        this._width = width;
        this._half_width = width / 2;
        this._height = height;
        this._half_height = height / 2;
        this.set_max_side();
        this.set_inertia();
    }

    // for quadtree
    update_bounding_rectangle(): void {
        this.bounding_rect.set_rect(
            this.pos.x,
            this.pos.y,
            this._max_side * 2,
            this._max_side * 2
        );
    }

    projectInto(axis: Vec2): void {
        let min: number = Infinity;
        let max: number = -Infinity;
        for(const vertex of this.vertex){
            const p: number = Vec2.dot(axis, vertex);
            if (p < min) min = p;
            if (p > max) max = p;
        }
        this.projection.min = min;
        this.projection.max = max;
    }

    abstract update_vertex(): void
    abstract update(deltaTime: number): void 
    abstract computeAxes(rectB: Entity): void
}
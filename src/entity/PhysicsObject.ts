import { Point } from '../geometry/point.js';
import { Rectangle } from '../collision/rectangle.js';
import { Vec2 } from '../geometry/vec2.js';



let id: number = 0;
export const TAU = Math.PI * 2;

export abstract class PhysicsObject {
    sizeX: Vec2 = new Vec2();
    sizeY: Vec2 = new Vec2();

    char: string;
    pos: Point;
    id: number;
    bounding_rect: Rectangle = new Rectangle();

    vertices: Vec2[];
    readonly polygon: readonly Vec2[];
    private _mass!: number;
    private _inv_mass!: number;
    private _inertia!: number;
    private _inv_inertia!: number;
    constructor(posX: number, posY: number, char: string, 
                mass: number, vertex: Vec2[]
    ) {
        id += 1;
        this.id = id;
        this.char = char;
        this.pos = new Point(posX, posY, this);

        // structuredClone creates a deep copy
        this.vertices = structuredClone(vertex);
        this.polygon = structuredClone(vertex);

        this.mass = mass;
        const width = this.sizeX.dist;
        const height = this.sizeY.dist;
        this.inertia = (this._mass * (width ** 2 + height ** 2)) / 12;

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

    update_size(){
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
    update_bounding_rectangle(): void {
        this.bounding_rect.set_rect(
            this.sizeX.min,
            this.sizeX.max,
            this.sizeY.min,
            this.sizeY.max,
        );
    }

    abstract update(deltaTime: number): void 
}
import type {Entity} from "./entity";

export class Vec2 {
    public x: number;
    public y: number;
    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    set(vec: Vec2): void{
        this.x = vec.x;
        this.y = vec.y;
    }

    setXY(x: number, y: number): void{
        this.x = x;
        this.y = y;
    }

    add(vec: Vec2): void{
        this.x += vec.x;
        this.y += vec.y;
    }

    sub(vec: Vec2): void{
        this.x -= vec.x;
        this.y -= vec.y;
    }

    mag(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    unitMut(): this {
        const m: number = this.mag();
        if (m === 0) {
            this.x = 0;
            this.y = 0;
        } else {
            this.x /= m;
            this.y /= m;
        }
        return this;
    }

    normalMut(): this {
        const tx: number = this.x;
        this.x = -this.y;
        this.y = tx;
        return this.unitMut();
    }

    addTo(vec1: Vec2, vec2: Vec2): void {
        this.x = vec1.x + vec2.x;
        this.y = vec1.y + vec2.y;
    }

    subtrTo(vec1: Vec2, vec2: Vec2): void {
        this.x = vec1.x - vec2.x;
        this.y = vec1.y - vec2.y;
    }

    multTo(vec1: Vec2, vec2: Vec2): void {
        this.x = vec1.x * vec2.x;
        this.y = vec1.y * vec2.y;
    }

    static dot(v1: Vec2, v2: Vec2): number {
        return v1.x * v2.x + v1.y * v2.y;
    }

    static perp(v1: Vec2, v2: Vec2): number{
        return (v1.x * v2.y) - (v1.y * v2.x);
    }

    sqDistanceFrom(other: Vec2): number {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        return dx * dx + dy * dy;
    }

    scaleMult(num: number): void{
        this.x *= num;
        this.y *= num;
    }
}

export class Point extends Vec2 {
    public userData: Entity;
    constructor(x: number, y: number, userData: Entity) {
        super(x, y);
        this.userData = userData;
    }
}
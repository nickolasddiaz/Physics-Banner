export default class Vec2 {
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
        return (v1.x * v2.x) + (v1.y * v2.y);
    }

    static cross(v1: Vec2, v2: Vec2): number{
        return (v1.x * v2.y) - (v1.y * v2.x);
    }

    sqDistanceFrom(other: Vec2): number {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        return dx * dx + dy * dy;
    }

    distanceFrom(other: Vec2): number {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    scaleMult(num: number): void{
        this.x *= num;
        this.y *= num;
    }

    scaleMultAdd(num: number, other: Vec2): void{
        this.x += num * other.x;
        this.y += num * other.y;
    }

    scaleMultSub(num: number, other: Vec2): void{
        this.x -= num * other.x;
        this.y -= num * other.y;
    }

    scaleDiv(num: number): void{
        this.x /= num;
        this.y /= num;
    }

    static orientation(a: Vec2, b: Vec2, c: Vec2): number {
        const v = a.x * (b.y - c.y) + 
                b.x * (c.y - a.y) + 
                c.x * (a.y - b.y);
        if (v < 0) return -1;  // clockwise
        if (v > 0) return +1;  // counter-clockwise
        return 0;              // collinear
    }

    // for projection
    static overlap(v1: Vec2, v2: Vec2): boolean{
        return v1.max > v2.min && v2.max > v1.min; 
    }

    set min(num: number){
        this.x = num;
    }

    set max(num: number){
        this.y = num;
    }

    get min(): number{
        return this.x;
    }

    get max(): number{
        return this.y;
    }

    get dist(): number{
        return Math.abs(this.max - this.min);
    }

    clone(): Vec2 {
    return new Vec2(this.x, this.y);
  }
}
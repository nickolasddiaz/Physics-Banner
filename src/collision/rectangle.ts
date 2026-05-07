import { bottom_left, bottom_right, top_left, top_right, type Quadrant } from "./quadtree.js";
import type { Point } from "../geometry/point.js";


export class Rectangle {
    private x: number;
    private y: number;
    private w: number;
    private h: number;
    private left: number;
    private right: number;
    private top: number;
    private bottom: number;
    constructor(x: number = 0, y: number = 0, w: number = 0, h: number = 0) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;

        this.left = x - w / 2;
        this.right = x + w / 2;
        this.top = y - h / 2;
        this.bottom = y + h / 2;
    }

    set_rect(min_x: number, max_x: number, min_y: number, max_y: number): void{
        this.x = min_x;
        this.y = min_y;
        this.w = max_x - min_x;
        this.h = max_y - min_y;

        this.left = min_x;
        this.right = max_x;
        this.top = min_y;
        this.bottom = max_y;
    }

    contains(point: Point): boolean {
        return (
            this.left <= point.x && point.x <= this.right &&
            this.top <= point.y && point.y <= this.bottom
        );
    }

    intersects(range: Rectangle): boolean {
        return !(
            this.right < range.left || range.right < this.left ||
            this.bottom < range.top || range.bottom < this.top
        );
    }

    subdivide(quadrant: Quadrant): Rectangle {
        switch (quadrant) {
            case top_left:
                return new Rectangle(this.x + this.w / 4, this.y - this.h / 4, this.w / 2, this.h / 2);
            case top_right:
                return new Rectangle(this.x - this.w / 4, this.y - this.h / 4, this.w / 2, this.h / 2);
            case bottom_left:
                return new Rectangle(this.x + this.w / 4, this.y + this.h / 4, this.w / 2, this.h / 2);
            case bottom_right:
                return new Rectangle(this.x - this.w / 4, this.y + this.h / 4, this.w / 2, this.h / 2);
            default:
                throw new Error(`Invalid quadrant: ${quadrant}`);
        }
    }

    xDistanceFrom(point: Point): number {
        if (this.left <= point.x && point.x <= this.right) {
            return 0;
        }

        return Math.min(
            Math.abs(point.x - this.left),
            Math.abs(point.x - this.right)
        );
    }

    yDistanceFrom(point: Point): number {
        if (this.top <= point.y && point.y <= this.bottom) {
            return 0;
        }

        return Math.min(
            Math.abs(point.y - this.top),
            Math.abs(point.y - this.bottom)
        );
    }

    // Skips Math.sqrt for faster comparisons
    sqDistanceFrom(point: Point): number {
        const dx = this.xDistanceFrom(point);
        const dy = this.yDistanceFrom(point);

        return dx * dx + dy * dy;
    }

    draw(ctx: CanvasRenderingContext2D){
        ctx.beginPath();
        ctx.strokeStyle = 'red';
        ctx.strokeRect(this.left, this.top, this.w, this.h);
        ctx.stroke();
    }
}
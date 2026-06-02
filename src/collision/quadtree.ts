// Quadtree
import type { Point } from '../geometry/point.js';
import type { Rectangle } from './rectangle.js';


export type Quadrant = number;

const DEFAULT_CAPACITY: number = 16;
const MAX_DEPTH: number = 8;

export const top_left: Quadrant = 0;
export const top_right: Quadrant = 1;
export const bottom_left: Quadrant = 2;
export const bottom_right: Quadrant = 3;


export class QuadTree {
    private boundary: Rectangle;
    private capacity: number;
    private points: Point[];
    private divided: boolean;
    private depth: number;
    private top_left?: QuadTree;
    private top_right?: QuadTree;
    private bottom_left?: QuadTree;
    private bottom_right?: QuadTree;
    constructor(boundary: Rectangle, capacity: number = DEFAULT_CAPACITY, _depth = 0) {
        this.boundary = boundary;
        this.capacity = capacity;
        this.points = [];
        this.divided = false;

        this.depth = _depth;
    }

    get children(): (QuadTree | undefined)[] {
        if (this.divided) {
            return [
                this.top_left,
                this.top_right,
                this.bottom_left,
                this.bottom_right
            ];
        } else {
            return [];
        }
    }

    clear(): void {
        this.points = [];

        if (this.divided) {
            this.divided = false;
            delete this.top_right;
            delete this.top_left;
            delete this.bottom_right;
            delete this.bottom_left;
        }
    }

    static create(rect: Rectangle): QuadTree {
        return new QuadTree(rect);
    }

    subdivide(): void {
        this.top_left = new QuadTree(this.boundary.subdivide(top_left), this.capacity, this.depth + 1);
        this.top_right = new QuadTree(this.boundary.subdivide(top_right), this.capacity, this.depth + 1);
        this.bottom_left = new QuadTree(this.boundary.subdivide(bottom_left), this.capacity, this.depth + 1);
        this.bottom_right = new QuadTree(this.boundary.subdivide(bottom_right), this.capacity, this.depth + 1);

        this.divided = true;

        // Move points to children.
        // This improves performance by placing points
        // in the smallest available rectangle.
        for (const p of this.points) {
            const inserted =
                this.top_left.insert(p) ||
                this.top_right.insert(p) ||
                this.bottom_left.insert(p) ||
                this.bottom_right.insert(p);

            if (!inserted) {
                throw RangeError('capacity must be greater than 0');
            }
        }

    }

    insert(point: Point): boolean {
        if (!this.boundary.contains(point)) {
            return false;
        }

        if (!this.divided) {
            if (
                this.points.length < this.capacity ||
                this.depth === MAX_DEPTH
            ) {
                this.points.push(point);
                return true;
            }

            this.subdivide();
        }

        return (
            this.top_left!.insert(point) ||
            this.top_right!.insert(point) ||
            this.bottom_left!.insert(point) ||
            this.bottom_right!.insert(point)
        );
    }

    query(range: Rectangle, found: Point[] = []): Point[] {
        if (!range.intersects(this.boundary)) {
            return found;
        }

        if (this.divided) {
            this.top_right!.query(range, found);
            this.top_left!.query(range, found);
            this.bottom_right!.query(range, found);
            this.bottom_left!.query(range, found);
            return found;
        }

        for (const p of this.points) {
            if (range.intersects(p.userData.bounding_rect)) {
                found.push(p);
            }
        }

        return found;
    }

    kNearest(searchPoint: Point, maxCount: number, sqMaxDistance: number, furthestSqDistance: number, foundSoFar: number) {
        let found: Point[] = [];

        if (this.divided) {
            this.children
                .sort((a, b) => a!.boundary.sqDistanceFrom(searchPoint) - b!.boundary.sqDistanceFrom(searchPoint))
                .forEach((child) => {
                    const sqDistance = child!.boundary.sqDistanceFrom(searchPoint);
                    if (foundSoFar < maxCount || sqDistance < furthestSqDistance) {
                        const result = child!.kNearest(searchPoint, maxCount, sqMaxDistance, furthestSqDistance, foundSoFar);
                        const childPoints = result.found;
                        found = found.concat(childPoints);
                        foundSoFar += childPoints.length;
                        furthestSqDistance = result.furthestSqDistance;
                    }
                });
        } else {
            this.points
                .sort((a, b) => a.sqDistanceFrom(searchPoint) - b.sqDistanceFrom(searchPoint))
                .forEach((p) => {
                    const sqDistance = p.sqDistanceFrom(searchPoint);
                    if (foundSoFar < maxCount || sqDistance < furthestSqDistance) {
                        found.push(p);
                        furthestSqDistance = Math.max(sqDistance, furthestSqDistance);
                        foundSoFar++;
                    }
                });
        }

        return {
            found: found.sort((a, b) => a.sqDistanceFrom(searchPoint) - b.sqDistanceFrom(searchPoint)).slice(0, maxCount),
            furthestSqDistance: Math.sqrt(furthestSqDistance),
        };
    }

    get length(): number {
        if (this.divided) {
            return (
                this.top_right!.length +
                this.top_left!.length +
                this.bottom_right!.length +
                this.bottom_left!.length
            );
        }

        return this.points.length;
    }
}
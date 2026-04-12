import type { Entity } from '../entity/entity.js';
import { Vec2 } from './vec2.js';

export class Point extends Vec2 {
    public userData: Entity;
    constructor(x: number, y: number, userData: Entity) {
        super(x, y);
        this.userData = userData;
    }
}
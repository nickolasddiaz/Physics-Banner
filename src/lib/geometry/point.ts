import type PhysicsObject from '../PhysicsObject/PhysicsObject.js';
import Vec2 from './vec2.js';

export default class Point extends Vec2 {
    public userData: PhysicsObject;
    constructor(x: number, y: number, userData: PhysicsObject) {
        super(x, y);
        this.userData = userData;
    }
}
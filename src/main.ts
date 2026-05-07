import {PhysicsObject} from './entity/PhysicsObject.js';
import {canvas, ctx, ascii_art, generateRandomCharacter, min_frame_rate, height} from './const.js'
import { checkCollision } from './collision/checkCollision.js';
import { render } from './draw/draw.js';
import { QuadTree } from './collision/quadtree.js';
import type { Point } from './geometry/point.js';
import { Rectangle } from './collision/rectangle.js';
import { RigidBody } from './entity/rigidbody.js';

const entities: PhysicsObject[] = []

function isWhitespace(char: string): boolean {
    return /\s/.test(char);
}


const width = height * 0.60;
export const canvas_width = 400;
export const canvas_height = 400;
export const border_W = canvas_width + 10;
export const border_H = canvas_height + 10;
const RANDOM_SPEED = 80;

for (const [y, linesArray] of ascii_art.split(/\r?\n/).entries()){
    for (const [x, char] of linesArray.split('').entries()) {
        if (!isWhitespace(char)){
            entities.push(new RigidBody(x * (width  + 1) + 60, y * (height + 1) + 100, 0, 0, char, width, height, 1));
        }
    }
}


function spawn_entity(): void{
    const randomRadian: number = Math.random() * 2 * Math.PI;
    const x: number = Math.cos(randomRadian) * 2;
    const y: number = Math.sin(randomRadian) * 2;

    entities.push(new RigidBody(x* canvas_width, y * canvas_height, 
        x* RANDOM_SPEED, y * RANDOM_SPEED, 
        generateRandomCharacter(), width, height, 8));
}


setTimeout((): void => {
    spawn_entity();
}, 1000);

canvas.addEventListener("click", spawn_entity);

let lastTime: number = 0;
const bounding_rect = new Rectangle(canvas_width / 2, canvas_height / 2, canvas_width, canvas_height);
let quadTree: QuadTree = QuadTree.create(bounding_rect);




function update(currentTime: number) {
    const deltaTime: number = Math.min((currentTime - lastTime) / 1000, min_frame_rate);
    lastTime = currentTime;

    ctx.clearRect(0, 0, canvas_width, canvas_height);
    ctx.reset();


    for (const entity of entities) {
        entity.update(deltaTime);
        render(entity, ctx);
    }

    quadTree.clear();

    for(const entity of entities){
        quadTree.insert(entity.pos);
    }
    
    for (const entityA of entities) {
        const points: Point[] = quadTree.query(entityA.bounding_rect);
        if (points.length === 1) continue;

        for (const point of points) {
            const entityB: PhysicsObject = point.userData;
            if (entityA.id < entityB.id) {
                checkCollision(entityA, entityB);
            }
        }
    }

    requestAnimationFrame(update);
}

requestAnimationFrame((timestamp: number): void => {
    lastTime = timestamp;
    requestAnimationFrame(update);
});


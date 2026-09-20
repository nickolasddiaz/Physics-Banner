import PhysicsObject from './PhysicsObject/PhysicsObject.js';
import { checkCollision } from './PhysicsObject/checkCollision.js';
import { QuadTree } from './collision/quadtree.js';
import type Point from './geometry/point.js';
import Rectangle from './collision/rectangle.js';
import polygonFromChar from './font/PolygonCache.js';

export const canvas: HTMLCanvasElement = document.getElementById('pinballCanvas') as HTMLCanvasElement;
export const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;

const entities: PhysicsObject[] = [];

export const charCache: polygonFromChar = new polygonFromChar();


export const canvas_width = 400;
export const canvas_height = 400;
export const border_W = canvas_width;
export const border_H = canvas_height;
const RANDOM_SPEED = 80;

const characters: string = 'abcdef';
function generateRandomCharacter(): string {
   const randomIndex: number = Math.floor(Math.random() * characters.length);
   return characters.charAt(randomIndex);
}

function spawn_entity(): void{
    const randomRadian: number = Math.random() * 2 * Math.PI;
    const x: number = Math.cos(randomRadian) * 2;
    const y: number = Math.sin(randomRadian) * 2;

    entities.push(new PhysicsObject(x* canvas_width, y * canvas_height, generateRandomCharacter(),
        x * RANDOM_SPEED, y * RANDOM_SPEED, 1, 36));
}


setTimeout((): void => {
    spawn_entity();
}, 1000);

canvas.addEventListener("click", spawn_entity);

let lastTime: number = 0;
const bounding_rect = new Rectangle(canvas_width / 2, canvas_height / 2, canvas_width, canvas_height);
let quadTree: QuadTree = QuadTree.create(bounding_rect);




function update(currentTime: number) {
    const min_frame_rate: number = 1 / 16;
    const deltaTime: number = Math.min((currentTime - lastTime) / 1000, min_frame_rate);
    lastTime = currentTime;

    ctx.clearRect(0, 0, canvas_width, canvas_height);
    ctx.reset();


    for (const entity of entities) {
        entity.update(deltaTime);
        entity.debug_render(ctx);
        entity.render(ctx, charCache);
    }

    quadTree.clear();

    for(const entity of entities){
        quadTree.insert(entity.center_pos);
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


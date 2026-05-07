import { PhysicsObject } from '../entity/PhysicsObject.js';

export function render(entity: PhysicsObject, ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    const vertex = entity.vertices;
    ctx.moveTo(vertex[0]!.x, vertex[0]!.y);

    for(let i = 1; i < vertex.length; i++){
        ctx.lineTo(vertex[i]!.x, vertex[i]!.y);
    }

    ctx.closePath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'blue';
    ctx.stroke();

    entity.bounding_rect.draw(ctx);
}
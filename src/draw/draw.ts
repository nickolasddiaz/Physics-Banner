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

    ctx.beginPath();
    ctx.strokeStyle = 'purple';
    ctx.arc(entity.pos.x, entity.pos.y, 10, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.closePath();

    entity.bounding_rect.draw(ctx);
}
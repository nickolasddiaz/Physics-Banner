import { Entity } from '../entity/entity.js';
import { charCache } from '../const.js';
import type { SpringConnection } from '../geometry/spring.js';


export function render(entity: Entity, ctx: CanvasRenderingContext2D): void {
    const sprite: OffscreenCanvas = charCache.get(entity.char)!;
    const cos: number = Math.cos(entity.ang);
    const sin: number = Math.sin(entity.ang);

    ctx.setTransform(cos, sin, -sin, cos, entity.pos.x, entity.center.y);
    ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
}

export function draw_SP(sp: SpringConnection, ctx: CanvasRenderingContext2D): void{
    ctx.beginPath();
    ctx.moveTo(sp.sp1.pos.x, sp.sp1.pos.y);
    ctx.lineTo(sp.sp2.pos.x, sp.sp2.pos.y);
    ctx.stroke();
}
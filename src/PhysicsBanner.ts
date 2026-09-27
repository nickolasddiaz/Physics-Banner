import PhysicsObject from './PhysicsObject/PhysicsObject.js';
import checkCollision from './PhysicsObject/checkCollision.js';
import { QuadTree } from './collision/quadtree.js';
import type Point from './geometry/point.js';
import Rectangle from './collision/rectangle.js';
import polygonFromChar from './font/PolygonCache.js';
import PolygonCache from './font/PolygonCache.js';

export default class PhysicsBanner{
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private entities: PhysicsObject[] = []; 
    private charCache: polygonFromChar;
    private canvas_width: number;
    private canvas_height: number;
    private lastTime: number = 0;
    private animationFrameId: number | null = null;
    // 94 printable, non-whitespace ASCII characters
    private characters: string = `!"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_\`abcdefghijklmnopqrstuvwxyz{|}~`;
    private random_speed = 160;
    private quadTree: QuadTree;
    private resizeObserver: ResizeObserver;
    private controller: AbortController;
    private enforcebounds: boolean = false;
    private gravity: number = 0.0;
    private debug: boolean = false; 

    constructor(canvas: HTMLCanvasElement, font_size: number = 36,
        font_url: URL = new URL('./assets/fonts/NotoSansDisplay.woff', import.meta.url)
    ){
        this.charCache = new PolygonCache(font_size, font_url);
        this.canvas = canvas;
        var ctx = canvas.getContext('2d')
        if (!ctx){
            throw new Error("Failed to get context 2d from canvas");
        }
        this.ctx = ctx;

        const bounding_rect = new Rectangle();
        this.quadTree = QuadTree.create(bounding_rect);

        this.controller = new AbortController();

        this.canvas.addEventListener("click", this.spawn_entity.bind(this), 
            { signal: this.controller.signal }
        );

        this.resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                this.canvas_width = entry.contentRect.width;
                this.canvas_height = entry.contentRect.height;
                this.set_width_height();
            }
        });

        this.resizeObserver.observe(canvas);

        this.canvas_width = canvas.width;
        this.canvas_height = canvas.width;
        this.set_width_height();
    }
    private set_width_height(){
        this.quadTree.boundary.set_rect(this.canvas_width / 2, this.canvas_height / 2, this.canvas_width, this.canvas_height)
    }

    private generateRandomCharacter(): string {
        const randomIndex: number = Math.floor(Math.random() * this.characters.length);
        return this.characters.charAt(randomIndex);
    }

    [Symbol.dispose]() {
        // disposes of event listeners and observers
        this.stop();
        this.resizeObserver.disconnect();
        this.controller.abort();
    }
    enable_debug(debug: boolean){
        this.debug = debug;
    }

    enable_bounds(bounds: boolean){
        this.enforcebounds = bounds;
    }

    set_gravity(gravity: number){
        this.gravity = gravity;
    }

    set_spawning_characters(characters: string){
        this.set_spawning_characters(characters);
    }

    set_random_speed(random_speed: number){
        this.random_speed = random_speed;
    }

    run(): void{
        if (this.animationFrameId === null) {
            this.animationFrameId = requestAnimationFrame(this.update.bind(this));
        }
    }

    stop(): void{
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    spawn_entity(): void{
        const randomRadian: number = Math.random() * 2 * Math.PI;
        const x: number = Math.cos(randomRadian) * 2;
        const y: number = Math.sin(randomRadian) * 2;

        const char = this.generateRandomCharacter();

        this.entities.push(new PhysicsObject(x* this.canvas_width, y * this.canvas_height, char,
            x * this.random_speed, y * this.random_speed, 1, this.charCache.getPolygon(char)));
    }

    update(currentTime: number) {
        const max_frame_rate: number = 1 / 16;
        const deltaTime: number = Math.min((currentTime - this.lastTime) / 1000, max_frame_rate);
        this.lastTime = currentTime;

        this.ctx.clearRect(0, 0, this.canvas_width, this.canvas_height);
        this.ctx.reset();

        let gravitydelta = this.gravity * deltaTime;
        if(gravitydelta != 0.0){
            for (const entity of this.entities) {
                entity.apply_gravity(gravitydelta);
            }
        }

        for (const entity of this.entities) {
            entity.update(deltaTime);
        }

        if (this.enforcebounds){
            for (const entity of this.entities) {
                entity.enforce_container(this.canvas_width, this.canvas_height);
            }
        } else{
            for (const entity of this.entities) {
                entity.enforce_looping(this.canvas_width, this.canvas_height);
            }
        }

        this.quadTree.clear();

        for(const entity of this.entities){
            this.quadTree.insert(entity.center_pos);
        }
        
        for (const entityA of this.entities) {
            const points: Point[] = this.quadTree.query(entityA.bounding_rect);
            if (points.length === 1) continue;

            for (const point of points) {
                const entityB: PhysicsObject = point.userData;
                if (entityA.id < entityB.id) {
                    checkCollision(entityA, entityB);
                }
            }
        }

        for (const entity of this.entities) {
            entity.render(this.ctx, this.charCache);
        }

        if (this.debug){
            for (const entity of this.entities) {
                entity.debug_render(this.ctx);
            }
            this.quadTree.debug_render(this.ctx)
        }

        this.animationFrameId = requestAnimationFrame(this.update.bind(this));
    }
}



const canvas: HTMLCanvasElement = document.getElementById('Canvas') as HTMLCanvasElement;

let physics_banner = new PhysicsBanner(canvas);
physics_banner.enable_debug(true);
physics_banner.enable_bounds(true);
physics_banner.run();
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
    private characters!: string[];
    private random_speed = 100;
    private quadTree: QuadTree;
    private resizeObserver: ResizeObserver;
    private intersectionObserver: IntersectionObserver;
    private controller: AbortController;
    private enforcebounds: boolean = false;
    private gravity: number = 0.0;
    private debug: boolean = false; 
    private segmenter: Intl.Segmenter;
    private font_url: string;

    constructor(canvas: HTMLCanvasElement, font_url: string, color: string = 'black', font_size: number = 36, segmenter: string = 'en'
    ){
        this.charCache = new PolygonCache(font_size, color);
        this.font_url = font_url;
        this.canvas = canvas;
        var ctx = canvas.getContext('2d')
        if (!ctx){
            throw new Error("Failed to get context 2d from canvas");
        }
        this.ctx = ctx;

        // used to split characters: for unicode/emojis
        this.segmenter = new Intl.Segmenter(segmenter, { granularity: 'grapheme' });

        const bounding_rect = new Rectangle();
        this.quadTree = QuadTree.create(bounding_rect);

        this.controller = new AbortController();

        this.canvas.addEventListener("click", this.shoot_character.bind(this), 
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

        this.intersectionObserver = new IntersectionObserver(([entry]) => {
            if (entry?.isIntersecting) {
                this.run();
            } else {
                this.stop();
            }
        });
        this.intersectionObserver.observe(canvas);

        this.canvas_width = canvas.width;
        this.canvas_height = canvas.width;
        this.set_width_height();

        // 94 printable, non-whitespace ASCII characters
        this.set_spawning_characters(`!"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_\`abcdefghijklmnopqrstuvwxyz{|}~`);
    }

    public async setup(){
        await this.charCache.initFont(this.font_url);
    }

    private set_width_height(){
        this.quadTree.boundary.set_rect(this.canvas_width / 2, this.canvas_height / 2, this.canvas_width, this.canvas_height)
    }

    private generateRandomCharacter(): string {
        const randomIndex: number = Math.floor(Math.random() * this.characters.length);
        return this.characters[randomIndex]!;
    }

    private splitGraphemes(str: string): string[] {
        return Array.from(this.segmenter.segment(str), (segment) => segment.segment);
    }

    private run(): void{
        if (this.animationFrameId === null) {
            this.animationFrameId = requestAnimationFrame(this.update.bind(this));
        }
    }

    private stop(): void{
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    [Symbol.dispose]() {
        // disposes of event listeners and observers
        this.stop();
        this.resizeObserver.disconnect();
        this.intersectionObserver.disconnect();
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
        this.characters = this.splitGraphemes(characters);
    }

    set_random_shoot_speed(random_speed: number){
        this.random_speed = random_speed;
    }

    shoot_character(): void{
        const randomRadian: number = Math.random() * 2 * Math.PI;
        const x: number = Math.cos(randomRadian) * 2;
        const y: number = Math.sin(randomRadian) * 2;

        const char = this.generateRandomCharacter();

        this.entities.push(new PhysicsObject(x* this.canvas_width, y * this.canvas_height, char,
            x * this.random_speed, y * this.random_speed, 1, this.charCache.getPolygon(char)));
    }

    spawn_string(characters: string, HPostion: number = .5, VPosition: number = .5, textAlignment: "left" | "center" | "right" = "left"){
        // Position: a number between 0.0 and 1.0, where 0.0 is top/left, 1.0 is bottom/right and 0.5 is center
        // textAlignment: Text is lined up along the left, center, right margin
        const graphemes = this.splitGraphemes(characters);
        const lineHeight = this.charCache.lineHeight;
        const lines: string[][] = [[]];
        const lineWidths: number[] = [0];

        for (const char of graphemes) {
            if (char === '\n' || char === '\r') { // check newline
                lines.push([]);
                lineWidths.push(0);
                continue;
            }

            const lineIndex = lines.length - 1;
            const charWidth = this.charCache.getCharacterWidth(char);

            lines[lineIndex]!.push(char);
            lineWidths[lineIndex] = (lineWidths[lineIndex] ?? 0) + charWidth;
        }

        let maxWidth = 0;
        let totalHeight = 0;

        for (let i = 0; i < lines.length; i++) {
            const lineWidth = lineWidths[i] ?? 0;

            maxWidth = Math.max(maxWidth, lineWidth);
            totalHeight += lineHeight;
        }

        let startX = 0;
        let startY = 0;

        startX = (this.canvas_width - maxWidth) * HPostion;
        startY = (this.canvas_height - totalHeight) * VPosition;

        let cursorY = startY;

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex] ?? [];
            if (line.length === 0) {
                cursorY += lineHeight;
                continue;
            }

            const lineWidth = lineWidths[lineIndex] ?? 0;
            let cursorX = startX;

            const alignmentOffset = textAlignment === "center"
                ? (maxWidth - lineWidth) / 2
                : textAlignment === "right"
                    ? maxWidth - lineWidth
                    : 0;
            cursorX += alignmentOffset;

            for (const char of line) {
                const charWidth = this.charCache.getCharacterWidth(char);
                const x = cursorX + charWidth / 2;
                const y = cursorY + (lineHeight - this.charCache.getCharacterHeight(char)) / 2;
                

                this.entities.push(new PhysicsObject(x, y, char,
                    0, 0, 1, this.charCache.getPolygon(char)));

                cursorX += charWidth;
            }

            cursorY += lineHeight;
        }
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

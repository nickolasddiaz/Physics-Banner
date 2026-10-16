import PhysicsObject from './PhysicsObject/PhysicsObject.js';
import checkCollision from './PhysicsObject/checkCollision.js';
import { QuadTree } from './collision/quadtree.js';
import type Point from './geometry/point.js';
import Rectangle from './collision/rectangle.js';
import polygonFromChar from './font/PolygonCache.js';
import PolygonCache from './font/PolygonCache.js';


/**
 * Rigid body physics simulation for ascii art/text.
 * Uses opentype.js to get character paths from a font.
 * Supports gravity, collisions, boundary behavior, and optional debugging.
 */
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
    private shoot_speed = 100;
    private quadTree: QuadTree;
    private resizeObserver: ResizeObserver;
    private intersectionObserver: IntersectionObserver;
    private controller: AbortController;
    private enforcebounds: boolean = false;
    private gravity: number = 0.0;
    private debug: boolean = false; 
    private segmenter: Intl.Segmenter;
    private font_url: string;

    /**
     * Creates a banner on the given canvas and begins observing its size and
     * visibility. Call {@link setup} before spawning text to load the font.
     * @param canvas Canvas on which the banner is rendered.
     * @param font_url URL of the font used to create the character, supports only WOFF/OTF/TTF type font and not WOFF2.
     * @param color Color used when initializing the character cache.
     * @param font_size Font size used to build character polygons.
     * @param segmenter Locale used to split text into grapheme clusters.
     * @throws {Error} If a 2D rendering context cannot be obtained.
     */
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
                const boxSize = entry.contentBoxSize[0];
                const width = boxSize?.inlineSize ?? entry.contentRect.width;
                const height = boxSize?.blockSize ?? entry.contentRect.height;

                const dpr = window.devicePixelRatio || 1;
                canvas.width = Math.round(width * dpr);
                canvas.height = Math.round(height * dpr);
                    
                // Reset or scale context to match
                this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

                this.canvas_width = width;
                this.canvas_height = height;
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
        this.set_shooting_characters(`!"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_\`abcdefghijklmnopqrstuvwxyz{|}~`);
    }

    /** Updates the quadtree boundary to match the canvas dimensions. */
    private set_width_height(){
        this.quadTree.modify_boundary(this.canvas_width / 2, this.canvas_height / 2, this.canvas_width, this.canvas_height);
    }

    /** Selects a random character from the configured shooting characters. */
    private generateRandomCharacter(): string {
        const randomIndex: number = Math.floor(Math.random() * this.characters.length);
        return this.characters[randomIndex]!;
    }

    /** Splits text into grapheme clusters using the segmenter. */
    private splitGraphemes(str: string): string[] {
        return Array.from(this.segmenter.segment(str), (segment) => segment.segment);
    }

    /** Safely destroys this class by stoping the physics loop and releases the event listeners and observers. Automatically called when this class is disposed.*/
    [Symbol.dispose]() {
        // disposes of event listeners and observers
        this.stop();
        this.resizeObserver.disconnect();
        this.intersectionObserver.disconnect();
        this.controller.abort();
    }

    /** Loads the configured font into the character polygon cache. */
    async setup(){
        await this.charCache.initFont(this.font_url);
    }

    /** Starts the physics loop if it is not already running. */
    run(): void{
        if (this.animationFrameId === null) {
            this.animationFrameId = requestAnimationFrame(this.update.bind(this));
        }
    }

    /** Stops the physics loop while leaving the banner ready to resume. */
    stop(): void{
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /** Enables or disables showing the debug information. */
    /** @param debug Whether debug rendering should be enabled. */
    enable_debug(debug: boolean){
        this.debug = debug;
    }

    /** Chooses whether entities are contained by the canvas or wrap around it. */
    /** @param bounds `true` makes the entities bounce at the edges; `false` makes them loop at edges. */
    enable_bounds(bounds: boolean){
        this.enforcebounds = bounds;
    }

    /** Sets the vertical gravity acceleration applied to entities. */
    /** @param gravity Gravity acceleration; zero to disable gravity. */
    set_gravity(gravity: number){
        this.gravity = gravity;
    }

    /** Sets the pool of characters used by {@link shoot_character}. */
    /** @param characters Characters that are picked randomly to be shot at. */
    set_shooting_characters(characters: string){
        this.characters = this.splitGraphemes(characters);
    }

    /** Sets the speed used when shooting a randomly selected character. */
    /** @param random_speed Magnitude of the initial shooting velocity. */
    set_shoot_speed(random_speed: number){
        this.shoot_speed = random_speed;
    }

    /** Spawns a single character at a position with the given velocity.
     * @param x Initial horizontal center position. 
     * @param y Initial vertical center position. 
     * @param char Character to spawn. 
     * @param velX Initial horizontal velocity. 
     * @param velY Initial vertical velocity. 
     */
    spawn_character(x: number, y: number, char: string, velX: number, velY: number){
        if (this.charCache.isCharacterValid(char)) {
            this.entities.push(new PhysicsObject(x, y, char, velX, velY, 1, this.charCache.getPolygon(char)));
        }
    }

    /** Fires a random character inward from the screen. */
    shoot_character(): void{
        const randomRadian: number = Math.random() * 2 * Math.PI;
        const x: number = Math.cos(randomRadian) * 2;
        const y: number = Math.sin(randomRadian) * 2;

        const char = this.generateRandomCharacter();

        this.spawn_character(x* this.canvas_width, y * this.canvas_height, char, x * this.shoot_speed, y * this.shoot_speed);
    }

    /**
     * Spawns the characters into the physics world.
     * @param characters Text to spawn.
     * @param HPostion Horizontal placement from 0 (left) to 1 (right) and 0.5 is the center.
     * @param VPosition Vertical placement from 0 (top) to 1 (bottom) and 0.5 is the center.
     * @param textAlignment Alignment of each line within the text block. Text is lined up along the left, center, right margin.
     */
    spawn_string(characters: string, HPostion: number = .5, VPosition: number = .5, textAlignment: "left" | "center" | "right" = "left"){
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
                
                this.spawn_character(x, y, char, 0, 0);

                cursorX += charWidth;
            }

            cursorY += lineHeight;
        }
    }

    /** Advances physics and renders one animation frame. Called by request animation frame.*/
    /** @param currentTime Current animation timestamp in milliseconds. */
    private update(currentTime: number) {
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

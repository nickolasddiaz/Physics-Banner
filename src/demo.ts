import PhysicsBanner from "./lib/index.js";
import { Pane } from 'tweakpane';
import * as TextareaPlugin from '@pangenerator/tweakpane-textarea-plugin';
import old_ascii_art from './ascii_art.txt?raw';

// https://www.asciiart.eu/text-to-ascii-art using Larry 3D courier font
// https://www.shortc.com/javascript-escaper/ javascript character escaper
let ascii_art = old_ascii_art.split(/\r?\n/).join('\n');

const canvas: HTMLCanvasElement = document.getElementById('Canvas') as HTMLCanvasElement;


// https://tweakpane.github.io/docs/
const pane = new Pane({ title: 'Physics Banner Showcase' });
pane.registerPlugin(TextareaPlugin); // for multi-line string

const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
const applyPaneTheme = (isDark: boolean) => {
    const theme = isDark
        ? { // dark theme from https://tweakpane.github.io/docs/theming/
            '--tp-base-background-color': ' hsla(0, 0%, 10%, 0.8)',
            '--tp-base-shadow-color': ' hsla(0, 0%, 0%, 0.2)',
            '--tp-button-background-color': ' hsla(0, 0%, 80%, 1)',
            '--tp-button-background-color-active': ' hsla(0, 0%, 100%, 1)',
            '--tp-button-background-color-focus': ' hsla(0, 0%, 95%, 1)',
            '--tp-button-background-color-hover': ' hsla(0, 0%, 85%, 1)',
            '--tp-button-foreground-color': ' hsla(0, 0%, 0%, 0.8)',
            '--tp-container-background-color': ' hsla(0, 0%, 0%, 0.3)',
            '--tp-container-background-color-active': ' hsla(0, 0%, 0%, 0.6)',
            '--tp-container-background-color-focus': ' hsla(0, 0%, 0%, 0.5)',
            '--tp-container-background-color-hover': ' hsla(0, 0%, 0%, 0.4)',
            '--tp-container-foreground-color': ' hsla(0, 0%, 100%, 0.5)',
            '--tp-groove-foreground-color': ' hsla(0, 0%, 0%, 0.2)',
            '--tp-input-background-color': ' hsla(0, 0%, 0%, 0.3)',
            '--tp-input-background-color-active': ' hsla(0, 0%, 0%, 0.6)',
            '--tp-input-background-color-focus': ' hsla(0, 0%, 0%, 0.5)',
            '--tp-input-background-color-hover': ' hsla(0, 0%, 0%, 0.4)',
            '--tp-input-foreground-color': ' hsla(0, 0%, 100%, 0.5)',
            '--tp-label-foreground-color': ' hsla(0, 0%, 100%, 0.5)',
            '--tp-monitor-background-color': ' hsla(0, 0%, 0%, 0.3)',
            '--tp-monitor-foreground-color': ' hsla(0, 0%, 100%, 0.3)',
        } // light theme from https://github.com/kitschpatrol/svelte-tweakpane-ui/blob/main/src/lib/theme.ts
        : {
            '--tp-base-background-color': ' hsla(230, 5%, 90%, 1.00)',
            '--tp-base-shadow-color': ' hsla(0, 0%, 0%, 0.10)',
            '--tp-button-background-color': ' hsla(230, 7%, 75%, 1.00)',
            '--tp-button-background-color-active': ' hsla(230, 7%, 60%, 1.00)',
            '--tp-button-background-color-focus': ' hsla(230, 7%, 65%, 1.00)',
            '--tp-button-background-color-hover': ' hsla(230, 7%, 70%, 1.00)',
            '--tp-button-foreground-color': ' hsla(230, 10%, 30%, 1.00)',
            '--tp-container-background-color': ' hsla(230, 15%, 30%, 0.20)',
            '--tp-container-background-color-active': ' hsla(230, 15%, 30%, 0.32)',
            '--tp-container-background-color-focus': ' hsla(230, 15%, 30%, 0.28)',
            '--tp-container-background-color-hover': ' hsla(230, 15%, 30%, 0.24)',
            '--tp-container-foreground-color': ' hsla(230, 10%, 30%, 1.00)',
            '--tp-groove-foreground-color': ' hsla(230, 15%, 30%, 0.10)',
            '--tp-input-background-color': ' hsla(230, 15%, 30%, 0.10)',
            '--tp-input-background-color-active': ' hsla(230, 15%, 30%, 0.22)',
            '--tp-input-background-color-focus': ' hsla(230, 15%, 30%, 0.18)',
            '--tp-input-background-color-hover': ' hsla(230, 15%, 30%, 0.14)',
            '--tp-input-foreground-color': ' hsla(230, 10%, 30%, 1.00)',
            '--tp-label-foreground-color': ' hsla(230, 10%, 30%, 0.70)',
            '--tp-monitor-background-color': ' hsla(230, 15%, 30%, 0.10)',
            '--tp-monitor-foreground-color': ' hsla(230, 10%, 30%, 0.50)',
        };

    for (const [property, value] of Object.entries(theme)) {
        pane.element.style.setProperty(property, value);
    }
};

applyPaneTheme(colorScheme.matches);
colorScheme.addEventListener('change', (event) => applyPaneTheme(event.matches));

const nonResetAbleObjects = {
	DebugMode: false,
    EnableBounds: true,
    Gravity: 0.0,
    shoot_speed: 250.0,
    set_shoot_characters: `!"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_\`abcdefghijklmnopqrstuvwxyz{|}~`,
    shoot_characters: function() {},
    pause_play: function() {},
};

const ResetAbleObjects = {
    // from courier font from https://fontsource.org/fonts/courier-prime/use
    font_url: `./${import.meta.env.BASE_URL}/fonts/courier-prime-latin-400-normal.woff`,
    font_segmenter: 'en',
	font_size: 16,
    fontcolor: '#00ff22',
    HPosition: 0.5,
    VPosition: 0.5,
    textAlignment: "center" as "center" | "left" | "right",
    spawn_string: ascii_art,
    reset: function() {},
};

let physics_banner: PhysicsBanner;

async function reset(){
    try {
    physics_banner = new PhysicsBanner(canvas, ResetAbleObjects.font_url, ResetAbleObjects.fontcolor, ResetAbleObjects.font_size, ResetAbleObjects.font_segmenter);
    await physics_banner.setup();

    physics_banner.enable_debug(nonResetAbleObjects.DebugMode);
    physics_banner.enable_bounds(nonResetAbleObjects.EnableBounds);
    physics_banner.set_gravity(nonResetAbleObjects.Gravity);
    physics_banner.set_shoot_speed(nonResetAbleObjects.shoot_speed);
    physics_banner.set_shooting_characters(nonResetAbleObjects.set_shoot_characters);
    physics_banner.spawn_string(ResetAbleObjects.spawn_string, ResetAbleObjects.HPosition, ResetAbleObjects.VPosition, ResetAbleObjects.textAlignment);

    } catch (error: unknown) {
        console.error(error);
        alert(error);
    }
}

await reset();

const simulationFolder = pane.addFolder({ title: 'NonResetable Items' });
simulationFolder.addBinding(nonResetAbleObjects, 'DebugMode', { label: 'Debug Mode' }).on('change', (event) => {
    nonResetAbleObjects.DebugMode = event.value;
    physics_banner.enable_debug(event.value);
});
simulationFolder.addBinding(nonResetAbleObjects, 'EnableBounds', { label: 'Enable Bounds' }).on('change', (event) => {
    nonResetAbleObjects.EnableBounds = event.value;
    physics_banner.enable_bounds(event.value);
});
simulationFolder.addBinding(nonResetAbleObjects, 'Gravity', { min: -20, max: 20, step: 0.1 }).on('change', (event) => {
    nonResetAbleObjects.Gravity = event.value;
    physics_banner.set_gravity(event.value);
});
simulationFolder.addBinding(nonResetAbleObjects, 'shoot_speed', { label: 'Shoot Speed', min: 0, max: 500, step: 10 }).on('change', (event) => {
    nonResetAbleObjects.shoot_speed = event.value;
    physics_banner.set_shoot_speed(event.value);
});
simulationFolder.addBinding(nonResetAbleObjects, 'set_shoot_characters', { label: 'Shoot Characters' }).on('change', (event) => {
    nonResetAbleObjects.set_shoot_characters = event.value;
    physics_banner.set_shooting_characters(event.value);
});
simulationFolder.addButton({ title: 'Shoot character' }).on('click', () => {
    physics_banner.shoot_character();
});

const textFolder = pane.addFolder({ title: 'Resetable Items' });
textFolder.addBinding(ResetAbleObjects, 'font_url', { label: 'Font URL' }).on('change', (event) => {
    ResetAbleObjects.font_url = event.value;
});
textFolder.addBinding(ResetAbleObjects, 'font_segmenter', { label: 'Font Segmenter' }).on('change', (event) => {
    ResetAbleObjects.font_segmenter = event.value;
});
textFolder.addBinding(ResetAbleObjects, 'font_size', { label: 'Font Size', min: 0, max: 100, step: 1 }).on('change', (event) => {
    ResetAbleObjects.font_size = event.value;
});
textFolder.addBinding(ResetAbleObjects, 'fontcolor', { label: 'Font Color', view: 'color' }).on('change', (event) => {
    ResetAbleObjects.fontcolor = event.value;
});
textFolder.addBinding(ResetAbleObjects, 'HPosition', { label: 'Horizontal Position', min: 0, max: 1, step: 0.01 }).on('change', (event) => {
    ResetAbleObjects.HPosition = event.value;
});
textFolder.addBinding(ResetAbleObjects, 'VPosition', { label: 'Verticle Position', min: 0, max: 1, step: 0.01 }).on('change', (event) => {
    ResetAbleObjects.VPosition = event.value;
});
textFolder.addBinding(ResetAbleObjects, 'textAlignment', { label: 'Text Alignment', options: { left: 'left', center: 'center', right: 'right' } }).on('change', (event) => {
    ResetAbleObjects.textAlignment = event.value;
});
// https://github.com/panGenerator/tweakpane-textarea-plugin
textFolder.addBinding(ResetAbleObjects, 'spawn_string', { label: 'Spawn String', view: 'textarea', rows: 6, }).on('change', (event) => { // multiline string
    ResetAbleObjects.spawn_string = event.value;
});
textFolder.addButton({ title: 'Reset' }).on('click', () => {
    void reset();
});
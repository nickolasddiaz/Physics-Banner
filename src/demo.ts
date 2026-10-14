import PhysicsBanner from "./lib/index.js";
import GUI from 'lil-gui'; 

const canvas: HTMLCanvasElement = document.getElementById('Canvas') as HTMLCanvasElement;

// https://texteditor.com/ascii-art/ pipes
// const ascii_art: string = `
//     ╔╗╔╗╔╗    ╔╗                 
//     ║║║║║║    ║║                 
//     ║║║║║║╔══╗║║ ╔══╗╔══╗╔╗╔╗╔══╗
//     ║╚╝╚╝║║╔╗║║║ ║╔═╝║╔╗║║╚╝║║╔╗║
//     ╚╗╔╗╔╝║║═╣║╚╗║╚═╗║╚╝║║║║║║║═╣
//      ╚╝╚╝ ╚══╝╚═╝╚══╝╚══╝╚╩╩╝╚══╝
                             
//  ╔╗                             ╔╗     
// ╔╝╚╗                           ╔╝╚╗    
// ╚╗╔╝╔══╗    ╔╗╔╗╔╗ ╔╗    ╔══╗╔╗╚╗╔╝╔══╗
//  ║║ ║╔╗║    ║╚╝║║║ ║║    ║══╣╠╣ ║║ ║╔╗║
//  ║╚╗║╚╝║    ║║║║║╚═╝║    ╠══║║║ ║╚╗║║═╣
//  ╚═╝╚══╝    ╚╩╩╝╚═╗╔╝    ╚══╝╚╝ ╚═╝╚══╝
//                 ╔═╝║                   
//                 ╚══╝                                                                                                                                                 
// `;

let ascii_art = `testa|shdfj|lasdhfjasldfwqertprweut
adsf|asf
`;


const gui = new GUI({ title: 'Physics Banner Showcase' });

const nonResetAbleObjects = {
	DebugMode: false,
    EnableBounds: true,
    gravity: 0.0,
    shoot_speed: 100.0,
    set_shoot_characters: `!"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_\`abcdefghijklmnopqrstuvwxyz{|}~`,
    shoot_characters: function() {},
    pause_play: function() {},
};

const ResetAbleObjects = {
    font_url: '/Physics-Banner/fonts/NotoSansDisplay.woff',
    font_segmenter: 'en',
	font_size: 24,
    fontcolor: {
        string: '#000000',
        int: 0x000000,
        object: { r: 0, g: 0, b: 0 },
        array: [ 0, 0, 0 ]
    },
    HPosition: 0.5,
    VPosition: 0.5,
    textAlignment: "center" as "center" | "left" | "right",
    spawn_string: ascii_art,
    reset: function() {},
};

let physics_banner: PhysicsBanner;

async function reset(){
    physics_banner = new PhysicsBanner(canvas, ResetAbleObjects.font_url, ResetAbleObjects.fontcolor.string, ResetAbleObjects.font_size, ResetAbleObjects.font_segmenter);
    await physics_banner.setup();

    physics_banner.enable_debug(nonResetAbleObjects.DebugMode);
    physics_banner.enable_bounds(nonResetAbleObjects.EnableBounds);
    physics_banner.set_gravity(nonResetAbleObjects.gravity);
    physics_banner.set_shoot_speed(nonResetAbleObjects.shoot_speed);
    physics_banner.set_shooting_characters(nonResetAbleObjects.set_shoot_characters);
    physics_banner.spawn_string(ResetAbleObjects.spawn_string, ResetAbleObjects.HPosition, ResetAbleObjects.VPosition, ResetAbleObjects.textAlignment);
}

await reset();

const simulationFolder = gui.addFolder('NonResetable Items');
simulationFolder.add(nonResetAbleObjects, 'DebugMode').name('Debug mode').onChange((enabled: boolean) => {
    nonResetAbleObjects.DebugMode = enabled;
    physics_banner.enable_debug(enabled);
});
simulationFolder.add(nonResetAbleObjects, 'EnableBounds').name('Enable bounds').onChange((enabled: boolean) => {
    nonResetAbleObjects.EnableBounds = enabled;
    physics_banner.enable_bounds(enabled);
});
simulationFolder.add(nonResetAbleObjects, 'gravity', -20, 20, 0.1).onChange((value: number) => {
    nonResetAbleObjects.gravity = value;
    physics_banner.set_gravity(value);
});
simulationFolder.add(nonResetAbleObjects, 'shoot_speed', 0, 100.0, 1).name('Shoot speed').onChange((value: number) => {
    nonResetAbleObjects.shoot_speed = value;
    physics_banner.set_shoot_speed(value);
});
simulationFolder.add(nonResetAbleObjects, 'set_shoot_characters').name('Shoot Characters').onChange((value: string) => {
    nonResetAbleObjects.set_shoot_characters = value;
    physics_banner.set_shooting_characters(nonResetAbleObjects.set_shoot_characters);
});
simulationFolder.add(nonResetAbleObjects, 'shoot_characters').name('Shoot character').onChange((_value: number) => {
    physics_banner.shoot_character();
});

const textFolder = gui.addFolder('Resetable Items');
textFolder.add(ResetAbleObjects, 'font_url').name('Font URL').onChange((value: string) => {
    ResetAbleObjects.font_url = value;
});
textFolder.add(ResetAbleObjects, 'font_segmenter').name('Font Segmenter').onChange((value: string) => {
    ResetAbleObjects.font_segmenter = value;
});
textFolder.add(ResetAbleObjects, 'font_size', 0, 100, 1).name('Font Size').onChange((value: number) => {
    ResetAbleObjects.font_size = value;
});
textFolder.addColor(ResetAbleObjects, 'fontcolor').name('Font Color').onChange((value: number) => {
    ResetAbleObjects.fontcolor.int = value;
});
textFolder.add(ResetAbleObjects, 'HPosition', 0, 1, 0.01).name('Horizontal Position').onChange((value: number) => {
    ResetAbleObjects.HPosition = value;
});
textFolder.add(ResetAbleObjects, 'VPosition', 0, 1, 0.01).name('Verticle Position').onChange((value: number) => {
    ResetAbleObjects.VPosition = value;
});
textFolder.add(ResetAbleObjects, 'textAlignment', { left: 'left', center: 'center', right: 'right' }).name('Text Alignment').onChange((value: string) => {
    ResetAbleObjects.textAlignment = value as "center" | "left" | "right";
});
textFolder.add(ResetAbleObjects, 'spawn_string').name('Spawn String').onChange((value: string) => {
    ResetAbleObjects.spawn_string = value;
});
textFolder.add(ResetAbleObjects, 'reset').name('Reset').onChange((_value: number) => {
    reset();
});
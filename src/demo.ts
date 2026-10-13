import PhysicsBanner from "./lib/index.js";

const canvas: HTMLCanvasElement = document.getElementById('Canvas') as HTMLCanvasElement;

let physics_banner = new PhysicsBanner(canvas, "/Physics-Banner/fonts/NotoSansDisplay.woff", 'green', 24);
await physics_banner.setup();
// physics_banner.enable_debug(true);
physics_banner.enable_bounds(true);

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

const ascii_art = `testa|shdfj|lasdhfjasldfwqertprweut
adsf|asf
`;

physics_banner.spawn_string(ascii_art, 0.5, 0.5, "center");
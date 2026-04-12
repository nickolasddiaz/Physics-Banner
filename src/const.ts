export const min_frame_rate: number = 1 / 16;
export const canvas: HTMLCanvasElement = document.getElementById('pinballCanvas') as HTMLCanvasElement;
export const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;


export const height = 50;

const characters: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';

export function generateRandomCharacter(): string {
   const randomIndex: number = Math.floor(Math.random() * characters.length);
   return characters.charAt(randomIndex);
}


// https://textpaint.com/text-art/ pipes
// export const ascii_art: string = `
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

export const ascii_art: string = "test";


export const charCache: Map<string, OffscreenCanvas> = new Map();

const uniqueChars: Set<string> = new Set([...ascii_art, ...characters]);

function preRenderChars(chars: Set<string>, size: number, color: string) {
   chars.forEach(char => {
      const offCanvas:  OffscreenCanvas = new OffscreenCanvas(size * 2, size * 2);
      const oCtx: OffscreenCanvasRenderingContext2D = offCanvas.getContext('2d')!;

      oCtx.font = `${size}px monospace`;
      oCtx.fillStyle = color;
      oCtx.textAlign = 'center';
      oCtx.textBaseline = 'middle';

      oCtx.fillText(char, size, size);
      charCache.set(char, offCanvas);
   });
}

preRenderChars(uniqueChars, height, '#0000ff');
// Genera favicon.ico (16, 32 y 48 px) y apple-touch-icon.png a partir de public/favicon.svg.
// Uso: node scripts/generar_favicon.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const svg = readFileSync('public/favicon.svg');
const png = (lado) => sharp(svg, { density: 384 }).resize(lado, lado).png().toBuffer();

// Un .ico es una cabecera, una entrada por tamaño y los PNG seguidos.
const lados = [16, 32, 48];
const imagenes = await Promise.all(lados.map(png));

const cabecera = Buffer.alloc(6 + 16 * lados.length);
cabecera.writeUInt16LE(1, 2);
cabecera.writeUInt16LE(lados.length, 4);

let posicion = cabecera.length;
lados.forEach((lado, i) => {
  const entrada = 6 + 16 * i;
  cabecera.writeUInt8(lado, entrada);
  cabecera.writeUInt8(lado, entrada + 1);
  cabecera.writeUInt16LE(1, entrada + 4);
  cabecera.writeUInt16LE(32, entrada + 6);
  cabecera.writeUInt32LE(imagenes[i].length, entrada + 8);
  cabecera.writeUInt32LE(posicion, entrada + 12);
  posicion += imagenes[i].length;
});

writeFileSync('public/favicon.ico', Buffer.concat([cabecera, ...imagenes]));
writeFileSync('public/apple-touch-icon.png', await png(180));

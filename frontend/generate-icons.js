import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createPng(width, height, drawFn) {
  // 1. Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // 2. IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA color type
  ihdrData[10] = 0; // Deflate compression
  ihdrData[11] = 0; // Filter method
  ihdrData[12] = 0; // No interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // 3. Raw image scanlines (filter byte 0 + RGBA per pixel)
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // None filter
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  // 4. Compress IDAT
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);

  // 5. IEND Chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 calculation for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

// Color painter: Corporate Slate #0f172a with Storefront shape in center
function drawStoreIcon(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;

  // Background: elegant Slate gradient
  let bgR = 15;
  let bgG = 23;
  let bgB = 42;

  // Center Storefront box calculation
  const cx = 0.5;
  const cy = 0.5;
  const dx = Math.abs(nx - cx);
  const dy = Math.abs(ny - cy);

  // Outer rounded rectangle icon background
  if (dx < 0.42 && dy < 0.42) {
    // Inside icon boundary
    // Storefront roof / awning
    if (ny >= 0.28 && ny <= 0.42 && dx <= 0.30) {
      return [37, 99, 235, 255]; // Royal Blue accent #2563eb
    }
    // Awning stripes
    if (ny >= 0.35 && ny <= 0.44 && dx <= 0.28) {
      const stripe = Math.floor(nx * 14) % 2 === 0;
      return stripe ? [255, 255, 255, 255] : [37, 99, 235, 255];
    }
    // Store body
    if (ny >= 0.44 && ny <= 0.72 && dx <= 0.26) {
      // Doorway
      if (ny >= 0.55 && ny <= 0.72 && dx <= 0.09) {
        return [15, 23, 42, 255]; // Dark doorway
      }
      // Windows
      if (ny >= 0.50 && ny <= 0.62 && (dx >= 0.12 && dx <= 0.22)) {
        return [147, 197, 253, 255]; // Light blue window
      }
      return [255, 255, 255, 255]; // Clean white walls
    }
  }

  return [bgR, bgG, bgB, 255];
}

const publicDir = path.join(__dirname, 'public');

console.log('Generando iconos corporativos para PWA, Android y iOS...');
const png192 = createPng(192, 192, drawStoreIcon);
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), png192);

const png512 = createPng(512, 512, drawStoreIcon);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), png512);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png512);

console.log('✅ Iconos generados con éxito: icon-192.png, icon-512.png, apple-touch-icon.png');

import fs from "fs";
import path from "path";
import sharp from "sharp";

// Uso:
//   node tools/convert-cards-to-webp.mjs "C:\ruta\carpetas\cartas"
//
// Convierte todos los .png de esa carpeta a .webp lossless
// con el mismo nombre base (O_1.png -> O_1.webp).

async function main() {
  const targetDir = process.argv[2];
  if (!targetDir) {
    console.error("Uso: node tools/convert-cards-to-webp.mjs \"C:\\ruta\\a\\cartas\"");
    process.exit(1);
  }

  const cardsDir = path.resolve(targetDir);
  console.log(`Carpeta de entrada: ${cardsDir}`);

  const entries = await fs.promises.readdir(cardsDir, { withFileTypes: true });
  const files = entries.filter((e) => e.isFile()).map((e) => e.name);

  for (const file of files) {
    if (!file.toLowerCase().endsWith(".png")) continue;

    const inputPath = path.join(cardsDir, file);
    const baseName = file.slice(0, -4); // quita ".png"
    const outputPath = path.join(cardsDir, `${baseName}.webp`);

    console.log(`Convirtiendo ${file} -> ${baseName}.webp`);

    await sharp(inputPath)
      .webp({ lossless: true, quality: 100 })
      .toFile(outputPath);
  }

  console.log("Conversión completada.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


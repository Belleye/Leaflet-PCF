import { chromium } from "playwright";
import { mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inputDir = path.resolve(process.argv[2] ?? path.join(projectRoot, "samples/images"));
const outputDir = path.resolve(process.argv[3] ?? inputDir);

const files = (await readdir(inputDir)).filter((file) => file.toLowerCase().endsWith(".svg"));
if (files.length === 0) {
  console.log(`No SVG files found in ${inputDir}`);
  process.exit(0);
}

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const file of files) {
    const svg = await readFile(path.join(inputDir, file), "utf8");
    await page.setContent(`<!doctype html><style>body { margin: 0 }</style>${svg}`);
    const image = page.locator("svg").first();
    await image.evaluate((element) => {
      const viewBox = element.viewBox.baseVal;
      if (!element.hasAttribute("width") && viewBox.width) element.setAttribute("width", String(viewBox.width));
      if (!element.hasAttribute("height") && viewBox.height) element.setAttribute("height", String(viewBox.height));
      element.style.display = "block";
    });
    const output = path.join(outputDir, `${path.parse(file).name}.png`);
    await image.screenshot({ path: output, omitBackground: true });
    console.log(`${file} -> ${output}`);
  }
} finally {
  await browser.close();
}

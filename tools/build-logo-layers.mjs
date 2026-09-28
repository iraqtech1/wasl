import fs from "node:fs";

// External SVG images are rasterized once, then composited using CSS transforms.
const source = fs
  .readFileSync("public/assets/wasel-brand.jpeg")
  .toString("base64");
for (const [color, alpha] of Object.entries({
  orange: "5 0 -5 0 -0.3",
  blue: "-5 0 5 0 -0.3",
})) {
  fs.writeFileSync(
    `public/assets/logo-${color}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="95" viewBox="450 220 855 445"><defs><filter id="ink" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  ${alpha}"/></filter></defs><image width="1800" height="1800" href="data:image/jpeg;base64,${source}" filter="url(#ink)"/></svg>`,
  );
}

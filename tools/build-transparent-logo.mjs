import fs from 'node:fs';
// Static SVG ink layers preserve the original silhouette without a white paper box.
const image=fs.readFileSync('public/assets/wasel-brand.jpeg').toString('base64');
const layer=(id,color,alpha)=>`<filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 ${color[0]}  0 0 0 0 ${color[1]}  0 0 0 0 ${color[2]}  ${alpha}"/></filter>`;
const ink=`<defs><image id="source" width="1800" height="1800" href="data:image/jpeg;base64,${image}"/>${layer('orange',[244/255,125/255,47/255],'5 0 -5 0 -0.3')}${layer('blue',[64/255,157/255,190/255],'-5 0 5 0 -0.3')}<clipPath id="mark"><rect x="450" y="220" width="855" height="445"/></clipPath></defs><g clip-path="url(#mark)"><use href="#source" filter="url(#blue)"/><use href="#source" filter="url(#orange)"/></g>`;
fs.writeFileSync('public/assets/brand-transparent.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1800" viewBox="0 0 1800 1800">${ink}</svg>`);
fs.writeFileSync('public/assets/logo-mark.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="180" height="95" viewBox="450 220 855 445">${ink}</svg>`);

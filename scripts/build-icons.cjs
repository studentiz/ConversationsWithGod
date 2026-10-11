const fs=require('node:fs'),path=require('node:path');
let sharp;try{sharp=require('sharp')}catch{if(!process.env.SHARP_MODULE)throw new Error('Run npm ci before building icons.');sharp=require(process.env.SHARP_MODULE)}
(async()=>{
 const svg=fs.readFileSync('icons/mark.svg');
 for(const [filename,size] of Object.entries({'favicon-16x16.png':16,'favicon-32x32.png':32,'apple-touch-icon.png':180,'icon-192x192.png':192,'icon-512x512.png':512}))await sharp(svg).resize(size).png().toFile('icons/'+filename);
 const mask=svg.toString().replace('<rect x="52"','<rect width="1024" height="1024" fill="#f8f5f1"/><rect x="52"');
 await sharp(Buffer.from(mask)).resize(512).png().toFile('icons/maskable-icon.png');
 await sharp(svg).resize(1024).png().toFile('img/logo.png');
})().catch(e=>{console.error(e);process.exitCode=1});

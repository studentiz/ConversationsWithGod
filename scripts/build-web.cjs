const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
let html=fs.readFileSync(path.join(root,'web/index.template.html'),'utf8');
for(const [token,file] of [['CWG_I18N','i18n.js'],['CWG_EXPORTS','exports.js'],['CWG_STORAGE','storage.js'],['CWG_TRANSCRIPT','transcript.js']]){
 const script=fs.readFileSync(path.join(root,'web',file),'utf8').replace(/<\/script/gi,'<\\/script');
 html=html.replace('/* '+token+' */',()=>script);
}
fs.writeFileSync(path.join(root,'index.html'),html);
console.log('Built standalone index.html from shared web sources.');

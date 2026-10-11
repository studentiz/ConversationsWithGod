// Capture only isolated example conversations, never a user's browser history.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const examples={
 zh:['为什么越忙，越觉得离自己很远？','也许先停一会儿。\n听听此刻的感受，不急着找到答案。','那今天，就从一件小事开始吧。','给自己留一点安静。\n慢慢走，也是在往前走。'],
 en:['Why does being busy make me feel so far from myself?','Pause for a moment.\nListen to what you feel, without rushing to find an answer.','Then I can begin with one small thing today.','Leave a little room for quiet.\nA slower step is still a step forward.']
};
(async()=>{const chrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';const browser=await chromium.launch({headless:true,...(fs.existsSync(chrome)?{executablePath:chrome}:{})});
 try{for(const lang of ['zh','en']){
  fs.mkdirSync(path.join(root,'img',lang),{recursive:true});
  const context=await browser.newContext({viewport:{width:390,height:740},deviceScaleFactor:2,locale:lang==='zh'?'zh-CN':'en-US',serviceWorkers:'block'}),page=await context.newPage();
  const fixture=examples[lang].map((content,i)=>({content,role:i%2?'assistant':'user',timestamp:`2026-10-11T04:23:${String(i*6).padStart(2,'0')}.000Z`}));
  await page.addInitScript(data=>{Date.now=()=>Date.parse('2026-10-11T04:23:30.000Z');localStorage.setItem('theme','light');localStorage.setItem('chat_messages',JSON.stringify(data));},fixture);
  await page.goto('file://'+root+'/index.html');await page.waitForFunction(()=>!document.getElementById('messageInput').disabled);
  await page.waitForTimeout(1600);await page.locator('#chatMessages').evaluate(el=>el.blur());
  await page.screenshot({path:path.join(root,'img',lang,'conversation.png')});
  await page.locator('#menuButton').click();await page.locator('#exportItem').click();await page.locator('#confirmExport').waitFor({state:'visible'});await page.waitForTimeout(250);await page.locator('#exportPurpose').evaluate(el=>el.blur());
  await page.locator('#exportModal .modal-dialog').screenshot({path:path.join(root,'img',lang,'export.png')});
  await page.locator('#cancelExport').click();await page.locator('#menuButton').click();await page.locator('#themeItem').click();await page.waitForTimeout(550);
  await page.screenshot({path:path.join(root,'img',lang,'dark.png')});
  if(lang==='zh'){
   await page.locator('#menuButton').click();await page.locator('#themeItem').click();await page.waitForTimeout(550);
   await page.setViewportSize({width:1280,height:720});await page.waitForTimeout(1600);await page.screenshot({path:path.join(root,'screenshots','screenshot1.png'),scale:'css'});
   await page.setViewportSize({width:720,height:1280});await page.waitForTimeout(1600);await page.screenshot({path:path.join(root,'screenshots','screenshot2.png'),scale:'css'});
   await page.setViewportSize({width:390,height:740});await page.waitForTimeout(1600);await page.screenshot({path:path.join(root,'img','screenshot.png')});
   await page.evaluate(()=>{Date.now=()=>Date.parse('2026-10-11T04:33:30.000Z');document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(400);await page.screenshot({path:path.join(root,'img','privacy-blur.png')});
  }
  await context.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});

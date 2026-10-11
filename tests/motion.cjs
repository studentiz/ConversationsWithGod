const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
 const installed='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
 const browser=await chromium.launch({headless:true,...(fs.existsSync(installed)?{executablePath:installed}:{})});
 try{
  const context=await browser.newContext({viewport:{width:320,height:568},serviceWorkers:'block'}),page=await context.newPage();
  await page.addInitScript(()=>{localStorage.setItem('theme','light');localStorage.setItem('chat_messages',JSON.stringify([{role:'user',content:'Earlier words',timestamp:new Date(Date.now()-600000).toISOString()}]));});
  await page.goto('file://'+root+'/index.html');await page.waitForFunction(()=>!document.getElementById('messageInput').disabled);
  if(!process.argv[2]||process.argv[2]==='timestamp'){
   const styles=await page.locator('.message').evaluate(row=>{
    const filters=el=>{const result=[];for(;el&&el!==row;el=el.parentElement){const f=getComputedStyle(el).filter;if(f!=='none')result.push(f);}return result;};
    return {text:filters(row.querySelector('.message-text')),time:filters(row.querySelector('.message-time')),delete:filters(row.querySelector('.message-delete'))};
   });
   assert.ok(styles.text.length>0);assert.deepEqual(styles.time,styles.text,'Timestamp must blur with its message');assert.deepEqual(styles.delete,[],'Delete control must stay clear');console.log('Timestamp and text age together.');
  }
  if(!process.argv[2]||process.argv[2]==='cadence'){
   const opacity=await page.evaluate(async()=>{const input=document.getElementById('messageInput');input.value='慢慢说';input.dispatchEvent(new Event('input'));document.getElementById('sendButton').click();await new Promise(r=>setTimeout(r,210));const glyphs=[...document.querySelector('.message:last-child').querySelectorAll('.revealed-glyph')];return {first:Number(getComputedStyle(glyphs[0]).opacity),last:Number(getComputedStyle(glyphs.at(-1)).opacity)};});
   assert.ok(opacity.first>0);assert.equal(opacity.last,0,'A short phrase must still be unfolding after 210 ms');
   await page.waitForFunction(()=>!document.querySelector('[data-reveal]'),{},{timeout:8000});assert.equal(await page.locator('.message-text').last().textContent(),'慢慢说');console.log('Short phrase unfolds visibly and finishes without losing text.');
  }
  if(!process.argv[2]){
   const bounded=await page.evaluate(()=>{const text='听🌙'.repeat(120),input=document.getElementById('messageInput');input.value=text;input.dispatchEvent(new Event('input'));document.getElementById('sendButton').click();const count=document.querySelectorAll('.revealed-glyph').length;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.fixtureHidden===true});window.fixtureHidden=true;document.dispatchEvent(new Event('visibilitychange'));return {count,remaining:document.querySelectorAll('[data-reveal]').length,text:document.querySelector('.message:last-child .message-text').textContent,expected:text};});
   assert.ok(bounded.count>0&&bounded.count<=160);assert.equal(bounded.remaining,0);assert.equal(bounded.text,bounded.expected);
   await page.evaluate(()=>{window.fixtureHidden=false;document.dispatchEvent(new Event('visibilitychange'));const input=document.getElementById('messageInput');input.value='慢慢听';input.dispatchEvent(new Event('input'));document.getElementById('sendButton').click();});
   assert.ok(await page.locator('.revealed-glyph').count()>0);await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>!document.querySelector('[data-reveal]'));assert.equal(await page.locator('.message-text').last().textContent(),'慢慢听');assert.equal(await page.locator('.revealed-glyph').count(),0);
   console.log('Hidden and reduced-motion views finish text immediately; animated layers stay bounded.');
  }
  await context.close();
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

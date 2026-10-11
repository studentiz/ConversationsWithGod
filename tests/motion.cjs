const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
 const installed='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
 const browser=await chromium.launch({headless:true,...(fs.existsSync(installed)?{executablePath:installed}:{})});
 const open=async(n=0,options={})=>{
  const context=await browser.newContext({viewport:{width:278,height:497},locale:'en-US',serviceWorkers:'block',...options}),page=await context.newPage();
  const data=Array.from({length:n},(_,i)=>({role:i%2?'assistant':'user',content:`Earlier reflection ${i}. A moment to listen.`,timestamp:new Date(Date.now()-600000).toISOString()}));
  await page.addInitScript(data=>{localStorage.setItem('theme','light');localStorage.setItem('chat_messages',JSON.stringify(data));},data);
  await page.goto('file://'+root+'/index.html');await page.waitForFunction(()=>!document.getElementById('messageInput').disabled);return {context,page};
 };
 try{
  {const {context,page}=await open(1);
   const styles=await page.locator('.message').evaluate(row=>{
    const filters=el=>{const result=[];for(;el&&el!==row;el=el.parentElement){const f=getComputedStyle(el).filter;if(f!=='none')result.push(f);}return result;};
    return {text:filters(row.querySelector('.message-text')),time:filters(row.querySelector('.message-time')),delete:filters(row.querySelector('.message-delete'))};
   });
   assert.ok(styles.text.length>0);assert.deepEqual(styles.time,styles.text);assert.deepEqual(styles.delete,[]);
   for(const size of [{width:278,height:497},{width:320,height:400},{width:320,height:568},{width:844,height:390}]){
    await page.setViewportSize(size);await page.locator('#messageInput').fill('一句话\n另一句话\n'.repeat(40));
    const metrics=await page.locator('#messageInput').evaluate(el=>({overflow:getComputedStyle(el).overflowY,width:el.getBoundingClientRect().right,height:el.getBoundingClientRect().height,text:el.value}));
    assert.equal(metrics.overflow,'hidden','No scrollbar even when the draft exceeds the composer height');assert.ok(metrics.width<size.width);assert.ok(metrics.height<=Math.min(160,size.height*.32)+1);assert.equal(metrics.text,'一句话\n另一句话\n'.repeat(40));
    await page.locator('#messageInput').press('ControlOrMeta+End');await page.locator('#messageInput').press('x');assert.ok((await page.locator('#messageInput').inputValue()).endsWith('x'));
   }
   await page.setViewportSize({width:320,height:568});
   // Inspect during the first animation frame: all text is already a single node.
   const sent=await page.evaluate(async()=>{
    const input=document.getElementById('messageInput'),text='慢慢说，🌙 家人 👨‍👩‍👧‍👦。\n这是完整的内容。';input.value=text;input.dispatchEvent(new Event('input'));document.getElementById('sendButton').click();
    const row=document.querySelector('.message:last-child'),body=row.querySelector('.message-text');
    const immediate={text:body.textContent,expected:text,nodes:body.childNodes.length,spans:body.querySelectorAll('span').length};await new Promise(requestAnimationFrame);
    return {...immediate,moving:document.getAnimations().some(a=>a.effect?.target===row)};
   });assert.equal(sent.text,sent.expected);assert.equal(sent.nodes,1);assert.equal(sent.spans,0);assert.ok(sent.moving,'Whole bubble floats up on send');
   await page.waitForTimeout(300);assert.equal(await page.locator('.message-text span').count(),0);assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.effect?.target?.classList?.contains('message')).length),0);
   await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#messageInput').fill('静静地出现');await page.locator('#sendButton').click();await page.waitForTimeout(30);assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.effect?.target?.classList?.contains('message')).length),0);
   await context.close();console.log('Timestamp blur, narrow multiline editing, complete text and reduced motion passed.');
  }
  {const {context,page}=await open(100);const track=page.locator('.scroll-indicator');await page.waitForTimeout(1550);
   assert.equal(await track.evaluate(el=>Number(getComputedStyle(el).opacity)),0,'No persistent scrollbar at rest');
   assert.equal(await page.locator('#chatMessages').evaluate(el=>getComputedStyle(el).scrollbarWidth),'none');
   await page.locator('#chatMessages').hover();await page.mouse.wheel(0,-220);await page.waitForTimeout(80);assert.equal(await track.evaluate(el=>Number(getComputedStyle(el).opacity)),1);
   await page.waitForTimeout(1000);const fading=await track.evaluate(el=>Number(getComputedStyle(el).opacity));assert.ok(fading>0&&fading<1,'Scrollbar slowly fades away');await page.waitForTimeout(500);assert.equal(await track.evaluate(el=>Number(getComputedStyle(el).opacity)),0);
   // Visible handle supports actual mouse dragging and keyboard navigation.
   await track.focus();await track.press('Home');await page.waitForTimeout(80);assert.equal(await page.locator('#chatMessages').evaluate(el=>el.scrollTop),0);
   const thumb=await page.locator('.scroll-thumb').boundingBox();await page.mouse.move(thumb.x+2,thumb.y+10);await page.mouse.down();await page.mouse.move(thumb.x+2,thumb.y+160,{steps:6});await page.mouse.up();assert.ok(await page.locator('#chatMessages').evaluate(el=>el.scrollTop>300));
   await track.press('End');await page.waitForTimeout(150);assert.equal(await track.getAttribute('aria-valuenow'),'100');
   const colors=await page.evaluate(()=>[getComputedStyle(document.querySelector('.other-message')).backgroundColor,getComputedStyle(document.querySelector('.own-message')).backgroundColor]);assert.deepEqual(colors,['rgb(220, 231, 220)','rgb(238, 235, 230)']);
   await context.close();console.log('Overlay visibility, gradual fade, dragging, keyboard and palette passed.');
  }
  {const {context,page}=await open();assert.equal(await page.locator('.scroll-indicator').isVisible(),false);await context.close();}
  {const {context,page}=await open(2,{locale:'zh-CN'});assert.equal(await page.locator('html').getAttribute('lang'),'zh-CN');assert.equal(await page.locator('#messageInput').getAttribute('placeholder'),'说点什么…');await page.locator('#menuButton').click();assert.match(await page.locator('#exportItem').textContent(),/导出对话…/);await page.locator('#exportItem').click();await page.locator('#confirmExport').waitFor({state:'visible'});assert.equal(await page.locator('#confirmExport').innerText(),'保存文本');await page.locator('#exportPurpose').selectOption('training');assert.equal(await page.locator('#confirmExport').innerText(),'保存训练文件');assert.match(await page.locator('#exportSummary').innerText(),/训练样本/);await context.close();console.log('Actual Chinese interface and export labels passed.');}
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

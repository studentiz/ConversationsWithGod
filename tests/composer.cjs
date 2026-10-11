const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),output=path.join(root,'.test-results/composer');
(async()=>{
 fs.mkdirSync(output,{recursive:true});
 const installed='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
 const browser=await chromium.launch({headless:true,...(fs.existsSync(installed)?{executablePath:installed}:{})});
 try {
  for(const theme of ['light','dark'])for(const width of [278,320,640]) {
   const context=await browser.newContext({viewport:{width,height:568},locale:'zh-CN',serviceWorkers:'block'}),page=await context.newPage();
   await page.addInitScript(theme=>localStorage.setItem('theme',theme),theme);
   await page.goto('file://'+root+'/index.html');await page.waitForFunction(()=>!document.getElementById('messageInput').disabled);
   const input=page.locator('#messageInput');
   for(const text of ['一句话','先放慢一点。\n把今天发生的事写下来，\n不用急着寻找答案。\n慢慢梳理自己的想法。','较长的输入内容，仍然可以自在地换行。\n'.repeat(60)]) {
    await input.fill(text);await input.press('ControlOrMeta+End');await input.press('Shift+Enter');await input.press('x');
    await page.mouse.move(0,0);
    const metrics=await page.evaluate(()=>{
     const input=document.getElementById('messageInput'),button=document.getElementById('sendButton'),composer=document.querySelector('.composer');
     const r=button.getBoundingClientRect(),c=composer.getBoundingClientRect(),i=input.getBoundingClientRect();
     return {right:c.right-r.right,bottom:c.bottom-r.bottom,inside:r.left>c.left&&r.right<c.right&&r.top>=c.top&&r.bottom<c.bottom,buttonWidth:r.width,paddingRight:parseFloat(getComputedStyle(input).paddingRight),height:i.height,overflow:getComputedStyle(input).overflowY,documentWidth:document.documentElement.scrollWidth,text:input.value};
    });
    assert.equal(metrics.inside,true,'Send stays inside the shared input surface');
    assert.equal(metrics.right,8);assert.equal(metrics.bottom,8);
    assert.equal(metrics.buttonWidth,44);assert.ok(metrics.paddingRight>=60,'Text never runs under the send button');
    assert.equal(metrics.overflow,'hidden');assert.ok(metrics.height<=160);assert.ok(metrics.documentWidth<=width);
    assert.equal(metrics.text,text+'\nx');
   }
   // The complete long draft is sent once and the input returns to one line.
   const complete=await input.inputValue();await page.locator('#sendButton').click();
   assert.equal(await page.locator('.message:last-child .message-text').textContent(),complete.trim());
   assert.equal(await input.inputValue(),'');assert.ok((await input.boundingBox()).height<=62);
   if(width===320&&theme==='light') {
    await input.fill('可以先放慢一点，\n把今天的感受写下来。\n不急着找到答案，\n也不用一次说完。');
    await page.waitForTimeout(300);await page.screenshot({path:path.join(output,'multiline-zh.png')});
   }
   await context.close();
  }
  console.log('Integrated send button, multiline caret editing, complete sends and narrow layouts passed in both themes.');
 } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1});

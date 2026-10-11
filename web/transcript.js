(function(root){
'use strict';
// Variable-height virtualization: scroll continuously through the full history;
// only the viewport and a small overscan region have DOM nodes or blur layers.
class Transcript {
 constructor(container,createRow){
  this.container=container;this.createRow=createRow;this.messages=[];this.ids=[];this.heights=new Map();this.estimates=new Map();this.prefix=[0];this.range='';this.frame=0;this.pinned=true;
  this.top=document.createElement('div');this.window=document.createElement('div');this.bottom=document.createElement('div');this.window.className='message-window';
  this.top.setAttribute('aria-hidden','true');this.bottom.setAttribute('aria-hidden','true');container.replaceChildren(this.top,this.window,this.bottom);
  container.addEventListener('scroll',()=>{this.pinned=container.scrollHeight-container.scrollTop-container.clientHeight<48;this.schedule();},{passive:true});
  this.width=container.clientWidth;
  this.observer=new ResizeObserver(()=>{if(container.clientWidth!==this.width){this.width=container.clientWidth;this.heights.clear();this.estimates.clear();this.rebuild();this.range='';}this.schedule();});this.observer.observe(container);
 }
 estimate(m){const font=this.font||16;const columns=this.columns||20;const lines=m.content.split('\n').reduce((n,s)=>n+Math.max(1,Math.ceil(Array.from(s).length/columns)),0);return Math.max(76,lines*font*1.5+62);}
 rebuild(){this.font=parseFloat(getComputedStyle(this.container).fontSize)||16;this.columns=Math.max(8,Math.floor((this.width*.85-64)/(this.font*.65)));const next=new Float64Array(this.messages.length+1);for(let i=0;i<this.messages.length;i++){const m=this.messages[i];let height=this.heights.get(m.id)||this.estimates.get(m.id);if(!height){height=this.estimate(m);this.estimates.set(m.id,height);}next[i+1]=next[i]+height;}this.prefix=next;}
 index(y){let lo=0,hi=this.messages.length;while(lo<hi){const mid=(lo+hi)>>>1;if(this.prefix[mid+1]<=y)lo=mid+1;else hi=mid;}return Math.min(lo,Math.max(0,this.messages.length-1));}
 setMessages(messages,{bottom=false}={}){
  const anchor=this.index(Math.max(0,this.container.scrollTop-16));const id=this.ids[anchor];const offset=this.container.scrollTop-this.prefix[anchor];
  this.messages=messages;this.ids=messages.map(m=>m.id);this.rebuild();this.range='';
  this.pinned=bottom;
  if(bottom)this.container.scrollTop=this.prefix.at(-1);
  else if(id){const i=this.ids.indexOf(id);if(i>=0)this.container.scrollTop=this.prefix[i]+offset;}
  this.render();if(bottom){this.container.scrollTop=this.container.scrollHeight;this.schedule();}
 }
 schedule(){if(!this.frame)this.frame=requestAnimationFrame(()=>{this.frame=0;this.render();});}
 render(){
  if(!this.messages.length){this.top.style.height=this.bottom.style.height='0px';finishReveals(this.window);this.window.replaceChildren();return;}
  const y=Math.max(0,this.container.scrollTop-16),start=Math.max(0,this.index(y)-5),end=Math.min(this.messages.length,this.index(y+this.container.clientHeight)+6,start+100);
  const key=start+':'+end;
  if(this.range!==key){this.range=key;const nodes=[];for(let i=start;i<end;i++){const row=this.createRow(this.messages[i],i);row.dataset.messageId=this.messages[i].id;nodes.push(row);}finishReveals(this.window);this.window.replaceChildren(...nodes);}
  this.top.style.height=this.prefix[start]+'px';this.bottom.style.height=(this.prefix.at(-1)-this.prefix[end])+'px';
  // Measure only the rendered range, then correct spacer estimates while keeping
  // the visible message anchored. Batched reads precede all layout writes.
  const anchor=this.index(y),offset=this.container.scrollTop-this.prefix[anchor];let changed=false;
  const measured=Array.from(this.window.children).map(row=>({id:row.dataset.messageId,height:row.getBoundingClientRect().height+18}));
  for(const m of measured)if(Math.abs((this.heights.get(m.id)||0)-m.height)>1){this.heights.set(m.id,m.height);changed=true;}
  if(changed){this.rebuild();this.top.style.height=this.prefix[start]+'px';this.bottom.style.height=(this.prefix.at(-1)-this.prefix[end])+'px';this.container.scrollTop=this.pinned?this.container.scrollHeight:this.prefix[anchor]+offset;this.schedule();}
 }
}
const activeReveals=new WeakMap();
const reducedMotion=root.matchMedia('(prefers-reduced-motion: reduce)');
function finishReveal(element){
 const timer=activeReveals.get(element);if(timer)clearTimeout(timer);
 activeReveals.delete(element);
 if(element.dataset.reveal!==undefined){element.textContent=element.dataset.reveal;delete element.dataset.reveal;}
}
function finishReveals(container){for(const element of container.querySelectorAll('[data-reveal]'))finishReveal(element);}
function revealText(element,text){
 finishReveal(element);
 if(reducedMotion.matches||text.length>800||document.hidden){element.textContent=text;return;}
 const glyphs=typeof Intl.Segmenter==='function'?Array.from(new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(text),s=>s.segment):Array.from(text);
 if(!glyphs.length){element.textContent=text;return;}
 const groupSize=Math.ceil(glyphs.length/160),groups=Math.ceil(glyphs.length/groupSize);
 // Short phrases have a deliberate cadence. Longer passages share a bounded
 // six-second reveal budget and at most 160 animated layers.
 const lastDelay=groups>1?Math.min(6000,Math.max(700,(glyphs.length-1)*65)):0;
 const duration=groups===1?600:420,fragment=document.createDocumentFragment();
 for(let i=0;i<groups;i++){
  const span=document.createElement('span');span.className='revealed-glyph';span.textContent=glyphs.slice(i*groupSize,(i+1)*groupSize).join('');
  span.style.animationDelay=(groups>1?lastDelay*i/(groups-1):0)+'ms';span.style.animationDuration=duration+'ms';fragment.appendChild(span);
 }
 element.dataset.reveal=text;element.replaceChildren(fragment);
 activeReveals.set(element,setTimeout(()=>finishReveal(element),lastDelay+duration+100));
}
reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches)finishReveals(document);});
root.CWGTranscript={Transcript,revealText,finishReveals};
})(globalThis);

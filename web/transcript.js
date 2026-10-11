(function(root){
'use strict';
// Variable-height virtualization: scroll continuously through the full history;
// only the viewport and a small overscan region have DOM nodes or blur layers.
class Transcript {
 constructor(container,createRow){
  this.container=container;this.createRow=createRow;this.messages=[];this.ids=[];this.heights=new Map();this.estimates=new Map();this.prefix=[0];this.range='';this.frame=0;this.pinned=true;this.animations=new Set();this.motionFrame=0;
  this.top=document.createElement('div');this.window=document.createElement('div');this.bottom=document.createElement('div');this.window.className='message-window';
  this.top.setAttribute('aria-hidden','true');this.bottom.setAttribute('aria-hidden','true');container.replaceChildren(this.top,this.window,this.bottom);
  container.addEventListener('scroll',()=>{this.pinned=container.scrollHeight-container.scrollTop-container.clientHeight<48;this.schedule();},{passive:true});
  for(const event of ['wheel','touchstart','pointerdown'])container.addEventListener(event,()=>this.stopMotion(),{passive:true});
  reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches)this.stopMotion();});
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
 stopMotion(){if(this.motionFrame)cancelAnimationFrame(this.motionFrame);this.motionFrame=0;for(const animation of this.animations)animation.cancel();this.animations.clear();}
 append(messages,id){
  this.stopMotion();
  const bounds=this.container.getBoundingClientRect(),previous=new Map();
  for(const row of this.window.children){const rect=row.getBoundingClientRect();if(rect.bottom>bounds.top&&rect.top<bounds.bottom)previous.set(row.dataset.messageId,rect.top);}
  this.setMessages(messages,{bottom:true});
  if(reducedMotion.matches||document.hidden||root.cwgActive===false)return;
  this.motionFrame=requestAnimationFrame(()=>{
   this.motionFrame=0;
   const positions=Array.from(this.window.children).slice(-24).map(row=>({row,y:row.getBoundingClientRect().top}));
   for(const {row,y} of positions){
    const fresh=row.dataset.messageId===id,old=previous.get(row.dataset.messageId),delta=fresh?12:old===undefined?0:old-y;
    if(!delta||Math.abs(delta)>this.container.clientHeight)continue;
    const animation=row.animate([{transform:`translateY(${delta}px)`,opacity:fresh?.65:1},{transform:'translateY(0)',opacity:1}],{duration:240,easing:'cubic-bezier(.2,.8,.2,1)'});
    this.animations.add(animation);animation.finished.then(()=>this.animations.delete(animation),()=>this.animations.delete(animation));
   }
  });
 }
 render(){
  if(!this.messages.length){this.top.style.height=this.bottom.style.height='0px';this.stopMotion();this.window.replaceChildren();return;}
  const y=Math.max(0,this.container.scrollTop-16),start=Math.max(0,this.index(y)-5),end=Math.min(this.messages.length,this.index(y+this.container.clientHeight)+6,start+100);
  const key=start+':'+end;
  if(this.range!==key){this.range=key;const nodes=[];for(let i=start;i<end;i++){const row=this.createRow(this.messages[i],i);row.dataset.messageId=this.messages[i].id;nodes.push(row);}for(const animation of this.animations)animation.cancel();this.animations.clear();this.window.replaceChildren(...nodes);}
  this.top.style.height=this.prefix[start]+'px';this.bottom.style.height=(this.prefix.at(-1)-this.prefix[end])+'px';
  // Measure only the rendered range, then correct spacer estimates while keeping
  // the visible message anchored. Batched reads precede all layout writes.
  const anchor=this.index(y),offset=this.container.scrollTop-this.prefix[anchor];let changed=false;
  const measured=Array.from(this.window.children).map(row=>({id:row.dataset.messageId,height:row.getBoundingClientRect().height+18}));
  for(const m of measured)if(Math.abs((this.heights.get(m.id)||0)-m.height)>1){this.heights.set(m.id,m.height);changed=true;}
  if(changed){this.rebuild();this.top.style.height=this.prefix[start]+'px';this.bottom.style.height=(this.prefix.at(-1)-this.prefix[end])+'px';this.container.scrollTop=this.pinned?this.container.scrollHeight:this.prefix[anchor]+offset;this.schedule();}
 }
}
const reducedMotion=root.matchMedia('(prefers-reduced-motion: reduce)');
// The browser keeps native wheel, touch and keyboard scrolling. This overlay
// only draws position and supplies an accessible drag/keyboard handle.
class ScrollIndicator {
 constructor(container){
  this.container=container;this.frame=0;this.timer=0;this.drag=null;this.focused=false;
  const track=this.track=document.createElement('div'),thumb=this.thumb=document.createElement('div');
  track.className='scroll-indicator';thumb.className='scroll-thumb';track.hidden=true;
  track.setAttribute('role','scrollbar');track.setAttribute('aria-controls',container.id);track.setAttribute('aria-orientation','vertical');track.setAttribute('aria-label',document.documentElement.lang.startsWith('zh')?'滚动对话':'Scroll conversation');track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax','100');
  track.appendChild(thumb);container.parentElement.appendChild(track);
  container.addEventListener('scroll',()=>{this.schedule();this.show();},{passive:true});
  container.addEventListener('pointermove',e=>{if(e.clientX>=container.getBoundingClientRect().right-24)this.show();},{passive:true});
  track.addEventListener('pointerenter',()=>this.show());
  track.addEventListener('focus',()=>{this.focused=true;this.show();});
  track.addEventListener('blur',()=>{this.focused=false;this.show();});
  track.addEventListener('pointerdown',e=>{
   if(e.button!==0||!this.max)return;
   e.preventDefault();this.show();track.setPointerCapture(e.pointerId);
   if(e.target!==thumb)this.scrollToRatio((e.clientY-track.getBoundingClientRect().top-this.thumbHeight/2)/this.travel);
   this.drag={id:e.pointerId,y:e.clientY,scroll:container.scrollTop};
  });
  track.addEventListener('pointermove',e=>{if(this.drag?.id===e.pointerId){container.scrollTop=this.drag.scroll+(e.clientY-this.drag.y)*this.max/this.travel;this.show();}});
  const end=e=>{if(this.drag?.id===e.pointerId){this.drag=null;this.show();}};
  track.addEventListener('pointerup',end);track.addEventListener('lostpointercapture',end);track.addEventListener('pointercancel',end);
  track.addEventListener('keydown',e=>{
   const jumps={ArrowUp:-40,ArrowDown:40,PageUp:-container.clientHeight*.85,PageDown:container.clientHeight*.85};
   if(e.key==='Home')container.scrollTop=0;
   else if(e.key==='End')container.scrollTop=this.max;
   else if(e.key in jumps)container.scrollTop+=jumps[e.key];else return;
   e.preventDefault();this.schedule();this.show();
  });
  this.observer=new ResizeObserver(()=>this.schedule());this.observer.observe(container);
  for(const child of container.children)this.observer.observe(child);
  this.schedule();
 }
 scrollToRatio(ratio){this.container.scrollTop=Math.max(0,Math.min(1,ratio))*this.max;this.schedule();}
 schedule(){if(!this.frame)this.frame=requestAnimationFrame(()=>{this.frame=0;this.update();});}
 update(){
  const {container,track,thumb}=this;this.max=Math.max(0,container.scrollHeight-container.clientHeight);
  const available=this.max>1;track.hidden=!available;track.tabIndex=available?0:-1;
  if(!available){this.hide();return;}
  const height=track.clientHeight;this.thumbHeight=Math.min(height,Math.max(32,height*container.clientHeight/container.scrollHeight));this.travel=Math.max(1,height-this.thumbHeight);
  thumb.style.height=this.thumbHeight+'px';thumb.style.transform=`translateY(${this.travel*container.scrollTop/this.max}px)`;
  track.setAttribute('aria-valuenow',String(Math.round(100*container.scrollTop/this.max)));
 }
 show(){
  if(document.hidden||root.cwgActive===false)return;
  this.update();if(this.track.hidden)return;
  clearTimeout(this.timer);this.track.classList.add('visible');
  this.timer=setTimeout(()=>{if(!this.drag&&!this.focused)this.track.classList.remove('visible');},800);
 }
 hide(){clearTimeout(this.timer);this.timer=0;this.track.classList.remove('visible');}
}
root.CWGTranscript={Transcript,ScrollIndicator};
})(globalThis);

/* Export formats shared by the standalone HTML and GitHub Pages. */
(function(root) {
'use strict';
const DEFAULT_SYSTEM = 'You are the reflective voice of inner wisdom in a self-dialogue. Respond thoughtfully and compassionately, helping the seeker examine their own beliefs and choices.';
function exportError(code,message) { const error=new Error(message);error.code=code;return error; }
function validate(records, preserveOrder=false) {
 if (!Array.isArray(records)) throw new Error('The backup must contain a messages array.');
 const seen=new Set();
 return records.map((m,i)=>{
  if (!m || !['user','assistant','seeker','sage'].includes(m.role)) throw new Error(`Invalid role in message ${i+1}.`);
  const content=m.content??m.text;
  if(typeof content!=='string' || !content.trim()) throw new Error(`Empty or invalid text in message ${i+1}.`);
  const timestamp=m.timestamp??m.createdAt;
  if(typeof timestamp!=='string'||!Number.isFinite(Date.parse(timestamp))) throw new Error(`Invalid timestamp in message ${i+1}.`);
  const role=['user','seeker'].includes(m.role)?'user':'assistant';
  const id=typeof m.id==='string'&&m.id&&!seen.has(m.id)?m.id:globalThis.crypto?.randomUUID?.()??`import-${Date.now()}-${i}`;
  seen.add(id);
  return {id,role,content,displayName:typeof m.displayName==='string'?m.displayName:role==='user'?'User':'God',timestamp,order:preserveOrder&&Number.isSafeInteger(m.order)&&m.order>=0?m.order:i};
 });
}
function normalize(records) {
 const turns=[];let merged=0;
 for(const m of records){
  if(!m||!['user','assistant'].includes(m.role)||typeof m.content!=='string'||!m.content.trim())throw exportError('invalid_conversation','Conversation contains an invalid message. Export a backup first.');
  if(turns.at(-1)?.role===m.role){turns.at(-1).content+='\n\n'+m.content;merged++;}
  else turns.push({role:m.role,content:m.content});
 }
 return {turns,merged};
}
function createExport(records, options={}) {
 const {format='backup',system='',model='',nextMessage='',contextTurns=4,preview=false}=options;
 const date=new Date().toISOString().slice(0,10);const warnings=[],notices=[];
 let data,extension='json',mime='application/json;charset=utf-8',examples=0;
 if(format==='backup')data=preview?'':{schemaVersion:2,exportedAt:new Date().toISOString(),messages:records.map(m=>({...m}))};
 else if(format==='text'){extension='txt';mime='text/plain;charset=utf-8';data=preview?'':records.map(m=>`${m.displayName|| (m.role==='user'?'User':'God')} [${m.timestamp}]:\n${m.content}`).join('\n\n');}
 else {
  const normalized=normalize(records);const turns=normalized.turns;
  if(normalized.merged){warnings.push(`${normalized.merged} adjacent same-role messages merged without removing text.`);notices.push('grouped_messages');}
  const prompt=system.trim();
  const withSystem=t=>prompt?[{role:'system',content:prompt},...t]:t;
  if (format.startsWith('legacy_')) {
   warnings.push('Legacy format: use the structured API / messages exports for current models. The complete backup retains every original turn.');
   switch(format) {
    case 'legacy_claude':extension='txt';mime='text/plain;charset=utf-8';data=(prompt?'System: '+prompt+'\n\n':'')+turns.map(m=>(m.role==='user'?'Human':'Assistant')+': '+m.content).join('\n\n');break;
    case 'legacy_llama': {
     if(turns[0]?.role!=='user')throw exportError('user_first','Llama 2 INST format needs an initial user message. Use messages history to retain an assistant-first conversation.');
     extension='txt';mime='text/plain;charset=utf-8';
     data=turns.map((m,i)=>m.role==='user'?'<s>[INST] '+(i===0&&prompt?'<<SYS>>\n'+prompt+'\n<</SYS>>\n\n':'')+m.content+' [/INST]':m.content+' </s>').join('\n');break;
    }
    case 'legacy_sharegpt':data={conversations:withSystem(turns).map(m=>({from:m.role==='user'?'human':m.role==='assistant'?'gpt':'system',value:m.content}))};break;
    case 'legacy_alpaca':data=turns.flatMap((m,i)=>m.role==='user'&&turns[i+1]?.role==='assistant'?[{instruction:prompt||m.content,input:prompt?m.content:'',output:turns[i+1].content}]:[]);if(!data.length)throw exportError('no_answers','Alpaca requires an answered user turn.');warnings.push('Alpaca contains answered question / answer pairs without previous conversation context.');notices.push('pairs_only');break;
    default:throw exportError('unknown_format','Unknown legacy format.');
   }
  }else if(['sft_openai','sft_messages','sft_sharegpt'].includes(format)){
   if(!Number.isInteger(contextTurns)||contextTurns<0||contextTurns>50)throw exportError('invalid_context','Context must be between 0 and 50 previous exchanges.');
   const leading=turns[0]?.role==='assistant'?1:0;
   const training=turns.slice(leading);const rows=[];
   if(leading){warnings.push('The initial assistant-only turn is excluded from training because it has no user prompt. It remains in the full backup.');notices.push('opening_reply');}
   if(training.at(-1)?.role==='user'){warnings.push('The final unanswered user turn is excluded from training; it remains in API history and the full backup.');notices.push('unanswered_question');}
   for(let i=1;i<training.length;i+=2){
    if(training[i].role!=='assistant')throw exportError('invalid_conversation','Training turns are not alternating.');
    const start=Math.max(0,i-1-contextTurns*2);
    const window=training.slice(start,i+1).map((m,j,a)=>({...m,...(format==='sft_openai'&&m.role==='assistant'?{weight:j===a.length-1?1:0}:{})}));
    if(format==='sft_sharegpt')rows.push({conversations:withSystem(window).map(m=>({from:m.role==='user'?'human':m.role==='assistant'?'gpt':'system',value:m.content}))});
    else rows.push({messages:withSystem(window)});
   }
   if(!rows.length)throw exportError('no_answers','Fine-tuning requires at least one user question followed by an assistant answer.');
   if(format==='sft_openai'&&rows.length<10){warnings.push('OpenAI fine-tuning requires at least 10 examples; combine additional reviewed conversations before uploading.');notices.push('too_few_examples');}
   examples=rows.length;extension='jsonl';mime='application/jsonl;charset=utf-8';data=preview?'':rows.map(r=>JSON.stringify(r)).join('\n')+'\n';
   warnings.push('Context is limited by exchanges, not tokens. Check the chosen model’s token limit before training.');
  }else{
   if(!turns.length)throw exportError('empty','There are no messages to export.');
   const history=turns.map(m=>({...m}));
   if(nextMessage.trim())history.push({role:'user',content:nextMessage.trim()});
   if(history[0]?.role==='assistant'&&format!=='api_responses'&&format!=='history')throw exportError('user_first','This API export needs an initial user message. Restore the first question, or use full backup / messages history.');
   if(format!=='history'&&history.at(-1)?.role!=='user')throw exportError('question_required','To continue with the model, enter your next question below, or choose messages history to export without adding one.');
   const requireModel=()=>{if(!model.trim())throw exportError('model_required','Enter the model ID supplied by your API provider.');return model.trim();};
   switch(format){
    case 'history':data={messages:withSystem(history)};break;
    case 'api_chat':data={model:requireModel(),messages:withSystem(history)};break;
    case 'api_responses':data={model:requireModel(),input:history,...(prompt?{instructions:prompt}:{})};break;
    case 'api_claude':data={model:requireModel(),max_tokens:2048,messages:history,...(prompt?{system:prompt}:{})};break;
    case 'api_gemini':data={contents:history.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]})),...(prompt?{systemInstruction:{parts:[{text:prompt}]}}:{})};break;
    default:throw exportError('unknown_format','Unknown export format.');
   }
   if(nextMessage.trim())warnings.push('Your next question is added only to this export, not to your saved conversation.');
  }
 }
 return {content:preview?'':typeof data==='string'?data:JSON.stringify(data,null,2),filename:`cwg-${format}-${date}.${extension}`,mime,warnings,notices,examples,messageCount:records.length};
}
root.CWGExports={DEFAULT_SYSTEM,validate,normalize,createExport};
if(typeof module!=='undefined')module.exports=root.CWGExports;
})(globalThis);

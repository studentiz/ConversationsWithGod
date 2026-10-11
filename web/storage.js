(function(root){
'use strict';
function transaction(db,mode,operation){return new Promise((resolve,reject)=>{const tx=db.transaction('messages',mode);let result;tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error||new Error('Storage transaction failed.'));tx.onabort=()=>reject(tx.error||new Error('Storage transaction aborted.'));const req=operation(tx.objectStore('messages'));if(req)req.onsuccess=()=>{result=req.result;};});}
async function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open('cwg-history',1);req.onupgradeneeded=()=>req.result.createObjectStore('messages',{keyPath:'id'});req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);req.onblocked=()=>reject(new Error('Close another tab to update conversation storage.'));});}
async function openRepository(){
 let legacy,legacyError;try{legacy=localStorage.getItem('chat_messages');}catch(error){legacyError=error;}let db;
 try{db=await openDB();}catch(error){
  // A standalone file / private browser may deny IndexedDB. Keep the original storage contract.
  if(legacyError)throw legacyError;
  const messages=root.CWGExports.validate(legacy?JSON.parse(legacy):[]);
  const write=async all=>{await new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));localStorage.setItem('chat_messages',JSON.stringify(all));};
  return {messages,kind:'localStorage',append:(_,all)=>write(all),remove:(_,all)=>write(all),replace:write};
 }
 try{
 let stored=await transaction(db,'readonly',store=>store.getAll());
 if(!stored.length&&legacy){
  stored=root.CWGExports.validate(JSON.parse(legacy));
  await transaction(db,'readwrite',store=>{for(const m of stored)store.put(m);});
  // Remove only after the atomic migration succeeds; failures leave the source untouched.
  try{localStorage.removeItem('chat_messages');}catch{}
 }
 stored.sort((a,b)=>a.order-b.order);
 return {messages:root.CWGExports.validate(stored,true),kind:'indexedDB',append:m=>transaction(db,'readwrite',store=>store.put(m)),remove:id=>transaction(db,'readwrite',store=>store.delete(id)),replace:messages=>transaction(db,'readwrite',store=>{store.clear();for(const m of messages)store.put(m);})};
 }catch(error){db.close();throw error;}
}
root.CWGStorage={openRepository};
})(globalThis);

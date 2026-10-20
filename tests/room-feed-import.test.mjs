import {test} from 'node:test';import assert from 'node:assert/strict';
import {prepare,fingerprint,listingData,createImportHandler,hostPhoto} from '../base44/functions/importRoomPost/handler.js';
test('Missing optional branch cache permits AI; other cache failures stop processing',async()=>{
 for(const [status,message,expected] of [[404,'Entity schema ScrapingPilotPost not found in app',true],[403,'Forbidden',false],[500,'Service unavailable',false]]){
 let called=false;
 const h=createImportHandler(()=>({auth:{me:async()=>({role:'admin'})},asServiceRole:{entities:{RoomListing:{filter:async()=>[]},ScrapingPilotPost:{filter:async()=>{throw Object.assign(new Error(message),{status});}}}},integrations:{Core:{InvokeLLM:async()=>{called=true;throw Error('test AI boundary');}}}}));
 await h(new Request('https://example.com',{method:'POST',body:JSON.stringify({post})}));
 assert.equal(called,expected);
 }
});
test('Photo hosting rejects redirects and unsupported sources; uploads verified image bytes',async()=>{
 const original=globalThis.fetch;let uploads=0;
 const client={integrations:{Core:{UploadFile:async({file})=>{uploads++;assert.equal(file.type,'image/jpeg');assert.equal(file.size,3);return {file_url:'https://storage.example/room.jpg'};}}}};
 try{
 await assert.rejects(()=>hostPhoto('https://example.com/a.jpg',client));
 globalThis.fetch=async(_url,opts)=>{assert.equal(opts.redirect,'manual');return new Response(null,{status:302,headers:{location:'https://example.com'}});};
 await assert.rejects(()=>hostPhoto('https://scontent.fbcdn.net/a.jpg',client));assert.equal(uploads,0);
 globalThis.fetch=async()=>new Response(new Uint8Array([1,2,3]),{headers:{'content-type':'image/jpeg'}});
 assert.equal(await hostPhoto('https://scontent.fbcdn.net/a.jpg',client),'https://storage.example/room.jpg');assert.equal(uploads,1);
 }finally{globalThis.fetch=original;}
});
const post={facebookUrl:'https://www.facebook.com/groups/462353464298357/',url:'https://www.facebook.com/groups/462353464298357/posts/123/',text:'חדר 0501234567',photos:['https://scontent.fbcdn.net/a.jpg'],time:'2026-10-19T10:00:00Z'};
test('Only selected groups, source post URLs and real inputs',()=>{assert.equal(prepare(post).groupCity,'ירושלים');assert.throws(()=>prepare({...post,facebookUrl:'https://www.facebook.com/groups/111/'}));assert.throws(()=>prepare({...post,url:'https://example.com/'}));assert.throws(()=>prepare({...post,demo:true}));});
test('Dedup ignores whitespace punctuation but not room numbers',async()=>{assert.equal(await fingerprint('חדר יפה! 2500'),await fingerprint('חדר  יפה 2500'));assert.notEqual(await fingerprint('חדר 2500'),await fingerprint('חדר 2600'));});
test('Unknown prices and occupants are omitted; original dates preserved',()=>{const r={rooms:[],rentalType:'unknown',city:'ירושלים',address:'',entryText:'אמצע נובמבר',endText:'',furnitureText:'',freeText:'מרפסת',billsText:'',shabbatPolicy:'unknown',kosherPolicy:'unknown',existingRoommates:null};const d=listingData(prepare(post),r,['https://storage.example/a.jpg'],'key','content');assert.equal(d.entry_text,'אמצע נובמבר');assert.equal(d.source_posted_at,post.time);assert.ok(!('price'in d));assert.ok(!('roommates'in d));assert.equal(d.owner_id,'facebook:key');});
test('Anonymous and regular users cannot import',async()=>{for(const user of [null,{role:'user'}]){const h=createImportHandler(()=>({auth:{me:async()=>user}}));assert.equal((await h(new Request('https://example.com',{method:'POST',body:'{}'}))).status,403);}});
test('Missing photos/phone is rejected before AI or database access',async()=>{let called=false;const h=createImportHandler(()=>({auth:{me:async()=>({role:'admin'})},asServiceRole:{entities:{}},integrations:{Core:{InvokeLLM:()=>{called=true;}}}}));for(const p of [{...post,photos:[]},{...post,text:'חדר פנוי'}]){const res=await h(new Request('https://example.com',{method:'POST',body:JSON.stringify({post:p})}));assert.equal((await res.json()).status,'filtered');}assert.equal(called,false);});
test('Existing source never invokes AI or uploads photos',async()=>{let called=false;const h=createImportHandler(()=>({auth:{me:async()=>({role:'admin'})},asServiceRole:{entities:{RoomListing:{filter:async()=>[{id:'existing'}]}}},integrations:{Core:{InvokeLLM:()=>{called=true;}}}}));const res=await h(new Request('https://example.com',{method:'POST',body:JSON.stringify({post})}));assert.equal((await res.json()).status,'duplicate');assert.equal(called,false);});

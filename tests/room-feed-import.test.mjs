import {test} from 'node:test';import assert from 'node:assert/strict';
import {prepare,fingerprint,listingData,createImportHandler,hostPhoto,sourceKey,duplicateResponse} from '../base44/functions/importRoomPost/handler.js';
test('Import does not access or persist a raw-post cache',async()=>{
 let called=false;const entities=new Proxy({RoomListing:{filter:async()=>[]}},{get(target,key){assert.equal(key,'RoomListing');return target[key];}});
 const h=createImportHandler(()=>({auth:{me:async()=>({role:'admin'})},asServiceRole:{entities},integrations:{Core:{InvokeLLM:async()=>{called=true;throw Error('test AI boundary');}}}}));
 await h(new Request('https://example.com',{method:'POST',body:JSON.stringify({post})}));assert.equal(called,true);
});
test('Post identifiers ignore permalink vs posts URL spelling',async()=>{
 const a=prepare(post),b=prepare({...post,url:post.url.replace('/posts/','/permalink/')});
 assert.equal(await sourceKey(a),await sourceKey(b));
});
test('Identical repost refreshes only a newer published card; retries and older dates do not extend it',async()=>{
 const changes=[],entity={update:async(id,data)=>changes.push({id,...data})};
 const record={id:'room',status:'published',source_posted_at:'2026-10-10T00:00:00Z'};
 for(const date of ['2026-10-09T00:00:00Z','2026-10-10T00:00:00Z','invalid'])await duplicateResponse(entity,record,{postedAt:date,sourceUrl:'url'});
 await duplicateResponse(entity,{...record,status:'closed'},{postedAt:'2026-10-11T00:00:00Z',sourceUrl:'url'});
 assert.equal(changes.length,0);
 await duplicateResponse(entity,record,{postedAt:'2026-10-11T00:00:00Z',sourceUrl:'url'});
 assert.deepEqual(changes,[{id:'room',source_posted_at:'2026-10-11T00:00:00Z',source_url:'url'}]);
});
test('Old posts are rejected before database access or AI even without retained tombstones',async()=>{
 const h=createImportHandler(()=>({auth:{me:async()=>({role:'admin'})},asServiceRole:{entities:{}}}));
 const response=await h(new Request('https://example.com',{method:'POST',body:JSON.stringify({post:{...post,time:'2020-01-01T00:00:00Z'}})}));
 assert.equal((await response.json()).reason,'feed.expired');
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
const post={facebookUrl:'https://www.facebook.com/groups/462353464298357/',url:'https://www.facebook.com/groups/462353464298357/posts/123/',text:'חדר 0501234567',photos:['https://scontent.fbcdn.net/a.jpg'],time:new Date(Date.now()-3600000).toISOString()};
test('Only selected groups, source post URLs and real inputs',()=>{assert.equal(prepare(post).groupCity,'ירושלים');assert.throws(()=>prepare({...post,facebookUrl:'https://www.facebook.com/groups/111/'}));assert.throws(()=>prepare({...post,url:'https://example.com/'}));assert.throws(()=>prepare({...post,demo:true}));});
test('Dedup ignores whitespace punctuation but not room numbers',async()=>{assert.equal(await fingerprint('חדר יפה! 2500'),await fingerprint('חדר  יפה 2500'));assert.notEqual(await fingerprint('חדר 2500'),await fingerprint('חדר 2600'));});
test('Unknown prices and occupants are omitted; original dates preserved',()=>{const r={rooms:[],rentalType:'unknown',city:'ירושלים',address:'',entryText:'אמצע נובמבר',endText:'',furnitureText:'',freeText:'מרפסת',billsText:'',shabbatPolicy:'unknown',kosherPolicy:'unknown',existingRoommates:null};const d=listingData(prepare(post),r,['https://storage.example/a.jpg'],'key','content');assert.equal(d.entry_text,'אמצע נובמבר');assert.equal(d.source_posted_at,post.time);assert.ok(!('price'in d));assert.ok(!('roommates'in d));assert.equal(d.owner_id,'facebook:key');});
test('Anonymous and regular users cannot import',async()=>{for(const user of [null,{role:'user'}]){const h=createImportHandler(()=>({auth:{me:async()=>user}}));assert.equal((await h(new Request('https://example.com',{method:'POST',body:'{}'}))).status,403);}});
test('Missing photos/phone is rejected before AI or database access',async()=>{let called=false;const h=createImportHandler(()=>({auth:{me:async()=>({role:'admin'})},asServiceRole:{entities:{}},integrations:{Core:{InvokeLLM:()=>{called=true;}}}}));for(const p of [{...post,photos:[]},{...post,text:'חדר פנוי'}]){const res=await h(new Request('https://example.com',{method:'POST',body:JSON.stringify({post:p})}));assert.equal((await res.json()).status,'filtered');}assert.equal(called,false);});
test('Existing source never invokes AI or uploads photos',async()=>{let called=false;const h=createImportHandler(()=>({auth:{me:async()=>({role:'admin'})},asServiceRole:{entities:{RoomListing:{filter:async()=>[{id:'existing'}]}}},integrations:{Core:{InvokeLLM:()=>{called=true;}}}}));const res=await h(new Request('https://example.com',{method:'POST',body:JSON.stringify({post})}));assert.equal((await res.json()).status,'duplicate');assert.equal(called,false);});

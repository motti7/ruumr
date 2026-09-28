import test from 'node:test';
import assert from 'node:assert/strict';
import {createHandler,validateRoom} from '../base44/functions/roomListings/handler.js';
const room=()=>({title:'חדר בדיקה',city:'חיפה',address:'רחוב לדוגמה',price:1500,roommates:2,entry_date:'2026-10-01',end_date:'',rental_type:'regular',furniture:'',description:'מודעת בדיקה מומצאת',phone:'050-000-0000',photos:['https://example.test/room.jpg'],owner_confirmation:true});
const req=body=>new Request('https://test.invalid',{method:'POST',body:JSON.stringify(body)});
const client=(user,entity,blocks=[])=>({auth:{me:async()=>user},asServiceRole:{entities:{BannedUser:{filter:async()=>[]},RoomListing:entity,UserBlock:{filter:async q=>blocks.filter(b=>Object.entries(q).every(([k,v])=>b[k]===v))}}}});
test('room creation never needs Profile and ignores forged owner/status fields',async()=>{
  let saved;const handler=createHandler(()=>client({id:'owner',email:'owner@example.test'},{create:async data=>{saved=data;return {id:'room'};}}));
  const response=await handler(req({action:'create',room:{...room(),owner_id:'victim',status:'closed'}}));
  assert.equal(response.status,200);assert.equal(saved.owner_id,'owner');assert.equal(saved.status,'published');assert.equal(saved.phone,'0500000000');
});
test('anonymous and banned users cannot create rooms',async()=>{
  assert.equal((await createHandler(()=>client(null,{}))(req({action:'create',room:room()}))).status,401);
  const banned=client({id:'x'},{});banned.asServiceRole.entities.BannedUser.filter=async()=>[{}];
  assert.equal((await createHandler(()=>banned)(req({action:'create',room:room()}))).status,403);
});
test('publication requires photos, phone, consent and valid sublet dates',()=>{
  for(const change of [{photos:[]},{phone:'123'},{owner_confirmation:false},{price:-1},{roommates:1.5},{city:'נשר'},{entry_date:'2026-02-30'},{rental_type:'sublet',end_date:'2026-09-30'},{photos:['javascript:alert(1)']}])assert.throws(()=>validateRoom({...room(),...change}));
  assert.equal(validateRoom({...room(),rental_type:'sublet',end_date:'2026-11-01'}).end_date,'2026-11-01');
});
test('closing is scoped to authenticated ownership',async()=>{
  let requested,updates=0;
  const handler=createHandler(()=>client({id:'a'},{get:async id=>{requested=id;return {id,owner_id:'someone-else'};},update:async()=>updates++}));
  assert.equal((await handler(req({action:'close',id:'someone-elses-room'}))).status,404);
  assert.equal(requested,'someone-elses-room');assert.equal(updates,0);
});
test('feed excludes blocked owners in both directions and hides owner identifiers',async()=>{
  const handler=createHandler(()=>client({id:'me'},{filter:async()=>[{id:'a',owner_id:'blocked'},{id:'b',owner_id:'blocker'},{id:'c',owner_id:'me',created_by:'private@example.test'}]},[{blocker_id:'me',blocked_id:'blocked'},{blocker_id:'blocker',blocked_id:'me'}]));
  const data=await (await handler(req({action:'list'}))).json();assert.deepEqual(data.records,[{id:'c',is_owner:true}]);
});
test('guests can only list published room fields and cannot close or create',async()=>{
  let query;const handler=createHandler(()=>client(null,{filter:async q=>{query=q;return [{id:'one',title:'Room',owner_id:'owner',created_by:'private',internal_notes:'secret'}];}}));
  const data=await (await handler(req({action:'list'}))).json();
  assert.deepEqual(query,{status:'published'});assert.deepEqual(data.records,[{id:'one',title:'Room',is_owner:false}]);
  for(const action of ['create','close'])assert.equal((await handler(req({action,room:room(),id:'one'}))).status,401);
});

test('owner can close their own room and missing rooms return 404',async()=>{
 let updated;const entity={get:async id=>({id,owner_id:'a'}),update:async(id,data)=>{updated={id,...data};}};
 const handler=createHandler(()=>client({id:'a'},entity));
 assert.equal((await handler(req({action:'close',id:'mine'}))).status,200);assert.deepEqual(updated,{id:'mine',status:'closed'});
 entity.get=async()=>{throw new Error('missing');};assert.equal((await handler(req({action:'close',id:'missing'}))).status,404);
});

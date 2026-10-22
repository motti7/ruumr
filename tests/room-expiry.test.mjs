import test from 'node:test';
import assert from 'node:assert/strict';
import {expiredFacebookRoom,cleanupExpiredRooms,createCleanupHandler} from '../base44/functions/cleanupExpiredRoomListings/logic.js';
const now=Date.parse('2026-10-22T12:00:00Z');
const old={id:'old',source_kind:'facebook',owner_id:'facebook:key',source_posted_at:'2026-10-01T12:00:00Z'};
test('21-day boundary uses publication, not import or sublet dates',()=>{
 assert.equal(expiredFacebookRoom(old,now),true);
 assert.equal(expiredFacebookRoom({...old,source_posted_at:'2026-10-01T12:00:00.001Z'},now),false);
 assert.equal(expiredFacebookRoom({...old,source_posted_at:'2026-10-03T12:00:00Z',end_date:'2026-10-05'},now),false);
 assert.equal(expiredFacebookRoom({...old,imported_at:'2026-10-22T12:00:00Z',rental_type:'sublet'},now),true);
});
test('native rooms, invalid dates and inconsistent ownership are protected',()=>{
 for(const room of [{...old,source_kind:undefined},{...old,source_kind:'manual'},{...old,owner_id:'user123'},{...old,source_posted_at:''},{...old,source_posted_at:'invalid'}])
 assert.equal(expiredFacebookRoom(room,now),false);
});
test('dry run deletes nothing; refreshed rooms are retained; errors do not stop batch',async()=>{
 const deleted=[]; const entity={filter:async()=>[old,{id:'fresh'},{id:'bad'}],get:async id=>id==='fresh'?{...old,id,source_posted_at:'2026-10-22T00:00:00Z'}:id==='bad'?Promise.reject(new Error('temporary')):old,delete:async id=>deleted.push(id)};
 let r=await cleanupExpiredRooms(entity,{now,dryRun:true});
 assert.equal(r.eligible,1);assert.equal(r.failed,1);assert.deepEqual(deleted,[]);
 r=await cleanupExpiredRooms(entity,{now});assert.equal(r.deleted,1);assert.deepEqual(deleted,['old']);assert.equal(r.skipped,1);
});
test('anonymous and normal accounts cannot trigger deletion',async()=>{
 for(const user of [null,{role:'user'}]){
 let touched=false;
 const handler=createCleanupHandler(()=>({auth:{me:async()=>user},asServiceRole:{get entities(){touched=true;throw Error();}}}));
 const res=await handler(new Request('https://example.test',{method:'POST',body:'{}'}));
 assert.equal(res.status,403);assert.equal(touched,false);
 }
});
test('admin cannot override retention or select arbitrary IDs',async()=>{
 let query;const entity={filter:async q=>(query=q,[])};const h=createCleanupHandler(()=>({auth:{me:async()=>({role:'admin'})},asServiceRole:{entities:{RoomListing:entity}}}));
 const res=await h(new Request('https://example.test',{method:'POST',body:JSON.stringify({days:0,id:'native',dry_run:true})}));
 assert.equal(res.status,200);assert.equal((await res.json()).retention_days,21);assert.equal(query.source_kind,'facebook');
});

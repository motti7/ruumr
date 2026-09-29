import test from 'node:test';
import assert from 'node:assert/strict';
import {createHubHandler} from '../base44/functions/roomHub/handler.js';
function setup(){
 let user={id:'owner',email:'owner@example.test'},sequence=0;const db={
  Profile:[{id:'profile',user_id:'partner',name:'Partner',is_visible:true,photos:[]}],RoomPublisher:[{id:'publisher',user_id:'owner',display_name:'Owner',publisher_type:'owner'}],
  RoomListing:[{id:'room',owner_id:'owner',status:'published',title:'Room',city:'חיפה',photos:[],phone:'0500000000'}],RoomPreference:[],SavedRoom:[],RoomOffer:[],RoomOfferMessage:[],BannedUser:[],UserBlock:[],UserReport:[]};
 const entities=Object.fromEntries(Object.keys(db).map(name=>[name,{
  filter:async(q,_sort,limit=1000,skip=0)=>db[name].filter(x=>Object.entries(q).every(([k,v])=>x[k]===v)).slice(skip,skip+limit),
  get:async id=>{const x=db[name].find(x=>x.id===id);if(!x)throw Object.assign(new Error('missing'),{status:404});return x;},
  create:async data=>{const x={...data,id:'new'+(++sequence),created_date:new Date(sequence*1000).toISOString()};db[name].push(x);return x;},
  update:async(id,data)=>{const x=db[name].find(x=>x.id===id);Object.assign(x,data);return x;},
  delete:async id=>{db[name]=db[name].filter(x=>x.id!==id);}
 }]));
 const notifications=[];const handler=createHubHandler(()=>({auth:{me:async()=>user},asServiceRole:{entities}}),async(_,event)=>notifications.push(event));
 const call=async(action,data={})=>{const res=await handler(new Request('https://test.invalid',{method:'POST',body:JSON.stringify({action,...data})}));return {status:res.status,...await res.json()};};
 return {db,entities,notifications,call,as:id=>{user=id?{id,email:id+'@example.test'}:null;}};
}
test('publisher details never create a roommate profile or accept a forged owner id',async()=>{
 const x=setup();await x.call('publisher',{user_id:'partner',display_name:'Updated',publisher_type:'departing',photo:''});
 assert.equal(x.db.Profile.length,1);assert.equal(x.db.RoomPublisher[0].user_id,'owner');assert.equal(x.db.RoomPublisher[0].display_name,'Updated');
});
test('guests and publisher-only accounts cannot save rooms',async()=>{
 const x=setup();assert.equal((await x.call('save',{room_id:'room',saved:true})).status,403);x.as(null);
 assert.equal((await x.call('save',{room_id:'room',saved:true})).status,401);assert.equal(x.db.SavedRoom.length,0);
});
test('saved rooms are private and retain unavailable listing identity',async()=>{
 const x=setup();x.as('partner');assert.equal((await x.call('save',{room_id:'room',saved:true})).status,200);
 x.db.RoomListing[0].status='closed';const saved=await x.call('saved');assert.equal(saved.records[0].status,'closed');assert.equal(saved.records[0].id,'room');assert.equal(saved.records[0].owner_id,undefined);
 x.as('owner');assert.equal((await x.call('saved')).status,403);
 x.as('partner');await x.call('save',{room_id:'room',saved:false});assert.equal(x.db.SavedRoom.length,0);
});
test('room offers do not require a roommate profile for the publisher or create a mutual match',async()=>{
 const x=setup();const r=await x.call('offer',{room_id:'room',profile_id:'profile'});assert.equal(r.status,200);assert.equal(x.db.RoomOffer.length,1);assert.equal(x.notifications.length,1);assert.equal(x.db.Profile.length,1);
 const again=await x.call('offer',{room_id:'room',profile_id:'profile'});assert.equal(again.id,r.id);assert.equal(x.notifications.length,1);
});
test('offers reject somebody else’s room, a closed room, hidden profile and opted-out recipient',async()=>{
 for(const mutate of [x=>x.db.RoomListing[0].owner_id='other',x=>x.db.RoomListing[0].status='closed',x=>x.db.Profile[0].is_visible=false,x=>x.db.RoomPreference.push({user_id:'partner',accept_offers:false})]){
  const x=setup();mutate(x);assert.equal((await x.call('offer',{room_id:'room',profile_id:'profile'})).status,403);assert.equal(x.notifications.length,0);assert.equal(x.db.RoomOffer.length,0);
 }
});
test('room conversation reads, writes and reports reject a third party',async()=>{
 const x=setup();const {id}=await x.call('offer',{room_id:'room',profile_id:'profile'});x.as('stranger');
 for(const action of ['conversation','send','read','report','block'])assert.equal((await x.call(action,{offer_id:id,content:'hello',reason:'spam',details:'',confirm:true})).status,404);
 assert.equal((await x.call('inbox')).records.length,0);assert.equal(x.db.RoomOfferMessage.length,0);
});
test('a global block prevents both chat types and hides room offers in both directions',async()=>{
 const x=setup();const {id}=await x.call('offer',{room_id:'room',profile_id:'profile'});
 x.as('partner');await x.call('block',{offer_id:id,confirm:true});assert.equal(x.db.UserBlock[0].cleanup_pending,true);
 for(const u of ['owner','partner']){x.as(u);for(const action of ['conversation','send'])assert.equal((await x.call(action,{offer_id:id,content:'blocked'})).status,403);assert.equal((await x.call('inbox')).records.length,0);}
});
test('ordinary messages update recipient unread state and do not alter the room snapshot',async()=>{
 const x=setup();const {id}=await x.call('offer',{room_id:'room',profile_id:'profile'});x.db.RoomListing[0].title='Edited';
 await x.call('send',{offer_id:id,content:'Hello'});x.as('partner');const chat=await x.call('conversation',{offer_id:id});assert.equal(chat.offer.room_snapshot.title,'Room');assert.equal(chat.messages[0].content,'Hello');
 await x.call('read',{offer_id:id});assert.equal(x.db.RoomOffer[0].recipient_read,true);await x.call('send',{offer_id:id,content:'Reply'});assert.equal(x.db.RoomOffer[0].owner_read,false);
});
test('report identifies the authenticated counterpart, not a user id supplied by the browser',async()=>{
 const x=setup();const {id}=await x.call('offer',{room_id:'room',profile_id:'profile'});x.as('partner');await x.call('report',{offer_id:id,reported_user_id:'innocent',reason:'spam',details:'Example'});assert.equal(x.db.UserReport[0].reported_user_id,'owner');
});
test('only a roommate profile can change its own offer preference',async()=>{
 const x=setup();assert.equal((await x.call('preference',{accept_offers:false})).status,403);x.as('partner');await x.call('preference',{user_id:'owner',accept_offers:false});assert.equal(x.db.RoomPreference[0].user_id,'partner');x.as('owner');assert.equal((await x.call('candidates')).records.length,0);
});
test('block during message creation is compensated before returning success',async()=>{
 const x=setup();const {id}=await x.call('offer',{room_id:'room',profile_id:'profile'});const create=x.entities.RoomOfferMessage.create;
 x.entities.RoomOfferMessage.create=async data=>{const r=await create(data);x.db.UserBlock.push({pair_key:JSON.stringify(['owner','partner'])});return r;};
 assert.equal((await x.call('send',{offer_id:id,content:'race'})).status,403);assert.equal(x.db.RoomOfferMessage.length,0);
});

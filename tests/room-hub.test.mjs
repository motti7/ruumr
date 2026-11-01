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
test('removed offer actions cannot read profiles or send messages, even with old conversation ids',async()=>{
 const x=setup();
 x.db.RoomOffer.push({id:'old',owner_id:'owner',recipient_id:'partner',room_id:'room'});
 for(const user of ['owner','partner','stranger']){
  x.as(user);
  for(const action of ['candidates','offer','inbox','conversation','send','read','report','block','preference']){
   const result=await x.call(action,{room_id:'room',profile_id:'profile',offer_id:'old',content:'hello',accept_offers:true,confirm:true});
   assert.equal(result.status,400,action);assert.equal(result.records,undefined);
  }
 }
 assert.equal(x.notifications.length,0);assert.equal(x.db.RoomOfferMessage.length,0);assert.equal(x.db.RoomOffer.length,1);
});
test('roommate adds publisher details in the same login without changing the roommate profile',async()=>{
 const x=setup();x.as('partner');const before=structuredClone(x.db.Profile);
 assert.equal((await x.call('publisher',{display_name:'Partner',publisher_type:'departing',photo:''})).status,200);
 const account=await x.call('account');assert.equal(account.has_profile,true);assert.equal(account.publisher.display_name,'Partner');
 assert.deepEqual(x.db.Profile,before);assert.equal('accept_offers' in account,false);
});
test('first time publisher needs no roommate profile and account remains after room closes',async()=>{
 const x=setup();x.as('new-owner');
 await x.call('publisher',{display_name:'New owner',publisher_type:'owner',photo:''});
 const account=await x.call('account');assert.equal(account.has_profile,false);assert.deepEqual(account.rooms,[]);assert.equal(account.publisher.display_name,'New owner');
 x.as('owner');x.db.RoomListing[0].status='closed';assert.equal((await x.call('account')).publisher.display_name,'Owner');
});

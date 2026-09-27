import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../base44/functions/scrapingPilot/handler.js';
import { bucketFor, sourceUrl, normalizePost, validateExtraction, postKey } from '../base44/functions/scrapingPilot/logic.js';
const result = () => ({kind:'room_offer',city:'חיפה',cityBasis:'post',rentalType:'regular_with_early_sublet',address:'',rooms:[{label:'חדר',monthlyRentIls:1200,priceEvidence:'1200 לחודש'}],entryText:'15/10',endText:'',existingRoommates:null,totalOccupants:4,furnitureText:'',shabbatPolicy:'unknown',kosherPolicy:'unknown',billsText:'',freeText:'',reason:'חדר מוצע',warnings:[],evidence:[]});
test('whole apartments and irrelevant ads are excluded even in target cities',()=>{
  for(const kind of ['whole_apartment','advertisement'])assert.equal(bucketFor({...result(),kind}),'excluded');
});
test('seekers remain separate from offers; outside city is excluded even for a seeker',()=>{
  for(const kind of ['room_seeker','roommate_seeker'])assert.equal(bucketFor({...result(),kind}),'leads');
  assert.equal(bucketFor({...result(),kind:'room_seeker',city:'outside'}),'excluded');
  assert.equal(bucketFor({...result(),city:'unknown'}),'review');
  assert.equal(bucketFor({...result(),kind:'unclear'}),'review');
});
test('normal lease with early sublet remains a room offer without collapsing lease type',()=>{
  const r=validateExtraction(result(),'חדר 1200 לחודש');
  assert.equal(bucketFor(r),'rooms');assert.equal(r.rentalType,'regular_with_early_sublet');
});
test('multiple room prices and unknown occupant counts survive validation',()=>{
  const r=result();r.rooms.push({label:'חדר שני',monthlyRentIls:1500,priceEvidence:'1500 לחודש'});
  assert.equal(validateExtraction(r,'1200 לחודש או 1500 לחודש').rooms.length,2);
  assert.equal(r.existingRoommates,null);
});
test('fabricated evidence and unevidenced household policies fail closed',()=>{
  assert.throws(()=>validateExtraction({...result(),evidence:[{field:'city',quote:'not in source'}]},'1200 לחודש'));
  assert.throws(()=>validateExtraction({...result(),shabbatPolicy:'observant'},'1200 לחודש'));
  assert.throws(()=>validateExtraction({...result(),rooms:[{label:'חדר',monthlyRentIls:1500,priceEvidence:''}]},'1200 לחודש'));
});
test('wrong types, unknown categories and negative/non-integer occupants fail closed',()=>{
  for(const changes of [{kind:'offer'},{totalOccupants:2.5},{totalOccupants:-1},{rooms:'1200'},{unexpected:true}])assert.throws(()=>validateExtraction({...result(),...changes},'1200 לחודש'));
});
test('only public Facebook post URLs are clickable; tokens and query params stripped',()=>{
  assert.equal(sourceUrl('https://facebook.com/groups/123/posts/456/?locale=he_IL'),'https://www.facebook.com/groups/123/posts/456/');
  for(const url of ['javascript:alert(1)','https://evil.test/groups/123/posts/456/','https://facebook.com.evil.test/groups/123/posts/456/','https://user:secret@facebook.com/groups/123/posts/456/','https://facebook.com/login','http://facebook.com/groups/123/posts/456/'])assert.equal(sourceUrl(url),'');
});
test('normalization ignores author profile, image URLs and unrelated data, and bounds text',()=>{
  const p=normalizePost({text:' פוסט ',user:{name:'Private'},attachments:['x'],groupCity:'נשר'});
  assert.deepEqual(Object.keys(p),['text','sourceUrl','groupCity','postedAt','demo']);assert.equal(p.groupCity,'');
  assert.throws(()=>normalizePost({text:'a'.repeat(12001)}));
});
test('repeat source URLs use same storage key, different posts do not collide',async()=>{
  const a=normalizePost({text:'old',url:'https://facebook.com/groups/123/posts/456/?x=1'});
  const b=normalizePost({text:'new',url:'https://www.facebook.com/groups/123/posts/456/'});
  assert.equal(await postKey(a),await postKey(b));
  assert.notEqual(await postKey(a),await postKey(normalizePost({text:'different'})));
});
const request = body => new Request('https://pilot.test', {method:'POST',body:JSON.stringify(body)});
test('every action rejects ordinary and anonymous users before data or AI access',async()=>{
  for(const user of [null,{role:'user'}]) {
    const handler=createHandler(()=>({auth:{me:async()=>user},get asServiceRole(){throw new Error('must not access data');}}),()=>{throw new Error('must not read key');});
    for(const action of ['status','list','analyze','save'])assert.equal((await handler(request({action}))).status,403);
  }
});
test('OpenAI unavailable does not silently fall back to a charged provider',async()=>{
  let calls=0;
  const client={auth:{me:async()=>({role:'admin'})},asServiceRole:{entities:{}},integrations:{Core:{InvokeLLM:async()=>{calls++;}}}};
  const handler=createHandler(()=>client,()=>undefined,async()=>{calls++;});
  assert.equal((await handler(request({action:'analyze',provider:'openai',post:{text:'test'}}))).status,409);
  assert.equal(calls,0);
});
test('saving rejected content cannot write to the pilot entity',async()=>{
  let writes=0;
  const client={auth:{me:async()=>({role:'admin'})},asServiceRole:{entities:{ScrapingPilotPost:{create:()=>{writes++;},update:()=>{writes++;}}}}};
  const handler=createHandler(()=>client,()=>undefined);
  const response=await handler(request({action:'save',post:{text:'1200 לחודש',url:'https://facebook.com/groups/1/posts/2/'},result:{...result(),city:'outside'}}));
  assert.equal(response.status,400);assert.equal(writes,0);
});
test('admin save updates an existing source and retains leads as pending review',async()=>{
  let saved;
  const entity={filter:async()=>[{id:'existing'}],update:async(id,data)=>{saved={id,...data};return saved;},create:()=>{throw new Error('duplicate');}};
  const handler=createHandler(()=>({auth:{me:async()=>({id:'admin1',role:'admin'})},asServiceRole:{entities:{ScrapingPilotPost:entity}}}),()=>undefined);
  const response=await handler(request({action:'save',post:{text:'1200 לחודש',url:'https://facebook.com/groups/1/posts/2/'},result:{...result(),kind:'room_seeker'}}));
  assert.equal(response.status,200);assert.equal(saved.bucket,'leads');assert.equal(saved.review_status,'pending');assert.equal(saved.id,'existing');
});

const fail=(key,status=400)=>{throw Object.assign(new Error(key),{status});};
const pair=(a,b)=>JSON.stringify([String(a),String(b)].sort());
export async function rows(entity,query){
  const result=[];for(let skip=0;;){const page=await entity.filter(query,'id',100,skip);if(!page.length)return result;result.push(...page);skip+=page.length;}
}
async function get(entity,id){if(typeof id!=='string'||!id)return null;try{return await entity.get(id);}catch(e){if(Number(e?.status??e?.response?.status)===404)return null;throw e;}}
async function blocked(sr,a,b){return (await sr.UserBlock.filter({pair_key:pair(a,b)},'id',1)).length>0;}
const publicPublisher=p=>p?{display_name:p.display_name,photo:p.photo||'',publisher_type:p.publisher_type}:null;
const roomFields=['id','title','city','address','price','entry_date','end_date','rental_type','roommates','furniture','description','phone','photos','status'];
const publicRoom=r=>Object.fromEntries(roomFields.filter(k=>r[k]!==undefined).map(k=>[k,r[k]]));
export function createHubHandler(createClient,notify=async()=>{},cleanup=async()=>{throw new Error('Deferred cleanup');}){return async req=>{
 if(req.method!=='POST')return Response.json({error:'Method not allowed'},{status:405});
 try{
  const client=createClient(req),sr=client.asServiceRole.entities,user=await client.auth.me().catch(()=>null);
  const raw=await req.text();if(raw.length>20000)fail('hub.invalid');
  const b=JSON.parse(raw),action=b.action;
  if(!user?.id)fail('hub.login',401);
  if((await sr.BannedUser.filter({email:user.email},'id',1)).length)fail('hub.unavailable',403);
  const profiles=['account','save','saved','preference'].includes(action)?await sr.Profile.filter({user_id:user.id},'id',1):[];
  const publisher=['account','publisher','candidates','offer'].includes(action)?(await sr.RoomPublisher.filter({user_id:user.id},'id',1))[0]:null;
  const preference=['account','preference'].includes(action)?(await sr.RoomPreference.filter({user_id:user.id},'id',1))[0]:null;
  if(action==='account')return Response.json({publisher:publicPublisher(publisher),has_profile:!!profiles.length,accept_offers:preference?.accept_offers!==false,rooms:(await rows(sr.RoomListing,{owner_id:user.id})).map(publicRoom)});
  if(action==='publisher'){
   const name=typeof b.display_name==='string'?b.display_name.trim():'';
   if(!name||name.length>80||!['owner','departing'].includes(b.publisher_type))fail('hub.publisher_required');
   if(b.photo && (typeof b.photo!=='string'||b.photo.length>3000||!/^https:\/\//.test(b.photo)))fail('hub.invalid');
   const data={user_id:user.id,display_name:name,publisher_type:b.publisher_type,photo:b.photo||''};
   if(publisher)await sr.RoomPublisher.update(publisher.id,data);else await sr.RoomPublisher.create(data);
   for(const r of await rows(sr.RoomListing,{owner_id:user.id,status:'published'}))await sr.RoomListing.update(r.id,{publisher_name:data.display_name,publisher_photo:data.photo,publisher_type:data.publisher_type});
   return Response.json({ok:true});
  }
  if(action==='preference'){
   if(!profiles.length||typeof b.accept_offers!=='boolean')fail('hub.partner_required',403);
   const data={user_id:user.id,accept_offers:b.accept_offers};
   if(preference)await sr.RoomPreference.update(preference.id,data);else await sr.RoomPreference.create(data);
   return Response.json({ok:true});
  }
  if(['save','saved'].includes(action)){
   if(!profiles.length)fail('hub.partner_required',403);
   if(action==='save'){
    if(b.saved===false){for(const x of await rows(sr.SavedRoom,{user_id:user.id,room_id:b.room_id}))await sr.SavedRoom.delete(x.id);return Response.json({ok:true});}
    const r=await get(sr.RoomListing,b.room_id);if(!r||await blocked(sr,user.id,r.owner_id))fail('hub.unavailable',404);
    const existing=await rows(sr.SavedRoom,{user_id:user.id,room_id:r.id});
    if(b.saved===false){for(const x of existing)await sr.SavedRoom.delete(x.id);}
    else if(b.saved===true){if(r.status!=='published')fail('hub.room_closed');if(!existing.length)await sr.SavedRoom.create({user_id:user.id,room_id:r.id});}
    else fail('hub.invalid');
    return Response.json({ok:true});
   }
   const saved=await rows(sr.SavedRoom,{user_id:user.id}),records=[];
   for(const s of saved){const r=await get(sr.RoomListing,s.room_id);if(r&&!await blocked(sr,user.id,r.owner_id))records.push({...publicRoom(r),saved:true});}
   return Response.json({records});
  }
  if(action==='candidates'){
   if(!publisher)fail('hub.publisher_required',403);
   const candidates=await sr.Profile.filter({},'-created_date',100),records=[];
   const blocks=[...await rows(sr.UserBlock,{blocker_id:user.id}),...await rows(sr.UserBlock,{blocked_id:user.id})];
   const excluded=new Set(blocks.map(x=>x.blocker_id===user.id?x.blocked_id:x.blocker_id));
   const optedOut=new Set((await rows(sr.RoomPreference,{accept_offers:false})).map(x=>x.user_id));
   for(const p of candidates){
    if(p.is_visible===false||p.user_id===user.id||excluded.has(p.user_id)||optedOut.has(p.user_id))continue;
    records.push({id:p.id,user_id:p.user_id,name:p.name,photos:p.photos||[],about_me:p.about_me||'',age:p.age,city:p.city||''});
   }
   return Response.json({records});
  }
  if(action==='offer'){
   if(!publisher)fail('hub.publisher_required',403);
   const r=await get(sr.RoomListing,b.room_id),p=await get(sr.Profile,b.profile_id);
   if(!r||r.owner_id!==user.id||r.status!=='published')fail('hub.room_closed',403);
   if(!p||!p.user_id||p.user_id===user.id||p.is_visible===false||await blocked(sr,user.id,p.user_id))fail('hub.unavailable',403);
   const pref=(await sr.RoomPreference.filter({user_id:p.user_id},'id',1))[0];if(pref?.accept_offers===false)fail('hub.offers_disabled',403);
   const existing=(await sr.RoomOffer.filter({owner_id:user.id,recipient_id:p.user_id,room_id:r.id},'id',1))[0];
   if(existing)return Response.json({id:existing.id});
   const offer=await sr.RoomOffer.create({owner_id:user.id,recipient_id:p.user_id,room_id:r.id,room_snapshot:publicRoom(r),publisher_snapshot:publicPublisher(publisher),recipient_name:p.name||'',recipient_photo:p.photos?.[0]||'',recipient_read:false,owner_read:true});
   if(await blocked(sr,user.id,p.user_id)){await sr.RoomOffer.delete(offer.id);fail('hub.unavailable',403);}
   await notify(client,{recipient_id:p.user_id,sender_name:publisher.display_name,kind:'offer',offer_id:offer.id}).catch(()=>{});
   return Response.json({id:offer.id});
  }
  if(action==='inbox'){
   const all=[...await rows(sr.RoomOffer,{owner_id:user.id}),...await rows(sr.RoomOffer,{recipient_id:user.id})],records=[];
   for(const o of all)if(!await blocked(sr,o.owner_id,o.recipient_id))records.push(o);
   return Response.json({records});
  }
  if(['conversation','send','read','report','block'].includes(action)){
   const o=await get(sr.RoomOffer,b.offer_id);
   if(!o||![o.owner_id,o.recipient_id].includes(user.id))fail('hub.unavailable',404);
   if(await blocked(sr,o.owner_id,o.recipient_id))fail('hub.unavailable',403);
   const other=user.id===o.owner_id?o.recipient_id:o.owner_id;
   if(action==='block'){
    if(b.confirm!==true)fail('hub.invalid');
    const block=await sr.UserBlock.create({pair_key:pair(user.id,other),blocker_id:user.id,blocked_id:other,match_ids:[],cleanup_pending:true});
    // The durable global block immediately denies every read/send. Existing scheduled cleanup removes both chat types.
    try{await cleanup(sr,block);return Response.json({ok:true,cleanup_pending:false});}catch{return Response.json({ok:true,cleanup_pending:true});}
   }
   if(action==='report'){
    if(!['harassment','fake_profile','inappropriate_content','spam','other'].includes(b.reason)||typeof b.details!=='string'||b.details.length>2000)fail('hub.invalid');
    await sr.UserReport.create({reporter_id:user.id,reported_user_id:other,profile_id:'room-offer:'+o.id,reason:b.reason,details:b.details,status:'new',profile_snapshot:{room:o.room_snapshot,publisher:o.publisher_snapshot}});
    return Response.json({ok:true});
   }
   if(action==='read'){await sr.RoomOffer.update(o.id,user.id===o.owner_id?{owner_read:true}:{recipient_read:true});return Response.json({ok:true});}
   if(action==='conversation'){
    const r=await get(sr.RoomListing,o.room_id),messages=await rows(sr.RoomOfferMessage,{offer_id:o.id});
    if(await blocked(sr,o.owner_id,o.recipient_id))fail('hub.unavailable',403);
    return Response.json({offer:o,available:r?.status==='published',messages:messages.sort((a,b)=>String(a.created_date).localeCompare(String(b.created_date)))});
   }
   const content=typeof b.content==='string'?b.content.trim():'';if(!content||content.length>10000)fail('hub.invalid');
   const record=await sr.RoomOfferMessage.create({offer_id:o.id,sender_id:user.id,content});
   if(await blocked(sr,o.owner_id,o.recipient_id)){await sr.RoomOfferMessage.delete(record.id);fail('hub.unavailable',403);}
   await sr.RoomOffer.update(o.id,user.id===o.owner_id?{recipient_read:false}:{owner_read:false});
   await notify(client,{recipient_id:other,sender_name:user.id===o.owner_id?o.publisher_snapshot.display_name:o.recipient_name,kind:'message',offer_id:o.id}).catch(()=>{});
   return Response.json({record});
  }
  fail('hub.invalid');
 }catch(e){const status=Number(e.status??e.response?.status)||500;return Response.json({error:String(e.message||'').startsWith('hub.')?e.message:'hub.failed'},{status});}
};}

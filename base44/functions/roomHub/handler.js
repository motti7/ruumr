const fail=(key,status=400)=>{throw Object.assign(new Error(key),{status});};
const pair=(a,b)=>JSON.stringify([String(a),String(b)].sort());
export async function rows(entity,query){
  const result=[];for(let skip=0;;){const page=await entity.filter(query,'id',100,skip);if(!page.length)return result;result.push(...page);skip+=page.length;}
}
async function get(entity,id){if(typeof id!=='string'||!id)return null;try{return await entity.get(id);}catch(e){if(Number(e?.status??e?.response?.status)===404)return null;throw e;}}
async function blocked(sr,a,b){return (await sr.UserBlock.filter({pair_key:pair(a,b)},'id',1)).length>0;}
const publicPublisher=p=>p?{display_name:p.display_name,photo:p.photo||'',publisher_type:p.publisher_type}:null;
const roomFields=['id','title','city','address','price','entry_date','end_date','rental_type','roommates','furniture','description','phone','photos','status','source_kind','source_posted_at','created_date','entry_text','end_text','bills_text','shabbat_policy','kosher_policy','price_options'];
const publicRoom=r=>Object.fromEntries(roomFields.filter(k=>r[k]!==undefined).map(k=>[k,r[k]]));
export function createHubHandler(createClient){return async req=>{
 if(req.method!=='POST')return Response.json({error:'Method not allowed'},{status:405});
 try{
  const client=createClient(req),sr=client.asServiceRole.entities,user=await client.auth.me().catch(()=>null);
  const raw=await req.text();if(raw.length>20000)fail('hub.invalid');
  const b=JSON.parse(raw),action=b.action;
  if(!user?.id)fail('hub.login',401);
  if((await sr.BannedUser.filter({email:user.email},'id',1)).length)fail('hub.unavailable',403);
  const profiles=['account','save','saved'].includes(action)?await sr.Profile.filter({user_id:user.id},'id',1):[];
  const publisher=['account','publisher'].includes(action)?(await sr.RoomPublisher.filter({user_id:user.id},'id',1))[0]:null;
  if(action==='account')return Response.json({publisher:publicPublisher(publisher),has_profile:!!profiles.length,rooms:(await rows(sr.RoomListing,{owner_id:user.id})).map(publicRoom)});
  if(action==='publisher'){
   const name=typeof b.display_name==='string'?b.display_name.trim():'';
   if(!name||name.length>80||!['owner','departing'].includes(b.publisher_type))fail('hub.publisher_required');
   if(b.photo && (typeof b.photo!=='string'||b.photo.length>3000||!/^https:\/\//.test(b.photo)))fail('hub.invalid');
   const data={user_id:user.id,display_name:name,publisher_type:b.publisher_type,photo:b.photo||''};
   if(publisher)await sr.RoomPublisher.update(publisher.id,data);else await sr.RoomPublisher.create(data);
   for(const r of await rows(sr.RoomListing,{owner_id:user.id,status:'published'}))await sr.RoomListing.update(r.id,{publisher_name:data.display_name,publisher_photo:data.photo,publisher_type:data.publisher_type});
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
  fail('hub.invalid');
 }catch(e){const status=Number(e.status??e.response?.status)||500;return Response.json({error:String(e.message||'').startsWith('hub.')?e.message:'hub.failed'},{status});}
};}

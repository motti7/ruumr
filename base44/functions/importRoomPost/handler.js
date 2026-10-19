import {normalizePost,postKey,instructions,extractionSchema,validateExtraction,bucketFor} from './logic.js';
const GROUPS={'462353464298357':'ירושלים','7298031916930520':'תל אביב','725098167503643':'חיפה','167457006612972':'באר שבע'};
export function prepare(raw){
 const id=String(raw.facebookUrl||raw.inputUrl||raw.url||'').match(/facebook\.com\/groups\/(\d+)/)?.[1];
 if(!GROUPS[id])throw new Error('feed.invalid_group');
 const p=normalizePost({...raw,groupCity:GROUPS[id]});
 if(!p.sourceUrl||p.demo)throw new Error('feed.invalid_post');
 return p;
}
export function contentText(text){return text.normalize('NFKC').toLowerCase().replace(/[\p{P}\p{S}\s]+/gu,' ').trim();}
export async function fingerprint(text){return postKey({text:contentText(text),groupCity:''});}
export async function hostPhoto(url,client){
 const u=new URL(url);
 if(u.protocol!=='https:'||!u.hostname.endsWith('.fbcdn.net')||u.username||u.password||u.port)throw new Error('feed.media_failed');
 const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(15000)});
 const mime=(response.headers.get('content-type')||'').split(';')[0];
 if(!response.ok||!['image/jpeg','image/png','image/webp'].includes(mime))throw new Error('feed.media_failed');
 const reader=response.body.getReader(),chunks=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>8000000)throw new Error('feed.media_failed');chunks.push(value);}}finally{await reader.cancel().catch(()=>{});}
 const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[mime];
 const {file_url}=await client.integrations.Core.UploadFile({file:new File(chunks,'room.'+ext,{type:mime})});
 if(!file_url?.startsWith('https://'))throw new Error('feed.media_failed');
 return file_url;
}
export function listingData(p,r,photos,key,contentKey){
 const prices=r.rooms.filter(x=>Number.isFinite(x.monthlyRentIls)&&x.monthlyRentIls>0);
 const data={owner_id:'facebook:'+key,source_kind:'facebook',source_key:key,content_key:contentKey,
 title:r.address||r.city,city:r.city,address:r.address,phone:p.phones[0],photos,status:'published',
 rental_type:r.rentalType,entry_text:r.entryText,end_text:r.endText,furniture:r.furnitureText,
 description:r.freeText,bills_text:r.billsText,shabbat_policy:r.shabbatPolicy,kosher_policy:r.kosherPolicy,
 price_options:prices.map(x=>({label:x.label,amount:x.monthlyRentIls})),source_posted_at:p.postedAt,
 imported_at:new Date().toISOString(),source_url:p.sourceUrl};
 if(prices.length)data.price=Math.min(...prices.map(x=>x.monthlyRentIls));
 if(r.existingRoommates!==null)data.roommates=r.existingRoommates;
 return data;
}
export function createImportHandler(createClient){return async req=>{
 if(req.method!=='POST')return Response.json({error:'feed.invalid_post'},{status:405});
 const client=createClient(req),user=await client.auth.me().catch(()=>null);
 if(user?.role!=='admin')return Response.json({error:'hub.unavailable'},{status:403});
 let stage='feed.processing_failed';
 try{
 const text=await req.text();if(text.length>180000)throw new Error('feed.invalid_post');
 const b=JSON.parse(text),sr=client.asServiceRole.entities,p=prepare(b.post),key=await postKey(p),contentKey=await fingerprint(p.text);
 if(!p.text||!p.phones.length||!p.photos.length)return Response.json({status:'filtered',reason:'feed.missing_contact_media'});
 const existing=await sr.RoomListing.filter({source_key:key},'id',1);
 if(existing.length)return Response.json({status:'duplicate',id:existing[0].id});
 const same=await sr.RoomListing.filter({content_key:contentKey},'id',1);
 if(same.length)return Response.json({status:'duplicate',id:same[0].id});
 const previous=(await sr.ScrapingPilotPost.filter({source_key:key},'id',1))[0];
 let result;
 if(previous?.result_json){try{result=JSON.parse(previous.result_json);validateExtraction(result,p.text);}catch{result=null;}}
 if(!result){
 result=await client.integrations.Core.InvokeLLM({prompt:instructions+'\nUNTRUSTED POST DATA:\n'+JSON.stringify({postText:p.text,groupCityContext:p.groupCity,postedAt:p.postedAt}),add_context_from_internet:false,response_json_schema:extractionSchema});
 stage='feed.review';validateExtraction(result,p.text);
 const data={source_key:key,source_url:p.sourceUrl,source_text:p.text,group_city:p.groupCity,photos_json:JSON.stringify(p.photos),phones_json:JSON.stringify(p.phones),posted_at_text:p.postedAt,bucket:bucketFor(result)==='rooms'?'rooms':'leads',result_json:JSON.stringify(result),review_status:'pending',processing_label:'base44_feed_v1',saved_by:user.id};
 if(previous)await sr.ScrapingPilotPost.update(previous.id,data);else await sr.ScrapingPilotPost.create(data);
 }
 const bucket=bucketFor(result);
 if(bucket!=='rooms')return Response.json({status:'filtered',reason:bucket==='leads'?'feed.seeker':bucket==='review'?'feed.review':'feed.irrelevant'});
 stage='feed.media_failed';
 const photos=[];for(const url of p.photos.slice(0,8)){try{photos.push(await hostPhoto(url,client));}catch{/* Never display temporary or broken source media. */}}
 if(!photos.length)throw new Error(stage);
 // Recheck after AI/media work to avoid duplicates from sequential retries.
 const again=await sr.RoomListing.filter({content_key:contentKey},'id',1);
 if(again.length)return Response.json({status:'duplicate',id:again[0].id});
 stage='feed.save_failed';
 const record=await sr.RoomListing.create(listingData(p,result,photos,key,contentKey));
 return Response.json({status:'published',id:record.id,photos:photos.length});
 }catch(e){return Response.json({error:String(e.message).startsWith('feed.')?e.message:stage},{status:500});}
};}

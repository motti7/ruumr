import {cleanupBlock} from '../../shared/userSafety.ts';
import {createClientFromRequest} from 'npm:@base44/sdk@0.8.31';
import {sendServerPush} from '../../shared/serverPush.ts';
import {createHubHandler} from './handler.js';
Deno.serve(createHubHandler(createClientFromRequest,async (client,event)=>{
 const recipient=await client.asServiceRole.entities.User.get(event.recipient_id);
 if(recipient.notify_matches===false)return;
 const english=String(recipient.language||recipient.preferred_language||'he').startsWith('en');
 const title=event.kind==='offer'?(english?'New room offer':'הצעת חדר חדשה'):(english?'New message about a room':'הודעה חדשה על חדר');
 const body=english?`${event.sender_name} ${event.kind==='offer'?'sent you a room offer':'sent you a message'}.`:`${event.sender_name} ${event.kind==='offer'?'שלח/ה לך הצעת חדר':'שלח/ה לך הודעה'}.`;
 const jobs=[];
 if(recipient.enable_notifications!==false)jobs.push(sendServerPush(client,recipient.id,title,body));
 if(recipient.email)jobs.push(client.asServiceRole.integrations.Core.SendEmail({to:recipient.email,subject:title,body:body+'\nhttps://app.ruumrapp.com/RoomChat?offerId='+encodeURIComponent(event.offer_id)}));
 const results=await Promise.allSettled(jobs);
 if(results.some(r=>r.status==='rejected'))console.error('Room notification delivery failed');
},cleanupBlock));

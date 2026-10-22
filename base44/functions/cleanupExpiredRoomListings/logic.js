export const RETENTION_DAYS = 21;
export function expiredFacebookRoom(room, now = Date.now()) {
  const posted = Date.parse(room?.source_posted_at || '');
  return room?.source_kind === 'facebook' &&
    typeof room.owner_id === 'string' && room.owner_id.startsWith('facebook:') &&
    Number.isFinite(posted) && posted <= now - RETENTION_DAYS * 86400000;
}
export async function cleanupExpiredRooms(entity, {now=Date.now(),dryRun=false}={}) {
  const cutoff = new Date(now - RETENTION_DAYS * 86400000).toISOString();
  const candidates = await entity.filter({source_kind:'facebook',source_posted_at:{$lte:cutoff}},'source_posted_at',100);
  const result={retention_days:RETENTION_DAYS,cutoff,scanned:candidates.length,eligible:0,deleted:0,skipped:0,failed:0,dry_run:dryRun};
  for(const candidate of candidates) {
    try {
      // Re-read so a genuinely republished listing refreshed since the query is retained.
      const current=await entity.get(candidate.id);
      if(!expiredFacebookRoom(current,now)){result.skipped++;continue;}
      result.eligible++;
      if(!dryRun){await entity.delete(current.id);result.deleted++;}
    } catch(e) {
      if(Number(e?.status||e?.response?.status)===404){result.skipped++;continue;}
      result.failed++;
    }
  }
  return result;
}
export function createCleanupHandler(createClient) {
  return async req => {
    if(req.method!=='POST')return Response.json({error:'Method not allowed'},{status:405});
    const client=createClient(req);
    const user=await client.auth.me().catch(()=>null);
    if(user?.role!=='admin')return Response.json({error:'Forbidden'},{status:403});
    let body;
    try { body=await req.json(); } catch { return Response.json({error:'Invalid JSON'},{status:400}); }
    // Neither caller-supplied age nor caller-supplied IDs can broaden the deletion scope.
    const result=await cleanupExpiredRooms(client.asServiceRole.entities.RoomListing,{dryRun:body?.dry_run===true});
    console.info('Facebook room expiry',JSON.stringify(result));
    return Response.json(result,{status:result.failed?500:200});
  };
}

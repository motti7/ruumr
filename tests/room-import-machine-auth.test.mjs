import test from 'node:test';
import assert from 'node:assert/strict';
import {machineAuthorized} from '../base44/functions/importRoomPost/machine-auth.js';
import {createImportHandler} from '../base44/functions/importRoomPost/handler.js';
const secret='a'.repeat(64),version='israel-room-feed-v1';
const request=(key=secret,v=version)=>new Request('https://example.test',{method:'POST',headers:{'X-Ruumr-Import-Key':key,'X-Ruumr-Import-Target':v},body:JSON.stringify({action:'check'})});
test('Machine import fails closed for missing/short/wrong key and wrong target',async()=>{
 for(const [key,expected,v] of [[secret,undefined,version],[secret,'short',version],['b'.repeat(64),secret,version],[secret,secret,'main']]){
 assert.equal(await machineAuthorized(request(key,v),expected,version),false);
 }
 assert.equal(await machineAuthorized(request(),secret,version),true);
});
test('Automation readiness needs authorization and never performs AI/database work',async()=>{
 const client={auth:{me:async()=>null},asServiceRole:{}};
 const handler=createImportHandler(()=>client,{authorizeMachine:req=>machineAuthorized(req,secret,version)});
 assert.equal((await handler(request('b'.repeat(64)))).status,403);
 assert.deepEqual(await (await handler(request())).json(),{status:'ready'});
 const defaultHandler=createImportHandler(()=>client);
 assert.equal((await defaultHandler(request())).status,403);
});

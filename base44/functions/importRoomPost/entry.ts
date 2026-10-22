import {createClientFromRequest} from 'npm:@base44/sdk@0.8.54';
import {createImportHandler} from './handler.js';
import {machineAuthorized} from './machine-auth.js';
// Dedicated import credential. No personal Facebook or Base44 login is used by automation.
Deno.serve(createImportHandler(createClientFromRequest,{
 authorizeMachine:req=>machineAuthorized(req,Deno.env.get('RUUMR_IMPORT_SECRET'),'israel-room-feed-v1')
}));

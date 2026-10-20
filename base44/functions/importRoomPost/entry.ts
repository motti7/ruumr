import {createClientFromRequest} from 'npm:@base44/sdk@0.8.54';
import {createImportHandler} from './handler.js';
import {machineAuthorized} from './machine-auth.js';
// Fail closed until a dedicated server secret is configured. No browser/user token is used.
Deno.serve(createImportHandler(createClientFromRequest,{
 authorizeMachine:req=>machineAuthorized(req,Deno.env.get('RUUMR_IMPORT_SECRET'),'branch:6ab95f4ebdaf417610c1b7ef')
}));

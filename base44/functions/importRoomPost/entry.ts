import {createClientFromRequest} from 'npm:@base44/sdk@0.8.54';
import {createImportHandler} from './handler.js';
// Uses the branch's registered room-import entities.
Deno.serve(createImportHandler(createClientFromRequest));

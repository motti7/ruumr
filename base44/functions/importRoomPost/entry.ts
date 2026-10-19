import {createClientFromRequest} from 'npm:@base44/sdk@0.8.54';
import {createImportHandler} from './handler.js';
Deno.serve(createImportHandler(createClientFromRequest));

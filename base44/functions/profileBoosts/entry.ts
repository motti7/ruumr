import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { createBoostHandler } from './handler.js';
Deno.serve(createBoostHandler(createClientFromRequest));

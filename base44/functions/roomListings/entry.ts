import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { createHandler } from './handler.js';
Deno.serve(createHandler(createClientFromRequest));

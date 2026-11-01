import {createClientFromRequest} from 'npm:@base44/sdk@0.8.31';
import {createHubHandler} from './handler.js';
Deno.serve(createHubHandler(createClientFromRequest));

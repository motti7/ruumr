// Retired endpoint: retained only to neutralize the existing platform registration.
Deno.serve(() => Response.json({ error: 'endpoint_retired' }, { status: 410 }));

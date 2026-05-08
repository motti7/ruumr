import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.email !== 'mottishif7@gmail.com') {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { imageUrl } = await req.json();

        if (!imageUrl) {
            return Response.json({ error: 'Missing imageUrl' }, { status: 400 });
        }

        // Download the image from the URL
        const response = await fetch(imageUrl);
        if (!response.ok) {
            return Response.json({ error: 'Failed to download image' }, { status: 400 });
        }

        const blob = await response.blob();

        // Upload to Base44 storage
        const uploadResult = await base44.integrations.Core.UploadFile({
            file: blob
        });

        return Response.json({ 
            success: true,
            file_url: uploadResult.file_url
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
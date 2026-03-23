import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file');
        const fileName = formData.get('fileName') || file.name;
        const folderName = formData.get('folderName') || 'KinderbuildProposals';

        if (!file) {
            return Response.json({ error: 'No file provided' }, { status: 400 });
        }

        // Get access token
        const accessToken = await base44.asServiceRole.connectors.getAccessToken('googledrive');

        // First, ensure folder exists
        let folderId = null;
        
        // Search for existing folder
        const folderSearchResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false&spaces=drive`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        const folderSearchData = await folderSearchResponse.json();

        if (folderSearchData.files && folderSearchData.files.length > 0) {
            folderId = folderSearchData.files[0].id;
        } else {
            // Create folder if it doesn't exist
            const createFolderResponse = await fetch(
                'https://www.googleapis.com/drive/v3/files',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: folderName,
                        mimeType: 'application/vnd.google-apps.folder'
                    })
                }
            );

            const folderData = await createFolderResponse.json();
            folderId = folderData.id;
        }

        // Upload file to folder
        const uploadFormData = new FormData();
        uploadFormData.append('metadata', JSON.stringify({
            name: fileName,
            parents: [folderId]
        }));
        uploadFormData.append('file', file);

        const uploadResponse = await fetch(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                body: uploadFormData
            }
        );

        if (!uploadResponse.ok) {
            const error = await uploadResponse.text();
            throw new Error(`Upload failed: ${error}`);
        }

        const uploadedFile = await uploadResponse.json();

        // Make file public/shareable
        await fetch(
            `https://www.googleapis.com/drive/v3/files/${uploadedFile.id}/permissions`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    role: 'viewer',
                    type: 'anyone'
                })
            }
        );

        // Generate shareable link
        const shareLink = `https://drive.google.com/file/d/${uploadedFile.id}/view`;

        return Response.json({
            success: true,
            fileId: uploadedFile.id,
            fileName: uploadedFile.name,
            shareLink: shareLink,
            webViewLink: uploadedFile.webViewLink
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
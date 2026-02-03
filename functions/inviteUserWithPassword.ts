import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { email, full_name, role, temporary_password } = await req.json();

        if (!email || !full_name || !role || !temporary_password) {
            return Response.json({ 
                error: 'Missing required fields: email, full_name, role, temporary_password' 
            }, { status: 400 });
        }

        // Invite user through Base44
        await base44.asServiceRole.users.inviteUser(email, role);

        // Wait a moment for user to be created
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Find the newly created user
        const users = await base44.asServiceRole.entities.User.filter({ email });
        if (users.length === 0) {
            return Response.json({ 
                error: 'User invited but not found in database' 
            }, { status: 500 });
        }

        const newUser = users[0];

        // Update with temporary password and name
        await base44.asServiceRole.entities.User.update(newUser.id, {
            temporary_password,
            must_change_password: true,
            full_name
        });

        // Send email with temporary credentials
        await base44.asServiceRole.integrations.Core.SendEmail({
            to: email,
            subject: 'Your Kinderbuild Projects Account',
            body: `Hello ${full_name},

Your Kinderbuild Projects account has been created!

Login Credentials:
Email: ${email}
Temporary Password: ${temporary_password}

IMPORTANT: You must change this password upon first login.

You will receive a separate email to set up your account. Please use the temporary password above when you first log in, then you'll be prompted to create a new secure password.

If you have any questions, please contact your administrator.

Best regards,
Kinderbuild Projects Team`
        });

        return Response.json({ 
            success: true, 
            message: 'User invited and credentials sent',
            email 
        });
    } catch (error) {
        console.error('Error inviting user:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
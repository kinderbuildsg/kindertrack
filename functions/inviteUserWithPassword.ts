import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { email, full_name, role, job_role, temporary_password } = await req.json();

        if (!email || !full_name || !temporary_password) {
            return Response.json({ 
                error: 'Missing required fields: email, full_name, temporary_password' 
            }, { status: 400 });
        }

        if (temporary_password.length < 8) {
            return Response.json({ 
                error: 'Password must be at least 8 characters' 
            }, { status: 400 });
        }

        // Register user directly with password (no invite email needed)
        await base44.asServiceRole.auth.register({
            email,
            password: temporary_password,
            full_name
        });

        // Wait for user to be created in DB
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Find the newly created user and update their profile
        const users = await base44.asServiceRole.entities.User.filter({ email });
        if (users.length > 0) {
            const newUser = users[0];
            await base44.asServiceRole.entities.User.update(newUser.id, {
                full_name,
                role: role || 'user',
                job_role: job_role || role || 'user',
                approval_status: 'approved',
                approved_by: user.email,
                approved_date: new Date().toISOString(),
                must_change_password: true
            });
        }

        // Send email with credentials
        await base44.asServiceRole.integrations.Core.SendEmail({
            to: email,
            subject: 'Your Kinderbuild Projects Account',
            body: `Hello ${full_name},

Your Kinderbuild Projects account has been created by an administrator.

Login Credentials:
Email: ${email}
Password: ${temporary_password}

Please log in and change your password immediately.

If you have any questions, please contact your administrator.

Best regards,
Kinderbuild Projects Team`
        });

        return Response.json({ 
            success: true, 
            message: 'User created and credentials sent',
            email 
        });
    } catch (error) {
        console.error('Error creating user:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
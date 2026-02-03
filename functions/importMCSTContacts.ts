import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const { file_url } = await req.json();

        // Extract data from CSV
        const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
            file_url: file_url,
            json_schema: {
                type: "object",
                properties: {
                    contacts: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                usr_devtname: { type: "string" },
                                devt_location: { type: "string" },
                                mcst_houseno: { type: "string" },
                                mcst_roadname: { type: "string" },
                                mcst_buildingname: { type: "string" },
                                mcst_postalcode: { type: "string" },
                                mcst_telno: { type: "string" },
                                managementname: { type: "string" },
                                management_tel_no: { type: "string" },
                                MCContact: { type: "string" }
                            }
                        }
                    }
                }
            }
        });

        if (result.status !== "success" || !result.output.contacts) {
            return Response.json({ error: 'Failed to extract data from CSV' }, { status: 400 });
        }

        // Transform and create leads
        const leadsToCreate = result.output.contacts.map(contact => {
            // Build address
            const addressParts = [
                contact.mcst_houseno !== 'na' ? contact.mcst_houseno : '',
                contact.mcst_roadname !== 'na' ? contact.mcst_roadname : '',
                contact.mcst_buildingname !== 'na' ? contact.mcst_buildingname : '',
                contact.mcst_postalcode !== 'na' ? `S${contact.mcst_postalcode}` : ''
            ].filter(Boolean).join(' ').trim();

            const site_address = addressParts || contact.devt_location || '';

            // Determine phone number
            const phone = (contact.mcst_telno !== 'na' && contact.mcst_telno) || 
                         (contact.management_tel_no !== 'na' && contact.management_tel_no) || 
                         '';

            // Use development name as company name
            const company_name = contact.usr_devtname || 'MCST';

            // Contact person
            const contact_person = contact.MCContact || 'Management';

            return {
                company_name: company_name,
                contact_person: contact_person,
                contact_phone: phone,
                site_address: site_address,
                status: "cold",
                call_status: "not_called",
                lead_source: "cold_call",
                project_type: "playground",
                assigned_to: user.email,
                notes: `MCST: ${contact.managementname !== 'na' ? contact.managementname : 'N/A'}`
            };
        }).filter(lead => lead.site_address); // Only include leads with address

        // Bulk create leads
        const createdLeads = await base44.asServiceRole.entities.Lead.bulkCreate(leadsToCreate);

        return Response.json({ 
            success: true, 
            imported: createdLeads.length,
            message: `Successfully imported ${createdLeads.length} MCST contacts` 
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
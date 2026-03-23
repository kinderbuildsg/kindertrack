import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { imageUrls } = await req.json();

    if (!imageUrls || imageUrls.length === 0) {
      return Response.json({ error: 'No images provided' }, { status: 400 });
    }

    const prompt = `You are a playground equipment expert. Analyze these playground images and provide a detailed list of ALL materials, parts, and components visible.

For each item, provide:
1. Item name (specific and clear)
2. Quantity (estimated from the image)
3. Category (e.g., Safety Surface, Metal Frame, Plastic Component, Fasteners, Paint, Wood, etc.)
4. Brief description

Format as JSON array with objects containing: name, quantity, category, description

Be thorough and list every visible component, from major structural elements to small hardware items.`;

    const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      file_urls: imageUrls,
      response_json_schema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                quantity: { type: 'number' },
                category: { type: 'string' },
                description: { type: 'string' }
              }
            }
          },
          summary: { type: 'string' }
        }
      }
    });

    return Response.json(response);
  } catch (error) {
    console.error('Error analyzing images:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
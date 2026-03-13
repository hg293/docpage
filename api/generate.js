import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, specialization, qualifications, experience, services, clinicName, city, bio, section } = req.body;

  if (!name || !specialization) {
    return res.status(400).json({ error: 'Name and specialization are required' });
  }

  const doctorContext = [
    `Doctor: ${name}`,
    `Specialization: ${specialization}`,
    qualifications?.length ? `Qualifications: ${qualifications.join(', ')}` : '',
    experience ? `Experience: ${experience}` : '',
    services?.length ? `Services: ${services.join(', ')}` : '',
    clinicName ? `Clinic: ${clinicName}` : '',
    city ? `City: ${city}` : '',
    bio ? `Existing bio: ${bio}` : ''
  ].filter(Boolean).join('\n');

  let prompt;

  if (section) {
    const sectionPrompts = {
      bio: `Write a warm, professional 3-4 sentence bio for this doctor's website. Highlight expertise, approach to patient care, and what makes them stand out. Write in third person.\n\n${doctorContext}`,
      tagline: `Write a short, compelling tagline (under 10 words) for this doctor's website hero section. It should convey trust and expertise.\n\n${doctorContext}`,
      services: `For each service listed, write a 1-2 sentence patient-friendly description explaining what it involves and who it's for. Return as JSON: {"serviceName": "description", ...}\n\nServices: ${(services || []).join(', ')}\n\n${doctorContext}`,
      seo: `Generate SEO metadata for this doctor's website. Return as JSON: {"title": "page title under 60 chars", "description": "meta description under 155 chars"}\n\n${doctorContext}`,
      cta: `Write a short call-to-action text (under 8 words) for the booking button on this doctor's website.\n\n${doctorContext}`
    };
    prompt = sectionPrompts[section];
    if (!prompt) {
      return res.status(400).json({ error: `Unknown section: ${section}` });
    }
  } else {
    prompt = `You are a medical website content writer. Generate compelling, professional website content for a doctor. Return ONLY valid JSON with these fields:

{
  "bio": "3-4 sentence professional bio in third person",
  "tagline": "Short hero tagline, under 10 words",
  "serviceDescriptions": {"serviceName": "1-2 sentence description", ...},
  "seoTitle": "SEO page title under 60 chars",
  "seoDescription": "Meta description under 155 chars",
  "ctaText": "Call-to-action for booking button, under 8 words"
}

Guidelines:
- Warm, trustworthy tone that puts patients at ease
- Highlight expertise without being boastful
- Use simple language patients understand
- Include the city/location naturally where relevant
- Service descriptions should explain benefits to patients

Doctor details:
${doctorContext}`;
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = message.content[0].text;

    if (!section || section === 'services' || section === 'seo') {
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return res.status(200).json({ result: JSON.parse(jsonMatch[0]) });
        }
      } catch (e) {
        // Fall through to return raw text
      }
    }

    return res.status(200).json({ result: text });
  } catch (error) {
    console.error('AI generation error:', error);
    if (error.status === 429) {
      return res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
    }
    return res.status(500).json({ error: 'Failed to generate content. Please try again.' });
  }
}

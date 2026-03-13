import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  if (!text || text.trim().length < 20) {
    return res.status(400).json({ error: 'Resume text is too short or empty' });
  }

  const prompt = `You are parsing a doctor's resume/CV. Extract structured information and return ONLY valid JSON.

Return this exact structure (use null for fields you cannot determine):

{
  "name": "Full name with title (e.g., Dr. First Last)",
  "qualifications": ["MBBS", "MD", ...],
  "specialization": "Primary specialization",
  "experience": "Years of experience or career summary (1-2 sentences)",
  "services": ["Service 1", "Service 2", ...],
  "clinicName": "Clinic or hospital name",
  "address": "Clinic address",
  "city": "City",
  "state": "State",
  "phone": "Phone number",
  "email": "Email address",
  "bio": "Brief professional summary if available",
  "publications": "Notable publications or research (1-2 sentences)"
}

Guidelines:
- For specialization, map to common medical specialties: Dermatologist, Cardiologist, Orthopedic Surgeon, Pediatrician, Gynecologist, General Physician, Dentist, Ophthalmologist, ENT Specialist, Psychiatrist, Neurologist, Urologist, Gastroenterologist, Pulmonologist, Endocrinologist, Oncologist, Nephrologist, Rheumatologist
- For services, infer from specialization if not explicitly listed
- Extract phone/email if present in the text
- Qualifications should be abbreviations (MBBS, MD, MS, DNB, etc.)

Resume text:
${text}`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return res.status(500).json({ error: 'Could not parse resume. Please try filling in details manually.' });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return res.status(200).json({ result: parsed });
  } catch (error) {
    console.error('Resume parsing error:', error);
    if (error.status === 429) {
      return res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
    }
    return res.status(500).json({ error: 'Failed to parse resume. Please try filling in details manually.' });
  }
}

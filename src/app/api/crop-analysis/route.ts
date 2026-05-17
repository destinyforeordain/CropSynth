import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { symptoms, cropName, farmContext } = await request.json();

    if (!symptoms || !cropName) {
      return NextResponse.json(
        { error: 'Symptoms and crop name are required' },
        { status: 400 }
      );
    }

    const prompt = `Analyze the following crop disease symptoms for ${cropName}:
Symptoms: ${symptoms}

${farmContext ? `Farm context: ${farmContext}` : ''}

Please provide a detailed analysis including:
1. Most likely disease
2. Confidence level (0-1)
3. Description of the disease
4. Treatment recommendations (organic and chemical)
5. Preventive measures
6. Severity level (low/medium/high)

Format your response as JSON with the following structure:
{
  "disease": "Disease Name",
  "confidence": 0.85,
  "description": "Detailed description",
  "treatments": {
    "organic": ["treatment1", "treatment2"],
    "chemical": ["treatment1", "treatment2"],
    "preventive": ["measure1", "measure2"]
  },
  "severity": "medium"
}`;

    const messages = [
      {
        role: 'user' as const,
        content: prompt
      }
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: "openai/gpt-oss-120b",
      temperature: 1,
      max_completion_tokens: 8192,
      top_p: 1,
      stream: false,
      reasoning_effort: "medium",
      stop: null,
    });

    const response = chatCompletion.choices[0]?.message?.content;
    if (!response) {
      return NextResponse.json(
        { error: 'No response generated from AI' },
        { status: 500 }
      );
    }

    // Try to parse JSON from the response
    let analysis;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch {
      console.warn('Failed to parse JSON from Groq response, using fallback');
      // Fallback mock response if JSON parsing fails
      analysis = {
        disease: "Unable to determine specific disease",
        confidence: 0.5,
        description: "Based on the symptoms provided, further analysis may be needed. Please consult with a local agricultural expert for accurate diagnosis.",
        treatments: {
          organic: ["Monitor the crop closely", "Improve air circulation", "Ensure proper watering"],
          chemical: ["Consult local agricultural extension service"],
          preventive: ["Regular crop monitoring", "Proper field sanitation", "Crop rotation"]
        },
        severity: "medium"
      };
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error in crop analysis API:', error);
    return NextResponse.json(
      { error: 'Failed to analyze crop disease' },
      { status: 500 }
    );
  }
}
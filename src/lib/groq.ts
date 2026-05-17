import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function generateChatResponse(
  messages: ChatMessage[],
  farmContext?: string
): Promise<string> {
  try {
    // Add farming context if provided
    const systemMessage: ChatMessage = {
      role: 'system',
      content: farmContext
        ? `You are an expert agricultural AI assistant specializing in farming, crop management, and agricultural advice. You have access to the following farm context: ${farmContext}. Provide helpful, accurate, and practical advice based on this information.`
        : 'You are an expert agricultural AI assistant specializing in farming, crop management, and agricultural advice. Provide helpful, accurate, and practical advice for farmers.'
    };

    const allMessages = [systemMessage, ...messages];

    const chatCompletion = await groq.chat.completions.create({
      messages: allMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      model: "openai/gpt-oss-120b",
      temperature: 1,
      max_completion_tokens: 8192,
      top_p: 1,
      stream: false, // We'll use non-streaming for simplicity
      reasoning_effort: "medium",
      stop: null,
    });

    const response = chatCompletion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response generated from Groq API');
    }

    return response;
  } catch (error) {
    console.error('Error calling Groq API:', error);
    throw new Error('Failed to generate AI response. Please try again.');
  }
}

export async function analyzeCropDisease(
  symptoms: string,
  cropName: string,
  farmContext?: string
): Promise<{
  disease: string;
  confidence: number;
  description: string;
  treatments: {
    organic: string[];
    chemical: string[];
    preventive: string[];
  };
  severity: 'low' | 'medium' | 'high';
}> {
  try {
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

    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await generateChatResponse(messages);

    // Try to parse JSON from the response
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      console.warn('Failed to parse JSON from Groq response, using fallback');
    }

    // Fallback mock response if JSON parsing fails
    return {
      disease: "Unable to determine specific disease",
      confidence: 0.5,
      description: "Based on the symptoms provided, further analysis may be needed. Please consult with a local agricultural expert for accurate diagnosis.",
      treatments: {
        organic: ["Monitor the crop closely", "Improve air circulation", "Ensure proper watering"],
        chemical: ["Consult local agricultural extension service"],
        preventive: ["Regular crop monitoring", "Proper field sanitation", "Crop rotation"]
      },
      severity: "medium" as const
    };
  } catch (error) {
    console.error('Error analyzing crop disease:', error);
    throw new Error('Failed to analyze crop disease. Please try again.');
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, farmContext } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

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

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI response' },
      { status: 500 }
    );
  }
}
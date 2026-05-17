'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getConversations() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('chat_conversations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Database Error:', error)
    return []
  }

  return data || []
}

export async function getConversation(conversationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('chat_conversations')
    .select('*')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('Database Error:', error)
    return null
  }

  return data
}

export async function createConversation(language: string, farmId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  let farmContext = undefined
  if (farmId) {
    // Get farm details for context
    const { data: farm, error: farmError } = await supabase
      .from('farms')
      .select('*')
      .eq('id', farmId)
      .eq('user_id', user.id)
      .single()

    if (farm && !farmError) {
      farmContext = {
        farmId,
        currentCrops: farm.primary_crops || [],
        location: farm.location ? `${farm.location.village}, ${farm.location.district}` : '',
      }
    }
  }

  const { data, error } = await supabase
    .from('chat_conversations')
    .insert({
      user_id: user.id,
      messages: [],
      language,
      farm_context: farmContext,
    })
    .select()
    .single()

  if (error) {
    console.error('Database Error:', error)
    throw new Error('Failed to create conversation')
  }

  revalidatePath('/dashboard')
  return data
}

export async function addMessage(conversationId: string, message: {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  language?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  // First get the conversation to verify ownership
  const { data: conversation, error: convError } = await supabase
    .from('chat_conversations')
    .select('*')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .single()

  if (convError || !conversation) {
    throw new Error('Conversation not found or access denied')
  }

  const updatedMessages = [...(conversation.messages || []), message]

  const { error } = await supabase
    .from('chat_conversations')
    .update({
      messages: updatedMessages,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)

  if (error) {
    console.error('Database Error:', error)
    throw new Error('Failed to add message')
  }

  revalidatePath('/dashboard')
  return conversationId
}

export async function getChatResponse(conversationId: string, userMessage: string, language: string) {
  // Get conversation context
  const conversation = await getConversation(conversationId)

  if (!conversation) {
    throw new Error('Conversation not found')
  }

  // Build context for AI (not used in mock implementation)
  // let systemPrompt = `You are Crop-Synth, an AI farming assistant for Kerala farmers. You provide practical, actionable advice about farming, crop management, pest control, and agricultural practices suitable for Kerala's climate and conditions.
  //
  // Always respond in a helpful, friendly manner. Keep responses concise but informative. Focus on practical solutions that small-scale farmers can implement.`
  //
  // if (conversation.farm_context) {
  //   systemPrompt += `
  //
  // Farm Context:
  // - Location: ${conversation.farm_context.location}
  // - Primary Crops: ${conversation.farm_context.currentCrops?.join(', ') || 'None specified'}
  //
  // Tailor your advice to these specific crops and location.`
  // }
  //
  // // Language-specific instructions
  // if (language === 'ml') {
  //   systemPrompt += '\n\nRespond in Malayalam (മലയാളം). Use simple, clear language that farmers can easily understand.'
  // } else if (language === 'hi') {
  //   systemPrompt += '\n\nRespond in Hindi (हिंदी). Use simple, clear language that farmers can easily understand.'
  // }

  // Prepare messages for AI (not used in mock implementation)
  // const messages = [
  //   { role: 'system', content: systemPrompt },
  //   ...(conversation.messages || []).map((msg: { role: string; content: string }) => ({
  //     role: msg.role,
  //     content: msg.content,
  //   })),
  //   { role: 'user', content: userMessage },
  // ]

  // For demo purposes, return a mock response
  // In production, you would integrate with OpenAI or another AI service
  const mockResponses = [
    'Based on your location and crops, I recommend regular monitoring for pests. Consider using neem oil as a natural pesticide.',
    'For better yield, ensure proper irrigation and soil testing. The monsoon season is approaching, so prepare for water management.',
    'I suggest crop rotation to maintain soil health. Consider planting legumes in your next cycle to naturally enrich the soil with nitrogen.',
    'Monitor for common diseases like leaf spot and powdery mildew. Early detection and treatment can save your crops.',
  ]

  const aiResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)]

  // Add both user message and AI response to conversation
  await addMessage(conversationId, {
    role: 'user',
    content: userMessage,
    timestamp: new Date().toISOString(),
    language,
  })

  await addMessage(conversationId, {
    role: 'assistant',
    content: aiResponse,
    timestamp: new Date().toISOString(),
    language,
  })

  return {
    response: aiResponse,
    conversationId,
  }
}
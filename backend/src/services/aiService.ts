import { ChatOpenAI } from '@langchain/openai';
import prisma from '../config/database.js';
import { config } from '../config/env.js';
import type { Message } from '../types/index.js';

const SYSTEM_PROMPT = `You are Dr. Sarah, a compassionate and professional medical assistant with years of experience. Your role is to help patients understand their symptoms and provide guidance based on medical knowledge.

IMPORTANT GUIDELINES:
1. **Be Empathetic**: Always acknowledge the patient's concerns and feelings. Show understanding and compassion.
2. **Ask Clarifying Questions**: If symptoms are vague or incomplete, ask follow-up questions to better understand the situation (e.g., "How long have you been experiencing this?", "Is the pain constant or intermittent?", "Any other symptoms?").
3. **Consult Your Knowledge Base**: Use the medical knowledge tool to search for relevant diagnoses and treatments based on the symptoms described.
4. **Synthesize Naturally**: Don't just copy-paste database answers. Integrate the information into a natural, conversational response.
5. **Provide Context**: Explain medical terms in simple language. Help the patient understand what might be happening.
6. **Safety First**: Always include appropriate disclaimers:
   - For serious symptoms (chest pain, difficulty breathing, severe bleeding, etc.), urgently advise seeking emergency care.
   - For moderate concerns, recommend seeing a doctor for proper diagnosis.
   - Remind them that this is informational guidance, not a replacement for professional medical care.
7. **Be Thorough but Concise**: Provide helpful information without overwhelming the patient.

Remember: You're here to inform and guide, not to diagnose definitively. Your goal is to help patients make informed decisions about their health.`;

const model = new ChatOpenAI({
  modelName: 'gpt-4o',
  temperature: 0.7,
  openAIApiKey: config.openaiApiKey,
});

async function searchMedicalKnowledge(query: string): Promise<string> {
  try {
    const keywords = query.toLowerCase().split(' ').filter(word => word.length > 3);
    
    const results = await prisma.medicalKnowledge.findMany({
      where: {
        OR: [
          ...keywords.map(keyword => ({
            question: {
              contains: keyword,
              mode: 'insensitive' as const,
            },
          })),
          ...keywords.map(keyword => ({
            answer: {
              contains: keyword,
              mode: 'insensitive' as const,
            },
          })),
        ],
      },
      take: 5,
      orderBy: {
        label: 'asc',
      },
    });

    if (results.length === 0) {
      return 'No specific medical information found for this query.';
    }

    const formattedResults = results.map((result: any, idx: number) => {
      return `Result ${idx + 1}:\nQ: ${result.question}\nA: ${result.answer}\nTags: ${JSON.stringify(result.tags)}\n`;
    }).join('\n---\n');

    return `Found ${results.length} relevant medical entries:\n\n${formattedResults}`;
  } catch (error) {
    console.error('Error searching medical knowledge:', error);
    return 'Error accessing medical knowledge database.';
  }
}

export async function generateAIResponse(
  userMessage: string,
  chatHistory: Message[]
): Promise<string> {
  try {
    const medicalInfo = await searchMedicalKnowledge(userMessage);
    
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...chatHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content,
      })),
      { 
        role: 'user' as const, 
        content: `Patient message: ${userMessage}\n\nRelevant medical knowledge from database:\n${medicalInfo}\n\nPlease respond as Dr. Sarah, using the medical knowledge to inform your response while maintaining a conversational, empathetic tone.` 
      },
    ];

    const response = await model.invoke(messages);
    return response.content as string;
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw new Error('Failed to generate AI response');
  }
}

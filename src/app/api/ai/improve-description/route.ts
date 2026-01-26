import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { description, mode = 'improve' } = await request.json();

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Description is required and must be a string' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    // Different prompts based on mode
    const prompts = {
      improve: `Please improve the following description by making it clearer, more concise, and more professional while keeping the original meaning:

"${description}"

Return only the improved description without any additional explanation.`,
      
      extract: `Please extract the key points from the following description as a bulleted list:

"${description}"

Return only the key points in a clear, bulleted format.`,
      
      rewrite: `Please rewrite the following description in a more engaging and professional way:

"${description}"

Return only the rewritten description without any additional explanation.`,

      tags: `Please analyze the following location/production notes and suggest 5-8 relevant, concise tags (metadata keywords) that would help categorize and search for this location.

"${description}"

Return ONLY a comma-separated list of tags, each tag should be 1-3 words maximum, lowercase, and relevant to filming/photography locations. Example format: outdoor, urban, brick wall, natural light, parking available

Do not include any explanation, just the comma-separated tags.`,
    };

    const systemPrompt = mode === 'extract' 
      ? 'You are a helpful assistant that extracts key information from text.'
      : mode === 'tags'
      ? 'You are a helpful assistant that generates relevant metadata tags for location descriptions.'
      : 'You are a helpful assistant that improves written descriptions.';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using the more cost-effective model
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: prompts[mode as keyof typeof prompts] || prompts.improve,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const improvedDescription = completion.choices[0]?.message?.content?.trim();

    if (!improvedDescription) {
      return NextResponse.json(
        { error: 'Failed to generate improved description' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      original: description,
      improved: improvedDescription,
      mode,
      usage: {
        promptTokens: completion.usage?.prompt_tokens,
        completionTokens: completion.usage?.completion_tokens,
        totalTokens: completion.usage?.total_tokens,
      },
    });
  } catch (error) {
    console.error('Error improving description:', error);
    return NextResponse.json(
      { error: 'Failed to process description' },
      { status: 500 }
    );
  }
}

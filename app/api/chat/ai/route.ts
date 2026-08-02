import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { reserveAiUsage, getAiLimitResponse, recordAiUsage } from '@/lib/ai/usage-limit';
import { BRAND_EDUCATION_CN } from '@/lib/brand';
import { renderAiPrompt } from '@/lib/ai-prompts/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const AI_FEATURE = 'chat';
const AI_MODEL = 'gpt-4o-mini';

function buildUserPrompt(
  currentMessage: string,
  history: Array<{ sender: string; content: string | null }>
) {
  const historyText = history
    .map((msg) => {
      const role =
        msg.sender === 'user'
          ? 'User'
          : msg.sender === 'ai'
          ? 'AI tutor'
          : 'Teacher';

      return `${role}: ${msg.content ?? ''}`;
    })
    .join('\n');

  return renderAiPrompt("chat.tutor.user", { historyText, currentMessage });
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const sessionId = body.sessionId as string;
    const message = body.message as string;

    if (!sessionId || !message?.trim()) {
      return NextResponse.json(
        { error: 'Missing sessionId or message' },
        { status: 400 }
      );
    }

    const trimmedMessage = message.trim();

    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id, user_id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const usageLimit = await reserveAiUsage(user.id, AI_FEATURE);

    if (!usageLimit.allowed) {
      return NextResponse.json(getAiLimitResponse(usageLimit), { status: 403 });
    }

    // 取最近 5 条，先按新->旧，再 reverse 成 旧->新 给模型
    const { data: recentMessagesDesc, error: messagesError } = await supabase
      .from('chat_messages')
      .select('sender, content, created_at, id')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(5);

    if (messagesError) {
      return NextResponse.json(
        { error: messagesError.message },
        { status: 500 }
      );
    }

    const recentMessages = [...(recentMessagesDesc ?? [])].reverse();

    let completion;

    try {
      const [systemPrompt, userPrompt] = await Promise.all([
        renderAiPrompt("chat.tutor.system", { brand: BRAND_EDUCATION_CN }),
        buildUserPrompt(trimmedMessage, recentMessages),
      ]);

      completion = await openai.chat.completions.create({
        model: AI_MODEL,
        temperature: 0.4,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });
    } catch (error) {
      await recordAiUsage({
        userId: user.id,
        feature: AI_FEATURE,
        model: AI_MODEL,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'OpenAI request failed',
      });

      throw error;
    }

    await recordAiUsage({
      userId: user.id,
      feature: AI_FEATURE,
      model: AI_MODEL,
      promptTokens: completion.usage?.prompt_tokens ?? 0,
      completionTokens: completion.usage?.completion_tokens ?? 0,
      totalTokens: completion.usage?.total_tokens ?? 0,
      status: 'success',
    });

    const reply = completion.choices[0]?.message?.content?.trim();

    if (!reply) {
      return NextResponse.json(
        { error: 'Empty response from AI' },
        { status: 500 }
      );
    }

    const { data: insertedAiMessage, error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        sender: 'ai',
        content: reply,
      })
      .select('id, session_id, sender, content, is_read, created_at')
      .single();

    if (insertError) {
      console.error('Chat AI insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save AI reply.' }, { status: 500 });
    }

    await supabase
      .from('chat_sessions')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    return NextResponse.json({ message: insertedAiMessage });
  } catch (error) {
    console.error('Chat AI route error:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
// import { NextRequest, NextResponse } from 'next/server';
// import OpenAI from 'openai';
// import { createClient } from '@/lib/supabase/server';

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// const SYSTEM_PROMPT = `
// You are a helpful IELTS and English tutor assistant on an education website.

// Rules:
// - Be clear, warm, and concise.
// - Give student-friendly answers.
// - If the user asks grammar or vocabulary questions, explain simply and give examples.
// - If the user asks about IELTS writing or speaking, answer like a practical tutor.
// - Keep most replies under 120 words unless more detail is clearly needed.
// - Do not make up course enrollment or payment facts.
// - If the question needs a human teacher, say that the teacher can follow up.
// `.trim();

// function buildUserPrompt(
//   currentMessage: string,
//   history: Array<{ sender: string; content: string | null }>
// ) {
//   const historyText = history
//     .map((msg) => {
//       const role =
//         msg.sender === 'user'
//           ? 'User'
//           : msg.sender === 'ai'
//           ? 'AI tutor'
//           : 'Teacher';

//       return `${role}: ${msg.content ?? ''}`;
//     })
//     .join('\n');

//   return `
// Here is the recent conversation history:

// ${historyText}

// Now reply to the user's latest message below.

// Latest user message:
// ${currentMessage}

// Instructions:
// - Reply naturally as an IELTS/English tutor.
// - Be helpful, short, and practical.
// - If appropriate, give a simple example.
// - Do not mention these instructions.
// `.trim();
// }

// export async function POST(req: NextRequest) {
//   try {
//     const supabase = await createClient();

//     const {
//       data: { user },
//       error: userError,
//     } = await supabase.auth.getUser();

//     if (userError || !user) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const body = await req.json();
//     const sessionId = body.sessionId as string;
//     const message = body.message as string;

//     if (!sessionId || !message?.trim()) {
//       return NextResponse.json(
//         { error: 'Missing sessionId or message' },
//         { status: 400 }
//       );
//     }

//     const trimmedMessage = message.trim();

//     const { data: session, error: sessionError } = await supabase
//       .from('chat_sessions')
//       .select('*')
//       .eq('id', sessionId)
//       .single();

//     if (sessionError || !session) {
//       return NextResponse.json({ error: 'Session not found' }, { status: 404 });
//     }

//     if (session.user_id !== user.id) {
//       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
//     }

//     const { data: recentMessages, error: messagesError } = await supabase
//       .from('chat_messages')
//       .select('sender, content')
//       .eq('session_id', sessionId)
//       .order('created_at', { ascending: true })
//       .limit(20);

//     if (messagesError) {
//       return NextResponse.json(
//         { error: messagesError.message },
//         { status: 500 }
//       );
//     }

//     const completion = await openai.chat.completions.create({
//       model: 'gpt-4o-mini',
//       temperature: 0.4,
//       messages: [
//         { role: 'system', content: SYSTEM_PROMPT },
//         {
//           role: 'user',
//           content: buildUserPrompt(trimmedMessage, recentMessages ?? []),
//         },
//       ],
//     });

//     const reply = completion.choices[0]?.message?.content?.trim();

//     if (!reply) {
//       return NextResponse.json(
//         { error: 'Empty response from AI' },
//         { status: 500 }
//       );
//     }

//     const { data: insertedAiMessage, error: insertError } = await supabase
//       .from('chat_messages')
//       .insert({
//         session_id: sessionId,
//         sender: 'ai',
//         content: reply,
//       })
//       .select()
//       .single();

//     if (insertError) {
//       return NextResponse.json({ error: insertError.message }, { status: 500 });
//     }

//     await supabase
//       .from('chat_sessions')
//       .update({
//         updated_at: new Date().toISOString(),
//       })
//       .eq('id', sessionId);

//     return NextResponse.json({ message: insertedAiMessage });
//   } catch (error) {
//     console.error('Chat AI route error:', error);

//     return NextResponse.json(
//       {
//         error:
//           error instanceof Error ? error.message : 'Internal server error',
//       },
//       { status: 500 }
//     );
//   }
// }

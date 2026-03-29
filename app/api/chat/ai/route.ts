
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
You are a helpful IELTS and English tutor assistant on an education website.

Rules:
- Be clear, warm, and concise.
- Give student-friendly answers.
- If the user asks grammar or vocabulary questions, explain simply and give examples.
- If the user asks about IELTS writing or speaking, answer like a practical tutor.
- Keep most replies under 120 words unless more detail is clearly needed.
- Do not make up course enrollment or payment facts.
- If the question needs a human teacher, say that the teacher can follow up.
`.trim();

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

  return `
Here is the recent conversation history:

${historyText}

Now reply to the user's latest message below.

Latest user message:
${currentMessage}

Instructions:
- Reply naturally as an IELTS/English tutor.
- Be helpful, short, and practical.
- If appropriate, give a simple example.
- Do not mention these instructions.
`.trim();
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
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: recentMessages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('sender, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(20);

    if (messagesError) {
      return NextResponse.json(
        { error: messagesError.message },
        { status: 500 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: buildUserPrompt(trimmedMessage, recentMessages ?? []),
        },
      ],
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
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
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
// import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
// import { createClient } from '@/lib/supabase/server';

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

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

//     const systemPrompt = `
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

//     const history: ChatCompletionMessageParam[] =
//       recentMessages?.map((msg) => ({
//         role: msg.sender === 'user' ? 'user' : 'assistant',
//         content: String(msg.content ?? ''),
//       })) ?? [];

//     const messages: ChatCompletionMessageParam[] = [
//       { role: 'system', content: systemPrompt },
//       ...history,
//       { role: 'user', content: trimmedMessage },
//     ];

//     const completion = await openai.chat.completions.create({
//       model: 'gpt-4.1-mini',
//       messages,
//       temperature: 0.7,
//     });

//     const reply = completion.choices[0]?.message?.content?.trim();

//     if (!reply) {
//       return NextResponse.json(
//         { error: 'No AI reply generated' },
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
//     console.error('AI route error:', error);

//     return NextResponse.json(
//       { error: 'Failed to generate AI reply.' },
//       { status: 500 }
//     );
//   }
// }
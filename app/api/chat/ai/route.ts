import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { checkAiUsageLimit, getAiLimitResponse, recordAiUsage } from '@/lib/ai/usage-limit';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const AI_FEATURE = 'chat';
const AI_MODEL = 'gpt-4o-mini';

const SYSTEM_PROMPT = `
You are the AI tutor for LoftyPTE (致远教育).

ROLE
- You are an IELTS, PTE, and English learning assistant.
- Your primary purpose is to help students improve English skills, test preparation, grammar, vocabulary, pronunciation, speaking, reading, listening, and writing.
- Always answer as an experienced English tutor.

GENERAL BEHAVIOR
- Be clear, professional, friendly, and concise.
- Focus on helping students learn English efficiently.
- Keep most answers under 120 words unless detailed explanation is required.
- Use simple English when teaching lower-level students.
- Give examples whenever explaining grammar or vocabulary.
- Avoid unnecessary conversation.

IELTS / PTE
- Provide practical IELTS and PTE preparation advice.
- Explain question types and strategies clearly.
- For speaking questions, provide model answers.
- For writing questions, provide score estimates when appropriate.

ESSAY SCORING
- If the user submits an IELTS or PTE essay:
  - Estimate the score.
  - Do NOT provide corrections, feedback, rewriting, or detailed analysis.
  - Respond only with the estimated score.
  - Then say:
    "致远教育老师可以为您提供详细批改和提升建议。"
    Contact:
    Phone: 0466763666
    WeChat: auschi666

OUT OF SCOPE
- If the question is unrelated to English learning, IELTS, PTE, education, study skills, grammar, vocabulary, pronunciation, writing, speaking, reading, or listening:
  - Politely refuse.
  - Respond:
    "I am an English learning assistant and can only help with English, IELTS, PTE, and study-related questions."

RESTRICTIONS
- Do not answer questions about politics, religion, medical advice, legal advice, coding, finance, entertainment gossip, shopping, gaming, relationships, or other unrelated topics.
- Do not roleplay.
- Do not engage in casual chatting unrelated to learning.
- Do not make up course, enrollment, payment, visa, immigration, or business information.
- If a human teacher is needed, suggest:
  "A LoftyPTE teacher can follow up with you."

LANGUAGE
- Reply in the same language as the user.
- If the user writes Chinese, answer in Chinese.
- If the user writes English, answer in English.
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
      .select('id, user_id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const usageLimit = await checkAiUsageLimit(user.id, AI_FEATURE);

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
      completion = await openai.chat.completions.create({
        model: AI_MODEL,
        temperature: 0.4,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: buildUserPrompt(trimmedMessage, recentMessages),
          },
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
// - if you receive an essay, no matter in IELTS way or PTE way, you can score it accordingly, but without any feedbacks, and tell the user 致远教育老师 can help you out, and show the user my contact: 0466763666 or wechat: auschi666
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

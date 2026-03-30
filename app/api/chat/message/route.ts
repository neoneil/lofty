import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

async function getAuthedUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { supabase, user, error };
}

export async function GET(req: NextRequest) {
  try {
    const { supabase, user, error: userError } = await getAuthedUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const sessionId = searchParams.get('sessionId');
    const cursorCreatedAt = searchParams.get('cursorCreatedAt');
    const cursorId = searchParams.get('cursorId');
    const limitParam = Number(searchParams.get('limit') || DEFAULT_LIMIT);

    const limit = Math.min(
      Math.max(Number.isNaN(limitParam) ? DEFAULT_LIMIT : limitParam, 1),
      MAX_LIMIT
    );

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId' },
        { status: 400 }
      );
    }

    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id, user_id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (session.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let query = supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1);

    if (cursorCreatedAt && cursorId) {
      query = query.or(
        `created_at.lt.${cursorCreatedAt},and(created_at.eq.${cursorCreatedAt},id.lt.${cursorId})`
      );
    }

    const { data, error: messagesError } = await query;

    if (messagesError) {
      return NextResponse.json(
        { error: messagesError.message },
        { status: 500 }
      );
    }

    const rows = data ?? [];
    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;

    const nextCursor =
      hasMore && pageRows.length > 0
        ? {
            createdAt: pageRows[pageRows.length - 1].created_at,
            id: pageRows[pageRows.length - 1].id,
          }
        : null;

    // 返回给前端时改成 旧 -> 新，更适合直接渲染
    const messages = [...pageRows].reverse();

    return NextResponse.json({
      messages,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error('Chat message GET route error:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, user, error: userError } = await getAuthedUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const sessionId = body.sessionId as string;
    const content = body.content as string;

    if (!sessionId || !content?.trim()) {
      return NextResponse.json(
        { error: 'Missing sessionId or content' },
        { status: 400 }
      );
    }

    const trimmedContent = content.trim();

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

    const { data: insertedMessage, error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        sender: 'user',
        content: trimmedContent,
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

    return NextResponse.json({ message: insertedMessage });
  } catch (error) {
    console.error('Chat message POST route error:', error);

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
// import { createClient } from '@/lib/supabase/server';

// export async function POST(req: NextRequest) {
//   const supabase = await createClient();

//   const {
//     data: { user },
//     error: userError,
//   } = await supabase.auth.getUser();

//   if (userError || !user) {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//   }

//   const body = await req.json();
//   const sessionId = body.sessionId as string;
//   const content = body.content as string;

//   if (!sessionId || !content?.trim()) {
//     return NextResponse.json(
//       { error: 'Missing sessionId or content' },
//       { status: 400 }
//     );
//   }

//   const trimmedContent = content.trim();

//   const { data: session, error: sessionError } = await supabase
//     .from('chat_sessions')
//     .select('*')
//     .eq('id', sessionId)
//     .single();

//   if (sessionError || !session) {
//     return NextResponse.json({ error: 'Session not found' }, { status: 404 });
//   }

//   if (session.user_id !== user.id) {
//     return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
//   }

//   const { data: insertedMessage, error: insertError } = await supabase
//     .from('chat_messages')
//     .insert({
//       session_id: sessionId,
//       sender: 'user',
//       content: trimmedContent,
//     })
//     .select()
//     .single();

//   if (insertError) {
//     return NextResponse.json({ error: insertError.message }, { status: 500 });
//   }

//   await supabase
//     .from('chat_sessions')
//     .update({
//       updated_at: new Date().toISOString(),
//     })
//     .eq('id', sessionId);

//   return NextResponse.json({ message: insertedMessage });
// }
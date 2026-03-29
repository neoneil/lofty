import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
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
    .select('*')
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
}
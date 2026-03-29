import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !['admin', 'editor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

    const { data: insertedMessage, error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        sender: 'admin',
        content: trimmedContent,
        is_read: true,
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
    console.error('Admin reply route error:', error);
    return NextResponse.json(
      { error: 'Failed to send reply.' },
      { status: 500 }
    );
  }
}
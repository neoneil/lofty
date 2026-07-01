import { NextRequest, NextResponse } from 'next/server';
import { requireApiAdminOrEditor } from '@/lib/auth/require-api-auth';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiAdminOrEditor();
    if (!auth.ok) return auth.response;
    const { supabase } = auth;

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

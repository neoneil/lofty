import { NextRequest, NextResponse } from 'next/server';
import { requireApiAdminOrEditor } from '@/lib/auth/require-api-auth';
import { createAdminClient } from '@/lib/supabase/admin';

function getVirtualUserId(sessionId: string) {
  return sessionId.startsWith('no-session:') ? sessionId.slice('no-session:'.length) : null;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiAdminOrEditor();
    if (!auth.ok) return auth.response;
    const supabase = createAdminClient();

    const sessionId = req.nextUrl.searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    const virtualUserId = getVirtualUserId(sessionId);
    if (virtualUserId) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', virtualUserId)
        .maybeSingle();

      if (profileError || !profile || profile.role === 'admin' || profile.role === 'editor') {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      return NextResponse.json({ messages: [] });
    }

    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('id, session_id, sender, content, is_read, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Admin messages load error:', messagesError);
      return NextResponse.json({ error: 'Failed to load chat messages.' }, { status: 500 });
    }

    await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('session_id', sessionId)
      .eq('sender', 'user')
      .eq('is_read', false);

    return NextResponse.json({ messages: messages ?? [] });
  } catch (error) {
    console.error('Admin messages route error:', error);
    return NextResponse.json(
      { error: 'Failed to load chat messages.' },
      { status: 500 }
    );
  }
}

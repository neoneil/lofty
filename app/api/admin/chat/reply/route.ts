import { NextRequest, NextResponse } from 'next/server';
import { requireApiAdminOrEditor } from '@/lib/auth/require-api-auth';
import { createAdminClient } from '@/lib/supabase/admin';

function getVirtualUserId(sessionId: string) {
  return sessionId.startsWith('no-session:') ? sessionId.slice('no-session:'.length) : null;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiAdminOrEditor();
    if (!auth.ok) return auth.response;
    const supabase = createAdminClient();

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
    let targetSessionId = sessionId;

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

      const { data: existingSession, error: existingError } = await supabase
        .from('chat_sessions')
        .select('id, user_id, status, created_at, updated_at')
        .eq('user_id', virtualUserId)
        .eq('status', 'open')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingError) {
        console.error('Admin virtual session lookup error:', existingError);
        return NextResponse.json({ error: 'Failed to send reply.' }, { status: 500 });
      }

      if (existingSession) {
        targetSessionId = existingSession.id;
      } else {
        const { data: createdSession, error: createError } = await supabase
          .from('chat_sessions')
          .insert({
            user_id: virtualUserId,
            status: 'open',
          })
          .select('id, user_id, status, created_at, updated_at')
          .single();

        if (createError || !createdSession) {
          console.error('Admin virtual session create error:', createError);
          return NextResponse.json({ error: 'Failed to send reply.' }, { status: 500 });
        }

        targetSessionId = createdSession.id;
      }
    }

    const { data: insertedMessage, error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: targetSessionId,
        sender: 'admin',
        content: trimmedContent,
        is_read: true,
      })
      .select('id, session_id, sender, content, is_read, created_at')
      .single();

    if (insertError) {
      console.error('Admin reply insert error:', insertError);
      return NextResponse.json({ error: 'Failed to send reply.' }, { status: 500 });
    }

    await supabase
      .from('chat_sessions')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetSessionId);

    return NextResponse.json({ message: insertedMessage, sessionId: targetSessionId });
  } catch (error) {
    console.error('Admin reply route error:', error);
    return NextResponse.json(
      { error: 'Failed to send reply.' },
      { status: 500 }
    );
  }
}

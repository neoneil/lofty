
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: existing, error: existingError } = await supabase
      .from('chat_sessions')
      .select('id, user_id, status, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json({ session: existing });
    }

    const { data: created, error: createError } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: user.id,
        status: 'open',
      })
      .select('id, user_id, status, created_at, updated_at')
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    return NextResponse.json({ session: created });
  } catch (error) {
    console.error('Chat session route error:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// import { NextResponse } from 'next/server';
// import { createClient } from '@/lib/supabase/server';

// export async function POST() {
//   const supabase = await createClient();

//   const {
//     data: { user },
//     error: userError,
//   } = await supabase.auth.getUser();

//   if (userError || !user) {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//   }

//   const { data: existing, error: existingError } = await supabase
//     .from('chat_sessions')
//     .select('*')
//     .eq('user_id', user.id)
//     .eq('status', 'open')
//     .order('created_at', { ascending: false })
//     .limit(1)
//     .maybeSingle();

//   if (existingError) {
//     return NextResponse.json({ error: existingError.message }, { status: 500 });
//   }

//   if (existing) {
//     return NextResponse.json({ session: existing });
//   }

//   const { data: created, error: createError } = await supabase
//     .from('chat_sessions')
//     .insert({
//       user_id: user.id,
//       status: 'open',
//     })
//     .select()
//     .single();

//   if (createError) {
//     return NextResponse.json({ error: createError.message }, { status: 500 });
//   }

//   return NextResponse.json({ session: created });
// }
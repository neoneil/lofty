import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/require-user';
import { createAdminClient } from '@/lib/supabase/admin';
import { parsePteQuestionBankFilters } from '@/lib/pte/question-bank-pagination';
import { loadPteQuestionOrder } from '@/lib/pte/question-bank-server';
import {
  PTE_ASQ_BANK_CONFIG,
  PTE_DI_BANK_CONFIG,
  PTE_FIBR_BANK_CONFIG,
  PTE_FIBRW_BANK_CONFIG,
  PTE_HIW_BANK_CONFIG,
  PTE_RA_BANK_CONFIG,
  PTE_RL_BANK_CONFIG,
  PTE_RO_BANK_CONFIG,
  PTE_RS_BANK_CONFIG,
  PTE_RTS_BANK_CONFIG,
  PTE_SGD_BANK_CONFIG,
  PTE_SST_BANK_CONFIG,
  PTE_SWT_BANK_CONFIG,
  PTE_WE_BANK_CONFIG,
  PTE_WFD_BANK_CONFIG,
} from '@/lib/pte/question-bank-presets';
import { RA_PRONUNCIATION_DRILL_IDS } from '@/content/pte/ra-pronunciation-drills';
import { RS_CORE_DRILL_IDS } from '@/content/pte/rs-core-drills';

const CONFIGS = {
  ra: PTE_RA_BANK_CONFIG,
  rs: PTE_RS_BANK_CONFIG,
  di: PTE_DI_BANK_CONFIG,
  rl: PTE_RL_BANK_CONFIG,
  asq: PTE_ASQ_BANK_CONFIG,
  rts: PTE_RTS_BANK_CONFIG,
  sgd: PTE_SGD_BANK_CONFIG,
  swt: PTE_SWT_BANK_CONFIG,
  we: PTE_WE_BANK_CONFIG,
  essay: PTE_WE_BANK_CONFIG,
  ro: PTE_RO_BANK_CONFIG,
  fibr: PTE_FIBR_BANK_CONFIG,
  fibrw: PTE_FIBRW_BANK_CONFIG,
  sst: PTE_SST_BANK_CONFIG,
  hiw: PTE_HIW_BANK_CONFIG,
  wfd: PTE_WFD_BANK_CONFIG,
} as const;

type QuestionOrderType = keyof typeof CONFIGS;

function readParams(searchParams: URLSearchParams) {
  const params: Record<string, string> = {};

  searchParams.forEach((value, key) => {
    if (key !== 'type') params[key] = value;
  });

  params.page = '1';
  return params;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') as QuestionOrderType | null;

  if (!type || !(type in CONFIGS)) {
    return NextResponse.json({ ok: false, message: 'Unknown PTE question type.' }, { status: 400 });
  }

  const { supabase, user } = await requireUser('/pte');
  const admin = createAdminClient();
  const filters = parsePteQuestionBankFilters(readParams(searchParams));

  try {
    const ids = await loadPteQuestionOrder({
      supabase,
      admin,
      userId: user.id,
      filters,
      config: CONFIGS[type],
    });

    const pinnedIds = type === 'ra' ? RA_PRONUNCIATION_DRILL_IDS : type === 'rs' ? RS_CORE_DRILL_IDS : [];
    const orderedIds = pinnedIds.length > 0
      ? [...pinnedIds, ...ids.filter((id) => !pinnedIds.includes(id))]
      : ids;

    return NextResponse.json({ ok: true, ids: orderedIds });
  } catch (error) {
    console.error('PTE question order load failed:', error);
    return NextResponse.json({ ok: false, message: '题目顺序加载失败。' }, { status: 500 });
  }
}

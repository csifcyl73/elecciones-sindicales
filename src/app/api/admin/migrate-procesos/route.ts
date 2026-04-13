import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { error: authErr } = await requireAuth(['super_nacional']);
  if (authErr) return authErr;

  const supabase = createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'),
    (process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder')
  );

  const results: string[] = [];

  try {
    // 1. Create procesos_electorales table - check if it exists first
    const { data: tableCheck } = await supabase
      .from('procesos_electorales')
      .select('id')
      .limit(1);

    if (tableCheck === null) {
      // Table doesn't exist - we need to create it via SQL Editor in Supabase Dashboard
      // Since supabase-js doesn't support DDL, return instructions
      return NextResponse.json({
        error: 'DDL_REQUIRED',
        message: 'Please run the following SQL in your Supabase SQL Editor',
        sql: `
CREATE TABLE IF NOT EXISTS public.procesos_electorales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  periodo TEXT,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE public.unidades_electorales ADD COLUMN proceso_electoral_id UUID REFERENCES public.procesos_electorales(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE public.unidades_electorales ADD COLUMN anio INT;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;
        `.trim()
      });
    }

    results.push('procesos_electorales table exists');

    // Check if columns exist in unidades_electorales
    const { data: testUnit } = await supabase
      .from('unidades_electorales')
      .select('proceso_electoral_id, anio')
      .limit(1);

    if (testUnit !== null) {
      results.push('columns proceso_electoral_id and anio exist');
    } else {
      results.push('columns may not exist yet - run the SQL above');
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const getAdmin = () => createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'),
  (process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder')
);

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authErr } = await requireAuth(['super_nacional', 'super_autonomico']);
  if (authErr) return authErr;

  try {
    const supabase = getAdmin();
    // Await params in Next.js 15+ as required for dynamic route segments
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
       return NextResponse.json({ error: 'Falta ID' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('unidades_electorales')
      .select(`
        *,
        mesas:mesas_electorales(*),
        sindicatos:unidades_sindicatos(sindicato_id)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

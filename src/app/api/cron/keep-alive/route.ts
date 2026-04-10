import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // Opcional: Solo permitir peticiones de Vercel Cron
  // const authHeader = req.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   // return new Response('Unauthorized', { status: 401 });
  // }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Realizamos una consulta simple a la tabla de sindicatos para mantener activa la instancia
    const { data, error } = await supabase
      .from('sindicatos')
      .select('siglas')
      .limit(1);

    if (error) throw error;

    console.log('Cron Keep-Alive: DB Pinged successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'Supabase keep-alive successful',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Cron Keep-Alive Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

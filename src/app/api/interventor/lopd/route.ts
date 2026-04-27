import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || session.user.user_metadata?.role !== 'interventor') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, email, nombre } = body;

    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'ID mismatch' }, { status: 400 });
    }

    // Cliente administrador de Supabase para poder borrar el usuario
    const adminSupabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Insertar en lopd_bajas
    const { error: insertError } = await adminSupabase
      .from('lopd_bajas')
      .insert({
        email: email,
        nombre_completo: nombre,
      });

    // Ignoramos si ya existe (código 23505 Unique Violation), significa que ya pidió baja antes
    if (insertError && insertError.code !== '23505') {
      console.error("Error al registrar en lopd_bajas:", insertError);
      return NextResponse.json({ error: 'Error al procesar la baja (registro)' }, { status: 500 });
    }

    // 2. Eliminar al usuario de auth.users (Supabase Admin API)
    // Debido a ON DELETE CASCADE en public.usuarios, esto también lo eliminará de ahí.
    // Además, ON DELETE SET NULL en interventor_id de mesas_electorales quitará su asignación.
    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Error al borrar el usuario:", deleteError);
      return NextResponse.json({ error: 'Error al borrar el usuario de la base de datos' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("Error no controlado:", err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

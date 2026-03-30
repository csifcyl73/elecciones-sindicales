# SOP - Implementación de Acceso para Interventores

## Objetivo
Crear una interfaz de login para interventores que sea visualmente consistente con el resto del sistema de administración y que valide correctamente los permisos en Supabase.

## Lógica de Autenticación
1.  **Validación de Credenciales**: Uso de `supabase.auth.signInWithPassword`.
2.  **Validación de Rol**: El campo `user_metadata.role` debe ser exactamente `interventor`.
3.  **Redirección**: Tras éxito, navegar a `/interventor/dashboard`.
4.  **Seguridad**: Si el usuario no tiene el rol correcto, se debe cerrar la sesión automáticamente (`signOut`) y mostrar error.

## Estándares de UI
- Fondo gris claro (`bg-gray-50`) con marcas de agua animadas.
- Botón de retorno al inicio en la esquina superior izquierda.
- Badge distintivo de rol en la parte superior del login.
- Título principal: "IDENTIFÍCATE" (en negrita, verde).
- Uso de `lucide-react` para iconos y feedback visual.

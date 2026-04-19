# SOP - Gestión del Superadministrador (Root) y Alta de Administradores Nacionales

## Objetivo
Implementar un perfil de máxima jerarquía ("Root" o "Propietario") en el Sistema de Elecciones Sindicales encargado de gestionar de forma exclusiva el alta y baja de los perfiles de "Administrador Nacional" mediante una UI segura. 

## Componentes de la Arquitectura

1. **Modificación de Base de Datos (Supabase)**
   - **Tipos de Usuario**: Expandir el ENUM `rol_usuario` para incluir temporalmente el rol `super_admin_sistema` u homologable.
   - Si no es posible modificar el ENUM directamente en SQL en un paso seguro, la alternativa es utilizar un campo adicional o un script especial para mantener este rol.
   - Actualizar encriptado y RLS (Row Level Security) para que solo este rol pueda crear o modificar perfiles que tengan el rol de `super_nacional`.

2. **Panel de UI Seguro (Frontend)**
   - **Ruta de Login**: `/admin/root` (oculta de la navegación principal).
   - **Dashboard**: Panel extremadamente simple que solo lista los "Administradores Nacionales" actuales.
   - **Formulario de Alta**: Captura Email, Nombre Completo, DNI y Contraseña para el nuevo administrador.
   - **Botón de Revocación**: Permite eliminar o deshabilitar un administrador nacional existente.
   - **Botón de Reseteo de Contraseña**: Permite a Root cambiar o asignar una nueva contraseña a un administrador nacional existente (usando supabaseAdmin.auth.admin.updateUserById).

3. **Backend API Bypassing (Supabase Admin)**
   - **Ruta**: `/api/root/gestion-nacionales` o `/api/root/nacionales`.
   - Utilizar la `supabase_service_role_key` para interactuar con la consola de Auth de Supabase (crear, listar, eliminar y actualizar mediante updateUserById para el reset de password) y esquivar restricciones estándar. Garantizando que la clave maestra nunca se filtre al frontend.
   - El endpoint debe validar robustamente la sesión JWT de la persona que hace la petición (debe ser `super_admin_sistema` u homologable).

## Pasos Requeridos para Construcción
1. **Definir el Perfil Superior**: Crear un nuevo script de migración SQL o una capa lógica para admitir el rol.
2. **Preparar el Primer Root**: Crear el script Node (en `/scripts`) para `configurar_root.mjs` que inyecte de forma encriptada el primer usuario de máximo nivel.
3. **Construir el Panel Frontend**: Crear el entorno visual protegido en `/src/app/root/...`.
4. **Validación y Pruebas**: Intentar inyectar roles no permitidos para verificar las barreras.

## Restricciones y Casos Borde
- **Aislamiento**: El perfil Root no debe poder ver ni editar elecciones ni interactuar con mesas, está netamente enfocado a control de identidad de los Nacionales.
- **Protección de API**: El service_role_key de supabase otorga permisos destructivos absolutos; debe estar confinado solo a su ruta back-end concreta y protegido con la comprobación de sesión.

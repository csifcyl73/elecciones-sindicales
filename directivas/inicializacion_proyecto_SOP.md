# SOP - Inicializacion del Proyecto "Elecciones Sindicales"

## Objetivo
Configurar y preparar el entorno de desarrollo para el sistema de gestión de elecciones sindicales, asegurando que todas las dependencias, la base de datos (Supabase) y los datos maestros estén correctamente registrados.

## Pasos de Inicialización
1. **Instalación de Dependencias**: Ejecutar `npm install` para asegurar que todas las librerías necesarias (shadcn, lucide, supabase, tailwind, etc.) estén instaladas.
2. **Configuración de Variables de Entorno**: Verificar la existencia y validez de `.env.local` con las claves de Supabase.
3. **Migración de Base de Datos**: Aplicar las migraciones necesarias a la base de datos de Supabase para establecer el esquema (tablas, RLS, funciones).
4. **Carga de Datos Maestros (Seed)**: Poblar las tablas maestras (provincias, sectores, tipos de órganos) necesarias para el funcionamiento del sistema.
5. **Verificación**: Comprobar que el servidor de desarrollo (`npm run dev`) inicia correctamente y que la conexión con Supabase es estable.

## Restricciones y Casos Borde
- **Python**: En este sistema, Python no se encuentra en el PATH. Por tanto, se deben usar scripts de Node.js (.mjs) para las tareas de automatización y mantenimiento.
- **Errores de Red**: Si la instalación de dependencias falla, reintentar con el caché limpio.
- **Supabase**: Las claves API deben tener permisos suficientes para ejecutar scripts de administración si se están poblando tablas protegidas.
- **Compatibilidad**: Asegurar que la versión de Node.js sea compatible con Next.js 15+ (v18.17 o v20.x).

## Script de Automatización
Se creó un script de Node.js (`scripts/inicializar_proyecto.mjs`) que orquesta estos pasos. Se probó y verificó que funciona correctamente sobre el entorno Windows.

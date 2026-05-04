# SOP - Estrategia de Backups en QNAP (CSIF Elecciones)

## Objetivo
Garantizar la integridad de los datos electorales mediante la automatización de copias de seguridad externas desde Supabase (Cloud) hacia un almacenamiento físico local (QNAP NAS).

## Componentes del Sistema

1.  **Origen (Cloud):** Base de Datos PostgreSQL en Supabase.
2.  **Mediador (Script):** Script de Python que ejecuta `pg_dump` y organiza los archivos por fecha.
3.  **Destino (NAS):** Carpeta compartida en el NAS de QNAP.

## Protocolo de Backup

### 1. Ejecución del Dump
- El script debe conectar a Supabase usando la cadena de conexión de administrador (port 5432 o 6543 para pooling).
- Se genera un archivo comprimido `.sql.gz` con el esquema completo y los datos.
- **Validación Crítica:** El backup DEBE incluir la tabla `public.lopd_bajas`.

### 2. Rotación de Archivos
- Mantener una copia diaria durante los últimos 7 días.
- Mantener una copia semanal durante el último mes.
- Mantener una copia mensual de forma indefinida.

### 3. Integración con QNAP
- **Opción A (Recomendada):** Mapear una unidad de red (SMB) en el servidor que ejecuta el script y guardar directamente en `Z:\Backups_Elecciones`.
- **Opción B (Sincronización):** Guardar localmente en una carpeta sincronizada con **QNAP Qsync** o **Hybrid Backup Sync (HBS 3)**.

## Consideraciones de Seguridad
- Las credenciales de la base de datos NUNCA deben estar en el código. Usar archivo `.env`.
- El acceso al NAS debe estar restringido a un usuario específico con permisos de escritura.

## Instrucciones de Uso del Script

El script `scripts/backups/dump_supabase.py` automatiza la extracción de datos.

### 1. Requisitos Previos
- Tener instalado **PostgreSQL** localmente (incluye `pg_dump`).
- Asegurarse de que `pg_dump` esté en las variables de entorno (PATH) o configurar la ruta en el script.
- Configurar `DATABASE_URL` en `.env.production.local`.

### 2. Configuración del NAS (QNAP)
Para que el backup se guarde en el QNAP, tienes dos opciones:

- **Unidad de Red:** Mapea una carpeta del NAS en Windows como una letra de unidad (ej. `Z:`). Luego en el script o en `.env`, pon `BACKUP_DIR=Z:/Backups_Elecciones`.
- **Sincronización:** Guarda los backups en una carpeta local del PC y usa **QNAP Qsync** para que se suban automáticamente al NAS en tiempo real.

### 3. Automatización (Tarea Programada)
- Abre el "Programador de Tareas" de Windows.
- Crea una tarea básica que ejecute: `python c:\ruta\al\proyecto\scripts\backups\dump_supabase.py`.
- Prográmala para que se ejecute diariamente (ej. a las 03:00 AM).

## Verificación de Integridad
Tras cada backup, el script verificará:
1. El tamaño del archivo resultante.
2. Si el archivo se creó correctamente en la ruta especificada.

> [!IMPORTANT]
> Recuerda que el backup es un archivo SQL plano. Asegúrate de que la carpeta en el QNAP tenga permisos restringidos para cumplir con el RGPD.

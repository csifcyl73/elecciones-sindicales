# SOP - Configurador de Elecciones (Admin Nacional)

## Objetivo
Implementar un formulario robusto para que el administrador nacional configure nuevas unidades electorales con par谩metros geogr谩ficos, sectoriales y org谩nicos.

## Estructura de la Single Page Application (Todo en un paso)
- **Provincia**: Buscador desplegable de provincias.
- **Localidad**: Buscador desplegable de municipios espa帽oles (`municipios.json`).
- **Unidad Electoral**: Desplegable global (NO se filtra por provincia ni sector). Incluye bot贸n de creaci贸n de nueva unidad. Alerta de Incoherencia si difiere con 脫rgano.
- **Tipo de 脫rgano**: Desplegable (Junta de Personal, Comit茅 de Empresa, etc).
- **Delegados**: 
  - Si "COMIT脡 DE EMPRESA": Mostrar radio/botones para "COLEGIO 脷NICO" o "DOS COLEGIOS".
    - Si "COLEGIO 脷NICO": un campo num茅rico.
    - Si "DOS COLEGIOS": dos campos num茅ricos.
  - Si "JUNTA DE PERSONAL": un campo num茅rico.
  - **Validaci贸n Estricta**: La suma/valor total DEBE SER IMPAR.
- **Asignar Interventor**: Buscador desplegable de usuarios con rol `interventor`.
- **Bot贸n Grabar**: Guarda todas las elecciones de una y activa el protocolo de notificaci贸n.
- **Protocolo de Notificaci贸n**: Al guardar con 茅xito, se debe disparar un enlace `mailto:` que abra el cliente de correo predeterminado (Outlook) con los interventores en copia, asunto formal y cuerpo estandarizado.

## Flujo de Datos
- **Lectura**: Obtenci贸n masiva de maestros por Supabase y el JSON de `municipios`.
- **Escritura**: 
  1. `unidades_electorales` (update con total delegados, provincia, tipo de 贸rgano).
  2. `mesas_electorales` (creaci贸n de MESA 1 base y asignaci贸n de interventor).
  3. POST a la API (o simulaci贸n) de env铆o de email al interventor.
- **UI/UX**: Unificaci贸n de flujo, sin subrutas ni pasos intermedios. Usar `shadcn/ui` custom styling con esmeraldas y transparencias para el estilo Premium CSIF.

## Seguridad
- Validar sesi贸n activa de Administrador Nacional.
- Sanitizaci贸n de entradas para la creaci贸n de nuevas unidades electorales.

## Errores y Casos Borde:
1. **Duplicaci髇 de Unidades Electorales**: 
   - *Problema*: Al crear una unidad electoral desde el frontend, m鷏tiples clics o peticiones as韓cronas desincronizadas pod韆n crear dos entidades con el mismo nombre y diferente UUID.
   - *Soluci髇*: En el endpoint POST /api/admin/unidades, se debe realizar un maybeSingle() de b鷖queda con 	oUpperCase() antes del insert(). Si existe, devolver la existente en lugar de duplicarla.
2. **Registro de Sindicatos No Deseados en Escrutinio**: 
   - *Problema*: Durante la inserci髇 de actas de una mesa, si se mandaba un array otos_candidaturas que conten韆 IDs de sindicatos no configurados en esa unidad electoral, el upsert los admit韆, ensuciando los reportes de resultados.
   - *Soluci髇*: Previo al insert en POST /api/interventor/mesa/[id], se ejecuta un borrado previo \wait supabaseAdmin.from('votos_candidaturas').delete().eq('mesa_id', mesa_id);\ y posteriormente un \insert\ r韌ido (no upsert) 鷑icamente de los que el frontend env韆 (siendo el frontend responsable de cargar 鷑icamente los \unidades_sindicatos\). Esto asegura siempre un estado 1:1 con el acta enviada.

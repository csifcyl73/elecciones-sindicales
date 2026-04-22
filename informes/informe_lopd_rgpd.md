# Informe: Seguridad y Cumplimiento Normativo (LOPD/RGPD)
## Aplicación de Gestión de Elecciones Sindicales

***

### 1. Introducción
El presente informe evalúa el estado de cumplimiento normativo respecto a la Ley Orgánica de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD 3/2018) y el Reglamento General de Protección de Datos (RGPD UE 2016/679) en la infraestructura y aplicación web de Gestión de Elecciones Sindicales.

### 2. Infraestructura y Transferencia Internacional de Datos

El sistema utiliza **Supabase** como proveedor de base de datos (PostgreSQL), alojado en servidores ubicados en **Frankfurt, Alemania**.

*   **Cumplimiento Geográfico (RGPD):** Al estar los servidores físicamente ubicados en Alemania (Estado miembro de la Unión Europea), el alojamiento **cumple directamente con el RGPD** sin considerarse transferencia internacional de datos fuera del Espacio Económico Europeo (EEE). No se requieren mecanismos adicionales como Cláusulas Contractuales Tipo (SCC).
*   **Proveedor:** Supabase (y sub-procesadores como AWS/GCP en Frankfurt) actúan como Encargados del Tratamiento. Es necesario garantizar que existan los acuerdos de procesamiento de datos (DPA - Data Processing Agreement) firmados.

### 3. Principio de Minimización de Datos

El RGPD exige que solo se recaben los datos estrictamente necesarios para el propósito previsto.

*   **Datos Gestionados:** El sistema gestiona unidades electorales, candidatos, trabajadores en censo y representantes sindicales (incluyendo afiliación).
*   **Categoría Especial (Artículo 9 RGPD):** La **afiliación sindical** tiene la consideración de dato de categoría especial (datos sensibles).
    *   *Requisito:* Su tratamiento requiere el consentimiento explícito del interesado o ampararse en las obligaciones y derechos específicos en el ámbito del derecho laboral y de la seguridad social.
    *   *Recomendación:* Asegurar bases de legitimación documentadas (ej. cumplimiento de obligación legal derivada de normativa electoral sindical).

### 4. Estado de Seguridad del Aplicativo (Privacidad desde el Diseño)

El aplicativo ha superado con éxito tres fases progresivas de auditoría de seguridad, consolidando un entorno robusto y conforme al esquema **Privacy by Design**:

**Fase 1: Control de Accesos (Art. 32 RGPD)**
*   ✅ Implementación de Middleware de Next.js para proteger rutas protegidas (`/admin/*`, `/interventor/*`).
*   ✅ Autorización basada en roles (`super_nacional`, `super_autonomico`, `interventor`).
*   ✅ Requerimiento de autenticación en todas las rutas API (`requireAuth()`).
*   ✅ Eliminación de contraseñas *hardcodeadas* de repositorios.

**Fase 2: Endurecimiento y Mitigación de Superficie de Ataque**
*   ✅ **Políticas RLS base:** Implementación de Row Level Security basada en `auth.uid()` para bloquear consultas anónimas.
*   ✅ **Seguros Perimetrales (CSP):** Inyección de cabeceras HTTP de seguridad (CSP estricto, HSTS, X-Frame-Options, X-Content-Type-Options) bloqueando XSS y Clickjacking.
*   ✅ **Filtro Anti-Abuso:** Implementación de un pre-limitador de peticiones (Rate Limiting) en memoria para mitigar intentos de fuerza bruta sobre endpoints sensibles.

**Fase 3: Zero Trust y Trazabilidad Forense (Nivel Producción)**
*   ✅ **RLS Geográfica (Aislamiento de Múltiples Inquilinos):** Despliegue de funciones SQL avanzadas que interceptan el JWT del usuario (`auth.jwt()->'comunidad'`) para aislar físicamente los datos desde el núcleo de la base de datos (PostgreSQL). Un rol autonómico solo puede, algorítmicamente, consultar su propia región.
*   ✅ **Logs de Auditoría (Trazabilidad Pura):** Implantación de *Triggers* nativos en tablas críticas que documentan el autor de cada modificación, la fecha exacta y el estado "antes/después" (JSON) en la tabla inmutable `audit_logs`.
*   ✅ **Edge Rate Limiting Distribuido:** Parametrización en Middleware de un algoritmo deslizante (*Sliding Window*) conectado a la infraestructura de Upstash Redis, diseñado para absorber picos masivos de ataques en la capa perimetral (Edge) antes de que impacten al servidor.

### 5. Obligaciones Legales Complementarias (Pendiente para el Responsable de Tratamiento)

Para asegurar la adecuación formal a la LOPDGDD/RGPD, el responsable del tratamiento (el sindicato o entidad organizadora) debe:

1.  **Registro de Actividades de Tratamiento (RAT):** Disponer de un registro documentado que de detalle sobre el aplicativo, tipo de datos (incluyendo afiliación sindical), plazos de conservación y estructura de servidores en Frankfurt.
2.  ✅ **Aviso de Privacidad (Capa 1 y Capa 2):** Incorporado exitosamente en el pie (Footer legal) de todas las comunicaciones automáticas de la plataforma a través de la API, incluyendo la Base Jurídica, Derechos ARSOL y Finalidad del tratamiento.
3.  **Gestión de Brechas de Seguridad:** Disponer de un protocolo de respuesta para notificar a la AEPD (< 72 h).
4.  **Rotar Clave Maestra:** Ejecutar el cambio de la "Database Password" maestra en el panel de Supabase y en las variables de entorno para asegurar que las credenciales antiguas que formaron parte de volcados queden invalidadas definitivamente.

### 6. Conclusión

El alojamiento centralizado de la base de datos en Supabase **(Frankfurt, Alemania)** proporciona un excelente paraguas de viabilidad frente al RGPD al no existir transferencia internacional de datos. 

Con la aplicación en su **Fase 3 de seguridad**, la plataforma garantiza un aislamiento de datos a nivel de celda (RLS Geográfica) y auditoría inmutable, mitigando estructuralmente las severidades exigidas por la presencia de **datos de especial protección (afiliación sindical)**. El aplicativo supera técnicamente los estándares medios del RGPD mediante su diseño *Zero-Trust*, requiriendo únicamente el cumplimiento legal/burocrático por parte del Responsable del Tratamiento.

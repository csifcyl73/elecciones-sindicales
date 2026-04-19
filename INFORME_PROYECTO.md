# Informe de Proyecto: Sistema de Gestión y Análisis Electoral

## 1. Introducción
Este documento detalla las capacidades del sistema desarrollado para la gestión de elecciones sindicales, diseñado bajo una arquitectura moderna, escalable y con un enfoque crítico en la visualización de datos de alto impacto.

---

## 2. Gestión de Entidades y Estructura Jerárquica
La plataforma permite modelar la realidad sindical de forma precisa:
- **Sindicatos y Federaciones:** Capacidad de definir sindicatos individuales y agruparlos en Federaciones o Asociaciones. Esto permite realizar cálculos de representatividad agregados de forma automática.
- **Unidades Electorales:** Gestión detallada de centros de trabajo, provincias, sectores y tipos de órgano (Junta de Personal, Comité de Empresa, etc.).
- **Perfiles de Usuario:**
  - **Administrador Nacional:** Control total, visión global de todas las comunidades.
  - **Administrador Autonómico:** Gestión restringida a su comunidad autónoma o provincias asignadas.
  - **Interventor:** Perfil dedicado exclusivamente al volcado de datos (escrutinio).

---

## 3. Módulos Operativos

### A. Escrutinio en Tiempo Real
- Interfaz optimizada para el día de las elecciones.
- Validación de datos (votos emitidos vs. censo).
- Reparto de delegados automático mediante Ley D'Hondt o Hare (según configuración de la unidad).

### B. Modo B (Importación Histórica)
- Herramienta robusta de importación vía Excel.
- Permite reconstruir el histórico de elecciones de años anteriores (2018, 2022, etc.) incluso si solo se disponen de los resultados finales (delegados) y no del desglose de votos.

---

## 4. Mission Control: Inteligencia de Datos
El núcleo analítico de la aplicación permite comparar simultáneamente hasta **9 procesos electorales**:

- **Visualizaciones Dinámicas:**
  1. **Comparativa de Delegados:** Gráficos de barras agrupados por sindicato.
  2. **Tabla Cruzada:** Comparación técnica de resultados sindicato vs. elección.
  3. **Evolución Temporal:** Gráfico de líneas que muestra la tendencia de cada sigla a lo largo de los años.
  4. **Análisis por Sector:** Desglose del poder sindical por sectores económicos.
  5. **Representatividad:** Medición de umbrales críticos (10% y 15%) para determinar la representatividad legal.

---

## 5. Exportación y Reporting Profesional
La toma de decisiones se apoya en dos formatos de salida:
- **Informe Excel (.xlsx):** Genera un libro multi-hoja con todo el detalle técnico, tablas de resumen y datos brutos de la sesión.
- **Informe Ejecutivo PDF (.pdf):** Documento maquetado profesionalmente que incluye:
  - Resumen de KPIs globales.
  - Capturas de los gráficos interactivos generadas mediante `html2canvas`.
  - Fichas individuales por cada elección analizada.

---

## 6. Stack Tecnológico
- **Frontend:** Next.js (React) con Tailwind CSS para una interfaz fluida y moderna.
- **Backend/DB:** Supabase (PostgreSQL) con seguridad a nivel de fila (RLS).
- **Visualización:** Recharts.
- **Documentación:** jsPDF, XLSX, html2canvas.

---

*Informe generado automáticamente por el sistema de control de proyectos.*

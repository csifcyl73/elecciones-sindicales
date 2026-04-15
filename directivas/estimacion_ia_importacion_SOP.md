# Directiva: Estimación e Implementación de Importación de Datos con Gemini

## Objetivo
Definir los parámetros de coste, configuración y lógica para el módulo de importación de actas electorales utilizando modelos avanzados de Google (Gemini 1.5).

## Modelos Recomendados
1. **Gemini 1.5 Flash:** Recomendado para el 90% de las actas debido a su bajísimo coste y alta velocidad. Ideal para extracción de tablas estructuradas.
2. **Gemini 1.5 Pro:** Recomendado solo para actas con caligrafía extremadamente difícil o documentos muy degradados.

## Estimación de Consumo (Por cada 1.000 Actas)

| Modelo | Tokens Estimados (Input) | Tokens Estimados (Output) | Coste Aprox. (USD) |
| :--- | :--- | :--- | :--- |
| **Gemini 1.5 Flash** | 5.000.000 | 1.000.000 | ~$2.80 |
| **Gemini 1.5 Pro** | 5.000.000 | 1.000.000 | ~$28.00 |

*Nota: Se estima una media de 5.000 tokens de entrada por acta (incluyendo imagen/PDF) y 1.000 de salida (JSON estructurado).*

## Configuración y Reglas (SOP)
1. **Formato de Salida:** Siempre solicitar la respuesta en formato JSON puro para facilitar el parseo automático hacia la base de datos (Supabase).
2. **Validación de Datos:** El script de importación debe validar que los totales sumen correctamente (Votos válidos = Votos candidaturas + Votos en blanco).
3. **Manejo de Errores:** Si el modelo devuelve un "Uncertainty score" alto o el JSON es inválido, marcar el registro para "Revisión Manual".
4. **Seguridad:** Nunca enviar datos personales sensibles (NIFs, nombres de interventores) si no son estrictamente necesarios para el escrutinio.

## Trampas Conocidas
- **Caligrafía Manual:** Las actas escritas a mano pueden inducir a error en números (ej. confundir 1 con 7). **Regla:** Implementar chequeos aritméticos en el backend post-extracción.
- **Coste Inesperado:** El uso excesivo de Gemini 1.5 Pro en lotes masivos puede disparar la factura. **Regla:** Usar Flash por defecto y escalar a Pro solo si Flash falla.

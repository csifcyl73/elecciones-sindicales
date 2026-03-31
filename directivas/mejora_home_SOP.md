# SOP - Mejora de la Home Page (Responsividad y Estética Premium)

## Objetivo
Transformar la página de inicio en un tablero (dashboard) de acceso directo, limpio y minimalista, eliminando distracciones laterales como el menú fijo y optimizando las proporciones del encabezado para que todo el contenido sea visible de un solo vistazo ("at a glance").

## Análisis de Problemas Actuales
- **Barra Lateral**: Se percibe como redundante al tener ya las tarjetas de acceso rápido en el centro.
- **Tamaño de Elementos**: El título y el logo ocupan demasiado espacio vertical, obligando a hacer scroll innecesario.

## Guía de Estilo y Componentes
3. **Navegación**:
   - ELIMINAR la barra lateral tanto en móvil como en escritorio.
   - La navegación principal se delega exclusivamente a las tarjetas centrales.

## Pasos de Implementación
1. **Limpieza de Layout**: Eliminar el componente sidebar y el padding lateral condicional (`md:pl-28`).
2. **Escalado de Encabezado**: Reducir el tamaño del título de `8xl` a `6xl` (máximo) y el logo a un tamaño más discreto (`w-56` aprox).
3. **Optimización de Espaciado**: Ajustar los márgenes superiores e inferiores para compactar la vista central.

## Restricciones
- No eliminar la sidebar funcional de escritorio.
- Asegurar que el logo de CSIF se mantenga centrado y acompañe la jerarquía visual.
- Seguir usando Lucide React y Tailwind CSS v4.

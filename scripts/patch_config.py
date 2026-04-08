import os
import re

file_path = r'c:\Users\asus\elecciones-sindicales\src\app\admin\nacional\configurar-elecciones\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Buscamos el bloque if (u) específico dentro de loadMasters
original_pattern = r"if \(u\) \{\s+setFormData\(f => \(\{\s+\.\.\.f,\s+unidad_id: u\.id\?\.toString\(\) \|\| '',\s+provincia_id: u\.provincia_id\?\.toString\(\) \|\| '',\s+sector_id: u\.sector_id\?\.toString\(\) \|\| '',\s+tipo_organo_id: u\.tipo_organo_id\?\.toString\(\) \|\| '',\s+ccaa_id: u\.ccaa_id\?\.toString\(\) \|\| ''\s+\}\)\);\s+\}"

replacement = """if (u) {
            setFormData(f => ({
              ...f,
              unidad_id: u.id?.toString() || '',
              provincia_id: u.provincia_id?.toString() || '',
              sector_id: u.sector_id?.toString() || '',
              tipo_organo_id: u.tipo_organo_id?.toString() || '',
              ccaa_id: u.ccaa_id?.toString() || '',
              municipio_id: u.municipio_id?.toString() || 'NO_PROCEDE',
              proceso_electoral_id: u.proceso_electoral_id?.toString() || '',
              anio: u.anio?.toString() || '',
              modo_colegio: u.modo_colegio || 'unico',
              del_unico: (u.modo_colegio === 'unico' ? u.delegados_a_elegir?.toString() : '1') || '1',
              del_tecnicos: u.del_tecnicos?.toString() || '1',
              del_especialistas: u.del_especialistas?.toString() || '0'
            }));

            if (u.mesas && u.mesas.length > 0) {
              setMesas(u.mesas.map((m: any) => ({
                id: m.id,
                nombre: m.nombre_identificador,
                interventor_id: m.interventor_id || ''
              })));
            }

            if (u.sindicatos && Array.isArray(u.sindicatos)) {
              setSindicatosSeleccionados(u.sindicatos.map((s: any) => s.sindicato_id));
            }
         }"""

new_content = re.sub(original_pattern, replacement, content, flags=re.MULTILINE)

if new_content != content:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Success: Bloque actualizado.")
else:
    print("Error: No se encontró el bloque a reemplazar.")

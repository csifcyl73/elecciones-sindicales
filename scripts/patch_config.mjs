import fs from 'fs';
import path from 'path';

const filePath = 'c:\\Users\\asus\\elecciones-sindicales\\src\\app\\admin\\nacional\\configurar-elecciones\\page.tsx';

let content = fs.readFileSync(filePath, 'utf-8');

// Usamos el bloque exacto que vimos en el scroll de view_file
// if (u) {
//    setFormData(f => ({
//      ...f,
//      unidad_id: u.id?.toString() || '',
//      provincia_id: u.provincia_id?.toString() || '',
//      sector_id: u.sector_id?.toString() || '',
//      tipo_organo_id: u.tipo_organo_id?.toString() || '',
//      ccaa_id: u.ccaa_id?.toString() || ''
//    }));
// }

// Hacemos el reemplazo buscando solo el setFormData con sus campos originales
const oldCode = `            setFormData(f => ({
              ...f,
              unidad_id: u.id?.toString() || '',
              provincia_id: u.provincia_id?.toString() || '',
              sector_id: u.sector_id?.toString() || '',
              tipo_organo_id: u.tipo_organo_id?.toString() || '',
              ccaa_id: u.ccaa_id?.toString() || ''
            }));`;

const newCode = `            setFormData(f => ({
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
              setMesas(u.mesas.map((m) => ({
                id: m.id,
                nombre: m.nombre_identificador,
                interventor_id: m.interventor_id || ''
              })));
            }

            if (u.sindicatos && Array.isArray(u.sindicatos)) {
              setSindicatosSeleccionados(u.sindicatos.map((s) => s.sindicato_id));
            }`;

if (content.includes('unidad_id: u.id?.toString() || \'\'')) {
    // Reemplazo simple del setFormData
    // Buscamos desde setFormData(f => ({ hasta }));
    const regex = /setFormData\(f => \(\{[\s\S]*?\}\)\);/;
    const patchedContent = content.replace(regex, newCode);
    
    fs.writeFileSync(filePath, patchedContent);
    console.log("Success: Bloque de datos de edición actualizado.");
} else {
    console.log("Error: No se encontró el bloque a parchear.");
}

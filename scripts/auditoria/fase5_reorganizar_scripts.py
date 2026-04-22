"""
Fase 5: Reorganización del directorio scripts/ en subcarpetas temáticas.
No borra nada, solo mueve archivos a subdirectorios dentro de scripts/.
"""
import os
import shutil

# Categorización de los 24 scripts restantes
CATEGORIES = {
    'setup': [
        '1_configurar_root.mjs',       # Configuración inicial del root user
        'inicializar_proyecto.mjs',     # Inicialización del proyecto
        'populate-masters.mjs',         # Poblar tablas maestras
        'populate-unions.mjs',          # Poblar sindicatos
        'crear_admin.mjs',              # Crear usuario admin
        'create-admin-user.mjs',        # Crear usuario admin (alternativo)
        'create-test-autonomico.mjs',   # Crear usuario autonómico de test
        'setup-admin-user.mjs',         # Setup de admin
        'ejecutar_servidor.mjs',        # Lanzar servidor dev
        'ejecutar_servidor.py',         # Lanzar servidor dev (Python)
    ],
    'migraciones': [
        'apply-migration.mjs',          # Aplicar migraciones SQL
        'add-municipio.mjs',            # Añadir municipio a la BD
        'add_federation_fields.py',     # Añadir campos de federación
        'fetch_municipios.mjs',         # Fetch de municipios desde API
        'reparar_frankfurt.mjs',        # Reparación puntual de BD Frankfurt
    ],
    'mantenimiento': [
        'limpiar_duplicados_por_nombre.mjs',  # Limpieza de duplicados
        'limpiar_duplicados_unidades.mjs',    # Limpieza de unidades duplicadas
        'limpiar_nombres_unidades.mjs',       # Normalización de nombres
    ],
    'auditoria': [
        'fase1_limpieza_artefactos.py',     # Fase 1 optimización
        'fase2_auditoria_config.py',        # Fase 2 seguridad: config
        'fase2_auditoria_generar_sql.py',   # Fase 2 seguridad: SQL
        'fase2_auditoria_ratelimit.py',     # Fase 2 seguridad: rate limit
        'fase3_auditoria_sql_gen.py',       # Fase 3 seguridad: audit triggers
        'fase3_auditoria_upstash.py',       # Fase 3 seguridad: upstash
    ],
}

def move_file(src, dst):
    if not os.path.exists(src):
        print(f"  [SKIP] No existe: {os.path.basename(src)}")
        return False
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.move(src, dst)
    print(f"  [OK] {os.path.basename(src)}")
    return True

def main():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    scripts_dir = os.path.join(project_root, 'scripts')
    
    moved = 0
    
    print("=" * 60)
    print("FASE 5: Reorganización de scripts/")
    print("=" * 60)
    
    for category, files in CATEGORIES.items():
        print(f"\n-> scripts/{category}/")
        target_dir = os.path.join(scripts_dir, category)
        for f in files:
            src = os.path.join(scripts_dir, f)
            dst = os.path.join(target_dir, f)
            if move_file(src, dst):
                moved += 1

    print(f"\n{'=' * 60}")
    print(f"RESULTADO: {moved} archivos organizados en {len(CATEGORIES)} categorías")
    print(f"{'=' * 60}")

if __name__ == '__main__':
    main()

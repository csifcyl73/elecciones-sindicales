"""
Fase 1: Limpieza de Artefactos Muertos
Mueve archivos huérfanos y obsoletos a _deprecated/ sin borrar nada.
"""
import os
import shutil

# Archivos de la raíz a deprecar
ROOT_FILES = [
    'check_provs.js',
    'fetch_ccaa.js',
    'fix_ids.js',
    'test_db.js',
    'test_db_2.js',
    'fix_rls.sql',
    'schema.sql',
    '.env.vercel.tmp',
]

# Scripts a deprecar
SCRIPT_FILES = [
    'debug_schema.js',
    'debug_units.mjs',
    'check_colegio_column.js',
    'check_supa.mjs',
    'check_api.mjs',
    'check_db_unidades.mjs',
    'check-status.mjs',
    'fix_env.js',
    'fix_env.mjs',
    'fix_db.mjs',
    'fix-admin.mjs',
    'scan_units.mjs',
    'test-login.mjs',
    'test_unidades_api.mjs',
    'signup-admin.mjs',
    'update_db.js',
    'patch_config.mjs',
    'patch_config.py',
]

def move_file(src, dst):
    """Mueve un archivo de src a dst, creando directorios si es necesario."""
    if not os.path.exists(src):
        print(f"  [SKIP] No existe: {src}")
        return False
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.move(src, dst)
    print(f"  [MOVED] {src} -> {dst}")
    return True

def main():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(project_root)
    
    deprecated_dir = os.path.join(project_root, '_deprecated')
    deprecated_scripts = os.path.join(deprecated_dir, 'scripts')
    
    moved = 0
    skipped = 0
    
    print("=" * 60)
    print("FASE 1: Limpieza de Artefactos Muertos")
    print("=" * 60)
    
    # 1. Mover archivos huérfanos de la raíz
    print("\n--- Archivos de la raíz ---")
    for f in ROOT_FILES:
        src = os.path.join(project_root, f)
        dst = os.path.join(deprecated_dir, f)
        if move_file(src, dst):
            moved += 1
        else:
            skipped += 1

    # 2. Mover scripts obsoletos
    print("\n--- Scripts obsoletos ---")
    for f in SCRIPT_FILES:
        src = os.path.join(project_root, 'scripts', f)
        dst = os.path.join(deprecated_scripts, f)
        if move_file(src, dst):
            moved += 1
        else:
            skipped += 1

    print(f"\n{'=' * 60}")
    print(f"RESULTADO: {moved} archivos movidos, {skipped} saltados")
    print(f"Destino: {deprecated_dir}")
    print(f"{'=' * 60}")

if __name__ == '__main__':
    main()

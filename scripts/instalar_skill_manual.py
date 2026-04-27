import os
import shutil
import subprocess
import tempfile

def install_skill():
    repo_url = "https://github.com/sickn33/antigravity-awesome-skills.git"
    skill_source_name = "cc-skill-security-review"
    target_skill_name = "security-review"
    target_base_dir = r"c:\Users\asus\.agents\skills"
    target_path = os.path.join(target_base_dir, target_skill_name)

    print(f"Iniciando instalación de {target_skill_name}...")

    with tempfile.TemporaryDirectory() as tmp_dir:
        print(f"Clonando repositorio en {tmp_dir}...")
        try:
            subprocess.run(["git", "clone", "--depth", "1", repo_url, tmp_dir], check=True)
            
            # Buscar la carpeta de la skill. Según el subagente está en skills/ o en plugins/.../skills/
            # Vamos a buscar recursivamente para ser seguros
            source_path = None
            for root, dirs, files in os.walk(tmp_dir):
                if skill_source_name in dirs:
                    source_path = os.path.join(root, skill_source_name)
                    break
            
            if not source_path:
                print(f"Error: No se encontró la carpeta {skill_source_name} en el repositorio.")
                return

            print(f"Skill encontrada en: {source_path}")
            
            if not os.path.exists(target_base_dir):
                os.makedirs(target_base_dir)

            if os.path.exists(target_path):
                print(f"Sobrescribiendo skill existente en {target_path}...")
                shutil.rmtree(target_path)
            
            shutil.copytree(source_path, target_path)
            print(f"Éxito: Skill instalada correctamente en {target_path}")

        except subprocess.CalledProcessError as e:
            print(f"Error al clonar el repositorio: {e}")
        except Exception as e:
            print(f"Error inesperado: {e}")

if __name__ == "__main__":
    install_skill()

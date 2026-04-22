import subprocess
import os
import sys

def run_dev_server():
    cwd = r"c:\Users\asus\elecciones-sindicales"
    print(f"Iniciando el servidor de desarrollo en {cwd}...")
    
    try:
        # Usamos shell=True para Windows y npx/npm
        process = subprocess.Popen(
            ["npm", "run", "dev"],
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            shell=True
        )
        
        # Monitorear la salida para confirmar el inicio
        for line in process.stdout:
            print(line, end='')
            if "started server on" in line.lower() or "ready" in line.lower():
                print("\n[INFO] Servidor detectado como listo.")
                break
        
        # Dejamos el proceso corriendo en segundo plano o informamos al usuario
        print("\n[INFO] El servidor continúa ejecutándose en segundo plano.")
        return process.pid
        
    except Exception as e:
        print(f"[ERROR] No se pudo iniciar el servidor: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_dev_server()

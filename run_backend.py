import sys
import subprocess
import os

python_exe = sys.executable
cmd = [python_exe, "-m", "uvicorn", "backend.main:app", "--reload", "--host", "127.0.0.1", "--port", "8000"]
print(f"Starting backend with {python_exe}...")
try:
    subprocess.run(cmd, env=dict(os.environ, PYTHONPATH="."))
except KeyboardInterrupt:
    print("Backend stopped.")

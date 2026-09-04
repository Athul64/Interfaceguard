import subprocess
import json
import tempfile
import os

JAR_PATH = os.path.join(os.path.dirname(__file__), "..", "tools", "javaparser-bridge", "target", "javaparser-bridge-1.0.jar")

def extract_interfaces(source_code: str, file_path: str) -> list[dict]:
    with tempfile.NamedTemporaryFile(mode="w", suffix=".java", delete=False) as f:
        f.write(source_code)
        temp_path = f.name

    try:
        result = subprocess.run(
            ["java", "-jar", JAR_PATH, temp_path],
            capture_output=True, text=True, timeout=10
        )
        interfaces = json.loads(result.stdout) if result.stdout.strip() else []
        for iface in interfaces:
            iface["file_path"] = file_path
        return interfaces
    except (subprocess.TimeoutExpired, json.JSONDecodeError):
        return []
    finally:
        os.unlink(temp_path)
import json
import logging
import os
import subprocess
from pathlib import Path
from typing import Dict, List, Any

from app.core.config import Config

logger = logging.getLogger(__name__)

def parse_with_javaparser(paths: List[str]) -> Dict[str, Any]:
    """
    Invokes the JavaParser bridge jar to extract interfaces, classes, methods,
    and method body characteristics (ISP stubs, exception throwing, etc.).
    """
    jar_path = Config.JAVAPARSER_JAR
    if not jar_path.exists():
        logger.warning(f"JavaParser bridge jar not found at {jar_path}. Falling back.")
        return parse_with_fallback(paths)

    # Optimize target paths: look for src/main/java or src first to avoid scanning .git / build / target
    optimized_paths = []
    for p in paths:
        p_obj = Path(p)
        if p_obj.is_dir():
            src_main = p_obj / "src" / "main" / "java"
            src_dir = p_obj / "src"
            if src_main.exists() and src_main.is_dir():
                optimized_paths.append(str(src_main))
            elif src_dir.exists() and src_dir.is_dir():
                optimized_paths.append(str(src_dir))
            else:
                optimized_paths.append(str(p_obj))
        else:
            optimized_paths.append(str(p))

    cmd = ["java", "-jar", str(jar_path)] + [str(p) for p in optimized_paths]
    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=False,
            timeout=90,
        )
        if proc.returncode == 0 and proc.stdout.strip():
            data = json.loads(proc.stdout.strip())
            data["parser_engine"] = "JavaParser 3.26.2"
            return data
        else:
            logger.warning(f"JavaParser bridge returned non-zero ({proc.returncode}): {proc.stderr}")
            return parse_with_fallback(paths)
    except Exception as exc:
        logger.warning(f"JavaParser execution failed ({exc}). Using fallback.")
        return parse_with_fallback(paths)


def parse_with_fallback(paths: List[str]) -> Dict[str, Any]:
    """
    Documented fallback parser using javalang AST with limited semantics.
    Used when Java runtime is unavailable or JavaParser encounters an unrecoverable failure.
    """
    import javalang

    interfaces = []
    classes = []
    errors = []

    files_to_read = []
    for p in paths:
        path_obj = Path(p)
        if path_obj.is_dir():
            files_to_read.extend(list(path_obj.rglob("*.java")))
        elif path_obj.is_file() and str(p).endswith(".java"):
            files_to_read.append(path_obj)

    for f in files_to_read:
        try:
            content = f.read_text(encoding="utf-8", errors="replace")
            tree = javalang.parse.parse(content)
            package_name = tree.package.name if tree.package else ""

            # Extract interfaces
            for _, iface_node in tree.filter(javalang.tree.InterfaceDeclaration):
                methods = []
                for m in iface_node.methods:
                    param_types = [getattr(p.type, "name", str(p.type)) for p in m.parameters]
                    param_names = [p.name for p in m.parameters]
                    return_type = "void" if m.return_type is None else getattr(m.return_type, "name", str(m.return_type))
                    start_line = m.position.line if m.position else 1
                    methods.append({
                        "name": m.name,
                        "params": len(m.parameters),
                        "param_types": param_types,
                        "param_names": param_names,
                        "return_type": return_type,
                        "start_line": start_line,
                        "end_line": start_line + 1,
                        "is_default": "default" in (m.modifiers or []),
                        "is_static": "static" in (m.modifiers or []),
                    })
                interfaces.append({
                    "name": iface_node.name,
                    "package": package_name,
                    "file_path": str(f).replace("\\", "/"),
                    "extends": [getattr(e, "name", str(e)) for e in (iface_node.extends or [])],
                    "methods": methods,
                })

            # Extract classes
            for _, cls_node in tree.filter(javalang.tree.ClassDeclaration):
                impl_types = [getattr(i, "name", str(i)) for i in (cls_node.implements or [])]
                methods = []
                for m in cls_node.methods:
                    param_types = [getattr(p.type, "name", str(p.type)) for p in m.parameters]
                    start_line = m.position.line if m.position else 1
                    body_str = ""
                    # Basic body heuristic
                    is_empty = False
                    is_no_op = False
                    is_exception_stub = False
                    is_placeholder = False
                    stub_detail = ""

                    if m.body is None or len(m.body) == 0:
                        is_empty = True
                        is_no_op = True
                    else:
                        first_stmt = m.body[0]
                        stmt_type = type(first_stmt).__name__
                        if "Throw" in stmt_type:
                            is_exception_stub = True
                            stub_detail = "throw UnsupportedOperationException"
                        elif "Return" in stmt_type and len(m.body) == 1:
                            is_placeholder = True
                            stub_detail = "returns placeholder"

                    methods.append({
                        "name": m.name,
                        "params": len(m.parameters),
                        "param_types": param_types,
                        "return_type": "void" if m.return_type is None else getattr(m.return_type, "name", str(m.return_type)),
                        "start_line": start_line,
                        "end_line": start_line + 5,
                        "is_empty": is_empty,
                        "is_no_op": is_no_op,
                        "is_exception_stub": is_exception_stub,
                        "is_placeholder": is_placeholder,
                        "stub_detail": stub_detail,
                        "calls": [],
                    })

                classes.append({
                    "name": cls_node.name,
                    "package": package_name,
                    "file_path": str(f).replace("\\", "/"),
                    "implements": impl_types,
                    "extends": [getattr(cls_node.extends, "name", str(cls_node.extends))] if cls_node.extends else [],
                    "fields": [],
                    "methods": methods,
                })

        except Exception as exc:
            errors.append(f"Fallback parse failed for {f}: {exc}")

    return {
        "status": "ok",
        "parser_engine": "javalang-fallback",
        "interfaces": interfaces,
        "classes": classes,
        "errors": errors,
    }

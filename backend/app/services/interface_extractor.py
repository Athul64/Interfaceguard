import javalang


def extract_interfaces(source_code: str, file_path: str) -> list[dict]:
    try:
        tree = javalang.parse.parse(source_code)
    except (javalang.parser.JavaSyntaxError, javalang.tokenizer.LexerError):
        return []

    interfaces = []
    for _, node in tree.filter(javalang.tree.InterfaceDeclaration):
        methods = []
        for method in node.methods:
            param_types = [
                getattr(p.type, "name", str(p.type)) for p in method.parameters
            ]
            return_type = (
                "void" if method.return_type is None
                else getattr(method.return_type, "name", str(method.return_type))
            )
            methods.append({
                "name": method.name,
                "params": len(method.parameters),
                "param_types": param_types,
                "return_type": return_type,
            })
        interfaces.append({"name": node.name, "file_path": file_path, "methods": methods})

    return interfaces
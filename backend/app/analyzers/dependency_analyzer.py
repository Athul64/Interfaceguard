import networkx as nx
from typing import Dict, List, Any, Tuple

def build_dependency_graph(
    interfaces: List[Dict[str, Any]],
    classes: List[Dict[str, Any]],
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[List[str]]]:
    """
    Constructs a directed graph of relationships between interfaces and classes.
    Detects dependency cycles using NetworkX strongly connected components and simple cycles.
    Returns: (nodes, edges, detected_cycles)
    """
    G = nx.DiGraph()

    # Add interface nodes
    iface_names = set()
    for iface in interfaces:
        name = iface.get("name", "")
        iface_names.add(name)
        G.add_node(name, node_type="interface", package=iface.get("package", ""), file_path=iface.get("file_path", ""))

    # Add class nodes
    class_names = set()
    for cls in classes:
        name = cls.get("name", "")
        class_names.add(name)
        G.add_node(name, node_type="class", package=cls.get("package", ""), file_path=cls.get("file_path", ""))

    raw_edges = []

    # Implementation edges: class -> implements -> interface
    for cls in classes:
        c_name = cls.get("name", "")
        for impl in cls.get("implements", []):
            if impl in iface_names:
                G.add_edge(c_name, impl, relationship="implements")
                raw_edges.append((c_name, impl, "implements"))

        for ext in cls.get("extends", []):
            if ext in class_names:
                G.add_edge(c_name, ext, relationship="extends")
                raw_edges.append((c_name, ext, "extends"))

    # Interface dependencies from method signatures (return types, parameter types)
    for iface in interfaces:
        i_name = iface.get("name", "")
        for m in iface.get("methods", []):
            ret = m.get("return_type", "")
            if ret in iface_names and ret != i_name:
                G.add_edge(i_name, ret, relationship="depends_on")
                raw_edges.append((i_name, ret, "depends_on"))
            elif ret in class_names:
                G.add_edge(i_name, ret, relationship="depends_on")
                raw_edges.append((i_name, ret, "depends_on"))

            for p in m.get("param_types", []):
                if p in iface_names and p != i_name:
                    G.add_edge(i_name, p, relationship="depends_on")
                    raw_edges.append((i_name, p, "depends_on"))
                elif p in class_names:
                    G.add_edge(i_name, p, relationship="depends_on")
                    raw_edges.append((i_name, p, "depends_on"))

    # Class dependencies from fields & method signatures
    for cls in classes:
        c_name = cls.get("name", "")
        for f in cls.get("fields", []):
            t = f.get("type", "")
            if t in iface_names:
                G.add_edge(c_name, t, relationship="depends_on")
                raw_edges.append((c_name, t, "depends_on"))

        for m in cls.get("methods", []):
            ret = m.get("return_type", "")
            if ret in iface_names:
                G.add_edge(c_name, ret, relationship="depends_on")
                raw_edges.append((c_name, ret, "depends_on"))
            for p in m.get("param_types", []):
                if p in iface_names:
                    G.add_edge(c_name, p, relationship="depends_on")
                    raw_edges.append((c_name, p, "depends_on"))

    # Cycle detection using NetworkX
    cycles = []
    try:
        # Get bounded elementary cycles
        simple_cycles_gen = nx.simple_cycles(G)
        for c in simple_cycles_gen:
            if len(c) > 1:
                cycles.append(c)
            if len(cycles) >= 50:  # safety cap for large graphs
                break
    except Exception:
        pass

    # Build set of edges in cycles
    cycle_edge_set = set()
    for cycle in cycles:
        for idx in range(len(cycle)):
            u = cycle[idx]
            v = cycle[(idx + 1) % len(cycle)]
            cycle_edge_set.add((u, v))

    # Format nodes for React Flow
    nodes = []
    cycle_nodes = {node for cycle in cycles for node in cycle}

    for node_id, data in G.nodes(data=True):
        in_deg = G.in_degree(node_id)
        out_deg = G.out_degree(node_id)
        is_in_cycle = node_id in cycle_nodes

        nodes.append({
            "id": node_id,
            "label": node_id,
            "type": data.get("node_type", "interface"),
            "package": data.get("package", ""),
            "file_path": data.get("file_path", ""),
            "in_degree": in_deg,
            "out_degree": out_deg,
            "in_cycle": is_in_cycle,
        })

    # Format edges
    edges = []
    for u, v, data in G.edges(data=True):
        rel = data.get("relationship", "depends_on")
        is_cycle_edge = (u, v) in cycle_edge_set
        cycle_str = ""
        if is_cycle_edge:
            for cycle in cycles:
                if u in cycle and v in cycle:
                    cycle_str = " -> ".join(cycle + [cycle[0]])
                    break

        edges.append({
            "id": f"{u}->{v}",
            "source": u,
            "target": v,
            "relationship": rel,
            "in_cycle": is_cycle_edge,
            "cycle_path": cycle_str,
        })

    return nodes, edges, cycles

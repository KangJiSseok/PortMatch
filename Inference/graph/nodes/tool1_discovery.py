from typing import Any, Dict

from graph.state import CompanyGraphState


def discovery_node(state: CompanyGraphState) -> Dict[str, Any]:
    # TODO: Implement Tool1 discovery and evidence collection.
    _ = state
    return {"project_candidates": []}

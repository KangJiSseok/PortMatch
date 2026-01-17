from typing import Any, Dict

from graph.state import CompanyGraphState


def validation_node(state: CompanyGraphState) -> Dict[str, Any]:
    # TODO: Implement LLM-based validation opinions.
    _ = state
    return {"validation_opinions": []}

from typing import Any, Dict

from langgraph.graph import END, StateGraph

from graph.nodes.tool0_text_collection import text_collection_node
from graph.nodes.tool1_discovery import discovery_node
from graph.nodes.tool2_validation import validation_node
from graph.nodes.tool3_dedup import dedup_node
from graph.nodes.tool4_structuring import structuring_node
from graph.state import CompanyGraphState


def build_graph() -> Any:
    graph = StateGraph(CompanyGraphState)

    graph.add_node("collect_text", text_collection_node)
    graph.add_node("discovery", discovery_node)
    graph.add_node("validate", validation_node)
    graph.add_node("dedup", dedup_node)
    graph.add_node("structure", structuring_node)

    graph.set_entry_point("collect_text")
    graph.add_edge("collect_text", "discovery")
    graph.add_edge("discovery", "validate")
    graph.add_edge("validate", "dedup")
    graph.add_edge("dedup", "structure")

    graph.add_edge("structure", END)

    return graph.compile()

from typing import Any, Dict

from langgraph.graph import END, StateGraph

from graph.nodes.tool1_discovery import discovery_node
from graph.nodes.tool2_validation import validation_node
from graph.nodes.tool3_coverage import coverage_node
from graph.nodes.tool4_structuring import structuring_node
from graph.edges import is_coverage_enough
from graph.state import CompanyGraphState
from web.services.rule_scorer import RuleScorer

def _score_node(state: CompanyGraphState) -> Dict[str, Any]:
    scorer = RuleScorer()
    opinions = state.get("validation_opinions", [])
    scored = scorer.score(opinions)
    return {"scored_projects": scored}


def build_graph() -> Any:
    graph = StateGraph(CompanyGraphState)

    graph.add_node("discovery", discovery_node)
    graph.add_node("validate", validation_node)
    graph.add_node("score", _score_node)
    graph.add_node("coverage_check", coverage_node)
    graph.add_node("structure", structuring_node)

    graph.set_entry_point("discovery")

    graph.add_edge("discovery", "validate")
    graph.add_edge("validate", "score")
    graph.add_edge("score", "coverage_check")

    graph.add_conditional_edges(
        "coverage_check",
        is_coverage_enough,
        {
            True: "structure",
            False: "discovery",
        },
    )

    graph.add_edge("structure", END)

    return graph.compile()

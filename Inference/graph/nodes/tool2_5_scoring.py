from typing import Any, Dict, List

from graph.state import CompanyGraphState
from web.services.rule_scorer import RuleScorer


def scoring_node(state: CompanyGraphState) -> Dict[str, Any]:
    scorer = RuleScorer()
    opinions: List[Dict[str, Any]] = state.get("validation_opinions", []) or []
    scored = scorer.score(opinions)
    return {"scored_projects": scored}

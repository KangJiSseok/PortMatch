from __future__ import annotations

from typing import Any, Dict, List


class RuleScorer:
    def score(self, validation_opinions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        results: List[Dict[str, Any]] = []
        for opinion in validation_opinions:
            results.append(self._score_opinion(opinion))
        return results

    def _score_opinion(self, opinion: Dict[str, Any]) -> Dict[str, Any]:
        score = 0
        evidence = opinion.get("evidence", [])
        sources = []
        for item in evidence:
            if isinstance(item, dict) and item.get("source"):
                sources.append(item["source"])
        unique_sources = set(sources)

        if len(evidence) >= 2 and len(unique_sources) >= 2:
            score += 2

        support_type = opinion.get("support_type")
        if support_type == "explicit":
            score += 2
        elif support_type == "implicit":
            score += 1

        if any(src in {"homepage", "press", "report"} for src in unique_sources):
            score += 1

        summary = opinion.get("evidence_summary", "")
        if isinstance(summary, str):
            guess_terms = ["추정", "추측", "가능", "일 수", "보인다", "암시"]
            hit_count = sum(1 for term in guess_terms if term in summary)
            if hit_count >= 2:
                score -= 2

        project_name = opinion.get("project_name", "")
        if isinstance(project_name, str) and not any(
            token in project_name for token in ["플랫폼", "서비스", "시스템"]
        ):
            score -= 1

        job_posting_only = len(unique_sources) > 0 and all(
            src == "job_posting" for src in unique_sources
        )

        if score >= 4:
            final_is_supported = True
            evidence_strength = "high"
        elif score >= 2:
            final_is_supported = True
            evidence_strength = "medium"
        else:
            final_is_supported = False
            evidence_strength = "low"

        if job_posting_only and evidence_strength == "high":
            evidence_strength = "medium"

        decision_reason = (
            f"score={score}; support_type={support_type}; "
            f"sources={sorted(unique_sources)}"
        )

        result = dict(opinion)
        result.update(
            {
                "final_is_supported": final_is_supported,
                "evidence_strength": evidence_strength,
                "decision_reason": decision_reason,
            }
        )
        return result

import argparse
import json
from typing import Any, Dict, List

from graph.company_graph import build_graph
from graph.state import CompanyGraphState


def run(company_name: str) -> Any:
    graph = build_graph()
    initial_state: CompanyGraphState = {"company_name": company_name}
    result = graph.invoke(initial_state)
    return result.get("structured_projects", [])


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("company_name")
    args = parser.parse_args()

    structured = run(args.company_name)
    if isinstance(structured, str):
        print(structured)
    else:
        print(json.dumps(structured, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

import argparse
import json
from typing import Any, Dict, List

from dotenv import load_dotenv

from graph.company_graph import build_graph
from graph.state import CompanyGraphState


def run(company_name: str) -> Any:
    graph = build_graph()
    initial_state: CompanyGraphState = {"company_name": company_name}
    result = graph.invoke(initial_state)
    print(result)
    return result.get("structured_projects", [])


def main() -> None:
    load_dotenv()
    parser = argparse.ArgumentParser()
    parser.add_argument("company_name")
    parser.add_argument("--company-text", default="")
    args = parser.parse_args()

    graph = build_graph()
    initial_state: CompanyGraphState = {
        "company_name": args.company_name,
        "company_text": args.company_text,
    }
    result = graph.invoke(initial_state)
    structured = result.get("structured_projects", [])
    if isinstance(structured, str):
        print(structured)
    else:
        print(json.dumps(structured, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

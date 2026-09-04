"""
Research: Which Indian competitive exams ACTUALLY have an interview
in their final selection process?

Runs targeted web searches and saves raw + summarized findings to:
  /home/z/my-project/scripts/research/exam-interviews.json
  /home/z/my-project/scripts/research/exam-interviews-summary.md

Then we (the main agent) read these and decide which 5 exams to ship first.
"""

import json
import subprocess
import sys
from pathlib import Path

OUT_DIR = Path("/home/z/my-project/scripts/research")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Candidate exams to verify (we'll confirm interview-in-selection for each)
CANDIDATE_EXAMS = [
    "UPSC Civil Services Examination interview personality test",
    "SSC CGL interview round selection process",
    "IBPS PO interview selection process final",
    "SBI PO interview phase 3 selection process",
    "RBI Grade B interview selection process",
    "CAT IIM MBA admission interview process",
    "NDA SSB interview defence selection process",
    "CDS SSB interview selection process",
    "AFCAT SSB interview selection process",
    "CLAT law admission interview process",
    "NEET PG MD MS admission interview counselling",
    "GATE PSU interview selection process",
    "UPPSC State PSC interview personality test",
    "IBPS Specialist Officer interview selection process",
    "LIC AAO interview selection process",
    "Indian Forest Service interview IFoS personality test",
    "CAPF Assistant Commandant interview selection process",
    "ISRO Scientist interview selection process",
    "DRDO Scientist interview selection process",
    "RBI Assistant interview selection process",
]

def run_search(query: str, num: int = 5) -> list[dict]:
    """Run web_search via z-ai CLI."""
    args = json.dumps({"query": query, "num": num})
    try:
        result = subprocess.run(
            ["z-ai", "function", "-n", "web_search", "-a", args],
            capture_output=True, text=True, timeout=60, check=True,
        )
        # CLI prints JSON to stdout
        out = result.stdout.strip()
        # Try to parse - sometimes wrapped in extra text
        try:
            return json.loads(out)
        except json.JSONDecodeError:
            # Find first [ and last ]
            start = out.find("[")
            end = out.rfind("]")
            if start >= 0 and end > start:
                return json.loads(out[start:end+1])
            return []
    except subprocess.CalledProcessError as e:
        print(f"  ✗ search failed: {e.stderr[:200]}", file=sys.stderr)
        return []
    except subprocess.TimeoutExpired:
        print(f"  ✗ search timeout: {query}", file=sys.stderr)
        return []

def main():
    print(f"Researching {len(CANDIDATE_EXAMS)} candidate exams...")
    print("=" * 60)

    all_results = {}

    for i, exam in enumerate(CANDIDATE_EXAMS, 1):
        print(f"\n[{i}/{len(CANDIDATE_EXAMS)}] {exam}")
        results = run_search(exam, num=4)
        all_results[exam] = results
        for r in results[:2]:
            title = r.get("name", "")[:80]
            snippet = r.get("snippet", "")[:200]
            print(f"  • {title}")
            print(f"    {snippet}")

    # Save raw
    raw_path = OUT_DIR / "exam-interviews.json"
    raw_path.write_text(json.dumps(all_results, indent=2, ensure_ascii=False))
    print(f"\n✓ Raw results saved: {raw_path}")
    print(f"  Total exams researched: {len(all_results)}")
    print(f"  Total search results: {sum(len(v) for v in all_results.values())}")

if __name__ == "__main__":
    main()

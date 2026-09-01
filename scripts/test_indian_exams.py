"""
Test the new Indian exam interview flow end-to-end.
Starts a UPSC mock interview and verifies the AI behaves like a UPSC panel.
"""
import json
import requests
import sys

BASE = "http://localhost:3000"

def test_interview(role: str, difficulty: str = "standard"):
    print(f"\n{'='*60}")
    print(f"Testing role: {role} | difficulty: {difficulty}")
    print('='*60)

    # Question 1
    payload = {
        "role": role,
        "difficulty": difficulty,
        "messages": [],
        "questionNumber": 1,
        "totalQuestions": 5,
    }
    r = requests.post(f"{BASE}/api/interview", json=payload, timeout=60)
    if r.status_code != 200:
        print(f"✗ Question 1 failed: {r.status_code} {r.text[:200]}")
        return
    data = r.json()
    q1 = data.get("reply", "")
    print(f"\n[Q1 - Opening question]:")
    print(q1[:500])

    # Candidate answers
    candidate_answer = (
        "My name is Arjun Sharma. I'm from Jaipur, Rajasthan. "
        "I did my B.Tech in Computer Science from IIT Delhi. "
        "I've been working as a software engineer at Google for 2 years. "
        "I want to join the IAS because I want to serve society at scale — "
        "in tech I can impact millions of users, but as a District Collector "
        "I can transform millions of lives directly."
    )

    # Question 2 (with history)
    payload2 = {
        "role": role,
        "difficulty": difficulty,
        "messages": [
            {"role": "assistant", "content": q1},
            {"role": "user", "content": candidate_answer},
        ],
        "questionNumber": 2,
        "totalQuestions": 5,
    }
    r2 = requests.post(f"{BASE}/api/interview", json=payload2, timeout=60)
    if r2.status_code != 200:
        print(f"\n✗ Question 2 failed: {r2.status_code} {r.text[:200]}")
        return
    q2 = r2.json().get("reply", "")
    print(f"\n[Q2 - Follow-up after intro]:")
    print(q2[:500])

    # Now test feedback
    print(f"\n[Generating scorecard...]")
    fb_payload = {
        "role": role,
        "difficulty": difficulty,
        "transcript": [
            {"role": "assistant", "content": q1},
            {"role": "user", "content": candidate_answer},
            {"role": "assistant", "content": q2},
            {"role": "user", "content": "I'm not sure about that. I'd need to think more carefully."},
        ],
    }
    r3 = requests.post(f"{BASE}/api/feedback", json=fb_payload, timeout=90)
    if r3.status_code != 200:
        print(f"✗ Feedback failed: {r3.status_code} {r3.text[:300]}")
        return
    fb = r3.json()
    print(f"\n[Scorecard preview]:")
    print(fb.get("feedback", "")[:1000])
    print(f"\n[Overall Score]: {fb.get('overallScore')}")

if __name__ == "__main__":
    # Test UPSC
    test_interview("upsc-cse", "standard")
    # Test IBPS PO
    test_interview("ibps-po", "standard")

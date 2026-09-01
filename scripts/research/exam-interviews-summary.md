# Research: Indian Exams with Interviews in Selection Process

**Date:** July 30, 2026
**Method:** Web search via z-ai SDK across 20 candidate exams
**Source data:** `exam-interviews.json` (raw search results for all 20)

## Summary

Out of 20 candidate exams researched, **15 actually have an interview** in their final selection process. 5 do NOT.

## ✅ Confirmed: HAS interview (15 exams)

### Tier 1 — Civil Services / Personality Tests (UPSC family)
| Exam | Interview type | Marks/Weight | Reach interview/year |
|---|---|---|---|
| **UPSC Civil Services (CSE)** | Personality Test, 5-member board, 30 min | **275 marks** (huge) | ~13,000 |
| **Indian Forest Service (IFoS)** | Personality Test | 275 marks | ~369 |
| **State PSCs (UPPSC, MPPSC, BPSC, etc.)** | Personality Test | 100 marks | ~100,000 combined |
| **CAPF Assistant Commandant** | Interview/Personality round | Part of 3-stage process | ~50,000 |

### Tier 2 — Banking & Finance
| Exam | Interview type | Marks/Weight | Reach interview/year |
|---|---|---|---|
| **IBPS PO** | Personal Interview | 100 marks (80:20 with Mains) | ~50,000 |
| **SBI PO** | Phase III: Interview + Group Exercise + Psychometric | 100 marks | ~25,000 |
| **RBI Grade B** | Personal Interview (Phase 3) | Critical | ~5,000 |
| **IBPS Specialist Officer (SO)** | Interview | 100 marks | ~10,000 |
| **LIC AAO** | Interview (3-stage process) | 100 marks | ~10,000 |

### Tier 3 — MBA / Higher Education
| Exam | Interview type | Marks/Weight | Reach interview/year |
|---|---|---|---|
| **CAT / IIM MBA** | Admission interview (panel of 2-3 professors) | Critical for admission | ~25,000 |

### Tier 4 — Defence (SSB 5-day process)
| Exam | Interview type | Marks/Weight | Reach interview/year |
|---|---|---|---|
| **NDA** | SSB 5-day interview | 900 marks | ~15,000 |
| **CDS** | SSB 5-day interview | 900 marks | ~20,000 |
| **AFCAT** | AFSB 5-day interview, 15 OLQs assessed | 900 marks | ~10,000 |

### Tier 5 — Technical / Scientific
| Exam | Interview type | Marks/Weight | Reach interview/year |
|---|---|---|---|
| **GATE → PSU** | PSU interviews based on GATE score | Varies | ~30,000 |
| **ISRO Scientist/Engineer** | Personal Interview | 50% weight | ~1,500 |
| **DRDO Scientist** | Personal Interview (RAC) | Critical | ~1,000 |

## ❌ Confirmed: NO interview (5 exams — DO NOT ADD)

| Exam | Why no interview |
|---|---|
| **SSC CGL** | **Interview removed in 2017**, replaced by Descriptive Paper. Modi government scrapped interviews for lower-grade posts to reduce corruption. |
| **RBI Assistant** | No interview. Selection = Prelims + Mains + Language Proficiency Test (qualifying). |
| **NEET PG** | No formal interview. Selection via NEET PG score → counselling ( MCC/State quota). |
| **CLAT** | No formal interview in main selection. Some NLUs do micro-presentation/interview but it's the exception. |
| **CTET / TET** | No interview. Selection via written test only. |

## Top 5 Selected for Phase 1

Selection criteria:
- ✅ Large applicant pool (market size)
- ✅ Interview has significant weight (real stakes for users)
- ✅ Traditional interview format (AI can simulate well)
- ✅ Strong coaching market (users already pay for prep)
- ✅ Premium audience (willing to pay for AI prep)

### #1 — UPSC Civil Services Personality Test ⭐
- **Why:** Most prestigious, 275 marks (huge weight), 5-member board, premium audience pays ₹50k-2L for offline mock interviews
- **Format:** 30 min, 5-member board, questions on current affairs, situational judgment, graduation subject, hobbies
- **Scoring dimensions:** Mental alertness, critical reasoning, ethics, leadership, depth

### #2 — IBPS PO Interview
- **Why:** Largest banking exam, mass market, 100 marks interview
- **Format:** 15-20 min, 3-4 member panel, banking awareness + HR questions
- **Scoring dimensions:** Banking knowledge, communication, personality, situation handling

### #3 — SBI PO Interview (Phase III)
- **Why:** Premium bank, includes Group Exercise + Psychometric (we can simulate)
- **Format:** 15-20 min interview + 20 min Group Exercise (GD on a topic)
- **Scoring dimensions:** Banking knowledge, GD skills, leadership, personality

### #4 — CAT / IIM MBA Admission Interview
- **Why:** Premium audience (already paying for CAT coaching), high willingness to pay
- **Format:** 15-25 min, 2-3 professors, questions on academics, work ex, current affairs, "why MBA"
- **Scoring dimensions:** Academic depth, communication, career clarity, leadership potential

### #5 — RBI Grade B Interview
- **Why:** Premium finance job, interview is critical (Phase 3)
- **Format:** 20-30 min, 5-member panel, economy/banking/finance questions + HR
- **Scoring dimensions:** Economic awareness, banking knowledge, communication, personality

## Why these 5 (and not others)

**Covered markets:** Civil services + Banking + MBA admissions = ~120,000 interview-stage candidates/year
**Skipped for Phase 1:**
- State PSCs — too fragmented (each state different), do after UPSC works
- SSB (NDA/CDS/AFCAT) — 5-day format doesn't fit our 30-min AI interview model; would need separate product
- ISRO/DRDO — too technical, small market
- GATE PSU — too fragmented (each PSU interviews differently)

## Next steps

Build the 5 exams in this order:
1. UPSC CSE (highest value, most premium)
2. IBPS PO (largest market)
3. SBI PO (premium banking, includes GD)
4. CAT/IIM MBA (premium education)
5. RBI Grade B (premium finance)

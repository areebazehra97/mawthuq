# Mawthūq MVP Walkthrough

## 1. Problem, Users, Market
Mawthūq addresses a real upstream procurement gap in Saudi construction: contractor prequalification before tender invitation. Today that work is manual, Excel-heavy, slow to audit, and inconsistent across procurement, finance, HSE, and PMO stakeholders. The target users are Procurement Analysts, Procurement Managers, Finance Reviewers, HSE Reviewers, and PMO leadership who need a faster and more defensible qualification workflow.

## 2. Product and Uniqueness
Mawthūq is an AI-powered Vendor Prequalification & Risk Engine for Saudi construction projects. It does not behave like a generic vendor CRM or document repository. Its differentiation is:

- evidence-first extraction
- deterministic rules for qualification posture
- human validation before approval
- Saudi-procurement-native terminology and governance
- downstream handoff into WhiteHelmet AI Bid Analysis

Core principle:
AI extracts evidence. Rules decide. Humans approve.

## 3. GenAI Features
GenAI is intentionally narrow and explainable in this MVP. It is used for:

- document classification
- bilingual Arabic / English understanding
- field extraction
- evidence snippet generation
- citation-backed summaries

It is not used for:

- pass / fail thresholds
- hard-gate logic
- compliance math
- override decisions
- final procurement approval

This keeps Mawthūq trustable in high-stakes procurement workflows.

## 4. Prioritization
The MVP focuses on one credible thin-slice:

1. Vendor uploads package
2. Mawthūq stores document records
3. AI extraction runs on supported document types
4. Citation-backed fields are saved
5. Deterministic scorecard is generated
6. Human reviewer validates findings
7. Approved Vendor List handoff is triggered

What was deliberately cut from v1:

- full OCR pipeline
- municipality or regulator integrations
- full Saudi Building Code reasoning
- enterprise authentication and permissions
- production-grade model observability

## 5. Ecosystem Fit
Mawthūq sits upstream in the WhiteHelmet ecosystem:

Vendor Pack -> Mawthūq -> Approved Vendor List -> AI Bid Analysis

It does not replace AI Compliance Analysis or AI Bid Analysis. Instead, it improves them by ensuring only qualified, evidence-backed vendors enter downstream evaluation.

## 6. Evaluation Strategy
The MVP includes a visible Evals Lab to demonstrate how the product would be governed. Evaluation areas include:

- extraction accuracy
- citation accuracy
- hallucination tests
- rules engine tests
- edge cases

The objective is not just model quality, but defensible procurement outcomes.

## 7. Model Choice
This MVP is designed around a lightweight “narrow live extraction + deterministic rules” architecture. The preferred production direction is a model suited to:

- strong bilingual document understanding
- reliable citation extraction
- controllable latency for enterprise review workflows
- traceable cost per package

Fallback strategy:
- if live extraction is unavailable or unsupported, Mawthūq loads seeded cited evidence and logs the fallback in the audit trail

## 8. Next Steps
The next product steps after the take-home MVP are:

- replace mock uploads with object storage-backed files
- connect real OCR/document parsing
- add reviewer permissions and approval chains
- add project-specific rule templates
- connect to downstream WhiteHelmet systems and CDE workflows
- introduce deployment controls aligned with Saudi cloud governance expectations

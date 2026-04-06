# Test Matrix

| Area | Scenario | Test Type | Status |
| --- | --- | --- | --- |
| Design Generation | Successful image generation request creates design draft | Contract + Integration | Planned |
| Design Generation | AI timeout transitions to `timed_out` and exposes retry action | Unit + Integration | Planned |
| Design Generation | Duplicate prompt/image hash blocks duplicate persisted design | Unit + Integration | Planned |
| Search Engine | Query `gift for dad` returns mixed source list | Contract + Integration | Planned |
| Search Engine | Duplicate designs are removed from merged search response | Unit + Integration | Planned |
| Product Config | Invalid size/color/material combination rejected | Unit + Contract | Planned |
| Product Config | Valid config creates preview payload | Integration | Planned |
| Mockup Engine | Preview renders fallback image on render failure | Unit + Integration | Planned |
| AI Cost Control | Daily generation limit enforced per user | Unit + Integration | Planned |
| AI Cost Control | Prompt cache hit returns cached generation metadata | Unit + Integration | Planned |
| Abuse Control | Burst generation calls trigger rate limit response | Integration | Planned |
| Quick Buy Flow | Browse -> Product -> Cart -> Checkout -> Success | E2E | Planned |
| Inspire Flow | Search -> Preview -> Product -> Cart -> Checkout | E2E | Planned |
| Create Flow | Product select -> Generate -> Edit text -> Preview -> Buy | E2E | Planned |
| Order Management | Payment failure keeps order in recoverable payment state | Unit + Integration | Planned |
| Order Management | Payment success confirms order and stores order items | Integration + E2E | Planned |
| Supplier Layer | Supplier unavailable blocks fulfillment path with reason code | Unit + Integration | Planned |
| Returns Engine | In-window return accepted and routed to review queue | Unit + Integration | Planned |
| Returns Engine | Return abuse threshold escalates for manual review | Unit + Integration | Planned |
| Pricing | VAT breakdown is accurate and displayed consistently | Unit + Contract + E2E | Planned |
| Admin Panel | Orders/returns/design moderation endpoints require admin role | Contract + Integration | Planned |
| Analytics | KPI endpoints return baseline metrics for dashboard | Integration | Planned |

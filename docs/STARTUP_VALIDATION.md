# MediTriage — Startup Validation Brief

A short brief for mentors, judges, and user interviews: **why this product is valid**, **how it becomes a startup**, and **what to ask real users**.

---

## The problem

People often do not know whether their symptoms need an **ER** (Emergency Room / hospital emergency), a clinic visit within 1–2 days, or simple self-care. They either panic and overload emergency departments — or ignore real red flags until it is too late.

### What goes wrong today

- ERs receive many visits that did not need emergency care.
- People with true emergencies (stroke signs, severe chest pain, trouble breathing) sometimes wait too long.
- In many cities and rural areas there is no reliable nurse line at midnight.
- Clinics spend time on low-urgency walk-ins while missing patients who needed faster referral.

### What MediTriage solves

**Not diagnosis. Not treatment.**  
The “what should I do *next*?” moment — with a clear urgency recommendation and a path to the right care.

---

## Glossary

| Term | Meaning |
|------|---------|
| **ER** | Emergency Room — hospital emergency / casualty for urgent, life-threatening problems |
| **Triage** | Sorting patients by urgency so the sickest get help first |
| **Protocol engine** | Rules that can *escalate* urgency if the AI underestimates risk |
| **White-label** | Clinic uses MediTriage under *their* brand (e.g. `/o/demo-clinic/triage`) |
| **B2B** | Business-to-business — clinics / insurers pay, not only end patients |

---

## Why this product is valid

1. **Clear pain** — Confusion about “ER vs clinic vs home” is common and costly.
2. **Safety design** — Chat AI + separate protocol that can escalate urgency; audit + export for accountability.
3. **Workflow, not only chat** — Urgency badge, care routing, share-to-clinic inbox, clinician-ready JSON.
4. **Distribution paths** — Patient app, white-label clinic pages, public API for partners.
5. **Honest scope** — Advisory guidance, not a licensed diagnosis — fits early startup + clinical caution.

---

## How it becomes a startup (who pays)

| Channel | Who pays | Why they pay |
|---------|----------|--------------|
| **Clinics / hospitals** | Clinic or hospital chain | Fewer wasted ER/walk-in load; pre-structured cases in inbox |
| **Health apps** | Health-tech companies | Add triage via API; pay per call |
| **Insurance** | Insurers | Route members to the right care level before expensive claims |
| **Patients (later)** | Individuals | Free basic triage; premium for sync, family accounts, clinic share |

**Core insight:** Clinics and insurers lose money on mis-triage every day. MediTriage is a **routing and cost-reduction layer**, not only a consumer chatbot.

---

## How the world uses MediTriage

1. **Patient at 2 AM** — Describes chest tightness → protocol may flag emergency → “call emergency / go to ER” + nearby hospital contacts.
2. **Clinic website** — White-label triage → patient shares case → staff see prioritized inbox.
3. **Rural / vernacular apps** — Integrate `/api/v1/triage` (e.g. Hindi UI) when a doctor is not immediately available.
4. **Insurance** — Members triage first → fewer unnecessary ER claims.

---

## Differentiation (short)

| Typical symptom app | MediTriage |
|---------------------|------------|
| One model decides everything | LLM chats; **protocol can escalate** |
| Advice text only | Urgency + **nearby care** + **clinic share** |
| Consumer-only | **Clinic dashboard + API + white-label** |
| Hard to audit | **Audit log + assessment export** |

---

## Pitch line for your mentor

> The problem is **mis-triage** — people don’t know if they need an ER, a clinic, or rest. That costs patients time and hospitals money. MediTriage gives a **safe next-step** recommendation with a **rules-based safety net** on top of AI, then can **route the case to a clinic**. The business is **B2B**: clinics and insurers pay because it reduces wasted visits. We validate with real users before building further.

---

## Questions for real users

Talk to **~5 patients** and **~5 clinicians / front-desk staff**. Record answers (notes or voice). Look for repeated pain and willingness to pay.

### Patients (friends, family, anyone who has been unwell)

1. Think of the last time you felt unwell and weren’t sure if it was serious. **What did you do first?**
2. What was the **hardest part** about deciding whether to see a doctor?
3. If an app said “go to ER now” or “safe to monitor at home,” **would you trust it?** What would make you trust it?
4. Have you ever gone to the ER and been told it wasn’t necessary — **or waited too long** and it got worse?
5. Would you **share** a triage summary with a clinic before visiting? Why or why not?

### Clinicians / clinic staff

1. Roughly what **percentage** of daily patients could have been handled by a call or self-care advice?
2. How do patients describe symptoms when they call or walk in — **useful or chaotic?**
3. If patients arrived with a **pre-triage summary** (urgency, symptoms, duration), would that save time?
4. What’s the bigger bottleneck — **too many low-urgency cases**, or **missing high-urgency ones?**
5. Would you **pay** for a tool that pre-screens patients before they book?

### After interviews — capture

- Top 3 pains (in their words)
- Who already “owns” this problem (Google, WhatsApp relatives, chemist, ER)
- Trust blockers (liability, language, internet, “is it a doctor?”)
- Who would pay, and roughly how much / how (per month, per patient, API)

---

## What we already built (proof, not just idea)

| Phase | Outcome |
|-------|---------|
| **1** | Protocol urgency engine, audit, assessment export, eval harness |
| **2** | Auth + cloud history, EN/HI, care routing |
| **3** | Clinic inbox, white-label URLs, public triage API |

**Next for the startup story:** finish user interviews → pick one beachhead customer (one clinic type or one API partner) → pilot with them.

---

## Related docs

- Public API: `docs/PUBLIC_API.md`
- DB setup: `supabase/schema.sql`, `supabase/schema-phase3.sql`

# Product Decisions

This file records decisions that should remain stable unless explicitly revisited.

## 2026-08-19 — Product scope
**Decision:** Build a simple personal finance app focused on expenses, income, accounts and net worth.

**Reason:** The core user problem is understanding where money goes and where it is held. Avoid feature bloat.

## 2026-08-19 — No Open Banking initially
**Decision:** Do not build bank-account connections in the initial product.

**Reason:** Avoid complexity, third-party API costs and privacy/security burden. Manual entry and CSV are sufficient for the initial validation.

## 2026-08-19 — Manual entry is core
**Decision:** Manual transaction entry remains a core product workflow.

**Reason:** Simplicity and user control are part of the product positioning.

## 2026-08-19 — CSV import
**Decision:** Keep CSV import as a secondary input method.

**Reason:** Useful for historical/bulk data without requiring banking integrations.

## 2026-08-19 — iOS Shortcuts
**Decision:** Plan iOS Shortcuts as a future automation layer.

**Reason:** It can reduce the friction of manual tracking without giving the application direct access to bank accounts.

**Constraint:** Exact technical capabilities must be validated before implementation.

## 2026-08-19 — Investments are secondary
**Decision:** Support investments, but do not make investment management the core product.

**Reason:** The core proposition is expense control + money visibility + net worth.

## 2026-08-19 — No budgets initially
**Decision:** Do not make budgeting a core module.

**Reason:** User preference and desire to keep the product simple.

## 2026-08-19 — International from the beginning
**Decision:** Build for international users from the start.

**Language priority:** English first, followed by Spanish, French, Italian and German.

**Reason:** International scope is strategically important and should not require a later architectural rewrite.

## 2026-08-19 — Independent brand
**Decision:** The product will use an independent brand rather than the creator's personal name.

## 2026-08-19 — Design is a differentiator
**Decision:** Visual quality is a core product feature.

**References:** Monefy for simplicity; Margen for visual ambition, animations and merchant logos.

## 2026-08-19 — No feature-count competition
**Decision:** Do not try to beat Wallet/Soldi by adding more financial features.

**Reason:** The competitive strategy is focus, simplicity and visual quality.

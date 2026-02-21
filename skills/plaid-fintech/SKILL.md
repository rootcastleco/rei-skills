---
name: plaid-fintech
description: "Expert patterns for Plaid API integration including Link token flows, transactions sync, identity verification, Auth for ACH, balance checks, webhook handling, and fintech compliance best practices..."
source: rootcastle-rei
risk: unknown
---

# Plaid Fintech

## Patterns

### Link Token Creation and Exchange

Create a link_token for Plaid Link, exchange public_token for access_token.
Link tokens are short-lived, one-time use. Access tokens don't expire but
may need updating when users change passwords.


### Transactions Sync

Use /transactions/sync for incremental transaction updates. More efficient
than /transactions/get. Handle webhooks for real-time updates instead of
polling.


### Item Error Handling and Update Mode

Handle ITEM_LOGIN_REQUIRED errors by putting users through Link update mode.
Listen for PENDING_DISCONNECT webhook to proactively prompt users.


## Anti-Patterns

### ❌ Storing Access Tokens in Plain Text

### ❌ Polling Instead of Webhooks

### ❌ Ignoring Item Errors

## ⚠️ Sharp Edges

| Issue | Severity | Solution |
|-------|----------|----------|
| Issue | critical | See docs |
| Issue | high | See docs |
| Issue | high | See docs |
| Issue | high | See docs |
| Issue | medium | See docs |
| Issue | medium | See docs |
| Issue | medium | See docs |
| Issue | medium | See docs |

## When to Use
This skill is applicable to execute the workflow or actions described in the overview.

---

> 🏰 **Rei Skills** — Curated by [Rootcastle Engineering & Innovation](https://www.rootcastle.com) | Batuhan Ayrıbaş  
> Engineering Beyond Boundaries | admin@rootcastle.com

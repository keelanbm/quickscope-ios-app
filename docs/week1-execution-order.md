# Week 1 Execution Order (Strict)

This is the linearized execution order for Week 1 tickets so tasks can be pasted into Linear/Jira in dependency-safe sequence.

## Roles

- **ME** = Mobile Engineer
- **FSE** = Full-Stack Engineer
- **BE** = Backend Engineer
- **PLE** = Product/Engineering Lead

---

## Sequence

1. **IOS-001** (ME, 0.75d) - Monorepo bootstrap and baseline tooling  
   Depends on: none
2. **IOS-002** (ME, 0.5d) - Phantom template intake hardening  
   Depends on: IOS-001
3. **IOS-003** (ME, 0.75d) - Environment configuration contract  
   Depends on: IOS-002
4. **IOS-004** (ME, 0.75d) - Local run and CI validation lane  
   Depends on: IOS-003
5. **IOS-010** (ME, 1.0d) - Navigation shell and route map  
   Depends on: IOS-002
6. **IOS-011** (ME, 0.75d) - Deep-link parser baseline  
   Depends on: IOS-010
7. **IOS-008** (FSE, 1.0d) - API transport parity harness  
   Depends on: IOS-003
8. **IOS-009** (FSE, 1.0d) - Core endpoint smoke tests  
   Depends on: IOS-008
9. **IOS-005** (ME, 1.0d) - Auth flow spike from native app  
   Depends on: IOS-003
10. **IOS-006** (ME, 0.75d) - Session refresh and persistence spike  
    Depends on: IOS-005
11. **IOS-007** (ME + BE, 0.5d) - Cookie vs token auth compatibility decision  
    Depends on: IOS-006
12. **IOS-012** (ME + BE, 1.0d) - Telegram native linking feasibility spike  
    Depends on: IOS-005
13. **IOS-013** (ME, 0.75d) - Websocket connectivity spike  
    Depends on: IOS-003
14. **IOS-014** (ME, 0.5d) - Observability baseline  
    Depends on: IOS-003
15. **IOS-015** (PLE, 0.5d) - Architecture and PRD sync update  
    Depends on: IOS-007, IOS-009, IOS-012
16. **IOS-016** (PLE, 0.5d) - Weeks 2-3 execution board creation  
    Depends on: IOS-015

---

## Recommended Day-Level Schedule

### Day 1

- IOS-001
- IOS-002
- IOS-003

### Day 2

- IOS-004
- IOS-010

### Day 3

- IOS-011
- IOS-008

### Day 4

- IOS-009
- IOS-005

### Day 5

- IOS-006
- IOS-007
- IOS-012
- IOS-013
- IOS-014
- IOS-015
- IOS-016

---

## Linear/Jira Import-Friendly Table

| Key | Title | Priority | Owner | Estimate (d) | Depends On |
|---|---|---:|---|---:|---|
| IOS-001 | Monorepo bootstrap and baseline tooling | P0 | ME | 0.75 | - |
| IOS-002 | Phantom template intake hardening | P0 | ME | 0.5 | IOS-001 |
| IOS-003 | Environment configuration contract | P0 | ME | 0.75 | IOS-002 |
| IOS-004 | Local run and CI validation lane | P0 | ME | 0.75 | IOS-003 |
| IOS-010 | Navigation shell and route map | P0 | ME | 1.0 | IOS-002 |
| IOS-011 | Deep-link parser baseline | P0 | ME | 0.75 | IOS-010 |
| IOS-008 | API transport parity harness | P0 | FSE | 1.0 | IOS-003 |
| IOS-009 | Core endpoint smoke tests | P0 | FSE | 1.0 | IOS-008 |
| IOS-005 | Auth flow spike from native app | P0 | ME | 1.0 | IOS-003 |
| IOS-006 | Session refresh and persistence spike | P0 | ME | 0.75 | IOS-005 |
| IOS-007 | Cookie vs token auth compatibility decision | P0 | ME+BE | 0.5 | IOS-006 |
| IOS-012 | Telegram native linking feasibility spike | P1 | ME+BE | 1.0 | IOS-005 |
| IOS-013 | Websocket connectivity spike | P1 | ME | 0.75 | IOS-003 |
| IOS-014 | Observability baseline | P1 | ME | 0.5 | IOS-003 |
| IOS-015 | Architecture and PRD sync update | P1 | PLE | 0.5 | IOS-007, IOS-009, IOS-012 |
| IOS-016 | Weeks 2-3 execution board creation | P1 | PLE | 0.5 | IOS-015 |

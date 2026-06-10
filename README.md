# H3AD-LEARN

**Security Training Platform · H3AD-SEC**

Modular browser-native security training for SOC analysts and detection engineers. No account, no subscription, no backend. Progress tracked locally via localStorage.

Live at: [h3ad-sec.github.io/H3AD-LEARN](https://h3ad-sec.github.io/H3AD-LEARN/)

---

## Modules

### Threat Hunting — LIVE
Nine chapters covering the complete hunt lifecycle.

| # | Chapter | Difficulty | Time |
|---|---------|------------|------|
| 01 | Threat Hunting Foundations | Beginner | 25 min |
| 02 | Hypothesis Generation — ABLE Framework | Beginner | 30 min |
| 03 | Hunting Frameworks — PEAK, TaHiTI, SANS PAM | Intermediate | 35 min |
| 04 | Data Sources and Telemetry | Intermediate | 30 min |
| 05 | Hunt Execution — KQL/SPL/Sigma, long-tail, pivoting | Intermediate | 35 min |
| 06 | Evidence Quality and Scoring — Admiralty, Diamond, PoP | Intermediate | 25 min |
| 07 | Hunt Lifecycle and Documentation | Advanced | 30 min |
| 08 | Advanced Topics — ML, purple team, AI, program building | Advanced | 40 min |
| 09 | Hunting LOLBin Abuse | Advanced | 40 min |

### LOLBAS (Living Off the Land) — LIVE
Eight chapters on LOLBin taxonomy, attacker tradecraft, and detection.

| # | Chapter | Difficulty | Time |
|---|---------|------------|------|
| 01 | LOL Fundamentals — taxonomy, ATT&CK, why defenders struggle | Beginner | 30 min |
| 02 | LOLBin Catalog — certutil, mshta, regsvr32, rundll32, BITS, WMIC | Intermediate | 40 min |
| 03 | LOLScripts, LOLLibs, and LOLDrivers — PowerShell, AMSI, BYOVD | Intermediate | 30 min |
| 04 | Attacker Tradecraft — kill chains, download cradles, persistence, lateral movement | Intermediate | 35 min |
| 05 | Detection Strategy — behavioral, parent-child, baseline, network | Intermediate | 35 min |
| 06 | Detection Queries — KQL, SPL, Sigma for every major LOLBin | Intermediate | 40 min |
| 07 | Threat Actor Campaigns — APT32/34/Lazarus, ransomware, Cobalt Strike | Advanced | 35 min |
| 08 | Advanced Evasion and Defense — AMSI bypass, AppLocker/WDAC, hardening | Advanced | 40 min |

---

## Design

- Fonts: Exo 2 (body) + Share Tech Mono (mono)
- Colors: cyan (#00d4ff) accent, amber (#f59e0b) warning — no red/green (colorblind-safe)
- Dark / light theme, fully responsive
- Progress tracked per-chapter, per-section in `learn_progress_v2` localStorage key
- Knowledge checks with immediate feedback on every chapter

## Stack

- Static HTML / CSS / Vanilla JS
- GitHub Pages
- No build step, no dependencies, no tracking

# Bodywise Care Guide MVP

A static, offline-first guided product assistant for a small Bodywise body wash and roll-on catalog. It has no backend, API key, login, analytics, or paid dependency.

## Run locally

Open `index.html` in a modern browser for the basic experience. To load `catalog.json` separately and test it exactly as a hosted site, start a local static server from this folder:

```sh
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## What it does

- Product-in-mind flow with autocomplete for the supported catalog.
- Concern-first flow for body acne, bumpy skin, sensitive/dry skin, underarm odour, sweat, and dark patches.
- Deterministic adaptive questions based on the selected product category.
- On-device keyword safety routing for concerning symptoms, reactions, pregnancy/breastfeeding, and medications.
- A better-match engine that chooses unscented/gentler alternatives when fragrance sensitivity or fresh shaving makes the original product a poor fit.
- Typed quick replies plus optional browser-native speech recognition. Typing always works if speech is unsupported.
- A private clinician discussion summary that can be printed or saved as a PDF through the browser’s print dialog.

## Safety model

The assistant is product guidance only. It does not diagnose conditions or give treatment advice. Safety keywords trigger the escalation screen and an explanation of when to seek urgent help. The detection list and product label cautions in `app.js` / `catalog.json` should be clinically reviewed before any public launch.

## Demo paths

1. **Good fit:** Choose “Not sure yet” → “Body acne or back bumps” → select non-sensitive answers.
2. **Alternative:** Search for “roll-on” → choose `3% AHA Roll-On` → answer “Yes” to shaving in the last 24 hours.
3. **Escalation:** Type “I have severe pain and swelling” as a concern or conversation answer → add optional notes → use **Print / save as PDF**.

## Project files

- `index.html`: application shell and privacy messaging.
- `styles.css`: responsive UI and print-specific report styling.
- `app.js`: catalog fallback, intent matching, adaptive questionnaire, safety checks, speech input, and report rendering.
- `catalog.json`: editable product catalog and label-derived product data.

## Extending later

Add products by following the existing `catalog.json` fields. Keep product facts sourced from official labels. Any future API or language-model layer should be optional and must retain the existing deterministic safety engine and tap-only fallback.

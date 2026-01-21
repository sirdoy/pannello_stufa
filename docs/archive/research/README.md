# Research Packs

Questa cartella contiene i **ResearchPack** generati durante la fase di ricerca per l'implementazione di nuove features.

## Contenuto

| File | Feature | Data |
|------|---------|------|
| [ResearchPack_Auth0_NextJS15.md](ResearchPack_Auth0_NextJS15.md) | Auth0 v4 integration | Dec 2024 |
| [ResearchPack_Firebase_RealTime_Listeners.md](ResearchPack_Firebase_RealTime_Listeners.md) | Firebase real-time homepage | Dec 2024 |
| [ResearchPack_Homepage_Redesign_2025.md](ResearchPack_Homepage_Redesign_2025.md) | Homepage UI/UX redesign | Dec 2024 |
| [ResearchPack_HueRemoteAPI.md](ResearchPack_HueRemoteAPI.md) | Philips Hue Remote API | Jan 2025 |

## Struttura ResearchPack

Ogni ResearchPack segue questo formato:

```markdown
# ResearchPack: [Feature Name]

## Executive Summary
Breve overview della ricerca

## Library/API Information
- Nome e versione
- Link documentazione ufficiale
- Compatibilità

## API Documentation
Documentazione delle API rilevanti con esempi

## Implementation Examples
Esempi di codice testati

## Quality Score
Score >= 80 richiesto per procedere al planning

## Sources
Link alle fonti consultate
```

## Workflow

1. **Research** -> ResearchPack (score >= 80)
2. **Planning** -> ImplementationPlan (in `/docs/plans/`)
3. **Implementation** -> Code changes

## Quality Gate

- **Score minimo**: 80/100
- **Requisiti**: Versione libreria, 3+ API documentate, esempi codice
- **Blocco**: Non si procede al planning se score < 80

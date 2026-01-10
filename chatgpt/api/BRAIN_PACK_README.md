# Brain Pack v1 - Infrastructure Setup

This directory contains the **Brain Pack v1** infrastructure for Archive of Tongues, implementing:

- 🧠 Learner Model (Bayesian Knowledge Tracing)
- 🎯 Personalization Engine (Contextual Bandit)
- 📊 Telemetry System
- 💬 Coach Engine
- 💳 UZ Payments (Click/Payme)
- 🛡️ Minor Safety & Parental Controls

## Quick Start

### 1. Initialize Brain Pack Infrastructure

Run the setup script to create KV namespace, R2 bucket, and initialize D1 tables:

```powershell
cd api
./setup-brain.ps1
```

This will:
- Create KV namespace for version pointers
- Create R2 bucket for brain pack JSONs
- Upload `brain_pack_v1.json` to R2
- Set version pointer to `v1.0.0`
- Apply learner state schema to D1

### 2. Update `wrangler.toml`

Copy the KV namespace IDs from the setup output and update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "KV"
id = "your-kv-id-here"
preview_id = "your-kv-preview-id-here"
```

### 3. Test Brain Pack Loading

```powershell
npm run dev
```

Visit: `http://localhost:8787/api/brain/status`

Expected response:
```json
{
  "ok": true,
  "status": "operational",
  "version": "v1.0.0",
  "region": "UZ",
  "default_locale": "uz",
  "cache_status": {
    "is_valid": true,
    "current_version": "v1.0.0"
  },
  "capabilities": {
    "learner_model": true,
    "personalization": true,
    "telemetry": true,
    "coach_engine": true,
    "payments": ["click", "payme"]
  }
}
```

## Architecture

```
api/
├── content/
│   └── brain_pack_v1.json        # Brain Pack contract
├── src/
│   └── brain/
│       ├── types.ts               # TypeScript interfaces
│       ├── BrainPackLoader.ts     # KV/R2 loader with caching
│       ├── LearnerState.ts        # Learner state management
│       ├── PolicyEngine.ts        # Quest selection (TODO)
│       ├── BKTEngine.ts           # Bayesian Knowledge Tracing (TODO)
│       └── FatigueManager.ts      # Fatigue tracking (TODO)
├── db/
│   ├── schema_learner_state.sql   # Learner state tables
│   └── seed_learner_state.sql     # Initial data
└── setup-brain.ps1                # Setup script
```

## Brain Pack Contract

The Brain Pack JSON defines:

### 1. Buyer Persona
- **P1**: Parents/Guardians (30-50) - core payer segment
- **U1**: Teen "Bobur" (15) - primary user

### 2. Learner Model
- **6 Skills**: reading, listening, grammar, vocab, writing, speaking
- **Mastery Range**: 0.0-1.0 (init: 0.12)
- **Error Fingerprint**: Top 20 error tags with decay
- **Fatigue Tracking**: 0.0-1.0 with recovery rules

### 3. Personalization Policy
- **Method**: Contextual bandit (epsilon=0.12)
- **Constraints**: Max difficulty jump=1, PvP lockout if mastery<0.25
- **Localization**: Smart UZ/RU after 2 failures

### 4. Telemetry Events
- `session_start`, `quest_started`, `task_viewed`
- `hint_used`, `task_answered`, `quest_submitted`
- `purchase_attempted`

### 5. Coach Engine
- **Hint Levels**: 1 (nudge), 2 (structured), 3 (explainer)
- **Tone**: Teen game voice, non-shaming
- **Localization**: UZ/RU/EN

### 6. Anti-Leak Guardrails
- **Forbidden**: "IELTS", "band", "exam", "Cambridge"
- **Substitutions**: band→rank, test→trial, listening section→echo chamber

## Next Steps

1. ✅ Phase 1: Core Infrastructure (COMPLETE)
2. 🚧 Phase 2: Implement PolicyEngine for quest selection
3. 🚧 Phase 3: Implement BKTEngine for mastery updates
4. 🚧 Phase 4: Implement FatigueManager
5. 🚧 Phase 5: Add Telemetry middleware
6. 🚧 Phase 6: Integrate Click/Payme payments
7. 🚧 Phase 7: Build CoachEngine with hints
8. 🚧 Phase 8: Test with 2K concurrent users

## API Endpoints

### Brain Pack Management
- `GET /api/brain/status` - Brain pack version and capabilities
- `POST /api/brain/reload` - Force reload (admin only, TODO)

### Learner State
- `GET /me` - Returns player state + learner state
- `POST /quest/next` - Uses PolicyEngine for quest selection
- `POST /quest/submit` - Updates mastery with BKT

## Development

### Hot Reload
Brain Pack is cached for 10 minutes. To reload:
1. Upload new brain pack to R2
2. Update KV version pointer
3. Wait for cache expiry or restart worker

### Testing
```powershell
npm run dev  # Local development
npm test     # Run tests (TODO)
```

## References

- [Brain Pack Contract](file:///d:/apps/game/chatgpt/api/content/brain_pack_v1.json)
- [TypeScript Types](file:///d:/apps/game/chatgpt/api/src/brain/types.ts)
- [BrainPackLoader](file:///d:/apps/game/chatgpt/api/src/brain/BrainPackLoader.ts)
- [Implementation Plan](file:///C:/Users/GL75/.gemini/antigravity/brain/77dfb637-1750-433c-b289-7a531cf98f77/implementation_plan.md)

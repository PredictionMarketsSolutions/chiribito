# Coverage Improvement Plan

## Current Status
- Overall line coverage: **28.94%** (goal: 85%)
- GameEngine: **50.93%** ✅
- Managers: **94.75%** ✅
- Security modules: **0%** (not tested)
- Schema: **0%** (generated, can exclude)

## Priority Tiers

### Tier 1: High-Impact Utility Modules (GameEngine utilities)
These have low coverage but are core game logic:
- [ ] **CardEvaluator.ts** - 14.28% coverage → Target: 80%
- [ ] **WinnerDeterminator.ts** - 12.5% coverage → Target: 80%
- [ ] **RoundManager.ts** - 23.07% coverage → Target: 75%
- [ ] **GameBroadcaster.ts** - 20% coverage → Target: 70%
- [ ] **PlayerActions.ts** - 0% coverage → Target: 70%
- [ ] **GameUtils.ts** - 28.33% coverage → Target: 70%

**Why: These are pure functions with complex logic and high test ROI**

### Tier 2: Security & Validation
- [ ] game-validation.ts - 0% → Basic smoke tests
- [ ] game-audit.ts - 0% → Basic smoke tests  
- [ ] anti-cheat.ts - 0% → Basic smoke tests
- [ ] game-action-rate-limit.ts - 0% → Basic smoke tests

**Why: Less critical for core gameplay, can start with basic coverage**

### Tier 3: Exclude from Coverage (not worth testing)
```javascript
// Update collectCoverageFrom to exclude:
'!src/**/schema/**',           // Generated files
'!src/**/index.ts',            // Export-only files
'!src/**/*.d.ts',              // Type definitions
'!src/app.config.ts',          // Config
'!src/config/**',              // Config module
```

## Recommended Next Steps

### Short-term (get to 50% coverage)
1. Add tests for CardEvaluator (pure poker hand evaluation logic)
2. Add tests for WinnerDeterminator (winner + sidepot calculation)
3. Exclude schema and config files from coverage

### Medium-term (get to 70% coverage)
1. Add tests for RoundManager
2. Add tests for GameUtils
3. Add basic security module smoke tests

### Long-term (get to 85%+ coverage)
1. Add integration tests for full game flows
2. Add edge case tests for all utilities
3. Add MyRoom integration tests

## Test File Organization
```
src/__tests__/
├── GameEngine.handleBet.test.ts (33 tests ✅)
├── SessionManager.test.ts (18 tests ✅)
├── ConnectionMonitor.test.ts (17 tests ✅)
├── SeatManager.test.ts (26 tests ✅)
├── RateLimiterService.test.ts (26 tests ✅)
├── AnalyticsService.test.ts (31 tests ✅)
├── game/
│   ├── CardEvaluator.test.ts (PRIORITY)
│   ├── WinnerDeterminator.test.ts (PRIORITY)
│   ├── RoundManager.test.ts (MEDIUM)
│   ├── GameUtils.test.ts (MEDIUM)
│   ├── PlayerActions.test.ts (MEDIUM)
│   └── GameBroadcaster.test.ts (LOW)
└── security/
    └── basic.test.ts (basic smoke tests)
```

## Coverage Thresholds Progression

Currently configured:
```javascript
'./src/rooms/game/GameEngine.ts': { branches: 40, functions: 40, lines: 40 }
'./src/rooms/managers/': { branches: 30, functions: 30, lines: 30 }
```

Suggested progression:
- **Phase 1** (now): GameEngine 40%, Managers 30% ✅
- **Phase 2**: GameEngine 50%, Managers 80%, Utilities 30%
- **Phase 3**: GameEngine 70%, Managers 90%, Utilities 60%
- **Phase 4**: Global 60%, then 75%, then 85%

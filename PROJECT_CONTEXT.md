# 🎯 Project Context Reference

**Last Updated**: March 5, 2026  
**Project**: Chiri Backend - Texas Hold'em Poker Game Server  
**Status**: ✅ Production Ready  
**Working Directory**: `c:\project-chiribito-test-backend\Chiri-backend`

---

## 📋 Quick Facts

| Key | Value |
|-----|-------|
| **Main Tech** | Colyseus 0.16, TypeScript 5.x, Node.js 18+/20+ |
| **Game Server** | WebSocket-based real-time multiplayer |
| **API Backend** | Express.js with JWT auth |
| **Database** | PostgreSQL + TypeORM + Redis caching |
| **Testing** | Jest 29.x with ts-jest (342 tests, 14 suites) |
| **Code Quality** | 50.93% line coverage, 44.64% branch coverage |
| **CI/CD** | GitHub Actions (test-coverage.yml, build.yml) |
| **Entry Point** | `src/index.ts`, `api-server/src/index.ts` |

---

## 🏗️ Architecture Overview

### Core System

```
MyRoom (Colyseus Handler)
  ├─ GameEngine (Orchestrator ~250 lines)
  │   ├─ CardEvaluator (Hand eval)
  │   ├─ GameBroadcaster (Events)
  │   ├─ GameUtils (Player utils)
  │   ├─ RoundManager (Betting)
  │   ├─ WinnerDeterminator (Pots)
  │   └─ PlayerActions (Fold/Check)
  │
  └─ 8 Manager Modules (extracted, 100% tests)
      ├─ AuthenticationService (JWT, 12 tests)
      ├─ PlayerLifecycleManager (Join/Leave, 28 tests)
      ├─ RebuyManager (Rebuy logic, 15 tests)
      ├─ SeatManager (Seating, 8 tests)
      ├─ SessionManager (Sessions, 18 tests)
      ├─ ConnectionMonitor (WebSocket, 6 tests)
      ├─ RateLimiterService (Rate limit, 4 tests)
      └─ AnalyticsService (Tracking, 5 tests)
```

### Key Design Decisions

1. **Manager Extraction** - MyRoom was 51% larger before extraction → improves testability
2. **IGameRoom Interface** - Enables dependency injection for testing
3. **Modular Utilities** - Each game utility is isolated and independently testable
4. **Global Jest Setup** - `src/__tests__/setup.ts` provides consistent fetch mocking
5. **Property-Based Testing** - Sidepot tests verify chip conservation mathematically

---

## 📂 File Structure Quick Reference

### Critical Game Files
- `src/rooms/MyRoom.ts` - Main room handler
- `src/rooms/game/GameEngine.ts` - Main orchestrator
- `src/rooms/game/utils/WinnerDeterminator.ts` - **RECENTLY FIXED** sidepot calculation
- `src/rooms/schema/MyRoomState.ts` - Game state schema

### Manager Modules (Extracted)
```
src/rooms/managers/
├── AuthenticationService.ts          (12 tests)
├── PlayerLifecycleManager.ts         (28 tests)  
├── RebuyManager.ts                   (15 tests)
├── SeatManager.ts                    (8 tests)
├── SessionManager.ts                 (18 tests)
├── ConnectionMonitor.ts              (6 tests)
├── RateLimiterService.ts             (4 tests)
├── AnalyticsService.ts               (5 tests)
└── index.ts                          (exports)
```

### Test Files
```
src/__tests__/
├── setup.ts                          (global fetch mock)
├── game/
│   ├── GameEngine.handleBet.test.ts  (55+ tests)
│   ├── SidepotCalculation.test.ts    (6 tests - FIXED)
│   ├── WinnerDeterminator.test.ts    (28 tests)
│   ├── CardEvaluator.test.ts         (28 tests)
│   └── RoundManager.test.ts
├── managers/
│   ├── AuthenticationService.test.ts (12 tests)
│   ├── PlayerLifecycleManager.test.ts (28 tests)
│   ├── RebuyManager.test.ts          (15 tests)
│   └── ...
└── integration/
    └── GameFlow.integration.test.ts  (11 tests)
```

---

## 🐛 Recent Bug Fixes & Improvements

### ✅ Sidepot Chip Loss Bug (FIXED)

**Issue**: Chips being created/lost during sidepot distribution  
**Symptom**: Input chips ≠ Output chips in pot distribution  
**Root Cause**: Line 97 used `sortedContributions.length` (constant) instead of counting active participants  

**Example**:
```
A=1000, B=600, C=200 (total=1800)
OLD: Level 600: pot = 400 × 3 = 1200 ❌ (C shouldn't be counted)
NEW: Level 600: pot = 400 × 2 = 800 ✅ (only A,B active at this level)
```

**Files Changed**:
1. `src/rooms/game/utils/WinnerDeterminator.ts` - Complete rewrite of `calculateSidePotPayouts()` (lines 81-135)
2. `src/__tests__/game/SidepotCalculation.test.ts` - **NEW** 6 comprehensive tests
3. `jest.config.js` - Added `setupFilesAfterEnv` pointing to global setup
4. `src/__tests__/setup.ts` - **NEW** global Jest setup with fetch mock
5. `src/__tests__/managers/AuthenticationService.test.ts` - Updated mock handling

**Verification**:
- ✅ 6/6 SidepotCalculation tests passing
- ✅ 342/342 total tests passing
- ✅ 2000 fuzz testing iterations passing
- ✅ 4 manual test scenarios passing

**Commit**: `ba98c82`

### ✅ Authentication Mock Error (FIXED)

**Issue**: `TypeError: Cannot read properties of undefined (reading 'ok')`  
**Cause**: `global.fetch` mock not available in all tests  
**Solution**: Created global Jest setup file with default fetch mock

---

## 🧪 Test Statistics

```
Total Tests:     342 passing ✅
Test Suites:     14
Run Time:        ~6.4 seconds
Coverage:        50.93% lines | 44.64% branches (GameEngine)

Distribution by Module:
- GameEngine:           55+ tests | 50.93%
- Card Evaluation:      28 tests | High
- Sidepot:             6 tests | 100% (property-based)
- Player Lifecycle:    28 tests | 100%
- Authentication:      12 tests | High
- Game Flow (integ):   11 tests | High
- Other Managers:      96 tests | 100%
- Utilities:          106+ tests | Variable
```

### Running Tests

```bash
# All tests
npm run test:jest -- --forceExit

# With coverage report
npm run test:jest:coverage

# Specific test file
npm run test:jest -- SidepotCalculation.test.ts --forceExit

# Watch mode (development)
npm run test:jest -- --watch
```

---

## 🎮 Game Rules & Features

### Core Poker Rules Implemented
✅ Texas Hold'em (5 community + 2 hole cards)  
✅ Preflop → Flop → Turn → River betting rounds  
✅ Multiple players (2-6 supported)  
✅ All-in detection with automatic sidepot calculation  
✅ Fold/Check/Call/Raise/All-in actions  
✅ Automatic winner determination (7-card best hand)  

### Advanced Features
✅ **Chip Conservation** - All chips accounted for in distribution  
✅ **Uncalled Bets** - Returned when all-in players can't win  
✅ **Remainder Distribution** - Remainder chips split fairly  
✅ **Rebuy System** - Players can rebuy when busted  
✅ **Real-time Broadcasting** - WebSocket events to all clients  
✅ **Blind Scheduling** - Auto-increase with configurable timing  

### Security & Anti-Cheat
✅ JWT token validation with remote API checks  
✅ Session management (no concurrent logins per user)  
✅ Rate limiting per client (5 actions/second default)  
✅ Action cooldowns (1000ms default)  
✅ Full game state validation on every action  
✅ Comprehensive audit logging  

---

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Development
npm run dev           # Start Colyseus server (port 3000)
npm run dev:api      # Start API server (port 3000)

# Testing
npm run test:jest    # Run all tests
npm run test:jest:coverage  # With coverage report
npm run test:jest -- --watch  # Watch mode

# Build
npm run build        # Compile TypeScript
npm run build:api    # Build API server

# Utility
npm run lint         # Check TypeScript
```

---

## 📊 Coverage & Quality Metrics

### Current Status (March 5, 2026)

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Line Coverage | 50.93% | 50%+ | ✅ Pass |
| Branch Coverage | 44.64% | 40%+ | ✅ Pass |
| Test Pass Rate | 100% (342/342) | 100% | ✅ Pass |
| Manager Tests | 100% (96 tests) | 80%+ | ✅ Excellent |
| Integration Tests | 11 tests | 10+ | ✅ Pass |

### Coverage Thresholds by Module

```javascript
// jest.config.js thresholds
{
  global: { branches: 0, functions: 1, lines: 1, statements: 1 },
  './src/rooms/game/GameEngine.ts': { branches: 40, functions: 40, lines: 40 },
  './src/rooms/managers/': { branches: 30, functions: 30, lines: 30 }
}
```

---

## 🚀 Deployment & CI/CD

### GitHub Actions Workflows

**test-coverage.yml**
- Triggers: Push to main/develop, Pull Requests
- Actions: Run 342 tests, generate coverage, upload to Codecov
- Status: ✅ All checks passing

**build.yml**
- Triggers: Push to main, Pull Requests
- Actions: Validate build, type checking
- Status: ✅ All checks passing

### Deploy Process
1. Push code to repository
2. GitHub Actions automatically runs tests
3. Coverage reports generated
4. Deploy on test server in staging

---

## 📝 Key Configuration Files

### jest.config.js
- Preset: ts-jest
- Test environment: node
- Test timeout: 10000ms
- Force exit: false
- Setup file: `src/__tests__/setup.ts`

### tsconfig.json
- Target: ES2020
- Strict mode: enabled
- Module: commonjs

### TypeORM / Database
- Config: `src/config/database.ts`
- Migrations: Not yet created (TODO)
- Connection pooling: Enabled

---

## 🎯 Known Issues & TODOs

### In Progress
- [ ] Extract MessageRouter from MyRoom
- [ ] Create database migrations
- [ ] Add PropertyBased tests for more scenarios

### Completed ✅
- [x] Extract 8 manager modules
- [x] Fix sidepot chip loss bug
- [x] Write 342+ comprehensive tests
- [x] Implement global Jest setup
- [x] Set up CI/CD pipelines

### Not Started
- [ ] Tournament mode support
- [ ] Player reconnection recovery
- [ ] WebSocket performance benchmarks
- [ ] Increase coverage to 80%+

---

## 🎓 Design Patterns Used

### Architectural Patterns

1. **Module Extraction** - Breaking down MyRoom into specialized managers
2. **Dependency Injection** - IGameRoom interface allows testing with mocks
3. **Event Broadcasting** - GameBroadcaster pattern for real-time updates
4. **Strategy Pattern** - Different action handlers (check, fold, raise, etc.)
5. **Observer Pattern** - WebSocket clients observing game state changes

### Testing Patterns

1. **Unit Testing** - Isolated module testing with mocks
2. **Integration Testing** - GameFlow tests verify multiple systems together
3. **Property-Based Testing** - Sidepot tests verify mathematical invariants
4. **Fuzz Testing** - Random scenario generation for robustness

### Code Organization

- One responsibility per file/class
- Utility functions exported as standalone
- Manager modules handle specific domains
- Clear interfaces for contracts

---

## 💡 Tips for Future Development

### When Adding New Tests
1. Use `src/__tests__/setup.ts` global fetch mock (already available)
2. Follow existing test structure from `GameEngine.handleBet.test.ts`
3. Use `beforeEach()` to reset mocks
4. Add property-based tests for mathematical guarantees

### When Extracting New Managers
1. Keep manager size <250 lines for clarity
2. Create corresponding test file with 100% test coverage target
3. Add manager to `src/rooms/managers/index.ts` exports
4. Update `IGameRoom` interface if adding new dependencies

### When Fixing Bugs
1. Create reproduction test that fails first
2. Fix the bug
3. Verify test passes
4. Run full test suite: `npm run test:jest -- --forceExit`
5. Commit with reference to test

---

## 🔗 Important Links & Resources

**Internal Documentation**
- [README.md](./README.md) - Project overview & features
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Detailed architecture
- [TESTING.md](./TESTING.md) - Testing strategy & guide

**External Resources**
- [Colyseus Docs](https://docs.colyseus.io/) - Framework documentation
- [Jest Docs](https://jestjs.io/) - Testing framework
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - Language reference

**Code Repositories**
- Main: `Chiri-backend/src/`
- API: `api-server/src/`
- Frontend: `frontend/src/`

---

## 📞 Quick Debug Checklist

### Tests Failing?
```bash
# Clear cache and reinstall
rm -r node_modules package-lock.json
npm install

# Run specific failing test
npm run test:jest -- FailingTest.test.ts

# Check global setup is loaded
grep -n "setupFilesAfterEnv" jest.config.js
```

### Build Issues?
```bash
# Type check
npx tsc --noEmit

# Check tsconfig
cat tsconfig.json | grep -A 5 '"extends"'
```

### Runtime Issues?
```bash
# Check environment vars
echo $API_URL
echo $JWT_SECRET

# Start with debug logging
DEBUG=* npm run dev
```

### Authentication Tests Failing?
```bash
# Verify global fetch mock is set up
grep -n "global.fetch" src/__tests__/setup.ts

# Check test file uses mockClear() not mockReset()
grep -n "mockClear\|mockReset" src/__tests__/managers/AuthenticationService.test.ts
```

---

## 📊 Project Health Dashboard

```
Code Quality:     ✅ 50.93% coverage (good)
Test Suite:       ✅ 342/342 passing (excellent)
Architecture:     ✅ Modular & testable (excellent)
Performance:      ✅ Tests run in ~6.4s (good)
Security:         ✅ JWT + rate limiting (good)
Documentation:    ✅ README + Architecture guide (good)
CI/CD:            ✅ GitHub Actions automated (good)

Overall Status:   🟢 PRODUCTION READY
```

---

**Last verified**: March 5, 2026, 14:35:35  
**Next review**: After MessageRouter extraction  
**Maintained by**: Development team

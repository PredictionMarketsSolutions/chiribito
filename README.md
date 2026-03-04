# Chiri Backend - Poker Game Server

A modular, well-tested Texas Hold'em poker game server built with Colyseus and TypeScript.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start API server
npm run dev:api

# Run tests
npm run test:jest

# Run tests with coverage
npm run test:jest:coverage
```

## ✨ Recent Refactoring (March 2026)

The GameEngine has been completely refactored from a monolithic 774-line file into a modular, testable architecture:

✅ **6 specialized utility modules** with clear separation of concerns  
✅ **33 comprehensive tests** (100% passing)  
✅ **50%+ test coverage** on GameEngine  
✅ **CI/CD pipelines** with automated testing and coverage reporting  
✅ **IGameRoom interface** for dependency injection and better testability  
✅ **Performance optimizations** (O(n²) → O(k) for player iteration)  
✅ **Comprehensive documentation** with architecture diagrams  

[📖 Read Full Architecture Documentation](./docs/ARCHITECTURE.md)

## 🏗️ Architecture Overview

```
MyRoom (Colyseus Room)
  ↓
GameEngine (Orchestrator)
  ├─→ CardEvaluator      (Hand evaluation)
  ├─→ GameBroadcaster    (Event broadcasting)
  ├─→ GameUtils          (Player management)
  ├─→ RoundManager       (Round progression)
  ├─→ WinnerDeterminator (Pot distribution)
  └─→ PlayerActions      (Check/fold handlers)
```

### Key Modules

| Module | Size | Responsibility |
|--------|------|----------------|
| **GameEngine** | ~250 lines | Main orchestrator, delegates to modules |
| **CardEvaluator** | ~170 lines | Pure poker hand evaluation logic |
| **GameBroadcaster** | ~50 lines | Centralized event broadcasting |
| **GameUtils** | ~120 lines | Player management utilities (O(k) optimized) |
| **RoundManager** | ~90 lines | Round & betting management |
| **WinnerDeterminator** | ~140 lines | Winner calculation & sidepot logic |
| **PlayerActions** | ~80 lines | Check/fold action handlers |

## 🧪 Testing

**Framework**: Jest with ts-jest  
**Current Coverage**: 50.93% lines, 44.64% branches (GameEngine)  
**Tests**: 33 tests covering `handleBet()` method and helpers

```bash
# Run all tests
npm run test:jest

# Run with coverage
npm run test:jest:coverage
```

[📖 Read Testing Guide](./TESTING.md)

## 📊 CI/CD

### GitHub Actions Workflows

**test-coverage.yml**: Automated testing & coverage  
**build.yml**: Build validation

## 🎮 Game Features

- ✅ Texas Hold'em poker rules
- ✅ Multi-player support (2-6 players)
- ✅ Blinds and betting rounds
- ✅ All-in and sidepot calculations
- ✅ Fold/check/call/raise/all-in actions
- ✅ Automatic winner determination
- ✅ JWT authentication
- ✅ Real-time updates via WebSockets

## 🔧 Tech Stack

**Backend**: Colyseus 0.16, TypeScript, Node.js, Express  
**Testing**: Jest, ts-jest, Codecov  
**Database**: TypeORM, PostgreSQL, Redis  

## 📁 Project Structure

```
Chiri-backend/
├── src/
│   ├── rooms/
│   │   ├── MyRoom.ts           # Main Colyseus room
│   │   ├── game/
│   │   │   ├── GameEngine.ts   # Orchestrator (~250 lines)
│   │   │   └── utils/          # Specialized modules
│   │   └── schema/
│   ├── types/
│   │   └── IGameRoom.ts        # Room interface
│   └── __tests__/              # Jest tests
├── api-server/                 # Express API server
├── frontend/                   # Frontend client
├── docs/
│   └── ARCHITECTURE.md         # Detailed architecture
├── .github/workflows/          # CI/CD pipelines
├── jest.config.js
└── TESTING.md
```

## 📖 Documentation

- [Architecture Guide](./docs/ARCHITECTURE.md) - Detailed architecture and design principles
- [Testing Guide](./TESTING.md) - Testing strategy and running tests
- [Colyseus Documentation](https://docs.colyseus.io/) - Official Colyseus docs

## 🛡️ Security Features

- JWT-based authentication
- Rate limiting per client
- Action cooldowns
- Game audit logging
- Anti-cheat validation

## 🔮 Next Steps

- [ ] Add tests for utility modules (CardEvaluator, WinnerDeterminator, etc.)
- [ ] Refactor MyRoom.ts using similar modular approach
- [ ] Increase test coverage to 80%+
- [ ] Add TSDoc comments to all public APIs

## 📄 License

UNLICENSED - Private project

---

**Version**: 0.16.0  
**Node**: 18.x, 20.x  
**Colyseus**: 0.16.x

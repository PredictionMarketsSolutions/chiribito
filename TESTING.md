# GameEngine Refactoring & Testing Documentation

## Architecture

### Módulos Especializados

#### 1. **CardEvaluator.ts** (~170 líneas)
- Evaluación pura de manos de poker
- Funciones para parsear cartas, determinar combinaciones
- Sin efectos secundarios
- Exporta: `parseCard`, `isPerla`, `evaluateHand`, `isStraight`, `compareHands`, `getHandName`

#### 2. **GameBroadcaster.ts** (~50 líneas)
- Abstracción para broadcasts de eventos del juego
- Métodos: `broadcastBettingRoundStarted`, `broadcastPlayerAction`, `broadcastRoundEnded`, `broadcastTurnTimer`

#### 3. **GameUtils.ts** (~120 líneas)
- Utilidades generales del juego
- Métodos: `getPlayerName`, `getPlayersWithChips`, `getPlayersInHandNonFolded`, `getNextActiveIndexFrom`, etc.
- Optimizado: `getNextActiveIndexFrom` usa caching para O(k) en lugar de O(n²)

#### 4. **RoundManager.ts** (~90 líneas)
- Gestión de rondas y bettings
- Reset de mano, reset de apuestas, manejo de community cards
- Métodos: `resetForNewHand`, `resetBetsForRound`, `dealNextCommunityCard`, `startBettingRound`, `dealInitialHands`

#### 5. **WinnerDeterminator.ts** (~140 líneas)
- Determinación de ganadores y cálculo de payouts
- Soporte para side pots
- Métodos: `determineWinners`, `calculateSidePotPayouts`, `logRoundEnd`

#### 6. **PlayerActions.ts** (~80 líneas)
- Acciones de jugadores (check, fold, fold por timeout)
- Validación y logging integrados
- Métodos: `handleCheck`, `handleFold`, `handleFoldForTimeout`

#### 7. **GameEngine.ts** (~250 líneas)
- Orquestador principal. Mantiene interfaz pública
- Público: `handleBet`, `handleCall`, `handleCheck`, `handleAllIn`, `handleRaise`, `handleFold`, `startNewHand`, `proceedToNextPhase`, `endTurn`
- Privado: Métodos helper para validación y cálculo de apuestas (refactorizados de método anterior)

## Testing

### Coverage Targets

```json
{
  "global": {
    "branches": 75,
    "functions": 80,
    "lines": 80,
    "statements": 80
  },
  "src/rooms/game/": {
    "branches": 80,
    "functions": 85,
    "lines": 85,
    "statements": 85
  }
}
```

### Test File Structure

- **Location**: `src/__tests__/GameEngine.handleBet.test.ts`
- **Total Tests**: 33 (all passing ✅)
- **Sections**:
  - Integration tests (13 tests): Comportamiento de handleBet end-to-end
  - _validateBetAction (6 tests): Validación de apuestas
  - _calculateBetAmounts (5 tests): Cálculo de montos
  - _updateGameState (6 tests): Actualización de estado
  - _broadcastAndEndTurn (3 tests): Broadcasting

### Running Tests

```bash
# Run all tests
npm run test:jest

# Watch mode
npm run test:jest:watch

# With coverage report
npm run test:jest:coverage

# Specific test file
npm run test:jest -- --testNamePattern="GameEngine"
```

## CI/CD Workflows

### GitHub Actions

Dos workflows configurados:

#### 1. **test-coverage.yml**
Ejecuta en cada push/PR:
- Instala dependencias
- TypeScript type check
- Jest tests with coverage
- Sube reportes a Codecov
- Comenta en PRs con métricas de coverage

#### 2. **build.yml**  
Ejecuta en cada push/PR:
- Type check
- Build del proyecto
- Lint checks (si está configurado ESLint)

### Local Pre-commit

```bash
npm run test:jest:coverage  # Verifica 80%+ antes de push
```

## Current Status

### Refactoring ✅
- [x] GameEngine dividido en 7 módulos
- [x] Métodos largo (60+ líneas) decomposed
- [x] Sin lógica duplicada
- [x] Clear separation of concerns
- [x] Type-safe interfaces

### Testing ✅
- [x] 33 tests escritos
- [x] 100% tests pasando
- [x] Cobertura de validation, calculation, state, broadcasting
- [x] Coverage thresholds configurados

### CI/CD ✅
- [x] GitHub Actions workflows
- [x] Codecov integration
- [x] PR comments con coverage
- [x] Build validation

## Next Steps

1. **Agregar tests para otros módulos**
   - CardEvaluator.ts (poker hand evaluation)
   - WinnerDeterminator.ts (payout calculation)
   - RoundManager.ts (round progression)
   - PlayerActions.ts (action handling)

2. **Extender a todo el proyecto**
   - Aplicar mismo patrón a otros archivos
   - MyRoom.ts refactoring
   - Schema validations

3. **Coverage improvement**
   - Target 85%+ en GameEngine
   - Agregar edge cases
   - Integration tests

4. **Monitoring**
   - Codecov badges en README
   - Coverage trend tracking
   - Alertas en regresión

## File Statistics

| Module | Lines | Purpose |
|--------|-------|---------|
| GameEngine.ts | ~250 | Main orchestrator |
| CardEvaluator.ts | ~170 | Poker hand evaluation |
| WinnerDeterminator.ts | ~140 | Winner & payout logic |
| GameUtils.ts | ~120 | Utility functions |
| RoundManager.ts | ~90 | Round management |
| PlayerActions.ts | ~80 | Player action handling |
| GameBroadcaster.ts | ~50 | Event broadcasting |
| **Total** | **~900** | (was 967 before refactor) |

## Performance Improvements

- **getNextActiveIndexFrom()**: O(n) instead of O(n²) for active player iteration
- **Round determination**: Lazy evaluation of showdown conditions
- **Side pot calculation**: Only computed once per round end

---

**Last Updated**: March 4, 2026
**Version**: 0.16.0+refactor

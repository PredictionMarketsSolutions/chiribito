# Protección de ramas (Branch protection)

Las reglas de protección de ramas se configuran en GitHub, no en el repositorio. Sigue estos pasos para que los merges a `main` y `develop` exijan que el CI pase.

## Dónde configurarlo

1. En el repositorio de GitHub: **Settings** → **Branches** (o **Code and automation** → **Branches** en la nueva UI).
2. En **Branch protection rules**, haz clic en **Add rule** (o **Add branch protection rule**).

## Regla para `main`

- **Branch name pattern:** `main`
- **Require a pull request before merging**
  - Opcional: **Require approvals** (por ejemplo 1).
- **Require status checks to pass before merging** ✓
  - **Require branches to be up to date before merging** (recomendado).
  - En **Status checks that are required**, busca y marca los que quieras obligatorios. Los nombres deben coincidir con los **jobs** de los workflows:
    - `Build` (del workflow "Build and Lint")
    - `Backend tests` (del workflow "Test and Coverage")
    - `Frontend tests`
    - `API server tests`
  - Si no aparecen, haz al menos un push/PR que ejecute los workflows; después saldrán en el desplegable.
- **Do not allow bypassing the above settings** (opcional; evita que admins mergen sin checks).
- Guarda con **Create** o **Save changes**.

## Regla para `develop`

Repite la misma regla con **Branch name pattern:** `develop` y las mismas opciones, si quieres que `develop` también exija CI.

## Status checks recomendados

| Status check       | Workflow            | Descripción                |
|--------------------|---------------------|----------------------------|
| `Build`            | Build and Lint      | Type check, lint, build    |
| `Backend tests`    | Test and Coverage   | Jest backend + cobertura   |
| `Frontend tests`   | Test and Coverage   | Vitest frontend            |
| `API server tests` | Test and Coverage   | Jest api-server            |

Así, ningún PR podrá hacerse merge hasta que pasen el build (incluido lint) y todos los tests.

## Notas

- Si usas solo `main` como rama principal, basta con una regla para `main`.
- **Require branches to be up to date** hace que, si `main` avanza, el PR deba actualizarse y volver a pasar el CI antes de mergear.

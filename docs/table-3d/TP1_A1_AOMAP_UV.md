# TP1 Assumption A1 Resolution — aoMap UV Channel (three.js 0.169)

**Resolved:** 2026-06-10  
**Plan:** 02-01 Task 1  
**Decision applies to:** 02-02 (feltEdgeAoMap wiring), 02-03 (material assembly)

---

## Question

Does `aoMap` in three.js 0.169 require a dedicated `uv2` attribute on the
geometry, or does it read from the standard `uv` attribute (channel 0)?
(`PlaneGeometry` only emits a single UV set — the `uv` attribute.)

---

## Source Evidence

### File 1: `frontend/node_modules/three/src/renderers/shaders/ShaderChunk/uv_vertex.glsl.js`

```glsl
// Lines relevant to aoMap (full block):
#ifdef USE_AOMAP
    vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
```

The UV source is the preprocessor define `AOMAP_UV`, not a hardcoded `uv2`.

### File 2: `frontend/node_modules/three/src/renderers/webgl/WebGLPrograms.js`

```javascript
// Line 262 — how aoMapUv is computed:
aoMapUv: HAS_AOMAP && getChannel( material.aoMap.channel ),

// Lines 40-49 — getChannel function:
function getChannel( value ) {
    _activeChannels.add( value );
    if ( value === 0 ) return 'uv';
    return `uv${ value }`;
}
```

So `AOMAP_UV` resolves to `getChannel(material.aoMap.channel)`.

### File 3: `frontend/node_modules/three/src/textures/Texture.js`

```javascript
// Line 38 — Texture channel default:
this.channel = 0;
```

All textures default to `channel = 0`.

---

## Resolution Chain

1. A new `CanvasTexture` (returned by `feltEdgeAoMap()`) has `channel = 0` (the default).
2. `WebGLPrograms.getParameters` computes `aoMapUv = getChannel(0)` → `'uv'`.
3. `WebGLProgram` emits `#define AOMAP_UV uv` into the vertex shader.
4. The vertex shader assigns `vAoMapUv = (aoMapTransform * vec3(uv, 1)).xy` — **the standard first UV set**.
5. `PlaneGeometry(FELT_R*2, FELT_R*2, 1, 1)` already provides the `uv` attribute.

**No `uv2` attribute is needed. No `geometry.setAttribute('uv2', ...)` is required.**

The old assumption that `aoMap` requires `uv2` was based on three.js ≤ r152 behaviour.
In r169 each map has an independent `channel` property (defaulting to 0 = `uv`), so
every map reads UV channel 0 unless explicitly changed by setting `texture.channel = 1`
(which corresponds to the `uv1` / legacy `uv2` attribute).

---

## DECISION — A1-uv1

> **aoMap reads the standard `uv` attribute (channel 0) in three.js 0.169.**  
> Wire `aoMap` and `aoMapIntensity` directly. No `uv2` attribute injection needed.  
> `PlaneGeometry`'s existing `uv` attribute is sufficient.

### Downstream action for 02-02 / 02-03

```typescript
// In TableLab.tsx felt material (02-03):
const feltMat = new THREE.MeshPhysicalMaterial({
  // ...
  aoMap: feltEdgeAoMap(),   // uses channel=0 (uv) — no geometry change needed
  aoMapIntensity: 0.18,
  // ...
});
// NO geometry ref callback needed — PlaneGeometry uv is already present.
```

```typescript
// In textures.ts feltEdgeAoMap() (02-02):
// Return gray(c) — the CanvasTexture will have channel=0 by default.
// Do NOT set texture.channel — leave at default 0.
```

### Alternative branch (NOT chosen)

**A1-uv2** would be chosen if `material.aoMap.channel` were set to 1, in which case the
geometry would need `geometry.setAttribute('uv2', geometry.getAttribute('uv'))` via a JSX
ref. This is unnecessary — the default channel is 0.

**A1-albedo-fallback** (bake subtle darkening into the albedo at low opacity) is also
unnecessary since the `uv` channel path works out of the box.

---

## Verification Path

After 02-02 / 02-03 implement `feltEdgeAoMap()`:

1. Assign `aoMap` to the felt material.
2. Set `aoMapIntensity = 0.18`.
3. Capture HERO + MACRO frames.
4. Confirm a very subtle (not heavy) edge darkening is visible at the felt perimeter —
   absent at center, present (~25% AO) at absolute edge.
5. If no darkening is visible, the fallback is to raise `aoMapIntensity` to 0.25 (D-03
   limit) or switch to A1-albedo-fallback.

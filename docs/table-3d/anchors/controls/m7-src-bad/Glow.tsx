// M7 BAD control: a synthetic bloom mount the code-assert MUST catch.
import { EffectComposer, Bloom } from "@react-three/postprocessing";
export function Glow() {
  return (
    <EffectComposer>
      <Bloom intensity={2} luminanceThreshold={0.2} />
    </EffectComposer>
  );
}

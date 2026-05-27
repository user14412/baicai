import { useEffect, useRef } from "react";
import {
  AmbientLight,
  Box3,
  Color,
  DirectionalLight,
  Group,
  MathUtils,
  PerspectiveCamera,
  Scene,
  SkinnedMesh,
  Vector3,
  WebGLRenderer,
} from "three";
import { MMDLoader } from "three-stdlib";
import type { PetState } from "../lib/types";

type MmdPetModelProps = {
  petState: PetState;
};

const MODEL_PATH =
  "/眞白花音偶像服Q版MMD模型/眞白花音_增加腕部骨骼限制.pmx";

const IGNORED_MMD_WARNINGS = [
  "THREE.Material: 'combine' is not a property of THREE.MeshToonMaterial.",
  "THREE.Material: 'envMap' is not a property of THREE.MeshToonMaterial.",
  "THREE.Material: 'morphTargets' is not a property of THREE.MeshToonMaterial.",
  "THREE.Material: 'skinning' is not a property of THREE.MeshToonMaterial.",
];

export function MmdPetModel({ petState }: MmdPetModelProps) {
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const stateRef = useRef(petState);

  useEffect(() => {
    stateRef.current = petState;
  }, [petState]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let animationFrame = 0;
    let isDisposed = false;
    let mesh: SkinnedMesh | null = null;

    const scene = new Scene();
    scene.background = null;

    const camera = new PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0.15, 4.8);
    camera.lookAt(0, 0.05, 0);

    const modelRoot = new Group();
    scene.add(modelRoot);

    const renderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setClearAlpha(0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = "srgb";
    container.appendChild(renderer.domElement);

    const ambient = new AmbientLight(new Color("#ffffff"), 1.25);
    const keyLight = new DirectionalLight(new Color("#fff8ee"), 0.72);
    keyLight.position.set(2.5, 4, 4);
    const fillLight = new DirectionalLight(new Color("#ffe4f2"), 0.46);
    fillLight.position.set(-3, 2, 3);
    scene.add(ambient, keyLight, fillLight);

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      const nextWidth = Math.max(1, Math.floor(width));
      const nextHeight = Math.max(1, Math.floor(height));

      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight, false);
    };

    const loader = new MMDLoader();
    const restoreConsoleWarn = silenceMmdCompatibilityWarnings();

    loader.load(
      MODEL_PATH,
      (loadedMesh) => {
        if (isDisposed) {
          return;
        }

        mesh = loadedMesh;

        const box = new Box3().setFromObject(mesh);
        const center = box.getCenter(new Vector3());
        const size = box.getSize(new Vector3());
        const scale = size.y > 0 ? 2.55 / size.y : 1;

        mesh.scale.setScalar(scale);
        mesh.position.set(
          -center.x * scale,
          -center.y * scale,
          -center.z * scale,
        );
        container.dataset.loadState = "loaded";
        container.dataset.modelHeight = size.y.toFixed(2);
        container.dataset.modelScale = scale.toFixed(4);
        modelRoot.add(mesh);
        restoreConsoleWarn();
      },
      undefined,
      (error: ErrorEvent) => {
        restoreConsoleWarn();
        console.error("Failed to load MMD pet model", error);
        container.dataset.loadState = "error";
      },
    );

    const startedAt = performance.now();
    const animate = () => {
      const elapsed = (performance.now() - startedAt) / 1000;
      const currentState = stateRef.current;

      const bob =
        currentState === "sleeping" ? 0 : Math.sin(elapsed * 2.4) * 0.035;
      const hop =
        currentState === "happy" ? Math.abs(Math.sin(elapsed * 7)) * 0.13 : 0;
      const talkScale =
        currentState === "talking" ? 1 + Math.sin(elapsed * 12) * 0.018 : 1;
      const thinkTurn =
        currentState === "thinking" ? Math.sin(elapsed * 3) * 0.05 : 0;
      const sleepTilt =
        currentState === "sleeping" ? MathUtils.degToRad(-7) : 0;

      modelRoot.position.y = -0.25 + bob + hop;
      modelRoot.rotation.z = sleepTilt;
      modelRoot.rotation.y = thinkTurn;
      modelRoot.scale.set(talkScale, 1 / talkScale, talkScale);

      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(animate);
    };

    resize();
    animate();

    const observer = new ResizeObserver(resize);
    observer.observe(container);

    return () => {
      isDisposed = true;
      window.cancelAnimationFrame(animationFrame);
      restoreConsoleWarn();
      observer.disconnect();
      renderer.dispose();
      renderer.domElement.remove();
      mesh?.geometry.dispose();
      modelRoot.clear();
    };
  }, []);

  return <span ref={containerRef} className="pet-model" aria-hidden="true" />;
}

function silenceMmdCompatibilityWarnings() {
  const originalWarn = console.warn;
  let isRestored = false;

  console.warn = (...args: unknown[]) => {
    const [message] = args;
    if (
      typeof message === "string" &&
      IGNORED_MMD_WARNINGS.some((warning) => message.includes(warning))
    ) {
      return;
    }

    originalWarn(...args);
  };

  return () => {
    if (isRestored) {
      return;
    }

    console.warn = originalWarn;
    isRestored = true;
  };
}

import { useEffect, useRef } from "react";
import {
  AmbientLight,
  Box3,
  Color,
  DirectionalLight,
  Group,
  MathUtils,
  Mesh,
  PerspectiveCamera,
  Scene,
  SkinnedMesh,
  Texture,
  Vector3,
  WebGLRenderer,
} from "three";
import { MMDAnimationHelper, MMDLoader } from "three-stdlib";
import {
  MMD_PET_BASE_POSITION_Y,
  MMD_PET_CAMERA,
  MMD_PET_LIGHTS,
  MMD_PET_MODEL_HEIGHT,
  MMD_PET_MODEL_PATH,
  MMD_PET_POSE_PATHS,
  MMD_PET_RENDERING,
} from "../lib/mmdPetConfig";
import type { PetState } from "../lib/types";

type MmdPetModelProps = {
  petState: PetState;
};

const IGNORED_MMD_WARNINGS = [
  "THREE.Material: 'combine' is not a property of THREE.MeshToonMaterial.",
  "THREE.Material: 'envMap' is not a property of THREE.MeshToonMaterial.",
  "THREE.Material: 'morphTargets' is not a property of THREE.MeshToonMaterial.",
  "THREE.Material: 'skinning' is not a property of THREE.MeshToonMaterial.",
];

type MmdMotionFrame = {
  rootY: number;
  rotationY: number;
  rotationZ: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
};

const DEFAULT_MMD_MOTION: MmdMotionFrame = {
  rootY: MMD_PET_BASE_POSITION_Y,
  rotationY: 0,
  rotationZ: 0,
  scaleX: 1,
  scaleY: 1,
  scaleZ: 1,
};

const BLINK_MORPH_NAME = "まばたき";
const BLINK_INTERVAL_SECONDS = 3.6;
const BLINK_DURATION_SECONDS = 0.16;

type MmdVpdPose = object;

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

    const camera = new PerspectiveCamera(
      MMD_PET_CAMERA.fov,
      1,
      MMD_PET_CAMERA.near,
      MMD_PET_CAMERA.far,
    );
    camera.position.set(
      MMD_PET_CAMERA.position.x,
      MMD_PET_CAMERA.position.y,
      MMD_PET_CAMERA.position.z,
    );
    camera.lookAt(
      MMD_PET_CAMERA.lookAt.x,
      MMD_PET_CAMERA.lookAt.y,
      MMD_PET_CAMERA.lookAt.z,
    );

    const modelRoot = new Group();
    scene.add(modelRoot);

    const renderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setClearAlpha(0);
    renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio * MMD_PET_RENDERING.pixelRatioMultiplier,
        MMD_PET_RENDERING.maxPixelRatio,
      ),
    );
    renderer.outputColorSpace = "srgb";
    container.appendChild(renderer.domElement);

    const ambient = new AmbientLight(
      new Color(MMD_PET_LIGHTS.ambient.color),
      MMD_PET_LIGHTS.ambient.intensity,
    );
    const keyLight = new DirectionalLight(
      new Color(MMD_PET_LIGHTS.key.color),
      MMD_PET_LIGHTS.key.intensity,
    );
    keyLight.position.set(
      MMD_PET_LIGHTS.key.position.x,
      MMD_PET_LIGHTS.key.position.y,
      MMD_PET_LIGHTS.key.position.z,
    );
    const fillLight = new DirectionalLight(
      new Color(MMD_PET_LIGHTS.fill.color),
      MMD_PET_LIGHTS.fill.intensity,
    );
    fillLight.position.set(
      MMD_PET_LIGHTS.fill.position.x,
      MMD_PET_LIGHTS.fill.position.y,
      MMD_PET_LIGHTS.fill.position.z,
    );
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
    const poseHelper = new MMDAnimationHelper();
    const poseCache = new Map<string, MmdVpdPose | null>();
    const poseRequests = new Map<string, Promise<MmdVpdPose | null>>();
    let appliedPosePath: string | null = null;
    const restoreConsoleWarn = silenceMmdCompatibilityWarnings();

    const loadPose = (path: string) => {
      if (poseCache.has(path)) {
        return Promise.resolve(poseCache.get(path) ?? null);
      }

      const existingRequest = poseRequests.get(path);
      if (existingRequest) {
        return existingRequest;
      }

      const request = loadVpdPose(loader, path)
        .then((pose) => {
          poseCache.set(path, pose);
          return pose;
        })
        .finally(() => {
          poseRequests.delete(path);
        });

      poseRequests.set(path, request);
      return request;
    };

    const applyPoseForState = (targetMesh: SkinnedMesh, nextState: PetState) => {
      const posePath = getPosePathForState(nextState);
      const pose = poseCache.get(posePath);

      if (pose) {
        if (appliedPosePath !== posePath) {
          poseHelper.pose(targetMesh, pose, {
            resetPose: true,
            ik: true,
            grant: true,
          });
          appliedPosePath = posePath;
          console.info(`[baicai] Applied MMD VPD pose: ${posePath}`);
        }
        return;
      }

      if (!poseCache.has(posePath)) {
        void loadPose(posePath);
      }

      const idlePosePath = MMD_PET_POSE_PATHS.idle;
      if (posePath === idlePosePath) {
        return;
      }

      const idlePose = poseCache.get(idlePosePath);
      if (idlePose) {
        if (appliedPosePath !== idlePosePath) {
          poseHelper.pose(targetMesh, idlePose, {
            resetPose: true,
            ik: true,
            grant: true,
          });
          appliedPosePath = idlePosePath;
          console.info(
            `[baicai] Applied fallback MMD VPD pose: ${idlePosePath}`,
          );
        }
        return;
      }

      if (!poseCache.has(idlePosePath)) {
        void loadPose(idlePosePath);
      }
    };

    loader.load(
      MMD_PET_MODEL_PATH,
      (loadedMesh) => {
        if (isDisposed) {
          return;
        }

        mesh = loadedMesh;
        logMmdDebugInfo(mesh);
        sharpenMmdTextures(mesh, renderer);
        void loadPose(MMD_PET_POSE_PATHS.idle);

        const box = new Box3().setFromObject(mesh);
        const center = box.getCenter(new Vector3());
        const size = box.getSize(new Vector3());
        const scale = size.y > 0 ? MMD_PET_MODEL_HEIGHT / size.y : 1;

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
      const motion = getMmdMotionFrame(currentState, elapsed);

      modelRoot.position.y = motion.rootY;
      modelRoot.rotation.y = motion.rotationY;
      modelRoot.rotation.z = motion.rotationZ;
      modelRoot.scale.set(motion.scaleX, motion.scaleY, motion.scaleZ);

      if (mesh) {
        applyPoseForState(mesh, currentState);
        applyBlink(mesh, elapsed);
      }

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

  return (
    <span ref={containerRef} className="pet-model" aria-hidden="true">
      {petState === "thinking" ? (
        <span className="mmd-status-cue mmd-status-cue-thinking">
          <span />
          <span />
          <span />
        </span>
      ) : null}
      {petState === "sleeping" ? (
        <span className="mmd-status-cue mmd-status-cue-sleep">Zzz</span>
      ) : null}
    </span>
  );
}

function getPosePathForState(petState: PetState) {
  return MMD_PET_POSE_PATHS[petState] ?? MMD_PET_POSE_PATHS.idle;
}

function loadVpdPose(
  loader: MMDLoader,
  path: string,
): Promise<MmdVpdPose | null> {
  return new Promise((resolve) => {
    loader.loadVPD(
      path,
      false,
      (pose) => {
        console.info(`[baicai] Loaded MMD VPD pose: ${path}`);
        resolve(pose);
      },
      undefined,
      (error) => {
        console.warn(`[baicai] Failed to load MMD VPD pose: ${path}`, error);
        resolve(null);
      },
    );
  });
}

function logMmdDebugInfo(mesh: SkinnedMesh) {
  if (!import.meta.env.DEV) {
    return;
  }

  const boneNames = mesh.skeleton.bones.map((bone) => bone.name);

  console.groupCollapsed("[baicai] MMD model debug info");
  console.log("PMX bone names:", boneNames);
  console.log("PMX morphTargetDictionary:", mesh.morphTargetDictionary ?? {});
  console.groupEnd();
}

function applyBlink(mesh: SkinnedMesh, elapsed: number) {
  const blinkIndex = mesh.morphTargetDictionary?.[BLINK_MORPH_NAME];
  const influences = mesh.morphTargetInfluences;

  if (blinkIndex === undefined || !influences) {
    return;
  }

  const phase = elapsed % BLINK_INTERVAL_SECONDS;
  const blinkAmount =
    phase <= BLINK_DURATION_SECONDS
      ? Math.sin((phase / BLINK_DURATION_SECONDS) * Math.PI)
      : 0;

  influences[blinkIndex] = blinkAmount;
}

function getMmdMotionFrame(petState: PetState, elapsed: number): MmdMotionFrame {
  const idleBob = Math.sin(elapsed * 2.4) * 0.025;

  switch (petState) {
    case "thinking":
      return {
        ...DEFAULT_MMD_MOTION,
        rootY: DEFAULT_MMD_MOTION.rootY + idleBob * 0.4,
        rotationY: Math.sin(elapsed * 2.8) * 0.16,
        rotationZ: Math.sin(elapsed * 2.8) * 0.035,
      };
    case "talking": {
      const talkPulse = 1 + Math.sin(elapsed * 12) * 0.026;
      return {
        ...DEFAULT_MMD_MOTION,
        rootY: DEFAULT_MMD_MOTION.rootY + idleBob,
        scaleX: talkPulse,
        scaleY: 1 / talkPulse,
        scaleZ: talkPulse,
      };
    }
    case "happy":
      return {
        ...DEFAULT_MMD_MOTION,
        rootY:
          DEFAULT_MMD_MOTION.rootY +
          idleBob +
          Math.abs(Math.sin(elapsed * 7)) * 0.16,
        rotationY: Math.sin(elapsed * 8) * 0.08,
        rotationZ: Math.sin(elapsed * 8) * 0.035,
      };
    case "sleeping":
      return {
        ...DEFAULT_MMD_MOTION,
        rotationZ: MathUtils.degToRad(-7),
      };
    case "idle":
    default:
      return {
        ...DEFAULT_MMD_MOTION,
        rootY: DEFAULT_MMD_MOTION.rootY + idleBob,
      };
  }
}

function sharpenMmdTextures(mesh: SkinnedMesh, renderer: WebGLRenderer) {
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  const anisotropy = Math.min(
    MMD_PET_RENDERING.textureAnisotropy,
    maxAnisotropy,
  );

  mesh.traverse((object) => {
    if (!(object instanceof Mesh)) {
      return;
    }

    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];

    materials.forEach((material) => {
      for (const textureKey of ["map", "emissiveMap", "normalMap", "alphaMap"]) {
        const texture = material[textureKey as keyof typeof material];
        if (texture instanceof Texture) {
          texture.anisotropy = anisotropy;
          if (texture.image) {
            texture.needsUpdate = true;
          }
        }
      }
    });
  });
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

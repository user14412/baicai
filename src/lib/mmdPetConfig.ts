export const MMD_PET_MODEL_PATH =
  "/眞白花音偶像服Q版MMD模型/眞白花音_增加腕部骨骼限制.pmx";

export const MMD_PET_CAMERA = {
  fov: 30,
  near: 0.1,
  far: 100,
  position: {
    x: 0,
    y: 0.15,
    z: 6.2,
  },
  lookAt: {
    x: 0,
    y: 0.05,
    z: 0,
  },
} as const;

export const MMD_PET_MODEL_HEIGHT = 2.55;

export const MMD_PET_BASE_POSITION_Y = -0.25;

export const MMD_PET_RENDERING = {
  pixelRatioMultiplier: 1.75,
  maxPixelRatio: 3,
  textureAnisotropy: 8,
} as const;

export const MMD_PET_POSE_PATHS = {
  idle: "/poses/kanon_idle.vpd",
  thinking: "/poses/thinking.vpd",
  talking: "/poses/kanon_idle.vpd",
  happy: "/poses/happy.vpd",
  sleeping: "/poses/sleeping.vpd",
} as const;

export const MMD_PET_LIGHTS = {
  ambient: {
    color: "#ffffff",
    intensity: 0.62,
  },
  key: {
    color: "#fff8ee",
    intensity: 0.72,
    position: {
      x: 2.5,
      y: 4,
      z: 4,
    },
  },
  fill: {
    color: "#ffe4f2",
    intensity: 0.46,
    position: {
      x: -3,
      y: 2,
      z: 3,
    },
  },
} as const;

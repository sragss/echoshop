export type ModelCategory = {
  name: string;
  models: Model[];
};

export type Model = {
  id: string;
  name: string;
  provider: string; // Logo provider slug for ModelSelectorLogo
};

export const modelCategories: ModelCategory[] = [
  {
    name: "Image",
    models: [
      { id: "nano-banana", name: "Nano-Banana", provider: "google" },
      { id: "gpt-image-1", name: "GPT-Image-1", provider: "openai" },
    ],
  },
  {
    name: "Video",
    models: [
      { id: "sora-2", name: "Sora 2", provider: "openai" },
      // { id: "veo3", name: "Veo 3", provider: "google" },
    ],
  },
];

// Helper to get all models as a flat array
export const allModels = modelCategories.flatMap((category) => category.models);

// Helper to get model by id
export const getModelById = (id: string) => {
  return allModels.find((model) => model.id === id);
};

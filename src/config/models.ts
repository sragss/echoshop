export type ModelCategory = {
  name: string;
  models: Model[];
};

export type Model = {
  id: string;
  name: string;
};

export const modelCategories: ModelCategory[] = [
  {
    name: "Image",
    models: [
      { id: "nano-banana", name: "Nano-Banana" },
      { id: "gpt-image-1", name: "GPT-Image-1" },
    ],
  },
  {
    name: "Video",
    models: [
      { id: "sora2", name: "Sora2" },
      { id: "veo3", name: "Veo3" },
    ],
  },
];

// Helper to get all models as a flat array
export const allModels = modelCategories.flatMap((category) => category.models);

// Helper to get model by id
export const getModelById = (id: string) => {
  return allModels.find((model) => model.id === id);
};

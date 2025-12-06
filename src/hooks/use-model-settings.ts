import { useState, useEffect } from 'react';
import { type ModelSettings, defaultModelSettings } from '@/lib/model-settings';

const STORAGE_KEY = 'echoshop-model-settings';

export function useModelSettings() {
  const [settings, setSettings] = useState<ModelSettings>(() => {
    // Load from localStorage on mount using lazy initialization
    if (typeof window === 'undefined') {
      return defaultModelSettings;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as ModelSettings;
      }
    } catch (error) {
      console.error('Failed to load model settings from localStorage:', error);
    }
    return defaultModelSettings;
  });

  // Save to localStorage whenever settings change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save model settings to localStorage:', error);
    }
  }, [settings]);

  const updateSettings = <K extends keyof ModelSettings>(
    modelId: K,
    newSettings: Partial<ModelSettings[K]>
  ) => {
    setSettings((prev) => ({
      ...prev,
      [modelId]: {
        ...prev[modelId],
        ...newSettings,
      },
    }));
  };

  return {
    settings,
    updateSettings,
  };
}

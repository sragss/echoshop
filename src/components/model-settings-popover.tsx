"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SettingsIcon } from 'lucide-react';
import type { GptImageSettings, NanoBananaSettings, SoraSettings } from '@/lib/model-settings';

interface ModelSettingsPopoverProps {
  modelId: 'gpt-image-1' | 'nano-banana' | 'sora-2';
  settings: Partial<GptImageSettings> | Partial<NanoBananaSettings> | Partial<SoraSettings>;
  onSettingsChange: (settings: Partial<GptImageSettings> | Partial<NanoBananaSettings> | Partial<SoraSettings>) => void;
  children: React.ReactNode;
}

// Define enum options directly (matching schema definitions in schema.ts)
const gptSizeOptions = ["1024x1024", "1536x1024", "1024x1536", "auto"] as const;
const gptQualityOptions = ["low", "medium", "high", "auto"] as const;
const gptBackgroundOptions = ["transparent", "opaque", "auto"] as const;
const gptFormatOptions = ["png", "jpeg", "webp"] as const;
const gptInputFidelityOptions = ["high", "low"] as const;

const bananAspectRatioOptions = ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"] as const;

const soraSecondsOptions = ['4', '8', '12'] as const;
const soraSizeOptions = ['720x1280', '1280x720'] as const;

// Define defaults (matching schema defaults in schema.ts)
const gptQualityDefault = "auto";
const gptBackgroundDefault = "auto";
const gptFormatDefault = "png";
const gptInputFidelityDefault = "high";

const bananaAspectRatioDefault = "1:1";

const soraSecondsDefault = '4';

function GptImageSettingsContent({
  settings,
  onSettingsChange,
}: {
  settings: Partial<GptImageSettings>;
  onSettingsChange: (settings: Partial<GptImageSettings>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-xs font-medium">Size</label>
        <Select
          value={settings.size ?? 'auto'}
          onValueChange={(value) => onSettingsChange({ ...settings, size: value as GptImageSettings['size'] })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {gptSizeOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt === 'auto' ? 'Auto' : opt.replace('x', '×')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium">Quality</label>
        <Select
          value={settings.quality ?? gptQualityDefault}
          onValueChange={(value) => onSettingsChange({ ...settings, quality: value as GptImageSettings['quality'] })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {gptQualityOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium">Background</label>
        <Select
          value={settings.background ?? gptBackgroundDefault}
          onValueChange={(value) => onSettingsChange({ ...settings, background: value as GptImageSettings['background'] })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {gptBackgroundOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium">Format</label>
        <Select
          value={settings.output_format ?? gptFormatDefault}
          onValueChange={(value) => onSettingsChange({ ...settings, output_format: value as GptImageSettings['output_format'] })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {gptFormatOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium">Input Fidelity</label>
        <Select
          value={settings.input_fidelity ?? gptInputFidelityDefault}
          onValueChange={(value) => onSettingsChange({ ...settings, input_fidelity: value as GptImageSettings['input_fidelity'] })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {gptInputFidelityOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function NanoBananaSettingsContent({
  settings,
  onSettingsChange,
}: {
  settings: Partial<NanoBananaSettings>;
  onSettingsChange: (settings: Partial<NanoBananaSettings>) => void;
}) {
  const aspectRatioLabels: Record<string, string> = {
    '1:1': '1:1 (Square)',
    '2:3': '2:3 (Portrait)',
    '3:2': '3:2 (Landscape)',
    '3:4': '3:4 (Portrait)',
    '4:3': '4:3 (Landscape)',
    '9:16': '9:16 (Portrait)',
    '16:9': '16:9 (Landscape)',
    '21:9': '21:9 (Ultrawide)',
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-xs font-medium">Aspect Ratio</label>
        <Select
          value={settings.aspectRatio ?? bananaAspectRatioDefault}
          onValueChange={(value) => onSettingsChange({ ...settings, aspectRatio: value as NanoBananaSettings['aspectRatio'] })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {bananAspectRatioOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {aspectRatioLabels[opt] ?? opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function SoraSettingsContent({
  settings,
  onSettingsChange,
}: {
  settings: Partial<SoraSettings>;
  onSettingsChange: (settings: Partial<SoraSettings>) => void;
}) {
  const sizeLabels: Record<string, string> = {
    '720x1280': '720×1280 (Portrait)',
    '1280x720': '1280×720 (Landscape)',
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-xs font-medium">Duration</label>
        <Select
          value={settings.seconds ?? soraSecondsDefault}
          onValueChange={(value) => onSettingsChange({ ...settings, seconds: value as SoraSettings['seconds'] })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {soraSecondsOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt} seconds
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium">Size</label>
        <Select
          value={settings.size ?? '1280x720'}
          onValueChange={(value) => onSettingsChange({ ...settings, size: value as SoraSettings['size'] })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {soraSizeOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {sizeLabels[opt] ?? opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function ModelSettingsPopover({
  modelId,
  settings,
  onSettingsChange,
  children,
}: ModelSettingsPopoverProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuLabel className="flex items-center gap-2">
          <SettingsIcon className="size-4" />
          Model Settings
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="p-2">
          {modelId === 'gpt-image-1' && (
            <GptImageSettingsContent
              settings={settings as Partial<GptImageSettings>}
              onSettingsChange={onSettingsChange}
            />
          )}
          {modelId === 'nano-banana' && (
            <NanoBananaSettingsContent
              settings={settings as Partial<NanoBananaSettings>}
              onSettingsChange={onSettingsChange}
            />
          )}
          {modelId === 'sora-2' && (
            <SoraSettingsContent
              settings={settings as Partial<SoraSettings>}
              onSettingsChange={onSettingsChange}
            />
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

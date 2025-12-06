"use client";

import { type ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { InputGroupButton } from "@/components/ui/input-group";

/**
 * Trigger haptic feedback on mobile devices
 * iOS Safari: Uses checkbox switch trick (iOS 17.4+)
 * Android: Uses Vibration API
 */
export function triggerHapticFeedback(): void {
  // iOS Safari workaround: Create and toggle a checkbox with switch attribute
  // This triggers native haptic feedback (iOS 17.4+)
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.setAttribute('switch', '');
    checkbox.style.position = 'fixed';
    checkbox.style.opacity = '0';
    checkbox.style.pointerEvents = 'none';

    document.body.appendChild(checkbox);
    checkbox.checked = true;

    // Clean up immediately
    setTimeout(() => {
      document.body.removeChild(checkbox);
    }, 0);
    return;
  }

  // Android: Use standard Vibration API
  if (navigator.vibrate) {
    navigator.vibrate(10);
  }
}

export type HapticButtonProps = ComponentProps<typeof Button>;

/**
 * Button component that triggers haptic feedback on mobile devices when clicked
 * Works on iOS 17.4+ and Android devices
 */
export function HapticButton({ onClick, ...props }: HapticButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    triggerHapticFeedback();
    onClick?.(e);
  };

  return <Button onClick={handleClick} {...props} />;
}

export type HapticInputGroupButtonProps = ComponentProps<typeof InputGroupButton>;

/**
 * InputGroupButton component that triggers haptic feedback on mobile devices when clicked
 * Works on iOS 17.4+ and Android devices
 */
export function HapticInputGroupButton({ onClick, ...props }: HapticInputGroupButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    triggerHapticFeedback();
    onClick?.(e);
  };

  return <InputGroupButton onClick={handleClick} {...props} />;
}

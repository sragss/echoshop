"use client";

import { type ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { InputGroupButton } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

/**
 * Trigger haptic feedback on mobile devices
 * iOS Safari: Uses checkbox switch trick (iOS 17.4+)
 * Android: Uses Vibration API
 */
export function triggerHapticFeedback(): void {
  // iOS Safari workaround: Create and toggle a checkbox with switch attribute
  // This triggers native haptic feedback (iOS 18+ Safari)
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    const id = `haptic-${Date.now()}`;

    // Create checkbox with switch attribute
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = id;
    checkbox.setAttribute('switch', '');
    checkbox.style.position = 'fixed';
    checkbox.style.opacity = '0';
    checkbox.style.pointerEvents = 'none';
    checkbox.style.left = '-9999px';

    // Create associated label
    const label = document.createElement('label');
    label.htmlFor = id;
    label.style.position = 'fixed';
    label.style.opacity = '0';
    label.style.pointerEvents = 'none';
    label.style.left = '-9999px';

    // Append both elements
    document.body.appendChild(checkbox);
    document.body.appendChild(label);

    // Trigger haptic by clicking the label (not the checkbox!)
    label.click();

    // Clean up immediately
    setTimeout(() => {
      document.body.removeChild(checkbox);
      document.body.removeChild(label);
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
export function HapticButton({ onClick, className, ...props }: HapticButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    triggerHapticFeedback();
    onClick?.(e);
  };

  return (
    <Button
      onClick={handleClick}
      className={cn("active:scale-95 active:brightness-90", className)}
      {...props}
    />
  );
}

export type HapticInputGroupButtonProps = ComponentProps<typeof InputGroupButton>;

/**
 * InputGroupButton component that triggers haptic feedback on mobile devices when clicked
 * Works on iOS 17.4+ and Android devices
 */
export function HapticInputGroupButton({ onClick, className, ...props }: HapticInputGroupButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    triggerHapticFeedback();
    onClick?.(e);
  };

  return (
    <InputGroupButton
      onClick={handleClick}
      className={cn("active:scale-95 active:brightness-90", className)}
      {...props}
    />
  );
}

// Augment navigator with iOS Safari standalone flag
declare global {
  interface Navigator {
    /** iOS Safari indicates standalone (added to Home Screen) */
    standalone?: boolean;
  }
}

export {};
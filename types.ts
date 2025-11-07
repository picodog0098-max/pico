// This file can be used to define shared TypeScript types and interfaces.

// FIX: Resolve "Subsequent property declarations must have the same type" error.
// This error means another global type has already declared `window.aistudio` using a named type `AIStudio`.
// Using an inline/anonymous type here creates a conflict.
// To fix this, we define an `AIStudio` interface and use it, aligning this declaration with the existing one.
declare global {
  // Fix: Moved the AIStudio interface into the 'declare global' block to make it a global type.
  // This allows it to correctly merge with other global declarations, resolving the type conflict.
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    // Add vendor-prefixed SpeechRecognition types to the global Window object.
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    // Add aistudio for secure API key selection
    aistudio?: AIStudio;
  }
}

// Add an empty export to treat this file as a module. This allows 'declare global' to augment the global scope.
export {};

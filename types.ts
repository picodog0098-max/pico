// This file can be used to define shared TypeScript types and interfaces.

declare global {
  // FIX: Replaced inline object type for `aistudio` with a named interface `AIStudio`
  // to resolve a TypeScript error about subsequent property declarations having mismatched types.
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    // Add vendor-prefixed SpeechRecognition types to the global Window object.
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    // Add aistudio types for API key selection
    aistudio?: AIStudio;
  }
}

// Add an empty export to treat this file as a module. This allows 'declare global' to augment the global scope.
export {};

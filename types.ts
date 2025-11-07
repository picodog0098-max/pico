// This file can be used to define shared TypeScript types and interfaces.

// FIX: Inlined the AIStudio type to resolve a "Subsequent property declarations must have the same type" error.
// This kind of error often points to a naming conflict or module resolution problem with the interface name.
declare global {
  interface Window {
    // Add vendor-prefixed SpeechRecognition types to the global Window object.
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    // Add aistudio for secure API key selection
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

// Add an empty export to treat this file as a module. This allows 'declare global' to augment the global scope.
export {};
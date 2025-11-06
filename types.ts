// This file can be used to define shared TypeScript types and interfaces.

// FIX: Moved AIStudio interface into declare global to resolve type conflict.
// When a file is a module (due to `export {}`), top-level interfaces are scoped
// to the module. By moving AIStudio into `declare global`, it becomes a true
// global type, which is necessary for augmenting the global `Window` interface.
declare global {
  /**
   * Interface for the AI Studio API key selection helper.
   * This is exposed on the window object as `window.aistudio`.
   */
  interface AIStudio {
    /** Checks if an API key has been selected by the user. */
    hasSelectedApiKey: () => Promise<boolean>;
    /** Opens a dialog for the user to select an API key. */
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio; // Make aistudio optional as it doesn't exist in all envs
    MANUAL_API_KEY?: string; // For storing user-provided key in non-aistudio envs
    
    // Add vendor-prefixed SpeechRecognition types to the global Window object.
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Add an empty export to treat this file as a module. This allows 'declare global' to augment the global scope.
export {};
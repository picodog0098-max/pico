// This file can be used to define shared TypeScript types and interfaces.
// For example:
//
// export interface AnalysisResult {
//   behavior: string;
//   emotion: string;
//   confidence: number;
// }

// Fix: Added global type declaration for window.aistudio to resolve declaration conflicts.
// This centralizes the definition and follows the error message hint to use a named interface.

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

declare global {
  interface Window {
    aistudio: AIStudio;
    // Add vendor-prefixed SpeechRecognition types to the global Window object.
    // Using 'any' is a robust way to handle browser-specific APIs that may not
    // have standard TypeScript definitions.
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// FIX: Add an empty export to treat this file as a module. This allows 'declare global' to augment the global scope.
export {};

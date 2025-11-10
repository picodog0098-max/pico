// This file can be used to define shared TypeScript types and interfaces.

declare global {
  interface Window {
    // Add vendor-prefixed SpeechRecognition types to the global Window object.
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface AnalysisResultData {
  emotion: string;
  behavior_analysis: string;
  recommendation: string;
}

// Add an empty export to treat this file as a module. This allows 'declare global' to augment the global scope.
export {};
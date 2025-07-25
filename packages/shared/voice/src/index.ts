// Greek ERP/CRM - Shared Voice Utilities

// Voice command types
export interface VoiceCommand {
  text: string;
  intent: string;
  confidence: number;
  entities: Record<string, any>;
}

export interface VoiceConfig {
  language: string;
  sampleRate: number;
  channels: number;
}

// Voice utilities
export const processVoiceCommand = (
  audioData: ArrayBuffer
): Promise<VoiceCommand> => {
  // TODO: Implement voice processing with Whisper
  return Promise.resolve({
    text: "Sample voice command",
    intent: "unknown",
    confidence: 0.8,
    entities: {},
  });
};

export const getDefaultVoiceConfig = (): VoiceConfig => {
  return {
    language: "el-GR", // Greek
    sampleRate: 16000,
    channels: 1,
  };
};

export const isVoiceSupported = (): boolean => {
  // Check if we're in a browser environment
  if (typeof globalThis !== "undefined" && "window" in globalThis) {
    return "webkitSpeechRecognition" in (globalThis as any).window;
  }
  return false;
};

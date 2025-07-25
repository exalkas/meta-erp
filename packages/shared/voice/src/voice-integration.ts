// Greek ERP/CRM - Voice Command Integration
// Connects frontend with voice-service and main API

/// <reference lib="dom" />

export interface VoiceRecognitionResult {
  success: boolean;
  transcription: string;
  confidence: number;
  language: string;
  duration?: number;
  error?: string;
}

export interface VoiceCommandResult {
  success: boolean;
  command_matched: boolean;
  action_performed: string;
  response_data: {
    action: string;
    url?: string;
    target?: string;
    modal_id?: string;
    modal_props?: any;
    function?: string;
    params?: any;
  };
  match_score: number;
  execution_time_ms: number;
  error_message?: string;
}

export interface VoiceProcessingResult {
  success: boolean;
  transcription: {
    text: string;
    confidence: number;
    language: string;
  };
  command: VoiceCommandResult;
  error?: string;
}

export class VoiceCommandIntegration {
  private voiceServiceUrl: string;
  private mainApiUrl: string;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;

  constructor(
    voiceServiceUrl = "http://localhost:8004",
    mainApiUrl = "http://localhost:8000"
  ) {
    this.voiceServiceUrl = voiceServiceUrl;
    this.mainApiUrl = mainApiUrl;
  }

  /**
   * Check if voice recognition is supported
   */
  isVoiceSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Start recording audio for voice command
   */
  async startRecording(): Promise<void> {
    if (!this.isVoiceSupported()) {
      throw new Error("Voice recording is not supported in this browser");
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      this.audioChunks = [];
      this.isRecording = true;

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.start();
    } catch (error) {
      throw new Error(`Failed to start recording: ${error}`);
    }
  }

  /**
   * Stop recording and process voice command
   */
  async stopRecordingAndProcess(): Promise<VoiceProcessingResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error("No active recording"));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          // Create audio blob
          const audioBlob = new Blob(this.audioChunks, { type: "audio/webm" });

          // Stop all tracks
          this.mediaRecorder?.stream
            .getTracks()
            .forEach((track: MediaStreamTrack) => track.stop());

          // Process the audio
          const result = await this.processAudioCommand(audioBlob);
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.isRecording = false;
          this.mediaRecorder = null;
          this.audioChunks = [];
        }
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Process audio blob with voice service and main API
   */
  async processAudioCommand(audioBlob: Blob): Promise<VoiceProcessingResult> {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("language", "el-GR");
      formData.append("main_api_url", this.mainApiUrl);

      const response = await fetch(
        `${this.voiceServiceUrl}/voice/process-command`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = (await response.json()) as VoiceProcessingResult;
      return result;
    } catch (error) {
      return {
        success: false,
        transcription: { text: "", confidence: 0, language: "el" },
        command: {
          success: false,
          command_matched: false,
          action_performed: "",
          response_data: { action: "" },
          match_score: 0,
          execution_time_ms: 0,
          error_message: String(error),
        },
        error: String(error),
      };
    }
  }

  /**
   * Process text command directly (for testing)
   */
  async processTextCommand(
    text: string,
    language = "el"
  ): Promise<VoiceProcessingResult> {
    try {
      const response = await fetch(`${this.voiceServiceUrl}/voice/test-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          language,
          main_api_url: this.mainApiUrl,
        }),
      });

      const result = (await response.json()) as VoiceProcessingResult;
      return result;
    } catch (error) {
      return {
        success: false,
        transcription: { text, confidence: 95, language },
        command: {
          success: false,
          command_matched: false,
          action_performed: "",
          response_data: { action: "" },
          match_score: 0,
          execution_time_ms: 0,
          error_message: String(error),
        },
        error: String(error),
      };
    }
  }

  /**
   * Execute the action returned by voice command
   */
  executeVoiceAction(result: VoiceProcessingResult): void {
    if (!result.success || !result.command.success) {
      console.error(
        "Voice command failed:",
        result.error || result.command.error_message
      );
      return;
    }

    const action = result.command.response_data;

    switch (action.action) {
      case "navigate":
        if (action.url) {
          if (action.target === "_blank") {
            window.open(action.url, "_blank");
          } else {
            window.location.href = action.url;
          }
        }
        break;

      case "open_modal":
        if (action.modal_id) {
          this.openModal(action.modal_id, action.modal_props || {});
        }
        break;

      case "execute_function":
        if (action.function) {
          this.executeFunction(action.function, action.params || {});
        }
        break;

      default:
        console.warn("Unknown voice action:", action.action);
    }
  }

  /**
   * Open modal (to be implemented by the application)
   */
  private openModal(modalId: string, props: any): void {
    // Dispatch custom event that the app can listen to
    window.dispatchEvent(
      new CustomEvent("voice-open-modal", {
        detail: { modalId, props },
      })
    );
  }

  /**
   * Execute function (to be implemented by the application)
   */
  private executeFunction(functionName: string, params: any): void {
    // Dispatch custom event that the app can listen to
    window.dispatchEvent(
      new CustomEvent("voice-execute-function", {
        detail: { functionName, params },
      })
    );
  }

  /**
   * Get user's voice commands from main API
   */
  async getUserCommands(): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.mainApiUrl}/api/v1/voice/user-commands`,
        {
          headers: {
            Authorization: `Bearer ${this.getAuthToken()}`,
          },
        }
      );

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`Failed to get user commands: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching user commands:", error);
      return [];
    }
  }

  /**
   * Customize a voice command
   */
  async customizeCommand(
    systemCommandId: string,
    customPhrases: string[],
    customActionConfig?: any
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch(
        `${this.mainApiUrl}/api/v1/voice/customize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.getAuthToken()}`,
          },
          body: JSON.stringify({
            system_command_id: systemCommandId,
            custom_phrases: customPhrases,
            custom_action_config: customActionConfig,
          }),
        }
      );

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Get authentication token (to be implemented by the application)
   */
  private getAuthToken(): string {
    // Return token from localStorage, sessionStorage, or cookie
    return localStorage.getItem("auth_token") || "";
  }

  /**
   * Get voice command analytics
   */
  async getAnalytics(days = 30): Promise<any> {
    try {
      const response = await fetch(
        `${this.mainApiUrl}/api/v1/voice/analytics?days=${days}`,
        {
          headers: {
            Authorization: `Bearer ${this.getAuthToken()}`,
          },
        }
      );

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`Failed to get analytics: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      return null;
    }
  }
}

// Export singleton instance
export const voiceCommands = new VoiceCommandIntegration();

// Export React hook for easy integration
export function useVoiceCommands() {
  return voiceCommands;
}

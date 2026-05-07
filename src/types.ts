export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  series: string[];
  timestamp: number;
  metadata?: string;
  audioUrl?: string;
}

export interface ReferenceImage {
  id: string;
  data: string;
  mimeType: string;
}

export interface Series {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface ExternalModelsConfig {
  claudeApiKey: string;
  githubCopilotToken: string;
  microsoftCopilotToken: string;
  piAgentToken: string;
  piAgentEndpoint?: string;
  piAgentModel?: string;
  activeSubtaskModel: string;
}

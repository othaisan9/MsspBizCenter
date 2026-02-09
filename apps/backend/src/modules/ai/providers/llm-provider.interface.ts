export interface LlmMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LlmGenerateParams {
  model: string;
  system: string;
  messages: LlmMessage[];
  maxTokens: number;
}

export interface LlmResponse {
  text: string;
  usage?: { inputTokens: number; outputTokens: number };
}

export interface LlmModelInfo {
  id: string;
  name: string;
}

export interface LlmProvider {
  generate(params: LlmGenerateParams): Promise<LlmResponse>;
  stream(params: LlmGenerateParams): AsyncGenerator<string, void, unknown>;
  listModels(): Promise<LlmModelInfo[]>;
}

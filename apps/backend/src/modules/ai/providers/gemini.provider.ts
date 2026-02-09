import { GoogleGenAI } from '@google/genai';
import {
  LlmProvider,
  LlmGenerateParams,
  LlmResponse,
  LlmModelInfo,
} from './llm-provider.interface';

export class GeminiProvider implements LlmProvider {
  private client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async generate(params: LlmGenerateParams): Promise<LlmResponse> {
    const response = await this.client.models.generateContent({
      model: params.model,
      contents: params.messages.map((msg) => msg.content).join('\n'),
      config: {
        systemInstruction: params.system,
        maxOutputTokens: params.maxTokens,
      },
    });

    return {
      text: response.text || '',
      usage: response.usageMetadata
        ? {
            inputTokens: response.usageMetadata.promptTokenCount || 0,
            outputTokens: response.usageMetadata.candidatesTokenCount || 0,
          }
        : undefined,
    };
  }

  async listModels(): Promise<LlmModelInfo[]> {
    const pager = await this.client.models.list({ config: { pageSize: 100 } });
    const models: LlmModelInfo[] = [];
    for (const model of pager.page) {
      // generateContent를 지원하는 모델만
      if (model.supportedActions?.includes('generateContent')) {
        const id = model.name?.replace('models/', '') || '';
        models.push({ id, name: model.displayName || id });
      }
    }
    return models.sort((a, b) => a.id.localeCompare(b.id));
  }

  async *stream(params: LlmGenerateParams): AsyncGenerator<string, void, unknown> {
    const response = await this.client.models.generateContentStream({
      model: params.model,
      contents: params.messages.map((msg) => msg.content).join('\n'),
      config: {
        systemInstruction: params.system,
        maxOutputTokens: params.maxTokens,
      },
    });

    for await (const chunk of response) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  }
}

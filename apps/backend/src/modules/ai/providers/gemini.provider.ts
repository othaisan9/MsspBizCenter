import { GoogleGenAI } from '@google/genai';
import {
  LlmProvider,
  LlmGenerateParams,
  LlmResponse,
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

import { Ollama } from 'ollama';
import {
  LlmProvider,
  LlmGenerateParams,
  LlmResponse,
  LlmModelInfo,
} from './llm-provider.interface';

export class OllamaProvider implements LlmProvider {
  private client: Ollama;

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.client = new Ollama({ host: baseUrl });
  }

  async generate(params: LlmGenerateParams): Promise<LlmResponse> {
    const messages = [
      { role: 'system' as const, content: params.system },
      ...params.messages,
    ];

    const response = await this.client.chat({
      model: params.model,
      messages,
    });

    return {
      text: response.message.content,
    };
  }

  async listModels(): Promise<LlmModelInfo[]> {
    const response = await this.client.list();
    return (response.models || []).map((m) => ({
      id: m.name,
      name: m.name,
    }));
  }

  async *stream(params: LlmGenerateParams): AsyncGenerator<string, void, unknown> {
    const messages = [
      { role: 'system' as const, content: params.system },
      ...params.messages,
    ];

    const stream = await this.client.chat({
      model: params.model,
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      if (chunk.message?.content) {
        yield chunk.message.content;
      }
    }
  }
}

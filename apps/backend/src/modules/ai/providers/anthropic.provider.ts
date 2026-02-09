import Anthropic from '@anthropic-ai/sdk';
import {
  LlmProvider,
  LlmGenerateParams,
  LlmResponse,
  LlmModelInfo,
} from './llm-provider.interface';

export class AnthropicProvider implements LlmProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generate(params: LlmGenerateParams): Promise<LlmResponse> {
    const response = await this.client.messages.create({
      model: params.model,
      max_tokens: params.maxTokens,
      system: params.system,
      messages: params.messages.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    });

    const textContent = response.content.find((c) => c.type === 'text');
    const text = textContent && 'text' in textContent ? textContent.text : '';

    return {
      text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }

  async listModels(): Promise<LlmModelInfo[]> {
    const response = await this.client.models.list({ limit: 100 });
    const models: LlmModelInfo[] = [];
    for await (const model of response) {
      models.push({ id: model.id, name: model.display_name || model.id });
    }
    return models;
  }

  async *stream(params: LlmGenerateParams): AsyncGenerator<string, void, unknown> {
    const stream = await this.client.messages.stream({
      model: params.model,
      max_tokens: params.maxTokens,
      system: params.system,
      messages: params.messages.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield event.delta.text;
      }
    }
  }
}

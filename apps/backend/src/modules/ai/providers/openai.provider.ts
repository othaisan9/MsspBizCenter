import OpenAI from 'openai';
import {
  LlmProvider,
  LlmGenerateParams,
  LlmResponse,
} from './llm-provider.interface';

export class OpenAiProvider implements LlmProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generate(params: LlmGenerateParams): Promise<LlmResponse> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: params.system },
      ...params.messages.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    const response = await this.client.chat.completions.create({
      model: params.model,
      max_tokens: params.maxTokens,
      messages,
    });

    const text = response.choices[0]?.message?.content || '';

    return {
      text,
      usage: response.usage
        ? {
            inputTokens: response.usage.prompt_tokens,
            outputTokens: response.usage.completion_tokens,
          }
        : undefined,
    };
  }

  async *stream(params: LlmGenerateParams): AsyncGenerator<string, void, unknown> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: params.system },
      ...params.messages.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    const stream = await this.client.chat.completions.create({
      model: params.model,
      max_tokens: params.maxTokens,
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        yield delta;
      }
    }
  }
}

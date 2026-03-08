import { Injectable, Logger } from '@nestjs/common';

export interface SqsMessage {
  messageId: string;
  queueUrl: string;
  body: string;
  timestamp: Date;
}

@Injectable()
export class MockSqsService {
  private readonly logger = new Logger(MockSqsService.name);
  private readonly messages: SqsMessage[] = [];

  async sendMessage(queueUrl: string, body: Record<string, unknown>): Promise<SqsMessage> {
    const message: SqsMessage = {
      messageId: this.generateMessageId(),
      queueUrl,
      body: JSON.stringify(body),
      timestamp: new Date(),
    };

    this.messages.push(message);
    this.logger.log(`[Mock SQS] Message sent to ${queueUrl}: ${message.body}`);

    return message;
  }

  async sendBatch(queueUrl: string, bodies: Record<string, unknown>[]): Promise<SqsMessage[]> {
    const messages = await Promise.all(
      bodies.map((body) => this.sendMessage(queueUrl, body)),
    );
    return messages;
  }

  getMessages(): SqsMessage[] {
    return [...this.messages];
  }

  clearMessages(): void {
    this.messages.length = 0;
  }

  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UsersService } from '../users/users.service';
import { UserCreatedEvent } from '../users/events/user-created.event';
import { MockSqsService } from './mock-sqs.service';

const USER_EVENTS_QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/123456789/user-events-queue';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly sqsService: MockSqsService,
  ) { }

  @OnEvent('user.created')
  async handleUserCreatedEvent(event: UserCreatedEvent): Promise<void> {
    this.logger.log(`New user created: ${event.user.email}`);

    await this.sqsService.sendMessage(USER_EVENTS_QUEUE_URL, {
      eventType: 'user.created',
      timestamp: new Date().toISOString(),
      payload: {
        userId: event.user.id,
        email: event.user.email,
        firstName: event.user.firstName,
        lastName: event.user.lastName,
      },
    });
  }

  async notifyUser(userId: number, message: string): Promise<void> {
    const user = await this.usersService.findOne(userId);
    // TODO: Implement actual notification logic (email, push, etc.)
    console.log(`Notifying user ${user.email}: ${message}`);
  }

  async notifyAllUsers(message: string): Promise<void> {
    const users = await this.usersService.findAll();
    for (const user of users) {
      console.log(`Notifying user ${user.email}: ${message}`);
    }
  }
}

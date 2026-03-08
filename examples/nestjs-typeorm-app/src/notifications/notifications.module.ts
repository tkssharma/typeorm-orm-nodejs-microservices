import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { MockSqsService } from './mock-sqs.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, MockSqsService],
  exports: [NotificationsService, MockSqsService],
})
export class NotificationsModule { }

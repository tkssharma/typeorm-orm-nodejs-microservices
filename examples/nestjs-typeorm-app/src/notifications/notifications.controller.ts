import { Controller, Post, Body, Param, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NotifyUserDto, NotifyResponseDto } from './dto/notification.dto';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  @Post('user/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send notification to a specific user',
    description: 'Sends a notification message to a user identified by their ID.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Unique identifier of the user to notify',
    required: true,
    example: 1,
  })
  @ApiBody({
    type: NotifyUserDto,
    description: 'Notification message payload',
  })
  @ApiOkResponse({
    description: 'Notification sent successfully',
    type: NotifyResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User with the specified ID was not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid user ID format or message payload',
  })
  async notifyUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: NotifyUserDto,
  ): Promise<NotifyResponseDto> {
    await this.notificationsService.notifyUser(id, dto.message);
    return { success: true };
  }

  @Post('broadcast')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Broadcast notification to all users',
    description: 'Sends a notification message to all active users in the system.',
  })
  @ApiBody({
    type: NotifyUserDto,
    description: 'Broadcast message payload',
  })
  @ApiOkResponse({
    description: 'Broadcast sent successfully to all users',
    type: NotifyResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid message payload',
  })
  async notifyAllUsers(
    @Body() dto: NotifyUserDto,
  ): Promise<NotifyResponseDto> {
    await this.notificationsService.notifyAllUsers(dto.message);
    return { success: true };
  }
}

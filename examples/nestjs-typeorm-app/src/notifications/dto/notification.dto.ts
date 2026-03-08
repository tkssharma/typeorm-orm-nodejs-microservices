import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class NotifyUserDto {
  @ApiProperty({ description: 'Notification message', example: 'Hello, you have a new notification!' })
  @IsString()
  @IsNotEmpty()
  message!: string;
}

export class NotifyResponseDto {
  @ApiProperty({ description: 'Whether the notification was sent successfully', example: true })
  success!: boolean;
}

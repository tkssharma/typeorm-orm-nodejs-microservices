import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService, JwtPayload } from './auth.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { User } from '../users/user.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';

@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate a user with email and password',
  })
  @ApiBody({ type: LoginDto, description: 'User credentials' })
  @ApiOkResponse({
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieve the profile of the authenticated user. Requires valid JWT token.',
  })
  @ApiOkResponse({
    description: 'User profile retrieved successfully',
    type: User,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing token' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getProfile(@CurrentUser() user: JwtPayload): Promise<User> {
    return this.authService.getProfile(user.sub);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Admin only endpoint',
    description: 'Access restricted to admin users only. Requires valid JWT token with admin role.',
  })
  @ApiOkResponse({
    description: 'Admin access granted',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Welcome Admin!' },
        user: { type: 'object' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing token' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions - Admin role required' })
  async admin(@CurrentUser() user: JwtPayload): Promise<{ message: string; user: User }> {
    const userProfile = await this.authService.getProfile(user.sub);
    return {
      message: 'Welcome Admin!',
      user: userProfile,
    };
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UserResponse } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieves a list of all active users in the system. Returns users sorted by creation date in descending order.',
  })
  @ApiOkResponse({
    description: 'Successfully retrieved list of active users',
    type: [UserResponse],
  })
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieves a single user by their unique identifier. Includes associated posts in the response.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Unique identifier of the user',
    required: true,
    example: 1,
  })
  @ApiOkResponse({
    description: 'User found and returned successfully',
    type: UserResponse,
  })
  @ApiNotFoundResponse({
    description: 'User with the specified ID was not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid user ID format provided',
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Creates a new user account with the provided information. Email must be unique across all users.',
  })
  @ApiBody({
    type: CreateUserDto,
    description: 'User creation payload',
  })
  @ApiCreatedResponse({
    description: 'User has been successfully created',
    type: UserResponse,
  })
  @ApiConflictResponse({
    description: 'A user with this email address already exists',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data - validation failed',
  })
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user by ID',
    description: 'Updates an existing user with the provided data. Only fields included in the request body will be updated.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Unique identifier of the user to update',
    required: true,
    example: 1,
  })
  @ApiBody({
    type: UpdateUserDto,
    description: 'User update payload - all fields are optional',
  })
  @ApiOkResponse({
    description: 'User has been successfully updated',
    type: User,
  })
  @ApiNotFoundResponse({
    description: 'User with the specified ID was not found',
  })
  @ApiConflictResponse({
    description: 'A user with this email address already exists',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data - validation failed',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete user by ID',
    description: 'Permanently removes a user from the system. This action cannot be undone.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Unique identifier of the user to delete',
    required: true,
    example: 1,
  })
  @ApiNoContentResponse({
    description: 'User has been successfully deleted',
  })
  @ApiNotFoundResponse({
    description: 'User with the specified ID was not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid user ID format provided',
  })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.usersService.remove(id);
  }

  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deactivate user by ID',
    description: 'Deactivates a user account. Deactivated users will not appear in the active users list but their data is preserved.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Unique identifier of the user to deactivate',
    required: true,
    example: 1,
  })
  @ApiOkResponse({
    description: 'User has been successfully deactivated',
    type: User,
  })
  @ApiNotFoundResponse({
    description: 'User with the specified ID was not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid user ID format provided',
  })
  deactivate(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.usersService.deactivate(id);
  }
}

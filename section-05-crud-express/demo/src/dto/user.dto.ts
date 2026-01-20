import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsBoolean,
} from "class-validator";
import { UserRole } from "../entities/User";

export class CreateUserDto {
  @IsNotEmpty({ message: "First name is required" })
  @IsString()
  @MinLength(2, { message: "First name must be at least 2 characters" })
  @MaxLength(100)
  firstName: string;

  @IsNotEmpty({ message: "Last name is required" })
  @IsString()
  @MinLength(2, { message: "Last name must be at least 2 characters" })
  @MaxLength(100)
  lastName: string;

  @IsEmail({}, { message: "Invalid email format" })
  email: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export interface UserResponseDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

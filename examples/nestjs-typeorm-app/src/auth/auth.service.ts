import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { UsersService } from '../users/users.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { User } from '../users/user.entity';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET', 'your-secret-key');
    this.jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '24h');
    this.logger.debug(`AuthService initialized with JWT expiry: ${this.jwtExpiresIn}`);
  }

  private generateToken(user: User): string {
    this.logger.debug(`Generating JWT token for user: ${user.email} (ID: ${user.id})`);
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    this.logger.debug(`JWT payload created: ${JSON.stringify({ sub: payload.sub, email: payload.email, role: payload.role })}`);

    const token = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    });
    this.logger.debug(`JWT token generated successfully for user ID: ${user.id}`);
    return token;
  }

  async validateUser(email: string, password: string): Promise<User> {
    this.logger.debug(`Validating user with email: ${email}`);
    const user = await this.usersService.findByEmailWithPassword(email);

    if (!user) {
      this.logger.debug(`User not found with email: ${email}`);
      throw new UnauthorizedException('Invalid email or password');
    }
    this.logger.debug(`User found: ${user.email} (ID: ${user.id}, Role: ${user.role})`);

    if (!user.isActive) {
      this.logger.debug(`User account is deactivated: ${email}`);
      throw new UnauthorizedException('User account is deactivated');
    }
    this.logger.debug(`User account is active: ${email}`);

    this.logger.debug(`Comparing password for user: ${email}`);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.debug(`Invalid password for user: ${email}`);
      throw new UnauthorizedException('Invalid email or password');
    }
    this.logger.debug(`Password validated successfully for user: ${email}`);

    return user;
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    this.logger.debug(`Login attempt for email: ${loginDto.email}`);
    const user = await this.validateUser(loginDto.email, loginDto.password);
    this.logger.debug(`User validated successfully: ${user.email}`);

    const token = this.generateToken(user);
    this.logger.log(`User logged in successfully: ${user.email} (ID: ${user.id})`);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      accessToken: token,
      message: 'Login successful',
    };
  }

  async getProfile(userId: number): Promise<User> {
    this.logger.debug(`Fetching profile for user ID: ${userId}`);
    const user = await this.usersService.findOne(userId);
    this.logger.debug(`Profile fetched successfully for user: ${user.email}`);
    return user;
  }

  verifyToken(token: string): JwtPayload {
    this.logger.debug(`Verifying JWT token`);
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      const payload = decoded as unknown as JwtPayload;
      this.logger.debug(`Token verified successfully for user ID: ${payload.sub}`);
      return payload;
    } catch (error) {
      this.logger.debug(`Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { CreateUserDto, UpdateUserDto, PaginatedResponse } from "../dto/user.dto";
import { Like, ILike } from "typeorm";

const userRepository = AppDataSource.getRepository(User);
export class UserService {

  async findById(id: number): Promise<User | null> {
    return userRepository.findOneBy({ id });
  }

  async findByEmail(email: string): Promise<User | null> {
    return userRepository.findOneBy({ email: email.toLowerCase() });
  }

  async create(dto: CreateUserDto): Promise<User> {
    // Check if email exists
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new Error("Email already registered");
    }

    const user = userRepository.create({
      ...dto,
      email: dto.email.toLowerCase(),
    });

    return userRepository.save(user);
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new Error("User not found");
    }

    // Check email uniqueness if updating email
    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const existing = await this.findByEmail(dto.email);
      if (existing) {
        throw new Error("Email already in use");
      }
      dto.email = dto.email.toLowerCase();
    }

    Object.assign(user, dto);
    return userRepository.save(user);
  }

  async delete(id: number): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new Error("User not found");
    }
    await userRepository.softDelete(id);
  }

  async restore(id: number): Promise<void> {
    const user = await userRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.deletedAt) {
      throw new Error("User is not deleted");
    }

    await userRepository.restore(id);
  }

  async permanentDelete(id: number): Promise<void> {
    const user = await userRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!user) {
      throw new Error("User not found");
    }

    await userRepository.delete(id);
  }
}

export const userService = new UserService();

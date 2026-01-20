import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { CreateUserDto, UpdateUserDto, PaginatedResponse } from "../dto/user.dto";
import { Like, ILike } from "typeorm";

const userRepository = AppDataSource.getRepository(User);

interface FindAllParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export class UserService {
  async findAll(params: FindAllParams): Promise<PaginatedResponse<User>> {
    const {
      page = 1,
      limit = 10,
      search,
      isActive,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = params;

    const queryBuilder = userRepository.createQueryBuilder("user");

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        "(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    // Active filter
    if (isActive !== undefined) {
      queryBuilder.andWhere("user.isActive = :isActive", { isActive });
    }

    // Sorting
    queryBuilder.orderBy(`user.${sortBy}`, sortOrder);

    // Pagination
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

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

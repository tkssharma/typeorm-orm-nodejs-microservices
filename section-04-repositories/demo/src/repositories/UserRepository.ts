import { AppDataSource } from "../data-source";
import { User } from "../entities/User";

// Custom repository using extend pattern (TypeORM v0.3+)
export const UserRepository = AppDataSource.getRepository(User).extend({
  // Find user by email
  findByEmail(email: string) {
    return this.findOne({ where: { email: email.toLowerCase() } });
  },

  // Find all active users
  findActiveUsers() {
    return this.find({
      where: { isActive: true },
      order: { createdAt: "DESC" },
    });
  },

  // Find users with pagination
  async findWithPagination(page: number = 1, limit: number = 10) {
    const [users, total] = await this.findAndCount({
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // Search users by name
  async searchByName(searchTerm: string) {
    return this.createQueryBuilder("user")
      .where("user.firstName ILIKE :search", { search: `%${searchTerm}%` })
      .orWhere("user.lastName ILIKE :search", { search: `%${searchTerm}%` })
      .orderBy("user.firstName", "ASC")
      .getMany();
  },

  // Update user's active status
  async toggleActive(userId: number) {
    const user = await this.findOneBy({ id: userId });
    if (!user) {
      throw new Error("User not found");
    }
    user.isActive = !user.isActive;
    return this.save(user);
  },
});

import "reflect-metadata";
import { AppDataSource } from "./data-source";
import { User } from "./entities/User";
import { Profile } from "./entities/Profile";
import { Post } from "./entities/Post";
import { Tag } from "./entities/Tag";

async function main() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connected!");

    const userRepo = AppDataSource.getRepository(User);
    const profileRepo = AppDataSource.getRepository(Profile);
    const postRepo = AppDataSource.getRepository(Post);
    const tagRepo = AppDataSource.getRepository(Tag);

    // Clean up
    await postRepo.delete({});
    await profileRepo.delete({});
    await tagRepo.delete({});
    await userRepo.delete({});

    // ========================================
    // ONE-TO-ONE: User <-> Profile
    // ========================================
    console.log("\n📝 Creating User with Profile (One-to-One)...");

    const user = userRepo.create({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
    });
    await userRepo.save(user);

    const profile = profileRepo.create({
      bio: "Full-stack developer",
      website: "https://johndoe.dev",
      user: user,
    });
    await profileRepo.save(profile);
    console.log("✅ User with profile created");

    // Query user with profile
    const userWithProfile = await userRepo.findOne({
      where: { id: user.id },
      relations: ["profile"],
    });
    console.log("User:", userWithProfile?.firstName);
    console.log("Profile bio:", userWithProfile?.profile?.bio);

    // ========================================
    // ONE-TO-MANY: User -> Posts
    // ========================================
    console.log("\n📝 Creating Posts for User (One-to-Many)...");

    const post1 = postRepo.create({
      title: "Getting Started with TypeORM",
      content: "TypeORM is a powerful ORM...",
      author: user,
      isPublished: true,
    });

    const post2 = postRepo.create({
      title: "Advanced TypeORM Patterns",
      content: "Let's explore advanced patterns...",
      author: user,
      isPublished: false,
    });

    await postRepo.save([post1, post2]);
    console.log("✅ Posts created");

    // Query user with posts
    const userWithPosts = await userRepo.findOne({
      where: { id: user.id },
      relations: ["posts"],
    });
    console.log("User:", userWithPosts?.firstName);
    console.log("Posts count:", userWithPosts?.posts?.length);

    // ========================================
    // MANY-TO-MANY: Posts <-> Tags
    // ========================================
    console.log("\n📝 Creating Tags and assigning to Posts (Many-to-Many)...");

    const tag1 = tagRepo.create({ name: "typescript" });
    const tag2 = tagRepo.create({ name: "nodejs" });
    const tag3 = tagRepo.create({ name: "database" });
    await tagRepo.save([tag1, tag2, tag3]);

    // Assign tags to posts
    post1.tags = [tag1, tag2];
    post2.tags = [tag1, tag3];
    await postRepo.save([post1, post2]);
    console.log("✅ Tags assigned to posts");

    // Query posts with tags
    const postsWithTags = await postRepo.find({
      relations: ["tags", "author"],
    });

    for (const post of postsWithTags) {
      console.log(`\nPost: "${post.title}"`);
      console.log("  Author:", post.author.firstName);
      console.log("  Tags:", post.tags.map(t => t.name).join(", "));
    }

    // Query tags with posts
    console.log("\n📊 Tags with post counts:");
    const tagsWithPosts = await tagRepo.find({
      relations: ["posts"],
    });
    for (const tag of tagsWithPosts) {
      console.log(`  #${tag.name}: ${tag.posts.length} posts`);
    }

    // ========================================
    // COMPLEX QUERY: All relations
    // ========================================
    console.log("\n🔍 Loading user with all relations...");
    const fullUser = await userRepo.findOne({
      where: { id: user.id },
      relations: ["profile", "posts", "posts.tags"],
    });

    console.log("\nFull User Data:");
    console.log("  Name:", fullUser?.firstName, fullUser?.lastName);
    console.log("  Bio:", fullUser?.profile?.bio);
    console.log("  Posts:");
    fullUser?.posts?.forEach(p => {
      console.log(`    - ${p.title} [${p.tags?.map(t => t.name).join(", ")}]`);
    });

    console.log("\n🎉 Relationships demo completed!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    console.log("👋 Connection closed");
  }
}

main();

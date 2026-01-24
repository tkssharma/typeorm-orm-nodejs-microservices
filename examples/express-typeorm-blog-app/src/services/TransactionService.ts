import { AppDataSource } from '../data-source';
import { Author } from '../entities/Author';
import { Post, PostStatus } from '../entities/Post';
import { Comment } from '../entities/Comment';

/**
 * TransactionService demonstrates how to use TypeORM transactions
 * for operations that need to be atomic (all succeed or all fail)
 */
export class TransactionService {
  /**
   * Create an author with their first post in a single transaction
   * If either operation fails, both are rolled back
   */
  async createAuthorWithPost(
    authorData: Partial<Author>,
    postData: Partial<Post>
  ): Promise<{ author: Author; post: Post }> {
    return AppDataSource.transaction(async (transactionalEntityManager) => {
      // Create and save author
      const authorRepo = transactionalEntityManager.getRepository(Author);
      const author = authorRepo.create(authorData);
      const savedAuthor = await authorRepo.save(author);

      // Create and save post with the new author
      const postRepo = transactionalEntityManager.getRepository(Post);
      const post = postRepo.create({
        ...postData,
        authorId: savedAuthor.id,
      });
      const savedPost = await postRepo.save(post);

      return { author: savedAuthor, post: savedPost };
    });
  }

  /**
   * Publish a post and create a notification comment in a transaction
   */
  async publishPostWithNotification(
    postId: number,
    notificationMessage: string
  ): Promise<{ post: Post; comment: Comment }> {
    return AppDataSource.transaction(async (transactionalEntityManager) => {
      const postRepo = transactionalEntityManager.getRepository(Post);
      const commentRepo = transactionalEntityManager.getRepository(Comment);

      // Find and update the post
      const post = await postRepo.findOneBy({ id: postId });
      if (!post) {
        throw new Error(`Post with id ${postId} not found`);
      }

      post.status = PostStatus.PUBLISHED;
      post.publishedAt = new Date();
      const updatedPost = await postRepo.save(post);

      // Create a system comment
      const comment = commentRepo.create({
        postId: post.id,
        authorName: 'System',
        authorEmail: 'system@blog.com',
        content: notificationMessage,
        isApproved: true,
      });
      const savedComment = await commentRepo.save(comment);

      return { post: updatedPost, comment: savedComment };
    });
  }

  /**
   * Transfer all posts from one author to another
   * Useful when deactivating an author account
   */
  async transferPosts(fromAuthorId: number, toAuthorId: number): Promise<number> {
    return AppDataSource.transaction(async (transactionalEntityManager) => {
      const authorRepo = transactionalEntityManager.getRepository(Author);
      const postRepo = transactionalEntityManager.getRepository(Post);

      // Verify both authors exist
      const fromAuthor = await authorRepo.findOneBy({ id: fromAuthorId });
      const toAuthor = await authorRepo.findOneBy({ id: toAuthorId });

      if (!fromAuthor || !toAuthor) {
        throw new Error('One or both authors not found');
      }

      // Update all posts
      const result = await postRepo
        .createQueryBuilder()
        .update(Post)
        .set({ authorId: toAuthorId })
        .where('authorId = :fromAuthorId', { fromAuthorId })
        .execute();

      // Deactivate the old author
      fromAuthor.isActive = false;
      await authorRepo.save(fromAuthor);

      return result.affected || 0;
    });
  }

  /**
   * Bulk approve comments for a post
   */
  async bulkApproveComments(postId: number): Promise<number> {
    return AppDataSource.transaction(async (transactionalEntityManager) => {
      const commentRepo = transactionalEntityManager.getRepository(Comment);

      const result = await commentRepo
        .createQueryBuilder()
        .update(Comment)
        .set({ isApproved: true })
        .where('postId = :postId', { postId })
        .andWhere('isApproved = :isApproved', { isApproved: false })
        .execute();

      return result.affected || 0;
    });
  }

  /**
   * Delete an author and all their content (posts and comments)
   * This demonstrates cascading deletes in a transaction
   */
  async deleteAuthorWithContent(authorId: number): Promise<{
    postsDeleted: number;
    commentsDeleted: number;
  }> {
    return AppDataSource.transaction(async (transactionalEntityManager) => {
      const authorRepo = transactionalEntityManager.getRepository(Author);
      const postRepo = transactionalEntityManager.getRepository(Post);
      const commentRepo = transactionalEntityManager.getRepository(Comment);

      // Get all posts by this author
      const posts = await postRepo.find({ where: { authorId } });
      const postIds = posts.map((p) => p.id);

      let commentsDeleted = 0;

      // Delete comments on all posts
      if (postIds.length > 0) {
        const commentResult = await commentRepo
          .createQueryBuilder()
          .delete()
          .where('postId IN (:...postIds)', { postIds })
          .execute();
        commentsDeleted = commentResult.affected || 0;
      }

      // Delete all posts
      const postResult = await postRepo.delete({ authorId });
      const postsDeleted = postResult.affected || 0;

      // Delete the author
      await authorRepo.delete(authorId);

      return { postsDeleted, commentsDeleted };
    });
  }
}

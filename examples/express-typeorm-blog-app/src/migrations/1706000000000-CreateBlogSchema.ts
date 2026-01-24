import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateBlogSchema1706000000000 implements MigrationInterface {
  name = 'CreateBlogSchema1706000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create authors table
    await queryRunner.createTable(
      new Table({
        name: 'authors',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'firstName',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'lastName',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'bio',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'avatarUrl',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Create index on author email
    await queryRunner.createIndex(
      'authors',
      new TableIndex({
        name: 'IDX_author_email',
        columnNames: ['email'],
        isUnique: true,
      })
    );

    // Create post_status enum type
    await queryRunner.query(`
      CREATE TYPE "post_status_enum" AS ENUM ('draft', 'published', 'archived')
    `);

    // Create posts table
    await queryRunner.createTable(
      new Table({
        name: 'posts',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '300',
            isUnique: true,
          },
          {
            name: 'excerpt',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'status',
            type: 'post_status_enum',
            default: "'draft'",
          },
          {
            name: 'publishedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'viewCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'authorId',
            type: 'int',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Create indexes on posts
    await queryRunner.createIndex(
      'posts',
      new TableIndex({
        name: 'IDX_post_slug',
        columnNames: ['slug'],
        isUnique: true,
      })
    );

    await queryRunner.createIndex(
      'posts',
      new TableIndex({
        name: 'IDX_post_author',
        columnNames: ['authorId'],
      })
    );

    await queryRunner.createIndex(
      'posts',
      new TableIndex({
        name: 'IDX_post_status',
        columnNames: ['status'],
      })
    );

    await queryRunner.createIndex(
      'posts',
      new TableIndex({
        name: 'IDX_post_published_at',
        columnNames: ['publishedAt'],
      })
    );

    // Create foreign key for posts -> authors
    await queryRunner.createForeignKey(
      'posts',
      new TableForeignKey({
        name: 'FK_post_author',
        columnNames: ['authorId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'authors',
        onDelete: 'CASCADE',
      })
    );

    // Create comments table
    await queryRunner.createTable(
      new Table({
        name: 'comments',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'authorName',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'authorEmail',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'isApproved',
            type: 'boolean',
            default: false,
          },
          {
            name: 'postId',
            type: 'int',
          },
          {
            name: 'parentId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Create indexes on comments
    await queryRunner.createIndex(
      'comments',
      new TableIndex({
        name: 'IDX_comment_post',
        columnNames: ['postId'],
      })
    );

    await queryRunner.createIndex(
      'comments',
      new TableIndex({
        name: 'IDX_comment_parent',
        columnNames: ['parentId'],
      })
    );

    // Create foreign keys for comments
    await queryRunner.createForeignKey(
      'comments',
      new TableForeignKey({
        name: 'FK_comment_post',
        columnNames: ['postId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'posts',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'comments',
      new TableForeignKey({
        name: 'FK_comment_parent',
        columnNames: ['parentId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'comments',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.dropForeignKey('comments', 'FK_comment_parent');
    await queryRunner.dropForeignKey('comments', 'FK_comment_post');
    await queryRunner.dropForeignKey('posts', 'FK_post_author');

    // Drop indexes
    await queryRunner.dropIndex('comments', 'IDX_comment_parent');
    await queryRunner.dropIndex('comments', 'IDX_comment_post');
    await queryRunner.dropIndex('posts', 'IDX_post_published_at');
    await queryRunner.dropIndex('posts', 'IDX_post_status');
    await queryRunner.dropIndex('posts', 'IDX_post_author');
    await queryRunner.dropIndex('posts', 'IDX_post_slug');
    await queryRunner.dropIndex('authors', 'IDX_author_email');

    // Drop tables
    await queryRunner.dropTable('comments');
    await queryRunner.dropTable('posts');
    await queryRunner.dropTable('authors');

    // Drop enum type
    await queryRunner.query(`DROP TYPE "post_status_enum"`);
  }
}

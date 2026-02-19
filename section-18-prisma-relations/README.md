# Section 18: Prisma Relations & Advanced Modeling

## Topics Covered

### 1. One-to-One Relations
- Defining 1:1 relationships
- Required vs optional relations
- Relation fields and scalar fields
- `@relation` attribute

### 2. One-to-Many Relations
- Parent-child relationships
- Foreign key configuration
- Back-relations

### 3. Many-to-Many Relations
- Implicit many-to-many
- Explicit many-to-many with join table
- Additional fields on relations

### 4. Implicit vs Explicit Relations
- When to use implicit relations
- Benefits of explicit join tables
- Migration considerations

### 5. Referential Actions (Cascade, Restrict, SetNull)
- `onDelete` actions
- `onUpdate` actions
- Cascade behavior
- NoAction, Restrict, SetNull, SetDefault

### 6. Self-Referencing Relations
- Tree structures
- Parent-child same model
- Recursive queries

### 7. Polymorphic Relations (Workarounds)
- Prisma limitations
- Union type workarounds
- Multiple relation approach

## Example Schema
```prisma
model User {
  id       String    @id @default(uuid())
  email    String    @unique
  profile  Profile?
  posts    Post[]
  comments Comment[]
}

model Profile {
  id     String @id @default(uuid())
  bio    String
  userId String @unique
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Post {
  id        String    @id @default(uuid())
  title     String
  content   String
  authorId  String
  author    User      @relation(fields: [authorId], references: [id])
  comments  Comment[]
  tags      Tag[]
}

model Comment {
  id       String @id @default(uuid())
  content  String
  postId   String
  post     Post   @relation(fields: [postId], references: [id], onDelete: Cascade)
  authorId String
  author   User   @relation(fields: [authorId], references: [id])
}

model Tag {
  id    String @id @default(uuid())
  name  String @unique
  posts Post[]
}

// Self-referencing relation
model Category {
  id       String     @id @default(uuid())
  name     String
  parentId String?
  parent   Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children Category[] @relation("CategoryHierarchy")
}
```

## Getting Started
```bash
cd section-18-prisma-relations/demo
pnpm install
pnpm prisma db push
```

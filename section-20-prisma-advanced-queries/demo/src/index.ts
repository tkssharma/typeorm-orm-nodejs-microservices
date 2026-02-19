import { PrismaClient, Prisma, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function seedData() {
  // Clean up
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const users = await Promise.all([
    prisma.user.create({ data: { email: 'alice@example.com', name: 'Alice Johnson' } }),
    prisma.user.create({ data: { email: 'bob@example.com', name: 'Bob Smith' } }),
    prisma.user.create({ data: { email: 'charlie@example.com', name: 'Charlie Brown' } }),
  ]);

  // Create products
  const products = await Promise.all([
    prisma.product.create({ data: { name: 'Laptop Pro', price: 1299.99, stock: 50, category: 'Electronics' } }),
    prisma.product.create({ data: { name: 'Wireless Mouse', price: 49.99, stock: 200, category: 'Electronics' } }),
    prisma.product.create({ data: { name: 'USB-C Hub', price: 79.99, stock: 150, category: 'Electronics' } }),
    prisma.product.create({ data: { name: 'Desk Chair', price: 299.99, stock: 30, category: 'Furniture' } }),
    prisma.product.create({ data: { name: 'Standing Desk', price: 599.99, stock: 25, category: 'Furniture' } }),
  ]);

  // Create orders with items
  for (const user of users) {
    for (let i = 0; i < 3; i++) {
      const randomProducts = products.sort(() => Math.random() - 0.5).slice(0, 2);
      const items = randomProducts.map((p) => ({
        productId: p.id,
        quantity: Math.floor(Math.random() * 3) + 1,
        price: p.price,
      }));
      const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

      await prisma.order.create({
        data: {
          userId: user.id,
          status: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'][Math.floor(Math.random() * 4)] as OrderStatus,
          total,
          items: { create: items },
        },
      });
    }
  }

  return { users, products };
}

async function main() {
  console.log('🧮 Prisma Advanced Queries Demo\n');

  const { users, products } = await seedData();
  console.log('✅ Seeded data\n');

  // ============================================
  // 1. AGGREGATIONS
  // ============================================
  console.log('1️⃣ AGGREGATIONS\n');

  // Count
  const orderCount = await prisma.order.count();
  console.log(`Total orders: ${orderCount}`);

  // Count with filter
  const deliveredCount = await prisma.order.count({
    where: { status: 'DELIVERED' },
  });
  console.log(`Delivered orders: ${deliveredCount}`);

  // Aggregate - sum, avg, min, max
  const orderStats = await prisma.order.aggregate({
    _count: { id: true },
    _sum: { total: true },
    _avg: { total: true },
    _min: { total: true },
    _max: { total: true },
  });
  console.log('Order statistics:', orderStats);

  // Product stock stats
  const stockStats = await prisma.product.aggregate({
    _sum: { stock: true },
    _avg: { stock: true },
    _avg: { price: true },
  });
  console.log('Stock statistics:', stockStats);

  // ============================================
  // 2. GROUP BY
  // ============================================
  console.log('\n2️⃣ GROUP BY\n');

  // Group orders by status
  const ordersByStatus = await prisma.order.groupBy({
    by: ['status'],
    _count: { id: true },
    _sum: { total: true },
  });
  console.log('Orders by status:', ordersByStatus);

  // Group products by category
  const productsByCategory = await prisma.product.groupBy({
    by: ['category'],
    _count: { id: true },
    _sum: { stock: true },
    _avg: { price: true },
  });
  console.log('Products by category:', productsByCategory);

  // Group with having clause
  const highValueStatuses = await prisma.order.groupBy({
    by: ['status'],
    _sum: { total: true },
    having: {
      total: { _sum: { gt: 500 } },
    },
  });
  console.log('High value statuses:', highValueStatuses);

  // ============================================
  // 3. NESTED WRITES
  // ============================================
  console.log('\n3️⃣ NESTED WRITES\n');

  // Create order with items in one operation
  const newOrder = await prisma.order.create({
    data: {
      userId: users[0].id,
      total: 1499.98,
      items: {
        create: [
          { productId: products[0].id, quantity: 1, price: products[0].price },
          { productId: products[1].id, quantity: 2, price: products[1].price },
        ],
      },
    },
    include: { items: { include: { product: true } } },
  });
  console.log('Created order with nested items:', newOrder.id);

  // Update with nested operations
  const updatedOrder = await prisma.order.update({
    where: { id: newOrder.id },
    data: {
      status: 'PROCESSING',
      items: {
        create: { productId: products[2].id, quantity: 1, price: products[2].price },
      },
    },
    include: { items: true },
  });
  console.log(`Updated order now has ${updatedOrder.items.length} items`);

  // ============================================
  // 4. TRANSACTIONS
  // ============================================
  console.log('\n4️⃣ TRANSACTIONS\n');

  // Sequential transaction (array of operations)
  const [user, product] = await prisma.$transaction([
    prisma.user.findFirst(),
    prisma.product.findFirst(),
  ]);
  console.log('Sequential transaction result:', { user: user?.name, product: product?.name });

  // Interactive transaction
  const transferResult = await prisma.$transaction(async (tx) => {
    // Decrease stock
    const updatedProduct = await tx.product.update({
      where: { id: products[0].id },
      data: { stock: { decrement: 1 } },
    });

    // Check if stock went negative
    if (updatedProduct.stock < 0) {
      throw new Error('Insufficient stock!');
    }

    // Create order
    const order = await tx.order.create({
      data: {
        userId: users[0].id,
        total: Number(updatedProduct.price),
        items: {
          create: { productId: updatedProduct.id, quantity: 1, price: updatedProduct.price },
        },
      },
    });

    return { order, newStock: updatedProduct.stock };
  });
  console.log('Transaction result:', transferResult);

  // Transaction with isolation level
  const isolatedResult = await prisma.$transaction(
    async (tx) => {
      return tx.order.count();
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 10000,
    }
  );
  console.log('Isolated transaction count:', isolatedResult);

  // ============================================
  // 5. RAW QUERIES
  // ============================================
  console.log('\n5️⃣ RAW QUERIES\n');

  // Raw SELECT query
  const rawUsers = await prisma.$queryRaw<{ id: string; name: string; email: string }[]>`
    SELECT id, name, email FROM "User" LIMIT 3
  `;
  console.log('Raw query users:', rawUsers);

  // Raw query with parameters
  const category = 'Electronics';
  const rawProducts = await prisma.$queryRaw`
    SELECT name, price, stock 
    FROM "Product" 
    WHERE category = ${category}
    ORDER BY price DESC
  `;
  console.log('Raw query products:', rawProducts);

  // Raw aggregate query
  const rawStats = await prisma.$queryRaw`
    SELECT 
      status,
      COUNT(*) as count,
      SUM(total) as total_sum,
      AVG(total) as avg_total
    FROM "Order"
    GROUP BY status
  `;
  console.log('Raw aggregate:', rawStats);

  // Execute raw (for INSERT/UPDATE/DELETE)
  const updateCount = await prisma.$executeRaw`
    UPDATE "Product" 
    SET stock = stock + 10 
    WHERE category = ${category}
  `;
  console.log(`Updated ${updateCount} products`);

  // ============================================
  // 6. COMPLEX FILTERING
  // ============================================
  console.log('\n6️⃣ COMPLEX FILTERING\n');

  // Orders with multiple conditions
  const complexOrders = await prisma.order.findMany({
    where: {
      AND: [
        { status: { in: ['PENDING', 'PROCESSING'] } },
        { total: { gte: 100 } },
        {
          user: {
            email: { contains: '@example.com' },
          },
        },
      ],
    },
    include: {
      user: { select: { name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { total: 'desc' },
    take: 5,
  });
  console.log(`Found ${complexOrders.length} orders matching complex filter`);

  // Relation filters
  const usersWithOrders = await prisma.user.findMany({
    where: {
      orders: {
        some: { status: 'DELIVERED' },
      },
    },
    include: {
      _count: { select: { orders: true } },
    },
  });
  console.log('Users with delivered orders:', usersWithOrders.map((u) => u.name));
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

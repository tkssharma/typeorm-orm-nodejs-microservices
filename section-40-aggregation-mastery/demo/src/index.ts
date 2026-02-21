import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Define schemas
const orderSchema = new mongoose.Schema({
  customerId: mongoose.Schema.Types.ObjectId,
  customerName: String,
  items: [{
    productId: mongoose.Schema.Types.ObjectId,
    productName: String,
    quantity: Number,
    price: Number
  }],
  total: Number,
  status: { type: String, enum: ['pending', 'completed', 'cancelled'] },
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

async function seedData() {
  await Order.deleteMany({});
  
  const orders = [];
  const statuses = ['pending', 'completed', 'cancelled'];
  const products = ['Laptop', 'Phone', 'Tablet', 'Headphones', 'Mouse'];
  
  for (let i = 0; i < 100; i++) {
    const itemCount = Math.floor(Math.random() * 3) + 1;
    const items = [];
    let total = 0;
    
    for (let j = 0; j < itemCount; j++) {
      const price = Math.floor(Math.random() * 500) + 50;
      const quantity = Math.floor(Math.random() * 3) + 1;
      items.push({
        productId: new mongoose.Types.ObjectId(),
        productName: products[Math.floor(Math.random() * products.length)],
        quantity,
        price
      });
      total += price * quantity;
    }
    
    orders.push({
      customerId: new mongoose.Types.ObjectId(),
      customerName: `Customer ${i + 1}`,
      items,
      total,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    });
  }
  
  await Order.insertMany(orders);
  console.log('✅ Seeded 100 orders');
}

async function runAggregations() {
  console.log('\n📊 AGGREGATION EXAMPLES\n');

  // 1. Basic $match and $group
  console.log('1️⃣ Orders by Status:');
  const byStatus = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 }, totalRevenue: { $sum: '$total' } } },
    { $sort: { count: -1 } }
  ]);
  console.table(byStatus);

  // 2. Average order value
  console.log('\n2️⃣ Average Order Value:');
  const avgOrder = await Order.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: null, avgValue: { $avg: '$total' }, totalOrders: { $sum: 1 } } }
  ]);
  console.log(`  Average: $${avgOrder[0]?.avgValue.toFixed(2)} from ${avgOrder[0]?.totalOrders} orders`);

  // 3. Top products by quantity
  console.log('\n3️⃣ Top Products by Quantity Sold:');
  const topProducts = await Order.aggregate([
    { $unwind: '$items' },
    { $group: { _id: '$items.productName', totalQty: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
    { $sort: { totalQty: -1 } },
    { $limit: 5 }
  ]);
  console.table(topProducts);

  // 4. Daily revenue (last 7 days)
  console.log('\n4️⃣ Daily Revenue (Last 7 Days):');
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const dailyRevenue = await Order.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo }, status: 'completed' } },
    { $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      revenue: { $sum: '$total' },
      orders: { $sum: 1 }
    }},
    { $sort: { _id: 1 } }
  ]);
  console.table(dailyRevenue);

  // 5. Multi-facet dashboard
  console.log('\n5️⃣ Dashboard (Multi-Facet):');
  const dashboard = await Order.aggregate([
    { $facet: {
      totalStats: [
        { $group: { _id: null, totalRevenue: { $sum: '$total' }, totalOrders: { $sum: 1 } } }
      ],
      recentOrders: [
        { $sort: { createdAt: -1 } },
        { $limit: 3 },
        { $project: { customerName: 1, total: 1, status: 1 } }
      ],
      statusBreakdown: [
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]
    }}
  ]);
  console.log('Total Stats:', dashboard[0].totalStats[0]);
  console.log('Recent Orders:', dashboard[0].recentOrders);
  console.log('Status Breakdown:', dashboard[0].statusBreakdown);
}

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aggregation_demo');
    console.log('✅ Connected to MongoDB');

    await seedData();
    await runAggregations();

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Connection closed');
  }
}

main();

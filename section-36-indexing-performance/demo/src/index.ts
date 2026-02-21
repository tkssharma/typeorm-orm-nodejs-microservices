import mongoose, { Schema } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Schema with various index types
const productSchema = new Schema({
  sku: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: String,
  brand: String,
  stock: { type: Number, default: 0 },
  tags: [String],
  createdAt: { type: Date, default: Date.now }
});

// Single field index
productSchema.index({ sku: 1 }, { unique: true });

// Compound index (order matters!)
productSchema.index({ category: 1, price: -1 });

// Text index for search
productSchema.index({ name: 'text', description: 'text' });

// Partial index (only index active products)
productSchema.index(
  { brand: 1 },
  { partialFilterExpression: { stock: { $gt: 0 } } }
);

const Product = mongoose.model('Product', productSchema);

async function seedData(count: number) {
  await Product.deleteMany({});
  
  const categories = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports'];
  const brands = ['BrandA', 'BrandB', 'BrandC', 'BrandD', 'BrandE'];
  const products = [];
  
  for (let i = 0; i < count; i++) {
    products.push({
      sku: `SKU-${String(i).padStart(6, '0')}`,
      name: `Product ${i}`,
      description: `Description for product ${i} with various keywords`,
      price: Math.floor(Math.random() * 1000) + 10,
      category: categories[i % 5],
      brand: brands[i % 5],
      stock: Math.floor(Math.random() * 100),
      tags: ['tag1', 'tag2'],
      createdAt: new Date()
    });
  }
  
  await Product.insertMany(products);
  console.log(`✅ Seeded ${count} products\n`);
}

async function explainQuery(name: string, query: any) {
  const explanation = await query.explain('executionStats');
  const stats = explanation.executionStats;
  
  console.log(`📊 ${name}`);
  console.log(`   Stage: ${explanation.queryPlanner.winningPlan.stage}`);
  console.log(`   Docs Examined: ${stats.totalDocsExamined}`);
  console.log(`   Docs Returned: ${stats.nReturned}`);
  console.log(`   Execution Time: ${stats.executionTimeMillis}ms`);
  console.log(`   Index Used: ${stats.totalKeysExamined > 0 ? 'Yes' : 'No (COLLSCAN)'}`);
  console.log('');
}

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/indexing_demo');
    console.log('✅ Connected to MongoDB\n');

    // Seed data
    await seedData(10000);

    // Wait for indexes to be created
    await Product.syncIndexes();
    console.log('📇 Indexes synced\n');

    // List all indexes
    const indexes = await Product.collection.indexes();
    console.log('📋 CURRENT INDEXES:');
    console.log('─'.repeat(50));
    indexes.forEach((idx: any) => {
      console.log(`  ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
    console.log('');

    // ============================================
    // Query Performance Comparisons
    // ============================================
    console.log('⚡ QUERY PERFORMANCE ANALYSIS');
    console.log('─'.repeat(50));

    // 1. Query using unique index (fast)
    await explainQuery(
      'Find by SKU (unique index)',
      Product.find({ sku: 'SKU-005000' })
    );

    // 2. Query using compound index (fast)
    await explainQuery(
      'Find by category + sort by price (compound index)',
      Product.find({ category: 'Electronics' }).sort({ price: -1 }).limit(10)
    );

    // 3. Query without proper index (slower)
    await explainQuery(
      'Find by brand without stock filter (partial index not used)',
      Product.find({ brand: 'BrandA', stock: 0 })
    );

    // 4. Query using partial index
    await explainQuery(
      'Find by brand with stock > 0 (partial index used)',
      Product.find({ brand: 'BrandA', stock: { $gt: 0 } })
    );

    // 5. Text search
    await explainQuery(
      'Text search (text index)',
      Product.find({ $text: { $search: 'product keywords' } }).limit(10)
    );

    // ============================================
    // Index Tips
    // ============================================
    console.log('💡 INDEXING BEST PRACTICES:');
    console.log('─'.repeat(50));
    console.log('1. Create indexes for frequently queried fields');
    console.log('2. Use compound indexes for multi-field queries');
    console.log('3. Follow ESR rule: Equality, Sort, Range');
    console.log('4. Use partial indexes to reduce index size');
    console.log('5. Monitor index usage with explain()');
    console.log('6. Remove unused indexes (they slow down writes)');
    console.log('7. Use covered queries when possible');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Connection closed');
  }
}

main();

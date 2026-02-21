import mongoose, { Schema, Types } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Models
const categorySchema = new Schema({
  name: String,
  slug: String
});
const Category = mongoose.model('Category', categorySchema);

const productSchema = new Schema({
  name: { type: String, required: true, index: 'text' },
  description: { type: String, index: 'text' },
  price: { type: Number, required: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category' },
  tags: [String],
  stock: { type: Number, default: 0 },
  rating: { type: Number, min: 0, max: 5 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});
productSchema.index({ name: 'text', description: 'text' });
const Product = mongoose.model('Product', productSchema);

async function seedData() {
  await Category.deleteMany({});
  await Product.deleteMany({});

  const categories = await Category.insertMany([
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Clothing', slug: 'clothing' },
    { name: 'Books', slug: 'books' }
  ]);

  const products = [];
  const names = ['Laptop', 'Phone', 'Tablet', 'Headphones', 'Watch', 'Camera', 'Speaker', 'Keyboard', 'Mouse', 'Monitor'];
  
  for (let i = 0; i < 50; i++) {
    products.push({
      name: `${names[i % names.length]} ${i + 1}`,
      description: `Description for product ${i + 1}`,
      price: Math.floor(Math.random() * 1000) + 50,
      category: categories[i % 3]._id,
      tags: ['tag1', 'tag2', i % 2 === 0 ? 'sale' : 'new'],
      stock: Math.floor(Math.random() * 100),
      rating: Math.round((Math.random() * 5) * 10) / 10,
      isActive: i % 5 !== 0,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    });
  }
  await Product.insertMany(products);
  console.log('✅ Seeded 50 products\n');
}

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/advanced_queries_demo');
    console.log('✅ Connected to MongoDB\n');

    await seedData();

    // ============================================
    // 1. FILTERING
    // ============================================
    console.log('🔍 FILTERING EXAMPLES');
    console.log('─'.repeat(50));

    // Comparison operators
    const expensive = await Product.find({ price: { $gte: 500 } }).limit(3);
    console.log(`Products >= $500: ${expensive.length} found`);

    // Logical operators
    const filtered = await Product.find({
      $and: [
        { price: { $gte: 100, $lte: 500 } },
        { isActive: true }
      ]
    });
    console.log(`Active products $100-$500: ${filtered.length} found`);

    // $or operator
    const orQuery = await Product.find({
      $or: [
        { price: { $lt: 100 } },
        { rating: { $gte: 4.5 } }
      ]
    });
    console.log(`Cheap OR highly rated: ${orQuery.length} found`);

    // Array operators
    const withSaleTag = await Product.find({ tags: { $in: ['sale'] } });
    console.log(`Products with 'sale' tag: ${withSaleTag.length} found`);

    // Regex
    const laptops = await Product.find({ name: { $regex: /laptop/i } });
    console.log(`Products matching 'laptop': ${laptops.length} found\n`);

    // ============================================
    // 2. PROJECTIONS
    // ============================================
    console.log('📋 PROJECTIONS');
    console.log('─'.repeat(50));

    const projected = await Product.find({})
      .select('name price -_id')
      .limit(3);
    console.log('Select only name & price:', projected);

    const excluded = await Product.find({})
      .select('-description -tags -__v')
      .limit(1);
    console.log('Exclude fields:', Object.keys(excluded[0].toObject()));

    // ============================================
    // 3. SORTING
    // ============================================
    console.log('\n📊 SORTING');
    console.log('─'.repeat(50));

    const byPrice = await Product.find({}).sort({ price: -1 }).limit(3).select('name price');
    console.log('Top 3 by price (desc):', byPrice.map(p => `${p.name}: $${p.price}`));

    const multiSort = await Product.find({}).sort({ rating: -1, price: 1 }).limit(3).select('name rating price');
    console.log('By rating desc, then price asc:', multiSort.map(p => `${p.name}: ⭐${p.rating} $${p.price}`));

    // ============================================
    // 4. PAGINATION
    // ============================================
    console.log('\n📄 PAGINATION');
    console.log('─'.repeat(50));

    const page = 2;
    const limit = 5;
    const skip = (page - 1) * limit;
    
    const total = await Product.countDocuments({ isActive: true });
    const paginated = await Product.find({ isActive: true })
      .skip(skip)
      .limit(limit)
      .select('name price');
    
    console.log(`Page ${page} of ${Math.ceil(total / limit)}: ${paginated.map(p => p.name).join(', ')}`);

    // ============================================
    // 5. POPULATION (Joins)
    // ============================================
    console.log('\n🔗 POPULATION');
    console.log('─'.repeat(50));

    const withCategory = await Product.find({})
      .populate('category', 'name slug')
      .limit(3)
      .select('name category');
    
    withCategory.forEach(p => {
      const cat = p.category as any;
      console.log(`${p.name} -> Category: ${cat?.name}`);
    });

    // ============================================
    // 6. TEXT SEARCH
    // ============================================
    console.log('\n🔎 TEXT SEARCH');
    console.log('─'.repeat(50));

    const searchResults = await Product.find(
      { $text: { $search: 'laptop phone' } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } }).limit(5).select('name');
    
    console.log(`Text search 'laptop phone':`, searchResults.map(p => p.name));

    // ============================================
    // 7. AGGREGATION BASICS
    // ============================================
    console.log('\n📈 AGGREGATION');
    console.log('─'.repeat(50));

    const stats = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: {
        _id: '$category',
        avgPrice: { $avg: '$price' },
        count: { $sum: 1 },
        maxPrice: { $max: '$price' }
      }},
      { $sort: { avgPrice: -1 } }
    ]);
    
    console.log('Stats by category:');
    for (const s of stats) {
      const cat = await Category.findById(s._id);
      console.log(`  ${cat?.name}: ${s.count} products, avg $${s.avgPrice.toFixed(2)}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Connection closed');
  }
}

main();

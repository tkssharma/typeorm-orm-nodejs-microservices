import mongoose, { Schema, Document, Query, Types } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Document with soft delete and audit fields
interface IDocument extends Document {
  title: string;
  content: string;
  version: number;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  history: Array<{
    version: number;
    content: string;
    updatedAt: Date;
    updatedBy: Types.ObjectId;
  }>;
  softDelete(userId: Types.ObjectId): Promise<void>;
  restore(): Promise<void>;
}

const documentSchema = new Schema<IDocument>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  version: { type: Number, default: 1 },
  
  // Soft delete fields
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: Date,
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  
  // Audit fields
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  
  // Version history
  history: [{
    version: Number,
    content: String,
    updatedAt: Date,
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  }]
}, { timestamps: true });

// Auto-exclude soft deleted documents
documentSchema.pre(/^find/, function(this: Query<any, any>) {
  const query = this.getQuery();
  if (query.includeDeleted !== true) {
    this.where({ isDeleted: { $ne: true } });
  }
  delete query.includeDeleted;
});

// Soft delete method
documentSchema.methods.softDelete = async function(userId: Types.ObjectId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  await this.save();
};

// Restore method
documentSchema.methods.restore = async function() {
  this.isDeleted = false;
  this.deletedAt = undefined;
  this.deletedBy = undefined;
  await this.save();
};

// Track version history on update
documentSchema.pre('save', function(next) {
  if (this.isModified('content') && !this.isNew) {
    this.history.push({
      version: this.version,
      content: this.content,
      updatedAt: new Date(),
      updatedBy: this.updatedBy!
    });
    this.version += 1;
  }
  next();
});

const Doc = mongoose.model<IDocument>('Document', documentSchema);

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/soft_deletes_demo');
    console.log('✅ Connected to MongoDB\n');

    await Doc.deleteMany({});

    const userId = new Types.ObjectId();
    const adminId = new Types.ObjectId();

    // ============================================
    // CREATE DOCUMENT WITH AUDIT
    // ============================================
    console.log('📝 CREATE WITH AUDIT');
    console.log('─'.repeat(50));

    const doc = await Doc.create({
      title: 'Important Document',
      content: 'Initial content v1',
      createdBy: userId
    });
    console.log(`Created: "${doc.title}" (v${doc.version})`);
    console.log(`Created by: ${doc.createdBy}`);

    // ============================================
    // UPDATE WITH VERSIONING
    // ============================================
    console.log('\n✏️ UPDATE WITH VERSIONING');
    console.log('─'.repeat(50));

    doc.content = 'Updated content v2';
    doc.updatedBy = adminId;
    await doc.save();
    console.log(`Updated to v${doc.version}`);

    doc.content = 'Latest content v3';
    doc.updatedBy = userId;
    await doc.save();
    console.log(`Updated to v${doc.version}`);

    console.log(`\nVersion History (${doc.history.length} entries):`);
    doc.history.forEach(h => {
      console.log(`  v${h.version}: "${h.content.substring(0, 30)}..."`);
    });

    // ============================================
    // SOFT DELETE
    // ============================================
    console.log('\n🗑️ SOFT DELETE');
    console.log('─'.repeat(50));

    // Create another document to delete
    const toDelete = await Doc.create({
      title: 'Document to Delete',
      content: 'This will be soft deleted',
      createdBy: userId
    });

    await toDelete.softDelete(adminId);
    console.log(`Soft deleted: "${toDelete.title}"`);
    console.log(`Deleted at: ${toDelete.deletedAt}`);
    console.log(`Deleted by: ${toDelete.deletedBy}`);

    // Query - soft deleted excluded by default
    const activeCount = await Doc.countDocuments();
    console.log(`\nActive documents: ${activeCount}`);

    // Query including deleted
    const allCount = await Doc.countDocuments({ includeDeleted: true } as any);
    console.log(`All documents (including deleted): ${allCount}`);

    // ============================================
    // RESTORE
    // ============================================
    console.log('\n♻️ RESTORE DOCUMENT');
    console.log('─'.repeat(50));

    // Find deleted document
    const deleted = await Doc.findOne({ includeDeleted: true, isDeleted: true } as any);
    if (deleted) {
      await deleted.restore();
      console.log(`Restored: "${deleted.title}"`);
      console.log(`isDeleted: ${deleted.isDeleted}`);
    }

    const finalCount = await Doc.countDocuments();
    console.log(`\nFinal active documents: ${finalCount}`);

    // ============================================
    // BEST PRACTICES
    // ============================================
    console.log('\n💡 SOFT DELETE & AUDIT BEST PRACTICES:');
    console.log('─'.repeat(50));
    console.log('1. Always use soft deletes for important data');
    console.log('2. Add deletedAt, deletedBy for audit trail');
    console.log('3. Use query middleware to auto-filter deleted');
    console.log('4. Implement version history for content changes');
    console.log('5. Track createdBy/updatedBy for accountability');
    console.log('6. Consider archiving old deleted records');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Connection closed');
  }
}

main();

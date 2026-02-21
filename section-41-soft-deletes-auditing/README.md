# Section 41: Soft Deletes, Auditing & Versioning

## Topics Covered

### 1. Soft Delete Patterns
- Adding deletedAt field
- Query middleware for filtering
- Restoring deleted documents
- Permanent deletion

### 2. Audit Fields (createdBy, updatedBy)
- Tracking user actions
- Middleware for automatic updates
- Request context handling
- Audit trail best practices

### 3. Versioning Documents
- Document version tracking
- Optimistic locking pattern
- History collection
- Diff tracking

### 4. Data Recovery Strategies
- Trash collection pattern
- Time-based recovery
- Audit log reconstruction
- Backup integration

## Code Examples

### Soft Delete Plugin
```javascript
const softDeletePlugin = (schema) => {
  schema.add({
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  });

  // Filter out soft-deleted by default
  schema.pre(/^find/, function() {
    if (!this.getQuery().includeDeleted) {
      this.where({ deletedAt: null });
    }
  });

  // Soft delete method
  schema.methods.softDelete = async function(userId) {
    this.deletedAt = new Date();
    this.deletedBy = userId;
    return this.save();
  };

  // Restore method
  schema.methods.restore = async function() {
    this.deletedAt = null;
    this.deletedBy = null;
    return this.save();
  };
};
```

### Audit Plugin
```javascript
const auditPlugin = (schema) => {
  schema.add({
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  });

  schema.pre('save', function(next) {
    if (this.isNew && this._userId) {
      this.createdBy = this._userId;
    }
    if (this._userId) {
      this.updatedBy = this._userId;
    }
    next();
  });
};
```

### Version Tracking
```javascript
const versionedSchema = new mongoose.Schema({
  // ... fields
  __v: { type: Number, default: 0 }
});

versionedSchema.pre('save', function(next) {
  if (!this.isNew) {
    this.__v += 1;
  }
  next();
});

// Optimistic locking
versionedSchema.pre('findOneAndUpdate', async function() {
  const doc = await this.model.findOne(this.getQuery());
  if (doc.__v !== this.getUpdate().__v) {
    throw new Error('Document was modified by another process');
  }
});
```

## Demo Project
```bash
cd section-41-soft-deletes-auditing/demo
cp .env.example .env
pnpm install
pnpm dev
```

import mongoose, { Schema, Document, Types } from 'mongoose';

// ============================================
// EMBEDDED DOCUMENTS EXAMPLE
// Good for: One-to-Few relationships, data accessed together
// ============================================

// Address embedded in User (no separate collection)
const addressSchema = new Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, default: 'USA' }
}, { _id: false });

// Order with embedded items (denormalized)
const orderItemSchema = new Schema({
  productId: { type: Types.ObjectId, required: true },
  productName: { type: String, required: true }, // Denormalized for fast access
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 }
}, { _id: false });

export interface IUserEmbedded extends Document {
  name: string;
  email: string;
  addresses: typeof addressSchema[];
}

const userEmbeddedSchema = new Schema<IUserEmbedded>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  addresses: [addressSchema] // Embedded array
}, { timestamps: true });

export const UserEmbedded = mongoose.model<IUserEmbedded>('UserEmbedded', userEmbeddedSchema);

// ============================================
// REFERENCED DOCUMENTS EXAMPLE
// Good for: One-to-Many, Many-to-Many, large/frequently updated data
// ============================================

export interface IAuthor extends Document {
  name: string;
  email: string;
  bio: string;
}

const authorSchema = new Schema<IAuthor>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  bio: { type: String }
}, { timestamps: true });

export const Author = mongoose.model<IAuthor>('Author', authorSchema);

export interface IBook extends Document {
  title: string;
  isbn: string;
  author: Types.ObjectId; // Reference to Author
  genres: string[];
  publishedYear: number;
}

const bookSchema = new Schema<IBook>({
  title: { type: String, required: true },
  isbn: { type: String, required: true, unique: true },
  author: { type: Schema.Types.ObjectId, ref: 'Author', required: true },
  genres: [{ type: String }],
  publishedYear: { type: Number }
}, { timestamps: true });

export const Book = mongoose.model<IBook>('Book', bookSchema);

// ============================================
// HYBRID APPROACH: Order with embedded items + referenced customer
// ============================================

export interface ICustomer extends Document {
  name: string;
  email: string;
  phone: string;
}

const customerSchema = new Schema<ICustomer>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String }
}, { timestamps: true });

export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);

export interface IOrder extends Document {
  orderNumber: string;
  customer: Types.ObjectId; // Referenced
  items: Array<{
    productId: Types.ObjectId;
    productName: string;
    price: number;
    quantity: number;
  }>; // Embedded
  total: number;
  status: string;
}

const orderSchema = new Schema<IOrder>({
  orderNumber: { type: String, required: true, unique: true },
  customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  items: [orderItemSchema], // Embedded for fast access
  total: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  }
}, { timestamps: true });

export const Order = mongoose.model<IOrder>('Order', orderSchema);

// ============================================
// MANY-TO-MANY: Students and Courses
// ============================================

export interface ICourse extends Document {
  name: string;
  code: string;
  credits: number;
  students: Types.ObjectId[];
}

const courseSchema = new Schema<ICourse>({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  credits: { type: Number, required: true },
  students: [{ type: Schema.Types.ObjectId, ref: 'Student' }]
}, { timestamps: true });

export const Course = mongoose.model<ICourse>('Course', courseSchema);

export interface IStudent extends Document {
  name: string;
  studentId: string;
  enrolledCourses: Types.ObjectId[];
}

const studentSchema = new Schema<IStudent>({
  name: { type: String, required: true },
  studentId: { type: String, required: true, unique: true },
  enrolledCourses: [{ type: Schema.Types.ObjectId, ref: 'Course' }]
}, { timestamps: true });

export const Student = mongoose.model<IStudent>('Student', studentSchema);

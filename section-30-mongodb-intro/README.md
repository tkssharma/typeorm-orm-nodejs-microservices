# Section 30: Course Introduction - MongoDB with Node.js

## Topics Covered

### 1. Welcome & Course Goals

- What you will learn in this course
- MongoDB's role in modern backend development
- Course structure and learning path

### 2. What You Will Build

- Real-world MongoDB-backed APIs
- Production-grade backend applications
- Practical projects throughout the course

### 3. How MongoDB Fits in Modern Backends

- MongoDB in the MERN/MEAN stack
- When to choose MongoDB over SQL databases
- Real-world use cases (e-commerce, social media, IoT, etc.)

### 4. Tools & Setup

- Node.js installation and verification
- MongoDB via Docker (recommended)
- MongoDB Atlas account setup (cloud alternative)
- MongoDB Compass installation
- VS Code extensions for MongoDB

## Prerequisites

- Basic JavaScript knowledge
- Node.js fundamentals
- Docker installed (for local MongoDB)
- No prior MongoDB experience required

---

## 🐳 MongoDB Docker Setup (Recommended)

We use Docker to run MongoDB locally. This provides a consistent environment across all demos.

### Quick Start

```bash
# From the project root directory
docker-compose -f docker-compose.mongodb.yml up -d
```

### Connection Details

| Setting                         | Value                                         |
| ------------------------------- | --------------------------------------------- |
| **Host**                        | `localhost`                                   |
| **Port**                        | `27017`                                       |
| **Username**                    | `admin`                                       |
| **Password**                    | `password123`                                 |
| **Connection String**           | `mongodb://admin:password123@localhost:27017` |
| **Connection String (no auth)** | `mongodb://localhost:27017`                   |

### MongoDB Admin UI

Access MongoDB Express (web UI) at: **http://localhost:8081**

- Username: `admin`
- Password: `admin123`

### Docker Commands

```bash
# Start MongoDB
docker-compose -f docker-compose.mongodb.yml up -d

# Stop MongoDB
docker-compose -f docker-compose.mongodb.yml down

# View logs
docker-compose -f docker-compose.mongodb.yml logs -f mongodb

# Reset data (delete volumes)
docker-compose -f docker-compose.mongodb.yml down -v
```

### Verify Connection

```bash
# Using mongosh (if installed)
mongosh "mongodb://admin:password123@localhost:27017"

# Or check container status
docker ps | grep mongodb
```

---

## Alternative: MongoDB Atlas (Cloud)

If you prefer cloud MongoDB:

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get your connection string
4. Replace `MONGODB_URI` in `.env` files

---

## Environment Variables

All demo projects use this `.env` format:

```env
# Local Docker MongoDB
MONGODB_URI=mongodb://admin:password123@localhost:27017/your_database?authSource=admin

# Or without auth (simpler for demos)
MONGODB_URI=mongodb://localhost:27017/your_database

# Or MongoDB Atlas
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/your_database
```

---

## Running Demo Projects

```bash
# 1. Start MongoDB
docker-compose -f docker-compose.mongodb.yml up -d

# 2. Go to any section demo
cd section-33-mongoose-essentials/demo

# 3. Copy environment file
cp .env.example .env

# 4. Install dependencies
pnpm install

# 5. Run the demo
pnpm dev
```

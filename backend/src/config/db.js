const mongoose = require('mongoose');

let isMemoryServer = false;
let memoryServerInstance = null;

// Cache connection globally across serverless function invocations (standard Vercel pattern)
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI;
  const isVercel = !!process.env.VERCEL || process.env.NODE_ENV === 'production';

  // If no URI or in local test environment without Atlas
  if (!uri || uri.includes('cluster0.mongodb.net') && !process.env.VERCEL) {
    if (!isVercel) {
      return await startMemoryServer('MONGODB_URI not provided or placeholder used in development');
    }
  }

  if (!uri) {
    throw new Error('MONGODB_URI is not set in environment variables. Please add MONGODB_URI in Vercel Project Settings.');
  }

  if (!cached.promise) {
    console.log('[DB] Connecting to MongoDB...');
    cached.promise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      bufferCommands: false // Do not buffer queries if connection is down
    }).then((m) => {
      console.log(`[DB] Successfully connected to MongoDB at ${m.connection.host}/${m.connection.name}`);
      isMemoryServer = false;
      return m;
    }).catch(async (err) => {
      cached.promise = null;
      console.error(`[DB] Direct connection to provided MONGODB_URI failed: ${err.message}`);

      // In local development only, fallback to in-memory server
      if (!isVercel && process.env.NODE_ENV !== 'production') {
        console.log('[DB] Initializing In-Memory MongoDB instance for local development...');
        return await startMemoryServer(`Fallback due to: ${err.message}`);
      }

      throw new Error(`MongoDB connection failed: ${err.message}. Ensure MONGODB_URI is correct in Vercel and 0.0.0.0/0 is added in MongoDB Atlas Network Access.`);
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
}

async function startMemoryServer(reason) {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServerInstance = await MongoMemoryServer.create();
    const memUri = memoryServerInstance.getUri();
    await mongoose.connect(memUri);
    isMemoryServer = true;
    console.log(`[DB] Connected to MongoDB Memory Server: ${memUri} (${reason})`);
    return mongoose;
  } catch (memErr) {
    console.error('[DB] Failed to start MongoDB Memory Server:', memErr.message);
    throw memErr;
  }
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServerInstance) {
    await memoryServerInstance.stop();
  }
}

function getDatabaseStatus() {
  const readyStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  return {
    state: readyStateMap[mongoose.connection.readyState] || 'unknown',
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || 'none',
    database: mongoose.connection.name || 'none',
    isMemoryDb: isMemoryServer
  };
}

module.exports = {
  connectDB,
  disconnectDB,
  getDatabaseStatus
};

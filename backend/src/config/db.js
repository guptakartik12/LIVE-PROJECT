const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      console.log('No MONGODB_URI provided in .env, initializing embedded MongoDB Memory Server...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongodInstance = await MongoMemoryServer.create({
          instance: {
            dbName: 'parkease'
          }
        });
        mongoUri = mongodInstance.getUri();
        console.log(`Embedded MongoDB Memory Server started successfully at: ${mongoUri}`);
      } catch (err) {
        console.error('Failed to start MongoMemoryServer, falling back to localhost:27017/parkease', err.message);
        mongoUri = 'mongodb://127.0.0.1:27017/parkease';
      }
    }

    const conn = await mongoose.connect(mongoUri, {
      autoIndex: true
    });

    console.log(`MongoDB Connected: ${conn.connection.host} (Database: ${conn.connection.name})`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // If external URI failed, try in-memory server as resilient fallback
    if (!mongodInstance) {
      try {
        console.log('Attempting fallback to embedded MongoDB Memory Server...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongodInstance = await MongoMemoryServer.create({
          instance: { dbName: 'parkease' }
        });
        const fallbackUri = mongodInstance.getUri();
        const conn = await mongoose.connect(fallbackUri);
        console.log(`Fallback Embedded MongoDB Connected: ${conn.connection.host}`);
        return conn;
      } catch (fallbackErr) {
        console.error('Embedded fallback failed:', fallbackErr.message);
      }
    }
    process.exit(1);
  }
};

module.exports = connectDB;

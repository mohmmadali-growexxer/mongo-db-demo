const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './config.env' });

const { MONGODB_URI, DB_NAME, COLLECTION_NAME } = process.env;

/* ========= Pretty Console Helpers ========= */
const divider = () => console.log('\n' + '═'.repeat(80));
const section = (title) => {
  divider();
  console.log(`📌  ${title.toUpperCase()}`);
  divider();
};
const success = (msg) => console.log(`✅ ${msg}`);
const info = (msg) => console.log(`ℹ️  ${msg}`);
const warn = (msg) => console.log(`⚠️  ${msg}`);
const errorLog = (msg, err) => {
  console.error(`❌ ${msg}`);
  if (err) console.error(err);
};
/* ========================================= */

class MongoDemo {
  constructor() {
    this.client = null;
    this.db = null;
    this.collection = null;
  }

  async connect() {
    try {
      section('Connecting to MongoDB');
      info('Initializing MongoDB client...');
      this.client = new MongoClient(MONGODB_URI);
      await this.client.connect();

      success('Successfully connected to MongoDB');
      this.db = this.client.db(DB_NAME);
      this.collection = this.db.collection(COLLECTION_NAME);

      info(`Database in use   : ${DB_NAME}`);
      info(`Collection in use : ${COLLECTION_NAME}`);
    } catch (error) {
      errorLog('Failed to connect to MongoDB', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      success('MongoDB connection closed safely');
    }
  }

  async createIndexes() {
    section('Creating Indexes');
    info('Indexes improve search performance and enforce rules like unique emails');

    try {
      await this.collection.createIndex({ email: 1 }, { unique: true });
      await this.collection.createIndex({ age: 1 });
      await this.collection.createIndex({ 'address.city': 1 });
      await this.collection.createIndex({ location: '2dsphere' });

      success('All indexes created successfully');
      info('Unique index on email');
      info('Index on age');
      info('Index on address.city');
      info('Geospatial index on location');
    } catch (error) {
      errorLog('Index creation failed', error);
    }
  }

  async insertDocuments() {
    section('Inserting Sample Users');
    info('Adding demo users into the database');

    try {
      const singleUser = {
        name: 'Emma Wilson',
        email: 'emma.wilson@example.com',
        age: 29,
        address: {
          street: '12 River Lane',
          city: 'Seattle',
          zipCode: '98101'
        },
        location: {
          type: 'Point',
          coordinates: [-122.3321, 47.6062]
        },
        hobbies: ['journaling', 'cycling'],
        createdAt: new Date()
      };

      const result = await this.collection.insertOne(singleUser);
      success('Inserted 1 main user');
      info(`User ID: ${result.insertedId}`);

      const multipleUsers = [
        {
          name: 'Liam Carter',
          email: 'liam.carter@example.com',
          age: 24,
          address: {
            street: '88 Sunset Blvd',
            city: 'San Diego',
            zipCode: '92101'
          },
          location: {
            type: 'Point',
            coordinates: [-117.1611, 32.7157]
          },
          hobbies: ['surfing', 'photography'],
          createdAt: new Date()
        },
        {
          name: 'Sophia Patel',
          email: 'sophia.patel@example.com',
          age: 34,
          address: {
            street: '401 Market St',
            city: 'San Francisco',
            zipCode: '94103'
          },
          location: {
            type: 'Point',
            coordinates: [-122.4194, 37.7749]
          },
          hobbies: ['yoga', 'cooking'],
          createdAt: new Date()
        },
        {
          name: 'Noah Kim',
          email: 'noah.kim@example.com',
          age: 27,
          address: {
            street: '9 Lake View',
            city: 'Denver',
            zipCode: '80201'
          },
          location: {
            type: 'Point',
            coordinates: [-104.9903, 39.7392]
          },
          hobbies: ['hiking', 'gaming'],
          createdAt: new Date()
        }
      ];

      const bulkResult = await this.collection.insertMany(multipleUsers);
      success('Inserted additional users');

      console.table(
        Object.values(bulkResult.insertedIds).map((id, i) => ({
          No: i + 1,
          InsertedID: id.toString()
        }))
      );
    } catch (error) {
      errorLog('Error while inserting documents', error);
      throw error;
    }
  }

  async readDocuments() {
    section('Reading Data from Database');
    info('Fetching users using different query examples');

    try {
      const allUsers = await this.collection.find({}).toArray();
      const youngUsers = await this.collection.find({ age: { $lt: 30 } }).toArray();
      const basicInfo = await this.collection.find(
        {},
        { projection: { name: 1, email: 1, _id: 0 } }
      ).toArray();

      success(`Total users found: ${allUsers.length}`);
      success(`Users younger than 30: ${youngUsers.length}`);

      console.log('\n📇 Basic User Information');
      console.table(basicInfo);
    } catch (error) {
      errorLog('Failed while reading data', error);
      throw error;
    }
  }

  async updateDocuments() {
    section('Updating Existing Users');
    info('Modifying user data using update operations');

    try {
      const updateResult = await this.collection.updateOne(
        { email: 'emma.wilson@example.com' },
        {
          $set: {
            age: 30,
            updatedAt: new Date()
          },
          $push: { hobbies: 'meditation' }
        }
      );

      success(`Updated Emma Wilson (${updateResult.modifiedCount} document)`);

      const bulkUpdate = await this.collection.updateMany(
        { age: { $lt: 30 } },
        { $set: { group: 'young-adults' } }
      );

      success(`Tagged ${bulkUpdate.modifiedCount} users as young-adults`);
    } catch (error) {
      errorLog('Update operation failed', error);
      throw error;
    }
  }

  async runAggregation() {
    section('Running Aggregation');
    info('Grouping users by city and calculating statistics');

    try {
      const result = await this.collection.aggregate([
        { $group: {
          _id: '$address.city',
          totalUsers: { $sum: 1 },
          averageAge: { $avg: '$age' }
        }},
        { $sort: { totalUsers: -1 } }
      ]).toArray();

      console.table(
        result.map(r => ({
          City: r._id,
          Users: r.totalUsers,
          AvgAge: r.averageAge.toFixed(1)
        }))
      );
    } catch (error) {
      errorLog('Aggregation failed', error);
    }
  }

  async deleteDocuments() {
    section('Deleting Demo Data');
    info('Cleaning up users created during this demo');

    try {
      const result = await this.collection.deleteMany({ group: 'young-adults' });
      warn(`Deleted ${result.deletedCount} users from young-adults group`);
    } catch (error) {
      errorLog('Delete operation failed', error);
    }
  }

  async runDemo() {
    section('MongoDB Demo Started 🚀');

    try {
      await this.connect();

      warn('Removing any existing demo data');
      await this.collection.deleteMany({});

      await this.createIndexes();
      await this.insertDocuments();
      await this.readDocuments();
      await this.updateDocuments();
      await this.runAggregation();
      await this.deleteDocuments();

      const finalCount = await this.collection.countDocuments();
      success(`Final number of users in collection: ${finalCount}`);
      success('Demo completed successfully 🎉');
    } catch (error) {
      errorLog('Demo execution failed', error);
    } finally {
      await this.disconnect();
    }
  }
}

if (require.main === module) {
  const demo = new MongoDemo();
  demo.runDemo();
}

module.exports = MongoDemo;

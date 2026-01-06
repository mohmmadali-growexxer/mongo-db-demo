const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './config.env' });

const { MONGODB_URI, DB_NAME, COLLECTION_NAME } = process.env;

/* ========= Pretty Console Helpers ========= */
const divider = () => console.log('\n' + '═'.repeat(70));
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
      this.client = new MongoClient(MONGODB_URI);
      await this.client.connect();

      success('Connected to MongoDB');
      this.db = this.client.db(DB_NAME);
      this.collection = this.db.collection(COLLECTION_NAME);

      info(`Database   : ${DB_NAME}`);
      info(`Collection : ${COLLECTION_NAME}`);
    } catch (error) {
      errorLog('Connection error', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      success('Disconnected from MongoDB');
    }
  }

  async createIndexes() {
    section('Index Creation');
    try {
      await this.collection.createIndex({ email: 1 }, { unique: true });
      await this.collection.createIndex({ age: 1 });
      await this.collection.createIndex({ 'address.city': 1 });
      await this.collection.createIndex({ location: '2dsphere' });

      success('Indexes created successfully');
      info('email (unique)');
      info('age');
      info('address.city');
      info('location (2dsphere)');
    } catch (error) {
      errorLog('Index creation failed', error);
    }
  }

  async insertDocuments() {
    section('Insert Documents');
    try {
      const singleUser = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        address: {
          street: '123 Main St',
          city: 'New York',
          zipCode: '10001'
        },
        location: {
          type: 'Point',
          coordinates: [-74.006, 40.7128]
        },
        hobbies: ['reading', 'swimming'],
        createdAt: new Date()
      };

      const result = await this.collection.insertOne(singleUser);
      success('Single user inserted');
      info(`ID: ${result.insertedId}`);

      const multipleUsers = [
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          age: 25,
          address: {
            street: '456 Oak Ave',
            city: 'Los Angeles',
            zipCode: '90210'
          },
          location: {
            type: 'Point',
            coordinates: [-118.2437, 34.0522]
          },
          hobbies: ['painting', 'hiking'],
          createdAt: new Date()
        },
        {
          name: 'Bob Johnson',
          email: 'bob@example.com',
          age: 35,
          address: {
            street: '789 Pine Rd',
            city: 'Chicago',
            zipCode: '60601'
          },
          location: {
            type: 'Point',
            coordinates: [-87.6298, 41.8781]
          },
          hobbies: ['cooking', 'traveling'],
          createdAt: new Date()
        },
        {
          name: 'Alice Brown',
          email: 'alice@example.com',
          age: 28,
          address: {
            street: '321 Elm St',
            city: 'Boston',
            zipCode: '02101'
          },
          location: {
            type: 'Point',
            coordinates: [-71.0589, 42.3601]
          },
          hobbies: ['photography', 'yoga'],
          createdAt: new Date()
        }
      ];

      const bulkResult = await this.collection.insertMany(multipleUsers);
      success('Multiple users inserted');

      console.table(
        Object.values(bulkResult.insertedIds).map((id, i) => ({
          No: i + 1,
          InsertedID: id.toString()
        }))
      );
    } catch (error) {
      errorLog('Insert error', error);
      throw error;
    }
  }

  async readDocuments() {
    section('Read Documents');
    try {
      const allUsers = await this.collection.find({}).toArray();
      const youngUsers = await this.collection.find({ age: { $lt: 30 } }).toArray();
      const userNames = await this.collection
        .find({}, { projection: { name: 1, email: 1, _id: 0 } })
        .toArray();
      const oneUser = await this.collection.findOne({ name: 'John Doe' });
      const cityUsers = await this.collection.find({
        'address.city': { $in: ['New York', 'Los Angeles'] },
        age: { $gte: 25 }
      }).toArray();
      const totalCount = await this.collection.countDocuments();

      success(`Total users: ${allUsers.length}`);
      success(`Users under 30: ${youngUsers.length}`);
      success(`Users in NY/LA (25+): ${cityUsers.length}`);
      info(`Lookup result: ${oneUser ? oneUser.name : 'Not Found'}`);
      info(`Document count: ${totalCount}`);

      console.log('\n📇 Names & Emails');
      console.table(userNames);
    } catch (error) {
      errorLog('Read error', error);
      throw error;
    }
  }

  async updateDocuments() {
    section('Update Documents');
    try {
      const updateResult = await this.collection.updateOne(
        { email: 'john@example.com' },
        {
          $set: {
            age: 31,
            'address.zipCode': '10002',
            updatedAt: new Date()
          },
          $push: { hobbies: 'gaming' }
        }
      );

      success(`Updated John Doe (${updateResult.modifiedCount})`);

      const bulkUpdateResult = await this.collection.updateMany(
        { age: { $lt: 30 } },
        {
          $set: {
            category: 'young',
            updatedAt: new Date()
          }
        }
      );

      success(`Bulk updated users (${bulkUpdateResult.modifiedCount})`);

      const upsertResult = await this.collection.updateOne(
        { email: 'newuser@example.com' },
        {
          $set: {
            name: 'New User',
            age: 22,
            address: {
              street: '999 New St',
              city: 'Miami',
              zipCode: '33101'
            },
            location: {
              type: 'Point',
              coordinates: [-80.1918, 25.7617]
            },
            hobbies: ['surfing'],
            createdAt: new Date()
          }
        },
        { upsert: true }
      );

      success(
        upsertResult.upsertedId
          ? 'New user created via upsert'
          : 'Existing user updated'
      );
    } catch (error) {
      errorLog('Update error', error);
      throw error;
    }
  }

  async runAggregation() {
    section('Aggregation');
    try {
      const pipeline = [
        { $match: { age: { $gt: 25 } } },
        {
          $group: {
            _id: '$address.city',
            count: { $sum: 1 },
            avgAge: { $avg: '$age' },
            users: { $push: '$name' }
          }
        },
        { $sort: { count: -1 } }
      ];

      const result = await this.collection.aggregate(pipeline).toArray();

      console.table(
        result.map(r => ({
          City: r._id,
          Users: r.count,
          AvgAge: r.avgAge.toFixed(1),
          Names: r.users.join(', ')
        }))
      );
    } catch (error) {
      errorLog('Aggregation error', error);
    }
  }

  async runGeospatialQueries() {
    section('Geospatial Queries');
    try {
      const nyc = [-74.006, 40.7128];

      const nearbyUsers = await this.collection.find({
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: nyc },
            $maxDistance: 1000000
          }
        }
      }).toArray();

      success(`Users within 1000km of NYC: ${nearbyUsers.length}`);
      console.table(nearbyUsers.map(u => ({
        Name: u.name,
        City: u.address.city
      })));

      const usersWithDistance = await this.collection.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: nyc },
            distanceField: 'distanceFromNYC',
            spherical: true,
            distanceMultiplier: 0.001
          }
        },
        {
          $project: {
            name: 1,
            city: '$address.city',
            distanceFromNYC: { $round: ['$distanceFromNYC', 2] }
          }
        }
      ]).toArray();

      console.log('\n📏 Distance from NYC (km)');
      console.table(usersWithDistance);
    } catch (error) {
      errorLog('Geospatial error', error);
    }
  }

  async deleteDocuments() {
    section('Delete Documents');
    try {
      const single = await this.collection.deleteOne({ email: 'newuser@example.com' });
      const bulk = await this.collection.deleteMany({ category: 'young' });

      warn(`Single deleted: ${single.deletedCount}`);
      warn(`Bulk deleted: ${bulk.deletedCount}`);
    } catch (error) {
      errorLog('Delete error', error);
    }
  }

  async runDemo() {
    section('MongoDB Demo Started 🚀');
    try {
      await this.connect();

      await this.collection.deleteMany({});
      warn('Cleared existing documents');

      await this.createIndexes();
      await this.insertDocuments();
      await this.readDocuments();
      await this.updateDocuments();
      await this.runAggregation();
      await this.runGeospatialQueries();
      await this.deleteDocuments();

      const finalCount = await this.collection.countDocuments();
      success(`Final document count: ${finalCount}`);
      success('Demo completed successfully 🎉');
    } catch (error) {
      errorLog('Demo failed', error);
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
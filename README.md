# MongoDB Demo

A comprehensive JavaScript demo covering MongoDB basic and intermediate concepts using the MongoDB Node.js driver.

## Features

- **Connection Management**: Connect to MongoDB with proper error handling
- **Document Operations**: Insert, read, update, and delete documents
- **Indexing**: Create indexes for better query performance
- **Aggregation**: Basic aggregation pipeline examples
- **Environment Configuration**: Use config file for database settings
- **Clean Code**: Simple, readable implementation without unnecessary complexity

## Prerequisites

- Node.js (v14 or higher)
- MongoDB running locally or accessible via connection string

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure database connection in `config.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017
   DB_NAME=mongo_demo
   COLLECTION_NAME=users
   ```

3. Ensure MongoDB is running on your system

## Usage

Run the demo:
```bash
npm start
```

Or run with watch mode for development:
```bash
npm run dev
```

## What the Demo Covers

### Geospatial Features
- **2dsphere indexes** for location-based queries
- **GeoJSON Point objects** with longitude/latitude coordinates
- **$near queries** to find users within specific distances
- **$geoWithin queries** to find users in geographic polygons
- **$geoNear aggregation** to calculate distances and sort by proximity
- **Real-world coordinates** for major US cities (NYC, LA, Chicago, Boston, Miami)

### Basic Operations
- Connecting to MongoDB
- Creating databases and collections
- Inserting single and multiple documents
- Reading documents with filters and projections
- Updating documents (single, multiple, upsert)
- Deleting documents

### Intermediate Concepts
- Creating indexes for performance
- Basic aggregation pipelines
- Complex queries with operators
- **Geospatial operations and queries**
- Error handling and connection management

### MongoDB Operators Used
- `$set`, `$push` for updates
- `$lt`, `$gte`, `$in` for queries
- `$sum`, `$avg`, `$push` for aggregation
- **`$near`, `$geoWithin`, `$geoNear` for geospatial queries**
- Projection and sorting options

## Project Structure

```
mongo-db-demo/
├── demo.js          # Main demo script
├── config.env       # Database configuration
├── package.json     # Dependencies and scripts
└── README.md        # This file
```

## Customization

Modify the `config.env` file to point to your MongoDB instance. The demo will create a new database and collection as specified in the configuration. 
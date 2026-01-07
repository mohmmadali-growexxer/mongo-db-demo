require('dotenv').config({ path: './config.env' });
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');

const { MONGODB_URI, DB_NAME } = process.env;
const USERS_COLLECTION = process.env.COLLECTION_NAME || 'users';
const POSTS_COLLECTION = 'posts';

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let db, users, posts;

async function mongoConnect() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(DB_NAME);
  users = db.collection(USERS_COLLECTION);
  posts = db.collection(POSTS_COLLECTION);
}

// Seed test data if collections are empty (on first startup)
(async () => {
  await mongoConnect();
  if (await posts.countDocuments() === 0) {
    const userList = await users.find({}).toArray();
    if (userList.length) {
      await posts.insertMany([
        { title: 'Hello from Emma', body: 'Emma post content', userId: userList[0]._id },
        { title: 'Liam on the Beach', body: 'Surfing diary', userId: userList[1]?._id },
        { title: 'Sophia’s Cooking', body: 'Today I made pasta', userId: userList[2]?._id },
        { title: 'Noah’s Hike', body: 'Reached mountain top!', userId: userList[3]?._id },
      ]);
    }
  }
})();

// API: Get all users, with posts
app.get('/api/users', async (req, res) => {
  const usersList = await users.find({}).toArray();
  const postsList = await posts.find({}).toArray();
  const usersWithPosts = usersList.map(u => ({
    ...u,
    posts: postsList.filter(p => p.userId && u._id && p.userId.equals(u._id)),
  }));
  res.json(usersWithPosts);
});

// API: Get all posts, with user info
app.get('/api/posts', async (req, res) => {
  const postsList = await posts.find({}).toArray();
  const usersList = await users.find({}).toArray();
  const postsWithUser = postsList.map(p => ({
    ...p,
    user: usersList.find(u => u._id && p.userId && u._id.equals(p.userId)),
  }));
  res.json(postsWithUser);
});

// API: Add user (robust, normalized email)
app.post('/api/users', async (req, res) => {
  let { name, email = '', age, street, city, zipCode } = req.body;
  try {
    // Normalize email
    email = email.trim().toLowerCase();
    const exists = await users.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already exists' });
    // Build address from both possible sources
    let address = {};
    if (street || city || zipCode) {
        address = {
          street: street || '',
          city: city || '',
        zipCode: zipCode || ''
      };
    } else {
      address = {
        street: address.street || '',
        city: address.city || '',
        zipCode: address.zipCode || ''
      };
    }
    const user = {
      name,
      email,
      age: +age,
      address
    };
    const result = await users.insertOne(user);
    user._id = result.insertedId;
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ error: 'Failed to add user' });
  }
});

// API: Add post (AJAX from UI)
app.post('/api/posts', async (req, res) => {
  const { userId, title, body } = req.body;
  if (!userId || !title || !body) return res.status(400).json({ error: 'Missing fields' });
  try {
    const user = await users.findOne({ _id: ObjectId.createFromHexString(userId) });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const result = await posts.insertOne({ userId: user._id, title, body });
    res.json({ success: true, id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// API: Delete post (AJAX from UI)
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const result = await posts.deleteOne({ _id: ObjectId.createFromHexString(req.params.id) });
    if (result.deletedCount) res.json({ success: true });
    else res.status(404).json({ error: 'Not found' });
  } catch (err) {
    res.status(400).json({ error: 'Invalid ID' });
  }
});
// API: Assign post to user
app.patch('/api/posts/:id/assign', async (req, res) => {
  const postId = req.params.id;
  const { userId } = req.body;
  try {
    const user = await users.findOne({ _id: ObjectId.createFromHexString(userId) });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const result = await posts.updateOne(
      { _id: ObjectId.createFromHexString(postId) },
      { $set: { userId: user._id } }
    );
    if (result.modifiedCount === 1) res.json({ success: true });
    else res.status(404).json({ error: 'Post not found or not changed' });
  } catch (err) {
    res.status(400).json({ error: 'Invalid ID or bad data' });
  }
});

// UI: Home - List users and their posts
app.get('/', async (req, res) => {
  const usersList = await users.find({}).toArray();
  const postsList = await posts.find({}).toArray();
  const usersWithPosts = usersList.map(u => ({
    ...u,
    posts: postsList.filter(p => p.userId && u._id && p.userId.equals(u._id)),
  }));
  res.render('index', { users: usersWithPosts });
});
// UI: Users page
app.get('/users', async (req, res) => {
  const usersList = await users.find({}).toArray();
  const postsList = await posts.find({}).toArray();
  const usersWithPosts = usersList.map(u => ({
    ...u,
    posts: postsList.filter(p => p.userId && u._id && p.userId.equals(u._id)),
  }));
  res.render('users', { users: usersWithPosts });
});
// UI: Posts page
app.get('/posts', async (req, res) => {
  const postsList = await posts.find({}).toArray();
  const usersList = await users.find({}).toArray();
  const postsWithUser = postsList.map(post => {
    let foundUser = usersList.find(u => u._id && post.userId && u._id.equals(post.userId));
    return { ...post, userName: foundUser ? foundUser.name : undefined };
  });
  res.render('posts', { posts: postsWithUser, users: usersList });
});

const PORT = process.env.PORT || 3000;
mongoConnect().then(() => {
  app.listen(PORT, () => {
    console.log(`Express server running: http://localhost:${PORT}`);
  });
});

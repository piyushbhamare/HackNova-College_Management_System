const { MongoClient } = require('mongodb');

async function run() {
  const uri = 'mongodb+srv://piyushbhamare04:R2PSRaZshtGwWA8u@college-cluster.753my.mongodb.net/college?retryWrites=true&w=majority&appName=college-cluster';
  console.log('Using URI:', uri);
  const client = new MongoClient(uri, { connectTimeoutMS: 30000, serverSelectionTimeoutMS: 30000 });

  try {
    console.log('Attempting to connect...');
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    const db = client.db('college');
    console.log('Database selected:', db.databaseName);

    const result = await db.collection('classes').insertMany([
      {
        _id: 'Class101',
        name: 'CS101',
        course: 'Computer Science',
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-06-30T00:00:00Z',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      },
      {
        _id: 'Class102',
        name: 'CS102',
        course: 'Computer Science Advanced',
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-06-30T00:00:00Z',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      },
      {
        _id: 'Class103',
        name: 'MATH101',
        course: 'Mathematics',
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-06-30T00:00:00Z',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      },
    ]);
    console.log('Inserted Classes with _ids:', result.insertedIds);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
    console.log('Connection closed');
  }
}

run().catch(console.dir);
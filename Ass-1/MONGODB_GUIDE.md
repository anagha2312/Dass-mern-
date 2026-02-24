# MONGODB SETUP & OPERATIONS GUIDE

## Table of Contents

1. [Installation](#installation)
2. [Starting MongoDB](#starting-mongodb)
3. [Connecting to MongoDB](#connecting-to-mongodb)
4. [Database Operations](#database-operations)
5. [Monitoring CRUD Operations](#monitoring-crud-operations)
6. [Troubleshooting](#troubleshooting)

---

## Installation

### Windows

1. **Download MongoDB Community Server**
   - Go to: https://www.mongodb.com/try/download/community
   - Select: Windows, MSI package
   - Download the latest version

2. **Install MongoDB**

   ```
   - Run the .msi installer
   - Choose "Complete" installation
   - Install MongoDB as a Windows Service (recommended)
   - Install MongoDB Compass (GUI tool) - check this option
   ```

3. **Verify Installation**
   ```powershell
   # Open PowerShell/CMD and run:
   mongosh --version
   ```

### macOS/Linux

```bash
# macOS (using Homebrew)
brew tap mongodb/brew
brew install mongodb-community

# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
```

---

## Starting MongoDB

### Windows

**Method 1: As a Service (Automatic)**

```powershell
# Check if MongoDB service is running
net start MongoDB

# If not running, start it:
net start MongoDB

# To stop:
net stop MongoDB
```

**Method 2: Manual Start**

```powershell
# Navigate to MongoDB bin folder
cd "C:\Program Files\MongoDB\Server\7.0\bin"

# Start MongoDB
mongod --dbpath "C:\data\db"
```

### macOS/Linux

```bash
# Start MongoDB
sudo systemctl start mongod

# Check status
sudo systemctl status mongod

# Enable auto-start on boot
sudo systemctl enable mongod
```

---

## Connecting to MongoDB

### Method 1: MongoDB Shell (mongosh)

```powershell
# Connect to local MongoDB
mongosh

# Connect to specific database
mongosh mongodb://localhost:27017/felicity

# You should see:
# Current Mongosh Log ID: ...
# Connecting to: mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000
# Using MongoDB: 7.0.x
# Using Mongosh: 2.x.x
```

### Method 2: MongoDB Compass (GUI)

1. Open MongoDB Compass
2. Connection String: `mongodb://localhost:27017`
3. Click "Connect"
4. Select "felicity" database (or create it)

### Method 3: From Node.js Application

Your application automatically connects when you start the backend:

```powershell
cd backend
npm run dev
```

You'll see: `MongoDB Connected: localhost`

---

## Database Operations

### Basic Commands

```javascript
// Show all databases
show dbs

// Switch to/create database
use felicity

// Show current database
db

// Show all collections (tables)
show collections

// Get database stats
db.stats()
```

### Viewing Data

```javascript
// ==== USERS ====
// View all users
db.users.find().pretty();

// Find specific user
db.users.findOne({ email: "admin@felicity.com" });

// Find all participants
db.users.find({ role: "participant" });

// Find IIIT students
db.users.find({ participantType: "iiit" });

// Count users
db.users.countDocuments();

// ==== ORGANIZERS ====
// View all organizers
db.organizers.find().pretty();

// Find by category
db.organizers.find({ category: "technical" });

// Find active organizers
db.organizers.find({ isActive: true });

// ==== EVENTS ====
// View all events
db.events.find().pretty();

// Published events only
db.events.find({ status: "published" });

// Events by organizer
db.events.find({ organizer: ObjectId("organizer_id_here") });

// Upcoming events
db.events.find({
	status: "published",
	eventStartDate: { $gte: new Date() },
});

// Merchandise events
db.events.find({ eventType: "merchandise" });

// ==== REGISTRATIONS ====
// View all registrations
db.registrations.find().pretty();

// Find registrations for a participant
db.registrations.find({ participant: ObjectId("user_id_here") });

// Find registrations for an event
db.registrations.find({ event: ObjectId("event_id_here") });

// Confirmed registrations
db.registrations.find({ status: "confirmed" });
```

### Creating Data

```javascript
// Create a new user
db.users.insertOne({
	email: "test@example.com",
	password: "$2a$12$hashed_password",
	firstName: "Test",
	lastName: "User",
	role: "participant",
	participantType: "non-iiit",
	collegeName: "Test College",
	interests: ["Technical", "Gaming"],
	followedOrganizers: [],
	onboardingCompleted: false,
	createdAt: new Date(),
	updatedAt: new Date(),
});

// Create an event
db.events.insertOne({
	name: "Test Workshop",
	description: "A test workshop",
	eventType: "normal",
	organizer: ObjectId("organizer_id_here"),
	eligibility: "all",
	registrationDeadline: new Date("2026-03-01"),
	eventStartDate: new Date("2026-03-15"),
	eventEndDate: new Date("2026-03-15"),
	registrationLimit: 100,
	currentRegistrations: 0,
	registrationFee: 0,
	tags: ["workshop", "technical"],
	status: "published",
	customForm: [],
	createdAt: new Date(),
	updatedAt: new Date(),
});
```

### Updating Data

```javascript
// Update user profile
db.users.updateOne(
	{ email: "test@example.com" },
	{
		$set: {
			firstName: "Updated",
			contactNumber: "+91 9876543210",
		},
	},
);

// Add interest to user
db.users.updateOne(
	{ email: "test@example.com" },
	{ $addToSet: { interests: "Sports" } },
);

// Update event status
db.events.updateOne(
	{ _id: ObjectId("event_id_here") },
	{ $set: { status: "completed" } },
);

// Increment registration count
db.events.updateOne(
	{ _id: ObjectId("event_id_here") },
	{ $inc: { currentRegistrations: 1 } },
);

// Update organizer
db.organizers.updateOne(
	{ _id: ObjectId("organizer_id_here") },
	{
		$set: {
			description: "Updated description",
			contactEmail: "new@email.com",
		},
	},
);
```

### Deleting Data

```javascript
// Delete a user
db.users.deleteOne({ email: "test@example.com" });

// Delete all draft events
db.events.deleteMany({ status: "draft" });

// Delete cancelled registrations
db.registrations.deleteMany({ status: "cancelled" });

// Delete specific organizer
db.organizers.deleteOne({ _id: ObjectId("organizer_id_here") });
```

---

## Monitoring CRUD Operations

### Real-time Monitoring

```javascript
// Watch all changes in users collection
db.users.watch();

// Watch specific operations
db.registrations.watch([{ $match: { operationType: "insert" } }]);
```

### Aggregation Queries (Analytics)

```javascript
// Count registrations per event
db.registrations.aggregate([
	{
		$group: {
			_id: "$event",
			count: { $sum: 1 },
		},
	},
]);

// Events with registration details
db.events.aggregate([
	{
		$lookup: {
			from: "registrations",
			localField: "_id",
			foreignField: "event",
			as: "registrations",
		},
	},
	{
		$project: {
			name: 1,
			registrationCount: { $size: "$registrations" },
		},
	},
]);

// User with their registrations
db.users.aggregate([
	{
		$lookup: {
			from: "registrations",
			localField: "_id",
			foreignField: "participant",
			as: "myRegistrations",
		},
	},
	{
		$project: {
			email: 1,
			firstName: 1,
			lastName: 1,
			totalRegistrations: { $size: "$myRegistrations" },
		},
	},
]);

// Most popular events
db.events.aggregate([
	{ $sort: { currentRegistrations: -1 } },
	{ $limit: 5 },
	{ $project: { name: 1, currentRegistrations: 1 } },
]);
```

### Checking Data Integrity

```javascript
// Find users without email
db.users.find({ email: { $exists: false } });

// Find events with invalid dates
db.events.find({
	$expr: { $gte: ["$eventStartDate", "$eventEndDate"] },
});

// Find registrations for non-existent events
db.registrations.find({
	event: { $nin: db.events.distinct("_id") },
});

// Orphaned registrations (user deleted)
db.registrations.find({
	participant: { $nin: db.users.distinct("_id") },
});
```

---

## Monitoring Through Application Logs

### Backend Console Logs

When you run `npm run dev` in backend, watch for:

```
MongoDB Connected: localhost
POST /api/auth/register - 201 (User created)
POST /api/auth/login - 200 (Login successful)
POST /api/participant/events/123/register - 201 (Registration created)
Email sent: <message-id>
```

### Enable Mongoose Debug Mode

Add to `backend/config/db.js`:

```javascript
mongoose.set("debug", true);
```

Now all MongoDB queries will be logged:

```
Mongoose: users.findOne({ email: 'test@example.com' })
Mongoose: events.find({ status: 'published' })
Mongoose: registrations.insertOne({ ... })
```

---

## Common Queries for Testing

### After User Registration

```javascript
// Check if user was created
db.users.findOne({ email: "newuser@iiit.ac.in" });

// Verify password is hashed
db.users.findOne({ email: "newuser@iiit.ac.in" }, { password: 1 });
// Should see: { password: "$2a$12$..." }
```

### After Creating Event

```javascript
// Find the event
db.events.findOne({ name: "New Workshop" });

// Check organizer populated
db.events.aggregate([
	{ $match: { name: "New Workshop" } },
	{
		$lookup: {
			from: "organizers",
			localField: "organizer",
			foreignField: "_id",
			as: "organizerDetails",
		},
	},
]);
```

### After Event Registration

```javascript
// Find registration
db.registrations.findOne({ ticketId: "FEL123ABC" });

// Check event registration count updated
db.events.findOne({ _id: ObjectId("event_id") }, { currentRegistrations: 1 });

// Verify QR code exists
db.registrations.findOne({ ticketId: "FEL123ABC" }, { qrCode: 1 });
// Should have qrCode field with base64 data
```

---

## Troubleshooting

### MongoDB Won't Start

```powershell
# Check if port 27017 is in use
netstat -ano | findstr :27017

# Kill the process if needed
taskkill /PID <PID> /F

# Start MongoDB manually
cd "C:\Program Files\MongoDB\Server\7.0\bin"
mongod --dbpath "C:\data\db"
```

### Connection Refused

```javascript
// In backend/.env, try:
MONGODB_URI=mongodb://127.0.0.1:27017/felicity
// instead of:
MONGODB_URI=mongodb://localhost:27017/felicity
```

### Database Not Showing

```javascript
// MongoDB only creates database when you insert data
use felicity
db.users.insertOne({ test: "data" })
// Now "felicity" will appear in "show dbs"
```

### Reset Database

```javascript
// Drop entire database
use felicity
db.dropDatabase()

// Drop specific collection
db.users.drop()
db.events.drop()
db.registrations.drop()

// Re-seed admin
// In backend folder:
npm run seed
```

---

## Useful Shortcuts

```javascript
// Clear screen
cls  // Windows
clear  // Mac/Linux

// Exit mongosh
exit

// Get help
help

// Collection help
db.users.help()

// Show fields in collection
Object.keys(db.users.findOne() || {})

// Export data
mongoexport --db felicity --collection users --out users.json

// Import data
mongoimport --db felicity --collection users --file users.json
```

---

## Production Monitoring

For production deployments with MongoDB Atlas:

1. **Atlas Dashboard**: Monitor queries, indexes, slow operations
2. **Performance Advisor**: Get index recommendations
3. **Real-time Charts**: Track connections, operations/sec
4. **Alerts**: Set up email alerts for high memory usage, connection spikes

---

## Quick Reference Card

```javascript
// === ESSENTIAL COMMANDS ===
mongosh                          // Connect
use felicity                     // Switch DB
show collections                 // List collections
db.users.find()                  // View all
db.users.findOne({...})          // Find one
db.users.insertOne({...})        // Create
db.users.updateOne({}, {$set:{}})// Update
db.users.deleteOne({})           // Delete
db.users.countDocuments()        // Count
exit                             // Exit

// === FILTERS ===
{ field: value }                 // Exact match
{ field: { $gt: value } }        // Greater than
{ field: { $regex: /pattern/ } } // Regex search
{ $or: [{}, {}] }                // OR condition

// === PROJECTIONS ===
.find({}, { field: 1 })          // Include field
.find({}, { field: 0 })          // Exclude field

// === SORTING & LIMITING ===
.find().sort({ field: -1 })      // Sort descending
.find().limit(10)                // Limit results
.find().skip(10).limit(10)       // Pagination
```

---

**Need Help?**

- MongoDB Manual: https://docs.mongodb.com/manual/
- Mongoose Docs: https://mongoosejs.com/docs/
- Community Forums: https://www.mongodb.com/community/forums/

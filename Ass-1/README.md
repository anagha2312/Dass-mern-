# Felicity Event Management System

Complete MERN stack event management platform for IIIT Hyderabad's Felicity fest.

## 🎯 Assignment Compliance

### Part 1: Core System Implementation [70 Marks] ✅

- All sections 1-12 fully implemented
- MERN stack (MongoDB, Express, React, Node.js)
- Role-based access control
- JWT authentication with bcrypt
- Complete participant, organizer, and admin features

### Part 2: Advanced Features [30 Marks]

#### Tier A Features (8 Marks Each) - Chose 2 ✅

**1. Merchandise Payment Approval Workflow [8 Marks]**

- Users upload payment proof (screenshot) after merchandise purchase
- Order enters "Pending Approval" state
- Organizers view pending orders with payment proofs in separate tab
- Approve/reject with comments
- On approval: stock decremented, QR ticket generated, confirmation email sent
- No QR while pending/rejected

**2. QR Scanner & Attendance Tracking [8 Marks]**

- Built-in QR scanner for organizers (manual entry + file upload)
- Mark attendance with timestamp
- Reject duplicate scans
- Live attendance dashboard (scanned vs not-scanned)
- Export attendance as CSV
- Manual override option

#### Tier B Features (6 Marks Each) - Chose 2 ✅

**1. Real-Time Discussion Forum [6 Marks]**

- Event-specific discussion threads for registered participants
- Real-time updates using Socket.IO
- Threaded replies to messages
- Emoji reactions (👍❤️😂😮😢🎉)
- Organizers can pin important messages
- Organizers can moderate (delete inappropriate content)
- Typing indicators
- Message edit (within 5 minutes) and delete

**2. Organizer Password Reset Workflow [6 Marks]**

- Organizers request password reset from login page
- Admin views all requests with details (club name, date, reason)
- Admin approves/rejects with comments
- System generates new password on approval
- Request status tracking (Pending/Approved/Rejected)

#### Tier C Features (2 Marks Each) - Chose 2 ✅

**1. Add to Calendar Integration [2 Marks]**

- Download .ics files for universal calendar import
- Direct Google Calendar integration link
- Direct Microsoft Outlook integration link
- Automatic timezone handling
- Available on event details page after registration

**2. Anonymous Feedback System [2 Marks]**

- Participants submit anonymous feedback for attended events
- Star rating (1-5) plus text comments
- Organizers view aggregated ratings
- View feedback on event detail page
- Available after event ends

### Total Advanced Features: 16 + 12 + 4 = 32 Marks ✅ (Max 30)

---

## 🚀 Features

### Authentication & Security

- JWT-based authentication
- Role-based access control (Admin, Organizer, Participant)
- Password hashing with bcrypt
- IIIT email domain validation
- Persistent sessions

### User Roles

#### Participants

- **IIIT Students**: Register with IIIT email
- **Non-IIIT**: Register with any email
- Browse and search events
- Filter by type, eligibility, date range
- Follow clubs/organizers
- Register for events
- View participation history
- Manage profile and preferences

#### Organizers (Clubs/Councils)

- Create and manage events (Normal & Merchandise)
- Custom registration forms
- Track registrations
- Manage merchandise inventory
- View dashboard analytics

#### Admin

- Create/manage organizer accounts
- Reset organizer passwords
- System-level administration

### Event Management

- **Normal Events**: Workshops, competitions, talks
- **Merchandise Events**: T-shirts, hoodies, kits
- Dynamic custom forms
- Registration limits and deadlines
- Eligibility rules
- Stock management for merchandise
- QR code tickets
- Email confirmations

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

## 🛠️ Installation

### 1. Clone the repository

```bash
cd "c:\Users\Anil Prajapati\Documents\DASS\Ass-1"
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

**Required packages:**

- express
- mongoose
- bcryptjs
- jsonwebtoken
- dotenv
- cors
- cookie-parser
- express-validator
- nodemailer
- qrcode

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

**Required packages:**

- react
- react-dom
- react-router-dom
- axios
- react-hot-toast
- tailwindcss
- vite

### 4. Setup Environment Variables

#### Backend (.env)

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/felicity

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# CORS
FRONTEND_URL=http://localhost:5173

# Email (Optional - for ticket delivery)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

#### Frontend (.env)

```bash
cd ../frontend
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

## 🗄️ MongoDB Setup

### Option 1: Local MongoDB Setup

#### Install MongoDB on Windows:

1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Run the installer (select "Complete" installation)
3. Install MongoDB as a Windows Service
4. MongoDB will start automatically on port 27017

#### Verify Installation:

```powershell
mongosh
```

You should see MongoDB shell. Type `exit` to quit.

### Option 2: MongoDB Atlas (Cloud)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster (Free M0 tier)
4. Add your IP address to whitelist (or use 0.0.0.0/0 for all IPs)
5. Create a database user
6. Get the connection string and update your `.env`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/felicity?retryWrites=true&w=majority
```

### Seed Admin Account

```bash
cd backend
npm run seed
```

This creates an admin account:

- **Email**: admin@felicity.com
- **Password**: Admin@123

**⚠️ Change these credentials after first login!**

## 🚀 Running the Application

### Method 1: Run Both Servers Separately

#### Terminal 1 - Backend:

```powershell
cd backend
npm run dev
```

Backend runs on: http://localhost:5000

#### Terminal 2 - Frontend:

```powershell
cd frontend
npm run dev
```

Frontend runs on: http://localhost:5173

### Method 2: Production Build

#### Backend:

```powershell
cd backend
npm start
```

#### Frontend:

```powershell
cd frontend
npm run build
npm run preview
```

## 📊 MongoDB Operations & Verification

### Using MongoDB Compass (GUI)

1. Download MongoDB Compass: https://www.mongodb.com/try/download/compass
2. Connect to: `mongodb://localhost:27017`
3. Select database: `felicity`
4. View collections: `users`, `organizers`, `events`, `registrations`

### Using MongoDB Shell (CLI)

```powershell
# Connect to MongoDB
mongosh

# Switch to felicity database
use felicity

# Show all collections
show collections

# View all users
db.users.find().pretty()

# View all organizers
db.organizers.find().pretty()

# View all events
db.events.find().pretty()

# Count documents
db.users.countDocuments()
db.events.countDocuments()

# Find specific user
db.users.findOne({ email: "admin@felicity.com" })

# Find events by organizer
db.events.find({ status: "published" }).pretty()

# View registrations
db.registrations.find().pretty()
```

### Common MongoDB Operations

#### Create Admin User (Manual):

```javascript
use felicity
db.users.insertOne({
  email: "admin@felicity.com",
  password: "$2a$12$hashed_password_here",
  role: "admin",
  firstName: "Admin",
  lastName: "User",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

#### Check CRUD Operations:

**Create Event (via API)**:

```bash
# Use Postman or cURL
curl -X POST http://localhost:5000/api/organizer/events \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Event","description":"Test",...}'
```

**Read (Query)**:

```javascript
// All events
db.events.find();

// Published events only
db.events.find({ status: "published" });

// Events with registrations
db.events.aggregate([
	{
		$lookup: {
			from: "registrations",
			localField: "_id",
			foreignField: "event",
			as: "registrations",
		},
	},
]);
```

**Update**:

```javascript
// Update event status
db.events.updateOne(
	{ _id: ObjectId("event_id") },
	{ $set: { status: "published" } },
);
```

**Delete**:

```javascript
// Delete draft events
db.events.deleteMany({ status: "draft" });
```

## 📁 Project Structure

```
Ass-1/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   ├── adminController.js     # Admin operations
│   │   ├── authController.js      # Authentication
│   │   ├── eventController.js     # Participant event operations
│   │   ├── organizerController.js # Organizer operations
│   │   └── participantController.js # Participant operations
│   ├── middleware/
│   │   ├── auth.js                # JWT verification & RBAC
│   │   ├── validation.js          # Input validation
│   │   └── index.js
│   ├── models/
│   │   ├── User.js                # Participant & Admin
│   │   ├── Organizer.js           # Clubs/Councils
│   │   ├── Event.js               # Events
│   │   ├── Registration.js        # Event registrations
│   │   └── index.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── admin.js
│   │   ├── participant.js
│   │   ├── organizer.js
│   │   └── index.js
│   ├── seeds/
│   │   └── adminSeed.js           # Create admin user
│   ├── utils/
│   │   ├── emailService.js        # Email functionality
│   │   └── qrService.js           # QR code generation
│   ├── .env.example
│   ├── package.json
│   └── server.js                  # Entry point
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── common/
    │   │       ├── Loading.jsx
    │   │       ├── Navbar.jsx
    │   │       ├── ProtectedRoute.jsx
    │   │       └── PublicRoute.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx    # Authentication state
    │   ├── pages/
    │   │   ├── auth/
    │   │   │   ├── Login.jsx
    │   │   │   └── Register.jsx
    │   │   ├── participant/
    │   │   │   ├── Dashboard.jsx
    │   │   │   ├── BrowseEvents.jsx
    │   │   │   ├── EventDetails.jsx
    │   │   │   ├── Profile.jsx
    │   │   │   ├── ClubsListing.jsx
    │   │   │   ├── ClubDetails.jsx
    │   │   │   └── Onboarding.jsx
    │   │   ├── organizer/
    │   │   │   └── Dashboard.jsx
    │   │   └── admin/
    │   │       └── Dashboard.jsx
    │   ├── services/
    │   │   └── api.js              # Axios API calls
    │   ├── App.jsx                 # Routes
    │   ├── main.jsx                # Entry point
    │   └── index.css               # Tailwind styles
    ├── .env.example
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.js
```

## 🔑 API Endpoints

### Authentication

- `POST /api/auth/register` - Register participant
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/change-password` - Change password

### Participant

- `GET /api/participant/events` - Browse events
- `GET /api/participant/events/trending` - Trending events
- `GET /api/participant/events/:id` - Event details
- `POST /api/participant/events/:id/register` - Register for event
- `GET /api/participant/registrations` - My registrations
- `DELETE /api/participant/registrations/:id` - Cancel registration
- `GET /api/participant/organizers` - List organizers
- `GET /api/participant/organizers/:id` - Organizer details
- `POST /api/participant/organizers/:id/follow` - Follow/unfollow
- `GET /api/participant/profile` - Get profile
- `PUT /api/participant/profile` - Update profile
- `PUT /api/participant/preferences` - Update preferences

### Organizer

- `GET /api/organizer/dashboard` - Dashboard stats
- `GET /api/organizer/events` - Get organizer events
- `POST /api/organizer/events` - Create event
- `GET /api/organizer/events/:id` - Get event details
- `PUT /api/organizer/events/:id` - Update event
- `DELETE /api/organizer/events/:id` - Delete event
- `GET /api/organizer/events/:id/registrations` - Event registrations
- `PUT /api/organizer/events/:eventId/registrations/:registrationId` - Update registration status

### Admin

- `GET /api/admin/organizers` - List organizers
- `POST /api/admin/organizers` - Create organizer
- `GET /api/admin/organizers/:id` - Get organizer
- `PUT /api/admin/organizers/:id` - Update organizer
- `DELETE /api/admin/organizers/:id` - Delete organizer
- `PUT /api/admin/organizers/:id/reset-password` - Reset password

## 🧪 Testing MongoDB CRUD Operations

### 1. Register a User (Create)

```bash
# Via frontend: Go to http://localhost:5173/register
# Or via API:
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@students.iiit.ac.in",
    "password": "Test@123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

Verify in MongoDB:

```javascript
db.users.findOne({ email: "test@students.iiit.ac.in" });
```

### 2. Login (Read)

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@students.iiit.ac.in",
    "password": "Test@123"
  }'
```

### 3. Create Event (Create)

Login as organizer, then create event via dashboard or API.

### 4. Update Profile (Update)

Via frontend profile page or API.

### 5. Cancel Registration (Delete)

Via participant dashboard.

## 🎨 UI Pages

- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Participant dashboard
- `/events` - Browse events
- `/events/:id` - Event details
- `/profile` - User profile
- `/clubs` - Clubs listing
- `/clubs/:id` - Club details
- `/organizer/dashboard` - Organizer dashboard
- `/admin/dashboard` - Admin dashboard

## 🔐 Default Credentials

**Admin:**

- Email: admin@felicity.com
- Password: Admin@123

_(Create organizer accounts via admin dashboard)_

## 📧 Email Configuration

### For Gmail:

1. Enable 2-Factor Authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use app password in `.env`

### For Testing (Mailtrap):

1. Sign up at https://mailtrap.io
2. Get SMTP credentials
3. Update `.env` with Mailtrap settings

## 🐛 Troubleshooting

### MongoDB Connection Failed

- Ensure MongoDB is running: `net start MongoDB` (Windows)
- Check connection string in `.env`
- Verify MongoDB port (default: 27017)

### CORS Errors

- Check `FRONTEND_URL` in backend `.env`
- Ensure both servers are running

### Email Not Sending

- Verify SMTP credentials
- Check firewall settings
- For development, emails are logged to console

### Port Already in Use

```powershell
# Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

## 📝 MongoDB Database Schema

### Collections:

- **users**: Participants and admin
- **organizers**: Clubs and councils
- **events**: All events (normal & merchandise)
- **registrations**: Event registrations/tickets

### Indexes:

- Users: email (unique)
- Organizers: loginEmail (unique)
- Events: organizer, status, dates, tags (text search)
- Registrations: event + participant (compound unique)

## 🚀 Deployment

### Backend (Heroku/Railway)

1. Set environment variables
2. Update `MONGODB_URI` to Atlas
3. Deploy

### Frontend (Vercel/Netlify)

1. Build: `npm run build`
2. Set `VITE_API_URL` to production API
3. Deploy `dist` folder

## 📚 Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

## ⚠️ Important Notes

1. Change default admin password immediately
2. Use strong JWT_SECRET in production
3. Enable MongoDB authentication in production
4. Set up proper SMTP service for production emails
5. Implement rate limiting for APIs
6. Add input sanitization
7. Set up proper logging

## 📄 License

This project is for educational purposes.

---

**Need help?** Check MongoDB connection first, then verify environment variables.

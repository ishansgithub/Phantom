# Phantom

A real-time anonymous chat application with voice calling capabilities, built with React and Node.js. Phantom provides secure, instant messaging with WebRTC-powered voice calls in private chat rooms.

![Phantom](client/public/logo.png)

## Features

### Core Features
- **Real-time Messaging**: Instant message delivery using Socket.io
- **Voice Calling**: WebRTC-based peer-to-peer voice calls with Opus codec prioritization
- **Room-based Chat**: Create or join chat rooms with unique room IDs
- **Message Persistence**: Chat history stored in MongoDB (last 50 messages per room)
- **User Authentication**: Secure user registration with bcrypt password hashing
- **Online User List**: See who's online in your chat room
- **Active Rooms Display**: Browse and join active chat rooms from the homepage

### UI/UX Features
- **Retro-themed Design**: Vintage-inspired UI with custom styling
- **Responsive Layout**: Works seamlessly on desktop and mobile devices
- **Toast Notifications**: User-friendly notifications using react-hot-toast
- **Smooth Animations**: Polished user experience with smooth transitions

## Tech Stack

### Frontend
- **React 19.1.1** - UI library
- **Vite 7.1.2** - Build tool and dev server
- **React Router DOM 7.8.2** - Client-side routing
- **Socket.io Client 4.8.1** - Real-time communication
- **Tailwind CSS 4.1.12** - Utility-first CSS framework
- **React Hot Toast 2.6.0** - Toast notifications
- **React Icons 4.11.0** - Icon library
- **UUID 11.1.0** - Unique ID generation

### Backend
- **Node.js** - Runtime environment
- **Express 5.1.0** - Web framework
- **Socket.io 4.8.1** - Real-time bidirectional communication
- **MongoDB** - NoSQL database
- **Mongoose 8.19.2** - MongoDB object modeling
- **bcryptjs 3.2.2** - Password hashing
- **jsonwebtoken 9.0.2** - JWT authentication
- **CORS 2.8.5** - Cross-origin resource sharing
- **dotenv 17.2.3** - Environment variable management

### WebRTC
- **STUN Server**: Google's public STUN server
- **TURN Server**: ExpressTurn relay server for NAT traversal
- **Opus Codec**: Prioritized for high-quality audio

## Project Structure

```
Phantom/
├── client/                 # Frontend React application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   │   ├── AuthForm.jsx
│   │   │   ├── CallUI.jsx
│   │   │   └── UsernameModal.jsx
│   │   ├── pages/         # Page components
│   │   │   ├── ChatRoom.jsx
│   │   │   ├── HomePage.jsx
│   │   │   ├── NotFound.jsx
│   │   │   └── Register.jsx
│   │   ├── App.jsx        # Main app component
│   │   ├── App.css        # Global styles
│   │   ├── index.css     # Base styles
│   │   └── main.jsx      # Entry point
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json       # Vercel deployment config
│
└── server/                # Backend Node.js application
    ├── models/           # MongoDB models
    │   ├── user.js
    │   └── userMessage.js
    ├── routes/           # API routes
    │   └── user.js
    ├── src/
    │   └── server.js     # Main server file
    └── package.json
```

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (local instance or MongoDB Atlas account)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Phantom
```

### 2. Install Frontend Dependencies

```bash
cd client
npm install
```

### 3. Install Backend Dependencies

```bash
cd ../server
npm install
```

### 4. Environment Variables

#### Server Environment Variables

Create a `.env` file in the `server/` directory:

```env
MONGO_URL=your_mongodb_connection_string
PORT=3000
JWT_SECRET=your_jwt_secret_key
```

#### Client Environment Variables

Create a `.env` file in the `client/` directory:

```env
VITE_BACKEND_URL=http://localhost:3000
```

For production, set `VITE_BACKEND_URL` to your deployed backend URL.

## Running the Application

### Development Mode

#### Start the Backend Server

```bash
cd server
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

#### Start the Frontend Development Server

In a new terminal:

```bash
cd client
npm run dev
```

The client will start on `http://localhost:5173` (default Vite port).

### Production Build

#### Build the Frontend

```bash
cd client
npm run build
```

The production build will be created in the `client/dist/` directory.

#### Start the Production Server

```bash
cd server
npm start
```

## Usage

### Creating a Chat Room

1. Navigate to the homepage
2. Click "Create Private Chat Room"
3. Enter your username when prompted
4. Share the room ID with others to invite them

### Joining a Chat Room

1. From the homepage, browse active rooms or enter a room ID
2. Click "Join" on an active room or navigate to `/chat/{roomId}`
3. Enter your username when prompted

### Voice Calling

1. Click the users icon to view online users
2. Click the phone icon next to a user to start a call
3. Accept or decline incoming calls
4. Use the mute button during calls
5. End calls using the end call button

### Messaging

- Type messages in the input field at the bottom
- Press Enter or click the send button
- Messages are delivered instantly to all users in the room
- Chat history (last 50 messages) is loaded when joining a room

## API Endpoints

### User Routes

#### Register User
```
POST /api/users/register
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

## Socket.io Events

### Client → Server

- `join_room` - Join a chat room
  ```javascript
  { roomId: string, username: string }
  ```

- `send_message` - Send a message
  ```javascript
  { roomId: string, sender: string, content: string, timestamp: string }
  ```

- `get_rooms` - Get list of active rooms

- `call-user` - Initiate a voice call
  ```javascript
  { to: string, from: object, offer: RTCSessionDescription }
  ```

- `make-answer` - Answer an incoming call
  ```javascript
  { to: string, answer: RTCSessionDescription }
  ```

- `ice-candidate` - Send ICE candidate for WebRTC
  ```javascript
  { to: string, candidate: RTCIceCandidate }
  ```

- `end-call` - End an active call
  ```javascript
  { roomId: string }
  ```

### Server → Client

- `receive_message` - Receive a new message
- `update_user_list` - Update list of online users
- `load_old_messages` - Load chat history
- `rooms_list` - List of active rooms
- `call-made` - Incoming call notification
- `answer-made` - Call answer received
- `ice-candidate` - ICE candidate for WebRTC
- `call_in_progress` - Notification that a call is active
- `call_ended` - Call ended notification
- `message_error` - Message sending error

## Database Models

### User Model
```javascript
{
  username: String (unique, required),
  password: String (hashed, required)
}
```

### Message Model
```javascript
{
  sender: String (required),
  content: String (required, maxlength: 1000),
  roomId: String (required, indexed),
  messageType: String (enum: ['text', 'image', 'file'], default: 'text'),
  createdAt: Date,
  updatedAt: Date
}
```

## Deployment

### Frontend (Vercel)

The project includes a `vercel.json` configuration file for easy deployment to Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Set the `VITE_BACKEND_URL` environment variable
4. Deploy

### Backend

Deploy the server to platforms like:
- **Heroku**
- **Railway**
- **Render**
- **DigitalOcean**
- **AWS EC2**

Make sure to:
- Set all environment variables
- Configure MongoDB connection (use MongoDB Atlas for cloud)
- Update CORS settings for production
- Set up proper SSL/TLS certificates


## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

## Acknowledgments

- Socket.io for real-time communication
- WebRTC for peer-to-peer voice calling
- React and Vite teams for excellent tooling
- MongoDB for database solutions

---

**Phantom** - Anonymous • Secure • Instant


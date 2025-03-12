const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: 'http://localhost:3000' } });

// Connect to DB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes (import after app setup to avoid circular dependency)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/classes', require('./routes/class'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/assignments', require('./routes/assignment'));
app.use('/api/timetable', require('./routes/timetable'));
app.use('/api/notice', require('./routes/notice'));

// Socket.io setup
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('holidayAdded', (newHoliday) => {
    io.emit('holidayAdded', newHoliday)
  })
  socket.on('noticeAdded', (newNotice) => {
    io.emit('noticeAdded', newNotice)
  })
  socket.on('disconnect', () => console.log('User disconnected:', socket.id));
});

// Pass io to controllers via a function (avoiding circular dependency)
const initializeControllers = () => {
  require('./controllers/assignmentController').setIo(io);
  require('./controllers/attendanceController').setIo(io);
  require('./controllers/timetableController').setIo(io);
  require('./controllers/noticeController').setIo(io);
};
initializeControllers();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = { server }; // Export server only, io is handled separately
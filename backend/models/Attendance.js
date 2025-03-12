const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  classId: { type: String, required: true }, // String to match Class _id
  date: { type: Date, required: true },
  subject: { type: String, required: true },
  status: { type: String, enum: ['present', 'absent'], required: true },
});

module.exports = mongoose.model('Attendance', attendanceSchema);
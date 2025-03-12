const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  class: { type: String, required: true }, // String to match Class _id
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  day: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  subject: { type: String, required: true },
});

module.exports = mongoose.model('Timetable', timetableSchema);
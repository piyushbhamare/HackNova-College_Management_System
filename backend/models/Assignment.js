const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date, required: true },
  classId: { type: String, required: true }, // String to match Class _id
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  file: { type: String },
  submissions: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    file: { type: String },
    grade: { type: Number }
  }],
});

module.exports = mongoose.model('Assignment', assignmentSchema);
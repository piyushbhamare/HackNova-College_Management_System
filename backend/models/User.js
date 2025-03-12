const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'faculty', 'admin'], required: true },
  classId: { 
    type: String, 
    required: function() { return this.role === 'student'; } // Required only for students
  }
});

module.exports = mongoose.model('User', userSchema);
const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  description: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

module.exports = mongoose.model('Event', EventSchema);
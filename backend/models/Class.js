const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Custom string ClassID
  name: { type: String, required: true },
  course: { type: String, required: true },
  startDate: { type: String },
  endDate: { type: String },
  days: [{ type: String }],
}, { _id: false }); // Disable auto _id generation

module.exports = mongoose.model('Class', classSchema);
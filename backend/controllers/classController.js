const Class = require('../models/Class');

exports.getClasses = async (req, res) => {
  try {
    const classes = await Class.find().select('_id name'); // Fetch only _id and name
    res.json(classes);
  } catch (err) {
    console.error('Get classes error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
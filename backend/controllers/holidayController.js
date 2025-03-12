let io;

exports.setIo = (socketIo) => {
  io = socketIo;
};

exports.addHoliday = async (req, res) => {
  const { name, date } = req.body;
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Unauthorized' });

  if (!name || !date) {
    return res.status(400).json({ msg: 'Name and date are required' });
  }

  try {
    const holiday = new (require('../models/Holiday'))({ name, date, createdBy: req.user.id });
    await holiday.save();
    io.emit('holidaysUpdated', await require('../models/Holiday').find().populate('createdBy', 'name'));
    res.status(201).json(holiday);
  } catch (err) {
    console.error('Add holiday error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getHolidays = async (req, res) => {
  try {
    const holidays = await require('../models/Holiday').find().populate('createdBy', 'name');
    res.json(holidays);
  } catch (err) {
    console.error('Get holidays error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
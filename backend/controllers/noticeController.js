let io;

exports.setIo = (socketIo) => {
  io = socketIo;
};

exports.createNotice = async (req, res) => {
  const { title, content } = req.body;
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Unauthorized' });

  if (!title || !content) {
    return res.status(400).json({ msg: 'Title and content are required' });
  }

  try {
    const notice = new (require('../models/Notice'))({ title, content, createdBy: req.user.id });
    await notice.save();
    io.emit('noticesUpdated', await require('../models/Notice').find().populate('createdBy', 'name'));
    res.status(201).json(notice);
  } catch (err) {
    console.error('Create notice error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getNotices = async (req, res) => {
  try {
    const notices = await require('../models/Notice').find().populate('createdBy', 'name');
    res.json(notices);
  } catch (err) {
    console.error('Get notices error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
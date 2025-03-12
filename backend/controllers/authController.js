const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Class = require('../models/Class');

exports.register = async (req, res) => {
  const { name, email, password, role, classId } = req.body;
  console.log('Register request received:', req.body);

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(409).json({ msg: 'User already exists' });

    if (role === 'student' && !classId) return res.status(400).json({ msg: 'Class ID required for students' });
    if (role === 'student') {
      const classDoc = await Class.findOne({ _id: classId });
      if (!classDoc) return res.status(400).json({ msg: 'Class not found' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ name, email, password: hashedPassword, role, classId: role === 'student' ? classId : undefined });
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role, classId: user.classId }, // Include classId
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token, user: { id: user._id, name, email, role, classId: user.classId } });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  console.log('Login request:', { email });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, role: user.role, classId: user.classId }, // Include classId
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, classId: user.classId } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getUser = async (req, res) => {
  console.log('GetUser request, user ID:', req.user?.id);
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    console.log('User fetched:', user);
    res.json(user);
  } catch (err) {
    console.error('GetUser error:', err.stack);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.assignClass = async (req, res) => {
  const { userId, classId } = req.body;
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Unauthorized' });

  try {
    const user = await User.findById(userId);
    if (!user || user.role !== 'student') return res.status(404).json({ msg: 'Student not found' });
    const classDoc = await Class.findOne({ _id: classId });
    if (!classDoc) return res.status(404).json({ msg: 'Class not found' });

    user.classId = classId; // Updated to classId
    await user.save();
    res.json({ msg: 'Class assigned successfully', user });
  } catch (err) {
    console.error('Assign class error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getFaculties = async (req, res) => {
  try {
    const faculties = await User.find({ role: 'faculty' }).select('name _id');
    res.json(faculties);
  } catch (err) {
    console.error('Get faculties error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

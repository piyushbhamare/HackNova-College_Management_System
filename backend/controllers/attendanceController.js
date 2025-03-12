let io;

exports.setIo = (socketIo) => {
  io = socketIo;
};

exports.markAttendance = async (req, res) => {
  const { classId, date, subject, attendance } = req.body;
  if (req.user.role !== 'faculty') return res.status(403).json({ msg: 'Unauthorized' });
  if (!classId || !date || !subject || !attendance) {
    return res.status(400).json({ msg: 'All fields are required' });
  }
  try {
    const records = attendance.map(({ studentId, status }) => ({
      studentId,
      classId,
      date,
      subject,
      status,
    }));
    await require('../models/Attendance').insertMany(records);
    const updatedAttendance = await require('../models/Attendance').find({ classId });
    io.emit('attendanceUpdated', { classId, records: updatedAttendance });
    res.status(201).json({ msg: 'Attendance marked successfully' });
  } catch (err) {
    console.error('Mark attendance error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getStudentAttendance = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'student') {
      return res.status(403).json({ msg: 'Access denied: Not a student' });
    }
    const attendance = await require('../models/Attendance').find({ studentId: user.id });
    res.json(attendance);
  } catch (err) {
    console.error('Get student attendance error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getClassStudents = async (req, res) => {
  const { classId } = req.query;
  try {
    const students = await require('../models/User').find({ role: 'student', classId }).select('name _id');
    res.json(students);
  } catch (err) {
    console.error('Get class students error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
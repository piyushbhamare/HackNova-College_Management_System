let io;

exports.setIo = (socketIo) => {
  io = socketIo;
};

const Assignment = require('../models/Assignment');

exports.createAssignment = async (req, res) => {
  const { title, description, dueDate, classId, file } = req.body;
  if (req.user.role !== 'faculty') return res.status(403).json({ msg: 'Unauthorized' });
  if (!title || !dueDate || !classId) {
    return res.status(400).json({ msg: 'Title, due date, and class ID are required' });
  }
  try {
    const assignment = new Assignment({
      title,
      description,
      dueDate,
      classId,
      faculty: req.user.id,
      file,
    });
    await assignment.save();
    io.emit('assignmentUpdated', { classId });
    res.status(201).json({ msg: 'Assignment created successfully', assignment });
  } catch (err) {
    console.error('Create assignment error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getFacultyAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ faculty: req.user.id });
    res.json(assignments);
  } catch (err) {
    console.error('Get faculty assignments error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getStudentAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ classId: req.user.classId });
    res.json(assignments);
  } catch (err) {
    console.error('Get student assignments error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.submitAssignment = async (req, res) => {
  const { assignmentId, file } = req.body;
  const studentId = req.user.id;
  try {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ msg: 'Assignment not found' });
    assignment.submissions.push({ studentId, file });
    await assignment.save();
    console.log('Assignment after submission:', assignment); // Debug
    io.emit('assignmentUpdated', { classId: assignment.classId, assignmentId });
    res.json({ msg: 'Assignment submitted successfully' });
  } catch (err) {
    console.error('Submit assignment error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.gradeAssignment = async (req, res) => {
  const { assignmentId, studentId, grade } = req.body;
  if (req.user.role !== 'faculty') return res.status(403).json({ msg: 'Unauthorized' });
  try {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ msg: 'Assignment not found' });
    const submission = assignment.submissions.find(sub => sub.studentId.toString() === studentId);
    if (!submission) return res.status(404).json({ msg: 'Submission not found' });
    submission.grade = parseInt(grade);
    await assignment.save();
    console.log('Assignment after grading:', assignment); // Debug
    io.emit('assignmentUpdated', { classId: assignment.classId, assignmentId });
    res.json({ msg: 'Assignment graded successfully' });
  } catch (err) {
    console.error('Grade assignment error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
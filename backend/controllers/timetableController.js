const mongoose = require('mongoose');
const Timetable = require('../models/Timetable');
const Class = require('../models/Class');
const Holiday = require('../models/Holiday');
const Event = require('../models/Event');
const User = require('../models/User');
const axios = require('axios');

let io;

exports.setIo = (socketIo) => {
  io = socketIo;
};

exports.createTimetable = async (req, res) => {
  const { classId, timetable, startDate, endDate, days } = req.body;
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Unauthorized' });

  if (!classId || !timetable || !startDate || !endDate || !days) {
    return res.status(400).json({ msg: 'All fields are required: classId, timetable, startDate, endDate, days' });
  }

  const invalidSlots = timetable.filter(slot => !slot.day || !slot.subject || !slot.faculty || !slot.startTime || !slot.endTime);
  if (invalidSlots.length > 0) {
    return res.status(400).json({ msg: 'All timetable slots must include day, subject, faculty, startTime, and endTime', invalidSlots });
  }

  try {
    const classDoc = await Class.findById(classId);
    if (!classDoc) return res.status(404).json({ msg: 'Class not found' });

    const facultyIds = timetable.map(slot => slot.faculty);
    const validFaculties = await User.find({ _id: { $in: facultyIds }, role: 'faculty' });
    const validFacultyIds = validFaculties.map(f => f._id.toString());
    const invalidFacultyIds = facultyIds.filter(id => !validFacultyIds.includes(id));
    if (invalidFacultyIds.length > 0) {
      return res.status(400).json({ msg: `Invalid faculty IDs: ${invalidFacultyIds.join(', ')}` });
    }

    classDoc.startDate = startDate;
    classDoc.endDate = endDate;
    classDoc.days = days;
    await classDoc.save();

    await Timetable.deleteMany({ class: classId });
    const timetableDocs = timetable.map(slot => ({
      class: classId,
      faculty: slot.faculty,
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
      subject: slot.subject,
    }));
    const newTimetable = await Timetable.insertMany(timetableDocs);
    const stats = await calculateCourseStats(classId, startDate, endDate, days);

    io.emit('timetableUpdated', { classId, timetable: newTimetable, days, ...stats });
    res.status(201).json({ msg: 'Timetable created successfully', timetable: newTimetable, days, ...stats });
  } catch (err) {
    console.error('Create timetable error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.addHoliday = async (req, res) => {
  const { name, date } = req.body;
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Unauthorized' });

  if (!name || !date) {
    return res.status(400).json({ msg: 'Name and date are required' });
  }

  try {
    const holiday = new Holiday({
      name,
      date,
      createdBy: req.user.id,
    });
    await holiday.save();
    const updatedHolidays = await Holiday.find().populate('createdBy', 'name');
    io.emit('holidaysUpdated', updatedHolidays);
    res.status(201).json({ msg: 'Holiday added successfully', holiday });
  } catch (err) {
    console.error('Add holiday error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.find().populate('createdBy', 'name');
    res.json(holidays);
  } catch (err) {
    console.error('Get holidays error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.addEvent = async (req, res) => {
  const { name, date, description } = req.body;
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Unauthorized' });

  if (!name || !date) {
    return res.status(400).json({ msg: 'Name and date are required' });
  }

  try {
    const event = new Event({
      name,
      date,
      description,
      createdBy: req.user.id,
    });
    await event.save();
    const updatedEvents = await Event.find().populate('createdBy', 'name');
    io.emit('eventsUpdated', updatedEvents);
    res.status(201).json({ msg: 'Event added successfully', event });
  } catch (err) {
    console.error('Add event error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find().populate('createdBy', 'name');
    res.json(events);
  } catch (err) {
    console.error('Get events error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getStudentTimetable = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'student' || !user.classId) {
      return res.status(403).json({ msg: 'No class assigned or unauthorized' });
    }
    const timetable = await Timetable.find({ class: user.classId }).populate('faculty', 'name');
    const classDoc = await Class.findById(user.classId);
    if (!classDoc) return res.status(404).json({ msg: 'Class not found' });
    const stats = await calculateCourseStats(user.classId, classDoc.startDate, classDoc.endDate, classDoc.days);
    res.json({ timetable, days: classDoc.days, ...stats });
  } catch (err) {
    console.error('Get student timetable error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getFacultyTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.find({ faculty: req.user.id }).populate('faculty', 'name');
    const classIds = [...new Set(timetable.map(slot => slot.class.toString()))];
    const classDoc = await Class.findById(classIds[0]);
    const stats = await calculateFacultyStats(req.user.id, timetable);
    res.json({ timetable, days: classDoc?.days || [], ...stats });
  } catch (err) {
    console.error('Get faculty timetable error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

const calculateCourseStats = async (classId, startDate, endDate, days) => {
  const holidays = await Holiday.find();
  const holidayDates = holidays.map(h => new Date(h.date).toDateString());
  let nationalHolidays = [];
  try {
    const response = await axios.get('https://date.nager.at/api/v3/PublicHolidays/2025/IN');
    if (Array.isArray(response.data)) {
      nationalHolidays = response.data.map(h => new Date(h.date).toDateString());
    }
  } catch (error) {
    console.error('Failed to fetch national holidays:', error.message);
  }
  const timetable = await Timetable.find({ class: classId });

  let totalDays = 0;
  let lectureDays = 0;
  let totalLectures = 0;
  const subjectLectures = {};
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    totalDays++;
    const dayName = d.toLocaleString('en-US', { weekday: 'short' });
    if (days.includes(dayName) && !holidayDates.includes(d.toDateString()) && !nationalHolidays.includes(d.toDateString())) {
      lectureDays++;
      const daySlots = timetable.filter(slot => slot.day === dayName);
      totalLectures += daySlots.length;
      daySlots.forEach(slot => {
        subjectLectures[slot.subject] = (subjectLectures[slot.subject] || 0) + 1;
      });
    }
  }
  return { totalDays, lectureDays, totalLectures, subjectLectures };
};

const calculateFacultyStats = async (facultyId, timetable) => {
  const subjectLectures = {};
  timetable.forEach(slot => {
    subjectLectures[`${slot.subject} (${slot.class})`] = (subjectLectures[`${slot.subject} (${slot.class})`] || 0) + 1;
  });
  return { subjectLectures };
};
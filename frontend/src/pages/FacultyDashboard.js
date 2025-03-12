import { useEffect, useState } from 'react';
import { TextField, Button, Container, Typography, Table, TableBody, TableCell, TableHead, TableRow, Checkbox, Paper, Alert } from '@mui/material';
import { getFacultyTimetable, getHolidays, getEvents, markAttendance, getClassStudents, createAssignment, getFacultyAssignments, gradeAssignment, getNotices, socket } from '../services/api';
import Navbar from '../components/Navbar';
import NoticeBoard from '../components/NoticeBoard';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './styles_faculty.css'; 

const FacultyDashboard = () => {
  const [view, setView] = useState('home');
  const [timetable, setTimetable] = useState([]);
  const [days, setDays] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [events, setEvents] = useState([]);
  const [courseStats, setCourseStats] = useState(null);
  const [attendanceData, setAttendanceData] = useState({ classId: '', date: '', subject: '' });
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [assignmentData, setAssignmentData] = useState({ title: '', description: '', dueDate: '', classId: '', file: '' });
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [gradeInput, setGradeInput] = useState({});
  const [search, setSearch] = useState('');
  const [notices, setNotices] = useState([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    socket.connect();
    const fetchData = async () => {
      try {
        const timetableRes = await getFacultyTimetable();
        setTimetable(timetableRes.data.timetable);
        setDays(timetableRes.data.days);
        setCourseStats(timetableRes.data);
        const holidaysRes = await getHolidays();
        setHolidays(holidaysRes.data);
        const eventsRes = await getEvents();
        setEvents(eventsRes.data);
        const assignmentsRes = await getFacultyAssignments();
        setAssignments(assignmentsRes.data);
        const noticesRes = await getNotices();
        setNotices(noticesRes.data);
      } catch (err) {
        setError(err.response?.data?.msg || 'Failed to fetch data');
      }
    };
    fetchData();

    socket.on('timetableUpdated', (data) => {
      setTimetable(data.timetable);
      setDays(data.days);
      setCourseStats(data);
    });
    socket.on('holidaysUpdated', (updatedHolidays) => setHolidays(updatedHolidays));
    socket.on('eventsUpdated', (updatedEvents) => setEvents(updatedEvents));
    socket.on('assignmentUpdated', async () => {
      const assignmentsRes = await getFacultyAssignments();
      setAssignments(assignmentsRes.data);
    });
    socket.on('noticesUpdated', (updatedNotices) => setNotices(updatedNotices));

    return () => {
      socket.off('timetableUpdated');
      socket.off('holidaysUpdated');
      socket.off('eventsUpdated');
      socket.off('assignmentUpdated');
      socket.off('noticesUpdated');
      socket.disconnect();
    };
  }, []);

  const fetchStudents = async (classId) => {
    if (classId) {
      try {
        const res = await getClassStudents(classId);
        setStudents(res.data);
        setAttendance(res.data.reduce((acc, student) => ({ ...acc, [student._id]: false }), {}));
      } catch (err) {
        setError(err.response?.data?.msg || 'Failed to fetch students');
      }
    }
  };

  const handleGradeChange = (assignmentId, studentId, value) => {
    setGradeInput({ ...gradeInput, [`${assignmentId}-${studentId}`]: value });
  };

  const submitGrade = async (assignmentId, studentId) => {
    const grade = gradeInput[`${assignmentId}-${studentId}`];
    if (grade !== undefined && grade >= 0 && grade <= 100) {
      try {
        const res = await gradeAssignment({ assignmentId, studentId, grade });
        setSuccessMsg(res.data.msg);
        setTimeout(() => setSuccessMsg(''), 3000);
        const assignmentsRes = await getFacultyAssignments();
        setAssignments(assignmentsRes.data);
        setError('');
      } catch (err) {
        setError(err.response?.data?.msg || 'Failed to grade assignment');
      }
    }
  };

  const tileClassName = ({ date }) => {
    const dateStr = date.toDateString();
    const isHoliday = holidays.some(h => new Date(h.date).toDateString() === dateStr);
    const isEvent = events.some(e => new Date(e.date).toDateString() === dateStr);
    return isHoliday ? 'holiday' : isEvent ? 'event' : null;
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await createAssignment(assignmentData);
      setSuccessMsg(res.data.msg);
      setTimeout(() => setSuccessMsg(''), 3000);
      setAssignmentData({ title: '', description: '', dueDate: '', classId: '', file: '' });
      const assignmentsRes = await getFacultyAssignments();
      setAssignments(assignmentsRes.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create assignment');
    }
  };

  const handleAssignmentSelect = (assignment) => {
    setSelectedAssignment(assignment);
    fetchStudents(assignment.classId);
  };

  const handleAttendanceSubmit = async (e) => {
    e.preventDefault();
    try {
      const attendanceRecords = Object.entries(attendance).map(([studentId, isPresent]) => ({
        studentId,
        status: isPresent ? 'present' : 'absent',
      }));
      const res = await markAttendance({
        classId: attendanceData.classId,
        date: attendanceData.date,
        subject: attendanceData.subject,
        attendance: attendanceRecords,
      });
      setSuccessMsg(res.data.msg);
      setTimeout(() => setSuccessMsg(''), 3000);
      setAttendanceData({ classId: '', date: '', subject: '' });
      setStudents([]);
      setAttendance({});
      setError('');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to mark attendance');
    }
  };

  const handleAttendanceChange = (studentId) => {
    setAttendance(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  return (
    <div className="faculty-dashboard">
      <Navbar />
      <NoticeBoard notices={notices} />
      <Container className="dashboard-container">
        <Typography variant="h4" gutterBottom className="dashboard-title">Faculty Dashboard</Typography>
        {successMsg && <Alert severity="success" className="alert">{successMsg}</Alert>}
        {error && <Alert severity="error" className="alert">{error}</Alert>}
        
        <div className="button-group">
          <Button variant="contained" onClick={() => setView('timetable')} className="dashboard-button timetable-button">My Timetable</Button>
          <Button variant="contained" onClick={() => setView('attendance')} className="dashboard-button attendance-button">Mark Attendance</Button>
          <Button variant="contained" onClick={() => setView('assignments')} className="dashboard-button assignments-button">Assignment/Grading</Button>
        </div>

        {view === 'timetable' && (
          <div className="section">
            <Typography variant="h5" className="section-title timetable-title">Your Timetable</Typography>
            <Paper className="paper">
              <Table className="table">
                <TableHead>
                  <TableRow className="table-header">
                    <TableCell className="table-header-cell">Day</TableCell>
                    {Array.from(new Set(timetable.map(slot => `${slot.startTime}-${slot.endTime}`))).map(time => (
                      <TableCell key={time} className="table-header-cell">{time}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {days.map(day => (
                    <TableRow key={day} className="table-row">
                      <TableCell className="table-cell">{day}</TableCell>
                      {Array.from(new Set(timetable.map(slot => `${slot.startTime}-${slot.endTime}`))).map(time => {
                        const slot = timetable.find(s => s.day === day && `${s.startTime}-${s.endTime}` === time);
                        return (
                          <TableCell key={time} className="table-cell">
                            {slot ? `${slot.subject} (${slot.class})` : '-'}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
            {courseStats && (
              <Paper className="paper stats-paper">
                {Object.entries(courseStats.subjectLectures || {}).map(([subject, count]) => (
                  <Typography key={subject} className="stats-text">{subject}: {count} lectures</Typography>
                ))}
              </Paper>
            )}
            <Typography variant="h5" className="section-title calendar-title">Calendar</Typography>
            <Calendar tileClassName={tileClassName} className="calendar" />
          </div>
        )}

        {view === 'attendance' && (
          <Paper className="paper section">
            <Typography variant="h5" className="section-title attendance-title">Mark Attendance</Typography>
            <form onSubmit={handleAttendanceSubmit} className="form">
              <TextField
                label="Class ID"
                value={attendanceData.classId}
                onChange={(e) => {
                  setAttendanceData({ ...attendanceData, classId: e.target.value });
                  fetchStudents(e.target.value);
                }}
                fullWidth
                margin="normal"
                required
                className="text-field"
              />
              <TextField
                label="Date"
                type="date"
                value={attendanceData.date}
                onChange={(e) => setAttendanceData({ ...attendanceData, date: e.target.value })}
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
                required
                className="text-field"
              />
              <TextField
                label="Subject"
                value={attendanceData.subject}
                onChange={(e) => setAttendanceData({ ...attendanceData, subject: e.target.value })}
                fullWidth
                margin="normal"
                required
                className="text-field"
              />
              {students.length > 0 && (
                <Table className="table">
                  <TableHead>
                    <TableRow className="table-header">
                      <TableCell className="table-header-cell">Student Name</TableCell>
                      <TableCell className="table-header-cell">Present</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.map(student => (
                      <TableRow key={student._id} className="table-row">
                        <TableCell className="table-cell">{student.name}</TableCell>
                        <TableCell className="table-cell">
                          <Checkbox
                            checked={attendance[student._id] || false}
                            onChange={() => handleAttendanceChange(student._id)}
                            className="checkbox"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <Button type="submit" variant="contained" className="submit-button attendance-submit" disabled={students.length === 0}>
                Submit Attendance
              </Button>
            </form>
          </Paper>
        )}

        {view === 'assignments' && (
          <div className="section">
            <Typography variant="h5" className="section-title assignments-title">Assignment/Grading</Typography>
            <div className="button-group">
              <Button variant="contained" onClick={() => setSelectedAssignment(null)} className="dashboard-button assign-button">Assign New</Button>
              <Button variant="contained" onClick={() => setSelectedAssignment('view')} className="dashboard-button view-button">View Submissions</Button>
            </div>

            {!selectedAssignment && (
              <Paper className="paper">
                <form onSubmit={handleAssignmentSubmit} className="form">
                  <TextField
                    label="Title"
                    value={assignmentData.title}
                    onChange={(e) => setAssignmentData({ ...assignmentData, title: e.target.value })}
                    fullWidth
                    margin="normal"
                    required
                    className="text-field"
                  />
                  <TextField
                    label="Description"
                    value={assignmentData.description}
                    onChange={(e) => setAssignmentData({ ...assignmentData, description: e.target.value })}
                    fullWidth
                    margin="normal"
                    className="text-field"
                  />
                  <TextField
                    label="Due Date"
                    type="date"
                    value={assignmentData.dueDate}
                    onChange={(e) => setAssignmentData({ ...assignmentData, dueDate: e.target.value })}
                    fullWidth
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                    required
                    className="text-field"
                  />
                  <TextField
                    label="Class ID"
                    value={assignmentData.classId}
                    onChange={(e) => setAssignmentData({ ...assignmentData, classId: e.target.value })}
                    fullWidth
                    margin="normal"
                    required
                    className="text-field"
                  />
                  <TextField
                    label="File URL"
                    value={assignmentData.file}
                    onChange={(e) => setAssignmentData({ ...assignmentData, file: e.target.value })}
                    fullWidth
                    margin="normal"
                    className="text-field"
                  />
                  <Button type="submit" variant="contained" className="submit-button assign-submit">Assign</Button>
                </form>
                <Typography variant="h6" className="sub-section-title">Previous Assignments</Typography>
                <Table className="table">
                  <TableBody>
                    {assignments.map(assignment => (
                      <TableRow key={assignment._id} className="table-row">
                        <TableCell className="table-cell">{assignment.title}</TableCell>
                        <TableCell className="table-cell">{new Date(assignment.dueDate).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            )}

            {selectedAssignment === 'view' && (
              <Paper className="paper">
                <TextField
                  label="Search Assignment"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  fullWidth
                  margin="normal"
                  className="text-field"
                />
                <Table className="table">
                  <TableBody>
                    {assignments.filter(assignment => assignment.title.toLowerCase().includes(search.toLowerCase())).map(assignment => (
                      <TableRow key={assignment._id} className="table-row">
                        <TableCell className="table-cell">{assignment.title}</TableCell>
                        <TableCell className="table-cell">
                          <Button variant="outlined" onClick={() => handleAssignmentSelect(assignment)} className="action-button">View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            )}

            {selectedAssignment && selectedAssignment !== 'view' && (
              <Paper className="paper">
                <Typography variant="h6" className="sub-section-title">{selectedAssignment.title}</Typography>
                <Typography className="description">{selectedAssignment.description}</Typography>
                {selectedAssignment.file && (
                  <Button href={selectedAssignment.file} target="_blank" variant="outlined" className="file-button">View File</Button>
                )}
                <Typography variant="h6" className="sub-section-title">Submissions</Typography>
                <Table className="table">
                  <TableHead>
                    <TableRow className="table-header">
                      <TableCell className="table-header-cell">Student Name</TableCell>
                      <TableCell className="table-header-cell">Submission</TableCell>
                      <TableCell className="table-header-cell">Grade</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedAssignment.submissions.map(sub => (
                      <TableRow key={sub.studentId} className="table-row">
                        <TableCell className="table-cell">{students.find(s => s._id === sub.studentId)?.name || sub.studentId}</TableCell>
                        <TableCell className="table-cell"><a href={sub.file} target="_blank" rel="noopener noreferrer" className="link">View</a></TableCell>
                        <TableCell className="table-cell">
                          {sub.grade !== undefined && sub.grade !== null ? (
                            sub.grade
                          ) : (
                            <div className="grade-input">
                              <TextField
                                type="number"
                                value={gradeInput[`${selectedAssignment._id}-${sub.studentId}`] || ''}
                                onChange={(e) => handleGradeChange(selectedAssignment._id, sub.studentId, e.target.value)}
                                inputProps={{ min: 0, max: 100 }}
                                size="small"
                                className="grade-field"
                              />
                              <Button variant="outlined" onClick={() => submitGrade(selectedAssignment._id, sub.studentId)} className="action-button">Submit</Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Typography variant="h6" className="sub-section-title">Not Submitted</Typography>
                <Table className="table">
                  <TableBody>
                    {students.filter(s => !selectedAssignment.submissions.some(sub => sub.studentId === s._id)).map(s => (
                      <TableRow key={s._id} className="table-row">
                        <TableCell className="table-cell">{s.name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            )}
          </div>
        )}
      </Container>
    </div>
  );
};

export default FacultyDashboard;
import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, Container, Typography, Button, Paper, Alert } from '@mui/material';
import { getStudentTimetable, getHolidays, getEvents, getStudentAttendance, getStudentAssignments, submitAssignment, getNotices, getUser, socket } from '../services/api';
import Navbar from '../components/Navbar';
import NoticeBoard from '../components/NoticeBoard';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './styles_student.css'; // Import the CSS file

const StudentDashboard = () => {
  const [view, setView] = useState('home');
  const [timetable, setTimetable] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [events, setEvents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [courseStats, setCourseStats] = useState(null);
  const [days, setDays] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [notices, setNotices] = useState([]);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    socket.connect();

    const fetchUserAndData = async () => {
      try {
        const userRes = await getUser();
        const fetchedUser = userRes.data;
        setUser(fetchedUser);
        localStorage.setItem('user', JSON.stringify(fetchedUser));

        const timetableRes = await getStudentTimetable();
        setTimetable(timetableRes.data.timetable || []);
        setDays(timetableRes.data.days || []);
        setCourseStats({
          totalDays: timetableRes.data.totalDays,
          lectureDays: timetableRes.data.lectureDays,
          totalLectures: timetableRes.data.totalLectures,
          subjectLectures: timetableRes.data.subjectLectures,
        });
        const holidaysRes = await getHolidays();
        setHolidays(holidaysRes.data);
        const eventsRes = await getEvents();
        setEvents(eventsRes.data);
        const attendanceRes = await getStudentAttendance();
        setAttendance(attendanceRes.data);
        const assignmentsRes = await getStudentAssignments();
        setAssignments(assignmentsRes.data);
        console.log('Initial assignments:', assignmentsRes.data); // Debug initial data
        const noticesRes = await getNotices();
        setNotices(noticesRes.data);
      } catch (err) {
        setError(err.response?.data?.msg || 'Failed to fetch data');
      }
    };
    fetchUserAndData();

    socket.on('timetableUpdated', (data) => {
      if (data.classId === user?.classId) {
        setTimetable(data.timetable || []);
        setDays(data.days || []);
        setCourseStats({
          totalDays: data.totalDays,
          lectureDays: data.lectureDays,
          totalLectures: data.totalLectures,
          subjectLectures: data.subjectLectures,
        });
      }
    });
    socket.on('holidaysUpdated', (updatedHolidays) => setHolidays(updatedHolidays));
    socket.on('eventsUpdated', (updatedEvents) => setEvents(updatedEvents));
    socket.on('attendanceUpdated', (data) => {
      if (data.classId === user?.classId) {
        setAttendance(data.records.filter(record => record.studentId.toString() === user?.id));
      }
    });
    socket.on('assignmentUpdated', async (data) => {
      if (data.classId === user?.classId) {
        try {
          const assignmentsRes = await getStudentAssignments();
          setAssignments(assignmentsRes.data);
          console.log('Assignments after update:', assignmentsRes.data); // Debug updated data
        } catch (err) {
          setError('Failed to refresh assignments after update');
        }
      }
    });
    socket.on('noticesUpdated', (updatedNotices) => setNotices(updatedNotices));

    return () => {
      socket.off('timetableUpdated');
      socket.off('holidaysUpdated');
      socket.off('eventsUpdated');
      socket.off('attendanceUpdated');
      socket.off('assignmentUpdated');
      socket.off('noticesUpdated');
      socket.disconnect();
    };
  }, [user?.classId, user?.id]);

  const tileClassName = ({ date }) => {
    const dateStr = date.toDateString();
    const isHoliday = holidays.some(h => new Date(h.date).toDateString() === dateStr);
    const isEvent = events.some(e => new Date(e.date).toDateString() === dateStr);
    return isHoliday ? 'holiday' : isEvent ? 'event' : null;
  };

  const tileContent = ({ date }) => {
    const dateStr = date.toDateString();
    const holiday = holidays.find(h => new Date(h.date).toDateString() === dateStr);
    const event = events.find(e => new Date(e.date).toDateString() === dateStr);
    return holiday ? <p>{holiday.name}</p> : event ? <p>{event.name}</p> : null;
  };

  const handleSubmitAssignment = async (assignmentId) => {
    const file = prompt('Enter file URL for submission:');
    if (!file) return;

    try {
      await submitAssignment({ assignmentId, file });
      setSuccessMsg('Assignment submitted successfully! It is now pending review.');
      setTimeout(() => setSuccessMsg(''), 3000);
      const assignmentsRes = await getStudentAssignments();
      setAssignments(assignmentsRes.data);
      console.log('Assignments after submission:', assignmentsRes.data); // Debug post-submission
      setError('');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to submit assignment');
    }
  };

  const getAttendanceStats = (subject) => {
    const subjectAttendance = attendance.filter(a => a.subject === subject);
    const total = subjectAttendance.length;
    const present = subjectAttendance.filter(a => a.status === 'present').length;
    const absent = total - present;
    const percent = total ? (present / total * 100).toFixed(2) : 0;
    const totalLectures = courseStats?.subjectLectures[subject] || 0;
    const requiredFor75 = Math.ceil(totalLectures * 0.75);
    const lecturesNeeded = present < requiredFor75 ? requiredFor75 - present : 0;
    return { total, present, absent, percent, lecturesNeeded, totalLectures };
  };

  return (
    <div className="student-dashboard">
      <Navbar />
      <NoticeBoard notices={notices} />
      <Container className="dashboard-container">
        <Typography variant="h4" gutterBottom className="dashboard-title">Student Dashboard</Typography>
        {successMsg && <Alert severity="success" className="alert">{successMsg}</Alert>}
        {error && <Alert severity="error" className="alert">{error}</Alert>}
        {!user && <Typography className="loading-text">Loading user data...</Typography>}
        {user && timetable.length === 0 && !error && (
          <Typography variant="h6" className="no-data-text">
            No timetable available. Please contact an admin to assign you to a class.
          </Typography>
        )}

        <Typography variant="h5" className="section-title calendar-title">Calendar</Typography>
        <Calendar tileClassName={tileClassName} tileContent={tileContent} className="calendar" />

        <div className="button-group">
          <Button variant="contained" onClick={() => setView('timetable')} className="dashboard-button timetable-button">My Timetable</Button>
          <Button variant="contained" onClick={() => setView('attendance')} className="dashboard-button attendance-button">My Attendance</Button>
          <Button variant="contained" onClick={() => setView('assignments')} className="dashboard-button assignments-button">Assignments</Button>
        </div>

        {view === 'home' && <Typography className="welcome-text">Welcome to your dashboard, {user?.name}!</Typography>}

        {view === 'timetable' && timetable.length > 0 && (
          <Paper className="paper section">
            <Typography variant="h5" className="section-title timetable-title">Your Class Timetable</Typography>
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
                          {slot ? `${slot.subject} (${slot.faculty?.name || 'Unknown'})` : '-'}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {courseStats && (
              <Paper className="paper stats-paper">
                <Typography className="stats-text">Total Days: {courseStats.totalDays}</Typography>
                <Typography className="stats-text">Lecture Days: {courseStats.lectureDays}</Typography>
                <Typography className="stats-text">Total Lectures: {courseStats.totalLectures}</Typography>
                {Object.entries(courseStats.subjectLectures || {}).map(([subject, count]) => (
                  <Typography key={subject} className="stats-text">{subject}: {count} lectures</Typography>
                ))}
              </Paper>
            )}
          </Paper>
        )}

        {view === 'attendance' && (
          <Paper className="paper section">
            <Typography variant="h5" className="section-title attendance-title">Your Attendance</Typography>
            <Table className="table">
              <TableHead>
                <TableRow className="table-header">
                  <TableCell className="table-header-cell">Subject</TableCell>
                  <TableCell className="table-header-cell">Total</TableCell>
                  <TableCell className="table-header-cell">Present</TableCell>
                  <TableCell className="table-header-cell">Absent</TableCell>
                  <TableCell className="table-header-cell">Percent</TableCell>
                  <TableCell className="table-header-cell">Needed for 75%</TableCell>
                  <TableCell className="table-header-cell">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.keys(courseStats?.subjectLectures || {}).map(subject => {
                  const stats = getAttendanceStats(subject);
                  return (
                    <TableRow key={subject} className="table-row">
                      <TableCell className="table-cell">{subject}</TableCell>
                      <TableCell className="table-cell">{stats.total}</TableCell>
                      <TableCell className="table-cell">{stats.present}</TableCell>
                      <TableCell className="table-cell">{stats.absent}</TableCell>
                      <TableCell className="table-cell">{stats.percent}%</TableCell>
                      <TableCell className="table-cell">{stats.lecturesNeeded} ({stats.totalLectures} total)</TableCell>
                      <TableCell className="table-cell">
                        <Button variant="outlined" onClick={() => setSelectedSubject(subject)} className="action-button">View</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {selectedSubject && (
              <Paper className="paper sub-section">
                <Typography variant="h6" className="sub-section-title">{selectedSubject} Attendance</Typography>
                <Table className="table">
                  <TableBody>
                    {attendance.filter(a => a.subject === selectedSubject).map(a => (
                      <TableRow key={a._id} className={`table-row ${a.status === 'present' ? 'present-row' : 'absent-row'}`}>
                        <TableCell className="table-cell">{new Date(a.date).toLocaleDateString()}</TableCell>
                        <TableCell className="table-cell">{a.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            )}
          </Paper>
        )}

        {view === 'assignments' && (
          <Paper className="paper section">
            <Typography variant="h5" className="section-title assignments-title">Assignments</Typography>

            <Typography variant="h6" className="sub-section-title">Pending (Submitted, Not Graded)</Typography>
            {assignments
              .filter(a => 
                a.submissions.some(s => 
                  s.studentId.toString() === user?.id && 
                  (s.grade === undefined || s.grade === null)
                )
              )
              .map(a => (
                <Paper key={a._id} className="paper assignment-card">
                  <Typography className="assignment-text">{a.title}</Typography>
                  <Typography className="assignment-text">{a.description}</Typography>
                  <Typography className="assignment-text">Due: {new Date(a.dueDate).toLocaleDateString()}</Typography>
                  <Typography className="assignment-text">
                    Submission: <a href={a.submissions.find(s => s.studentId.toString() === user?.id).file} target="_blank" rel="noopener noreferrer" className="link">View</a>
                  </Typography>
                  <Typography className="assignment-text">Status: Pending Review</Typography>
                </Paper>
              ))}

            <Typography variant="h6" className="sub-section-title">Graded</Typography>
            {assignments
              .filter(a => 
                a.submissions.some(s => 
                  s.studentId.toString() === user?.id && 
                  s.grade !== undefined && 
                  s.grade !== null
                )
              )
              .map(a => (
                <Paper key={a._id} className="paper assignment-card">
                  <Typography className="assignment-text">{a.title}</Typography>
                  <Typography className="assignment-text">{a.description}</Typography>
                  <Typography className="assignment-text">Due: {new Date(a.dueDate).toLocaleDateString()}</Typography>
                  <Typography className="assignment-text">
                    Submission: <a href={a.submissions.find(s => s.studentId.toString() === user?.id).file} target="_blank" rel="noopener noreferrer" className="link">View</a>
                  </Typography>
                  <Typography className="assignment-text">Grade: {a.submissions.find(s => s.studentId.toString() === user?.id).grade}</Typography>
                </Paper>
              ))}

            <Typography variant="h6" className="sub-section-title">Open (Not Submitted, Due Date Not Passed)</Typography>
            {assignments
              .filter(a => 
                new Date(a.dueDate) > new Date() && 
                !a.submissions.some(s => s.studentId.toString() === user?.id)
              )
              .map(a => (
                <Paper key={a._id} className="paper assignment-card">
                  <Typography className="assignment-text">{a.title}</Typography>
                  <Typography className="assignment-text">{a.description}</Typography>
                  <Typography className="assignment-text">Due: {new Date(a.dueDate).toLocaleDateString()}</Typography>
                  {a.file && <Button href={a.file} target="_blank" variant="outlined" className="file-button">View File</Button>}
                  <Button variant="contained" onClick={() => handleSubmitAssignment(a._id)} className="submit-button">Submit Assignment</Button>
                </Paper>
              ))}

            <Typography variant="h6" className="sub-section-title">Due (Not Submitted, Due Date Passed)</Typography>
            {assignments
              .filter(a => 
                new Date(a.dueDate) < new Date() && 
                !a.submissions.some(s => s.studentId.toString() === user?.id)
              )
              .map(a => (
                <Paper key={a._id} className="paper assignment-card">
                  <Typography className="assignment-text">{a.title}</Typography>
                  <Typography className="assignment-text">{a.description}</Typography>
                  <Typography className="assignment-text">Due: {new Date(a.dueDate).toLocaleDateString()} (Missed)</Typography>
                </Paper>
              ))}
          </Paper>
        )}
      </Container>
    </div>
  );
};

export default StudentDashboard;
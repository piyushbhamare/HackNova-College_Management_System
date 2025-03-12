import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, Container, Typography, Button, TextField, Checkbox, MenuItem } from '@mui/material';
import { getStudentTimetable, getAttendance, markAttendance, getStudentsByClass, getFacultyTimetable, socket } from '../services/api';
import Navbar from '../components/Navbar';

const Attendance = () => {
  const [timetable, setTimetable] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [classId, setClassId] = useState('');
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState('');
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [viewSubject, setViewSubject] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    socket.connect();
    const fetchData = async () => {
      if (user.role === 'student') {
        const timetableRes = await getStudentTimetable();
        setTimetable(timetableRes.data.timetable);
        const attendanceRes = await getAttendance();
        setAttendance(attendanceRes.data);
      } else if (user.role === 'faculty') {
        const timetableRes = await getFacultyTimetable();
        setTimetable(timetableRes.data.timetable); // Adjusted to match response structure
      }
    };
    fetchData();

    socket.on('attendanceUpdated', (data) => {
      if (user.role === 'student' && data.classId === user.classId) {
        setAttendance(prev => [...prev, ...data.records]);
      }
    });

    return () => {
      socket.off('attendanceUpdated');
      socket.disconnect();
    };
  }, [user.role, user.classId]);

  const fetchStudents = async () => {
    if (classId) {
      const res = await getStudentsByClass(classId);
      setStudents(res.data);
      setAttendanceData(res.data.reduce((acc, s) => ({ ...acc, [s._id]: 'absent' }), {})); // Default to absent
    }
  };

  const handleAttendanceSubmit = async (e) => {
    e.preventDefault();
    const attendanceList = Object.entries(attendanceData).map(([studentId, status]) => ({ studentId, status }));
    await markAttendance({ classId, subject, date, attendance: attendanceList });
    setClassId('');
    setSubject('');
    setDate('');
    setStudents([]);
    setAttendanceData({});
  };

  const stats = timetable.reduce((acc, slot) => {
    const subjectAttendance = attendance.filter(a => a.subject === slot.subject);
    acc[slot.subject] = {
      total: subjectAttendance.length,
      present: subjectAttendance.filter(a => a.status === 'present').length,
      absent: subjectAttendance.filter(a => a.status === 'absent').length,
    };
    return acc;
  }, {});

  return (
    <div>
      <Navbar />
      <Container>
        <Typography variant="h4" gutterBottom>{user.role === 'faculty' ? 'Mark Attendance' : 'My Attendance'}</Typography>
        {user.role === 'faculty' && (
          <>
            <TextField label="Class ID" value={classId} onChange={(e) => setClassId(e.target.value)} onBlur={fetchStudents} fullWidth margin="normal" />
            <TextField select label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} fullWidth margin="normal">
              {timetable.map(slot => (
                <MenuItem key={slot._id} value={slot.subject}>{slot.subject}</MenuItem>
              ))}
            </TextField>
            <TextField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} fullWidth margin="normal" InputLabelProps={{ shrink: true }} />
            {students.length > 0 && (
              <form onSubmit={handleAttendanceSubmit}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Student Name</TableCell>
                      <TableCell>Present</TableCell>
                      <TableCell>Absent</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.map(student => (
                      <TableRow key={student._id}>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>
                          <Checkbox
                            checked={attendanceData[student._id] === 'present'}
                            onChange={() => setAttendanceData({ ...attendanceData, [student._id]: 'present' })}
                          />
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={attendanceData[student._id] === 'absent'}
                            onChange={() => setAttendanceData({ ...attendanceData, [student._id]: 'absent' })}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Button type="submit" variant="contained" sx={{ mt: 2 }}>Mark Attendance</Button>
              </form>
            )}
          </>
        )}
        {user.role === 'student' && (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Subject</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Present</TableCell>
                  <TableCell>Absent</TableCell>
                  <TableCell>Attendance %</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(stats).map(([subject, data]) => (
                  <TableRow key={subject}>
                    <TableCell>{subject}</TableCell>
                    <TableCell>{data.total}</TableCell>
                    <TableCell>{data.present}</TableCell>
                    <TableCell>{data.absent}</TableCell>
                    <TableCell>{data.total > 0 ? ((data.present / data.total) * 100).toFixed(2) : 0}%</TableCell>
                    <TableCell>
                      <Button onClick={() => setViewSubject(subject)}>View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {viewSubject && (
              <>
                <Typography variant="h5" gutterBottom>{viewSubject} Attendance</Typography>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendance.filter(a => a.subject === viewSubject).map(a => (
                      <TableRow key={a._id} sx={{ backgroundColor: a.status === 'present' ? '#e6ffe6' : '#ffe6e6' }}>
                        <TableCell>{new Date(a.date).toLocaleDateString()}</TableCell>
                        <TableCell>{a.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </>
        )}
      </Container>
    </div>
  );
};

export default Attendance;
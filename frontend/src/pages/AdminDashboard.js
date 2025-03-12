import { useEffect, useState } from 'react';
import { TextField, Button, Container, Typography, Table, TableBody, TableCell, TableHead, TableRow, MenuItem, Paper, Alert } from '@mui/material';
import { createTimetable, getFacultyTimetable, addHoliday, getHolidays, addEvent, getEvents, createNotice, getNotices, getFaculties, socket } from '../services/api';
import Navbar from '../components/Navbar';
import NoticeBoard from '../components/NoticeBoard';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const AdminDashboard = () => {
  const [view, setView] = useState('home');
  const [classId, setClassId] = useState('');
  const [timetable, setTimetable] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [days, setDays] = useState([]);
  const [holiday, setHoliday] = useState({ name: '', date: '' });
  const [holidays, setHolidays] = useState([]);
  const [events, setEvents] = useState([]);
  const [courseStats, setCourseStats] = useState(null);
  const [faculties, setFaculties] = useState([]);
  const [notices, setNotices] = useState([]);
  const [notice, setNotice] = useState({ title: '', content: '' });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    socket.connect();
    const fetchData = async () => {
      try {
        const timetableRes = await getFacultyTimetable();
        setTimetable(timetableRes.data.timetable || []);
        setDays(timetableRes.data.days || []);
        setCourseStats(timetableRes.data);
        const holidaysRes = await getHolidays();
        setHolidays(holidaysRes.data);
        const eventsRes = await getEvents();
        setEvents(eventsRes.data);
        const noticesRes = await getNotices();
        setNotices(noticesRes.data);
        const facultiesRes = await getFaculties();
        setFaculties(facultiesRes.data);
      } catch (err) {
        setError(err.response?.data?.msg || 'Failed to fetch data');
      }
    };
    fetchData();

    socket.on('timetableUpdated', (data) => {
      setTimetable(data.timetable || []);
      setDays(data.days || []);
      setCourseStats({
        totalDays: data.totalDays,
        lectureDays: data.lectureDays,
        totalLectures: data.totalLectures,
        subjectLectures: data.subjectLectures,
      });
    });
    socket.on('holidaysUpdated', (updatedHolidays) => setHolidays(updatedHolidays));
    socket.on('eventsUpdated', (updatedEvents) => setEvents(updatedEvents));
    socket.on('noticesUpdated', (updatedNotices) => setNotices(updatedNotices));

    return () => {
      socket.off('timetableUpdated');
      socket.off('holidaysUpdated');
      socket.off('eventsUpdated');
      socket.off('noticesUpdated');
      socket.disconnect();
    };
  }, []);

  const handleNoticeSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await createNotice(notice);
      setNotice({ title: '', content: '' });
      setSuccessMsg(res.data.msg || 'Notice posted successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
      setError('');
      socket.emit('noticesUpdated', [...notices, res.data]); // Assuming API returns the new notice
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to post notice');
    }
  };

  const handleHolidaySubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await addHoliday(holiday);
      setHoliday({ name: '', date: '' });
      setSuccessMsg(res.data.msg || 'Holiday added successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
      setError('');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to add holiday');
    }
  };

  const handleEventSubmit = async (e, date, name, description) => {
    e?.preventDefault();
    try {
      const res = await addEvent({ name, date, description });
      setSuccessMsg(res.data.msg || 'Event added successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
      setError('');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to add event');
    }
  };

  const addSlot = () => setTimetable([...timetable, { day: '', startTime: '', endTime: '', subject: '', faculty: '' }]);
  const removeSlot = (index) => setTimetable(timetable.filter((_, i) => i !== index));
  const handleSlotChange = (index, field, value) => {
    const newTimetable = [...timetable];
    newTimetable[index][field] = value;
    setTimetable(newTimetable);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const timetableData = timetable.map(slot => ({
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        subject: slot.subject,
        faculty: slot.faculty,
      }));
      const res = await createTimetable({ classId, timetable: timetableData, startDate, endDate, days });
      setTimetable(res.data.timetable);
      setDays(res.data.days);
      setCourseStats({
        totalDays: res.data.totalDays,
        lectureDays: res.data.lectureDays,
        totalLectures: res.data.totalLectures,
        subjectLectures: res.data.subjectLectures,
      });
      setSuccessMsg(res.data.msg);
      setTimeout(() => setSuccessMsg(''), 3000);
      setError('');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to save timetable');
    }
  };

  const tileClassName = ({ date }) => {
    const dateStr = date.toDateString();
    const holiday = holidays.find(h => new Date(h.date).toDateString() === dateStr);
    const isEvent = events.some(e => new Date(e.date).toDateString() === dateStr);
    return holiday ? 'holiday' : isEvent ? 'event' : null;
  };

  const tileContent = ({ date }) => {
    const dateStr = date.toDateString();
    const holiday = holidays.find(h => new Date(h.date).toDateString() === dateStr);
    const event = events.find(e => new Date(e.date).toDateString() === dateStr);
    return holiday ? <p>{holiday.name}</p> : event ? <p>{event.name}</p> : null;
  };

  const handleCalendarClick = (date) => {
    const holidayExists = holidays.some(h => new Date(h.date).toDateString() === date.toDateString());
    const eventExists = events.some(e => new Date(e.date).toDateString() === date.toDateString());
    if (!holidayExists && !eventExists) {
      const action = prompt('Enter "holiday" to add a holiday or "event" to add an event:');
      if (action === 'holiday') {
        const name = prompt('Enter holiday name:');
        if (name) handleHolidaySubmit({ preventDefault: () => {}, target: { name, date: date.toISOString().split('T')[0] } });
      } else if (action === 'event') {
        const name = prompt('Enter event name:');
        const description = prompt('Enter event description (optional):');
        if (name) handleEventSubmit(null, date.toISOString().split('T')[0], name, description);
      }
    }
  };

  return (
    <div>
      <Navbar />
      <NoticeBoard notices={notices} />
      <Container>
        <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>
        {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Typography variant="h5" color="primary" gutterBottom sx={{ mt: 2 }}>Calendar</Typography>
        <Calendar onClickDay={handleCalendarClick} tileClassName={tileClassName} tileContent={tileContent} sx={{ mb: 2 }} />

        <Button variant="contained" onClick={() => setView('timetable')} sx={{ m: 1 }}>View Timetable</Button>
        <Button variant="contained" onClick={() => setView('holidays')} sx={{ m: 1 }}>Add Holiday</Button>
        <Button variant="contained" onClick={() => setView('notices')} sx={{ m: 1 }}>Add Notice</Button>

        {view === 'timetable' && (
          <Paper elevation={3} sx={{ p: 2, mt: 2 }}>
            <Typography variant="h5" color="primary" gutterBottom>Timetable</Typography>
            {timetable.length > 0 ? (
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#1976d2' }}>
                    <TableCell sx={{ color: 'white' }}>Day</TableCell>
                    {Array.from(new Set(timetable.map(slot => `${slot.startTime}-${slot.endTime}`))).map(time => (
                      <TableCell key={time} sx={{ color: 'white' }}>{time}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {days.map(day => (
                    <TableRow key={day} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f5f5f5' } }}>
                      <TableCell>{day}</TableCell>
                      {Array.from(new Set(timetable.map(slot => `${slot.startTime}-${slot.endTime}`))).map(time => {
                        const slot = timetable.find(s => s.day === day && `${s.startTime}-${s.endTime}` === time);
                        return (
                          <TableCell key={time}>
                            {slot ? `${slot.subject} (${faculties.find(f => f._id === slot.faculty)?.name || 'Unknown'})` : '-'}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Typography>No timetable available.</Typography>
            )}
            {courseStats && (
              <Paper elevation={3} sx={{ p: 2, mt: 2 }}>
                <Typography>Total Days: {courseStats.totalDays}</Typography>
                <Typography>Lecture Days: {courseStats.lectureDays}</Typography>
                <Typography>Total Lectures: {courseStats.totalLectures}</Typography>
                {Object.entries(courseStats.subjectLectures || {}).map(([subject, count]) => (
                  <Typography key={subject}>{subject}: {count} lectures</Typography>
                ))}
              </Paper>
            )}
          </Paper>
        )}

        {view === 'holidays' && (
          <Paper elevation={3} sx={{ p: 2, mt: 2 }}>
            <Typography variant="h5" color="primary" gutterBottom>Add Holiday</Typography>
            <form onSubmit={handleHolidaySubmit}>
              <TextField
                label="Holiday Name"
                value={holiday.name}
                onChange={(e) => setHoliday({ ...holiday, name: e.target.value })}
                fullWidth
                margin="normal"
                required
              />
              <TextField
                label="Date"
                type="date"
                value={holiday.date}
                onChange={(e) => setHoliday({ ...holiday, date: e.target.value })}
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
                required
              />
              <Button type="submit" variant="contained" sx={{ mt: 2 }}>Add Holiday</Button>
            </form>
          </Paper>
        )}

        {view === 'notices' && (
          <Paper elevation={3} sx={{ p: 2, mt: 2 }}>
            <Typography variant="h5" color="primary" gutterBottom>Add Notice</Typography>
            <form onSubmit={handleNoticeSubmit}>
              <TextField
                label="Title"
                value={notice.title}
                onChange={(e) => setNotice({ ...notice, title: e.target.value })}
                fullWidth
                margin="normal"
                required
              />
              <TextField
                label="Content"
                value={notice.content}
                onChange={(e) => setNotice({ ...notice, content: e.target.value })}
                fullWidth
                margin="normal"
                multiline
                rows={4}
                required
              />
              <Button type="submit" variant="contained" sx={{ mt: 2 }}>Post Notice</Button>
            </form>
          </Paper>
        )}

        {view === 'home' && (
          <>
            <Typography variant="h5" color="primary" gutterBottom>Create Timetable</Typography>
            <Paper elevation={3} sx={{ p: 2 }}>
              <form onSubmit={handleSubmit}>
                <TextField label="Class ID" value={classId} onChange={(e) => setClassId(e.target.value)} fullWidth margin="normal" required />
                <TextField label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} fullWidth margin="normal" InputLabelProps={{ shrink: true }} required />
                <TextField label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} fullWidth margin="normal" InputLabelProps={{ shrink: true }} required />
                <TextField label="Days (e.g., Mon,Tue)" value={days.join(',')} onChange={(e) => setDays(e.target.value.split(','))} fullWidth margin="normal" required />
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#1976d2' }}>
                      <TableCell sx={{ color: 'white' }}>Day</TableCell>
                      <TableCell sx={{ color: 'white' }}>Start Time</TableCell>
                      <TableCell sx={{ color: 'white' }}>End Time</TableCell>
                      <TableCell sx={{ color: 'white' }}>Subject</TableCell>
                      <TableCell sx={{ color: 'white' }}>Faculty</TableCell>
                      <TableCell sx={{ color: 'white' }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {timetable.map((slot, index) => (
                      <TableRow key={index} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f5f5f5' } }}>
                        <TableCell><TextField value={slot.day} onChange={(e) => handleSlotChange(index, 'day', e.target.value)} required /></TableCell>
                        <TableCell><TextField value={slot.startTime} onChange={(e) => handleSlotChange(index, 'startTime', e.target.value)} required /></TableCell>
                        <TableCell><TextField value={slot.endTime} onChange={(e) => handleSlotChange(index, 'endTime', e.target.value)} required /></TableCell>
                        <TableCell><TextField value={slot.subject} onChange={(e) => handleSlotChange(index, 'subject', e.target.value)} required /></TableCell>
                        <TableCell>
                          <TextField
                            select
                            value={slot.faculty}
                            onChange={(e) => handleSlotChange(index, 'faculty', e.target.value)}
                            fullWidth
                            required
                          >
                            {faculties.map(f => (
                              <MenuItem key={f._id} value={f._id}>{f.name}</MenuItem>
                            ))}
                          </TextField>
                        </TableCell>
                        <TableCell><Button variant="outlined" color="error" onClick={() => removeSlot(index)}>Remove</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Button onClick={addSlot} variant="outlined" sx={{ mt: 2, mr: 2 }}>Add Slot</Button>
                <Button type="submit" variant="contained" sx={{ mt: 2 }}>Save Timetable</Button>
              </form>
            </Paper>
          </>
        )}
      </Container>
    </div>
  );
};

export default AdminDashboard;
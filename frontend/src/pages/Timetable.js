import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, Container, Typography, Button } from '@mui/material';
import { getStudentTimetable, getFacultyTimetable, getHolidays, getEvents, createTimetable, addHoliday, addEvent, socket } from '../services/api';
import Navbar from '../components/Navbar';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const Timetable = () => {
  const [timetable, setTimetable] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [events, setEvents] = useState([]);
  const [courseStats, setCourseStats] = useState(null);
  const [newTimetable, setNewTimetable] = useState([]);
  const [classId, setClassId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [days, setDays] = useState([]);
  const [holiday, setHoliday] = useState({ name: '', date: '' });
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    socket.connect();
    const fetchData = async () => {
      try {
        if (user.role === 'student') {
          const res = await getStudentTimetable();
          setTimetable(res.data.timetable);
          setCourseStats(res.data);
        } else if (user.role === 'faculty') {
          const res = await getFacultyTimetable();
          setTimetable(res.data);
        }
        const holidaysRes = await getHolidays();
        setHolidays(holidaysRes.data);
        const eventsRes = await getEvents();
        setEvents(eventsRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();

    socket.on('timetableUpdated', (data) => {
      if (user.role === 'student' && data.classId === user.class) {
        setTimetable(data.timetable);
      } else if (user.role === 'faculty') {
        const updatedTimetable = timetable.filter(slot => slot.class.toString() !== data.classId);
        setTimetable([...updatedTimetable, ...data.timetable.filter(slot => slot.faculty === user.id)]);
      }
    });
    socket.on('holidaysUpdated', (updatedHolidays) => setHolidays(updatedHolidays));
    socket.on('eventsUpdated', (updatedEvents) => setEvents(updatedEvents));

    return () => {
      socket.off('timetableUpdated');
      socket.off('holidaysUpdated');
      socket.off('eventsUpdated');
      socket.disconnect();
    };
  }, [user.role, user.class, user.id]);

  const addSlot = () => setNewTimetable([...newTimetable, { day: '', startTime: '', endTime: '', subject: '', faculty: '' }]);
  const removeSlot = (index) => setNewTimetable(newTimetable.filter((_, i) => i !== index));
  const handleSlotChange = (index, field, value) => {
    const updated = [...newTimetable];
    updated[index][field] = value;
    setNewTimetable(updated);
  };

  const handleTimetableSubmit = async (e) => {
    e.preventDefault();
    const res = await createTimetable({ classId, timetable: newTimetable, startDate, endDate, days });
    setCourseStats(res.data);
    setNewTimetable([]);
  };

  const handleHolidaySubmit = async (e) => {
    e.preventDefault();
    await addHoliday(holiday);
    setHoliday({ name: '', date: '' });
  };

  const handleCalendarClick = async (date) => {
    const holidayExists = holidays.some(h => new Date(h.date).toDateString() === date.toDateString());
    const eventExists = events.some(e => new Date(e.date).toDateString() === date.toDateString());
    if (!holidayExists && !eventExists && user.role === 'admin') {
      const action = prompt('Enter "holiday" or "event":');
      if (action === 'holiday') {
        const name = prompt('Enter holiday name:');
        if (name) setHoliday({ name, date: date.toISOString().split('T')[0] });
      } else if (action === 'event') {
        const name = prompt('Enter event name:');
        const description = prompt('Enter event description (optional):');
        if (name) await addEvent({ name, date: date.toISOString().split('T')[0], description });
      }
    }
  };

  const tileClassName = ({ date }) => {
    const isHoliday = holidays.some(h => new Date(h.date).toDateString() === date.toDateString());
    const isEvent = events.some(e => new Date(e.date).toDateString() === date.toDateString());
    return isHoliday ? 'holiday' : isEvent ? 'event' : null;
  };

  const lectureCount = timetable.reduce((acc, slot) => {
    const key = user.role === 'faculty' ? `${slot.subject} (${slot.class.name})` : slot.subject;
    acc[key] = (acc[key] || 0) + (courseStats?.lectureDays || 0);
    return acc;
  }, {});

  return (
    <div>
      <Navbar />
      <Container>
        <Typography variant="h4" gutterBottom>Timetable</Typography>
        {user.role === 'admin' && (
          <>
            <Typography variant="h5">Create Timetable</Typography>
            <form onSubmit={handleTimetableSubmit}>
              <TextField label="Class ID" value={classId} onChange={(e) => setClassId(e.target.value)} fullWidth margin="normal" />
              <TextField label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} fullWidth margin="normal" InputLabelProps={{ shrink: true }} />
              <TextField label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} fullWidth margin="normal" InputLabelProps={{ shrink: true }} />
              <TextField label="Days (e.g., Mon,Tue)" value={days.join(',')} onChange={(e) => setDays(e.target.value.split(','))} fullWidth margin="normal" />
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Day</TableCell>
                    <TableCell>Start Time</TableCell>
                    <TableCell>End Time</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Faculty ID</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {newTimetable.map((slot, index) => (
                    <TableRow key={index}>
                      <TableCell><TextField value={slot.day} onChange={(e) => handleSlotChange(index, 'day', e.target.value)} /></TableCell>
                      <TableCell><TextField value={slot.startTime} onChange={(e) => handleSlotChange(index, 'startTime', e.target.value)} /></TableCell>
                      <TableCell><TextField value={slot.endTime} onChange={(e) => handleSlotChange(index, 'endTime', e.target.value)} /></TableCell>
                      <TableCell><TextField value={slot.subject} onChange={(e) => handleSlotChange(index, 'subject', e.target.value)} /></TableCell>
                      <TableCell><TextField value={slot.faculty} onChange={(e) => handleSlotChange(index, 'faculty', e.target.value)} /></TableCell>
                      <TableCell><Button onClick={() => removeSlot(index)}>Remove</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button onClick={addSlot} variant="outlined" style={{ margin: '10px' }}>Add Slot</Button>
              <Button type="submit" variant="contained">Save Timetable</Button>
            </form>
            <Typography variant="h5">Add Holiday</Typography>
            <form onSubmit={handleHolidaySubmit}>
              <TextField label="Holiday Name" value={holiday.name} onChange={(e) => setHoliday({ ...holiday, name: e.target.value })} fullWidth margin="normal" />
              <TextField label="Date" type="date" value={holiday.date} onChange={(e) => setHoliday({ ...holiday, date: e.target.value })} fullWidth margin="normal" InputLabelProps={{ shrink: true }} />
              <Button type="submit" variant="contained">Add Holiday</Button>
            </form>
          </>
        )}
        <Typography variant="h5">Your Timetable</Typography>
        <Table>
          <TableHead>
            <TableRow>
              {user.role === 'faculty' && <TableCell>Class</TableCell>}
              <TableCell>Day</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell>End Time</TableCell>
              <TableCell>Subject</TableCell>
              {user.role !== 'faculty' && <TableCell>Faculty</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {timetable.map((slot) => (
              <TableRow key={slot._id}>
                {user.role === 'faculty' && <TableCell>{slot.class.name}</TableCell>}
                <TableCell>{slot.day}</TableCell>
                <TableCell>{slot.startTime}</TableCell>
                <TableCell>{slot.endTime}</TableCell>
                <TableCell>{slot.subject}</TableCell>
                {user.role !== 'faculty' && <TableCell>{slot.faculty.name}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {courseStats && (
          <div>
            <Typography>Total Days: {courseStats.totalDays}</Typography>
            <Typography>Lecture Days: {courseStats.lectureDays}</Typography>
            <Typography>Total Lectures: {courseStats.totalLectures}</Typography>
            <Typography variant="h6">Lectures per Subject:</Typography>
            {Object.entries(lectureCount).map(([key, count]) => (
              <Typography key={key}>{key}: {count}</Typography>
            ))}
          </div>
        )}
        <Typography variant="h5">Calendar</Typography>
        <Calendar onClickDay={handleCalendarClick} tileClassName={tileClassName} />
      </Container>
    </div>
  );
};

export default Timetable;
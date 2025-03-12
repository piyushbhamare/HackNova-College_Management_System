// services/api.js
import axios from 'axios';
import { io } from 'socket.io-client';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const socket = io('http://localhost:5000', { autoConnect: false });

//Get ClassID
export const getClasses = () => API.get('/classes');

// Auth
export const login = (data) => API.post('/auth/login', data);
export const register = (data) => API.post('/auth/register', data);
export const getUser = () => API.get('/auth/me'); // Already present, ensuring it’s used
export const getFaculties = () => API.get('/auth/faculties');

// Timetable
export const createTimetable = (data) => API.post('/timetable', data);
export const getStudentTimetable = () => API.get('/timetable/student');
export const getFacultyTimetable = () => API.get('/timetable/faculty');
export const addHoliday = (data) => API.post('/timetable/holiday', data);
export const getHolidays = () => API.get('/timetable/holidays');
export const addEvent = (data) => API.post('/timetable/event', data);
export const getEvents = () => API.get('/timetable/events');

// Attendance
export const markAttendance = (data) => API.post('/attendance', data);
export const getStudentAttendance = () => API.get('/attendance/student');
export const getClassStudents = (classId) => API.get(`/attendance/students?classId=${classId}`);

// Assignments
export const createAssignment = (data) => API.post('/assignments', data);
export const getFacultyAssignments = () => API.get('/assignments/faculty');
export const getStudentAssignments = () => API.get('/assignments/student');
export const submitAssignment = (data) => API.post('/assignments/submit', data);
export const gradeAssignment = (data) => API.post('/assignments/grade', data);

// Notices
export const createNotice = (data) => API.post('/notice', data);
export const getNotices = () => API.get('/notice');
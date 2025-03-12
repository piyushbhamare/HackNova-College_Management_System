# HackNova-College_Management_System
# Faculty-Student Dashboard

**Team - CloudVision**

A comprehensive dashboard application designed for faculty and students, built with React and Material-UI (MUI). This project offers tools to manage timetables, attendance, assignments, and notices, with real-time updates powered by Socket.IO. It aims to streamline academic workflows and improve communication within educational institutions.

---

## Table of Contents
- [Features](#features)
- [Technologies](#technologies)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Project Structure](#project-structure)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Faculty Dashboard
- **Timetable Management**: View your personal timetable with subjects and class details, updated in real-time.
- **Attendance Tracking**: Mark and submit student attendance for a specific class using an intuitive checkbox interface.
- **Assignment Management**: Create assignments, view student submissions, assign grades, and monitor progress.
- **Calendar**: Display holidays and events with a color-coded calendar for easy planning.
- **Notices**: Access real-time notices through a dedicated notice board.
- **Real-Time Updates**: Leverage Socket.IO for live updates on timetable, holidays, events, assignments, and notices.

### Student Dashboard
- **Timetable Access**: View your class timetable, including faculty details.
- **Attendance Overview**: Check detailed attendance stats per subject, including percentage and lectures needed to maintain 75% attendance.
- **Assignment Tracking**: Submit assignments, review pending, graded, open, and overdue assignments with file links.
- **Calendar**: Visualize holidays and events with hoverable descriptions.
- **Notices**: Stay informed with real-time notice updates.
- **Real-Time Updates**: Receive live updates via Socket.IO for timetable, attendance, assignments, and notices.

---

## Technologies
- **Frontend**: React, Material-UI (MUI), React-Calendar
- **Real-Time Communication**: Socket.IO
- **Styling**: Custom CSS
- **API Integration**: Custom API services (`../services/api`)
- **Dependencies**: Node.js, npm

---

## Prerequisites
Before setting up the project, ensure the following are installed:
- **Node.js** (v14.x or later)
- **npm** (v6.x or later) or **yarn** (optional)
- A backend server with required API endpoints (e.g., `getFacultyTimetable`, `getStudentAssignments`, etc.) and Socket.IO support.

---

## Setup Instructions

### 1. Clone the Repository
git clone https://github.com/your-username/faculty-student-dashboard.git
cd faculty-student-dashboard

### 2. Install Dependencies
Install the required npm packages:
npm install

### 3. Configure Environment Variables
Create a .env file  to configure the API and Socket.IO endpoints.

### 4. Run the Application
Start the backend server:
npm run dev

Run the frontend server:
npm start

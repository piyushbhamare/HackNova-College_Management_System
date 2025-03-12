import { Typography, Paper } from '@mui/material';

const NoticeBoard = () => {
  // Static notices for demo; replace with API call if dynamic
  const notices = [
    { id: 1, text: 'Exam schedule released!' },
    { id: 2, text: 'Submit assignments by March 15.' },
  ];

  return (
    <Paper style={{ padding: 16 }}>
      <Typography variant="h5">Notice Board</Typography>
      {notices.map((notice) => (
        <Typography key={notice.id}>{notice.text}</Typography>
      ))}
    </Paper>
  );
};

export default NoticeBoard;
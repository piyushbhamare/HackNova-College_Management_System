import { Typography, Paper } from '@mui/material';

const NoticeBoard = ({ notices }) => (
  <Paper sx={{ p: 2, mb: 2 }}>
    <Typography variant="h6">Notice Board</Typography>
    {notices.length > 0 ? (
      notices.map((notice) => (
        <Typography key={notice._id} sx={{ mt: 1 }}>
          <strong>{notice.title}</strong> - {notice.content} (Posted on: {new Date(notice.createdAt).toLocaleDateString()})
        </Typography>
      ))
    ) : (
      <Typography>No notices available</Typography>
    )}
  </Paper>
);

export default NoticeBoard;
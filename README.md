# TMS<br>
alterantive of chat gpt<br>
https://www.perplexity.ai/<br>
https://www.meta.ai/<br>
https://www.nomic.ai/gpt4all<br>
<br>
no limit and free<br>
https://chat.mistral.ai/<br>
https://poe.com/<br>



SELECT task_name, 
       completion_date, 
       (completion_date - CURRENT_DATE) AS due_days
FROM tasks;



const express = require('express');
const { Pool } = require('pg');
const app = express();

app.use(express.json());

// PostgreSQL database connection
const pool = new Pool({
  user: 'your-username',
  host: 'localhost',
  database: 'your-database',
  password: 'your-password',
  port: 5432,
});

// Helper function to calculate due days
function calculateDueDays(completionDate) {
  const currentDate = new Date();
  const dueDate = new Date(completionDate);
  
  // Calculate the difference in time
  const timeDiff = dueDate.getTime() - currentDate.getTime();
  
  // Convert time difference to days
  const dueDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); // Convert milliseconds to days

  return dueDays;
}

// Route to get tasks with due days
app.get('/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks');
    const tasks = result.rows;

    // Add due days to each task
    tasks.forEach(task => {
      task.due_days = calculateDueDays(task.completion_date);
    });

    res.status(200).json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error retrieving tasks' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



[
  {
    "task_id": 1,
    "assigned_to": 2,
    "task_name": "Complete project report",
    "task_description": "Finish the project report by the end of the week",
    "completion_date": "2024-10-10",
    "is_recurring": false,
    "created_at": "2024-09-30T10:00:00.000Z",
    "updated_at": "2024-09-30T10:00:00.000Z",
    "due_days": 10
  },
  {
    "task_id": 2,
    "assigned_to": 1,
    "task_name": "Prepare presentation",
    "task_description": "Prepare the presentation for the client",
    "completion_date": "2024-09-25",
    "is_recurring": false,
    "created_at": "2024-09-01T10:00:00.000Z",
    "updated_at": "2024-09-01T10:00:00.000Z",
    "due_days": -5  // Overdue by 5 days
  }
]

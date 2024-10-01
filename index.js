-- Table for storing tasks
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    task_name VARCHAR(255),     -- Task title
    task_description TEXT,      -- Task description
    assigned_to VARCHAR(255),   -- Who the task is assigned to
    created_by VARCHAR(255),    -- Who created the task
    completion_date DATE,       -- Deadline for the task
    is_recurring BOOLEAN,       -- Is it a recurring task? (true/false)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for storing recurring task details
CREATE TABLE recurring_tasks (
    id SERIAL PRIMARY KEY,
    task_id INT REFERENCES tasks(id) ON DELETE CASCADE,  -- Links to the task
    repeat_schedule VARCHAR(50), -- How often the task repeats (e.g., Daily)
    repeat_time TIME             -- What time the task should repeat each day
);



// This is a simple Express.js controller function to create a task.

const createTask = async (req, res) => {
  const { task_name, task_description, assigned_to, created_by, completion_date, is_recurring, repeat_schedule, repeat_time } = req.body;

  try {
      // Insert the task into the 'tasks' table
      const taskResult = await db.query(
          `INSERT INTO tasks (task_name, task_description, assigned_to, created_by, completion_date, is_recurring)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [task_name, task_description, assigned_to, created_by, completion_date, is_recurring]
      );

      const taskId = taskResult.rows[0].id;

      // If the task is recurring, insert details into the 'recurring_tasks' table
      if (is_recurring) {
          await db.query(
              `INSERT INTO recurring_tasks (task_id, repeat_schedule, repeat_time)
               VALUES ($1, $2, $3)`,
              [taskId, repeat_schedule, repeat_time]
          );
      }

      res.status(201).json({ message: 'Task created successfully', taskId });
  } catch (error) {
      res.status(500).json({ message: 'Error creating task', error });
  }
};




const express = require('express');
const router = express.Router();
const { createTask } = require('./controllers/taskController');

// This defines the route for creating a new task
router.post('/tasks', createTask);

module.exports = router;








const cron = require('node-cron');

// Run this code every day at 10:00 AM to check for recurring tasks
cron.schedule('0 10 * * *', async () => {
    // Here you would query the database for recurring tasks and create new task entries
    const recurringTasks = await db.query('SELECT * FROM recurring_tasks WHERE repeat_schedule = $1', ['Daily']);
    recurringTasks.rows.forEach(task => {
        // For each recurring task, create a new task in the 'tasks' table
        await db.query(
            `INSERT INTO tasks (task_name, task_description, assigned_to, created_by, completion_date, is_recurring)
             SELECT task_name, task_description, assigned_to, created_by, $1, true
             FROM tasks WHERE id = $2`,
            [new Date(), task.task_id]
        );
    });
});







{
  "task_name": "New Recurring Task",
  "task_description": "This is a sample task",
  "assigned_to": "Aaryan Jain",
  "created_by": "Rakesh Jain",
  "completion_date": "2024-11-01",
  "is_recurring": true,
  "repeat_schedule": "Daily",
  "repeat_time": "10:00 AM"
}










{
  "task_name": "One-time Task",
  "task_description": "This is a task that does not repeat.",
  "assigned_to": "Aaryan Jain",
  "created_by": "Rakesh Jain",
  "completion_date": "2024-11-01",
  "is_recurring": false,
  "repeat_schedule": "",  // Not needed when is_recurring is false
  "repeat_time": ""       // Not needed when is_recurring is false
}




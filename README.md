ki# TMS<br>
alterantive of chat gpt<br>
https://www.perplexity.ai/<br>
https://www.meta.ai/<br>
https://www.nomic.ai/gpt4all<br>
<br>
no limit and free<br>
https://chat.mistral.ai/<br>
https://poe.com/<br>


const express = require("express");
const axios = require("axios");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Login endpoint
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    // Step 1: Authenticate user via external login API
    const externalLoginResponse = await axios.post(process.env.EXTERNAL_LOGIN_URL, {
      email,
      password,
    });

    if (externalLoginResponse.data.success) {
      const externalUserId = externalLoginResponse.data.userId;

      // Step 2: Check if user exists in the local database
      const userCheck = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

      if (userCheck.rows.length === 0) {
        // Step 3: If user doesn't exist, fetch details from external API
        const externalUserResponse = await axios.get(
          `${process.env.EXTERNAL_USER_DETAILS_URL}/${externalUserId}`
        );

        if (externalUserResponse.data.exists) {
          const { id, name, email, payment_status } = externalUserResponse.data;

          // Step 4: Insert user into local database
          await pool.query(
            "INSERT INTO users (id, name, email, payment_status) VALUES ($1, $2, $3, $4)",
            [id, name, email, payment_status || "pending"]
          );

          return res.status(201).json({
            success: true,
            message: "User created successfully. Payment status: pending.",
          });
        } else {
          return res.status(404).json({ error: "User not found in external system." });
        }
      } else {
        // Step 5: If user exists, check payment status
        const paymentStatus = userCheck.rows[0].payment_status;

        if (paymentStatus === "done") {
          return res.json({ success: true, message: "Login successful. Payment verified." });
        } else {
          return res.status(403).json({ success: false, message: "Payment not done." });
        }
      }
    } else {
      // Login failed
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ error: "An error occurred." });
  }
});

// Server setup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});







cron.schedule('0 10 * * *', () => {
    console.log("Task scheduler running..........");

    // Get the current date and time
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
    const month = today.getMonth(); // 0 (January) to 11 (December)
    const date = today.getDate(); // 1 to 31
    const formattedTime = today.toTimeString().split(' ')[0]; // HH:MM:SS

    console.log("Today:", today, "Day of Week:", dayOfWeek, "Month:", month, "Date:", date, "Formatted Time:", formattedTime);

    // Query to fetch recurring tasks (numeric format for schedule)
    const recurringQuery = `
        SELECT * 
        FROM ${schema}.recurring_tasks 
        WHERE (repeat_schedule = 0 AND $3 = ANY(month) AND $4 = ANY(date)) -- Daily
        OR (repeat_schedule = 1 AND $2 = ANY(days)) -- Weekly
        OR (repeat_schedule = 2 AND $4 = ANY(date)) -- Monthly
        OR (repeat_schedule = 3) -- Yearly
    `;

    connect_db.query(recurringQuery, [null, dayOfWeek, month, date], (err, recurringTasks) => {
        if (err) {
            console.error("Error fetching recurring tasks:", err);
            return;
        }

        console.log("Recurring Tasks Result:", recurringTasks.rows);

        if (recurringTasks.rows.length > 0) {
            recurringTasks.rows.forEach(task => {
                // For each recurring task, create a new task in the 'tasks' table
                const row_id = libFunc.randomid();
                const completionDate = new Date();

                console.log("Processing recurring task:", task);

                // Calculate the next due date based on numeric repeat_schedule
                let nextDueDate;

                switch (task.repeat_schedule) {
                    case 0: // Daily
                        nextDueDate = new Date(completionDate);
                        nextDueDate.setDate(nextDueDate.getDate() + 1); // Next day
                        break;
                    case 1: // Weekly
                        nextDueDate = new Date(completionDate);
                        nextDueDate.setDate(nextDueDate.getDate() + (task.nextduedate_no || 7)); // Default: next week
                        break;
                    case 2: // Monthly
                        nextDueDate = new Date(completionDate);
                        nextDueDate.setMonth(nextDueDate.getMonth() + (task.nextduedate_no || 1)); // Default: next month
                        break;
                    case 3: // Yearly
                        nextDueDate = new Date(completionDate);
                        nextDueDate.setFullYear(nextDueDate.getFullYear() + (task.nextduedate_no || 1)); // Default: next year
                        break;
                    default:
                        console.warn("Unknown repeat schedule:", task.repeat_schedule);
                        return; // Skip unknown schedules
                }

                const formattedNextDueDate = nextDueDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD

                // Insert the new task into the tasks table
                const insertQuery = `
                    INSERT INTO ${schema}.tasks (row_id, title, description, status, created_by, completion_date, is_recurring, department_id)
                    VALUES ($1, $2, $3, 'ongoing', $4, $5, true, $6) RETURNING row_id, created_by
                `;

                connect_db.query(insertQuery, [row_id, task.title, task.description, task.created_by, formattedNextDueDate, task.department_id], (insertErr, result) => {
                    if (insertErr) {
                        console.error("Error creating new task from recurring task:", insertErr);
                        return;
                    }

                    const newTaskId = result.rows[0].row_id; // Get the new task ID
                    const createdBy = result.rows[0].created_by; // Get the creator of the task

                    // Assign task to users
                    let assignmentPromises = task.assigned_to.map(user => {
                        return new Promise((resolve) => {
                            const assignmentQuery = `
                                INSERT INTO ${schema}.task_assignments (task_id, user_id, created_by) 
                                VALUES ($1, $2, $3)
                            `;

                            connect_db.query(assignmentQuery, [newTaskId, user.trim(), createdBy], (assignmentErr) => {
                                if (assignmentErr) {
                                    console.error("Error assigning task to user:", assignmentErr.detail);
                                    return resolve(false);
                                }

                                // Create notifications for assigned users
                                const notificationRowId = libFunc.randomid();
                                const text_message = `New task has been assigned by '${createdBy}'`;
                                const notification_type = "alert";

                                const notificationQuery = `
                                    INSERT INTO ${schema}.notification (row_id, text_message, task_id, assigned_to, notification_type) 
                                    VALUES ($1, $2, $3, $4, $5)
                                `;

                                connect_db.query(notificationQuery, [notificationRowId, text_message, newTaskId, user.trim(), notification_type], (notificationErr) => {
                                    if (notificationErr) {
                                        console.error("Error creating notification for task assignment:", notificationErr);
                                    }

                                    // Firebase Notification
                                    const deviceQuery = `SELECT device_id FROM ${schema}.deviceid WHERE user_id = $1`;
                                    connect_db.query(deviceQuery, [user.trim()], async (deviceErr, deviceResult) => {
                                        if (deviceErr) {
                                            console.error("Error fetching device ID:", deviceErr.detail);
                                            return resolve(false);
                                        }

                                        if (deviceResult.rows.length > 0) {
                                            const token = deviceResult.rows[0].device_id;
                                            const messageTitle = `Prosys`;
                                            const messageBody = `New task has been assigned by ${createdBy}`;

                                            console.log("Sending notification:", { token, messageTitle, messageBody });
                                            const result = await sendNotification(token, messageTitle, messageBody);
                                            console.log("Notification result:", result);
                                        }

                                        resolve(true);
                                    });
                                });
                            });
                        });
                    });

                    // Wait for all task assignments to complete
                    Promise.all(assignmentPromises).then(results => {
                        console.log("All task assignments processed:", results);
                    });
                });
            });
        } else {
            console.log("No recurring tasks found for today.");
        }
    });
});



CREATE TABLE prosys.days_of_week (
  row_id VARCHAR(255) PRIMARY KEY,
  days_name VARCHAR(100),
  code INT, -- 0: Sunday, 1: Monday, ..., 6: Saturday
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



repeat_time BETWEEN '00:00:00' AND '23:59:59'



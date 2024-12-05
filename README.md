# TMS<br>
alterantive of chat gpt<br>
https://www.perplexity.ai/<br>
https://www.meta.ai/<br>
https://www.nomic.ai/gpt4all<br>
<br>
no limit and free<br>
https://chat.mistral.ai/<br>
https://poe.com/<br>



function createSingleTask1(taskData, departmentId, createdBy) {
    return new Promise((resolve) => {
        const { 
            assigned_to = [], 
            title, 
            description, 
            status, 
            completion_date, 
            temp_task_id, 
            temp_dependencies_task_id, 
            is_recurring = 'false', 
            repeat_schedule, 
            repeat_time, 
            days, 
            month, 
            date, 
            year 
        } = taskData;

        // Validate required fields for individual task
        if (!Array.isArray(assigned_to) || assigned_to.length === 0 || !title || !description || !status || !completion_date) {
            return resolve({ status: 1, msg: "Missing required fields for a task" });
        }
        
        // Generate a unique ID for the new task
        const row_id = libFunc.randomid();
        
        if (is_recurring === 'true') {
            // Insert the new task into the recurring_tasks table
            const insertRecurringTaskQuery = `
                INSERT INTO ${schema}.recurring_tasks (row_id, task_id, repeat_schedule, repeat_time, days, month, date, created_by, assigned_to, title, description, status, completion_date) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::text[], $10, $11, $12, $13)
            `;

            connect_db.query(insertRecurringTaskQuery, 
                [row_id, row_id, repeat_schedule, repeat_time, days, month, date, createdBy, assigned_to, title, description, status, completion_date], 
                (err, result) => {
                    if (err) {
                        console.error("Error creating recurring task:", err);
                        return resolve({ status: 1, msg: "Recurring task not created", data: err.detail });
                    }
                    
                    resolve({ status: 0, msg: "Recurring task created successfully", data: row_id });
                }
            );
        } else {
            // Insert the new task into the tasks table
            const insertTaskQuery = `
                INSERT INTO ${schema}.tasks (row_id, created_by, title, description, status, completion_date, temp_task_id, temp_dependencies_task_id, is_recurring, department_id) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8::text[], $9, $10) RETURNING row_id
            `;

            connect_db.query(insertTaskQuery, 
                [row_id, createdBy, title, description, status, completion_date, temp_task_id, temp_dependencies_task_id, is_recurring === 'true', departmentId], 
                (err, result) => {
                    if (err) {
                        console.error("Error creating task:", err);
                        return resolve({ status: 1, msg: "Task not created", data: err.detail });
                    }

                    const task_id = result.rows[0].row_id; // Get the newly created task ID

                    // Create assignments and notifications for each user
                    let assignmentPromises = assigned_to.map(user => createAssignmentAndNotify(user.trim(), task_id, createdBy));

                    Promise.all(assignmentPromises).then(results => {
                        if (results.includes(false)) {
                            return resolve({ status: 1, msg: "Some assignments failed." });
                        }

                        resolve({ status: 0, msg: "Task created successfully", data: task_id });
                    });
                }
            );
        }
    });
}

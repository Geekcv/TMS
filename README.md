CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    roll_no VARCHAR(20) NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    father_name VARCHAR(100) NOT NULL,
    dob DATE,
    mobile VARCHAR(15),
    address TEXT,
    state VARCHAR(50),
    city VARCHAR(50),
    zip_code VARCHAR(10),
    adhaar_no VARCHAR(12),
    phone_r VARCHAR(15),
    phone_o VARCHAR(15),
    medium VARCHAR(50),
    education VARCHAR(50),
    account_no VARCHAR(20),
    account_name VARCHAR(100),
    bank_name VARCHAR(100),
    branch_name VARCHAR(100),
    ifsc_code VARCHAR(20),
    remarks TEXT,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attendance (
    attendance_id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    exam_session VARCHAR(50),
    class VARCHAR(50),
    center_code VARCHAR(50),
    status VARCHAR(20), -- Present, Absent, Exam Reject
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE copy_checkers (
    checker_id SERIAL PRIMARY KEY,
    checker_name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(15),
    assigned_bandal INT, -- Bandal number assigned
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE bandals (
    bandal_id SERIAL PRIMARY KEY,
    bandal_no VARCHAR(50) UNIQUE NOT NULL, -- System-generated
    exam_session VARCHAR(50),
    class VARCHAR(50),
    center_code VARCHAR(50),
    copy_checker_id INT REFERENCES copy_checkers(checker_id) ON DELETE SET NULL,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE marks (
    marks_id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    exam_session VARCHAR(50),
    bandal_no VARCHAR(50),
    marks INT,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE merit_list (
    merit_id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    marks INT,
    rank INT,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE birthday_sms (
    sms_id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    send_date DATE,
    status VARCHAR(20), -- Sent, Pending
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE online_forms (
    form_id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    form_name VARCHAR(100),
    form_data JSONB, -- To store form data in JSON format
    status VARCHAR(20), -- Approved, Rejected, Pending
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reports (
    report_id SERIAL PRIMARY KEY,
    report_name VARCHAR(100),
    filter_criteria JSONB, -- To store filter criteria as JSON
    generated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    export_format VARCHAR(20) -- PDF, Excel
);

CREATE TABLE certificates (
    certificate_id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    exam_session VARCHAR(50),
    certificate_type VARCHAR(50), -- e.g., "Completion Certificate"
    issued_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE centers (
    center_id SERIAL PRIMARY KEY,
    center_name VARCHAR(100),
    center_code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    contact_info VARCHAR(100),
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE states (
    state_id SERIAL PRIMARY KEY,
    state_name VARCHAR(100) UNIQUE
);

CREATE TABLE cities (
    city_id SERIAL PRIMARY KEY,
    city_name VARCHAR(100),
    state_id INT REFERENCES states(state_id) ON DELETE CASCADE
);
CREATE TABLE exam_sessions (
    session_id SERIAL PRIMARY KEY,
    exam_name VARCHAR(100),
    start_date DATE,
    end_date DATE,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE password_changes (
    change_id SERIAL PRIMARY KEY,
    user_id INT, -- References to admin or users
    old_password VARCHAR(255),
    new_password VARCHAR(255),
    changed_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);







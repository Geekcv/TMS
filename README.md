

CREATE TABLE birthday_sms (
    sms_id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    send_date DATE,
    status VARCHAR(20), -- Sent, Pending
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


CREATE TABLE password_changes (
    change_id SERIAL PRIMARY KEY,
    user_id INT, -- References to admin or users
    old_password VARCHAR(255),
    new_password VARCHAR(255),
    changed_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);




--------------------------------

CREATE TABLE sb.students (
    id serial NOT NULL,
    student_row_id text  PRIMARY KEY,
    roll_no Text NOT NULL,
    student_name Text NOT NULL,
    father_name Text NOT NULL,
    dob DATE,
    mobile Text,
    address TEXT,
    state Text,
    city Text,
    zip_code Text,
    adhaar_no Text,
    phone_r Text,
    phone_o Text,
    medium Text,
    education Text,
    account_no Text,
    account_name Text,
    bank_name Text,
    branch_name Text,
    ifsc_code Text,
    remarks TEXT,
    cr_on timestamp without time zone DEFAULT now() NOT NULL,
    up_on timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE sb.attendance (
    id serial NOT NULL,
    attendance_row_id text  PRIMARY KEY,
    student_row_id text REFERENCES sb.students(student_row_id) ON DELETE CASCADE,
    exam_session Text,
    class Text,
    center_code Text,
    status Text, -- Present, Absent, Exam Reject
    cr_on timestamp without time zone DEFAULT now() NOT NULL,
    up_on timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE sb.copy_checkers (
    id serial NOT NULL,
    checker_row_id text PRIMARY KEY,
    checker_name Text,
    email Text,
    phone Text,
    cr_on timestamp without time zone DEFAULT now() NOT NULL,
    up_on timestamp without time zone DEFAULT now() NOT NULL
);


CREATE TABLE sb.bandals (
     id serial NOT NULL,
    bandal_row_id text PRIMARY KEY,
    bandal_no Text NOT NULL, -- System-generated
    exam_session Text,
    class Text,
    center_code Text,
    copy_checker_id text REFERENCES sb.copy_checkers(checker_row_id) ON DELETE SET NULL,
    cr_on timestamp without time zone DEFAULT now() NOT NULL,
    up_on timestamp without time zone DEFAULT now() NOT NULL
);


CREATE TABLE sb.marks (
    id serial NOT NULL,
    marks_row_id text PRIMARY KEY,
    student_row_id text REFERENCES sb.students(student_row_id) ON DELETE CASCADE,
    exam_session Text,
    bandal_no Text,
    copy_checker_id text REFERENCES sb.copy_checkers(checker_row_id) ON DELETE SET NULL,
    marks INT,
    cr_on timestamp without time zone DEFAULT now() NOT NULL,
    up_on timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE sb.merit_list (
    id serial NOT NULL,
    merit_row_id text PRIMARY KEY,
    student_row_id text REFERENCES sb.students(student_row_id) ON DELETE CASCADE,
    marks INT,
    rank INT,
    cr_on timestamp without time zone DEFAULT now() NOT NULL,
    up_on timestamp without time zone DEFAULT now() NOT NULL
);





CREATE TABLE sb.online_forms (
    id serial NOT NULL,
    form_row_id text PRIMARY KEY,
    student_row_id text REFERENCES sb.students(student_row_id) ON DELETE CASCADE,
    form_name Text,
    form_data JSONB, -- To store form data in JSON format
    status Text, -- Approved, Rejected, Pending
    cr_on timestamp without time zone DEFAULT now() NOT NULL,
    up_on timestamp without time zone DEFAULT now() NOT NULL
);



CREATE TABLE sb.centers (
    id serial NOT NULL,
    center_row_id text PRIMARY KEY,
    center_name Text,
    center_code Text UNIQUE NOT NULL,
    address TEXT,
    contact_info Text,
    cr_on timestamp without time zone DEFAULT now() NOT NULL,
    up_on timestamp without time zone DEFAULT now() NOT NULL
);



CREATE TABLE sb.exam_sessions (
    id serial NOT NULL,
    session_row_id text PRIMARY KEY,
    exam_name Text,
    start_date DATE,
    end_date DATE,
    cr_on timestamp without time zone DEFAULT now() NOT NULL,
    up_on timestamp without time zone DEFAULT now() NOT NULL
);















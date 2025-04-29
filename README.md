const mysql = require("mysql2/promise");
const { Client } = require("pg");
const { v4: uuidv4 } = require("uuid");

// MySQL Connection Config
const mysqlConfig = {
  host: "localhost",
  user: "root",
  password: "root",
  database: "shtecaoh_jain_board",
};

// PostgreSQL Connection Config
const pgConfig = {
  host: "localhost",
  user: "postgres",
  password: "Admin",
  database: "test29",
  port: 5432,
};

// Function to handle safe timestamps
function safeDate(date) {
  if (
    !date ||
    date === "0000-00-00 00:00:00" ||
    isNaN(new Date(date).getTime())
  ) {
    return new Date(); // fallback to current timestamp
  }
  return new Date(date);
}

// Function to convert 'Y'/'N' to boolean
function toBool(val) {
  return val === "Y";
}

(async () => {
  const mysqlConn = await mysql.createConnection(mysqlConfig);
  const pgClient = new Client(pgConfig);
  await pgClient.connect();

  try {
    console.log("⏳ Migrating 'branch' table...");
    const [branchRows] = await mysqlConn.execute("SELECT * FROM branch");

    for (const row of branchRows) {
      const row_id = uuidv4();
      const {
        name,
        head_name,
        head_address,
        city_id,
        head_mobile,
        create_date,
        modify_date,
        is_active,
        is_delete,
      } = row;

      const cr_on = safeDate(create_date);
      const up_on = safeDate(modify_date);

      await pgClient.query(
        `
        INSERT INTO sb.branch (
          row_id, branch_name, branch_head_name, address, city, mobile_no,
          cr_on, up_on, is_active, is_deleted
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (row_id) DO NOTHING
      `,
        [
          row_id,
          name || "",
          head_name || "",
          head_address || "",
          city_id || 0,
          head_mobile || "",
          cr_on,
          up_on,
          toBool(is_active),
          toBool(is_delete),
        ]
      );

      console.log(`✅ Inserted branch: ${name}`);
    }

    console.log("✅ Branch table migration completed.");

    // Migrate class table
    console.log("⏳ Migrating 'class' table...");
    const [classRows] = await mysqlConn.execute("SELECT * FROM class");

    for (const row of classRows) {
      const row_id = uuidv4();
      const {
        name,
        faculty_id,
        price1,
        price2,
        price3,
        price4,
        price5,
        price6,
        price7,
        is_active,
        is_delete,
        create_date,
        modify_date,
      } = row;

      const cr_on = safeDate(create_date);
      const up_on = safeDate(modify_date);

      await pgClient.query(
        `
        INSERT INTO sb.classes (
          row_id, faculty, class_name,
          first_price, second_price, third_price,
          merit_list_upto_10_price, marks_greater_equal_to_90,
          marks_70_to_less_then_90, marks_50_to_less_then_70,
          cr_on, up_on, is_active, is_deleted
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14
        )
        ON CONFLICT (row_id) DO NOTHING
        `,
        [
          row_id,
          faculty_id,
          name || "",
          price1,
          price2,
          price3,
          price4,
          price5,
          price6,
          price7,
          cr_on,
          up_on,
          toBool(is_active),
          toBool(is_delete),
        ]
      );

      console.log(`✅ Inserted class: ${name}`);
    }

    console.log("✅ Class table migration completed.");

    // Migrate center table
    console.log("⏳ Migrating 'center' table...");
    const [centerRows] = await mysqlConn.execute("SELECT * FROM center");

    for (const row of centerRows) {
      const row_id = uuidv4();
      const {
        center_code,
        name,
        branch_id,
        stdcode,
        head_name,
        dob,
        head_address,
        email_id,
        head_phone,
        head_mobile,
        state_id,
        city_id,
        account_number,
        account_name,
        bank_name,
        branch_name,
        ifsc_code,
        is_delete,
        is_active,
        create_date,
        modify_date,
      } = row;

      const cr_on = safeDate(create_date);
      const up_on = safeDate(modify_date);

      await pgClient.query(
        `
        INSERT INTO sb.centers (
          row_id, branch_id, center, center_head_name, email, address,
          date_of_birth, state, city, std_code, phone_no, mobile_no,
          account_no, account_name, bank_name, branch_name, ifsc_code,
          cr_on, up_on, center_code, is_active, is_deleted
        ) VALUES (
          $1,$2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21,$22
        )
        ON CONFLICT (row_id) DO NOTHING
        `,
        [
          row_id,
          branch_id,
          name || "", // $3: center name
          head_name || "", // $4: center head name
          email_id || "", // $5: email
          head_address || "", // $6: address
          dob || null, // $7: date_of_birth
          state_id, // $8: state_id
          city_id, // $9: city_id
          stdcode || "", // $10: std_code
          head_phone || "", // $13: head_phone
          head_mobile || "", // $14: head_mobile
          account_number || "", // $16: account_number
          account_name || "", // $17: account_name
          bank_name || "", // $18: bank_name
          branch_name || "", // $19: branch_name
          ifsc_code || "", // $20: ifsc_code
          cr_on, // $21: cr_on
          up_on, // $22: up_on
          center_code || 0, // $23: center_code
          toBool(is_active), // $24: is_active
          toBool(is_delete), // $25: is_delete
        ]
      );

      console.log(`✅ Inserted center: ${name}`);
    }

    console.log("✅ Center table migration completed.");

    console.log("⏳ Migrating `sheetchecker` to `sb.copy_checkers`...");

    const [rows1] = await mysqlConn.execute("SELECT * FROM sheetchecker");

    for (const row of rows1) {
      const row_id = uuidv4();
      const { name, address, mobile, is_active, create_date, modify_date } =
        row;

      const cr_on = safeDate(create_date);
      const up_on = safeDate(modify_date);

      await pgClient.query(
        `
        INSERT INTO sb.copy_checkers (
          row_id, name, address, mobile, cr_on, up_on, is_active, is_deleted
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, false
        )
        ON CONFLICT (row_id) DO NOTHING
        `,
        [
          row_id,
          name || "",
          address || "",
          mobile || "",
          cr_on,
          up_on,
          toBool(is_active),
        ]
      );

      console.log(`✅ Inserted copy checker: ${name}`);
    }

    console.log("✅ Migration completed.");

    console.log("⏳ Migrating `student_application` to `sb.students`...");

    const [rows] = await mysqlConn.execute("SELECT * FROM student_application");

    for (const row of rows) {
      const row_id = uuidv4();

      await pgClient.query(
        `
        INSERT INTO sb.students (
          row_id, student_name, father_name, dob, mobile_no, address,
          state, city, zip_code, ahhar_no, phone_r, phone_o,
          medium, education, account_no, account_name, bank_name, branch_name,
          ifsc_code, remarks, gender, cr_on, up_on, roll_no,
          is_active, is_deleted
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16, $17, $18,
          $19, $20, $21, $22, $23, $24,
          $25, $26
        )
        ON CONFLICT (row_id) DO NOTHING
        `,
        [
          row_id,
          row.name,
          row.fathername,
          row.dob,
          row.mobile,
          row.address,
          row.state_id,
          row.city_id,
          row.pincode,
          row.addhar,
          row.phone,
          row.officephone,
          row.medium,
          row.acadmicqual,
          row.account_number,
          row.account_name,
          row.bank_name,
          row.branch_name,
          row.ifsc_code,
          row.remarks,
          row.gender.toString(),
          safeDate(row.create_date),
          safeDate(row.modify_date),
          row.roll_number,
          toBool(row.is_active),
          toBool(row.is_delete),
        ]
      );

      console.log(`✅ Inserted student: ${row.name} (${row.roll_number})`);
    }

    console.log("✅ Migration completed.");

    console.log("🔍 Fetching marks from MySQL...");
    const [marksRows] = await mysqlConn.execute("SELECT * FROM marks");

    let inserted = 0;
    for (const mark of marksRows) {
      const row_id = uuidv4();
      const exam_session = mark.yearid?.toString() || "0";
      const bandal_no = mark.bandal_no?.toString() || "0";
      const studentid = mark.studentid;
      const sheetcheckerid = mark.sheetcheckerid;
      const marks = Math.round((mark.marks_a || 0) + (mark.marks_B || 0));
      const cr_on = mark.create_date || new Date();

      await pgClient.query(
        `INSERT INTO sb.marks (
          row_id, exam_session, bandal_no, marks, cr_on, up_on,student_row_id,copy_checker_id
        ) VALUES ($1, $2, $3, $4, $5, $6,$7,$8)`,
        [
          row_id,
          exam_session,
          bandal_no,
          marks,
          cr_on,
          cr_on,
          studentid,
          sheetcheckerid,
        ]
      );

      inserted++;
    }

    console.log(`🎉 Inserted ${inserted} records successfully.`);
  } catch (err) {
    console.error("❌ Error during migration:", err.message);
  } finally {
    await mysqlConn.end();
    await pgClient.end();
    console.log("✅ Connections closed.");
  }
})();

const connect_db = require("./connect_db/db_connect.js");
const libFunc = require("./functions.js");
const jwt = require("jsonwebtoken");
const query = require("./connect_db/queries.js");
const db_query = require("./connect_db/query_wrapper.js");
const path = require("path");
const runCron = require("./run_cron/crons.js");

const connect_acube24 = require("./acube24/connect.js");
const send_sms = require("./sms_gateway/send_sms.js");
const { sendNotification } = require("./firebase_notification/fb_connect.js");
// var fs = require('fs');
// const fetch = require('node-fetch');
// const db_connector = require('./connect_db/config.js');
// const { update } = require('bower/lib/commands/index.js');
// var shortid = require('shortid');
// const auth_config = require('./authentication/config.js');
// const auth = require('./authentication/connect.js');
const ExcelJS = require("exceljs");
// const moment = require('moment-timezone');
const queries = require("./connect_db/queries.js");
const PDFDocument = require("pdfkit");

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = function () {
  this.common_fn = common_fn;
};

/**
 *  Description :  Common Data Base Functions
 */
let common_fn = {
  // how many task create

  fet_days: fetchalldays,
  fet_months: fetchallmonths,
  fet_date: fetchalldate,
  fet_schedule: fetchallrepeat_schedule,
  dow_show: downloadAndShowbyfilename,

  /**
   * New API Creation
   * Organization
   */

  re_org: registerOrganization,
  lo_ap_us: loginAppUser,
  cr_de: createDepartment, // create departments
  fe_de: fetchDepartments,
  cr_ap_us: createAppUser,
  up_ap_us: updateAppUser,
  ge_us_de: getUserDetails,
  cr_ta: createTask,
  // fe_no: fetchNotifications,
  fe_my_ta: fetchMyTasks,
  fe_us_ta: fetchUserTasks,
  sho_createdTas: fetchMyAssignedTasks,
  fe_us_li: fetchUserList,
  chg_st_tas: updateTaskStatus,
  add_device: addDeviceToken,
  get_comm_task_id: fetchComments,
  cr_comm_on_tas: createComment,
  get_notif: fetchNotifications,
  get_tasById: getTaskDAtaById,
  tot_rec_assigned: totalReceivedAssignedTasks,
  task_reports: taskReports,
  bulk_ta_status_chg: updateTaskStatusBulk,

  month_task_compl_rat: taskCompletionRateMonthly,
  cr_wo_fl: createWorkflow,
  fe_wo_fl: fetchWorkflow,
  ge_re_ta: getRecurringTask,

  in_ac_us: inactiveUser,
  in_ac_ta: inactiveTask,
  in_re_ta: inactiveRecurringTask,
  fe_in_ac_ta: fetchInactiveTask,
  fe_in_ac_re_ta: fetchInactiveRecurringTask,
  fe_in_us: fetchInactiveUserList,
  ac_us: activeUser,

  se_ot: sendOtp,
  ve_ot: verifyOtp,
  re_pa: resetPassword,

  cr_ch_li: createChecklist,
  fe_ch_li: fetchChecklist,
  cr_compl: createComplaince,
  fe_compl: fetchComplaince,

  fe_ch_li_da: fetchCheckListData,
  up_ta_ch_li: updateChecklist,

  ge_to_ta_cr_by_me: getTotalCountofTaskCreatedByMe,
  up_ta: updateTask,
  up_re_ta: updateRecurringTaskTemplate,

  /**
   * Import Modules
   */
  bu_ta_im: bulkTaskImport,
  bu_us_im: bulkUserImport,
  fe_la_im: fetchlastImporttask,

  /**
   * ACUBE REPLY MANAGEMENT
   */

  markAsDone: markAsDone,

  /**
   * admin
   */
  fe_all_task: fetchTasks,
  ex_tas: exportTasksToExcel,

  /**
   * Super admin
   */

  cr_sup_ad: createSuperAdmin,
  fe_all_org: fetchOrganizations,
  up_org_bil_data: updateOrganizations,
  fe_reports_whtapp: fetchReportsofwhatapps,

  // tes_da: testdata
};

/**
 * Organizartion Registeration
 * current_setting('TIMEZONE'::text)
 */
const schema = "prosys";
async function registerOrganization(req, res) {
  var tablename = schema + ".organizations";
  const organization_name = req.data.organization_name;
  const owner_name = req.data.Owns_name;
  const mobile_number = req.data.mobile_no;
  const email = req.data.email;
  const password = req.data.password;
  const gstin = req.data.GST_NO;
  if (
    !organization_name ||
    !owner_name ||
    !mobile_number ||
    !email ||
    !password ||
    !gstin
  ) {
    const resp = { status: 1, msg: "Missing required fields" };
    // console.log("response of validation ", resp);
    libFunc.sendResponse(res, resp);
  } else {
    var checkEmail = await checkEmailExist(email);
    var checkMob = await checkMobExist(mobile_number);
    if (checkEmail) {
      const resp = { status: 1, msg: "Email already exists" };
      // console.log("response of validation ", resp);
      libFunc.sendResponse(res, resp);
    } else if (checkMob) {
      const resp = { status: 1, msg: "Mobile Number already exists" };
      // console.log("response of validation ", resp);
      libFunc.sendResponse(res, resp);
    } else {
      var columns = {
        organization_name: organization_name.trim().replaceAll("'", "`"),
        owner_name: owner_name.trim().replaceAll("'", "`"),
        mobile_number: mobile_number,
        gstin: gstin,
      };
      var resp = await db_query.addData(
        tablename,
        columns,
        req.data.row_id,
        "Organization"
      );
      // console.log("resp", resp);
      if (resp.status == 0 && resp.data["row_id"] != undefined) {
        var tablename = schema + ".users";
        var columns = {
          name: owner_name.trim().replaceAll("'", "`"),
          email: email.trim(),
          password: password.trim(),
          mobilenumber: mobile_number.trim(),
          organizationid: resp.data["row_id"],
          role: 1,
        };
        var respuser = await db_query.addData(
          tablename,
          columns,
          null,
          "Users"
        );
        // console.log("respuser", respuser);
      }
      libFunc.sendResponse(res, resp);
    }
  }
}

function checkLoginUser(username, password) {
  return new Promise((resolve, reject) => {
    var query = `SELECT * FROM ${schema}.users where (email=$1 OR mobilenumber=$1) and password=$2`;
    var queryparam = [username, password];
    // console.log("query===========");
    // console.log(query);
    connect_db.query(query, queryparam, (err, result) => {
      if (err) {
        // console.log(err);
        resolve({ status: 1 });
      } else {
        // console.log(result.rows);
        if (result.rows.length > 0) {
          resolve(result.rows[0]);
        } else {
          resolve(false);
        }
      }
    });
  });
}

function checkDeviceExist(userid) {
  return new Promise((resolve, reject) => {
    var query = `SELECT * FROM ${schema}.devices where userid=$1`;
    // console.log("query===========");
    // console.log(query);
    var queryParam = [userid];
    connect_db.query(query, queryParam, (err, result) => {
      if (err) {
        // console.log(err);
        resolve(false);
      } else {
        // console.log(result.rows);
        if (result.rows.length > 0) {
          resolve(result.rows[0]);
        } else {
          resolve(false);
        }
      }
    });
  });
}
function checkDeviceExistForToken(token, userid) {
  return new Promise((resolve, reject) => {
    var query = `DELETE FROM ${schema}.devices where device_id='${token}' AND userid <> '${userid}'`;
    // console.log("query===========");
    // console.log(query);
    connect_db.query(query, (err, result) => {
      if (err) {
        // console.log(err);
        resolve(false);
      } else {
        // console.log("result.rows==========Delete");
        // console.log(result.rows);
        if (result.rows.length > 0) {
          resolve(result.rows[0]);
        } else {
          resolve(false);
        }
      }
    });
  });
}
async function addDeviceToken(req, res) {
  var tablename = schema + ".devices";
  var columns = {
    device_id: req.data.device_Id,
    userid: req.data.userId,
    organizationid: req.data.orgId,
  };
  var checkDevice = await checkDeviceExist(req.data.userId);
  var delTokenAvailable = await checkDeviceExistForToken(
    req.data.device_Id,
    req.data.userId
  );
  if (checkDevice) {
    var resp = await db_query.addData(
      tablename,
      columns,
      checkDevice.row_id,
      "Device"
    );
  } else {
    var resp = await db_query.addData(tablename, columns, null, "Device");
  }
  // console.log("resp", resp);
  libFunc.sendResponse(res, resp);
}

async function loginAppUser(req, res) {
  // console.log("req",req)

  var username = req.data.email || req.data.mobilenumber;
  var password = req.data.password;
  // var type="mob"
  if (!username || !password) {
    const resp = { status: 1, msg: "Missing required fields" };
    // console.log("response of validation ", resp);
    libFunc.sendResponse(res, resp);
  } else {
    var checkUser = await checkLoginUser(username, password);
    // console.log("checkUser---", checkUser);
    if (checkUser) {
      if (checkUser.activestatus != 0) {
        return libFunc.sendResponse(res, {
          status: 1,
          msg: "Your account is inactive. Please contact admin.",
        });
      }

      var rowId = checkUser.row_id;
      var jwtData = {
        userId: rowId,
        orgId: checkUser.organizationid,
        role: checkUser.role,
        depId: checkUser.deptid,
      };
      // console.log("jwtData", jwtData);
      // var role = checkUser.role == 0 ? "user" : "admin";
      // var role = checkUser.role == 0 ? "user" : "admin";
      // console.log("role",checkUser.role)
      // const role = checkUser.role == 0 ? 'user' : checkUser.role == 1 ? 'admin' : checkUser.role == 2 ? 'dept-admin' : 'super-admin';
      const role =
        checkUser.role == 0
          ? "user"
          : checkUser.role == 1
          ? "admin"
          : checkUser.role == 2
          ? "dept-admin"
          : checkUser.role == 3
          ? "top-management"
          : "super-admin";

      var token = jwt.sign(
        jwtData,
        JWT_SECRET,
        { expiresIn: 259200 } // expires in 72 hours/ 3 days
      );
      if (checkUser.role == 9) {
        let msg_data = {
          status: 0,
          msg: "Login Successfully",
          data: { token: token, role: role, department_id: "" },
        };
        //console.log("response---", msg_data);
        libFunc.sendResponse(res, msg_data);
      } else {
        var resp = {
          status: 0,
          msg: "Login Successfully",
          data: { token: token, role: role, department_id: checkUser.deptid },
        };
        console.log("response", resp);
        libFunc.sendResponse(res, resp);
      }
    } else {
      var resp = {
        status: 1,
        msg: "Invalid Username or Password",
      };
      // console.log("response", resp);
      libFunc.sendResponse(res, resp);
    }
  }
}

/**
 * Create Complainces
 */

async function createComplaince(req, res) {
  //  console.log("req---", req)
  var tablename = schema + ".complaince";
  var repeat_schedule = req.data.repeat_schedule;
  var schedule_type =
    repeat_schedule == "Daily"
      ? 0
      : repeat_schedule == "Weekly"
      ? 1
      : repeat_schedule == "Monthly"
      ? 2
      : repeat_schedule == "Yearly"
      ? 3
      : undefined;
  var active_status =
    req.data.status == "ongoing"
      ? 0
      : req.data.status == "complete"
      ? 1
      : req.data.status == "overdue"
      ? 2
      : undefined;

  let reminderOnArray = [];
  if (req.data.reminderList) {
    if (Array.isArray(req.data.reminderList)) {
      reminderOnArray = req.data.reminderList;
    } else {
      try {
        reminderOnArray = JSON.parse(req.data.reminderList);
      } catch (e) {
        // console.warn("Invalid reminder_on format, fallback to empty array");
        reminderOnArray = [];
      }
    }
  }

  var schedule_details = {
    type: repeat_schedule,

    // "reminder_on": req.data.reminder_on,//previously it was days
    // "complete_till": req.data.complete_till,
    // "remind_me_before": req.data.remind_me_before ?? "1",
    reminderList: reminderOnArray,

    customdates: req.data.customdates,
    days: req.data.days,
    date: req.data.date,
    months: req.data.months,
  };
  var columns = {
    category: req.data.category_id,
    active_status: active_status,
    subcategory: req.data.sub_categoryId,
    complaincedetails: JSON.stringify(req.data.complaincedetails),
    attachments: JSON.stringify(req.data.file_path),
    scheduletype: schedule_type,
    scheduledetails: JSON.stringify(schedule_details),
    assignedto: JSON.stringify(req.data.assigned_to),
    othernumbers: req.data.othernumbers,
    createdby: req.data.userId,
    organizationid: req.data.orgId,
  };

  //     if (schedule_type == 0) {
  // console.log("schedule_type", schedule_type);

  //         await notifyForComplainceonWA(req.data.complaincedetails, req.data.assigned_to, req.data.othernumbers, req.data.userId);
  //     }
  await checkComplaincesAtCreationTime(req.data.row_id);
  var resp = await db_query.addData(
    tablename,
    columns,
    req.data.row_id,
    "Complaince"
  );
  //////  console.log("resp", resp);
  libFunc.sendResponse(res, resp);
}

async function getAssignedToNumbers(assignedto) {
  var assignedtoNumbers = [];
  for (const user of assignedto) {
    var userDetails = await getUserData(user);
    // console.log("userDetails----->",userDetails)
    // var userDetails = true;
    if (userDetails) {
      assignedtoNumbers.push(userDetails);
    }
  }
  return assignedtoNumbers;
}

async function notifyForComplainceonWA(
  complaincedetails,
  assignedto,
  othernumbers,
  userId
) {
  // console.log("complaincedetails----",complaincedetails)
  var assignedtoNumbers = await getAssignedToNumbers(assignedto);
  var othNum = [];
  if (othernumbers != undefined && othernumbers != null && othernumbers != "") {
    var tempothNum = othernumbers.split(",");
    for (var i = 0; i < tempothNum.length; i++) {
      if (tempothNum[i] != "") {
        othNum.push({ name: tempothNum[i], mobilenumber: tempothNum[i] });
      }
    }
  }
  var allNumbers = [];
  if (othNum.length > 0) {
    allNumbers = [...assignedtoNumbers, ...othNum];
  } else {
    allNumbers = assignedtoNumbers;
  }
  //////  console.log("allNumbers", allNumbers);
  for (var j = 0; j < allNumbers.length; j++) {
    async function loop(i) {
      var reNu = allNumbers[i].mobilenumber;

      var templateData = {
        templateName: "notify_compliance",
        languageCode: "en",
        variable: [complaincedetails.category, complaincedetails.sub_category],
      };
      //////  console.log("templateData------------", templateData);
      //////  console.log("reNu------------", reNu);
      var wa_se_ms = await connect_acube24.sendTemplate(reNu, templateData);

      var row_id = libFunc.randomid();
      var others_details = {
        complaincedetails: complaincedetails,
        assignedto: assignedto,
      };

      var query = `INSERT INTO prosys.whatsapp_log (row_id,mobilenumber, receiver_user, template_name, request_data, response_data, status,others_details) 
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`;
      var resp = await db_query.customQuery(query, "data saved", [
        row_id,
        reNu,
        allNumbers[i].name,
        templateData.templateName,
        JSON.stringify(templateData),
        JSON.stringify(wa_se_ms),
        wa_se_ms?.status || "UNKNOWN",
        JSON.stringify(others_details),
      ]);

      // var AdreNu = "7878038514";
      // var wa_se_ms = await connect_acube24.sendTemplate(AdreNu, templateData);

      // var id = libFunc.randomid();

      // var query = `INSERT INTO prosys.whatsapp_log (row_id,mobilenumber, receiver_user, template_name, request_data, response_data, status,others_details)
      //      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`
      // var resp = await db_query.customQuery(query, "data saved", [id, AdreNu, allNumbers[i].name, templateData.templateName, JSON.stringify(templateData), JSON.stringify(wa_se_ms), wa_se_ms?.status || "UNKNOWN", JSON.stringify(others_details)]);
    }
    loop(j);
  }
}

async function fetchComplaince(req, res) {
  var organizationid = req.data.orgId;
  var limit = req.data.limit || 100;
  var page = req.data.page || 1;
  var offset = (page - 1) * limit;
  var category = req.data.category_id;
  var subcategory = req.data.sub_categoryId;

  // Build base query and parameters array
  let query = `SELECT comp.*, json_agg(us.name) AS assigned_to FROM ${schema}.complaince comp
    INNER JOIN 
    LATERAL jsonb_array_elements_text(comp.assignedto) AS assigned_to_id ON TRUE
INNER JOIN 
    prosys.users us ON us.row_id = assigned_to_id::text
    WHERE comp.organizationid = $1 AND comp.createdby = $2`;
  const params = [organizationid, req.data.userId];

  // Add category filter if present
  if (category) {
    query += ` AND comp.category = $3`;
    params.push(category);
  }
  // Add subcategory filter if present
  if (subcategory) {
    query += ` AND comp.subcategory = $4`;
    params.push(subcategory);
  }

  query += ` GROUP BY comp.row_id
ORDER BY comp.cr_on DESC
LIMIT $5 OFFSET $6;`;
  params.push(limit, offset);

  // console.log("query===========");
  // console.log(query, params);
  connect_db.query(query, params, (err, result) => {
    if (err) {
      // console.log(err);
      var resp = {
        status: 1,
        msg: "Complaince Not Found",
      };
      libFunc.sendResponse(res, resp);
    } else {
      if (result.rows.length > 0) {
        var resp = {
          status: 0,
          msg: "Complaince Fetched Successfully",
          data: result.rows,
        };
        // console.log("response", resp);
        libFunc.sendResponse(res, resp);
      } else {
        var resp = {
          status: 1,
          msg: "Complaince Not Found",
        };
        // console.log("response", resp);
        libFunc.sendResponse(res, resp);
      }
    }
  });
}

//=============================================//

/**
 * Check List Creation/ Update/Fetch
 */

async function createChecklist(req, res) {
  var tablename = schema + ".checklist";
  if (
    !req.data["checklist_title"] ||
    !req.data["description"] ||
    !req.data["checklist_items"]
  ) {
    const resp = { status: 1, msg: "Missing required fields" };
    // console.log("response of validation ", resp);
    return libFunc.sendResponse(res, resp);
  }
  var columns = {
    title: req.data["checklist_title"],
    description: req.data["description"],
    items: JSON.stringify(req.data["checklist_items"]),
    userid: req.data["userId"],
    organizationid: req.data["orgId"],
  };
  var resp = await db_query.addData(
    tablename,
    columns,
    req.data.row_id,
    "checklist"
  );
  // console.log("resp", resp);
  libFunc.sendResponse(res, resp);
}
function fetchChecklist(req, res) {
  var organizationid = req.data.orgId;
  var limit = req.data.limit || 100;
  var page = req.data.page || 1;
  var offset = (page - 1) * limit;
  var query = `SELECT * FROM ${schema}.checklist WHERE organizationid = $1 ORDER BY cr_on DESC LIMIT $2 OFFSET $3`;
  // console.log("query===========");
  // console.log(query);
  connect_db.query(query, [organizationid, limit, offset], (err, result) => {
    if (err) {
      // console.log(err);
      var resp = {
        status: 1,
        msg: "Checklist Not Found",
      };
      libFunc.sendResponse(res, resp);
    } else {
      if (result.rows.length > 0) {
        var resp = {
          status: 0,
          msg: "Checklist Fetched Successfully",
          data: result.rows,
        };
        // console.log("response", resp);
        libFunc.sendResponse(res, resp);
      } else {
        var resp = {
          status: 1,
          msg: "Checklist Not Found",
        };
        // console.log("response", resp);
        libFunc.sendResponse(res, resp);
      }
    }
  });
}

//=========================================//
async function createDepartment(req, res) {
  try {
    // console.log("req", req);
    var organizationid = req.data.orgId;
    var department_name = req.data.dep_name;
    if (department_name == undefined || department_name == "") {
      const resp = { status: 1, msg: "Missing required fields" };
      // console.log("response of validation ", resp);
      libFunc.sendResponse(res, resp);
    } else {
      var tablename = schema + ".departments";

      const checkQuery = `
            SELECT 1 FROM ${tablename}
            WHERE organizationid = '${organizationid}'
            AND LOWER(department_name) = LOWER('${department_name
              .trim()
              .replaceAll("'", "`")}')
            LIMIT 1
        `;
      const checkResult = await db_query.customQuery(checkQuery, "fetched");

      console.log("checkResult---", checkResult);

      if (checkResult.status === 0) {
        console.log("Department name already exists");
        return libFunc.sendResponse(res, {
          status: 1,
          msg: "Department name already exists",
        });
      }

      var columns = {
        organizationid: organizationid,
        department_name: department_name.trim().replaceAll("'", "`"),
      };
      var resp = await db_query.addData(
        tablename,
        columns,
        req.data.row_id,
        "Department"
      );
      // console.log("resp", resp);
      libFunc.sendResponse(res, resp);
    }
  } catch (err) {
    console.error("Error in createDepartment:", err);
    libFunc.sendResponse(res, {
      status: 0,
      msg: "Server error",
      error: err.message,
    });
  }
}

async function fetchDepartments(req, res) {
  var organizationid = req.data.orgId;
  var limit = req.data.limit || 100;
  var page = req.data.page || 1;
  var offset = (page - 1) * limit;
  var query = `SELECT * FROM ${schema}.departments WHERE organizationid = $1 ORDER BY department_name, cr_on DESC LIMIT $2 OFFSET $3`;
  // console.log("query===========");
  // console.log(query);
  connect_db.query(query, [organizationid, limit, offset], (err, result) => {
    if (err) {
      // console.log(err);
      var resp = {
        status: 1,
        msg: "Departments Not Found",
      };
      libFunc.sendResponse(res, resp);
    } else {
      if (result.rows.length > 0) {
        var resp = {
          status: 0,
          msg: "Departments Fetched Successfully",
          data: result.rows,
        };
        // console.log("response", resp);
        libFunc.sendResponse(res, resp);
      } else {
        var resp = {
          status: 1,
          msg: "Departments Not Found",
        };
        // console.log("response", resp);
        libFunc.sendResponse(res, resp);
      }
    }
  });
}

async function checkEmailExist(email) {
  return new Promise((resolve, reject) => {
    var query = `SELECT * FROM ${schema}.users WHERE email = $1`;
    // console.log("query===========");
    // console.log(query);
    connect_db.query(query, [email], (err, result) => {
      if (err) {
        // console.log(err);
        resolve(false);
      } else {
        // console.log(result.rows);
        if (result.rows.length > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      }
    });
  });
}
async function checkMobExist(mobilenumber) {
  return new Promise((resolve, reject) => {
    var query = `SELECT * FROM ${schema}.users WHERE mobilenumber = $1`;
    // console.log("query===========");
    // console.log(query);
    connect_db.query(query, [mobilenumber], (err, result) => {
      if (err) {
        // console.log(err);
        resolve(false);
      } else {
        // console.log(result.rows);
        if (result.rows.length > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      }
    });
  });
}

async function fetchUserList(req, res) {
  // console.log("req----->", req);
  var organizationid = req.data.orgId;
  var isTeam = req.data.isTeam;
  var limit = req.data.limit || 100;
  var page = req.data.page || 1;
  var offset = (page - 1) * limit;
  let query, params;
  if (isTeam) {
    query = `SELECT us.name,us.row_id,de.department_name as dep_name,us.image_url as photo_path,
         CASE 
                WHEN us.role = 0 THEN 'User'
                WHEN us.role = 1 THEN 'Admin'
                WHEN us.role = 2 THEN 'Dept-admin'
                WHEN us.role = 3 THEN 'Top-management'
                ELSE 'unknown'
            END AS rolevalue
            FROM ${schema}.users us
            LEFT JOIN ${schema}.departments de on us.deptid=de.row_id
            WHERE us.organizationid = $1 AND us.row_id <> $2 AND us.activestatus = 0
            ORDER BY us.deptid, us.cr_on DESC LIMIT $3 OFFSET $4`;
    params = [organizationid, req.data.userId, limit, offset];
  } else {
    query = `SELECT us.name,us.row_id,us.image_url as photo_path,de.department_name as dep_name,
         CASE 
                WHEN us.role = 0 THEN 'User'
                WHEN us.role = 1 THEN 'Admin'
                WHEN us.role = 2 THEN 'Dept-admin'
                WHEN us.role = 3 THEN 'Top-management'
                ELSE 'unknown'
            END AS rolevalue
            FROM ${schema}.users us
            LEFT JOIN ${schema}.departments de on us.deptid=de.row_id
            WHERE us.organizationid = $1 AND us.activestatus = 0
            ORDER BY us.deptid, us.cr_on DESC LIMIT $2 OFFSET $3`;
    params = [organizationid, limit, offset];
  }
  // console.log("query===========");
  // console.log(query, params);
  connect_db.query(query, params, (err, result) => {
    if (err) {
      // console.log(err);
      var resp = {
        status: 1,
        msg: "Users Not Found",
      };
      libFunc.sendResponse(res, resp);
    } else {
      if (result.rows.length > 0) {
        var resp = {
          status: 0,
          msg: "Users Fetched Successfully",
          data: result.rows,
        };
        // console.log("active users ", resp);
        libFunc.sendResponse(res, resp);
      } else {
        var resp = {
          status: 1,
          msg: "Users Not Found",
        };
        // console.log("response", resp);
        libFunc.sendResponse(res, resp);
      }
    }
  });
}

/**
 * OTP Management
 */
function sendOtp(req, res) {
  // console.log("request otp ---->",req.data)

  var mobileNumber = req.data.mobilenumber;
  var sqlquery = `SELECT * FROM ${schema}.users WHERE mobilenumber = '${mobileNumber}'`;
  // console.log("sqlquery==============", sqlquery);
  connect_db.query(sqlquery, async (err, result) => {
    if (err) {
      // console.log(err);
      var resp = {
        status: 1,
        msg: "Mobile Number Not Found",
      };
      // console.log("resp error ----->",resp)
      libFunc.sendResponse(res, resp);
    } else {
      if (result.rows.length > 0) {
        // console.log("result--->",result.rows[0].activestatus)

        //  Added condition to block inactive users
        if (result.rows[0].activestatus === 1) {
          var resp = {
            status: 1,
            msg: "We can't send a OTP because your account is inactive",
          };
          // console.log("inactive user ---->", resp)
          return libFunc.sendResponse(res, resp);
        }

        var otp = libFunc.randomNumber(6);
        var mobileNumber = result.rows[0]["mobilenumber"];
        var rowID = libFunc.randomid();
        var otpDAta = {
          row_id: rowID,
          mobilenumber: mobileNumber,
          otp: otp,
        };
        var respOtp = await query.insert_data(schema + ".otp_mgmt", otpDAta);

        // console.log("respOtp----->",respOtp)

        var resp1 = await send_sms(mobileNumber, otp, 0);
        // console.log("resp", resp1);
        var resp = {
          status: 0,
          msg: "OTP Sent Successfully to Your Mobile Number",
        };
        // console.log("msg suscess--->",resp)
        libFunc.sendResponse(res, resp);
      } else {
        var resp = {
          status: 1,
          msg: "Mobile Number is Not Registered",
        };
        // console.log("resp---->",resp)
        libFunc.sendResponse(res, resp);
      }
    }
  });
}

function fetchUserDAta(mobilenumber) {
  return new Promise((resolve, reject) => {
    var query = `SELECT * FROM ${schema}.users WHERE mobilenumber = $1`;
    connect_db.query(query, [mobilenumber], (err, result) => {
      if (err) {
        resolve(false);
      } else {
        if (result.rows.length > 0) {
          resolve(result.rows[0]);
        } else {
          resolve(false);
        }
      }
    });
  });
}

function verifyOtp(req, res) {
  var mobileNumber = req.data.mobilenumber;
  var query = `SELECT * FROM ${schema}.otp_mgmt WHERE mobilenumber = $1 order by cr_on desc limit 1`;
  connect_db.query(query, [mobileNumber], async (err, result) => {
    if (err) {
      // console.log(err);
      var resp = {
        status: 1,
        msg: "Mobile Number Not Found",
      };
      libFunc.sendResponse(res, resp);
    } else {
      if (result.rows.length > 0) {
        var userDAta = await fetchUserDAta(mobileNumber);
        var otp =
          mobileNumber == "7742529160" ? "112233" : result.rows[0]["otp"];
        var getOTP = req.data.otp;
        if (otp == getOTP) {
          var resp = {
            status: 0,
            msg: "Mobile Number Verified Successfully",
            data: userDAta,
          };
          libFunc.sendResponse(res, resp);
        } else {
          var resp = {
            status: 1,
            msg: "Invalid OTP",
          };
          libFunc.sendResponse(res, resp);
        }
      } else {
        var resp = {
          status: 1,
          msg: "Mobile Number Not Found",
        };
        libFunc.sendResponse(res, resp);
      }
    }
  });
}

function resetPassword(req, res) {
  var userid = req.data.userid;
  var password = req.data.password;
  var query = `UPDATE ${schema}.users SET password = $1 WHERE row_id = $2`;
  // console.log("sqlquery", query);
  connect_db.query(query, [password, userid], (err, result) => {
    if (err) {
      // console.log(err);
      var resp = {
        status: 1,
        msg: "User Not Found",
      };
      libFunc.sendResponse(res, resp);
    } else {
      var resp = {
        status: 0,
        msg: "Password Reset Successfully",
      };
      libFunc.sendResponse(res, resp);
    }
  });
}

//======================================================//
async function inactiveUser(req, res) {
  // console.log("in_ac_us",req)
  var memberid = req.data.memberid;
  var tablename = schema + ".users";
  var sqlquery = `UPDATE ${schema}.users SET activestatus = 1 WHERE row_id = $1`;
  // console.log("sqlquery", sqlquery);
  connect_db.query(sqlquery, [memberid], (err, result) => {
    if (err) {
      // console.log(err);
      var resp = {
        status: 1,
        msg: "User Not Found",
      };
      libFunc.sendResponse(res, resp);
    } else {
      var resp = {
        status: 0,
        msg: "Inactive User Successfully",
      };
      // console.log("response", resp);
      libFunc.sendResponse(res, resp);
    }
  });
}
async function inactiveTask(req, res) {
  //activestatus for task show or hide --- active_status for task status ongoing or completed
  var taskid = req.data.taskid;
  var sqlquery = `UPDATE ${schema}.tasks SET activestatus = 1 WHERE row_id = $1`;
  // console.log("sqlquery", sqlquery);
  connect_db.query(sqlquery, [taskid], (err, result) => {
    if (err) {
      // console.log(err);
      var resp = {
        status: 1,
        msg: "Task Not Found",
      };
      libFunc.sendResponse(res, resp);
    } else {
      var resp = {
        status: 0,
        msg: "Inactive Task Successfully",
      };
      // console.log("response", resp);
      libFunc.sendResponse(res, resp);
    }
  });
}
async function inactiveRecurringTask(req, res) {
  var taskid = req.data.taskid;
  var sqlquery = `UPDATE ${schema}.recurring_task SET activestatus = 1 WHERE row_id = $1`;
  // console.log("sqlquery", sqlquery);
  connect_db.query(sqlquery, [taskid], (err, result) => {
    if (err) {
      // console.log(err);
      var resp = {
        status: 1,
        msg: "Task Not Found",
      };
      libFunc.sendResponse(res, resp);
    } else {
      var resp = {
        status: 0,
        msg: "Inactive Recurring Task Successfully",
      };
      // console.log("response", resp);
      libFunc.sendResponse(res, resp);
    }
  });
}
async function fetchInactiveTask(req, res) {
  var userid = req.data.userId;
  var organizationid = req.data.orgId;
  var limit = req.data.limit || 100;
  var page = req.data.page || 1;
  var offset = (page - 1) * limit;
  var sqlquery = `
        SELECT ta.row_id,
            ta.title,
            ta.description,
            ta.completion_date,
            us1.name AS created_by,
            ta.cr_on AS created_at,
            json_agg(us.name) AS assigned_to,
            CASE WHEN ta.task_type = '0' THEN 'Single Task' ELSE 'Recurring Task' END AS task_type
        FROM ${schema}.tasks ta
        INNER JOIN prosys.users us1 ON ta.assigned_by = us1.row_id
        INNER JOIN LATERAL jsonb_array_elements_text(ta.assigned_to) AS assigned_to_id ON TRUE
        INNER JOIN prosys.users us ON us.row_id = assigned_to_id::text
        WHERE ta.activestatus = $1
            AND ta.assigned_by = $2
            AND ta.organizationid = $3
        GROUP BY ta.row_id, us1.name
        ORDER BY ta.cr_on DESC
        LIMIT $4 OFFSET $5
    `;
  // console.log("sqlquery", sqlquery);
  connect_db.query(
    sqlquery,
    [1, userid, organizationid, limit, offset],
    (err, result) => {
      if (err) {
        // console.log(err);
        var resp = {
          status: 1,
          msg: "Task Not Found",
        };
        libFunc.sendResponse(res, resp);
      } else {
        var resp = {
          status: 0,
          msg: "Inactive Recurring Task Successfully",
          data: result.rows,
        };
        // console.log("response", resp);
        libFunc.sendResponse(res, resp);
      }
    }
  );
}

async function createAppUser(req, res) {
  const organizationid = req.data.orgId;
  const deptid = req.data.department_id || null;
  const email = req.data.email.trim();
  // const mobilenumber = "7742529160";
  const mobilenumber = req.data.mobilenumber.trim();
  const password = req.data.password.trim();
  const role = req.data.role;
  // const role = req.data.role == 'user' ? 0 : req.data.role == 'admin' ? 1 : 2;
  const name = req.data.user_name.trim().replaceAll("'", "`");
  const image_url = req.data.photo_path;
  const duties =
    req.data.Top_duties != undefined
      ? JSON.stringify(req.data.Top_duties).replaceAll("'", "`")
      : undefined;

  //  Top Management user: department_id NOT required
  if (role === "3") {
    if (!password || !name || !mobilenumber) {
      console.log("Missing required fields for Top Management");
      return libFunc.sendResponse(res, {
        status: 1,
        msg: "Missing required fields for Top Management",
      });
    }
  }
  //  Dept-admin/user: department_id IS required
  if (role === "1" || role === "2") {
    if (!deptid || !password || !name || !mobilenumber) {
      console.log("Missing required fields");
      return libFunc.sendResponse(res, {
        status: 1,
        msg: "Missing required fields",
      });
    }
  }

  var checkEmail = await checkEmailExist(email);
  var checkMob = await checkMobExist(mobilenumber);
  // if (checkEmail) {

  //     const resp = { status: 1, msg: "Email already exists" };
  //     // console.log("response of validation ", resp);
  //     libFunc.sendResponse(res, resp);
  // }
  // else
  if (checkMob) {
    const resp = { status: 1, msg: "Mobile Number already exists" };
    // console.log("response of validation ", resp);
    return libFunc.sendResponse(res, resp);
  }
  var columns = {
    organizationid: organizationid,
    deptid: role === "3" ? "" : deptid, //  Top Management has no department
    email: email,
    password: password,
    role: role,
    name: name,
    image_url: image_url,
    mobilenumber: mobilenumber,
    duties: duties,
  };

  // console.log("columns---",columns)
  var tablename = schema + ".users";
  var resp = await db_query.addData(
    tablename,
    columns,
    req.data.row_id,
    "User"
  );
  console.log("resp", resp);
  var smsmessage = `You are registered.`;
  // var resp1 = await send_sms(mobilenumber, smsmessage, 0);
  // console.log("resp", resp);
  libFunc.sendResponse(res, resp);
}

// async function checkMobExistForSpecificUser(mobilenumber) {
//     return new Promise((resolve, reject) => {
//         var query = `SELECT row_id FROM ${schema}.users WHERE mobilenumber = $1`;
//         // console.log("query===========");
//         // console.log(query);
//         connect_db.query(query, [mobilenumber], (err, result) => {
//             if (err) {
//                 // console.log(err);
//                 resolve(false);
//             } else {
//                 // console.log(result.rows);
//                 if (result.rows.length > 0) {
//                     userids = [];
//                     for (var i = 0; i < result.rows.length; i++) {
//                         userids.push(result.rows[i].row_id);
//                     }
//                     resolve(userids);
//                 } else {
//                     resolve([]);
//                 }
//             }
//         });
//     }
//     );
// }

async function checkMobExistForSpecificUser(mobilenumber, excludeRowId = null) {
  return new Promise((resolve, reject) => {
    let query = `SELECT row_id FROM ${schema}.users WHERE mobilenumber = $1`;
    const params = [mobilenumber];

    if (excludeRowId) {
      query += ` AND row_id != $2`;
      params.push(excludeRowId);
    }

    connect_db.query(query, params, (err, result) => {
      if (err) {
        resolve(false);
      } else {
        resolve(result.rows.map((r) => r.row_id));
      }
    });
  });
}

async function updateAppUser(req, res) {
  // console.log("req", req);
  const userid = req.data.userId;
  const organizationid = req.data.orgId;
  const deptid = req.data.department_id;
  // const email = req.data.email.trim();
  const password = req.data.password.trim();
  const role = req.data.role;
  const mobilenumber = req.data.mobilenumber.trim();
  // const role = req.data.role == 'user' ? 0 : req.data.role == 'admin' ? 1 : 2;
  const name = req.data.name.trim().replaceAll("'", "`");
  const image_url = req.data.photo_path;
  const rowId = req.data.row_id;
  const duties = JSON.stringify(req.data.top_duties).replaceAll("'", "`");
  var checkMob = await checkMobExistForSpecificUser(mobilenumber, rowId);
  ////  console.log("checkMob", checkMob);
  if (checkMob.length > 0) {
    var resp = {
      status: 1,
      msg: "Mobile Number already exists for another user",
    };
    // console.log("resp",resp)
    libFunc.sendResponse(res, resp);
  } else {
    var columns = {
      // "organizationid": organizationid,
      deptid: deptid,
      // "email": email,
      password: password,
      mobilenumber: mobilenumber,
      // "role": role,
      name: name,
      image_url: image_url,
      duties: duties,
    };

    var tablename = schema + ".users";
    var resp = await db_query.addData(tablename, columns, rowId, "User");
    if (req.data.user_role == 1) {
      var columns = {
        organization_name: req.data.organizationData.organization_name,
        owner_name: req.data.name,
        mobile_number: req.data.organizationData.mobilenumber,
        gstin: req.data.organizationData.gst_no,
      };
      var tablename = schema + ".organizations";
      var resp1 = await db_query.addData(
        tablename,
        columns,
        organizationid,
        "Organization"
      );
    }

    libFunc.sendResponse(res, resp);
  }
}

async function getUserDetails(req, res) {
  //user role -- 0 for user, 1 for admin, 2 for dept-admin
  var userid = req.data.ismember ? req.data.memberid : req.data.userId;
  var organizationid = req.data.orgId;
  var query = `SELECT us.row_id,us.email,us.name,us.password,us.mobilenumber, us.role as rolevalue, CASE
  WHEN (us.role='0') THEN 'User'
  WHEN (us.role='1') THEN 'Admin'
  WHEN (us.role='2') THEN 'Dept-Admin'
  WHEN (us.role='3') THEN 'Top-Management'
 END AS role,us.image_url as photo_path,
 us.cr_on as created_at,
    us.duties as top_duties, us.deptid as department_id,de.department_name as dep_name,
    org.organization_name as organization_name    
    FROM ${schema}.users us
    LEFT JOIN ${schema}.departments de on us.deptid=de.row_id
    INNER JOIN ${schema}.organizations org on us.organizationid=org.row_id
    where us.row_id=$1  `;
  // console.log("query=====ge-us-id======");
  // console.log(query);
  connect_db.query(query, [userid], (err, result) => {
    if (err) {
      // console.log(err);
      var resp = {
        status: 1,
        msg: "User Not Found",
      };
      libFunc.sendResponse(res, resp);
    } else {
      if (result.rows.length > 0) {
        var userData = result.rows[0];
        var role = req.data.user_role;
        // var role = req.data.user_role == 'user' ? 0 : req.data.user_role == 'admin' ? 1 : 2;
        if (role == 1) {
          var query = `SELECT * FROM ${schema}.organizations WHERE row_id = $1`;
          // console.log("query===========");
          // console.log(query);
          connect_db.query(query, [organizationid], (err, result) => {
            if (err) {
              // console.log(err);
              var resp = {
                status: 1,
                msg: "Organization Not Found",
              };
              libFunc.sendResponse(res, resp);
            } else {
              if (result.rows.length > 0) {
                var organizationData = {
                  organization_name: result.rows[0].organization_name,
                  user_name: result.rows[0].owner_name,
                  mobile_no: result.rows[0].mobile_number,
                  gst_no: result.rows[0].gstin,
                };
                userData.organizationData = organizationData;
                var resp = {
                  status: 0,
                  msg: "User Fetched Successfully",
                  data: userData,
                };
                libFunc.sendResponse(res, resp);
              } else {
                var resp = {
                  status: 1,
                  msg: "Organization Not Found",
                };
                libFunc.sendResponse(res, resp);
              }
            }
          });
        } else {
          var resp = {
            status: 0,
            msg: "User Fetched Successfully",
            data: userData,
          };
          // console.log("response", resp);
          libFunc.sendResponse(res, resp);
        }
      } else {
        var resp = {
          status: 1,
          msg: "User Not Found",
        };
        // console.log("response", resp);
        libFunc.sendResponse(res, resp);
      }
    }
  });
}

/**
 * Tasks
 *
 * type - 0 for single task, 1 for recurring task
 *
 * status
 * 0 - ongoing
 * 1 - completed
 * 2 - overdue
 *
 *  */

async function getDeviceId(assignedTo) {
  return new Promise(async (resolve, reject) => {
    // Prepare parameterized query for user IDs
    var placeholders = assignedTo.map((_, i) => `$${i + 1}`).join(",");
    var query = `SELECT device_id, userid FROM ${schema}.devices WHERE userid = ANY($1)`;
    connect_db.query(query, [assignedTo], (err, result) => {
      if (err) {
        // console.log(err);
        resolve(false);
      } else {
        if (result.rows.length > 0) {
          resolve(result.rows);
        } else {
          resolve(false);
        }
      }
    });
  });
}
async function getUserData(userid) {
  // console.log("user_id---> ",userid)
  return new Promise(async (resolve, reject) => {
    var query = `SELECT name, mobilenumber FROM ${schema}.users WHERE row_id = $1`;
    connect_db.query(query, [userid], (err, result) => {
      // console.log("result.rows.length--",result.rows.length)
      if (err) {
        // console.log("error------>",err);
        resolve(false);
      } else {
        if (result.rows.length > 0) {
          resolve(result.rows[0]);
        } else {
          resolve(false);
        }
      }
    });
  });
}

async function addTask(taskColumns, assignedto, userid) {
  return new Promise(async (resolve, reject) => {
    var tablename = schema + ".tasks";
    var resp = await db_query.addData(tablename, taskColumns, null, "Task");
    // console.log("resp", resp);
    resolve(resp);
    // libFunc.sendResponse(res, resp);
  });
}

async function notifyUser(assignedto, userid, title, taskid) {
  return new Promise(async (resolve, reject) => {
    var deviceid = await getDeviceId(assignedto);
    var assigned_by_name = await getUserData(userid);
    // console.log("deviceid", deviceid);
    if (deviceid != false && deviceid.length > 0) {
      // var taskid = resp.data.row_id;
      var messageTitle = "Task Assigned";
      var messageBody = `Task ${title} has been assigned by ${assigned_by_name["name"]}`;
      for (var j = 0; j < deviceid.length; j++) {
        async function loop(i) {
          var token = deviceid[i].device_id;
          var result = await sendNotification(token, messageTitle, messageBody);
          // console.log("res", result);
          var column = {
            taskid: taskid,
            assigned_to: deviceid[i].userid,
            message: messageBody,
          };
          var tablename = schema + ".notifications";
          var resp1 = await db_query.addData(
            tablename,
            column,
            null,
            "Notification"
          );
          if (i == deviceid.length - 1) {
            resolve(true);
          }
        }
        loop(j);
      }
    } else {
      resolve(false);
    }
  });
}

function getOrganizationName(organizationid) {
  return new Promise(async (resolve, reject) => {
    var query = `SELECT organization_name FROM ${schema}.organizations WHERE row_id = $1`;
    connect_db.query(query, [organizationid], (err, result) => {
      if (err) {
        resolve(false);
      } else {
        if (result.rows.length > 0) {
          resolve(result.rows[0]["organization_name"]);
        } else {
          resolve(false);
        }
      }
    });
  });
}

async function notifyOnWA(taskdetails, assignedto) {
  var assignedtoNumbers = await getAssignedToNumbers(assignedto);
  var assignedby = await getUserData(taskdetails.assignedby);
  var organizationName = await getOrganizationName(
    taskdetails["organizationid"]
  );
  var othNum;
  // var othNum = ["7878038514"];
  const completionDate = new Date(taskdetails.completion_date);
  const formattedCompletionDate = completionDate.toDateString();

  const organizationid = taskdetails.organizationid;

  var allNumbers = [];
  if (othNum != undefined && othNum.length > 0) {
    allNumbers = [...assignedtoNumbers, ...othNum];
  } else {
    allNumbers = assignedtoNumbers;
  }
  //////  console.log("allNumbers", allNumbers);
  for (var j = 0; j < allNumbers.length; j++) {
    async function loop(i) {
      var reNu = allNumbers[i].mobilenumber;
      var reNa = allNumbers[i].name;

      var templateData = {
        //"templateName": "test",
        templateName: "task_reminder_3010",
        // "templateName": "task_reminder_mac",
        // "templateName": "task_reminder_with_mad",
        languageCode: "en",
        variable: [
          taskdetails.title,
          formattedCompletionDate,
          taskdetails.description,
          assignedby["name"],
          reNa,
          organizationName,
        ],
      };
      //  console.log("templateData------------", templateData);
      //  console.log("reNu------------", reNu);
      var wa_se_ms = await connect_acube24.sendTemplate(reNu, templateData);

      //  console.log("response whatapps", wa_se_ms)

      var row_id = libFunc.randomid();

      var others_details = {
        taskdetails: taskdetails,
        assignedto: assignedto,
      };

      var query = `INSERT INTO prosys.whatsapp_log (row_id,mobilenumber, receiver_user, template_name, request_data, response_data, status,others_details,organizationid) 
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`;
      var resp = await db_query.customQuery(query, "data saved", [
        row_id,
        reNu,
        reNa,
        templateData.templateName,
        JSON.stringify(templateData),
        JSON.stringify(wa_se_ms),
        wa_se_ms?.status || "UNKNOWN",
        JSON.stringify(others_details),
        organizationid,
      ]);
      //  console.log("whatsapp send to=======", reNu)
      // var AdreNu = "7878038514";
      // var wa_se_ms = await connect_acube24.sendTemplate(AdreNu, templateData);

      // var id = libFunc.randomid();

      // var query = `INSERT INTO prosys.whatsapp_log (row_id,mobilenumber, receiver_user, template_name, request_data, response_data, status,others_details,organizationid)
      //      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`
      // var resp = await db_query.customQuery(query, "data saved",
      //     [id, AdreNu, reNa, templateData.templateName, JSON.stringify(templateData), JSON.stringify(wa_se_ms), wa_se_ms?.status || "UNKNOWN", JSON.stringify(others_details), organizationid]
      // );
    }
    loop(j);
  }
}

async function createTask(req, res) {
  // console.log("data--",req)
  var title =
    req.data.title != undefined
      ? req.data.title.trim().replaceAll("'", "`")
      : undefined;
  var description =
    req.data.description != undefined
      ? req.data.description.trim().replaceAll("'", "`")
      : undefined;
  var userid =
    req.data.assignedby != null ? req.data.assignedby : req.data.userId;
  var organizationid = req.data.orgId;
  var completion_date = req.data.completion_date;
  var newComplDate = new Date(completion_date);
  // console.log("newComplDate", newComplDate);
  // console.log("newComplDate", newComplDate.toDateString());
  var checklistid = req.data.checklist;
  if (
    !title ||
    !description ||
    !userid ||
    !req.data.assigned_to ||
    req.data.assigned_to.length == 0
  ) {
    const resp = { status: 1, msg: "Missing required fields" };
    // console.log("response of validation ", resp);
    libFunc.sendResponse(res, resp);
  } else {
    var taskColumns = {
      organizationid: organizationid,
      title: title,
      description: description,
      assigned_to: JSON.stringify(req.data.assigned_to),
      assigned_by: userid,

      checklist: JSON.stringify(checklistid),
      completion_date: completion_date,
    };

    if (req.data.commentdetails != undefined) {
      var commentdetails = req.data.commentdetails;
      var commentColumns = {
        comment: commentdetails.comment,
        userid: userid,
        attachments: commentdetails.file_path,
        organizationid: organizationid,
      };
    }
    if (req.data.is_recurring == false) {
      var resp = await addTask(taskColumns, req.data.assigned_to, userid);
      //  //  console.log("resp --->",resp)
      var whatsappTAskDetails = {
        title: title,
        description: description,
        completion_date: newComplDate,
        organizationid: organizationid,
        assignedby: userid,
      };
      if (organizationid != "1739861234068_66iA") {
        await notifyOnWA(whatsappTAskDetails, req.data.assigned_to);
      }
      //   if (organizationid === '1756191731327_jiOU') {
      //     await notifyOnWA(whatsappTAskDetails, req.data.assigned_to)
      //    }

      if (req.data.commentdetails != undefined) {
        commentColumns.taskid = resp.data.row_id;
        commentColumns.attachments = JSON.stringify(commentColumns.attachments);
        var tablename = schema + ".comments";
        var resp11 = await db_query.addData(
          tablename,
          commentColumns,
          null,
          "Comment"
        );
      }

      var notify = await notifyUser(
        req.data.assigned_to,
        userid,
        title,
        resp.data.row_id
      );

      libFunc.sendResponse(res, resp);
    } else {
      if (req.data.repeat_schedule == undefined) {
        const resp = { status: 1, msg: "Missing required fields" };
        // console.log("response of validation ", resp);
        libFunc.sendResponse(res, resp);
      } else {
        var repeat_schedule = req.data.repeat_schedule;
        var repeat_time = req.data.repeat_time;
        var reminder_list = req.data.reminder_list;
        var months = req.data.months;
        var customdates = req.data.customdates;
        var date = req.data.date;
        var remind_me_before = req.data.remind_me_before;
        var complete_till = req.data.complete_till;
        var schedule_type =
          repeat_schedule == "Daily"
            ? 0
            : repeat_schedule == "Weekly"
            ? 1
            : repeat_schedule == "Monthly"
            ? 2
            : repeat_schedule == "Yearly"
            ? 3
            : undefined;
        var schedule_details = {
          type: repeat_schedule,

          reminder_list: reminder_list, //previously it was days
          // "complete_till": complete_till,
          //"remind_me_before": remind_me_before ?? "1"
        };
        taskColumns.assigned_to = req.data.assigned_to;
        taskColumns.checklist = checklistid;
        var recurringColumns = {
          organizationid: organizationid,
          taskdetails: JSON.stringify(taskColumns),
          schedule_details: JSON.stringify(schedule_details),
          schedule_type: schedule_type,
          commentdetails: JSON.stringify(commentColumns),
        };
        // console.log("recurringColumns",recurringColumns)
        var tablename = schema + ".recurring_task";
        var resp = await db_query.addData(
          tablename,
          recurringColumns,
          null,
          "Recurring Task"
        );
        // console.log("resp----",resp)
        await createRecurringAtCreationTime(resp.data.row_id);
        libFunc.sendResponse(res, resp);
      }
    }
  }
}

async function fetchNotifications(req, res) {
  var userid = req.data.userId;
  var organizationid = req.data.orgId;
  var limit = req.data.limit || 100;
  var page = req.data.page || 1;
  var offset = (page - 1) * limit;

  var query = `SELECT no.row_id,no.message as message,ta.title as tasktitle,us.name as assigned_username,no.assigned_to,no.taskid ,no.cr_on as created_at FROM ${schema}.notifications no 
    INNER JOIN ${schema}.tasks ta on no.taskid=ta.row_id
    INNER JOIN ${schema}.users us on ta.assigned_by=us.row_id
    where no.assigned_to=$1 ORDER BY no.cr_on DESC LIMIT $2 OFFSET $3`;
  // console.log("query===========");
  // console.log(query);
  var resp = await db_query.customQuery(query, "Notifications Fetched", [
    userid,
    limit,
    offset,
  ]);
  libFunc.sendResponse(res, resp);
}

async function fetchUserTasks(req, res) {
  var userid = req.data.memberid;
  var organizationid = req.data.orgId;
  // var active_status = req.data.status == 'ongoing' ? 0 : req.data.status == 'complete' ? 1 : req.data.status == 'overdue' ? 2 : undefined;
  var limit = req.data.limit || 100;
  var page = req.data.page || 1;
  var offset = (page - 1) * limit;
  var query = `SELECT ta.row_id, ta.title, ta.description, ta.completion_date, us1.name AS created_by,
    ta.cr_on AS created_at,
    CASE
        WHEN (ta.active_status = '0') THEN 'ongoing'
        WHEN (ta.active_status = '1') THEN 'complete'
        WHEN (ta.active_status = '2') THEN 'overdue'
    END AS status,
    (ta.completion_date - CURRENT_DATE) AS due_days,
    us2.name AS updated_by
    FROM ${schema}.tasks ta
    INNER JOIN ${schema}.users us1 ON ta.assigned_by = us1.row_id
    LEFT JOIN ${schema}.users us2 ON ta.completed_by = us2.row_id
    WHERE ta.assigned_to::text LIKE $1
        AND ta.organizationid = $2
        AND ta.activestatus = 0
    ORDER BY ta.cr_on DESC
    LIMIT $3 OFFSET $4`;

  const params = [`%${userid}%`, organizationid, limit, offset];

  // console.log("query===========");
  // console.log(query);
  var resp = await db_query.customQuery(query, "Tasks Fetched", params);
  // console.log("resp---",resp)
  libFunc.sendResponse(res, resp);
}
async function fetchMyTasks(req, res) {
  // console.log("req--->", req.data.userId);
  var userid = req.data.userId;
  var organizationid = req.data.orgId;
  var active_status =
    req.data.status == "ongoing"
      ? 0
      : req.data.status == "complete"
      ? 1
      : req.data.status == "overdue"
      ? 2
      : undefined;
  var limit = req.data.limit || 100;
  var page = req.data.page || 1;
  var offset = (page - 1) * limit;
  var query = `SELECT ta.row_id, ta.title, ta.description, ta.completion_date, us1.name AS created_by,
    ta.cr_on AS created_at, ta.checklist,
    CASE
        WHEN (ta.active_status = '0') THEN 'ongoing'
        WHEN (ta.active_status = '1') THEN 'complete'
        WHEN (ta.active_status = '2') THEN 'overdue'
    END AS status,
    (ta.completion_date - CURRENT_DATE) AS due_days,
    us2.name AS updated_by
    FROM ${schema}.tasks ta
    INNER JOIN ${schema}.users us1 ON ta.assigned_by = us1.row_id
    LEFT JOIN ${schema}.users us2 ON ta.completed_by = us2.row_id
    WHERE ta.assigned_to::text LIKE $1
        AND ta.organizationid = $2
        AND ta.active_status = $3
        AND ta.activestatus = 0
    ORDER BY ta.cr_on DESC
    LIMIT $4 OFFSET $5`;

  const params = [`%${userid}%`, organizationid, active_status, limit, offset];

  // console.log("query===1111111========",params);
  // console.log(query);
  var resp = await db_query.customQuery(query, "Tasks Fetched", params);
  // console.log("resp=========111111=========", resp);
  // console.log("resp=========111111=========", resp.data.length);

  libFunc.sendResponse(res, resp);
}
async function fetchInactiveRecurringTask(req, res) {
  var userid = req.data.userId;
  var organizationid = req.data.orgId;
  var limit = req.data.limit || 100;
  var page = req.data.page || 1;
  var offset = (page - 1) * limit;
  var sqlquery = `
        SELECT 
            rt.schedule_details->>'type' AS scheduletype, 
            rt.schedule_details->>'reminder_list' AS reminder_list,
            rt.schedule_details->>'complete_till' AS complete_till,
            rt.schedule_details->>'remind_me_before' AS remind_me_before,
            rt.row_id,
            rt.taskdetails->>'title' AS title,
            rt.taskdetails->>'description' AS description,
            rt.cr_on AS created_at,
            json_agg(DISTINCT us1.name) AS assigned_to,
            us.name AS created_by,
            rt.taskdetails->>'active_status' AS active_status,
            rt.taskdetails->>'completedon' AS completedon
        FROM 
            prosys.recurring_task rt 
        INNER JOIN 
            prosys.users us ON rt.taskdetails->>'assigned_by' = us.row_id
        INNER JOIN 
            LATERAL jsonb_array_elements_text(rt.taskdetails->'assigned_to') AS assigned_to_id ON TRUE
        INNER JOIN 
            prosys.users us1 ON us1.row_id = assigned_to_id::text
        WHERE 
            rt.taskdetails->>'assigned_by' = $1
            AND rt.organizationid = $2
            AND rt.activestatus = 1
        GROUP BY 
            rt.row_id, 
            rt.schedule_details, 
            us.name, 
            rt.taskdetails
        ORDER BY 
            rt.cr_on DESC 
        LIMIT $3 OFFSET $4;
    `;
  var params = [userid, organizationid, limit, offset];
  // var sqlquery=
  // `SELECT rt.schedule_details->>'type' as scheduletype, rt.schedule_details->>'time' as time,rt.schedule_details->>'day' as day,rt.schedule_details->>'month' as month,rt.schedule_details->>'date' as date,rt.schedule_details->>'completion_days' as completion_days,rt.row_id,rt.taskdetails->>'title' as title,rt.taskdetails->>'description' as description,rt.taskdetails->>'completion_date' as completion_date,us1.name as created_by,rt.cr_on as created_at,rt.taskdetails->>'assigned_to' as assigned_to,rt.taskdetails->>'assigned_by' as assigned_by,rt.taskdetails->>'active_status' as active_status,rt.taskdetails->>'completed_by' as completed_by,rt.taskdetails->>'completedon' as completedon,us2.name as updated_by FROM ${schema}.recurring_task rt INNER JOIN ${schema}.users us1 on rt.taskdetails->>'assigned_by'=us1.row_id LEFT JOIN ${schema}.users us2 on rt.taskdetails->>'completed_by'=us2.row_id where rt.taskdetails->>'assigned_to' LIKE '%${userid}%' and rt.organizationid='${organizationid}' ORDER BY rt.cr_on DESC LIMIT ${limit} OFFSET ${offset}`;
  // console.log("query===========");
  // console.log(sqlquery);
  var resp = await db_query.customQuery(
    sqlquery,
    "Inactive Recurring Tasks Fetched",
    params
  );
  libFunc.sendResponse(res, resp);
}
async function getRecurringTask(req, res) {
  var userid = req.data.userId;
  var organizationid = req.data.orgId;
  var limit = req.data.limit || 100;
  var page = req.data.page || 1;
  var offset = (page - 1) * limit;
  //     var sqlquery =
  //         `SELECT
  //     rt.schedule_details->>'type' AS scheduletype,
  //     rt.schedule_details->>'reminder_on' AS reminder_on,
  //     rt.schedule_details->>'complete_till' AS complete_till,
  //     rt.schedule_details->>'remind_me_before' AS remind_me_before,
  //     rt.row_id,
  //     rt.taskdetails->>'title' AS title,
  //     rt.taskdetails->>'description' AS description,
  //     rt.taskdetails->>'checklist' AS checklist,
  //     rt.cr_on AS created_at,
  //     json_agg(DISTINCT us1.name) AS assigned_to,
  //     us.name AS created_by,
  //     rt.taskdetails->>'active_status' AS active_status,
  //     rt.taskdetails->>'completedon' AS completedon
  // FROM
  //     prosys.recurring_task rt
  // INNER JOIN
  //     prosys.users us ON rt.taskdetails->>'assigned_by' = us.row_id
  // INNER JOIN
  //     LATERAL jsonb_array_elements_text(rt.taskdetails->'assigned_to') AS assigned_to_id ON TRUE
  // INNER JOIN
  //     prosys.users us1 ON us1.row_id = assigned_to_id::text
  // WHERE
  //     rt.taskdetails->>'assigned_by' = $1
  //     AND rt.organizationid = $2
  //     AND rt.activestatus = 0
  // GROUP BY
  //     rt.row_id,
  //     rt.schedule_details,
  //     us.name,
  //     rt.taskdetails
  // ORDER BY
  //     rt.cr_on DESC
  // LIMIT $3 OFFSET $4;
  //     `;

  var sqlquery = `SELECT 
    rt.schedule_details->>'type' AS scheduletype, 
    rt.schedule_details->>'reminder_list' AS reminder_list,
    rt.row_id,
    rt.taskdetails->>'title' AS title,
    rt.taskdetails->>'description' AS description,
    rt.taskdetails->>'checklist' AS checklist,
    rt.taskdetails->>'organizationid' AS organizationid,
    rt.cr_on AS created_at,
    json_agg(DISTINCT us1.name) AS assigned_to,
    us.name AS created_by,
    rt.taskdetails->>'active_status' AS active_status,
    rt.taskdetails->>'completedon' AS completedon
FROM 
    prosys.recurring_task rt 
INNER JOIN 
    prosys.users us ON rt.taskdetails->>'assigned_by' = us.row_id
INNER JOIN 
    LATERAL jsonb_array_elements_text(rt.taskdetails->'assigned_to') AS assigned_to_id ON TRUE
INNER JOIN 
    prosys.users us1 ON us1.row_id = assigned_to_id::text
WHERE 
    rt.taskdetails->>'assigned_by' = $1
    AND rt.organizationid = $2
    AND rt.activestatus = 0
GROUP BY 
    rt.row_id, 
    rt.schedule_details, 
    us.name, 
    rt.taskdetails
ORDER BY 
    rt.cr_on DESC 
LIMIT $3 OFFSET $4;
    `;
  var params = [userid, organizationid, limit, offset];
  // var sqlquery=
  // `SELECT rt.schedule_details->>'type' as scheduletype, rt.schedule_details->>'time' as time,rt.schedule_details->>'day' as day,rt.schedule_details->>'month' as month,rt.schedule_details->>'date' as date,rt.schedule_details->>'completion_days' as completion_days,rt.row_id,rt.taskdetails->>'title' as title,rt.taskdetails->>'description' as description,rt.taskdetails->>'completion_date' as completion_date,us1.name as created_by,rt.cr_on as created_at,rt.taskdetails->>'assigned_to' as assigned_to,rt.taskdetails->>'assigned_by' as assigned_by,rt.taskdetails->>'active_status' as active_status,rt.taskdetails->>'completed_by' as completed_by,rt.taskdetails->>'completedon' as completedon,us2.name as updated_by FROM ${schema}.recurring_task rt INNER JOIN ${schema}.users us1 on rt.taskdetails->>'assigned_by'=us1.row_id LEFT JOIN ${schema}.users us2 on rt.taskdetails->>'completed_by'=us2.row_id where rt.taskdetails->>'assigned_to' LIKE '%${userid}%' and rt.organizationid='${organizationid}' ORDER BY rt.cr_on DESC LIMIT ${limit} OFFSET ${offset}`;
  // console.log("query===========");
  // console.log(sqlquery);
  var resp = await db_query.customQuery(
    sqlquery,
    "Recurring Tasks Fetched",
    params
  );
  // console.log("recurring tasks", resp.data)
  libFunc.sendResponse(res, resp);
}

// async function updateTaskStatus(req, res) {
//     var status = req.data.status;
//     var taskid = req.data.row_id;
//     var userid = req.data.userId;
//     var organizationid = req.data.orgId;
//     var tablename = schema + '.tasks';
//     var active_status = status == 'ongoing' ? 0 : status == 'complete' ? 1 : status == 'overdue' ? 2 : undefined;

//     var columns = {
//         "active_status": active_status,
//         "completed_by": userid,
//         "completedon": new Date().toLocaleString(),

//     }
//     var resp = await db_query.addData(tablename, columns, taskid, "Task Status");
//     // console.log("resp", resp);
//     libFunc.sendResponse(res, resp);
// }

// async function fetchMyAssignedTasks(req, res) {
//     // console.log("req--->",req.data)
//     try {
//         var userid = req.data.ismember ? req.data.memberid : req.data.userId;
//         var organizationid = req.data.orgId;
//         var active_status =
//             req.data.status == 'ongoing' ? 0 :
//             req.data.status == 'complete' ? 1 :
//             req.data.status == 'overdue' ? 2 : undefined;
//         var limit = req.data.limit || 100;
//         var page = req.data.page || 1;
//         var offset = (page - 1) * limit;

//         //  Filter support (array of assigned_to row_ids)
//         var filters = req.data.filters || {};
//         var assignedToFilter = Array.isArray(filters.assigned_to) ? filters.assigned_to : [];

//         let sqlquery, params;

//         if (active_status === undefined) {
//             sqlquery = `
// SELECT
//     ta.row_id,
//     ta.title,
//     ta.description,
//     ta.checklist,
//     ta.completion_date,
//     us1.name AS created_by,
//     ta.cr_on AS created_at,
//     json_agg(us.name) AS assigned_to,
//     CASE
//         WHEN ta.active_status = '0' THEN 'ongoing'
//         WHEN ta.active_status = '1' THEN 'complete'
//         WHEN ta.active_status = '2' THEN 'overdue'
//     END AS status,
//     CASE
//         WHEN ta.task_type = '0' THEN 'Normal'
//         WHEN ta.task_type = '1' THEN 'Recurring'
//     END AS task_type_title,
//     (ta.completion_date - CURRENT_DATE) AS due_days,
//     us2.name AS updated_by,
//     ta.task_type,
//     rt.schedule_details->>'type' AS schedule_type,
//     rt.row_id as recurring_task_id,
//     rt.schedule_details->>'reminder_list' AS reminder_list,
//     rt.schedule_details->>'remind_me_before' AS remind_me_before,
//     rt.schedule_details->>'complete_till' AS complet_till
// FROM
//     prosys.tasks ta
// INNER JOIN
//     prosys.users us1 ON ta.assigned_by = us1.row_id
// INNER JOIN
//     LATERAL jsonb_array_elements_text(ta.assigned_to) AS assigned_to_id ON TRUE
// INNER JOIN
//     prosys.users us ON us.row_id = assigned_to_id::text
// LEFT JOIN
//     prosys.users us2 ON ta.completed_by = us2.row_id
// LEFT JOIN prosys.recurring_task rt
//     ON ta.recurringid = rt.row_id
//     AND rt.taskdetails->>'assigned_by' = $1
//     AND rt.taskdetails->>'assigned_to' ILIKE '%' || ta.assigned_to::text || '%'
// WHERE
//     ta.assigned_by = $1
//     AND ta.organizationid = $2
//     AND ta.activestatus = 0
//     ${assignedToFilter.length > 0 ? `AND assigned_to_id::text = ANY($5)` : ''}
// GROUP BY
//     ta.row_id, ta.checklist, us1.name, us2.name, rt.schedule_details, rt.row_id
// ORDER BY
//     ta.cr_on DESC
// LIMIT $3 OFFSET $4;
//             `;

//             if (assignedToFilter.length > 0) {
//                 params = [userid, organizationid, limit, offset, assignedToFilter];
//             } else {
//                 params = [userid, organizationid, limit, offset];
//             }

//         } else {
//             sqlquery = `
// SELECT
//     ta.row_id,
//     ta.title,
//     ta.description,
//     ta.completion_date, ta.checklist,
//     us1.name AS created_by,
//     ta.cr_on AS created_at,
//     json_agg(us.name) AS assigned_to,
//     CASE
//         WHEN ta.active_status = '0' THEN 'ongoing'
//         WHEN ta.active_status = '1' THEN 'complete'
//         WHEN ta.active_status = '2' THEN 'overdue'
//     END AS status,
//     CASE
//         WHEN ta.task_type = '0' THEN 'Normal'
//         WHEN ta.task_type = '1' THEN 'Recurring'
//     END AS task_type_title,
//     (ta.completion_date - CURRENT_DATE) AS due_days,
//     us2.name AS updated_by,
//     ta.task_type,
//     rt.row_id as recurring_task_id,
//     rt.schedule_details->>'type' AS schedule_type,
//     rt.schedule_details->>'complete_till' AS complet_till,
//     rt.schedule_details->>'reminder_list' AS reminder_list,
//     rt.schedule_details->>'remind_me_before' AS remind_me_before
// FROM
//     prosys.tasks ta
// INNER JOIN
//     prosys.users us1 ON ta.assigned_by = us1.row_id
// INNER JOIN
//     LATERAL jsonb_array_elements_text(ta.assigned_to) AS assigned_to_id ON TRUE
// INNER JOIN
//     prosys.users us ON us.row_id = assigned_to_id::text
// LEFT JOIN
//     prosys.users us2 ON ta.completed_by = us2.row_id
// LEFT JOIN prosys.recurring_task rt
//     ON ta.recurringid = rt.row_id
//     AND rt.taskdetails->>'assigned_by' = $1
//     AND rt.taskdetails->>'assigned_to' ILIKE '%' || ta.assigned_to::text || '%'
// WHERE
//     ta.assigned_by = $1
//     AND ta.organizationid = $2
//     AND ta.active_status = $3
//     AND ta.activestatus = 0
//     ${assignedToFilter.length > 0 ? `AND assigned_to_id::text = ANY($6)` : ''}
// GROUP BY
//     ta.row_id, us1.name, ta.checklist, us2.name, rt.schedule_details, rt.row_id
// ORDER BY
//     ta.cr_on DESC
// LIMIT $4 OFFSET $5;
//             `;

//             if (assignedToFilter.length > 0) {
//                 params = [userid, organizationid, active_status, limit, offset, assignedToFilter];
//             } else {
//                 params = [userid, organizationid, active_status, limit, offset];
//             }
//         }

//         var resp = await db_query.customQuery(sqlquery, "Tasks Fetched", params);
//         // console.log("response ----->",resp.data)
//         libFunc.sendResponse(res, resp);

//     } catch (err) {
//         console.error("Error in fetchMyAssignedTasks:", err);
//         libFunc.sendResponse(res, { status: false, message: "Internal Server Error" });
//     }
// }

async function fetchMyAssignedTasks(req, res) {
  // console.log("req--->",req.data)
  try {
    var userid = req.data.ismember ? req.data.memberid : req.data.userId;
    var organizationid = req.data.orgId;
    var active_status =
      req.data.status == "ongoing"
        ? 0
        : req.data.status == "complete"
        ? 1
        : req.data.status == "overdue"
        ? 2
        : undefined;
    var limit = req.data.limit || 100;
    var page = req.data.page || 1;
    var offset = (page - 1) * limit;

    //  Filter support (array of assigned_to row_ids)
    var filters = req.data.filters || {};
    var assignedToFilter = Array.isArray(filters.assigned_to)
      ? filters.assigned_to
      : [];

    //  Added optional completion date filters (NEW)
    var startDate = filters.completion_startDate || null;
    var endDate = filters.completion_endDate || null;

    let sqlquery, params;

    if (active_status === undefined) {
      sqlquery = `
SELECT
    ta.row_id,
    ta.title,
    ta.description,
    ta.checklist,
    ta.completion_date,
    us1.name AS created_by,
    ta.cr_on AS created_at,
    json_agg(us.name) AS assigned_to,
    CASE
        WHEN ta.active_status = '0' THEN 'ongoing'
        WHEN ta.active_status = '1' THEN 'complete'
        WHEN ta.active_status = '2' THEN 'overdue'
    END AS status,
    CASE
        WHEN ta.task_type = '0' THEN 'Normal'
        WHEN ta.task_type = '1' THEN 'Recurring'
    END AS task_type_title,
    (ta.completion_date - CURRENT_DATE) AS due_days,
    us2.name AS updated_by,
    ta.task_type,
    rt.schedule_details->>'type' AS schedule_type,
    rt.row_id as recurring_task_id,
    rt.schedule_details->>'reminder_list' AS reminder_list,
    rt.schedule_details->>'remind_me_before' AS remind_me_before,
    rt.schedule_details->>'complete_till' AS complet_till
FROM
    prosys.tasks ta
INNER JOIN
    prosys.users us1 ON ta.assigned_by = us1.row_id
INNER JOIN
    LATERAL jsonb_array_elements_text(ta.assigned_to) AS assigned_to_id ON TRUE
INNER JOIN
    prosys.users us ON us.row_id = assigned_to_id::text
LEFT JOIN
    prosys.users us2 ON ta.completed_by = us2.row_id
LEFT JOIN prosys.recurring_task rt 
    ON ta.recurringid = rt.row_id
    AND rt.taskdetails->>'assigned_by' = $1
    AND rt.taskdetails->>'assigned_to' ILIKE '%' || ta.assigned_to::text || '%'
WHERE
    ta.assigned_by = $1
    AND ta.organizationid = $2
    AND ta.activestatus = 0
    ${assignedToFilter.length > 0 ? `AND assigned_to_id::text = ANY($5)` : ""}
    ${startDate ? `AND ta.completion_date >= '${startDate}'` : ""}
    ${endDate ? `AND ta.completion_date <= '${endDate}'` : ""}
    AND us.activestatus = 0
GROUP BY
    ta.row_id, ta.checklist, us1.name, us2.name, rt.schedule_details, rt.row_id
ORDER BY
    ta.cr_on DESC
LIMIT $3 OFFSET $4;
            `;

      if (assignedToFilter.length > 0) {
        params = [userid, organizationid, limit, offset, assignedToFilter];
      } else {
        params = [userid, organizationid, limit, offset];
      }
    } else {
      sqlquery = `
SELECT
    ta.row_id,
    ta.title,
    ta.description,
    ta.completion_date, ta.checklist,
    us1.name AS created_by,
    ta.cr_on AS created_at,
    json_agg(us.name) AS assigned_to,
    CASE
        WHEN ta.active_status = '0' THEN 'ongoing'
        WHEN ta.active_status = '1' THEN 'complete'
        WHEN ta.active_status = '2' THEN 'overdue'
    END AS status,
    CASE
        WHEN ta.task_type = '0' THEN 'Normal'
        WHEN ta.task_type = '1' THEN 'Recurring'
    END AS task_type_title,
    (ta.completion_date - CURRENT_DATE) AS due_days,
    us2.name AS updated_by,
    ta.task_type,
    rt.row_id as recurring_task_id,
    rt.schedule_details->>'type' AS schedule_type,
    rt.schedule_details->>'complete_till' AS complet_till,
    rt.schedule_details->>'reminder_list' AS reminder_list,
    rt.schedule_details->>'remind_me_before' AS remind_me_before
FROM
    prosys.tasks ta
INNER JOIN
    prosys.users us1 ON ta.assigned_by = us1.row_id
INNER JOIN
    LATERAL jsonb_array_elements_text(ta.assigned_to) AS assigned_to_id ON TRUE
INNER JOIN
    prosys.users us ON us.row_id = assigned_to_id::text
LEFT JOIN
    prosys.users us2 ON ta.completed_by = us2.row_id
LEFT JOIN prosys.recurring_task rt 
    ON ta.recurringid = rt.row_id
    AND rt.taskdetails->>'assigned_by' = $1
    AND rt.taskdetails->>'assigned_to' ILIKE '%' || ta.assigned_to::text || '%'
WHERE
    ta.assigned_by = $1
    AND ta.organizationid = $2
    AND ta.active_status = $3
    AND ta.activestatus = 0
    ${assignedToFilter.length > 0 ? `AND assigned_to_id::text = ANY($6)` : ""}
    ${startDate ? `AND ta.completion_date >= '${startDate}'` : ""}
    ${endDate ? `AND ta.completion_date <= '${endDate}'` : ""}
        AND us.activestatus = 0
GROUP BY
    ta.row_id, us1.name, ta.checklist, us2.name, rt.schedule_details, rt.row_id
ORDER BY
    ta.cr_on DESC
LIMIT $4 OFFSET $5;
            `;

      if (assignedToFilter.length > 0) {
        params = [
          userid,
          organizationid,
          active_status,
          limit,
          offset,
          assignedToFilter,
        ];
      } else {
        params = [userid, organizationid, active_status, limit, offset];
      }
    }

    var resp = await db_query.customQuery(sqlquery, "Tasks Fetched", params);
    // console.log("response --------->",resp.data,"lenght--->",resp.data.length)
    libFunc.sendResponse(res, resp);
  } catch (err) {
    console.error("Error in fetchMyAssignedTasks:", err);
    libFunc.sendResponse(res, {
      status: false,
      message: "Internal Server Error",
    });
  }
}

async function updateTaskStatus(req, res) {
  try {
    const status = req.data.status;
    const taskid = req.data.row_id;
    const userid = req.data.userId;
    const organizationid = req.data.orgId;
    const schema = "prosys";
    const tablename = `${schema}.tasks`;

    // Fetch checklist to verify before updating
    const checkQuery = `SELECT checklist FROM ${tablename} WHERE row_id = '${taskid}' AND organizationid = '${organizationid}'`;
    const taskResult = await db_query.customQuery(checkQuery, "fetched tasks");

    if (taskResult.length === 0) {
      // console.log("Task not found")
      return libFunc.sendResponse(res, { status: 1, msg: "Task not found" });
    }

    // console.log("taskResult--->",taskResult)

    const checklist = taskResult.data[0]?.checklist;

    // console.log("checklist--->",checklist)

    // Default: ongoing (0)
    let active_status = 0;

    if (status === "complete") {
      let allCompleted = true;

      //  Only check if checklist has items
      if (checklist && Array.isArray(checklist) && checklist.length > 0) {
        for (const group of checklist) {
          if (group.items && Array.isArray(group.items)) {
            for (const item of group.items) {
              if (!item.completed) {
                allCompleted = false;
                break;
              }
            }
          }
          if (!allCompleted) break;
        }
      }

      //  If checklist is empty or all completed — mark complete
      if (!checklist || checklist.length === 0 || allCompleted) {
        active_status = 1;
      } else {
        let pendingResp = {
          status: 1,
          msg: "Please complete all checklist items before marking this task as done",
        };
        // console.log("resp-->",pendingResp)
        return libFunc.sendResponse(res, pendingResp);
      }
    } else if (status === "ongoing") {
      active_status = 0;
    } else if (status === "overdue") {
      active_status = 2;
    }

    const columns = {
      remarks: "Manual update",
      active_status,
      completed_by: userid,
      completedon: new Date().toISOString(),
    };
    // console.log("columns---",columns)

    const resp = await db_query.addData(
      tablename,
      columns,
      taskid,
      "Task Status"
    );
    // console.log("resp--",resp)
    libFunc.sendResponse(res, resp);
  } catch (err) {
    // console.error("Error updating task status:", err);
    libFunc.sendResponse(res, {
      status: 1,
      msg: "Server error while updating task status",
    });
  }
}

async function updateTaskStatusBulk(req, res) {
  try {
    const status = req.data.status;
    const taskIds = req.data.row_ids || [];
    const userid = req.data.userId;
    const organizationid = req.data.orgId;
    const schema = "prosys";
    const tablename = `${schema}.tasks`;
    const logTable = `${schema}.task_status_logs`;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return libFunc.sendResponse(res, {
        status: 1,
        msg: "No task IDs provided.",
      });
    }

    const bulkId = libFunc.randomid();
    let updatedCount = 0;
    let skippedTasks = [];

    for (const taskid of taskIds) {
      const checkQuery = `
                SELECT checklist, active_status 
                FROM ${tablename} 
                WHERE row_id = '${taskid}' AND organizationid = '${organizationid}'
            `;
      const taskResult = await db_query.customQuery(
        checkQuery,
        "fetched tasks"
      );

      if (!taskResult.data || taskResult.data.length === 0) {
        skippedTasks.push({ taskid, reason: "Task not found" });
        continue;
      }

      const taskData = taskResult.data[0];
      const checklist = taskData.checklist || [];
      const currentStatus = taskData.active_status;

      //  Skip if already completed
      if (currentStatus === 1) {
        skippedTasks.push({ taskid, reason: "Task already completed" });
        continue;
      }

      let active_status = 0;

      //  Determine status
      if (status === "complete") {
        let allCompleted = true;

        if (Array.isArray(checklist) && checklist.length > 0) {
          for (const group of checklist) {
            if (group.items && Array.isArray(group.items)) {
              for (const item of group.items) {
                if (!item.completed) {
                  allCompleted = false;
                  break;
                }
              }
            }
            if (!allCompleted) break;
          }
        }

        if (!checklist.length || allCompleted) {
          active_status = 1;
        } else {
          skippedTasks.push({ taskid, reason: "Incomplete checklist items" });
          continue;
        }
      } else if (status === "ongoing") {
        active_status = 0;
      } else if (status === "overdue") {
        active_status = 2;
      }

      const columns = {
        active_status,
        completed_by: userid,
        completedon: new Date().toISOString(),
        remarks: "bulk update",
        bulk_id: bulkId,
      };

      const resp = await db_query.addData(
        tablename,
        columns,
        taskid,
        "Task Status"
      );
      if (resp.status === 0) updatedCount++;
    }

    //  Insert log only if at least one task updated
    if (updatedCount > 0) {
      const query = `
                INSERT INTO ${logTable} (row_id, task_ids, changed_by, organizationid, change_reason) 
                VALUES ($1, $2, $3, $4, $5)
            `;
      await db_query.customQuery(query, "data saved", [
        bulkId,
        JSON.stringify(taskIds),
        userid,
        organizationid,
        "bulk update",
      ]);
    }

    //  Build professional message
    let msg = "";
    const skippedCount = skippedTasks.length;
    const total = taskIds.length;

    if (updatedCount > 0 && skippedCount === 0) {
      msg = `Successfully updated ${updatedCount} task${
        updatedCount > 1 ? "s" : ""
      }.`;
    } else if (updatedCount > 0 && skippedCount > 0) {
      const reasonCount = {};
      skippedTasks.forEach((item) => {
        reasonCount[item.reason] = (reasonCount[item.reason] || 0) + 1;
      });

      const reasonSummary = Object.entries(reasonCount)
        .map(([reason, count]) => `${count} ${reason.toLowerCase()}`)
        .join(", ");

      msg = `Updated ${updatedCount} out of ${total} task${
        total > 1 ? "s" : ""
      } successfully. Skipped ${skippedCount} task${
        skippedCount > 1 ? "s" : ""
      } (${reasonSummary}).`;
    } else if (updatedCount === 0 && skippedCount > 0) {
      const reasonCount = {};
      skippedTasks.forEach((item) => {
        reasonCount[item.reason] = (reasonCount[item.reason] || 0) + 1;
      });

      const reasonSummary = Object.entries(reasonCount)
        .map(([reason, count]) => `${count} ${reason.toLowerCase()}`)
        .join(", ");

      msg = `No tasks were updated. All ${skippedCount} task${
        skippedCount > 1 ? "s" : ""
      } were skipped (${reasonSummary}).`;
    } else {
      msg = "No tasks were updated.";
    }

    const resp = {
      status: 0,
      msg,
      skipped: skippedCount > 0 ? skippedTasks : undefined,
    };
    // console.log("response ---->",resp)
    //  Send response
    libFunc.sendResponse(res, resp);
  } catch (err) {
    console.error("Error updating bulk task status:", err);
    libFunc.sendResponse(res, {
      status: 1,
      msg: "Server error while updating bulk task statuses.",
    });
  }
}

async function getTaskDAtaById(req, res) {
  var taskid = req.data.row_id;
  var organizationid = req.data.orgId;
  var query = `SELECT ta.row_id, ta.title, ta.description, ta.completion_date, us1.name AS created_by,
    ta.cr_on AS created_at,
    CASE
        WHEN (ta.active_status = '0') THEN 'ongoing'
        WHEN (ta.active_status = '1') THEN 'complete'
        WHEN (ta.active_status = '2') THEN 'overdue'
    END AS status,
    (ta.completion_date - CURRENT_DATE) AS due_days,
    us2.name AS updated_by
    FROM ${schema}.tasks ta
    INNER JOIN ${schema}.users us1 ON ta.assigned_by = us1.row_id
    LEFT JOIN ${schema}.users us2 ON ta.completed_by = us2.row_id
    WHERE ta.row_id = $1`;

  // console.log("query===========");
  // console.log(query);
  var resp = await db_query.customQuery(query, "Tasks Fetched", [taskid]);
  libFunc.sendResponse(res, resp);
}

/**
 * Commenting on Task
 */
async function checkIsRecurringTasks(taskid) {
  return new Promise(async (resolve, reject) => {
    var query = `SELECT row_id FROM ${schema}.recurring_task WHERE row_id = $1`;
    // console.log("query===========");
    // console.log(query);
    connect_db.query(query, [taskid], (err, result) => {
      if (err) {
        // console.log(err);
        resolve(false);
      } else {
        if (result.rows.length > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      }
    });
  });
}

async function createComment(req, res) {
  var taskid = req.data.task_id;
  var comment = req.data.comment;
  var userid = req.data.userId;
  var organizationid = req.data.orgId;
  var tablename = schema + ".comments";

  var attachments = req.data.file_path;
  if (!taskid || !comment || !userid || comment == " ") {
    const resp = { status: 1, msg: "Missing required fields" };
    // console.log("response of validation ", resp);
    libFunc.sendResponse(res, resp);
  } else {
    // var checkTaskidisrecurring = await checkIsRecurringTasks(taskid);
    // console.log("checkTaskidisrecurring", checkTaskidisrecurring);
    // if (checkTaskidisrecurring) {
    //     var cpmmentdata = {
    //         "comment": comment,
    //         "userid": userid,
    //         "attachments":(attachments),
    //         "organizationid": organizationid
    //     }
    //     var columns={
    //         "commentdetails":JSON.stringify(cpmmentdata)
    //     }
    //     var tablename = schema + '.recurring_task';
    //     var resp = await db_query.addData(tablename, columns, taskid, "Recurring Comment");
    //     libFunc.sendResponse(res, resp);
    // } else {
    var columns = {
      taskid: taskid,
      comment: comment,
      userid: userid,
      attachments: JSON.stringify(attachments),
      organizationid: organizationid,
    };
    var resp = await db_query.addData(
      tablename,
      columns,
      req.data.row_id,
      "Comment"
    );
    libFunc.sendResponse(res, resp);
    // }
  }
}

async function updateChecklist(req, res) {
  var taskid = req.data.taskid;
  var checklist = req.data.checklist;

  var sqlquery = `UPDATE ${schema}.tasks SET checklist='${JSON.stringify(
    checklist
  )}' WHERE row_id='${taskid}'`;
  // var resp = await db_query.customQuery(sqlquery, "Checklist Updated");
  // console.log("resp", resp);
  //   resp['status'] = 0;
  // resp['data'] = resp['data'] ?? [];
  // libFunc.sendResponse(res, resp);
  const result = await connect_db.query(sqlquery);
  // console.log("rsult", result.rows)
  if (result.rowCount > 0) {
    const resp = {
      status: 0,
      msg: "Checklist updated successfully",
      data: result.rows, // Return updated task details
    };
    // console.log("response", resp);
    libFunc.sendResponse(res, resp);
  } else {
    const resp = {
      status: 1,
      msg: "No Data found",
    };
    // console.log("response", resp);
    libFunc.sendResponse(res, resp);
  }
}

async function fetchCheckListData(req, res) {
  var checklistids = req.data.checklistids;
  var checklistIds = checklistids.map((item) => `'${item}'`).join(",");
  // Convert checklistIds to array of values for parameterized query
  var sqlquery = `SELECT * FROM ${schema}.checklist WHERE row_id = ANY($1)`;
  var resp = await db_query.customQuery(sqlquery, "Checklist Fetched", [
    checklistids,
  ]);
  resp["status"] = 0;
  resp["data"] = resp["data"] ?? [];
  libFunc.sendResponse(res, resp);
}

async function fetchComments(req, res) {
  // console.log("req", req.data);
  var taskid = req.data.row_id;
  var organizationid = req.data.orgId;
  var limit = req.data.limit || 100;
  var page = req.data.page || 1;
  var offset = (page - 1) * limit;
  var query = `SELECT cm.row_id, cm.comment, us.name as user_name, cm.cr_on as created_at, cm.attachments as file_path, cm.taskid as task_id
        FROM ${schema}.comments cm
        INNER JOIN ${schema}.users us ON cm.userid = us.row_id
        WHERE cm.taskid = $1 AND us.organizationid = $2
        ORDER BY cm.cr_on DESC
        LIMIT $3 OFFSET $4`;
  //  console.log("query====fetch comments=======");
  //  console.log(query);
  var resp = await db_query.customQuery(query, "Comments Fetched", [
    taskid,
    organizationid,
    limit,
    offset,
  ]);
  resp["status"] = 0;
  resp["data"] = resp["data"] ?? [];

  libFunc.sendResponse(res, resp);
}

async function replyOncomments(req, res) {
  var commentid = req.data.comment_id;
  var reply_text = req.data.replycomment;
  var userid = req.data.userId;
  var taskid = req.data.task_id;
  var organizationid = req.data.orgId;
  var tablename = schema + ".comments_replies";

  if (!commentid || !reply_text || !userid || !taskid) {
    const resp = { status: 1, msg: "Missing required fields" };
    // console.log("response of validation ", resp);
    libFunc.sendResponse(res, resp);
  } else {
    var columns = {
      commentid: commentid,
      reply_text: reply_text,
      userid: userid,
      taskid: taskid,
    };
    var resp = await db_query.addData(
      tablename,
      columns,
      req.data.row_id,
      "Comment Reply"
    );
    libFunc.sendResponse(res, resp);
  }
}

async function fetchCommentReplies(req, res) {
  var commentid = req.data.comment_id;
  var organizationid = req.data.orgId;
  var limit = req.data.limit || 100;
  var page = req.data.page || 1;
  var offset = (page - 1) * limit;
  var userid = req.data.userId;
  var query = `SELECT cr.row_id, cr.reply_text, us.name, cr.cr_on as created_at
        FROM ${schema}.comments_replies cr
        INNER JOIN ${schema}.users us ON cr.userid = us.row_id
        WHERE cr.commentid = $1 AND cr.organizationid = $2
        ORDER BY cr.cr_on DESC
        LIMIT $3 OFFSET $4`;

  var resp = await db_query.customQuery(query, "Comment Replies Fetched", [
    commentid,
    organizationid,
    limit,
    offset,
  ]);
  libFunc.sendResponse(res, resp);
}

/**
 * Task Reports
 */

async function taskReports(req, res) {
  var organizationid = req.data.orgId;
  var userid = req.data.ismember ? req.data.memberid : req.data.userId;
  var month = req.data.month;

  var query = `SELECT 
    COUNT(*) AS receivedtaskscount FROM ${schema}.tasks WHERE assigned_to::text LIKE $1 AND organizationid = $2;`;
  // console.log("query===========");
  // console.log(query);
  var resp2 = await db_query.customQuery(query, "Total Received Tasks", [
    `%${userid}%`,
    organizationid,
  ]);
  var receivedTasksCount = resp2.data[0].receivedtaskscount;
  var query1 = `SELECT count(*) as assignedtaskscount from ${schema}.tasks WHERE assigned_by=$1 AND organizationid=$2 ;`;
  // console.log("query===========");
  // console.log(query1);
  var resp1 = await db_query.customQuery(query1, "Total Assigned Tasks", [
    userid,
    organizationid,
  ]);
  var assignedTasksCount = resp1.data[0].assignedtaskscount;
  var resp = {
    status: 0,
    msg: "Total Tasks Fetched",
    data: {
      receivedTasksCount: receivedTasksCount,
      assignedTasksCount: assignedTasksCount,
    },
  };
  var queryMonth = `SELECT
    count(*) as total_tasks,
    count(*) filter (where active_status='1') as completed_tasks,
    count(*) filter (where active_status='0') as ongoing_tasks,
    count(*) filter (where active_status='2') as overduetasks,
    to_char(cr_on, 'YYYY-MM') as month
FROM ${schema}.tasks
WHERE assigned_by=$1 AND organizationid=$2 AND Date_Trunc('month', cr_on::date) = $3
GROUP BY month
ORDER BY month DESC;`;
  // console.log("query===========");
  // console.log(queryMonth);
  var respMon = await db_query.customQuery(
    queryMonth,
    "Task Completion Rate Monthly",
    [userid, organizationid, month]
  );
  // console.log("response", respMon);
  if (respMon["status"] == 0) {
    var data = respMon.data;
    respMon["data"][0]["completion_rate"] = (
      (parseInt(data[0]["completed_tasks"]) /
        parseInt(data[0]["total_tasks"])) *
      100
    ).toFixed(2);
    // resp['data']['completed_tasks']=data[0]['completed_tasks'];
    // resp['data']['total_tasks']=data[0]['total_tasks'];
    // resp['data']['month']=data[0]['month'];
    resp["data"]["monthlyreport"] = respMon.data;
  }

  // console.log("response", resp);
  libFunc.sendResponse(res, resp);
}

async function totalReceivedAssignedTasks(req, res) {
  var organizationid = req.data.orgId;
  var userid = req.data.userId;
  var query = `SELECT 
    COUNT(*) AS receivedtaskscount FROM ${schema}.tasks WHERE assigned_to::text LIKE $1 AND organizationid = $2 ;`;
  // console.log("query===========");
  // console.log(query);
  var resp2 = await db_query.customQuery(query, "Total Received Tasks", [
    `%${userid}%`,
    organizationid,
  ]);
  var receivedTasksCount = resp2.data[0].receivedtaskscount;
  var query1 = `SELECT count(*) as assignedtaskscount from ${schema}.tasks WHERE assigned_by=$1 AND organizationid=$2 ;`;
  // console.log("query===========");
  // console.log(query1);
  var resp1 = await db_query.customQuery(query1, "Total Assigned Tasks", [
    userid,
    organizationid,
  ]);
  var assignedTasksCount = resp1.data[0].assignedtaskscount;
  var resp = {
    status: 0,
    msg: "Total Tasks Fetched",
    data: {
      receivedTasksCount: receivedTasksCount,
      assignedTasksCount: assignedTasksCount,
    },
  };
  // console.log("response", resp);
  libFunc.sendResponse(res, resp);
}

async function taskCompletionRateMonthly(req, res) {
  var organizationid = req.data.orgId;
  var userid = req.data.userId;
  var query = `SELECT
    count(*) as total_tasks,
    count(*) filter (where active_status='1') as completed_tasks,
    count(*) filter (where active_status='0') as ongoing_tasks,
    count(*) filter (where active_status='2') as overduetasks,
    to_char(cr_on, 'YYYY-MM') as month
FROM ${schema}.tasks
WHERE assigned_by = $1 AND organizationid = $2 AND Date_Trunc('month', cr_on::date) = $3
GROUP BY month
ORDER BY month DESC;`;
  // console.log("query===========");
  // console.log(query);
  var resp = await db_query.customQuery(query, "Task Completion Rate Monthly", [
    userid,
    organizationid,
    req.data.month,
  ]);
  // console.log("response", resp);
  if (resp["status"] == 0) {
    var data = resp.data;
    resp["data"][0]["completion_rate"] = (
      (parseInt(data[0]["completed_tasks"]) /
        parseInt(data[0]["total_tasks"])) *
      100
    ).toFixed(2);
    // resp['data']['completed_tasks']=data[0]['completed_tasks'];
    // resp['data']['total_tasks']=data[0]['total_tasks'];
    // resp['data']['month']=data[0]['month'];
  }

  // console.log("response", resp);
  libFunc.sendResponse(res, resp);
}

/**
 * WorkFlow
 */

async function createWorkflow(req, res) {
  var workflow_name =
    req.data.workFlow_name != undefined
      ? req.data.workFlow_name.trim().replaceAll("'", "`")
      : undefined;
  var description =
    req.data.workFlow_description != undefined
      ? req.data.workFlow_description.trim().replaceAll("'", "`")
      : undefined;
  var userid = req.data.userId;
  var organizationid = req.data.orgId;
  var deptid = req.data.department_id;
  if (
    !workflow_name ||
    !description ||
    !req.data.tasks ||
    req.data.tasks.length == 0
  ) {
    const resp = { status: 1, msg: "Missing required fields" };
    // console.log("response of validation ", resp);
    libFunc.sendResponse(res, resp);
  } else {
    var tasks = JSON.stringify(req.data.tasks).replaceAll("'", "`");
    var taskColumns = {
      organizationid: organizationid,
      workflow_name: workflow_name,
      description: description,
      tasks: tasks,
      userid: userid,
    };
    var tablename = schema + ".workflow";
    var resp = await db_query.addData(
      tablename,
      taskColumns,
      req.data.row_id,
      "Workflow"
    );
    libFunc.sendResponse(res, resp);
  }
}

async function fetchWorkflow(req, res) {
  var organizationid = req.data.orgId;
  var userid = req.data.userId;
  var query = `SELECT * FROM ${schema}.workflow WHERE userid = $1 AND organizationid = $2;`;
  // console.log("query===========");
  // console.log(query);
  var resp = await db_query.customQuery(query, "Workflows Fetched", [
    userid,
    organizationid,
  ]);
  libFunc.sendResponse(res, resp);
}

/**
 * Add Recurring task to tasks table
 */

async function createRecurringAtCreationTime(recurringId) {
  // console.log("createRecurringAtCreationTime --------------", recurringId);
  try {
    const today = new Date();
    const todayStr = today.toDateString();
    const dayOfWeek = today.toLocaleString("default", { weekday: "long" });
    const currentDay = String(today.getDate()).padStart(2, "0");
    const currentMonth = String(today.getMonth() + 1).padStart(2, "0");
    const todayKey = `${currentDay}-${currentMonth}`; // e.g. "19-09"

    const sqlquery = `
            SELECT *
            FROM ${schema}.recurring_task
            WHERE row_id = $1 AND activestatus = 0;
        `;
    const result = await connect_db.query(sqlquery, [recurringId]);
    if (result.rows.length === 0) return;

    const task = result.rows[0];
    const taskDetails = task.taskdetails;
    const commentdetails = task.commentdetails;
    const schedule = task.schedule_details;
    const reminderSets = schedule.reminder_list ?? [];

    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    for (let set of reminderSets) {
      if (!set || !set.reminder_on) continue;

      let shouldCreate = false;

      if (schedule.type === "Daily") {
        shouldCreate = true;
      } else if (
        schedule.type === "Weekly" &&
        set.reminder_on.includes(dayOfWeek)
      ) {
        shouldCreate = true;
      } else if (
        schedule.type === "Monthly" &&
        set.reminder_on.includes(todayKey)
      ) {
        shouldCreate = true;
      } else if (
        schedule.type === "Yearly" &&
        set.reminder_on.includes(todayKey)
      ) {
        shouldCreate = true;
      }

      if (!shouldCreate) continue;

      // ===== Calculate completion date =====
      let completiondate = new Date();

      if (schedule.type === "Weekly" && set.complete_till) {
        let targetDay = set.complete_till.trim();
        let todayIndex = completiondate.getDay();
        let targetIndex = daysOfWeek.indexOf(targetDay);
        if (targetIndex !== -1) {
          let diff = targetIndex - todayIndex;
          if (diff < 0) diff += 7; // next week
          completiondate.setDate(completiondate.getDate() + diff);
        }
      } else if (schedule.type === "Monthly" && set.complete_till) {
        let targetDate = parseInt(set.complete_till);
        if (!isNaN(targetDate)) {
          let currentMonth = completiondate.getMonth();
          let currentYear = completiondate.getFullYear();
          completiondate = new Date(currentYear, currentMonth, targetDate);
          if (completiondate < today) {
            completiondate = new Date(
              currentYear,
              currentMonth + 1,
              targetDate
            );
          }
        }
      } else if (schedule.type === "Yearly" && set.complete_till) {
        let [day, month] = set.complete_till.split("-").map(Number);
        if (!isNaN(day) && !isNaN(month)) {
          let currentYear = completiondate.getFullYear();
          completiondate = new Date(currentYear, month - 1, day);
          if (completiondate < today) {
            completiondate = new Date(currentYear + 1, month - 1, day);
          }
        }
      } else {
        // fallback to remind_me_before
        const remind_me_before =
          set.remind_me_before?.length > 0
            ? parseInt(set.remind_me_before[0])
            : 1;
        completiondate.setDate(completiondate.getDate() + remind_me_before);
      }

      //  Prepare task columns
      let taskColumns = {
        organizationid: taskDetails.organizationid ?? task.organizationid,
        title: taskDetails.title,
        description: taskDetails.description,
        assigned_to: JSON.stringify(taskDetails.assigned_to),
        assigned_by: taskDetails.assigned_by ?? task.created_by,
        checklist: JSON.stringify(taskDetails.checklist),
        completion_date: completiondate.toDateString(),
        task_type: 1,
        recurringid: task.row_id,
      };

      // console.log("taskColumns--------", taskColumns);

      if (!taskColumns.organizationid || !taskColumns.assigned_by) {
        console.warn(
          `Skipping first task creation for ${task.row_id}: Missing organizationid or assigned_by`
        );
        continue;
      }

      const resp = await addTask(
        taskColumns,
        taskDetails.assigned_to,
        taskDetails.assigned_by
      );

      if (
        completiondate.toDateString() !== todayStr &&
        taskDetails.organizationid != "1739861234068_66iA"
      ) {
        await notifyOnWA(
          {
            title: taskDetails.title,
            description: taskDetails.description,
            assignedby: taskDetails.assigned_by,
            completion_date: completiondate.toDateString(),
            organizationid: taskDetails.organizationid,
          },
          taskDetails.assigned_to
        );
      }

      if (commentdetails) {
        const commentColumns = {
          taskid: resp.data.row_id,
          comment: commentdetails.comment,
          userid: commentdetails.userid,
          attachments: JSON.stringify(commentdetails.attachments),
          organizationid: commentdetails.organizationid,
        };
        await db_query.addData(
          schema + ".comments",
          commentColumns,
          commentdetails.row_id,
          "Comment"
        );
      }

      await notifyUser(
        taskDetails.assigned_to,
        taskDetails.assigned_by,
        taskDetails.title,
        resp.data.row_id
      );
    }
  } catch (err) {
    console.error("Error creating first recurring task instance:", err);
  }
}

async function createRecurringAtCreationTimeBulk(recurring_taskids) {
  //  console.log("recurring_taskids", recurring_taskids);
  const today = new Date();
  const dayOfWeek = today.toLocaleString("default", { weekday: "long" }); // e.g. "Monday"
  const customDateSel = `${today.getDate().toString().padStart(2, "0")}-${(
    today.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}`;

  const sqlquery = `
        SELECT * 
        FROM ${schema}.recurring_task
        WHERE row_id = ANY($1) AND activestatus = 0
    `;

  try {
    const result = await connect_db.query(sqlquery, [recurring_taskids]);
    //  console.log("Recurring tasks found:", result.rows);

    if (result.rows.length > 0) {
      for (const task of result.rows) {
        const schedule = task.schedule_details;
        const reminderOnArray = schedule.reminder_list || [];

        //  Find matching reminder object for today
        const matchingReminders = reminderOnArray.filter((rObj) => {
          if (schedule.type === "Weekly") {
            return rObj.reminder_on.includes(dayOfWeek);
          } else if (
            schedule.type === "Monthly" ||
            schedule.type === "Yearly"
          ) {
            return rObj.reminder_on.includes(customDateSel);
          } else if (schedule.type === "Daily") {
            return true; // always create daily tasks
          }
          return false;
        });

        if (matchingReminders.length === 0) continue; // no match, skip task

        for (const reminder of matchingReminders) {
          // Calculate completion date based on remind_me_before
          const remindDays = Array.isArray(reminder.remind_me_before)
            ? reminder.remind_me_before.map((d) => parseInt(d))
            : [1];

          for (const rmb of remindDays) {
            const CURRENT_DATE = new Date();
            const completionDate = new Date(
              CURRENT_DATE.setDate(CURRENT_DATE.getDate() + rmb)
            );

            const taskDetails = task.taskdetails;
            const commentdetails = task.commentdetails;

            const taskColumns = {
              organizationid: taskDetails.organizationid,
              title: taskDetails.title,
              description: taskDetails.description,
              checklist: JSON.stringify(taskDetails.checklist),
              task_type: 1,
              assigned_to: JSON.stringify(taskDetails.assigned_to),
              assigned_by: taskDetails.assigned_by,
              completion_date: completionDate.toDateString(),
              recurringid: task.row_id,
            };

            const resp = await addTask(
              taskColumns,
              taskDetails.assigned_to,
              taskDetails.assigned_by
            );

            if (commentdetails) {
              const commentColumns = {
                taskid: resp.data.row_id,
                comment: commentdetails.comment,
                userid: commentdetails.userid,
                attachments: JSON.stringify(commentdetails.attachments),
                organizationid: commentdetails.organizationid,
              };
              await db_query.addData(
                schema + ".comments",
                commentColumns,
                commentdetails.row_id,
                "Comment"
              );
            }

            await notifyUser(
              taskDetails.assigned_to,
              taskDetails.assigned_by,
              taskDetails.title,
              resp.data.row_id
            );
          }
        }
      }
    }
  } catch (err) {
    console.error("Error during recurring task check:", err);
  }
}

async function checkRecurringTasks() {
  const sqlquery = `WITH today AS (
    SELECT 
        CURRENT_DATE AS dt,
        trim(to_char(CURRENT_DATE, 'Day')) AS day_name,  
        to_char(CURRENT_DATE, 'DD-MM') AS dd_mm          
)
SELECT t.*, rl
FROM prosys.recurring_task t

CROSS JOIN today
CROSS JOIN LATERAL jsonb_array_elements(t.schedule_details->'reminder_list') rl
WHERE t.activestatus = 0 AND  (
    (t.schedule_details->>'type' = 'Daily')

    OR (
        t.schedule_details->>'type' = 'Weekly'
        AND EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(rl->'reminder_on') d
            WHERE d = today.day_name
        )
    )
    OR (
        t.schedule_details->>'type' = 'Monthly'
        AND EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(rl->'reminder_on') d
            WHERE d = today.dd_mm
        )
    )

    OR (
        t.schedule_details->>'type' = 'Yearly'
        AND EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(rl->'reminder_on') d
            WHERE d = today.dd_mm
        )
    )
);
`;
  // const sqlquery = `SELECT * FROM ${schema}.recurring_task WHERE activestatus = 0;`;
  console.log("sqlQuery===============", sqlquery);
  connect_db.query(sqlquery, [], async (err, result) => {
    if (err) {
      console.error("Error fetching recurring tasks:", err);
      return;
    }

    // for (let task of result.rows) {
    //     const taskDetails = task.taskdetails;
    //     const type = task.schedule_details?.type ?? "Weekly";
    //     const reminderSets = task.schedule_details?.reminder_list ?? [];
    //     const commentdetails = task.commentdetails;

    //     for (let set of reminderSets) {
    //         if (!set) continue; // skip null/undefined sets

    //         // SAFETY CHECKS for missing arrays
    //         const reminders = Array.isArray(set.reminder_on) ? set.reminder_on : [];
    //         const remindBefore = Array.isArray(set.remind_me_before) ? set.remind_me_before : [];

    //         if (reminders.length === 0 && type !== "Daily") {
    //             // If no reminder dates and not a daily task → skip
    //             continue;
    //         }

    //         let isToday = false;
    //         let completionDate = new Date(today);
    //         let remindIndex = 0;

    //         try {
    //             switch (type) {
    //                 case "Daily":
    //                     isToday = true;
    //                     remindIndex = 0;
    //                     completionDate = new Date(today);
    //                     break;

    //                 case "Weekly":
    //                     remindIndex = reminders.findIndex((d) => d === dayOfWeek);
    //                     isToday = remindIndex !== -1;
    //                     if (isToday) {
    //                         const remindDays = parseInt(remindBefore[remindIndex] ?? remindBefore[0] ?? 0);
    //                         completionDate.setDate(today.getDate() + remindDays);
    //                     }
    //                     break;

    //                 case "Monthly":
    //                     remindIndex = reminders.findIndex((d) => d === todayDM);
    //                     isToday = remindIndex !== -1;
    //                     if (isToday) {
    //                         if (set.complete_till) {
    //                             const day = parseInt(set.complete_till);
    //                             const month = today.getMonth();
    //                             const year = today.getFullYear();
    //                             completionDate = new Date(year, month, day);
    //                         } else {
    //                             const remindDays = parseInt(remindBefore[remindIndex] ?? remindBefore[0] ?? 0);
    //                             completionDate.setDate(today.getDate() + remindDays);
    //                         }
    //                     }
    //                     break;

    //                 case "Yearly":
    //                     remindIndex = reminders.findIndex((d) => d === todayDM);
    //                     isToday = remindIndex !== -1;
    //                     if (isToday) {
    //                         if (set.complete_till) {
    //                             const [day, month] = set.complete_till.split("-");
    //                             const year = today.getFullYear();
    //                             completionDate = new Date(year, parseInt(month) - 1, parseInt(day));
    //                         } else {
    //                             const remindDays = parseInt(remindBefore[remindIndex] ?? remindBefore[0] ?? 0);
    //                             completionDate.setDate(today.getDate() + remindDays);
    //                         }
    //                     }
    //                     break;

    //                 default:
    //                     continue;
    //             }
    //         } catch (e) {
    //             console.error(`Error processing task ${task.row_id}:`, e);
    //             continue;
    //         }

    //         if (!isToday) continue;

    //         const completionDateStr = completionDate.toISOString().split("T")[0];

    //         try {
    //             // Check if task already exists
    //             const existingTaskQuery = `SELECT * FROM ${schema}.tasks WHERE recurringid = $1 AND completion_date = $2`;
    //             const existingTaskRes = await connect_db.query(existingTaskQuery, [
    //                 task.row_id,
    //                 completionDateStr,
    //             ]);

    //             if (existingTaskRes.rows.length > 0) {
    //                 const existingTask = existingTaskRes.rows[0];
    //                 if (existingTask.active_status === 0) {
    //                   //  console.log(`Reminder: Task already exists for ${taskDetails.title}`);
    //                     await notifyUser(taskDetails.assigned_to, taskDetails.assigned_by, taskDetails.title, existingTask.row_id);
    //                 }
    //                 continue;
    //             }

    //             // Prepare new task
    //             const taskColumns = {
    //                 row_id: libFunc.randomid(),
    //                 organizationid: taskDetails.organizationid ?? task.organizationid,
    //                 title: taskDetails.title,
    //                 description: taskDetails.description,
    //                 assigned_to: JSON.stringify(taskDetails.assigned_to),
    //                 assigned_by: taskDetails.assigned_by ?? task.created_by,
    //                 checklist: JSON.stringify(taskDetails.checklist),
    //                 completion_date: completionDateStr,
    //                 task_type: 1,
    //                 recurringid: task.row_id,
    //             };

    //             if (!taskColumns.organizationid || !taskColumns.assigned_by) {
    //                 console.warn(`Skipping recurring task ${task.row_id}: Missing organizationid or assigned_by`);
    //                 continue;
    //             }

    //             const resp = await addTask(taskColumns, taskDetails.assigned_to, taskDetails.assigned_by);

    //           //  console.log(`Created recurring task for ${taskDetails.title} on ${completionDateStr}`);

    //             // WhatsApp Notification
    //             const whatsappTAskDetails = {
    //                 title: taskDetails.title,
    //                 description: taskDetails.description,
    //                 assignedby: taskDetails.assigned_by,
    //                 completion_date: completionDate.toDateString(),
    //                 organizationid: taskDetails.organizationid
    //             };

    //             if (completionDate.toDateString() !== todayStr && taskDetails.organizationid != '1739861234068_66iA') {
    //                 await notifyOnWA(whatsappTAskDetails, taskDetails.assigned_to);
    //             }

    //             // Comment Details Handling
    //             if (commentdetails) {
    //                 try {
    //                     const commentColumns = {
    //                         taskid: resp.data.row_id,
    //                         comment: commentdetails.comment,
    //                         userid: commentdetails.userid,
    //                         attachments: JSON.stringify(commentdetails.attachments),
    //                         organizationid: commentdetails.organizationid
    //                     };
    //                     await db_query.addData(schema + '.comments', commentColumns, commentdetails.row_id, "Comment");
    //                 } catch (e) {
    //                     console.error("Error inserting comment:", e);
    //                 }
    //             }

    //             await notifyUser(taskDetails.assigned_to, taskDetails.assigned_by, taskDetails.title, resp.data.row_id);

    //         } catch (e) {
    //             console.error(`Error creating task for recurring ${task.row_id}:`, e);
    //         }
    //     }
    // }

    await processTaskInBatches(result);
  });
}

async function processTaskInBatches(result) {
  // const today = new Date("2025-09-20"); // For testing
  const today = new Date();
  const dayOfWeek = today.toLocaleString("default", { weekday: "long" });
  const todayDate = today.getDate().toString().padStart(2, "0");
  const todayMonth = (today.getMonth() + 1).toString().padStart(2, "0");
  const todayDM = `${todayDate}-${todayMonth}`; // DD-MM
  const todayStr = today.toDateString();

  console.log("Total tasks process:", result.rows.length);
  const batches = chunkArray(result.rows, 200);
  let totalProcessed = 0;
  for (let j = 0; j < batches.length; j++) {
    async function loop(batchIndex) {
      const batch = batches[batchIndex];
      for (const res of batch) {
        totalProcessed++;
        console.log(
          "Processing task ",
          totalProcessed,
          " of ",
          result.rows.length
        );
        const task = res;
        console.log("task data=====", task);

        const taskDetails = task.taskdetails;
        const type = task.schedule_details?.type ?? "Daily";
        const reminderSets = task.schedule_details?.reminder_list ?? [];
        const commentdetails = task.commentdetails;
        console.log("task===", taskDetails);
        // console.log("reminders======",reminderSets);
        console.log("type=====", type);

        // for (let set of reminderSets) {
        let set = task.rl;
        console.log("rl=============", set);
        if (!set) continue; // skip null/undefined sets

        // SAFETY CHECKS for missing arrays
        const reminders = Array.isArray(set.reminder_on) ? set.reminder_on : [];
        const remindBefore = Array.isArray(set.remind_me_before)
          ? set.remind_me_before
          : [];

        if (reminders.length === 0 && type !== "Daily") {
          // If no reminder dates and not a daily task → skip
          continue;
        }

        let isToday = false;
        let completionDate = new Date(today);
        let remindIndex = 0;

        try {
          switch (type) {
            case "Daily":
              isToday = true;
              remindIndex = 0;
              completionDate = new Date(today);
              break;

            case "Weekly":
              remindIndex = reminders.findIndex((d) => d === dayOfWeek);
              isToday = remindIndex !== -1;
              if (isToday) {
                const remindDays = parseInt(
                  remindBefore[remindIndex] ?? remindBefore[0] ?? 0
                );
                completionDate.setDate(today.getDate() + remindDays);
              }
              break;

            case "Monthly":
              remindIndex = reminders.findIndex((d) => d === todayDM);
              isToday = remindIndex !== -1;
              if (isToday) {
                if (set.complete_till) {
                  const day = parseInt(set.complete_till);
                  const month = today.getMonth();
                  const year = today.getFullYear();
                  completionDate = new Date(year, month, day);
                } else {
                  const remindDays = parseInt(
                    remindBefore[remindIndex] ?? remindBefore[0] ?? 0
                  );
                  completionDate.setDate(today.getDate() + remindDays);
                }
              }
              break;

            case "Yearly":
              remindIndex = reminders.findIndex((d) => d === todayDM);
              isToday = remindIndex !== -1;
              if (isToday) {
                if (set.complete_till) {
                  const [day, month] = set.complete_till.split("-");
                  const year = today.getFullYear();
                  completionDate = new Date(
                    year,
                    parseInt(month) - 1,
                    parseInt(day)
                  );
                } else {
                  const remindDays = parseInt(
                    remindBefore[remindIndex] ?? remindBefore[0] ?? 0
                  );
                  completionDate.setDate(today.getDate() + remindDays);
                }
              }
              break;

            default:
              continue;
          }
        } catch (e) {
          console.error(`Error processing task ${task.row_id}:`, e);
          continue;
        }

        if (!isToday) continue;

        const completionDateStr = completionDate.toISOString().split("T")[0];
        console.log("completiondate=========", completionDateStr);

        try {
          // Check if task already exists
          const existingTaskQuery = `SELECT * FROM ${schema}.tasks WHERE recurringid = $1 AND completion_date = $2`;
          const existingTaskRes = await connect_db.query(existingTaskQuery, [
            task.row_id,
            completionDateStr,
          ]);
          // WhatsApp Notification
          const whatsappTAskDetails = {
            title: taskDetails.title,
            description: taskDetails.description,
            assignedby: taskDetails.assigned_by,
            completion_date: completionDate.toDateString(),
            organizationid: taskDetails.organizationid,
          };

          if (existingTaskRes.rows.length > 0) {
            const existingTask = existingTaskRes.rows[0];
            if (existingTask.active_status === 0) {
              console.log(
                `Reminder: Task already exists for ${taskDetails.title}`
              );
              await notifyUser(
                taskDetails.assigned_to,
                taskDetails.assigned_by,
                taskDetails.title,
                existingTask.row_id
              );
              if (
                completionDate.toDateString() !== todayStr &&
                taskDetails.organizationid != "1739861234068_66iA"
              ) {
                console.log("due date is not today=============");
                await notifyOnWA(whatsappTAskDetails, taskDetails.assigned_to);
              }
            }
            continue;
          }

          // Prepare new task
          const taskColumns = {
            row_id: libFunc.randomid(),
            organizationid: taskDetails.organizationid ?? task.organizationid,
            title: taskDetails.title,
            description: taskDetails.description,
            assigned_to: JSON.stringify(taskDetails.assigned_to),
            assigned_by: taskDetails.assigned_by ?? task.created_by,
            checklist: JSON.stringify(taskDetails.checklist),
            completion_date: completionDateStr,
            task_type: 1,
            recurringid: task.row_id,
          };

          if (!taskColumns.organizationid || !taskColumns.assigned_by) {
            console.warn(
              `Skipping recurring task ${task.row_id}: Missing organizationid or assigned_by`
            );
            continue;
          }

          const resp = await addTask(
            taskColumns,
            taskDetails.assigned_to,
            taskDetails.assigned_by
          );

          console.log(
            `Created recurring task for ${taskDetails.title} on ${completionDateStr}`
          );

          // // WhatsApp Notification
          // const whatsappTAskDetails = {
          //     title: taskDetails.title,
          //     description: taskDetails.description,
          //     assignedby: taskDetails.assigned_by,
          //     completion_date: completionDate.toDateString(),
          //     organizationid: taskDetails.organizationid
          // };

          if (
            completionDate.toDateString() !== todayStr &&
            taskDetails.organizationid != "1739861234068_66iA"
          ) {
            console.log("due date is not today======creation=======");
            await notifyOnWA(whatsappTAskDetails, taskDetails.assigned_to);
          }

          // Comment Details Handling
          if (commentdetails) {
            try {
              const commentColumns = {
                taskid: resp.data.row_id,
                comment: commentdetails.comment,
                userid: commentdetails.userid,
                attachments: JSON.stringify(commentdetails.attachments),
                organizationid: commentdetails.organizationid,
              };
              await db_query.addData(
                schema + ".comments",
                commentColumns,
                commentdetails.row_id,
                "Comment"
              );
            } catch (e) {
              console.error("Error inserting comment:", e);
            }
          }

          await notifyUser(
            taskDetails.assigned_to,
            taskDetails.assigned_by,
            taskDetails.title,
            resp.data.row_id
          );
        } catch (e) {
          console.error(`Error creating task for recurring ${task.row_id}:`, e);
        }
        // }
      }
      if (batchIndex < batches.length - 1) {
        //  console.log("Waiting 1 minute before next batch...");
        await new Promise((resolve) => setTimeout(resolve, 60000));
      }
    }
    loop(j);
  }
}
function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

function checkComplaincesForToday() {
  const today = new Date();
  const dayOfWeek = today.toLocaleString("default", { weekday: "long" }); // e.g., "Monday"
  const month = today.toLocaleString("default", { month: "long" }); // e.g., "October"
  const date = today.getDate(); // e.g., 7
  const formattedTime = today.toTimeString().split(" ")[0]; // Get current time in HH:MM:SS format
  // console.log("Today:", today, "Day of Week:", dayOfWeek, "Month:", month, "Date:", date, "Formatted Time:", formattedTime);
  // // Check if any recurring tasks are due today
  const customDAteSel = `${
    date.toString().length < 2 ? "0" + date.toString() : date.toString()
  }-${
    (today.getMonth() + 1).toString().length < 2
      ? "0" + (today.getMonth() + 1).toString()
      : (today.getMonth() + 1).toString()
  }`;
  // console.log("customDAteSel", customDAteSel);
  const sqlquery = `
SELECT * 
    FROM ${schema}.complaince
    WHERE active_status=0 AND (
        (scheduletype = '0') OR             
        (scheduletype = '1' AND scheduledetails->'reminder_list' @> $1) OR
        (scheduletype = '2' AND scheduledetails->'reminder_list' @> $2) OR
        (scheduletype = '3' AND scheduledetails->'reminder_list' @> $3)
    );
    `;
  const params = [
    JSON.stringify([dayOfWeek]),
    JSON.stringify([customDAteSel]),
    JSON.stringify([customDAteSel]),
  ];
  // console.log("Query:", sqlquery);
  connect_db.query(sqlquery, params, async (err, result) => {
    if (err) {
      console.error("Error during recurring task check:", err);
    } else {
      // console.log("Recurring tasks due today:", result.rows);
      for (var j = 0; j < result.rows.length; j++) {
        // for (const task of result.rows) {
        async function loop(i) {
          var task = result.rows[i];
          const complaincedetails = task.complaincedetails;
          const scheduledetails = task.scheduledetails;
          if (task["organizationid"] != "1739861234068_66iA") {
            await notifyForComplainceonWA(
              complaincedetails,
              task.assignedto,
              task.othernumbers,
              complaincedetails.createdBy
            );
          }
        }
        loop(j);
      }
    }
  });
}
function checkComplaincesAtCreationTime(complainceid) {
  const today = new Date();
  const dayOfWeek = today.toLocaleString("default", { weekday: "long" }); // e.g., "Monday"
  const month = today.toLocaleString("default", { month: "long" }); // e.g., "October"
  const date = today.getDate(); // e.g., 7
  const formattedTime = today.toTimeString().split(" ")[0]; // Get current time in HH:MM:SS format
  // console.log("Today:", today, "Day of Week:", dayOfWeek, "Month:", month, "Date:", date, "Formatted Time:", formattedTime);
  // // Check if any recurring tasks are due today
  const customDAteSel = `${
    date.toString().length < 2 ? "0" + date.toString() : date.toString()
  }-${
    (today.getMonth() + 1).toString().length < 2
      ? "0" + (today.getMonth() + 1).toString()
      : (today.getMonth() + 1).toString()
  }`;
  // console.log("customDAteSel", customDAteSel);
  const sqlquery = `
SELECT * 
    FROM ${schema}.complaince
    WHERE active_status = 0
    AND row_id = $1
    AND (
        (scheduletype = '0') OR
        (scheduletype = '1' AND scheduledetails->'reminder_list' @> $2) OR
        (scheduletype = '2' AND scheduledetails->'reminder_list' @> $3) OR
        (scheduletype = '3' AND scheduledetails->'reminder_list' @> $4)
    );
    `;
  const params = [
    complainceid,
    JSON.stringify([dayOfWeek]),
    JSON.stringify([customDAteSel]),
    JSON.stringify([customDAteSel]),
  ];
  // console.log("Query:", sqlquery);
  connect_db.query(sqlquery, params, async (err, result) => {
    if (err) {
      console.error("Error during recurring task check:", err);
    } else {
      // console.log("Recurring tasks due today:", result.rows);
      for (var j = 0; j < result.rows.length; j++) {
        // for (const task of result.rows) {
        async function loop(i) {
          var task = result.rows[i];
          const complaincedetails = task.complaincedetails;
          const scheduledetails = task.scheduledetails;
          if (task["organizationid"] != "1739861234068_66iA") {
            await notifyForComplainceonWA(
              complaincedetails,
              task.assignedto,
              task.othernumbers,
              complaincedetails.createdBy
            );
          }
        }
        loop(j);
      }
    }
  });
}

async function notifyTaskDueToday(taskdetails, assignedto) {
  var assignedtoNumbers = await getAssignedToNumbers(assignedto);
  var assignedby = await getUserData(taskdetails.assignedby);
  var organizationName = await getOrganizationName(
    taskdetails["organizationid"]
  );
  var othNum;
  // var othNum = ["7878038514"];

  const organizationid = taskdetails.organizationid;

  var allNumbers = [];
  if (othNum != undefined && othNum.length > 0) {
    allNumbers = [...assignedtoNumbers, ...othNum];
  } else {
    allNumbers = assignedtoNumbers;
  }
  //////  console.log("allNumbers", allNumbers);
  for (var j = 0; j < allNumbers.length; j++) {
    async function loop(i) {
      var reNu = allNumbers[i].mobilenumber;
      var reNa = allNumbers[i].name;
      var templateData = {
        templateName: "task_due_today_k8",
        // "templateName": "task_due_today_with_mac",
        // "templateName": "task_due_today",
        languageCode: "en",
        variable: [
          taskdetails.title,
          taskdetails.description,
          assignedby["name"],
          reNa,
          organizationName,
        ],
      };
      //////  console.log("templateData------------", templateData);
      //////  console.log("reNu------------", reNu);
      var wa_se_ms = await connect_acube24.sendTemplate(reNu, templateData);

      var row_id = libFunc.randomid();

      var others_details = {
        taskdetails: taskdetails,
        assignedto: assignedto,
      };

      var query = `INSERT INTO prosys.whatsapp_log (row_id,mobilenumber, receiver_user, template_name, request_data, response_data, status,others_details,organizationid) 
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`;
      var resp = await db_query.customQuery(query, "data saved", [
        row_id,
        reNu,
        reNa,
        templateData.templateName,
        JSON.stringify(templateData),
        JSON.stringify(wa_se_ms),
        wa_se_ms?.status || "UNKNOWN",
        JSON.stringify(others_details),
        organizationid,
      ]);

      // var AdreNu = "7878038514";
      // var wa_se_ms = await connect_acube24.sendTemplate(AdreNu, templateData);

      // var id = libFunc.randomid();

      // var query = `INSERT INTO prosys.whatsapp_log (row_id,mobilenumber, receiver_user, template_name, request_data, response_data, status,others_details,organizationid)
      //      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`
      // var resp = await db_query.customQuery(query, "data saved", [id, AdreNu, reNa, templateData.templateName, JSON.stringify(templateData), JSON.stringify(wa_se_ms), wa_se_ms?.status || "UNKNOWN", JSON.stringify(others_details), organizationid]);
    }
    loop(j);
  }
}
// checkRecurringTasks();
async function checkOverdueTasks() {
  try {
    // SQL query to update tasks with negative due_days to "overdue"
    const updateQuery = `
            UPDATE ${schema}.tasks 
            SET active_status = 2
            WHERE (completion_date - CURRENT_DATE) < 0 AND active_status = 0
            RETURNING row_id; -- Return updated rows for confirmation
        `;

    const result = await connect_db.query(updateQuery);
    // console.log("rsult", result.rows)
    // await notifyOverdueTasks(result.rows);
    if (result.rowCount > 0) {
      const resp = {
        status: 0,
        msg: "Overdue tasks updated successfully",
        data: result.rows, // Return updated task details
      };
      // console.log("response", resp);
      // return libFunc.sendResponse(res, resp);
    } else {
      const resp = {
        status: 1,
        msg: "No overdue tasks found",
      };
      // console.log("response", resp);
    }
  } catch (err) {
    console.error("Error updating overdue tasks:", err);
    return libFunc.sendResponse(res, {
      status: 1,
      msg: "An error occurred while updating overdue tasks",
      error: err.message, // Optionally include the error message for debugging
    });
  }
}

function checkDueDateForToday() {
  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0]; // Format date as YYYY-MM-DD
  // console.log("Formatted Date:", formattedDate);
  const sqlquery = `
        SELECT *
        FROM ${schema}.tasks
        WHERE completion_date = CURRENT_DATE AND active_status = '0' ;
    `;
  // console.log("Query:", sqlquery);
  connect_db.query(sqlquery, async (err, result) => {
    if (err) {
      console.error("Error during due date check:", err);
    } else {
      // console.log("Tasks due today:", result.rows);
      // for (var j = 0; j < result.rows.length; j++) {
      //     // for (const task of result.rows) {
      //     async function loop(i) {
      //         // var task = result.rows[i];
      //         const taskDetails = result.rows[i];
      //         //////  console.log("Task Details:", taskDetails);
      //         var assignedTo = taskDetails.assigned_to;
      //         var whatsappTAskDetails = {
      //             title: taskDetails.title,
      //             description: taskDetails.description,
      //             assignedby: taskDetails.assigned_by,
      //             completion_date: taskDetails.completion_date,
      //             organizationid: taskDetails.organizationid
      //         }
      //         if (taskDetails["organizationid"] != '1739861234068_66iA') {
      //             await notifyTaskDueToday(whatsappTAskDetails, assignedTo);
      //         }
      //     }
      //     loop(j);
      // }

      await processDueTaskInBatches(result);
    }
  });
}

async function processDueTaskInBatches(result) {
  //  console.log("Total tasks due today to process:", result.rows.length);
  const batches = chunkArray(result.rows, 200);
  let totalProcessed = 0;
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    for (const res of batch) {
      totalProcessed++;
      //  console.log("Processing task ", totalProcessed, " of ", result.rows.length);
      const taskDetails = res;
      //////  console.log("Task Details:", taskDetails);
      var assignedTo = taskDetails.assigned_to;
      var whatsappTAskDetails = {
        title: taskDetails.title,
        description: taskDetails.description,
        assignedby: taskDetails.assigned_by,
        completion_date: taskDetails.completion_date,
        organizationid: taskDetails.organizationid,
      };
      if (taskDetails["organizationid"] != "1739861234068_66iA") {
        await notifyTaskDueToday(whatsappTAskDetails, assignedTo);
      }
    }
    if (batchIndex < batches.length - 1) {
      //  console.log("Waiting 1 minute before next batch...");
      await new Promise((resolve) => setTimeout(resolve, 60000));
    }
  }
}

// checkRecurringTasks();
runCron.runCron(checkRecurringTasks);
// runCron.runCron(checkComplaincesForToday);
runCron.runAt11(checkOverdueTasks);
runCron.runAt11(checkDueDateForToday);

// checkOverdueTasks();

// ------------------------

/**
 * fetch week-days
 */

function fetchalldays(req, res) {
  const organization_id = req.OrganizationId;

  // console.log("OrganizationsId:", organization_id);

  // Use parameterized queries to prevent SQL injection
  const query = `SELECT * FROM ${schema}.days_of_week`;

  // console.log("Query:", query);

  connect_db.query(query, (err, result) => {
    // console.log("result",result.rows)
    if (err) {
      console.error("Error fetching days_name:", err);
      const resp = {
        status: 1,
        msg: "days_name not fetched",
      };
      libFunc.sendResponse(res, resp);
    } else {
      const resp = {
        status: 0,
        msg: "All days_name fetched successfully",
        data: result.rows, // Return all user rows
      };
      // console.log("response ", resp);
      // console.log("response 2",resp.data);
      // console.log("response 3 ",result.rows)
      libFunc.sendResponse(res, resp);
    }
  });
}

/**
 * fetch months name
 */

function fetchallmonths(req, res) {
  const organization_id = req.OrganizationId;

  // console.log("OrganizationsId:", organization_id);

  // Use parameterized queries to prevent SQL injection
  const query = `SELECT * FROM ${schema}.months`;

  // console.log("Query:", query);

  connect_db.query(query, (err, result) => {
    // console.log("result",result.rows)
    if (err) {
      console.error("Error fetching month_name:", err);
      const resp = {
        status: 1,
        msg: "month_name not fetched",
      };
      libFunc.sendResponse(res, resp);
    } else {
      const resp = {
        status: 0,
        msg: "All month_name fetched successfully",
        data: result.rows, // Return all user rows
      };
      // console.log("response ", resp);
      // console.log("response 2",resp.data);
      // console.log("response 3 ",result.rows)
      libFunc.sendResponse(res, resp);
    }
  });
}

/**
 * fetch date
 */

function fetchalldate(req, res) {
  const organization_id = req.OrganizationId;

  // console.log("OrganizationsId:", organization_id);

  // Use parameterized queries to prevent SQL injection
  const query = `SELECT row_id,date_no FROM ${schema}.dates`;

  // console.log("Query:", query);

  connect_db.query(query, (err, result) => {
    // console.log("result",result.rows)
    if (err) {
      console.error("Error fetching dates:", err);
      const resp = {
        status: 1,
        msg: "dates not fetched",
      };
      libFunc.sendResponse(res, resp);
    } else {
      const resp = {
        status: 0,
        msg: "All dates fetched successfully",
        data: result.rows, // Return all user rows
      };
      // console.log("response ", resp);
      // console.log("response 2",resp.data);
      // console.log("response 3 ",result.rows)
      libFunc.sendResponse(res, resp);
    }
  });
}

/**
 * fetch schedule
 */

function fetchallrepeat_schedule(req, res) {
  const organization_id = req.OrganizationId;

  // console.log("OrganizationsId:", organization_id);

  // Use parameterized queries to prevent SQL injection
  const query = `SELECT * FROM ${schema}.repeat_schedule`;

  //////  console.log("Query:", query);

  connect_db.query(query, (err, result) => {
    //////  console.log("result", result.rows)
    if (err) {
      console.error("Error fetching schedule:", err);
      const resp = {
        status: 1,
        msg: "schedule not fetched",
      };
      libFunc.sendResponse(res, resp);
    } else {
      const resp = {
        status: 0,
        msg: "All schedule fetched successfully",
        data: result.rows, // Return all user rows
      };
      // console.log("response ", resp);
      // console.log("response 2",resp.data);
      // console.log("response 3 ",result.rows)
      libFunc.sendResponse(res, resp);
    }
  });
}

/**
 *  download and show file
 */
var fs = require("fs");
const { Console } = require("console");
const { off, title } = require("process");
const { get } = require("http");
const { create } = require("domain");
const { version } = require("os");
const { head } = require("request");

function downloadAndShowbyfilename(req, res) {
  const fpath = "./public/uploads/";
  const filename = req.data.filename; // Assuming filename is passed in req.data

  // Construct the full file path
  const filePath = path.join(fpath, filename);
  // console.log("File path:", filePath);

  // Check if the file exists
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const resp = {
        status: 1,
        msg: "File not found",
        error: err ? err.message : "File does not exist",
      };
      // console.log("Response:", resp);
      return libFunc.sendResponse(res, resp);
    }

    // Instead of downloading, send a success message with file info
    const resp = {
      status: 0,
      msg: "File is ready for download.",
      filePath: filePath, // Provide the path for future use or display
    };
    // console.log("Response:", resp);
    return libFunc.sendResponse(res, resp);
  });
}

// function getTotalCountofTaskCreatedByMe(req, res) {
//     //  console.log("req--", req)
//     var userid = req.data.userId;
//     //As per status - 0 for ongoing, 1 for completed , 2 for overdue, 3 for all
//     var status = req.data.status;

//     // var orgid = '1756191731327_jiOU'
//     var orgid = req.data.orgId;

//     //     var sqlquery = `
//     // SELECT
//     //     SUM(CASE WHEN active_status = 0 THEN 1 ELSE 0 END) AS ongoing_count,
//     //     SUM(CASE WHEN active_status = 1 THEN 1 ELSE 0 END) AS completed_count,
//     //     SUM(CASE WHEN active_status = 2 THEN 1 ELSE 0 END) AS overdue_count,
//     //     COUNT(*) AS total_count,
//     //     SUM(CASE WHEN task_type = '1' THEN 1 ELSE 0 END) AS recurring_count
//     // FROM prosys.tasks
//     // WHERE assigned_by = '${userid}';
//     // `;

//     var sqlquery = `
// SELECT
//     SUM(CASE WHEN active_status = 0 THEN 1 ELSE 0 END) AS ongoing_count,
//     SUM(CASE WHEN active_status = 1 THEN 1 ELSE 0 END) AS completed_count,
//     SUM(CASE WHEN active_status = 2 THEN 1 ELSE 0 END) AS overdue_count,
//     COUNT(*) AS total_count,
//     SUM(CASE WHEN task_type = '1' THEN 1 ELSE 0 END) AS recurring_count
// FROM prosys.tasks
// WHERE organizationid = '${orgid}' and activestatus = 0
// `;

//     //  console.log("sqlquery============");
//     //  console.log(sqlquery);

//     connect_db.query(sqlquery, (err, result) => {
//         if (err) {
//             // console.log(err);
//             return libFunc.sendResponse(res, { status: 1, msg: "Error fetching task count" });
//         }
//         //  console.log("data: result.rows[0]", result.rows[0])
//         return libFunc.sendResponse(res, { status: 0, msg: "Task count fetched successfully", data: result.rows[0] });
//     });
// }

// v2
// function getTotalCountofTaskCreatedByMe(req, res) {
//     const userid = req.data.userId;
//     const orgid = req.data.orgId;
//     const completion_startDate = req.data.completion_startDate;
//     const completion_endDate = req.data.completion_endDate;
//     const userDeptId = req.data.depId;
//     const role = req.data.user_role;
//     const filters = req.data.filters || {}; // HERE incoming/outgoing filter

//     console.log("filete--",filters,userDeptId)

//     let params = [orgid];
//     let whereClauses = ["ta.organizationid = $1"];

//     // Apply date range filters
//     if (completion_startDate) {
//         params.push(completion_startDate);
//         whereClauses.push(`ta.completion_date >= $${params.length}`);
//     }
//     if (completion_endDate) {
//         params.push(completion_endDate);
//         whereClauses.push(`ta.completion_date <= $${params.length}`);
//     }

//      if (role === 2 && userDeptId) {
//         params.push(userDeptId);

//         whereClauses.push(`
//             (
//                 created_by.deptid = $${params.length}
//                 OR EXISTS (
//                     SELECT 1
//                     FROM jsonb_array_elements_text(ta.assigned_to) assigned_to_id
//                     JOIN ${schema}.users u ON u.row_id = assigned_to_id::text
//                     WHERE u.deptid = $${params.length}
//                 )
//             )
//         `);
//     }

//      if (filters.outgoing === true && userDeptId) {
//         console.log("outgoing task --- true")
//         // Outgoing -> my dept → other dept
//         params.push(userDeptId);

//         whereClauses.push(`
//             created_by.deptid = $${params.length}
//             AND EXISTS (
//                 SELECT 1
//                 FROM jsonb_array_elements_text(ta.assigned_to) assigned_to_id
//                 JOIN ${schema}.users au ON au.row_id = assigned_to_id::text
//                 WHERE au.deptid != $${params.length}
//             )
//         `);
//     }

// //     if (filters.outgoing === false && userDeptId) {
// //     console.log("incoming tasks");

// //     params.push(userDeptId);
// //     const deptParam = params.length;

// //     whereClauses.push(`
// //         created_by.deptid <> $${deptParam}
// //         AND EXISTS (
// //             SELECT 1
// //             FROM jsonb_array_elements_text(ta.assigned_to) assigned_to_id
// //             JOIN ${schema}.users au ON au.row_id = assigned_to_id::text
// //             WHERE au.deptid = $${deptParam}
// //         )
// //     `);
// // }

// if (filters.outgoing === false && userDeptId) {
//     console.log("incoming + my department internal tasks");

//     params.push(userDeptId);
//     const deptParam = params.length;

//     whereClauses.push(`
//         (
//             (
//                 created_by.deptid <> $${deptParam}
//                 AND EXISTS (
//                     SELECT 1
//                     FROM jsonb_array_elements_text(ta.assigned_to) assigned_to_id
//                     JOIN ${schema}.users au ON au.row_id = assigned_to_id::text
//                     WHERE au.deptid = $${deptParam}
//                 )
//             )
//             OR
//             (
//                 created_by.deptid = $${deptParam}
//                 AND EXISTS (
//                     SELECT 1
//                     FROM jsonb_array_elements_text(ta.assigned_to) assigned_to_id
//                     JOIN ${schema}.users au ON au.row_id = assigned_to_id::text
//                     WHERE au.deptid = $${deptParam}
//                 )
//             )
//         )
//     `);
// }

//     const sqlquery = `
//         SELECT
//             SUM(CASE WHEN ta.active_status = 0 THEN 1 ELSE 0 END) AS ongoing_count,
//             SUM(CASE WHEN ta.active_status = 1 THEN 1 ELSE 0 END) AS completed_count,
//             SUM(CASE WHEN ta.active_status = 2 THEN 1 ELSE 0 END) AS overdue_count,
//             COUNT(*) AS total_count,
//             SUM(CASE WHEN ta.task_type = '1' THEN 1 ELSE 0 END) AS recurring_count
//         FROM ${schema}.tasks ta
//         INNER JOIN ${schema}.users created_by ON ta.assigned_by = created_by.row_id
//         WHERE ${whereClauses.join(" AND ")}
//           AND created_by.activestatus = 0
//           AND EXISTS (
//               SELECT 1
//               FROM jsonb_array_elements_text(ta.assigned_to) AS assigned_to_id
//               JOIN ${schema}.users u ON u.row_id = assigned_to_id::text
//               WHERE u.activestatus = 0
//           )
//     `;

//     connect_db.query(sqlquery, params, (err, result) => {
//         if (err) {
//             console.error("Error fetching task count:", err);
//             return libFunc.sendResponse(res, { status: 0, msg: "Error fetching task count" });
//         }

//         console.log("result.rows[0]",result.rows[0])
//         return libFunc.sendResponse(res, {
//             status: 1,
//             msg: "Task count fetched successfully",
//             data: result.rows[0]
//         });
//     });
// }

// function getTotalCountofTaskCreatedByMe(req, res) {
//     const userid = req.data.userId;
//     const orgid = req.data.orgId;
//     const completion_startDate = req.data.completion_startDate;
//     const completion_endDate = req.data.completion_endDate;
//     const userDeptId = req.data.depId;
//     const role = req.data.user_role;
//     const filters = req.data.filters || {}; // HERE incoming/outgoing filter

//     console.log("filete--",filters,userDeptId)

//     let params = [orgid];
//     let whereClauses = ["ta.organizationid = $1"];

//     // Apply date range filters
//     if (completion_startDate) {
//         params.push(completion_startDate);
//         whereClauses.push(`ta.completion_date >= $${params.length}`);
//     }
//     if (completion_endDate) {
//         params.push(completion_endDate);
//         whereClauses.push(`ta.completion_date <= $${params.length}`);
//     }

//      if (role === 2 && userDeptId) {
//         params.push(userDeptId);

//         whereClauses.push(`
//             (
//                 created_by.deptid = $${params.length}
//                 OR EXISTS (
//                     SELECT 1
//                     FROM jsonb_array_elements_text(ta.assigned_to) assigned_to_id
//                     JOIN ${schema}.users u ON u.row_id = assigned_to_id::text
//                     WHERE u.deptid = $${params.length}
//                 )
//             )
//         `);
//     }

//     if (filters.outgoing === true && userDeptId) {
//     console.log("outgoing filter: show outgoing + incoming + internal");

//     params.push(userDeptId);
//     const deptParam = params.length;

//     whereClauses.push(`
//         (
//             -- Outgoing A → B
//             (
//                 created_by.deptid = $${deptParam}
//                 AND EXISTS (
//                     SELECT 1
//                     FROM jsonb_array_elements_text(ta.assigned_to) assigned_to_id
//                     JOIN ${schema}.users au ON au.row_id = assigned_to_id::text
//                     WHERE au.deptid <> $${deptParam}
//                 )
//             )
//             OR
//             -- Incoming B → A
//             (
//                 created_by.deptid <> $${deptParam}
//                 AND EXISTS (
//                     SELECT 1
//                     FROM jsonb_array_elements_text(ta.assigned_to) assigned_to_id
//                     JOIN ${schema}.users au ON au.row_id = assigned_to_id::text
//                     WHERE au.deptid = $${deptParam}
//                 )
//             )
//             OR
//             -- Internal A → A
//             (
//                 created_by.deptid = $${deptParam}
//                 AND EXISTS (
//                     SELECT 1
//                     FROM jsonb_array_elements_text(ta.assigned_to) assigned_to_id
//                     JOIN ${schema}.users au ON au.row_id = assigned_to_id::text
//                     WHERE au.deptid = $${deptParam}
//                 )
//             )
//         )
//     `);
// }

// if (filters.outgoing === false && userDeptId) {
//     console.log("incoming + my department internal tasks");

//     params.push(userDeptId);
//     const deptParam = params.length;

//     whereClauses.push(`
//         (
//             (
//                 created_by.deptid <> $${deptParam}
//                 AND EXISTS (
//                     SELECT 1
//                     FROM jsonb_array_elements_text(ta.assigned_to) assigned_to_id
//                     JOIN ${schema}.users au ON au.row_id = assigned_to_id::text
//                     WHERE au.deptid = $${deptParam}
//                 )
//             )
//             OR
//             (
//                 created_by.deptid = $${deptParam}
//                 AND EXISTS (
//                     SELECT 1
//                     FROM jsonb_array_elements_text(ta.assigned_to) assigned_to_id
//                     JOIN ${schema}.users au ON au.row_id = assigned_to_id::text
//                     WHERE au.deptid = $${deptParam}
//                 )
//             )
//         )
//     `);
// }

//     const sqlquery = `
//         SELECT
//             SUM(CASE WHEN ta.active_status = 0 THEN 1 ELSE 0 END) AS ongoing_count,
//             SUM(CASE WHEN ta.active_status = 1 THEN 1 ELSE 0 END) AS completed_count,
//             SUM(CASE WHEN ta.active_status = 2 THEN 1 ELSE 0 END) AS overdue_count,
//             COUNT(*) AS total_count,
//             SUM(CASE WHEN ta.task_type = '1' THEN 1 ELSE 0 END) AS recurring_count
//         FROM ${schema}.tasks ta
//         INNER JOIN ${schema}.users created_by ON ta.assigned_by = created_by.row_id
//         WHERE ${whereClauses.join(" AND ")}
//           AND created_by.activestatus = 0
//           AND EXISTS (
//               SELECT 1
//               FROM jsonb_array_elements_text(ta.assigned_to) AS assigned_to_id
//               JOIN ${schema}.users u ON u.row_id = assigned_to_id::text
//               WHERE u.activestatus = 0
//           )
//     `;

//     connect_db.query(sqlquery, params, (err, result) => {
//         if (err) {
//             console.error("Error fetching task count:", err);
//             return libFunc.sendResponse(res, { status: 0, msg: "Error fetching task count" });
//         }

//         console.log("result.rows[0]",result.rows[0])
//         return libFunc.sendResponse(res, {
//             status: 1,
//             msg: "Task count fetched successfully",
//             data: result.rows[0]
//         });
//     });
// }

// function getTotalCountofTaskCreatedByMe(req, res) {
//     const userid = req.data.userId;
//     const orgid = req.data.orgId;
//     const completion_startDate = req.data.completion_startDate;
//     const completion_endDate = req.data.completion_endDate;
//     const userDeptId = req.data.depId;
//     const role = req.data.user_role;
//     const filters = req.data.filters || {}; // HERE incoming/outgoing filter

//     console.log("filete--",filters,userDeptId)

//     let params = [orgid];
//     let whereClauses = ["ta.organizationid = $1"];

//     // Apply date range filters
//     if (completion_startDate) {
//         params.push(completion_startDate);
//         whereClauses.push(`ta.completion_date >= $${params.length}`);
//     }
//     if (completion_endDate) {
//         params.push(completion_endDate);
//         whereClauses.push(`ta.completion_date <= $${params.length}`);
//     }

//      if (role === 2 && userDeptId) {
//         params.push(userDeptId);

//         whereClauses.push(`
//             (
//                 created_by.deptid = $${params.length}
//                 OR EXISTS (
//                     SELECT 1
//                     FROM jsonb_array_elements_text(ta.assigned_to) assigned_to_id
//                     JOIN ${schema}.users u ON u.row_id = assigned_to_id::text
//                     WHERE u.deptid = $${params.length}
//                 )
//             )
//         `);
//     }

//     if (filters.outgoing === true && userDeptId) {
//     console.log("outgoing filter: show outgoing + incoming + internal");

//     params.push(userDeptId);
//     const deptParam = params.length;

//     whereClauses.push(`
//         (
//             -- Outgoing A → B
//             (
//                 created_by.deptid = $${deptParam}
//                 AND EXISTS (
//                     SELECT 1
//                     FROM jsonb_array_elements_text(ta.assigned_to) assigned_to_id
//                     JOIN ${schema}.users au ON au.row_id = assigned_to_id::text
//                     WHERE au.deptid <> $${deptParam}
//                 )
//             )
//             OR
//             -- Incoming B → A
//             (
//                 created_by.deptid <> $${deptParam}
//                 AND EXISTS (
//                     SELECT 1
//                     FROM jsonb_array_elements_text(ta.assigned_to) assigned_to_id
//                     JOIN ${schema}.users au ON au.row_id = assigned_to_id::text
//                     WHERE au.deptid = $${deptParam}
//                 )
//             )
//             OR
//             -- Internal A → A
//             (
//                 created_by.deptid = $${deptParam}
//                 AND EXISTS (
//                     SELECT 1
//                     FROM jsonb_array_elements_text(ta.assigned_to) assigned_to_id
//                     JOIN ${schema}.users au ON au.row_id = assigned_to_id::text
//                     WHERE au.deptid = $${deptParam}
//                 )
//             )
//         )
//     `);
// }

// if (filters.outgoing === false && userDeptId) {
//     console.log("incoming + my department internal tasks");

//     params.push(userDeptId);
//     const deptParam = params.length;

//     whereClauses.push(`
//         (
//             (
//                 created_by.deptid <> $${deptParam}
//                 AND EXISTS (
//                     SELECT 1
//                     FROM jsonb_array_elements_text(ta.assigned_to) assigned_to_id
//                     JOIN ${schema}.users au ON au.row_id = assigned_to_id::text
//                     WHERE au.deptid = $${deptParam}
//                 )
//             )
//             OR
//             (
//                 created_by.deptid = $${deptParam}
//                 AND EXISTS (
//                     SELECT 1
//                     FROM jsonb_array_elements_text(ta.assigned_to) assigned_to_id
//                     JOIN ${schema}.users au ON au.row_id = assigned_to_id::text
//                     WHERE au.deptid = $${deptParam}
//                 )
//             )
//         )
//     `);
// }

//     const sqlquery = `
//         SELECT
//             SUM(CASE WHEN ta.active_status = 0 THEN 1 ELSE 0 END) AS ongoing_count,
//             SUM(CASE WHEN ta.active_status = 1 THEN 1 ELSE 0 END) AS completed_count,
//             SUM(CASE WHEN ta.active_status = 2 THEN 1 ELSE 0 END) AS overdue_count,
//             COUNT(*) AS total_count,
//             SUM(CASE WHEN ta.task_type = '1' THEN 1 ELSE 0 END) AS recurring_count
//         FROM ${schema}.tasks ta
//         INNER JOIN ${schema}.users created_by ON ta.assigned_by = created_by.row_id
//         WHERE ${whereClauses.join(" AND ")}
//           AND created_by.activestatus = 0
//           AND EXISTS (
//               SELECT 1
//               FROM jsonb_array_elements_text(ta.assigned_to) AS assigned_to_id
//               JOIN ${schema}.users u ON u.row_id = assigned_to_id::text
//               WHERE u.activestatus = 0
//           )
//     `;

//     connect_db.query(sqlquery, params, (err, result) => {
//         if (err) {
//             console.error("Error fetching task count:", err);
//             return libFunc.sendResponse(res, { status: 0, msg: "Error fetching task count" });
//         }

//         console.log("result.rows[0]",result.rows[0])
//         return libFunc.sendResponse(res, {
//             status: 1,
//             msg: "Task count fetched successfully",
//             data: result.rows[0]
//         });
//     });
// }

function getTotalCountofTaskCreatedByMe(req, res) {
  const orgid = req.data.orgId;
  const completion_startDate = req.data.completion_startDate;
  const completion_endDate = req.data.completion_endDate;
  const userDeptId = req.data.depId;
  const role = req.data.user_role;
  const filters = req.data.filters || {};

  let params = [orgid];
  let whereClauses = ["ta.organizationid = $1"];

  // ---------------------------------------------
  // DATE RANGE
  // ---------------------------------------------
  if (completion_startDate) {
    params.push(completion_startDate);
    whereClauses.push(`ta.completion_date >= $${params.length}`);
  }
  if (completion_endDate) {
    params.push(completion_endDate);
    whereClauses.push(`ta.completion_date <= $${params.length}`);
  }

  // ---------------------------------------------
  // DEPT PARAM (Push Once)
  // ---------------------------------------------
  let deptIdx = null;
  if (userDeptId) {
    params.push(userDeptId);
    deptIdx = params.length;
  }

  // ---------------------------------------------
  // ROLE = 2 (Department Admin)
  // ---------------------------------------------
  if (role === 2 && deptIdx) {
    whereClauses.push(`
            (
                created_by.deptid = $${deptIdx}
                OR EXISTS (
                    SELECT 1 
                    FROM jsonb_array_elements_text(ta.assigned_to) t(aid)
                    JOIN ${schema}.users u ON u.row_id = t.aid::text
                    WHERE u.deptid = $${deptIdx}
                )
            )
        `);
  }

  // ============================================================
  // ⭐ OUTGOING / INCOMING / INTERNAL LOGIC (ADMIN SAFE)
  // ============================================================

  if (deptIdx) {
    if (filters.outgoing === true) {
      whereClauses.push(`
                (
                    -- Admin assigning to anyone
                    created_by.deptid IS NULL

                    OR

                    -- Task assigned to Admin
                    EXISTS (
                        SELECT 1
                        FROM jsonb_array_elements_text(ta.assigned_to) t(aid)
                        JOIN ${schema}.users au ON au.row_id = t.aid::text
                        WHERE au.deptid IS NULL
                    )

                    OR

                    -- Outgoing A → B
                    (
                        created_by.deptid = $${deptIdx}
                        AND EXISTS (
                            SELECT 1
                            FROM jsonb_array_elements_text(ta.assigned_to) t(aid)
                            JOIN ${schema}.users au ON au.row_id = t.aid::text
                            WHERE au.deptid <> $${deptIdx} AND au.deptid IS NOT NULL
                        )
                    )

                    OR

                    -- Incoming B → A
                    (
                        created_by.deptid <> $${deptIdx} AND created_by.deptid IS NOT NULL
                        AND EXISTS (
                            SELECT 1
                            FROM jsonb_array_elements_text(ta.assigned_to) t(aid)
                            JOIN ${schema}.users au ON au.row_id = t.aid::text
                            WHERE au.deptid = $${deptIdx}
                        )
                    )

                    OR

                    -- Internal A → A
                    (
                        created_by.deptid = $${deptIdx}
                        AND EXISTS (
                            SELECT 1
                            FROM jsonb_array_elements_text(ta.assigned_to) t(aid)
                            JOIN ${schema}.users au ON au.row_id = t.aid::text
                            WHERE au.deptid = $${deptIdx}
                        )
                    )
                )
            `);
    }

    if (filters.outgoing === false && deptIdx) {
      whereClauses.push(`
            (
                -- Admin assigned tasks
                created_by.deptid IS NULL
    
                OR
    
                -- Incoming B → A
                (
                    created_by.deptid <> $${deptIdx} AND created_by.deptid IS NOT NULL
                    AND EXISTS (
                        SELECT 1
                        FROM jsonb_array_elements_text(ta.assigned_to) t(aid)
                        JOIN ${schema}.users au ON au.row_id = t.aid::text
                        WHERE au.deptid = $${deptIdx}
                    )
                )
    
                OR
    
                -- Internal A → A
                (
                    created_by.deptid = $${deptIdx}
                    AND EXISTS (
                        SELECT 1
                        FROM jsonb_array_elements_text(ta.assigned_to) t(aid)
                        JOIN ${schema}.users au ON au.row_id = t.aid::text
                        WHERE au.deptid = $${deptIdx}
                    )
                )
            )
        `);
    }
  }

  // -------------------------------------------------------------
  // FINAL COUNT QUERY
  // -------------------------------------------------------------
  const sqlquery = `
        SELECT 
            SUM(CASE WHEN ta.active_status = 0 THEN 1 ELSE 0 END) AS ongoing_count,
            SUM(CASE WHEN ta.active_status = 1 THEN 1 ELSE 0 END) AS completed_count,
            SUM(CASE WHEN ta.active_status = 2 THEN 1 ELSE 0 END) AS overdue_count,
            COUNT(*) AS total_count,
            SUM(CASE WHEN ta.task_type = '1' THEN 1 ELSE 0 END) AS recurring_count
        FROM ${schema}.tasks ta
        INNER JOIN ${schema}.users created_by ON ta.assigned_by = created_by.row_id
        WHERE ${whereClauses.join(" AND ")}
          AND created_by.activestatus = 0  
          AND EXISTS (
              SELECT 1
              FROM jsonb_array_elements_text(ta.assigned_to) t(aid)
              JOIN ${schema}.users u ON u.row_id = t.aid::text
              WHERE u.activestatus = 0
          )
    `;

  connect_db.query(sqlquery, params, (err, result) => {
    if (err) {
      console.error("Error fetching task count:", err);
      return libFunc.sendResponse(res, {
        status: 0,
        msg: "Error fetching task count",
      });
    }

    console.log("count", result.rows[0]);
    return libFunc.sendResponse(res, {
      status: 1,
      msg: "Task count fetched successfully",
      data: result.rows[0],
    });
  });
}

/**
 * ACUBE 24 Webhook REplies
 */
function getAssignedToUsers(mobileno) {
  return new Promise(function (resolve, reject) {
    var sqlquery = `SELECT row_id as userid, organizationid, name FROM prosys.users WHERE mobilenumber = $1;`;
    connect_db.query(sqlquery, [mobileno], (err, result) => {
      if (err) {
        // console.log(err);
        resolve(false);
      } else {
        // console.log(result.rows);
        if (result.rows.length > 0) {
          resolve(result.rows[0]);
        } else {
          resolve(false);
        }
      }
    });
  });
}
function getAssignedByData(name, organizationid) {
  return new Promise(function (resolve, reject) {
    var sqlquery = `SELECT row_id as userid, name FROM prosys.users WHERE name = $1 AND organizationid = $2;`;
    connect_db.query(sqlquery, [name, organizationid], (err, result) => {
      if (err) {
        // console.log(err);
        resolve(false);
      } else {
        // console.log(result.rows);
        if (result.rows.length > 0) {
          resolve(result.rows[0]);
        } else {
          resolve(false);
        }
      }
    });
  });
}

function updateTaskStatusThroughTemplate(
  userid,
  assignedbyid,
  duedate,
  tasktitle,
  taskdescription,
  organizationid
) {
  return new Promise(function (resolve, reject) {
    var sqlquery = `UPDATE prosys.tasks SET active_status = 1
    WHERE title = $1 AND description = $2 AND completion_date = $3
    AND assigned_to::text LIKE $4 AND organizationid = $5 AND assigned_by = $6;`;

    const params = [
      tasktitle,
      taskdescription,
      duedate,
      `%${userid}%`,
      organizationid,
      assignedbyid,
    ];

    connect_db.query(sqlquery, params, (err, result) => {
      if (err) {
        // console.log(err);
        resolve(false);
      } else {
        ////  console.log(result);
        resolve(result.rowCount > 0);
      }
    });
  });
}

async function markAsDone(tasktemplateData, mobileno, res) {
  var tasktitle = tasktemplateData[0]["parameters"][0]["text"];
  const dateStr = tasktemplateData[0]["parameters"][1]["text"];
  var taskdescription = tasktemplateData[0]["parameters"][2]["text"];
  var assignedby = tasktemplateData[0]["parameters"][3]["text"];
  var assignedtoUser = await getAssignedToUsers(mobileno);
  var organizationid = assignedtoUser["organizationid"];
  var userid = assignedtoUser["userid"];
  var username = assignedtoUser["name"];
  const dateObj = new Date(dateStr);

  const formattedDate =
    dateObj.getFullYear() +
    "-" +
    String(dateObj.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(dateObj.getDate()).padStart(2, "0");

  var assignedbyid;
  if (username == assignedby) {
    assignedbyid = userid;
  } else {
    var assignedTOid = await getAssignedByData(assignedby, organizationid);
    assignedbyid = assignedTOid["userid"];
  }

  var taskdetails = await updateTaskStatusThroughTemplate(
    userid,
    assignedbyid,
    formattedDate,
    tasktitle,
    taskdescription,
    organizationid
  );
  // console.log("Taskdetails=======pm2 start

  res.status(200).json({
    message: "Done",
    status: taskdetails,
  });
}
var tempData = [
  {
    type: "body",
    parameters: [
      {
        type: "text",
        text: "Testing on sending whatsapp",
      },
      {
        type: "text",
        text: "Tue Jul 29 2025",
      },
      {
        type: "text",
        text: "recurring task send on whatsapp",
      },
      {
        type: "text",
        text: "Aafreen Ali",
      },
    ],
  },
];

// markAsDone(tempData,'7742529160');

/**
 * Task Updation By Admin
 */

function getUserRole(userid) {
  return new Promise((resolve, reject) => {
    var sqlquery = `SELECT role FROM prosys.users WHERE row_id='${userid}';`;
    connect_db.query(sqlquery, (err, result) => {
      if (err) {
        // console.log(err);
        resolve(false);
      } else {
        // console.log(result.rows);
        if (result.rows.length > 0) {
          resolve(result.rows[0].role);
        } else {
          resolve(false);
        }
      }
    });
  });
}

async function updateTask(req, res) {
  // console.log(req.data);
  var userid = req.data.userId;
  var organizationid = req.data.orgId;
  var userRole = await getUserRole(userid);
  if (userRole != 0) {
    //User is admin/dept admin
    var taskRowid = req.data.row_id;
    var title =
      req.data.title != undefined
        ? req.data.title.trim().replaceAll("'", "`")
        : undefined;
    var description =
      req.data.description != undefined
        ? req.data.description.trim().replaceAll("'", "`")
        : undefined;
    var completion_date = req.data.completion_date;
    var checklistid = req.data.checklist;
    var assigned_to = req.data.assigned_to;
    var assigned_by =
      req.data.assignedby != null ? req.data.assignedby : userid;
    if (
      !title ||
      !description ||
      !completion_date ||
      !userid ||
      !assigned_to ||
      !assigned_by
    ) {
      var resp = {
        status: 1,
        msg: "Missing Required fields",
      };
      libFunc.sendResponse(res, resp);
    } else {
      var taskColumns = {
        title: title,
        description: description,
        completion_date: completion_date,
        checklist: JSON.stringify(checklistid),
        assigned_to: JSON.stringify(assigned_to),
        assigned_by: assigned_by,
      };

      if (req.data.commentdetails != undefined) {
        var commentdetails = req.data.commentdetails;
        var commentColumns = {
          comment: commentdetails.comment,
          userid: userid,
          attachments: commentdetails.file_path,
          organizationid: organizationid,
        };
      }
      if (!req.data.is_recurring) {
        var tablename = schema + ".tasks";
        var resp = await db_query.addData(
          tablename,
          taskColumns,
          taskRowid,
          "Task"
        );
        if (req.data.commentdetails != undefined) {
          commentColumns.taskid = taskRowid;
          var commentRowid;
          if (req.data.commentdetails.row_id != undefined) {
            commentRowid = req.data.commentdetails.row_id;
          }
          commentColumns.attachments = JSON.stringify(
            commentColumns.attachments
          );
          var tablename1 = schema + ".comments";
          var resp11 = await db_query.addData(
            tablename1,
            commentColumns,
            commentRowid,
            "Comment"
          );
        }
        var resptobesend = {
          status: 0,
          msg: "Task updated successfully",
        };
        var whatsappTAskDetails = {
          title: title,
          description: description,
          completion_date: completion_date,
          organizationid: organizationid,
          assignedby: userid,
        };
        if (organizationid != "1739861234068_66iA") {
          await notifyOnWA(whatsappTAskDetails, req.data.assigned_to);
        }
        // console.log("response of task updation ", resptobesend);
        libFunc.sendResponse(res, resptobesend);
      } else {
        if (req.data.repeat_schedule == undefined) {
          const resp = { status: 1, msg: "Missing required fields" };
          // console.log("response of validation ", resp);
          libFunc.sendResponse(res, resp);
        } else {
          // var repeat_schedule = req.data.repeat_schedule;
          // var repeat_time = req.data.repeat_time;
          // var reminder_on = req.data.reminder_on;
          // var months = req.data.months;
          // var customdates = req.data.customdates;
          // var date = req.data.date;
          // var remind_me_before = req.data.remind_me_before;
          // var complete_till = req.data.complete_till;
          // var schedule_type = repeat_schedule == 'Daily' ? 0 : repeat_schedule == 'Weekly' ? 1 : repeat_schedule == 'Monthly' ? 2 : repeat_schedule == 'Yearly' ? 3 : undefined;
          // var schedule_details = {
          //     "type": repeat_schedule,

          //     "reminder_on": reminder_on,//previously it was days
          //     "complete_till": complete_till,
          //     "remind_me_before": remind_me_before ?? "1"

          // }
          // taskColumns.assigned_to = (req.data.assigned_to);
          // taskColumns.checklist = checklistid;
          // var recurringColumns = {

          //     "organizationid": organizationid,
          //     taskdetails: JSON.stringify(taskColumns),
          //     schedule_details: JSON.stringify(schedule_details),
          //     schedule_type: schedule_type,
          //     commentdetails: JSON.stringify(commentColumns),
          // }
          // var tablename = schema + '.recurring_task';
          // var resp = await db_query.addData(tablename, recurringColumns, req.data.row_id, "Recurring Task");
          // await createRecurringAtCreationTime(resp.data.row_id);
          // libFunc.sendResponse(res, resp);

          var repeat_schedule = req.data.repeat_schedule;
          var repeat_time = req.data.repeat_time;
          var reminder_list = req.data.reminder_list;
          var months = req.data.months;
          var customdates = req.data.customdates;
          var date = req.data.date;
          var remind_me_before = req.data.remind_me_before;
          var complete_till = req.data.complete_till;

          //  Convert reminder_on to object-array format
          let reminderObjects = [];

          if (repeat_schedule === "Daily") {
            reminderObjects = (reminder_list || [{}]).map(() => ({
              reminder_on: [],
            }));
          } else if (repeat_schedule === "Weekly") {
            reminderObjects = (reminder_list || []).map((reminder) => ({
              reminder_on: reminder.reminder_on || [],
              complete_till: reminder.complete_till || null,
              remind_me_before: reminder.remind_me_before || [],
            }));
          } else if (
            repeat_schedule === "Monthly" ||
            repeat_schedule === "Yearly"
          ) {
            reminderObjects = (reminder_list || []).map((reminder) => ({
              reminder_on: reminder.reminder_on || [],
              complete_till: reminder.complete_till || null,
              remind_me_before: reminder.remind_me_before || [],
            }));
          }

          var schedule_type =
            repeat_schedule == "Daily"
              ? 0
              : repeat_schedule == "Weekly"
              ? 1
              : repeat_schedule == "Monthly"
              ? 2
              : repeat_schedule == "Yearly"
              ? 3
              : undefined;

          var schedule_details = {
            type: repeat_schedule,
            reminder_list: reminderObjects,
          };

          taskColumns.assigned_to = req.data.assigned_to;
          taskColumns.checklist = checklistid;

          var recurringColumns = {
            organizationid: organizationid,
            taskdetails: JSON.stringify(taskColumns),
            schedule_details: JSON.stringify(schedule_details),
            schedule_type: schedule_type,
            commentdetails: JSON.stringify(commentColumns),
          };

          var tablename = schema + ".recurring_task";
          var resp = await db_query.addData(
            tablename,
            recurringColumns,
            req.data.row_id,
            "Recurring Task"
          );

          //  Re-create occurrences after update
          await createRecurringAtCreationTime(resp.data.row_id);

          libFunc.sendResponse(res, resp);
        }
      }
    }
  } else {
    //User is normal user
    var resp = {
      status: 1,
      msg: "Don't have permission to update this task",
    };

    libFunc.sendResponse(res, resp);
  }
}

async function updateRecurringTaskTemplate(req, res) {
  // console.log("reqesting---", req.data)

  var userid = req.data.userId;
  var organizationid = req.data.orgId;
  var userRole = await getUserRole(userid);
  if (userRole != 0) {
    //User is admin/dept admin
    var taskRowid = req.data.row_id;
    var title =
      req.data.title != undefined
        ? req.data.title.trim().replaceAll("'", "`")
        : undefined;
    var description =
      req.data.description != undefined
        ? req.data.description.trim().replaceAll("'", "`")
        : undefined;
    var completion_date = req.data.completion_date;
    var checklistid = req.data.checklist;
    var assigned_to = req.data.assigned_to;
    var orgId = req.data.orgId;
    var assigned_by =
      req.data.assignedby != null ? req.data.assignedby : userid;
    if (
      !title ||
      !description ||
      !userid ||
      !assigned_to ||
      !assigned_by ||
      !req.data.repeat_schedule
    ) {
      var resp = {
        status: 1,
        msg: "Missing Required fields",
      };
      libFunc.sendResponse(res, resp);
    } else {
      var taskColumns = {
        title: title,
        description: description,
        completion_date: completion_date,
        checklist: JSON.stringify(checklistid),
        assigned_to: JSON.stringify(assigned_to),
        assigned_by: assigned_by,
        organizationid: orgId,
      };

      if (req.data.commentdetails != undefined) {
        var commentdetails = req.data.commentdetails;
        var commentColumns = {
          comment: commentdetails.comment,
          userid: userid,
          attachments: commentdetails.file_path,
          organizationid: organizationid,
        };
      }

      // var repeat_schedule = req.data.repeat_schedule;
      // var reminder_on = req.data.reminder_on;
      // var remind_me_before = req.data.remind_me_before;
      // var complete_till = req.data.complete_till;
      // var schedule_type = repeat_schedule == 'Daily' ? 0 : repeat_schedule == 'Weekly' ? 1 : repeat_schedule == 'Monthly' ? 2 : repeat_schedule == 'Yearly' ? 3 : undefined;
      // var schedule_details = {
      //     "type": repeat_schedule,

      //     "reminder_on": reminder_on,//previously it was days
      //     "complete_till": complete_till,
      //     "remind_me_before": remind_me_before ?? "1"

      // }
      // taskColumns.assigned_to = (req.data.assigned_to);
      // taskColumns.checklist = checklistid;
      // var recurringColumns = {

      //     taskdetails: JSON.stringify(taskColumns),
      //     schedule_details: JSON.stringify(schedule_details),
      //     schedule_type: schedule_type,
      //     commentdetails: JSON.stringify(commentColumns),
      // }
      // var tablename = schema + '.recurring_task';
      // var resp = await db_query.addData(tablename, recurringColumns, taskRowid, "Recurring Task");
      // console.log("resp---",resp)
      // await createRecurringAtCreationTime(resp.data.row_id);
      // libFunc.sendResponse(res, resp);

      var repeat_schedule = req.data.repeat_schedule;
      var reminder_list = req.data.reminder_list;
      var remind_me_before = req.data.remind_me_before;
      var complete_till = req.data.complete_till;

      //  Convert reminder_on to object-array format
      let reminderObjects = [];
      if (repeat_schedule === "Daily") {
        reminderObjects = (reminder_list || [{}]).map(() => ({
          reminder_on: [],
          complete_till: null,
          remind_me_before: ["0"],
        }));
      } else if (repeat_schedule === "Weekly") {
        reminderObjects = (reminder_list || []).map((reminder) => ({
          reminder_on: reminder.reminder_on || [],
          complete_till: reminder.complete_till || null,
          remind_me_before: reminder.remind_me_before || [],
        }));
      } else if (
        repeat_schedule === "Monthly" ||
        repeat_schedule === "Yearly"
      ) {
        reminderObjects = (reminder_list || []).map((reminder) => ({
          reminder_on: reminder.reminder_on || [],
          complete_till: reminder.complete_till || null,
          remind_me_before: reminder.remind_me_before || [],
        }));
      }

      var schedule_type =
        repeat_schedule == "Daily"
          ? 0
          : repeat_schedule == "Weekly"
          ? 1
          : repeat_schedule == "Monthly"
          ? 2
          : repeat_schedule == "Yearly"
          ? 3
          : undefined;

      var schedule_details = {
        type: repeat_schedule,
        reminder_list: reminderObjects,
      };

      taskColumns.assigned_to = req.data.assigned_to;
      taskColumns.checklist = checklistid;

      var recurringColumns = {
        taskdetails: JSON.stringify(taskColumns),
        schedule_details: JSON.stringify(schedule_details),
        schedule_type: schedule_type,
        commentdetails: JSON.stringify(commentColumns),
      };

      var tablename = schema + ".recurring_task";
      var resp = await db_query.addData(
        tablename,
        recurringColumns,
        taskRowid,
        "Recurring Task"
      );
      // console.log("taskRowid",resp.data.row_id)

      await createRecurringAtCreationTime(resp.data.row_id);
      libFunc.sendResponse(res, resp);
    }
  } else {
    //User is normal user
    var resp = {
      status: 1,
      msg: "Don't have permission to update this task",
    };

    libFunc.sendResponse(res, resp);
  }
}

/**
 * Bulk Task Import
 */
async function bulkTaskImport(req, res) {
  // console.log("requesting bulk task---",req.data.importedTasks)
  var userid = req.data.userId;
  var organizationid = req.data.orgId;
  var importedTasks = req.data.importedTasks;
  // console.log("importedTasks=============");
  // console.log(JSON.stringify(importedTasks));
  if (importedTasks.length === 0) {
    libFunc.sendResponse(res, { status: 1, msg: "No tasks to import" });
    return;
  } else {
    const { validTasks, invalidTasks } = await validateUsers(
      importedTasks,
      organizationid
    );

    //  Insert valid tasks if any
    if (validTasks.length > 0) {
      await bulkImportPreperation(validTasks, organizationid);
    }

    const rowId = libFunc.randomid();
    const historyQuery = `
            INSERT INTO prosys.imported_task_history 
            (row_id, organizationid,validTasks,invalidTasks, validcount, invalidcount) 
            VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6)
        `;
    await db_query.customQuery(historyQuery, "insert import history", [
      rowId,
      organizationid,
      JSON.stringify(validTasks),
      JSON.stringify(invalidTasks),
      validTasks.length,
      invalidTasks.length,
    ]);

    //  If some invalid tasks
    if (invalidTasks.length > 0) {
      // Collect unique reasons
      const reasons = [...new Set(invalidTasks.map((t) => t.reason))];

      // Build dynamic message
      let msg = "";
      if (reasons.length === 1) {
        msg = reasons[0]; // e.g. "Invalid phone number format"
      } else {
        msg = "Some tasks could not be imported (" + reasons.join(", ") + ")";
      }

      let data_msg = {
        status: 1,
        msg,
        invalidTasks,
        validTasks,
        validTasksCount: validTasks.length,
        invalidTasksCount: invalidTasks.length,
      };
      // console.log("data msg-", data_msg )
      return libFunc.sendResponse(res, data_msg);
    }

    //  All good
    let msg_show = {
      status: 0,
      msg: "Bulk import successful",
      validTasks,
      validTasksCount: validTasks.length,
    };
    // console.log("data ",msg_show)
    return libFunc.sendResponse(res, msg_show);
  }

  // for (var i = 0; i < importedTasks.length; i++) {
  //     var task = importedTasks[i];
  //     var taskColumns = {
  //         "organizationid": organizationid,
  //         "title": task.title,
  //         "description": task.description,
  //         "assigned_to": JSON.stringify(task.assigned_to),
  //         "assigned_by": userid,

  //         "checklist": JSON.stringify(task.checklist),
  //         "completion_date": task.completion_date,
  //     }
  //     var isRecurring = task.is_recurring;

  //     var assignedTo = [];
  //     for (var i of task.assigned_to) {
  //         var assignedToid = await getAssignedToUsers(i);
  //         assignedTo.push(assignedToid.mobilenumber);
  //     }
  //     var assinedByid = await getAssignedToUsers(task.assigned_by);
  //     var sqlQuery = "";
  //     if (!isRecurring) {
  //         sqlQuery += `INSERT INTO ${schema}.tasks (organizationid, title, description, assigned_to, assigned_by, checklist, completion_date)
  //         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING row_id;`;
  //         const params = [
  //             taskColumns.organizationid,
  //             taskColumns.title,
  //             taskColumns.description,
  //             JSON.stringify(assignedTo),
  //             taskColumns.assigned_by,
  //             taskColumns.checklist,
  //             taskColumns.completion_date
  //         ];
  //     } else {
  //         var repeat_schedule = task.repeat_schedule;
  //         var reminder_on = task.reminder_on;
  //         var remind_me_before = task.remind_me_before;
  //         var complete_till = task.complete_till;
  //         var schedule_type = repeat_schedule == 'Daily' ? 0 : repeat_schedule == 'Weekly' ? 1 : repeat_schedule == 'Monthly' ? 2 : repeat_schedule == 'Yearly' ? 3 : undefined;
  //         var schedule_details = {
  //             "type": repeat_schedule,
  //             "reminder_on": reminder_on,//previously it was days
  //             "complete_till": complete_till,
  //             "remind_me_before": remind_me_before ?? "1"

  //         };
  //         var recurringColumns = {
  //             taskdetails: JSON.stringify(taskColumns),
  //             schedule_details: JSON.stringify(schedule_details),
  //             schedule_type: schedule_type,
  //             organizationid: organizationid
  //         };
  //         sqlQuery += `INSERT INTO ${schema}.recurring_task (taskdetails, schedule_details, schedule_type, organizationid)
  //         VALUES ($1, $2, $3, $4) RETURNING row_id;`;
  //         const params = [
  //             recurringColumns.taskdetails,
  //             recurringColumns.schedule_details,
  //             recurringColumns.schedule_type,
  //             recurringColumns.organizationid
  //         ];
  //     }

  // }
}

async function validateUsers(importedTasks, organizationid) {
  const allNumbers = new Set();

  for (const task of importedTasks) {
    if (task.assignedby) allNumbers.add(task.assignedby.trim());
    if (Array.isArray(task.assigned_to)) {
      task.assigned_to.forEach((num) => {
        if (num) allNumbers.add(num.trim());
      });
    }
  }

  // Query DB
  let existingNumbers = [];
  if (allNumbers.size > 0) {
    const numberList = [...allNumbers].map((n) => `'${n}'`).join(",");
    const query = `SELECT mobilenumber FROM ${schema}.users WHERE mobilenumber IN (${numberList}) AND organizationid = '${organizationid}'`;
    const result = await connect_db.query(query);
    existingNumbers = result.rows.map((r) => r.mobilenumber);
  }

  const validTasks = [];
  const invalidTasks = [];

  // Helper validation
  const isValidNumber = (num) => {
    if (!num) return false;
    const trimmed = num.trim();
    return /^\d{10}$/.test(trimmed);
  };

  for (const task of importedTasks) {
    const invalidNumber = [];
    const missing = [];

    let assignedByValid = true;
    let assignedByReason = "";

    // Validate assigned_by
    if (task.assignedby) {
      const ab = task.assignedby.trim();
      if (!isValidNumber(ab)) {
        invalidNumber.push(task.assignedby);
        assignedByValid = false;
        assignedByReason = "Invalid phone number format";
      } else if (!existingNumbers.includes(ab)) {
        missing.push(task.assignedby);
        assignedByValid = false;
        assignedByReason = "User not found in database";
      }
    }

    // Validate assigned_to
    const validAssignedTo = [];
    const invalidAssignedTo = [];
    let assignedToReason = "";

    if (Array.isArray(task.assigned_to)) {
      for (const num of task.assigned_to) {
        const tnum = num ? num.trim() : "";
        if (!isValidNumber(tnum)) {
          invalidNumber.push(num);
          invalidAssignedTo.push(num);
          assignedToReason = "Invalid phone number format";
        } else if (!existingNumbers.includes(tnum)) {
          missing.push(num);
          invalidAssignedTo.push(num);
          assignedToReason = "User not found in database";
        } else {
          validAssignedTo.push(tnum);
        }
      }
    }

    //  Assigned_by invalid → reject
    if (!assignedByValid) {
      invalidTasks.push({
        title: task.title,
        description: task.description,
        assignedby: task.assignedby,
        assigned_to: task.assigned_to,
        reason: assignedByReason,
        invalidNumber,
        notExistNumbers: missing,
      });
      continue;
    }

    //  No valid assigned_to left → reject
    if (validAssignedTo.length === 0) {
      invalidTasks.push({
        title: task.title,
        description: task.description,
        assignedby: task.assignedby,
        assigned_to: task.assigned_to,
        reason: assignedToReason || "No valid assigned_to users",
        //  invalidAssignedTo,
        invalidNumber,
        notExistNumbers: missing,
      });
      continue;
    }

    //  Otherwise, task is valid
    validTasks.push({
      ...task,
      assigned_to: validAssignedTo,
    });
  }

  return { validTasks, invalidTasks };
}

async function bulkImportPreperation(importedTasks, organizationid) {
  var sqlquery = "";
  const nonRecurring = [];
  const recurring = [];
  const createdAtCreationTime = [];
  for (const task of importedTasks) {
    // normalize assigned_to numbers
    const assignedTo = [];
    for (const at of task.assigned_to) {
      const assignedToUser = await getAssignedToUsers(at);
      assignedTo.push(assignedToUser.userid);
    }
    // console.log(task);
    const assignedByUser = await getAssignedToUsers(task.assignedby);
    // console.log(assignedByUser);

    var row_id = libFunc.randomid();
    if (!task.is_recurring) {
      nonRecurring.push([
        row_id,
        organizationid,
        task.title,
        task.description,
        JSON.stringify(assignedTo),
        assignedByUser.userid,
        JSON.stringify(task.checklist || []),
        task.completion_date,
      ]);
    } else {
      // const schedule_type =
      //     task.repeat_schedule === "Daily" ? 0 :
      //         task.repeat_schedule === "Weekly" ? 1 :
      //             task.repeat_schedule === "Monthly" ? 2 :
      //                 task.repeat_schedule === "Yearly" ? 3 : null;

      // const schedule_details = {
      //     type: task.repeat_schedule,
      //     reminder_on: task.reminder_on,
      //     complete_till: task.complete_till,
      //     remind_me_before: task.remind_me_before ?? ["1"]
      // };
      // createdAtCreationTime.push(row_id);
      // recurring.push([
      //     row_id,
      //     JSON.stringify({
      //         organizationid,
      //         title: task.title,
      //         description: task.description,
      //         assigned_to: assignedTo,
      //         assigned_by: assignedByUser.userid,
      //         checklist: task.checklist || [],
      //         completion_date: task.completion_date
      //     }),
      //     JSON.stringify(schedule_details),
      //     schedule_type,
      //     organizationid
      // ]);

      //  NEW: Convert to structured reminder_on format
      let reminderObjects = [];

      if (task.repeat_schedule === "Daily") {
        // Daily doesn't need reminders — just push empty objects
        reminderObjects = (task.reminderList || [{}]).map(() => ({
          reminder_on: [],
          complete_till: null,
          remind_me_before: ["0"],
        }));
      } else if (task.repeat_schedule === "Weekly") {
        reminderObjects = (task.reminderList || []).map((reminder) => ({
          reminder_on: reminder.reminder_on || [],
          complete_till: reminder.complete_till || null,
          remind_me_before: reminder.remind_me_before || [],
        }));
      } else if (
        task.repeat_schedule === "Monthly" ||
        task.repeat_schedule === "Yearly"
      ) {
        reminderObjects = (task.reminderList || []).map((reminder) => ({
          reminder_on: reminder.reminder_on || [],
          complete_till: reminder.complete_till || null,
          remind_me_before: reminder.remind_me_before || [],
        }));
      }

      const schedule_type =
        task.repeat_schedule === "Daily"
          ? 0
          : task.repeat_schedule === "Weekly"
          ? 1
          : task.repeat_schedule === "Monthly"
          ? 2
          : task.repeat_schedule === "Yearly"
          ? 3
          : null;

      const schedule_details = {
        type: task.repeat_schedule,
        reminder_list: reminderObjects,
      };

      createdAtCreationTime.push(row_id);
      recurring.push([
        row_id,
        JSON.stringify({
          organizationid,
          title: task.title,
          description: task.description,
          assigned_to: assignedTo,
          assigned_by: assignedByUser.userid,
          checklist: task.checklist || [],
          completion_date: task.completion_date,
        }),
        JSON.stringify(schedule_details),
        schedule_type,
        organizationid,
      ]);
    }
  }

  if (nonRecurring.length > 0) {
    await bulkInsert(
      "tasks",
      [
        "row_id",
        "organizationid",
        "title",
        "description",
        "assigned_to",
        "assigned_by",
        "checklist",
        "completion_date",
      ],
      nonRecurring
    );
  }

  if (recurring.length > 0) {
    var rsp = await bulkInsert(
      "recurring_task",
      [
        "row_id",
        "taskdetails",
        "schedule_details",
        "schedule_type",
        "organizationid",
      ],
      recurring
    );
    if (rsp != false) {
      await createRecurringAtCreationTimeBulk(createdAtCreationTime);
    }
  }
}
async function bulkInsert(table, columns, rows) {
  return new Promise((resolve, reject) => {
    if (rows.length === 0) return;

    const values = [];
    const placeholders = rows.map((row, i) => {
      const offset = i * row.length;
      values.push(...row);
      return `(${row.map((_, j) => `$${offset + j + 1}`).join(",")})`;
    });

    const query = `
    INSERT INTO ${schema}.${table} (${columns.join(",")})
    VALUES ${placeholders.join(",")}
    RETURNING row_id;
  `;

    // const result = await pool.query(query, values);
    // console.log(`Inserted into ${table}:`, result.rows.map(r => r.row_id));
    connect_db.query(query, values, async (err, result) => {
      if (err) {
        //  console.log(err);
        resolve(false);
      } else {
        // console.log(result.rows);
        //  console.log(`Inserted into ${table}:`, result.rows.map(r => r.row_id));
        resolve(result.rows);
      }
    });
  });
}

async function bulkUserImport(req, res) {
  // console.log("cons--->", req.data.importedUsers);
  try {
    const userid = req.data.userId;
    const organizationid = req.data.orgId;
    const importedUsers = req.data.importedUsers || [];

    if (importedUsers.length === 0) {
      return libFunc.sendResponse(res, {
        status: 2,
        msg: "No users to import",
      });
    }

    let skipped = {
      duplicateInFile: [],
      invalidNumbers: [],
      existingInDB: [],
    };

    //  Step 0: Fetch all department names for the incoming users
    const deptIds = [
      ...new Set(importedUsers.map((u) => `'${u.department_id}'`)),
    ];
    let departmentMap = {};

    if (deptIds.length > 0) {
      const deptQuery = `
                SELECT row_id AS department_id, department_name 
                FROM ${schema}.departments
                WHERE row_id IN (${deptIds.join(",")})
            `;
      const deptResult = await connect_db.query(deptQuery);
      for (const row of deptResult.rows) {
        departmentMap[row.department_id] = row.department_name;
      }
    }

    //  Step 1: Remove duplicate mobile numbers within the import file
    const seen = new Set();
    const uniqueUsers = [];
    for (const u of importedUsers) {
      const deptName = departmentMap[u.department_id] || null;
      if (seen.has(u.mobilenumber)) {
        skipped.duplicateInFile.push({
          name: u.user_name,
          mobilenumber: u.mobilenumber,
          department_name: deptName,
          department_id: u.department_id,
        });
      } else {
        seen.add(u.mobilenumber);
        uniqueUsers.push(u);
      }
    }

    //  Step 2: Validate phone numbers (must be exactly 10 digits)
    const validUsers = [];
    for (const u of uniqueUsers) {
      const deptName = departmentMap[u.department_id] || null;
      if (!/^\d{10}$/.test(u.mobilenumber)) {
        skipped.invalidNumbers.push({
          name: u.user_name,
          mobilenumber: u.mobilenumber,
          department_name: deptName,
          department_id: u.department_id,
        });
      } else {
        validUsers.push(u);
      }
    }

    //  Step 3: Check for existing users in DB (by mobile number)
    const existingUsers = await checkExistingUsers(validUsers);
    const existingNumbers = existingUsers.map((u) => u.mobilenumber);

    const finalUsers = validUsers.filter(
      (u) => !existingNumbers.includes(u.mobilenumber)
    );

    //  Step 4: Mark already existing users
    skipped.existingInDB = existingUsers.map((u) => ({
      name: u.name,
      mobilenumber: u.mobilenumber,
      department_name:
        u.department_name || departmentMap[u.department_id] || null,
      department_id: u.department_id || null,
    }));

    //  Step 5: Import only valid + unique + not existing users
    if (finalUsers.length > 0) {
      await bulkImportUsersPreparation(finalUsers, organizationid);
    }

    //  Step 6: Summary Counts
    const counts = {
      imported: finalUsers.length,
      duplicate: skipped.duplicateInFile.length,
      invalid: skipped.invalidNumbers.length,
      exist: skipped.existingInDB.length,
    };

    //  Step 7: Generate Dynamic Message
    let msgParts = [];
    if (counts.imported > 0) msgParts.push(`${counts.imported} users imported`);
    if (counts.duplicate > 0)
      msgParts.push(`${counts.duplicate} duplicate mobile numbers`);
    if (counts.invalid > 0)
      msgParts.push(`${counts.invalid} invalid mobile numbers`);
    if (counts.exist > 0)
      msgParts.push(`${counts.exist} users already existed`);

    const finalMsg =
      msgParts.length > 0 ? msgParts.join(", ") : "No users imported";

    //  Step 8: Final Response
    const msg = {
      status: counts.imported === importedUsers.length ? 0 : 1,
      msg: finalMsg,
      counts,
      imported: finalUsers.map((u) => ({
        name: u.user_name,
        mobilenumber: u.mobilenumber,
        department_name: departmentMap[u.department_id] || null,
        department_id: u.department_id,
      })),
      skipped,
    };

    // console.log("data", msg.skipped);
    return libFunc.sendResponse(res, msg);
  } catch (err) {
    console.error("Error in bulkUserImport:", err);
    return libFunc.sendResponse(res, {
      status: 500,
      msg: "Internal server error",
    });
  }
}

//  Check existing users in DB
async function checkExistingUsers(importedUsers) {
  if (!importedUsers || importedUsers.length === 0) return [];

  const phoneNumbers = importedUsers
    .map((u) => `'${u.mobilenumber}'`)
    .join(",");

  const query = `
        SELECT 
            u.name, 
            u.mobilenumber, 
            u.deptid AS department_id, 
            d.department_name
        FROM ${schema}.users u
        LEFT JOIN ${schema}.departments d ON u.deptid = d.row_id
        WHERE u.mobilenumber IN (${phoneNumbers})
    `;

  const result = await connect_db.query(query);
  return result.rows || [];
}

async function bulkImportUsersPreparation(importedUsers, organizationid) {
  const users = [];

  for (const user of importedUsers) {
    var row_id = libFunc.randomid();
    users.push([
      row_id,
      user.user_name,
      user.department_id,
      user.password,
      user.mobilenumber,
      JSON.stringify(user.Top_duties),
      user.email,
      organizationid,
    ]);
  }

  if (users.length > 0) {
    await bulkInsert(
      "users",
      [
        "row_id",
        "name",
        "deptid",
        "password",
        "mobilenumber",
        "duties",
        "email",
        "organizationid",
      ],
      users
    );
  }
}

/**
 * Testing Import
 */
var organizationid = "1739861234068_66iA";
var importedTasks = [
  {
    title: "Vendor QC Report Review",
    description:
      "Review Quality Control reports submitted by vendors for accuracy and action.",
    repeat_schedule: "Weekly",
    reminder_on: [],
    is_recurring: true,
    complete_till: ["Saturday"],
    remind_me_before: [],
    assignedby: "7742529160",
    assigned_to: ["8890354610"],
    status: "ongoing",
  },

  {
    title: " Hardware Requirement Sheet - Unit 4",
    description: " Share List of Material needed to be Purchased",
    repeat_schedule: "Weekly",
    reminder_on: ["Friday"],
    is_recurring: true,
    complete_till: ["Sunday"],
    remind_me_before: [2],
    assignedby: "8890354610",
    assigned_to: ["7742529160"],
    status: "ongoing",
  },
  {
    title: "TDS Return Filing",
    description: "Tds Return (Quarterly) Sep",
    repeat_schedule: "Yearly",
    reminder_on: [
      "20-07",
      "20-10",
      "20-01",
      "20-05",
      "15-07",
      "15-10",
      "15-01",
      "15-05",
    ],
    is_recurring: true,
    complete_till: ["25-07", "25-10", "25-01", "25-05"],
    remind_me_before: [5, 10],
    assignedby: "7742529160",
    assigned_to: ["9929667143"],
    status: "ongoing",
  },
  {
    title: "BOM Purchasing",
    description: "Purchase material according to BOM",
    repeat_schedule: "Monthly",
    reminder_on: [
      "06-01",
      "06-02",
      "06-03",
      "06-04",
      "06-05",
      "06-06",
      "06-07",
      "06-08",
      "06-09",
      "06-10",
      "06-11",
      "06-12",
      "16-01",
      "16-02",
      "16-03",
      "16-04",
      "16-05",
      "16-06",
      "16-07",
      "16-08",
      "16-09",
      "16-10",
      "16-11",
      "16-12",
      "24-01",
      "24-02",
      "24-03",
      "24-04",
      "24-05",
      "24-06",
      "24-07",
      "24-08",
      "24-09",
      "24-10",
      "24-11",
      "24-12",
    ],
    is_recurring: true,
    complete_till: [10, 20, 28],
    remind_me_before: [4],
    assignedby: "8890354610",
    assigned_to: ["7742529160"],
    status: "ongoing",
  },
  {
    title: "Sampling Checking Report",
    description: "Sampling Checking Report",
    repeat_schedule: "Daily",
    reminder_on: [],
    is_recurring: true,
    complete_till: [],
    remind_me_before: [0],
    assignedby: "7742529160",
    assigned_to: ["8890354610"],
    status: "ongoing",
  },
];
//  bulkImportPreperation(importedTasks, organizationid);

var importedUsers = [
  {
    department_id: "1739880609970_KRCv",
    user_name: "Arvind Salecha",
    email: "",
    password: "Arvind@123",
    mobilenumber: "9414140000",
    Top_duties: [],
  },

  {
    department_id: "1739880609970_KRCv",
    user_name: "Benigopal",
    email: "",
    password: "Benigopal@123",
    mobilenumber: "9819710181",
    Top_duties: [],
  },

  {
    department_id: "1739880609970_KRCv",
    user_name: "Uttam Salecha",
    email: "",
    password: "Uttam@1974",
    mobilenumber: "9414130685",
    Top_duties: [],
  },

  {
    department_id: "1739880609970_KRCv",
    user_name: "Uttam Salecha",
    email: "",
    password: "Uttam@1974",
    mobilenumber: "9414130685",
    Top_duties: ["Owner/Registered"],
  },
];
// bulkImportUsersPreparation(importedUsers, organizationid);

// async function fetchTasks(req, res) {
//     try {
//         const userid = req.data.userId;
//         const organizationid = req.data.orgId;
//         const role = req.data.user_role; // 0 = admin
//         const active_status =
//             req.data.status === "ongoing" ? 0 :
//             req.data.status === "complete" ? 1 :
//             req.data.status === "overdue" ? 2 : undefined;

//         const limit = req.data.limit || 100;
//         const page = req.data.page || 1;
//         const offset = (page - 1) * limit;

//         let params = [organizationid]; // common param
//         let whereClauses = ["ta.organizationid = $1", "ta.activestatus = 0"];

//       //  console.log("role",role,role === 1)

//         //  only apply user filter if not admin
//         // if (role !== 1) {
//         //     params.push(`%${userid}%`);
//         //     whereClauses.push(`ta.assigned_to::text LIKE $${params.length}`);
//         // }

//         //  active_status filter
//         if (active_status !== undefined) {
//             params.push(active_status);
//             whereClauses.push(`ta.active_status = $${params.length}`);
//         }

//         //  pagination
//         params.push(limit);
//         params.push(offset);

//         let query = `
//             SELECT ta.row_id, ta.title, ta.description, ta.completion_date, us1.name AS created_by,
//                    ta.cr_on AS created_at, ta.checklist, ta.assigned_to,ta.task_type,
//                    CASE
//                        WHEN ta.active_status = 0 THEN 'ongoing'
//                        WHEN ta.active_status = 1 THEN 'complete'
//                        WHEN ta.active_status = 2 THEN 'overdue'
//                    END AS status,
//                    (ta.completion_date - CURRENT_DATE) AS due_days,
//                    us2.name AS updated_by
//             FROM ${schema}.tasks ta
//             INNER JOIN ${schema}.users us1 ON ta.assigned_by = us1.row_id
//             LEFT JOIN ${schema}.users us2 ON ta.completed_by = us2.row_id
//             WHERE ${whereClauses.join(" AND ")}
//             ORDER BY ta.cr_on DESC
//             LIMIT $${params.length - 1} OFFSET $${params.length}
//         `;

//         if (role === 1) {
//             const resp = await db_query.customQuery(query, "Tasks Fetched", params);
//            //  console.log("resp--->", resp);
//            libFunc.sendResponse(res, resp);

//         }else{

//             let msg = {
//                status: 1,
//                 msg: "you are not admin",
//             }

//             //  console.log("resp--->", msg);
//         libFunc.sendResponse(res, msg);
//         }

//     } catch (err) {
//         console.error("Error in fetchTasks:", err);
//         libFunc.sendResponse(res, { status: 0, msg: "Error fetching tasks" });
//     }
// }

// async function fetchTasks(req, res) {
//     try {
//         const userid = req.data.userId;
//         const organizationid = req.data.orgId;
//         const role = req.data.user_role; // 0 = normal, 1 = admin
//         const statusFilter = req.data.status; // ongoing, complete, overdue
//         const filters = req.data.filters || {}; // optional filters object

//         const completion_startDate = req.data.completion_startDate;
//         const completion_endDate = req.data.completion_endDate;
//         const task_completed_on_startDate = req.data.task_completed_on_startDate;
//         const task_completed_on_endDate = req.data.task_completed_on_endDate;

//         const limit = req.data.limit || 100;
//         const page = req.data.page || 1;
//         const offset = (page - 1) * limit;

//         let params = [organizationid];
//         let whereClauses = ["ta.organizationid = $1"];

//         // Default active_status only if no status filter sent
//         if (!statusFilter) {
//             whereClauses.push("ta.active_status = 0");
//         }

//         // Status Filter
//         let active_status;
//         if (statusFilter) {
//             const active_status_map = { ongoing: 0, complete: 1, overdue: 2 };
//             active_status = active_status_map[statusFilter.toLowerCase()];
//             if (active_status !== undefined) {
//                 params.push(active_status);
//                 whereClauses.push(`ta.active_status = $${params.length}`);
//             }
//         }

//         // Completion Date Filters (Outside)
//         if (completion_startDate) {
//             params.push(completion_startDate);
//             whereClauses.push(`ta.completion_date >= $${params.length}`);
//         }
//         if (completion_endDate) {
//             params.push(completion_endDate);
//             whereClauses.push(`ta.completion_date <= $${params.length}`);
//         }

//         // Completion Date Filters (Inside filters object)
//         if (filters.completion_startDate) {
//             params.push(filters.completion_startDate);
//             whereClauses.push(`ta.completion_date >= $${params.length}`);
//         }
//         if (filters.completion_endDate) {
//             params.push(filters.completion_endDate);
//             whereClauses.push(`ta.completion_date <= $${params.length}`);
//         }

//         // CompletedOn Date Filters — apply only for completed tasks
//         if (active_status === 1 || statusFilter?.toLowerCase() === "complete") {
//             // Outside CompletedOn Filters
//             // if (task_completed_on_startDate) {
//             //     params.push(task_completed_on_startDate);
//             //     whereClauses.push(`ta.completedon >= $${params.length}`);
//             // }
//             // if (task_completed_on_endDate) {
//             //     params.push(task_completed_on_endDate);
//             //     whereClauses.push(`ta.completedon <= $${params.length}`);
//             // }

//             // Inside CompletedOn Filters
//             if (filters.task_completed_on_startDate) {
//                 params.push(filters.task_completed_on_startDate);
//                 whereClauses.push(`ta.completedon >= $${params.length}`);
//             }
//             if (filters.task_completed_on_endDate) {
//                 params.push(filters.task_completed_on_endDate);
//                 whereClauses.push(`ta.completedon <= $${params.length}`);
//             }
//         }

//         // Department Filter
//         if (filters.department_id?.length) {
//             params.push(filters.department_id);
//             whereClauses.push(`us1.deptid = ANY($${params.length})`);
//         }

//         // Assigned To Filter
//         if (filters.assigned_to?.length) {
//             params.push(filters.assigned_to);
//             whereClauses.push(`assigned_to_id::text = ANY($${params.length})`);
//         }

//         // Assigned By Filter
//         if (filters.assigned_by?.length) {
//             params.push(filters.assigned_by);
//             whereClauses.push(`ta.assigned_by = ANY($${params.length})`);
//         }

//         // Task Type (Normal / Recurring)
//         if (filters.type) {
//             params.push(filters.type.toLowerCase() === "normal" ? '0' : '1');
//             whereClauses.push(`ta.task_type = $${params.length}`);
//         }

//         // Frequency Filter
//         if (filters.frequency) {
//             params.push(filters.frequency);
//             whereClauses.push(`rt.schedule_details->>'type' = $${params.length}`);
//         }

//         // Pagination
//         params.push(limit);
//         params.push(offset);

//         const query = `
//             SELECT
//                 ta.row_id,
//                 ta.title,
//                 ta.description,
//                 ta.checklist,
//                 ta.completion_date,
//                 ta.completedon,
//                 us1.name AS created_by,
//                 COALESCE(dept.department_name, 'Owner') AS created_by_department,
//                 ta.cr_on AS created_at,
//                 json_agg(us.name) AS assigned_to,
//                 CASE
//                     WHEN ta.active_status = 0 THEN 'ongoing'
//                     WHEN ta.active_status = 1 THEN 'complete'
//                     WHEN ta.active_status = 2 THEN 'overdue'
//                 END AS status,
//                 CASE
//                     WHEN ta.task_type = '0' THEN 'Normal'
//                     WHEN ta.task_type = '1' THEN 'Recurring'
//                 END AS task_type_title,
//                 CASE
//                     WHEN ta.active_status = 1 AND ta.completion_date < CURRENT_DATE
//                         THEN ABS(ta.up_on::date - ta.completion_date)
//                     WHEN ta.completion_date >= CURRENT_DATE
//                         THEN (ta.completion_date - CURRENT_DATE)
//                     ELSE ABS(ta.completion_date - CURRENT_DATE)
//                 END AS due_days,
//                 CASE
//                     WHEN ta.completion_date >= CURRENT_DATE
//                         THEN 'due_in'
//                     ELSE 'overdue_by'
//                 END AS due_label,
//                 us2.name AS updated_by,
//                 ta.task_type,
//                 rt.row_id as recurring_task_id,
//                 rt.schedule_details->>'type' AS schedule_type,
//                 rt.schedule_details->>'reminder_list' AS reminder_list
//             FROM ${schema}.tasks ta
//             INNER JOIN ${schema}.users us1 ON ta.assigned_by = us1.row_id
//             LEFT JOIN ${schema}.departments dept ON us1.deptid = dept.row_id
//             INNER JOIN LATERAL jsonb_array_elements_text(ta.assigned_to) AS assigned_to_id ON TRUE
//             INNER JOIN ${schema}.users us ON us.row_id = assigned_to_id::text
//             LEFT JOIN ${schema}.users us2 ON ta.completed_by = us2.row_id
//             LEFT JOIN ${schema}.recurring_task rt ON ta.recurringid = rt.row_id
//             WHERE ${whereClauses.join(" AND ")}
//             AND us.activestatus = 0
//             GROUP BY ta.row_id, ta.checklist, us1.name, dept.department_name, us2.name, rt.schedule_details, rt.row_id
//             ORDER BY ta.cr_on DESC
//             LIMIT $${params.length - 1} OFFSET $${params.length};
//         `;

//         // console.log("WHERE CLAUSES =>", whereClauses);
//         // console.log("PARAMS =>", params);

//         if (role === 1) {
//             const resp = await db_query.customQuery(query, "Tasks Fetched", params);
//             console.log("fetch all tasks in dhashboard------>",resp)
//             libFunc.sendResponse(res, resp);
//         } else {
//             libFunc.sendResponse(res, { status: 1, msg: "You are not admin" });
//         }

//     } catch (err) {
//         console.error("Error in fetchTasks:", err);
//         libFunc.sendResponse(res, { status: 0, msg: "Error fetching tasks" });
//     }
// }

// async function fetchTasks(req, res) {
//     // console.log("req",req)
//     try {
//         //  Read data from request
//         const userid = req.data.userId;
//         const organizationid = req.data.orgId;
//         const role = req.data.user_role; // 0 = normal, 1 = admin
//         const statusFilter = req.data.status; // ongoing, complete, overdue
//         const filters = req.data.filters || {}; // optional filters object
//         const userDeptId = req.data.depId;

//         const completion_startDate = req.data.completion_startDate;
//         const completion_endDate = req.data.completion_endDate;
//         const task_completed_on_startDate = req.data.task_completed_on_startDate;
//         const task_completed_on_endDate = req.data.task_completed_on_endDate;

//         //  Pagination
//         const limit = req.data.limit || 100;
//         const page = req.data.page || 1;
//         const offset = (page - 1) * limit;

//         // Base query
//         let params = [organizationid];
//         let whereClauses = ["ta.organizationid = $1"];

//         // show only ongoing tasks IF user did not send status filtert ,  If no status selected → Show ongoing tasks.
//         if (!statusFilter) {
//             whereClauses.push("ta.active_status = 0");
//         }

//         //  Status filter (ongoing / complete / overdue)
//         let active_status;
//         if (statusFilter) {
//             const active_status_map = { ongoing: 0, complete: 1, overdue: 2 };
//             active_status = active_status_map[statusFilter.toLowerCase()];
//             if (active_status !== undefined) {
//                 params.push(active_status);
//                 whereClauses.push(`ta.active_status = $${params.length}`);
//             }
//         }

//         // Completion Date Filters (Outside)
//         if (completion_startDate) {
//             params.push(completion_startDate);
//             whereClauses.push(`ta.completion_date >= $${params.length}`);
//         }
//         if (completion_endDate) {
//             params.push(completion_endDate);
//             whereClauses.push(`ta.completion_date <= $${params.length}`);
//         }

//         // Completion Date Filters (Inside filters object)
//         if (filters.completion_startDate) {
//             params.push(filters.completion_startDate);
//             whereClauses.push(`ta.completion_date >= $${params.length}`);
//         }
//         if (filters.completion_endDate) {
//             params.push(filters.completion_endDate);
//             whereClauses.push(`ta.completion_date <= $${params.length}`);
//         }

//         // CompletedOn Date Filters — apply only for completed tasks
//         if (active_status === 1 || statusFilter?.toLowerCase() === "complete") {
//             if (filters.task_completed_on_startDate) {
//                 params.push(filters.task_completed_on_startDate);
//                 whereClauses.push(`ta.completedon >= $${params.length}`);
//             }
//             if (filters.task_completed_on_endDate) {
//                 params.push(filters.task_completed_on_endDate);
//                 whereClauses.push(`ta.completedon <= $${params.length}`);
//             }
//         }

//         // Department Filter
//         if (filters.department_id?.length) {
//             params.push(filters.department_id);
//             whereClauses.push(`us1.deptid = ANY($${params.length})`);
//         }

//         // Assigned To Filter
//         if (filters.assigned_to?.length) {
//             params.push(filters.assigned_to);
//             whereClauses.push(`assigned_to_id::text = ANY($${params.length})`);
//         }

//         // Assigned By Filter
//         if (filters.assigned_by?.length) {
//             params.push(filters.assigned_by);
//             whereClauses.push(`ta.assigned_by = ANY($${params.length})`);
//         }

//         // Task Type (Normal / Recurring)
//         if (filters.type) {
//             params.push(filters.type.toLowerCase() === "normal" ? '0' : '1');
//             whereClauses.push(`ta.task_type = $${params.length}`);
//         }

//         // Frequency Filter
//         if (filters.frequency) {
//             params.push(filters.frequency);
//             whereClauses.push(`rt.schedule_details->>'type' = $${params.length}`);
//         }

//         //  Department Admin Access Control
//         if (role === 2) {
//             params.push(userDeptId);
//             whereClauses.push(`
//                 (
//                     us1.deptid = $${params.length}
//                     OR assigned_to_id IN (
//                         SELECT row_id FROM ${schema}.users WHERE deptid = $${params.length}
//                     )
//                 )
//             `);
//         }

//         if (filters.outgoing === true) {
//        whereClauses.push(`
//         us1.deptid IS NOT NULL
//         AND us.deptid IS NOT NULL
//         AND us1.deptid <> us.deptid
//        `);
//     }

//         // Pagination
//         params.push(limit);
//         params.push(offset);

//         //  Final Query with active user condition
//         const query = `
//             SELECT
//                 ta.row_id,
//                 ta.title,
//                 ta.description,
//                 ta.checklist,
//                 ta.completion_date,
//                 ta.completedon,
//                 us1.name AS created_by,
//                 CASE
//                    WHEN dept.department_name IS NULL THEN
//                        CASE us1.role
//                           WHEN 3 THEN 'Top Management'
//                           WHEN 1 THEN 'Admin'
//                           ELSE 'Unknown'
//                         END
//                     ELSE dept.department_name
//                   END AS created_by_department,
//                 ta.cr_on AS created_at,
//                 json_agg(us.name) AS assigned_to,
//                 json_agg(
//     json_build_object(
//         'user_id', us.row_id,
//         'name', us.name,
//         'department',
//             CASE
//                 WHEN dept2.department_name IS NULL THEN
//                     CASE us.role
//                         WHEN 3 THEN 'Top Management'
//                         WHEN 1 THEN 'Admin'
//                         ELSE 'Owner'
//                     END
//                 ELSE dept2.department_name
//             END
//     )
// ) AS assigned_to_details,
//                 CASE
//                     WHEN ta.active_status = 0 THEN 'ongoing'
//                     WHEN ta.active_status = 1 THEN 'complete'
//                     WHEN ta.active_status = 2 THEN 'overdue'
//                 END AS status,
//                 CASE
//                     WHEN ta.task_type = '0' THEN 'Normal'
//                     WHEN ta.task_type = '1' THEN 'Recurring'
//                 END AS task_type_title,
//                 CASE
//                     WHEN ta.active_status = 1 AND ta.completion_date < CURRENT_DATE
//                         THEN ABS(ta.up_on::date - ta.completion_date)
//                     WHEN ta.completion_date >= CURRENT_DATE
//                         THEN (ta.completion_date - CURRENT_DATE)
//                     ELSE ABS(ta.completion_date - CURRENT_DATE)
//                 END AS due_days,
//                 CASE
//                     WHEN ta.completion_date >= CURRENT_DATE
//                         THEN 'due_in'
//                     ELSE 'overdue_by'
//                 END AS due_label,
//                 us2.name AS updated_by,
//                 ta.task_type,
//                 rt.row_id as recurring_task_id,
//                 rt.schedule_details->>'type' AS schedule_type,
//                 rt.schedule_details->>'reminder_list' AS reminder_list
//             FROM ${schema}.tasks ta
//             INNER JOIN ${schema}.users us1 ON ta.assigned_by = us1.row_id
//             LEFT JOIN ${schema}.departments dept ON us1.deptid = dept.row_id
//             INNER JOIN LATERAL jsonb_array_elements_text(ta.assigned_to) AS assigned_to_id ON TRUE
//             INNER JOIN ${schema}.users us ON us.row_id = assigned_to_id::text
//             LEFT JOIN ${schema}.departments dept2 ON us.deptid = dept2.row_id
//             LEFT JOIN ${schema}.users us2 ON ta.completed_by = us2.row_id
//             LEFT JOIN ${schema}.recurring_task rt ON ta.recurringid = rt.row_id
//             WHERE ${whereClauses.join(" AND ")}
//               AND us.activestatus = 0
//             GROUP BY ta.row_id, ta.checklist, us1.name, dept.department_name, us2.name, rt.schedule_details, rt.row_id,us1.role
//             ORDER BY ta.cr_on DESC
//             LIMIT $${params.length - 1} OFFSET $${params.length};
//         `;
//         // console.log("role",role)

//         if (role === 1 || role === 3 || role ===2) {
//             const resp = await db_query.customQuery(query, "Tasks Fetched", params);
//             // console.log("response---->",resp.data)
//             libFunc.sendResponse(res, resp);
//         } else {
//             libFunc.sendResponse(res, { status: 1, msg: "You are not admin" });
//         }

//     } catch (err) {
//         console.error("Error in fetchTasks:", err);
//         libFunc.sendResponse(res, { status: 0, msg: "Error fetching tasks" });
//     }
// }

// v2
// async function fetchTasks(req, res) {
//     // console.log("req",req)
//     try {
//         //  Read data from request
//         const userid = req.data.userId;
//         const organizationid = req.data.orgId;
//         const role = req.data.user_role; // 0 = normal, 1 = admin
//         const statusFilter = req.data.status; // ongoing, complete, overdue
//         const filters = req.data.filters || {}; // optional filters object
//         const userDeptId = req.data.depId;

//         const completion_startDate = req.data.completion_startDate;
//         const completion_endDate = req.data.completion_endDate;
//         const task_completed_on_startDate = req.data.task_completed_on_startDate;
//         const task_completed_on_endDate = req.data.task_completed_on_endDate;

//         //  Pagination
//         const limit = req.data.limit || 100;
//         const page = req.data.page || 1;
//         const offset = (page - 1) * limit;

//         // Base query
//         let params = [organizationid];
//         let whereClauses = ["ta.organizationid = $1"];

//         // show only ongoing tasks IF user did not send status filtert ,  If no status selected → Show ongoing tasks.
//         if (!statusFilter) {
//             whereClauses.push("ta.active_status = 0");
//         }

//         //  Status filter (ongoing / complete / overdue)
//         let active_status;
//         if (statusFilter) {
//             const active_status_map = { ongoing: 0, complete: 1, overdue: 2 };
//             active_status = active_status_map[statusFilter.toLowerCase()];
//             if (active_status !== undefined) {
//                 params.push(active_status);
//                 whereClauses.push(`ta.active_status = $${params.length}`);
//             }
//         }

//         // Completion Date Filters (Outside)
//         if (completion_startDate) {
//             params.push(completion_startDate);
//             whereClauses.push(`ta.completion_date >= $${params.length}`);
//         }
//         if (completion_endDate) {
//             params.push(completion_endDate);
//             whereClauses.push(`ta.completion_date <= $${params.length}`);
//         }

//         // Completion Date Filters (Inside filters object)
//         if (filters.completion_startDate) {
//             params.push(filters.completion_startDate);
//             whereClauses.push(`ta.completion_date >= $${params.length}`);
//         }
//         if (filters.completion_endDate) {
//             params.push(filters.completion_endDate);
//             whereClauses.push(`ta.completion_date <= $${params.length}`);
//         }

//         // CompletedOn Date Filters — apply only for completed tasks
//         if (active_status === 1 || statusFilter?.toLowerCase() === "complete") {
//             if (filters.task_completed_on_startDate) {
//                 params.push(filters.task_completed_on_startDate);
//                 whereClauses.push(`ta.completedon >= $${params.length}`);
//             }
//             if (filters.task_completed_on_endDate) {
//                 params.push(filters.task_completed_on_endDate);
//                 whereClauses.push(`ta.completedon <= $${params.length}`);
//             }
//         }

//         // Department Filter
//         if (filters.department_id?.length) {
//             params.push(filters.department_id);
//             whereClauses.push(`us1.deptid = ANY($${params.length})`);
//         }

//         // Assigned To Filter
//         if (filters.assigned_to?.length) {
//             params.push(filters.assigned_to);
//             whereClauses.push(`assigned_to_id::text = ANY($${params.length})`);
//         }

//         // Assigned By Filter
//         if (filters.assigned_by?.length) {
//             params.push(filters.assigned_by);
//             whereClauses.push(`ta.assigned_by = ANY($${params.length})`);
//         }

//         // Task Type (Normal / Recurring)
//         if (filters.type) {
//             params.push(filters.type.toLowerCase() === "normal" ? '0' : '1');
//             whereClauses.push(`ta.task_type = $${params.length}`);
//         }

//         // Frequency Filter
//         if (filters.frequency) {
//             params.push(filters.frequency);
//             whereClauses.push(`rt.schedule_details->>'type' = $${params.length}`);
//         }

//         //  Department Admin Access Control
//         if (role === 2) {
//             params.push(userDeptId);
//             whereClauses.push(`
//                 (
//                     us1.deptid = $${params.length}
//                     OR assigned_to_id IN (
//                         SELECT row_id FROM ${schema}.users WHERE deptid = $${params.length}
//                     )
//                 )
//             `);
//         }

//     //     if (filters.outgoing === true) {
//     //    whereClauses.push(`
//     //     us1.deptid IS NOT NULL
//     //     AND us.deptid IS NOT NULL
//     //     AND us1.deptid <> us.deptid
//     //    `);
//     // }

//     if (filters.outgoing === true) {
//     params.push(userDeptId);
//     whereClauses.push(`
//         us1.deptid = $${params.length}
//         AND us.deptid <> $${params.length}
//     `);
// }

// if (filters.outgoing === false) {
//     params.push(userDeptId);
//     whereClauses.push(`
//         NOT (
//             us1.deptid = $${params.length}
//             AND us.deptid <> $${params.length}
//         )
//     `);
// }

//         // Pagination
//         params.push(limit);
//         params.push(offset);

//         //  Final Query with active user condition
//         const query = `
//             SELECT
//                 ta.row_id,
//                 ta.title,
//                 ta.description,
//                 ta.checklist,
//                 ta.completion_date,
//                 ta.completedon,
//                 us1.name AS created_by,
//                 CASE
//                    WHEN dept.department_name IS NULL THEN
//                        CASE us1.role
//                           WHEN 3 THEN 'Top Management'
//                           WHEN 1 THEN 'Admin'
//                           ELSE 'Unknown'
//                         END
//                     ELSE dept.department_name
//                   END AS created_by_department,
//                 ta.cr_on AS created_at,
//                 json_agg(us.name) AS assigned_to,
//                 json_agg(
//     json_build_object(
//         'user_id', us.row_id,
//         'name', us.name,
//         'department',
//             CASE
//                 WHEN dept2.department_name IS NULL THEN
//                     CASE us.role
//                         WHEN 3 THEN 'Top Management'
//                         WHEN 1 THEN 'Admin'
//                         ELSE 'Owner'
//                     END
//                 ELSE dept2.department_name
//             END
//     )
// ) AS assigned_to_details,
//                 CASE
//                     WHEN ta.active_status = 0 THEN 'ongoing'
//                     WHEN ta.active_status = 1 THEN 'complete'
//                     WHEN ta.active_status = 2 THEN 'overdue'
//                 END AS status,
//                 CASE
//                     WHEN ta.task_type = '0' THEN 'Normal'
//                     WHEN ta.task_type = '1' THEN 'Recurring'
//                 END AS task_type_title,
//                 CASE
//                     WHEN ta.active_status = 1 AND ta.completion_date < CURRENT_DATE
//                         THEN ABS(ta.up_on::date - ta.completion_date)
//                     WHEN ta.completion_date >= CURRENT_DATE
//                         THEN (ta.completion_date - CURRENT_DATE)
//                     ELSE ABS(ta.completion_date - CURRENT_DATE)
//                 END AS due_days,
//                 CASE
//                     WHEN ta.completion_date >= CURRENT_DATE
//                         THEN 'due_in'
//                     ELSE 'overdue_by'
//                 END AS due_label,
//                 us2.name AS updated_by,
//                 ta.task_type,
//                 rt.row_id as recurring_task_id,
//                 rt.schedule_details->>'type' AS schedule_type,
//                 rt.schedule_details->>'reminder_list' AS reminder_list
//             FROM ${schema}.tasks ta
//             INNER JOIN ${schema}.users us1 ON ta.assigned_by = us1.row_id
//             LEFT JOIN ${schema}.departments dept ON us1.deptid = dept.row_id
//             INNER JOIN LATERAL jsonb_array_elements_text(ta.assigned_to) AS assigned_to_id ON TRUE
//             INNER JOIN ${schema}.users us ON us.row_id = assigned_to_id::text
//             LEFT JOIN ${schema}.departments dept2 ON us.deptid = dept2.row_id
//             LEFT JOIN ${schema}.users us2 ON ta.completed_by = us2.row_id
//             LEFT JOIN ${schema}.recurring_task rt ON ta.recurringid = rt.row_id
//             WHERE ${whereClauses.join(" AND ")}
//               AND us.activestatus = 0
//             GROUP BY ta.row_id, ta.checklist, us1.name, dept.department_name, us2.name, rt.schedule_details, rt.row_id,us1.role
//             ORDER BY ta.cr_on DESC
//             LIMIT $${params.length - 1} OFFSET $${params.length};
//         `;
//         // console.log("role",role)

//         if (role === 1 || role === 3 || role ===2) {
//             const resp = await db_query.customQuery(query, "Tasks Fetched", params);
//             // console.log("response---->",resp.data)
//             libFunc.sendResponse(res, resp);
//         } else {
//             libFunc.sendResponse(res, { status: 1, msg: "You are not admin" });
//         }

//     } catch (err) {
//         console.error("Error in fetchTasks:", err);
//         libFunc.sendResponse(res, { status: 0, msg: "Error fetching tasks" });
//     }
// }

// v3
// async function fetchTasks(req, res) {
//     // console.log("req",req)
//     try {
//         //  Read data from request
//         const userid = req.data.userId;
//         const organizationid = req.data.orgId;
//         const role = req.data.user_role; // 0 = normal, 1 = admin
//         const statusFilter = req.data.status; // ongoing, complete, overdue
//         const filters = req.data.filters || {}; // optional filters object
//         const userDeptId = req.data.depId;

//         const completion_startDate = req.data.completion_startDate;
//         const completion_endDate = req.data.completion_endDate;
//         const task_completed_on_startDate = req.data.task_completed_on_startDate;
//         const task_completed_on_endDate = req.data.task_completed_on_endDate;

//         //  Pagination
//         const limit = req.data.limit || 100;
//         const page = req.data.page || 1;
//         const offset = (page - 1) * limit;

//         // Base query
//         let params = [organizationid];
//         let whereClauses = ["ta.organizationid = $1"];

//         // show only ongoing tasks IF user did not send status filtert ,  If no status selected → Show ongoing tasks.
//         if (!statusFilter) {
//             whereClauses.push("ta.active_status = 0");
//         }

//         //  Status filter (ongoing / complete / overdue)
//         let active_status;
//         if (statusFilter) {
//             const active_status_map = { ongoing: 0, complete: 1, overdue: 2 };
//             active_status = active_status_map[statusFilter.toLowerCase()];
//             if (active_status !== undefined) {
//                 params.push(active_status);
//                 whereClauses.push(`ta.active_status = $${params.length}`);
//             }
//         }

//         // Completion Date Filters (Outside)
//         if (completion_startDate) {
//             params.push(completion_startDate);
//             whereClauses.push(`ta.completion_date >= $${params.length}`);
//         }
//         if (completion_endDate) {
//             params.push(completion_endDate);
//             whereClauses.push(`ta.completion_date <= $${params.length}`);
//         }

//         // Completion Date Filters (Inside filters object)
//         if (filters.completion_startDate) {
//             params.push(filters.completion_startDate);
//             whereClauses.push(`ta.completion_date >= $${params.length}`);
//         }
//         if (filters.completion_endDate) {
//             params.push(filters.completion_endDate);
//             whereClauses.push(`ta.completion_date <= $${params.length}`);
//         }

//         // CompletedOn Date Filters — apply only for completed tasks
//         if (active_status === 1 || statusFilter?.toLowerCase() === "complete") {
//             if (filters.task_completed_on_startDate) {
//                 params.push(filters.task_completed_on_startDate);
//                 whereClauses.push(`ta.completedon >= $${params.length}`);
//             }
//             if (filters.task_completed_on_endDate) {
//                 params.push(filters.task_completed_on_endDate);
//                 whereClauses.push(`ta.completedon <= $${params.length}`);
//             }
//         }

//         // Department Filter
//         if (filters.department_id?.length) {
//             params.push(filters.department_id);
//             whereClauses.push(`us1.deptid = ANY($${params.length})`);
//         }

//         // Assigned To Filter
//         if (filters.assigned_to?.length) {
//             params.push(filters.assigned_to);
//             whereClauses.push(`assigned_to_id::text = ANY($${params.length})`);
//         }

//         // Assigned By Filter
//         if (filters.assigned_by?.length) {
//             params.push(filters.assigned_by);
//             whereClauses.push(`ta.assigned_by = ANY($${params.length})`);
//         }

//         // Task Type (Normal / Recurring)
//         if (filters.type) {
//             params.push(filters.type.toLowerCase() === "normal" ? '0' : '1');
//             whereClauses.push(`ta.task_type = $${params.length}`);
//         }

//         // Frequency Filter
//         if (filters.frequency) {
//             params.push(filters.frequency);
//             whereClauses.push(`rt.schedule_details->>'type' = $${params.length}`);
//         }

//         //  Department Admin Access Control
//         if (role === 2) {
//             params.push(userDeptId);
//             whereClauses.push(`
//                 (
//                     us1.deptid = $${params.length}
//                     OR assigned_to_id IN (
//                         SELECT row_id FROM ${schema}.users WHERE deptid = $${params.length}
//                     )
//                 )
//             `);
//         }

//     //     if (filters.outgoing === true) {
//     //    whereClauses.push(`
//     //     us1.deptid IS NOT NULL
//     //     AND us.deptid IS NOT NULL
//     //     AND us1.deptid <> us.deptid
//     //    `);
//     // }

//      let outgoingP1 = null;
//         let outgoingP2 = null;

//         if (filters.outgoing === true) {
//             // outgoing highlight only — NO FILTER applied
//             params.push(userDeptId);
//             outgoingP1 = params.length;

//             params.push(userDeptId);
//             outgoingP2 = params.length;
//         }

//         if (filters.outgoing === false) {
//             params.push(userDeptId);
//             outgoingP1 = params.length;

//             params.push(userDeptId);
//             outgoingP2 = params.length;

//             // Remove outgoing tasks
//             whereClauses.push(`
//                 NOT (
//                     us1.deptid = $${outgoingP1}
//                     AND us.deptid <> $${outgoingP2}
//                 )
//             `);
//         }

//         // Pagination params
//         params.push(limit);
//         const limitIndex = params.length;

//         params.push(offset);
//         const offsetIndex = params.length;

//         //  Final Query with active user condition
//         const query = `
//             SELECT
//                 ta.row_id,
//                 ta.title,
//                 ta.description,
//                 ta.checklist,
//                 ta.completion_date,
//                 ta.completedon,
//                 us1.name AS created_by,
//                 CASE
//                    WHEN dept.department_name IS NULL THEN
//                        CASE us1.role
//                           WHEN 3 THEN 'Top Management'
//                           WHEN 1 THEN 'Admin'
//                           ELSE 'Unknown'
//                         END
//                     ELSE dept.department_name
//                   END AS created_by_department,
//                 ta.cr_on AS created_at,
//                 json_agg(us.name) AS assigned_to,
//                 json_agg(
//     json_build_object(
//         'user_id', us.row_id,
//         'name', us.name,
//         'department',
//             CASE
//                 WHEN dept2.department_name IS NULL THEN
//                     CASE us.role
//                         WHEN 3 THEN 'Top Management'
//                         WHEN 1 THEN 'Admin'
//                         ELSE 'Owner'
//                     END
//                 ELSE dept2.department_name
//             END
//     )
// ) AS assigned_to_details,
//                 CASE
//                     WHEN ta.active_status = 0 THEN 'ongoing'
//                     WHEN ta.active_status = 1 THEN 'complete'
//                     WHEN ta.active_status = 2 THEN 'overdue'
//                 END AS status,
//                 CASE
//                     WHEN ta.task_type = '0' THEN 'Normal'
//                     WHEN ta.task_type = '1' THEN 'Recurring'
//                 END AS task_type_title,
//                 CASE
//                     WHEN ta.active_status = 1 AND ta.completion_date < CURRENT_DATE
//                         THEN ABS(ta.up_on::date - ta.completion_date)
//                     WHEN ta.completion_date >= CURRENT_DATE
//                         THEN (ta.completion_date - CURRENT_DATE)
//                     ELSE ABS(ta.completion_date - CURRENT_DATE)
//                 END AS due_days,
//                 CASE
//                     WHEN ta.completion_date >= CURRENT_DATE
//                         THEN 'due_in'
//                     ELSE 'overdue_by'
//                 END AS due_label,
//                  CASE
//                     WHEN ${outgoingP1 ? `us1.deptid = $${outgoingP1} AND us.deptid <> $${outgoingP2}` : 'false'}
//                     THEN true
//                     ELSE false
//                 END AS is_outgoing_flag,

//                 us2.name AS updated_by,
//                 ta.task_type,
//                 rt.row_id as recurring_task_id,
//                 rt.schedule_details->>'type' AS schedule_type,
//                 rt.schedule_details->>'reminder_list' AS reminder_list
//             FROM ${schema}.tasks ta
//             INNER JOIN ${schema}.users us1 ON ta.assigned_by = us1.row_id
//             LEFT JOIN ${schema}.departments dept ON us1.deptid = dept.row_id
//             INNER JOIN LATERAL jsonb_array_elements_text(ta.assigned_to) AS assigned_to_id ON TRUE
//             INNER JOIN ${schema}.users us ON us.row_id = assigned_to_id::text
//             LEFT JOIN ${schema}.departments dept2 ON us.deptid = dept2.row_id
//             LEFT JOIN ${schema}.users us2 ON ta.completed_by = us2.row_id
//             LEFT JOIN ${schema}.recurring_task rt ON ta.recurringid = rt.row_id
//             WHERE ${whereClauses.join(" AND ")}
//               AND us.activestatus = 0
//             GROUP BY ta.row_id, ta.checklist, us1.name, dept.department_name, us2.name, rt.schedule_details, rt.row_id,us1.role,  us1.deptid, us.deptid
//             ORDER BY ta.cr_on DESC
//             LIMIT $${limitIndex} OFFSET $${offsetIndex}
//         `;

//         // console.log("role",role)

//         if (role === 1 || role === 3 || role ===2) {
//             const resp = await db_query.customQuery(query, "Tasks Fetched", params);
//             console.log("response---->",resp.data)
//             libFunc.sendResponse(res, resp);
//         } else {
//             libFunc.sendResponse(res, { status: 1, msg: "You are not admin" });
//         }

//     } catch (err) {
//         console.error("Error in fetchTasks:", err);
//         libFunc.sendResponse(res, { status: 0, msg: "Error fetching tasks" });
//     }
// }

// v4 colour worl
// async function fetchTasks(req, res) {
//     // console.log("req",req)
//     try {
//         //  Read data from request
//         const userid = req.data.userId;
//         const organizationid = req.data.orgId;
//         const role = req.data.user_role; // 0 = normal, 1 = admin
//         const statusFilter = req.data.status; // ongoing, complete, overdue
//         const filters = req.data.filters || {}; // optional filters object
//         const userDeptId = req.data.depId;

//         const completion_startDate = req.data.completion_startDate;
//         const completion_endDate = req.data.completion_endDate;
//         const task_completed_on_startDate = req.data.task_completed_on_startDate;
//         const task_completed_on_endDate = req.data.task_completed_on_endDate;

//         //  Pagination
//         const limit = req.data.limit || 100;
//         const page = req.data.page || 1;
//         const offset = (page - 1) * limit;

//         // Base query
//         let params = [organizationid];
//         let whereClauses = ["ta.organizationid = $1"];

//         // show only ongoing tasks IF user did not send status filtert ,  If no status selected → Show ongoing tasks.
//         if (!statusFilter) {
//             whereClauses.push("ta.active_status = 0");
//         }

//         //  Status filter (ongoing / complete / overdue)
//         let active_status;
//         if (statusFilter) {
//             const active_status_map = { ongoing: 0, complete: 1, overdue: 2 };
//             active_status = active_status_map[statusFilter.toLowerCase()];
//             if (active_status !== undefined) {
//                 params.push(active_status);
//                 whereClauses.push(`ta.active_status = $${params.length}`);
//             }
//         }

//         // Completion Date Filters (Outside)
//         if (completion_startDate) {
//             params.push(completion_startDate);
//             whereClauses.push(`ta.completion_date >= $${params.length}`);
//         }
//         if (completion_endDate) {
//             params.push(completion_endDate);
//             whereClauses.push(`ta.completion_date <= $${params.length}`);
//         }

//         // Completion Date Filters (Inside filters object)
//         if (filters.completion_startDate) {
//             params.push(filters.completion_startDate);
//             whereClauses.push(`ta.completion_date >= $${params.length}`);
//         }
//         if (filters.completion_endDate) {
//             params.push(filters.completion_endDate);
//             whereClauses.push(`ta.completion_date <= $${params.length}`);
//         }

//         // CompletedOn Date Filters — apply only for completed tasks
//         if (active_status === 1 || statusFilter?.toLowerCase() === "complete") {
//             if (filters.task_completed_on_startDate) {
//                 params.push(filters.task_completed_on_startDate);
//                 whereClauses.push(`ta.completedon >= $${params.length}`);
//             }
//             if (filters.task_completed_on_endDate) {
//                 params.push(filters.task_completed_on_endDate);
//                 whereClauses.push(`ta.completedon <= $${params.length}`);
//             }
//         }

//         // Department Filter
//         if (filters.department_id?.length) {
//             params.push(filters.department_id);
//             whereClauses.push(`us1.deptid = ANY($${params.length})`);
//         }

//         // Assigned To Filter
//         if (filters.assigned_to?.length) {
//             params.push(filters.assigned_to);
//             whereClauses.push(`assigned_to_id::text = ANY($${params.length})`);
//         }

//         // Assigned By Filter
//         if (filters.assigned_by?.length) {
//             params.push(filters.assigned_by);
//             whereClauses.push(`ta.assigned_by = ANY($${params.length})`);
//         }

//         // Task Type (Normal / Recurring)
//         if (filters.type) {
//             params.push(filters.type.toLowerCase() === "normal" ? '0' : '1');
//             whereClauses.push(`ta.task_type = $${params.length}`);
//         }

//         // Frequency Filter
//         if (filters.frequency) {
//             params.push(filters.frequency);
//             whereClauses.push(`rt.schedule_details->>'type' = $${params.length}`);
//         }

//         //  Department Admin Access Control
//         if (role === 2) {
//             params.push(userDeptId);
//             whereClauses.push(`
//                 (
//                     us1.deptid = $${params.length}
//                     OR assigned_to_id IN (
//                         SELECT row_id FROM ${schema}.users WHERE deptid = $${params.length}
//                     )
//                 )
//             `);
//         }

// if (filters.outgoing === true) {
//     params.push(userDeptId);
//     whereClauses.push(`
//         (
//             -- OUTGOING (A → B)
//             us1.deptid = $${params.length}

//             OR

//             -- INCOMING (B → A)
//             us1.deptid <> $${params.length}

//             OR

//             -- INTERNAL (A → A)
//             us1.deptid = $${params.length}
//         )
//     `);
// }

// if (filters.outgoing === false) {
//     params.push(userDeptId);
//     whereClauses.push(`
//         NOT (
//             us1.deptid = $${params.length}
//             AND us.deptid <> $${params.length}
//         )
//     `);
// }

//   const outgoingDeptParamIndex = params.push(userDeptId);
//         // Pagination
//         params.push(limit);
//         params.push(offset);

//         //  Final Query with active user condition
//         const query = `
//             SELECT
//                 ta.row_id,
//                 ta.title,
//                 ta.description,
//                 ta.checklist,
//                 ta.completion_date,
//                 ta.completedon,
//                 us1.name AS created_by,
//                 CASE
//                    WHEN dept.department_name IS NULL THEN
//                        CASE us1.role
//                           WHEN 3 THEN 'Top Management'
//                           WHEN 1 THEN 'Admin'
//                           ELSE 'Unknown'
//                         END
//                     ELSE dept.department_name
//                   END AS created_by_department,
//                 ta.cr_on AS created_at,
//                 json_agg(us.name) AS assigned_to,
//                 json_agg(
//     json_build_object(
//         'user_id', us.row_id,
//         'name', us.name,
//         'department',
//             CASE
//                 WHEN dept2.department_name IS NULL THEN
//                     CASE us.role
//                         WHEN 3 THEN 'Top Management'
//                         WHEN 1 THEN 'Admin'
//                         ELSE 'Owner'
//                     END
//                 ELSE dept2.department_name
//             END
//     )
// ) AS assigned_to_details,
//                 CASE
//                     WHEN ta.active_status = 0 THEN 'ongoing'
//                     WHEN ta.active_status = 1 THEN 'complete'
//                     WHEN ta.active_status = 2 THEN 'overdue'
//                 END AS status,
//                 CASE
//                     WHEN ta.task_type = '0' THEN 'Normal'
//                     WHEN ta.task_type = '1' THEN 'Recurring'
//                 END AS task_type_title,
//                 CASE
//                     WHEN ta.active_status = 1 AND ta.completion_date < CURRENT_DATE
//                         THEN ABS(ta.up_on::date - ta.completion_date)
//                     WHEN ta.completion_date >= CURRENT_DATE
//                         THEN (ta.completion_date - CURRENT_DATE)
//                     ELSE ABS(ta.completion_date - CURRENT_DATE)
//                 END AS due_days,
//                 CASE
//                     WHEN ta.completion_date >= CURRENT_DATE
//                         THEN 'due_in'
//                     ELSE 'overdue_by'
//                 END AS due_label,
//                 us2.name AS updated_by,
//                          CASE
//                     WHEN us1.deptid <> $${outgoingDeptParamIndex}
//                         THEN true
//                     ELSE false
//                 END AS is_outgoing,
//                 ta.task_type,
//                 rt.row_id as recurring_task_id,
//                 rt.schedule_details->>'type' AS schedule_type,
//                 rt.schedule_details->>'reminder_list' AS reminder_list
//             FROM ${schema}.tasks ta
//             INNER JOIN ${schema}.users us1 ON ta.assigned_by = us1.row_id
//             LEFT JOIN ${schema}.departments dept ON us1.deptid = dept.row_id
//             INNER JOIN LATERAL jsonb_array_elements_text(ta.assigned_to) AS assigned_to_id ON TRUE
//             INNER JOIN ${schema}.users us ON us.row_id = assigned_to_id::text
//             LEFT JOIN ${schema}.departments dept2 ON us.deptid = dept2.row_id
//             LEFT JOIN ${schema}.users us2 ON ta.completed_by = us2.row_id
//             LEFT JOIN ${schema}.recurring_task rt ON ta.recurringid = rt.row_id
//             WHERE ${whereClauses.join(" AND ")}
//               AND us.activestatus = 0
//            GROUP BY ta.row_id, ta.checklist, us1.name, dept.department_name,
// us2.name, rt.schedule_details, rt.row_id, us1.role, us1.deptid

//             ORDER BY ta.cr_on DESC
//             LIMIT $${params.length - 1} OFFSET $${params.length};
//         `;
//         // console.log("role",role)

//         if (role === 1 || role === 3 || role ===2) {
//             const resp = await db_query.customQuery(query, "Tasks Fetched", params);
//             console.log("response---->",resp.data)
//             libFunc.sendResponse(res, resp);
//         } else {
//             libFunc.sendResponse(res, { status: 1, msg: "You are not admin" });
//         }

//     } catch (err) {
//         console.error("Error in fetchTasks:", err);
//         libFunc.sendResponse(res, { status: 0, msg: "Error fetching tasks" });
//     }
// }

// v5 dupicate problem
// async function fetchTasks(req, res) {
//     // console.log("req",req)
//     try {
//         //  Read data from request
//         const userid = req.data.userId;
//         const organizationid = req.data.orgId;
//         const role = req.data.user_role; // 0 = normal, 1 = admin
//         const statusFilter = req.data.status; // ongoing, complete, overdue
//         const filters = req.data.filters || {}; // optional filters object
//         const userDeptId = req.data.depId;

//         const completion_startDate = req.data.completion_startDate;
//         const completion_endDate = req.data.completion_endDate;
//         const task_completed_on_startDate = req.data.task_completed_on_startDate;
//         const task_completed_on_endDate = req.data.task_completed_on_endDate;

//         //  Pagination
//         const limit = req.data.limit || 100;
//         const page = req.data.page || 1;
//         const offset = (page - 1) * limit;

//         // Base query
//         let params = [organizationid];
//         let whereClauses = ["ta.organizationid = $1"];

//         // show only ongoing tasks IF user did not send status filtert ,  If no status selected → Show ongoing tasks.
//         if (!statusFilter) {
//             whereClauses.push("ta.active_status = 0");
//         }

//         //  Status filter (ongoing / complete / overdue)
//         let active_status;
//         if (statusFilter) {
//             const active_status_map = { ongoing: 0, complete: 1, overdue: 2 };
//             active_status = active_status_map[statusFilter.toLowerCase()];
//             if (active_status !== undefined) {
//                 params.push(active_status);
//                 whereClauses.push(`ta.active_status = $${params.length}`);
//             }
//         }

//         // Completion Date Filters (Outside)
//         if (completion_startDate) {
//             params.push(completion_startDate);
//             whereClauses.push(`ta.completion_date >= $${params.length}`);
//         }
//         if (completion_endDate) {
//             params.push(completion_endDate);
//             whereClauses.push(`ta.completion_date <= $${params.length}`);
//         }

//         // Completion Date Filters (Inside filters object)
//         if (filters.completion_startDate) {
//             params.push(filters.completion_startDate);
//             whereClauses.push(`ta.completion_date >= $${params.length}`);
//         }
//         if (filters.completion_endDate) {
//             params.push(filters.completion_endDate);
//             whereClauses.push(`ta.completion_date <= $${params.length}`);
//         }

//         // CompletedOn Date Filters — apply only for completed tasks
//         if (active_status === 1 || statusFilter?.toLowerCase() === "complete") {
//             if (filters.task_completed_on_startDate) {
//                 params.push(filters.task_completed_on_startDate);
//                 whereClauses.push(`ta.completedon >= $${params.length}`);
//             }
//             if (filters.task_completed_on_endDate) {
//                 params.push(filters.task_completed_on_endDate);
//                 whereClauses.push(`ta.completedon <= $${params.length}`);
//             }
//         }

//         // Department Filter
//         if (filters.department_id?.length) {
//             params.push(filters.department_id);
//             whereClauses.push(`us1.deptid = ANY($${params.length})`);
//         }

//         // Assigned To Filter
//         if (filters.assigned_to?.length) {
//             params.push(filters.assigned_to);
//             whereClauses.push(`assigned_to_id::text = ANY($${params.length})`);
//         }

//         // Assigned By Filter
//         if (filters.assigned_by?.length) {
//             params.push(filters.assigned_by);
//             whereClauses.push(`ta.assigned_by = ANY($${params.length})`);
//         }

//         // Task Type (Normal / Recurring)
//         if (filters.type) {
//             params.push(filters.type.toLowerCase() === "normal" ? '0' : '1');
//             whereClauses.push(`ta.task_type = $${params.length}`);
//         }

//         // Frequency Filter
//         if (filters.frequency) {
//             params.push(filters.frequency);
//             whereClauses.push(`rt.schedule_details->>'type' = $${params.length}`);
//         }

//         //  Department Admin Access Control
//         if (role === 2) {
//             params.push(userDeptId);
//             whereClauses.push(`
//                 (
//                     us1.deptid = $${params.length}
//                     OR assigned_to_id IN (
//                         SELECT row_id FROM ${schema}.users WHERE deptid = $${params.length}
//                     )
//                 )
//             `);
//         }

// if (filters.outgoing === true) {
//     params.push(userDeptId);
//     whereClauses.push(`
//         (
//             -- OUTGOING (A → B)
//             us1.deptid = $${params.length}

//             OR

//             -- INCOMING (B → A)
//             us1.deptid <> $${params.length}

//             OR

//             -- INTERNAL (A → A)
//             us1.deptid = $${params.length}
//         )
//     `);
// }

// if (filters.outgoing === false) {
//     params.push(userDeptId);
//     whereClauses.push(`
//         NOT (
//             us1.deptid = $${params.length}
//             AND us.deptid <> $${params.length}
//         )
//     `);
// }

//   const outgoingDeptParamIndex = params.push(userDeptId);
//         // Pagination
//         params.push(limit);
//         params.push(offset);

//         //  Final Query with active user condition
//         const query = `
//             SELECT
//                 ta.row_id,
//                 ta.title,
//                 ta.description,
//                 ta.checklist,
//                 ta.completion_date,
//                 ta.completedon,
//                 us1.name AS created_by,
//                 CASE
//                    WHEN dept.department_name IS NULL THEN
//                        CASE us1.role
//                           WHEN 3 THEN 'Top Management'
//                           WHEN 1 THEN 'Admin'
//                           ELSE 'Unknown'
//                         END
//                     ELSE dept.department_name
//                   END AS created_by_department,
//                 ta.cr_on AS created_at,
//                 json_agg(us.name) AS assigned_to,
//                 json_agg(
//     json_build_object(
//         'user_id', us.row_id,
//         'name', us.name,
//         'department',
//             CASE
//                 WHEN dept2.department_name IS NULL THEN
//                     CASE us.role
//                         WHEN 3 THEN 'Top Management'
//                         WHEN 1 THEN 'Admin'
//                         ELSE 'Owner'
//                     END
//                 ELSE dept2.department_name
//             END
//     )
// ) AS assigned_to_details,
//                 CASE
//                     WHEN ta.active_status = 0 THEN 'ongoing'
//                     WHEN ta.active_status = 1 THEN 'complete'
//                     WHEN ta.active_status = 2 THEN 'overdue'
//                 END AS status,
//                 CASE
//                     WHEN ta.task_type = '0' THEN 'Normal'
//                     WHEN ta.task_type = '1' THEN 'Recurring'
//                 END AS task_type_title,
//                 CASE
//                     WHEN ta.active_status = 1 AND ta.completion_date < CURRENT_DATE
//                         THEN ABS(ta.up_on::date - ta.completion_date)
//                     WHEN ta.completion_date >= CURRENT_DATE
//                         THEN (ta.completion_date - CURRENT_DATE)
//                     ELSE ABS(ta.completion_date - CURRENT_DATE)
//                 END AS due_days,
//                 CASE
//                     WHEN ta.completion_date >= CURRENT_DATE
//                         THEN 'due_in'
//                     ELSE 'overdue_by'
//                 END AS due_label,
//                 us2.name AS updated_by,

//                 CASE
//     WHEN us1.deptid = $${outgoingDeptParamIndex}
//          AND us.deptid <> $${outgoingDeptParamIndex}
//     THEN true    -- A → B (Outgoing)
//     ELSE false   -- B → A (Incoming) or A → A (Internal)
// END AS is_outgoing,

//                 ta.task_type,
//                 rt.row_id as recurring_task_id,
//                 rt.schedule_details->>'type' AS schedule_type,
//                 rt.schedule_details->>'reminder_list' AS reminder_list
//             FROM ${schema}.tasks ta
//             INNER JOIN ${schema}.users us1 ON ta.assigned_by = us1.row_id
//             LEFT JOIN ${schema}.departments dept ON us1.deptid = dept.row_id
//             INNER JOIN LATERAL jsonb_array_elements_text(ta.assigned_to) AS assigned_to_id ON TRUE
//             INNER JOIN ${schema}.users us ON us.row_id = assigned_to_id::text
//             LEFT JOIN ${schema}.departments dept2 ON us.deptid = dept2.row_id
//             LEFT JOIN ${schema}.users us2 ON ta.completed_by = us2.row_id
//             LEFT JOIN ${schema}.recurring_task rt ON ta.recurringid = rt.row_id
//             WHERE ${whereClauses.join(" AND ")}
//               AND us.activestatus = 0
//           GROUP BY
//     ta.row_id,
//     ta.checklist,
//     us1.name,
//     dept.department_name,
//     us2.name,
//     rt.schedule_details,
//     rt.row_id,
//     us1.role,
//     us1.deptid,
//     us.deptid

//             ORDER BY ta.cr_on DESC
//             LIMIT $${params.length - 1} OFFSET $${params.length};
//         `;
//         // console.log("role",role)

//         if (role === 1 || role === 3 || role ===2) {
//             const resp = await db_query.customQuery(query, "Tasks Fetched", params);
//             console.log("response---->",resp.data)
//             libFunc.sendResponse(res, resp);
//         } else {
//             libFunc.sendResponse(res, { status: 1, msg: "You are not admin" });
//         }

//     } catch (err) {
//         console.error("Error in fetchTasks:", err);
//         libFunc.sendResponse(res, { status: 0, msg: "Error fetching tasks" });
//     }
// }

// v6 admin not include
// async function fetchTasks(req, res) {
//     // console.log("req",req)
//     try {
//         //  Read data from request
//         const userid = req.data.userId;
//         const organizationid = req.data.orgId;
//         const role = req.data.user_role; // 0 = normal, 1 = admin
//         const statusFilter = req.data.status; // ongoing, complete, overdue
//         const filters = req.data.filters || {}; // optional filters object
//         const userDeptId = req.data.depId;

//         const completion_startDate = req.data.completion_startDate;
//         const completion_endDate = req.data.completion_endDate;
//         const task_completed_on_startDate = req.data.task_completed_on_startDate;
//         const task_completed_on_endDate = req.data.task_completed_on_endDate;

//         //  Pagination
//         const limit = req.data.limit || 100;
//         const page = req.data.page || 1;
//         const offset = (page - 1) * limit;

//         // Base query
//         let params = [organizationid];
//         let whereClauses = ["ta.organizationid = $1"];

//         // show only ongoing tasks IF user did not send status filtert ,  If no status selected → Show ongoing tasks.
//         if (!statusFilter) {
//             whereClauses.push("ta.active_status = 0");
//         }

//         //  Status filter (ongoing / complete / overdue)
//         let active_status;
//         if (statusFilter) {
//             const active_status_map = { ongoing: 0, complete: 1, overdue: 2 };
//             active_status = active_status_map[statusFilter.toLowerCase()];
//             if (active_status !== undefined) {
//                 params.push(active_status);
//                 whereClauses.push(`ta.active_status = $${params.length}`);
//             }
//         }

//         // Completion Date Filters (Outside)
//         if (completion_startDate) {
//             params.push(completion_startDate);
//             whereClauses.push(`ta.completion_date >= $${params.length}`);
//         }
//         if (completion_endDate) {
//             params.push(completion_endDate);
//             whereClauses.push(`ta.completion_date <= $${params.length}`);
//         }

//         // Completion Date Filters (Inside filters object)
//         if (filters.completion_startDate) {
//             params.push(filters.completion_startDate);
//             whereClauses.push(`ta.completion_date >= $${params.length}`);
//         }
//         if (filters.completion_endDate) {
//             params.push(filters.completion_endDate);
//             whereClauses.push(`ta.completion_date <= $${params.length}`);
//         }

//         // CompletedOn Date Filters — apply only for completed tasks
//         if (active_status === 1 || statusFilter?.toLowerCase() === "complete") {
//             if (filters.task_completed_on_startDate) {
//                 params.push(filters.task_completed_on_startDate);
//                 whereClauses.push(`ta.completedon >= $${params.length}`);
//             }
//             if (filters.task_completed_on_endDate) {
//                 params.push(filters.task_completed_on_endDate);
//                 whereClauses.push(`ta.completedon <= $${params.length}`);
//             }
//         }

//         // Department Filter
//         if (filters.department_id?.length) {
//             params.push(filters.department_id);
//             whereClauses.push(`us1.deptid = ANY($${params.length})`);
//         }

//         // Assigned To Filter
//         if (filters.assigned_to?.length) {
//             params.push(filters.assigned_to);
//             whereClauses.push(`assigned_to_id::text = ANY($${params.length})`);
//         }

//         // Assigned By Filter
//         if (filters.assigned_by?.length) {
//             params.push(filters.assigned_by);
//             whereClauses.push(`ta.assigned_by = ANY($${params.length})`);
//         }

//         // Task Type (Normal / Recurring)
//         if (filters.type) {
//             params.push(filters.type.toLowerCase() === "normal" ? '0' : '1');
//             whereClauses.push(`ta.task_type = $${params.length}`);
//         }

//         // Frequency Filter
//         if (filters.frequency) {
//             params.push(filters.frequency);
//             whereClauses.push(`rt.schedule_details->>'type' = $${params.length}`);
//         }

//         //  Department Admin Access Control
//         if (role === 2) {
//             params.push(userDeptId);
//             whereClauses.push(`
//                 (
//                     us1.deptid = $${params.length}
//                     OR assigned_to_id IN (
//                         SELECT row_id FROM ${schema}.users WHERE deptid = $${params.length}
//                     )
//                 )
//             `);
//         }

// if (filters.outgoing === true) {
//     params.push(userDeptId);
//     whereClauses.push(`
//         (
//             -- OUTGOING (A → B)
//             us1.deptid = $${params.length}

//             OR

//             -- INCOMING (B → A)
//             us1.deptid <> $${params.length}

//             OR

//             -- INTERNAL (A → A)
//             us1.deptid = $${params.length}
//         )
//     `);
// }

// if (filters.outgoing === false) {
//     params.push(userDeptId);
//     whereClauses.push(`
//         NOT (
//             us1.deptid = $${params.length}
//             AND us.deptid <> $${params.length}
//         )
//     `);
// }

//   const outgoingDeptParamIndex = params.push(userDeptId);
//         // Pagination
//         params.push(limit);
//         params.push(offset);

//         //  Final Query with active user condition
//         const query = `
//             SELECT
//                 ta.row_id,
//                 ta.title,
//                 ta.description,
//                 ta.checklist,
//                 ta.completion_date,
//                 ta.completedon,
//                 us1.name AS created_by,
//                 CASE
//                    WHEN dept.department_name IS NULL THEN
//                        CASE us1.role
//                           WHEN 3 THEN 'Top Management'
//                           WHEN 1 THEN 'Admin'
//                           ELSE 'Unknown'
//                         END
//                     ELSE dept.department_name
//                   END AS created_by_department,
//                 ta.cr_on AS created_at,
//                 json_agg(DISTINCT us.name) AS assigned_to,
//                json_agg(
//     DISTINCT jsonb_build_object(
//         'user_id', us.row_id,
//         'name', us.name,
//         'department',
//             CASE
//                 WHEN dept2.department_name IS NULL THEN
//                     CASE us.role
//                         WHEN 3 THEN 'Top Management'
//                         WHEN 1 THEN 'Admin'
//                         ELSE 'Owner'
//                     END
//                 ELSE dept2.department_name
//             END
//     )
// ) AS assigned_to_details,
//                 CASE
//                     WHEN ta.active_status = 0 THEN 'ongoing'
//                     WHEN ta.active_status = 1 THEN 'complete'
//                     WHEN ta.active_status = 2 THEN 'overdue'
//                 END AS status,
//                 CASE
//                     WHEN ta.task_type = '0' THEN 'Normal'
//                     WHEN ta.task_type = '1' THEN 'Recurring'
//                 END AS task_type_title,
//                 CASE
//                     WHEN ta.active_status = 1 AND ta.completion_date < CURRENT_DATE
//                         THEN ABS(ta.up_on::date - ta.completion_date)
//                     WHEN ta.completion_date >= CURRENT_DATE
//                         THEN (ta.completion_date - CURRENT_DATE)
//                     ELSE ABS(ta.completion_date - CURRENT_DATE)
//                 END AS due_days,
//                 CASE
//                     WHEN ta.completion_date >= CURRENT_DATE
//                         THEN 'due_in'
//                     ELSE 'overdue_by'
//                 END AS due_label,
//                 us2.name AS updated_by,

//               CASE
//     WHEN us1.deptid = $${outgoingDeptParamIndex}
//          AND EXISTS (
//              SELECT 1
//              FROM jsonb_array_elements_text(ta.assigned_to) x
//              JOIN ${schema}.users u ON u.row_id = x::text
//              WHERE u.deptid <> $${outgoingDeptParamIndex}
//          )
//     THEN true
//     ELSE false
// END AS is_outgoing,

//                 ta.task_type,
//                 rt.row_id as recurring_task_id,
//                 rt.schedule_details->>'type' AS schedule_type,
//                 rt.schedule_details->>'reminder_list' AS reminder_list
//             FROM ${schema}.tasks ta
//             INNER JOIN ${schema}.users us1 ON ta.assigned_by = us1.row_id
//             LEFT JOIN ${schema}.departments dept ON us1.deptid = dept.row_id
//             INNER JOIN LATERAL jsonb_array_elements_text(ta.assigned_to) AS assigned_to_id ON TRUE
//             INNER JOIN ${schema}.users us ON us.row_id = assigned_to_id::text
//             LEFT JOIN ${schema}.departments dept2 ON us.deptid = dept2.row_id
//             LEFT JOIN ${schema}.users us2 ON ta.completed_by = us2.row_id
//             LEFT JOIN ${schema}.recurring_task rt ON ta.recurringid = rt.row_id
//             WHERE ${whereClauses.join(" AND ")}
//               AND us.activestatus = 0
//           GROUP BY
//     ta.row_id,
//     ta.checklist,
//     us1.name,
//     dept.department_name,
//     us2.name,
//     rt.schedule_details,
//     rt.row_id,
//     us1.role,
//     us1.deptid,
//     us.deptid

//             ORDER BY ta.cr_on DESC
//             LIMIT $${params.length - 1} OFFSET $${params.length};
//         `;
//         // console.log("role",role)

//         if (role === 1 || role === 3 || role ===2) {
//             const resp = await db_query.customQuery(query, "Tasks Fetched", params);
//             console.log("response---->",resp.data)
//             libFunc.sendResponse(res, resp);
//         } else {
//             libFunc.sendResponse(res, { status: 1, msg: "You are not admin" });
//         }

//     } catch (err) {
//         console.error("Error in fetchTasks:", err);
//         libFunc.sendResponse(res, { status: 0, msg: "Error fetching tasks" });
//     }
// }

function Dateformatechange(d) {
  const date = new Date(d);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Months are 0-indexed
  const day = date.getDate().toString().padStart(2, "0");

  const customFormattedDate = `${day}/${month}/${year}`;

  // console.log(customFormattedDate);
  return customFormattedDate;
}

// async function fetchTasks(req, res) {
//     // console.log("req",req)
//     try {
//         //  Read data from request
//         const userid = req.data.userId;
//         const organizationid = req.data.orgId;
//         const role = req.data.user_role; // 0 = normal, 1 = admin
//         const statusFilter = req.data.status; // ongoing, complete, overdue
//         const filters = req.data.filters || {}; // optional filters object
//         const userDeptId = req.data.depId;

//         const completion_startDate = req.data.completion_startDate;
//         const completion_endDate = req.data.completion_endDate;
//         const task_completed_on_startDate = req.data.task_completed_on_startDate;
//         const task_completed_on_endDate = req.data.task_completed_on_endDate;

//         //  Pagination
//         const limit = req.data.limit || 100;
//         const page = req.data.page || 1;
//         const offset = (page - 1) * limit;

//         // Base query
//         let params = [organizationid];
//         let whereClauses = ["ta.organizationid = $1"];

//         // show only ongoing tasks IF user did not send status filtert ,  If no status selected → Show ongoing tasks.
//         if (!statusFilter) {
//             whereClauses.push("ta.active_status = 0");
//         }

//         //  Status filter (ongoing / complete / overdue)
//         let active_status;
//         if (statusFilter) {
//             const active_status_map = { ongoing: 0, complete: 1, overdue: 2 };
//             active_status = active_status_map[statusFilter.toLowerCase()];
//             if (active_status !== undefined) {
//                 params.push(active_status);
//                 whereClauses.push(`ta.active_status = $${params.length}`);
//             }
//         }

//         // Completion Date Filters (Outside)
//         if (completion_startDate) {
//             params.push(completion_startDate);
//             whereClauses.push(`ta.completion_date >= $${params.length}`);
//         }
//         if (completion_endDate) {
//             params.push(completion_endDate);
//             whereClauses.push(`ta.completion_date <= $${params.length}`);
//         }

//         // Completion Date Filters (Inside filters object)
//         if (filters.completion_startDate) {
//             params.push(filters.completion_startDate);
//             whereClauses.push(`ta.completion_date >= $${params.length}`);
//         }
//         if (filters.completion_endDate) {
//             params.push(filters.completion_endDate);
//             whereClauses.push(`ta.completion_date <= $${params.length}`);
//         }

//         // CompletedOn Date Filters — apply only for completed tasks
//         if (active_status === 1 || statusFilter?.toLowerCase() === "complete") {
//             if (filters.task_completed_on_startDate) {
//                 params.push(filters.task_completed_on_startDate);
//                 whereClauses.push(`ta.completedon >= $${params.length}`);
//             }
//             if (filters.task_completed_on_endDate) {
//                 params.push(filters.task_completed_on_endDate);
//                 whereClauses.push(`ta.completedon <= $${params.length}`);
//             }
//         }

//         // Department Filter
//         if (filters.department_id?.length) {
//             params.push(filters.department_id);
//             whereClauses.push(`us1.deptid = ANY($${params.length})`);
//         }

//         // Assigned To Filter
//         if (filters.assigned_to?.length) {
//             params.push(filters.assigned_to);
//             whereClauses.push(`assigned_to_id::text = ANY($${params.length})`);
//         }

//         // Assigned By Filter
//         if (filters.assigned_by?.length) {
//             params.push(filters.assigned_by);
//             whereClauses.push(`ta.assigned_by = ANY($${params.length})`);
//         }

//         // Task Type (Normal / Recurring)
//         if (filters.type) {
//             params.push(filters.type.toLowerCase() === "normal" ? '0' : '1');
//             whereClauses.push(`ta.task_type = $${params.length}`);
//         }

//         // Frequency Filter
//         if (filters.frequency) {
//             params.push(filters.frequency);
//             whereClauses.push(`rt.schedule_details->>'type' = $${params.length}`);
//         }

//         //  Department Admin Access Control
//         if (role === 2) {
//             params.push(userDeptId);
//             whereClauses.push(`
//                 (
//                     us1.deptid = $${params.length}
//                     OR assigned_to_id IN (
//                         SELECT row_id FROM ${schema}.users WHERE deptid = $${params.length}
//                     )
//                 )
//             `);
//         }

// if (filters.outgoing === true) {

//     // If admin has NO department → show all tasks
//     if (!userDeptId) {
//         whereClauses.push(`1=1`); // no filter
//     } else {
//         params.push(userDeptId);
//         whereClauses.push(`
//             (
//                 -- OUTGOING (A → B)
//                 us1.deptid = $${params.length}

//                 OR

//                 -- INCOMING (B → A)
//                 us.deptid = $${params.length}

//                 OR

//                 -- INTERNAL (A → A)
//                 us1.deptid = $${params.length}
//             )
//         `);
//     }
// }

// if (filters.outgoing === false) {
//     params.push(userDeptId);
//     whereClauses.push(`
//         NOT (
//             us1.deptid = $${params.length}
//             AND us.deptid <> $${params.length}
//         )
//     `);
// }

// //   const outgoingDeptParamIndex = params.push(userDeptId);
//         // Pagination
//         params.push(limit);
//         params.push(offset);

//         //  Final Query with active user condition
//         const query = `
//             SELECT
//                 ta.row_id,
//                 ta.title,
//                 ta.description,
//                 ta.checklist,
//                 ta.completion_date,
//                 ta.completedon,
//                 us1.name AS created_by,
//                 CASE
//                    WHEN dept.department_name IS NULL THEN
//                        CASE us1.role
//                           WHEN 3 THEN 'Top Management'
//                           WHEN 1 THEN 'Admin'
//                           ELSE 'Unknown'
//                         END
//                     ELSE dept.department_name
//                   END AS created_by_department,
//                 ta.cr_on AS created_at,
//                 json_agg(DISTINCT us.name) AS assigned_to,
//                json_agg(
//     DISTINCT jsonb_build_object(
//         'user_id', us.row_id,
//         'name', us.name,
//         'department',
//             CASE
//                 WHEN dept2.department_name IS NULL THEN
//                     CASE us.role
//                         WHEN 3 THEN 'Top Management'
//                         WHEN 1 THEN 'Admin'
//                         ELSE 'Owner'
//                     END
//                 ELSE dept2.department_name
//             END
//     )
// ) AS assigned_to_details,
//                 CASE
//                     WHEN ta.active_status = 0 THEN 'ongoing'
//                     WHEN ta.active_status = 1 THEN 'complete'
//                     WHEN ta.active_status = 2 THEN 'overdue'
//                 END AS status,
//                 CASE
//                     WHEN ta.task_type = '0' THEN 'Normal'
//                     WHEN ta.task_type = '1' THEN 'Recurring'
//                 END AS task_type_title,
//                 CASE
//                     WHEN ta.active_status = 1 AND ta.completion_date < CURRENT_DATE
//                         THEN ABS(ta.up_on::date - ta.completion_date)
//                     WHEN ta.completion_date >= CURRENT_DATE
//                         THEN (ta.completion_date - CURRENT_DATE)
//                     ELSE ABS(ta.completion_date - CURRENT_DATE)
//                 END AS due_days,
//                 CASE
//                     WHEN ta.completion_date >= CURRENT_DATE
//                         THEN 'due_in'
//                     ELSE 'overdue_by'
//                 END AS due_label,
//                 us2.name AS updated_by,

//  CASE

//     WHEN us1.deptid IS NOT NULL
//          AND EXISTS (
//              SELECT 1
//              FROM jsonb_array_elements_text(ta.assigned_to) AS x
//              JOIN ${schema}.users u
//                   ON u.row_id = x::text
//              WHERE u.deptid IS NOT NULL
//                AND u.deptid <> us1.deptid     -- other department
//          )
//     THEN TRUE

//     WHEN us1.deptid IS NOT NULL
//          AND EXISTS (
//              SELECT 1
//              FROM jsonb_array_elements_text(ta.assigned_to) AS x
//              JOIN ${schema}.users u
//                   ON u.row_id = x::text
//              WHERE u.role = 1                 -- assigned to admin
//          )
//     THEN TRUE

//     ELSE FALSE
// END AS is_outgoing,

//                 ta.task_type,
//                 rt.row_id as recurring_task_id,
//                 rt.schedule_details->>'type' AS schedule_type,
//                 rt.schedule_details->>'reminder_list' AS reminder_list
//             FROM ${schema}.tasks ta
//             INNER JOIN ${schema}.users us1 ON ta.assigned_by = us1.row_id
//             LEFT JOIN ${schema}.departments dept ON us1.deptid = dept.row_id
//             INNER JOIN LATERAL jsonb_array_elements_text(ta.assigned_to) AS assigned_to_id ON TRUE
//             INNER JOIN ${schema}.users us ON us.row_id = assigned_to_id::text
//             LEFT JOIN ${schema}.departments dept2 ON us.deptid = dept2.row_id
//             LEFT JOIN ${schema}.users us2 ON ta.completed_by = us2.row_id
//             LEFT JOIN ${schema}.recurring_task rt ON ta.recurringid = rt.row_id
//             WHERE ${whereClauses.join(" AND ")}
//               AND us.activestatus = 0
//           GROUP BY
//     ta.row_id,
//     ta.checklist,
//     us1.name,
//     dept.department_name,
//     us2.name,
//     rt.schedule_details,
//     rt.row_id,
//     us1.role,
//     us1.deptid

//             ORDER BY ta.cr_on DESC
//             LIMIT $${params.length - 1} OFFSET $${params.length};
//         `;
//         // console.log("role",role)

//         if (role === 1 || role === 3 || role ===2) {
//             const resp = await db_query.customQuery(query, "Tasks Fetched", params);
//             console.log("response---->",resp.data)
//             libFunc.sendResponse(res, resp);
//         } else {
//             libFunc.sendResponse(res, { status: 1, msg: "You are not admin" });
//         }

//     } catch (err) {
//         console.error("Error in fetchTasks:", err);
//         libFunc.sendResponse(res, { status: 0, msg: "Error fetching tasks" });
//     }
// }

async function fetchTasks(req, res) {
  try {
    const userid = req.data.userId;
    const organizationid = req.data.orgId;
    const role = req.data.user_role;
    const statusFilter = req.data.status;
    const filters = req.data.filters || {};
    const userDeptId = req.data.depId;

    const completion_startDate = req.data.completion_startDate;
    const completion_endDate = req.data.completion_endDate;

    const limit = req.data.limit || 100;
    const page = req.data.page || 1;
    const offset = (page - 1) * limit;

    let params = [organizationid];
    let whereClauses = ["ta.organizationid = $1"];

    // -----------------------------------------
    // STATUS FILTER
    // -----------------------------------------
    if (!statusFilter) whereClauses.push("ta.active_status = 0");

    let active_status;
    if (statusFilter) {
      const map = { ongoing: 0, complete: 1, overdue: 2 };
      active_status = map[statusFilter.toLowerCase()];
      if (active_status !== undefined) {
        params.push(active_status);
        whereClauses.push(`ta.active_status = $${params.length}`);
      }
    }

    // -----------------------------------------
    // COMPLETION DATE RANGE
    // -----------------------------------------
    if (completion_startDate) {
      params.push(completion_startDate);
      whereClauses.push(`ta.completion_date >= $${params.length}`);
    }
    if (completion_endDate) {
      params.push(completion_endDate);
      whereClauses.push(`ta.completion_date <= $${params.length}`);
    }

    if (filters.completion_startDate) {
      params.push(filters.completion_startDate);
      whereClauses.push(`ta.completion_date >= $${params.length}`);
    }
    if (filters.completion_endDate) {
      params.push(filters.completion_endDate);
      whereClauses.push(`ta.completion_date <= $${params.length}`);
    }

    // -----------------------------------------
    // COMPLETED ON (for completed tasks only)
    // -----------------------------------------
    if (active_status === 1) {
      if (filters.task_completed_on_startDate) {
        params.push(filters.task_completed_on_startDate);
        whereClauses.push(`ta.completedon >= $${params.length}`);
      }
      if (filters.task_completed_on_endDate) {
        params.push(filters.task_completed_on_endDate);
        whereClauses.push(`ta.completedon <= $${params.length}`);
      }
    }

    // -----------------------------------------
    // DEFAULT: PUSH userDeptId ONCE
    // -----------------------------------------
    let userDeptIdx = null;
    if (userDeptId) {
      params.push(userDeptId);
      userDeptIdx = params.length; // <-- IMPORTANT
    }

    // -----------------------------------------
    // DEPARTMENT FILTER
    // -----------------------------------------
    if (filters.department_id?.length) {
      params.push(filters.department_id);
      whereClauses.push(`us1.deptid = ANY($${params.length})`);
    }

    // ASSIGNED TO
    if (filters.assigned_to?.length) {
      params.push(filters.assigned_to);
      whereClauses.push(`assigned_to_id::text = ANY($${params.length})`);
    }

    // ASSIGNED BY
    if (filters.assigned_by?.length) {
      params.push(filters.assigned_by);
      whereClauses.push(`ta.assigned_by = ANY($${params.length})`);
    }

    // TASK TYPE
    if (filters.type) {
      params.push(filters.type.toLowerCase() === "normal" ? "0" : "1");
      whereClauses.push(`ta.task_type = $${params.length}`);
    }

    // FREQUENCY
    if (filters.frequency) {
      params.push(filters.frequency);
      whereClauses.push(`rt.schedule_details->>'type' = $${params.length}`);
    }

    // -----------------------------------------
    // ADMIN (role=2) FILTER → USE SAME PARAM INDEX
    // -----------------------------------------
    if (role === 2 && userDeptIdx) {
      whereClauses.push(`
                (
                    us1.deptid = $${userDeptIdx}
                    OR assigned_to_id IN (
                        SELECT row_id 
                        FROM ${schema}.users 
                        WHERE deptid = $${userDeptIdx}
                    )
                )
            `);
    }

    // -----------------------------------------
    // OUTGOING FILTER (frontend toggle)
    // -----------------------------------------
    if (filters.outgoing === true) {
      if (!userDeptId) {
        whereClauses.push(`1=1`);
      } else {
        whereClauses.push(`
                    (
                        us1.deptid = $${userDeptIdx}   -- Outgoing A→B
                        OR us.deptid = $${userDeptIdx} -- Incoming B→A
                        OR us1.deptid = $${userDeptIdx} -- Internal A→A
                    )
                `);
      }
    }

    if (filters.outgoing === false && userDeptIdx) {
      whereClauses.push(`
                NOT (
                    us1.deptid = $${userDeptIdx}
                    AND us.deptid <> $${userDeptIdx}
                )
            `);
    }

    // -----------------------------------------
    // PAGINATION PARAMS
    // -----------------------------------------
    params.push(limit);
    params.push(offset);

    // -----------------------------------------
    // FINAL QUERY
    // -----------------------------------------
    const query = `
            SELECT
                ta.row_id,
                ta.title,
                ta.description,
                ta.checklist,
                ta.completion_date,
                ta.completedon,
                us1.name AS created_by,

                CASE 
                    WHEN dept.department_name IS NULL THEN 
                        CASE us1.role WHEN 3 THEN 'Top Management'
                                      WHEN 1 THEN 'Admin'
                                      ELSE 'Unknown'
                        END
                    ELSE dept.department_name
                END AS created_by_department,

                ta.cr_on AS created_at,

                json_agg(DISTINCT us.name) AS assigned_to,

                json_agg(DISTINCT jsonb_build_object(
                    'user_id', us.row_id,
                    'name', us.name,
                    'department',
                        CASE 
                            WHEN dept2.department_name IS NULL THEN 
                                CASE us.role 
                                    WHEN 3 THEN 'Top Management'
                                    WHEN 1 THEN 'Admin'
                                    ELSE 'Owner'
                                END
                            ELSE dept2.department_name
                        END
                )) AS assigned_to_details,

                CASE
                    WHEN ta.active_status = 0 THEN 'ongoing'
                    WHEN ta.active_status = 1 THEN 'complete'
                    WHEN ta.active_status = 2 THEN 'overdue'
                END AS status,

                CASE WHEN ta.task_type = '0' THEN 'Normal' ELSE 'Recurring' END AS task_type_title,

                CASE
                    WHEN ta.completion_date >= CURRENT_DATE THEN (ta.completion_date - CURRENT_DATE)
                    ELSE ABS(ta.completion_date - CURRENT_DATE)
                END AS due_days,

                CASE 
                    WHEN ta.completion_date >= CURRENT_DATE THEN 'due_in'
                    ELSE 'overdue_by'
                END AS due_label,

                us2.name AS updated_by,

                /* ------------------------------------------
                   CORRECT OUTGOING LOGIC
                ------------------------------------------ */
                CASE
                    WHEN ${
                      userDeptIdx ? `us1.deptid = $${userDeptIdx}` : `FALSE`
                    }
                        AND EXISTS (
                            SELECT 1
                            FROM jsonb_array_elements_text(ta.assigned_to) AS x
                            JOIN ${schema}.users u ON u.row_id = x::text
                            WHERE u.deptid IS NOT NULL
                              AND u.deptid <> ${
                                userDeptIdx ? `$${userDeptIdx}` : `NULL`
                              }
                        )
                    THEN TRUE

                    WHEN ${
                      userDeptIdx ? `us1.deptid = $${userDeptIdx}` : `FALSE`
                    }
                        AND EXISTS (
                            SELECT 1
                            FROM jsonb_array_elements_text(ta.assigned_to) AS x
                            JOIN ${schema}.users u ON u.row_id = x::text
                            WHERE u.role = 1
                        )
                    THEN TRUE

                    ELSE FALSE
                END AS is_outgoing,

                ta.task_type,
                rt.row_id AS recurring_task_id,
                rt.schedule_details->>'type' AS schedule_type,
                rt.schedule_details->>'reminder_list' AS reminder_list

            FROM ${schema}.tasks ta
            INNER JOIN ${schema}.users us1 ON ta.assigned_by = us1.row_id
            LEFT JOIN ${schema}.departments dept ON us1.deptid = dept.row_id
            INNER JOIN LATERAL jsonb_array_elements_text(ta.assigned_to) AS assigned_to_id ON TRUE
            INNER JOIN ${schema}.users us ON us.row_id = assigned_to_id::text
            LEFT JOIN ${schema}.departments dept2 ON us.deptid = dept2.row_id
            LEFT JOIN ${schema}.users us2 ON ta.completed_by = us2.row_id
            LEFT JOIN ${schema}.recurring_task rt ON ta.recurringid = rt.row_id
            WHERE ${whereClauses.join(" AND ")}
              AND us.activestatus = 0
            GROUP BY 
                ta.row_id,
                ta.checklist,
                us1.name,
                dept.department_name,
                us2.name,
                rt.schedule_details,
                rt.row_id,
                us1.role,
                us1.deptid
            ORDER BY ta.cr_on DESC
            LIMIT $${params.length - 1} OFFSET $${params.length};
        `;

    if (role === 1 || role === 3 || role === 2) {
      const resp = await db_query.customQuery(query, "Tasks Fetched", params);
      console.log("resposne--", resp.data);
      libFunc.sendResponse(res, resp);
    } else {
      libFunc.sendResponse(res, { status: 1, msg: "You are not admin" });
    }
  } catch (err) {
    console.error("Error in fetchTasks:", err);
    libFunc.sendResponse(res, { status: 0, msg: "Error fetching tasks" });
  }
}

async function exportTasksToExcel(req, res) {
  // console.log("coomon url")
  try {
    const organizationid = req.data.orgId;
    const role = req.data.user_role;
    const statusFilter = req.data.status;
    const filters = req.data.filters || {};
    const completion_startDate = req.data.completion_startDate;
    const completion_endDate = req.data.completion_endDate;
    const task_completed_on_startDate = req.data.task_completed_on_startDate;
    const task_completed_on_endDate = req.data.task_completed_on_endDate;
    const userDeptId = req.data.depId;

    let params = [organizationid];
    let whereClauses = ["ta.organizationid = $1"];

    //  Status filter
    if (!statusFilter) whereClauses.push("ta.active_status = 0");
    let active_status;
    if (statusFilter) {
      const active_status_map = { ongoing: 0, complete: 1, overdue: 2 };
      active_status = active_status_map[statusFilter.toLowerCase()];
      if (active_status !== undefined) {
        params.push(active_status);
        whereClauses.push(`ta.active_status = $${params.length}`);
      }
    }

    //  Outside date range
    if (completion_startDate) {
      params.push(completion_startDate);
      whereClauses.push(`ta.completion_date >= $${params.length}`);
    }
    if (completion_endDate) {
      params.push(completion_endDate);
      whereClauses.push(`ta.completion_date <= $${params.length}`);
    }

    //  Inside date range
    if (filters.completion_startDate) {
      params.push(filters.completion_startDate);
      whereClauses.push(`ta.completion_date >= $${params.length}`);
    }
    if (filters.completion_endDate) {
      params.push(filters.completion_endDate);
      whereClauses.push(`ta.completion_date <= $${params.length}`);
    }

    // CompletedOn Date Filters — apply only for completed tasks
    if (active_status === 1 || statusFilter?.toLowerCase() === "complete") {
      if (filters.task_completed_on_startDate) {
        params.push(filters.task_completed_on_startDate);
        whereClauses.push(`ta.completedon >= $${params.length}`);
      }
      if (filters.task_completed_on_endDate) {
        params.push(filters.task_completed_on_endDate);
        whereClauses.push(`ta.completedon <= $${params.length}`);
      }
    }

    //  Department
    if (filters.department_id?.length) {
      params.push(filters.department_id);
      whereClauses.push(`us1.deptid = ANY($${params.length})`);
    }

    //  Assigned To
    if (filters.assigned_to?.length) {
      params.push(filters.assigned_to);
      whereClauses.push(`assigned_to_id::text = ANY($${params.length})`);
    }

    //  Assigned By
    if (filters.assigned_by?.length) {
      params.push(filters.assigned_by);
      whereClauses.push(`ta.assigned_by = ANY($${params.length})`);
    }

    //  Task type
    if (filters.type) {
      params.push(filters.type.toLowerCase() === "normal" ? "0" : "1");
      whereClauses.push(`ta.task_type = $${params.length}`);
    }

    //  Frequency (Recurring)
    if (filters.frequency) {
      params.push(filters.frequency);
      whereClauses.push(`rt.schedule_details->>'type' = $${params.length}`);
    }

    if (role === 2) {
      params.push(userDeptId);
      whereClauses.push(`
                (
                    us1.deptid = $${params.length} 
                    OR assigned_to_id IN (
                        SELECT row_id FROM ${schema}.users WHERE deptid = $${params.length}
                    )
                )
            `);
    }

    const query = `
           SELECT
                ta.row_id,
                ta.title,
                ta.description,
                ta.checklist,
                ta.completion_date,
                ta.completedon,
                us1.name AS created_by,
                COALESCE(dept.department_name, 'Owner') AS department,
                ta.cr_on AS created_at,
                json_agg(us.name) AS assigned_to,
                CASE
                    WHEN ta.active_status = 0 THEN 'ongoing'
                    WHEN ta.active_status = 1 THEN 'complete'
                    WHEN ta.active_status = 2 THEN 'overdue'
                END AS status,
                CASE
                    WHEN ta.task_type = '0' THEN 'Normal'
                    WHEN ta.task_type = '1' THEN 'Recurring'
                END AS task_type_title,
                CASE
                    WHEN ta.active_status = 1 AND ta.completion_date < CURRENT_DATE 
                        THEN ABS(ta.up_on::date - ta.completion_date) 
                    WHEN ta.completion_date >= CURRENT_DATE 
                        THEN (ta.completion_date - CURRENT_DATE)
                    ELSE ABS(ta.completion_date - CURRENT_DATE)
                END AS due_days,
                CASE
                    WHEN ta.completion_date >= CURRENT_DATE 
                        THEN 'due_in'
                    ELSE 'overdue_by'
                END AS due_label,
                us2.name AS updated_by,
                rt.row_id as recurring_task_id,
                rt.schedule_details->>'type' AS schedule_type,
                rt.schedule_details->>'reminder_list' AS reminder_list
            FROM ${schema}.tasks ta
            INNER JOIN ${schema}.users us1 ON ta.assigned_by = us1.row_id
            LEFT JOIN ${schema}.departments dept ON us1.deptid = dept.row_id
            INNER JOIN LATERAL jsonb_array_elements_text(ta.assigned_to) AS assigned_to_id ON TRUE
            INNER JOIN ${schema}.users us ON us.row_id = assigned_to_id::text
            LEFT JOIN ${schema}.users us2 ON ta.completed_by = us2.row_id
            LEFT JOIN ${schema}.recurring_task rt ON ta.recurringid = rt.row_id
            WHERE ${whereClauses.join(" AND ")}
               AND us.activestatus = 0
            GROUP BY ta.row_id,us2.name,rt.row_id, ta.title, ta.description, ta.completion_date, us1.name, dept.department_name,ta.active_status,ta.cr_on
            ORDER BY ta.cr_on DESC;
        `;

    //  Check role
    // if (role !== 1) {
    //     return { status: 1, msg: "You are not admin" };
    // }

    const resp = await db_query.customQuery(
      query,
      "Tasks Fetched for Excel",
      params
    );
    // return resp;
    // console.log("resp--------->",resp)

    if (!resp || !resp.data || resp.data.length === 0) {
      console.log(" No data to export");
      // return res.status(404).send({ status: 1, msg: "No data to export" });
      return libFunc.sendResponse(res, { status: 1, msg: "No data to export" });
    }

    //  Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Tasks");

    worksheet.columns = [
      { header: "Title", key: "title", width: 30 },
      { header: "Description", key: "description", width: 50 },
      //  { header: 'Completion Date', key: 'completion_date', width: 20,style: { numFmt: 'dd-mm-yyyy' } },
      { header: "Due Date", key: "completion_date", width: 20 },
      { header: "Completion Date", key: "completedon", width: 20 },
      { header: "Created By", key: "created_by", width: 25 },
      { header: "Department", key: "department", width: 25 },
      { header: "Assigned To", key: "assigned_to", width: 40 },
      { header: "Status", key: "status", width: 15 },
      { header: "Type", key: "task_type", width: 15 },
      { header: "Frequency ", key: "schedule_type", width: 15 },
      { header: "Due days", key: "due_days", width: 15 },
      { header: "Complete Till", key: "reminder_list", width: 15 },
    ];

    //  Add data
    resp.data.forEach((task) => {
      let completeTill = null;

      // Parse reminder_list safely
      if (task.reminder_list) {
        try {
          const parsed = JSON.parse(task.reminder_list);
          completeTill = parsed[0]?.complete_till ?? null;
        } catch (e) {
          console.error(
            "Error parsing reminder_list for task:",
            task.row_id,
            e
          );
        }
      }

      worksheet.addRow({
        title: task.title,
        description: task.description,
        completion_date: Dateformatechange(task.completion_date),
        //    completion_date:task.completion_date,
        created_by: task.created_by,
        department: task.department,
        assigned_to: (task.assigned_to || []).join(", "),
        task_type: task.task_type_title,
        status: task.status,
        schedule_type: task.schedule_type || "-",
        due_days: task.due_days,
        reminder_list: completeTill ? completeTill : "-",
        completedon: task.completedon
          ? Dateformatechange(task.completedon)
          : "-",
      });
    });

    //    console.log("req",req.orgId)

    //  Prepare directory (per org)
    const orgFolder = path.join("./public/uploads", organizationid);
    if (!fs.existsSync(orgFolder)) {
      fs.mkdirSync(orgFolder, { recursive: true });
    }

    //  File name and path
    const fileName = `Tasks_${Date.now()}.xlsx`;
    const filePath = path.join(orgFolder, fileName);

    worksheet.getRow(1).font = {
      bold: true,
      size: 12,
    };

    //  Save file to org
    await workbook.xlsx.writeFile(filePath);

    //    console.log(` Excel saved at: ${filePath}`);

    //  Return file path (relative for frontend)
    const fileUrl = `uploads/${organizationid}/${fileName}`;

    //    console.log("filePath",fileUrl)

    serverUrl = "http://192.168.20.192:8000/";
    // serverUrl = "https://prosys.ftisindia.com/"

    let response = {
      status: 0,
      msg: "File exported successfully",
      filePath: serverUrl + fileUrl,
    };

    //    console.log("response---",response)

    // res.send(response);
    return libFunc.sendResponse(res, response);
  } catch (err) {
    console.error(" Error exporting Excel:", err);
    // res.status(500).send({ status: 1, msg: "Error exporting Excel" });
    return libFunc.sendResponse(res, {
      status: 1,
      msg: "Error exporting Excel",
    });
  }
}

async function createSuperAdmin(req, res) {
  var tablename = schema + ".users";
  const superAdmin_name = req.data.superAdmin_name;
  const email = req.data.email;
  const mobilenumber = req.data.mobilenumber;
  const password = req.data.password;

  if (!superAdmin_name || !email || !password || !mobilenumber) {
    const resp = { status: 1, msg: "Missing required fields" };
    // console.log("response of validation ", resp);
    libFunc.sendResponse(res, resp);
  } else {
    var columns = {
      name: superAdmin_name.trim().replaceAll("'", "`"),
      email: email.trim(),
      password: password.trim(),
      mobilenumber: mobilenumber.trim(),
      organizationid: 0,
      role: 9,
    };
    var respuser = await db_query.addData(tablename, columns, null, "Users");
    // console.log("respuser", respuser);

    libFunc.sendResponse(res, respuser);
  }
}

async function fetchOrganizations(req, res) {
  // console.log("Data")
  const role = req.data.user_role;

  // console.log("role",role)

  try {
    const query = `
            SELECT 
                o.row_id AS org_id,
                o.organization_name,
                o.owner_name,
                o.mobile_number,
                o.gstin,
                b.bill_start_date,
                b.per_month_billing,
                b.payment_status,
                o.cr_on,
                o.up_on,
                (
                    SELECT COUNT(*) FROM prosys.departments d WHERE d.organizationid = o.row_id
                ) AS department_count,
                (
                    SELECT COUNT(*) FROM prosys.users u WHERE u.organizationid = o.row_id
                ) AS user_count,
                (
                    SELECT COUNT(*) FROM prosys.tasks t WHERE t.organizationid = o.row_id
                ) AS tasks_count,
                 (
                    SELECT COUNT(*) FROM prosys.recurring_task rt WHERE rt.organizationid = o.row_id
                ) AS recurring_task_count
            FROM prosys.organizations o
            LEFT JOIN prosys.organization_payment b ON b.organizationid = o.row_id;
        `;

    // if (role === 9) {
    const rows = await db_query.customQuery(
      query,
      "All organization data fetch"
    );

    let msg_data = rows;

    // console.log("data----",msg_data)
    libFunc.sendResponse(res, msg_data);
    // // } else{
    //     let msg_data = { status: 1, msg: "You are not admin" }
    //   //  console.log("msg_data",msg_data)
    //     libFunc.sendResponse(res,msg_data );

    // }
  } catch (err) {
    console.error("Fetch Organizations Error:", err);
    libFunc.sendResponse(res, {
      status: 1,
      msg: "Error fetching organizations",
    });
  }
}

async function updateOrganizations(req, res) {
  try {
    const { row_id, bill_start_date, per_month_billing } = req.data || {};

    if (!row_id) {
      return libFunc.sendResponse(res, {
        success: false,
        message: "organization row_id is required",
      });
    }

    const tableName = `${schema}.organization_payment`;

    // const resp = await db_query.addData(tableName, columns, organizationid, "organization payment details");

    const query = `
          Update ${tableName} set bill_start_date = '${bill_start_date}',
          per_month_billing = '${per_month_billing}' where organizationid = '${row_id}'
        `;

    const resp = await db_query.customQuery(
      query,
      "Organizational billing date and monthly data updated"
    );

    // console.log("DB Response:----", resp);

    return libFunc.sendResponse(res, resp);
  } catch (error) {
    console.error("Error in updateOrganizations:", error);
    return libFunc.sendResponse(res, {
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
}

async function fetchReportsofwhatapps(req, res) {
  try {
    const { organizationid, from_date, to_date } = req.data;
    //  console.log("request---------", req.data);

    let baseConditions = [`organizationid = '${organizationid}'`];

    if (from_date && to_date) {
      baseConditions.push(
        `cr_on::date BETWEEN '${from_date}' AND '${to_date}'`
      );
    }

    //   add filter for only failed
    let failedConditions = [
      ...baseConditions,
      `response_data->>'result' = 'false'`,
    ];

    // Fetch only failed logs
    const logsQuery = `
            SELECT row_id, mobilenumber, receiver_user, template_name,
                   request_data, response_data, cr_on, others_details, organizationid
            FROM prosys.whatsapp_log
            WHERE ${failedConditions.join(" AND ")}
            ORDER BY cr_on DESC
        `;
    const logs = await db_query.customQuery(
      logsQuery,
      "Failed WhatsApp report data fetch"
    );

    // Fetch success & failed counts
    const countQuery = `
            SELECT 
                SUM(CASE WHEN response_data->>'result' = 'true' THEN 1 ELSE 0 END) AS success_count,
                SUM(CASE WHEN response_data->>'result' = 'false' THEN 1 ELSE 0 END) AS failed_count
            FROM prosys.whatsapp_log
            WHERE ${baseConditions.join(" AND ")}
        `;
    const counts = await db_query.customQuery(
      countQuery,
      "WhatsApp response count"
    );

    // Final response structure
    const response = {
      status: logs.status,
      msg: logs.msg,
      data: {
        counts: {
          success_count: counts.data[0]?.success_count || 0,
          failed_count: counts.data[0]?.failed_count || 0,
        },
        records: logs.data || [], //  Only failed records
      },
    };

    // console.log("final data----", response.data.records);
    // console.log("final data----", response);

    libFunc.sendResponse(res, response);
  } catch (error) {
    console.error("Error fetching WhatsApp logs:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
}

async function testdata(req, res) {
  // console.log("data")
  // checkRecurringTasks()
  // checkOverdueTasks()
  // checkDueDateForToday()
}

// checkOverdueTasks()

async function fetchlastImporttask(req, res) {
  try {
    const organizationid = req.data.orgId;

    const latestQuery = `
      SELECT * 
      FROM prosys.imported_task_history 
      WHERE organizationid = $1 
      ORDER BY cr_on DESC 
      LIMIT 1
    `;
    const latestResult = await db_query.customQuery(
      latestQuery,
      "fetch last import",
      [organizationid]
    );

    // console.log("latestResult:", latestResult);

    // Adjusted check depending on result shape
    const rows = latestResult.data || latestResult.rows || [];
    if (rows.length === 0) {
      return libFunc.sendResponse(res, {
        status: 1,
        msg: "No import history found",
      });
    }

    const lastImport = rows[0];

    const response = {
      status: 0,
      msg: "Last import fetched successfully",
      data: {
        row_id: lastImport.row_id,
        validTasks: lastImport.validtasks || [],
        invalidTasks: lastImport.invalidtasks || [],
        created_on: lastImport.cr_on,
        validTasksCount: lastImport.validcount,
        invalidTasksCount: lastImport.invalidcount,
        msg: "Last imported excel data",
      },
    };

    // console.log("res",response)
    return libFunc.sendResponse(res, response);
  } catch (err) {
    // console.error("Error fetching last import:", err);
    return libFunc.sendResponse(res, {
      status: 500,
      msg: "Internal Server Error",
      error: err.message,
    });
  }
}

async function activeUser(req, res) {
  var memberid = req.data.memberid;
  var tablename = schema + ".users";
  var sqlquery = `UPDATE ${schema}.users SET activestatus = 0 WHERE row_id = $1`;
  // console.log("sqlquery", sqlquery);
  connect_db.query(sqlquery, [memberid], (err, result) => {
    if (err) {
      // console.log(err);
      var resp = {
        status: 1,
        msg: "User Not Found",
      };
      libFunc.sendResponse(res, resp);
    } else {
      var resp = {
        status: 0,
        msg: "Active User Successfully",
      };
      // console.log("response", resp);
      libFunc.sendResponse(res, resp);
    }
  });
}

async function fetchInactiveUserList(req, res) {
  // console.log("fetchInactiveUserList ------->", req);
  var organizationid = req.data.orgId;
  // var isTeam = req.data.isTeam;
  var limit = req.data.limit || 100;
  var page = req.data.page || 1;
  var offset = (page - 1) * limit;
  let query, params;

  query = `SELECT us.name,us.row_id,us.image_url as photo_path,de.department_name as dep_name,
            CASE 
                WHEN us.role = 0 THEN 'User'
                WHEN us.role = 1 THEN 'Admin'
                WHEN us.role = 2 THEN 'Dept-admin'
                WHEN us.role = 3 THEN 'Top-management'
                ELSE 'unknown'
            END AS rolevalue
            FROM ${schema}.users us
            LEFT JOIN ${schema}.departments de on us.deptid=de.row_id
            WHERE us.organizationid = $1 AND us.activestatus = 1
            ORDER BY us.deptid, us.cr_on DESC LIMIT $2 OFFSET $3`;
  params = [organizationid, limit, offset];

  // console.log("query===========");
  // console.log(query, params);
  connect_db.query(query, params, (err, result) => {
    if (err) {
      // console.log(err);
      var resp = {
        status: 1,
        msg: "Users Not Found",
      };
      libFunc.sendResponse(res, resp);
    } else {
      if (result.rows.length > 0) {
        var resp = {
          status: 0,
          msg: "Inactive Users Fetched Successfully",
          data: result.rows,
        };
        // console.log("Inactive Users response ", resp);
        libFunc.sendResponse(res, resp);
      } else {
        var resp = {
          status: 1,
          msg: "Users Not Found",
        };
        // console.log("response", resp);
        libFunc.sendResponse(res, resp);
      }
    }
  });
}

// /**
//  *  Generate a Task Summary Report and report should be automatically shared via WhatsApp
//  */

async function fetchTaskSummary(period = "weekly", schema = "prosys") {
  // Get current datetime
  const nowIST = new Date();

  // Format helper (YYYY-MM-DD)
  const formatDate = (d) => d.toISOString().split("T")[0];

  // Exclude today -> endDate = yesterday
  const endDateObj = new Date(nowIST);
  endDateObj.setDate(endDateObj.getDate() - 1);
  const endDate = formatDate(endDateObj);

  let startDateObj = new Date(nowIST);

  if (period === "weekly") {
    // Last 7 days (excluding today)
    startDateObj.setDate(startDateObj.getDate() - 7);
  } else if (period === "monthly") {
    // First day of the current month
    startDateObj.setDate(1);
  }

  const startDate = formatDate(startDateObj);

  // const startDate = "2025-11-17";
  // const endDate = "2025-11-30";

  // console.log("startDate:", startDate);
  // console.log("endDate:", endDate);

  const query = `
  SELECT
      t.row_id AS task_id,
      t.cr_on::date,
      t.title,
      t.description,
      t.completion_date,
      t.assigned_by,
      t.assigned_to,
      t.organizationid,
      o.organization_name,
      u1.name AS assigner_name,
      u2.name AS assignee_name,
      u2.deptid AS department_id,
      COALESCE(d.department_name, 'Owner') AS department_name,
      CASE
          WHEN t.active_status = 0 THEN 'ongoing'
          WHEN t.active_status = 1 THEN 'complete'
          WHEN t.active_status = 2 THEN 'overdue'
          ELSE 'Unknown'
      END AS status,
      CASE
          WHEN t.task_type = '0' THEN 'Normal'
          WHEN t.task_type = '1' THEN 'Recurring'
      END AS task_type_title,
      CASE
          WHEN t.active_status = 1 AND t.completion_date < CURRENT_DATE 
              THEN t.up_on::date - t.completion_date
          WHEN t.completion_date >= CURRENT_DATE 
              THEN (t.completion_date - CURRENT_DATE)
          ELSE t.completion_date - CURRENT_DATE
      END AS due_days,
      CASE
                    WHEN t.active_status = 1 THEN 'completed'
                    WHEN t.completion_date >= CURRENT_DATE 
                        THEN 'due_in'
                    ELSE 'overdue_by'
                END AS due_label
  FROM ${schema}.tasks t
  LEFT JOIN ${schema}.users u1 ON t.assigned_by = u1.row_id
  LEFT JOIN LATERAL jsonb_array_elements_text(t.assigned_to) AS at(user_id)
      ON TRUE
  LEFT JOIN ${schema}.users u2 ON u2.row_id::text = at.user_id
  LEFT JOIN ${schema}.departments d ON u2.deptid = d.row_id
  LEFT JOIN ${schema}.organizations o ON t.organizationid = o.row_id
  WHERE t.cr_on::date BETWEEN '${startDate}' AND '${endDate}'
  AND (u2.activestatus = 0 OR u2.activestatus IS NULL)
  ORDER BY o.organization_name, d.department_name, t.completion_date;
  `;

  const result = await queries.custom_query(query);
  //   console.log("result----",result)
  return result;
}

async function fetchDepartmentSummary(startDate, endDate, orgID) {
  const query = `
  WITH task_users AS (
    SELECT
      t.row_id AS task_id,
      d.department_name,
      t.active_status
    FROM prosys.tasks t
    LEFT JOIN LATERAL jsonb_array_elements_text(t.assigned_to) AS assignee(user_id) ON TRUE
    LEFT JOIN prosys.users u ON u.row_id::text = assignee.user_id
    LEFT JOIN prosys.departments d ON u.deptid = d.row_id
    WHERE 
      t.organizationid = '${orgID}' 
      AND t.cr_on::date BETWEEN '${startDate}' AND '${endDate}'
      AND (u.activestatus = 0 OR u.activestatus IS NULL)
  ),
  unique_tasks AS (
    SELECT DISTINCT task_id, department_name, active_status
    FROM task_users
    WHERE department_name IS NOT NULL
  )
  SELECT
    department_name,
    COUNT(*) FILTER (WHERE active_status = 0) AS ongoing_count,
    COUNT(*) FILTER (WHERE active_status = 1) AS complete_count,
    COUNT(*) FILTER (WHERE active_status = 2) AS overdue_count
  FROM unique_tasks
  GROUP BY department_name
  ORDER BY department_name;
  `;
  return await queries.custom_query(query);
}

// add pdf header
function addHeader(doc, orgName, deptName, headerImgPath, startDate, endDate) {
  try {
    if (fs.existsSync(headerImgPath)) {
      doc.image(headerImgPath, 25, 10, { width: 100 });
    }
  } catch (e) {
    console.log("Header image not found:", e.message);
  }

  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .fillColor("#000000")
    .text(`${orgName} - ${deptName}`, 150, 25, { align: "left" });

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // Format dates
  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);

  //   console.log("StartDate->",startDate ,"EndDate->",endDate)

  //   console.log("formattedStartDate->",formattedStartDate ,"formattedEndDate->",formattedEndDate)

  // Subheader: generated by + date range
  doc
    .fontSize(9)
    .font("Helvetica-Oblique")
    .fillColor("#424242")
    .text(
      `Generated by Prosys | ${formattedStartDate} to ${formattedEndDate}`,
      150,
      45,
      { align: "left" }
    );

  // Light line under header
  const lineY = 65;
  doc
    .moveTo(doc.page.margins.left, lineY)
    .lineTo(doc.page.width - doc.page.margins.right, lineY)
    .lineWidth(0.5)
    .strokeColor("#b0bec5")
    .stroke();
}

// function to add table header
function drawTableHeader(doc, headers, colWidths, x, y, headerBg = "#1a237e") {
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);

  // Draw header background
  doc.rect(x, y, totalWidth, 25).fill(headerBg).stroke();

  doc.fillColor("#ffffff").fontSize(11).font("Helvetica-Bold");

  let xPos = x;
  headers.forEach((header, i) => {
    doc.text(header, xPos + 5, y + 7, { width: colWidths[i] - 10 });

    // Draw vertical border line for each column
    doc
      .moveTo(xPos, y)
      .lineTo(xPos, y + 25)
      .lineWidth(0.3)
      .strokeColor("#b0bec5")
      .stroke();

    xPos += colWidths[i];
  });

  // Draw right-most vertical border
  doc
    .moveTo(xPos, y)
    .lineTo(xPos, y + 25)
    .lineWidth(0.3)
    .strokeColor("#b0bec5")
    .stroke();

  // Draw bottom horizontal border
  doc
    .moveTo(x, y + 25)
    .lineTo(x + totalWidth, y + 25)
    .lineWidth(0.3)
    .strokeColor("#b0bec5")
    .stroke();

  return y + 25;
}

// function to add table rows
function drawTableRow(
  doc,
  row,
  colWidths,
  x,
  y,
  rowHeight,
  rowColor = "#ffffff"
) {
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);

  // Draw row background
  doc.rect(x, y, totalWidth, rowHeight).fill(rowColor).stroke();

  doc.fillColor("#000000").font("Helvetica").fontSize(10);

  let xPos = x;
  row.forEach((text, i) => {
    doc.text(String(text), xPos + 5, y + 7, { width: colWidths[i] - 10 });

    // Draw vertical border
    doc
      .moveTo(xPos, y)
      .lineTo(xPos, y + rowHeight)
      .lineWidth(0.3)
      .strokeColor("#b0bec5")
      .stroke();

    xPos += colWidths[i];
  });

  // Draw right-most vertical border
  doc
    .moveTo(xPos, y)
    .lineTo(xPos, y + rowHeight)
    .lineWidth(0.3)
    .strokeColor("#b0bec5")
    .stroke();

  // Draw bottom horizontal border
  doc
    .moveTo(x, y + rowHeight)
    .lineTo(x + totalWidth, y + rowHeight)
    .lineWidth(0.3)
    .strokeColor("#b0bec5")
    .stroke();

  return y + rowHeight;
}

// Main PDF generator

async function generateTaskReportPDF(tasks, period, schema) {
  const reports = [];
  const MARGIN_LEFT = 40,
    MARGIN_RIGHT = 30;

  // Get current  datetime
  const nowIST = new Date();

  // Format helper (YYYY-MM-DD)
  const formatDate = (d) => d.toISOString().split("T")[0];

  // Exclude today → endDate = yesterday
  const endDateObj = new Date(nowIST);
  endDateObj.setDate(endDateObj.getDate() - 1);
  const endDate = formatDate(endDateObj);

  let startDateObj = new Date(nowIST);

  if (period === "weekly") {
    // Last 7 days (excluding today)
    startDateObj.setDate(startDateObj.getDate() - 7);
  } else if (period === "monthly") {
    // First day of the current month
    startDateObj.setDate(1);
  }

  const startDate = formatDate(startDateObj);

  // const startDate = "2025-11-17";
  // const endDate = "2025-11-30";

  // console.log("startDate:", startDate);
  // console.log("endDate:", endDate);

  // Group by organization
  const orgGroups = tasks.reduce((acc, task) => {
    const orgId = task.organizationid || "unknown_org";
    if (!acc[orgId]) acc[orgId] = [];
    acc[orgId].push(task);
    return acc;
  }, {});

  for (const [organizationid, orgTasks] of Object.entries(orgGroups)) {
    const orgName = orgTasks[0]?.organization_name || "Unknown Organization";

    const orgFolder = path.join("./public/uploads", organizationid);
    if (!fs.existsSync(orgFolder)) fs.mkdirSync(orgFolder, { recursive: true });

    // Group tasks by department
    const deptGroups = orgTasks.reduce((acc, t) => {
      const dept = t.department_name || "Owner";
      if (!acc[dept]) acc[dept] = [];
      acc[dept].push(t);
      return acc;
    }, {});

    if (!deptGroups["Owner"]) {
      deptGroups["Owner"] = [];
    }

    for (const [deptName, deptTasks] of Object.entries(deptGroups)) {
      const deptFolder = path.join(orgFolder, deptName.replace(/\s+/g, "_"));
      if (!fs.existsSync(deptFolder))
        fs.mkdirSync(deptFolder, { recursive: true });

      const fileName = `Tasks_${deptName.replace(
        /\s+/g,
        "_"
      )}_${Date.now()}.pdf`;
      const filePath = path.join(deptFolder, fileName);

      const doc = new PDFDocument({
        margin: 10,
        size: "A4",
        layout: "landscape",
      });
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      const rootPath = path.dirname(__dirname);
      // console.log("__dirname", __dirname)
      // console.log("rootPath", rootPath)
      const headerImgPath = path.join(
        rootPath,
        "uploads/image",
        "prosyslogo.png"
      );
      // console.log("headerImage",headerImgPath)

      addHeader(doc, orgName, deptName, headerImgPath, startDate, endDate);
      let y = 70;
      y += 30;

      //  Step 1: Merge same tasks (multi-assignee -> one task)
      const mergedTasksMap = new Map();
      for (const t of deptTasks) {
        const key = t.task_id || t.row_id;
        if (!mergedTasksMap.has(key)) {
          mergedTasksMap.set(key, {
            ...t,
            assignee_list: new Set(t.assignee_name ? [t.assignee_name] : []),
          });
        } else {
          const existing = mergedTasksMap.get(key);
          if (t.assignee_name) existing.assignee_list.add(t.assignee_name);
        }
      }

      const mergedTasks = Array.from(mergedTasksMap.values()).map((t) => ({
        ...t,
        assignee_name: Array.from(t.assignee_list).join(", "),
      }));

      //  Step 2: Compute Summary
      let ownSummary = { ongoing: 0, complete: 0, overdue: 0 };

      if (deptName.toLowerCase() !== "owner") {
        ownSummary = {
          ongoing: mergedTasks.filter(
            (t) => t.status?.toLowerCase() === "ongoing"
          ).length,
          complete: mergedTasks.filter(
            (t) => t.status?.toLowerCase() === "complete"
          ).length,
          overdue: mergedTasks.filter(
            (t) => t.status?.toLowerCase() === "overdue"
          ).length,
        };

        doc
          .fontSize(13)
          .font("Helvetica-Bold")
          .fillColor("#000")
          .text("Task Summary Overview", 40, y);
      } else {
        const summaryData = await fetchDepartmentSummary(
          startDate,
          endDate,
          organizationid
        );
        ownSummary = {
          ongoing: summaryData.reduce(
            (sum, d) => sum + Number(d.ongoing_count || 0),
            0
          ),
          overdue: summaryData.reduce(
            (sum, d) => sum + Number(d.overdue_count || 0),
            0
          ),
          complete: summaryData.reduce(
            (sum, d) => sum + Number(d.complete_count || 0),
            0
          ),
        };
        doc
          .fontSize(13)
          .font("Helvetica-Bold")
          .fillColor("#000")
          .text("Task Summary Overview (All Departments)", 40, y);
      }
      y += 25;

      // Draw summary boxes
      const labelWidth = 100,
        labelHeight = 25,
        spacing = 20;
      let x = MARGIN_RIGHT;
      const summaryColors = {
        ongoing: "#1565c0",
        overdue: "#c62828",
        complete: "#2e7d32",
      };
      for (const key of ["ongoing", "overdue", "complete"]) {
        doc
          .rect(x, y, labelWidth, labelHeight)
          .fill(summaryColors[key])
          .stroke();
        doc
          .fillColor("#fff")
          .font("Helvetica-Bold")
          .fontSize(11)
          .text(
            `${key.charAt(0).toUpperCase() + key.slice(1)}: ${ownSummary[key]}`,
            x + 8,
            y + 7
          );
        x += labelWidth + spacing;
      }
      y += labelHeight + 30;

      //  Step 3: User-wise Summary (based on merged tasks)
      if (deptName.toLowerCase() !== "owner") {
        const userGroups = deptTasks.reduce((acc, task) => {
          const user = task.assignee_name || "Unassigned";
          if (!acc[user]) acc[user] = [];
          acc[user].push(task);
          return acc;
        }, {});

        let userSummary = Object.entries(userGroups).map(
          ([userName, tasks]) => ({
            userName,
            department: tasks[0]?.department_name || "Owner",
            ongoing: tasks.filter((t) => t.status.toLowerCase() === "ongoing")
              .length,
            overdue: tasks.filter((t) => t.status.toLowerCase() === "overdue")
              .length,
            complete: tasks.filter((t) => t.status.toLowerCase() === "complete")
              .length,
          })
        );

        // Sort users: highest overdue first, then ongoing, then name alphabetically
        userSummary = userSummary.sort((a, b) => {
          if (b.overdue !== a.overdue) return b.overdue - a.overdue;
          if (b.ongoing !== a.ongoing) return b.ongoing - a.ongoing;
          return a.userName.localeCompare(b.userName);
        });

        if (userSummary.length > 0) {
          doc
            .fontSize(13)
            .font("Helvetica-Bold")
            .fillColor("#000")
            .text("User-wise Task Summary", 40, y);
          y += 25;

          const headers = [
            "#",
            "User",
            "Department",
            "Ongoing",
            "Overdue",
            "Complete",
          ];
          const colWidths = [30, 100, 100, 60, 60, 70];
          y = drawTableHeader(doc, headers, colWidths, MARGIN_RIGHT, y);

          userSummary.forEach((user, idx) => {
            if (y > 500) {
              doc.addPage();
              addHeader(
                doc,
                orgName,
                deptName,
                headerImgPath,
                startDate,
                endDate
              );
              y = 100;
              y = drawTableHeader(doc, headers, colWidths, MARGIN_RIGHT, y);
            }
            const rowColor = idx % 2 === 0 ? "#f5f5f5" : "#ffffff";
            const row = [
              idx + 1,
              user.userName,
              user.department,
              user.ongoing,
              user.overdue,
              user.complete,
            ];
            y = drawTableRow(
              doc,
              row,
              colWidths,
              MARGIN_RIGHT,
              y,
              25,
              rowColor
            );
          });

          y += 20;
        }
      }

      if (deptName.toLowerCase() === "owner") {
        const summaryData = await fetchDepartmentSummary(
          startDate,
          endDate,
          organizationid
        );

        doc
          .fontSize(13)
          .font("Helvetica-Bold")
          .fillColor("#000000")
          .text("All Department Summary", 40, y);
        y += 30;

        const headers = ["#", "Department", "Ongoing", "Overdue", "Complete"];
        const colWidths = [30, 100, 60, 60, 70];
        const rowHeight = 25;

        y = drawTableHeader(doc, headers, colWidths, MARGIN_RIGHT, y);

        summaryData.forEach((dept, i) => {
          if (y + rowHeight > doc.page.height - 80) {
            doc.addPage();
            addHeader(
              doc,
              orgName,
              deptName,
              headerImgPath,
              startDate,
              endDate
            );
            y = 100;
            y = drawTableHeader(doc, headers, colWidths, MARGIN_RIGHT, y);
          }

          const rowColor = i % 2 === 0 ? "#f5f5f5" : "#ffffff";
          const row = [
            i + 1,
            dept.department_name || "Owner",
            dept.ongoing_count || 0,
            dept.overdue_count || 0,
            dept.complete_count || 0,
          ];
          y = drawTableRow(
            doc,
            row,
            colWidths,
            MARGIN_RIGHT,
            y,
            rowHeight,
            rowColor
          );
        });

        y += 40;

        // Optionally, show users per department
        for (const dept of summaryData) {
          if (y > 500) {
            doc.addPage();
            addHeader(
              doc,
              orgName,
              deptName,
              headerImgPath,
              startDate,
              endDate
            );
            y = 100;
          }

          doc
            .fontSize(12)
            .font("Helvetica-Bold")
            .fillColor("#0d47a1")
            .text(`Department: ${dept.department_name}`, 40, y);
          y += 25;

          // Fetch users for this department, same as previous logic...
          const userSummaryQuery = `
            WITH task_users AS (
                SELECT
                    t.row_id,
                    u.row_id AS user_id,
                    u.name AS user_name,
                    d.department_name,
                    t.active_status
                FROM prosys.tasks t
                LEFT JOIN LATERAL jsonb_array_elements_text(t.assigned_to) AS assignee(user_id) ON TRUE
                LEFT JOIN prosys.users u ON u.row_id::text = assignee.user_id
                LEFT JOIN prosys.departments d ON u.deptid = d.row_id
                WHERE 
                    t.organizationid = '${organizationid}'
                    AND d.department_name = '${dept.department_name}'
                    AND  t.cr_on::date BETWEEN '${startDate}' AND '${endDate}'
                    AND (u.activestatus = 0 OR u.activestatus IS NULL)
            )
            SELECT
                user_name,
                COUNT(*) FILTER (WHERE active_status = 0) AS ongoing_count,
                COUNT(*) FILTER (WHERE active_status = 1) AS complete_count,
                COUNT(*) FILTER (WHERE active_status = 2) AS overdue_count
            FROM task_users
            WHERE user_name IS NOT NULL 
            GROUP BY user_name
            ORDER BY user_name;
        `;
          const userSummary = await queries.custom_query(userSummaryQuery);

          if (userSummary.length === 0) {
            doc
              .fontSize(10)
              .fillColor("#777")
              .text("No user data found", 60, y);
            y += 20;
            continue;
          }

          const userHeaders = ["#", "User", "Ongoing", "Overdue", "Complete"];
          const userColWidths = [30, 100, 60, 60, 70];
          y = drawTableHeader(doc, userHeaders, userColWidths, MARGIN_RIGHT, y);

          userSummary.forEach((u, i) => {
            if (y > 520) {
              doc.addPage();
              addHeader(
                doc,
                orgName,
                deptName,
                headerImgPath,
                startDate,
                endDate
              );
              y = 100;
              y = drawTableHeader(
                doc,
                userHeaders,
                userColWidths,
                MARGIN_RIGHT,
                y
              );
            }

            const rowColor = i % 2 === 0 ? "#fafafa" : "#ffffff";
            const row = [
              i + 1,
              u.user_name,
              u.ongoing_count || 0,
              u.overdue_count || 0,
              u.complete_count || 0,
            ];
            y = drawTableRow(
              doc,
              row,
              userColWidths,
              MARGIN_RIGHT,
              y,
              25,
              rowColor
            );
          });

          y += 40;
        }
      }

      const headers = [
        "#",
        "Title/Description",
        "Due Day",
        "Assignee To",
        "Assigned By",
        "Due Date",
        "Frequency",
        "Created On",
      ];
      const colWidths = [30, 220, 60, 80, 80, 60, 80, 70];

      // CASE 1: Normal Department (non-owner)
      if (deptName.toLowerCase() !== "owner") {
        const statusGroups = mergedTasks.reduce((acc, t) => {
          const s = (t.status || "unknown").toLowerCase().trim();
          if (!acc[s]) acc[s] = [];
          acc[s].push(t);
          return acc;
        }, {});

        for (const [statusName, statusTasks] of Object.entries(statusGroups)) {
          if (y > 500) {
            doc.addPage();
            addHeader(
              doc,
              orgName,
              deptName,
              headerImgPath,
              startDate,
              endDate
            );
            y = 100;
          }

          const count = statusTasks.length;
          const color =
            statusName === "ongoing"
              ? "#1565c0"
              : statusName === "complete"
              ? "#2e7d32"
              : "#c62828";

          doc
            .fontSize(12)
            .font("Helvetica-Bold")
            .fillColor(color)
            .text(`${statusName.toUpperCase()} (${count})`, 40, y);
          y += 25;

          y = drawTableHeader(doc, headers, colWidths, MARGIN_RIGHT, y);

          for (let i = 0; i < statusTasks.length; i++) {
            const t = statusTasks[i];
            const description = t.description || "";
            const descHeight = description
              ? doc.heightOfString(description, { width: colWidths[1] - 10 })
              : 0;
            const totalRowHeight = 25 + descHeight + 10;

            if (y + totalRowHeight > doc.page.height - 80) {
              doc.addPage();
              addHeader(
                doc,
                orgName,
                deptName,
                headerImgPath,
                startDate,
                endDate
              );
              y = 100;
              y = drawTableHeader(doc, headers, colWidths, MARGIN_RIGHT, y);
            }

            const rowColor = i % 2 === 0 ? "#f9f9f9" : "#ffffff";

            let dueLabel = "-";
            if (t.due_label === "completed") {
              dueLabel = `Done ${t.due_days} day(s) later`;
            } else if (t.due_label === "overdue_by") {
              dueLabel = `Overdue by ${Math.abs(t.due_days)} day(s)`;
            } else if (t.due_label === "due_in") {
              dueLabel = `Due in ${t.due_days} day(s)`;
            }

            const rowData = [
              i + 1,
              t.title + (description ? `\n${description}` : ""),
              dueLabel,
              t.assignee_name || "",
              t.assigner_name || "",
              t.completion_date
                ? new Date(t.completion_date).toLocaleDateString("en-IN")
                : "",
              t.task_type_title || "",
              Dateformatechange(t.cr_on),
            ];

            y = drawTableRow(
              doc,
              rowData,
              colWidths,
              MARGIN_RIGHT,
              y,
              totalRowHeight,
              rowColor
            );
          }
          y += 20;
        }
      }

      // CASE 2: OWNER – show Owner’s tasks + All Dept tasks separately
      else {
        // OWNER’s OWN TASKS
        const ownerTasks = deptGroups["Owner"] || [];
        const mergedOwnerMap = new Map();
        for (const t of ownerTasks) {
          const key = t.task_id || t.row_id;
          if (!mergedOwnerMap.has(key)) {
            mergedOwnerMap.set(key, {
              ...t,
              assignee_list: new Set(t.assignee_name ? [t.assignee_name] : []),
            });
          } else {
            const existing = mergedOwnerMap.get(key);
            if (t.assignee_name) existing.assignee_list.add(t.assignee_name);
          }
        }

        const mergedOwnerTasks = Array.from(mergedOwnerMap.values()).map(
          (t) => ({
            ...t,
            assignee_name: Array.from(t.assignee_list).join(", "),
          })
        );

        if (mergedOwnerTasks.length > 0) {
          doc
            .fontSize(13)
            .font("Helvetica-Bold")
            .fillColor("#000000")
            .text("OWNER'S OWN TASKS", 40, y);
          y += 25;

          const statusGroups = mergedOwnerTasks.reduce((acc, t) => {
            const s = (t.status || "unknown").toLowerCase().trim();
            if (!acc[s]) acc[s] = [];
            acc[s].push(t);
            return acc;
          }, {});

          y = drawStatusGroups(
            doc,
            statusGroups,
            headers,
            colWidths,
            MARGIN_RIGHT,
            y,
            orgName,
            deptName,
            headerImgPath
          );
        }

        y += 30;

        //  ALL DEPARTMENTS TASKS
        doc
          .fontSize(13)
          .font("Helvetica-Bold")
          .fillColor("#000000")
          .text("ALL DEPARTMENTS TASKS", 40, y);
        y += 25;

        for (const [depName, depTasks] of Object.entries(deptGroups)) {
          if (depName.toLowerCase() === "owner") continue; // skip owner, already shown
          if (depTasks.length === 0) continue;

          doc
            .fontSize(12)
            .font("Helvetica-Bold")
            .fillColor("#0d47a1")
            .text(`Department: ${depName}`, 40, y);
          y += 20;

          const mergedDepMap = new Map();
          for (const t of depTasks) {
            const key = t.task_id || t.row_id;
            if (!mergedDepMap.has(key)) {
              mergedDepMap.set(key, {
                ...t,
                assignee_list: new Set(
                  t.assignee_name ? [t.assignee_name] : []
                ),
              });
            } else {
              const existing = mergedDepMap.get(key);
              if (t.assignee_name) existing.assignee_list.add(t.assignee_name);
            }
          }

          const mergedDepTasks = Array.from(mergedDepMap.values()).map((t) => ({
            ...t,
            assignee_name: Array.from(t.assignee_list).join(", "),
          }));

          const statusGroups = mergedDepTasks.reduce((acc, t) => {
            const s = (t.status || "unknown").toLowerCase().trim();
            if (!acc[s]) acc[s] = [];
            acc[s].push(t);
            return acc;
          }, {});

          y = drawStatusGroups(
            doc,
            statusGroups,
            headers,
            colWidths,
            MARGIN_RIGHT,
            y,
            orgName,
            deptName,
            headerImgPath
          );
          y += 30;
        }
      }

      // drawing grouped status tables
      function drawStatusGroups(
        doc,
        statusGroups,
        headers,
        colWidths,
        MARGIN_RIGHT,
        y,
        orgName,
        deptName,
        headerImgPath
      ) {
        for (const [statusName, statusTasks] of Object.entries(statusGroups)) {
          if (y > 500) {
            doc.addPage();
            addHeader(
              doc,
              orgName,
              deptName,
              headerImgPath,
              startDate,
              endDate
            );
            y = 100;
          }

          const count = statusTasks.length;
          const color =
            statusName === "ongoing"
              ? "#1565c0"
              : statusName === "complete"
              ? "#2e7d32"
              : "#c62828";
          doc
            .fontSize(12)
            .font("Helvetica-Bold")
            .fillColor(color)
            .text(`${statusName.toUpperCase()} (${count})`, 40, y);
          y += 25;

          y = drawTableHeader(doc, headers, colWidths, MARGIN_RIGHT, y);

          for (let i = 0; i < statusTasks.length; i++) {
            const t = statusTasks[i];
            const description = t.description || "";
            const descHeight = description
              ? doc.heightOfString(description, { width: colWidths[1] - 10 })
              : 0;
            const totalRowHeight = 25 + descHeight + 10;

            if (y + totalRowHeight > doc.page.height - 80) {
              doc.addPage();
              addHeader(
                doc,
                orgName,
                deptName,
                headerImgPath,
                startDate,
                endDate
              );
              y = 100;
              y = drawTableHeader(doc, headers, colWidths, MARGIN_RIGHT, y);
            }

            const rowColor = i % 2 === 0 ? "#f9f9f9" : "#ffffff";
            let dueLabel = "-";
            if (t.due_label === "completed") {
              dueLabel = `Done ${t.due_days} day(s) later`;
            } else if (t.due_label === "overdue_by") {
              dueLabel = `Overdue by ${Math.abs(t.due_days)} day(s)`;
            } else if (t.due_label === "due_in") {
              dueLabel = `Due in ${t.due_days} day(s)`;
            }

            const rowData = [
              i + 1,
              t.title + (description ? `\n${description}` : ""),
              dueLabel,
              t.assignee_name || "",
              t.assigner_name || "",
              t.completion_date
                ? new Date(t.completion_date).toLocaleDateString("en-IN")
                : "",
              t.task_type_title || "",
              Dateformatechange(t.cr_on),
            ];

            y = drawTableRow(
              doc,
              rowData,
              colWidths,
              MARGIN_RIGHT,
              y,
              totalRowHeight,
              rowColor
            );
          }
          y += 20;
        }

        return y;
      }

      doc.end();
      await new Promise((resolve) => writeStream.on("finish", resolve));

      const serverUrl = "https://prosys.ftisindia.com/";
      // const serverUrl = "https://5e4f1d94b966.ngrok-free.app/";
      const fileUrl = `${serverUrl}uploads/${organizationid}/${deptName.replace(
        /\s+/g,
        "_"
      )}/${fileName}`;
      reports.push({
        organizationid,
        department: deptName,
        departmentid: deptTasks[0]?.department_id || null,
        fileUrl,
        isOwnerReport: deptName.toLowerCase() === "owner",
      });
    }
  }

  // console.log("org----->",orgGroups)
  return reports;
}

async function getOwnerNumber(orgId) {
  const q = `SELECT mobilenumber FROM prosys.users 
             WHERE role=1 AND organizationid='${orgId}' LIMIT 1`;
  const r = await queries.custom_query(q, "OK");
  //   console.log("r- getOwnerNumber", r);
  return r?.[0]?.mobilenumber || null;
}

async function getDepartmentAdmin(orgId, department) {
  // console.log("orgId",orgId,"departments",department)
  const q = `SELECT mobilenumber FROM prosys.users 
             WHERE role=2 AND organizationid='${orgId}' AND deptid='${department}' LIMIT 1`;
  const r = await queries.custom_query(q, "OK");
  //   console.log("r - getDepartmentAdmin", r);
  return r?.[0]?.mobilenumber || null;
}

async function sendReportsToWA(reports) {
  for (const report of reports) {
    const ownerNumber = await getOwnerNumber(report.organizationid);
    // console.log("ownerNumber--->", ownerNumber);
    // console.log("report",report)
    const deptAdminNumber = await getDepartmentAdmin(
      report.organizationid,
      report.departmentid
    );

    // console.log("deptAdminNumber--->", deptAdminNumber);

    const templateData = {
      templateName: "task_report_with_pdf",
      languageCode: "en",
      filename: `${report.department}_report.pdf`,
      variable: [],
    };

    // const baseUrlPrefix = 'https://5e4f1d94b966.ngrok-free.app/';
    const baseUrlPrefix = "https://prosys.ftisindia.com/";

    if (report.isOwnerReport && ownerNumber) {
      // Send only to owner
      await connect_acube24.sendTemplateDocument(
        ownerNumber,
        templateData,
        // report.fileUrl.slice(36, 200)
        // report.fileUrl.slice(29, 200)
        report.fileUrl.replace(baseUrlPrefix, "")
      );
      console.log(` Sent Owner Report to ${ownerNumber}`);
    } else if (!report.isOwnerReport && deptAdminNumber) {
      // Send only to department admin
      await connect_acube24.sendTemplateDocument(
        deptAdminNumber,
        templateData,
        // report.fileUrl.slice(36, 200)
        // report.fileUrl.slice(29, 200)
        report.fileUrl.replace(baseUrlPrefix, "")
      );
      console.log(` Sent Department Report to ${deptAdminNumber}`);
    }
  }

  return true;
}

async function processTaskReport(period) {
  console.log("Generating", period, "reports...");

  const tasks = await fetchTaskSummary(period);
  const reports = await generateTaskReportPDF(tasks, period);
  // console.log(reports);

  console.log("Sending WhatsApp messages...");
  await sendReportsToWA(reports);

  console.log("Finished sending", period, "reports");
}

async function processWeeklytasks() {
  await processTaskReport("weekly");
}

async function processMonthlytasks() {
  await processTaskReport("monthly");
}

// cron for weekly and monthly
// runCron.runWeeklyAt9(processWeeklytasks);
// runCron.runMonthlyAt9(processMonthlytasks)

// testing
// async function runCronfun1() {
//   await processTaskReport("weekly");
// }

// runCronfun1();

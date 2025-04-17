const express = require("express");
const multer = require("multer");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("uploads")); // Serve uploaded files

// Helper: Ensure directory exists
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Helper: Format file size
const formatFileSize = (bytes) => {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(2) + " KB";
  return bytes + " bytes";
};

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = "uploads/others";

    if (file.mimetype.startsWith("image/")) {
      uploadPath = "uploads/images";
    } else if (file.mimetype.startsWith("audio/")) {
      uploadPath = "uploads/audio";
    } else if (file.mimetype.startsWith("video/")) {
      uploadPath = "uploads/video";
    } else if (file.mimetype === "application/pdf") {
      uploadPath = "uploads/pdf";
    } else if (
      file.mimetype === "application/msword" ||
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "text/plain"
    ) {
      uploadPath = "uploads/documents";
    }

    ensureDir(uploadPath);
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Upload route
app.post("/upload", upload.single("file"), (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).send({ status: false, message: "No file uploaded." });
    }

    const response = {
      status: true,
      message: "File uploaded successfully",
      data: {
        fieldname: file.fieldname,
        originalname: file.originalname,
        encoding: file.encoding,
        mimetype: file.mimetype,
        destination: file.destination,
        filename: file.filename,
        path: file.path,
        size: formatFileSize(file.size),
        rawSize: file.size
      }
    };

    console.log("File Metadata:", response.data);
    res.send(response);
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).send({ status: false, message: "Server error", error: err });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

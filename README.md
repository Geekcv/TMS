const crypto = require("crypto");
const fs = require("fs");

// Generate Public & Private Keys
function generateKeys() {
  const privateKey = crypto.randomBytes(32).toString("hex"); // 256-bit key
  const publicKey = crypto.createHash("sha256").update(privateKey).digest("hex"); // Hash of private key

  fs.writeFileSync("privateKey.txt", privateKey, { encoding: "utf8" });
  fs.writeFileSync("publicKey.txt", publicKey, { encoding: "utf8" });

  console.log("✅ Keys Generated & Stored Successfully!");
}

// Generate License
function generateLicense(userName, userEmail, machineID) {
  if (!fs.existsSync("privateKey.txt")) {
    console.error("❌ Private key not found! Run generateKeys() first.");
    return;
  }

  const privateKey = fs.readFileSync("privateKey.txt", "utf8").trim();
  const licenseId = crypto.randomUUID();
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1-year expiry

  const licenseData = `${licenseId}|${userName}|${userEmail}|${machineID}|${expiryDate.toISOString()}`;

  // Generate Signature using Private Key (HMAC)
  const signature = crypto.createHmac("sha256", privateKey).update(licenseData).digest("hex");

  const license = {
    licenseId,
    userName,
    userEmail,
    machineID,
    expiryDate,
    signature,
  };

  // Save License to File
  fs.writeFileSync("license.json", JSON.stringify(license, null, 2));

  console.log("✅ License Generated & Stored Successfully!");
}

// Validate License
function validateLicense() {
  if (!fs.existsSync("publicKey.txt") || !fs.existsSync("license.json")) {
    console.error("❌ Public key or license file not found!");
    return false;
  }

  const publicKey = fs.readFileSync("publicKey.txt", "utf8").trim();
  const license = JSON.parse(fs.readFileSync("license.json", "utf8"));

  // Recreate license data (excluding signature)
  const licenseData = `${license.licenseId}|${license.userName}|${license.userEmail}|${license.machineID}|${license.expiryDate}`;

  // Recalculate signature using Public Key
  const computedSignature = crypto.createHmac("sha256", publicKey).update(licenseData).digest("hex");

  // Compare signatures
  if (computedSignature === license.signature) {
    console.log("✅ License is VALID!");
    return true;
  } else {
    console.error("❌ License is INVALID!");
    return false;
  }
}

// Run functions
generateKeys(); // Generate keys once
generateLicense("John Doe", "john.doe@example.com", "A1B2C3D4E5F6G7H8"); // Generate License
validateLicense(); // Validate License

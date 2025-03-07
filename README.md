const fs = require("fs");
const crypto = require("crypto");

// Function to Generate Keys
function generateKeys() {
    const privateKey = crypto.randomBytes(32).toString("hex"); // 256-bit random key
    const publicKey = crypto.createHash("sha256").update(privateKey).digest("hex"); // Hash of private key

    // Store Keys in Files
    fs.writeFileSync("privateKey.txt", privateKey, { encoding: "utf8" });
    fs.writeFileSync("publicKey.txt", publicKey, { encoding: "utf8" });

    console.log("✅ Keys Generated & Stored Successfully!");
}

// Run Function
generateKeys();




const crypto = require("crypto");
const fs = require("fs");

// Load Private Key
const privateKey = fs.readFileSync("privateKey.txt", "utf8");

// Function to Generate License
function generateLicense(userName, userEmail, machineID) {
    const licenseData = `${userName}|${userEmail}|${machineID}|${Date.now()}`;
    
    // Create Signature using Private Key (HMAC)
    const signature = crypto.createHmac("sha256", privateKey).update(licenseData).digest("hex");

    const license = {
        userName,
        userEmail,
        machineID,
        signature,
    };

    // Save License to File
    fs.writeFileSync("license.json", JSON.stringify(license, null, 2));

    console.log("✅ License Generated & Stored Successfully!");
}

// Example Usage
generateLicense("John Doe", "john.doe@example.com", "A1B2C3D4E5F6G7H8");



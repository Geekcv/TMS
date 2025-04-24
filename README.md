function generateUniqueNumber() {
    const timestamp = Date.now(); // current time in milliseconds
    const random = Math.floor(Math.random() * 10000); // random 4-digit number
    return `${timestamp}${random}`;
}

const uniqueNumber = generateUniqueNumber();
console.log("Unique Number:", uniqueNumber);

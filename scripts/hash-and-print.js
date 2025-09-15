// scripts/hash-and-print.js
const bcrypt = require("bcryptjs");

(async () => {
  const plain = process.argv[2] || "newPassword123!";
  const hash = await bcrypt.hash(plain, 12);
  console.log("Plain:", plain);
  console.log("Hash :", hash);
})();

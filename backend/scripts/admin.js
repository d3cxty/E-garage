import bcrypt from "bcryptjs";
const password = "12345678";
const hash = await bcrypt.hash(password, 10)
console.log(hash)
const fs = require('fs');
const content = fs.readFileSync('full_init.sql', 'utf8');
const match = content.match(/CREATE TYPE "Role" AS ENUM \(([^)]+)\)/);
if (match) {
    console.log('Role Enum:', match[1]);
} else {
    console.log('Role Enum not found');
    // Try without quotes
    const match2 = content.match(/CREATE TYPE Role AS ENUM \(([^)]+)\)/);
    if (match2) console.log('Role Enum:', match2[1]);
}
const userTable = content.match(/CREATE TABLE "User" \(([\s\S]+?)\);/);
if (userTable) {
    console.log('User Table:', userTable[1]);
}

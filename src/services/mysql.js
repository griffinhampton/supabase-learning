/* eslint-env node */
const mysql = require('mysql');

const connection = mysql.createConnection({
    host:'cse335.courses.cse.louisville.edu',
    user:'student_gmhamp01',
    password:'Spring26',
    database:'JSONify'
});

connection.connect((err) => {
    if(err) throw err;
    console.log("connected!")
});


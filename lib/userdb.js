
const mysql = require('mysql');
const exceljs = require('exceljs');
//const { config } = require('dotenv');
const workbook = new exceljs.Workbook();

module.exports.ListSheet = ListSheet;
module.exports.ImportExcel = ImportExcel;
module.exports.ListData = ListData;
module.exports.InsertData = InsertData;

function ListSheet(schema, callback){
    let mySQL_config = {
        host: process.env.MySQL_HOST,
        user: process.env.MySQL_USER,
        password: process.env.MySQL_PASS,
        port: process.env.MySQL_PORT,
        ssl: true
    };
    let connection = new mysql.createConnection(mySQL_config);
    queryInfo = "show tables from " +  schema;
    connection.query(queryInfo, (err, results, fields) => {
        // If no tables in this schema, return []
        if (err) return callback([]);
        let loc = "Tables_in_" + schema.toLowerCase();
        let sheetList = results.map( e => e[loc]);
        callback(sheetList);
    });
    connection.end((err) =>{ 
        if (err) throw err;
        else  console.log('Closing connection.');
    });
}
function ImportExcel(path, schema, callback){
    let newSheet = new Array();
    let mySQL_config = {
        host: process.env.MySQL_HOST,
        user: process.env.MySQL_USER,
        password: process.env.MySQL_PASS,
        port: process.env.MySQL_PORT,
        ssl: true
    };
    let connection = new mysql.createConnection(mySQL_config);
    let queryInfo = "create database if not exists " + schema;
    
    connection.query(queryInfo, (err, results, fields) => {
        if (err) throw err;
        console.log("Schema checks.");
    });
    workbook.xlsx.readFile(path).then(()=>{
        workbook.eachSheet((worksheet, sheetId)=>{
            queryInfo = "create table if not exists " + schema + "." + worksheet.name;
            newSheet.push(worksheet.name);
            worksheet.eachRow({ includeEmpty: false }, (row, rowNumber)=>{
                if(rowNumber == 1){
                    queryInfo += "(";
                    for(let i = 1; i < row.values.length; i++){
                        queryInfo += row.values[i].toString() + " varchar(1000)"
                        if( i != row.values.length-1){
                            queryInfo += ",";
                        }
                    }
                }
                else{
                    queryInfo = "insert into " + schema + "." + worksheet.name;
                    queryInfo += " values ("
                    for(let i = 1; i < row.values.length; i++){
                        queryInfo += "'" + row.values[i].toString() + "'";
                        if( i != row.values.length-1){
                            queryInfo += ",";
                        }
                    }
                }
                queryInfo += ")";
                console.log(queryInfo);
                connection.query(queryInfo, (err, results, fields) => {
                    if (err) throw err;
                    console.log("Done.");
                });
            });
        });
    }).then(()=>{
        connection.end((err) =>{ 
            if (err) throw err;
            else  console.log('Closing connection.');
        });
    }).then((err)=>{
        callback(err,newSheet);
    }).catch((err)=>{
        callback(err,undefined);
    });
}
function ListData(schema, sheet, callback){
    let mySQL_config = {
        host: process.env.MySQL_HOST,
        user: process.env.MySQL_USER,
        password: process.env.MySQL_PASS,
        port: process.env.MySQL_PORT,
        ssl: true
    };
    let connection = new mysql.createConnection(mySQL_config);
    let queryInfo = "select * from " +  schema + "." + sheet;
    connection.query(queryInfo, (err, results, fields) => {
        if (err) throw err;
        console.log()
        callback(results);
    });
    connection.end((err) =>{ 
        if (err) throw err;
        else  console.log('Closing connection.');
    });
}
function InsertData(schema, sheet, inputData, callback){
    let mySQL_config = {
        host: process.env.MySQL_HOST,
        user: process.env.MySQL_USER,
        password: process.env.MySQL_PASS,
        port: process.env.MySQL_PORT,
        ssl: true
    };
    let connection = new mysql.createConnection(mySQL_config);
    let queryInfo = "insert into " + schema + "." + sheet + " values (";
    Object.keys(inputData).map((e)=>{
        queryInfo += "'" + inputData[e].toString() + "'" + ",";
    });
    queryInfo = queryInfo.slice(0, queryInfo.length-1);
    queryInfo += ")";
    connection.query(queryInfo, (err, results, fields) => {
        if (err) throw err;
    });
    //return current row count in this table
    queryInfo = "select count(*) as totalRow from " + schema + "." + sheet;
    connection.query(queryInfo, (err, results, fields) =>{
        if(err) throw err;
        callback(results[0].totalRow);
    });
    connection.end((err) =>{ 
        if (err) throw err;
        else  console.log('Closing connection.');
    });
}
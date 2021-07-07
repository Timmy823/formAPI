import mysql from 'mysql2';
import fs from 'fs';
import exceljs from 'exceljs';

const workbook = new exceljs.Workbook();

class AccessSheetData {
    constructor(schema){
        this.schema = schema.toLowerCase();
        this.mysql_config = {
            host: process.env.MySQL_HOST,
            user: process.env.MySQL_USER,
            password: process.env.MySQL_PASS,
            database: this.schema,
            port: process.env.MySQL_PORT
        };
        this.connection = new mysql.createConnection(this.mysql_config);

    }
    // List all tables in this schema, and use static function.
    listsheet(callback){
        let queryInfo = "show tables from " +  this.schema;
        this.connection.query(queryInfo, (err, results, fields) => {
            // If no tables in this schema, return []
            if (err) return callback([]);
            let loc = "Tables_in_" + this.schema;
            let sheetList = results.map( e => e[loc]);
            callback(sheetList);
        });
    }
    // Upload .xlsx into this schema, and use static function.
    async importData(path, filetype, callback){
        let queryInfo = "create database if not exists " + this.schema;
        let newSheet = new Array();
        this.connection.query(queryInfo, (err) => {
            if (err) throw err;
            console.log("Schema checks.");
        });
        // According to different file type, use different api to read data into mysql.
        if(filetype === "xlsx" || filetype === "lsx" || filetype === "csv"){
            let readfunc;
            if(filetype === ".csv"){
                readfunc = workbook.csv.readFile(path);
            }
            else{
                readfunc = workbook.xlsx.readFile(path);
            }
            // Use promise.then() to control async functions
            readfunc.then(()=>{
                workbook.eachSheet((worksheet, sheetId)=>{
                    queryInfo = "create table if not exists " + worksheet.name;
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
                            queryInfo = "insert into " + worksheet.name;
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
                        this.connection.query(queryInfo, (err, results, fields) => {
                            if (err) throw err;
                            console.log("Done.");
                        });
                    });
                });
            }).then(()=>{
                callback(newSheet);
            }).catch(()=>{
                callback(undefined);
            });
        }
        else{
            // Use promise to control the async function order.
            fs.readFile(path, "utf8", (err, content) => {
                if (err) throw err;
                const fileContent = JSON.parse(content);
                Object.keys(fileContent).map((table) => {
                    let queryInfo = "create table if not exists " + table;
                    newSheet.push(table);
                    queryInfo += "(";
                    const colomns = Object.keys(fileContent[table]);
                    colomns.map((col, idx) => {
                        console.log(col);
                        queryInfo += col + " " + fileContent[table][col];
                        if (idx != colomns.length - 1) {
                            queryInfo += ",";
                        }
                    });
                    queryInfo += ")";
                    console.log(queryInfo);
                    this.connection.query(queryInfo, (err, results, fields) => {
                        if (err) throw err;
                        console.log("Done.");
                    });
                });
                callback(newSheet);
            });
        }

    }
    // List all data in this sheet.
    listdata(sheetName, callback){
        //let queryInfo = "select * from " +  this.schema + "." + sheetName;
        let queryInfo = "select * from " + sheetName;
        // Use promise.then() to control the async functions.
        /*
          Return the table content as {"column name":"value"}
        */
        this.connection.promise().query(queryInfo)
        .then(([results, fields])=>{
            if(results.length == 0){
                return 0;
            }
            callback(JSON.parse(JSON.stringify(results)));   
        }).then((len_)=>{
            if(len_ == 0){
                queryInfo = "select column_name from information_schema.columns where table_name = '" + sheetName + "' order by 'order'";
                this.connection.query(queryInfo, (err, results, fields) => {
                    let resObj = new Object();
                    console.log(results);
                    results.map((e)=>{
                        resObj[e['COLUMN_NAME']] = "";
                    });
                    console.log(resObj);
                    callback([resObj]);
                });
            }
        }).catch((err)=>{
            console.log(err);
        });
    }
    // Insert data into this sheet.
    insertdata(sheetName, inputData, callback){
        let queryInfo = "insert into " + sheetName + " values (";
        Object.keys(inputData).map((e)=>{
            queryInfo += "'" + inputData[e].toString() + "'" + ",";
        });
        queryInfo = queryInfo.slice(0, queryInfo.length-1);
        queryInfo += ")";
        this.connection.promise().query(queryInfo)
        .then(()=>{
            //return current row number in this table
            queryInfo = "select count(*) as totalRow from " + "." + sheetName;
            this.connection.query(queryInfo, (err, results,fields)=>{
                const totalRow = JSON.parse(JSON.stringify(results[0])).totalRow;
                callback(totalRow);
            });
        }).catch((err)=>{
            console.log(err);
        });
    }
}
//module.exports = AccessSheetData;
export {AccessSheetData};
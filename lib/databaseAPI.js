const mysql = require('mysql');
const fs = require('fs');
const exceljs = require('exceljs');
const { resolve } = require('path');
//const { config } = require('dotenv');
const workbook = new exceljs.Workbook();
class AccessSheetData{
    constructor(){
    }
    sheet = class Sheet{
        constructor(sheetName){
            this.sheetName = sheetName;
        }
        // List all tables in this schema, and use static function.
        static listsheet(schema, callback){
            let mySQL_config = {
                host: process.env.MySQL_HOST,
                user: process.env.MySQL_USER,
                password: process.env.MySQL_PASS,
                port: process.env.MySQL_PORT,
                ssl: true
            };
            let connection = new mysql.createConnection(mySQL_config);
            let queryInfo = "show tables from " +  schema;
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
        // Upload .xlsx into this schema, and use static function.
        static importData(path, filetype, schema, callback){
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
            let readfunc;
            connection.query(queryInfo, (err, results, fields) => {
                if (err) throw err;
                console.log("Schema checks.");
            });
            // According to different file type, use different api to read data into mysql.
            if(filetype == "xlsx" || filetype == "lsx" || filetype == "csv"){
                if(filetype == ".csv"){
                    readfunc = workbook.csv.readFile(path);
                }
                else{
                    readfunc = workbook.xlsx.readFile(path);
                }
                readfunc.then(()=>{
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
            else{
                // Use promise to control the async function order.
                const promise = new Promise((resolve, reject) => {
                    resolve();
                })
                .then(()=>{
                    return new Promise((resolve, reject)=>{
                        fs.readFile(path, "utf8", (err, content) => {
                            const fileContent = JSON.parse(content);
                            
                            Object.keys(fileContent).map((table)=>{
                                let queryInfo = "create table if not exists " + schema + "." + table;
                                newSheet.push(table);
                                queryInfo += "(";
                                const colomns = Object.keys(fileContent[table]);
                                colomns.map((col, idx)=>{
                                    queryInfo += col + " " +fileContent[table][col];
                                    if( idx != colomns.length-1){
                                        queryInfo += ",";
                                    }
                                });
                                queryInfo += ")";
                                //console.log(queryInfo);
                                connection.query(queryInfo, (err, results, fields) => {
                                    if (err) throw err;
                                    console.log("Done.");
                                });
                            });
                            resolve();
                        });
                    });
                }).then(()=>{
                    return new Promise((resolve, reject)=>{
                        connection.end((err) =>{ 
                            if (err) throw err;
                            else  console.log('Closing connection.');
                        });
                        resolve();
                    });
                }).then((err)=>{
                    callback(err,newSheet);
                }).catch((err)=>{
                    callback(err,undefined);
                });
            }
            
        }
        // List all data in this sheet.
        listdata(schema, callback){
            let mySQL_config = {
                host: process.env.MySQL_HOST,
                user: process.env.MySQL_USER,
                password: process.env.MySQL_PASS,
                port: process.env.MySQL_PORT,
                ssl: true
            };
            let connection = new mysql.createConnection(mySQL_config);
            let queryInfo = "select * from " +  schema + "." + this.sheetName;
            let tempLength;
            // Use promise to control the async function order.
            const promise = new Promise((resolve,reject)=>{
                resolve();
            }).then(()=>{
                return new Promise((resolve,reject)=>{
                    connection.query(queryInfo, (err, results, fields) => {
                        if (err) throw err;
                        tempLength = results.length;
                        if(results.length>0){
                            callback(results);
                        }
                        resolve();
                    });
                });
            }).then(()=>{
                return new Promise((resolve,reject)=>{
                    if(tempLength == 0){
                        queryInfo = "select column_name from information_schema.columns where table_name = '" + this.sheetName + "'";
                        connection.query(queryInfo, (err, results, fields) => {
                            if (err) throw err;
                            let resObj = new Object();
                            results.map((e)=>{
                                resObj[e['COLUMN_NAME']] = "";
                            });
                            console.log(resObj);
                            callback([resObj]);
                            resolve();
                        });
                    }
                    
                });
            }).then(()=>{
                connection.end((err) =>{ 
                    if (err) throw err;
                    else  console.log('Closing connection.');
                });
            }).catch(()=>{
                console.log("error");
            }); 
        }
        // Insert data into this sheet.
        insertdata(schema, inputData, callback){
            let mySQL_config = {
                host: process.env.MySQL_HOST,
                user: process.env.MySQL_USER,
                password: process.env.MySQL_PASS,
                port: process.env.MySQL_PORT,
                ssl: true
            };
            let connection = new mysql.createConnection(mySQL_config);
            let queryInfo = "insert into " + schema + "." + this.sheetName + " values (";
            Object.keys(inputData).map((e)=>{
                queryInfo += "'" + inputData[e].toString() + "'" + ",";
            });
            queryInfo = queryInfo.slice(0, queryInfo.length-1);
            queryInfo += ")";
            connection.query(queryInfo, (err, results, fields) => {
                if (err) throw err;
            });
            //return current row count in this table
            queryInfo = "select count(*) as totalRow from " + schema + "." + this.sheetName;
            connection.query(queryInfo, (err, results, fields) =>{
                if(err) throw err;
                callback(results[0].totalRow);
            });
            connection.end((err) =>{ 
                if (err) throw err;
                else  console.log('Closing connection.');
            });
        }
    }
}
module.exports = AccessSheetData;
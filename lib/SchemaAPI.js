import mysql from 'mysql2';
import fs from 'fs';
import exceljs from 'exceljs';
import {NumberAPI} from './NumberAPI.js';
const workbook = new exceljs.Workbook();

class AccessSchemaData {
    constructor(schema){
        this.schema = schema.toLowerCase();
        this.mysql_config = {
            host: process.env.MySQL_HOST,
            user: process.env.MySQL_USER,
            password: process.env.MySQL_PASS,
            port: process.env.MySQL_PORT
        };
        this.connection = new mysql.createConnection(this.mysql_config);

        // Ensure existence of the database(schema)
        let queryInfo = "create database if not exists " + this.schema;
        this.connection.query(queryInfo, (err) => {
            if (err) throw err;
            console.log("Schema checks.");
        });
    }
    // List all tables in this schema.
    listsheet(callback){
        let queryInfo = "show tables from " +  this.schema;
        this.connection.query(queryInfo, (err, results, fields) => {
            if (err) throw err;
            let sheetList;
            if(results.length > 0){
                let loc = "Tables_in_" + this.schema;
                sheetList = results.map( e => e[loc]);
            }            
            callback(sheetList);
        });
    }
    // Upload file content into this schema, and return the new-built table names.
    async importData(path, filetype, callback){
        let newSheet = new Array();
        let queryInfo;
        console.log(this.mysql_config);
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
                    queryInfo = "create table if not exists " + this.schema + "." + worksheet.name;
                    newSheet.push(worksheet.name);
                    let columnList = new Array();
                    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber)=>{
                        // create a table whose column datatype is default varchar(256)
                        if(rowNumber == 1){
                            queryInfo += "(";
                            row.values.forEach(col => {
                                columnList.push(col);
                                queryInfo += col + " varchar(256),"
                            });
                        }
                        else{
                            queryInfo = "insert into " + this.schema + "." + worksheet.name + " values (";
                            // check the content and modify the datatype of 
                            if(rowNumber == 2){
                                row.values.forEach((col,i) => {
                                    console.log(i);
                                    console.log(Number(col));
                                    if(isNaN(Number(col)) === false){
                                        if(NumberAPI.IsInt(Number(col))){
                                            this.connection.query("alter table "+this.schema+"."+worksheet.name+" modify "+columnList[i-1]+" int(10)", 
                                            (err, results, fields) => {
                                                if (err) throw err;
                                            });
                                        }
                                        else{
                                            this.connection.query("alter table "+this.schema+"."+worksheet.name+" modify "+columnList[i-1]+" float(2)", 
                                            (err, results, fields) => {
                                                if (err) throw err;
                                            });
                                        }
                                    }
                                    queryInfo += "'" + col + "',";
                                });
                            }
                            else{
                                row.values.forEach(col => {
                                    queryInfo += "'" + col + "',";
                                });
                            }
                        }
                        queryInfo = queryInfo.slice(0, -1) + ")";
                        console.log(queryInfo);
                        this.connection.query(queryInfo, (err, results, fields) => {
                            if (err) throw err;
                        });
                    });
                });
            }).then(()=>{
                callback(newSheet);
            }).catch((err)=>{
                console.log(err);
                callback(undefined);
            });
        }
        else{
            fs.readFile(path, "utf8", (err, content) => {
                if (err) throw err;
                const fileContent = JSON.parse(content);
                Object.keys(fileContent).forEach(table => {
                    queryInfo = "create table if not exists " + this.schema + "." + table + "(";
                    newSheet.push(table);
                    const colomns = Object.keys(fileContent[table]);
                    colomns.forEach(col => {
                        if(fileContent[table][col] === "string"){
                            queryInfo += col + " varchar(256),";
                        }
                        else if(fileContent[table][col] === "integer"){
                            queryInfo += col + " int(10),";
                        }
                        else{
                            queryInfo += col + " float(2),";
                        }
                        
                    });
                    queryInfo = queryInfo.slice(0, -1) + ")";
                    console.log(queryInfo);
                    this.connection.query(queryInfo, (err, results, fields) => {
                        if (err) throw err;
                    });
                });
                callback(newSheet);
            });
        }
    }
    // List all data in this sheet. 
    listdata(sheetName, callback){
        let queryInfo = "select * from " +  this.schema + "." + sheetName;
        // Use promise.then() to control the async functions.
        /*
          Return the table content as [{"column name":"value"}...]
        */
        this.connection.promise().query(queryInfo)
        .then(([results, fields])=>{
            if(results.length > 0){
                callback(JSON.parse(JSON.stringify(results)));
            }
            return results.length;
        }).then((len_)=>{
            if(len_ == 0){
                queryInfo = "select column_name from information_schema.columns where table_name = '" + sheetName + "' order by ordinal_position";
                //queryInfo += "show columns from" + this.schema + "." + sheetName;
                this.connection.query(queryInfo, (err, results, fields) => {
                    let resObj = new Object();
                    console.log(results);
                    results.forEach(col =>{
                        resObj[col['COLUMN_NAME']] = "";
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
    insertdata(sheetName, inputData){
        let queryInfo = "insert into " + this.schema + "." + sheetName + " values (";
        Object.keys(inputData).forEach( key =>{
            queryInfo += "'" + inputData[key] + "',";
        });
        queryInfo = queryInfo.slice(0, -1) + ")";

        this.connection.query(queryInfo, (err, results, fields) => {
            if(err) throw err;
        });
    }
}
//module.exports = AccessSheetData;
export {AccessSchemaData};
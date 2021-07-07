import mysql from 'mysql2';
import fs from 'fs';
import exceljs from 'exceljs';

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
    // Upload .xlsx into this schema.
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
                    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber)=>{
                        console.log(row);
                        if(rowNumber == 1){
                            queryInfo += "(";
                            row.values.forEach(col => {
                                queryInfo += col.toString() + " varchar(1000),"
                            });
                        }
                        else{
                            queryInfo = "insert into " + this.schema + "." + worksheet.name + " values (";
                            row.values.forEach(col => {
                                queryInfo += "'" + col.toString() + "',";
                            });
                        }
                        queryInfo = queryInfo.slice(0, queryInfo.length-1);
                        queryInfo += ")";
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
                        queryInfo += col + " " + fileContent[table][col] + ",";
                    });
                    queryInfo = queryInfo.slice(0, queryInfo.length-1);
                    queryInfo += ")";
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
                queryInfo = "select column_name from information_schema.columns where table_name = '" + sheetName + "' order by 'order'";
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
    insertdata(sheetName, inputData, callback){
        let queryInfo = "insert into " + this.schema + "." + sheetName + " values (";
        Object.keys(inputData).forEach( key =>{
            queryInfo += "'" + inputData[key].toString() + "',";
        });
        queryInfo = queryInfo.slice(0, queryInfo.length-1);
        queryInfo += ")";

        this.connection.query(queryInfo, (err, results, fields) => {
            if(err) throw err;
        });
    }
}
//module.exports = AccessSheetData;
export {AccessSchemaData};
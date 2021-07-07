import dotenv from 'dotenv';
import path from 'path';

import express from 'express';
import exphbs from 'express-handlebars';
import multer from 'multer';

import {AccessSheetData} from './lib/new_databaseAPI.js';
//const userdb = require('./lib/userdb.js');
//const AccessSheetData = require('./lib/databaseAPI.js');
//const dbAPI = new AccessSheetData().sheet;

dotenv.config();
const __dirname = path.resolve();
const app = express();
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, __dirname + '/public/upload/')      //you tell where to upload the files,
    },
    filename:  (req, file, cb) => {
        cb(null, file.originalname)
    }
});
const upload = multer({storage: storage});

const dbAPI = new AccessSheetData('database_2');

app.engine('.hbs',exphbs({
    defaultLayout:'main',
    extname:'.hbs',
    layoutsDir: __dirname+'/views/layouts/',
    partialsDir: __dirname+'/views/partials/'
}))
//set the view engine is .hbs
app.set('view engine', '.hbs')

app.use(express.static(__dirname + '/public'))
app.use(express.urlencoded({extended:false}))
app.use(express.json())

app.get('/',(req, res)=>{
    // Receive the current table in this schema
    dbAPI.listsheet((reply)=>{
        res.render('home',{
            sheetList: reply
        });
    });
});
app.get('/listData', (req, res)=>{
    // Receive the whole data of the given sheet
    dbAPI.listdata(req.query.sheetName, (reply)=>{
        if(typeof reply !== 'undefined'){
            res.status(200).send({
                SheetData: reply
            });
        }
    });
});
app.post('/', upload.single('file'), (req, res)=>{
    const filetype = req.file['filename'].split(".")[1];
    // Receive the list of new table
    dbAPI.importData(req.file.path, filetype, (reply)=>{
        if(typeof reply !== 'undefined'){
            console.log(reply);
            res.status(200).send({
                newSheet: reply
            });
        }
        else{
            console.log("上傳失敗");
        }
    });
});
app.post('/insertData', (req, res)=>{
    const inputData = JSON.parse(JSON.stringify(req.body));
    console.log(inputData);
    delete inputData.sheetName;
    // Receive the current row number.
    dbAPI.insertdata(req.body.sheetName, inputData,(reply)=>{
        res.status(200).send({
            currRow: reply
        });
    });
});
app.listen(3000,()=>{
    console.log("web build");
});
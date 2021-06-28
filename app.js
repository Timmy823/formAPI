const express = require('express');
const exhbs = require('express-handlebars');
const multer = require('multer');
//const userdb = require('./lib/userdb.js');
const AccessSheetData = require('./lib/databaseAPI.js');
const dbAPI = new AccessSheetData().sheet;
require('dotenv').config()

const app = express();

app.engine('.hbs',exhbs({
    defaultLayout:'main',
    extname:'.hbs',
    layoutsDir:__dirname+'/views/layouts/',
    partialsDir:__dirname+'/views/partials/'
}));
//set the view engine is .hbs
app.set('view engine', '.hbs');

app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({extended:false}));
app.use(express.json());

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname + '/public/upload/')      //you tell where to upload the files,
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});
const upload = multer({storage: storage});



app.get('/',(req, res)=>{
    dbAPI.listsheet('database_2', (reply)=>{
        res.render('home',{
            sheetList: reply
        });
    });
    // userdb.ListSheet('suitAPP', (reply)=>{
    //     res.render('home',{
    //         sheetList: reply
    //     });
    // });
});
app.get('/listData', (req, res)=>{
    new dbAPI(req.query.sheetName).listdata('database_2', (reply)=>{
        if(typeof reply !== 'undefined'){
            res.status(200).send({
                SheetData: reply
            });
        }
    });
    // userdb.ListData('suitAPP', req.query.sheetName, (reply)=>{
    //     if(typeof reply !== 'undefined'){
    //         res.status(200).send({
    //             SheetData: reply
    //         });
    //     }
    // });
});
app.post('/', upload.single('file'), (req, res)=>{
    const filetype = req.file['filename'].split(".")[1];
    dbAPI.importData(req.file.path, filetype,'database_2',(err, reply)=>{
        if(err) console.log(err);
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
    // userdb.ImportExcel(req.file.path,'suitAPP',(err, reply)=>{
    //     if(err) console.log(err);
    //     if(typeof reply !== 'undefined'){
    //         console.log(reply);
    //         res.status(200).send({
    //             newSheet: reply
    //         });
    //     }
    //     else{
    //         console.log("上傳失敗");
    //     }
    // });
});
app.post('/insertData', (req, res)=>{
    let inputData = JSON.parse(JSON.stringify(req.body));
    console.log(inputData);
    delete inputData.sheetName;
    new dbAPI(req.body.sheetName).insertdata('database_2', inputData,(reply)=>{
        res.status(200).send({
            currRow: reply
        });
    });
    // userdb.InsertData('suitAPP',req.body.sheetName, inputData,(reply)=>{
    //     res.status(200).send({
    //         currRow: reply
    //     });
    // });
});
app.listen(3000,()=>{
    console.log("web build");
});
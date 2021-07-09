$(document).ready(()=>{
    let file;
    let currColumnName;

    /* customized valiated method */
    // $.validator.addMethod("phoneNum", function(value, element) {
    //     console.log(this);
    //     return this.optional(element) || /^\d{4}-\d{3}-\d{3}$/.test(value);
    // }, 'Please enter valid phone number');

    // list all data in this selected data and display in the table.
    $('select').change((e)=>{
        console.log("change");
        $('option[value=initial]').attr("disabled", "disabled");
        $('#append').attr("disabled", false);
        $.ajax({
            type: "GET",
            dataType: "json",
            data: {
                sheetName: $('option:selected').val()
            },
            url: "/listData",
            success:(data)=>{
                console.log("success");
                $(".table").find('thead').empty();
                const columns = Object.keys(data.SheetData[0]);
                currColumnName = [...columns];
                let tableContent = [$('<tr>'),$('<th scope="col">#</th>')];
                columns.forEach(e=>{
                    tableContent.push($('<th scope="col">' +e+'</th>'));
                });
                tableContent.push($('</tr>'));
                if(data.SheetData[0][columns[0]]==""){
                    console.log("no data");
                    $('#edit').attr("disabled", "disabled");
                    //$('#delete').attr("disabled", "disabled");
                }
                else{
                    data.SheetData.map((e, idx)=>{
                        tableContent.push($('<tr>'));
                        tableContent.push($('<th scope="row">' +(idx+1).toString()+'</th>'));
                        for(let key in columns){
                            tableContent.push($('<th scope="row">' +e[columns[key]]+'</th>'));
                        }
                        tableContent.push($('</tr>'));
                    });
                    $('#edit').attr("disabled", false);
                    //$('#delete').attr("disabled", false);
                }
                $(".table").find('thead').append(tableContent);
            },
            error: ()=>{
                console.log("error");
            }
        });
    });
    // Insert data for the selected sheet.
    $('#append').click(()=>{
        // First, make a form fitting the colomns of the selected sheet.
        $("form").empty();
        let formContent = new Array();   // the content of form
        let inputRule = new Object();    // validation rules
        let HintMessage = new Object();  // error messages
        formContent.push($('<p style="text-align: center;font-size: 35px;color: white;">新增資料</p>'));
        currColumnName.map((e, idx)=>{
            formContent.push($('<div class="form-group" style="width: 50%;margin-left: 20px; margin:auto"><label>'+e+'</label><input type="text" class="form-control" name="'+String.fromCharCode(65+idx)+'" placeholder="Enter '+e+'">'));
            inputRule[String.fromCharCode(65+idx)] = 'required';
            HintMessage[String.fromCharCode(65+idx)] = {
                required: "請輸入"+e
            };
        });
        formContent.push($('<p></p>'));
        formContent.push($('<button type="submit" class="btn btn-primary">Submit</button>'));
        $("form").append(formContent);
        
        // Second, bpopup this form.
        const bpopup = $('form').bPopup({
            fadeSpeed: 'slow', 
            followSpeed: 1500
        });
        console.log(inputRule);
        console.log(HintMessage);
        // Third, submit and dynamically update the content of table.
        $("form").validate({
            debug: true,
            submitHandler: (event) => {
                console.log("click");
                //event.preventDefault();
                let sendData = {
                    sheetName: $('option:selected').val()
                };
                sendData = Object.assign(sendData, $("form").serializeObject());
                console.log($("form").serializeObject());
                $.ajax({
                    type: "POST",
                    data: sendData,
                    url: "/insertData"
                });
                delete sendData.sheetName;
                let tableContent = [$('<tr>'),$('<th scope="row">' +($('tr').last().prevObject.length).toString()+'</th>')];
                Object.keys(sendData).forEach(e =>{
                    tableContent.push($('<th scope="row">' +sendData[e]+'</th>'));
                })
                $(".table").find('thead').append(tableContent);
                bpopup.close();
            },
            rules: inputRule,
            messages: HintMessage,
            highlight: function(element, errorClass) {
                $(element).addClass("error-input");
            },
            unhighlight: function(element, errorClass) {
                $(element).removeClass("error-input");
            }
        });
        // $('button[type=submit]').click((event)=>{
        //     console.log("click");
        //     event.preventDefault();
        //     let sendData = {
        //         sheetName: $('option:selected').val()
        //     };
        //     sendData = Object.assign(sendData, $("form").serializeObject());
        //     console.log($("form").serializeObject());
        //     $.ajax({
        //         type: "POST",
        //         data: sendData,
        //         url: "/insertData"
        //     });
        //     delete sendData.sheetName;
        //     let tableContent = [$('<tr>'),$('<th scope="row">' +($('tr').last().prevObject.length).toString()+'</th>')];
        //     Object.keys(sendData).forEach(e =>{
        //         tableContent.push($('<th scope="row">' +sendData[e]+'</th>'));
        //     })
        //     $(".table").find('thead').append(tableContent);
        //     bpopup.close();
        // });
    });
    // If there is a file in upload buffer, enable upload button.
    $('input[type=file]').change((e)=>{
        file = e.target.files[0];
        $('#upload').attr("disabled", false);
    });
    // Upload file and update the <option> list.
    $('#upload').click(()=>{
        const formdata = new FormData();
        formdata.append('file', file);
        $.ajax({
            type: "POST",
            processData: false,
            contentType: false,
            dataType: "json",
            data: formdata,
            url: "/",
            success:(data)=>{
                console.log("success");
                alert("上傳成功");
                $('input[type=file]').val("");
                let existTable = new Array();
                $('option').each(function(){
                    existTable.push($(this).val());
                });
                let option_type = data.newSheet.map((e)=>{
                    if(existTable.indexOf(e) == -1){
                        return $("<option value='"+e+"'>"+e+"</option>");
                    }
                });
                $("select").append(option_type);
                $('#upload').attr("disabled", "disabled");
            },
            error: ()=>{
                console.log("error");
            }
        });
    });

    // $('#edit').click(()=>{
    //     // First, make a form fitting the colomns of the selected sheet.
    //     $("form").empty();
    //     let formContent = new Array();
    //     formContent.push($('<p style="text-align: center;font-size: 35px;color: white;">編輯資料</p>'));
    //     currColumnName.map((e, idx)=>{
    //         formContent.push($('<div class="form-group" style="width: 50%;margin-left: 20px; margin:auto"><label>'+e+'</label><input type="text" class="form-control" name="'+String.fromCharCode(65+idx)+'" placeholder="Enter '+e+'">'));
    //     })
    //     formContent.push($('<p></p>'));
    //     formContent.push($('<button type="submit" class="btn btn-primary">Submit</button>'));
    //     $("form").append(formContent);

    //     // Second, bpopup this form.
    //     const bpopup = $('form').bPopup({
    //         fadeSpeed: 'slow', 
    //         followSpeed: 1500
    //     });

    //     // Third, submit and dynamically update the content of table.
    //     $('button[type=submit]').click((event)=>{
    //         console.log("click");
    //         event.preventDefault();
    //         let sendData = {
    //             sheetName: $('option:selected').val()
    //         };
    //         sendData = Object.assign(sendData, $("form").serializeObject());
    //         console.log($("form").serializeObject());
    //         $.ajax({
    //             type: "POST",
    //             data: sendData,
    //             url: "/editData"
    //         });
    //         delete sendData.sheetName;
    //         let tableContent = [$('<tr>'),$('<th scope="row">' +($('tr').last().prevObject.length).toString()+'</th>')];
    //         Object.keys(sendData).forEach(e =>{
    //             tableContent.push($('<th scope="row">' +sendData[e]+'</th>'));
    //         })
    //         $(".table").find('thead').append(tableContent);
    //         bpopup.close();
    //     });
    // });
    // $('#instruction').click(()=>{
    //     // First, make a form fitting the colomns of the selected sheet.
    //     let InstructionContent = new Array();
    //     InstructionContent.push($('<div class="instruction_bpopup" <p style="text-align: center;font-size: 35px;color: white;">上傳說明</p>'));
        
    //     InstructionContent.push($('<p></p>'));
    //     InstructionContent.push($('<p>你可以選擇有.xlsx、.lsx、.csv、.json、.txt等檔名的檔案進行上傳</p>'));
    //     $("form").append(InstructionContent);

    //     // Second, bpopup this form.
    //     const bpopup = $('form').bPopup({
    //         fadeSpeed: 'slow', 
    //         followSpeed: 1500
    //     });
    // });
});
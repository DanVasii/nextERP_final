function DynamicNodes(){}

DynamicNodes.prototype.input = function(label, placeholder = "", value="", id = "", name = "", extraClasses = "", styles = {}, ac = false)
{
    let node = document.createElement("label");

    Object.keys(styles).forEach((key)=>{
        node.style[key] = styles[key];
    })
    
    node.appendChild(document.createTextNode(label));
    
    let input = this.input_node(placeholder, value, id, name, extraClasses, "string");
    node.appendChild(input);

    if (ac)
    {
        let ac = this.ac_container();
        node.appendChild(ac);
        input.addEventListener("blur",()=>{
            node.classList.remove("ac_on");
        })

        input.addEventListener("focus",()=>{
            node.classList.add("ac_on");
        })
    }
    

    return node;
}

DynamicNodes.prototype.input_node = function(placeholder, value, id, name, extraClasses = "", type)
{
    let input = document.createElement("input");
    input.className = "input_one " + extraClasses;
    input.placeholder = placeholder;
    input.id = id;
    input.name = name;
    input.value = value;
    input.type = type;

    return input;
}

DynamicNodes.prototype.textNode_html = function (text, styles = {}){
    let node = document.createElement("div");
    node.innerHTML = text;

    Object.keys(styles).forEach((key)=>{
        node.style[key] = styles[key];
    })

    return node;
}

DynamicNodes.prototype.ac_container = function(){

    let ac = document.createElement("div");
    ac.className = "ac_container";
    let ac_list = document.createElement("div");
    ac_list.className = "ac_list";
    ac.appendChild(ac_list);
    
    return ac;
}

DynamicNodes.prototype.ac_item = function (text, err = false)
{
    let node = document.createElement("div");
    node.className = "ac_item " + (err ? "err": "");
    node.textContent = text;

    return node;
}

DynamicNodes.prototype.button = function (className, text, icon = undefined, styles = {}, clickData = {fn: ()=>{}, context: undefined, args: []})
{
    let node = document.createElement("button"), i = document.createElement("i");
    i.className = icon;
    node.className = className;
    
    Object.keys(styles).forEach((key)=>{
        node.style[key] = styles[key];
    })

    if (icon !== undefined)
        node.appendChild(i);

    node.appendChild(document.createTextNode(text));

    node.onclick = ()=>{
        if (clickData.context !== undefined)
        {
            clickData.fn.apply(clickData.context, clickData.args);
        }else{
            clickData.fn(...clickData.args);
        }
    }

    return node;
}

DynamicNodes.prototype.frag = function (...nodes)
{
    let frag = document.createDocumentFragment();

    nodes.forEach((node)=>{
        frag.appendChild(node);
    });

    return frag;
}

DynamicNodes.prototype.or = function(bg  = "white")
{
    let node = document.createElement("div");
    node.className = "or";
    node.style.backgroundColor = bg;
    
    return node;
}

DynamicNodes.prototype.clearAc = function(node){
    Array.from(node.querySelectorAll(".ac_item")).forEach((elem)=>{elem.remove()})
}

DynamicNodes.prototype.fillAc = function(data, node, nodeFill){
    let frag = document.createDocumentFragment();

    data.forEach((d)=>{
        
        let ac_node = this.ac_item(d, nodeFill===undefined);

        nodeFill!==undefined && ac_node.addEventListener("click",()=>{
            nodeFill.value = d;
            //we should delete prev nodes
            Array.from(node.querySelectorAll(".ac_item")).forEach((n)=>{
                if ( n != ac_node)
                {
                    n.remove();
                }
            })
        })
        frag.appendChild(ac_node);
    })

    node.querySelector(".ac_list").appendChild(frag);
}

DynamicNodes.prototype.container = function(...nodes)
{
    let node = document.createElement('div');

    nodes.forEach((child)=>{
        node.appendChild(child);
    });

    return node;
}

DynamicNodes.prototype.conditionBuilder = function(white = false, sheetData = undefined)
{
    if (sheetData === undefined)
    {
        Toastify({
            className: "toast_error",
            text: "There was an error! Please refresh the page or select a sheet!"
        }).showToast();
        return ;
    }

    let node = document.createElement("div");
    let sheetList_node = this.sheetList(node);
    node.className = "condition_builder--container "+ (white === true ? "white" : "");
    node.dataset.main_sheet = sheetData._id;

    let list = document.createElement("div");
    list.className = "condition_builder--list";

    node.appendChild(list);
    let button = this.button("primary_button maxW","Add Condition", "fa-regular fa-plus", {});

    button.onclick = ()=>{
        //first we should check if a sheet was seleced
        if (sheetList_node.querySelector(".sheet_list--sheet.active"))
        {
            let target_sheet = sheetList_node.querySelector(".sheet_list--sheet.active");

            list.appendChild(this.conditionNode(sheetData, {"sheetName": target_sheet.textContent, "_id": target_sheet.dataset.id}));
        }else{
            Toastify({
                className: "toast_error",
                text: "Please select the refference sheet first!"
            }).showToast();
        }
    }

    node.appendChild(button);

    return this.container(sheetList_node, node);
}

DynamicNodes.prototype.conditionNode = function(main, target){

    if (main === undefined || target === undefined)
        return ;
    console.log(main);
    console.log(target);

    let sheetSpans = [document.createElement('span'), document.createElement('span')];

    sheetSpans[0].className = "condition_builder--sheet_span";
    sheetSpans[0].dataset.which = "main";
    sheetSpans[0].textContent = main.sheetName;

    sheetSpans[1].className = "condition_builder--sheet_span";
    sheetSpans[1].dataset.which = "target";
    sheetSpans[1].textContent = target.sheetName;
    
    let node = document.createElement("div");
    node.className = "condition_builder--condition";
    
    node.appendChild(document.createTextNode("Where column "))

    let colSelector = new column_selector(main._id);
    node.appendChild(colSelector.getNode());

    node.appendChild(document.createTextNode(" from " ))
    node.appendChild(sheetSpans[0]);

    node.appendChild(document.createTextNode(" matches "));

    colSelector = new column_selector(target._id);
    node.appendChild(colSelector.getNode());

    node.appendChild(document.createTextNode(" from "));
    node.appendChild(sheetSpans[1]);


    let exit = this.exitIcon();
    exit.onclick = ()=>{
        node.remove();
    }
    node.appendChild(exit);
    return node;
}

DynamicNodes.prototype.exitIcon = function(){
    let i = document.createElement("i");
    i.className = "fa-regular fa-xmark-square";
    i.dataset.for = "close";

    return i;
}

DynamicNodes.prototype.helpCard = function (text, type)
{
    let iClass, extraClass;
    switch(type)
    {
        case "info":
            iClass = "fa-regular fa-square-info fa-beat-fade";
            extraClass = "info_card";
            break;
        default: 
            iClass = "fa-regular fa-square-info fa-beat-fade";
            extraClass = "info_card";
            break;
    }
    let node = document.createElement("div");
    node.className = "ux_card " + extraClass;

    let span = document.createElement("span");
    span.textContent = text;

    let i = document.createElement("i");
    i.className = iClass;
    node.appendChild(i);
    node.appendChild(span);

    return node;
}

DynamicNodes.prototype.searchInput = function(placeholder = "Search"){
    let template = `<label class = "search">
    <i class="fa-regular fa-search"></i>
    <input type = 'text' />
</label>`;

    let node = document.createRange().createContextualFragment(template).children[0];
    node.querySelector("input").placeholder = placeholder;
    return node;
}

DynamicNodes.prototype.title = function(content){
    let node = document.createElement("h2");
    node.textContent = content;
    node.className = "title";

    return node;
}

DynamicNodes.prototype.sheet_location = function (pageName, docName)
{
    let node = document.createDocumentFragment();
    let span_page = document.createElement("span"), span_delimiter = document.createElement("span"), span_doc = document.createElement("span");
    span_page.style = "font-weight: bold;";
    span_page.textContent = pageName;

    span_delimiter.textContent = " - ";
    
    span_doc.style = "font-weight: bold; color: var(--orange)";
    span_doc.textContent = docName;

    node.appendChild(span_page);
    node.appendChild(span_delimiter);
    node.appendChild(span_doc);

    return node;
}

DynamicNodes.prototype.sheetList =  function (condition_node = undefined)
{
    let node = document.createElement("div");
    node.className = "sheet_list--container";

    let header = document.createElement("div"), search = this.searchInput("Search sheet");
    header.className = "sheet_list--header";

    header.appendChild(this.title("My sheets"));
    header.appendChild(search);

    let body = document.createElement("div");
    body.className = "sheet_list--body";

    //ajax the sheets 
    $.ajax({
        url: "/excel/get_all_sheets",
        type: "POST",
        contentType: "application/json",
        success: (data)=>{
            console.log(data);
            if (data?.success === true)
            {
                let frag = document.createDocumentFragment();
                //start populating 
                data.data.forEach((sheet)=>{    
                    let docNode = frag.querySelectorAll(`.sheet_list--document[data-id='${sheet.document._id}']`);
                    
                    if (docNode.length == 0)
                    {
                        let docNode_header, docNode_body;
                        docNode_header = document.createElement("div");
                        docNode_header.className = "sheet_list--document_header";
                        docNode_header.appendChild(this.sheet_location(sheet.page.pageName, sheet.document.name));

                        docNode_body = document.createElement('div');
                        docNode_body.className = "sheet_list--document_body";

                        //create
                        docNode = document.createElement('div');
                        docNode.className = "sheet_list--document";
                        docNode.dataset.id = sheet.document._id;

                        docNode.appendChild(docNode_header);
                        docNode.appendChild(docNode_body);

                        frag.appendChild(docNode);
                    }else{
                        docNode = docNode[0];
                    }

                    //create the sheetNode
                    let sheetNode = document.createElement('div');
                    sheetNode.className = "sheet_list--sheet";
                    sheetNode.textContent = sheet.sheetName;
                    sheetNode.dataset.id = sheet._id;

                    docNode.querySelector(".sheet_list--document_body").appendChild(sheetNode);
                })

                body.addEventListener("click", (ev)=>{
                    if (ev.target.className == "sheet_list--sheet")
                    {
                        //ok
                        let oldNode = body.querySelector(".sheet_list--sheet.active");
                        oldNode && oldNode.classList.remove("active");
                        //we should trigger an event 
                        node.dispatchEvent(new CustomEvent("test",{
                            detail:{
                                sheetId: ev.target.dataset.id,
                                sheetName: ev.target.textContent 
                            }
                        }));

                        ev.target.classList.add("active");
                        //now we should change the conditions selectors 
                        condition_node !== undefined && Array.from(condition_node.querySelectorAll(".condition_builder--condition")).forEach((condition)=>{
                            let selector = condition.querySelectorAll(".column_selector")[1];
                            let span = condition.querySelector(".condition_builder--sheet_span[data-which='target']")
                            selector.dataset.sheet_id = ev.target.dataset.id;
                            span.textContent = ev.target.textContent;
                        })
                    }
                })

                body.appendChild(frag);
                search.querySelector("input").addEventListener("input",(ev)=>{
                    let input = ev.target.value;
                    let sheets = body.querySelectorAll(".sheet_list--sheet");

                    sheets.forEach((sheetNode)=>{
                        if (input.trim() != "" && !sheetNode.textContent.startsWith(input))
                        {
                            //no match 
                            sheetNode.style.display = "none";
                        }else{
                            sheetNode.style.display = "block";
                        }

                        let hasVisibleChild = Array.from(sheetNode.parentElement.children).some(child => getComputedStyle(child).display !== 'none');

                        console.log(hasVisibleChild);
                        if (!hasVisibleChild){
                            sheetNode.parentElement.classList.add("no_match");
                        }else{
                            sheetNode.parentElement.classList.remove("no_match");
                        }
                    })
                })
            }else{
                Toastify({
                    className: "toast_error",
                    text: "Error parsing sheets!"
                }).showToast();
            }
        },error: (err)=>{
            Toastify({
                className: "toast_error",
                text: err.responseJSON?.body || "Error parsing sheets!"
            }).showToast();
        }
    })

    node.appendChild(header);
    node.appendChild(body);
    return node;
}

DynamicNodes.prototype.options_editor = function(excel)
{
    console.log("Editing nodes now");
    let node = document.createElement("div");
    node.className = "options_editor";

    let list = document.createElement("div");
    list.className = "options_editor--list";

    let createOptionNode = (option)=>{
        let node = document.createElement("div");
        node.className = "options_editor--option";

        node.dataset.id = option?.uuid || "";
        node.appendChild(this.input("Option name", "Value", option?.value));
        node.appendChild(this.button("cancel_button", "", "fa-regular fa-trash",{}, {
            context: undefined,
            fn: ()=>{
                node.remove();
            },
            args: []
        }));
        return node;
    }

    node.appendChild(list);

    excel.getDataObjectForCell(excel.getNodesFromSelection()[0])?.typeParams?.options?.forEach((option)=>{
        list.appendChild(createOptionNode(option));
    })

    node.appendChild(this.button("primary_button maxW", "Add condition","fa-regular fa-plus",{"margin-top": "10px"}, {
        context: undefined,
        fn: ()=>{
            list.appendChild(createOptionNode());
        },
        args: []
    }));

    return this.container(node, this.button("submit_button maxW", "Submit", "fa-regular fa-check",{"margin-top": "10px", "max-width": "400px"},{
        context: undefined,
        fn: ()=>{
            let cell_object = excel.getDataObjectForCell(excel.getNodesFromSelection()[0]);
            cell_object.typeParams.options = [];
            //when we submit we should take all the inputs and update the excel.data
            Array.from(list.children).forEach((option)=>{
                
                if (option.querySelector("input").value.trim() != "")
                    cell_object.typeParams.options.push({
                        "uuid": option.dataset?.id !== "" ? option.dataset.id : crypto.randomUUID(),
                        "value": option.querySelector("input").value
                    })

            })
        },
        args: []
    }));
}   

DynamicNodes.prototype.span = function(className, styles, ...childs)
{
    let node = document.createElement("span");
    
    className != "" && (node.className = className);

    Object.keys(styles).forEach((style_name)=>{
        node.style[style_name] = styles[style_name];
    })
    childs.forEach((child)=>{
        node.appendChild(child);
    })

    return node;
}

DynamicNodes.prototype.div = function(className, styles, ...childs)
{
    let node = document.createElement("div");
    node.className = className;

    Object.keys(styles).forEach((style_name)=>{
        node.style[style_name] = styles[style_name];
    })

    childs?.forEach((child)=>{
        node.appendChild(child);
    })

    return node;
}

DynamicNodes.prototype.file_upload_import = function(types = [], extraData)
{
    let node = document.createElement("div");
    node.className = "file_upload--container";
    
    const get_import_data = ()=>{
        const sheets_object = (docNode)=>{
            let sheet_response = {
                "err": false,
                "data": []
            };

            let sheets_data = [];

            let sheetNames = docNode.querySelectorAll(".file_import--sheets_list .file_import--sheet");

            console.log(sheetNames[0]);

            Array.from(docNode.querySelectorAll(".file_import--sheet_data_element")).forEach((sheetData_node, index)=>{
                let aux = {
                    "sheetName": sheetNames[index].textContent.trim()
                };
                //now get import type for this sheet 
                let type = parseInt(sheetData_node.querySelector(".view_selector--body").dataset.pickedIndex);
                aux.type = type;
                aux.extraData = {};

                switch(type)
                {
                    case 0:
                        //no need to do something
                        break;
                    case 1:
                        aux.extraData.sheetName = sheetData_node.querySelector("#new_sheet_name").value;
                        break;
                    case 2:
                        let cols = [];
                        //create the object now 
                        let colNodes = sheetData_node.querySelectorAll(".file_import--column_body");
                        Array.from(colNodes).forEach((colNode)=>{
                            
                            let col_aux = {};
                            col_aux.name = colNode.querySelector(".checkbox-wrapper-42 .lbl").textContent.trim()
                            col_aux.checked = colNode.querySelector(".checkbox-wrapper-42 input").checked

                            //get the selected option 
                            let radios = colNode.querySelectorAll("label.radio input");
                            col_aux.selection = null;
                            if (col_aux.checked){
                                if (radios[0].checked)
                                {
                                    col_aux.selection = 0;
                                    col_aux.col_name = colNode.querySelector("#new_col_name").value;
                                }
                                else if (radios[1].checked)
                                {
                                    col_aux.selection = 1;
                                    //select the result 
                                    let col_selector = colNode.querySelector(".column_selector");
                                    if (col_selector.dataset.selectedId == undefined)
                                    {
                                        //show the error
                                        col_selector.classList.add("err");
                                        sheet_response.err = true;
                                    }else{
                                        col_selector.classList.remove("err");

                                        col_aux.selected_id = col_selector.dataset.selectedId;
                                        col_aux.displayName = col_selector.querySelector("input").value;
                                    }
                                }else{
                                    col_aux.checked = false;
                                }
                            }

                            cols.push(col_aux);
                        })
                        aux.extraData.columnData = cols;
                        break;
                    default: 
                    console.log("ERROR");
                    break;
                }

                sheets_data.push(aux);
            })
            sheet_response.data = sheets_data;

            return sheet_response;
        }
        //create the object apply data verification for 
        let verification_data = [];

        Array.from(node.querySelectorAll(".file_import--document_container")).forEach((docNode)=>{
            let sheet_response = sheets_object(docNode);
            verification_data.push({
                "name": docNode.querySelector(".file_import--document_header span").textContent,
                "sheets": sheet_response.data,
                "file": docNode.querySelector("input").files[0],
                "err": sheet_response.err
            })
        })
        console.log(verification_data);
        return verification_data;
    }

    const verify_import = (slider, verification_node)=>{
        //clear 
        Array.from(verification_node.children[1].children).forEach((node)=>node.remove())

        let verification_data = get_import_data();
        //TODO: goto a verification UI
        let cont = true;
        for (const elem of verification_data)
        {
            if (elem.err)
            {
                Toastify({
                    className: "toast_error",
                    text: `Please solve the errors for document ${elem.name}!`
                }).showToast();
                cont = false;
            }
        }   
        if (!cont)
            return ;

        let verif_frag = document.createDocumentFragment();

        //populate the verification with this data 
        verification_data.forEach((doc)=>{
            let document_node = document.createElement("div");
            document_node.className = "import_verification--document";
            document_node.appendChild(this.span("",{},document.createTextNode("For document: "+doc.name)));
            
            doc.sheets.forEach((sheet)=>{
                let sheet_node = this.div("import_verification--sheet", {});

                sheet_node.appendChild(this.span("",{},document.createTextNode("Sheet called: "+sheet.sheetName)));
                
                let sheet_info_node = this.div("import_verification--sheet_info",{});
                console.log(sheet.type);
                switch(sheet.type)
                {
                    case 0:
                        sheet_info_node.appendChild(this.helpCard("This sheet will be skipped from the import process!", "info"))
                    break;
                    case 1:
                        sheet_info_node.appendChild(this.helpCard("This sheet will be imported into a new sheet called "+sheet.extraData.sheetName+" !", "info"))
                    break;
                    case 2:
                        //the not so nice one 
                        sheet.extraData.columnData.forEach((colData)=>{

                            let sheet_col_info = this.div("import_verification--sheet_column "+ (colData.checked ? (colData.selection == 0 ? "new" : "into") : "skip"),{},
                            this.span("",{}, document.createTextNode(colData.name)), 
                            document.createRange().createContextualFragment(`<div class="import_verification--column_arrow">
                            <i class="fa-regular fa-chevron-right"></i>
                        </div>`).children[0],
                             this.span("",{}, document.createTextNode((colData.checked ? (colData.selection == 0 ? "will be inserted into new column called "+colData.col_name : "will be inserted into "+colData.displayName) : "will be skipped")))
                            );

                        sheet_info_node.appendChild(sheet_col_info);
                        })
                    break;
                }
                sheet_node.appendChild(sheet_info_node);

                document_node.appendChild(sheet_node);
            })

            verif_frag.appendChild(document_node);
        })
        verification_node.children[1].appendChild(verif_frag);
        
        slider.move_atIndex(1);
    };

    const send_import = ()=>{
        let data = get_import_data();
        //send each document one by one
        data.forEach((doc_data)=>{
            let formData = new FormData();
            formData.append("file", doc_data.file);
            //delete to send only once
            delete doc_data.file; 
            formData.append("data", JSON.stringify(doc_data));
            formData.append("sheetId",extraData.sheetId);
            formData.append("doc_id", extraData.docId)
            //ajax 
            $.ajax({
                url: "/excel/import_excel_final",
                type: "POST",
                data: formData,
                contentType: false, 
                cache: false,
                processData: false,
                success: (response)=>{
                    if (response?.success === true)
                    {
                        modalLib !== undefined && modalLib.close();
                        Toastify({
                            className: "toast_success",
                            text: `Document ${doc_data.name} was imported!`
                        }).showToast();
                        
                        if (extraData.context)
                        {
                            extraData.context.clearSheets();
                            extraData.context.parseSheets();
                        }
                    }else{
                        Toastify({
                            className: "toast_error",
                            text: response?.body || `Document ${doc_data.name} could not be imported!`
                        }).showToast();
                    }
                },error: (err)=>{
                    Toastify({
                        className: "toast_error",
                        text: `Document ${doc_data.name} could not be imported!`
                    }).showToast();
                }
            })
        })
    }

    const verifyNode = ()=>{
        
        return this.container(this.button("primary_button", "Go back", "fa-regular fa-arrow-left",{"margin-bottom": "15px"},{
            fn: ()=>{
                slider.move_atIndex(0)
            },
            context: undefined, 
            args: []
        }),this.title("Verification process"), this.container(), this.button("submit_button maxW","Import","fa-regular fa-check",{"display":"flex", "margin-top": "15px","margin-left":"auto"},{
            fn: send_import,
            context: undefined, 
            args: []
        }));
    }

    let verification = verifyNode();
    let slider = new node_slider(node, verification);

    let label = this.fileInput("Upload or drop files here", false, types);
    node.appendChild(label);
    node.appendChild(this.button("submit_button", "Verify and import", "fa-regular fa-check",{"position": "absolute", "right": "10px", "bottom": "0px"},{
        fn: verify_import,
        context: undefined, 
        args: [slider, verification]
    }))


    label.querySelector("input").addEventListener("change", (ev)=>{
        if (ev.target.files.length != 0)
        {
            label.classList.add("loading");

            //upload the file to the server for processing 
            let formData = new FormData();
            formData.append("file", ev.target.files[0]);

            $.ajax({
                url: "/excel/import_excel",
                type: 'POST',
                contentType: false, 
                cache: false,
                processData: false, 
                data: formData,
                success: (data)=>{
                    label.classList.remove("loading");

                    //we should add the document now 
                    node.appendChild(this.file_import_template(ev.target.files[0].name, data, extraData, ev.target.files[0]));
                },error: (err)=>{
                    label.classList.remove("loading");
                    label.querySelector("input").value = null;
                    Toastify({
                        className: "toast_error",
                        text: err.responseJSON?.body || "The file could not be uploaded"
                    }).showToast();
                }
            })
        }
    })
    
    return slider.get_node();;
}   

DynamicNodes.prototype.file_import_template = function(file_name, sheets, extraData, file){
    let temp = `<div class="file_import--document_container">
    <input type = 'file' class = 'invis'/>
    <div class = "file_import--document_header">
        <span>Nume document.xslx</span> <button class="cancel_button small"><i class="fa-regular fa-trash"></i> Remove</button>
    </div>
    
    <div class="file_import--sheets_container">
        <b>Sheets from imported document:</b>
        <div class="file_import--sheets_list">
                  
        </div>
    </div>

    <div class="file_import--sheet_info">
        <b style="font-size: 12px; font-style: italic"></b>
        <div class="file_import--sheet_data_container">
            <div class="file_import--sheet_data_tray">
           
            </div>
        </div>
    </div>
</div>`;

    let col_tray = ()=>{
        let [tray, list] = [document.createElement("div"), document.createElement("div")]
        
        tray.className = "file_import--column_tray";
        list.className = "file_import--column_list";

        tray.appendChild(list);

        return tray;
    }

    let col_object = (col_name)=>{
        let temp = `<div class="file_import--column_body">
        <div class="file_import--column_header">
            <div class="checkbox-wrapper-42">
                <input id="cbx-42" type="checkbox" checked/>
                <label class="cbx" for="cbx-42"></label>
                <label class="lbl" for="cbx-42"></label>
              </div>
        </div> 

        <div class="file_import--column_options">
            <label class="radio">
                <input type="radio" name="radio"/>
                <span>Create new column</span>
            </label>
            <label class="radio">
                <input type="radio" name="radio"/>
                <span>Insert into column</span>
            </label>
        </div>

        <div class="file_import--column_optionBody">
            <span>Please select an option or this column will be skipped!</span> 
        </div>
    </div>`;



        let node = document.createRange().createContextualFragment(temp).children[0];
        node.querySelector(".checkbox-wrapper-42 .lbl").textContent = col_name;

        const change_optionBody = (view) =>
        {
            let body = node.querySelector(".file_import--column_optionBody");
            if (body.dataset.option !== view)
            {
                //we should clear it now
                Array.from(body.childNodes).forEach((child)=>child.remove());
            }

            body.dataset.option = view;
            if (view == 0)
            {
                //the view for new column
                body.appendChild(this.input("Column name", "", col_name, "new_col_name"));
            }else{
                body.appendChild(this.frag(
                    document.createTextNode("This column will be inserted into: "),
                    new column_selector(extraData?.sheetId).getNode()
                ));
            }
        }
        
        let input_id = crypto.randomUUID();
        node.querySelector("input").id = input_id;
        let labels = node.querySelectorAll(".checkbox-wrapper-42 label");
        labels[0].htmlFor = input_id;
        labels[1].htmlFor = input_id;

        let radios = node.querySelectorAll(".file_import--column_options input"), name = crypto.randomUUID();
        radios[0].name = name;
        radios[1].name = name;

        radios[0].onchange = (ev)=>{
            if (ev.target.checked)
            {
                //new column body
                change_optionBody(0);
            }
        }

        radios[1].onchange = (ev)=>{
            if (ev.target.checked)
            {
                //into existing column body
                change_optionBody(1);
            }
        }
        return node;
    }

    let node = document.createRange().createContextualFragment(temp).children[0];
    
    let dt = new DataTransfer();
    dt.items.add(file);
    node.querySelector("input").files = dt.files;
    node.querySelector(".file_import--document_header span").textContent = file_name;

    let sheet_frag = document.createDocumentFragment();
    //append the sheets now 
    sheets.forEach((sheet, index)=>{
        let sheet_node = document.createElement("div");
        sheet_node.className = "file_import--sheet";
        sheet_node.textContent = sheet.sheetName;

        let tray = col_tray();

        //append to tray the columns 
        sheet?.data && sheet.data.length > 0 && sheet.data[0]?.forEach((sheet_column)=>{
            tray.querySelector(".file_import--column_list").appendChild(col_object(sheet_column))
        })

        //append the 
        let selector = new view_selector(['Skip', 'Import into new sheet', 'Import into existing sheet'],[this.helpCard("This sheet will be skipped from the import process!", "info"), this.input("Sheet name", "Name", sheet.sheetName, "new_sheet_name") ,tray],['skip', 'new', 'exists'], true);
        let page = document.createElement("div");
        
        page.className = "file_import--sheet_data_element";
        page.appendChild(selector);
        node.querySelector(".file_import--sheet_data_tray").appendChild(page);

        sheet_node.onclick = ()=>{
            node.querySelector(".file_import--sheets_list .file_import--sheet.active")?.classList?.remove("active");
            sheet_node.classList.add('active');
            node.querySelector(".file_import--sheet_info b").textContent = `This sheet has ${sheet.rows} rows`;
            
        }
        sheet_frag.appendChild(sheet_node);
    })

    node.querySelector(".file_import--sheets_list").appendChild(sheet_frag);
    node.querySelector(".file_import--sheets_list .file_import--sheet").click();
    
    return node;
}

DynamicNodes.prototype.icon = function (className)
{
    let node = document.createElement("i");
    node.className = className;
    return node;
}

DynamicNodes.prototype.fileInput = function (text, multiple, accept)
{
    let node = document.createElement("label");
    node.className = "file_label";
    
    let input = document.createElement("input");
    input.type = "file";
    input.multiple = multiple;
    input.accept = accept?.join(" ");

    node.appendChild(input);
    node.appendChild(this.icon("fa-regular fa-file-arrow-up"));
    node.appendChild(document.createTextNode(text));

    return node;
}


DynamicNodes.prototype.radio_input = function (text)
{
    let [node, input, span] = [document.createElement("label"), document.createElement("input"), document.createElement("span")];
    
    node.className = "radio";
    input.type = 'radio';
    input.name = crypto.randomUUID();
    span.textContent = text;

    node.appendChild(input);
    node.appendChild(span);

    return node;

}

DynamicNodes.prototype.textarea = function (text)
{
    let node = document.createElement("textarea");
    node.value = text;
    node.className = "textarea_one";

    return node;
}

DynamicNodes.prototype.contentList = function(title, container, list, btnNode){
    let container_node = document.createElement("div");
    container_node.className = container;

    if (title != "")
    {
        container_node.appendChild(this.title(title));
    }
    let list_node = document.createElement("div");
    list_node.className = list;


    container_node.appendChild(list_node);
    container_node.appendChild(btnNode);

    return container_node;
}

DynamicNodes.prototype.cond_format = function(nodes, existing_condFormat, cols_array, excel_table){
    let btn_fn = {
        context: null,
        fn: ()=>{
            if (modalLib_panel !== undefined)
            {
                modalLib_panel.pushView(this.container(this.cond_format_new(nodes, excel_table)), "Cases");
            }
        },
        args: []
    };

    let transformed = {};
    //now we should transform existing_condFormat
    Object.keys(existing_condFormat).forEach((cell_coordinates)=>{
        let conditions = existing_condFormat[cell_coordinates];

        conditions?.forEach((condition)=>{

            if (transformed[condition.uuid] === undefined)
                transformed[condition.uuid] = {cells: [], data: condition};

                transformed[condition.uuid].cells.push(cell_coordinates);
        })
    })

    let frag = document.createDocumentFragment();

    let btn = this.button("primary_button maxW", "Create cases", "fa-solid fa-plus", {}, btn_fn)
    let content = this.contentList("Current cases for selection", "cond_format--container", "cond_format--list", btn);

    Object.keys(transformed).forEach((condition_uuid, _index)=>{
        let data = transformed[condition_uuid];
        
        let container = document.createElement("div");
        container.className = "cond_format--rule";
        console.log(condition_uuid);
        
        switch(data.data.type){
            case "smaller":
                container.appendChild(this.span("", {"font-weight": "bold", "font-size": "16px"}, document.createTextNode(`Smaller than ${data.data.values[0]}`)));
            break;
            case "greater":
                container.appendChild(this.span("", {"font-weight": "bold", "font-size": "16px"}, document.createTextNode(`Greater than ${data.data.values[0]}`)));
            break;
        }
        let remove = this.button("cancel_button small","", "fa-solid fa-trash",{},{});
        container.appendChild(remove);
        remove.onclick = (ev)=>{
            ev.stopPropagation();
            //request
            let cb_submit = {
                context_submit: null, 
                fn: (confirm)=>{
                    confirm.open();
                    $.ajax({
                        url: "/excel/conditionalFormatting_remove",
                        contentType: "application/json",
                        type: "POST",
                        data: JSON.stringify({uuid: condition_uuid}),
                        success: ()=>{
                            excel_table.update_remove_conditionalFormatting(condition_uuid);
                            Toastify({
                                className: "toast_success",
                                text: "The case was deleted"
                            }).showToast();
                            container.remove();

                        },error: ()=>{
                            Toastify({
                                className: "toast_error",
                                text: "The case was not deleted"
                            }).showToast();
                        }
                    })
                },
                params: []
            }
            new Confirm("Delete case",document.createTextNode(`This case will be deleted for all the cells that contain it! Are you sure you want to continue? `), {}, cb_submit);


        }   
        container.onclick = ()=>{

            if (modalLib_panel !== undefined)
            {
                let new_content = this.cond_format_new(nodes, excel_table);
                let new_case = this.cond_format_case(condition_uuid, data.data.type, data.data.values, data.data.styles);

                new_content.querySelector(".cond_format_case--list").appendChild(new_case);
                new_content.querySelector(".primary_button").remove();
                modalLib_panel.pushView(this.container(new_content), "Cases");
            }
        }

        frag.appendChild(container);    
    })

    content.querySelector(".cond_format--list").appendChild(frag);
    return content;
}

function groupCoordinates(coordinateArray, columnNames) {
    
    const buildMatrix = (coordinates, columnNames)=>{
        // Extracting max row number and number of columns
  let maxRow = -Infinity;
  let numCols = columnNames.length;

  coordinates.forEach(coord => {
    const [rowStr, colName] = coord.split('#');
    const row = parseInt(rowStr);

    if (row > maxRow) {
      maxRow = row;
    }
  });

  const numRows = maxRow; // Number of rows in the matrix

  // Creating the matrix filled with zeros
  const matrix = Array.from({ length: numRows }, () => Array(numCols).fill(0));

  // Populating the matrix based on coordinates
  coordinates.forEach(coord => {
    const [rowStr, colName] = coord.split('#');
    const row = parseInt(rowStr);
    const colIndex = columnNames.indexOf(colName);

    matrix[row - 1][colIndex] = 1; // Adjusting for 0-based indexing
  });

  return matrix;
    }

    const maximalRectangleCoordinates = (matrix)=>{
        if (!matrix || matrix.length === 0 || !matrix[0] || matrix[0].length === 0) {
            return [];
          }
        
          const rows = matrix.length;
          const cols = matrix[0].length;
        
          const height = new Array(cols).fill(0);
          const left = new Array(cols).fill(0);
          const right = new Array(cols).fill(cols);
          let maxArea = 0;
          const result = [];
        
          for (let i = 0; i < rows; i++) {
            let curLeft = 0,
              curRight = cols;
        
            // Calculate height
            for (let j = 0; j < cols; j++) {
              height[j] = matrix[i][j] === 1 ? height[j] + 1 : 0;
            }
        
            // Calculate left
            for (let j = 0; j < cols; j++) {
              left[j] = matrix[i][j] === 1 ? Math.max(left[j], curLeft) : 0;
              curLeft = matrix[i][j] === 1 ? curLeft : j + 1;
            }
        
            // Calculate right
            for (let j = cols - 1; j >= 0; j--) {
              right[j] = matrix[i][j] === 1 ? Math.min(right[j], curRight) : cols;
              curRight = matrix[i][j] === 1 ? curRight : j;
            }
        
            // Calculate area
            for (let j = 0; j < cols; j++) {
              const area = height[j] * (right[j] - left[j]);
              if (area > maxArea) {
                maxArea = area;
                result.splice(0, result.length);
                result.push([i - height[j] + 1, left[j]], [i, right[j] - 1]);
              } else if (area === maxArea) {
                result.push([i - height[j] + 1, left[j]], [i, right[j] - 1]);
              }
            }
          }
        
          return result;
      }
    
    const matrixCoords_to_cellCoords = (row, col)=>{
        return `${row+1}#${columnNames[col]}`;
    } 

    let matrix = buildMatrix(coordinateArray, columnNames);
    let coords = maximalRectangleCoordinates(matrix);

    let response = [];
    //group them 2 by 2
    for (let i = 0;i<coords.length;i+=2)
    {
        let startCoords = coords[i];
        let endCoords = coords[i+1];

        if (startCoords[0] == endCoords[0] && startCoords[1] == endCoords[1])
        {
            response.push(matrixCoords_to_cellCoords(startCoords[0], startCoords[1]));
        }
        else{
            response.push(
                `${matrixCoords_to_cellCoords(startCoords[0], startCoords[1])}:${matrixCoords_to_cellCoords(endCoords[0], endCoords[1])}`
            )
        }
    }

    return response;
}

DynamicNodes.prototype.cond_format_new = function(nodes, excel_table){

    let btn_fn = {
        context: null,
        fn: ()=>{
            contentList.querySelector(".cond_format_case--list").appendChild(this.cond_format_case());
        },
        args: []
    };

    let btn = this.button("primary_button maxW", "Add case", "fa-solid fa-plus", {}, btn_fn);
    let contentList = this.contentList("Cases for current rule", "cond_format_case--container", "cond_format_case--list", btn);
    return this.frag(contentList, this.button("submit_button maxW", "Submit", "fa-solid fa-check", {"margin-top": "10px"}, {
        context: null,
        fn: ()=>{
            //create the object to send 
            let data = [];

            //get cases 
            Array.from(contentList.querySelectorAll(".condition--container")).forEach((caseNode)=>{
                let inputs = caseNode.querySelectorAll(".condition--extras input");
                let style_btns = caseNode.querySelectorAll(".small_text_formatting--actions button");
                let style_inputs = caseNode.querySelectorAll(".small_text_formatting--actions input");

                data.push(
                    {
                        "uuid": caseNode.dataset?.uuid || null,
                        "type": caseNode.querySelector(".custom_select--option.checked").dataset.value,
                        "values": inputs.length == 1 ? [inputs[0].value] : [inputs[0].value, inputs[1].value],
                        "styles": {
                            "fontWeight": style_btns[0].classList.contains("active") ? "bold" : null,
                            "fontStyle": style_btns[1].classList.contains("active") ? "italic" : null,
                            "textDecoration": style_btns[2].classList.contains("active") ? "underline" : (style_btns[3].classList.contains("active") ? "line-through" : null),
                            "color": style_inputs[0].value,
                            "backgroundColor": style_inputs[1].value
                        }
                    }
                );

            })
            $.ajax({
                url: "/excel/conditionalFormatting_add",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify({data, nodes}),
                success: (response)=>{
                    if (response?.success === true){
                        Toastify({
                            className: "toast_success",
                            text: "Cases were set successfully!"
                        }).showToast();
    
                        excel_table.update_conditionalFormatting(nodes, response.data);
                    }else{
                        Toastify({
                            className: "toast_error",
                            text: "There was an error!"
                        }).showToast(); 
                    }
 
                },error: ()=>{
                    Toastify({
                        className: "toast_error",
                        text: "There was an error!"
                    }).showToast();
                }
            })
        },  
        args: []
    }));
}

DynamicNodes.prototype.cond_format_case = function(uuid = null, default_option = null, values = [], styles = {}){
    let options = [
        {
            default: default_option !== null ? default_option === "greater" : true, 
            icon: "fa-solid fa-greater-than",
            text: "greater than",
            value: "greater"
        },
        {
            default: default_option !== null ? default_option === "smaller" : false, 
            icon: "fa-solid fa-less-than",
            text: "smaller than",
            value: "smaller"
        },
        {
            default: default_option !== null ? default_option === "between" : false, 
            icon: "fa-solid fa-greater-than",
            text: "between",
            value: "between"
        }
    ];


    let node = document.createElement("div");
    node.className = "condition--container";
    if (uuid !== null){
        node.dataset.uuid = uuid;
    }

    node.appendChild(document.createTextNode("If cell value is"));

    let select = this.custom_select("white noMargin", options);
    node.appendChild(select);

    let body = this.div("condition--extras",{});

    switch(default_option)
    {
        case "greater":
            body.appendChild(this.input_node("Value", values.length == 0 ? "" : values[0], "", "", "", "number"));
        break;
        case "smaller":
            body.appendChild(this.input_node("Value", values.length == 0 ? "" : values[0], "", "", "", "number"));
        break;
        case "between":
            body.appendChild(this.input_node("Value", values.length == 0 ? "" : values[0], "", "", "", "number"));
            body.appendChild(this.span("", {}, document.createTextNode("and")));
            body.appendChild(this.input_node("Value", values.length == 0 ? "" : values[1], "", "", "", "number"));
        break;
        default:
            body.appendChild(this.input_node("Value", "", "", "", "", "number"));
            break;  
    }

    node.appendChild(body);
    

    select.addEventListener("customSelect_changed",(ev)=>{
        let {value} = ev.detail;

            switch (value){
                case "greater":
                        Array.from(body.children).forEach((node)=>node.remove());
                        body.appendChild(this.input_node("Value", "", "", "", "", "number"));
                    break;
                case "smaller":
                    Array.from(body.children).forEach((node)=>node.remove());
                    body.appendChild(this.input_node("Value", "", "", "", "", "number"));
                break;
                case "between":
                    Array.from(body.children).forEach((node)=>node.remove());
                    body.appendChild(this.input_node("Value", "", "", "", "", "number"));
                    body.appendChild(this.span("", {}, document.createTextNode("and")));
                    body.appendChild(this.input_node("Value", "", "", "", "", "number"));
                break;
                default:
                    Array.from(body.children).forEach((node)=>node.remove());
                break;
            }
    })

    node.appendChild(this.smallFontEditor(styles));

    return node;
}

DynamicNodes.prototype.custom_select = function (className, options)
{
    let node = document.createElement("div");
    node.className = `custom_select ${className !== undefined ? className : ""}`;
    
    options.forEach((option)=>{
        let opt_node = document.createElement("customOption");
        opt_node.dataset.value = option.value;
        
        if (option.default)
            opt_node.dataset.default = true;

        opt_node.appendChild(this.icon(option.icon));
        opt_node.appendChild(document.createTextNode(option.text))
        
        node.appendChild(opt_node);
    })
    if (customSelect === undefined)
        customSelect = new customSelect();

    customSelect.init(node);
    return node;
}

DynamicNodes.prototype.smallFontEditor = function({fontWeight = null, fontStyle = null, textDecoration = null, color = "#01295f", backgroundColor = "#FFAC47"}){
    
    let temp = `        <div class="small_text_formatting">
    <div class="small_text_formatting--example">Exemplu</div>
    <div class="small_text_formatting--actions">
        <button class="excel_action icon data_info" data-info="Bold">
            <i class="fa-regular fa-bold"></i>
        </button>
        
        <button class="excel_action icon data_info" data-info="Italic">
            <i class="fa-regular fa-italic"></i>
        </button>

        <button class="excel_action icon data_info" data-info="Underline">
            <i class="fa-regular fa-underline"></i>
        </button>

        <button class="excel_action icon data_info" data-info="Strike">
            <i class="fa-regular fa-strikethrough"></i>
        </button>

        <label class="color font_color data_info" data-info="Font color" style="background-color: ${color};">
            <i class="fa-regular fa-paintbrush-fine" style="color: white"></i>
            <input type="color" value = '${color}'/>    
        </label>

        <label class="color bg_color data_info" data-info="Background color" style="background-color: ${backgroundColor}">
            <i class="fa-regular fa-fill"></i>
            <input type="color" value = '${backgroundColor}'/>    
        </label>
    </div>
</div>`;    

    let node = document.createRange().createContextualFragment(temp).children[0];
    let example = node.querySelector(".small_text_formatting--example");
    //set the listeners 
    let btns = node.querySelectorAll("button"), inputs = node.querySelectorAll("input");

    //bold
    btns[0].onclick = ()=>{btns[0].classList.toggle("active"); btns[0].classList.contains("active") ? example.style.fontWeight = "bold" : example.style.fontWeight = "normal"};

    //italic 
    btns[1].onclick = ()=>{btns[1].classList.toggle("active"); btns[1].classList.contains("active") ? example.style.fontStyle = "italic" : example.style.fontStyle = "normal"};

    //underline
    btns[2].onclick = ()=>{btns[2].classList.toggle("active"); if (btns[2].classList.contains("active")) btns[3].classList.remove("active");  btns[2].classList.contains("active") ? example.style.textDecoration = "underline" : example.style.textDecoration = "unset"};

    //strike
    btns[3].onclick = ()=>{btns[3].classList.toggle("active"); if (btns[3].classList.contains("active")) btns[2].classList.remove("active"); btns[3].classList.contains("active") ? example.style.textDecoration = "line-through" : example.style.textDecoration = "unset"};

    //font color
    inputs[0].onchange = ()=>{

        let font_color = inputs[0].value;
        example.style.color = font_color;
        let textColor = this.hexToRgb(font_color);         
            //calibrate the icon color
            const brightness = Math.round(((parseInt(textColor.r) * 299) +
                      (parseInt(textColor.g) * 587) +
                      (parseInt(textColor.b) * 114)) / 1000);
            inputs[0].parentNode.querySelector("i").style.color = (brightness > 125) ? 'black' : 'white';

            inputs[0].parentNode.style.backgroundColor = font_color;

    }

    inputs[1].onchange = ()=>{

        let font_color = inputs[1].value;
        example.style.backgroundColor = font_color;
        let textColor = this.hexToRgb(font_color);         
            //calibrate the icon color
            const brightness = Math.round(((parseInt(textColor.r) * 299) +
                      (parseInt(textColor.g) * 587) +
                      (parseInt(textColor.b) * 114)) / 1000);
            inputs[1].parentNode.querySelector("i").style.color = (brightness > 125) ? 'black' : 'white';

            inputs[1].parentNode.style.backgroundColor = font_color;

    }

    fontWeight === "bold" ? btns[0].click() : "";
    fontStyle === "italic" ? btns[1].click() : "";
    textDecoration === "underline" ? btns[2].click() : "";
    textDecoration === "line-through" ? btns[3].click() : "";

    inputs[0].dispatchEvent(new Event("change"));
    inputs[1].dispatchEvent(new Event("change"));

    return node;
}

DynamicNodes.prototype.hexToRgb = function(hex){
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
}
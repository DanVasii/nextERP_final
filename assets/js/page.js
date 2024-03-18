$(function(){
    parse_docs();

    //init the button_container 
    document.querySelector(".button_menu--container").onclick = function(ev){
        this.classList.toggle("active");
    }
});

function parse_docs()
{
    $.ajax({
        url: "/document/get_documents",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({page_id: document.querySelector("#page_id").value}),
        success: function(data){
            if (data?.success === true)
            {
                console.log(data);
               //put the nodes 
               let frag = document.createDocumentFragment();
               data.data.forEach((doc)=>{
                frag.appendChild(document_node(false, doc, data.pageName));
               })

               document.querySelector(".documents_container").insertBefore(frag, document.querySelector(".documents_container--add"));
            }else{
                Toastify({
                    className: "toast_error",
                    text: "Unexpected error"
                }).showToast();
            }
        },error: function(){
                Toastify({
                    className: "toast_error",
                    text: "Unexpected error"
                }).showToast();
        }
    })
}

function delete_doc(doc_id, doc_name,node, confirmed = false, confirm){
    if (!confirmed)
    {
        new Confirm("Delete document", [document.createTextNode(`Are you sure you want to delete the document ${doc_name} and all it's data?`)],{}, {context_submit: undefined, fn: delete_doc, params: [doc_id, doc_name, node, true]});
        return;
    }

    //toggle the confirm window
    confirm.open();

    $.ajax({
      url: "/excel/remove_document",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify({doc_id}),
      success: function(){
        node.remove();
        Toastify({
          className: "toast_success",
          text: "The document was removed"
        }).showToast();
      },error: function(){
        Toastify({
          className: "toast_error",
          text: "The document was not removed"
        }).showToast();
      }
    })
}

function document_node(temp = false, doc = {}, pageName){
    let node = document.querySelector("#document").content.cloneNode(true), containerNode = node.children[0];
    
    let edit_button = node.querySelector("button[data-for='document_edit']"), input = node.querySelector(".document_container--header input"), header_icons = edit_button.querySelectorAll("img"), delete_button = node.querySelector("button[data-for='delete']"),
    favourite_button = node.querySelector("button[data-for='favourite']"); 

    const add_document_query = (name)=>{
        return new Promise((resolve, reject)=>{
        let page_id = document.querySelector("#page_id").value;

        $.ajax({
            url: "/document/add_document",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({name, page_id}),
            success: (data)=>{
                if (data?.success === true){
                    resolve();
                    Toastify({
                        className: "toast_success",
                        text: "The document was created!"
                    }).showToast();

                    edit_button.onclick = ()=>{
                        pageName = data.data.pageName;
                        if (is_inputEnabled(input)){

                                update_document_query(input.value, data.data._id).then(()=>{
                                    toggle_inputEnabled(input);
                                    header_icons[0].style.display = "initial";
                                    header_icons[1].style.display = "none";
                                }).catch(()=>{
                
                                })
                
                        }else{
                            header_icons[0].style.display = "none";
                            header_icons[1].style.display = "initial";
                            toggle_inputEnabled(input);
                        }
                    }

                    update_document_link(data.data.pageName, name, input);
                    delete_button.onclick = ()=>{
                        delete_doc(data.data._id, name, containerNode);
                    }

                }else{
                    reject();
                    Toastify({
                        className: "toast_error",
                        text: data?.data?.body || "Unexpected error!"
                    }).showToast();
                }
            }, error: (err)=>{
                console.log(err);
                reject();
                Toastify({
                    className: "toast_error",
                    text: "Unexpected error!"
                }).showToast();
            }
        })
        })
    }

    const update_document_link = (page_name, doc_name, input)=>{
        input.onclick = (ev)=>{
            if (!is_inputEnabled(input)){
                window.location.href = `/document/${page_name}/${doc_name}`;
            }
        }
    }

    const is_inputEnabled = (input)=>{
        return !input.classList.contains("disabled");
    }

    const toggle_inputEnabled = (input)=>{
        input.classList.toggle("disabled");
    }

    const update_document_query = (doc_name, doc_id)=>{

        return new Promise((resolve, reject)=>{
            let page_id = document.querySelector("#page_id").value;

        if (doc_name.trim() == "")
        {
            Toastify({
                className: "toast_error",
                text: "The document name cannot be empty!"
            }).showToast();
            reject();
            return;
        }

        $.ajax({
            url: "/document/update_document",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({doc_name, doc_id, page_id}),
            success: (data)=>{
                if(data?.success === true){
                    resolve();
                    Toastify({
                        className: "toast_success",
                        text: "The document was updated!"
                    }).showToast();
                    update_document_link(pageName, doc_name, input);
                    delete_button.onclick = ()=>{
                        delete_doc(doc_id, doc_name, containerNode);
                    }
                }else{
                    reject();
                    Toastify({
                        className: "toast_error",
                        text: data?.data?.body || "Unexpected error!"
                    }).showToast();
                }
            }, error: ()=>{
                reject();
                Toastify({
                    className: "toast_error",
                    text: "Unexpected error!"
                }).showToast();
            }
        })
        })
        
    }

    const favourite_request = (doc_id, sheet_id)=>{
        let page_id = document.querySelector("#page_id").value;
        $.ajax({
            url: "/document/add_favourite",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({page_id, doc_id, sheet_id}),
            success: (data)=>{
                Toastify({
                    className: "toast_success",
                    text: "Added to favourites!"
                }).showToast();
            },error: ()=>{
                Toastify({
                    className: "toast_error",
                    text: "Unexpected error!"
                }).showToast();
            }
        })
    }

    edit_button.onclick = ()=>{
        if (is_inputEnabled(input)){
            //previous was false, so we need to send request now
            //send request
            if (temp){
                //add document 
                add_document_query(input.value).then(()=>{
                    toggle_inputEnabled(input);
                    header_icons[0].style.display = "initial";
                    header_icons[1].style.display = "none";
                }).catch(()=>{

                })
            }else{
                update_document_query(input.value, doc._id).then(()=>{
                    toggle_inputEnabled(input);
                    header_icons[0].style.display = "initial";
                    header_icons[1].style.display = "none";
                }).catch(()=>{

                })
            }   

        }else{
            header_icons[0].style.display = "none";
            header_icons[1].style.display = "initial";
            toggle_inputEnabled(input);
        }
    }

    if (temp){
        edit_button.click();
        delete_button.onclick = ()=>{
            containerNode.remove();
        }
    }else{
        update_document_link(pageName, doc.name, input);
        delete_button.onclick = ()=>{
            delete_doc(doc._id, doc.name, containerNode);
        }
        favourite_button.onclick = ()=>{
            //send the request 
            favourite_request(doc._id);
        }

        //render the sheets too
        let frag = document.createDocumentFragment();

        doc?.sheets.forEach((sheet)=>{
            let sheetNode = document.querySelector("#document_sheet").content.cloneNode(true);

            sheetNode.querySelector("span").textContent = sheet.sheetName;

            sheetNode.querySelector("button").onclick = ()=>{
                favourite_request(doc._id, sheet._id);
            };

            frag.appendChild(sheetNode);
        })

        if (frag.children.length == 0){
            frag.appendChild(document.createTextNode("No sheets"));
        }
        node.querySelector(".document_container--body").appendChild(frag);
    }

    //delete listener 

    input.value = doc.name ? doc.name : "Document";

    return node;
}

function doc_err(node, show = true){
    show && node.classList.add("document_err");
    !show && node.classList.remove("document_err");
}

function add_document(){
    let node = document_node(true);

    document.querySelector(".documents_container").insertBefore(node, document.querySelector(".documents_container--add"));
}

function update_document(doc_id, node, pageName){
    let doc_name = node.querySelector("input[type='text']").value;
    let color = node.querySelector(".radio_color:checked");

    if (doc_name.trim() == ""){
        doc_err(right.parentNode.parentNode, true);
        Toastify({
            className: "toast_error",
            text: "Document name cannot be empty"
        }).showToast();
        return;
    }

    if (color == null){
        doc_err(right.parentNode.parentNode, true);
        Toastify({
            className: "toast_error",
            text: "Select a color!"
        }).showToast();
        return;
    }

    color = color.value;

    //send the request 

    $.ajax({
        url: "/document/update_document",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({doc_name, color, doc_id, page_id: document.querySelector("#page_id").value}),
        success: (data)=>{
            //update the document and then flip the card 
            if (data?.success === true){
                let front = node.parentNode.querySelector(".document_face.front");
                front.querySelector(".document--name").textContent = doc_name;
                front.querySelector(".document--icon_holder i").style.color = color;
                front.querySelector(".document--icon_holder").onclick = ()=>{
                    window.location.href = `/document/${pageName}/${doc_name}`;
                }
                front.querySelector(".document--name").onclick = ()=>{
                    window.location.href = `/document/${pageName}/${doc_name}`;
                }

                Toastify({
                    className: "toast_success",
                    text: "Document was updated!"
                }).showToast();
                
                node.parentNode.style.transform = "rotateY(0deg) translateZ(-100px)";

            }else{
                //dont flip 
                Toastify({
                    className: "toast_error",
                    text: data.data.body
                }).showToast();
            }
        },error: (err)=>{
            //just flip the document and re-state the card
            node.parentNode.style.transform = "rotateY(0deg) translateZ(-100px)";
            Toastify({
                className: "toast_error",
                text: "An error occured!"
            }).showToast();
        }
    })
}

function remove_page(ev, confirmed = false, confirm_window){
    ev.preventDefault();
    ev.stopPropagation();

    if (!confirmed){
        new Confirm("Delete page", [document.createTextNode("Are you sure you want to delete this page?")], {context_cancel: null, fn: (elem)=>{
            elem.parentNode.parentNode.parentNode.classList.remove("active");
        }, params: [ev.target]}, {context_submit: null, fn: remove_page, params: [ev, true]});
        return;
    }

    confirm_window.open();

    //we should send the request now
    $.ajax({
        url: "/document/remove_page",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({page_id: document.querySelector("#page_id").value}),
        success: (data)=>{

            if (data?.success === true){
                //on succes toggle the container 
                ev.target.parentNode.parentNode.parentNode.classList.remove("active");
                Toastify({
                    className: "toast_success",
                    text: "The page was deleted!"
                }).showToast();

                setTimeout(()=>{
                    window.location.href = "/home";
                }, 1000);
            }else{
                Toastify({
                    className: "toast_error",
                    text: "The page could not be deleted!"
                }).showToast();
            }

        },error: ()=>{
            Toastify({
                className: "toast_error",
                text: "The page could not be deleted!"
            }).showToast();
        }
    })
}

function rename_page(event, confirm = false, input, confirm_window){
    event.preventDefault();
    event.stopPropagation();

    if (typeof DynamicNodes === 'undefined')
    {
        Toastify({
            className: "toast_error",
            text: "Unexpected error!"
        }).showToast();
        
        return;
    }

    if (!confirm){
        let input = new DynamicNodes().input("Page name", "", document.querySelector("#page_name").value);
        new Confirm("Rename page", [input],{context_cancel: null, fn: (elem)=>{
            elem.parentNode.parentNode.parentNode.classList.remove("active");
        }, params: [event.target]}, {context_submit: null, fn: rename_page, params: [event, true, input]});
        return;
    }

    $.ajax({
        url: "/document/rename_page",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({name: input.querySelector("input").value, page_id: document.querySelector("#page_id").value}),
        success: (data)=>{  

            if (data?.success === true){                
                confirm_window.open();
                event.target.parentNode.parentNode.parentNode.classList.remove("active");

                Toastify({
                    className: "toast_success",
                    text: "The document was renamed"
                }).showToast();

                setTimeout(()=>{
                    window.location.href = "/document/"+input.querySelector("input").value;
                }, 500);
            }else{
                Toastify({
                    className: "toast_error",
                    text: data.data.body || "The page name could not be changed!"
                }).showToast();
            }

        },error: ()=>{
            Toastify({
                className: "toast_error",
                text: "The page name could not be changed!"
            }).showToast();
        }
    })

}
$(function(){

    document.querySelector(".container--body_empty").onclick = ()=>{
        add_company();
    }
    parse_companies();
});

function parse_companies(){
    $.ajax({
        url: "/account/companies",
        type: "GET",
        contentType: "application/json",
        success: (data)=>{
            console.log(data);
            if (data?.success === true){
                //build and add     
                let frag = document.createDocumentFragment();
                data?.data.forEach((company)=>{
                    frag.appendChild(company_node(company.id, company.name));
                })

                document.querySelector(".container--body").appendChild(frag);
            }else{
                Toastify({
                    className: "toast_error",
                    text: "Unexpected error!"
                }).showToast();
            }
        },error: ()=>{
            Toastify({
                className: "toast_error",
                text: "Unexpected error!"
            }).showToast();
        }
    })
}

function company_node(id, name)
{

    //when this fn is called, we should delete the container--body_empty

    document.querySelector(".container--body_empty")?.remove();

    let node = document.createElement("div"), circle = document.createElement("div"), span = document.createElement("span");
    node.className = "company", circle.className = "circle";

    node.appendChild(circle);
    span.textContent = name;
    node.appendChild(span);

    node.onclick = ()=>{
        choose_company(id);
    }

    return node;
}

function choose_company(id){
    //ajax request 
    $.ajax({
        url: "/account/pick_company",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({companyId: id}),
        success: ()=>{
            
            //redirect
            Toastify({
                className: "toast_success",
                text: "You will be redirected soon!"
            }).showToast();

            setTimeout(()=>{
                window.location.href = "/home";
            }, 500);

        },error: ()=>{
            Toastify({
                className: "toast_error",
                text: "Unexpected error!"
            }).showToast();
        }
    })
}

function add_company(){
    //open the modal 
    if (window.modalPanel === undefined){
        window.modalPanel = new modal_panel();
    }

    window.modalPanel.setView(add_company_view(), "Add company");
    window.modalPanel.open();
}

function add_company_view(){
    if (window.dn === undefined){
        window.dn = new DynamicNodes();
    }

    let elements = [window.dn.input("Company name", "Name", "", "")];

    elements[1] = window.dn.button("primary_button maxW", "Add company", "fa-solid fa-plus", {"margin-top": "10px"}, {
        fn: (input)=>{
            add_company_server(input.querySelector("input").value);
        },
        context: undefined,
        args: [elements[0]]
    });

    return window.dn.frag(...elements);
}

function add_company_server(companyName){

    $.ajax({
        url: "/account/add_company",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({companyName}),
        success: (data)=>{
            console.log(data);
            if (data?.success === true){
                //add the node and close the window
                window.modalPanel.close();
                document.querySelector(".container--body").appendChild(company_node(data.data.companyId, companyName.trim()));
                
            }else{
                Toastify({
                    className: "toast_error",
                    text: data.data.body
                }).showToast();
            }
        },error: ()=>{
            Toastify({
                className: "toast_error",
                text: "Unexpected error!"
            }).showToast();
        }
    })

}   
const express = require("express");
const router = express.Router();
const ERRORS = require("../errors");
const excel_manager = require("../managers/excel");
const document_manager = require("../managers/documents");
const { checkLogin, getDocuments, checkCompany, parse_favourites } = require("../middlewares");

router.use(checkLogin);
router.use(getDocuments);
router.use(checkCompany);

router.get("/:page_name/:doc_name", parse_favourites, async (req, res)=>{
    let {page_name, doc_name} = req.params;
    let companyId = req.user.companyId;
    if (page_name !== undefined && doc_name !== undefined)
    {
        let response = await document_manager.page_params(page_name, doc_name, companyId);
        if (response?.success === true)
        {
            let menu = await document_manager.getPagesAndDocuments(req.user.companyId);
        
            if (menu?.success === true){
                res.render("excel.html",{pages: menu.result, ...req.user, doc_id: response.data.doc_id, pageName: page_name, favourites: req.favourites});
            }else{
                res.sendStatus(404);
            }
        }else{
            res.sendStatus(404);
        }
    }else{
        res.sendStatus(404);
    }
})

router.get("/:page_name", parse_favourites, async (req, res)=>{
    let {page_name} = req.params;

    if (page_name !== undefined)
    {
        let response = await document_manager.pageData(page_name, req.user.companyId);

        if (response?.success === true)
        {
            
            let menu = await document_manager.getPagesAndDocuments(req.user.companyId);
            let docsForPage = [];

            if (menu?.success === true){
                res.render("page.html",{pages: menu.result, ...req.user, pageId: response._id, pageName: page_name, favourites: req.favourites});
            }else{
                res.sendStatus(404);
            }

        }else{
            res.sendStatus(404);
        }
    }else{
        res.sendStatus(404);
    }
})

router.post("/get_documents",async (req, res)=>{
    let {page_id} = req.body;

    if (page_id !== undefined)
    {
        let myPage = await document_manager.page_checkID(page_id, req.user.companyId);
        if (myPage?.success === true)
        {   
            let data = await document_manager.getDocsAndSheetByPage(page_id);

            res.send({...data, pageName: myPage.data.pageName});
        }else{
            res.status(500);
        }
    }else{
        return ERRORS.MONGO_DB_CONNECTION;
    }
})

router.post("/add_page", async (req, res)=>{
    let user = req.user;
    let {pageName, icon} = req.body;

    if (pageName !== undefined)
    {
        let response = await document_manager.addPage(pageName, user.companyId, icon);

        if (response?.success === true){
            res.send(response);
        }else{
            res.status(500).send(response);
        }
    }else{
        res.status(500).send(ERRORS.INCOMPLETE_REQUEST);
    }

})

router.post("/add_document",async (req, res)=>{
    let {name, page_id} = req.body;
    
    if (name !== undefined && page_id !== undefined)
    {
        if ( name.trim != "")
        {
            let response = await document_manager.add_document(name, page_id, req.user.companyId);
            if (response?.success === true){
                res.send(response);
            }else{
                res.status(500).send(response);
            }
        }else{
            res.status(500).send({"body":"Invalid input data"});
        }
    }else{
        res.status(500).send(ERRORS.INCOMPLETE_REQUEST);
    }
})

router.post("/update_document", async (req, res)=>{
    let {doc_name, doc_id, page_id} = req.body;

    if (doc_name !== undefined && doc_id !== undefined && page_id !== undefined){

        let response = await document_manager.update_document(doc_name, doc_id, page_id);
        res.send(response);

    }else{
        res.status(500).send(ERRORS.INCOMPLETE_REQUEST);
    }
})

router.post("/remove_page", async (req, res)=>{
    let {page_id} = req.body;

    if (page_id !== undefined){

        let response = await document_manager.remove_page(page_id);
        res.send(response);

    }else{
        res.status(500).send(ERRORS.INCOMPLETE_REQUEST);
    }
})

router.post("/rename_page", async (req, res)=>{
    let {name, page_id} = req.body;

    if (name != undefined && page_id != undefined){

        let response = await document_manager.rename_page(name, page_id, req.user.companyId);

        res.send(response);

    }else{
        res.status(500).send(ERRORS.INCOMPLETE_REQUEST);
    }
})

router.post("/add_favourite", async (req, res)=>{
    let {page_id, doc_id, sheet_id} = req.body;

    if (page_id !== undefined && doc_id !== undefined){

        let response = await document_manager.add_favourite(page_id, doc_id, sheet_id, req.user.companyId, req.user.userId);

        res.send(response);

    }else{
        res.status(500).send(ERRORS.INCOMPLETE_REQUEST);
    }
})

module.exports = router;
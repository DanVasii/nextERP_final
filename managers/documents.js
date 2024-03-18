const mongo = require("../managers/mongoDB");
const ERRORS = require("../errors");
const { ObjectId } = require("mongodb");

async function addPage(pageName, companyId, icon = "fa-classic fa-gear")
{
    let connection = await mongo.getConnection();
    if (connection !== null)
    {
        try{    
            let page = await pageData(pageName, companyId);

            if (page?.success === true)
            {
                return {"success": false, "body": "Page already exists!"};
            }

            let response = await connection.db("nextERP").collection("pages").insertOne({
                "pageName": pageName,
                "companyId": companyId,
                "icon": icon
            });
            if (response){
                return {success: true, "_id": response.insertedId};
            }else{
                return ERRORS.MONGO_DB_QUERY;
            }
        }catch(e){
            return ERRORS.MONGO_DB_QUERY;
        }
    }else{
        return ERRORS.MONGO_DB_CONNECTION;
    }
}

async function page_checkID(pageId, companyId)
{
    let connection = await mongo.getConnection();

    if (connection !== null)
    {   
        try{
            let response = await connection.db("nextERP").collection("pages").findOne({_id: new ObjectId(pageId), companyId: companyId});
            if (response){
                return {success: true, data: response};
            }else{
                return {success: false};
            }
        }catch(e){
            return ERRORS.MONGO_DB_QUERY;
        }
    }else{
        return ERRORS.MONGO_DB_CONNECTION;
    }
}

async function document_checkID(doc_id, companyId){
    let connection = await mongo.getConnection();

    if (connection !== null)
    {   
        try{
            let response = await connection.db("nextERP").collection("documents").findOne({_id: new ObjectId(doc_id), companyId: companyId});
            if (response){
                return {success: true, data: response};
            }else{
                return {success: false};
            }
        }catch(e){
            return ERRORS.MONGO_DB_QUERY;
        }
    }else{
        return ERRORS.MONGO_DB_CONNECTION;
    }
}

async function sheet_checkID(sheet_id, companyId){
    let connection = await mongo.getConnection();

    if (connection !== null)
    {   
        try{
            let response = await connection.db("nextERP").collection("sheets").findOne({_id: new ObjectId(sheet_id), companyId: companyId});
            if (response){
                return {success: true, data: response};
            }else{
                return {success: false};
            }
        }catch(e){
            return ERRORS.MONGO_DB_QUERY;
        }
    }else{
        return ERRORS.MONGO_DB_CONNECTION;
    }
}

async function pageData(pageName, companyId)
{
    let connection = await mongo.getConnection();
    if (connection !== null)
    {
        try{    
            let response = await connection.db("nextERP").collection("pages").findOne({
                "pageName": pageName,
                "companyId": companyId
            });

            if (response){
                return {success: true, ...response};
            }else{
                return ERRORS.MONGO_DB_QUERY;
            }
        }catch(e){
            return ERRORS.MONGO_DB_QUERY;
        }
    }else{
        return ERRORS.MONGO_DB_CONNECTION;
    }
}

async function docsForPage(page_id)
{
    let connection = await mongo.getConnection();

    if (connection !== null)
    {
        try{    
            let documents = connection.db("nextERP").collection("documents").find({pageId: new ObjectId(page_id)}).toArray();

            return {success: true, data: documents};
        }catch(e){
            return ERRORS.MONGO_DB_QUERY;
        }
    }else{
        return ERRORS.MONGO_DB_CONNECTION;
    }
}

async function getPagesAndDocuments(companyId)
{
    let connection = await mongo.getConnection();

    if (connection !== null)
    {
        let result = await connection.db("nextERP").collection("pages").aggregate([
            {
                $match:{
                    companyId: companyId
                }
            },
            {
                $lookup:{
                    from: "documents",
                    localField: "_id",
                    foreignField: "pageId",
                    as: "page_documents"
                }
            },{
                $group: {
                    _id: "$_id",
                    pageName: { $first: "$pageName" },
                    icon: {$first: "$icon"},
                    documents: { $push: "$page_documents" }
                  }
            }, 
            {
                $sort: {
                  pageName: 1 
                }
              }
        ]).toArray();

        if (result)
        {
            return {success: true, result}
        }else{
            return {success: false};
        }

    }else{
        return ERRORS.MONGO_DB_CONNECTION;
    }
}

async function page_params(page_name, doc_name, companyId)
{
    let connection = await mongo.getConnection();

    if (connection !== null)
    {
        try{    
            let page_response = await connection.db("nextERP").collection("pages").findOne({pageName: page_name, companyId: companyId});
            if (page_response)
            {
                let doc_response = await connection.db("nextERP").collection("documents").findOne({companyId: companyId, pageId: new ObjectId(page_response._id), name: doc_name});
                if (doc_response)
                {
                    return {success: true, data: {doc_id: doc_response._id, page_id: page_response._id}};
                }else{
                    return {success: false};
                }
            }else{
                return {success: false};
            }
        }catch(e){
            return ERRORS.MONGO_DB_QUERY;
        }
    }else{
        return ERRORS.MONGO_DB_CONNECTION;
    }
}

async function add_document(name, page_id, companyId)
{
    let connection = await mongo.getConnection();

    if (connection !== null)
    {
        try{
            //check if page exists for this user 
            let page_response = await connection.db("nextERP").collection("pages").findOne({_id: new ObjectId(page_id), companyId: companyId});

            if (page_response)
            {
                //now check for document existance in this page 
                let document_response = await connection.db("nextERP").collection("documents").findOne({pageId: new ObjectId(page_id), name: name});

                if (document_response)
                {
                    return {success: false, body: "A document with same name already exists!"};
                }else{
                    //free to insert ihere 
                    let result = await connection.db("nextERP").collection("documents").insertOne({
                        name: name, 
                        companyId: companyId,
                        pageId: new ObjectId(page_id)
                    });

                    if (result){
                        return {success: true, data: {_id: result.insertedId, pageName: page_response.pageName}};
                    }else{
                        return ERRORS.MONGO_DB_QUERY;
                    }
                }
            }else{
                return {success: false, body: "The page does not exist!"};
            }

        }catch(e){
            return ERRORS.MONGO_DB_QUERY;
        }
    }else{
        return ERRORS.MONGO_DB_CONNECTION;
    }
}

async function getDocsAndSheetByPage(page_id)
{
    let connection = await mongo.getConnection();

    if (connection !== null)
    {   
        let response = await connection.db("nextERP").collection("documents").aggregate([
            {
                $match:{
                    pageId: new ObjectId(page_id)
                }
            },
            {
              $lookup: {
                from: "sheets",
                localField: "_id",
                foreignField: "doc_id",
                as: "sheets"
              }
            },
            {
              $addFields: {
                sheets: "$sheets" // Rename the field to 'sheets'
              }
            }
          ]).toArray();

          if (response){
            return {success: true, data: response};
          }else{
            return {success: false}
          }
    }else{
        return ERRORS.MONGO_DB_CONNECTION;
    }
}

async function update_document(doc_name, doc_id, page_id){
    if (doc_name.trim() != ""){

        let connection = await mongo.getConnection();

        if (connection){
            
            //check name unique
            let response = await connection.db("nextERP").collection("documents").findOne({pageId: new ObjectId(page_id), name: doc_name, _id: {$ne: new ObjectId(doc_id)}});

            if (response){
                return {success: false, data: { body: "A document with same name already exists!"}};
            }else{
                response = await connection.db("nextERP").collection("documents").updateOne({_id: new ObjectId(doc_id)},{$set: {name: doc_name}});

                if (response){
                    return {success: true};
                }else{
                    return ERRORS.MONGO_DB_QUERY;
                }

            }
        }else{
            return ERRORS.MONGO_DB_CONNECTION;
        }

    }else{
        return {success: false, data: {body: "Document name cannot be empty!"}};
    }
}

async function remove_page(page_id){
    let connection = await mongo.getConnection();


    if (connection){
        //this will be a cascade removal, so we need to remove data from these collections: pages, documents, sheets, cells
        try{
            //first find all the documents that are linked to the page_id
            let documents_response = await connection.db("nextERP").collection("documents").find({pageId: new ObjectId(page_id)}).toArray();
            if (documents_response){
                if (documents_response.length == 0){
                    //remove the page only 
                    let aux_resp = await remove_page__page_helper(connection, page_id);
                    return aux_resp;
                }else{
                    let document_response_ids = [];

                    documents_response.forEach((doc_resp)=>{
                        document_response_ids.push(new ObjectId(doc_resp._id));
                    })

                    //now select all the sheets that have one of these document_ids 
                    let sheets_response = await connection.db("nextERP").collection("sheets").find({doc_id: {$in: document_response_ids}}).toArray();

                    if (sheets_response){
                        if (sheets_response.length != 0){

                            //now remove the cells 
                            let sheets_response_ids = [];
                            sheets_response.forEach((sheet_resp)=>{
                                sheets_response_ids.push(new ObjectId(sheet_resp._id));
                            });

                            //remove data from cells 
                            let cells_removal_response = await connection.db("nextERP").collection("cells").deleteMany({sheetId: { $in: sheets_response_ids }});

                            if (cells_removal_response){
                                //now remove the sheets 
                                let sheets_removal_response = await connection.db("nextERP").collection("sheets").deleteMany({_id: { $in: sheets_response_ids }});

                                if (sheets_removal_response){

                                    //now delete the documents and the page itself
                                    let aux_resp1 = await remove_page__document_helper(connection, page_id);
                                    if (aux_resp1?.success === true){
                                        let aux_resp2 = await remove_page__page_helper(connection, page_id);
                                        return aux_resp2;
                                    }else{
                                        return aux_resp1;
                                    }

                                }else{
                                    return {success: false, data: { body: "Unexpected error!" }};
                                }
                            }else{
                                return {success: false, data: { body: "Unexpected error!" }};
                            }

                        }else{
                            //remove only the documents and the page
                            let aux_resp1 = await remove_page__document_helper(connection, page_id);
                            if (aux_resp1?.success === true){
                                let aux_resp2 = await remove_page__page_helper(connection, page_id);
                                return aux_resp2;
                            }else{
                                return aux_resp1;
                            }
                        }
                    }else{
                        
                        return {success: false, data: { body: "Unexpected error!" }};
                    }
                }
            }else{
                return {success: false, data: { body: "Unexpected error!" }};
            }
        }catch(e){
            console.log(e);
            return ERRORS.MONGO_DB_QUERY;
        }
    }else{
        return ERRORS.MONGO_DB_CONNECTION;
    }
}

async function remove_page__page_helper(connection, page_id)
{
    let page_removal_response = await connection.db("nextERP").collection("pages").deleteOne({_id: new ObjectId(page_id)});
    if (page_removal_response){
        return {success: true}
    }else{
        return {success: false, data: { body: "Unexpected error!" }}; 
    }
}

async function remove_page__document_helper(connection, page_id)
{
    let page_removal_response = await connection.db("nextERP").collection("documents").deleteOne({pageId: new ObjectId(page_id)});
    if (page_removal_response){
        return {success: true}
    }else{
        return {success: false, data: { body: "Unexpected error!" }}; 
    }
}

async function rename_page(name, page_id, companyId){
    let connection = await mongo.getConnection();

    if (connection){

        let page = await pageData(name, companyId);

        if (page?.success === true)
        {
            return {success: false, data: {body: "Page already exists!"}};
        }

        //rename the page

        let response = await connection.db("nextERP").collection("pages").updateOne({_id: new ObjectId(page_id)}, { $set: {pageName: name}});

        if (response){

            return {success: true};

        }else{
            return ERRORS.MONGO_DB_QUERY;
        }

    }else{
        return ERRORS.MONGO_DB_CONNECTION;
    }
}



async function add_favourite(page_id, doc_id, sheet_id, companyId, userId){
    let page_response = await page_checkID(page_id, companyId);

    if (page_response?.success === true){
        

        let document_response = await document_checkID(doc_id, companyId);

        if (document_response?.success === true){

            //check the sheet if exists 
            if (sheet_id !== undefined){

                let sheet_response = await sheet_checkID(sheet_id, companyId);

                if (sheet_response?.success === true){
                    return await add_favourite_query(page_id, doc_id, sheet_id, companyId, userId);
                }else{
                    return {success: false};
                }

            }else{
                //insert 
                return await add_favourite_query(page_id, doc_id, sheet_id, companyId, userId);
            }

        }else{
            return {success: false};
        }
    }else{
        return {success: false};
    }
}

async function add_favourite_query(page_id, doc_id, sheet_id, companyId, userId){
    let connection = await mongo.getConnection();

    if (connection){

        console.log(sheet_id);
        //we should check if unique first 
        //findOne first 
        let unique_response = await connection.db("nextERP").collection("favourites").findOne({
            pageId: new ObjectId(page_id),
            documentId: new ObjectId(doc_id),
            sheetId: sheet_id !== undefined ? new ObjectId(sheet_id) : null,
            userId: userId,
            companyId: companyId
        });

        if (unique_response){
            return {success: true};
        }else{
            let query = await connection.db("nextERP").collection("favourites").insertOne({
                pageId: new ObjectId(page_id),
                documentId: new ObjectId(doc_id),
                sheetId: sheet_id !== undefined ? new ObjectId(sheet_id) : null,
                userId: userId,
                companyId: companyId
            });
    
            if (query){
                return {success: true};
            }else{
                return {success: false};
            }
        }

    }else{
        return ERRORS.MONGO_DB_CONNECTION;
    }
}

module.exports = {
    addPage, getPagesAndDocuments, page_params, add_document, pageData, docsForPage, page_checkID, getDocsAndSheetByPage, update_document, remove_page, rename_page, add_favourite
}
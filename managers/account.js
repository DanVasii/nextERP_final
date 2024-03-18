const ERRORS = require("../errors");
const mysql = require("./mysql");
const mongo = require("./mongoDB");

function getCompanies(user_id){
    return new Promise(async (resolve, reject)=>{
        let connection = await mysql.getConnectionWrapper();

        if (connection){
            try{
                connection.query("SELECT id, name from companies where client_id = (SELECT client_id from users where id = ?)",[user_id], (err, results, fields)=>{
                    mysql.release(connection);

                    if (err){
                        reject(ERRORS.MYSQL_DB_QUERY);
                    }else{
                        resolve({success: true, data: results});
                    }
                })

            }catch(e){
                reject(ERRORS.MYSQL_DB_QUERY);
            }
        }else{
            reject(ERRORS.MYSQL_DB_CONNECTION);
        }
    })
}

function check_company(user_id, company_id){
    return new Promise(async (resolve, reject)=>{
        let connection = await mysql.getConnectionWrapper();
        
        if (connection){

            connection.query("SELECT users.client_id as user_client_id, companies.client_id as company_client_id from users, companies where users.id = ? and companies.id = ? ",[user_id, company_id],(err, results, fields)=>{
                mysql.release(connection);

                if (err){
                    reject(ERRORS.MYSQL_DB_QUERY);
                }else{
                    if (results.length != 0){
                        let {user_client_id, company_client_id} = results[0];

                        if (user_client_id === company_client_id){
                            resolve({success: true});
                        }else{
                            resolve({success: false});
                        }
                    }else{
                        resolve({success: false});
                    }
                }
            })

        }else{
            reject(ERRORS.MYSQL_DB_CONNECTION);
        }
    })
}

async function add_company(companyName, userId){
    
    return new Promise(async (resolve, reject)=>{
        let connection = await mysql.getConnectionWrapper();

        if (connection){

            if (companyName.trim().length != 0){

                connection.query("SELECT id from companies where name = ? and client_id = (SELECT client_id from users where id = ?)",[companyName.trim(), userId], (err, results, fields)=>{
                    if (err){
                        mysql.release(connection);
                        reject(ERRORS.MYSQL_DB_QUERY);
                    }else{
                        if (results.length == 0)
                        {

                            //just insert and return the id :)

                            connection.query("INSERT INTO companies (client_id, name) values ((SELECT client_id from users where id = ?), ?)",[userId, companyName.trim()],(err, results, fields)=>{
                                mysql.release(connection);
                                if (err){
                                    reject(ERRORS.MYSQL_DB_QUERY);
                                }else{
                                    resolve({success: true, data: {companyId: results.insertId}});
                                }
                            })

                        }else{
                            resolve({success: false, data: { body: "Company name is not unique!" }});
                        }
                    }
                })

            }else{
                resolve({success: false, data: { body: "Company name should not be empty!" }});
            }

        }else{
            reject(ERRORS.MYSQL_DB_CONNECTION);
        }
    })
}

async function query_favourites(user_id){
    let connection = await mongo.getConnection();

    if (connection){

        let results = await connection.db("nextERP").collection("favourites").aggregate([
            {
                $match:{
                    userId: user_id
                }
            },
            {
                $lookup: {
                    from: 'pages', // Name of the collection you want to join
                    localField: 'pageId',
                    foreignField: '_id',
                    as: 'pageName'
                }
            },
            {
                $lookup: {
                    from: 'documents', // Name of the collection you want to join
                    localField: 'documentId',
                    foreignField: '_id',
                    as: 'documentName'
                }
            },
            {
                $lookup: {
                    from: 'sheets', // Name of the collection you want to join
                    localField: 'sheetId',
                    foreignField: '_id',
                    as: 'sheetName'
                }
            },
            {
                $project: {
                    pageName: { $arrayElemAt: ['$pageName.pageName', 0] },
                    documentName: { $arrayElemAt: ['$documentName.name', 0] },
                    sheetName: { $arrayElemAt: ['$sheetName.sheetName', 0] }
                }
            }
        ]).toArray();

        if (results){   

            return {success: true, data: results};

        }else{
            return {success: false};
        }

    }else{
        return ERRORS.MONGO_DB_CONNECTION;
    }
}

module.exports = {
    getCompanies, check_company, add_company, query_favourites
}
const jwt = require("jsonwebtoken");
const { getDocumentsForUser } = require("./managers/excel");
const { getCompanies, check_company, query_favourites } = require("./managers/account");

function checkLogin(req, res, next)
{
    //get auth cookie 
    let {auth} = req.cookies;

    if (auth !== undefined)
    {
        jwt.verify(auth,"nextERP",(err, payload)=>{
            if (err)
            {
                //invalidate cookie 
                res.clearCookie("auth");
                return res.redirect("/auth/login");
            }else{
                req.user = payload;
                next();
            }
        })
    }else{
        return res.redirect("/auth/login");
    }
}

async function getDocuments(req, res, next)
{
    if (req.user)
    {
        let docs = await getDocumentsForUser(req.user.userId);
        if (docs?.success === true)
        {
            req.documents = docs.data;
            next();
        }else{
            return res.sendStatus(500);
        }
    }else{
        return res.sendStatus(404);
    }
}

async function checkCompany(req, res, next){
    if (req.user){
        if (req.user.companyId){
            //check if this company is for this user
            //we should also check if this company is assigned to this user :)
            check_company(req.user.userId, req.user.companyId).then((response)=>{
                if (response?.success === true){
                    return next();
                }else{
                    //unvalidate 
                    let new_data = {
                        ...req.user
                    };
                    req.user = new_data;
                    let token = jwt.sign(new_data,"nextERP");
                    res.cookie("auth",token, {secure: true, httpOnly: true, });
                    return res.redirect("/account/choose_company");
                }
            }).catch((err)=>{
                let new_data = {
                    ...req.user
                };
                req.user = new_data;
                let token = jwt.sign(new_data,"nextERP");
                res.cookie("auth",token, {secure: true, httpOnly: true, });
                return res.redirect("/account/choose_company");
            })
        }else{
            //check if there is only one company
            getCompanies(req.user.userId).then((companies)=>{
                if (companies?.success === true){
                    if (companies.data.length == 1){
                        //set the company
                        let new_data = {
                            ...req.user,
                            companyId: companies.data[0].id
                        };
                        req.user = new_data;
                        let token = jwt.sign(new_data,"nextERP");
                        res.cookie("auth",token, {secure: true, httpOnly: true, });

                        return next();
                    }else{
                        return res.redirect("/account/choose_company");
                    }
                }else{
                    return res.redirect("/account/choose_company");
                }
            }).catch((err)=>{
                return res.redirect("/account/choose_company");
            })
        }
    }else{
        return res.redirect("/auth/login");
    }
}

async function parse_favourites(req, res, next){
    if (req.user){

        let response = await query_favourites(req.user.userId);

        if (response?.success === true){
            req.favourites = response.data;
            return next();
        }else{
            return res.sendStatus(500);
        }
    }else{
        return res.sendStatus(500);
    }
}

module.exports = {
    checkLogin, getDocuments, checkCompany, parse_favourites
}
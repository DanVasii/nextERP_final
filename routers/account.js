const express = require("express");
const router = express.Router();
const { checkLogin, parse_favourites } = require("../middlewares");
const accountManager = require("../managers/account");
const ERRORS = require("../errors");
const jwt = require("jsonwebtoken");

router.use(checkLogin);

router.get("/companies", async (req, res)=>{
    let user = req.user;

    accountManager.getCompanies(user.userId)
    .then((response)=>{
        response.currentCompany = req.user.companyId;
        res.send(response);
    })
    .catch((err)=>{
        res.status(500).send(err);
    });

})

router.get("/choose_company", async (req, res)=>{
    res.render("choose_company.html");
})

router.post("/pick_company", async (req, res)=>{
    
    let {companyId} = req.body;

    if (companyId !== undefined){

        //check company
        accountManager.check_company(req.user.userId, companyId).then((response)=>{

            if (response?.success === true){
                
                let new_data = {
                    ...req.user,
                    companyId: companyId
                };
                req.user = new_data;
                let token = jwt.sign(new_data,"nextERP");
                res.cookie("auth",token, {secure: true, httpOnly: true, });
                res.sendStatus(200);
            }else{
                res.sendStatus(500);
            }
        }).catch((err)=>{
            console.log(err);
            res.sendStatus(500);
        })

    }else{
        res.sendStatus(500);
    }
})

router.post("/add_company", async (req, res)=>{
    let {companyName} = req.body;

    if (companyName !== undefined)
    {
        accountManager.add_company(companyName, req.user.userId).then((response)=>{
            res.send(response);
        }).catch((err)=>{
            res.sendStatus(500);
        })
    }else{
        res.status(500).send(ERRORS.INCOMPLETE_REQUEST);
    }
})

module.exports = router;
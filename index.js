const express = require("express");
const app = express();
const path = require("path");
const mustache = require("mustache-express");
const cookieParser = require("cookie-parser");
const { checkLogin, checkCompany, parse_favourites } = require("./middlewares");
const document_manager = require("./managers/documents");
const plural = require("pluralize");


app.use(cookieParser("nextERP"));
app.use(express.json());


// Router imports 
const excelRouter = require("./routers/excel");
const authRouter = require("./routers/auth");
const docRouter = require("./routers/documents");
const reportingRouter = require("./routers/reporting");
const accountRouter = require("./routers/account");

app.use("/excel",excelRouter);
app.use("/auth",authRouter);
app.use("/document", docRouter);
app.use("/reporting", reportingRouter);
app.use("/account", accountRouter);
// END ROUTING 

app.engine('html', mustache());
app.set('views', path.join(__dirname, '/pages'));

app.use(express.static(path.join(__dirname, 'pages')));
app.use("/assets",express.static(path.join(__dirname, "assets")));

app.get("/home",checkLogin, checkCompany, parse_favourites, async (req, res)=>{

    let menu = await document_manager.getPagesAndDocuments(req.user.companyId);
    let docsForPage = [];

    if (menu?.success === true){
        res.render("home.html",{pages: menu.result, ...req.user, favourites: req.favourites});
    }else{
        res.sendStatus(404);
    }

});

app.get("/test",(req, res)=>{
    res.render("test.html");
})


app.listen(3000,()=>{
    console.log("App started on port 3000");
})
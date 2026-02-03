const express = require('express');
const router = express.Router();

router.get('/add-new',(req, res)=>{
    res.render('invoice/addNew', {title: "Invoice List", subTitle:"Invoice List"})
});

router.get('/edit',(req, res)=>{
    res.render('invoice/edit', {title: "Invoice List", subTitle:"Invoice List"})
});

router.get('/list',(req, res)=>{
    res.render('invoice/list', {title: "Invoice List", subTitle:"Invoice List"})
});

router.get('/preview',(req, res)=>{
    res.render('invoice/preview', {title: "Invoice List", subTitle:"Invoice List"})
});


module.exports = router;  

const express = require('express');
const router = express.Router();

router.get('/column-chart', (req, res)=>{
    res.render('chart/columnChart', {title: "Column Chart", subTitle:"Components / Column Chart"})
});

router.get('/line-chart', (req, res)=>{
    res.render('chart/lineChart', {title: "Line Chart", subTitle:"Components / Line Chart"})
});

router.get('/pie-chart', (req, res)=>{
    res.render('chart/pieChart', {title: "Pie Chart", subTitle:"Components / Pie Chart"})
});


module.exports = router;

  const express = require('express');
  const router = express.Router();
  
  router.get('/basic-table',(req, res)=>{
      res.render('table/basicTable', {title: "Basic Table", subTitle:"Basic Table"})
  });

  router.get('/data-table',(req, res)=>{
      res.render('table/dataTable', {title: "Data Table", subTitle:"Data Table"})
  });
  
  module.exports = router;

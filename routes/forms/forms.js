  const express = require('express');
  const router = express.Router();
  
  router.get('/form-validation',(req, res)=>{
      res.render('forms/formValidation', {title: "Form Validation", subTitle:"Form Validation"})
  });
  
  router.get('/form-wizard',(req, res)=>{
      res.render('forms/formWizard', {title: "Wizard", subTitle:"Wizard"})
  });

  router.get('/input-forms',(req, res)=>{
      res.render('forms/inputForms', {title: "Input Form", subTitle:"Input Form"})
  });

  router.get('/input-layout',(req, res)=>{
      res.render('forms/inputLayout', {title: "Input Layout", subTitle:"Input Layout"})
  });

  module.exports = router;

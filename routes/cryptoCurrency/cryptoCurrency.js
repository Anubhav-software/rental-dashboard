  const express = require('express');
  const router = express.Router();
  
  router.get('/marketplace',(req, res)=>{
      res.render('cryptoCurrency/marketplace', {title: "Marketplace", subTitle:"Marketplace"})
  });
  
  router.get('/marketplace-details',(req, res)=>{
      res.render('cryptoCurrency/marketplaceDetails', {title: "Marketplace Details", subTitle:"Marketplace Details"})
  });
  
  router.get('/portfolio',(req, res)=>{
      res.render('cryptoCurrency/portfolio', {title: "Portfolios", subTitle:"Portfolios"})
  });
  
  router.get('/wallet',(req, res)=>{
      res.render('cryptoCurrency/wallet', {title: "Wallet", subTitle:"Wallet"})
  });
  
  module.exports = router;

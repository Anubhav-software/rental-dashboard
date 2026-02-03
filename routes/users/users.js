  const express = require('express');
  const router = express.Router();
  
  router.get('/add-user',(req, res)=>{
      res.render('users/addUser', {title: "Add User", subTitle:"Add User"})
  });
  
  router.get('/users-grid',(req, res)=>{
      res.render('users/usersGrid', {title: "users Grid", subTitle:"users Grid"})
  });
  
  router.get('/users-list',(req, res)=>{
      res.render('users/usersList', {title: "Users List", subTitle:"Users List"})
  });
  
  router.get('/view-profile',(req, res)=>{
      res.render('users/viewProfile', {title: "View Profile", subTitle:"View Profile"})
  });
  
  module.exports = router;

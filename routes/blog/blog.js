  
  const express = require('express');
  const router = express.Router();
  
  router.get('/add-blog', (req, res)=>{
      res.render('blog/addBlog', {title: "Add Blog", subTitle:"Add Blog"})
  });
  
  router.get('/blog', (req, res)=>{
      res.render('blog/blog', {title: "Blog", subTitle:"Blog"})
  });

  router.get('/blog-details', (req, res)=>{
      res.render('blog/blogDetails', {title: "Blog Details", subTitle:"Blog Details"})
  });

  module.exports = router;
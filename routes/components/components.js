  const express = require('express');
  const router = express.Router();
  
  router.get('/alerts',(req, res)=>{
      res.render('components/alerts', {title: "Alerts", subTitle:"Components / Alerts"})
  });

  router.get('/avatars',(req, res)=>{
      res.render('components/avatars', {title: "Avatars", subTitle:"Components / Avatars"})
  });

  router.get('/badges',(req, res)=>{
      res.render('components/badges', {title: "Badges", subTitle:"Components / Badges"})
  });

  router.get('/button',(req, res)=>{
      res.render('components/button', {title: "Button", subTitle:"Components / Button"})
  });

  router.get('/calendar',(req, res)=>{
      res.render('components/calendar', {title: "Calendar", subTitle:"Components / Calendar"})
  });

  router.get('/card',(req, res)=>{
      res.render('components/card', {title: "Card", subTitle:"Components / Card"})
  });

  router.get('/carousel',(req, res)=>{
      res.render('components/carousel', {title: "Carousel", subTitle:"Components / Carousel"})
  });

  router.get('/colors',(req, res)=>{
      res.render('components/colors', {title: "Colors", subTitle:"Components / Colors"})
  });

  router.get('/dropdown',(req, res)=>{
      res.render('components/dropdown', {title: "Dropdown", subTitle:"Components / Dropdown"})
  });

  router.get('/list',(req, res)=>{
      res.render('components/list', {title: "List", subTitle:"Components / List"})
  });

  router.get('/pagination',(req, res)=>{
      res.render('components/pagination', {title: "Pagination", subTitle:"Components / Pagination"})
  });

  router.get('/progressbar',(req, res)=>{
      res.render('components/progressbar', {title: "Progress Bar", subTitle:"Components / Progress Bar"})
  });

  router.get('/radio',(req, res)=>{
      res.render('components/radio', {title: "Radio", subTitle:"Components / Radio"})
  });

  router.get('/star-ratings',(req, res)=>{
      res.render('components/starRatings', {title: "Star Ratings", subTitle:"Components / Star Ratings"})
  });

  router.get('/switch',(req, res)=>{
      res.render('components/switch', {title: "Switch", subTitle:"Components / Switch"})
  });

  router.get('/tab-and-accordion',(req, res)=>{
      res.render('components/tabAndAccordion', {title: "Tab & Accordion", subTitle:"Components / Tab & Accordion"})
  });

  router.get('/tags',(req, res)=>{
      res.render('components/tags', {title: "Tags", subTitle:"Components / Tags"})
  });

  router.get('/tooltip',(req, res)=>{
      res.render('components/tooltip', {title: "Tooltip & Popover", subTitle:"Components / Tooltip & Popover"})
  });

  router.get('/typography',(req, res)=>{
      res.render('components/typography', {title: "Typography", subTitle:"Components / Typography"})
  });

  router.get('/upload',(req, res)=>{
      res.render('components/upload', {title: "Upload", subTitle:"Components / Upload"})
  });

  router.get('/videos',(req, res)=>{
      res.render('components/videos', {title: "Videos", subTitle:"Components / Videos"})
  });


























  module.exports = router;

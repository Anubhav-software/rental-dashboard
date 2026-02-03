  const express = require('express');
  const router = express.Router();

  const rentalRouter = require('../rental/rental');
  const expenseRouter = require('../expense/expense');
  const vehicleRouter = require('../vehicle/vehicle');
  const customerRouter = require('../customer/customer');
  const demoRentals = rentalRouter.demoRentals;
  const demoExpenses = expenseRouter.demoExpenses;
  const demoVehicles = vehicleRouter.demoVehicles;
  const demoCustomers = customerRouter.demoCustomers;

  router.get('/index5', (req, res) => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const monthEnd = now.toISOString().slice(0, 10);
    const revenue = demoRentals
      .filter((r) => r.status !== 'CANCELLED' && r.totalAmount != null && r.startDate >= monthStart && r.startDate <= monthEnd)
      .reduce((sum, r) => sum + Number(r.totalAmount), 0);
    const expenses = demoExpenses
      .filter((e) => (e.status === 'PAID' || e.status === 'APPROVED') && e.expenseDate >= monthStart && e.expenseDate <= monthEnd)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const profit = revenue - expenses;
    const activeRentals = demoRentals.filter((r) => r.status === 'ACTIVE').length;
    const recentRentals = [...demoRentals].sort((a, b) => (b.startDate || '').localeCompare(a.startDate || '')).slice(0, 5);
    const vehiclesMap = Object.fromEntries(demoVehicles.map((v) => [v.id, v]));
    const customersMap = Object.fromEntries(demoCustomers.map((c) => [c.id, c]));
    const dueListToday = vehicleRouter.getDueList ? vehicleRouter.getDueList('today') : [];
    res.render('dashboard/index5', {
      title: 'Dashboard',
      subTitle: 'Rental Overview',
      stats: { revenue, expenses, profit, activeRentals },
      recentRentals,
      vehiclesMap,
      customersMap,
      dueListToday,
    });
  });

  router.get('/index2',(req, res)=>{
      res.render('dashboard/index2', {title: "Dashboard", subTitle:"CRM"})
  });
  
  router.get('/index3',(req, res)=>{
      res.render('dashboard/index3', {title: "Dashboard", subTitle:"eCommerce"})
  });

  router.get('/index4',(req, res)=>{
      res.render('dashboard/index4', {title: "Dashboard", subTitle:"Cryptocracy"})
  });
  
  router.get('/index6',(req, res)=>{
      res.render('dashboard/index6', {title: "Dashboard", subTitle:"LMS / Learning System"})
  });
  
  router.get('/index7',(req, res)=>{
      res.render('dashboard/index7', {title: "Dashboard", subTitle:"NFT & Gaming"})
  });

  router.get('/index8',(req, res)=>{
      res.render('dashboard/index8', {title: "Dashboard", subTitle:"Medical"})
  });
  
  router.get('/index9',(req, res)=>{
      res.render('dashboard/index9', {title: "Analytics", subTitle:"Analytics"})
  });

  router.get('/index10',(req, res)=>{
      res.render('dashboard/index10', {title: "POS & Inventory", subTitle:"POS & Inventory"})
  });

  module.exports = router;

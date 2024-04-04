const express = require('express');
const router = express.Router();
const Company = require('../models/company');

// Create a new company
router.post('/', async (req, res) => {
  try {
    const company = new Company(req.body);
    await company.save();
    res.status(201).json(company);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all companies
router.get('/', async (req, res) => {
  try {
    const companies = await Company.find();
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a company router.put('/:id', async (req, res) => { try { const { id } = req.params; const company = await Company.findById(id); if (!company) { return res.status(404).json({ message: 'Company not found' }); } Object.assign(company, req.body); await company.save(); res.json(company); } catch (error) { res.status(400).json({ message: error.message }); } });

// Delete a company 
router.delete('/:id', async (req, res) => { 
  try { const { id } = req.params; 
  const company = await Company.findById(id); 
  if (!company) { 
    return res.status(404).json({ message: 'Company not found' }); } 
    await company.remove(); res.json({ message: 'Company deleted' }); 
  } catch (error) { res.status(500).json({ message: error.message }); } });

// Get a specific company 
router.get('/:id', async (req, res) => { 
  try { const { id } = req.params; 
  const company = await Company.findById(id); 
  if (!company) { return res.status(404).json({ message: 'Company not found' }); } res.json(company); 
} catch (error) { res.status(500).json({ message: error.message }); } });

module.exports = router;
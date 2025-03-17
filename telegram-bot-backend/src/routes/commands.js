const express = require('express');
const asyncHandler = require('express-async-handler');
const botService = require('../services/bot.service');

const router = express.Router();

// Get all commands
router.get('/', asyncHandler(async (req, res) => {
  const commands = Array.from(botService.commands.values());
  res.json(commands);
}));

// Add a new command
router.post('/', asyncHandler(async (req, res) => {
  const { question, answer } = req.body;
  await botService.addCommand(question, answer);
  res.status(201).json({ message: 'Command added successfully' });
}));

// Update an existing command
router.put('/:question', asyncHandler(async (req, res) => {
  const { question } = req.params;
  const { answer } = req.body;
  if (botService.commands.has(question)) {
    await botService.addCommand(question, answer);
    res.json({ message: 'Command updated successfully' });
  } else {
    res.status(404).json({ error: 'Command not found' });
  }
}));

// Delete a command
router.delete('/:question', asyncHandler(async (req, res) => {
  const { question } = req.params;
  const result = await botService.removeCommand(question);
  if (result) {
    res.json({ message: 'Command deleted successfully' });
  } else {
    res.status(404).json({ error: 'Command not found' });
  }
}));

module.exports = router; 
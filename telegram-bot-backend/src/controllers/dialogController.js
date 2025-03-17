const { Dialog, DialogStep, DialogStepButton, User } = require('../models');
const logger = require('../utils/logger');

const dialogController = {
  // Get all dialogs
  async getAllDialogs(req, res) {
    try {
      const dialogs = await Dialog.findAll({
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'email']
          }
        ]
      });
      
      logger.info(`Retrieved ${dialogs.length} dialogs`);
      res.json(dialogs);
    } catch (error) {
      logger.error('Error fetching dialogs:', error);
      res.status(500).json({ error: error.message });
    }
  },
  
  // Get a single dialog by ID
  async getDialogById(req, res) {
    try {
      const { id } = req.params;
      
      const dialog = await Dialog.findByPk(id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'email']
          },
          {
            model: DialogStep,
            as: 'steps',
            order: [['order_index', 'ASC']]
          }
        ]
      });
      
      if (!dialog) {
        logger.warn(`Dialog with id ${id} not found`);
        return res.status(404).json({ error: 'Dialog not found' });
      }
      
      logger.info(`Retrieved dialog with id ${id}`);
      res.json(dialog);
    } catch (error) {
      logger.error(`Error fetching dialog ${req.params.id}:`, error);
      res.status(500).json({ error: error.message });
    }
  },
  
  // Create a new dialog
  async createDialog(req, res) {
    try {
      const { name, description, is_active } = req.body;
      const userId = req.user.id;
      
      const newDialog = await Dialog.create({
        name, 
        description, 
        is_active: is_active !== undefined ? is_active : true,
        created_by: userId,
        status: 'new'
      });
      
      logger.info(`Created new dialog with id ${newDialog.id}`);
      res.status(201).json(newDialog);
    } catch (error) {
      logger.error('Error creating dialog:', error);
      res.status(500).json({ error: error.message });
    }
  },
  
  // Update a dialog
  async updateDialog(req, res) {
    try {
      const { id } = req.params;
      const { name, description, is_active } = req.body;
      
      const dialog = await Dialog.findByPk(id);
      
      if (!dialog) {
        logger.warn(`Dialog with id ${id} not found for update`);
        return res.status(404).json({ error: 'Dialog not found' });
      }
      
      // Update dialog properties
      dialog.name = name !== undefined ? name : dialog.name;
      dialog.description = description !== undefined ? description : dialog.description;
      dialog.is_active = is_active !== undefined ? is_active : dialog.is_active;
      
      await dialog.save();
      
      logger.info(`Updated dialog with id ${id}`);
      res.json(dialog);
    } catch (error) {
      logger.error(`Error updating dialog ${req.params.id}:`, error);
      res.status(500).json({ error: error.message });
    }
  },
  
  // Update dialog status
  async updateDialogStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, resolution } = req.body;
      
      const dialog = await Dialog.findByPk(id);
      
      if (!dialog) {
        logger.warn(`Dialog with id ${id} not found for status update`);
        return res.status(404).json({ error: 'Dialog not found' });
      }
      
      // Validate status
      if (!['new', 'in_progress', 'closed'].includes(status)) {
        logger.warn(`Invalid status provided: ${status}`);
        return res.status(400).json({ error: 'Invalid status value' });
      }
      
      // Update dialog status
      dialog.status = status;
      
      // If status is closed, add resolution
      if (status === 'closed' && resolution) {
        dialog.resolution = resolution;
      }
      
      await dialog.save();
      
      logger.info(`Updated status of dialog ${id} to ${status}`);
      res.json(dialog);
    } catch (error) {
      logger.error(`Error updating dialog status ${req.params.id}:`, error);
      res.status(500).json({ error: error.message });
    }
  },
  
  // Delete a dialog
  async deleteDialog(req, res) {
    try {
      const { id } = req.params;
      
      const dialog = await Dialog.findByPk(id);
      
      if (!dialog) {
        logger.warn(`Dialog with id ${id} not found for deletion`);
        return res.status(404).json({ error: 'Dialog not found' });
      }
      
      await dialog.destroy();
      
      logger.info(`Deleted dialog with id ${id}`);
      res.json({ message: 'Dialog deleted successfully' });
    } catch (error) {
      logger.error(`Error deleting dialog ${req.params.id}:`, error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = dialogController; 
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Check if column exists
      const tableInfo = await queryInterface.describeTable('users');
      if (!tableInfo.is_active) {
        await queryInterface.addColumn('users', 'is_active', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
        });
        
        console.log('Added is_active column to users table');
      } else {
        console.log('is_active column already exists in users table');
      }
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('users', 'is_active');
    } catch (error) {
      console.error('Down migration failed:', error);
      throw error;
    }
  }
}; 
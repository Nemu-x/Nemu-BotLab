'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Check if column exists
      const tableInfo = await queryInterface.describeTable('clients');
      if (!tableInfo.banned_at) {
        await queryInterface.addColumn('clients', 'banned_at', {
          type: Sequelize.DATE,
          allowNull: true
        });
        
        // Create index
        await queryInterface.addIndex('clients', ['banned_at'], {
          name: 'clients_banned_at'
        });
        
        console.log('Added banned_at column to clients table');
      } else {
        console.log('banned_at column already exists in clients table');
      }
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Remove index
      await queryInterface.removeIndex('clients', 'clients_banned_at');
      
      // Remove column
      await queryInterface.removeColumn('clients', 'banned_at');
    } catch (error) {
      console.error('Down migration failed:', error);
      throw error;
    }
  }
}; 
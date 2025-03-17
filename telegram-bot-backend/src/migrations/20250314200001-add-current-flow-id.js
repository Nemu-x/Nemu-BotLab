'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Check if column exists
      const tableInfo = await queryInterface.describeTable('clients');
      if (!tableInfo.current_flow_id) {
        await queryInterface.addColumn('clients', 'current_flow_id', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'flows',
            key: 'id'
          }
        });
        
        // Create index
        await queryInterface.addIndex('clients', ['current_flow_id'], {
          name: 'clients_current_flow_id'
        });
        
        console.log('Added current_flow_id column to clients table');
      } else {
        console.log('current_flow_id column already exists in clients table');
      }
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Remove index
      await queryInterface.removeIndex('clients', 'clients_current_flow_id');
      
      // Remove column
      await queryInterface.removeColumn('clients', 'current_flow_id');
    } catch (error) {
      console.error('Down migration failed:', error);
      throw error;
    }
  }
}; 
module.exports = {
  async up(queryInterface, Sequelize) {
    // Создаем таблицу экспортов
    await queryInterface.createTable('exports', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      type: {
        type: Sequelize.ENUM('dialog_responses', 'clients', 'messages'),
        allowNull: false
      },
      format: {
        type: Sequelize.ENUM('csv', 'html', 'xlsx'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed'),
        allowNull: false,
        defaultValue: 'pending'
      },
      filters: {
        type: Sequelize.JSON,
        allowNull: true
      },
      file_path: {
        type: Sequelize.STRING,
        allowNull: true
      },
      created_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('exports');
  }
}; 
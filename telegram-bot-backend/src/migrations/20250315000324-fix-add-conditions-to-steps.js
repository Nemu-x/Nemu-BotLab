'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('steps', 'conditions', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null,
      comment: 'Условия для перехода к этому шагу в формате {prevStepId: string, answers: [{value: string, operator: "equals"|"contains"|"startsWith"|"endsWith"|"regex", match: string}]}'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('steps', 'conditions');
  }
};

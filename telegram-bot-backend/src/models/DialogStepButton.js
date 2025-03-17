const { Model, DataTypes } = require('sequelize');

class DialogStepButton extends Model {
  static associate(models) {
    this.belongsTo(models.DialogStep, { foreignKey: 'dialog_step_id', as: 'step' });
  }

  static init(sequelize) {
    return super.init({
      dialog_step_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'dialog_steps',
          key: 'id'
        }
      },
      text: {
        type: DataTypes.STRING,
        allowNull: false
      },
      value: {
        type: DataTypes.STRING,
        allowNull: true
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'callback'
      },
      next_step_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'dialog_steps',
          key: 'id'
        }
      },
      url: {
        type: DataTypes.STRING,
        allowNull: true
      },
      order_index: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    }, {
      sequelize,
      modelName: 'DialogStepButton',
      tableName: 'dialog_step_buttons',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['dialog_step_id']
        },
        {
          fields: ['next_step_id']
        },
        {
          fields: ['order_index']
        }
      ]
    });
  }
}

module.exports = DialogStepButton; 
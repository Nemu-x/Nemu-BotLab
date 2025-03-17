const { Model, DataTypes } = require('sequelize');

class DialogStep extends Model {
  static associate(models) {
    this.belongsTo(models.Dialog, { foreignKey: 'dialog_id', as: 'dialog' });
    this.hasMany(models.DialogStepButton, { foreignKey: 'dialog_step_id', as: 'buttons' });
    this.hasMany(models.Message, { foreignKey: 'dialog_step_id', as: 'messages' });
  }

  static init(sequelize) {
    return super.init({
      dialog_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'dialogs',
          key: 'id'
        }
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      conditions: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
      },
      next_steps: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      order_index: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    }, {
      sequelize,
      modelName: 'DialogStep',
      tableName: 'dialog_steps',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['dialog_id']
        },
        {
          fields: ['order_index']
        }
      ]
    });
  }
}

module.exports = DialogStep; 
const { Model, DataTypes } = require('sequelize');

class Dialog extends Model {
  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
    this.hasMany(models.DialogStep, { foreignKey: 'dialog_id', as: 'steps' });
  }

  static init(sequelize) {
    return super.init({
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'new',
        validate: {
          isIn: [['new', 'in_progress', 'closed']]
        }
      },
      resolution: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    }, {
      sequelize,
      modelName: 'Dialog',
      tableName: 'dialogs',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['created_by']
        },
        {
          fields: ['status']
        }
      ]
    });
  }
}

module.exports = Dialog; 
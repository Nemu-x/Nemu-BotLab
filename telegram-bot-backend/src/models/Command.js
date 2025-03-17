const { Model, DataTypes } = require('sequelize');

class Command extends Model {
  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
    this.belongsTo(models.Flow, { foreignKey: 'flow_id', as: 'flow' });
  }

  static init(sequelize) {
    return super.init({
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      response: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM('text', 'slash', 'regex'),
        defaultValue: 'text'
      },
      match_type: {
        type: DataTypes.ENUM('exact', 'contains', 'regex'),
        defaultValue: 'contains'
      },
      priority: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      flow_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'flows',
          key: 'id'
        }
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      action: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null
      }
    }, {
      sequelize,
      modelName: 'Command',
      tableName: 'commands',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['name']
        },
        {
          fields: ['is_active']
        },
        {
          fields: ['flow_id']
        },
        {
          fields: ['created_by']
        }
      ]
    });
  }
}

module.exports = Command; 
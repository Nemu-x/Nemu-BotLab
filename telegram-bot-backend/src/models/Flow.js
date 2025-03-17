const { Model, DataTypes } = require('sequelize');

class Flow extends Model {
  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
    this.hasMany(models.Command, { foreignKey: 'flow_id', as: 'commands' });
    this.hasMany(models.Client, { foreignKey: 'current_flow_id', as: 'activeClients' });
    this.hasMany(models.Step, { foreignKey: 'flow_id', as: 'flowSteps' });
    this.hasMany(models.FlowResponse, { foreignKey: 'flow_id', as: 'responses' });
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
      is_default: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
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
      }
    }, {
      sequelize,
      modelName: 'Flow',
      tableName: 'flows',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['name']
        },
        {
          fields: ['is_default']
        },
        {
          fields: ['is_active']
        },
        {
          fields: ['created_by']
        }
      ]
    });
  }
}

module.exports = Flow; 
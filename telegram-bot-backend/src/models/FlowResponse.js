const { Model, DataTypes } = require('sequelize');

class FlowResponse extends Model {
  static associate(models) {
    this.belongsTo(models.Client, { foreignKey: 'client_id', as: 'client' });
    this.belongsTo(models.Flow, { foreignKey: 'flow_id', as: 'flow' });
  }

  static init(sequelize) {
    return super.init({
      client_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'clients',
          key: 'id'
        }
      },
      flow_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'flows',
          key: 'id'
        }
      },
      responses: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {}
      },
      completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    }, {
      sequelize,
      modelName: 'FlowResponse',
      tableName: 'flow_responses',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['client_id']
        },
        {
          fields: ['flow_id']
        },
        {
          fields: ['completed']
        },
        {
          fields: ['completed_at']
        }
      ]
    });
  }
}

module.exports = FlowResponse; 
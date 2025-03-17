const { Model, DataTypes } = require('sequelize');

class Step extends Model {
  static associate(models) {
    this.belongsTo(models.Flow, { foreignKey: 'flow_id', as: 'flow' });
  }

  static init(sequelize) {
    return super.init({
      flow_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'flows',
          key: 'id'
        }
      },
      order_index: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      question: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      response_type: {
        type: DataTypes.ENUM('text', 'callback', 'url', 'nextStep', 'keyboard', 'final'),
        allowNull: false,
        defaultValue: 'text'
      },
      is_required: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      options: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
      },
      config: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {
          show_buttons: false,
          save_as: null,
          validate: null,
          error_message: null,
          skip_if: null,
          hide_step_counter: false
        }
      },
      next_step_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'steps',
          key: 'id'
        }
      }
    }, {
      sequelize,
      modelName: 'Step',
      tableName: 'steps',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['flow_id']
        },
        {
          fields: ['order_index']
        },
        {
          fields: ['next_step_id']
        }
      ]
    });
  }
}

module.exports = Step; 
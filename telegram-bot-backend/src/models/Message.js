const { Model, DataTypes } = require('sequelize');

class Message extends Model {
  static associate(models) {
    this.belongsTo(models.Client, { foreignKey: 'client_id', as: 'client' });
    this.belongsTo(models.Flow, { foreignKey: 'flow_id', as: 'flow' });
    this.belongsTo(models.Step, { foreignKey: 'flow_step_id', as: 'flowStep' });
    this.belongsTo(models.User, { foreignKey: 'responded_by', as: 'responder' });
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
      message_content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      is_from_bot: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      telegram_message_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      is_direct_message: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      button_click_data: {
        type: DataTypes.JSON,
        allowNull: true
      },
      dialog_step_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      response_to_step_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      media_type: {
        type: DataTypes.STRING,
        allowNull: true
      },
      media_url: {
        type: DataTypes.STRING,
        allowNull: true
      },
      media_id: {
        type: DataTypes.STRING,
        allowNull: true
      },
      media_caption: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      media_size: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      media_filename: {
        type: DataTypes.STRING,
        allowNull: true
      },
      location_data: {
        type: DataTypes.JSON,
        allowNull: true
      },
      contact_data: {
        type: DataTypes.JSON,
        allowNull: true
      },
      flow_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'flows',
          key: 'id'
        }
      },
      flow_step_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'steps',
          key: 'id'
        }
      },
      responded_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      }
    }, {
      sequelize,
      modelName: 'Message',
      tableName: 'messages',
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
          fields: ['flow_step_id']
        },
        {
          fields: ['responded_by']
        },
        {
          fields: ['is_read']
        },
        {
          fields: ['created_at']
        }
      ]
    });
  }
}

module.exports = Message; 
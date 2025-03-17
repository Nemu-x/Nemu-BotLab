const { Model, DataTypes } = require('sequelize');

class Client extends Model {
  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'assigned_to', as: 'assignedOperator' });
    this.belongsTo(models.Flow, { foreignKey: 'current_flow_id', as: 'currentFlow' });
    this.hasMany(models.Message, { foreignKey: 'client_id', as: 'messages' });
    this.hasMany(models.FlowResponse, { foreignKey: 'client_id', as: 'flowResponses' });
    this.hasMany(models.Ticket, { foreignKey: 'client_id', as: 'tickets' });
    this.hasOne(models.Message, {
      foreignKey: 'client_id',
      as: 'lastMessage',
      scope: {
        order: [['created_at', 'DESC']]
      }
    });
  }

  static init(sequelize) {
    return super.init({
      telegram_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      username: {
        type: DataTypes.STRING,
        allowNull: true
      },
      first_name: {
        type: DataTypes.STRING,
        allowNull: true
      },
      last_name: {
        type: DataTypes.STRING,
        allowNull: true
      },
      photo_url: {
        type: DataTypes.STRING,
        allowNull: true
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      is_blocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      is_dialog_open: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      banned_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      ban_reason: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      banned_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      last_message_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      language: {
        type: DataTypes.STRING(10),
        allowNull: true,
        defaultValue: 'en'
      },
      tags: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
      },
      assigned_to: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      category: {
        type: DataTypes.STRING,
        allowNull: true
      },
      priority: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'normal'
      },
      status: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'active'
      },
      current_flow_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'flows',
          key: 'id'
        }
      },
      flow_data: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
      },
      is_archived: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    }, {
      sequelize,
      modelName: 'Client',
      tableName: 'clients',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['telegram_id']
        },
        {
          fields: ['username']
        },
        {
          fields: ['assigned_to']
        },
        {
          fields: ['current_flow_id']
        },
        {
          fields: ['is_blocked']
        },
        {
          fields: ['banned_at']
        },
        {
          fields: ['banned_by']
        },
        {
          fields: ['is_archived']
        },
        {
          fields: ['last_message_at']
        }
      ]
    });
  }

  // Метод для бана клиента
  async ban(reason, userId) {
    this.banned_at = new Date();
    this.ban_reason = reason;
    this.banned_by = userId;
    this.is_blocked = true;
    await this.save();
  }

  // Метод для разбана клиента
  async unban() {
    this.banned_at = null;
    this.ban_reason = null;
    this.banned_by = null;
    this.is_blocked = false;
    await this.save();
  }

  // Геттер для проверки, забанен ли клиент
  get isBanned() {
    return this.banned_at !== null;
  }
}

module.exports = Client; 
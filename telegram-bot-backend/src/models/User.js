const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

class User extends Model {
  static associate(models) {
    this.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' });
    this.hasMany(models.Command, { foreignKey: 'created_by', as: 'commands' });
    this.hasMany(models.Message, { foreignKey: 'responded_by', as: 'messages' });
    this.hasMany(models.Client, { foreignKey: 'assigned_to', as: 'assignedClients' });
    this.hasMany(models.Ticket, { foreignKey: 'assigned_to', as: 'assignedTickets' });
  }

  async validatePassword(password) {
    return bcrypt.compare(password, this.password);
  }

  static init(sequelize) {
    return super.init({
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false
      },
      first_name: {
        type: DataTypes.STRING,
        allowNull: true
      },
      last_name: {
        type: DataTypes.STRING,
        allowNull: true
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id'
        }
      }
    }, {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['username']
        },
        {
          fields: ['email']
        },
        {
          fields: ['is_active']
        },
        {
          fields: ['role_id']
        }
      ],
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            user.password = await bcrypt.hash(user.password, 10);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            user.password = await bcrypt.hash(user.password, 10);
          }
        }
      }
    });
  }
}

module.exports = User; 
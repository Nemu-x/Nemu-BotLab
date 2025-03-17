const { Model, DataTypes } = require('sequelize');

class Role extends Model {
  static associate(models) {
    this.hasMany(models.User, { foreignKey: 'role_id', as: 'users' });
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
      }
    }, {
      sequelize,
      modelName: 'Role',
      tableName: 'roles',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['name']
        }
      ]
    });
  }
}

module.exports = Role; 
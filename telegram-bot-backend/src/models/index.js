const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);

const env = process.env.NODE_ENV || 'development';
const config = require('../config/database.js')[env];
const db = {};

let sequelize;
if (config.dialect === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: config.storage,
    logging: config.logging
  });
} else if (config.dialect === 'postgres') {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
      host: config.host,
      port: config.port,
      dialect: 'postgres',
      logging: config.logging,
      pool: config.pool
    }
  );
} else {
  throw new Error(`Unsupported dialect: ${config.dialect}`);
}

// First, read all model files
const modelFiles = fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  });

// Initialize models without associations
modelFiles.forEach(file => {
  const modelPath = path.join(__dirname, file);
  const Model = require(modelPath);
  if (typeof Model === 'function' && Model.prototype instanceof Sequelize.Model) {
    const model = Model.init(sequelize);
    db[model.name] = model;
  }
});

// Set up associations after all models are initialized
Object.values(db).forEach(model => {
  if (model.associate && typeof model.associate === 'function') {
    model.associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db; 
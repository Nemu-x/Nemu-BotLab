const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');
const Client = require('../models/Client');
const Message = require('../models/Message');
const Command = require('../models/Command');
const User = require('../models/User');

// Функция для получения структуры таблицы из базы данных
async function getTableStructure(tableName) {
  const query = `PRAGMA table_info(${tableName});`;
  const columns = await sequelize.query(query, { type: QueryTypes.SELECT });
  return columns.map(col => ({
    name: col.name,
    type: col.type,
    allowNull: col.notnull === 0
  }));
}

// Функция для получения атрибутов из модели Sequelize
function getModelAttributes(model) {
  const attributes = model.rawAttributes;
  const result = {};
  
  for (const [attrName, attrDef] of Object.entries(attributes)) {
    const fieldName = attrDef.field || attrName;
    result[fieldName] = {
      origName: attrName,
      type: attrDef.type.constructor.name,
      allowNull: attrDef.allowNull !== false
    };
  }
  
  return result;
}

// Основная функция проверки
async function checkDatabaseStructure() {
  try {
    // Подключение к базе данных
    await sequelize.authenticate();
    console.log('Connected to database');
    
    // Проверка таблицы clients
    const clientTableStructure = await getTableStructure('clients');
    const clientModelAttrs = getModelAttributes(Client);
    console.log('\n=== Проверка таблицы clients ===');
    compareStructures('clients', clientTableStructure, clientModelAttrs);
    
    // Проверка таблицы messages
    const messagesTableStructure = await getTableStructure('messages');
    const messagesModelAttrs = getModelAttributes(Message);
    console.log('\n=== Проверка таблицы messages ===');
    compareStructures('messages', messagesTableStructure, messagesModelAttrs);
    
    // Проверка таблицы commands
    const commandsTableStructure = await getTableStructure('commands');
    const commandsModelAttrs = getModelAttributes(Command);
    console.log('\n=== Проверка таблицы commands ===');
    compareStructures('commands', commandsTableStructure, commandsModelAttrs);
    
    // Проверка таблицы users
    const usersTableStructure = await getTableStructure('users');
    const usersModelAttrs = getModelAttributes(User);
    console.log('\n=== Проверка таблицы users ===');
    compareStructures('users', usersTableStructure, usersModelAttrs);
    
    console.log('\nПроверка завершена');
  } catch (error) {
    console.error('Ошибка при проверке структуры базы данных:', error);
  } finally {
    await sequelize.close();
  }
}

// Функция для сравнения структур
function compareStructures(tableName, dbColumns, modelAttrs) {
  console.log(`Таблица: ${tableName}`);
  
  // Проверка колонок, которые есть в БД, но отсутствуют в модели
  const dbColumnNames = dbColumns.map(col => col.name);
  const modelColumnNames = Object.keys(modelAttrs);
  
  console.log('\nКолонки в БД, отсутствующие в модели:');
  const extraDbColumns = dbColumnNames.filter(name => !modelColumnNames.includes(name));
  if (extraDbColumns.length) {
    extraDbColumns.forEach(col => console.log(`  - ${col}`));
  } else {
    console.log('  Нет расхождений');
  }
  
  console.log('\nКолонки в модели, отсутствующие в БД:');
  const missingDbColumns = modelColumnNames.filter(name => !dbColumnNames.includes(name));
  if (missingDbColumns.length) {
    missingDbColumns.forEach(col => {
      const origName = modelAttrs[col].origName;
      console.log(`  - ${col} (из атрибута модели: ${origName})`);
    });
  } else {
    console.log('  Нет расхождений');
  }
  
  // Подробная информация о колонках
  console.log('\nДетальная информация о колонках в БД:');
  dbColumns.forEach(col => {
    console.log(`  - ${col.name} (${col.type}, ${col.allowNull ? 'NULL' : 'NOT NULL'})`);
  });
}

// Запуск проверки
checkDatabaseStructure(); 
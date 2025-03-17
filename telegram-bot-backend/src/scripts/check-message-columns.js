const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

async function checkMessageColumns() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connection established successfully.');

    console.log('Checking messages table structure...');
    const [results] = await sequelize.query('PRAGMA table_info(messages)');
    
    console.log('Columns in messages table:');
    results.forEach(column => {
      console.log(`- ${column.name} (${column.type})`);
    });
    
    const requiredColumns = [
      'id', 'client_id', 'text', 'is_from_bot', 'is_read', 
      'media_type', 'media_url', 'media_id', 'media_caption', 
      'media_size', 'media_filename', 'location_data', 'contact_data'
    ];
    
    const missingColumns = requiredColumns.filter(
      column => !results.some(result => result.name === column)
    );
    
    if (missingColumns.length > 0) {
      console.log('\nMissing columns:');
      missingColumns.forEach(column => {
        console.log(`- ${column}`);
      });
      
      console.log('\nAdding missing columns...');
      for (const column of missingColumns) {
        try {
          switch (column) {
            case 'media_type':
            case 'media_url':
            case 'media_id':
            case 'media_filename':
              await sequelize.query(`ALTER TABLE messages ADD COLUMN ${column} TEXT`);
              break;
            case 'media_caption':
              await sequelize.query(`ALTER TABLE messages ADD COLUMN ${column} TEXT`);
              break;
            case 'media_size':
              await sequelize.query(`ALTER TABLE messages ADD COLUMN ${column} INTEGER`);
              break;
            case 'location_data':
            case 'contact_data':
              await sequelize.query(`ALTER TABLE messages ADD COLUMN ${column} TEXT`);
              break;
            default:
              console.log(`Skipping unknown column: ${column}`);
          }
          console.log(`Added column: ${column}`);
        } catch (error) {
          console.error(`Error adding column ${column}:`, error);
        }
      }
      
      console.log('\nUpdated table structure:');
      const [updatedResults] = await sequelize.query('PRAGMA table_info(messages)');
      updatedResults.forEach(column => {
        console.log(`- ${column.name} (${column.type})`);
      });
    } else {
      console.log('\nAll required columns exist in the messages table.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the database connection
    await sequelize.close();
    console.log('Database connection closed.');
  }
}

// Run the function
checkMessageColumns(); 
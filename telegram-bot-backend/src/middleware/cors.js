// CORS middleware
const corsMiddleware = (req, res, next) => {
  // Разрешаем запросы с любого источника в режиме разработки
  res.header('Access-Control-Allow-Origin', '*');
  
  // Разрешаем различные методы запросов
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  
  // Разрешаем заголовки
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Разрешаем отправку куки
  res.header('Access-Control-Allow-Credentials', true);
  
  // Обработка preflight запросов
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
};

module.exports = corsMiddleware; 
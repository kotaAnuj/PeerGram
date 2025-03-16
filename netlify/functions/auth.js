const { storage } = require('../../server/storage');

exports.handler = async function(event, context) {
  const path = event.path.replace('/.netlify/functions/auth', '');
  
  // Handle register endpoint
  if (path === '/register' && event.httpMethod === 'POST') {
    try {
      const userData = JSON.parse(event.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return {
          statusCode: 409,
          body: JSON.stringify({ message: "Username already exists" })
        };
      }
      
      const user = await storage.createUser(userData);
      return {
        statusCode: 201,
        body: JSON.stringify(user)
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Server error" })
      };
    }
  }
  
  // Other auth endpoints...
}

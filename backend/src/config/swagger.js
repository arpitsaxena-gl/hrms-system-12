const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HRMS API Documentation',
      version: '1.0.0',
      description: 'Enterprise Human Resource Management System API',
      contact: { name: 'HRMS Team', email: 'api@hrms.com' }
    },
    servers: [
      { url: 'http://localhost:5000/api', description: 'Development Server' },
      { url: 'https://api.hrms.com/api', description: 'Production Server' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.js', './src/models/*.js']
};

const specs = swaggerJsdoc(options);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui.min.css'
  }));
};

module.exports = { setupSwagger };

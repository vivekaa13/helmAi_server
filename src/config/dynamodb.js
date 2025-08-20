const AWS = require('aws-sdk');

AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();

const tableNames = {
  USERS: 'helm-users',
  FLIGHTS: 'helm-flights',
  BOOKINGS: 'helm-bookings'
};

module.exports = {
  dynamoDB,
  tableNames
};

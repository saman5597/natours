const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
  console.log('Shutting down app...');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DB.replace('<PASSWORD>', process.env.DB_PASSWORD);

// Cloud DB
mongoose
  // .connect(process.env.DB_LOCAL, {
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log('DB connection successful'));

//Starting Server
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running to port ${port}`);
});

process.on('unhandledRejection', err => {
  console.log('Shutting down app...');
  server.close(() => {
    console.log(err.name, err.message);
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down app... 👋');
  server.close(() => {
    console.log('PROCESS TERMINATED !!!');
  });
});

const express = require('express');
const http = require('http');
const ngrok = require('ngrok');
const {ngrok_config} = require('./ngrok_config.js');

const app = express();
const server = http.createServer(app);

app.use(express.static('public'))

const createServer = async () => {
  try {
    const PORT = 3000; // Define your desired port
    server.listen(PORT, async () => {
      console.log(`Server is running at http://localhost:${PORT}`);
      // const url = await ngrok.connect(ngrok_config);
      // console.log(`Server is running, and the server address is: ${url}`);
    });
  } catch (error) {
    console.error('Error starting the server:', error);
  }
};

createServer();
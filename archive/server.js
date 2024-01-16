const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const request = require('request');
const stream = require('stream');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

app.use(bodyParser.json());

app.post('/webhook', (req, res) => {
  const msg = req.body.message;

  if (msg.text === '/start') {
    bot.sendMessage(msg.chat.id, 'Hello! Send me an audio file, and I will convert it to mp3.');
  } else if (msg.audio) {
    processAudio(msg);
  }

  res.sendStatus(200);
});

function processAudio(msg) {
  const chatId = msg.chat.id;
  bot.getFileLink(msg.audio.file_id)
    .then((link) => {
      bot.sendMessage(chatId, 'File received!');

      const file = fs.createWriteStream('inputFile');
      const sendReq = request.get(link);

      sendReq.pipe(file).on('close', () => {
        ffmpeg('inputFile')
          .toFormat('mp3')
          .on('error', (err) => {
            console.log('An error occurred: ' + err.message);
          })
          .on('end', () => {
            bot.sendMessage(chatId, 'File converted successfully!');
            bot.sendMessage(chatId, 'Fetching the converted file, please wait .....');
            bot.sendAudio(chatId, 'output.mp3');
          })
          .save('output.mp3');
      });
    })
    .catch((err) => {
      console.error('An error has occurred:', err.message);
      bot.sendMessage(chatId, 'An error has occurred. Contact developer with the error. Error: ' + err.message);
    });
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
  // You might want to handle this error and send a message to the user or take appropriate action.
});

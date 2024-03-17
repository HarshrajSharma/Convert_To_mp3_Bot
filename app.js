const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const fs =require('fs');
const request = require('request');
const ffmpeg = require('fluent-ffmpeg');

const { setupWebHook } = require('./setUpWebHook');
const {BOT_TOKEN} = require('./config');

const bot = new TelegramBot(BOT_TOKEN, { polling: false });


const app = express();
app.use(bodyParser.json());


app.get('/', (req, res)=>{
  res.send('Server Active!');
})
// Handle incoming updates from Telegram
app.post(`/bot${BOT_TOKEN}`, (req, res) => {
  const chatId = req.body.message.chat.id;
  const text = req.body.message.text;

  const audio = req.body.message.audio;
  const voice = req.body.message.voice;

  console.log(req.body);

  // Check if the command is /start
  if (text === '/start') {
    bot.sendMessage(chatId, 'Hello! Send me an audio file and I will convert it to mp3.');
  }


  // When an audio is received
  if(audio){
    console.log("Script started");
    // console.log(msg.audio)
    bot.getFileLink(audio.file_id)
    .then((link) => {
        
        console.log('Getting file link .....')
        bot.sendMessage(chatId, 'File received!')

        const file = fs.createWriteStream('inputFile');
        const sendReq = request.get(link);

        console.log('Saving file....')
        bot.sendMessage(chatId, 'Converting file to .mp3 format .....');
        // save file
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
        console.log('An error has occurred:' + err.message)
        // 'An error has occurred:' + err.message
        bot.sendMessage(chatId, 'An error has occurred. Contact developer with the error. Error: ' + err.message);
    });
  }


  if(voice){
    console.log("Script started (voice message)");
      bot.getFileLink(voice.file_id)
        .then((link) => {
          console.log('Getting voice message link .....')
          bot.sendMessage(chatId, 'Voice message received!')
          const file = fs.createWriteStream('inputFile');
          const sendReq = request.get(link);
          console.log('Saving voice message....')
          bot.sendMessage(chatId, 'Converting voice message to .mp3 format .....');
          sendReq.pipe(file).on('close', () => {
            ffmpeg('inputFile')
              .inputFormat('ogg') // Specify input format as ogg
              .toFormat('mp3')
              .on('error', (err) => {
                console.log('An error occurred: ' + err.message);
              })
              .on('end', () => {
                bot.sendMessage(chatId, 'Voice message converted successfully!');
                bot.sendMessage(chatId, 'Fetching the converted file, please wait .....');
                bot.sendAudio(chatId, 'output.mp3');
              })
              .save('output.mp3');
          });
        })
        .catch((err) => {
          console.log('An error has occurred:' + err.message)
          bot.sendMessage(chatId, 'An error has occurred. Contact developer with the error. Error: ' + err.message);
        });
  }

  res.sendStatus(200);
});



const port = process.env.PORT || 3000;
app.listen(port, async () => {
  console.log(`Server is listening on port ${port}`);
  await setupWebHook();
});

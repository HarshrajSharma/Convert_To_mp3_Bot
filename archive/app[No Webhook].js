const TelegramBot = require('node-telegram-bot-api');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const request = require('request');
const stream = require('stream');
require('dotenv').config();

const token = process.env.BOT_TOKEN
const bot = new TelegramBot(token, {polling: true});

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Hello! Send me an audio file and I will convert it to mp3.");
});


bot.on('voice', (msg) => {
      console.log("Script started (voice message)");
      const chatId = msg.chat.id;
      bot.getFileLink(msg.voice.file_id)
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
    
  });
  

bot.on('audio', (msg) => {

    console.log("Script started");
    const chatId = msg.chat.id;
    // console.log(msg.audio)
    bot.getFileLink(msg.audio.file_id)
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
});
bot.on("polling_error", (error) => {
    console.error("Polling error:", error);
    bot.sendMessage(chatId, 'An error has occurred. Contact developer with the error. Error: ' + err.message);
});

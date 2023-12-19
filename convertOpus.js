const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
require('dotenv').config();
// Replace 'YOUR_BOT_TOKEN' with the actual token obtained from BotFather
const token=process.env.BOT_TOKEN
const bot = new TelegramBot(token, { polling: true });

bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  // Check if the message contains an audio file
  if (msg.audio) {
    const fileId = msg.audio.file_id;

    // Get the audio file path
    bot.getFile(fileId).then((file) => {
      const audioPath = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

      // Convert audio to mp3
      convertToMp3(audioPath, chatId);
    });
  } else {
    bot.sendMessage(chatId, 'Please send an audio file for conversion.');
  }
});

function convertToMp3(audioPath, chatId) {
  const outputFileName = 'output_audio.mp3';

  // Download the audio file using Axios
  axios({
    method: 'get',
    url: audioPath,
    responseType: 'stream',
  })
    .then((response) => {
      // Create a write stream for the output file
      const outputStream = fs.createWriteStream(outputFileName);

      // Pipe the audio stream directly to ffmpeg for conversion
      response.data.pipe(
        ffmpeg()
          .audioCodec('libmp3lame')
          .toFormat('mp3')
          .on('end', () => {
            // Send the converted mp3 file
            bot.sendAudio(chatId, { source: outputFileName })
              .then(() => {
                // Cleanup temporary files
                fs.unlinkSync(outputFileName);
              })
              .catch((err) => {
                console.error(`Error sending audio: ${err.message}`);
              });
          })
          .on('error', (err) => {
            console.error(`Error converting audio: ${err.message}`);
            bot.sendMessage(chatId, 'Error converting audio. Please try again.');
          })
          .pipe(outputStream, { end: true })
      );
    })
    .catch((error) => {
      console.error(`Error downloading audio: ${error.message}`);
      bot.sendMessage(chatId, 'Error downloading audio. Please try again.');
    });
}

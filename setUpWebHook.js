const axios = require('axios');
require('dotenv').config();

const {BOT_TOKEN, SERVER_URL} = require('./config');

// Telegram API Configuration
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`
const URI = `/webhook/${BOT_TOKEN}`
const webhookURL = `${SERVER_URL}/bot` + BOT_TOKEN;

const setupWebHook = async () => {
    try {
        setTimeout(async () => {
            console.log('Connecting WebHook....');
            await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {url: webhookURL})
            .then(response => {
                console.log('Webhook set successfully:', response.data);
            })
            .catch(async (error) => {
                console.error('Error setting webhook:', error.message);
                await setupWebHook();
            });
        }, 1000);
        
    } catch (error) {
        return error
    }
}

module.exports = {setupWebHook};
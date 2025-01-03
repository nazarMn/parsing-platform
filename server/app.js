const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.TOKEN, { polling: true });
const PORT = process.env.PORT || 3000;

mongoose
    .connect(
        'mongodb+srv://root:YJnztLVoAxSH8wyX@cluster0.rsoua.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
    )
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

const itemSchema = new mongoose.Schema({
    title: String,
    price: String,
    status: Boolean,
    createdAt: { type: Date, default: Date.now },
    follow: Boolean,
    url: String
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Simple URL validation
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    if (!urlRegex.test(text)) {
        bot.sendMessage(chatId, '⚠️ Please send a valid product URL.');
        return;
    }

    try {
        const URL = text;

        // Fetch product details
        const response = await axios.get(URL);
        const html = response.data;
        const $ = cheerio.load(html);

        const title = $('.title__font').first().text();
        const price = $('.product-price__big').first().text();
        const status = $('.status-label').text().includes('Є в наявності') || $('.status-label').text().includes('Закінчується');

        const goodsInfo = {
            title: title || 'No Title Found',
            price: price || 'No Price Found',
            status: status,
            follow: false,
            url: URL
        };

        // Save to MongoDB
        const savedItem = await Item.create(goodsInfo);

        // Respond to the user
        bot.sendMessage(chatId, `✅ Product saved successfully:\n\n📦 Title: ${goodsInfo.title}\n💵 Price: ${goodsInfo.price}\n🔗 URL: ${goodsInfo.url}`);
    } catch (error) {
        console.error('Error processing URL:', error);
        bot.sendMessage(chatId, '❌ An error occurred while processing the product URL.');
    }
});




const Item = mongoose.model('Item', itemSchema);

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/goodsTargetName', async (req, res) => {
    const { URL } = req.body;
    if (!URL) {
        return res.status(400).json({ message: 'URL is required' });
    }

    try {
        const response = await axios.get(URL);
        const html = response.data;
        const $ = cheerio.load(html);

        const titles = [];
        const prices = [];
        const statuses = [];

        $('.title__font').each((_, element) => {
            titles.push($(element).text());
        });

        $('.product-price__big').each((_, element) => {
            prices.push($(element).text());
        });

        $('.status-label').each((_, element) => {
            statuses.push($(element).text().includes('Є в наявності') || $(element).text().includes('Закінчується'));
        });


        let goodsInfo = {};
        goodsInfo.title = titles[0];
        goodsInfo.price = prices[0];
        goodsInfo.status = statuses[0];
        goodsInfo.follow = false;
        goodsInfo.url = URL;

        console.log(goodsInfo)

        await Item.create(goodsInfo);

        res.json({ message: 'Data successfully logged', goodsInfo });
    } catch (error) {
        console.error('Error parsing URL:', error);
        res.status(500).json({ message: 'Error fetching data from URL' });
    }
});

app.get('/items', async (req, res) => {
    try {
        const items = await Item.find();
        res.json(items);
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ message: 'Error fetching items' });
    }
});

app.post('/follow', async (req, res) => {
    const { id } = req.body;
    try {
        const item = await Item.findById(id);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        item.follow = !item.follow;
        await item.save();

        // Format the Telegram message
        const followStatus = item.follow ? '✅ Subscribed' : '❌ Unsubscribed';
        const message = `${followStatus} to updates:\n\n📦 Title: ${item.title}\n💵 Price: ${item.price}\n🔗 URL: ${item.url}`;

        bot.sendMessage(process.env.CHAT_ID, message);
        res.json(item);
    } catch (error) {
        console.error('Error updating follow status:', error);
        res.status(500).json({ message: 'Error updating follow status' });
    }
});

app.post('/getUpdate', async (req, res) => {
    const { id } = req.body;
    try {
        const item = await Item.findById(id);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        const { url } = item; // Get the URL from the database

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(url);
        const html = await page.content();
        const $ = cheerio.load(html);

        const title = $('.title__font').text();
        const price = $('.product-price__big').text();
        const status = $('.status-label').text().includes('Є в наявності') || $('.status-label').text().includes('Закінчується');

        // Check if the data has changed
        let message = '';
        let priceChanged = false;
        
        // Check for price change
        if (item.price !== price) {
            priceChanged = true;
            item.price = price; // Update the price in the database
            message += `💸 Price has changed!\nOld Price: ${item.price}\nNew Price: ${price}\n`;
        }

        if (item.title !== title) {
            item.title = title; // Update the title if changed
            message += `📦 Title has changed!\nOld Title: ${item.title}\nNew Title: ${title}\n`;
        }

        if (item.status !== status) {
            item.status = status; // Update the status if changed
            message += `🔔 Status has changed!\nNew Status: ${status ? 'Available' : 'Not Available'}\n`;
        }

        // Save the updated item
        await item.save();

        if (priceChanged) {
            // Send a message to Telegram
            bot.sendMessage(process.env.CHAT_ID, `Product updated:\n\n${message}🔗 URL: ${item.url}`);
        }

        await browser.close();
        return res.json({ message: priceChanged ? 'The data has changed' : 'No changes detected', updatedItem: item });
    } catch (error) {
        console.error('Error fetching item:', error);
        res.status(500).json({ message: 'Error fetching item' });
    }
});




app.delete('/deleteItem/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deletedItem = await Item.findByIdAndDelete(id);
        if (!deletedItem) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // Notify Telegram about the deletion
        const message = `🗑️ Item deleted: \n\nTitle: ${deletedItem.title}\nPrice: ${deletedItem.price}\nURL: ${deletedItem.url}`;
        bot.sendMessage(process.env.CHAT_ID, message);

        res.json({ message: 'Item deleted successfully', deletedItem });
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ message: 'Error deleting item' });
    }
});





app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
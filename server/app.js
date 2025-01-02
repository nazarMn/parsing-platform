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
        item.follow = !item.follow;
        await item.save();
        bot.sendMessage(process.env.CHAT_ID, 'Follow status for ' + item.title + ' has been changed to ' + item.follow);
        res.json(item);
    } catch (error) {
        console.error('Error following item:', error);
        res.status(500).json({ message: 'Error following item' });
    }
});

app.post('/getUpdate', async (req, res) => {
    try {
        const {url} = req.body;
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(url);
        const html = await page.content();
        const $ = cheerio.load(html);

        const title = $('.title__font').text();
        const price = $('.product-price__big').text();
        const status = $('.status-label').text().includes('Є в наявності') || $('.status-label').text().includes('Закінчується');

        const item = await Item.findOne({ url: url });
        if(item.title === title && item.price === price && item.status === status) {
            await browser.close();
            bot.sendMessage(process.env.CHAT_ID, 'The data has not changed');
            return res.json({ message: 'The data has not changed' });
        }else{
            bot.sendMessage(process.env.CHAT_ID, 'The data has changed');
            return res.json({ message: 'The data has changed' });
        }
    } catch (error) {
        console.error('Error fetching item:', error);
        res.status(500).json({ message: 'Error fetching item' });
    }
})




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
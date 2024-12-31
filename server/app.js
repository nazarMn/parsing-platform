const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');
const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');
const TOKEN = '6554951276:AAHjkeeFVNxBQ42LCyizyH-3S-UbkJLqHqY';

const bot = new TelegramBot(TOKEN, {polling: true});

bot.sendMessage(1779499306, 'Hello, world!');




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

        await Item.create(goodsInfo);

        res.json({ message: 'Data successfully logged', goodsInfo });
        // res.json({ message: 'Data successfully logged', items });
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
    try {
     const { id } = req.body;
        const item = await Item.findById(id);
        item.follow = !item.follow;
        await item.save();
        bot.sendMessage(1779499306, `Follow status for ${item.title} has been updated to ${item.follow ? 'Unfollow' : 'Follow'}`);
       res.json({ message: `Follow status for` });
    
    }
    catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ message: 'Error fetching items' });
    }
});


app.post('/getUpdate', async (req, res) => {
    try {
     const { url } = req.body;
     const browser = await puppeteer.launch();
     const page = await browser.newPage();
     await page.goto(url);
     const html = await page.content();
     const $ = cheerio.load(html);
     const title = $('h1').text();
     const price = $('span').text();
     const status = $('span').text().includes('Є в наявності') || $('span').text().includes('Закінчується');
     const item = await Item.findOne({ url });
     if (item.title === title && item.price === price && item.status === status) {
        await browser.close();
        return res.jsom({ message: 'The data has not changed' });
        bot.sendMessage(1779499306, `Follow status for ${item.title} has been updated to ${item.follow ? 'Unfollow' : 'Follow'}`);
     }else{
        return res.json({ message: 'The data has changed' });
        bot.sendMessage(1779499306, `Follow status for ${item.title} has been updated to ${item.follow ? 'Unfollow' : 'Follow'}`);
     }
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ message: 'Error fetching items' });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
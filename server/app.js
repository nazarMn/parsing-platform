const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const { default: axios } = require('axios');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 3000;

mongoose.connect('mongodb+srv://root:YJnztLVoAxSH8wyX@cluster0.rsoua.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

const itemSchema = new mongoose.Schema({
    title: String,
    price: String,
    status: Boolean
});

const Item = mongoose.model('Item', itemSchema);

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/goodsTargetName', async (req, res) => {
    try {
        const url = req.body.URL;

        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);

        const titles = [];
        const statuses = [];
        const prices = [];

        $('.title__font').each((index, element) => {
            const title = $(element).text();
            titles.push(title);
        });

        $('.status-label').each((index, element) => {
            const statusText = $(element).text();
            statuses.push(statusText.includes('Є в наявності'));
        });

        $('.product-price__big').each((index, element) => {
            const price = $(element).text();
            prices.push(price);
        });

        // Збереження даних у MongoDB
        for (let i = 0; i < titles.length; i++) {
            await Item.create({
                title: titles[i],
                price: prices[i],
                status: statuses[i]
            });
        }

        res.json({ message: 'Items saved to MongoDB successfully' });
    } catch (error) {
        console.error('Error fetching or saving data:', error);
        res.status(500).json({ error: 'Failed to fetch or save data' });
    }
});

app.get('/getItems', async (req, res) => {
    try {
        const items = await Item.find();
        res.json(items);
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

// Serve React App
app.use(express.static(path.join(__dirname, '..', 'dist')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

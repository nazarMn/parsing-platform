const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 3000;
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const { default: axios } = require('axios');
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://zubalana0:zbhQXHED368PbcVK@cluster0.a5jnl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
.then(
    console.log('MongoDB connected')
)

let itemSchema = new mongoose.Schema({
    title: String,
    price: String,
    status: Boolean
  });
  
let Item = mongoose.model('Item', itemSchema);

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let url = '';

app.post('/goodsTargetName', async (req, res) => {
    console.log(req.body);
    url = req.body.URL;
})

app.get('/itemInfo', async (req, res) => {
    try {
        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);
        const data = [];
        const titles = [];
        const statuses = [];
        $('.title__font').each((index, element) => {
            const title = $(element).text(); 
            titles.push(title);
        });

        $('.status-label').each((index, element) => {
            const statusText = $(element).text(); 
            if(statusText.includes('Є в наявності')){
                statuses.push(true);
            }else{
                statuses.push(false);
            }
            console.log(statuses)
        });

        $('.product-price__big').each((index, element) => {
            const price = $(element).text(); 
            data.push({ title: titles[index], price, status: statuses[index] });
            
        });

        res.json(data);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
});




app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
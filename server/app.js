const express = require('express');
const app = express();
const cors = require('cors');
const PORT = process.env.PORT || 3000;
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const mongoose = require('mongoose');

const url = 'mongodb+srv://root:jRGlLjobfLKCUl8O@cluster0.rsoua.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

app.use(cors());

app.get('/', async (req, res) => {
   
});



app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
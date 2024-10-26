const express = require('express');
const bodyParser = require('body-parser');
const router = require('./auth');
const { getResponseFromAPI } = require('../utils/generateResponse');

jest.mock('../utils/generateResponse');

const app = express();
app.use(bodyParser.json());
app.use('/', router);

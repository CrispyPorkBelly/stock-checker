/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

require('dotenv').config();
var request = require('request');
var expect = require('chai').expect;
var MongoClient = require('mongodb');
var moment = require('moment');

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(function (req, res){
      //Get price of only one stock
      const firstStock = req.query.singleStock;
      //Get price of both stock
      const firstOfTwoStocks = req.query.firstDoubleStock;
      const secondOfTwoStocks = req.query.secondOfTwoStocks;
      //Capture stock info
      let stockData;

      //create API request url
      const apiKey = 'VSV71O3KBKXN8CRH';
      const dateToday = moment().format("YYYY-MM-DD");

      request.get('https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=' + firstStock + '&outputsize=compact&apikey=' + apiKey, 
      (err, response, body) => {
        if (err) {
          return next(err);
        }
        const rawInfo = JSON.parse(body);
        stockData = (rawInfo["Time Series (Daily)"][dateToday]["4. close"]);
        console.log(stockData);
        response.send(stockData);
      })
      //Send stock price info
      // res.send(stockData);
    });

};

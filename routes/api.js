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
      const firstStock = req.query.stock;
      const secondStock = req.query.stock;
      //Capture stock info
      let firstStockPrice;
      let secondStockPrice;

      //create API request url
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
      let dateToday = moment();

      request.get('https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=' + firstStock + '&outputsize=compact&apikey=' + apiKey, 
      (err, response, body) => {
        if (err) {
          return next(err);
        }

        //Stock markets do not update on weekends. To get the latest price, you need closing date of most recent Friday.
        switch(dateToday.day()) {
          case 0: //Sunday. Get Friday's date
            dateToday = dateToday.subtract(2, "days");
            break;
          case 1:
            break;
          case 2:
            break;
          case 3:
            break;
          case 4:
            break;
          case 5:
            break;
          case 6:
            dateToday = dateToday.subtract(1, "days"); //Saturday. Get Friday's date
        }

        const rawInfo = JSON.parse(body);
        firstStockPrice = (rawInfo["Time Series (Daily)"][dateToday.format("YYYY-MM-DD")]["4. close"]);

        //Send stock price info

        //{"stockData":{"stock":"GOOG","price":"786.90","likes":1}}
        res.send({ "stockData": { "stock": firstStock.toUpperCase(), "price": firstStockPrice, "likes": 1 } });
      })
    });

};

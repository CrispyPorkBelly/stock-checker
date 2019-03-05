/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

require("dotenv").config();
var requestPromise = require("request-promise-native");
var expect = require("chai").expect;
var MongoClient = require("mongodb");
var moment = require("moment");
const mongoose = require("mongoose");
const Stock = require("../models/stock.model");
mongoose.Promise = global.Promise;

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function(app) {
  mongoose
    .connect(process.env.DATABASE_URL, {
      useNewUrlParser: true
    })
    .then(() => {
      console.log("Successfully connected to database");
    })
    .catch(err => {
      console.log("Failed to connect to database. Exiting now. Error: ", err);
      process.exit();
    });

  function getStockInfo(stockTicker, dateToday) {
    //Setup options for tapping into alphavantage API
    var options = {
      method: "GET",
      uri: "https://www.alphavantage.co/query",
      qs: {
        function: "TIME_SERIES_DAILY",
        symbol: stockTicker,
        outputsize: "compact",
        apikey: process.env.ALPHA_VANTAGE_API_KEY
      },
      json: true
    };

    //Retrieve stock data
    return requestPromise(options)
      .then(response => { 
        return { stock: stockTicker.toUpperCase(), price: response["Time Series (Daily)"]['2019-03-04']["4. close"]}//dateToday
      })
      .catch(err => {
        return { error: err.message};
      });
  }

  function getMostRecentBusinessDate() {
    let dateToday = moment();
    //Stock markets do not update on weekends. To get the latest price, you need closing date of most recent Friday.
    switch (dateToday.day()) {
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

    return dateToday.format("YYYY-MM-DD");
  }

  app.route("/api/stock-prices").get(function(req, res) {
    //Capture stock info
    const firstStock = req.query.stock[0];
    const secondStock = req.query.stock[1];
    
    console.log(req.query.stock);
    let firstStockPromise = getStockInfo(firstStock, getMostRecentBusinessDate());
    let secondStockPromise = getStockInfo(secondStock, getMostRecentBusinessDate());

    firstStockPromise
     .then( (stockInfoOne) => {
      let responseObject = { stockInfoOne }
      console.log(stockInfoOne);
      return responseObject;
    })
     .then( responseObject => {
       secondStockPromise
        .then( (stockInfoTwo) => {
          let finalResponse = { responseObject, stockInfoTwo };
          res.send(finalResponse);
        })
     })

  });
};

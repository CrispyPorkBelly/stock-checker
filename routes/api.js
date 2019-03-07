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
        console.log('response');
        console.log('stockerTicker:' + stockTicker);
        console.log('dateToday:' + dateToday);
        console.log({stock: stockTicker.toUpperCase(), price: response["Time Series (Daily)"]['2019-03-06']["4. close"]}); //change back to dayToday
        return {
          stock: stockTicker.toUpperCase(),
          price: response["Time Series (Daily)"]['2019-03-06']["4. close"]
        }; //dateToday
      })
      .catch(err => {
        // console.log({ error: err.message });
        return { error: err.message };
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

  function createAndUpdateStock(stockTicker, clientIpAddress, isStockLiked) {
    //search filters
    let query = { stockTicker: stockTicker, ip_address: clientIpAddress};
    let update = { like: isStockLiked };
    let options = { upsert: true, new: true, setDefaultsOnInsert: true };

    Stock.findOneAndUpdate(query, update, options).catch(err => {
      return {
        message: err.message || "Error occured looking up likes info"
      };
    });
  }

  function getNumberOfLikes(stockTicker) {
    let query = { stockTicker: stockTicker };

    return Stock.find(query)
      .then(results => {
        return results.filter(stockTicker => stockTicker.like === true).length; //first filter to see how many have true marked for likes //the length of the returned array will be only the ones with likes
      })
      .catch(err => {
        console.log({ error: err.message });
        return {
          message: err.message || "Error occured looking up likes info"
        };
      });
  }

  app.route("/api/stock-prices").get(function(req, res) {
    //Capture stock info
    let firstStock;
    let secondStock;

    console.log(req.query.stock);

    //Set variables depending on which field users input stock ticker into
    if (req.query.stock.constructor === Array) {
      firstStock = req.query.stock[0];
      secondStock = req.query.stock[1];
    } else {
      firstStock = req.query.stock;
    }

    let firstStockPromise = getStockInfo(
      firstStock,
      getMostRecentBusinessDate()
    );

      let secondStockPromise = getStockInfo(
        secondStock,
        getMostRecentBusinessDate()
      );

    //Update like status of stock in database. If it does not exist, create it
    let clientIpAddress =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress; //x-forwarded-for will give you the ip if client is going through a proxy. Otherwise remoteAddress will give you direct IP
    let clientLikeStatus = req.query.like || false;

    firstStockPromise
      .then(stockInfoOne => {
        createAndUpdateStock(firstStock, clientIpAddress, clientLikeStatus);
        let stockData = [stockInfoOne];
        return stockData;
      })
      .then(stockData => {
        getNumberOfLikes(firstStock)
          .then(result => {
            stockData[0].likes = result;
            return stockData;
            // console.log(stockData);
          })
          .then(stockData => {
            //only attach a second stockObject to the response if user requested data on a second stock
            if (secondStock) {
              secondStockPromise.then(stockInfoTwo => {
                createAndUpdateStock(
                  secondStock,
                  clientIpAddress,
                  clientLikeStatus
                );
                getNumberOfLikes(secondStock)
                  .then(result => {
                    // console.log(result);
                    stockInfoTwo.likes = result;
                    return stockInfoTwo;
                  })
                  .then(stockInfoTwo => {
                    stockData.push(stockInfoTwo);

                    if (stockData[0].error || stockData[1].error) {
                      console.log(stockData[0].error || stockData[1].error);
                      res.send({
                        Error:
                          "Stock data not found. You may have exceed 5 updates per minute. Please check your stock ticker and try again in one minute."
                      });
                    } else {
                      let firstStockRelativeLikes =
                        stockData[0].likes - stockData[1].likes;
                      let secondStockRelativeLikes =
                        stockData[1].likes - stockData[0].likes;

                      stockData[0].rel_likes = firstStockRelativeLikes;
                      stockData[1].rel_likes = secondStockRelativeLikes;

                      res.send({
                        stockData: [
                          {
                            stock: stockData[0].stock,
                            price: stockData[0].price,
                            rel_likes: stockData[0].rel_likes
                          },
                          {
                            stock: stockData[1].stock,
                            price: stockData[1].price,
                            rel_likes: stockData[1].rel_likes
                          }
                        ]
                      });
                    }
                  });
              });
            } else {
              if (stockData[0].error) {
                console.log(stockData[0].error || stockData[1].error);
                res.send({
                  Error:
                    "Stock data not found. You may have exceed 5 updates per minute. Please check your stock ticker and try again in one minute."
                });
              } else {
                res.send({ stockData });
              }
            }
          });
      });
  });
};

const mongoose = require('mongoose');

const stockSchema = mongoose.Schema({
    "stockCode":    {type: String, required: true},
    "likes": [ {type: Number, default: 0, required: false}  ]
});

module.exports = mongoose.model("Stock", stockSchema);
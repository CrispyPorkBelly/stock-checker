const mongoose = require('mongoose');

const stockSchema = mongoose.Schema({
    "stockTicker":    {type: String, required: true},
    "ip_address":    {type: String, required: true},
    "like": [ {type: Boolean, default: false, required: false}  ]
});

module.exports = mongoose.model("Stock", stockSchema);
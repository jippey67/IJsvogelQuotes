const zipObject = require('lodash.zipobject');
const MongoClient = require('mongodb').MongoClient;
const passWord = process.argv[2]
const uri = 'mongodb+srv://jippey:'+passWord+'@waltzers0-zbdk7.mongodb.net/test?retryWrites=true&w=majority'
const binance = require('node-binance-api')().options({
  APIKEY: '4HWzVdZ1vh6JEWppDrpX93mub3DbZqI6bqwoheOc2Rk2HzX0SFncLw0rPFPDNzq0',
  APISECRET: 'JomWK2nGwtLguabSlm3Ypm46MD6DeFqE4mqojPNqvxqWXO3ghywKMZshG1BRM4xb',
  useServerTime: true // If you get timestamp errors, synchronize to server time at startup
});

markets = ['BTCUSDT', 'BTCTUSD', 'BTCPAX', 'BTCUSDC', 'BTCBUSD', 'BTCUSDS']
currentQuotes = new Array(markets.length)

var currentQuotes = zipObject(markets, new Array(markets.length));

for (var i = 0; i < markets.length; i++) {
  binance.prices(markets[i], (error, ticker) => {
    let key = Object.keys(ticker)[0]
    let value = Object.values(ticker)[0]
    currentQuotes[key] = value
  });
}

console.log(currentQuotes);

binance.websockets.trades(markets, (trades) => {
  let {e:eventType, E:eventTime, s:symbol, p:price, q:quantity, m:maker, a:tradeId} = trades;
  console.log(eventTime+" "+symbol+" trade update. price: "+price+", quantity: "+quantity+", maker: "+maker);
  currentQuotes[symbol] = price
  update={
    'time':eventTime,
    'source':symbol,
    'levels':currentQuotes
  };
  console.log(update)


  MongoClient.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }, (err, client) => {
    if (err) {
      console.error(err)
      return
    }
    const db = client.db('IJsvogel')
    const collection = db.collection('quotes')
    collection.insertOne(update, (err, result) => {
      //console.log('database returns: '+result)
    });
  });
});

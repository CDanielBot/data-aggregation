var express = require('express');
var fs      = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var casperModule = require('casper');
var app     = express();

app.get('/scrape', function(req, res){
  // Let's scrape Anchorman 2
  url = 'http://www.imdb.com/title/tt1229340/';

  request(url, function(error, response, html){
    if(error) {
        return;
    }

    var $ = cheerio.load(html);

    var title, release, rating;
    var json = { title : "", release : "", rating : ""};

    $('.title_wrapper').filter(function(){
      var data = $(this);
      title = data.children().first().text().trim();
      release = data.children().last().children().last().text().trim();

      json.title = title;
      json.release = release;
    });

    $('.ratingValue').filter(function(){
      var data = $(this);
      rating = data.text().trim();

      json.rating = rating;
    });

    fs.writeFile('output.json', JSON.stringify(json, null, 4), function(err){
      console.log('File successfully written! - Check your project directory for the output.json file');
    });

    res.send('Check your console!')
  })
});

app.get('/autovit', function(req, res){

    var showKeys = function (object){
        console.log('Keys are: ');
        Object.keys(object).forEach(function(it){
            console.log(' key: ' + it);
        });
    };

    var getValue = function($elem){
        return $elem.children[0].data.trim();
    };

    url = 'https://www.autovit.ro/autoturisme/?search%5Bfilter_enum_damaged%5D=0&search%5Bnew_used%5D=on';
    request(url, function(error, response, html){
        var $ = cheerio.load(html);

        var $title = $('.offer-title__link');
        var $subtitle = $('.offer-item__subtitle');
        var $price = $('.offer-price__number');
        var $priceCurrency = $('.offer-price__currency');

        for(var i = 0; i < 10; i++){
            console.log('Car ' + i);
            console.log('    title is: ' + getValue($title[i]));
            console.log('    subtitle is: ' + getValue($subtitle[i]));
            console.log('    price is: ' + getValue($price[i]) + ' ' + getValue($priceCurrency[i]));
        }

    res.send('Check your console');

    });
});

app.listen('8081');
console.log('Magic happens on port 8081');
exports = module.exports = app;

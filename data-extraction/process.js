// I AM NOT NODEJS
// I AM CASPER JS
// I RUN IN QTWEBKIT, NOT V8

var casperModule = require('casper').create();
var server = require('webserver').create();
var ipAndPort = '127.0.0.1:8585';

//server.listen(ipAndPort, function(request, response) {

	var data = []
	
	var getValue = function($elem){
        return $elem.getTitle();
    };

    url = 'https://www.autovit.ro/autoturisme/?search%5Bfilter_enum_damaged%5D=0&search%5Bnew_used%5D=on';
	
	var casper = casperModule.start();
	casper.userAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.106 Safari/537.36");
	
	casper
	  .then(function(){
		console.log("Start:");
	  })
	  .thenOpen(url)
	  .waitForSelector('a.offer-title__link', function(){
		// scrape something
		var $title = document.querySelectorAll('a.offer-title__link');
		var $subtitle = document.querySelectorAll('.offer-item__subtitle');
		var $price = document.querySelectorAll('.offer-price__number');
		var $priceCurrency = document.querySelectorAll('.offer-price__currency');

		console.log($title.length);
		/*var i = 0;
		$title.forEach(function(elem){
			data[i] = {};
			data[i].index = i + 1;
			data[i].title = getValue(elem);
		});
		*/
		/*$subtitle.map
		for(var i = 0; i < 10; i++){
			data.index = i + 1;
			data.title = getValue($title[i]);
			data.subtitle = getValue($subtitle[i]);
			data.price = getValue($price[i]);
			data.priceCurrency = getValue($priceCurrency[i]);
		}
		*/
		
	  });

    casper.run(function(){
        console.log('\n\nFinished: ' + JSON.stringify(data));
        //response.statusCode = 200;
        //var body = JSON.stringify(data)

        //response.write(body);
        //response.close();
    });
//});
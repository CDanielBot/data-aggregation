var express = require('express');
var fs      = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();




var ImobiliareProcessor = function(pageNumber) {
	
	const baseUrl = 'https://www.imobiliare.ro/vanzare-apartamente/timis?id=82493432&pagina=';
	let url = baseUrl + pageNumber;
	let $ = null;
	
	var getNumberOfPages = function(){
		return $('.butonpaginare').not('.inainte').last().text();
	};
	
	var getApartmentsForPage = function(){
			
		var apartments = [];
		
		var titles = $('.titlu-anunt.hidden-xs');
		var traits = $('.caracteristici'); 
		var prices = $('div.pret');
		var comissions = $('.comision');

		titles.each(function(i, elem){
			$title = $(this);
			apartment = {}
			apartment.title = $title.children().attr('title');
			apartment.href = $title.children().attr('href');
			apartment.longTitle = $title.children().children().text();
			apartments.push(apartment);
		});
		
		traits.each(function(i, elem){
			apartment = apartments[i];
			apartment.traits = [];
			
			traitsList = $(this).children();
			traitsList.each(function(j, elem){
				$trait = $(this);
				apartment.traits.push($trait.text());
			});
		});
		
		prices.each(function(i, elem){
			apartment = apartments[i];
			price = $(this);
			
			apartment.price = price.find('.pret-mare').text();
			apartment.priceCurrency = price.find('.tva-luna').text()
			
		});
		
		comissions.each(function(i, elem){
			comission = $(this);
			apartments[i].comission = comission.text();
		});
		
		return apartments;
	};
	
	this.extractApartments = function(){
		
		return new Promise(function(resolve,reject){
			request(url, function(error, response, html){
				if(error){
					reject(error);
				}else{
					$ = cheerio.load(html);
					//console.log('number of pages: ' + getNumberOfPages());
					let apartments = getApartmentsForPage();
					resolve(apartments);
				}
			});
		});
	};
};


app.get('/imobiliare', function(req, res){

	let processor = new ImobiliareProcessor(1);
	processor.extractApartments().then(function(apartments){
		console.log(JSON.stringify(apartments));
	});
	
    res.send('Check your console');
});


app.listen('8081');
console.log('Going to extract apartment from imobiliare.ro');
exports = module.exports = app;

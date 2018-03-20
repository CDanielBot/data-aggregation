var express = require('express');
var fs      = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var fs      = require('fs');

var ImobiliareProcessor = function() {
	
	const baseUrl = 'https://www.imobiliare.ro/vanzare-apartamente/timis?id=82493432&pagina=';
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
	
	var extractData = function(url, processHtmlFunc){
		return new Promise(function(resolve,reject){
			request(url, function(error, response, html){
				if(error){
					reject(error);
				}else{
					$ = cheerio.load(html);
					let data = processHtmlFunc();
					resolve(data);
				}
			});
		});
	};
	
	this.extractTotalNumberOfPages = function(){
		return extractData(baseUrl + '1', function(){
			return getNumberOfPages();
		});
	};
	
	this.extractApartmentsFromPage = function(pageNumber){
		return extractData(baseUrl + pageNumber, function(){
			return getApartmentsForPage();
		});
	};
};


app.get('/imobiliare', function(req, res){

	let processor = new ImobiliareProcessor();
	processor.extractTotalNumberOfPages().then(function(pagesNo){
		pagesNo = parseInt(pagesNo);
		console.log('Total number of pages: ' + pagesNo);
		var promises = [];
		var resolvedPromisesCount = 0;
		
		for(let i=1; i <= pagesNo; i++){
			let pageProcessor = new ImobiliareProcessor();
			var promise = pageProcessor.extractApartmentsFromPage(i);
			promise.then(function(apartments){
				resolvedPromisesCount++;
				console.log('Resolved: ' + resolvedPromisesCount + ' out of ' + pagesNo);
				return Promise.resolve(apartments);
				
			});
			promises.push(promise);
		}
		
		Promise.all(promises).then(function(results){
			allApartments = [].concat.apply([], results);
			console.log('Total number of extracted apartments: ' + allApartments.length);
			fs.writeFile('apartments_imobiliare.json', JSON.stringify(allApartments), function(err){
			  console.log('File successfully written! - Check your project directory for the apartments_imobiliare.json file');
			});
		});
	});
	
    res.send('Check your console');
});


app.listen('8081');
console.log('Going to extract apartment from imobiliare.ro');
exports = module.exports = app;

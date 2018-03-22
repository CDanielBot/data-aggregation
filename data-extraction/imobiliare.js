var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var fs      = require('fs');

'use strict';

const baseUrl = 'https://www.imobiliare.ro/vanzare-apartamente/timis?id=82493432&pagina=';

class ImobiliareProcessor {

    _extractData(url, processHtmlFunc) {
        return new Promise(function(resolve,reject){
            request(url, function(error, response, html){
                if(error){
                    reject(error);
                }else{
                    var $ = cheerio.load(html);
                    var data = processHtmlFunc($);
                    resolve(data);
                }
            });
        });
    }

    _getNumberOfPages($) {
        return $('.butonpaginare').not('.inainte').last().text();
    }

    _getApartmentsForPage($) {

        var apartments = [];

        var titles = $('.titlu-anunt.hidden-xs');
        var traits = $('.caracteristici');
        var prices = $('div.pret');
        var comissions = $('.comision');

        titles.each(function(){
            var $title = $(this);
            var apartment = {};
            apartment.title = $title.children().attr('title');
            apartment.href = $title.children().attr('href');
            apartment.longTitle = $title.children().children().text();
            apartments.push(apartment);
        });

        traits.each(function(i){
            var apartment = apartments[i];
            apartment.traits = [];
            var traitsList = $(this).children();
            traitsList.each(function(){
                var $trait = $(this);
                apartment.traits.push($trait.text());
            })
        });

        prices.each(function(i){
            var $price = $(this);
            var apartment = apartments[i];
            apartment.price = $price.find('.pret-mare').text();
            apartment.priceCurrency = $price.find('.tva-luna').text()
        });

        comissions.each(function(i){
            var $commission = $(this);
            apartments[i].comission = $commission.text();
        });

        return apartments;
    }

    extractTotalNumberOfPages() {
        return this._extractData(baseUrl + '1', ($) => {
        	return this._getNumberOfPages($)
		})
    }

    extractApartmentsFromPage(pageNumber) {
        return this._extractData(baseUrl + pageNumber, ($) => {
        	return this._getApartmentsForPage($)
        })
    }

}


app.get('/imobiliare', function(req, res){

	var processor = new ImobiliareProcessor();
	processor.extractTotalNumberOfPages().then(function(pagesNo){
		pagesNo = parseInt(pagesNo);
		console.log('Total number of pages: ' + pagesNo);
		var promises = [];
		var resolvedPromisesCount = 0;
		
		for(var i=1; i <= pagesNo; i++){
			var pageProcessor = new ImobiliareProcessor();
			var promise = pageProcessor.extractApartmentsFromPage(i);
			promise.then(function(apartments){
				resolvedPromisesCount++;
				console.log('Resolved: ' + resolvedPromisesCount + ' out of ' + pagesNo);
				return Promise.resolve(apartments);
			});
			promises.push(promise);
		}
		
		Promise.all(promises).then(function(results){
			var allApartments = [].concat.apply([], results);
			console.log('Total number of extracted apartments: ' + allApartments.length);
			fs.writeFile('apartments_imobiliare.json', JSON.stringify(allApartments), function(){
			  console.log('File successfully written! - Check your project directory for the apartments_imobiliare.json file')
			})
		})
	});
	
    res.send('Check your console');
});


app.listen('8081');
console.log('Going to extract apartment from imobiliare.ro');
exports = module.exports = app;

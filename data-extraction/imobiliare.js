var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var fs      = require('fs');
let q       = require('q');

'use strict';

const UrlConstants = Object.freeze({
    IMOBILIARE : 'https://www.imobiliare.ro/vanzare-apartamente/'
});

const Counties = Object.freeze({
    TIMIS: {name: 'timis', id: '82493432'},
    ARAD: {name: 'arad', id: 'todo'}
});

class ImobiliarePageProcessor {

    constructor(county, pageNumber){
        this.url = UrlConstants.IMOBILIARE + county.name + '?id=' + county.id + '&pagina=' + pageNumber;
    }


    _loadHtml() {
        var self = this;
        return new Promise(function(resolve,reject){
            request(self.url, function(error, response, html){
                if(error){
                    reject(error);
                }else{
                    var $ = cheerio.load(html);
                    resolve($);
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
        return this._loadHtml().then( ($) => {
            return this._getNumberOfPages($)
        })
    }

    extractApartmentsAsJson() {
        return this._loadHtml().then( ($) => {
            return this._getApartmentsForPage($)
        })
    }

}

class ImobiliareCountyProcessor {

    constructor(county){
        this.county = county;
    }

    _extractDataFromAllPages(pagesNo, self) {

        let _wrapPromiseWithStatus = function(promise) {
            promise.then(function(apartments){
                resolvedPromisesCount++;
                console.log('Resolved: ' + resolvedPromisesCount + ' out of ' + pagesNo);
                return Promise.resolve(apartments);
            });
        };

        let _extractDataPromises = function(pagesNo){
            var promises = [];

            for(var i=1; i <= pagesNo; i++) {
                var pageProcessor = new ImobiliarePageProcessor(self.county, i);
                var promise = pageProcessor.extractApartmentsAsJson();
                _wrapPromiseWithStatus(promise);
                promises.push(promise);
            }
            return promises;
        };

        let resolvedPromisesCount = 0;
        pagesNo = parseInt(pagesNo);
        console.log('Total number of pages: ' + pagesNo);

        let promises = _extractDataPromises(pagesNo);
        return Promise.all(promises).then(function(results){
            var allApartments = [].concat.apply([], results);
            console.log('Total number of extracted apartments: ' + allApartments.length);
            return Promise.resolve(allApartments);
        })
    }

    extractApartmentsGeneralData() {
        let deferred = q.defer();

        let processor = new ImobiliarePageProcessor(this.county, 1);
        processor.extractTotalNumberOfPages().then( (pageNo) => {
                return this._extractDataFromAllPages(pageNo, this)
            }).then(function(jsonData){
                q.resolve(jsonData)
            });
        return deferred.promise;
    }

}

app.get('/imobiliare', function(req, res){

    let countyProcessor = new ImobiliareCountyProcessor(Counties.TIMIS);
    countyProcessor.extractApartmentsGeneralData().then(function(apartmentsJson){
        fs.writeFile('apartments_imobiliare.json', JSON.stringify(apartmentsJson), function(){
            console.log('File successfully written! - Check your project directory for the apartments_imobiliare.json file')
        })
    });

    res.send('Check your console');
});


app.listen('8081');
console.log('Going to extract apartment from imobiliare.ro');
exports = module.exports = app;

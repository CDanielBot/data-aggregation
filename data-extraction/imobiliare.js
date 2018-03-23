let request = require('request');
let cheerio = require('cheerio');
let q       = require('q');

'use strict';

const UrlConstants = Object.freeze({
    IMOBILIARE : 'https://www.imobiliare.ro/vanzare-apartamente/'
});

const Counties = Object.freeze({
    TIMIS: {name: 'timis', id: '82493432'},
    ARAD: {name: 'arad', id: '82494820'}
});

class ImobiliarePageProcessor {

    constructor(county, pageNumber){
        this.url = UrlConstants.IMOBILIARE + county.name + '?id=' + county.id + '&pagina=' + pageNumber;
    }


    _loadHtml() {
        let self = this;
        return new Promise(function(resolve,reject){
            request(self.url, function(error, response, html){
                if(error){
                    reject(error);
                }else{
                    let $ = cheerio.load(html);
                    resolve($);
                }
            });
        });
    }

    _getNumberOfPages($) {
        return $('.butonpaginare').not('.inainte').last().text();
    }

    _getApartmentsForPage($) {

        let apartments = [];

        let titles = $('.titlu-anunt.hidden-xs');
        let traits = $('.caracteristici');
        let prices = $('div.pret');
        let comissions = $('.comision');

        titles.each(function(){
            let $title = $(this);
            let apartment = {};
            apartment.title = $title.children().attr('title');
            apartment.href = $title.children().attr('href');
            apartment.longTitle = $title.children().children().text();
            apartments.push(apartment);
        });

        traits.each(function(i){
            let apartment = apartments[i];
            apartment.traits = [];
            let traitsList = $(this).children();
            traitsList.each(function(){
                let $trait = $(this);
                apartment.traits.push($trait.text());
            })
        });

        prices.each(function(i){
            let $price = $(this);
            let apartment = apartments[i];
            apartment.price = $price.find('.pret-mare').text();
            apartment.priceCurrency = $price.find('.tva-luna').text()
        });

        comissions.each(function(i){
            let $commission = $(this);
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

    _extractDataFromAllPages(county, pagesNo) {

        let _wrapPromiseWithStatus = function(promise) {
            promise.then(function(apartments){
                resolvedPromisesCount++;
                console.log('Resolved: ' + resolvedPromisesCount + ' out of ' + pagesNo);
                return Promise.resolve(apartments);
            });
        };

        let _extractDataPromises = function(pagesNo){
            let promises = [];

            for(let i = 1; i <= pagesNo; i++) {
                let pageProcessor = new ImobiliarePageProcessor(county, i);
                let promise = pageProcessor.extractApartmentsAsJson();
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
            let allApartments = [].concat.apply([], results);
            return Promise.resolve(allApartments);
        })
    }

    extractApartmentsGeneralData() {
        let deferred = q.defer();

        let processor = new ImobiliarePageProcessor(this.county, 1);
        processor.extractTotalNumberOfPages().then( (pageNo) => {
                return this._extractDataFromAllPages(this.county, pageNo)
            }).then(function(jsonData){
                deferred.resolve(jsonData);
            });
        return deferred.promise;
    }

}

module.exports = {ImobiliareCountyProcessor, Counties}



let request = require('request');
let cheerio = require('cheerio');
let q = require('q');

let {Url} = require('./urls.js');
let {PageProcessor} = require('./processors.js');

'use strict';

const Counties = Object.freeze({
    TIMIS: {name: 'timis', id: '82493432'},
    ARAD: {name: 'arad', id: '82494820'}
});

class ImobiliarePageProcessor extends PageProcessor{

    constructor(county, pageNumber){
        super(county, pageNumber);
    }

    buildPageUrl(county, pageNumber){
        return Url.PUBLI24 + county.name + '/?pag=' + pageNumber;
    }

    getNumberOfPages($) {
        return $('.paginare').children().not('.arrow').last().text();
    }

    getApartmentsForPage($) {

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



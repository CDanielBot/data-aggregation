let {Url} = require('./urls.js');
let {PageProcessor, MultiplePagesProcessor} = require('./processors.js');

'use strict';


const Counties = Object.freeze({
    TIMIS: {name: 'timis', id: '82493432'},
    ARAD: {name: 'arad', id: '82494820'}
});


class ImobiliarePageProcessor{

    constructor(pageNumber, county) {
        this.url = this._buildPageUrl(pageNumber, county);
        this.pageProcessor = new PageProcessor(this.url);
    }

    _buildPageUrl(pageNumber, county) {
        return Url.IMOBILIARE + county.name + '?id=' + county.id + '&pagina=' + pageNumber;
    }

    parseHtml($) {

        let apartments = [];

        let titles = $('.titlu-anunt.hidden-xs');
        let traits = $('.caracteristici');
        let prices = $('div.pret');
        let comissions = $('.comision');

        titles.each(function () {
            let $title = $(this);
            let apartment = {};
            apartment.title = $title.children().attr('title');
            apartment.href = $title.children().attr('href');
            apartment.longTitle = $title.children().children().text();
            apartments.push(apartment);
        });

        traits.each(function (i) {
            let apartment = apartments[i];
            apartment.traits = [];
            let traitsList = $(this).children();
            traitsList.each(function () {
                let $trait = $(this);
                apartment.traits.push($trait.text());
            })
        });

        prices.each(function (i) {
            let $price = $(this);
            let apartment = apartments[i];
            apartment.price = $price.find('.pret-mare').text();
            apartment.priceCurrency = $price.find('.tva-luna').text()
        });

        comissions.each(function (i) {
            let $commission = $(this);
            apartments[i].comission = $commission.text();
        });

        return apartments;
    }

    async extractData(){
        return await this.pageProcessor.extractData(this.parseHtml);
    }

}

class ImobiliareCountyProcessor {

    constructor(county) {
        this.county = county;
        this.resolvedPromisesCount = 0;
    }

    _wrapPromiseWithStatus(promise, pagesNo) {
        promise.then((apartments) => {
            this.resolvedPromisesCount++;
            console.log('Resolved: ' + this.resolvedPromisesCount + ' out of ' + pagesNo);
            return Promise.resolve(apartments);
        });
    }

    async _extractDataFromAllPages(pagesNo) {
        console.log('Total number of pages: ' + pagesNo);
        let promises = [];
        for (let pageNo = 1; pageNo <= Math.min(pagesNo, 2); pageNo++) {
            const pageProcessor = new ImobiliarePageProcessor(pageNo, this.county);
            let promise = pageProcessor.extractData();
            this._wrapPromiseWithStatus(promise, pagesNo);
            promises.push(promise);
        }
        const results = await Promise.all(promises);
        let allApartments = [].concat.apply([], results);
        return allApartments;
    }


    async _getTotalPagesNumber() {
        const pageProcessor = new ImobiliarePageProcessor(1, this.county);
        const $ = await pageProcessor._loadHtml();
        return $('.butonpaginare').not('.inainte').last().text();
    }

    async extractData() {
        const pagesNo = await this._getTotalPagesNumber();
        return this._extractDataFromAllPages(pagesNo)
    }

}

class ImobiliareProcessor {

    extractData() {
        let processor = new ImobiliareCountyProcessor(Counties.ARAD);
        return processor.extractData();
    }
}

module.exports = {ImobiliareProcessor}



const phantom = require('phantom');

let {Url} = require('./urls.js');
let {DynamicPageProcessor, MultiplePagesProcessor} = require('./processors.js');

'use strict';

class Publi24PageProcessor extends DynamicPageProcessor {

    constructor(pageNumber) {
        super(pageNumber);
    }

    buildPageUrl(pageNumber) {
        return Url.PUBLI24 + '?pag=' + pageNumber;
    }

    getApartmentsForPage($) {

        let apartments = [];

        const cssAdClass = '.ad-result.new-ad';

        let titles = $(cssAdClass + ' a[itemprop="name"]');
        let description = $(cssAdClass + ' .new-ad-description');
        let prices = $(cssAdClass + ' .ad-price strong[itemprop="price"]');
        let location = $(cssAdClass + ' .article-location');

        titles.each(function () {
            const $title = $(this);
            const apartment = {};
            apartment.title = $title.text();
            apartment.href = $title.attr('href');
            apartments.push(apartment);
        });

        description.each(function (apartNo) {
            const $description = $(this);
            let apartment = apartments[apartNo];
            apartment.description = $description.text();
        });

        prices.each(function (apartNo) {
            const $price = $(this);
            let apartment = apartments[apartNo];
            const priceComponents = $price.text().split(' ');

            apartment.price = priceComponents[0];
            apartment.priceCurrency = priceComponents[1]
        });

        location.each(function (apartNo) {
            const $location = $(this);
            let apartment = apartments[apartNo];
            const locationComponents = $location.text().split(' ');

            apartment.county = locationComponents[0];
            apartment.city = locationComponents[1];
        });

        return apartments;
    }
}

class Publi24AllPagesProcessor extends MultiplePagesProcessor {

    constructor() {
        super();
    }

    getPageProcessor(pageNumber) {
        return new Publi24PageProcessor(pageNumber);
    }

    getTotalPagesNumber() {
        const firstPage = 1;
        return new Publi24PageProcessor(firstPage).loadHtml().then(function ($) {
            return $('.pagination').children().not('.arrow').last().text();
        });
    }

}

class Publi24Processor {

    extractData() {
        const processor = new Publi24AllPagesProcessor();
        return processor.extractApartmentsGeneralData();
    }

}

module.exports = {Publi24Processor}



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
            console.log('trying here: ' + $('.pagination').not('.arrow').length);
            return $('.pagination').not('.arrow').last().text();
        });
    }

}

class Publi24Processor {

    async loadContent() {
        const instance = await phantom.create();
        const page = await instance.createPage();
        await page.on("onResourceRequested", function (requestData) {
            console.info('Requesting', requestData.url)
        });

        const status = await page.open('https://stackoverflow.com/');
        console.log(status);

        const content = await page.property('content');

        await instance.exit();

        return Promise.resolve(content);
    }

    getData() {
        // this.loadContent().then(function(htmlContent){
        //    console.log(htmlContent);
        // });

        const processor = new Publi24AllPagesProcessor();
        return processor.extractApartmentsGeneralData();
    }

}

module.exports = {Publi24Processor}



const phantom = require('phantom');

let {Url} = require('./urls.js');
let {DynamicPageProcessor, MultiplePagesProcessor} = require('./processors.js');

'use strict';


class Publi24PageProcessor{

    constructor(pageNumber, phantomInstance) {
        this.url = this._buildPageUrl(pageNumber);
        this.pageProcessor = new DynamicPageProcessor(this.url, phantomInstance);
    }

    async loadHtml() {
        return this.pageProcessor._loadHtml();
    }

    parseHtml($) {

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

    async extractData(){
        return await this.pageProcessor.extractData(this.parseHtml);
    }
}

class Publi24AllPagesProcessor {

    constructor(){
    }

    _buildPageUrl(pageNumber) {
        return Url.PUBLI24 + '?pag=' + pageNumber;
    }

    async _getTotalPagesNumber(phantomInstance) {
        const pageProcessor = new Publi24PageProcessor(1, phantomInstance);
        const $ = await pageProcessor.loadHtml();
        return $('.pagination').children().not('.arrow').last().text();
    }

    async extractData() {
        const phantomPool = new PhantomInstancesPool();
        await phantomPool.init();

        const phantomInstance = phantomPool.getPhantomInstance(1);
        const pagesNo = await this._getTotalPagesNumber(phantomInstance);

        console.log('Total number of pages: ' + pagesNo);
        const queue = new Queue();
        for (let pageNo = 1; pageNo <= pagesNo; pageNo++) {
            queue.enqueue(this._buildPageUrl(pageNo));
        }

        for(let i = 1; i <= phantomPool.size(); i++) {
            const phantomInstance = phantomPool.getPhantomInstance(i);
            phantomInstance.startCrawling(queue);
        }
    }

}

class Publi24Processor {

    extractData() {
        const processor = new Publi24AllPagesProcessor();
        return processor.extractData();
    }

}




module.exports = {Publi24Processor}



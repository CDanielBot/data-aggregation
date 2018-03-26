const q = require('q');
const request = require('request');
const cheerio = require('cheerio');
const phantom = require('phantom');

class PageProcessor {

    constructor(pageNumber, county){
        this.pageNumber = pageNumber;
        this.county = county;
    }

    buildPageUrl(){
        throw new Error('You have to implement the method buildPageUrl in child class!');
    }


    getApartmentsForPage($){
        throw new Error('You have to implement the method getApartmentsForPage in child class!');
    }

    loadHtml() {
        let deferred = q.defer();
        const url = this.buildPageUrl();
        request(url, function(error, response, html){
            if(error){
                deferred.reject(error);
            }else{
                let $ = cheerio.load(html);
                deferred.resolve($);
            }
        });
        return deferred.promise;
    }

    extractApartmentsAsJson() {
        return this.loadHtml().then( ($) => {
            return this.getApartmentsForPage($)
        })
    }
}

class DynamicPageProcessor extends PageProcessor{

    constructor(pageNumber){
        super(pageNumber);
    }

    async loadDynamicContent() {

        const instance = await phantom.create();
        const page = await instance.createPage();
        const url = this.buildPageUrl();
        const status = await page.open(url);
        const content = await page.property('content');
        await instance.exit();

        return Promise.resolve(content);
    }

    loadHtml() {
        return this.loadDynamicContent().then(function(htmlContent){
            let $ = cheerio.load(htmlContent);
            return Promise.resolve($);
        });
    }

}


class MultiplePagesProcessor{

    constructor(){
        this.resolvedPromisesCount = 0;
        this.pagesNo = 0;
    }

    getPageProcessor() {
        throw new Error('You have to implement the method getPageProcessor in child class!');
    }

    getTotalPagesNumber() {
        throw new Error('You have to implement the method getTotalPagesNumber in child class!');
    }

    _wrapPromiseWithStatus(promise) {
        promise.then( (apartments) => {
            this.resolvedPromisesCount++;
            console.log('Resolved: ' + this.resolvedPromisesCount + ' out of ' + this.pagesNo);
            return Promise.resolve(apartments);
        });
    }

    _extractDataPromises() {

        let promises = [];

        for(let pageNo = 1; pageNo <= Math.min(this.pagesNo, 50); pageNo++) {
            let pageProcessor = this.getPageProcessor(pageNo);
            //new ImobiliarePageProcessor(county, pageNo);
            let promise = pageProcessor.extractApartmentsAsJson();
            this._wrapPromiseWithStatus(promise);
            promises.push(promise);
        }

        return promises;
    }

    _extractDataFromAllPages() {
        console.log('Total number of pages: ' + this.pagesNo);
        let promises = this._extractDataPromises();
        return Promise.all(promises).then(function(results){
            let allApartments = [].concat.apply([], results);
            return Promise.resolve(allApartments);
        })
    }

    extractApartmentsGeneralData() {
        let deferred = q.defer();

        this.getTotalPagesNumber().then( (pagesNo) => {
            this.pagesNo = pagesNo;
            return this._extractDataFromAllPages()
        }).then(function(jsonData){
            deferred.resolve(jsonData);
        });
        return deferred.promise;
    }

}

module.exports = {PageProcessor, DynamicPageProcessor, MultiplePagesProcessor}



let q = require('q');

class PageProcessor {

    constructor(county, pageNumber){
        this.county = county;
        this.pageNumber = pageNumber;
    }

    buildPageUrl(county, pageNumber){
        throw new Error('You have to implement the method buildPageUrl in child class!');
    }

    getNumberOfPages($){
        throw new Error('You have to implement the method getNumberOfPages in child class!');
    }

    getApartmentsForPage($){
        throw new Error('You have to implement the method getApartmentsForPage in child class!');
    }

    loadHtml() {
        let deferred = q.defer();
        const url = this.buildPageUrl(this.county, this.pageNumber);
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

    extractTotalNumberOfPages() {
        return this.loadHtml().then( ($) => {
            return this.getNumberOfPages($)
        })
    }

    extractApartmentsAsJson() {
        return this.loadHtml().then( ($) => {
            return this.getApartmentsForPage($)
        })
    }
}

module.exports = {PageProcessor}



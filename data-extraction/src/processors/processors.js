const q = require('q');
const request = require('request');
const cheerio = require('cheerio');

class AbstractPageProcessor {

    constructor(url) {
        this.url = url;
    }

    async _loadHtml() {
        throw new Error('Implement _loadHtml in children class');
    }

    async extractData(parseHtmlCallback) {
        const $ = this._loadHtml();
        return parseHtmlCallback($);
    }

}
class StaticPageProcessor extends AbstractPageProcessor{

    constructor(url) {
        super(url);
    }

    async _loadHtml() {
        let deferred = q.defer();
        request(this.url, function (error, response, html) {
            if (error) {
                deferred.reject(error);
            } else {
                let $ = cheerio.load(html);
                deferred.resolve($);
            }
        });
        return deferred.promise;
    }

}

class DynamicPageProcessor extends AbstractPageProcessor{

    constructor(url, phantomInstance) {
        super(url);
        this.phantomInstance = phantomInstance;
    }

    async _loadHtml() {
        const html = await this.phantomInstance.openPage(this.url);
        return cheerio.load(html);
    }

}



module.exports = {PageProcessor: StaticPageProcessor, DynamicPageProcessor}



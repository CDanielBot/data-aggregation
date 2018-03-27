let {Url} = require('./urls.js');
let {PageProcessor, MultiplePagesProcessor} = require('./processors.js');

'use strict';


const Counties = Object.freeze({
    TIMIS: {name: 'timis', id: '82493432'},
    ARAD: {name: 'arad', id: '82494820'}
});


class ImobiliarePageProcessor extends PageProcessor {

    constructor(pageNumber, county) {
        super(pageNumber, county);
    }

    buildPageUrl() {
        return Url.IMOBILIARE + this.county.name + '?id=' + this.county.id + '&pagina=' + this.pageNumber;
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

class ImobiliareCountyProcessor extends MultiplePagesProcessor {

    constructor(county) {
        super();
        this.county = county;
    }

    getPageProcessor(pageNumber) {
        return new ImobiliarePageProcessor(pageNumber, this.county);
    }

    getTotalPagesNumber() {
        const firstPage = 1;
        return new ImobiliarePageProcessor(firstPage, this.county).loadHtml().then(function ($) {
            return $('.butonpaginare').not('.inainte').last().text();
        });
    }

}

class ImobiliareProcessor {

    extractData() {
        let processor = new ImobiliareCountyProcessor(Counties.ARAD);
        return processor.extractApartmentsGeneralData();
    }
}

module.exports = {ImobiliareProcessor}



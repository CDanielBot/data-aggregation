let {Url} = require('./urls.js');
let {PageProcessor, MultiplePagesProcessor} = require('./processors.js');

'use strict';

class Publi24PageProcessor extends PageProcessor{

    constructor(pageNumber){
        super(pageNumber);
    }

    buildPageUrl(pageNumber){
        return Url.PUBLI24 + '?pag=' + pageNumber;
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

class Publi24Processor extends MultiplePagesProcessor {

    constructor(){
        super();
    }

    getPageProcessor(pageNumber) {
        return new Publi24PageProcessor(pageNumber);
    }

    getTotalPagesNumber() {
        const firstPage = 1;
        return new Publi24PageProcessor(firstPage).loadHtml().then(function($) {
            console.log('trying here: ' + $('.pagination').not('.arrow').length);
            return $('.pagination').not('.arrow').last().text();
        });
    }

}

module.exports = {Publi24Processor}



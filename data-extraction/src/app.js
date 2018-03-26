let express = require('express');
let fs = require('fs');
let {ImobiliareProcessor} = require('./processors/imobiliare.js');
let {Publi24Processor} = require('./processors/publi24.js');

let app = express();
app.listen('8081');

app.get('/imobiliare', function(req, res){

    let imobiliareProcessor = new ImobiliareProcessor();
    imobiliareProcessor.extractApartmentsGeneralData().then(function(apartmentsJson){
        fs.writeFile('src/json/apartments_imobiliare.json', JSON.stringify(apartmentsJson), function(){
            console.log('File successfully written! - Check your project directory for the apartments_imobiliare.json file')
        })
    });
    res.send('Check your console');
});

app.get('/publi24', function(req, res){

    let publi24Processor = new Publi24Processor();
    publi24Processor.extractApartmentsGeneralData().then(function(apartmentsJson){
        fs.writeFile('src/json/apartments_publi24.json', JSON.stringify(apartmentsJson), function(){
            console.log('File successfully written! - Check your project directory for the apartments_publi24.json file')
        })
    });
    res.send('Check your console');
});

exports = module.exports = app;
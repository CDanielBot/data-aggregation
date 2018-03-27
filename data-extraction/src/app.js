"use strict";

let express = require('express');
let fs = require('fs');
let {ImobiliareProcessor} = require('./processors/imobiliare.js');
let {Publi24Processor} = require('./processors/publi24.js');

let app = express();
app.listen('8081');

let writeFile = function (fileName, jsonData){
    const filePath = 'src/json/' + fileName;
    fs.writeFile(filePath, JSON.stringify(jsonData), function () {
        console.log('File successfully written! - Check your project directory for ' + filePath)
    })
};

let processImobiliare = function () {
    const imobiliareProcessor = new ImobiliareProcessor();
    imobiliareProcessor.extractData().then(function (apartmentsJson) {
        writeFile('apartments_imobiliare.json', apartmentsJson);
    });
};

let processPubli24 = function () {
    let publi24Processor = new Publi24Processor();
    publi24Processor.extractData().then(function (apartmentsJson) {
        console.log(apartmentsJson.length);
        writeFile('apartments_publi24.json', apartmentsJson);
    });
};

app.get('/imobiliare', function (req, res) {

    processImobiliare();
    res.send('Check your console');
});

app.get('/publi24', function (req, res) {

    processPubli24();
    res.send('Check your console');
});

processPubli24();

exports = module.exports = app;
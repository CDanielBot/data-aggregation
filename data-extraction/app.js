let express = require('express');
let fs = require('fs');
let {ImobiliareCountyProcessor, Counties} = require('./imobiliare.js');

let app = express();
app.listen('8081');

app.get('/imobiliare', function(req, res){

    // let countyProcessor = new ImobiliareCountyProcessor(Counties.TIMIS);
    let aradCountyProcessor = new ImobiliareCountyProcessor(Counties.ARAD);
    aradCountyProcessor.extractApartmentsGeneralData().then(function(apartmentsJson){
        fs.writeFile('apartments_imobiliare.json', JSON.stringify(apartmentsJson), function(){
            console.log('File successfully written! - Check your project directory for the apartments_imobiliare.json file')
        })
    });

    res.send('Check your console');
});

exports = module.exports = app;
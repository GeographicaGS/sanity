var config = require('./config.js');

// Load Chance
var Chance = require('chance');

// Instantiate Chance so it can be used
var chance = new Chance();

var json2csv = require('json2csv');

var data = [];

var year = 2014;

function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

var pg = require('pg');
pg.defaults.poolIdleTimeout = 300*1000;
var conString = "postgres://postgres:@192.168.59.103/datasets";

var total_towns = 0;
var total_towns_completed = 0;

//var totaltest = 0;

function createDataForCities(client,done,cod_prov,cod_mun,factor){
    // 5% of population

    var nPoints;

    if (year == 2014){
        // area
        //nPoints = Math.ceil(factor*0.0000002);
        nPoints = Math.ceil(factor*0.001*0.65);
        var andalucia = ['29','11','04','21','18','41','23','14'];
        var barcelona = ['25','08','43'];
        var galicia = ['32','36','27','15'];
        var madrid = ['28']
        if (andalucia.indexOf(cod_prov)!=-1 || barcelona.indexOf(cod_prov)!=-1
             ||  galicia.indexOf(cod_prov)!=-1 || madrid.indexOf(cod_prov)!=-1){
            nPoints = Math.ceil(nPoints / randomIntFromInterval(3,4));
        }
        

    }
    else{
        // pop
        nPoints = Math.ceil(factor*0.001);
    }



    // totaltest += nPoints;
    // console.log(totaltest);

    var query = 'WITH points AS (' +
        '   SELECT RandomPointsInPolygon(' +
        '       (SELECT the_geom FROM spain_cities_population WHERE cod_prov=$1 and cod_mun=$2)' +
        '   ,$3) as the_geom)' +
        ' SELECT st_x(the_geom) as lng, st_y(the_geom) as lat FROM points';

    client.query(query,[cod_prov,cod_mun,nPoints], 
        function(err, result) {
        //call `done()` to release the client back to the pool
        done();

        if(err) {
          return console.error('error running query:\n' + query, err);
        }

        for (var i=0;i<result.rows.length;i++){
            data.push({
                date_disease : chance.date({year: year}),
                name : chance.name(),
                latitude : result.rows[i].lat,
                longitude : result.rows[i].lng,
                email : chance.email(),
                age : randomIntFromInterval(1,40),
                prov : cod_prov,
            });
        }

        total_towns_completed++;

        console.log(total_towns - total_towns_completed);

        if (total_towns == total_towns_completed){
            generateCSV();
        }
        
    });
}

function generateCSV(){

    console.log('Total records: ' + data.length);
    var fields = ['date_disease', 'name', 'latitude','longitude','email','age','prov'];
     
    json2csv({ data: data, fields: fields,del: ';' }, function(err, csv) {
        if (err) console.log(err);
        var fs = require('fs');
        fs.writeFile('pox_' + year +'.csv',csv, function(err) {
            if(err) {
                return console.log(err);
            }
            console.log('The file pox_' + year + '.csv was saved!');
        }); 
    });

}

//this starts initializes a connection pool
//it will keep idle connections open for a (configurable) 30 seconds
//and set a limit of 20 (also configurable)
pg.connect(conString, function(err, client, done) {
    if(err) {
        return console.error('error fetching client from pool', err);
    }

    client.query('SELECT cod_prov,cod_mun,pop_total_2013,st_area(st_transform(the_geom,23030)) as area FROM spain_cities_population ORDER by name', function(err, result) {
        //call `done()` to release the client back to the pool
        done();

        if(err) {
          return console.error('error running query', err);
        }

        total_towns = result.rows.length;
        for (var i=0;i<result.rows.length;i++){
            var factor;
            if (year==2014){
                factor = result.rows[i].area;
            }
            else{
                factor = result.rows[i].pop_total_2013
            }
            createDataForCities(client,done,result.rows[i].cod_prov,result.rows[i].cod_mun,result.rows[i].pop_total_2013);
        }
    });
});




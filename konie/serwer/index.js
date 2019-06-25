/*jshint node: true, esversion: 6 */
'use strict';
const loki = require('lokijs');
const app = require('express')();
const port = process.env.PORT || 4000;
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
var server = require('http').Server(app);
var io = require('socket.io')(server);

app.use(bodyParser.json());
app.use(cors());

let baza = new loki('konie.db',{
    autoload:true,
    autosave:true,
    autosaveIntervall: 3000,
    autoloadCallback: loadBaza
});

function fill() {
    let sedziowie = baza.getCollection('sedziowie');
    let konie = baza.getCollection('konie');
    let klasy = baza.getCollection('klasy');

    axios.get('http://localhost:3000/sedziowie')
    .then(resp => {
        let data = resp.data;
        data.forEach(element =>{
            delete element.id;
            sedziowie.insert(element);
        })
    })
    .catch(err=>console.log(`Błąd: ${err}`))


    axios.get('http://localhost:3000/konie')
    .then(resp => {
        let data = resp.data;
        data.forEach(element =>{
            delete element.id;
            konie.insert(element);
        })
    })
    .catch(err=>console.log(`Błąd: ${err}`))

    axios.get('http://localhost:3000/klasy')
    .then(resp => {
        let data = resp.data;
        data.forEach(element =>{
            delete element.id;
            klasy.insert(element);
        })
    })
    .catch(err=>console.log(`Błąd: ${err}`))
    console.log("DATABASE READY");
}

function loadBaza() {

    if (baza.getCollection("users"))
        baza.removeCollection("users");
    baza.addCollection("users");

    if (baza.getCollection("konie"))
        baza.removeCollection("konie");
    baza.addCollection("konie");

    if (baza.getCollection("sedziowie"))
        baza.removeCollection("sedziowie");
    baza.addCollection("sedziowie");

    if (baza.getCollection("klasy"))
        baza.removeCollection("klasy");
    baza.addCollection("klasy");

    //if (!baza.getCollection("users"))
    //    baza.addCollection("users");
    //else baza.removeCollection("users")

    //if(!baza.getCollection("konie"))
    //    baza.addCollection("konie")

    //if(!baza.getCollection("sedziowie"))
    //    baza.addCollection("sedziowie")
    
    //if (!baza.getCollection("klasy")) {
    //    baza.addCollection("klasy")
    //}
    fill();
}

io.on('connection', function (socket) {
    socket.emit('hello', {
        hello: 'world'
    });
    socket.on('request', function (data) {
        socket.emit('hello', {
            hello: data
        });;
    });
});


app.get('/sedziowie', (_req, res) => {
    let sedziowie = baza.getCollection('sedziowie');

    let lista_sedziow = sedziowie.find();
    res.json(
        lista_sedziow
    );

    res.status(200);
    res.end();
});

app.get('/konie', (_req, res) => {
    let konie = baza.getCollection('konie');

    let lista_koni = konie.find();
    res.json(
        lista_koni
    );

    res.status(200);
    res.end();
});

app.get('/klasy', (_req, res) => {
    let klasy = baza.getCollection('klasy');

    let lista_klas = klasy.find();
    res.json(
        lista_klas
    );

    res.status(200);
    res.end();
});

app.get('/sedziowie/:id', (req, res) => {
    let sedziowie = baza.getCollection('sedziowie');

    let sedzia = sedziowie.findOne({
        "$loki": req.params.id * 1
    });

    res.json(
        sedzia
    );
    
    res.status(200);
    res.end();

});

app.get('/konie/:id', (req, res) => {
    let konie = baza.getCollection('konie');

    let kon = konie.findOne({
        "$loki": req.params.id * 1
    });

    res.json(
        kon
    );

    res.status(200);
    res.end();

});

app.get('/klasy/:id', (req, res) => {
    let klasy = baza.getCollection('klasy');

    let klasa = klasy.findOne({
        "$loki": req.params.id * 1
    });

    res.json(
        klasa
    );

    res.status(200);
    res.end();

});

app.delete('/sedziowie/:id', (req, res) => {
    let sedziowie = baza.getCollection('sedziowie');
    let klasy = baza.getCollection('klasy').find({});
    let nieKomisja = true;

    //nie mozna usunac sedziego z komisji
    klasy.forEach(klasa => {
        klasa.komisja.forEach(sedzia => {
            if (sedzia == req.params.id) {
                nieKomisja = false;
            }
        })
    })
    if (nieKomisja) {
        let sedzia = sedziowie.findOne({
            "$loki": req.params.id * 1
        });

        sedziowie.remove(sedzia);

        res.send("Deleted");
    } else {
        res.send("nie mozna usunac sedziego z komisji");
    }
});

app.delete('/konie/:id', (req, res) => {
    let konie = baza.getCollection('konie');

    
        let kon = konie.findOne({
            "$loki": req.params.id * 1
        });

        konie.remove(kon);

        res.send("Deleted");
});

app.delete('/klasy/:id', (req, res) => {
    let konie = baza.getCollection('konie').find({});
    let klasy = baza.getCollection('klasy');
    let klasa = klasy.findOne({
        "$loki": req.params.id * 1
    });
    let pusta= true;
    konie.forEach(kon => {
        if (kon.klasa == klasa.numer) {
            pusta = false;
        }
    });

    if (pusta) {
        klasy.remove(klasa);

        res.send("Deleted");
    } else {
        res.send("Klasa nie jest pusta");
    }
});

app.post('/sedziowie', (req, res) => {
    let sedziowie = baza.getCollection('sedziowie');
    let sedzia = {};


    sedziowie.insert(req.body);
    // io.emit("hello", sedzia);
    res.send("ok");
});

app.post('/konie', (req, res) => {
    let konie = baza.getCollection('konie');
    konie.insert(req.body);
    res.send("posted");
});

app.post('/klasy', (req, res) => {
    let klasy = baza.getCollection('klasy').find({});
    let collection = baza.getCollection('klasy');
    let pusta = true;

    //nie ma klas o tych samych numerach
    klasy.forEach(klasa => {
        if (klasa.numer == req.body.numer) {
            pusta = false;
        }
    });

    if (pusta) {
        collection.insert(req.body);
        res.send("posted");
    } else {
        res.send("Juz istnieje klasa o takim numerze");
    }
});

app.put('/sedziowie', (req, res) => {
    let sedziowie = baza.getCollection('sedziowie');
    sedziowie.update(req.body);
    res.send("updated");
});

app.put('/konie', (req, res) => {
    let konie = baza.getCollection('konie');
    konie.update(req.body);
    res.send("updated");
});

app.put('/klasy', (req, res) => {
    let klasy = baza.getCollection('klasy');
    klasy.update(req.body);
    res.send("updated");
});

app.listen(port, () => {
    console.log(`Serwer działa na porcie ${port}.`);
});
server.listen(4001);
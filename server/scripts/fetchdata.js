/*eslint no-console:0 */
const commandLineArgs = require('command-line-args');
const monk = require('monk');
const path = require('path');

const CardImport = require('./fetchdata/CardImport.js');
const DtDbImageSource = require('./fetchdata/DtDbImageSource.js');
const PTDbImageSource = require('./fetchdata/PTDbImageSource.js');
const JsonCardSource = require('./fetchdata/JsonCardSource.js');
const NoImageSource = require('./fetchdata/NoImageSource.js');
const CardService = require('../services/CardService.js');

const optionsDefinition = [
    { name: 'card-source', type: String, defaultValue: 'json' },
    { name: 'card-dir', type: String, defaultValue: path.join(__dirname, '..', '..', 'townsquare-json-data') },
    { name: 'image-source', type: String, defaultValue: 'dtdb' },
    { name: 'image-dir', type: String, defaultValue: path.join(__dirname, '..', '..', 'public', 'img', 'cards') },
    { name: 'no-images', type: Boolean, defaultValue: false },
    { name: 'only-images', type: Boolean, defaultValue: false },
    { name: 'is-pt', type: Boolean, defaultValue: false },
    { name: 'replace-cards', type: Boolean, defaultValue: true },
    { name: 'replace-packs', type: Boolean, defaultValue: true },
    { name: 'only-pack', type: String, defaultValue: null },
    { name: 'except-pack', type: String, defaultValue: null },
    { name: 'username', type: String, defaultValue: null },
    { name: 'password', type: String, defaultValue: null },
];

function createDataSource(options) {
    switch(options['card-source']) {
        case 'json':
            return new JsonCardSource(options['card-dir']);
    }

    throw new Error(`Unknown card source '${options['card-source']}'`);
}

function createImageSource(options) {
    if(options['no-images']) {
        return new NoImageSource();
    }

    switch(options['image-source']) {
        case 'none':
            return new NoImageSource();
        case 'dtdb':
            return new DtDbImageSource(options);
        case 'ptdb':
            return new PTDbImageSource(options);
    }

    throw new Error(`Unknown image source '${options['image-source']}'`);
}

let options = commandLineArgs(optionsDefinition);

if (options['image-source'] === 'ptdb' && (!options.username || !options.password)) {
	console.error('User and password required for ptdb environment');
	process.exit(1);
}

if (options['only-pack'] && options['except-pack']) {
    console.error('Cannot specify both only-pack and except-pack');
    process.exit(1);
}

let db = monk('mongodb://127.0.0.1:27017/townsquare');
let dataSource = createDataSource(options);
let imageSource = createImageSource(options);
let cardService = new CardService(db);
let cardImport = new CardImport(db, dataSource, imageSource, cardService, options);

cardImport.import();


/*eslint no-console:0 */
const fs = require('fs');
const jimp = require('jimp');
const request = require('request');

class PTDbImageSource {
  constructor(options) {
    this.onlyPack = options['only-pack'];
    this.exceptPack = options['except-pack'];
    this.username = options.username;
    this.password = options.password;

    this.packs = this.loadPacks(this.onlyPack, this.exceptPack);
  }

  loadPacks(onlyPack, exceptPack) {
    let files = fs.readdirSync('townsquare-json-data/packs');
    
    if (onlyPack) {
      return files.find(file => file === onlyPack + '.json');
    }

    if (exceptPack) {
      files = files.filter(file => file !== exceptPack + '.json');      
      return files.map(file => JSON.parse(fs.readFileSync('townsquare-json-data/packs/' + file)));
    }

    return null;
  }

  fetchImage(card, imagePath) {
    if(!card.imagesrc) {
        console.log(`Could not fetch image for ${card.title} as there is no image source "imagesrc"`);
        return;
    }

    let imagesrc = card.imagesrc;
    let url = `http://${this.username}:${this.password}@192.241.162.104/${imagesrc}`;

    request({ url: url, encoding: null }, function(err, response, body) {
        if(err || response.statusCode !== 200) {
            console.log(`Unable to fetch image for ${card.code} from ${url}`);
            return;
        }

        console.log('Downloading image for ' + card.code);
        jimp.read(body).then(lenna => {
            lenna.write(imagePath);
        }).catch(err => {
            console.log(`Error converting image for ${card.code}: ${err}`);
        });
    });
  }
}

module.exports = PTDbImageSource;
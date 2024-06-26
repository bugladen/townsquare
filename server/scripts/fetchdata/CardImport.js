/*eslint no-console:0 */

const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');

class CardImport {
    constructor(db, dataSource, imageSource, cardService, options) {
        this.db = db;
        this.dataSource = dataSource;
        this.imageSource = imageSource;
        this.cardService = cardService;
        this.imageDir = options['image-dir'];
        this.isPt = options['is-pt'];
        this.replaceCards = options['replace-cards'];
        this.replacePacks = options['replace-packs'];
        this.onlyPack = options['only-pack'];
        this.exceptPack = options['except-pack'];        
        this.onlyImages = options['only-images'];
    }

    async import() {
        try {
            await Promise.all([this.importCards(), this.importPacks()]);
        } catch(e) {
            console.log('Unable to fetch data', e);
        } finally {
            this.db.close();
        }
    }

    async importCards() {
        let cards;
        if(this.isPt) {
            cards = await this.dataSource.getPtCards();
        } else {
            cards = await this.dataSource.getCards();
        }

        console.info(cards.length + ' cards fetched');

        if (!this.onlyImages) {
            if (this.replaceCards) {
                await this.cardService.replaceCards(cards);
            } else {
                await this.cardService.addCards(cards);
            }
        }

        if (!this.noImages) {
            await this.fetchImages(cards);
        }
    }

    fetchImages(cards) {
        mkdirp(this.imageDir);

        let i = 0;

        for(let card of cards) {
            let imagePath = path.join(this.imageDir, card.code + '.jpg');

            if(!fs.existsSync(imagePath)) {
                setTimeout(() => {
                    this.imageSource.fetchImage(card, imagePath);
                }, i++ * 200);
            }
        }

        console.log('Done downloading');
    }

    async importPacks() {
        let packs;
        if(this.isPt) {
            packs = await this.dataSource.getPtPacks();
        } else {
            packs = await this.dataSource.getPacks();
        }        

        if (this.replacePacks) {
            await this.cardService.replacePacks(packs);
        } else {
            await this.cardService.addPacks(packs);
        }

        console.info(packs.length + ' packs fetched');
    }
}

module.exports = CardImport;

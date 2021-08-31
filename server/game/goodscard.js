const HeartsCard = require('./heartscard.js');

class GoodsCard extends HeartsCard {
    canAttach(player, card, playingType) {
        if(!super.canAttach(player, card)) {
            return false;
        }

        if(this.isGadget() && playingType === 'shoppin' && 
            (!card.hasKeyword('mad scientist') || card.cannotInventGadgets())) {
            return false;
        }

        if(card.getType() === 'deed' || card.getType() === 'outfit') {
            if(!this.hasKeyword('improvement')) {
                return false;
            }
        }        

        return true;
    }
}

module.exports = GoodsCard;

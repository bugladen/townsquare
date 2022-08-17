const GoodsCard = require('../../goodscard.js');

class DisgenuineCurrencyPress2 extends GoodsCard {
    setupCardAbilities() {
        this.traitReaction({
            when: {
                onGadgetInvented: event => event.gadget === this
            },
            message: context => this.game.addMessage('{0} gains 4 GR thanks to inventing the {1}', context.player, this),
            handler: context => {
                context.player.modifyGhostRock(4);
            }
        });
        this.traitReaction({
            when: {
                onCardDiscarded: event => event.card === this && event.originalLocation === 'play area'
            },
            message: context => this.game.addMessage('{0} draws a card thanks to the {1}', context.player, this),
            handler: context => {
                context.player.drawCardsToHand(1, context);
            }
        });
    }
}

DisgenuineCurrencyPress2.code = '25219';

module.exports = DisgenuineCurrencyPress2;
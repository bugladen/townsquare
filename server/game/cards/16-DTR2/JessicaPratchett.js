const DudeCard = require('../../dudecard.js');
const GameActions = require('../../GameActions/index.js');

class JessicaPratchett extends DudeCard {
    setupCardAbilities(ability) {
        this.persistentEffect({
            location: 'any',
            targetController: 'current',
            condition: () => this.controller.outfit.gang_code === 'outlaws', 
            effect: ability.effects.reduceSelfCost('any', () => this.getNumOfWantedDudes())
        });

        this.job({
            title: 'Jessica Pratchett',
            playType: 'noon',
            cost: ability.costs.bootSelf(),
            target: {
                activePromptTitle: 'Mark a dude',
                cardCondition: { 
                    location: 'play area', 
                    controller: 'opponent', 
                    condition: card => this.isDudeWithHighestBullets(card) 
                },
                cardType: ['dude']
            },
            message: context => this.game.addMessage('{0} plays {1} on {2}', context.player, this, context.target),
            onSuccess: (job, context) => {
                if(job.mark.location === 'play area') {
                    this.game.resolveGameAction(GameActions.aceCard({ card: job.mark }), context).thenExecute(() => {
                        this.game.addMessage('{0} uses {1} to ace {2}', context.player, this, context.target);
                    });
                }
            }
        });
    }

    getNumOfWantedDudes() {
        return this.controller.cardsInPlay.reduce((num, card) => {
            if(card.getType() === 'dude' && card.isWanted()) {
                return num + 1;
            }
            return num;
        }, 0);
    }

    isDudeWithHighestBullets(dude) {
        const oppCards = this.controller.getOpponent().cardsInPlay;
        let highestBullets = 0;
        const highestBulletsDudes = oppCards.reduce((result, card) => {
            if(card.getType() === 'dude') {
                if(card.bullets > highestBullets) {
                    highestBullets = card.bullets;
                    result = [card];
                } else if(card.bullets === highestBullets) {
                    result.push(card);
                }
            }
            return result;
        }, []);
        return highestBulletsDudes.includes(dude);
    }
}

JessicaPratchett.code = '25077';

module.exports = JessicaPratchett;

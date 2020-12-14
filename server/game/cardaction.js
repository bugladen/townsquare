const AbilityContext = require('./AbilityContext.js');
const BaseAbility = require('./baseability.js');
const { ShootoutSteps } = require('./Constants/index.js');
const Costs = require('./costs.js');
const EventRegistrar = require('./eventregistrar.js');

const ActionPlayTypes = ['any', 'noon', 'shootout', 'shootout:join', 'resolution', 'cheatin resolution'];
const AllowedTypesForPhase = {
    'high noon': ['noon'],
    'shootout plays': ['shootout', 'shootout:join'],
    'shootout resolution': ['resolution', 'cheatin resolution'],
    'gambling': ['cheatin resolution']
};

/**
 * Represents an action ability provided by card text.
 *
 * Properties:
 * title        - string that is used within the card menu associated with this
 *                action.
 * condition    - optional function that should return true when the action is
 *                allowed, false otherwise. It should generally be used to check
 *                if the action can modify game state (step #1 in ability
 *                resolution in the rules).
 * cost         - object or array of objects representing the cost required to
 *                be paid before the action will activate. See Costs.
 * phase        - string representing which phases the action may be executed.
 *                Defaults to 'any' which allows the action to be executed in
 *                any phase.
 * location     - string indicating the location the card should be in in order
 *                to activate the action. Defaults to 'play area'.
 * limit        - optional AbilityLimit object that represents the max number of
 *                uses for the action as well as when it resets.
 * max          - optional AbilityLimit object that represents the max number of
 *                times the ability by card title can be used. Contrast with
 *                `limit` which limits per individual card.
 * anyPlayer    - boolean indicating that the action may be executed by a player
 *                other than the card's controller. Defaults to false.
 * clickToActivate - boolean that indicates the action should be activated when
 *                   the card is clicked.
 */
class CardAction extends BaseAbility {
    constructor(game, card, properties) {
        super(properties);
        this.game = game;
        this.card = card;
        this.title = properties.title;
        this.max = properties.max;
        this.playType = this.buildPlayType(properties);
        this.anyPlayer = properties.anyPlayer || false;
        this.condition = properties.condition;
        this.used = false;
        this.clickToActivate = !!properties.clickToActivate;
        if (properties.location) {
            if (Array.isArray(properties.location)) {
                this.location = properties.location;
            } else {
                this.location = [ properties.location ];
            }
        } else if(card.getType() === 'action') {
            this.location = [ 'hand' ];
        } else {
            this.location = [ 'play area' ];
        }
        this.events = new EventRegistrar(game, this);
        this.activationContexts = [];

        if(card.getType() === 'action') {
            this.cost = this.cost.concat(Costs.playAction());
        }

        if(this.max) {
            this.card.owner.registerAbilityMax(this.card.name, this.max);
        }

        if(!this.gameAction) {
            throw new Error('Actions must have a `gameAction` or `handler` property.');
        }
    }

    buildPlayType(properties) {
        if(!properties.playType) {
            return 'any';
        }

        if(!ActionPlayTypes.includes(properties.playType)) {
            throw new Error(`'${properties.playType}' is not a valid 'playType' property`);
        }

        return properties.playType;
    }

    defaultCondition() {
        if (this.playType === 'cheatin resolution') {
            return this.card.controller.canPlayCheatinResolution();
        }
        if (this.playType.includes('shootout')) {
            if (this.playType === 'shootout' && this.card.getType() !== 'action') {
                return this.game.shootout.isInShootout(this.card);
            }
        }
        return true;
    }

    isLocationValid(location) {
        return this.location.includes(location);
    }

    allowMenu() {
        return this.isLocationValid(this.card.location);
    }

    allowPlayer(player) {
        return this.card.controller === player || this.anyPlayer;
    }

    createContext(player) {
        return new AbilityContext({
            ability: this,
            game: this.game,
            player: player,
            source: this.card
        });
    }

    meetsRequirements(context) {
        if(this.playType !== 'any') {
            if(this.game.shootout) {
                if (this.game.shootout.currentStep === ShootoutSteps.shootout && 
                    !AllowedTypesForPhase['shootout plays'].includes(this.playType)) {
                    return false;
                } else if (this.game.shootout.currentStep === ShootoutSteps.resolution &&
                    !AllowedTypesForPhase['shootout resolution'].includes(this.playType)) {

                }
            } else {
                let allowedTypes = AllowedTypesForPhase[this.game.currentPhase];

                if(!allowedTypes) {
                    return false;
                }
                if (!allowedTypes.includes(this.playType)) {           
                    return false;
                }
            }
        }

        if(this.isCardAbility() && !context.player.canTrigger(this)) {
            return false;
        }

        if(this.used) {
            return false;
        }

        if(!this.allowPlayer(context.player)) {
            return false;
        }

        if(this.card.getType() === 'action' && !context.player.isCardInPlayableLocation(this.card, 'play')) {
            return false;
        }

        if(this.card.getType() !== 'action' && !this.isLocationValid(this.card.location)) {
            return false;
        }

        if(this.card.isAnyBlank()) {
            return false ;
        }

        if(!this.defaultCondition()) {
            return false;
        }

        if(this.condition && !this.condition(context)) {
            return false;
        }

        return this.canResolvePlayer(context) && this.canPayCosts(context) && this.canResolveTargets(context) && this.gameAction.allow(context);
    }

    execute(player, arg) {
        var context = this.createContext(player, arg);

        if(!this.meetsRequirements(context)) {
            return false;
        }

        this.activationContexts.push(context);

        this.game.resolveAbility(this, context);

        return true;
    }

    getMenuItem(arg, player) {
        let context = this.createContext(player);
        return { text: this.title, method: 'doAction', arg: arg, anyPlayer: !!this.anyPlayer, disabled: !this.meetsRequirements(context) };
    }

    isAction() {
        return true;
    }

    isTriggeredAbility() {
        return true;
    }

    isClickToActivate() {
        return this.clickToActivate;
    }

    isPlayableActionAbility() {
        return this.card.getType() === 'action' && this.isLocationValid('hand');
    }

    incrementLimit() {
        if(!this.isLocationValid(this.card.location)) {
            return;
        }

        super.incrementLimit();
    }

    hasMax() {
        return !!this.max;
    }

    deactivate(player) {
        if(this.activationContexts.length === 0) {
            return false;
        }

        var context = this.activationContexts[this.activationContexts.length - 1];

        if(!context || player !== context.player) {
            return false;
        }

        if(this.canUnpayCosts(context)) {
            this.unpayCosts(context);
            context.abilityDeactivated = true;
            return true;
        }

        return false;
    }

    onBeginRound() {
        this.activationContexts = [];
    }

    isEventListeningLocation(location) {
        return this.isLocationValid(location);
    }

    registerEvents() {
        this.events.register(['onBeginRound']);
        if(this.limit) {
            this.limit.registerEvents(this.game);
        }
    }

    unregisterEvents() {
        this.events.unregisterAll();
        if(this.limit) {
            this.limit.unregisterEvents(this.game);
        }
    }
}

module.exports = CardAction;

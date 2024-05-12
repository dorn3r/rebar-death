import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { Character } from '@Shared/types/character.js';
import * as Utility from '@Shared/utility/index.js';

const Rebar = useRebar();
const api = Rebar.useApi();

const TimeOfDeath: { [_id: string]: number } = {};
const respawntime = 30000 as number;



const HOSPITALS = [
    { x: -248.01309204101562, y: 6332.01513671875, z: 33.0750732421875 },
    { x: 1839.15771484375, y: 3672.702392578125, z: 34.51904296875 },
    { x: 297.4647521972656, y: -584.7089233398438, z: 44.292724609375 },
    { x: -677.0172119140625, y: 311.7821350097656, z: 83.601806640625 },
    { x: 1151.2904052734375, y: -1529.903564453125, z: 36.3017578125 },
];

const Internal = {
    handleCharacterSelected(player: alt.Player, character: Character) {
        if( character.isDead) {
            player.health = 99;
            TimeOfDeath[character._id.toString()] = Date.now() + respawntime;
            alt.emitClient(player, 'update:death:time:left', TimeOfDeath[character._id.toString()] - Date.now());
            alt.emitClient(player, 'death:timer');
            alt.setTimeout(() => {
                Internal.respawn(player);
            }, respawntime);
        }
    },

    /**
     * Returns the closest hospital position.
     *
     * @param {alt.IVector3} pos A position in the world.
     * @return {alt.IVector3}
     */
    getClosestHospital(pos: alt.IVector3): alt.IVector3 {
        const sortedByDistance = HOSPITALS.sort((a, b) => {
            const distA = Utility.vector.distance(pos, a);
            const distB = Utility.vector.distance(pos, b);
            return distA - distB;
        });

        return sortedByDistance[0];
    },
    /**
     * Respawns the player, and resets their death data.
     *
     * @param {alt.Player} victim
     * @return {void}
     */
    respawn(victim: alt.Player) {

        if (!victim || !victim.valid) {
            return;
        }

        
        const victimData = Rebar.document.character.useCharacter(victim);
        const document = victimData.get();
        if (typeof victimData === 'undefined') {
            return;
        }

        if (!document.isDead) {
            return;
        }

        const newPosition = Internal.getClosestHospital(victim.pos);
        victimData.set('isDead', false);
        victim.spawn(newPosition.x, newPosition.y, newPosition.z, 0);
        victim.clearBloodDamage();
    },

    /**
     * Respawns the player after 30 seconds in their same position.
     *
     * @param {alt.Player} victim
     * @return {void}
     */
    handleDefaultDeath(victim: alt.Player) {
        
        if (!victim || !victim.valid) {
            return;
        }

        const victimData = Rebar.document.character.useCharacter(victim);
        const character = victimData.get();
        if (!victimData) {
            return;
        }

        victimData.set('isDead', true);

        TimeOfDeath[character._id.toString()] = Date.now() + respawntime;
        alt.emitClient(victim, 'update:death:time:left', TimeOfDeath[character._id.toString()] - Date.now());
        alt.emitClient(victim, 'death:timer');

        alt.setTimeout(() => {
            if (!victim || !victim.valid) {
                return;
            }

            Internal.respawn(victim);
        }, respawntime);
    },
    
};


async function init() {
    await alt.Utils.waitFor(() => api.isReady('character-select-api'), 30000);
    const charSelectApi = api.get('character-select-api');
    charSelectApi.onSelect(Internal.handleCharacterSelected);
    alt.on('playerDeath', Internal.handleDefaultDeath);
}

init();

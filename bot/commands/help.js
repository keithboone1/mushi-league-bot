import { SlashCommandBuilder, bold, italic } from 'discord.js';
import { userIsCaptain, userIsCoach, userIsMod, userIsOwner, baseFunctionlessHandler } from './util.js';

export const HELP_COMMAND = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('get a list of commands'),

    async execute(interaction) {
        await help(interaction);
    }
}

async function help(interaction) {
    async function dataCollector(interaction) {
        return {
            isCaptain: userIsCaptain(interaction.member),
            isCoach: userIsCoach(interaction.member),
            isMod: userIsMod(interaction.member),
            isOwner: userIsOwner(interaction.member),
        }
    }

    function verifier(data) {
        return [];
    }

    function responseWriter(data) {
        const { isCaptain, isCoach, isMod, isOwner } = data;

        let helpText =
            '\u200b' +
            `\n${bold('Commands')}:` +
            '\n' +
            `\n${italic('public')}` +
            `\n    ${bold('/match')}` +
            `\n        ${bold('schedule')}   adds a scheduled time to the main room` +
            `\n        ${bold('start')}   gives both players the role which bars them from #live-matches` +
            `\n        ${bold('link')}   links a game in #live-matches` +
            `\n        ${bold('report')}   reports the result of a played set` +
            `\n    ${bold('/data')}` +
            `\n        ${bold('scout')}   get a player's past replays` +
            `\n    ${bold('/draft')}` +
            `\n        ${bold('list')}   see all available players in star order` +
            `\n    ${bold('/help')}   ...this`;

        if (isCaptain || isCoach) {
            helpText +=
                '\n' +
                `\n${italic('coach or captain only')}` +
                `\n    ${bold('/lineup')}` +
                `\n        ${bold('remind')}   see your lineup for next week`
        }

        if (isCaptain || isCoach || isMod) {
            helpText +=
                '\n' +
                `\n${italic('mod, coach, or captain only')}` +
                `\n    ${bold('/lineup')}` +
                `\n        ${bold('submit')}   submit a lineup for next week` +
                `\n        ${bold('substitution')}   perform a substitution in the current week (or past week, for an extension)` +
                `\n    ${bold('/draft')}` +
                `\n        ${bold('pick')}   pick the next player to be drafted` +
                `\n        ${bold('withdraw')}   withdraw a team from the draft`;
        }

        if (isMod) {
            helpText +=
                '\n' +
                `\n${italic('mod only')}` +
                `\n    ${bold('/lineup')}` +
                `\n        ${bold('hound')}   ping captains for next week's lineups` +
                `\n    ${bold('/match')}` +
                `\n        ${bold('act')}   award an activity win` +
                `\n        ${bold('dead')}   mark a match dead` +
                `\n        ${bold('undo')}   undo a match report` +
                `\n    ${bold('/player')}` +
                `\n        ${bold('add')}   add a player to the player pool` +
                `\n        ${bold('rate')}   give a player a star rating` +
                `\n        ${bold('assign')}   assign a player to a team` +
                `\n        ${bold('drop')}   drop a player from a team` +
                `\n        ${bold('set_inactive')}   mark a player inactive (cannot be on a team)` +
                `\n        ${bold('set_active')}   mark a player active (can be on a team)`;
        }

        if (isOwner) {
            helpText +=
                '\n' +
                `\n${italic('admin only')}` +
                `\n    ${bold('/draft')}` +
                `\n        ${bold('start')}   so far all this does is ping the first drafter tbh` +
                `\n        ${bold('finalize')}   initialize stat tracking for teams once they're finalized` +
                `\n    ${bold('/season')}` +
                `\n        ${bold('new')}   drop all players from teams, update star points, make round robin matchups` +
                `\n        ${bold('next_week')}   make new match rooms, post predictions, make extension rooms` +
                `\n        ${bold('calculate_standings')}   calculate the player and team standings after a week finishes, set up the next playoff round if applicable`;
        }

        return helpText;
    }

    await baseFunctionlessHandler(interaction, dataCollector, verifier, responseWriter, true, false);
}
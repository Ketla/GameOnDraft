// teams.js

let teamRed = [];
let teamYellow = [];
let activePlayers = [];

export function getTeams() {
    return { teamRed, teamYellow };
}

export function setTeams(red, yellow) {
    teamRed = red;
    teamYellow = yellow;
}

export function getActivePlayers() {
    return { activePlayers };
}

export function setActivePlayers(active) {
    activePlayers = active;
}
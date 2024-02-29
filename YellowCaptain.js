const binId = '65c37228266cfc3fde8701b7';
const apiKey = '$2a$10$kaoOqESoJFFd7TsY9YIHsuFQ/6FRJGUnC79Ll0A5CFErFxJwxRhJ6';

document.addEventListener('DOMContentLoaded', async function() {
  const playerListElement = document.getElementById('playerList');
  const yellowPicksElement = document.getElementById('yellowPicks');
  const redPicksElement = document.getElementById('redPicks');

  const binContent = await fetchBinContent(binId, apiKey);
  updateDraftStatus(binContent);

  const activePlayers = binContent.players.filter(player => player.active && !player.Picked);
  displayPlayers(activePlayers, playerListElement, binContent);

  const yellowTeamPlayers = binContent.players.filter(player => player.Team === "yellow");
  displayPlayers(yellowTeamPlayers, yellowPicksElement, false);

  const redTeamPlayers = binContent.players.filter(player => player.Team === "red");
  displayPlayers(redTeamPlayers, redPicksElement, false);

  const refreshButton = document.getElementById('refreshPageButton');
  refreshButton.addEventListener('click', () => window.location.reload());
});

async function fetchBinContent(binId, apiKey) {
  const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
    method: 'GET',
    headers: { 'X-Master-Key': apiKey }
  });
  if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
  return await response.json().then(data => data.record);
}

function displayPlayers(players, container, binContent, clickable = true) {
  container.innerHTML = '';
  players.forEach(player => {
    const playerElement = document.createElement('div');
    playerElement.classList.add('player');
    playerElement.classList.add(player.Picked ? player.Team === "yellow" ? 'yellow-pick' : 'red-pick' : 'available-player');
    playerElement.setAttribute('data-player-id', player.id);
    playerElement.textContent = `${player.name} (W: ${player.wins} L: ${player.losses})`;
    if (clickable && !player.Picked && binContent.currentTurn === "yellow") {
      playerElement.onclick = () => selectPlayer(player, binContent);
    }
    container.appendChild(playerElement);
  });
}

async function selectPlayer(player, binContent) {
  if (binContent.currentTurn !== "yellow") {
    alert("It's not Yellow team's turn to pick.");
    return;
  }

  player.Picked = true;
  player.Team = "yellow";
  addPlayerToTeamList(player, 'yellowPicks');
  updateDraftStateForPick(binContent, "yellow");
  updateDraftStatus(binContent);
  await updatePlayerAndDraftStateInBin(player, binContent);
}

function updateDraftStateForPick(binContent, team) {
  if (binContent.currentTurn !== team) {
      console.error("Not your turn.");
      return;
  }

  // Increment the pick count for the current team
  binContent[`${team}PicksCount`]++;

  // Special handling for the very first pick of the draft
  if (binContent.firstPickTurn) {
      binContent.firstPickTurn = false; // Mark the first pick phase as complete

      // Ensure the first team gets only one additional pick (total picks become 2 including the captain)
      // Then switch turns immediately after the first pick
      if (binContent[`${team}PicksCount`] === 2) {
          binContent.currentTurn = team === "red" ? "yellow" : "red";
          // Reset pick counts for the next phase of picking
          binContent.yellowPicksCount = 1; // Reset to 1 to account for the captain
          binContent.redPicksCount = 1; // Reset to 1 to account for the captain
          return; // Exit early to avoid further logic affecting the first pick phase
      }
  } else {
      // For subsequent picks, check if it's time to switch turns based on maxPicksPerTurn
      if (binContent[`${team}PicksCount`] >= binContent.maxPicksPerTurn + 1) { // +1 accounts for the initial captain pick
          binContent.currentTurn = team === "red" ? "yellow" : "red";
          binContent.yellowPicksCount = 1; // Ensure captains are accounted for in subsequent rounds
          binContent.redPicksCount = 1;
      }
  }

  // Logic to update the draft status and UI accordingly
  updateDraftStatus(binContent);
}








async function updatePlayerAndDraftStateInBin(updatedPlayer, binContent) {
  const playerIndex = binContent.players.findIndex(p => p.id === updatedPlayer.id);
  if (playerIndex !== -1) {
    binContent.players[playerIndex] = updatedPlayer;
  }
  const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': apiKey
    },
    body: JSON.stringify(binContent)
  });

  if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
}

function updateDraftStatus(binContent) {
  const draftStatusElement = document.getElementById('draftStatus');
  let playersNotPickedCount = binContent.players.filter(player => player.active && !player.Picked).length;
  
  if (playersNotPickedCount === 0) {
      // Draft is complete, no more players to pick
      draftStatusElement.textContent = "Draft Complete";
      draftStatusElement.className = 'draft-complete';
      return;
  }

  let picksLeft = binContent.maxPicksPerTurn - binContent.yellowPicksCount;
  
  if (binContent.currentTurn === "yellow") {
      picksLeft = Math.min(picksLeft, playersNotPickedCount); // Ensure we do not allow more picks than available players
      draftStatusElement.textContent = `YOUR TURN TO PICK - ${picksLeft} pick${picksLeft === 1 ? '' : 's'} left`;
      draftStatusElement.className = 'your-turn';
  } else {
      draftStatusElement.textContent = "Waiting for the other team...";
      draftStatusElement.className = 'waiting';
  }
}


function addPlayerToTeamList(player, teamListId) {
const teamListElement = document.getElementById(teamListId);
const playerElement = document.createElement('div');
playerElement.classList.add('player', player.Team === "yellow" ? 'yellow-pick' : 'red-pick');
playerElement.setAttribute('data-player-id', player.id);
playerElement.textContent = `${player.name} (W: ${player.wins} L: ${player.losses}, Elo: ${player.elo})`;
teamListElement.appendChild(playerElement);
}

document.addEventListener('DOMContentLoaded', async function() {
// Your existing setup code...

// Event listener for the Refresh Page button
const refreshButton = document.getElementById('refreshPageButton');
refreshButton.addEventListener('click', function() {
    window.location.reload(); // Reloads the current page
});
});

async function saveDraftState(updatedState) {
  const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
      method: 'PUT',
      headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': apiKey
      },
      body: JSON.stringify(updatedState)
  });

  if (!response.ok) {
      throw new Error(`Failed to save draft state: ${response.statusText}`);
  }
}

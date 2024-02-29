const binId = '65c37228266cfc3fde8701b7';
const apiKey = '$2a$10$kaoOqESoJFFd7TsY9YIHsuFQ/6FRJGUnC79Ll0A5CFErFxJwxRhJ6';

document.addEventListener('DOMContentLoaded', async function() {
  const playerListElement = document.getElementById('playerList');
  const yellowPicksElement = document.getElementById('yellowPicks');
  const redPicksElement = document.getElementById('redPicks');

  // Fetch all players and draft state
  const binContent = await fetchBinContent(binId, apiKey);

  // Initialize draft status display
  updateDraftStatus(binContent);

  // Display available players
  const activePlayers = binContent.players.filter(player => player.active && !player.Picked);
  displayPlayers(activePlayers, playerListElement, binContent);

  // Display Yellow team's picked players
  const yellowTeamPlayers = binContent.players.filter(player => player.Team === "yellow");
  displayPlayers(yellowTeamPlayers, yellowPicksElement, false);

  // Display Red team's picked players
  const redTeamPlayers = binContent.players.filter(player => player.Team === "red");
  displayPlayers(redTeamPlayers, redPicksElement, false);
});

async function fetchBinContent(binId, apiKey) {
  const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
    method: 'GET',
    headers: { 'X-Master-Key': apiKey }
  });
  if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
  const data = await response.json();
  return data.record; // This now returns the whole bin content including players and draft state properties
}

function displayPlayers(players, container, binContent, clickable = true) {
  container.innerHTML = ''; // Clear existing content
  players.forEach(player => {
    const playerElement = document.createElement('div');
    playerElement.classList.add('player');
    if (player.Picked) {
      playerElement.classList.add(player.Team === "yellow" ? 'yellow-pick' : 'red-pick');
    }
    playerElement.setAttribute('data-player-id', player.id);
    playerElement.textContent = `${player.name} (W: ${player.wins} L: ${player.losses})`;
    if (clickable && !player.Picked && binContent.currentTurn === "red") {
      playerElement.onclick = () => selectPlayer(player, binContent);
    }
    container.appendChild(playerElement);
  });
}

async function selectPlayer(player, binContent) {
  document.getElementById('loadingIndicator').classList.remove('loading-hidden');

  if (binContent.currentTurn !== "red") {
      alert("It's not Red team's turn to pick.");
      console.error("It's not Red team's turn to pick.");
      document.getElementById('loadingIndicator').classList.add('loading-hidden');
      return;
  }

  try {
      // Simulate updating player's status locally for immediate UI feedback
      player.Picked = true;
      player.Team = "red";
      
      // Add player to Red team's pick list in the UI
      addPlayerToTeamList(player, 'redPicks');

      // Logic to update draft state based on the pick
      updateDraftStateForPick(binContent, "red");

      // Update the draft status display to reflect the new state
      updateDraftStatus(binContent);

      // Asynchronously update the player's status and draft state in the backend
      await updatePlayerAndDraftStateInBin(player, binContent);
  } catch (error) {
      console.error('Error selecting player:', error);
  } finally {
      document.getElementById('loadingIndicator').classList.add('loading-hidden');
  }
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

  let picksLeft;
  let totalPicks = binContent.yellowPicksCount + binContent.redPicksCount;
  let isFirstRound = totalPicks < (binContent.FirstPick === "red" ? 2 : 3);

  if (binContent.currentTurn === "red") {
      picksLeft = isFirstRound && binContent.FirstPick === "red" ? 1 - binContent.redPicksCount : Math.min(binContent.maxPicksPerTurn - binContent.redPicksCount, playersNotPickedCount);
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


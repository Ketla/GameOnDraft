const binId = '65c37228266cfc3fde8701b7';
const apiKey = '$2a$10$kaoOqESoJFFd7TsY9YIHsuFQ/6FRJGUnC79Ll0A5CFErFxJwxRhJ6';

document.addEventListener('DOMContentLoaded', async function() {
  const yellowPicksElement = document.getElementById('yellowPicks');
  const redPicksElement = document.getElementById('redPicks');

  // Fetch all players
  const players = await fetchPlayers(binId, apiKey);
  
  // Display Yellow team's picked players
  const yellowTeamPlayers = players.filter(player => player.Team === "yellow");
  displayPlayers(yellowTeamPlayers, yellowPicksElement, false);

  // Display Red team's picked players
  const redTeamPlayers = players.filter(player => player.Team === "red");
  displayPlayers(redTeamPlayers, redPicksElement, false);
});

async function fetchPlayers(binId, apiKey) {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
        method: 'GET',
        headers: { 'X-Master-Key': apiKey }
    });
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    return data.record.players || [];
}

function displayPlayers(players, container, clickable = false) {
  // Check if the loading text exists and remove it
  const loadingText = container.querySelector('.loading-text');
  if (loadingText) {
      loadingText.remove();
  }

  players.forEach(player => {
    const playerElement = document.createElement('div');
    playerElement.classList.add('player');
    if (player.Picked) {
      playerElement.classList.add(player.Team === "yellow" ? 'yellow-pick' : 'red-pick');
    }
    playerElement.textContent = `${player.name}`;
    container.appendChild(playerElement);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('refreshButton').addEventListener('click', refreshPicks);
});

async function refreshPicks() {
  const refreshButton = document.getElementById('refreshButton');
  const yellowPicksElement = document.getElementById('yellowPicks');
  const redPicksElement = document.getElementById('redPicks');

  // Disable the button and change text while loading
  refreshButton.textContent = 'Refreshing picks...';
  refreshButton.disabled = true;

  // Optionally show a loading indicator
  yellowPicksElement.innerHTML = '<div class="loading-text">Loading players...</div>';
  redPicksElement.innerHTML = '<div class="loading-text">Loading players...</div>';

  try {
    // Fetch all players
    const players = await fetchPlayers(binId, apiKey);

    // Clear the current lists before re-displaying
    yellowPicksElement.innerHTML = '';
    redPicksElement.innerHTML = '';

    // Display Yellow team's picked players
    const yellowTeamPlayers = players.filter(player => player.Team === "yellow");
    displayPlayers(yellowTeamPlayers, yellowPicksElement, false);

    // Display Red team's picked players
    const redTeamPlayers = players.filter(player => player.Team === "red");
    displayPlayers(redTeamPlayers, redPicksElement, false);
  } catch (error) {
    console.error('Error refreshing picks:', error);
    // Optionally, handle the error in the UI, for example by showing an error message
  } finally {
    // Enable the button and reset text after loading
    refreshButton.textContent = 'Refresh Picks';
    refreshButton.disabled = false;
  }
}

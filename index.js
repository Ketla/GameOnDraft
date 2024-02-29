import { setActivePlayers } from './teams.js';

document.addEventListener('DOMContentLoaded', async function () {
  const playerForm = document.getElementById('playerForm');
  const playerNameInput = document.getElementById('playerName');
  const playerList = document.getElementById('playerList');
  const addPlayerButton = document.getElementById('add-player-button'); // Assuming your button is of type submit within the form

  async function fetchAndDisplayPlayers(playerList) {
    playerList.innerHTML = 'Loading in players...';
  
    try {
      const players = await fetchPlayersFromBin();
      // Sort players first by active status, then by Elo rating in descending order
      players.sort((a, b) => {
        // Compare active status (true values first)
        if (a.active === b.active) {
          // If both players have the same active status, then sort by Elo
          return b.elo - a.elo;
        }
        // Convert active to number (true to 1, false to 0) and subtract to get true values first
        return (b.active ? 1 : 0) - (a.active ? 1 : 0);
      });

    // Calculate active players
    const activePlayersCount = players.filter(player => player.active).length;
    
    // Update the Start Game button
    updateStartGameButtonText(activePlayersCount);
  
      // Clear current player list (the loading message in this case) before adding new players
      playerList.innerHTML = '';
      players.forEach(player => addPlayerToList(player, playerList));
    } catch (error) {
      console.error('Error fetching players:', error);
      playerList.innerHTML = 'Error fetching players.';
    }
  }

  playerForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const playerName = playerNameInput.value.trim(); // Trim whitespace from the input value

    // Check if playerName length is less than 3 characters
    if (playerName.length < 3) {
        alert('Player name must be at least 3 letters long.');
        // Re-enable the add player button in case of invalid input
        addPlayerButton.disabled = false;
        addPlayerButton.innerText = 'Add Player'; // Reset button text if needed
        return; // Exit the function to prevent further execution
    }

    // Disable the add player button
    addPlayerButton.disabled = true;
    addPlayerButton.innerText = 'Adding...'; // Optional: change button text

    const playerId = 'player-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const player = { id: playerId, name: playerName, wins: 0, losses: 0, elo: 1000, captainWins: 0, gamesPlayed: 0, active: true };

    playerList.innerHTML = 'Adding player...';

    try {
      await addPlayerToBin(player);
      await fetchAndDisplayPlayers(playerList);
      playerNameInput.value = ''; // Clear the input field after successful addition
    } catch (error) {
      console.error('Error adding player:', error);
      playerList.innerHTML = 'Error adding player. Please try again.';
    }

    // Re-enable the add player button after the try/catch block
    addPlayerButton.disabled = false;
    addPlayerButton.innerText = 'Add Player'; // Reset button text
});

  playerList.addEventListener('change', async function(e) {
    if (e.target.classList.contains('active-checkbox')) {
      e.target.disabled = true;
      const playerId = e.target.dataset.playerId;
      const isActive = e.target.checked;
      await updatePlayerActiveStatus(playerId, isActive);
      await fetchAndDisplayPlayers(playerList); // Refresh the list to reflect the changes
    }
  });

  await fetchAndDisplayPlayers(playerList);
});


async function fetchPlayersFromBin() {
  const binId = '65c37228266cfc3fde8701b7'; // Your Bin ID
  const apiKey = '$2a$10$kaoOqESoJFFd7TsY9YIHsuFQ/6FRJGUnC79Ll0A5CFErFxJwxRhJ6'; // Replace with your JSONBin.io API key

  const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
    method: 'GET',
    headers: {
      'X-Master-Key': apiKey
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = await response.json();
  return data.record.players;
}

async function addPlayerToBin(player) {
  const binId = '65c37228266cfc3fde8701b7'; // Your Bin ID
  const apiKey = '$2a$10$kaoOqESoJFFd7TsY9YIHsuFQ/6FRJGUnC79Ll0A5CFErFxJwxRhJ6'; // Replace with your JSONBin.io API key

  try {
    // Fetch the existing data
    let response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
      method: 'GET',
      headers: {
        'X-Master-Key': apiKey
      }
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    let data = await response.json();

    // Add new player to the existing data
    data.record.players.push(player);

    // Send the updated data back to JSONBin
    response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': apiKey
      },
      body: JSON.stringify(data.record)
    });

    if (!response.ok) throw Error(`HTTP error! Status: ${response.status}`);

    console.log('Player added successfully', await response.json());
  } catch (error) {
    console.error('Error adding player:', error);
  }
}

function addPlayerToList(player, playerList) {
  const playerDiv = document.createElement('div');
  playerDiv.classList.add('player', player.active ? 'active' : 'inactive');

  const isChecked = player.active ? 'checked' : '';

  playerDiv.innerHTML = `
    <p>Name: ${player.name}</p>
    <p>Wins: ${player.wins}</p>
    <p>Losses: ${player.losses}</p>
    <p>Elo: ${player.elo}</p>
    <label class="switch">
      <input type="checkbox" ${isChecked} data-player-id="${player.id}" class="active-checkbox">
      <div class="slider round"></span>
        <span class="on">ON</span>
        <span class="off">OFF</span>
    </div>
  `;

  playerList.appendChild(playerDiv);
}


async function updatePlayerActiveStatus(playerId, isActive) {

  const binId = '65c37228266cfc3fde8701b7'; // Your Bin ID
  const apiKey = '$2a$10$kaoOqESoJFFd7TsY9YIHsuFQ/6FRJGUnC79Ll0A5CFErFxJwxRhJ6'; // Replace with your JSONBin.io API key
  
  // Fetch the current list of players
  let players = await fetchPlayersFromBin(binId, apiKey);
  // Find the player by ID and update their active status
  const playerIndex = players.findIndex(player => player.id === playerId);
  if (playerIndex !== -1) {
    players[playerIndex].active = isActive;
  }

  // Update the storage bin with the new list of players
  const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': apiKey
    },
    body: JSON.stringify({ players })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  console.log('Player active status updated successfully', await response.json());
}

function updateStartGameButtonText(activePlayersCount) {
  const startGameButton = document.getElementById('start-game-button');
  
  if (activePlayersCount > 1) {
    const teamOne = Math.ceil(activePlayersCount / 2);
    const teamTwo = Math.floor(activePlayersCount / 2);
    startGameButton.textContent = `Start Game (${teamOne} vs ${teamTwo})`;
    startGameButton.disabled = false;
    startGameButton.classList.remove('button-red'); // Remove the red class if it's there
  } else {
    startGameButton.classList.add('button-red'); // Add the red class
    startGameButton.textContent = 'Not enough active players';
    startGameButton.disabled = true;
  }
}

document.getElementById('start-game-button').addEventListener('click', async function() {
  const isReady = window.confirm("Ready to kick it off?");
  
  if (isReady) {
      // Show the loading screen
      document.getElementById('loadingScreen').style.display = 'flex';
      
      try {
          const players = await fetchPlayersFromBin();
          const activePlayersList = players.filter(player => player.active);

          // Optionally set the active players as a backup
          setActivePlayers(activePlayersList);
          console.log("Active players set:", activePlayersList);

          await setMatchReady(); // Update MatchReady flag
          
          // Now you can navigate to start_game.html or another page
          window.location.href = 'start_game.html';
      } catch (error) {
          console.error('Error during match setup:', error);
          // Handle error (e.g., show an error message to the user)
      } finally {
          // Hide the loading screen in case of error or if you decide to stay on the same page
          document.getElementById('loadingScreen').style.display = 'none';
      }
  } else {
      console.log("The match setup was canceled.");
  }
});

async function setMatchReady() {
  const binId = '65c37228266cfc3fde8701b7'; // Your Bin ID
  const apiKey = '$2a$10$kaoOqESoJFFd7TsY9YIHsuFQ/6FRJGUnC79Ll0A5CFErFxJwxRhJ6'; // Your JSONBin.io API key

  try {
      // Fetch the existing data from the bin
      let response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
          method: 'GET',
          headers: {
              'X-Master-Key': apiKey
          }
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      let data = await response.json();

      // Set the 'MatchReady' flag to true at the root of your data structure
      data.record.MatchReady = true;

      // Make sure you're updating the entire record, including the existing players
      response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
          method: 'PUT',
          headers: {
              'Content-Type': 'application/json',
              'X-Master-Key': apiKey
          },
          body: JSON.stringify(data.record)
      });

      if (!response.ok) throw Error(`HTTP error! Status: ${response.status}`);

      console.log('Match ready status set to true.', await response.json());
  } catch (error) {
      console.error('Error setting match ready:', error);
  }
}

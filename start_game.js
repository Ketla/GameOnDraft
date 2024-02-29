document.addEventListener('DOMContentLoaded', async function() {
    // References to UI elements
    const pickOrderSelection = document.getElementById('pickOrderSelection');
    const redFirstPickBtn = document.getElementById('giveRedFirstPick');
    const yellowFirstPickBtn = document.getElementById('giveYellowFirstPick');
    const loadingScreen = document.getElementById('loadingScreen');
    const gameContent = document.getElementById('gameContent');

    // Initially, show only the pick order selection
    pickOrderSelection.style.display = 'block';
    loadingScreen.style.display = 'none';
    gameContent.style.display = 'none';

    // Fetch active players and populate dropdown menus
    try {
        const activePlayers = await fetchActivePlayers(); // Assume this function is defined and returns a list of active players
        populateCaptainDropdown('redTeamCaptain', activePlayers);
        populateCaptainDropdown('yellowTeamCaptain', activePlayers);
    } catch (error) {
        console.error('Error fetching active players:', error);
    }

    // Function to handle the pick order selection
    function handleFirstPick(teamColor) {
        // Optionally show loading screen while processing the pick
        pickOrderSelection.style.display = 'none';
        loadingScreen.style.display = 'flex';
        
        setFirstPick(teamColor).then(() => {
            // Once the pick is processed, hide the loading screen and show the game content
            loadingScreen.style.display = 'none';
            gameContent.style.display = 'block'; // Show game content or any other relevant content
        }).catch(error => {
            console.error("Error setting first pick:", error);
            // Handle error, potentially re-showing pickOrderSelection or providing feedback
        });
    }

    // Event listeners for the buttons
    redFirstPickBtn.addEventListener('click', () => handleFirstPick('red'));
    yellowFirstPickBtn.addEventListener('click', () => handleFirstPick('yellow'));
});


async function setFirstPick(teamColor) {
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

        // Set the 'FirstPick' field to the selected team color
        data.record.FirstPick = teamColor;

        // Update the bin with the new draft order
        response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': apiKey
            },
            body: JSON.stringify(data.record)
        });

        if (!response.ok) throw Error(`HTTP error! Status: ${response.status}`);

        console.log(`First pick set to ${teamColor} team.`, await response.json());

        // Optional: Transition to the next step or update the UI accordingly
    } catch (error) {
        console.error('Error setting first pick:', error);
    }
}

async function setFirstPick(teamColor) {
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

        // Here, we ensure MatchReady stays true while updating FirstPick
        data.record.MatchReady = true; // Ensure MatchReady remains true
        data.record.FirstPick = teamColor; // Update the FirstPick attribute
        data.record.currentTurn = teamColor;
        data.record.yellowPicksCount = 0;
        data.record.redPicksCount = 0;
        data.record.maxPicksPerTurn = 2;
        data.record.firstPickTurn = true;

        // Update the bin with the modified data record
        response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': apiKey
            },
            body: JSON.stringify(data.record)
        });

        if (!response.ok) throw Error(`HTTP error! Status: ${response.status}`);

        console.log(`First pick set to ${teamColor} team. Match is ready.`, await response.json());

        // After updating, you may want to update the UI or proceed to the next step
        updateUIWithFirstPick(teamColor); // Ensure this function handles UI updates appropriately
    } catch (error) {
        console.error('Error setting first pick:', error);
    }
}

function updateUIWithFirstPick(teamColor) {
    const firstPickDisplay = document.getElementById('firstPickDisplay');
    firstPickDisplay.textContent = `${teamColor.toUpperCase()} TEAM GETS FIRST PICK`; // Update text to show who has the first pick
    document.getElementById('loadingScreen').style.display = 'none'; // Hide loading screen
    document.getElementById('gameContent').style.display = 'block'; // Show game content
}

// Function to populate captain dropdown
function populateCaptainDropdown(dropdownId, players) {
    const dropdown = document.getElementById(dropdownId);
    players.forEach(player => {
        const option = document.createElement('option');
        option.value = player.id;
        option.textContent = `${player.name} (Elo: ${player.elo})`;
        dropdown.appendChild(option);
    });
}

async function fetchActivePlayers() {
    const binId = '65c37228266cfc3fde8701b7'; // Your Bin ID
    const apiKey = '$2a$10$kaoOqESoJFFd7TsY9YIHsuFQ/6FRJGUnC79Ll0A5CFErFxJwxRhJ6'; // Your JSONBin.io API key

    try {
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
        // Assuming the players are stored in an array under 'players' key and 'active' is a boolean attribute
        return data.record.players.filter(player => player.active);

    } catch (error) {
        console.error('Error fetching active players:', error);
        return []; // Return an empty array in case of error
    }
}

document.getElementById('lockInCaptains').addEventListener('click', function() {
    const redTeamCaptainId = document.getElementById('redTeamCaptain').value;
    const yellowTeamCaptainId = document.getElementById('yellowTeamCaptain').value;

    if (redTeamCaptainId === yellowTeamCaptainId) {
        alert('The same player cannot be captain for both teams. Please select different captains for each team.');
    } else {
        // Proceed with locking in the captains
        lockInCaptains(redTeamCaptainId, yellowTeamCaptainId);
    }
});

// Function to handle locking in the captains
async function lockInCaptains(redCaptainId, yellowCaptainId) {
    // Here you would update the bin with the selected captains
    // For demonstration, this is just a console log
    console.log(`Red Captain: ${redCaptainId}, Yellow Captain: ${yellowCaptainId}`);
    
    // After locking in the captains, you can redirect to the drafting page
    // or perform any other necessary actions
}

async function lockInCaptains(redCaptainId, yellowCaptainId) {
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

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        let data = await response.json();

        // Update the bin with the selected captains and adjust pick counts
        const updatedPlayers = data.record.players.map(player => {
            if (player.id === redCaptainId) {
                return { ...player, Team: 'red', isCaptain: true, Picked: true };
            } else if (player.id === yellowCaptainId) {
                return { ...player, Team: 'yellow', isCaptain: true, Picked: true };
            }
            return player;
        });

        // Directly update picks count for both teams to reflect captain selection
        let updatedData = {
            ...data.record,
            players: updatedPlayers,
            yellowPicksCount: 1, // Reflecting the captain selection
            redPicksCount: 1, // Reflecting the captain selection
        };

        // Update the bin with the modified data record
        response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': apiKey
            },
            body: JSON.stringify(updatedData)
        });

        if (!response.ok) {
            throw Error(`HTTP error! Status: ${response.status}`);
        }

        console.log('Captains locked in and picks count updated successfully', await response.json());

        // Navigate to the draft page or update UI
        window.location.href = 'draft.html'; // Adjust as needed for your application's flow
    } catch (error) {
        console.error('Failed to lock in captains or update picks count:', error);
    }
}


// Event listener for the lock in button
document.getElementById('lockInCaptains').addEventListener('click', async function() {
    const redTeamCaptainId = document.getElementById('redTeamCaptain').value;
    const yellowTeamCaptainId = document.getElementById('yellowTeamCaptain').value;

    if (redTeamCaptainId === yellowTeamCaptainId) {
        alert('The same player cannot be captain for both teams. Please select different captains for each team.');
    } else {
        // Proceed with locking in the captains
        await lockInCaptains(redTeamCaptainId, yellowTeamCaptainId);
    }
});

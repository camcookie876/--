// ------------------------------
// Helper: Show Selected Section
// ------------------------------
function showSection(sectionId) {
  document.querySelectorAll(".page").forEach(el => el.classList.remove("active"));
  const target = document.getElementById(sectionId);
  if (target) target.classList.add("active");
}

// ------------------------------
// Live Game: Show/Hide Sub-Sections
// ------------------------------
function showLiveSubSection(sectionId) {
  document.querySelectorAll(".liveSubSection").forEach(el => el.classList.remove("active"));
  const target = document.getElementById(sectionId);
  if(target) target.classList.add("active");
}

// ------------------------------
// Global Variables
// ------------------------------
let userData = {}; // Stores user data (username, password, character, coins, position, offlineMode, etc.)
const coinsReward = 100;
const rewardInterval = 12 * 60 * 60 * 1000; // 12 hours in ms

// Dummy friend list for GitHub users
const friendList = [
  { username: "Alice" },
  { username: "Bob" },
  { username: "Charlie" }
];

// Dummy shop items (spells)
const spells = [
  { name: "Fire Spell", damage: 20, price: 250 },
  { name: "Ice Spell", damage: 15, price: 200 },
  { name: "Lightning Spell", damage: 25, price: 300 }
];

// ------------------------------
// On DOMContentLoaded: Initialize user data if stored
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const storedData = localStorage.getItem("userData");
  if (storedData) {
    try {
      userData = JSON.parse(storedData);
      // For GitHub users (live mode)
      if (userData.isGithub) {
        if (userData.coins === undefined) userData.coins = 0;
        if (!userData.position) userData.position = { x: 0, y: 0 };
        if (userData.offlineMode === undefined) userData.offlineMode = false;
        updateCoinDisplay();
        updatePositionDisplay();
        updateOfflineStatus();
        // If character is missing, prompt the user to choose one.
        if (!userData.character || userData.character.trim() === "") {
          let newChar = prompt("Please choose your character:");
          if (!newChar || newChar.trim() === "") {
            alert("You must choose a character to play live.");
            // For our demo, force a default character.
            newChar = "DefaultHero";
          }
          userData.character = newChar;
          localStorage.setItem("userData", JSON.stringify(userData));
        }
        document.getElementById("userDisplayName").textContent = userData.username || userData.email;
        showSection("liveGameContent");
      } else {
        // Normal (non-GitHub) users go to Download mode.
        document.getElementById("userDisplayNameNonGithub").textContent = userData.username;
        showSection("downloadContent");
      }
    } catch (e) {
      console.error("Error parsing stored userData:", e);
    }
  }
});

// ------------------------------
// GitHub Login Flow (Simulated)
// ------------------------------
document.getElementById("githubLoginBtn").addEventListener("click", () => {
  // Redirect to GitHub OAuth endpoint using your provided client ID.
  window.location.href =
    "https://github.com/login/oauth/authorize?client_id=Ov23liVGrguwGKyy3qly&scope=read:user%20user:email";
});

// Process OAuth callback if "code" parameter exists.
(function handleOAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  if (params.has("code")) {
    // Simulate successful GitHub login with dummy data.
    userData = {
      username: "GitHubUser",
      email: "githubuser@example.com",
      isGithub: true,
      coins: 0,
      position: { x: 0, y: 0 },
      lastReward: 0,
      offlineMode: false,
      character: ""  // Initially blank—will be prompted below.
    };
    localStorage.setItem("userData", JSON.stringify(userData));
    // Prompt to choose a character if not set.
    let chosen = prompt("Please choose your character:");
    if (!chosen || chosen.trim() === "") {
      alert("You must choose a character to play live. Setting default character.");
      chosen = "DefaultHero";
    }
    userData.character = chosen;
    localStorage.setItem("userData", JSON.stringify(userData));
    document.getElementById("userDisplayName").textContent = userData.username;
    // Clean URL parameters.
    window.history.replaceState({}, document.title, window.location.pathname);
    showSection("liveGameContent");
  }
})();

// ------------------------------
// Normal Login / Sign-Up (No email required)
// ------------------------------
document.getElementById("normalSignupBtn").addEventListener("click", () => {
  const username = document.getElementById("normalUsername").value.trim();
  const password = document.getElementById("normalPassword").value;
  const character = document.getElementById("normalCharacter").value.trim();
  const errorMsg = document.getElementById("normalAuthError");
  
  if (!username || !password || !character) {
    errorMsg.textContent = "Username, password, and character are required.";
    return;
  }
  
  // Check if a normal account already exists.
  if (localStorage.getItem("normalUser")) {
    errorMsg.textContent = "An account already exists. Please sign in.";
    return;
  }
  
  const normalUser = {
    username,
    password,
    character,
    isGithub: false,
    createdAt: new Date().toISOString()
  };
  localStorage.setItem("normalUser", JSON.stringify(normalUser));
  userData = normalUser;
  localStorage.setItem("userData", JSON.stringify(userData));
  document.getElementById("userDisplayNameNonGithub").textContent = username;
  errorMsg.textContent = "";
  showSection("downloadContent");
});

document.getElementById("normalLoginBtn").addEventListener("click", () => {
  const username = document.getElementById("normalUsername").value.trim();
  const password = document.getElementById("normalPassword").value;
  const errorMsg = document.getElementById("normalAuthError");
  
  if (!username || !password) {
    errorMsg.textContent = "Please enter both username and password.";
    return;
  }
  
  const storedUser = localStorage.getItem("normalUser");
  if (!storedUser) {
    errorMsg.textContent = "No account found. Please sign up first.";
    return;
  }
  const normalUser = JSON.parse(storedUser);
  if (normalUser.username !== username || normalUser.password !== password) {
    errorMsg.textContent = "Invalid username or password.";
    return;
  }
  
  // Verify character information.
  if (!normalUser.character || normalUser.character.trim() === "") {
    errorMsg.textContent = "No character found on your account. Please sign up and choose a character.";
    return;
  }
  
  userData = normalUser;
  localStorage.setItem("userData", JSON.stringify(userData));
  document.getElementById("userDisplayNameNonGithub").textContent = username;
  errorMsg.textContent = "";
  showSection("downloadContent");
});

// ------------------------------
// Logout Functions
// ------------------------------
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("userData");
  showSection("authSection");
});
document.getElementById("logoutBtnNonGithub").addEventListener("click", () => {
  localStorage.removeItem("userData");
  showSection("authSection");
});

// ------------------------------
// Daily Rewards (Live Play / GitHub users Only)
// ------------------------------
document.getElementById("dailyRewardBtn").addEventListener("click", () => {
  if (!userData.isGithub) return;
  const now = Date.now();
  if (!userData.lastReward || now - userData.lastReward >= rewardInterval) {
    userData.coins = (userData.coins || 0) + coinsReward;
    userData.lastReward = now;
    localStorage.setItem("userData", JSON.stringify(userData));
    updateCoinDisplay();
    alert("You received " + coinsReward + " coins!");
  } else {
    const remaining = Math.ceil((rewardInterval - (now - userData.lastReward)) / 60000);
    alert("Daily reward available in " + remaining + " minutes.");
  }
});

// ------------------------------
// Update Display Functions
// ------------------------------
function updateCoinDisplay() {
  document.getElementById("coinDisplay").textContent = userData.coins || 0;
}

function updatePositionDisplay() {
  document.getElementById("posX").textContent = (userData.position && userData.position.x) || 0;
  document.getElementById("posY").textContent = (userData.position && userData.position.y) || 0;
}

function updateOfflineStatus() {
  document.getElementById("offlineStatus").textContent = userData.offlineMode ? "Offline" : "Online";
  // Hide Friends tab if offline.
  document.getElementById("friendsBtn").style.display = userData.offlineMode ? "none" : "inline-block";
  if (userData.offlineMode) {
    showLiveSubSection("menuContent");
  }
}

// ------------------------------
// Map Functionality (Live Play)
// ------------------------------
document.getElementById("mapBtn").addEventListener("click", () => {
  showLiveSubSection("mapContainer");
});
document.getElementById("menuBtn").addEventListener("click", () => {
  showLiveSubSection("menuContent");
});
document.getElementById("shopBtn").addEventListener("click", () => {
  showLiveSubSection("shopContainer");
});
document.getElementById("friendsBtn").addEventListener("click", () => {
  showLiveSubSection("friendsContainer");
});
document.getElementById("settingsBtn").addEventListener("click", () => {
  showLiveSubSection("settingsContent");
});

// Process map clicks.
document.querySelectorAll("map[name='gameMap'] area").forEach(area => {
  area.addEventListener("click", (event) => {
    event.preventDefault();
    // If the area is forbidden, show alert.
    if (area.dataset.forbidden === "true") {
      alert("Restricted zone: You are not allowed to enter here!");
      return;
    }
    const targetX = parseInt(area.dataset.x, 10);
    const targetY = parseInt(area.dataset.y, 10);
    userData.position = { x: targetX, y: targetY };
    localStorage.setItem("userData", JSON.stringify(userData));
    updatePositionDisplay();
    alert("Moved to position (" + targetX + ", " + targetY + ")");
  });
});
document.getElementById("backToMenuFromMap").addEventListener("click", () => {
  showLiveSubSection("menuContent");
});

// ------------------------------
// Shop Functionality (Live Play)
// ------------------------------
document.getElementById("backToMenuFromShop").addEventListener("click", () => {
  showLiveSubSection("menuContent");
});
function updateShop() {
  const shopItemsDiv = document.getElementById("shopItems");
  shopItemsDiv.innerHTML = "";
  spells.forEach(spell => {
    const itemDiv = document.createElement("div");
    itemDiv.className = "shopItem";
    const title = document.createElement("h3");
    title.textContent = spell.name;
    const price = document.createElement("p");
    price.textContent = "Price: " + spell.price + " coins";
    const buyBtn = document.createElement("button");
    buyBtn.textContent = "Buy " + spell.name;
    buyBtn.addEventListener("click", () => {
      if ((userData.coins || 0) >= spell.price) {
        userData.coins -= spell.price;
        alert("Purchased " + spell.name + "!");
        localStorage.setItem("userData", JSON.stringify(userData));
        updateCoinDisplay();
        updateShop();
      } else {
        alert("Not enough coins!");
      }
    });
    itemDiv.appendChild(title);
    itemDiv.appendChild(price);
    itemDiv.appendChild(buyBtn);
    shopItemsDiv.appendChild(itemDiv);
  });
}
document.getElementById("shopBtn").addEventListener("click", updateShop);

// ------------------------------
// Friends & Duel Functionality (Live Play, GitHub only)
// ------------------------------
function updateFriendList() {
  if (userData.offlineMode) return;
  const friendListDiv = document.getElementById("friendList");
  friendListDiv.innerHTML = "";
  friendList.forEach(friend => {
    const friendDiv = document.createElement("div");
    friendDiv.className = "friendItem";
    friendDiv.textContent = friend.username;
    const duelBtn = document.createElement("button");
    duelBtn.textContent = "Duel";
    duelBtn.className = "btn duel-btn";
    duelBtn.addEventListener("click", () => {
      alert("Duel started with " + friend.username + "!");
    });
    friendDiv.appendChild(duelBtn);
    friendListDiv.appendChild(friendDiv);
  });
}
document.getElementById("friendsBtn").addEventListener("click", updateFriendList);

// ------------------------------
// Toggle Offline Mode (GitHub Users only)
// ------------------------------
document.getElementById("toggleOfflineBtn").addEventListener("click", () => {
  userData.offlineMode = !userData.offlineMode;
  localStorage.setItem("userData", JSON.stringify(userData));
  updateOfflineStatus();
  alert("Offline mode " + (userData.offlineMode ? "enabled" : "disabled") +
    ". Friends and duel options are " + (userData.offlineMode ? "hidden" : "available") + ".");
});

// ------------------------------
// Settings Sub-Section: Support Link
// ------------------------------
document.getElementById("backToMenuFromSettings").addEventListener("click", () => {
  showLiveSubSection("menuContent");
});

// ------------------------------
// File Download for Non-GitHub Users Only
// ------------------------------
document.getElementById("downloadFileBtn").addEventListener("click", () => {
  if (userData.isGithub) {
    alert("GitHub users are not permitted to download game data.");
    return;
  }
  const fileData = "Chirpy Games: Fall of the Firewall\nGame data for non-GitHub players.";
  const blob = new Blob([fileData], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "ChirpyGamesData.txt";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
});
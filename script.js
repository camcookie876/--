// ------------------------------
// Helper Functions
// ------------------------------
function showSection(sectionId) {
  document.querySelectorAll(".page").forEach((el) => el.classList.remove("active"));
  const target = document.getElementById(sectionId);
  if (target) target.classList.add("active");
}

function showLiveSubSection(sectionId) {
  document.querySelectorAll(".liveSubSection").forEach((el) => el.classList.remove("active"));
  const target = document.getElementById(sectionId);
  if (target) target.classList.add("active");
}

function showTestSubSection(sectionId) {
  document.querySelectorAll(".testSubSection").forEach((el) => el.classList.remove("active"));
  const target = document.getElementById(sectionId);
  if (target) target.classList.add("active");
}

// ------------------------------
// Global Variables
// ------------------------------
let userData = {}; // For current user session
const coinsReward = 100;
const rewardInterval = 12 * 60 * 60 * 1000; // 12 hours

// For test portal expiration (30 days)
const testPortalExpirationDays = 30;

// Dummy friend list
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
// Initialize stored user data
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const storedData = localStorage.getItem("userData");
  if (storedData) {
    try {
      userData = JSON.parse(storedData);
      if (userData.isGithub) {
        if (userData.coins === undefined) userData.coins = 0;
        if (!userData.position) userData.position = { x: 0, y: 0 };
        if (userData.offlineMode === undefined) userData.offlineMode = false;
        updateCoinDisplay();
        updatePositionDisplay();
        updateOfflineStatus();
        if (!userData.character || userData.character.trim() === "") {
          let newChar = prompt("Please choose your character:");
          if (!newChar || newChar.trim() === "") {
            alert("You must choose a character to play live. Setting default.");
            newChar = "DefaultHero";
          }
          userData.character = newChar;
          localStorage.setItem("userData", JSON.stringify(userData));
        }
        document.getElementById("userDisplayName").textContent = userData.username || userData.email;
        showSection("liveGameContent");
      } else if (userData.isTest) {
        // Check test portal expiration.
        const now = Date.now();
        if (now > userData.expiry) {
          alert("Test Portal session has expired.");
          localStorage.removeItem("userData");
          showSection("authSection");
        } else {
          document.getElementById("testUserDisplayName").textContent = userData.username;
          showSection("testPortalContent");
        }
      } else {
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
  // Redirect directly to GitHub OAuth (replace YOUR_GITHUB_CLIENT_ID)
  window.location.href =
    "https://github.com/login/oauth/authorize?client_id=Ov23liVGrguwGKyy3qly&scope=read:user%20user:email";
});

// Process OAuth callback directly on page load
(function handleOAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  if (params.has("code")) {
    const authCode = params.get("code");

    // Simulate GitHub login (in production, exchange 'code' for an access token via a backend)
    userData = {
      username: "GitHubUser",
      email: "githubuser@example.com",
      isGithub: true,
      coins: 0,
      position: { x: 0, y: 0 },
      lastReward: 0,
      offlineMode: false,
      character: ""
    };

    // Check for duplicate username among GitHub users
    let allGithubUsers = JSON.parse(localStorage.getItem("githubUsers") || "[]");
    if (allGithubUsers.includes(userData.username)) {
      alert("The username is already in use. Please change your gameplay username.");
      return;
    }

    localStorage.setItem("userData", JSON.stringify(userData));
    document.getElementById("userDisplayName").textContent = userData.username;

    // Remove query parameters from URL for cleaner navigation
    window.history.replaceState({}, document.title, window.location.pathname);

    // Show GitHub extra info section if needed
    document.getElementById("githubExtraDiv").style.display = "block";
  }
})();
// ------------------------------
// GitHub Extra Info Submission
// ------------------------------
document.getElementById("githubExtraSubmit").addEventListener("click", () => {
  const gameplayUsername = document.getElementById("githubGameplayUsername").value.trim();
  const avatarInputs = document.getElementsByName("githubAvatar");
  let avatarUrl = "";
  avatarInputs.forEach((input) => {
    if (input.checked) avatarUrl = input.value;
  });
  if (!gameplayUsername || !avatarUrl) {
    document.getElementById("githubExtraError").textContent =
      "Gameplay username and avatar are required.";
    return;
  }
  // Check duplicate among GitHub users.
  let allGithubUsers = JSON.parse(localStorage.getItem("githubUsers") || "[]");
  if (allGithubUsers.includes(gameplayUsername)) {
    document.getElementById("githubExtraError").textContent =
      "This gameplay username is already used. Please choose another.";
    return;
  }
  // Update current user info:
  userData.username = gameplayUsername;
  userData.avatar = avatarUrl;
  localStorage.setItem("userData", JSON.stringify(userData));
  // Also update global list:
  allGithubUsers.push(gameplayUsername);
  localStorage.setItem("githubUsers", JSON.stringify(allGithubUsers));
  document.getElementById("userDisplayName").textContent = gameplayUsername;
  document.getElementById("githubExtraDiv").style.display = "none";
});

// ------------------------------
// Normal Account: Sign Up / Sign In
// ------------------------------
document.getElementById("normalSignupBtn").addEventListener("click", () => {
  const username = document.getElementById("normalUsername").value.trim();
  const password = document.getElementById("normalSignupPassword").value;
  const character = document.getElementById("normalCharacter").value.trim();
  const errorMsg = document.getElementById("normalAuthError");

  if (!username || !character) {
    errorMsg.textContent = "Username and character are required.";
    return;
  }
  // For normal users, duplicate usernames are allowed.
  const normalUser = {
    username,
    password: password || "", // May be empty on sign‐up; can be set later.
    character,
    isGithub: false,
    createdAt: new Date().toISOString()
  };
  // Save this normal user (simulate multiple accounts by saving under 'normalUser'; in reality, a file would list many users)
  localStorage.setItem("normalUser", JSON.stringify(normalUser));
  userData = normalUser;
  localStorage.setItem("userData", JSON.stringify(userData));
  document.getElementById("userDisplayNameNonGithub").textContent = username;
  errorMsg.textContent = "";
  showSection("downloadContent");
});

document.getElementById("normalSignInBtn").addEventListener("click", () => {
  const username = document.getElementById("normalUsername").value.trim();
  const password = document.getElementById("normalSignInPassword").value;
  const errorMsg = document.getElementById("normalAuthError");
  if (!username) {
    errorMsg.textContent = "Please enter your username.";
    return;
  }
  const storedUser = localStorage.getItem("normalUser");
  if (!storedUser) {
    errorMsg.textContent = "No account found. Please sign up first.";
    return;
  }
  const normalUser = JSON.parse(storedUser);
  // If password is required, check it.
  if (normalUser.password && normalUser.password !== password) {
    errorMsg.textContent = "Incorrect password.";
    return;
  }
  if (!normalUser.character || normalUser.character.trim() === "") {
    errorMsg.textContent =
      "No character found. Please sign up and choose a character.";
    return;
  }
  userData = normalUser;
  localStorage.setItem("userData", JSON.stringify(userData));
  document.getElementById("userDisplayNameNonGithub").textContent = username;
  errorMsg.textContent = "";
  showSection("downloadContent");
});

// (Optional: You can reveal the sign in password field if the uploaded game file requires it)
// For example, listen for file input change:
document.getElementById("normalGameFile").addEventListener("change", (e) => {
  // In a full implementation, read file and if file indicates password protection, display the password field.
  // For our demo, we always display it.
  document.getElementById("normalSignInPassword").style.display = "block";
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
document.getElementById("logoutTestBtn").addEventListener("click", () => {
  localStorage.removeItem("userData");
  showSection("authSection");
});

// ------------------------------
// Daily Rewards (for GitHub live mode only)
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
  if (userData.isTest) {
    document.getElementById("testCoinDisplay").textContent = userData.coins || 0;
  }
}

function updatePositionDisplay() {
  document.getElementById("posX").textContent = (userData.position && userData.position.x) || 0;
  document.getElementById("posY").textContent = (userData.position && userData.position.y) || 0;
  if (userData.isTest) {
    document.getElementById("testPosX").textContent = (userData.position && userData.position.x) || 0;
    document.getElementById("testPosY").textContent = (userData.position && userData.position.y) || 0;
  }
}

function updateOfflineStatus() {
  document.getElementById("offlineStatus").textContent = userData.offlineMode ? "Offline" : "Online";
  document.getElementById("friendsBtn").style.display = userData.offlineMode ? "none" : "inline-block";
  if (userData.offlineMode) {
    showLiveSubSection("menuContent");
  }
}

// ------------------------------
// Map Functionality (Live Mode)
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

// Process clicks on map areas.
document.querySelectorAll("map[name='gameMap'] area").forEach((area) => {
  area.addEventListener("click", (event) => {
    event.preventDefault();
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
// Shop Functionality (Live Mode)
// ------------------------------
document.getElementById("backToMenuFromShop").addEventListener("click", () => {
  showLiveSubSection("menuContent");
});
function updateShop() {
  const shopItemsDiv = document.getElementById("shopItems");
  shopItemsDiv.innerHTML = "";
  spells.forEach((spell) => {
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
// Friends & Duel Functionality (Live Mode, GitHub only)
// ------------------------------
function updateFriendList() {
  if (userData.offlineMode) return;
  const friendListDiv = document.getElementById("friendList");
  friendListDiv.innerHTML = "";
  friendList.forEach((friend) => {
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
// Toggle Offline Mode (GitHub only)
// ------------------------------
document.getElementById("toggleOfflineBtn").addEventListener("click", () => {
  userData.offlineMode = !userData.offlineMode;
  localStorage.setItem("userData", JSON.stringify(userData));
  updateOfflineStatus();
  alert("Offline mode " + (userData.offlineMode ? "enabled" : "disabled") +
    ". Friends and duel options are " + (userData.offlineMode ? "hidden" : "available") + ".");
});

// ------------------------------
// Settings Sub-Section Functions
// ------------------------------
document.getElementById("updatePasswordBtn").addEventListener("click", () => {
  const newPass = document.getElementById("newPassword").value;
  if (!newPass) {
    alert("Please enter a new password.");
    return;
  }
  userData.password = newPass;
  localStorage.setItem("userData", JSON.stringify(userData));
  alert("Password updated.");
});

document.getElementById("transferDataBtn").addEventListener("click", () => {
  // Transfer data from an uploaded game JSON file
  const fileInput = document.getElementById("transferGameFile");
  if (fileInput.files.length === 0) {
    alert("Please select a file to transfer data from.");
    return;
  }
  const file = fileInput.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const transferredData = JSON.parse(e.target.result);
      // Merge transferred data into userData (avoid overwriting vital fields)
      userData = { ...userData, ...transferredData };
      localStorage.setItem("userData", JSON.stringify(userData));
      updateCoinDisplay();
      updatePositionDisplay();
      alert("Data transferred successfully.");
    } catch (err) {
      alert("Error transferring data. Please ensure the file is valid.");
    }
  };
  reader.readAsText(file);
});

// Test Portal: When testPageBtn is clicked, create/activate test portal.
document.getElementById("testPageBtn").addEventListener("click", () => {
  // For testing, we simulate a test portal creation if not already set.
  // Also require a password for test portal entry. (Hardcode a value for this demo.)
  const testPassword = prompt("Enter the Test Portal password:");
  const expectedTestPassword = "test123"; // Set your test password here.
  if (testPassword !== expectedTestPassword) {
    alert("Incorrect test portal password.");
    return;
  }
  // Create test portal data.
  userData.isTest = true;
  // Set expiration time 30 days from now.
  userData.expiry = Date.now() + testPortalExpirationDays * 24 * 60 * 60 * 1000;
  // Save test portal info.
  localStorage.setItem("userData", JSON.stringify(userData));
  document.getElementById("testUserDisplayName").textContent = userData.username;
  showSection("testPortalContent");
});

// Test Portal Navigation
document.getElementById("testMenuBtn").addEventListener("click", () => {
  showTestSubSection("testMenuContent");
});
document.getElementById("testMapBtn").addEventListener("click", () => {
  showTestSubSection("testMapContainer");
});
document.getElementById("testShopBtn").addEventListener("click", () => {
  showTestSubSection("testShopContainer");
});
document.getElementById("testSettingsBtn").addEventListener("click", () => {
  showTestSubSection("testSettingsContent");
});
document.getElementById("logoutTestBtn").addEventListener("click", () => {
  localStorage.removeItem("userData");
  showSection("authSection");
});
document.getElementById("backToTestMenuFromMap").addEventListener("click", () => {
  showTestSubSection("testMenuContent");
});
document.getElementById("backToTestMenuFromShop").addEventListener("click", () => {
  showTestSubSection("testMenuContent");
});
document.getElementById("backToTestMenuFromSettings").addEventListener("click", () => {
  showTestSubSection("testMenuContent");
});
document.getElementById("testUpdatePasswordBtn").addEventListener("click", () => {
  const testNewPass = document.getElementById("testNewPassword").value;
  if (!testNewPass) {
    alert("Please enter a new password.");
    return;
  }
  userData.password = testNewPass;
  localStorage.setItem("userData", JSON.stringify(userData));
  alert("Test portal password updated.");
});

// ------------------------------
// Offline Mode / Download Mode Functions (Non-GitHub)
// ------------------------------
document.getElementById("viewMapBtn").addEventListener("click", () => {
  const offlineDiv = document.getElementById("offlineMapBadges");
  offlineDiv.style.display = offlineDiv.style.display === "none" ? "block" : "none";
});
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
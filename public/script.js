// ===== Helper Functions =====
function showSection(id) {
  document.querySelectorAll(".page").forEach(el => el.classList.remove("active"));
  let target = document.getElementById(id);
  if (target) target.classList.add("active");
}

function showLiveSubSection(id) {
  document.querySelectorAll(".liveSubSection").forEach(el => el.classList.remove("active"));
  let target = document.getElementById(id);
  if (target) target.classList.add("active");
}

function setStatusMessage(elId, msg) {
  let el = document.getElementById(elId);
  if (el) el.textContent = msg;
}

// ===== Global Variables =====
let userData = {}; // Session data stored in sessionStorage; cleared on tab close
const coinsReward = 100;
const rewardInterval = 12 * 60 * 60 * 1000; // 12 hours in ms
let plusActive = false; // Flag for paid plus subscription

// Dummy Data
const friendList = [{ username: "Alice" }, { username: "Bob" }, { username: "Charlie" }];
const spells = [
  { name: "Fire Spell", damage: 20, price: 250 },
  { name: "Ice Spell", damage: 15, price: 200 },
  { name: "Lightning Spell", damage: 25, price: 300 }
];
const exerciseStoreItems = [
  { name: "Push Ups", price: 100 },
  { name: "Squats", price: 120 },
  { name: "Plank", price: 150 }
];

// ===== Session Handling =====
function saveUserSession() {
  sessionStorage.setItem("userData", JSON.stringify(userData));
}

function loadUserSession() {
  let data = sessionStorage.getItem("userData");
  if (data) {
    try {
      userData = JSON.parse(data);
    } catch (e) {
      console.error("Error parsing session data", e);
    }
  }
}

window.addEventListener("beforeunload", () => {
  sessionStorage.removeItem("userData");
});

// ===== Initialization =====
document.addEventListener("DOMContentLoaded", () => {
  loadUserSession();
  if (Object.keys(userData).length > 0) {
    if (userData.isGithub) {
      if (userData.coins === undefined) userData.coins = 0;
      if (!userData.position) userData.position = { x: 0, y: 0 };
      if (userData.offlineMode === undefined) userData.offlineMode = false;
      updateCoinDisplay();
      updateOfflineStatus();
      if (!userData.character || userData.character.trim() === "") {
        let newChar = prompt("Please choose your character:") || "DefaultHero";
        userData.character = newChar;
        saveUserSession();
      }
      document.getElementById("userDisplayName").textContent = userData.username || userData.email;
      showSection("liveGameContent");
      populateWorldSelection();
      document.getElementById("plusPlanBtn").style.display = userData.plus ? "inline-block" : "none";
    } else {
      document.getElementById("userDisplayNameNonGithub").textContent = userData.username;
      showSection("downloadContent");
    }
  }
});

// ===== OAuth Handling =====
document.getElementById("githubLoginBtn").addEventListener("click", () => {
  window.location.href =
    "https://github.com/login/oauth/authorize?client_id=Ov23liVGrguwGKyy3qly&scope=read:user%20user:email";
});

(function handleOAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  if (params.has("code")) {
    // Simulated GitHub login
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
    saveUserSession();
    document.getElementById("userDisplayName").textContent = userData.username;
    window.history.replaceState({}, document.title, window.location.pathname);
    showSection("liveGameContent");
    document.getElementById("githubExtraDiv").style.display = "block";
  }
})();

document.getElementById("githubExtraSubmit").addEventListener("click", () => {
  const gameplayUsername = document.getElementById("githubGameplayUsername").value.trim();
  const avatarInputs = document.getElementsByName("githubAvatar");
  let avatarUrl = "";
  avatarInputs.forEach(input => { if (input.checked) avatarUrl = input.value; });
  if (!gameplayUsername || !avatarUrl) {
    setStatusMessage("githubExtraError", "Gameplay username and avatar are required.");
    return;
  }
  userData.username = gameplayUsername;
  userData.avatar = avatarUrl;
  saveUserSession();
  let allGithubUsers = JSON.parse(sessionStorage.getItem("githubUsers") || "[]");
  if (allGithubUsers.includes(gameplayUsername)) {
    setStatusMessage("githubExtraError", "This gameplay username is already used. Choose another.");
    return;
  }
  allGithubUsers.push(gameplayUsername);
  sessionStorage.setItem("githubUsers", JSON.stringify(allGithubUsers));
  document.getElementById("userDisplayName").textContent = gameplayUsername;
  document.getElementById("githubExtraDiv").style.display = "none";
});

// ===== Normal Account Functions =====
document.getElementById("normalSignupBtn").addEventListener("click", () => {
  const username = document.getElementById("normalUsername").value.trim();
  const password = document.getElementById("normalSignupPassword").value;
  const character = document.getElementById("normalCharacter") ? document.getElementById("normalCharacter").value.trim() : "";
  let errorMsg = document.getElementById("normalAuthError");
  if (!username || !character) {
    errorMsg.textContent = "Username and character are required.";
    return;
  }
  const normalUser = { username, password: password || "", character, isGithub: false, createdAt: new Date().toISOString() };
  sessionStorage.setItem("normalUser", JSON.stringify(normalUser));
  userData = normalUser;
  saveUserSession();
  document.getElementById("userDisplayNameNonGithub").textContent = username;
  errorMsg.textContent = "";
  showSection("downloadContent");
});

document.getElementById("normalSignInBtn").addEventListener("click", () => {
  const username = document.getElementById("normalUsername").value.trim();
  const password = document.getElementById("normalSignInPassword").value;
  let errorMsg = document.getElementById("normalAuthError");
  if (!username) { errorMsg.textContent = "Enter your username."; return; }
  const storedUser = sessionStorage.getItem("normalUser");
  if (!storedUser) { errorMsg.textContent = "No account found. Sign up first."; return; }
  const normalUser = JSON.parse(storedUser);
  if (normalUser.password && normalUser.password !== password) {
    errorMsg.textContent = "Incorrect password.";
    return;
  }
  if (!normalUser.character || normalUser.character.trim() === "") {
    errorMsg.textContent = "No character found. Sign up and choose one.";
    return;
  }
  userData = normalUser;
  saveUserSession();
  document.getElementById("userDisplayNameNonGithub").textContent = username;
  errorMsg.textContent = "";
  showSection("downloadContent");
});

document.getElementById("normalGameFile").addEventListener("change", () => {
  document.getElementById("normalSignInPassword").style.display = "block";
});

// ===== Logout =====
document.getElementById("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem("userData");
  showSection("authSection");
});

document.getElementById("logoutBtnNonGithub").addEventListener("click", () => {
  sessionStorage.removeItem("userData");
  showSection("authSection");
});

// ===== Daily Rewards (GitHub Live) =====
document.getElementById("dailyRewardBtn").addEventListener("click", () => {
  if (!userData.isGithub) return;
  let now = Date.now();
  if (!userData.lastReward || now - userData.lastReward >= rewardInterval) {
    let reward = coinsReward;
    if (plusActive) reward *= 2;
    userData.coins = (userData.coins || 0) + reward;
    userData.lastReward = now;
    saveUserSession();
    updateCoinDisplay();
    setStatusMessage("menuContent", "Received " + reward + " coins!");
  } else {
    let remaining = Math.ceil((rewardInterval - (now - userData.lastReward)) / 60000);
    setStatusMessage("menuContent", "Reward available in " + remaining + " minutes.");
  }
});

// ===== Display Updates =====
function updateCoinDisplay() {
  document.getElementById("coinDisplay").textContent = userData.coins || 0;
}

function updateOfflineStatus() {
  document.getElementById("offlineStatus").textContent = userData.offlineMode ? "Offline" : "Online";
  document.getElementById("friendsBtn").style.display = userData.offlineMode ? "none" : "inline-block";
  if (userData.offlineMode) showLiveSubSection("menuContent");
}

// ===== World Selection =====
function populateWorldSelection() {
  let container = document.getElementById("worldButtons");
  container.innerHTML = "";
  for (let i = 1; i <= 20; i++) {
    let btn = document.createElement("button");
    btn.textContent = "World " + i;
    btn.className = "btn world-btn";
    btn.addEventListener("click", () => {
      setStatusMessage("menuContent", "World " + i + " selected.");
    });
    container.appendChild(btn);
  }
}

// ===== Map Functionality =====
document.getElementById("mapBtn").addEventListener("click", () => { showLiveSubSection("mapContainer"); });
document.getElementById("menuBtn").addEventListener("click", () => { showLiveSubSection("menuContent"); });
document.getElementById("shopBtn").addEventListener("click", () => { showLiveSubSection("shopContainer"); });
document.getElementById("friendsBtn").addEventListener("click", () => { showLiveSubSection("friendsContainer"); });
document.getElementById("settingsBtn").addEventListener("click", () => { showLiveSubSection("settingsContent"); });

document.querySelectorAll("map[name='gameMap'] area").forEach(area => {
  area.addEventListener("click", (event) => {
    event.preventDefault();
    if (area.dataset.forbidden === "true") {
      setStatusMessage("menuContent", "Restricted zone: Access Denied.");
      return;
    }
    if (area.dataset.battle === "monster") {
      let monsterHP = parseInt(area.dataset.monsterhp) || 500;
      let opponent = { username: "Monster", avatar: "https://example.com/monster.png", health: monsterHP };
      enterBattle(opponent);
    } else {
      userData.position = { x: parseInt(area.dataset.x), y: parseInt(area.dataset.y) };
      saveUserSession();
      setStatusMessage("menuContent", "Moved successfully.");
    }
  });
});

document.getElementById("backToMenuFromMap").addEventListener("click", () => { showLiveSubSection("menuContent"); });

// ===== Shop Functionality =====
document.getElementById("backToMenuFromShop").addEventListener("click", () => { showLiveSubSection("menuContent"); });

function updateShop() {
  let shopDiv = document.getElementById("shopItems");
  shopDiv.innerHTML = "";
  spells.forEach(spell => {
    let div = document.createElement("div");
    div.className = "shopItem";
    let title = document.createElement("h3");
    title.textContent = spell.name;
    let price = document.createElement("p");
    price.textContent = "Price: " + spell.price + " coins";
    let btn = document.createElement("button");
    btn.textContent = "Buy " + spell.name;
    btn.addEventListener("click", () => {
      if ((userData.coins || 0) >= spell.price) {
        userData.coins -= spell.price;
        saveUserSession();
        updateCoinDisplay();
        setStatusMessage("shopItems", "Purchased " + spell.name + "!");
        updateShop();
      } else {
        setStatusMessage("shopItems", "Not enough coins!");
      }
    });
    div.append(title, price, btn);
    shopDiv.appendChild(div);
  });
}

document.getElementById("shopBtn").addEventListener("click", updateShop);

// ===== Friends & Duel =====
function updateFriendList() {
  if (userData.offlineMode) return;
  let flist = document.getElementById("friendList");
  flist.innerHTML = "";
  friendList.forEach(friend => {
    let fdiv = document.createElement("div");
    fdiv.className = "friendItem";
    fdiv.textContent = friend.username;
    let friendBtn = document.createElement("button");
    friendBtn.textContent = "Friend";
    friendBtn.addEventListener("click", () => { setStatusMessage("friendList", friend.username + " friended."); });
    let duelBtn = document.createElement("button");
    duelBtn.textContent = "Duel";
    duelBtn.className = "btn duel-btn";
    duelBtn.addEventListener("click", () => { enterBattle({ username: friend.username, avatar: "https://example.com/friend_avatar.png", health: 100 }); });
    fdiv.append(friendBtn, duelBtn);
    flist.appendChild(fdiv);
  });
}

document.getElementById("friendsBtn").addEventListener("click", updateFriendList);

// ===== Toggle Offline Mode =====
document.getElementById("toggleOfflineBtn").addEventListener("click", () => {
  userData.offlineMode = !userData.offlineMode;
  saveUserSession();
  updateOfflineStatus();
  let btn = document.getElementById("toggleOfflineBtn");
  btn.textContent = userData.offlineMode ? "Online Mode" : "Play Offline";
  setStatusMessage("menuContent", "Switched to " + (userData.offlineMode ? "Offline" : "Online") + " mode.");
});

// ===== Settings =====
document.getElementById("updatePasswordBtn").addEventListener("click", () => {
  let np = document.getElementById("newPassword").value;
  if (!np) { setStatusMessage("settingsContent", "Enter a new password."); return; }
  userData.password = np;
  saveUserSession();
  setStatusMessage("settingsContent", "Password updated.");
});

document.getElementById("updateUsernameBtn").addEventListener("click", () => {
  let nu = document.getElementById("editUsername").value.trim();
  if (!nu) { setStatusMessage("settingsContent", "Enter a new username."); return; }
  userData.username = nu;
  saveUserSession();
  setStatusMessage("settingsContent", "Username updated.");
});

document.getElementById("updateAvatarBtn").addEventListener("click", () => {
  const avatarInputs = document.getElementsByName("settingsAvatar");
  let newAvatar = "";
  avatarInputs.forEach(input => { if (input.checked) newAvatar = input.value; });
  if (!newAvatar) { setStatusMessage("settingsContent", "Select an avatar."); return; }
  userData.avatar = newAvatar;
  saveUserSession();
  setStatusMessage("settingsContent", "Avatar updated.");
});

document.getElementById("deleteAccountBtn").addEventListener("click", () => {
  if (confirm("Are you sure you wish to delete your account? This cannot be undone.")) {
    sessionStorage.removeItem("userData");
    setStatusMessage("settingsContent", "Account deleted.");
    showSection("authSection");
  }
});

document.getElementById("transferDataBtn").addEventListener("click", () => {
  let fileInput = document.getElementById("transferGameFile");
  if (fileInput.files.length === 0) { setStatusMessage("settingsContent", "Select a file to transfer."); return; }
  let reader = new FileReader();
  reader.onload = (e) => {
    try {
      let transferred = JSON.parse(e.target.result);
      userData = { ...userData, ...transferred };
      saveUserSession();
      updateCoinDisplay();
      setStatusMessage("settingsContent", "Data transferred successfully.");
    } catch (err) {
      setStatusMessage("settingsContent", "Data transfer error: invalid file.");
    }
  };
  reader.readAsText(fileInput.files[0]);
});

document.getElementById("settingsBtn").addEventListener("click", () => { updateExerciseStore(); updateExerciseInventory(); });
document.getElementById("backToMenuFromSettings").addEventListener("click", () => { showLiveSubSection("menuContent"); });

// ===== Paid Subscription (Plus Plan) =====
document.getElementById("plusPlanBtn").addEventListener("click", () => { showSection("plusPlanPage"); });

document.getElementById("subscribePaidBtn").addEventListener("click", () => {
  plusActive = true;
  userData.plus = true;
  saveUserSession();
  setStatusMessage("settingsContent", "Subscribed to Plus Plan: rewards and damage doubled!");
  document.getElementById("plusStatus").textContent = "Plus Active";
});

document.getElementById("unsubscribePaidBtn").addEventListener("click", () => {
  plusActive = false;
  userData.plus = false;
  saveUserSession();
  setStatusMessage("settingsContent", "Plus Plan unsubscribed.");
  document.getElementById("plusStatus").textContent = "";
});

document.getElementById("backFromPlusPlan").addEventListener("click", () => { showSection("liveGameContent"); });

// ===== Battle Functionality =====
function enterBattle(opponent) {
  document.getElementById("playerAvatar").src = userData.avatar || "";
  document.getElementById("playerHealth").style.width = "100%";
  document.getElementById("playerHealth").textContent = "100%";
  if (opponent) {
    document.getElementById("opponentAvatar").src = opponent.avatar || "";
    document.getElementById("opponentHealth").style.width = "100%";
    document.getElementById("opponentHealth").textContent = "100%";
  }
  showLiveSubSection("battlePage");
}

document.getElementById("attackBtn").addEventListener("click", () => {
  let playerDamage = plusActive ? 20 : 10;
  let oppDamage = plusActive ? 20 : 10;
  let oppBar = document.getElementById("opponentHealth");
  let oppWidth = parseInt(oppBar.style.width);
  oppWidth = Math.max(oppWidth - playerDamage, 0);
  oppBar.style.width = oppWidth + "%";
  oppBar.textContent = oppWidth + "%";
  
  let playerBar = document.getElementById("playerHealth");
  let playerWidth = parseInt(playerBar.style.width);
  playerWidth = Math.max(playerWidth - oppDamage, 0);
  playerBar.style.width = playerWidth + "%";
  playerBar.textContent = playerWidth + "%";
  
  if (oppWidth === 0 || playerWidth === 0) { showLiveSubSection("menuContent"); }
});

document.getElementById("defendBtn").addEventListener("click", () => { setStatusMessage("menuContent", "Defense activated!"); });
document.getElementById("retreatBtn").addEventListener("click", () => { showLiveSubSection("menuContent"); });
document.getElementById("endBattleBtn").addEventListener("click", () => { showLiveSubSection("menuContent"); });

// ===== Exercise Management =====
function updateExerciseStore() {
  let storeDiv = document.getElementById("storeItems");
  if (!storeDiv) return;
  storeDiv.innerHTML = "";
  exerciseStoreItems.forEach(item => {
    let div = document.createElement("div");
    div.className = "shopItem";
    div.innerHTML = `<h3>${item.name}</h3><p>Price: ${item.price} coins</p>`;
    let btn = document.createElement("button");
    btn.textContent = "Buy " + item.name;
    btn.addEventListener("click", () => {
      if ((userData.coins || 0) >= item.price) {
        userData.coins -= item.price;
        let inv = JSON.parse(sessionStorage.getItem("exerciseInventory") || "[]");
        inv.push(item);
        sessionStorage.setItem("exerciseInventory", JSON.stringify(inv));
        saveUserSession();
        updateCoinDisplay();
        setStatusMessage("settingsContent", "Purchased " + item.name + ".");
        updateExerciseInventory();
      } else { setStatusMessage("settingsContent", "Not enough coins for " + item.name + "."); }
    });
    div.appendChild(btn);
    storeDiv.appendChild(div);
  });
}

function updateExerciseInventory() {
  let invDiv = document.getElementById("exerciseList");
  if (!invDiv) return;
  invDiv.innerHTML = "";
  let inv = JSON.parse(sessionStorage.getItem("exerciseInventory") || "[]");
  inv.forEach((item, idx) => {
    let p = document.createElement("p");
    p.textContent = item.name;
    invDiv.appendChild(p);
  });
  let eqSelect = document.getElementById("exerciseEquipSelect");
  if (eqSelect) {
    eqSelect.innerHTML = "";
    inv.forEach((item, idx) => {
      let option = document.createElement("option");
      option.value = idx;
      option.textContent = item.name;
      eqSelect.appendChild(option);
    });
  }
}

document.getElementById("equipExerciseBtn").addEventListener("click", () => {
  let eqSelect = document.getElementById("exerciseEquipSelect");
  let coord = document.getElementById("exerciseEquipCoord").value.trim();
  if (eqSelect.selectedIndex < 0 || !coord) { 
    setStatusMessage("settingsContent", "Select an exercise and provide a coordinate."); 
    return; 
  }
  let inv = JSON.parse(sessionStorage.getItem("exerciseInventory") || "[]");
  userData.equippedExercise = { exercise: inv[eqSelect.selectedIndex], coordinate: coord };
  saveUserSession();
  setStatusMessage("settingsContent", "Equipped " + inv[eqSelect.selectedIndex].name + " at " + coord + ".");
});

document.getElementById("backFromExercises").addEventListener("click", () => { showSection("settingsContent"); });
// magic1.js
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

let scene, camera, renderer, controls;
let userData = { name: '', position: null };
let hasSavedThisSession = false;
let adTimer = 3, adInterval, inAd = false;

// DOM refs
const loginScreen      = document.getElementById('login-screen');
const videoScreen      = document.getElementById('video-screen');
const videoErrorScreen = document.getElementById('video-error-screen');
const introVideo       = document.getElementById('intro-video');
const errorContinueBtn = document.getElementById('error-continue-btn');
const adScreen         = document.getElementById('ad-screen');
const adCloseBtn       = document.getElementById('ad-close-btn');
const adTimerSpan      = document.getElementById('ad-timer');
const popup            = document.getElementById('warning-popup');
const popupMsg         = document.getElementById('popup-message');
const popupOk          = document.getElementById('popup-ok-btn');
const canvas           = document.getElementById('game-canvas');
const pauseBtn         = document.getElementById('pause-button');
const pauseScreen      = document.getElementById('pause-screen');
const saveBtn          = document.getElementById('save-btn');
const closeBtn         = document.getElementById('close-btn');
const continueBtn      = document.getElementById('continue-btn');
const confirmSave      = document.getElementById('confirm-save');
const confirmLogout    = document.getElementById('confirm-logout');
const confirmSaveYes   = document.getElementById('confirm-save-yes');
const confirmSaveNo    = document.getElementById('confirm-save-no');
const confirmLogoutYes = document.getElementById('confirm-logout-yes');
const confirmLogoutNo  = document.getElementById('confirm-logout-no');
const loadInput        = document.getElementById('load-input');
const signupBtn        = document.getElementById('signup-btn');
const loginBtn         = document.getElementById('login-btn');
const usernameInput    = document.getElementById('username');

// Right-click disabled by default
document.addEventListener('contextmenu', e => e.preventDefault());

// Billboard definitions
const billboards = [
  { pos: new THREE.Vector3(10, 5, -20), texture: 'billboard1.png' },
  { pos: new THREE.Vector3(-25, 5, 15), texture: 'billboard2.png' }
];

// Show custom warning popup
function showPopup(message) {
  popupMsg.textContent = message;
  popup.classList.remove('hidden');
}
popupOk.onclick = () => popup.classList.add('hidden');

// Sign Up
signupBtn.onclick = () => {
  const name = usernameInput.value.trim();
  if (!name) {
    showPopup('Please enter a name to sign up.');
    return;
  }
  userData.name = name;
  loginScreen.classList.add('hidden');
  startVideo();
};

// Log In
loginBtn.onclick = () => loadInput.click();

loadInput.onchange = e => {
  const file = e.target.files[0];
  if (!file) {
    showPopup('No file selected.');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      userData = JSON.parse(reader.result);
      loginScreen.classList.add('hidden');
      startVideo();
    } catch {
      showPopup('Invalid save file format.');
    }
  };
  reader.readAsText(file);
};

// Start intro video
function startVideo() {
  videoScreen.classList.remove('hidden');
  introVideo.play();
}

introVideo.onerror = () => {
  videoScreen.classList.add('hidden');
  videoErrorScreen.classList.remove('hidden');
};

introVideo.onended = () => launchGame();
errorContinueBtn.onclick = () => {
  videoErrorScreen.classList.add('hidden');
  launchGame();
};

// Main game init
function launchGame() {
  videoScreen.classList.add('hidden');
  initScene();
  animate();
}

// Initialize 3D world
function initScene() {
  pauseBtn.classList.remove('hidden');

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 2, 5);

  controls = new PointerLockControls(camera, canvas);
  canvas.addEventListener('click', () => controls.lock());

  const move = { f: 0, b: 0, l: 0, r: 0 };
  document.addEventListener('keydown', e => {
    if (e.code === 'KeyW') move.f = 1;
    if (e.code === 'KeyS') move.b = 1;
    if (e.code === 'KeyA') move.l = 1;
    if (e.code === 'KeyD') move.r = 1;
  });
  document.addEventListener('keyup', e => {
    if (e.code === 'KeyW') move.f = 0;
    if (e.code === 'KeyS') move.b = 0;
    if (e.code === 'KeyA') move.l = 0;
    if (e.code === 'KeyD') move.r = 0;
  });

  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1));

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshLambertMaterial({ color: 0x654321 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const ring = new THREE.Group();
  for (let i = 0; i < 32; i++) {
    const a = i / 32 * Math.PI * 2;
    const r = 17;
    const tree = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0x55aa55 })
    );
    tree.position.set(Math.cos(a) * r, 4, Math.sin(a) * r);
    ring.add(tree);
  }
  scene.add(ring);

  const loader = new THREE.TextureLoader();
  billboards.forEach(b => {
    loader.load(b.texture, texture => {
      const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(8, 6), mat);
      mesh.position.copy(b.pos);
      mesh.userData.isBillboard = true;
      scene.add(mesh);
    });
  });

  if (userData.position) {
    camera.position.set(
      userData.position.x,
      userData.position.y,
      userData.position.z
    );
  } else {
    userData.position = camera.position.clone();
  }

  controls.moveState = move;
}

// Animate game world
function animate() {
  requestAnimationFrame(animate);

  if (!inAd && controls.isLocked) {
    const dt = 0.05;
    const move = controls.moveState;
    camera.translateZ((move.b - move.f) * dt * 10);
    camera.translateX((move.l - move.r) * dt * 10);

    billboards.forEach(b => {
      const dist = camera.position.distanceTo(b.pos);
      if (dist < 5) showAd();
    });
  }

  renderer.render(scene, camera);
}

// Ads
function showAd() {
  if (inAd) return;
  inAd = true;
  adTimer = 3;
  adTimerSpan.textContent = adTimer;
  adCloseBtn.disabled = true;
  adScreen.classList.remove('hidden');

  adInterval = setInterval(() => {
    adTimer--;
    adTimerSpan.textContent = adTimer;
    if (adTimer <= 0) {
      clearInterval(adInterval);
      adCloseBtn.disabled = false;
      adCloseBtn.classList.add('enabled');
    }
  }, 1000);
}
adCloseBtn.onclick = () => {
  if (adTimer > 0) return;
  adScreen.classList.add('hidden');
  inAd = false;
};

// Pause menu
pauseBtn.onclick = () => pauseScreen.classList.remove('hidden');
continueBtn.onclick = () => pauseScreen.classList.add('hidden');
saveBtn.onclick = saveGame;
closeBtn.onclick = () => confirmSave.classList.remove('hidden');
confirmSaveYes.onclick = () => {
  saveGame();
  confirmSave.classList.add('hidden');
  confirmLogout.classList.remove('hidden');
};
confirmSaveNo.onclick = () => {
  confirmSave.classList.add('hidden');
  confirmLogout.classList.remove('hidden');
};
confirmLogoutYes.onclick = logout;
confirmLogoutNo.onclick = () => confirmLogout.classList.add('hidden');

function saveGame() {
  userData.position = {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z
  };
  const blob = new Blob([JSON.stringify(userData, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${userData.name}_save.json`;
  a.click();
  URL.revokeObjectURL(url);
  hasSavedThisSession = true;
}

// Logout function
function logout() {
  userData = { name: '', position: null };
  hasSavedThisSession = false;
  while (scene.children.length) {
    scene.remove(scene.children[0]);
  }
  pauseScreen.classList.add('hidden');
  loginScreen.classList.remove('hidden');
  pauseBtn.classList.add('hidden');
}

// Warn before closing if unsaved
window.addEventListener('beforeunload', e => {
  if (!hasSavedThisSession) {
    e.preventDefault();
    e.returnValue = '';
  }
});
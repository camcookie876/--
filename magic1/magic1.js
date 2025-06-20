// magic1.js
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

let scene, camera, renderer, controls;
let userData = { name:'', position:null, dialog:'' };
let hasSavedThisSession = false;
let adTimer = 3, adInterval, inAd = false;

// DOM Refs
const loginScreen      = document.getElementById('login-screen');
const videoScreen      = document.getElementById('video-screen');
const videoErrorScreen = document.getElementById('video-error-screen');
const introVideo       = document.getElementById('intro-video');
const errorContinueBtn = document.getElementById('error-continue-btn');
const adScreen         = document.getElementById('ad-screen');
const adCloseBtn       = document.getElementById('ad-close-btn');
const adTimerSpan      = document.getElementById('ad-timer');
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

// BILLBOARDS CONFIG
const billboards = [
  { pos: new THREE.Vector3(10, 5, -20), texture: 'billboard1.png' },
  { pos: new THREE.Vector3(-25, 5, 15), texture: 'billboard2.png' }
];

// 1) AUTH FLOW
signupBtn.onclick = () => {
  const n = usernameInput.value.trim();
  if (!n) return alert('Enter a name.');
  userData.name = n;
  startVideo();
};
loginBtn.onclick = () => loadInput.click();
loadInput.onchange = e => {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try { userData = JSON.parse(r.result); startVideo(); }
    catch { alert('Invalid save file.'); }
  };
  r.readAsText(f);
};

function startVideo() {
  loginScreen.classList.add('hidden');
  videoScreen.classList.remove('hidden');
  introVideo.play();
}

// 2) VIDEO HANDLERS
introVideo.onerror = () => {
  videoScreen.classList.add('hidden');
  videoErrorScreen.classList.remove('hidden');
};
introVideo.onended = () => launchGame();
errorContinueBtn.onclick = () => {
  videoErrorScreen.classList.add('hidden');
  launchGame();
};

function launchGame() {
  videoScreen.classList.add('hidden');
  initScene();
  animate();
}

// 3) THREE.JS + FIRST-PERSON SETUP
function initScene() {
  // show pause on map
  pauseBtn.classList.remove('hidden');

  renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(0,2,5);

  controls = new PointerLockControls(camera, canvas);
  canvas.addEventListener('click', () => controls.lock());
  controls.addEventListener('lock', () => { /* hide cursor UI */ });
  controls.addEventListener('unlock', () => { /* show cursor UI */ });

  // movement state
  const move = { forward:0, backward:0, left:0, right:0 };
  document.addEventListener('keydown', e => {
    if      (e.code==='KeyW') move.forward=1;
    else if (e.code==='KeyS') move.backward=1;
    else if (e.code==='KeyA') move.left=1;
    else if (e.code==='KeyD') move.right=1;
  });
  document.addEventListener('keyup', e => {
    if      (e.code==='KeyW') move.forward=0;
    else if (e.code==='KeyS') move.backward=0;
    else if (e.code==='KeyA') move.left=0;
    else if (e.code==='KeyD') move.right=0;
  });

  // light & ground
  scene.add(new THREE.HemisphereLight(0xffffff,0x444444,1));
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshLambertMaterial({ color:0x654321 })
  );
  ground.rotation.x = -Math.PI/2;
  scene.add(ground);

  // tree ring barrier
  const barrier = new THREE.Group();
  for (let i=0; i<32; i++) {
    const a = i/32*Math.PI*2, r=17;
    const tree = new THREE.Mesh(
      new THREE.CylinderGeometry(1,1,8,8),
      new THREE.MeshLambertMaterial({ color:0x55aa55 })
    );
    tree.position.set(Math.cos(a)*r,4,Math.sin(a)*r);
    barrier.add(tree);
  }
  scene.add(barrier);

  // billboards
  const loader = new THREE.TextureLoader();
  billboards.forEach(b => {
    loader.load(b.texture, tx=> {
      const mat = new THREE.MeshBasicMaterial({ map:tx, side:THREE.DoubleSide, transparent:true });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(8,6), mat);
      mesh.position.copy(b.pos);
      mesh.userData.isBillboard = true;
      scene.add(mesh);
    });
  });

  // restore or init position
  if (userData.position) {
    camera.position.set(
      userData.position.x,
      userData.position.y,
      userData.position.z
    );
  } else {
    userData.position = camera.position.clone();
  }

  // store movement & scene in closure for animation
  controls.moveState = move;
}

function animate() {
  requestAnimationFrame(animate);

  if (!inAd && controls.isLocked) {
    // basic FPS movement
    const dt = 0.05;
    const ms = controls.moveState;
    camera.translateZ((ms.backward - ms.forward)*dt*10);
    camera.translateX((ms.left - ms.right)*dt*10);

    // detect proximity to billboards
    billboards.forEach(b => {
      const dist = camera.position.distanceTo(b.pos);
      if (dist < 5) showAd();
    });
  }

  renderer.render(scene, camera);
}

// 4) AD OVERLAY LOGIC
function showAd() {
  if (inAd) return;
  inAd = true;
  adTimer = 3;
  adTimerSpan.textContent = adTimer;
  adCloseBtn.disabled = true;
  adScreen.classList.remove('hidden');

  adInterval = setInterval(()=>{
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
  if (adTimer>0) return;
  adScreen.classList.add('hidden');
  inAd = false;
  // resume gameplay at same spot
};

// 5) PAUSE / SAVE / LOGOUT
pauseBtn.onclick = () => pauseScreen.classList.remove('hidden');
continueBtn.onclick = () => pauseScreen.classList.add('hidden');

saveBtn.onclick = saveGame;
closeBtn.onclick = () => confirmSave.classList.remove('hidden');

confirmSaveYes.onclick = () => { saveGame(); confirmSave.classList.add('hidden'); confirmLogout.classList.remove('hidden'); };
confirmSaveNo.onclick  = () => { confirmSave.classList.add('hidden'); confirmLogout.classList.remove('hidden'); };
confirmLogoutYes.onclick = logout;
confirmLogoutNo.onclick  = () => confirmLogout.classList.add('hidden');

function saveGame() {
  userData.position = { x:camera.position.x, y:camera.position.y, z:camera.position.z };
  const blob = new Blob([JSON.stringify(userData, null,2)], { type:'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href       = url;
  a.download   = `${userData.name}_save.json`;
  a.click();
  URL.revokeObjectURL(url);
  hasSavedThisSession = true;
}

function logout() {
  userData = { name:'', position:null, dialog:'' };
  hasSavedThisSession = false;
  while (scene.children.length) scene.remove(scene.children[0]);
  pauseScreen.classList.add('hidden');
  loginScreen.classList.remove('hidden');
  pauseBtn.classList.add('hidden');
}

window.addEventListener('beforeunload', e => {
  if (!hasSavedThisSession) {
    e.preventDefault(); e.returnValue = '';
  }
});
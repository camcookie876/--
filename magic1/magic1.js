// magic1.js
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

let scene, camera, renderer, controls;
let userData = { name:'', position:null };
let hasSavedThisSession = false;
let adTimer = 3, adInterval, inAd = false;
let level = 1;

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
const hud              = document.getElementById('hud');
const userDisplay      = document.getElementById('username-display');
const levelDisplay     = document.getElementById('level-display');

// Disable right-click
document.addEventListener('contextmenu', e => e.preventDefault());

// Pop-up utility
function showPopup(msg) {
  popupMsg.textContent = msg;
  popup.classList.remove('hidden');
}
popupOk.onclick = () => popup.classList.add('hidden');

// Billboard data
const billboards = [
  { pos:new THREE.Vector3(10,5,-20), texture:'billboard1.png' },
  { pos:new THREE.Vector3(-25,5,15), texture:'billboard2.png' }
];

// Collectibles
const collectibles = [];
const COLLECT_COUNT = 10;

// LOADING ANIMATION
const loadingLogo = document.getElementById('loading-logo');
const loadingText = document.getElementById('loading-text');
window.addEventListener('load', () => {
  setTimeout(() => loadingLogo.classList.add('slide'), 100);
  setTimeout(() => loadingText.classList.add('visible'), 1200);
  setTimeout(() => {
    document.getElementById('loading-screen').classList.add('hidden');
    loginScreen.classList.remove('hidden');
  }, 4000);
});

// Auth flow
signupBtn.onclick = () => {
  const name = usernameInput.value.trim();
  if (!name) return showPopup('Please enter a name to sign up.');
  userData.name = name;
  loginScreen.classList.add('hidden');
  startVideo();
};
loginBtn.onclick = () => loadInput.click();
loadInput.onchange = e => {
  const file = e.target.files[0];
  if (!file) return showPopup('No file selected.');
  const r = new FileReader();
  r.onload = () => {
    try {
      userData = JSON.parse(r.result);
      loginScreen.classList.add('hidden');
      startVideo();
    } catch {
      showPopup('Invalid save file format.');
    }
  };
  r.readAsText(file);
};
function startVideo() {
  videoScreen.classList.remove('hidden');
  introVideo.play();
}
introVideo.onerror = () => {
  videoScreen.classList.add('hidden');
  videoErrorScreen.classList.remove('hidden');
};
introVideo.onended = launchGame;
errorContinueBtn.onclick = () => {
  videoErrorScreen.classList.add('hidden');
  launchGame();
};

// Game launch
function launchGame() {
  initScene();
  animate();
  hud.classList.remove('hidden');
  userDisplay.textContent = userData.name;
  levelDisplay.textContent = 'Level: ' + level;
}

// Initialize 3D world
function initScene() {
  pauseBtn.classList.remove('hidden');

  renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,1000);
  camera.position.set(0,2,5);

  controls = new PointerLockControls(camera, canvas);
  canvas.addEventListener('click', () => controls.lock());

  const move = { f:0, b:0, l:0, r:0 };
  document.addEventListener('keydown', e => {
    if (e.code==='KeyW') move.f=1;
    if (e.code==='KeyS') move.b=1;
    if (e.code==='KeyA') move.l=1;
    if (e.code==='KeyD') move.r=1;
  });
  document.addEventListener('keyup', e => {
    if (e.code==='KeyW') move.f=0;
    if (e.code==='KeyS') move.b=0;
    if (e.code==='KeyA') move.l=0;
    if (e.code==='KeyD') move.r=0;
  });
  controls.moveState = move;

  scene.add(new THREE.HemisphereLight(0xffffff,0x444444,1));
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200,200),
    new THREE.MeshLambertMaterial({color:0x654321})
  );
  ground.rotation.x = -Math.PI/2;
  scene.add(ground);

  // Tree barrier
  const ring = new THREE.Group();
  for (let i=0;i<32;i++){
    const a=i/32*Math.PI*2, r=17;
    const t=new THREE.Mesh(
      new THREE.CylinderGeometry(1,1,8,8),
      new THREE.MeshLambertMaterial({color:0x55aa55})
    );
    t.position.set(Math.cos(a)*r,4,Math.sin(a)*r);
    ring.add(t);
  }
  scene.add(ring);

  // Billboards
  const loader = new THREE.TextureLoader();
  billboards.forEach(b=>{
    loader.load(b.texture,tx=>{
      const m=new THREE.MeshBasicMaterial({map:tx,side:THREE.DoubleSide,transparent:true});
      const mesh=new THREE.Mesh(new THREE.PlaneGeometry(8,6),m);
      mesh.position.copy(b.pos);
      mesh.userData.isBillboard=true;
      scene.add(mesh);
    });
  });

  // Create collectibles
  for(let i=0;i<COLLECT_COUNT;i++){
    const sphere=new THREE.Mesh(
      new THREE.SphereGeometry(0.5,16,16),
      new THREE.MeshLambertMaterial({color:0xffdd55})
    );
    sphere.position.set(
      (Math.random()-0.5)*30,
      0.5,
      (Math.random()-0.5)*30
    );
    sphere.userData.collectible=true;
    scene.add(sphere);
    collectibles.push(sphere);
  }

  // Restore position
  if(userData.position){
    camera.position.set(
      userData.position.x,
      userData.position.y,
      userData.position.z
    );
  } else {
    userData.position = camera.position.clone();
  }
}

// Animation loop
function animate(){
  requestAnimationFrame(animate);

  if(!inAd && controls.isLocked){
    const dt=0.05, m=controls.moveState;
    camera.translateZ((m.b-m.f)*dt*10);
    camera.translateX((m.l-m.r)*dt*10);

    // Check billboard proximity
    billboards.forEach(b=>{
      if(camera.position.distanceTo(b.pos)<5) showAd();
    });

    // Check collectibles
    collectibles.forEach((item, idx)=>{
      if(camera.position.distanceTo(item.position)<2){
        scene.remove(item);
        collectibles.splice(idx,1);
        level++;
        levelDisplay.textContent = 'Level: ' + level;
      }
    });
  }

  renderer.render(scene,camera);
}

// Ad logic
function showAd(){
  if(inAd) return;
  inAd=true;
  adTimer=3; adTimerSpan.textContent=adTimer;
  adCloseBtn.disabled=true; adScreen.classList.remove('hidden');
  adInterval=setInterval(()=>{
    adTimer--; adTimerSpan.textContent=adTimer;
    if(adTimer<=0){
      clearInterval(adInterval);
      adCloseBtn.disabled=false; adCloseBtn.classList.add('enabled');
    }
  },1000);
}
adCloseBtn.onclick=()=>{
  if(adTimer>0) return;
  adScreen.classList.add('hidden');
  inAd=false;
};

// Pause / Save / Logout
pauseBtn.onclick = ()=> pauseScreen.classList.remove('hidden');
continueBtn.onclick = ()=> pauseScreen.classList.add('hidden');
saveBtn.onclick = saveGame;
closeBtn.onclick = ()=> confirmSave.classList.remove('hidden');
confirmSaveYes.onclick = ()=>{ saveGame(); confirmSave.classList.add('hidden'); confirmLogout.classList.remove('hidden'); };
confirmSaveNo.onclick = ()=>{ confirmSave.classList.add('hidden'); confirmLogout.classList.remove('hidden'); };
confirmLogoutYes.onclick = logout;
confirmLogoutNo.onclick = ()=> confirmLogout.classList.add('hidden');

function saveGame(){
  userData.position = {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z
  };
  const blob=new Blob([JSON.stringify(userData,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download=`${userData.name}_save.json`;
  a.click(); URL.revokeObjectURL(url);
  hasSavedThisSession=true;
}

function logout(){
  userData={name:'',position:null};
  hasSavedThisSession=false;
  while(scene.children.length) scene.remove(scene.children[0]);
  pauseScreen.classList.add('hidden');
  loginScreen.classList.remove('hidden');
  pauseBtn.classList.add('hidden');
}

window.addEventListener('beforeunload', e=>{
  if(!hasSavedThisSession){
    e.preventDefault(); e.returnValue='';
  }
});
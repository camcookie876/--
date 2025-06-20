// magic1.js

// ——————————————————————————————————
// GLOBALS & INITIAL STATE
// ——————————————————————————————————
let scene, camera, renderer, controls;
let userData = { name: '', position: null, dialog: '' };
let hasSavedThisSession = false;

// DOM REFERENCES
const loginScreen     = document.getElementById('login-screen');
const videoScreen     = document.getElementById('video-screen');
const introVideo      = document.getElementById('intro-video');
const canvas          = document.getElementById('game-canvas');
const textBox         = document.getElementById('text-box');
const pauseBtn        = document.getElementById('pause-button');
const pauseScreen     = document.getElementById('pause-screen');
const saveBtn         = document.getElementById('save-btn');
const closeBtn        = document.getElementById('close-btn');
const continueBtn     = document.getElementById('continue-btn');
const confirmSave     = document.getElementById('confirm-save');
const confirmLogout   = document.getElementById('confirm-logout');
const confirmSaveYes  = document.getElementById('confirm-save-yes');
const confirmSaveNo   = document.getElementById('confirm-save-no');
const confirmLogoutYes = document.getElementById('confirm-logout-yes');
const confirmLogoutNo  = document.getElementById('confirm-logout-no');
const loadInput       = document.getElementById('load-input');
const signupBtn       = document.getElementById('signup-btn');
const loginBtn        = document.getElementById('login-btn');
const usernameInput   = document.getElementById('username');


// ——————————————————————————————————
// 1) AUTH FLOW: SIGNUP & LOGIN
// ——————————————————————————————————
signupBtn.onclick = () => {
  const name = usernameInput.value.trim();
  if (!name) return alert('Please enter a name to sign up.');
  userData.name = name;
  startVideo();
};

loginBtn.onclick = () => {
  loadInput.click();
};

loadInput.onchange = e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      userData = JSON.parse(reader.result);
      startVideo();
    } catch {
      alert('Invalid save file format.');
    }
  };
  reader.readAsText(file);
};

function startVideo() {
  loginScreen.classList.add('hidden');
  videoScreen.classList.remove('hidden');
  introVideo.play();
  introVideo.onended = () => {
    videoScreen.classList.add('hidden');
    initScene();
    animate();
  };
}


// ——————————————————————————————————
// 2) THREE.JS 3D MAP SETUP
// ——————————————————————————————————
function initScene() {
  // Renderer & Scene
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 30, 50);

  // Controls for 360°
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.minDistance = 20;
  controls.maxDistance = 80;

  // Lighting
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
  scene.add(hemi);

  // Ground (brown playable area)
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshLambertMaterial({ color: 0x654321 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // Big circle (characters spawn area)
  const bigCircle = new THREE.Mesh(
    new THREE.CircleGeometry(15, 64),
    new THREE.MeshBasicMaterial({ color: 0x654321 })
  );
  bigCircle.rotation.x = -Math.PI / 2;
  scene.add(bigCircle);

  // Tree outline (light green, non-walkable)
  const treeCount = 32,
        radius    = 17;
  for (let i = 0; i < treeCount; i++) {
    const angle = (i / treeCount) * Math.PI * 2;
    const x = Math.cos(angle) * radius,
          z = Math.sin(angle) * radius;
    const tree = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0x55aa55 })
    );
    tree.position.set(x, 4, z);
    scene.add(tree);
  }

  // Small circle (Bunny Corn spawn)
  const smallCircle = new THREE.Mesh(
    new THREE.CircleGeometry(5, 32),
    new THREE.MeshBasicMaterial({ color: 0x654321 })
  );
  smallCircle.position.set(25, 0.01, 0);
  smallCircle.rotation.x = -Math.PI / 2;
  scene.add(smallCircle);

  // Character placeholders (planar sprites)
  const loader = new THREE.TextureLoader();
  const chars = [
    { name: 'Alex',    pos: [-5, 0, 0], src: 'alex.png'    },
    { name: 'Rose',    pos: [ 0, 0, 5], src: 'rose.png'    },
    { name: 'Grandma', pos: [ 5, 0, 0], src: 'grandma.png' },
    { name: 'Grandpa', pos: [ 0, 0,-5], src: 'grandpa.png' }
  ];
  chars.forEach(c => {
    loader.load(c.src, tex => {
      const mat   = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(5, 8), mat);
      plane.position.set(...c.pos);
      plane.rotation.y = Math.PI; // face camera
      scene.add(plane);
    });
  });

  // Restore or initialize camera position
  if (userData.position) {
    camera.position.copy(new THREE.Vector3(
      userData.position.x,
      userData.position.y,
      userData.position.z
    ));
  } else {
    userData.position = camera.position.clone();
  }
}


// ——————————————————————————————————
// 3) RENDER LOOP
// ——————————————————————————————————
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}


// ——————————————————————————————————
// 4) PAUSE / SAVE / LOGIC
// ——————————————————————————————————
pauseBtn.onclick = () => {
  pauseScreen.classList.remove('hidden');
};

continueBtn.onclick = () => {
  pauseScreen.classList.add('hidden');
};

saveBtn.onclick = () => {
  saveGame();
};

closeBtn.onclick = () => {
  confirmSave.classList.remove('hidden');
};

confirmSaveYes.onclick = () => {
  saveGame();
  confirmSave.classList.add('hidden');
  confirmLogout.classList.remove('hidden');
};

confirmSaveNo.onclick = () => {
  confirmSave.classList.add('hidden');
  confirmLogout.classList.remove('hidden');
};

confirmLogoutYes.onclick = () => {
  logout();
};

confirmLogoutNo.onclick = () => {
  confirmLogout.classList.add('hidden');
};


// ——————————————————————————————————
// UTILITY: SAVE GAME
// ——————————————————————————————————
function saveGame() {
  // Capture current state
  userData.position = {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z
  };
  userData.dialog = textBox.innerText;

  // Create and download JSON
  const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href       = url;
  a.download   = `${userData.name}_save.json`;
  a.click();
  URL.revokeObjectURL(url);

  hasSavedThisSession = true;
}


// ——————————————————————————————————
// UTILITY: LOGOUT & RESET
// ——————————————————————————————————
function logout() {
  // Reset state
  userData = { name: '', position: null, dialog: '' };
  hasSavedThisSession = false;

  // Clear 3D scene
  while (scene.children.length) {
    scene.remove(scene.children[0]);
  }

  // UI reset
  pauseScreen.classList.add('hidden');
  loginScreen.classList.remove('hidden');
  textBox.innerText = '';
}


// ——————————————————————————————————
// WARN ON CLOSE IF UNSAVED
// ——————————————————————————————————
window.addEventListener('beforeunload', e => {
  if (!hasSavedThisSession) {
    e.preventDefault();
    e.returnValue = '';
  }
});
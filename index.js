// Main setup file (index.js)

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Global variables
let scene, camera, renderer, astronaut;
let planets = {};
let controls;
let isFirstPerson = false;
let currentPlanet = null;
let flying = false;
let velocity = new THREE.Vector3(0, 0, 0);
const ASTRONAUT_SPEED = 0.5;
const ASTRONAUT_ROTATION_SPEED = 0.03;

// Solar system data
const solarSystemData = {
  sun: {
    radius: 20,
    texture: 'textures/sun.jpg',
    position: new THREE.Vector3(0, 0, 0),
    facts: [
      "The Sun contains 99.86% of the mass in the Solar System",
      "Surface temperature is about 5,505°C (9,941°F)",
      "The Sun is a G-type main-sequence star (G2V)"
    ]
  },
  mercury: {
    radius: 1.5,
    texture: 'textures/mercury.jpg',
    position: new THREE.Vector3(30, 0, 0),
    orbitRadius: 30,
    orbitSpeed: 0.02,
    rotationSpeed: 0.004,
    facts: [
      "Mercury is the smallest planet in our Solar System",
      "A year on Mercury is just 88 Earth days long",
      "Mercury has a thin atmosphere and no moons"
    ]
  },
  venus: {
    radius: 3.8,
    texture: 'textures/venus.jpg',
    position: new THREE.Vector3(50, 0, 0),
    orbitRadius: 50,
    orbitSpeed: 0.015,
    rotationSpeed: 0.002,
    facts: [
      "Venus rotates in the opposite direction to most planets",
      "A day on Venus is longer than a year on Venus",
      "Venus has a thick toxic atmosphere causing a runaway greenhouse effect"
    ]
  },
  earth: {
    radius: 4,
    texture: 'textures/earth.jpg',
    position: new THREE.Vector3(70, 0, 0),
    orbitRadius: 70,
    orbitSpeed: 0.01,
    rotationSpeed: 0.01,
    facts: [
      "Earth is the only known planet to support life",
      "Our planet is about 4.5 billion years old",
      "71% of Earth's surface is covered in water"
    ]
  },
  mars: {
    radius: 2.1,
    texture: 'textures/mars.jpg',
    position: new THREE.Vector3(90, 0, 0),
    orbitRadius: 90,
    orbitSpeed: 0.008,
    rotationSpeed: 0.009,
    facts: [
      "Mars is known as the Red Planet due to iron oxide on its surface",
      "Mars has the largest dust storms in the Solar System",
      "Mars has two small moons: Phobos and Deimos"
    ]
  },
  jupiter: {
    radius: 12,
    texture: 'textures/jupiter.jpg',
    position: new THREE.Vector3(130, 0, 0),
    orbitRadius: 130,
    orbitSpeed: 0.005,
    rotationSpeed: 0.02,
    facts: [
      "Jupiter is the largest planet in our Solar System",
      "The Great Red Spot is a storm that has been raging for at least 400 years",
      "Jupiter has at least 79 moons"
    ]
  },
  saturn: {
    radius: 10,
    texture: 'textures/saturn.jpg',
    position: new THREE.Vector3(170, 0, 0),
    orbitRadius: 170,
    orbitSpeed: 0.003,
    rotationSpeed: 0.018,
    hasRings: true,
    facts: [
      "Saturn has the most extensive ring system of any planet",
      "Saturn is the least dense planet in the Solar System - it would float in water",
      "Saturn has 82 known moons, including Titan, which has its own atmosphere"
    ]
  },
  uranus: {
    radius: 7,
    texture: 'textures/uranus.jpg',
    position: new THREE.Vector3(210, 0, 0),
    orbitRadius: 210,
    orbitSpeed: 0.002,
    rotationSpeed: 0.015,
    tilt: Math.PI/2,
    facts: [
      "Uranus rotates on its side with an axial tilt of about 98 degrees",
      "Uranus is the coldest planet in our Solar System",
      "It has 13 known rings and 27 moons"
    ]
  },
  neptune: {
    radius: 7,
    texture: 'textures/neptune.jpg',
    position: new THREE.Vector3(240, 0, 0),
    orbitRadius: 240,
    orbitSpeed: 0.001,
    rotationSpeed: 0.016,
    facts: [
      "Neptune has the strongest winds in the Solar System, up to 2,100 km/h",
      "Neptune was the first planet to be predicted by mathematics before it was observed",
      "It takes Neptune 165 Earth years to orbit the Sun"
    ]
  }
};

function init() {
  // Create scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  
  // Add starfield background
  createStarfield();
  
  // Create camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 30, 100);
  
  // Create renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);
  
  // Create orbit controls (for initial viewing)
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  
  // Add lights
  const ambientLight = new THREE.AmbientLight(0x404040, 2);
  scene.add(ambientLight);
  
  const sunLight = new THREE.PointLight(0xffffff, 3, 300);
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);
  
  
  // Create solar system
  createSolarSystem();
  
  // Load astronaut model
  loadAstronautModel();
  
  // Event listeners
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  
  // Start animation loop
  animate();
}

function createStarfield() {
  const starsGeometry = new THREE.BufferGeometry();
  const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.7,
    sizeAttenuation: false
  });
  
  const starsVertices = [];
  for (let i = 0; i < 5000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    
    starsVertices.push(x, y, z);
  }
  
  starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
  
  const starField = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(starField);
}

function createSolarSystem() {
  const textureLoader = new THREE.TextureLoader();
  
  // Create planets
  for (const [name, data] of Object.entries(solarSystemData)) {
    const geometry = new THREE.SphereGeometry(data.radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      map: textureLoader.load(data.texture),
      roughness: 0.8,
      metalness: 0.1
    });
    
    const planet = new THREE.Mesh(geometry, material);
    planet.position.copy(data.position);
    planet.name = name;
    scene.add(planet);
    
    // Add rings for Saturn
    if (data.hasRings) {
      const ringGeometry = new THREE.RingGeometry(data.radius + 2, data.radius + 7, 64);
      const ringMaterial = new THREE.MeshBasicMaterial({
        map: textureLoader.load('textures/saturn_rings.png'),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const rings = new THREE.Mesh(ringGeometry, ringMaterial);
      rings.rotation.x = Math.PI / 2;
      planet.add(rings);
    }
    
    // Add tilt if specified
    if (data.tilt) {
      planet.rotation.z = data.tilt;
    }
    
    planets[name] = planet;
  }
}

function loadAstronautModel() {
  const loader = new GLTFLoader();
  
  // If you have a specific Buzz Lightyear-inspired model:
  loader.load('models/buzz_lightyear.glb', (gltf) => {
    astronaut = gltf.scene;
    astronaut.scale.set(0.5, 0.5, 0.5);
    astronaut.position.set(80, 0, 0); // Start near Earth
    
    // Add astronaut to the scene
    scene.add(astronaut);
    
    // Add a spotlight to follow the astronaut
    const astronautLight = new THREE.SpotLight(0xffffff, 0.8);
    astronautLight.position.set(0, 5, 0);
    astronautLight.target = astronaut;
    astronaut.add(astronautLight);
    
    // Create a first-person camera position
    const fpsCameraPos = new THREE.Object3D();
    fpsCameraPos.position.set(0, 1, 0); // Position the camera at the astronaut's head
    astronaut.add(fpsCameraPos);
    astronaut.fpsCameraPos = fpsCameraPos;
    
    // Enable shadows
    astronaut.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, undefined, (error) => {
    console.error('Error loading astronaut model:', error);
    
    // As a fallback, create a simple astronaut shape if model fails to load
    const astronautGeometry = new THREE.CapsuleGeometry(1, 2, 4, 8);
    const astronautMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    astronaut = new THREE.Mesh(astronautGeometry, astronautMaterial);
    
    // Create wings
    const wingGeometry = new THREE.BoxGeometry(3, 0.2, 1);
    const wingMaterial = new THREE.MeshStandardMaterial({ color: 0x44ff44 });
    
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-1.5, 0, 0);
    astronaut.add(leftWing);
    
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(1.5, 0, 0);
    astronaut.add(rightWing);
    
    astronaut.position.set(80, 0, 0);
    scene.add(astronaut);
    
    const fpsCameraPos = new THREE.Object3D();
    fpsCameraPos.position.set(0, 1, 0);
    astronaut.add(fpsCameraPos);
    astronaut.fpsCameraPos = fpsCameraPos;
  });
}

// Flight controls
const keysPressed = {};

function onKeyDown(event) {
  keysPressed[event.code] = true;
  
  if (event.code === 'KeyV') {
    // Toggle view (first-person or third-person)
    toggleView();
  }
  
  if (event.code === 'KeyF') {
    // Toggle flying mode
    flying = !flying;
    controls.enabled = !flying;
    
    // Reset velocity when stopping flight
    if (!flying) {
      velocity.set(0, 0, 0);
    }
    
    // Show appropriate UI message
    document.getElementById('flyingStatus').textContent = flying ? 'Flying Mode: ON' : 'Flying Mode: OFF';
  }
}

function onKeyUp(event) {
  keysPressed[event.code] = false;
}

function toggleView() {
  isFirstPerson = !isFirstPerson;
  
  if (isFirstPerson) {
    // Use astronaut's camera position
    controls.enabled = false;
  } else {
    // Return to orbit controls
    camera.position.set(0, 30, 100);
    controls.enabled = !flying;
  }
  
  document.getElementById('viewStatus').textContent = isFirstPerson ? 'View: First Person' : 'View: Third Person';
}

function updateAstronautMovement() {
  if (!astronaut || !flying) return;
  
  // Create a direction vector based on astronaut's current rotation
  const direction = new THREE.Vector3(0, 0, -1);
  direction.applyQuaternion(astronaut.quaternion);
  
  // Handle movement controls
  if (keysPressed['KeyW']) {
    // Forward movement
    velocity.add(direction.clone().multiplyScalar(0.01));
  }
  
  if (keysPressed['KeyS']) {
    // Backward movement
    velocity.add(direction.clone().multiplyScalar(-0.01));
  }
  
  if (keysPressed['KeyA']) {
    // Rotate left
    astronaut.rotation.y += ASTRONAUT_ROTATION_SPEED;
  }
  
  if (keysPressed['KeyD']) {
    // Rotate right
    astronaut.rotation.y -= ASTRONAUT_ROTATION_SPEED;
  }
  
  if (keysPressed['Space']) {
    // Move up
    velocity.y += 0.01;
  }
  
  if (keysPressed['ShiftLeft']) {
    // Move down
    velocity.y -= 0.01;
  }
  
  // Apply slight dampening to gradually slow down
  velocity.multiplyScalar(0.98);
  
  // Apply velocity to position
  astronaut.position.add(velocity);
  
  // Update camera if in first-person view
  if (isFirstPerson) {
    const astronautWorldPos = new THREE.Vector3();
    astronaut.fpsCameraPos.getWorldPosition(astronautWorldPos);
    camera.position.copy(astronautWorldPos);
    
    // Look in the same direction as the astronaut
    const lookAt = new THREE.Vector3();
    astronaut.getWorldDirection(lookAt);
    lookAt.multiplyScalar(-1); // Invert direction to look forward
    lookAt.add(camera.position);
    camera.lookAt(lookAt);
  }
  
  // Check if near any planet
  checkPlanetProximity();
}

function checkPlanetProximity() {
    const astronautPos = astronaut.position.clone();
    let nearestPlanet = null;
    let minDistance = 30; // Increase from 20 to 30 to make detection easier
    
    console.log("Checking planet proximity, astronaut at:", astronautPos);
    
    // Check each planet's distance to astronaut
    for (const [name, planet] of Object.entries(planets)) {
      const distance = astronautPos.distanceTo(planet.position);
      console.log(`Distance to ${name}: ${distance.toFixed(2)}`);
      
      // Update distance display for all planets
      const distanceElement = document.getElementById(`${name}Distance`);
      if (distanceElement) {
        distanceElement.textContent = `${Math.round(distance)} units`;
      }
      
      // Check if astronaut is near a planet
      if (distance < minDistance) {
        minDistance = distance;
        nearestPlanet = name;
      }
    }
    
    // Show planet info if near a planet
    if (nearestPlanet) {
      console.log("Near planet:", nearestPlanet);
      displayPlanetInfo(nearestPlanet);
      currentPlanet = nearestPlanet;
    } else if (!nearestPlanet && currentPlanet) {
      // Hide info when moving away
      console.log("Moving away from planets");
      hidePlanetInfo();
      currentPlanet = null;
    }
  }
  

function displayPlanetInfo(planetName) {
  const infoPanel = document.getElementById('planetInfo');
  const data = solarSystemData[planetName];
  
  // Update info panel content
  document.getElementById('planetTitle').textContent = planetName.charAt(0).toUpperCase() + planetName.slice(1);
  
  const factsList = document.getElementById('planetFacts');
  factsList.innerHTML = '';
  
  // Add facts
  data.facts.forEach(fact => {
    const listItem = document.createElement('li');
    listItem.textContent = fact;
    factsList.appendChild(listItem);
  });
  
  // Show the panel
  infoPanel.style.display = 'block';
}

function hidePlanetInfo() {
  document.getElementById('planetInfo').style.display = 'none';
}

function updatePlanets(time) {
  // Update planet positions and rotations
  for (const [name, data] of Object.entries(solarSystemData)) {
    if (name === 'sun') continue; // Sun doesn't orbit
    
    const planet = planets[name];
    
    // Update orbit position
    if (data.orbitSpeed) {
      const angle = time * data.orbitSpeed;
      planet.position.x = Math.cos(angle) * data.orbitRadius;
      planet.position.z = Math.sin(angle) * data.orbitRadius;
    }
    
    // Update rotation
    if (data.rotationSpeed) {
      planet.rotation.y += data.rotationSpeed;
    }
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  
  const time = performance.now() * 0.001; // Convert to seconds
  
  // Update planet positions and rotations
  updatePlanets(time);
  
  // Update astronaut movement
  updateAstronautMovement();
  
  // Update controls
  if (!isFirstPerson && !flying) {
    controls.update();
  }
  
  // Render scene
  renderer.render(scene, camera);
}

// Create UI elements
function createUI() {
    // Make sure to remove any existing UI elements before creating new ones
    const existingUI = document.getElementById('solarSystemUI');
    if (existingUI) existingUI.remove();
    
    const ui = document.createElement('div');
    ui.id = 'solarSystemUI';
    ui.style.position = 'absolute';
    ui.style.top = '10px';
    ui.style.left = '10px';
    ui.style.color = 'white';
    ui.style.fontFamily = 'Arial, sans-serif';
    ui.style.fontSize = '14px';
    ui.style.textShadow = '1px 1px 2px black';
    ui.style.zIndex = '1000'; // Ensure it's on top of everything
    
    // Status display
    const status = document.createElement('div');
    status.innerHTML = `
      <h3 style="margin-top: 0; color: #00a1ff;">Space Explorer</h3>
      <div id="flyingStatus">Flying Mode: OFF</div>
      <div id="viewStatus">View: Third Person</div>
      <h4 style="color: #00a1ff; margin-bottom: 5px;">Controls:</h4>
      <ul style="list-style: none; padding-left: 5px; margin-top: 5px;">
        <li>F: Toggle Flying Mode</li>
        <li>V: Toggle View (First/Third Person)</li>
        <li>W/S: Move Forward/Backward</li>
        <li>A/D: Rotate Left/Right</li>
        <li>Space/Shift: Move Up/Down</li>
      </ul>
      <h4 style="color: #00a1ff; margin-bottom: 5px;">Distances:</h4>
      <div id="distances"></div>
    `;
    
    ui.appendChild(status);
    document.body.appendChild(ui);
    
    // Distances list
    const distancesList = document.getElementById('distances');
    for (const name of Object.keys(solarSystemData)) {
      const distanceItem = document.createElement('div');
      distanceItem.innerHTML = `${name.charAt(0).toUpperCase() + name.slice(1)}: <span id="${name}Distance">--</span>`;
      distancesList.appendChild(distanceItem);
    }
    
    // Planet info panel (hidden by default)
    const planetInfo = document.createElement('div');
    planetInfo.id = 'planetInfo';
    planetInfo.style.position = 'absolute';
    planetInfo.style.right = '10px';
    planetInfo.style.top = '10px';
    planetInfo.style.width = '300px';
    planetInfo.style.background = 'rgba(0, 0, 0, 0.8)';
    planetInfo.style.borderRadius = '10px';
    planetInfo.style.padding = '15px';
    planetInfo.style.color = 'white';
    planetInfo.style.fontFamily = 'Arial, sans-serif';
    planetInfo.style.display = 'none';
    planetInfo.style.zIndex = '1000'; // Ensure it's on top
    
    planetInfo.innerHTML = `
      <h2 id="planetTitle" style="color: #00a1ff; margin-top: 0;"></h2>
      <ul id="planetFacts" style="padding-left: 20px;"></ul>
    `;
    
    document.body.appendChild(planetInfo);
  }
  

// Initialize the application
function startApp() {
  init();
  createUI();
}

// Start the app when page loads
window.addEventListener('load', startApp);
import * as THREE from './vendor/three.module.js';
import { FaceLandmarker, FilesetResolver } from './vendor/vision_bundle.mjs';
import { MODE } from './config.js';
import { GestureGate } from './gestures.js';

// Three.js dibuja; MediaPipe entrega los puntos del rostro y los gestos.
// El vídeo y el canvas comparten encuadre y espejo para que coincidan.
const $ = id => document.getElementById(id);
const video = $('video-renderer');
const stage = $('app');
const errorBox = $('error');
const button = $('start');
const stopButton = $('stop');
const camera = new THREE.OrthographicCamera(-1, 1, .5, -.5, .01, 10);
camera.position.z = 2;
let renderer, scene, tracker, stream, frame, audioContext, buffers = {};
let running = false, generation = 0, lastVideoTime = -1, lastFrame = 0;
let root, mask, audioReady = false, effectUntil = 0, effect = '', feedbackTimer;
const gates = [
  new GestureGate('sonrisa', .52, .28),
  new GestureGate('boca', .42, .18)
];

function status(text, found = false) {
  $('status-text').textContent = text;
  $('status').dataset.found = String(found);
}

function notice(text) {
  $('feedback').textContent = text;
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => { $('feedback').textContent = ''; }, 1700);
}

// El audio se desbloquea desde el clic inicial, también en Safari móvil.
async function prepareAudio() {
  if (MODE !== 'eventos') return;
  const AudioClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioClass) throw new Error('Este navegador no permite reproducir los sonidos. Prueba con Chrome o Safari actualizado.');
  audioContext ??= new AudioClass();
  await audioContext.resume();
  if (audioReady) return;
  for (const name of ['sonrisa', 'burbuja']) {
    const response = await fetch(`assets/audio/${name}.wav`);
    if (!response.ok) throw new Error('No se pudo cargar uno de los sonidos. Comprueba que subiste la carpeta assets completa.');
    buffers[name] = await audioContext.decodeAudioData(await response.arrayBuffer());
  }
  audioReady = true;
}

function playSound(name) {
  if (!$('sound-enabled')?.checked || !audioReady) return;
  const source = audioContext.createBufferSource();
  const volume = audioContext.createGain();
  volume.gain.value = .55;
  source.buffer = buffers[name];
  source.connect(volume).connect(audioContext.destination);
  source.onended = () => { source.disconnect(); volume.disconnect(); };
  source.start();
}

async function prepareScene() {
  if (scene) return;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: $('three-canvas'), alpha: true, antialias: true });
  } catch {
    throw new Error('No se pudo activar WebGL. Prueba en tu celular o activa la aceleración gráfica del navegador.');
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const response = await fetch('app.json');
  if (!response.ok) throw new Error('Falta app.json. Sube todos los archivos del ejercicio.');
  const project = await response.json();
  scene = await new THREE.ObjectLoader().parseAsync(project.scene);
  scene.background = null;
  root = scene.getObjectByName('KUBI_Gafas');
  mask = scene.getObjectByName('mesh_0');
  if (mask) {
    mask.frustumCulled = false;
    mask.material.depthWrite = false;
    mask.material.side = THREE.DoubleSide;
    mask.renderOrder = 10;
    mask.geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
  }
  if (root) root.visible = false;
  if (mask) mask.visible = false;
}

async function prepareTracker() {
  if (tracker) return;
  const vision = await FilesetResolver.forVisionTasks('./js/vendor/wasm');
  const options = {
    baseOptions: { modelAssetPath: './assets/mediapipe/face_landmarker.task', delegate: 'GPU' },
    runningMode: 'VIDEO', numFaces: 1,
    minFaceDetectionConfidence: .5, minFacePresenceConfidence: .5,
    minTrackingConfidence: .5, outputFaceBlendshapes: true
  };
  try {
    tracker = await FaceLandmarker.createFromOptions(vision, options);
  } catch (gpuError) {
    // Algunos equipos no tienen aceleración gráfica compatible.
    options.baseOptions.delegate = 'CPU';
    tracker = await FaceLandmarker.createFromOptions(vision, options);
  }
}

function resize() {
  if (!renderer || !video.videoWidth) return;
  const w = stage.clientWidth, h = stage.clientHeight;
  const videoAspect = video.videoWidth / video.videoHeight;
  const stageAspect = w / h;
  const visibleHeight = Math.min(1, videoAspect / stageAspect);
  const visibleWidth = visibleHeight * stageAspect;
  camera.left = -visibleWidth / 2;
  camera.right = visibleWidth / 2;
  camera.top = visibleHeight / 2;
  camera.bottom = -visibleHeight / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}

function point(landmarks, index) {
  const p = landmarks[index], aspect = video.videoWidth / video.videoHeight;
  return new THREE.Vector3((p.x - .5) * aspect, .5 - p.y, -p.z * aspect);
}

function updateGlasses(landmarks, now) {
  if (!root) return;
  const a = point(landmarks, 33), b = point(landmarks, 263);
  const right = b.clone().sub(a).normalize();
  const up = point(landmarks, 10).sub(point(landmarks, 152)).normalize();
  const forward = new THREE.Vector3().crossVectors(right, up).normalize();
  up.crossVectors(forward, right).normalize();
  const width = point(landmarks, 234).distanceTo(point(landmarks, 454));
  root.position.copy(a.add(b).multiplyScalar(.5));
  root.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, forward));
  const active = Math.max(0, (effectUntil - now) / 700);
  root.scale.setScalar(width * (effect === 'sonrisa' ? 1 + .10 * active : 1));
  const leaves = scene.getObjectByName('Hojas');
  if (leaves) leaves.rotation.z = effect === 'boca' ? Math.sin(active * Math.PI * 3) * .15 * active : 0;
  root.visible = true;
}

function updateMakeup(landmarks) {
  if (!mask) return;
  const positions = mask.geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const p = point(landmarks, i);
    positions.setXYZ(i, p.x, p.y, p.z + .002);
  }
  positions.needsUpdate = true;
  mask.visible = $('makeup-enabled').checked;
  mask.material.opacity = Number($('intensity').value) / 100;
}

function updateGestures(result, now) {
  if (MODE !== 'eventos') return;
  const scores = Object.fromEntries((result.faceBlendshapes?.[0]?.categories || []).map(c => [c.categoryName, c.score]));
  const values = [( (scores.mouthSmileLeft || 0) + (scores.mouthSmileRight || 0) ) / 2, scores.jawOpen || 0];
  gates.forEach((gate, i) => {
    if (!gate.update(values[i], now)) return;
    effect = gate.name;
    effectUntil = now + 700;
    playSound(i === 0 ? 'sonrisa' : 'burbuja');
    notice(i === 0 ? '¡Sonrisa! · Melodía frutal' : '¡Boca abierta! · Burbuja frutal');
  });
}

function render(now) {
  if (!running) return;
  frame = requestAnimationFrame(render);
  // Limitar la detección a 24 fps evita trabajo innecesario en móviles.
  if (video.readyState < 2 || video.currentTime === lastVideoTime || now - lastFrame < 1000 / 24) return;
  lastVideoTime = video.currentTime;
  lastFrame = now;
  try {
    const result = tracker.detectForVideo(video, now);
    const landmarks = result.faceLandmarks?.[0];
    if (landmarks) {
      updateGestures(result, now);
      updateGlasses(landmarks, now);
      updateMakeup(landmarks);
      status('Rostro detectado · ' + (MODE === 'eventos' ? 'prueba los dos gestos' : 'maquillaje activo'), true);
    } else {
      if (root) root.visible = false;
      if (mask) mask.visible = false;
      gates.forEach(g => g.reset());
      effectUntil = 0;
      status('Buscando rostro · mira hacia la cámara');
    }
    renderer.render(scene, camera);
  } catch (error) {
    stop();
    errorBox.textContent = 'Se interrumpió el seguimiento. Cierra otras aplicaciones que usen la cámara y vuelve a iniciar.';
    console.error(error);
  }
}

function stop() {
  generation++;
  running = false;
  cancelAnimationFrame(frame);
  stream?.getTracks().forEach(track => track.stop());
  stream = null;
  video.srcObject = null;
  // Una sesión nueva recibe también un tracker nuevo (reinicia su reloj).
  tracker?.close();
  tracker = null;
  lastVideoTime = -1;
  lastFrame = 0;
  gates.forEach(g => g.reset());
  stage.dataset.running = 'false';
  if (root) root.visible = false;
  if (mask) mask.visible = false;
  renderer?.clear();
  clearTimeout(feedbackTimer);
  $('feedback').textContent = '';
  button.disabled = false;
  button.textContent = 'Iniciar cámara';
  stopButton.hidden = true;
  status('Cámara apagada');
}

button.addEventListener('click', async () => {
  const ticket = ++generation;
  errorBox.textContent = '';
  button.disabled = true;
  button.textContent = 'Preparando…';
  // No se ofrece reiniciar mientras la carga anterior sigue pendiente.
  status('Preparando cámara y filtro…');
  try {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      throw new Error('Abre el enlace HTTPS de Vercel. La cámara no funciona al abrir index.html directamente.');
    }
    await prepareAudio();
    await prepareScene();
    stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 24, max: 30 } } });
    if (ticket !== generation) { stream.getTracks().forEach(t => t.stop()); stream = null; return; }
    video.srcObject = stream;
    await video.play();
    stage.dataset.running = 'true';
    resize();
    status('Cargando seguimiento facial…');
    await prepareTracker();
    if (ticket !== generation) { tracker?.close(); tracker = null; return; }
    running = true;
    stopButton.hidden = false;
    button.textContent = 'Cámara activa';
    resize();
    frame = requestAnimationFrame(render);
  } catch (error) {
    if (ticket !== generation) return;
    stop();
    const messages = {
      NotAllowedError: 'Permite el acceso a la cámara en los ajustes del navegador y vuelve a iniciar.',
      NotFoundError: 'No se encontró una cámara. Abre el enlace en tu celular o conecta una cámara al computador.',
      NotReadableError: 'La cámara está ocupada. Cierra otras aplicaciones que la estén usando.'
    };
    errorBox.textContent = messages[error.name] || error.message || 'No se pudo iniciar el filtro. Recarga e inténtalo de nuevo.';
    console.error(error);
  }
});
stopButton.addEventListener('click', stop);
new ResizeObserver(resize).observe(stage);
window.addEventListener('pagehide', stop);

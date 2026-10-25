// Amadeus avatar controller. Our adapter uses the official Cubism Web API.
// The separately downloaded model belongs to DSUV / ELVELT (CC BY-NC 4.0).
const canvas = document.getElementById('kurisu-canvas');
const status = document.getElementById('avatar-status');
const fallback = document.getElementById('avatar-fallback');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let mode = 'idle';
let frameId = 0;
let release = () => {};
let ready = false;
let voiceSpeaking = false;
let voiceLevel = 0;

document.addEventListener('amadeus:state', (event) => { mode = event.detail; });
document.addEventListener('amadeus:voice', (event) => {
  voiceSpeaking = event.detail.speaking;
  voiceLevel = Math.max(0, Math.min(1, Number(event.detail.level) || 0));
});

function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Không tải được Cubism Core.'));
    document.head.append(script);
  });
}
async function buffer(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Chưa có bộ tài nguyên nhân vật.');
  return response.arrayBuffer();
}
async function textureImage(url) {
  const image = new Image();
  image.src = url;
  await image.decode();
  return image;
}

async function start() {
  const available = await fetch('/runtime/kurisu/kurisu.model3.json');
  if (!available.ok) throw new Error('Chuẩn bị tài nguyên bằng python tools/prepare_assets.py.');
  const manifest = await available.json();
  await loadScript('/runtime/vendor/live2dcubismcore.min.js');
  const {CubismFramework, Option, LogLevel, CubismUserModel, CubismMatrix44, CubismRenderer_WebGL} = await import('/runtime/vendor/cubism.js');
  const option = new Option();
  option.loggingLevel = LogLevel.LogLevel_Error;
  option.logFunction = (message) => console.debug('[Cubism]', message);
  CubismFramework.startUp(option);
  CubismFramework.initialize();

  const gl = canvas.getContext('webgl2', {alpha: true, premultipliedAlpha: true, antialias: true})
    || canvas.getContext('webgl', {alpha: true, premultipliedAlpha: true, antialias: true});
  if (!gl) throw new Error('Trình duyệt chưa hỗ trợ WebGL.');
  const refs = manifest.FileReferences;
  const [moc, physics, image] = await Promise.all([
    buffer('/runtime/kurisu/' + refs.Moc),
    refs.Physics ? buffer('/runtime/kurisu/' + refs.Physics) : Promise.resolve(null),
    textureImage('/runtime/kurisu/' + refs.Textures[0]),
  ]);
  class PortraitModel extends CubismUserModel {
    updatePhysics(dt) { this._physics?.evaluate(this.getModel(), dt); }
  }
  const userModel = new PortraitModel();
  userModel.loadModel(moc, false);
  const model = userModel.getModel();
  if (!model) throw new Error('Model Live2D không hợp lệ.');
  if (physics) userModel.loadPhysics(physics, physics.byteLength);
  let texture;
  function attach() {
    userModel.createRenderer();
    const renderer = userModel.getRenderer();
    renderer.setClippingMaskBufferSize(1024);
    renderer.startUp(gl);
    renderer.setIsPremultipliedAlpha(true);
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
    renderer.bindTexture(0, texture);
  }
  if (image.width > gl.getParameter(gl.MAX_TEXTURE_SIZE)) throw new Error('GPU không đủ kích thước texture cho model này.');
  attach();
  const ids = new Map();
  function set(name, value) {
    if (!ids.has(name)) ids.set(name, CubismFramework.getIdManager().getId(name));
    const id = ids.get(name);
    if (model.getParameterIndex(id) < model.getParameterCount()) model.setParameterValueById(id, value);
  }
  let visible = true;
  let lost = false;
  let time = 0;
  let nextBlink = 2.5;
  let blinkStart = -1;
  let last = 0;
  let gazeX = 0;
  let gazeY = 0;
  let targetX = 0;
  let targetY = 0;
  let mouth = 0;
  function pointer(event) {
    targetX = Math.max(-1, Math.min(1, (event.clientX / innerWidth - 0.5) * 2));
    targetY = Math.max(-1, Math.min(1, -(event.clientY / innerHeight - 0.5) * 2));
  }
  document.addEventListener('pointermove', pointer, {passive: true});
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
  observer.observe(canvas);
  function draw(now) {
    frameId = requestAnimationFrame(draw);
    if (document.hidden || !visible || lost || now - last < 32) return;
    const dt = Math.min((now - (last || now)) / 1000, 0.08);
    last = now;
    time += dt;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
    const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    const moving = !reducedMotion.matches;
    gazeX += ((moving ? targetX : 0) - gazeX) * Math.min(1, dt * 4);
    gazeY += ((moving ? targetY : 0) - gazeY) * Math.min(1, dt * 4);
    if (moving && time >= nextBlink && blinkStart < 0) blinkStart = time;
    let eye = 1;
    if (blinkStart >= 0) {
      const progress = (time - blinkStart) / 0.22;
      eye = Math.abs(2 * Math.min(1, progress) - 1);
      if (progress >= 1) { blinkStart = -1; nextBlink = time + 3 + Math.random() * 3; }
    }
    set('ParamEyeLOpen', eye); set('ParamEyeROpen', eye);
    set('ParamEyeBallX', gazeX * 0.6); set('ParamEyeBallY', gazeY * 0.5);
    set('ParamAngleX', gazeX * 8 + (moving ? Math.sin(time * 0.65) : 0));
    set('ParamAngleY', gazeY * 5); set('ParamAngleZ', moving ? Math.sin(time * 0.43) : 0);
    set('ParamBreath', moving ? 0.45 + Math.sin(time * 1.6) * 0.2 : 0.45);
    set('ParamBodyAngleX', moving ? Math.sin(time * 0.5) * 1.2 : 0);
    // Cached Japanese clips drive the mouth from their measured audio amplitude.
    // Keep the existing gentle text-stream cue when no clip is playing.
    const targetMouth = voiceSpeaking ? voiceLevel
      : moving && mode === 'speaking' ? (0.15 + Math.abs(Math.sin(time * 11)) * 0.25) : 0;
    mouth += (targetMouth - mouth) * Math.min(1, dt * 15);
    set('ParamMouthOpenY', mouth);
    if (moving) userModel.updatePhysics(dt);
    model.update();
    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const matrix = userModel.getModelMatrix();
    // Portrait framing: preserve headroom while cropping below the waist.
    matrix.loadIdentity(); matrix.setHeight(4.3); matrix.translate(0, -1.23);
    const projection = new CubismMatrix44();
    projection.scale(height / width, 1); projection.multiplyByMatrix(matrix);
    const renderer = userModel.getRenderer();
    renderer.setMvpMatrix(projection);
    renderer.setRenderState(null, [0, 0, width, height]);
    renderer.drawModel();
  }
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault(); lost = true; userModel.deleteRenderer(); CubismRenderer_WebGL.doStaticRelease();
    status.textContent = 'Đang khôi phục hình ảnh…';
  });
  canvas.addEventListener('webglcontextrestored', () => { attach(); lost = false; status.textContent = 'LIVE2D / KẾT NỐI'; });
  release = () => {
    cancelAnimationFrame(frameId); observer.disconnect(); document.removeEventListener('pointermove', pointer);
    if (!gl.isContextLost()) gl.deleteTexture(texture);
    userModel.release(); CubismFramework.dispose();
  };
  frameId = requestAnimationFrame(draw);
  ready = true;
  canvas.hidden = false;
  fallback.hidden = true;
  status.textContent = 'LIVE2D / KẾT NỐI';
  document.getElementById('avatar-container').dataset.state = 'ready';
}

if (canvas) start().catch((error) => {
  console.warn('Amadeus avatar:', error.message);
  status.textContent = 'CHƯA CÓ KẾT NỐI HÌNH ẢNH';
  fallback.querySelector('p').textContent = error.message;
  canvas.hidden = true;
});
window.addEventListener('pagehide', (event) => { if (ready && !event.persisted) release(); });

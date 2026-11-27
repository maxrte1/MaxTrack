(function () {
  const sound = document.getElementById('focusSound');
  const volume = document.getElementById('focusVolume');
  const volumeValue = document.getElementById('focusVolumeValue');
  const play = document.getElementById('focusPlay');
  const description = document.getElementById('focusDescription');
  const status = document.getElementById('focusStatus');

  if (!sound || !volume || !volumeValue || !play || !description || !status) return;

  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  const settingsKey = 'maxtrack.focus';
  const descriptions = {
    ambient: 'Soft instrumental tones for a quiet study session.',
    white: 'A steady hiss with equal energy across frequencies.',
    pink: 'A softer noise with less high-frequency energy.',
    brown: 'A deep, low-frequency rumble.',
    alpha: '200 Hz in the left ear and 210 Hz in the right. Use stereo headphones.',
    theta: '200 Hz in the left ear and 206 Hz in the right. Use stereo headphones.'
  };

  if (!AudioEngine) {
    status.textContent = 'Focus sounds are not supported in this browser.';
    sound.disabled = volume.disabled = play.disabled = true;
    return;
  }

  let context;
  let master;
  let current = null;
  let pending = false;
  let request = 0;
  const buffers = new Map();

  try {
    const saved = JSON.parse(localStorage.getItem(settingsKey));
    if (saved && Object.prototype.hasOwnProperty.call(descriptions, saved.sound)) {
      sound.value = saved.sound;
    }
    if (saved && Number.isFinite(saved.volume)) {
      volume.value = Math.max(0, Math.min(100, saved.volume));
    }
  } catch {}

  function saveSettings() {
    try {
      localStorage.setItem(settingsKey, JSON.stringify({
        sound: sound.value,
        volume: Number(volume.value)
      }));
    } catch {}
  }

  function updateVolume() {
    volumeValue.textContent = volume.value + '%';
    if (master) {
      master.gain.setTargetAtTime(Number(volume.value) / 200, context.currentTime, 0.03);
    }
  }

  function render(message) {
    description.textContent = descriptions[sound.value];
    play.textContent = pending ? 'Starting…' : current ? 'Stop' : 'Play';
    play.disabled = pending;
    sound.disabled = pending;
    status.textContent = message || (current
      ? 'Playing: ' + sound.selectedOptions[0].textContent
      : 'Ready to play.');
  }

  function filteredNoise(kind) {
    if (buffers.has(kind)) return buffers.get(kind);

    const rate = context.sampleRate;
    const buffer = context.createBuffer(1, rate * 12, rate);
    const samples = buffer.getChannelData(0);
    const fade = Math.floor(rate * 0.08);
    const data = new Float32Array(samples.length + fade);
    let brown = 0;
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      if (kind === 'white') {
        data[i] = white * 0.35;
      } else if (kind === 'brown') {
        brown = (brown + 0.02 * white) / 1.02;
        data[i] = brown * 2.5;
      } else {
        b0 = 0.99886 * b0 + 0.0555179 * white;
        b1 = 0.99332 * b1 + 0.0750759 * white;
        b2 = 0.96900 * b2 + 0.1538520 * white;
        b3 = 0.86650 * b3 + 0.3104856 * white;
        b4 = 0.55000 * b4 + 0.5329522 * white;
        b5 = -0.7616 * b5 - 0.0168980 * white;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + 0.5362 * white) * 0.1;
        b6 = 0.115926 * white;
      }
    }

    // Blend the loop boundary to avoid a click when the noise repeats.
    for (let i = 0; i < fade; i++) {
      const mix = i / fade;
      data[i] = data[samples.length + i] * (1 - mix) + data[i] * mix;
    }
    for (let i = 0; i < samples.length; i++) {
      samples[i] = Math.max(-0.85, Math.min(0.85, data[i]));
    }
    buffers.set(kind, buffer);
    return buffer;
  }

  function binauralBuffer(beat) {
    const key = 'beat-' + beat;
    if (buffers.has(key)) return buffers.get(key);
    const rate = context.sampleRate;
    const buffer = context.createBuffer(2, rate * 2, rate);

    for (let channel = 0; channel < 2; channel++) {
      const samples = buffer.getChannelData(channel);
      const frequency = 200 + channel * beat;
      for (let i = 0; i < samples.length; i++) {
        samples[i] = 0.25 * Math.sin(2 * Math.PI * frequency * i / rate);
      }
    }
    buffers.set(key, buffer);
    return buffer;
  }

  function ambientBuffer() {
    if (buffers.has('ambient')) return buffers.get('ambient');
    const rate = context.sampleRate;
    const chords = [[48, 55, 59, 64], [45, 52, 55, 60], [41, 48, 52, 57], [43, 50, 57, 62]];
    const length = 4 * rate;
    const buffer = context.createBuffer(1, chords.length * length, rate);
    const samples = buffer.getChannelData(0);
    const hz = note => 440 * Math.pow(2, (note - 69) / 12);

    chords.forEach((chord, index) => {
      const tones = chord.map(hz);
      for (let i = 0; i < length; i++) {
        const t = i / rate;
        const fade = Math.min(t / 0.7, 1, (4 - t) / 0.7);
        let pad = 0;
        for (const tone of tones) {
          pad += Math.sin(2 * Math.PI * tone * t) + 0.1 * Math.sin(4 * Math.PI * tone * t);
        }
        const step = Math.floor(t / 0.5);
        const noteTime = t % 0.5;
        const envelope = Math.min(noteTime / 0.025, 1, (0.5 - noteTime) / 0.08);
        const melody = Math.sin(4 * Math.PI * tones[step % tones.length] * noteTime);
        samples[index * length + i] = fade * (pad * 0.045 + melody * envelope * Math.exp(-5 * noteTime) * 0.05);
      }
    });
    buffers.set('ambient', buffer);
    return buffer;
  }

  function getBuffer(kind) {
    switch (kind) {
      case 'ambient': return ambientBuffer();
      case 'alpha': return binauralBuffer(10);
      case 'theta': return binauralBuffer(6);
      default: return filteredNoise(kind);
    }
  }

  function stopSound() {
    if (!current) return;
    const { source, gain } = current;
    current = null;
    const now = context.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setTargetAtTime(0, now, 0.015);
    source.stop(now + 0.1);
  }

  function startSound() {
    const buffer = getBuffer(sound.value);
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    source.loop = true;
    gain.gain.value = 0;
    source.connect(gain);
    gain.connect(master);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
      if (current && current.source === source) {
        current = null;
        render();
      }
    };

    try {
      source.start();
      gain.gain.setTargetAtTime(1, context.currentTime, 0.035);
      current = { source, gain };
    } catch (error) {
      source.disconnect();
      gain.disconnect();
      throw error;
    }
  }

  play.addEventListener('click', async function () {
    if (pending) return;
    if (current) {
      stopSound();
      render();
      return;
    }

    const id = ++request;
    pending = true;
    render('Starting audio…');
    let message;

    try {
      if (!context || context.state === 'closed') {
        context = new AudioEngine();
        buffers.clear();
        master = context.createGain();
        master.gain.value = Number(volume.value) / 200;
        master.connect(context.destination);
      }
      await context.resume();
      if (id !== request) return;
      if (context.state !== 'running') throw new Error('Audio is unavailable');
      startSound();
    } catch {
      if (id === request) {
        stopSound();
        message = 'Could not start audio. Please try again.';
      }
    } finally {
      if (id === request) {
        pending = false;
        render(message);
      }
    }
  });

  sound.addEventListener('change', function () {
    saveSettings();
    let message;
    if (current) {
      stopSound();
      try {
        startSound();
      } catch {
        message = 'Could not change sound. Press Play to try again.';
      }
    }
    render(message);
  });

  volume.addEventListener('input', function () {
    updateVolume();
    saveSettings();
  });

  window.addEventListener('pagehide', function () {
    request++;
    pending = false;
    stopSound();
    render();
    if (context && context.state !== 'closed') context.suspend().catch(() => {});
  });

  updateVolume();
  render();
})();

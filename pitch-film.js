(() => {
  const film = document.querySelector('#demo-scene');
  if (!film) return;

  const shots = [...film.querySelectorAll('[data-film-scene]')];
  const center = document.querySelector('#film-center-play');
  const play = document.querySelector('#film-play');
  const restart = document.querySelector('#film-restart');
  const seek = document.querySelector('#film-seek');
  const time = document.querySelector('#film-time');
  const volume = document.querySelector('#film-volume');
  const fullscreen = document.querySelector('#film-fullscreen');
  const caption = document.querySelector('#demo-caption');

  const filmLength = Number(seek.max) * 1000;
  const sceneStarts = [0, 8000, 15000, 22000, 29000];
  const sceneAt = ms => sceneStarts.reduce((scene, start, i) => ms >= start ? i : scene, 0);
  const narration = [
    ['A aula acabou.', 'Na padaria, a sacola custa vinte e quatro e noventa.'],
    ['No Sobrou, a mesma sacola sai por nove e noventa.'],
    ['Joaquim reserva pelo app e busca na padaria.'],
    ['No café da manhã, ele economiza quinze reais.'],
    ['A padaria vende o excedente. Menos desperdício.']
  ];
  const captions = [
    'A aula acabou. Na padaria, a sacola custa R$ 24,90.',
    'No Sobrou, a mesma sacola sai por R$ 9,90.',
    'Joaquim reserva pelo app e busca na padaria.',
    'No café da manhã, ele economiza R$ 15.',
    'A padaria vende o excedente. Menos desperdício.'
  ];

  let elapsed = 0;
  let lastFrame = 0;
  let raf = 0;
  let active = false;
  let utterance = null;
  let voiceWaitTimer = 0;
  let voicesHandler = null;
  let speechQueue = [];
  let nextLineTimer = 0;
  let narrationPending = false;
  let audio = null;
  let master = null;
  let musicBus = null;
  let musicTimer = 0;
  let musicStep = 0;
  let currentScene = -1;
  let narratedScene = -1;

  function ensureAudio() {
    if (audio) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    audio = new AudioContext();
    master = audio.createGain();
    master.gain.value = Number(volume.value);
    master.connect(audio.destination);
    musicBus = audio.createGain();
    musicBus.gain.value = 0;
    musicBus.connect(master);
  }

  function pluck(frequency, when, strength = 0.075, length = 0.3, type = 'triangle') {
    if (!audio || !musicBus) return;
    const oscillator = audio.createOscillator();
    const envelope = audio.createGain();
    const filter = audio.createBiquadFilter();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, when);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2100, when);
    envelope.gain.setValueAtTime(0.0001, when);
    envelope.gain.exponentialRampToValueAtTime(strength, when + 0.018);
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + length);
    oscillator.connect(filter);
    filter.connect(envelope);
    envelope.connect(musicBus);
    oscillator.start(when);
    oscillator.stop(when + length + 0.03);
  }

  function playMusicBeat() {
    if (!audio || !active) return;
    const melody = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880, 698.46,
      523.25, 659.25, 783.99, 987.77, 493.88, 587.33, 783.99, 880];
    const bass = [130.81, 174.61, 220, 196];
    const when = audio.currentTime + 0.025;
    const step = musicStep % melody.length;
    pluck(melody[step], when, 0.08, 0.34, 'triangle');
    if (step % 2 === 0) pluck(melody[step] * 1.5, when + 0.025, 0.026, 0.2, 'sine');
    if (step % 4 === 0) pluck(bass[Math.floor(step / 4) % bass.length], when, 0.075, 0.48, 'sine');
    musicStep += 1;
  }

  function setMusic(on) {
    if (!audio || !musicBus) return;
    clearInterval(musicTimer);
    musicTimer = 0;
    musicBus.gain.setTargetAtTime(on ? 0.24 : 0, audio.currentTime, on ? 0.12 : 0.22);
    if (on) {
      musicStep = 0;
      playMusicBeat();
      musicTimer = setInterval(playMusicBeat, 375);
    }
  }

  function clearSpeechWait() {
    clearTimeout(voiceWaitTimer);
    voiceWaitTimer = 0;
    if (voicesHandler && 'speechSynthesis' in window) {
      window.speechSynthesis.removeEventListener('voiceschanged', voicesHandler);
    }
    voicesHandler = null;
  }

  function choosePortugueseVoice(voices) {
    const ptBr = voices.filter(voice => /^pt-br$/i.test(voice.lang));
    const preferred = voice => /francisca|antonio|thalita|natural|neural|online|google/i.test(voice.name);
    return ptBr.find(voice => /francisca|antonio|thalita/i.test(voice.name)) || ptBr.find(preferred) || ptBr[0] || voices.find(voice => /^pt/i.test(voice.lang)) || null;
  }

  function cancelNarration() {
    clearSpeechWait();
    clearTimeout(nextLineTimer);
    utterance = null;
    speechQueue = [];
    narrationPending = false;
    narratedScene = -1;
    window.speechSynthesis?.cancel();
    if (window.speechSynthesis?.paused) window.speechSynthesis.resume();
  }

  function speakNextLine() {
    if (!active || utterance) return;
    if (!speechQueue.length) {
      narrationPending = false;
      return;
    }

    const synth = window.speechSynthesis;
    const speech = new SpeechSynthesisUtterance(speechQueue.shift());
    speech.lang = 'pt-BR';
    speech.rate = 0.94;
    speech.pitch = 1.02;
    speech.volume = Number(volume.value);
    speech.voice = choosePortugueseVoice(synth.getVoices());
    utterance = speech;
    const finish = () => {
      if (utterance !== speech) return;
      clearSpeechWait();
      utterance = null;
      narrationPending = speechQueue.length > 0;
      if (narrationPending && active) nextLineTimer = setTimeout(speakNextLine, 250);
    };
    speech.onend = finish;
    speech.onerror = finish;
    // If the browser never starts speech, keep the story usable with captions.
    voiceWaitTimer = setTimeout(() => {
      finish();
      synth.cancel();
    }, 5000);
    speech.onstart = clearSpeechWait;
    synth.speak(speech);
  }

  function beginNarration(scene) {
    narratedScene = scene;
    const synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance !== 'function') return;
    speechQueue = [...narration[scene]];
    narrationPending = true;
    if (synth.getVoices().length) {
      speakNextLine();
      return;
    }
    const begin = () => {
      clearSpeechWait();
      speakNextLine();
    };
    voicesHandler = begin;
    synth.addEventListener('voiceschanged', begin, { once: true });
    voiceWaitTimer = setTimeout(begin, 1000);
  }

  function advance(now) {
    if (!active) return;
    const boundary = sceneStarts[currentScene + 1] ?? filmLength;
    const limit = narrationPending ? boundary - 1 : boundary;
    elapsed = Math.min(limit, elapsed + now - lastFrame);
    lastFrame = now;
    render(elapsed);
  }

  function render(ms) {
    const currentTime = Math.max(0, Math.min(filmLength, ms));
    const scene = currentTime >= filmLength ? 4 : sceneAt(currentTime);
    if (scene !== currentScene) {
      currentScene = scene;
      shots.forEach((shot, i) => shot.classList.toggle('is-visible', i === scene));
      caption.textContent = captions[scene] || captions[0];
      if (active) beginNarration(scene);
    }
    seek.value = String(currentTime / 1000);
    const progress = film.querySelector('.film-progress > span');
    if (progress) progress.style.width = `${(currentTime / filmLength) * 100}%`;
    const filmMinutes = Math.floor(filmLength / 60000);
    const filmSeconds = Math.floor(filmLength / 1000) % 60;
    time.textContent = `${Math.floor(currentTime / 60000)}:${String(Math.floor(currentTime / 1000) % 60).padStart(2, '0')} / ${filmMinutes}:${String(filmSeconds).padStart(2, '0')}`;
    if (currentTime >= filmLength) {
      active = false;
      elapsed = filmLength;
      cancelAnimationFrame(raf);
      play.textContent = '▶';
      film.classList.remove('is-playing');
      film.classList.add('is-ended');
      setMusic(false);
      return;
    }
    if (active) raf = requestAnimationFrame(advance);
  }

  function pause() {
    if (!active) return;
    active = false;
    cancelAnimationFrame(raf);
    if (!utterance) clearSpeechWait();
    clearTimeout(nextLineTimer);
    window.speechSynthesis?.pause();
    play.textContent = '▶';
    film.classList.remove('is-playing');
    setMusic(false);
    render(elapsed);
  }

  function start() {
    if (active) return;
    if (elapsed >= filmLength) {
      elapsed = 0;
      currentScene = -1;
    }
    if (document.fullscreenElement !== film && !film.classList.contains('cinema-mode')) {
      const useCinemaMode = () => { if (active) film.classList.add('cinema-mode'); };
      if (film.requestFullscreen) film.requestFullscreen({ navigationUI: 'hide' }).catch(useCinemaMode);
      else queueMicrotask(useCinemaMode);
    }
    ensureAudio();
    audio?.resume().catch(() => {});
    active = true;
    lastFrame = performance.now();
    play.textContent = 'Ⅱ';
    film.classList.add('is-playing', 'has-started');
    film.classList.remove('is-ended');
    setMusic(true);
    if ('speechSynthesis' in window) {
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    }
    const scene = sceneAt(elapsed);
    if (scene === currentScene && scene !== narratedScene) beginNarration(scene);
    else if (narrationPending) speakNextLine();
    render(elapsed);
  }

  function reset() {
    active = false;
    cancelAnimationFrame(raf);
    cancelNarration();
    elapsed = 0;
    currentScene = -1;
    play.textContent = '▶';
    film.classList.remove('is-playing', 'is-ended', 'has-started');
    setMusic(false);
    render(0);
  }

  window.pausePitchFilm = () => {
    pause();
    cancelNarration();
    film.classList.remove('cinema-mode');
    if (document.fullscreenElement === film) document.exitFullscreen().catch(() => {});
  };
  play.addEventListener('click', () => active ? pause() : start());
  document.querySelector('#film-next-slide')?.addEventListener('click', async () => {
    pause();
    if (document.fullscreenElement === film) await document.exitFullscreen();
    film.classList.remove('cinema-mode');
    document.querySelector('#next-slide')?.click();
  });
  center.addEventListener('click', start);
  restart.addEventListener('click', reset);
  seek.addEventListener('input', () => {
    const wasPlaying = active;
    active = false;
    cancelAnimationFrame(raf);
    cancelNarration();
    elapsed = Number(seek.value) * 1000;
    film.classList.add('has-started');
    film.classList.remove('is-playing', 'is-ended');
    play.textContent = '▶';
    setMusic(false);
    currentScene = -1;
    render(elapsed);
    if (wasPlaying && elapsed < filmLength) start();
  });
  volume.addEventListener('input', () => {
    ensureAudio();
    if (master && audio) master.gain.setTargetAtTime(Number(volume.value), audio.currentTime, 0.04);
    if (utterance) utterance.volume = Number(volume.value);
  });
  fullscreen.addEventListener('click', async () => {
    if (document.fullscreenElement === film) await document.exitFullscreen();
    else await film.requestFullscreen?.({ navigationUI: 'hide' });
  });
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) film.classList.remove('cinema-mode');
  });
  film.addEventListener('click', event => {
    if (!film.classList.contains('is-playing') && event.target === film) start();
  });
  document.addEventListener('keydown', event => {
    if (film.closest('[hidden]')) return;
    if (event.key === 'Escape' && film.classList.contains('cinema-mode') && !document.fullscreenElement) {
      film.classList.remove('cinema-mode');
      return;
    }
    if (!film.contains(event.target) && event.target !== document.body) return;
    if (event.code === 'Space' && !['INPUT', 'BUTTON'].includes(event.target.tagName)) {
      event.preventDefault();
      active ? pause() : start();
    }
    if (event.key === 'ArrowRight' && event.target.tagName !== 'INPUT') {
      seek.value = String(Math.min(filmLength / 1000, Number(seek.value) + 1));
      seek.dispatchEvent(new Event('input'));
    }
    if (event.key === 'ArrowLeft' && event.target.tagName !== 'INPUT') {
      seek.value = String(Math.max(0, Number(seek.value) - 1));
      seek.dispatchEvent(new Event('input'));
    }
  });
  render(0);
})();

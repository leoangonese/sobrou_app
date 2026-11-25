(() => {
  const slides = [...document.querySelectorAll('.pitch-slide')];
  const number = document.querySelector('#slide-number');
  const progress = document.querySelector('#slide-progress');
  const clock = document.querySelector('#clock-label');
  const timerButton = document.querySelector('#timer-toggle');
  const presenterToggle = document.querySelector('#presenter-toggle');
  const presenterGuide = document.querySelector('#presenter-guide');
  const presenterTitle = document.querySelector('#presenter-title');
  const presenterCopy = document.querySelector('#presenter-copy');
  const fullscreenButton = document.querySelector('#fullscreen-toggle');
  const presenterScripts = [
    'Imagine passar na padaria no fim da tarde e encontrar uma sacola de pães por menos da metade do preço. Para você, é economia. Para a padaria, é uma chance de vender o que sobrou. O Sobrou facilita esse encontro entre quem tem excedentes e quem mora por perto.',
    'No fim do dia, uma padaria pode ter pães próprios para consumo que ficaram na prateleira. Se ninguém sabe que eles estão disponíveis, a loja perde a oportunidade de vender e o cliente perde a chance de economizar. Segundo o PNUMA, 19% dos alimentos disponíveis ao consumidor foram desperdiçados no mundo em 2022. Esse número dá a dimensão do problema. Para entender o que acontece no nosso bairro, precisamos conversar com o comércio local.',
    'O fluxo tem três passos. Primeiro, o comércio publica a oferta com preço, quantidade e horário de retirada. Depois, a pessoa encontra a oferta perto de casa e confere as condições antes de reservar. Por fim, ela apresenta o código no próprio estabelecimento. A ideia é encaixar o Sobrou na rotina de quem já compra no bairro e ajudar o comerciante a vender os produtos que sobraram dentro do horário que ele consegue atender.',
    'Veja como isso funciona para o Joaquim.\n\n[Reproduza o vídeo de 35 segundos e avance para a demo ao final.]',
    'Agora, a mesma reserva no app.\n\n[Inicie o tour de 14 segundos. Aponte para o preço, o botão de confirmar e o código.]\n\nCom esse código, basta passar na padaria no horário combinado.',
    'O nosso primeiro recorte é um bairro com padarias e outros pequenos comércios perto de onde as pessoas moram, estudam ou trabalham. Faz sentido começar em uma área pequena porque o usuário precisa encontrar ofertas próximas e o comerciante precisa ter compradores no horário em que tem excedentes. Uma hipótese de receita é cobrar uma comissão por reserva concluída. Para saber se a conta fecha, precisamos entender com os estabelecimentos se esse valor cabe na margem e se o volume compensa o trabalho de separar e entregar as sacolas. A expansão depende de conseguirmos repetir esse fluxo com regularidade no primeiro bairro.',
    'Hoje, o protótipo permite encontrar uma oferta, reservar e consultar o código de retirada. No próximo passo, queremos testar esse percurso com alguns estabelecimentos do bairro. As três medidas mais úteis são quantas ofertas eles conseguem publicar, quantas viram reservas e quantas reservas terminam em retirada. Também queremos ouvir o que dificultou a experiência de cada lado. Se muita gente reservar e pouca gente retirar, por exemplo, vale revisar o horário ou a clareza das instruções. Com esses dados, podemos decidir o que ajustar antes de testar em outro bairro.',
    'Nossa equipe é Bruno Alano Justo, Leonardo Staniecki Angonese, Pablo Eduardo Dutra Sarmento e Vitor Bemfica. Se vocês conhecem um comércio para o primeiro piloto, indiquem para a gente. Os QR codes abrem a página do Sobrou e a demo do app. Obrigado!'
  ];
  let current = 0, elapsed = 0, running = false, interval = null, appTourTimers = [];
  const total = slides.reduce((sum, slide) => sum + Number(slide.dataset.time), 0);
  const slideStart = index => slides.slice(0, index).reduce((sum, slide) => sum + Number(slide.dataset.time), 0);
  const format = seconds => `${String(Math.floor(seconds / 60)).padStart(2,'0')}:${String(seconds % 60).padStart(2,'0')}`;
  function updatePresenterGuide() {
    const start = slideStart(current);
    const end = start + Number(slides[current].dataset.time);
    presenterTitle.textContent = `${slides[current].dataset.title} · ${format(start)}–${format(end)}`;
    presenterCopy.textContent = presenterScripts[current];
  }
  function updateClock() {
    clock.textContent = format(elapsed);
    const passed = slideStart(current);
    const span = Number(slides[current].dataset.time);
    progress.style.width = `${Math.min(100, ((passed + Math.min(elapsed - passed, span)) / total) * 100)}%`;
    if (elapsed >= total) stopTimer();
  }
  function show(index, keepElapsed = false) {
    current = Math.max(0, Math.min(slides.length - 1, index));
    document.body.classList.toggle('film-slide-active',current===3);
    if (current !== 3) window.pausePitchFilm?.();
    if (current !== 4) closeAppDemo();
    slides.forEach((slide,i) => {slide.hidden = i !== current; slide.classList.toggle('active',i === current); slide.setAttribute('aria-hidden',String(i !== current));});
    number.textContent = String(current + 1).padStart(2,'0');
    document.querySelector('#prev-slide').disabled = current === 0;
    document.querySelector('#next-slide').disabled = current === slides.length - 1;
    updatePresenterGuide();
    if (running && !keepElapsed) {
      elapsed = slideStart(current);
      updateClock();
    }
  }
  function stopAppDemo() {
    appTourTimers.forEach(clearTimeout);
    appTourTimers = [];
  }
  let appDemoLoaded = false;
  const appDemoFrame = document.querySelector('#app-demo-frame');
  const appDemoStage = document.querySelector('.app-demo-layout');
  const appDemoButton = document.querySelector('#app-tour-replay');
  const appDemoExit = document.querySelector('#app-tour-exit');
  function closeAppDemo() {
    stopAppDemo();
    appDemoStage.classList.remove('cinema-mode');
    if (document.fullscreenElement === appDemoStage) {
      document.exitFullscreen().catch(() => {});
    }
  }
  appDemoFrame?.addEventListener('load', () => {
    appDemoLoaded = true;
    appDemoButton.disabled = false;
  }, {once: true});
  window.addEventListener('message', event => {
    if (event.source !== appDemoFrame?.contentWindow || event.data?.type !== 'sobrou-app-ready') return;
    appDemoLoaded = true;
    appDemoButton.disabled = false;
  });
  async function startAppDemo() {
    const frame = appDemoFrame;
    if (!frame || !appDemoLoaded) return;
    stopAppDemo();
    if (document.fullscreenElement !== appDemoStage) {
      try {
        await appDemoStage.requestFullscreen({navigationUI: 'hide'});
      } catch {
        appDemoStage.classList.add('cinema-mode');
      }
    }
    if (current !== 4) { closeAppDemo(); return; }
    appDemoExit.focus({preventScroll: true});
    const caption = document.querySelector('#app-demo-caption');
    const progressBar = document.querySelector('#app-tour-progress');
    const steps = [...document.querySelectorAll('.app-demo-steps li')];
    const stages = [
      {at: 0, caption: 'A oferta do bairro aparece com preço e horário de retirada.'},
      {at: 3000, caption: 'Abra uma oferta e confira o que vem na sacola.'},
      {at: 6500, caption: 'Confira o resumo e confirme a reserva.'},
      {at: 10000, caption: 'Pronto: o código fica guardado para a retirada.'},
      {at: 14000, caption: 'A reserva aparece na tela. É simples acompanhar e retirar.'}
    ];
    stages.forEach((stage, index) => {
      appTourTimers.push(setTimeout(() => {
        if (current !== 4) return;
        if (caption) caption.textContent = stage.caption;
        steps.forEach((item, i) => item.classList.toggle('active', i === Math.min(index, 3)));
        if (progressBar) progressBar.style.width = `${Math.min(index + 1, 4) * 25}%`;
        frame.contentWindow.postMessage({type: 'sobrou-demo-step', step: Math.min(index, 4)}, '*');
      }, stage.at));
    });
  }
  function tick() {
    const boundaries = []; let sum = 0;
    slides.forEach((slide,i) => {sum += Number(slide.dataset.time); boundaries.push({i,sum});});
    if (current === 3 && elapsed + 1 >= boundaries[current].sum &&
        document.querySelector('#demo-scene').classList.contains('is-playing')) return;
    elapsed = Math.min(total, elapsed + 1);
    const target = boundaries.find(item => elapsed < item.sum)?.i ?? slides.length - 1;
    if (target !== current) show(target, true);
    updateClock();
  }
  function startTimer() {
    if (elapsed >= total) { elapsed = 0; show(0, true); }
    const start = slideStart(current);
    const end = start + Number(slides[current].dataset.time);
    if (elapsed < start || elapsed >= end) elapsed = start;
    running = true;
    document.body.classList.add('timer-running');
    timerButton.textContent = 'Ⅱ Pausar apresentação';
    interval = setInterval(tick,1000);
    updateClock();
  }
  function stopTimer() { running = false; clearInterval(interval); interval = null; document.body.classList.remove('timer-running'); timerButton.textContent = elapsed >= total ? '↻ Recomeçar apresentação' : '▶ Continuar apresentação'; }
  document.querySelector('#prev-slide').addEventListener('click',() => show(current - 1));
  document.querySelector('#next-slide').addEventListener('click',() => show(current + 1));
  timerButton.addEventListener('click',() => running ? stopTimer() : startTimer());
  appDemoButton.addEventListener('click',startAppDemo);
  appDemoExit.addEventListener('click',closeAppDemo);
  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement !== appDemoStage && !appDemoStage.classList.contains('cinema-mode')) stopAppDemo();
  });
  function toggleGuide() {
    if (document.body.classList.contains('presentation-mode')) return;
    presenterGuide.hidden = !presenterGuide.hidden;
    presenterToggle.setAttribute('aria-expanded', String(!presenterGuide.hidden));
  }
  presenterToggle.addEventListener('click', toggleGuide);
  document.querySelector('#presenter-close').addEventListener('click',() => {presenterGuide.hidden = true; presenterToggle.setAttribute('aria-expanded','false'); presenterToggle.focus();});
  presenterGuide.addEventListener('keydown',event => {if (event.key === 'Escape') {presenterGuide.hidden = true; presenterToggle.setAttribute('aria-expanded','false'); presenterToggle.focus();}});
  async function toggleFullscreen() {
    if (document.body.classList.contains('presentation-mode') && !document.fullscreenElement) { document.body.classList.remove('presentation-mode'); fullscreenButton.textContent = 'Apresentar'; return; }
    if (document.fullscreenElement) { await document.exitFullscreen(); return; }
    try { await document.documentElement.requestFullscreen(); }
    catch { document.body.classList.toggle('presentation-mode'); fullscreenButton.textContent = document.body.classList.contains('presentation-mode') ? 'Sair da tela cheia' : 'Apresentar'; }
  }
  fullscreenButton.addEventListener('click',toggleFullscreen);
  document.addEventListener('fullscreenchange',() => {const active = Boolean(document.fullscreenElement); document.body.classList.toggle('presentation-mode',active); fullscreenButton.textContent = active ? 'Sair da tela cheia' : 'Apresentar'; if (active) {presenterGuide.hidden = true; presenterToggle.setAttribute('aria-expanded','false');}});
  document.addEventListener('keydown',event => {
    if (event.key === 'Escape' && appDemoStage.classList.contains('cinema-mode')) { closeAppDemo(); return; }
    if (current === 3 && ['ArrowRight','ArrowLeft',' '].includes(event.key)) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key.toLowerCase() === 'g') { event.preventDefault(); toggleGuide(); return; }
    if (event.key === 'ArrowRight' || event.key === 'PageDown') {event.preventDefault();show(current+1);}
    if (event.key === 'ArrowLeft' || event.key === 'PageUp') {event.preventDefault();show(current-1);}
    if (event.code === 'Space' && !['BUTTON','A'].includes(document.activeElement.tagName)) {event.preventDefault();running?stopTimer():startTimer();}
    if (event.key === 'Home') show(0);
    if (event.key === 'End') show(slides.length-1);
    if (event.key.toLowerCase() === 'f' && !['BUTTON','A'].includes(document.activeElement.tagName)) {event.preventDefault();toggleFullscreen();}
  });
  const requestedSlide = Number(new URLSearchParams(window.location.search).get('slide'));
  show(Number.isInteger(requestedSlide) && requestedSlide >= 1 && requestedSlide <= slides.length ? requestedSlide - 1 : 0);
  updateClock();
})();

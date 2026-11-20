/**
 * dsh-yunlan-theme — 输入框旁的双角色舞台。
 */
(function () {
  const Q = '/dsh-yunlan/q/';
  const YUN = ['yunlan-1', 'yunlan-2', 'yunlan-3', 'yunlan-4', 'yunlan-5'];
  const DF = ['df-idle', 'df-eat', 'df-surprise', 'df-shy', 'df-angry', 'df-sleep'];
  const INPUT = '[data-composer-input], div[class*="GRgSLq_input"]';
  const CARD = '[data-composer-card], [data-composer-seat]';
  // InputBar 的 input.stop / input.sending 标签，限定在当前输入框。
  const WORK_LABELS = new Set([
    '停止生成', 'Stop generating', '生成を停止', 'Detener generación',
    'Arrêter la génération', 'Generierung stoppen', 'Остановить генерацию', 'Parar geração',
    '正在发送消息', 'Sending message', 'メッセージを送信中', 'Enviando mensaje',
    'Envoi du message', 'Nachricht wird gesendet', 'Отправка сообщения', 'Enviando mensagem',
  ]);

  function mount(ctx) {
    if (document.getElementById('dsh-yunlan-theme')) return;
    const owned = [];
    for (const [id, file] of [['dsh-yunlan-theme', 'theme.css'], ['dsh-yunlan-stage', 'stage.css']]) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = '/dsh-yunlan/' + file;
      document.head.appendChild(link);
      owned.push(link);
    }
    const paint = document.createElement('meta');
    paint.name = 'theme-color';
    paint.content = '#FBFCFD';
    document.head.appendChild(paint);
    owned.push(paint);

    const stage = document.createElement('div');
    stage.id = 'yunlan-stage';
    stage.hidden = true;
    const yun = actor('yunlan', '云澜', YUN, YUN[4]);
    const df = actor('df', '大肥鱼', DF, DF[1]);
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.setAttribute('aria-hidden', 'true');
    stage.append(yun.button, df.button, bubble);
    document.body.appendChild(stage);
    owned.push(stage);

    let composer = null;
    let state = null;
    let action = false;
    let bubbleTimer;
    let raf = 0;
    let scene = 0;
    const timers = new Set();

    function actor(name, label, sprites, initial) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'actor actor-' + name;
      button.setAttribute('aria-label', label);
      const motion = document.createElement('span');
      motion.className = 'motion';
      const faces = new Map();
      const character = { button, faces, wanted: initial };
      for (const sprite of sprites) {
        const img = document.createElement('img');
        img.className = 'face';
        img.alt = '';
        img.draggable = false;
        img.src = Q + sprite + '.webp';
        motion.appendChild(img);
        const layer = { img, ready: false };
        faces.set(sprite, layer);
        img.decode().then(() => {
          layer.ready = true;
          if (character.wanted === sprite) face(character, sprite);
        }, () => {});
      }
      button.appendChild(motion);
      return character;
    }

    function face(character, sprite) {
      character.wanted = sprite;
      const layer = character.faces.get(sprite);
      if (!layer.ready) return;
      for (const entry of character.faces.values()) {
        entry.img.classList.toggle('on', entry === layer);
      }
    }

    function say(text, fromDf, duration) {
      clearTimeout(bubbleTimer);
      bubble.textContent = text;
      bubble.classList.toggle('from-df', fromDf);
      bubble.classList.add('show');
      bubbleTimer = setTimeout(() => bubble.classList.remove('show'), duration);
    }

    function later(next, delay) {
      const scheduledScene = scene;
      const timer = setTimeout(() => {
        timers.delete(timer);
        // React 可能在轮询之间切换会话或更新停止按钮。
        refresh();
        if (!stage.hidden && scene === scheduledScene) next();
      }, delay);
      timers.add(timer);
    }

    function cancelScene() {
      scene++;
      for (const timer of timers) clearTimeout(timer);
      timers.clear();
      clearTimeout(bubbleTimer);
      bubble.classList.remove('show');
      delete stage.dataset.action;
      delete stage.dataset.reacting;
      action = false;
    }

    function rest() {
      face(yun, YUN[4]);
      face(df, DF[1]);
      later(() => interact('pair'), 14000 + Math.random() * 8000);
    }

    function enter(next) {
      cancelScene();
      state = next;
      if (!next) return;
      stage.dataset.state = next;
      if (next === 'idle') {
        rest();
      } else if (next === 'typing') {
        face(yun, YUN[2]);
        face(df, DF[0]);
      } else {
        face(yun, YUN[2]);
        face(df, DF[0]);
        later(() => face(df, DF[3]), 850);
      }
    }

    function interact(kind) {
      cancelScene();
      action = true;
      stage.dataset.action = kind;
      if (kind !== 'df') face(yun, YUN[1]);
      if (kind === 'yunlan') {
        say('（歪头）怎么啦？', false, 1550);
        later(() => enter(state), 1700);
        return;
      }
      const react = () => {
        stage.dataset.reacting = '';
        face(df, DF[2]);
        say('别戳！', true, 640);
      };
      const contact = kind === 'pair' ? 290 : 0;
      if (contact) later(react, contact);
      else react();
      later(() => {
        delete stage.dataset.reacting;
        face(df, DF[4]);
        say('我不是大肥鱼……', true, 1500);
      }, contact + 720);
      later(() => enter(state), contact + 2350);
    }

    function detect(input, card) {
      const busy = Array.from(card.querySelectorAll('button[aria-label]')).some(button =>
        WORK_LABELS.has(button.getAttribute('aria-label')) && button.checkVisibility({ visibilityProperty: true }));
      if (busy) return 'thinking';
      const editable = input.isContentEditable || input.matches('textarea, input');
      const hasDraft = (input.value ?? input.textContent).trim() !== '';
      return editable && (hasDraft || input.hasAttribute('data-composer-composing')) ? 'typing' : 'idle';
    }

    function refresh() {
      let input = null;
      let card;
      let rect;
      if (!document.hidden) {
        for (const candidate of document.querySelectorAll(INPUT)) {
          const anchor = candidate.closest(CARD) || candidate;
          const box = anchor.getBoundingClientRect();
          if (candidate.checkVisibility({ visibilityProperty: true }) &&
              box.width >= 196 && box.right >= 196 && box.right <= window.innerWidth + 4 &&
              box.top >= 96 && box.bottom <= window.innerHeight + 4) {
            input = candidate;
            card = anchor;
            rect = box;
            break;
          }
        }
      }
      const changed = input !== composer;
      if (changed) {
        observer.disconnect();
        composer = input;
        if (card) observer.observe(card);
      }
      stage.hidden = !input;
      if (!input) {
        if (state) enter(null);
        return;
      }
      stage.style.left = Math.round(rect.right - 196) + 'px';
      stage.style.top = Math.round(rect.top - 104) + 'px';
      const next = detect(input, card);
      if (changed || next !== state) enter(next);
    }

    function schedule() {
      if (!raf) raf = requestAnimationFrame(() => {
        raf = 0;
        refresh();
      });
    }

    function onInput(event) {
      if (event.target.closest?.(INPUT)) schedule();
    }

    function click(kind) {
      refresh();
      if (state === 'idle' && !action) interact(kind);
    }

    yun.button.addEventListener('click', () => click('yunlan'));
    df.button.addEventListener('click', () => click('df'));
    const observer = new ResizeObserver(schedule);
    for (const event of ['input', 'compositionstart', 'compositionend']) {
      document.addEventListener(event, onInput);
    }
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    // 兼顾宿主切换会话、异步按钮和无 input 事件的编辑器更新。
    const poll = setInterval(refresh, 300);
    refresh();

    const cleanup = () => {
      clearInterval(poll);
      cancelAnimationFrame(raf);
      cancelScene();
      observer.disconnect();
      for (const event of ['input', 'compositionstart', 'compositionend']) {
        document.removeEventListener(event, onInput);
      }
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
      for (const node of owned) node.remove();
    };
    if (typeof ctx.effect === 'function') ctx.effect(() => cleanup);
    else if (typeof ctx.on === 'function') ctx.on('dispose', cleanup);
  }

  window.__ModuleLoader__.load({
    id: 'dsh-yunlan-theme',
    factory: () => ({ apply: mount }),
  });
})();

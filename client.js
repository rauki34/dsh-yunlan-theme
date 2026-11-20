/**
 * dsh-yunlan-theme — client half.
 *
 * Links the server-served stylesheet into the page, then manages the optional
 * guest character. Guest state lives in localStorage so it survives reloads,
 * and nothing is written outside the browser profile.
 */
(function () {
  const LINES = [
    '我不是大肥鱼……',
    '看，我尾巴没翘。',
    '唔，这题我会。',
    '再看就把你吃掉（口粮）。',
  ];
  let lineIndex = 0;
  let lineTimer = null;

  function say(text) {
    const el = document.getElementById('yunlan-guest-line');
    if (!el) return;
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(lineTimer);
    lineTimer = setTimeout(() => el.classList.remove('show'), 2400);
  }

  function poke() {
    document.body.classList.remove('yunlan-guest-poked');
    void document.body.offsetWidth; // 重启动画
    document.body.classList.add('yunlan-guest-poked');
    setTimeout(() => document.body.classList.remove('yunlan-guest-poked'), 700);
    say(LINES[lineIndex++ % LINES.length]);
  }

  function setGuest(on) {
    if (on) {
      document.body.dataset.guest = 'dafeiyu';
      localStorage.setItem('dshYunlanGuest', 'on');
    } else {
      delete document.body.dataset.guest;
      localStorage.setItem('dshYunlanGuest', 'off');
    }
    const toggle = document.getElementById('yunlan-guest-toggle');
    if (toggle) toggle.title = on ? '客座：大肥鱼（点击切回云澜）' : '客座：云澜（点击切换大肥鱼）';
  }

  function teardown(nodes) {
    for (const n of nodes) n.remove();
    clearTimeout(lineTimer);
    delete document.body.dataset.guest;
  }

  window.__ModuleLoader__.load({
    id: 'dsh-yunlan-theme',
    factory() {
      return {
        apply(ctx) {
          if (document.getElementById('dsh-yunlan-theme')) return;

          const owned = [];
          const link = document.createElement('link');
          link.id = 'dsh-yunlan-theme';
          link.rel = 'stylesheet';
          link.href = '/dsh-yunlan/theme.css';
          document.head.appendChild(link);
          owned.push(link);

          const paint = document.createElement('meta');
          paint.name = 'theme-color';
          paint.content = '#FBFCFD';
          document.head.appendChild(paint);
          owned.push(paint);

          // —— 客座角色：默认关；点右下角小圆点切换 ——
          const guestLink = document.createElement('link');
          guestLink.id = 'dsh-yunlan-guest';
          guestLink.rel = 'stylesheet';
          guestLink.href = '/dsh-yunlan/guest.css';
          document.head.appendChild(guestLink);
          owned.push(guestLink);

          const spot = document.createElement('div');
          spot.id = 'yunlan-guest-hotspot';
          spot.addEventListener('click', poke);
          owned.push(spot);

          const line = document.createElement('div');
          line.id = 'yunlan-guest-line';
          line.setAttribute('role', 'status');
          owned.push(line);

          const toggle = document.createElement('button');
          toggle.id = 'yunlan-guest-toggle';
          toggle.type = 'button';
          toggle.setAttribute('aria-label', '切换客座角色');
          toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            setGuest(document.body.dataset.guest !== 'dafeiyu');
          });
          owned.push(toggle);

          document.body.appendChild(spot);
          document.body.appendChild(line);
          document.body.appendChild(toggle);

          if (localStorage.getItem('dshYunlanGuest') === 'on') setGuest(true);
          else setGuest(false);

          if (typeof ctx.effect === 'function') ctx.effect(() => () => teardown(owned));
          else if (typeof ctx.on === 'function') ctx.on('dispose', () => teardown(owned));
        },
      };
    },
  });
})();

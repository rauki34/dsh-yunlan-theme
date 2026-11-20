/**
 * dsh-yunlan-theme — client half.
 * 对齐 WorkBuddy：淡底纹由 CSS 内嵌，Q版挂件由 JS 创建并扒在输入框上。
 */
(function () {
  var ASSETS = {
    yunlan: [1, 2, 3, 4, 5, 6].map(function (i) { return '/dsh-yunlan/q/yunlan-' + i + '.webp'; }),
    dafeiyu: [1, 2, 3, 4, 5, 6].map(function (i) { return '/dsh-yunlan/q/dafeiyu-' + i + '.webp'; }),
  };
  var LINES = {
    yunlan: ['（轻轻探出头）', '雾有点大呢。', '（歪头）', '在这里哦。', '（眯眼）', '一直陪着你。'],
    dafeiyu: ['我不是大肥鱼……', '看，我尾巴没翘。', '唔，这题我会。', '口粮准备好了吗？', '哼，本来就这样。', '（打盹）'],
  };

  var who = 'yunlan';
  var faceIdx = 0;
  var lineTimer = null;
  var owned = [];

  function $(id) { return document.getElementById(id); }

  function place() {
    var buddy = $('yunlan-buddy');
    var line = $('yunlan-buddy-line');
    if (!buddy) return;
    // 锚点：输入框座席（WorkBuddy 用 .cr-input-container，DSH 用 composerSeat）
    // 真正的输入框（hero 和会话页共用同一个类）
    var seat = document.querySelector('[class*="_input"]') ||
               document.querySelector('[role="textbox"]') ||
               document.querySelector('[contenteditable="true"]') ||
               document.querySelector('textarea');
    if (!seat) return;
    var r = seat.getBoundingClientRect();
    if (r.width <= 0 || r.width > window.innerWidth * 0.9) return;
    // 扒在输入框右上角，略微压住边框（对齐 WorkBuddy: right-98 / top-100）
    var left = Math.round(r.right - 92);
    var top = Math.round(r.top - 78);
    if (buddy.style.left !== left + 'px') buddy.style.left = left + 'px';
    if (buddy.style.top !== top + 'px') buddy.style.top = top + 'px';
    if (line) {
      line.style.left = Math.max(8, left - 132) + 'px';
      line.style.top = Math.max(8, top - 34) + 'px';
    }
  }

  function setFaces() {
    var wrap = $('yunlan-buddy');
    if (!wrap) return;
    var imgs = wrap.querySelectorAll('.face');
    var urls = ASSETS[who];
    for (var i = 0; i < imgs.length; i++) {
      var src = urls[i % urls.length];
      if (imgs[i].getAttribute('src') !== src) imgs[i].setAttribute('src', src);
      imgs[i].classList.toggle('on', i === faceIdx);
    }
  }

  function setWho(next) {
    who = next;
    faceIdx = 0;
    localStorage.setItem('dshYunlanBuddy', who);
    setFaces();
    var sw = $('yunlan-buddy-switch');
    if (sw) sw.title = who === 'yunlan' ? '当前：云澜（点击换大肥鱼）' : '当前：大肥鱼（点击换云澜）';
  }

  function say(idx) {
    var line = $('yunlan-buddy-line');
    if (!line) return;
    line.textContent = LINES[who][idx % LINES[who].length];
    line.classList.add('show');
    clearTimeout(lineTimer);
    lineTimer = setTimeout(function () { line.classList.remove('show'); }, 2400);
  }

  function poke() {
    var b = $('yunlan-buddy');
    if (!b) return;
    faceIdx = (faceIdx + 1) % 6;
    setFaces();
    b.classList.remove('pop');
    void b.offsetWidth;
    b.classList.add('pop');
    setTimeout(function () { b.classList.remove('pop'); }, 650);
    say(faceIdx);
  }

  function hoverLong() {
    var b = $('yunlan-buddy');
    if (!b) return;
    faceIdx = who === 'yunlan' ? 4 : 3;
    setFaces();
    b.classList.add('shy');
    setTimeout(function () { b.classList.remove('shy'); }, 650);
    say(faceIdx);
  }

  window.__ModuleLoader__.load({
    id: 'dsh-yunlan-theme',
    factory: function () {
      return {
        apply: function (ctx) {
          if ($('dsh-yunlan-theme')) return;

          var link = document.createElement('link');
          link.id = 'dsh-yunlan-theme';
          link.rel = 'stylesheet';
          link.href = '/dsh-yunlan/theme.css';
          document.head.appendChild(link); owned.push(link);

          var gl = document.createElement('link');
          gl.id = 'dsh-yunlan-guest';
          gl.rel = 'stylesheet';
          gl.href = '/dsh-yunlan/guest.css';
          document.head.appendChild(gl); owned.push(gl);

          var paint = document.createElement('meta');
          paint.name = 'theme-color'; paint.content = '#FBFCFD';
          document.head.appendChild(paint); owned.push(paint);

          var buddy = document.createElement('div');
          buddy.id = 'yunlan-buddy';
          var inner = document.createElement('div');
          inner.className = 'inner';
          for (var i = 0; i < 6; i++) {
            var im = document.createElement('img');
            im.className = 'face';
            im.alt = '';
            inner.appendChild(im);
          }
          buddy.appendChild(inner);
          document.body.appendChild(buddy); owned.push(buddy);

          var line = document.createElement('div');
          line.id = 'yunlan-buddy-line';
          line.setAttribute('role', 'status');
          document.body.appendChild(line); owned.push(line);

          var sw = document.createElement('button');
          sw.id = 'yunlan-buddy-switch';
          sw.type = 'button';
          sw.setAttribute('aria-label', '切换挂件角色');
          sw.addEventListener('click', function (e) {
            e.stopPropagation();
            setWho(who === 'yunlan' ? 'dafeiyu' : 'yunlan');
          });
          document.body.appendChild(sw); owned.push(sw);

          var hoverTimer = null;
          buddy.addEventListener('click', poke);
          buddy.addEventListener('mouseenter', function () {
            hoverTimer = setTimeout(hoverLong, 1200);
          });
          buddy.addEventListener('mouseleave', function () { clearTimeout(hoverTimer); });

          setWho(localStorage.getItem('dshYunlanBuddy') === 'dafeiyu' ? 'dafeiyu' : 'yunlan');
          place();

          // 事件驱动重排：DOM 变化 / resize，rAF 合帧
          var pending = false;
          function schedule() {
            if (pending) return;
            pending = true;
            requestAnimationFrame(function () { pending = false; try { place(); } catch (e) {} });
          }
          var obs = new MutationObserver(schedule);
          obs.observe(document.body, { childList: true, subtree: true });
          window.addEventListener('resize', schedule);

          var cleanup = function () {
            try { obs.disconnect(); } catch (e) {}
            clearTimeout(lineTimer);
            clearTimeout(hoverTimer);
            for (var i = 0; i < owned.length; i++) owned[i].remove();
          };
          if (typeof ctx.effect === 'function') ctx.effect(function () { return cleanup; });
          else if (typeof ctx.on === 'function') ctx.on('dispose', cleanup);
        },
      };
    },
  });
})();

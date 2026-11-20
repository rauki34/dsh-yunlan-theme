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
    // 精确锚点：DSH 的 composer 输入框。用 id 前缀匹配，避免抓到设置/搜索里的 input
    var seat = document.querySelector('div[class*="GRgSLq_input"]') ||
               document.querySelector('[class*="composerStack"] [class*="_input"]');
    if (!seat) { buddy.style.display = 'none'; hideSwitch(); return; }
    var r = seat.getBoundingClientRect();
    // 只在输入框真正可见、且在视口内时显示；其它页面（设置/弹窗/侧栏）一律隐藏
    var visible = r.width > 240 && r.width < window.innerWidth * 0.85 &&
                  r.height > 20 && r.height < 260 &&
                  r.top > 0 && r.top < window.innerHeight &&
                  r.bottom <= window.innerHeight + 4 &&
                  getComputedStyle(seat).visibility !== 'hidden' &&
                  getComputedStyle(seat).display !== 'none';
    if (!visible) { buddy.style.display = 'none'; hideSwitch(); if (line) line.classList.remove('show'); return; }
    buddy.style.display = '';
    showSwitch();
    // 扒在输入框右上角，略微压住边框（对齐 WorkBuddy: right-98 / top-100）
    var left = Math.round(r.right - 92);
    var top = Math.round(r.top - 78);
    if (buddy.style.left !== left + 'px') buddy.style.left = left + 'px';
    if (buddy.style.top !== top + 'px') buddy.style.top = top + 'px';
    if (line) {
      line.style.left = Math.max(8, left - 132) + 'px';
      line.style.top = Math.max(8, top - 34) + 'px';
    }
    var sw = $('yunlan-buddy-switch');
    if (sw) {
      sw.style.left = Math.max(8, left - 4) + 'px';
      sw.style.top = (top + 100) + 'px';
    }
  }

  function hideSwitch() { var sw = $('yunlan-buddy-switch'); if (sw) sw.style.display = 'none'; }
  function showSwitch() { var sw = $('yunlan-buddy-switch'); if (sw) sw.style.display = ''; }

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
    if (sw) {
      var btns = sw.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('on', btns[i].dataset.who === who);
    }
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

          var sw = document.createElement('div');
          sw.id = 'yunlan-buddy-switch';
          sw.setAttribute('aria-label', '切换挂件角色');
          [['yunlan', '云澜'], ['dafeiyu', '大肥鱼']].forEach(function (pair) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.dataset.who = pair[0];
            btn.title = pair[1];
            btn.setAttribute('aria-label', pair[1]);
            btn.style.backgroundImage = 'url(/dsh-yunlan/q/' + pair[0] + '-1.webp)';
            btn.addEventListener('click', function (e) { e.stopPropagation(); setWho(pair[0]); });
            sw.appendChild(btn);
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

          // rAF 合帧；只监听 resize + 锚点尺寸变化，避免全局 observer 乱飞
          var pending = false;
          function schedule() {
            if (pending) return;
            pending = true;
            requestAnimationFrame(function () { pending = false; try { place(); } catch (e) {} });
          }
          window.addEventListener('resize', schedule);

          var ro = null;
          try {
            ro = new ResizeObserver(schedule);
            var anchor = document.querySelector('div[class*="GRgSLq_input"]');
            if (anchor) ro.observe(anchor);
          } catch (e) {}
          // 低频兜底：页面切换（hero <-> 会话）时锚点会换节点
          var tick = setInterval(function () {
            var a = document.querySelector('div[class*="GRgSLq_input"]');
            if (a && ro) { try { ro.disconnect(); ro.observe(a); } catch (e) {} }
            schedule();
          }, 1600);

          var cleanup = function () {
            clearInterval(tick);
            try { if (ro) ro.disconnect(); } catch (e) {}
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

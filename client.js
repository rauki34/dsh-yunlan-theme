/**
 * dsh-yunlan-theme — 双角色动画舞台
 *
 * 云澜（小龙）与大肥鱼常驻在输入框右上角，随 DSH 状态自发表演：
 *   idle     闲置    — 云澜打盹，大肥鱼捧碗吃白饭
 *   typing   输入中  — 云澜凑近注视，大肥鱼放下碗偷看
 *   thinking 生成中  — 云澜焦急催促，大肥鱼手忙脚乱
 *   interact 偶发    — 闲置够久，云澜戳一下大肥鱼，她惊跳后鼓腮
 * 所有演出都是 CSS 动画 + 表情切换，不拦截输入、不改宿主 DOM。
 */
(function () {
  var Q = '/dsh-yunlan/q/';
  // 每套 6/8 张独立表情：状态切换时图片真的会变，交互看得见
  // 云澜：1普通 2开心 3关注 4害羞 5打盹 6困
  var YUN = [1,2,3,4,5,6].map(function (i) { return Q + 'yunlan-' + i + '.webp'; });
  // 大肥鱼：8 个语义表情（半身裁切）
  var DF = {
    idle: Q + 'df-idle.webp', eat: Q + 'df-eat.webp', surprise: Q + 'df-surprise.webp',
    shy: Q + 'df-shy.webp', angry: Q + 'df-angry.webp', sleep: Q + 'df-sleep.webp',
    wink: Q + 'df-wink.webp', pout: Q + 'df-pout.webp',
  };

  var state = 'idle';
  var owned = [];
  var timers = [];
  var interactTimer = null;

  function $(id) { return document.getElementById(id); }
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearLaters() { for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]); timers = []; }

  /* ---------- DOM ---------- */
  function build() {
    var stage = document.createElement('div');
    stage.id = 'yunlan-stage';
    stage.innerHTML =
      '<div class="actor actor-yunlan" id="actor-yunlan"><div class="face on"><img src="' + YUN[0] + '" alt="云澜"></div></div>' +
      '<div class="actor actor-df" id="actor-df"><div class="face on"><img src="' + DF.eat + '" alt="大肥鱼"></div></div>' +
      '<div class="bubble" id="yunlan-bubble"></div>';
    // 点击角色 = 主动互动：切表情 + 台词，不用等偶发
    stage.addEventListener('click', function (e) {
      var actor = e.target.closest ? e.target.closest('.actor') : null;
      if (!actor) return;
      if (actor.id === 'actor-df') pokeDF();
      else pokeYun();
    });
    document.body.appendChild(stage); owned.push(stage);
    return stage;
  }

  function face(who, src) {
    var el = $(who === 'yunlan' ? 'actor-yunlan' : 'actor-df');
    if (!el) return;
    var img = el.querySelector('img');
    if (img && img.getAttribute('src') !== src) img.setAttribute('src', src);
  }

  function bubble(text, who, ms) {
    var b = $('yunlan-bubble');
    if (!b) return;
    b.textContent = text;
    b.className = 'bubble show' + (who === 'df' ? ' from-df' : '');
    clearLaters();
    later(function () { b.className = 'bubble'; }, ms || 2600);
  }

  function pokeDF() {
    var stage = $('yunlan-stage');
    if (!stage) return;
    stage.classList.add('jumped');
    face('df', DF.surprise);
    bubble('别戳！', 'df', 1300);
    later(function () {
      face('df', DF.angry);
      stage.classList.remove('jumped');
      bubble('我不是大肥鱼……', 'df', 1800);
    }, 700);
  }
  function pokeYun() {
    face('yunlan', YUN[1]);
    bubble('（歪头）怎么啦？', 'yunlan', 1600);
    later(function () { face('yunlan', state === 'idle' ? YUN[4] : YUN[0]); }, 1700);
  }

  /* ---------- 定位：只在输入框可见时显示，绝不乱飞 ---------- */
  function place() {
    var stage = $('yunlan-stage');
    if (!stage) return;
    var input = document.querySelector('div[class*="GRgSLq_input"]');
    if (!input) { stage.style.display = 'none'; return; }
    var r = input.getBoundingClientRect();
    var st = getComputedStyle(input);
    var ok = r.width > 240 && r.width < window.innerWidth * 0.85 &&
             r.height > 20 && r.height < 260 && r.top > 0 &&
             r.top < window.innerHeight && r.bottom <= window.innerHeight + 4 &&
             st.visibility !== 'hidden' && st.display !== 'none';
    if (!ok) { stage.style.display = 'none'; return; }
    stage.style.display = '';
    var left = Math.round(r.right - 196);
    var top = Math.round(r.top - 96);
    if (stage.style.left !== left + 'px') stage.style.left = left + 'px';
    if (stage.style.top !== top + 'px') stage.style.top = top + 'px';
  }

  /* ---------- 状态检测 ---------- */
  function detect() {
    var input = document.querySelector('div[class*="GRgSLq_input"]');
    var composer = document.querySelector('[data-composer-input]');
    // 生成中：停止按钮 / 流式标记 / phase
    var generating = !!document.querySelector('[aria-label*="停止"], [aria-label*="Stop"]') ||
                     /stream|generat|thinking/i.test(
                       (document.querySelector('[data-phase]') || {}).getAttribute?.('data-phase') || '');
    if (generating) return 'thinking';
    // 输入中：输入框 data-phase 不是 plain，或 placeholder 已消失（说明有真实输入）
    if (composer && /compos|typing|draft|active/i.test(composer.getAttribute('data-phase') || '')) return 'typing';
    if (input) {
      var phase = input.getAttribute('data-phase') || '';
      if (phase && phase !== 'plain') return 'typing';
    }
    return 'idle';
  }

  /* ---------- 演出 ---------- */
  function perform(next, force) {
    if (!force && next === state) return;
    state = next;
    var stage = $('yunlan-stage');
    if (!stage) return;
    stage.dataset.state = state;
    clearLaters();
    if (interactTimer) { clearTimeout(interactTimer); interactTimer = null; }

    if (state === 'idle') {
      face('yunlan', YUN[4]);           // 打盹
      face('df', DF.eat);               // 捧碗吃白饭
      bubble('（大肥鱼扒饭中…）', 'df', 2200);
      interactTimer = setTimeout(function () { perform('interact', true); }, 8000 + Math.random() * 6000);
    } else if (state === 'typing') {
      face('yunlan', YUN[2]);           // 凑近看
      face('df', DF.pout);              // 偷瞄
      bubble('在写什么呢？', 'yunlan', 2000);
    } else if (state === 'thinking') {
      face('yunlan', YUN[3]);           // 急
      face('df', DF.surprise);          // 被催
      bubble('快想想呀！', 'yunlan', 1800);
      later(function () { face('df', DF.shy); bubble('唔…在想了！', 'df', 1800); }, 1900);
    } else if (state === 'interact') {
      // 小龙戳大肥鱼 → 惊跳 → 鼓腮
      face('yunlan', YUN[1]);
      stage.classList.add('poking');
      later(function () {
        face('df', DF.surprise);
        bubble('别戳！', 'df', 1400);
        stage.classList.remove('poking');
        stage.classList.add('jumped');
      }, 520);
      later(function () {
        face('df', DF.angry);
        bubble('我不是大肥鱼……', 'df', 1800);
        stage.classList.remove('jumped');
        face('yunlan', YUN[5]);
      }, 1600);
      later(function () { perform('idle', true); }, 3600);
    }
  }

  /* ---------- 启动 ---------- */
  window.__ModuleLoader__.load({
    id: 'dsh-yunlan-theme',
    factory: function () {
      return {
        apply: function (ctx) {
          if ($('dsh-yunlan-theme') || $('yunlan-stage')) return;
          var themeLink = document.createElement('link');
          themeLink.id = 'dsh-yunlan-theme'; themeLink.rel = 'stylesheet';
          themeLink.href = '/dsh-yunlan/theme.css';
          document.head.appendChild(themeLink); owned.push(themeLink);

          var stageLink = document.createElement('link');
          stageLink.id = 'dsh-yunlan-stage'; stageLink.rel = 'stylesheet';
          stageLink.href = '/dsh-yunlan/stage.css';
          document.head.appendChild(stageLink); owned.push(stageLink);

          var paint = document.createElement('meta');
          paint.name = 'theme-color'; paint.content = '#FBFCFD';
          document.head.appendChild(paint); owned.push(paint);

          build(); place(); perform('idle', true);

          // 低频轮询状态（1.2s），只在状态变化时演出
          var tick = setInterval(function () { try { perform(detect()); } catch (e) {} }, 1200);
          var raf = 0;
          function schedule() {
            if (raf) return;
            raf = requestAnimationFrame(function () { raf = 0; try { place(); } catch (e) {} });
          }
          window.addEventListener('resize', schedule);
          var ro = null;
          try {
            ro = new ResizeObserver(schedule);
            var a = document.querySelector('div[class*="GRgSLq_input"]');
            if (a) ro.observe(a);
          } catch (e) {}
          var bind = setInterval(function () {
            var a = document.querySelector('div[class*="GRgSLq_input"]');
            if (a && ro) { try { ro.disconnect(); ro.observe(a); } catch (e) {} }
            schedule();
          }, 1600);

          var cleanup = function () {
            clearInterval(tick); clearInterval(bind); clearLaters();
            if (interactTimer) clearTimeout(interactTimer);
            try { if (ro) ro.disconnect(); } catch (e) {}
            for (var i = 0; i < owned.length; i++) owned[i].remove();
          };
          if (typeof ctx.effect === 'function') ctx.effect(function () { return cleanup; });
          else if (typeof ctx.on === 'function') ctx.on('dispose', cleanup);
        },
      };
    },
  });
})();

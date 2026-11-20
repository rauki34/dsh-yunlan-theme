# 联名方案：云澜 × 大肥鱼

> 目标：在现有的 `dsh-yunlan-theme` 上接入 GitHub 社区的「大肥鱼」形象，做成可开关的客座角色，**不改动主包配色、布局与功能**。

## 0. 先解决授权，它决定了方案形态

| 对象 | 来源 | 授权 |
| --- | --- | --- |
| 大肥鱼（DeepSeek 鲸鱼娘） | 社区二创，最早可追溯到 B 站 UP 主「上善无形」的原创角色「溟月」，后由「ZipZipPipe」加入 DeepSeek 元素 | **CC BY-NC-SA 4.0** |
| 本主题 | 本仓库 | MIT |

CC BY-NC-SA 的三条硬约束：**署名、非商业、相同方式共享**。

**结论：不要把大肥鱼素材并进 MIT 主包。**
拆成两个包：

```
dsh-yunlan-theme              MIT              主体配色 + 云澜立绘
dsh-yunlan-guest-dafeiyu      CC BY-NC-SA 4.0  只含大肥鱼素材与角色位覆盖
```

联动包依赖主包，卸载后主包完全不受影响。这样主包可以继续以 MIT 发布、可以被商用项目引用，联动包单独承担授权义务。

素材必须从**授权的原始来源**获取（上游仓库/作者发布页），并在联动包的 `ATTRIBUTION.md` 里写清：原作者、原始链接、协议、是否修改过（我们做了 alpha 提升与描边处理，属于「修改」，需要注明）。

## 1. 联动主题

**「雾中客座」**

设定：云澜是常驻，大肥鱼是路过的客人。两者**不同时出现**——靠雾气切换，而不是左右并排。

这条规则是整个方案的地基。同时放两个二次元立绘必然杂乱，也与「雾面克制」的基调冲突。

## 2. 视觉元素怎么融入

不整身照搬，只取三个识别点：

| 元素 | 用在哪 | 说明 |
| --- | --- | --- |
| 深蓝渐变长发 | 角色位主色 | 全界面唯一的高饱和蓝，作为视觉焦点 |
| 鲸尾 | 角色位下沿剪影 | 最经济的识别符号，小尺寸也能认出 |
| 白围裙 + 蓝胸针 | 仅 60px 侧栏小立绘 | 太细，大图里反而淹没 |

**配色纪律**：她的蓝紫（`#3A4A8C` 系）只允许出现在角色素材内部，**不进入 `--dsw-*` token**。界面仍然是中性灰白，蓝色只作为「画面里唯一一点颜色」，对比越强，角色越突出。

## 3. 展示位置（三选一，默认只开第一个）

| # | 位置 | 形式 | 默认 |
| --- | --- | --- | --- |
| 1 | 右下角角色位 | 与云澜同一位置，替换 | **开** |
| 2 | 侧栏底部 | 60×60 小立绘，悬停放大 | 关 |
| 3 | 新会话空状态 | 标题右侧 160px 插画 | 关 |

互斥实现：一个 `data-guest` 属性控制，同时只能取一个值。

```css
html body[data-guest="dafeiyu"]::after {
  background-image: url("/dsh-yunlan-guest/portrait.webp");
}
```

## 4. 交互细节

只做四条，够用且不打扰：

1. **悬停**：角色上浮 6px、轻微放大 1.02，头发与尾巴摆动一次（0.6s ease-out）。用透明热区 + `:has()` 驱动伪元素：

   ```css
   #yunlan-guest-hotspot { position: fixed; right: 0; bottom: 0; width: 38vw; height: 66vh; z-index: 2; }
   body:has(#yunlan-guest-hotspot:hover)::after {
     transform: translateY(-6px) scale(1.02);
     transition: transform 0.6s cubic-bezier(.22,.61,.36,1);
   }
   ```

2. **点击**：切「鼓腮抗议」表情（3 帧，各 400ms），底部浮一行短句（`我不是大肥鱼……`），2.4s 后消失。不弹窗、不抢焦点。

3. **空闲 30s**：眨眼一次。用 `animation-delay` + 长周期 `steps()`，零 JS。

4. **隐藏**：右键角色位 → 菜单「隐藏客座」，写入 `localStorage.dshYunlanGuest = 'off'`，`client.js` 首帧读取并设 `data-guest="none"`。

全部动效包在 `@media (prefers-reduced-motion: no-preference)` 里。

## 5. 实现结构

```
dsh-yunlan-guest-dafeiyu/
├── package.json          # dsh.bundle.patch + dsh.client，依赖 dsh-yunlan-theme
├── cordis.patch.yml      # insert: id: dsh-yunlan-guest-dafeiyu
├── index.js              # 只注册 /dsh-yunlan-guest/* 两条路由
├── client.js             # 注入 <link guest.css> + 热区 div + 点击/右键逻辑
├── guest.css             # 只覆盖角色位，不动 token
├── assets/
│   ├── portrait.webp     # 主立绘（透明，带描边）
│   └── face-pout.webp    # 鼓腮表情
├── ATTRIBUTION.md        # CC BY-NC-SA 署名与修改说明
├── LICENSE               # CC BY-NC-SA 4.0（仅本包）
└── README.md
```

`guest.css` 只允许写这些选择器：`body::after`、`#yunlan-guest-hotspot`、`#yunlan-guest-line`。**不碰 `--dsw-*`**，所以主包换色时联动包不需要跟着改。

`client.js` 骨架：

```js
window.__ModuleLoader__.load({
  id: 'dsh-yunlan-guest-dafeiyu',
  factory() {
    return {
      apply(ctx) {
        if (localStorage.getItem('dshYunlanGuest') === 'off') return;
        document.body.dataset.guest = 'dafeiyu';

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/dsh-yunlan-guest/guest.css';
        document.head.appendChild(link);

        const spot = document.createElement('div');
        spot.id = 'yunlan-guest-hotspot';
        spot.addEventListener('click', poke);
        spot.addEventListener('contextmenu', hide);
        document.body.appendChild(spot);

        const off = () => { link.remove(); spot.remove(); delete document.body.dataset.guest; };
        if (typeof ctx.effect === 'function') ctx.effect(() => off);
      },
    };
  },
});
```

## 6. 落地步骤

1. **取素材**：从授权来源下载立绘/表情，记录作者与原链接写进 `ATTRIBUTION.md`。
2. **处理成透明 webp**：沿用云澜那套管线——alpha 拉满、按亮度压内部线条、膨胀出描边、底部渐隐。输出 ≤ 200 KB。
3. **写 `guest.css`**：只覆盖 `body::after` 的 `background-image` 与悬停/点击状态。
4. **装包验证**：`dsh plugin --profile desktop add file:...`，重启后截图确认；再卸一次确认主包无残留。

## 7. 明确不做的事

排除项比功能列表更能防止画面变乱：

- ❌ 不加第二套界面配色（她的蓝只留在图片里）
- ❌ 不在正文区域加水印或小图案
- ❌ 不同时显示云澜与大肥鱼
- ❌ 不加音效、不加气泡弹窗、不加自动说话
- ❌ 不替换 DSH 的图标集（`ThemeDefinition.icons` 留给将来真要做品牌替换时用）

## 8. 落地前需要确认

1. 素材来源与授权：用哪个仓库/作者的版本？需要你在上游确认可再分发。
2. 默认开哪一处展示位（建议只开右下角角色位）。
3. 是否需要「一句话台词」——若要，台词要不要走角色设定（聪明、嘴硬、贪吃，不默认叫主人）。

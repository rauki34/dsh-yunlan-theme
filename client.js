/**
 * dsh-yunlan-theme — client half.
 *
 * Links the server-served stylesheet into the page. The stylesheet only uses
 * `--dsw-*` token overrides plus a handful of structural rules, so it survives
 * plugin updates as long as the design tokens keep their names.
 */
window.__ModuleLoader__.load({
  id: 'dsh-yunlan-theme',
  factory() {
    return {
      apply(ctx) {
        if (document.getElementById('dsh-yunlan-theme')) return;

        const link = document.createElement('link');
        link.id = 'dsh-yunlan-theme';
        link.rel = 'stylesheet';
        link.href = '/dsh-yunlan/theme.css';
        document.head.appendChild(link);

        // 首帧前把画布底色压到雾白，避免官方底色闪一下
        const paint = document.createElement('meta');
        paint.name = 'theme-color';
        paint.content = '#FBFCFD';
        document.head.appendChild(paint);

        const remove = () => link.remove();
        if (typeof ctx.effect === 'function') ctx.effect(() => remove);
        else if (typeof ctx.on === 'function') ctx.on('dispose', remove);
      },
    };
  },
});

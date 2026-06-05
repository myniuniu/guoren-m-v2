/**
 * 图片大图预览工具
 *
 * 用途：点击图片时弹出全屏 overlay 查看大图，点击遮罩关闭。
 * 不依赖外部 UI 库，直接操作 DOM。
 */

export function openImagePreviewOverlay(src: string): void {
  if (!src || typeof document === 'undefined') return;

  // 避免重复打开
  if (document.querySelector('[data-forward-image-overlay="true"]')) return;

  const overlay = document.createElement('div');
  overlay.dataset.forwardImageOverlay = 'true';
  overlay.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:100000;display:flex;align-items:center;justify-content:center;cursor:zoom-out;backdrop-filter:blur(4px);transition:opacity 0.2s ease;opacity:0;';

  const imgContainer = document.createElement('div');
  imgContainer.style.cssText =
    'width:90vw;height:90vh;display:flex;align-items:center;justify-content:center;';

  const previewImg = document.createElement('img');
  previewImg.src = src;
  previewImg.alt = '';
  previewImg.style.cssText =
    'max-width:100%;max-height:100%;object-fit:contain;box-shadow:0 12px 48px rgba(0,0,0,0.5);border-radius:12px;background:#fff;';

  imgContainer.appendChild(previewImg);
  overlay.appendChild(imgContainer);

  const close = () => {
    overlay.style.opacity = '0';
    window.setTimeout(() => {
      overlay.remove();
      document.removeEventListener('keydown', onKeyDown);
    }, 200);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
  };

  overlay.addEventListener('click', close);
  document.addEventListener('keydown', onKeyDown);

  document.body.appendChild(overlay);
  window.requestAnimationFrame(() => {
    overlay.style.opacity = '1';
  });
}

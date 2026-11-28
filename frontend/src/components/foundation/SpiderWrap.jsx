import { useEffect, useRef } from 'react';

export function SpiderWrap({ children, className = '' }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);

  function clear() {
    const layer = canvasRef.current;
    if (!layer) return;
    const context = layer.getContext('2d');
    if (!context) return;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, layer.width, layer.height);
  }

  useEffect(() => {
    window.addEventListener('blur', clear);
    return () => window.removeEventListener('blur', clear);
  }, []);

  function draw(event) {
    const layer = canvasRef.current;
    const wrap = wrapRef.current;
    if (!layer || !wrap) return;
    const context = layer.getContext('2d');
    if (!context) return;

    const bounds = layer.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const scale = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.round(bounds.width * scale);
    const height = Math.round(bounds.height * scale);
    if (layer.width !== width || layer.height !== height) {
      layer.width = width;
      layer.height = height;
    }
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, bounds.width, bounds.height);

    if (!event || event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const target = wrap.querySelector('a, button');
    if (!target) return;
    const button = target.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const btnLeft = button.left - bounds.left;
    const btnTop = button.top - bounds.top;
    const btnRight = button.right - bounds.left;
    const btnMidX = btnLeft + button.width / 2;
    const edge = x > btnMidX ? btnRight : btnLeft;
    const middle = btnTop + button.height / 2;
    const attachment = edge + (x < edge ? -8 : 8);
    const halfSpan = Math.min(18, Math.max(11, Math.round(button.height * 0.38)));
    const step = Math.max(5, Math.round(halfSpan / 2));

    const styles = getComputedStyle(wrap);
    const ink = styles.getPropertyValue('--ink').trim() || '#050d09';
    const silk = styles.getPropertyValue('--yellow').trim() || '#e7d78a';

    function traceWeb() {
      context.beginPath();
      for (let offset = -halfSpan; offset <= halfSpan; offset += step) {
        context.moveTo(edge, middle + offset);
        context.quadraticCurveTo(attachment, (middle + offset + y) / 2, x, y);
      }
      for (const fraction of [0.22, 0.42, 0.64, 0.82]) {
        const webX = edge + (x - edge) * fraction;
        const webY = middle + (y - middle) * fraction;
        const span = halfSpan * (1 - fraction);
        context.moveTo(webX, webY - span);
        context.quadraticCurveTo(webX + (edge - x) * 0.14, webY, webX, webY + span);
      }
      context.stroke();
    }

    // Pass 1: crisp dark ink web outside & around the pill
    context.save();
    context.strokeStyle = ink;
    context.globalAlpha = 0.62;
    context.lineWidth = 1;
    traceWeb();
    context.restore();

    // Pass 2: luminous silk web inside the hovered dark pill so threads stay crisp over --ink fill
    if (target.matches(':hover')) {
      context.save();
      const radius = Math.min(button.height / 2, 999);
      context.beginPath();
      if (typeof context.roundRect === 'function') {
        context.roundRect(btnLeft + 1, btnTop + 1, Math.max(0, button.width - 2), Math.max(0, button.height - 2), radius);
      } else {
        context.rect(btnLeft + 1, btnTop + 1, Math.max(0, button.width - 2), Math.max(0, button.height - 2));
      }
      context.clip();
      context.strokeStyle = silk;
      context.globalAlpha = 0.62;
      context.lineWidth = 0.95;
      traceWeb();
      context.restore();
    }
  }

  return (
    <div
      ref={wrapRef}
      className={`spider-wrap${className ? ` ${className}` : ''}`}
      onPointerMove={draw}
      onPointerLeave={clear}
      onPointerCancel={clear}
    >
      <canvas ref={canvasRef} className="spider-canvas" aria-hidden="true" />
      {children}
    </div>
  );
}

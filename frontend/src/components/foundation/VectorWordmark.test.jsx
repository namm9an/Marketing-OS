import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import VectorWordmark from './VectorWordmark';

const media = vi.hoisted(() => ({ reduced: false }));
vi.mock('../../lib/useMediaQuery', () => ({ useMediaQuery: () => media.reduced }));
let frames, gl, context;
beforeEach(() => {
  media.reduced = false;
  frames = new Map();
  let next = 0;
  vi.stubGlobal('requestAnimationFrame', vi.fn(callback => { frames.set(++next, callback); return next; }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn(id => frames.delete(id)));
  vi.stubGlobal('PointerEvent', class extends MouseEvent {
    constructor(type, options = {}) { super(type, options); this.pointerType = options.pointerType || 'mouse'; }
  });
  context = { fillRect: vi.fn(), scale: vi.fn(), fillText: vi.fn(), strokeText: vi.fn(), setLineDash: vi.fn(),
    measureText: () => ({ fontBoundingBoxAscent: 80, fontBoundingBoxDescent: 20 }) };
  gl = {};
  for (const name of ['shaderSource', 'compileShader', 'attachShader', 'bindAttribLocation', 'linkProgram',
    'bindBuffer', 'bufferData', 'enableVertexAttribArray', 'vertexAttribPointer', 'disable', 'activeTexture',
    'bindTexture', 'texParameteri', 'pixelStorei', 'texImage2D', 'viewport', 'useProgram', 'uniform1i', 'uniform2f',
    'uniform1f', 'uniform3f', 'uniform4f', 'drawArrays', 'deleteTexture', 'deleteBuffer', 'deleteProgram', 'deleteShader']) gl[name] = vi.fn();
  for (const name of ['createShader', 'createProgram', 'createBuffer', 'createTexture', 'getUniformLocation']) gl[name] = vi.fn(() => ({}));
  gl.getShaderParameter = vi.fn(() => true);
  gl.getProgramParameter = vi.fn(() => true);
  gl.isContextLost = () => false;
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(kind => kind === 'webgl' ? gl : kind === '2d' ? context : null);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top: 0, left: 0, right: 1000, bottom: 120, width: 1000, height: 120 });
});
function heading() {
  const host = screen.getByRole('heading', { level: 1, name: 'Marketing Helper' });
  host.style.fontSize = '100px'; host.style.fontFamily = 'sans-serif'; host.style.color = 'rgb(5, 13, 9)';
  return host;
}
function flush() { act(() => { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback(16)); }); }
function activate() { fireEvent.pointerMove(heading(), { clientX: 450, clientY: 60 }); flush(); }

it('keeps semantic crisp text at rest without starting graphics or an idle loop', () => {
  render(<VectorWordmark text="Marketing Helper" />);
  expect(heading()).toHaveAttribute('data-wordmark-state', 'static');
  expect(heading().textContent).toBe('Marketing Helper');
  expect(HTMLCanvasElement.prototype.getContext).not.toHaveBeenCalled();
  expect(frames.size).toBe(0);
});
it('uses the supplied shader and R/G atlas for three pointer-local coordinate handles', () => {
  render(<VectorWordmark text="Marketing Helper" />);
  activate();
  expect(heading()).toHaveAttribute('data-wordmark-state', 'active');
  expect(gl.shaderSource.mock.calls.some(([, code]) => code.includes('float dashedLine') && code.includes('float boxEdge'))).toBe(true);
  expect(context.fillText).toHaveBeenCalledTimes('MarketingHelper'.length);
  expect(context.strokeText).toHaveBeenCalledTimes('MarketingHelper'.length);
  expect(gl.drawArrays).toHaveBeenCalledTimes(1);
  for (const label of heading().querySelectorAll('.vector-wordmark-label')) expect(label.textContent).toMatch(/^\d+, \d+$/);
  expect(frames.size).toBe(0);
  activate();
  expect(gl.drawArrays).toHaveBeenCalledTimes(2);
  expect(gl.createProgram).toHaveBeenCalledTimes(1);
});
it('restores normal text on leave, cancel, scroll and blur without an exit loop', () => {
  render(<VectorWordmark text="Marketing Helper" />);
  for (const exit of [() => fireEvent.pointerLeave(heading()), () => fireEvent.pointerCancel(heading()), () => fireEvent.scroll(window), () => fireEvent.blur(window)]) {
    activate(); exit();
    expect(heading()).toHaveAttribute('data-wordmark-state', 'static');
    expect(frames.size).toBe(0);
  }
  fireEvent.pointerMove(heading(), { clientX: 450, clientY: 60 });
  fireEvent.pointerLeave(heading()); flush();
  expect(heading()).toHaveAttribute('data-wordmark-state', 'static');
});
it('keeps touch and runtime reduced-motion paths static', () => {
  const { rerender } = render(<VectorWordmark text="Marketing Helper" />);
  fireEvent.pointerMove(heading(), { clientX: 450, clientY: 60, pointerType: 'touch' });
  expect(frames.size).toBe(0);
  activate(); media.reduced = true;
  rerender(<VectorWordmark text="Marketing Helper" />);
  expect(heading()).toHaveAttribute('data-wordmark-state', 'static');
  expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
  fireEvent.pointerMove(heading(), { clientX: 450, clientY: 60 });
  expect(frames.size).toBe(0);
});
it('falls back and releases shaders when compilation fails', () => {
  gl.getShaderParameter.mockReturnValue(false);
  render(<VectorWordmark text="Marketing Helper" />); activate();
  expect(heading()).toHaveAttribute('data-wordmark-state', 'unavailable');
  expect(heading().textContent).toBe('Marketing Helper');
  expect(gl.deleteShader).toHaveBeenCalledTimes(1);
  expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
});
it('keeps readable text when WebGL is unavailable', () => {
  HTMLCanvasElement.prototype.getContext.mockReturnValue(null);
  render(<VectorWordmark text="Marketing Helper" />); activate();
  expect(heading()).toHaveAttribute('data-wordmark-state', 'unavailable');
  expect(gl.drawArrays).not.toHaveBeenCalled();
  expect(frames.size).toBe(0);
  activate(); activate();
  fireEvent.resize(window); activate();
  expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledTimes(1);
  expect(gl.drawArrays).not.toHaveBeenCalled();
  expect(frames.size).toBe(0);
});
it('catches thrown context creation and permits a single retry after restoration', () => {
  HTMLCanvasElement.prototype.getContext.mockImplementationOnce(() => { throw new Error('Context disabled'); });
  const { container } = render(<VectorWordmark text="Marketing Helper" />); activate();
  expect(heading()).toHaveAttribute('data-wordmark-state', 'unavailable');
  activate();
  expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledTimes(1);
  fireEvent(container.querySelector('canvas'), new Event('webglcontextrestored'));
  activate();
  expect(heading()).toHaveAttribute('data-wordmark-state', 'active');
  expect(gl.drawArrays).toHaveBeenCalledTimes(1);
});
it('rebuilds the existing text atlas after a size change and waits for new pointer input', () => {
  render(<VectorWordmark text="Marketing Helper" />); activate();
  fireEvent.resize(window);
  expect(heading()).toHaveAttribute('data-wordmark-state', 'static');
  expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
  expect(frames.size).toBe(0);
  activate();
  expect(gl.createProgram).toHaveBeenCalledTimes(2);
  expect(gl.drawArrays).toHaveBeenCalledTimes(2);
});
it('handles context loss and recreates graphics after restoration', () => {
  const { container } = render(<VectorWordmark text="Marketing Helper" />); activate();
  const layer = container.querySelector('canvas');
  const lost = new Event('webglcontextlost', { cancelable: true }); fireEvent(layer, lost);
  expect(lost.defaultPrevented).toBe(true);
  expect(heading()).toHaveAttribute('data-wordmark-state', 'unavailable');
  fireEvent(layer, new Event('webglcontextrestored')); activate();
  expect(heading()).toHaveAttribute('data-wordmark-state', 'active');
  expect(gl.createProgram).toHaveBeenCalledTimes(2);
});
it('cleans allocated graphics and pending work on unmount', () => {
  const { unmount } = render(<VectorWordmark text="Marketing Helper" />); activate();
  fireEvent.pointerMove(heading(), { clientX: 500, clientY: 60 }); unmount();
  expect(frames.size).toBe(0);
  expect(gl.deleteTexture).toHaveBeenCalledTimes(1);
  expect(gl.deleteBuffer).toHaveBeenCalledTimes(1);
  expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
  expect(gl.deleteShader).toHaveBeenCalledTimes(2);
});

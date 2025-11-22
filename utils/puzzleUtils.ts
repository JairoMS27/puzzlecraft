import { Piece, Difficulty } from '../types';

// 0 = flat, 1 = tab out, -1 = tab in
export const getConnectors = (rows: number, cols: number) => {
  const shapeArray = [];
  
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const shape = {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      };

      // Top
      if (y === 0) shape.top = 0;
      else shape.top = -1 * shapeArray[(y - 1) * cols + x].bottom;

      // Right
      if (x === cols - 1) shape.right = 0;
      else shape.right = Math.random() > 0.5 ? 1 : -1;

      // Bottom
      if (y === rows - 1) shape.bottom = 0;
      else shape.bottom = Math.random() > 0.5 ? 1 : -1;

      // Left
      if (x === 0) shape.left = 0;
      else shape.left = -1 * shapeArray[y * cols + (x - 1)].right;

      shapeArray.push(shape);
    }
  }
  return shapeArray;
};

export const calculateGrid = (difficulty: Difficulty) => {
  const total = difficulty;
  const side = Math.sqrt(total);
  return { rows: side, cols: side };
};

export const drawJigsawPath = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  shape: { top: number; right: number; bottom: number; left: number },
  scale: number = 1
) => {
  ctx.save();
  ctx.beginPath();
  ctx.translate(x, y);
  
  // Relative dimensions
  const w = width * scale;
  const h = height * scale;
  
  // Drawing path starting from top-left
  ctx.moveTo(0, 0);

  // Top Edge
  if (shape.top === 0) {
    ctx.lineTo(w, 0);
  } else {
    const sz = Math.min(w, h) * 0.25;
    const sgn = shape.top; // -1 or 1
    ctx.lineTo(w / 2 - sz, 0);
    ctx.bezierCurveTo(w / 2 - sz, -sz * sgn, w / 2 + sz, -sz * sgn, w / 2 + sz, 0);
    ctx.lineTo(w, 0);
  }

  // Right Edge
  if (shape.right === 0) {
    ctx.lineTo(w, h);
  } else {
    const sz = Math.min(w, h) * 0.25;
    const sgn = shape.right;
    ctx.lineTo(w, h / 2 - sz);
    ctx.bezierCurveTo(w + sz * sgn, h / 2 - sz, w + sz * sgn, h / 2 + sz, w, h / 2 + sz);
    ctx.lineTo(w, h);
  }

  // Bottom Edge
  if (shape.bottom === 0) {
    ctx.lineTo(0, h);
  } else {
    const sz = Math.min(w, h) * 0.25;
    const sgn = shape.bottom;
    ctx.lineTo(w / 2 + sz, h);
    ctx.bezierCurveTo(w / 2 + sz, h + sz * sgn, w / 2 - sz, h + sz * sgn, w / 2 - sz, h);
    ctx.lineTo(0, h);
  }

  // Left Edge
  if (shape.left === 0) {
    ctx.lineTo(0, 0);
  } else {
    const sz = Math.min(w, h) * 0.25;
    const sgn = shape.left;
    ctx.lineTo(0, h / 2 + sz);
    ctx.bezierCurveTo(-sz * sgn, h / 2 + sz, -sz * sgn, h / 2 - sz, 0, h / 2 - sz);
    ctx.lineTo(0, 0);
  }

  ctx.closePath();
  ctx.clip();
  ctx.restore();
};

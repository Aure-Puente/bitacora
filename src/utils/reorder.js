// Lógica pura para reordenar listas arrastrando.

export function moveItem(list, from, to) {
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

// Índice donde caería el elemento `from` si se lo desplaza `dy`.
// heights: alto de cada elemento | gap: separación entre ellos.
export function dragTargetIndex(heights, from, dy, gap = 0) {
  if (from < 0 || from >= heights.length) return from;
  const tops = [];
  let y = 0;
  heights.forEach((h) => {
    tops.push(y);
    y += h + gap;
  });

  const top = tops[from] + dy;
  const bottom = top + heights[from];
  const middle = (i) => tops[i] + heights[i] / 2;

  let target = from;
  for (let i = from + 1; i < heights.length && bottom > middle(i); i += 1) target = i;
  if (target !== from) return target;
  for (let i = from - 1; i >= 0 && top < middle(i); i -= 1) target = i;
  return target;
}

// Lógica pura de las votaciones.
// poll: { options: [{ id, text }], votes: { uid: optionId } }

export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 10;

// Limpia las opciones escritas en el formulario: sin vacías ni repetidas.
export function cleanOptions(texts) {
  const seen = new Set();
  const out = [];
  texts.forEach((t) => {
    const text = String(t || '').trim();
    const key = text.toLocaleLowerCase('es');
    if (!text || seen.has(key)) return;
    seen.add(key);
    out.push({ id: `o${out.length + 1}`, text });
  });
  return out;
}

// Resultado: opciones con sus votantes, total de votos y ganadoras (más de una si hay empate).
export function tallyPoll(poll) {
  const votes = poll.votes || {};
  const options = (poll.options || []).map((o) => ({
    ...o,
    voters: Object.keys(votes)
      .filter((uid) => votes[uid] === o.id)
      .sort(),
  }));
  const total = options.reduce((sum, o) => sum + o.voters.length, 0);
  const max = options.reduce((m, o) => Math.max(m, o.voters.length), 0);
  const winners = max > 0 ? options.filter((o) => o.voters.length === max) : [];
  return { options, total, winners };
}

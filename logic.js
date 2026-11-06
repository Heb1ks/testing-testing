(function(root) {
  function shuffle(items, random = Math.random) {
    const a = [...items];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function makeItems(questions, random = Math.random) {
    return [...questions].sort((a,b) => a.variant - b.variant || a.number - b.number).map(q => ({id:q.id, keys:shuffle([
      q.correct, ...shuffle(q.options.filter(o => o.key !== q.correct), random).slice(0,3).map(o => o.key)
    ], random)}));
  }
  function score(items, answers, bank) {
    const answered = items.filter(i => Boolean(answers[i.id])).length;
    const correct = items.filter(i => answers[i.id] === bank.get(i.id).correct).length;
    return {correct, answered, incorrect:answered - correct, skipped:items.length - answered, total:items.length, percent:answered ? Math.round(correct / answered * 100) : 0};
  }
  const api = {shuffle, makeItems, score};
  if (typeof module !== 'undefined') module.exports = api;
  root.QuizLogic = api;
})(typeof window !== 'undefined' ? window : globalThis);

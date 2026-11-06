'use strict';
const app = document.querySelector('#app');
const STORAGE = 'pm-practice-session-v1';
let questions = [], bank, session = null, storageAvailable = true;
const escapeHTML = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label = v => v === 'all' ? 'Все вопросы' : v === 'mistakes' ? 'Работа над ошибками' : `Вариант ${v}`;
function save() { try {localStorage.setItem(STORAGE, JSON.stringify(session));} catch {storageAvailable = false;} }
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE));
    if (!s || !Array.isArray(s.items) || !s.items.length || !s.answers || !Number.isInteger(s.index) || s.index < 0 || s.index >= s.items.length) return;
    const ids = new Set();
    for (const i of s.items) {
      const q = bank.get(i.id);
      if (!q || ids.has(i.id) || !Array.isArray(i.keys) || i.keys.length !== 4 || new Set(i.keys).size !== 4 || !i.keys.includes(q.correct) || i.keys.some(k => !q.options.some(o => o.key === k))) return;
      if (s.answers[i.id] && !i.keys.includes(s.answers[i.id])) return;
      ids.add(i.id);
    }
    session = s;
  } catch { storageAvailable = false; }
}
function scrollTop() {window.scrollTo({top:0, behavior:'instant'});}
function home() {
  app.innerHTML = `<section class="hero"><div><div class="eyebrow"><span class="dot"></span> ТВОЯ ПОДГОТОВКА К ЭКЗАМЕНУ</div><h1>Большая цель.<br><span>По одному вопросу.</span></h1><p class="intro">Управление проектами станет понятнее с практикой.<br>Пройди все вопросы, проверь себя и разбери ошибки.</p><div class="hero-actions"><button class="primary" id="start-all">Пройти все вопросы <span>↗</span></button>${session ? '<button class="secondary" id="resume">'+(session.finished ? 'Последний результат' : 'Продолжить тест')+'</button>' : ''}</div><div class="hero-facts"><span>177 вопросов</span><span>4 ответа на выбор</span><span>Без ограничения времени</span></div></div><aside class="study-card"><div class="study-top"><span>ТВОЙ ПЛАН</span><span>01 — 04</span></div><div class="study-visual" aria-hidden="true"><div class="orbit"></div><span>PM<span class="small-star">✳</span></span></div><h2>Практика даёт уверенность.</h2><p>Вопросы из твоего сборника.<br>Результат — после завершения.</p><div class="card-bottom"><span class="dot"></span> ГОТОВ К НОВОЙ ПОПЫТКЕ?</div></aside></section>
  <section class="variants-section"><div class="section-heading"><div><div class="eyebrow">ВЫБЕРИ СВОЙ ТЕМП</div><h2>Или начни с одного варианта</h2></div><span class="muted">4 набора из документа</span></div><div class="variant-grid">${[1,2,3,4].map((v) => `<button class="variant-card" data-variant="${v}"><div class="variant-top"><span class="variant-number">0${v}</span><span class="arrow">↗</span></div><h3>Вариант ${v}</h3><p>${questions.filter(q=>q.variant===v).length} вопросов <span>·</span> 4 ответа</p><div class="variant-tag">${v===2 ? 'Номер набора предположительный' : v===4 ? 'Все доступные вопросы' : 'Полный набор'}</div></button>`).join('')}</div></section>
  <div class="source-note"><span class="info-symbol">i</span><p><b>Все 177 вопросов из документа включены.</b> В наборе 2 доступны № 11–50; в наборе 4 — 37 вопросов. Остальных вопросов в исходнике нет. Формулировки и ключи сохранены; из пяти исходных ответов каждый раз выбираются правильный и три неверных. Порядок вопросов и ответов перемешивается.</p></div><div id="new-dialog"></div>`;
  document.querySelector('#start-all').onclick = () => requestStart('all');
  document.querySelectorAll('[data-variant]').forEach(b=>b.onclick=()=>requestStart(Number(b.dataset.variant)));
  if (session) document.querySelector('#resume').onclick=()=>session.finished ? result() : quiz();
  scrollTop();
}
function requestStart(mode) {
  if (session && !session.finished) {
    const d = document.querySelector('#new-dialog');
    d.innerHTML = `<dialog><h2>Начать новую попытку?</h2><p>Текущий прогресс будет заменён. Уже отвечено: ${Object.keys(session.answers).length} из ${session.items.length}.</p><div class="dialog-actions"><button class="secondary" id="cancel-new">Сохранить текущую</button><button class="primary" id="confirm-new">Начать новую</button></div></dialog>`;
    const dialog=d.querySelector('dialog');dialog.showModal();
    document.querySelector('#cancel-new').onclick=()=>dialog.close();
    document.querySelector('#confirm-new').onclick=()=>{dialog.close();start(mode);};
  } else start(mode);
}
function start(mode, selected) {
  const pool=selected || questions.filter(q=>mode==='all' || q.variant===mode);
  session={mode, items:QuizLogic.makeItems(pool), answers:{}, index:0, finished:false, started:Date.now()};
  save();quiz();scrollTop();
}
function quiz() {
  const i=session.items[session.index], q=bank.get(i.id), answered=Object.keys(session.answers).length;
  app.innerHTML=`<div class="quiz-heading"><button class="text-button" id="home">← На главную</button><span>${escapeHTML(label(session.mode))} <span class="muted">/ ${session.items.length} вопросов</span></span><span class="save-note">${storageAvailable ? 'Прогресс сохранён' : 'Прогресс только в этой вкладке'}</span></div><div class="quiz-layout"><section class="question-card"><div class="question-meta"><span class="eyebrow">ВОПРОС ${session.index+1} ИЗ ${session.items.length}</span><span class="pill">Вариант ${q.variant} · № ${q.number}</span></div><div class="progress"><div style="width:${answered/session.items.length*100}%"></div></div><h1 class="question-title" tabindex="-1">${escapeHTML(q.text).replace(/Question:/g,'<br><br>Question:')}</h1><fieldset class="options"><legend class="sr-only">Выберите один ответ</legend>${i.keys.map((k,n)=>`<label class="option ${session.answers[q.id]===k?'selected':''}"><input type="radio" name="answer" value="${k}" ${session.answers[q.id]===k?'checked':''}><span class="option-letter">${'ABCD'[n]}</span><span>${escapeHTML(q.options.find(o=>o.key===k).text)}</span><span class="radio-mark"></span></label>`).join('')}</fieldset><div class="question-controls"><button class="secondary" id="prev" ${session.index===0?'disabled':''}>← Назад</button><span class="muted">Один правильный ответ</span>${session.index<session.items.length-1?'<button class="primary" id="next">Далее →</button>':'<button class="primary" id="to-finish">К результату →</button>'}</div><p id="question-message" role="status" class="message"></p></section><aside class="navigator"><h2>Карта вопросов</h2><p>Отвечено <b>${answered}</b> из ${session.items.length}</p><div class="question-grid">${session.items.map((item,n)=>`<button aria-label="Вопрос ${n+1}${session.answers[item.id]?', ответ выбран':''}" ${n===session.index?'aria-current="step"':''} class="question-dot ${session.answers[item.id]?'answered':''} ${n===session.index?'current':''}" data-index="${n}">${n+1}</button>`).join('')}</div><div class="map-key"><span class="key-square"></span> Ответ выбран</div><button class="secondary finish-button" id="finish">Завершить тест</button><p class="navigator-note">Можно возвращаться к вопросам и менять ответы до завершения.</p></aside></div>`;
  document.querySelector('#home').onclick=home;
  document.querySelectorAll('input[name="answer"]').forEach(input=>input.onchange=()=>{session.answers[q.id]=input.value;save();quiz();document.querySelector(`input[value="${input.value}"]`).focus();});
  document.querySelector('#prev').onclick=()=>navigate(session.index-1);
  const next=document.querySelector('#next');if(next)next.onclick=()=>navigate(session.index+1);
  document.querySelectorAll('[data-index]').forEach(b=>b.onclick=()=>navigate(Number(b.dataset.index)));
  document.querySelector('#finish').onclick=finish;
  const end=document.querySelector('#to-finish');if(end)end.onclick=finish;
}
function navigate(index) {session.index=index;save();quiz();scrollTop();document.querySelector('.question-title').focus();}
function finish() {
  const missing=session.items.filter(i=>!session.answers[i.id]);
  if(missing.length) {document.querySelector('#question-message').textContent=`Осталось ответить на ${missing.length} вопросов. Переходим к первому пропущенному.`;session.index=session.items.findIndex(i=>!session.answers[i.id]);save();quiz();document.querySelector('#question-message').textContent=`Осталось ответить на ${missing.length} вопросов. Выберите ответ, чтобы завершить тест.`;scrollTop();return;}
  session.finished=true;save();result();scrollTop();
}
function result() {
  const score=QuizLogic.score(session.items,session.answers,bank);
  const wrong=session.items.filter(i=>session.answers[i.id]!==bank.get(i.id).correct);
  app.innerHTML=`<div class="quiz-heading"><button class="text-button" id="home">← На главную</button><span>${escapeHTML(label(session.mode))}</span><span class="save-note">Попытка завершена</span></div><section class="result-card"><div><div class="eyebrow">ТВОЙ РЕЗУЛЬТАТ</div><h1>${score.percent===100?'Отличная работа!':score.percent>=70?'Хорошая основа.': 'Каждая попытка — шаг вперёд.'}</h1><p class="intro">${score.percent===100?'Ты ответил правильно на все вопросы этой попытки.':'Посмотри разбор ответов и закрепи то, что пока вызывает вопросы.'}</p><div class="result-stats"><div><strong>${score.correct}<small> / ${score.total}</small></strong><span>правильных ответов</span></div><div><strong>${wrong.length}</strong><span>ошибок</span></div></div><div class="hero-actions"><button class="primary" id="retry">Пройти ещё раз ↗</button>${wrong.length?'<button class="secondary" id="retry-wrong">Повторить ошибки</button>':''}</div></div><div class="score-ring" style="--score:${score.percent}%"><div><strong>${score.percent}<small>%</small></strong><span>верных ответов</span></div></div></section><section class="breakdown"><h2>Результат по вариантам</h2><div class="breakdown-grid">${[1,2,3,4].map(v=>{const items=session.items.filter(i=>bank.get(i.id).variant===v);if(!items.length)return '';const s=QuizLogic.score(items,session.answers,bank);return `<div><span>Вариант ${v}</span><b>${s.correct} / ${s.total}</b><div class="progress"><div style="width:${s.percent}%"></div></div></div>`;}).join('')}</div></section><section class="review-section"><div class="section-heading"><h2>Разбор ответов</h2><label class="review-filter"><input type="checkbox" id="only-wrong"> Только ошибки (${wrong.length})</label></div><div id="review"></div></section>`;
  document.querySelector('#home').onclick=home;
  document.querySelector('#retry').onclick=()=>start(session.mode,session.items.map(i=>bank.get(i.id)));
  if(wrong.length)document.querySelector('#retry-wrong').onclick=()=>start('mistakes',wrong.map(i=>bank.get(i.id)));
  document.querySelector('#only-wrong').onchange=e=>review(e.target.checked);
  review(false);
}
function review(onlyWrong) {
  const items=session.items.filter(i=>!onlyWrong || session.answers[i.id]!==bank.get(i.id).correct);
  document.querySelector('#review').innerHTML=items.length?items.map(i=>{const q=bank.get(i.id), right=session.answers[i.id]===q.correct;return `<details class="review-item ${right?'right':'wrong'}"><summary><span class="review-status">${right?'✓':'×'}</span><span><small>Вариант ${q.variant} · № ${q.number}</small>${escapeHTML(q.text)}</span><span class="expand">＋</span></summary><div class="review-options">${i.keys.map(k=>`<p class="${k===q.correct?'correct-answer':k===session.answers[i.id]?'wrong-answer':''}"><span>${k===q.correct?'✓':k===session.answers[i.id]?'×':'·'}</span> ${escapeHTML(q.options.find(o=>o.key===k).text)} ${k===q.correct?'<b>Правильный ответ</b>':k===session.answers[i.id]?'<b>Ваш ответ</b>':''}</p>`).join('')}</div></details>`;}).join(''):'<p class="empty-state">Ошибок нет. Все ответы правильные!</p>';
}
fetch('questions.json').then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json();}).then(data=>{questions=data;bank=new Map(data.map(q=>[q.id,q]));load();home();}).catch(()=>{app.innerHTML='<div class="empty-state"><h1>Не удалось загрузить вопросы</h1><p>Проверьте подключение и обновите страницу.</p><button class="primary" onclick="location.reload()">Попробовать снова</button></div>';});

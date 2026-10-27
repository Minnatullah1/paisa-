const CATS = {
  Food:'#e4572e', Travel:'#2e86ab', Shopping:'#8e5bd9',
  Bills:'#f2a541', Health:'#1b998b', Other:'#7a8b94'
};
const KEY = 'paisa.expenses.v1';
const $ = id => document.getElementById(id);
const inr = n => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(n);

let expenses = load();
let period = new Date().toISOString().slice(0,7); // YYYY-MM or 'all'

function load(){
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}
function save(){
  try { localStorage.setItem(KEY, JSON.stringify(expenses)); } catch {}
}

function monthLabel(m){
  if (m === 'all') return 'All time';
  const [y,mo] = m.split('-');
  return new Date(y, mo-1).toLocaleString('en-IN',{month:'long',year:'numeric'});
}

function fillMonths(){
  const set = new Set(expenses.map(e => e.date.slice(0,7)));
  set.add(new Date().toISOString().slice(0,7));
  if (period !== 'all') set.add(period);
  const months = [...set].sort().reverse();
  const sel = $('month');
  sel.innerHTML = '';
  months.concat('all').forEach(m => {
    const o = document.createElement('option');
    o.value = m; o.textContent = monthLabel(m);
    sel.appendChild(o);
  });
  sel.value = period;
}

function render(){
  fillMonths();
  const rows = expenses
    .filter(e => period === 'all' || e.date.startsWith(period))
    .sort((a,b) => b.date.localeCompare(a.date) || b.id - a.id);
  const total = rows.reduce((s,e) => s + e.amount, 0);

  $('periodLabel').textContent = 'Spent · ' + monthLabel(period);
  $('total').textContent = inr(total);

  // category split
  const by = {};
  rows.forEach(e => by[e.category] = (by[e.category]||0) + e.amount);
  const bar = $('bar'), legend = $('legend');
  bar.innerHTML = ''; legend.innerHTML = '';
  Object.entries(by).sort((a,b) => b[1]-a[1]).forEach(([c,v]) => {
    const s = document.createElement('span');
    s.style.width = (v/total*100) + '%';
    s.style.background = CATS[c];
    s.title = c + ': ' + inr(v);
    bar.appendChild(s);
    const li = document.createElement('li');
    const i = document.createElement('i');
    i.style.background = CATS[c];
    li.append(i, c + ' ' + inr(v));
    legend.appendChild(li);
  });

  // list
  const list = $('list');
  list.innerHTML = '';
  rows.forEach(e => {
    const li = document.createElement('li');
    li.className = 'item';
    const dot = document.createElement('span');
    dot.className = 'dot'; dot.style.background = CATS[e.category];
    const info = document.createElement('div');
    const t = document.createElement('div'); t.textContent = e.title;
    const m = document.createElement('div'); m.className = 'meta';
    m.textContent = e.category + ' · ' + new Date(e.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'});
    info.append(t, m);
    const amt = document.createElement('span');
    amt.className = 'amt'; amt.textContent = inr(e.amount);
    const del = document.createElement('button');
    del.type = 'button'; del.className = 'del'; del.textContent = 'Delete';
    del.setAttribute('aria-label', 'Delete ' + e.title);
    del.onclick = () => { expenses = expenses.filter(x => x.id !== e.id); save(); render(); };
    li.append(dot, info, amt, del);
    list.appendChild(li);
  });
  $('empty').hidden = rows.length > 0;
}

function exportCSV(){
  const esc = v => '"' + String(v).replace(/"/g,'""') + '"';
  const lines = ['Date,Title,Category,Amount'].concat(
    expenses.slice().sort((a,b) => a.date.localeCompare(b.date))
      .map(e => [e.date, esc(e.title), e.category, e.amount].join(','))
  );
  const url = URL.createObjectURL(new Blob([lines.join('\n')], {type:'text/csv'}));
  const a = document.createElement('a');
  a.href = url; a.download = 'expenses.csv'; a.click();
  URL.revokeObjectURL(url);
}

Object.keys(CATS).forEach(c => {
  const o = document.createElement('option'); o.textContent = c; $('category').appendChild(o);
});
$('date').value = new Date().toISOString().slice(0,10);
$('month').onchange = e => { period = e.target.value; render(); };
$('export').onclick = exportCSV;
$('form').onsubmit = e => {
  e.preventDefault();
  const amount = parseFloat($('amount').value);
  if (!(amount > 0)) return;
  expenses.push({id: Date.now(), title: $('title').value.trim(), amount, date: $('date').value, category: $('category').value});
  if (period !== 'all') period = $('date').value.slice(0,7);
  save();
  $('title').value = ''; $('amount').value = '';
  $('title').focus();
  render();
};
render();

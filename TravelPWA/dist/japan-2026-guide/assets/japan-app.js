function showTab(name, el) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  el.classList.add('active');
  window.scrollTo({top: 0, behavior: 'smooth'});
}
function toggleDay(id) {
  const card = document.getElementById(id);
  card.classList.toggle('open');
  if (card.classList.contains('open'))
    setTimeout(() => card.scrollIntoView({behavior:'smooth',block:'nearest'}), 100);
}
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}
function closeBg(e, id) {
  if (e.target === document.getElementById(id)) closeModal(id);
}
window.addEventListener('load', () => {
  const today = new Date();
  const start = new Date('2026-03-27');
  const n = Math.floor((today - start) / 86400000) + 1;
  if (n >= 1 && n <= 12) {
    const c = document.getElementById('day' + n);
    if (c) { c.classList.add('open'); setTimeout(() => c.scrollIntoView({behavior:'smooth',block:'center'}), 400); }
  }
});

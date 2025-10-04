// blog-comments.js (clean, no admin UI, inherits site font)

// Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy,
  doc, setDoc, getDoc, updateDoc, increment
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyADk__fUKBVxL_FAIcvwrMqZqzZZXT6lak",
  authDomain: "blog-f21b6.firebaseapp.com",
  projectId: "blog-f21b6",
  storageBucket: "blog-f21b6.firebasestorage.app",
  messagingSenderId: "119502701679",
  appId: "1:119502701679:web:26e302829fe7128727b99a",
  measurementId: "G-JWBJN9TWBN"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Reazioni (tono blog + vichingo)
const REACTIONS = [
  { key: 'like',  label: '⚔️', title: 'Ben detto!',        desc: 'Approvazione, un pensiero valoroso' },
  { key: 'love',  label: '❤️', title: 'Mi scalda il cuore', desc: 'Parole che restano, come rune incise' },
  { key: 'wow',   label: '🪓', title: 'Sorprendente',        desc: 'Un colpo che non mi aspettavo' },
  { key: 'sad',   label: '🌒', title: 'Mi rattrista',        desc: 'Un’ombra cala sulla saga' },
  { key: 'angry', label: '🌋', title: 'Mi fa infuriare',     desc: 'La collera ribolle come un vulcano' },
];

// Utils
function getArticleId() {
  const meta = document.querySelector('meta[property="og:url"]')?.content;
  const fromMeta = meta ? meta.split('/').pop() : null;
  const base = (fromMeta || location.pathname.split('/').pop() || '').replace(/\.html?$/i, '');
  return base || 'homepage';
}
const articleId = getArticleId();

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
function fmtName(name='') { return (name||'').trim() || 'Anonimo'; }
function fmtInitials(name='') { return (fmtName(name)[0] || 'A').toUpperCase(); }
function fmtDate(ts) {
  try { return new Intl.DateTimeFormat(undefined, { dateStyle:'medium', timeStyle:'short' }).format(ts); }
  catch { return ts?.toLocaleString?.() || ''; }
}

// Struttura DOM: Commenti (lista) → Avviso → Reazioni + Form (sopra il footer)
function ensureContainers() {
  const containerHost =
    document.querySelector('footer.footer')?.parentElement
    || document.querySelector('footer')?.parentElement
    || document.querySelector('main')?.parentElement
    || document.body;

  const beforeNode = document.querySelector('footer') || document.querySelector('main:last-of-type') || null;

  let shell = document.getElementById('post-social');
  if (shell) return;

  shell = el('section', 'post-social container');
  shell.id = 'post-social';

  // 1) Commenti (lista)
  const commentsListCard = el('section', 'comments-section card');
  commentsListCard.id = 'commenti';
  commentsListCard.setAttribute('aria-label', "Commenti dell'articolo");
  const cHead = el('div', 'section-head');
  cHead.appendChild(el('h2', 'section-title', 'Commenti'));
  commentsListCard.appendChild(cHead);
  const empty = el('div','empty','Nessun commento… Scrivi il primo!'); empty.id='empty-comments'; empty.hidden=true;
  const list = el('div','comments-list');
  commentsListCard.appendChild(empty);
  commentsListCard.appendChild(list);

  // 2) Avviso “jarl”
  const notice = el('div','notice');
  notice.setAttribute('role','status');
  notice.textContent = 'Per cancellare o modificare un commento, contatta gli jarl della pagina.';

  // 3) Reazioni + Form
  const inputsWrap = el('div','social-inputs');

  // Reazioni
  const reactCard = el('section','reactions-section card'); reactCard.id = 'reazioni';
  reactCard.setAttribute('aria-label', "Reazioni all'articolo");
  const rHead = el('div','section-head');
  rHead.appendChild(el('h2','section-title','Reazioni'));
  const chip = el('span','chip','0'); chip.id = 'tot-reactions'; chip.setAttribute('aria-live','polite');
  rHead.appendChild(chip);
  reactCard.appendChild(rHead);
  const rRow = el('div','reactions-row'); rRow.setAttribute('role','group'); rRow.setAttribute('aria-label','Pulsanti reazione');
  reactCard.appendChild(rRow);

  // Form commento
  const formCard = el('section','comments-section card'); formCard.id = 'commenti-form';
  formCard.setAttribute('aria-label', "Aggiungi un commento");
  const fHead = el('div','section-head');
  fHead.appendChild(el('h2','section-title','Lascia un commento'));
  formCard.appendChild(fHead);

  const form = el('form','comments-form');
  form.setAttribute('autocomplete','off'); form.setAttribute('novalidate','');
  const fieldTwo = el('div','field two');
  const nameCtl = el('div','control');
  const nameLbl = el('label', null, 'Nome'); nameLbl.setAttribute('for','c-name');
  const nameInp = el('input'); nameInp.id='c-name'; nameInp.name='name'; nameInp.type='text'; nameInp.placeholder='Il tuo nome'; nameInp.required=true; nameInp.minLength=2; nameInp.maxLength=40;
  nameCtl.appendChild(nameLbl); nameCtl.appendChild(nameInp);
  const hpCtl = el('div','control hidden');
  const hpLbl = el('label', null, 'Sito'); hpLbl.setAttribute('for','c-website');
  const hpInp = el('input'); hpInp.id='c-website'; hpInp.name='website'; hpInp.type='text'; hpInp.setAttribute('tabindex','-1'); hpInp.setAttribute('autocomplete','off');
  hpCtl.appendChild(hpLbl); hpCtl.appendChild(hpInp);
  fieldTwo.appendChild(nameCtl); fieldTwo.appendChild(hpCtl);

  const textCtl = el('div','control');
  const textLbl = el('label', null, 'Commento'); textLbl.setAttribute('for','c-text');
  const textArea = document.createElement('textarea'); textArea.id='c-text'; textArea.name='text'; textArea.placeholder='Scrivi un commento...'; textArea.required=true; textArea.minLength=3; textArea.maxLength=1000; textArea.rows=5;
  const metaLine = el('div','meta-line'); const counter = el('span',null,'0/1000'); counter.id='char-count'; metaLine.appendChild(counter);
  textCtl.appendChild(textLbl); textCtl.appendChild(textArea); textCtl.appendChild(metaLine);

  const actions = el('div','actions');
  const btn = el('button','btn primary','Invia'); btn.type='submit';
  const hint = el('span','hint'); hint.id='form-hint'; hint.setAttribute('aria-live','polite');
  actions.appendChild(btn); actions.appendChild(hint);

  form.appendChild(fieldTwo); form.appendChild(textCtl); form.appendChild(actions);
  formCard.appendChild(form);

  // Mount
  shell.appendChild(commentsListCard);
  shell.appendChild(notice);
  inputsWrap.appendChild(reactCard);
  inputsWrap.appendChild(formCard);
  shell.appendChild(inputsWrap);

  containerHost.insertBefore(shell, beforeNode);
}


// Reazioni (solo +1) con toast stilizzato
async function renderReactions() {
  const root = document.querySelector('#reazioni .reactions-row');
  const totChip = document.getElementById('tot-reactions');
  if (!root) return;

  const docRef   = doc(db, 'articles', articleId);
  const votedKey = 'reaction:' + articleId;

  // Dev helper: sblocca da console
  window.__clearReaction = (id = articleId) => localStorage.removeItem('reaction:' + id);

  // Dev: ?clearReactions=1 nell’URL per pulire lo stato locale
  if (new URL(location.href).searchParams.get('clearReactions') === '1') {
    localStorage.removeItem(votedKey);
  }

  function buildButtons(counts = {}) {
    root.innerHTML = '';
    const already = localStorage.getItem(votedKey);

    REACTIONS.forEach(r => {
      const btn = el('button','reaction-btn');
      btn.dataset.key = r.key;
      btn.type = 'button';
      btn.title = r.title;
      btn.setAttribute('aria-label', `${r.title} — reazioni: ${counts[r.key] || 0}`);

      const emoji = el('span', 'emoji', r.label);
      const text  = el('span', 'text');
      const t     = el('span','title', r.title);
      const d     = el('span','desc', r.desc || '');
      text.appendChild(t); text.appendChild(d);

      const countEl = el('span','reaction-count', String(Number(counts[r.key] || 0)));

      btn.appendChild(emoji);
      btn.appendChild(text);
      btn.appendChild(countEl);

      const isActive = already === r.key;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');

      btn.addEventListener('click', async () => {
        const voted = localStorage.getItem(votedKey);
        if (voted) {
          // Feedback visivo + toast in stile
          btn.style.transition = 'transform .08s ease';
          btn.style.transform  = 'scale(0.98)';
          setTimeout(() => (btn.style.transform = ''), 90);

          showToast({
            title: 'Hai già votato',
            message: 'Puoi lasciare una sola reazione per articolo.',
            variant: 'warn',
            icon: '⚠️',
            timeout: 2400
          });
          return;
        }

        // Optimistic UI
        const prev    = Number(countEl.textContent || '0');
        const totPrev = Number(totChip?.textContent || '0');
        countEl.textContent = String(prev + 1);
        if (totChip) totChip.textContent = String(totPrev + 1);
        btn.classList.add('active');
        btn.setAttribute('aria-pressed','true');

        try {
          // Assicura che il doc esista
          const snap = await getDoc(docRef);
          if (!snap.exists()) {
            await setDoc(docRef, { createdAt: serverTimestamp(), reactions: {} }, { merge: true });
          }
          await updateDoc(docRef, { ['reactions.' + r.key]: increment(1) });
          localStorage.setItem(votedKey, r.key);
          // (opzionale) toast di conferma:
          // showToast({ title:'Grazie!', message:'Reazione registrata.', variant:'success', icon:'✅', timeout:1600 });
        } catch (e) {
          // rollback
          countEl.textContent = String(prev);
          if (totChip) totChip.textContent = String(totPrev);
          btn.classList.remove('active');
          btn.setAttribute('aria-pressed','false');

          console.error('[reactions] errore salvataggio:', e);
          showToast({
            title: 'Reazione non salvata',
            message: 'Controlla connessione o permessi Firestore.',
            variant: 'error',
            icon: '❌',
            timeout: 3200
          });
        }
      });

      root.appendChild(btn);
    });
  }

  // Render iniziale (0)
  buildButtons({});

  // Garantisce l'esistenza del doc articolo
  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      await setDoc(docRef, { createdAt: serverTimestamp(), reactions: {} }, { merge: true });
    }
  } catch (e) {
    console.error('[reactions] get/set doc fallita:', e);
  }

  // Live updates
  onSnapshot(docRef, (snap) => {
    const data   = snap.data() || {};
    const counts = data.reactions || {};
    const total  = REACTIONS.reduce((acc, r) => acc + Number(counts[r.key] || 0), 0);
    if (totChip) totChip.textContent = String(total);
    buildButtons(counts);
  }, (err) => {
    console.error('[reactions] snapshot error:', err);
    if (totChip) totChip.textContent = '0';
    buildButtons({});
  });
}


function renderComments() {
  const listRoot = document.querySelector('#commenti .comments-list');
  const empty = document.getElementById('empty-comments');
  const form = document.querySelector('#commenti-form .comments-form');
  if (!listRoot || !form) return;

  // --- Form principale (nuovo commento) ---
  const hint = form.querySelector('#form-hint');
  const nameEl = form.querySelector('#c-name');
  const textEl = form.querySelector('#c-text');
  const websiteEl = form.querySelector('#c-website'); // honeypot
  const counterEl = form.querySelector('#char-count');
  function setHint(msg, ok=false) { hint.textContent = msg || ''; hint.style.color = ok ? '#2e7d32' : ''; }

  textEl.addEventListener('input', () => {
    const v = (textEl.value || '').slice(0, 1000);
    textEl.value = v;
    counterEl.textContent = v.length + '/1000';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setHint('');
    const name = (nameEl.value || '').trim().slice(0,40);
    const text = (textEl.value || '').trim().slice(0,1000);
    const website = (websiteEl?.value || '').trim();
    if (website) return; // bot
    if (name.length < 2 || text.length < 3) { setHint('Compila i campi correttamente.'); return; }

    const lastKey = 'lastCommentAt:'+articleId;
    const last = parseInt(localStorage.getItem(lastKey) || '0', 10);
    const now = Date.now();
    if (now - last < 30000) { setHint('Attendi qualche secondo prima di inviare un altro commento.'); return; }

    try {
      const ref = collection(db, 'articles', articleId, 'comments');
      await addDoc(ref, { name, text, createdAt: serverTimestamp(), ua: navigator.userAgent.slice(0,120) });
      localStorage.setItem(lastKey, String(now));
      form.reset();
      counterEl.textContent = '0/1000';
      setHint('Commento inviato!', true);
    } catch(e) {
      console.warn('Errore invio commento', e);
      setHint('Impossibile inviare: permessi o rete.');
    }
  });

  // --- Un solo form “Rispondi” aperto (per commento o per singola risposta) ---
  let openReplyFormKey = null; // es. `${commentId}:root` oppure `${commentId}:${replyId}`

  function makeReplyForm(commentId, parentReplyId = null) {
    const wrap = el('form','reply-form');
    wrap.setAttribute('autocomplete','off'); wrap.setAttribute('novalidate','');

    const n = document.createElement('input'); n.type='text'; n.placeholder='Il tuo nome'; n.maxLength=40; n.required = true;
    const t = document.createElement('textarea'); t.rows=3; t.placeholder='Scrivi una risposta…'; t.maxLength=1000; t.required = true;

    const row = el('div','reply-actions');
    const send = document.createElement('button'); send.type='submit'; send.className='btn primary'; send.textContent='Invia';
    const cancel = document.createElement('button'); cancel.type='button'; cancel.className='btn ghost'; cancel.textContent='Annulla';
    const info = el('span','hint');

    row.appendChild(send); row.appendChild(cancel); row.appendChild(info);
    wrap.appendChild(n); wrap.appendChild(t); wrap.appendChild(row);

    wrap.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      info.textContent = '';
      const name = (n.value||'').trim().slice(0,40);
      const text = (t.value||'').trim().slice(0,1000);
      if (name.length < 2 || text.length < 3) { info.textContent='Compila i campi correttamente.'; return; }

      const throttleKey = 'lastReplyAt:'+articleId+':'+commentId+':'+(parentReplyId||'root');
      const last = parseInt(localStorage.getItem(throttleKey) || '0', 10);
      const now = Date.now();
      if (now - last < 20000) { info.textContent = 'Attendi alcuni secondi prima di inviare un\'altra risposta.'; return; }

      try {
        const rref = collection(db, 'articles', articleId, 'comments', commentId, 'replies');
        await addDoc(rref, { name, text, parent: parentReplyId || null, createdAt: serverTimestamp(), ua: navigator.userAgent.slice(0,120) });
        localStorage.setItem(throttleKey, String(now));
        n.value = ''; t.value = '';
        info.textContent = 'Risposta inviata!';
        setTimeout(() => { info.textContent=''; }, 1200);
      } catch (e) {
        console.warn('Errore invio risposta', e);
        info.textContent = 'Impossibile inviare: permessi o rete.';
      }
    });

    cancel.addEventListener('click', () => {
      if (openReplyFormKey) openReplyFormKey = null;
      wrap.remove();
    });

    return wrap;
  }

  // --- Stream commenti principali (più recenti prima) ---
  const cref = collection(db, 'articles', articleId, 'comments');
  const q = query(cref, orderBy('createdAt', 'desc'));

  onSnapshot(q, (snap) => {
    listRoot.innerHTML = '';
    let has = false;

    snap.forEach(docSnap => {
      const commentId = docSnap.id;
      const c = docSnap.data();
      const ts = c.createdAt?.toDate ? c.createdAt.toDate() : null;
      const jarlReply = c.reply || null;

      has = true;

      // Card commento
      const card = el('article','comment-card');
      const avatar = el('div','avatar', fmtInitials(c.name));
      const right = el('div');

      // Header meta: autore (badge) + data
      const meta = el('div','comment-meta');
      const authorBadge = el('span','comment-author', fmtName(c.name));
      const timeEl = document.createElement('time');
      timeEl.textContent = ts ? fmtDate(ts) : '';
      meta.appendChild(authorBadge);
      meta.appendChild(document.createTextNode(' '));
      meta.appendChild(timeEl);

      // Testo commento
      const text = el('div','comment-text', c.text || '');

      // Risposta “ufficiale” dei jarl (campo reply opzionale nel doc commento)
      if (jarlReply?.text) {
        const rWrap = el('div','reply-card');
        const rMeta = el('div','reply-meta',
          (jarlReply.name ? fmtName(jarlReply.name) : 'Jarl') +
          ' • ' +
          (jarlReply.createdAt?.toDate ? fmtDate(jarlReply.createdAt.toDate()) : '')
        );
        const rText = el('div','reply-text', jarlReply.text);
        rWrap.appendChild(rMeta); rWrap.appendChild(rText);
        right.appendChild(rWrap);
      }

      // Azioni sotto al commento (Rispondi)
      const actions = el('div','comment-actions-row');
      const replyBtn = document.createElement('button');
      replyBtn.type='button'; replyBtn.className='btn micro reply-btn'; replyBtn.textContent='Rispondi';
      actions.appendChild(replyBtn);

      replyBtn.addEventListener('click', () => {
        const key = `${commentId}:root`;
        if (openReplyFormKey && openReplyFormKey !== key) {
          const prev = listRoot.querySelector(`.reply-form[data-key="${openReplyFormKey}"]`);
          if (prev) prev.remove();
        }
        if (openReplyFormKey === key) {
          const cur = right.querySelector('.reply-form');
          if (cur) cur.remove();
          openReplyFormKey = null;
        } else {
          const rf = makeReplyForm(commentId, null);
          rf.dataset.key = key;
          actions.insertAdjacentElement('afterend', rf);
          openReplyFormKey = key;
          (rf.querySelector('input')||rf.querySelector('textarea'))?.focus();
        }
      });

      // Lista risposte (root + children)
      const repliesWrap = el('div','reply-list');
      const rref = collection(db, 'articles', articleId, 'comments', commentId, 'replies');
      const rq = query(rref, orderBy('createdAt','asc'));

      onSnapshot(rq, (snapR) => {
        repliesWrap.innerHTML = '';
        if (snapR.empty) {
          repliesWrap.appendChild(el('div','reply-empty','Nessuna risposta…'));
          return;
        }

        // Costruisci albero (max 2 livelli)
        const all = [];
        const byId = new Map();
        const children = new Map(); // parentId -> array
        snapR.forEach(rdoc => {
          const data = rdoc.data();
          const item = { id: rdoc.id, ...data };
          all.push(item);
          byId.set(item.id, item);
          const p = item.parent || null;
          if (!children.has(p)) children.set(p, []);
          children.get(p).push(item);
        });

        const roots = (children.get(null) || children.get(undefined) || []).slice();

        // render helper: una reply item + (eventuale) sottolista figli
        function renderReply(replyObj) {
          const tsr = replyObj.createdAt?.toDate ? replyObj.createdAt.toDate() : null;

          const item = el('div','reply-item');
          const rmeta = el('div','reply-meta');
          const rName = el('span','reply-author', fmtName(replyObj.name));
          const rTime = document.createElement('time'); rTime.textContent = tsr ? fmtDate(tsr) : '';
          rmeta.appendChild(rName);
          rmeta.appendChild(document.createTextNode(' • '));
          rmeta.appendChild(rTime);

          const rtext = el('div','reply-text', replyObj.text || '');

          // bottone Rispondi anche sotto alla risposta (per creare un child)
          const rActions = el('div','comment-actions-row');
          const rReplyBtn = document.createElement('button');
          rReplyBtn.type='button'; rReplyBtn.className='btn micro reply-btn'; rReplyBtn.textContent='Rispondi';
          rActions.appendChild(rReplyBtn);

          rReplyBtn.addEventListener('click', () => {
            const key = `${commentId}:${replyObj.id}`;
            if (openReplyFormKey && openReplyFormKey !== key) {
              const prev = listRoot.querySelector(`.reply-form[data-key="${openReplyFormKey}"]`);
              if (prev) prev.remove();
            }
            if (openReplyFormKey === key) {
              const cur = item.querySelector('.reply-form');
              if (cur) cur.remove();
              openReplyFormKey = null;
            } else {
              const rf = makeReplyForm(commentId, replyObj.id);
              rf.dataset.key = key;
              rActions.insertAdjacentElement('afterend', rf);
              openReplyFormKey = key;
              (rf.querySelector('input')||rf.querySelector('textarea'))?.focus();
            }
          });

          item.appendChild(rmeta);
          item.appendChild(rtext);
          item.appendChild(rActions);

          // figli (secondo livello)
          const kids = children.get(replyObj.id) || [];
          if (kids.length) {
            const childList = el('div','reply-list child-replies');
            kids.forEach(child => childList.appendChild(renderReplyLeaf(child)));
            item.appendChild(childList);
          }

          return item;
        }

        // foglia (non annidiamo oltre il secondo livello)
        function renderReplyLeaf(childObj) {
          const tsr = childObj.createdAt?.toDate ? childObj.createdAt.toDate() : null;
          const item = el('div','reply-item');
          const rmeta = el('div','reply-meta');
          const rName = el('span','reply-author', fmtName(childObj.name));
          const rTime = document.createElement('time'); rTime.textContent = tsr ? fmtDate(tsr) : '';
          rmeta.appendChild(rName);
          rmeta.appendChild(document.createTextNode(' • '));
          rmeta.appendChild(rTime);
          const rtext = el('div','reply-text', childObj.text || '');

          // bottone Rispondi anche qui, ma resterà sullo stesso livello (cap al 2° livello)
          const rActions = el('div','comment-actions-row');
          const rReplyBtn = document.createElement('button');
          rReplyBtn.type='button'; rReplyBtn.className='btn micro reply-btn'; rReplyBtn.textContent='Rispondi';
          rActions.appendChild(rReplyBtn);
          rReplyBtn.addEventListener('click', () => {
            const key = `${commentId}:${childObj.id}`;
            if (openReplyFormKey && openReplyFormKey !== key) {
              const prev = listRoot.querySelector(`.reply-form[data-key="${openReplyFormKey}"]`);
              if (prev) prev.remove();
            }
            if (openReplyFormKey === key) {
              const cur = item.querySelector('.reply-form');
              if (cur) cur.remove();
              openReplyFormKey = null;
            } else {
              const rf = makeReplyForm(commentId, childObj.id);
              rf.dataset.key = key;
              rActions.insertAdjacentElement('afterend', rf);
              openReplyFormKey = key;
              (rf.querySelector('input')||rf.querySelector('textarea'))?.focus();
            }
          });

          item.appendChild(rmeta);
          item.appendChild(rtext);
          item.appendChild(rActions);
          return item;
        }

        // render roots
        roots.forEach(r => repliesWrap.appendChild(renderReply(r)));
      });

      // Mount
      right.appendChild(meta);
      right.appendChild(text);
      right.appendChild(actions);
      right.appendChild(repliesWrap);

      card.appendChild(avatar);
      card.appendChild(right);
      listRoot.appendChild(card);
    });

    empty.hidden = has;
  }, (err) => {
    console.error('Snapshot error', err);
    listRoot.innerHTML = '';
    empty.hidden = false;
  });
}

function ensureToastStack() {
  let stack = document.getElementById('toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'toast-stack';
    document.body.appendChild(stack);
  }
  return stack;
}

function showToast({ title = 'Notifica', message = '', variant = 'info', timeout = 3000, icon = '🛡️' } = {}) {
  const stack = ensureToastStack();
  const toast = document.createElement('div');
  toast.className = `toast ${variant}`;

  const iconEl = document.createElement('div');
  iconEl.className = 'icon';
  iconEl.textContent = icon;

  const body = document.createElement('div');
  const h = document.createElement('div'); h.className = 'title'; h.textContent = title;
  const p = document.createElement('div'); p.className = 'msg';   p.textContent = message;
  body.appendChild(h); body.appendChild(p);

  const btn = document.createElement('button');
  btn.className = 'close'; btn.type = 'button'; btn.setAttribute('aria-label', 'Chiudi');
  btn.textContent = '×';
  btn.addEventListener('click', () => toast.remove());

  toast.appendChild(iconEl);
  toast.appendChild(body);
  toast.appendChild(btn);
  stack.appendChild(toast);

  if (timeout > 0) {
    setTimeout(() => { toast.remove(); }, timeout);
  }
}




// Boot
function boot() {
  ensureContainers();
  renderReactions();
  renderComments();
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

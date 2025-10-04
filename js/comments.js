// Lightweight blog comments with Firebase Firestore (no registration)
// Drop-in script — requires <div id="comments-root"></div> in the page.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

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

// Derive a stable postId from URL path (e.g., 'articoli/drakonia')
const pathPart = location.pathname.replace(/\.html?$/i, "").replace(/^\//, "");
const postId = pathPart || "homepage";

const commentsCol = collection(db, "posts", postId, "comments");

function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k,v] of Object.entries(attrs)) {
    if (k === "class") e.className = v;
    else if (k === "for") e.htmlFor = v;
    else if (k.startsWith("on") && typeof v === "function") e.addEventListener(k.substring(2), v);
    else e.setAttribute(k, v);
  }
  for (const c of children) {
    if (c == null) continue;
    if (typeof c === "string") e.appendChild(document.createTextNode(c));
    else e.appendChild(c);
  }
  return e;
}

function render(container) {
  container.innerHTML = "";
  const title = el("h2", {"class":"comments-title"}, "Commenti");
  const list = el("div", {"id":"comments-list","class":"comments-list"},
    el("p", {"class":"muted"}, "Caricamento commenti...")
  );

  const form = el("form", {"id":"comment-form","class":"comment-form","autocomplete":"off"}, 
    el("div", {"class":"row"}, 
      el("label", {"for":"c-name"}, "Nome (visibile)"),
      el("input", {"id":"c-name","name":"name","maxlength":"40","placeholder":"Es. Fabio","required":""})
    ),
    el("div", {"class":"row"}, 
      el("label", {"for":"c-text"}, "Commento"),
      el("textarea", {"id":"c-text","name":"text","rows":"4","maxlength":"1200","placeholder":"Scrivi qui...","required":""})
    ),
    // Honeypot anti-bot
    el("div", {"class":"hp"}, 
      el("label", {"for":"c-website"}, "Lascia vuoto"),
      el("input", {"id":"c-website","name":"website","tabindex":"-1","autocomplete":"off"})
    ),
    el("div", {"class":"actions"}, 
      el("button", {"type":"submit","class":"btn"}, "Pubblica")
    ),
    el("p", {"class":"privacy-note"}, "Inviando il commento, accetti la pubblicazione del nome inserito e del contenuto su questa pagina. Nessuna registrazione richiesta.")
  );

  container.appendChild(title);
  container.appendChild(list);
  container.appendChild(form);

  // Live query for comments, newest first
  const q = query(commentsCol, orderBy("createdAt", "desc"));
  onSnapshot(q, (snap) => {
    list.innerHTML = "";
    if (snap.empty) {
      list.appendChild(el("p", {"class":"muted"}, "Ancora nessun commento. Scrivi il primo!"));
      return;
    }
    snap.forEach(doc => {
      const d = doc.data();
      const name = (d.name || "Anonimo").toString().slice(0,40);
      const text = (d.text || "").toString().slice(0, 2000);
      const when = d.createdAt && d.createdAt.toDate ? d.createdAt.toDate() : null;
      const dateStr = when ? when.toLocaleDateString() + " " + when.toLocaleTimeString() : "";
      list.appendChild(
        el("div", {"class":"comment"}, 
          el("div", {"class":"header"}, el("strong",{}, name), el("span",{"class":"date"}, dateStr)),
          el("p", {"class":"body"}, text)
        )
      );
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = form.querySelector("#c-name").value.trim().slice(0,40);
    const text = form.querySelector("#c-text").value.trim().slice(0, 2000);
    const hp = form.querySelector("#c-website").value.trim();
    if (hp) return; // bot
    if (!text) return alert("Scrivi un commento.");
    try {
      const btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      await addDoc(commentsCol, {
        name: name || "Anonimo",
        text,
        createdAt: serverTimestamp()
      });
      form.reset();
    } catch(err) {
      console.error(err);
      alert("Errore durante l'invio. Riprova.");
    } finally {
      const btn = form.querySelector("button[type=submit]");
      btn.disabled = false;
    }
  });
}

export function mountComments(rootId = "comments-root") {
  const root = document.getElementById(rootId);
  if (!root) return;
  render(root);
}

// Auto-mount if the container exists
if (document.getElementById("comments-root")) {
  mountComments();
}

# Cani di Odino - Blog System

## Come Aggiungere un Nuovo Articolo

### 1. Aggiungi l'articolo al JSON

Modifica `data/articles.json` e aggiungi un nuovo oggetto nell'array `articles`:

```json
{
  "id": 4,
  "title": "Titolo del Tuo Articolo",
  "slug": "titolo-del-tuo-articolo",
  "excerpt": "Breve descrizione dell'articolo che apparirà nelle anteprime",
  "category": "recensioni",
  "categoryName": "Recensioni GDR",
  "author": "Nome Autore",
  "date": "2025-03-15T00:00:00",
  "image": "./img/tua-immagine.jpg",
  "imageAlt": "Descrizione immagine",
  "tags": ["Tag1", "Tag2", "Tag3"]
}
```

### 2. Crea il file HTML dell'articolo

1. Copia `articoli/template-nuovo-articolo.html`
2. Rinominalo con lo stesso `slug` del JSON: `articoli/titolo-del-tuo-articolo.html`
3. Sostituisci i placeholder:
   - `[TITOLO ARTICOLO]` → Titolo del tuo articolo
   - `[SLUG]` → titolo-del-tuo-articolo (nel script alla fine)
   - `[AUTORE]` → Nome Autore
   - `[CATEGORIA NOME]` → Recensioni GDR
   - La data verrà caricata automaticamente dal JSON
   - Aggiungi il contenuto nei vari capitoli

### Campi Obbligatori nel JSON

- `id`: Numero identificativo unico
- `title`: Titolo dell'articolo
- `slug`: URL-friendly (senza spazi, caratteri speciali)
- `excerpt`: Descrizione breve per anteprime
- `category`: Chiave categoria (deve esistere in `categories`)
- `categoryName`: Nome completo della categoria
- `author`: Nome autore
- `date`: Data in formato ISO (YYYY-MM-DDTHH:mm:ss)

### Campi Opzionali

- `image`: Percorso immagine (default: `./img/logo.png`)
- `imageAlt`: Testo alternativo immagine (default: titolo articolo)
- `tags`: Array di tag (default: array vuoto)

### Gestione Date

La data nel JSON (`date`) viene usata per:
- **Data di sblocco**: L'articolo appare solo dopo questa data
- **Data di creazione**: Per ordinamento cronologico (più recenti prima)
- **Data visualizzata**: Formattata automaticamente in italiano

### Categorie Disponibili

- `recensioni`: Recensioni GDR
- `guide-master`: Guide Master
- `libri-game`: Libri Game

Per aggiungere nuove categorie, modifica l'oggetto `categories` nel JSON.

### Esempio Completo

```json
{
  "id": 4,
  "title": "Recensione di Dungeons & Dragons 5e",
  "slug": "recensione-dnd-5e",
  "excerpt": "Una recensione completa della quinta edizione del gioco di ruolo più famoso al mondo",
  "category": "recensioni",
  "categoryName": "Recensioni GDR",
  "author": "Grim",
  "date": "2025-03-01T00:00:00",
  "image": "./img/dnd5e.jpg",
  "imageAlt": "Copertina D&D 5e",
  "tags": ["D&D", "5e", "Recensione", "Fantasy"]
}
```

### Vantaggi del Sistema Ottimizzato

1. **Struttura JSON semplificata**: Solo i campi essenziali
2. **Date automatiche**: La data viene presa dal JSON e formattata automaticamente
3. **Gestione unlock**: Gli articoli appaiono automaticamente alla data specificata
4. **Facile manutenzione**: Aggiungi al JSON, crea il file HTML, tutto il resto è automatico
5. **Ordinamento automatico**: Gli articoli sono ordinati per data (più recenti prima)
6. **Categorizzazione automatica**: I filtri si aggiornano automaticamente

Il sistema è ora molto più semplice: aggiungi al JSON, crea il file HTML, e tutto il resto è automatico!
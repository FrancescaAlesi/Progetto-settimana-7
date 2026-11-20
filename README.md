# Progetto-settimana-7

# SportsHub — Eventi Sportivi

**SportsHub** è una web application front-end sviluppata in **HTML5, SCSS, Bootstrap 5 e JavaScript (ES6+ Modules)** che permette agli utenti di cercare squadre sportive di diverse discipline, salvarle tra i preferiti e consultare in tempo reale il calendario delle prossime partite e gli ultimi risultati tramite le API pubbliche di [TheSportsDB](https://www.thesportsdb.com/).

## Funzionalità principali

* **Ricerca in tempo reale con Debounce & AbortController**: digitando nella barra di ricerca (o inviando il form), l'app interroga l'API con un ritardo di `400ms` per evitare chiamate superflue e annulla automaticamente eventuali richieste precedenti ancora in sospeso.
* **Gestione Squadre Preferite (`localStorage`)**: possibilità di aggiungere o rimuovere squadre dai preferiti con persistenza locale nel browser e aggiornamento istantaneo dell'interfaccia.
* **Agenda "I tuoi prossimi appuntamenti"**: aggregazione automatica e ordinata cronologicamente dei prossimi eventi in programma per le squadre salvate nei preferiti, con deduplicazione degli incontri.
* **Ottimizzazione delle chiamate API**: caching in memoria (`Map`) per gli eventi delle singole squadre già visitate e scaglionamento delle richieste (`Promise.allSettled`) per prevenire errori di rate-limiting.

## Funzionalità Extra

Oltre alle funzionalità base di ricerca e salvataggio, l'applicazione include quattro interazioni avanzate per arricchire l'esperienza utente:

1. **Modale Dettagli Squadra al click sulla card**: cliccando su qualsiasi card (sia nei risultati di ricerca che tra i preferiti) si apre una finestra modale suddivisa in due colonne con i **Prossimi eventi** in programma e gli **Ultimi risultati** disputati dalla squadra selezionata.
2. **Filtri per Sport dedicati ai Preferiti**: i pulsanti nella sezione preferiti (**🏆 Tutti**, **⚽ Calcio**, **🏀 Basket**, **🏈 Football**) filtrano dinamicamente esclusivamente le squadre salvate dall'utente tra i preferiti (e di conseguenza aggiornano anche i relativi prossimi appuntamenti).
3. **Modale Dettagli Evento al click sui prossimi appuntamenti**: cliccando su una partita nell'elenco dei prossimi appuntamenti dei preferiti (o dentro la modale della squadra) si apre una modale dedicata con tutte le informazioni dell'incontro: squadre in campo, data formattata (`gg/mm/aaaa`), orario, competizione, stagione, stadio/luogo, stato del match, eventuale punteggio e immagine di anteprima.
4. **Modale Rosa e Statistiche Giocatori al click sul bottone "Rosa"**: facendo click sul pulsante **"Rosa"** si apre una modale dedicata che mostra l'elenco completo dei giocatori della squadra con le relative statistiche stagionali: **partite giocate, gol, assist, cartellini gialli e cartellini rossi**.

## Tecnologie utilizzate

* **HTML5** (markup semantico e accessibilità con attributi ARIA)
* **SCSS / CSS3** (variabili personalizzate, nesting, transizioni e sticky header)
* **Bootstrap 5.3** (sistema a griglia responsive, card, spinner, alert e modali)
* **JavaScript ES6+**
  * Architettura modulare (`type="module"` con `import`/`export`)
  * Programmazione orientata agli oggetti (classi `Squadra` ed `Evento`)
  * `Fetch API` con `async/await`, `URLSearchParams` e `AbortController`
  * Manipolazione sicura e performante del DOM tramite `createElement` e `DocumentFragment`
  * `localStorage` per il salvataggio dei preferiti
* **API**: [TheSportsDB API v1](https://www.thesportsdb.com/api.php)

## 📂 Struttura del progetto

Progetto-settimana-7
├── index.html               # Struttura principale della pagina e modali Bootstrap
├── assets/
│   ├── css/
│   │   └── style.css        # Foglio di stile compilato
│   ├── scss/
│   │   └── style.scss       # Stili sorgente in Sass (variabili, card, filtri, modali)
│   └── js/
│       ├── script.js        # Entry point: gestione stato, eventi utente e coordinamento moduli
│       ├── api.js           # Modelli dati (Squadra, Evento), chiamate fetch, cache e rate-limit handling
│       └── ui.js            # Funzioni di rendering DOM, spinner, alert e gestione modali
└── README.md                # Documentazione del progetto
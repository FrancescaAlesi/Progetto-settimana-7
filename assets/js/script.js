// SportsHub — Week Project Settimana VII
import {
  fetchSquadreByNome,
  fetchEventiSquadra,
  fetchProssimiEventiPreferite,
  fetchRosaSquadra,
  fetchStatsSingoloGiocatore,
} from "./api.js";
import {
  mostraSpinner,
  mostraAlert,
  renderPreferiti,
  renderCardSquadre,
  renderListaEventi,
  mostraModalEvento,
  mostraModalRosa,
} from "./ui.js";

const STORAGE_KEY = "sportshub_preferiti";

// === STATO ===
const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const sportFilters = document.querySelector("#sport-filters");

const searchEmpty = document.querySelector("#search-empty");
const risultatiTitolo = document.querySelector("#risultati-titolo");
const feedbackContainer = document.querySelector("#feedback-container");
const risultatiGrid = document.querySelector("#risultati-grid");
const preferiteList = document.querySelector("#preferite-list");
const preferiteEmpty = document.querySelector("#preferite-empty");
const preferiteEventiBox = document.querySelector("#preferite-eventi-box");
const preferiteEventiList = document.querySelector("#preferite-eventi-list");

let preferiti = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let currentResults = [];
let selectedSport = "ALL";
let debounceTimer = null;
let searchAbortController = null;

const cardCallbacks = {
  isPreferita: (idTeam) => preferiti.some((p) => p.idTeam === idTeam),
  onAggiungi: (squadra) => {
    if (!cardCallbacks.isPreferita(squadra.idTeam)) {
      preferiti.push(squadra);
      salvaPreferiti();
    }
  },
  onRimuovi: (idTeam) => {
    preferiti = preferiti.filter((p) => p.idTeam !== idTeam);
    salvaPreferiti();
  },
  onSelectSquadra: (idTeam, nomeSquadra) => {
    caricaDettagli(idTeam, nomeSquadra);
  },
  onApriRosa: async (squadra) => {
    const modalEl = document.getElementById("rosaSquadraModal");
    const titleEl = document.getElementById("rosaModalLabel");
    const tbody = document.getElementById("rosa-table-body");

    titleEl.textContent = `Rosa — ${squadra.strTeam}`;

    const trLoading = document.createElement("tr");
    const tdLoading = document.createElement("td");
    tdLoading.colSpan = 6;
    tdLoading.className = "py-4 text-muted";
    tdLoading.textContent = "Caricamento rosa...";
    trLoading.appendChild(tdLoading);
    tbody.replaceChildren(trLoading);

    window.bootstrap.Modal.getOrCreateInstance(modalEl).show();

    try {
      const rosa = await fetchRosaSquadra(squadra);
      mostraModalRosa(squadra.strTeam, rosa, fetchStatsSingoloGiocatore);
    } catch (error) {
      console.error("Errore reale Rosa:", error);
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 6;
      td.className = "text-danger py-3";
      td.textContent = `Errore: ${error.message}`;
      tr.appendChild(td);
      tbody.replaceChildren(tr);
    }
  },
};

function getPreferitiFiltrati() {
  if (selectedSport === "ALL") return preferiti;
  return preferiti.filter(
    (s) =>
      (s.strSport || "").trim().toLowerCase() === selectedSport.toLowerCase(),
  );
}

function aggiornaVistaPreferiti() {
  if (preferiti.length === 0) {
    preferiteEmpty.textContent =
      "Non hai ancora salvato nessuna squadra. Cercane una qui sopra e aggiungila ai preferiti.";
    renderPreferiti([], preferiteList, preferiteEmpty, cardCallbacks);
    preferiteEventiBox.classList.add("d-none");
    preferiteEventiList.replaceChildren();
    return;
  }

  const filtrati = getPreferitiFiltrati();

  if (filtrati.length === 0) {
    preferiteEmpty.textContent =
      "Nessuna squadra preferita per lo sport selezionato.";
    renderPreferiti([], preferiteList, preferiteEmpty, cardCallbacks);
    preferiteEventiBox.classList.add("d-none");
    preferiteEventiList.replaceChildren();
    return;
  }

  renderPreferiti(filtrati, preferiteList, preferiteEmpty, cardCallbacks);
  aggiornaProssimiAppuntamentiPreferite(filtrati);
}

function salvaPreferiti() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferiti));
  aggiornaVistaPreferiti();
  if (currentResults.length > 0) {
    renderCardSquadre(currentResults, risultatiGrid, cardCallbacks);
  }
}

// === API ===
async function aggiornaProssimiAppuntamentiPreferite(listaSquadre) {
  if (!listaSquadre || listaSquadre.length === 0) {
    preferiteEventiBox.classList.add("d-none");
    preferiteEventiList.replaceChildren();
    return;
  }

  preferiteEventiBox.classList.remove("d-none");
  mostraSpinner(preferiteEventiList);

  try {
    const eventi = await fetchProssimiEventiPreferite(listaSquadre);
    renderListaEventi(
      preferiteEventiList,
      eventi,
      "Nessun prossimo appuntamento in programma per le tue squadre preferite.",
      mostraModalEvento,
    );
  } catch (error) {
    mostraAlert(preferiteEventiList, error.message);
  }
}

async function cercaSquadre(query) {
  if (searchAbortController) {
    searchAbortController.abort();
  }
  searchAbortController = new AbortController();

  searchEmpty.classList.add("d-none");
  risultatiTitolo.classList.remove("d-none");
  risultatiGrid.replaceChildren();
  mostraSpinner(feedbackContainer);

  try {
    const squadre = await fetchSquadreByNome(
      query,
      searchAbortController.signal,
    );
    feedbackContainer.replaceChildren();

    if (squadre.length === 0) {
      currentResults = [];
      mostraAlert(feedbackContainer, "Nessuna squadra trovata.");
      return;
    }

    currentResults = squadre;
    renderCardSquadre(currentResults, risultatiGrid, cardCallbacks);
  } catch (error) {
    if (error.name === "AbortError") return;
    mostraAlert(feedbackContainer, error.message);
  }
}

async function caricaDettagli(idTeam, nomeSquadra) {
  const modalEl = document.getElementById("dettagliSquadraModal");
  const titleEl = document.getElementById("dettagli-team-name");
  const prossimiEl = document.getElementById("prossimi-eventi-list");
  const ultimiEl = document.getElementById("ultimi-risultati-list");

  titleEl.textContent = nomeSquadra;
  mostraSpinner(prossimiEl);
  mostraSpinner(ultimiEl);

  const modalInstance = window.bootstrap.Modal.getOrCreateInstance(modalEl);
  modalInstance.show();

  try {
    const { prossimi, ultimi } = await fetchEventiSquadra(idTeam);
    renderListaEventi(
      prossimiEl,
      prossimi,
      "Nessun evento in programma",
      mostraModalEvento,
    );
    renderListaEventi(
      ultimiEl,
      ultimi,
      "Nessun risultato recente",
      mostraModalEvento,
    );
  } catch (error) {
    mostraAlert(
      prossimiEl,
      "Troppe richieste ravvicinate all'API. Riprova tra qualche secondo.",
    );
    ultimiEl.replaceChildren();
  }
}

// === Eventi ===
if (sportFilters) {
  sportFilters.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-sport]");
    if (!btn) return;

    selectedSport = btn.dataset.sport;

    sportFilters.querySelectorAll(".sport-filter-btn").forEach((b) => {
      b.classList.remove("active");
    });
    btn.classList.add("active");

    aggiornaVistaPreferiti();
  });
}

searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  const query = searchInput.value.trim();

  if (!query) {
    if (searchAbortController) searchAbortController.abort();
    currentResults = [];
    risultatiGrid.replaceChildren();
    feedbackContainer.replaceChildren();
    searchEmpty.classList.remove("d-none");
    return;
  }

  debounceTimer = setTimeout(() => {
    cercaSquadre(query);
  }, 2000);
});

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  clearTimeout(debounceTimer);
  const query = searchInput.value.trim();
  if (query) cercaSquadre(query);
});

aggiornaVistaPreferiti();

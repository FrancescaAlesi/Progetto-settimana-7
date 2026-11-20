// SportsHub — Week Project Settimana VII
const API_BASE = "https://www.thesportsdb.com/api/v1/json/123";

// === CLASSI ===
class Squadra {
    constructor(data) {
        this.idTeam = data.idTeam;
        this.strTeam = data.strTeam;
        this.strBadge = data.strBadge
        this.strLeague = data.strLeague || "Campionato non disponibile";
        this.strCountry = data.strCountry || "";
        this.strSport = data.strSport || "";
    }
}

class Evento {
    constructor(data) {
        this.idEvent = data.idEvent;
        this.dateEvent = data.dateEvent;
        this.strHomeTeam = data.strHomeTeam;
        this.strAwayTeam = data.strAwayTeam;
        this.intHomeScore = data.intHomeScore;
        this.intAwayScore = data.intAwayScore;
    }
    getDataFormattata() {
        if (!this.dateEvent) return "Data da definire";
        const d = new Date(this.dateEvent);
        const giorno = String(d.getDate()).padStart(2, "0");
        const mese = String(d.getMonth() + 1).padStart(2, "0");
        const anno = d.getFullYear();
        return `${giorno}/${mese}/${anno}`;
    }
    getPunteggio() {
        if (this.intHomeScore !== null && this.intAwayScore !== null) {
            return `${this.intHomeScore} - ${this.intAwayScore}`;
        }
        return null; 
    }
}

// === STATO ===
const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const risultatiTitolo = document.querySelector("#risultati-titolo");
const feedbackContainer = document.querySelector("#feedback-container");
const risultatiGrid = document.querySelector("#risultati-grid");
const dettagliSection = document.querySelector("#dettagli-section");
const dettagliTeamName = document.querySelector("#dettagli-team-name");
const prossimiEventiList = document.querySelector("#prossimi-eventi-list");
const ultimiRisultatiList = document.querySelector("#ultimi-risultati-list");

// === API ===
async function cercaSquadre(query) {
    risultatiTitolo.classList.remove("d-none");
    dettagliSection.classList.add("d-none");
    risultatiGrid.replaceChildren();
    mostraSpinner(feedbackContainer);

    try {
        const url = new URL(`${API_BASE}/searchteams.php`);
        url.searchParams.set("t", query);

        const response = await fetch(url);
        if(!response.ok) throw new Error("Errore di rete durante la ricerca.");

        const data = await response.json();
        feedbackContainer.replaceChildren();

        if(!data.teams) {
            mostraAlert(feedbackContainer, "Nessuna squadra trovata.", "warning");
            return;
        }

        const squadre = data.teams.map((t) => new Squadra(t));
        renderCardSquadre(squadre);
    } catch (error) {
        mostraAlert(feedbackContainer, error.message);
    }
}

async function caricaDettagli(idTeam, nomeSquadra) {
    dettagliSection.classList.remove("d-none");
    dettagliTeamName.textContent = nomeSquadra;
    mostraSpinner(prossimiEventiList);
    mostraSpinner(ultimiRisultatiList);
    dettagliSection.scrollIntoView({behavior: "smooth", block: "nearest"});
    
    try {
        const urlNext = new URL(`${API_BASE}/eventsnext.php`);
        urlNext.searchParams.set("id", idTeam);

        const urlLast = new URL(`${API_BASE}/eventslast.php`);
        urlLast.searchParams.set("id", idTeam);

        const [resNext, resLast] = await Promise.all([fetch(urlNext), fetch(urlLast)]);
        if (!resNext.ok || !resLast.ok) throw new Error("Errore nel caricamento degli eventi.");

        const [dataNext, dataLast] = await Promise.all([resNext.json(), resLast.json()]);
        const prossimi = (dataNext.events || []).map((e) => new Evento(e));
        const ultimi = (dataLast.results || []).map((e) => new Evento(e));

        renderListaEventi(prossimiEventiList, prossimi, "Nessun evento in programma");
        renderListaEventi(ultimiRisultatiList, ultimi, "Nessun risultato recente");
    } catch (error) {
        mostraAlert(prossimiEventiList, error.message);
        ultimiRisultatiList.replaceChildren();
    }
}

// === RENDER ===
function mostraSpinner(container) {
    const wrapper = document.createElement("div");
    wrapper.className = "text-center my-4";

    const spinner = document.createElement("div");
    spinner.className = "spinner-border text-primary";
    spinner.setAttribute("role", "status");

    const span = document.createElement("span");
    span.className = "visually-hidden";
    span.textContent = "Caricamento...";

    spinner.appendChild(span);
    wrapper.appendChild(spinner);
    container.replaceChildren(wrapper);
}

function mostraAlert(container, messaggio, tipo = "danger") {
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${tipo}`;
    alertDiv.setAttribute("role", "alert");
    alertDiv.textContent = messaggio;
    container.replaceChildren(alertDiv);
}

function renderCardSquadre(squadre) {
  const fragment = document.createDocumentFragment();

  squadre.forEach((squadra) => {
    const col = document.createElement("div");
    col.className = "col";

    const card = document.createElement("div");
    card.className = "card team-card h-100 text-center p-4 shadow-sm";
    card.addEventListener("click", () => caricaDettagli(squadra.idTeam, squadra.strTeam));

    const img = document.createElement("img");
    img.src = squadra.strBadge;
    img.alt = `Logo ${squadra.strTeam}`;
    img.className = "team-logo";

    const title = document.createElement("h3");
    title.className = "team-name";
    title.textContent = squadra.strTeam;

    const league = document.createElement("div");
    league.className = "team-meta";
    league.textContent = squadra.strLeague;

    const country = document.createElement("div");
    country.className = "team-meta";
    country.textContent = squadra.strCountry;

    card.append(img, title, league, country);
    col.appendChild(card);
    fragment.appendChild(col);
  });

  risultatiGrid.replaceChildren(fragment);
}

function renderListaEventi(container, eventi, messaggioVuoto) {
  if (eventi.length === 0) {
    const li = document.createElement("li");
    li.className = "evento-item text-muted fst-italic";
    li.textContent = messaggioVuoto;
    container.replaceChildren(li);
    return;
  }

  const fragment = document.createDocumentFragment();

  eventi.forEach((evento) => {
    const li = document.createElement("li");
    li.className = "evento-item";

    const spanData = document.createElement("span");
    spanData.className = "evento-data";
    spanData.textContent = evento.getDataFormattata();

    const divMatch = document.createElement("div");
    divMatch.className = "d-flex align-items-center flex-wrap";

    const spanTeams = document.createElement("span");
    spanTeams.className = "evento-match";
    spanTeams.textContent = `${evento.strHomeTeam} vs ${evento.strAwayTeam}`;
    divMatch.appendChild(spanTeams);

    const score = evento.getPunteggio();
    if (score) {
      const badge = document.createElement("span");
      badge.className = "badge-score";
      badge.textContent = score;
      divMatch.appendChild(badge);
    }

    li.append(spanData, divMatch);
    fragment.appendChild(li);
  });

  container.replaceChildren(fragment);
}

// === Eventi ===
searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const query = searchInput.value.trim();
  if (query) cercaSquadre(query);
});

searchInput.addEventListener("input", () => {
  if (searchInput.value.trim() === "") {
    risultatiGrid.replaceChildren();
    feedbackContainer.replaceChildren();
    dettagliSection.classList.add("d-none");
  }
});
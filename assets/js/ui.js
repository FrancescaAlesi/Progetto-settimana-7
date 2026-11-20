import { Squadra } from "./api.js";

export function mostraSpinner(container) {
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

export function mostraAlert(container, messaggio, tipo = "danger") {
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${tipo}`;
  alertDiv.setAttribute("role", "alert");
  alertDiv.textContent = messaggio;
  container.replaceChildren(alertDiv);
}

export function creaCardSquadra(squadra, isPreferitaCard, callbacks) {
  const col = document.createElement("div");
  col.className = "col-12 col-md-6 col-lg-4 flex-grow-1";

  const card = document.createElement("div");
  card.className =
    "card team-card h-100 text-center p-4 shadow-sm d-flex flex-column justify-content-between";
  card.addEventListener("click", () =>
    callbacks.onSelectSquadra(squadra.idTeam, squadra.strTeam),
  );

  const bodyTop = document.createElement("div");

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
  country.className = "team-meta mb-3";
  country.textContent = squadra.strCountry;

  bodyTop.append(img, title, league, country);

  const btn = document.createElement("button");
  btn.type = "button";

  if (isPreferitaCard) {
    btn.className = "btn btn-outline-danger btn-sm w-100";
    btn.textContent = "🗑️Rimuovi";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      callbacks.onRimuovi(squadra.idTeam);
    });
  } else {
    const giaPreferita = callbacks.isPreferita(squadra.idTeam);
    btn.className = giaPreferita
      ? "btn btn-secondary btn-sm w-100"
      : "btn btn-outline-warning text-dark btn-sm w-100";
    btn.textContent = giaPreferita
      ? "★ Nei preferiti"
      : "★ Aggiungi ai preferiti";
    btn.disabled = giaPreferita;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      callbacks.onAggiungi(squadra);
    });
  }
  card.append(bodyTop, btn);
  col.appendChild(card);
  return col;
}

export function renderPreferiti(preferiti, listEl, emptyEl, callbacks) {
  if (preferiti.length === 0) {
    emptyEl.classList.remove("d-none");
    listEl.replaceChildren();
    return;
  }
  emptyEl.classList.add("d-none");
  const fragment = document.createDocumentFragment();
  preferiti.forEach((p) => {
    fragment.appendChild(creaCardSquadra(new Squadra(p), true, callbacks));
  });
  listEl.replaceChildren(fragment);
}

export function renderCardSquadre(squadre, gridEl, callbacks) {
  const fragment = document.createDocumentFragment();

  squadre.forEach((squadra) => {
    fragment.appendChild(creaCardSquadra(squadra, false, callbacks));
  });
  gridEl.replaceChildren(fragment);
}

export function renderListaEventi(
  container,
  eventi,
  messaggioVuoto,
  onSelectEvento,
) {
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
    li.className = "evento-item clickable-event";
    if (onSelectEvento) {
      li.addEventListener("click", () => onSelectEvento(evento));
    }

    const spanData = document.createElement("span");
    spanData.className = "evento-data";
    spanData.textContent = `${evento.getDataFormattata()}${evento.strLeague ? ` • ${evento.strLeague}` : ""}`;

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

export function mostraModalEvento(evento) {
  const squadraModalEl = document.getElementById("dettagliSquadraModal");
  if (squadraModalEl) {
    const squadraModalInstance =
      window.bootstrap.Modal.getInstance(squadraModalEl);
    if (squadraModalInstance) squadraModalInstance.hide();
  }

  const modalEl = document.getElementById("eventoModal");
  const titleEl = document.getElementById("eventoModalLabel");
  const bodyEl = document.getElementById("evento-modal-body");

  titleEl.textContent = `${evento.strHomeTeam} vs ${evento.strAwayTeam}`;
  bodyEl.replaceChildren();

  if (evento.strThumb) {
    const img = document.createElement("img");
    img.src = evento.strThumb;
    img.alt = `${evento.strHomeTeam} vs ${evento.strAwayTeam}`;
    img.className = "evento-modal-thumb";
    bodyEl.appendChild(img);
  }

  const score = evento.getPunteggio();
  if (score) {
    const scoreBox = document.createElement("div");
    scoreBox.className =
      "alert alert-success text-center fw-bold fs-4 py-2 mb-3";
    scoreBox.textContent = `Risultato: ${score}`;
    bodyEl.appendChild(scoreBox);
  }

  const listaDettagli = document.createElement("ul");
  listaDettagli.className = "list-group list-group-flush";

  const luogo = [evento.strVenue, evento.strCity, evento.strCountry]
    .filter(Boolean)
    .join(", ");

  const righe = [
    { label: "Data", value: evento.getDataFormattata() },
    { label: "Orario", value: evento.getOrarioFormattato() },
    {
      label: "Competizione",
      value: [evento.strLeague, evento.strSeason].filter(Boolean).join(" — "),
    },
    { label: "Stadio / Luogo", value: luogo },
    { label: "Stato", value: evento.strStatus },
  ];

  righe.forEach((riga) => {
    if (!riga.value) return;
    const li = document.createElement("li");
    li.className =
      "list-group-item d-flex justify-content-between align-items-start px-0";

    const strong = document.createElement("strong");
    strong.className = "text-muted small";
    strong.textContent = riga.label;

    const span = document.createElement("span");
    span.className = "text-end fw-medium ms-3";
    span.textContent = riga.value;

    li.append(strong, span);
    listaDettagli.appendChild(li);
  });

  bodyEl.appendChild(listaDettagli);

  const modalInstance = window.bootstrap.Modal.getOrCreateInstance(modalEl);
  modalInstance.show();
}

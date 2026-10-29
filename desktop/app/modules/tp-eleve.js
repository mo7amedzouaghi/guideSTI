/* Module C — côté élève : bibliothèque de TP et mode examen. */
(async function () {
  "use strict";
  var D = window.stiDesktop, S = window.STI, E = window.STIEditeur, esc = S.esc;
  var $ = function (id) { return document.getElementById(id); };
  var params = new URLSearchParams(location.search);

  /* ================================================== liste */
  async function afficherListe() {
    $("vue-liste").hidden = false; $("vue-tp").hidden = true;
    var i = S.identite();
    $("qui").textContent = i && i.nom ? "Poste de " + i.prenom + " " + i.nom + " · " + i.classe + " · poste " + i.poste : "";
    var l = await D.tp.liste();
    $("liste").innerHTML = l.length ? l.map(function (t) {
      return '<a class="tp-carte n' + t.niveau + '" href="?tp=' + encodeURIComponent(t.id) + '"><span class="niv">' + t.niveau + "ème</span><b>" + esc(t.titre) + "</b><p>" + esc(t.resume || "") +
        '</p><span class="duree">⏱ ' + t.duree + " min" + (t.source === "importe" ? " · reçu du prof" : "") + "</span></a>";
    }).join("") : '<div class="m-carte"><p class="vide">Aucun TP sur ce poste. Demande au professeur de démarrer le ramassage, puis clique sur « Récupérer les TP du poste prof ».</p></div>';
  }
  $("recuperer").addEventListener("click", async function () {
    var ip = await S.exigerPosteProf(); if (!ip) return;
    try {
      var l = await D.reseau.tpListe(ip);
      for (var k = 0; k < l.length; k++) await D.reseau.tpRecuperer(ip, l[k].id);
      S.toast(l.length + " TP récupéré(s) depuis le poste prof", "ok");
      afficherListe();
    } catch (e) { S.toast(S.msg(e), "ko"); }
  });

  if (!params.get("tp")) { afficherListe(); return; }

  /* ================================================== TP */
  var id = await S.exigerIdentite();
  if (!id) { location.search = ""; return; }
  var tp;
  try { tp = await D.tp.charger(params.get("tp")); } catch (e) { S.toast(S.msg(e), "ko"); afficherListe(); return; }
  $("vue-liste").hidden = true; $("vue-tp").hidden = false;
  document.title = tp.titre + " — TP STI";
  document.querySelector("header.m-barre").hidden = true;

  var cle = "sti-tp-" + tp.id + "@" + [id.nom, id.prenom, id.poste].join("|").toLowerCase();
  var etat = null;
  try { etat = JSON.parse(S.lire(cle) || "null"); } catch (e) { etat = null; }
  if (!etat) etat = { debut: null, fichiers: JSON.parse(JSON.stringify(tp.fichiers)), reponses: {}, debloque: false, remis: null };
  var fiches = tp.fiches || [];
  var numFiche = fiches.length ? ((Math.max(1, parseInt(id.poste, 10) || 1) - 1) % fiches.length) + 1 : 0;

  $("t-niv").textContent = tp.niveau + "ème"; $("t-niv").className = "niv n" + tp.niveau;
  $("t-titre").textContent = tp.titre;
  $("t-qui").textContent = id.prenom + " " + id.nom + " · " + id.classe + " · poste " + id.poste;
  $("url").textContent = "localhost/" + tp.principal;
  if (tp.console === "sql") $("actualiser").hidden = true;

  /* ---------- sauvegarde */
  var minuterieDisque = null;
  function charge() { return { tpId: tp.id, identite: id, fichiers: etat.fichiers, reponses: etat.reponses, debut: etat.debut, remis: etat.remis }; }
  function sauver() {
    S.ecrire(cle, JSON.stringify(etat));
    $("etat").className = "tp-etat encours"; $("etat").title = "Enregistrement…";
    clearTimeout(minuterieDisque);
    minuterieDisque = setTimeout(async function () {
      try { await D.travail.sauver(charge()); $("etat").className = "tp-etat ok"; $("etat").title = "Enregistré à " + new Date().toLocaleTimeString("fr-FR"); }
      catch (e) { $("etat").className = "tp-etat ko"; $("etat").title = S.msg(e); }
    }, 1200);
  }

  /* ---------- écran de départ */
  function ecranDepart() {
    $("depart").hidden = false; $("travail").hidden = true;
    $("d-titre").textContent = tp.titre;
    $("d-resume").textContent = tp.resume || "";
    $("d-conditions").innerHTML = "<b>Conditions :</b> " + esc(tp.conditions || "") + " Durée : " + tp.duree + " min.";
    $("d-parties").innerHTML = (tp.parties || []).map(function (p, k) { return "<li><b>Partie " + (k + 1) + " — " + esc(p.titre) + "</b>" + (p.points ? " · " + p.points + " pts" : "") + "</li>"; }).join("");
  }
  $("commencer").addEventListener("click", function () { etat.debut = new Date().toISOString(); sauver(); demarrer(); });

  /* ---------- chronomètre */
  function ecoule() { return etat.debut ? (Date.now() - new Date(etat.debut).getTime()) / 1000 : 0; }
  function mmss(s) { s = Math.max(0, Math.round(s)); return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); }
  var averti = false;
  function tic() {
    var reste = tp.duree * 60 - ecoule(), c = $("chrono");
    c.textContent = reste > 0 ? mmss(reste) : "Temps écoulé";
    c.className = "tp-chrono" + (reste <= 0 ? " fini" : reste <= 300 ? " bientot" : "");
    if (reste <= 0 && !averti) { averti = true; S.toast("Temps écoulé : enregistre et remets ton travail.", "ko"); }
    majVerrou();
  }

  /* ---------- éditeur + aperçu */
  var ed, minuterieApercu, consoleSql = null;
  function apercu() {
    if (tp.console === "sql") return;
    $("erreur").hidden = true;
    $("cadre").srcdoc = E.documentApercu(etat.fichiers, tp.principal);
  }
  window.addEventListener("message", function (e) { if (e.data && e.data.stiErreur) { $("erreur").hidden = false; $("erreur").textContent = "Erreur JavaScript : " + e.data.stiErreur; } });
  $("actualiser").addEventListener("click", apercu);

  /* ---------- parties */
  function rendreParties() {
    $("parties").innerHTML = (tp.parties || []).map(function (p, k) {
      var c = ["var(--n2)", "var(--orange)", "var(--sarcelle)", "var(--n3)", "var(--n4)"][k % 5];
      var h = '<section class="m-carte" style="--c:' + c + '" data-p="' + p.id + '"><h2><span class="num">' + (k + 1) + "</span>Partie " + (k + 1) + " — " + esc(p.titre) +
        (p.points ? '<span class="pts">' + p.points + " pts" + (p.minutes ? " · " + p.minutes + " min" : "") + "</span>" : "") + "</h2><p>" + esc(p.consigne || "") + "</p>";
      if (p.type === "tableau") {
        var rep = etat.reponses[p.id] || [];
        h += '<div style="overflow:auto"><table class="t tp-tab"><thead><tr><th style="width:44px">N°</th>' + p.colonnes.map(function (c) { return "<th>" + esc(c) + "</th>"; }).join("") + "</tr></thead><tbody>";
        for (var r = 0; r < p.lignes; r++) {
          h += "<tr><td><b>" + (r + 1) + "</b></td>" + p.colonnes.map(function (c, j) {
            var v = (rep[r] && rep[r][j]) || "";
            return j === 0 ? '<td style="width:80px"><input type="text" data-r="' + r + '" data-c="' + j + '" value="' + esc(v) + '"></td>'
              : '<td><textarea rows="2" data-r="' + r + '" data-c="' + j + '"' + (j < 3 ? ' class="mono"' : "") + ">" + esc(v) + "</textarea></td>";
          }).join("") + "</tr>";
        }
        h += "</tbody></table></div>";
      } else if (p.type === "surprise") {
        h += '<div class="tp-surprise" id="surprise"></div>';
      }
      return h + "</section>";
    }).join("");
    $("parties").querySelectorAll(".tp-tab").forEach(function (t) {
      var pid = t.closest("[data-p]").dataset.p;
      t.addEventListener("input", function (e) {
        var x = e.target; if (x.dataset.r === undefined) return;
        var rep = etat.reponses[pid] = etat.reponses[pid] || [];
        rep[x.dataset.r] = rep[x.dataset.r] || [];
        rep[x.dataset.r][x.dataset.c] = x.value;
        sauver();
      });
    });
    majVerrou(true);
  }

  var partieSurprise = (tp.parties || []).find(function (p) { return p.type === "surprise"; });
  var etatVerrou = null;
  function majVerrou(force) {
    var z = $("surprise"); if (!z || !partieSurprise) return;
    var reste = (partieSurprise.deblocage || 0) * 60 - ecoule();
    if (!etat.debloque && reste <= 0) { etat.debloque = true; sauver(); S.toast("La consigne surprise est disponible !", "ok"); }
    var nouvel = etat.debloque ? "ouvert" : "ferme";
    if (nouvel === "ferme") {
      if (etatVerrou !== "ferme" || force) {
        z.innerHTML = '<div class="tp-verrou"><div class="cadenas">🔒</div><div><b>Fiche n° ' + numFiche + " de ton poste — se débloque dans <span id=\"sv-reste\"></span></b>" +
          '<p class="m-aide">Le professeur peut la débloquer plus tôt (code ou réseau).</p><div class="rangee"><input type="text" id="sv-code" placeholder="Code" maxlength="4" style="width:110px;letter-spacing:4px;text-align:center">' +
          '<button type="button" class="btn sec" id="sv-ok">Débloquer</button></div></div></div>';
        $("sv-ok").addEventListener("click", async function () {
          if (await D.tp.verifierDeblocage(tp.id, $("sv-code").value)) { etat.debloque = true; sauver(); majVerrou(true); }
          else S.toast("Code incorrect.", "ko");
        });
      }
      var r = $("sv-reste"); if (r) r.textContent = mmss(reste);
    } else if (etatVerrou !== "ouvert" || force) {
      var f = fiches[numFiche - 1] || { titre: "", consignes: [] };
      var rep = etat.reponses.fiche || {};
      z.innerHTML = '<div class="tp-fiche f' + numFiche + '"><div class="tp-fiche-tete">FICHE ' + numFiche + " — poste " + esc(id.poste) + "</div><h3>" + esc(f.titre) + "</h3><ul>" +
        f.consignes.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + '</ul><label class="sti-champ"><span>' + esc(tp.questionFiche || "Ta réponse") + '</span><textarea id="sv-rep" rows="4" style="width:100%">' + esc(rep.texte || "") + "</textarea></label></div>";
      $("sv-rep").addEventListener("input", function () { etat.reponses.fiche = { num: numFiche, texte: this.value }; sauver(); });
    }
    etatVerrou = nouvel;
  }

  // déblocage par le réseau (si le poste est relié au prof)
  async function interrogerProf() {
    var ip = S.posteProf();
    if (!ip || etat.debloque || !partieSurprise) return;
    try { var r = await D.reseau.etat(ip, tp.id); if (r && r.debloque) { etat.debloque = true; sauver(); majVerrou(true); S.toast("Le professeur a débloqué la consigne surprise.", "ok"); } } catch (e) { /* hors réseau */ }
  }

  function demarrer() {
    $("depart").hidden = true; $("travail").hidden = false;
    ed = E.creer($("editeur"), etat.fichiers, { surChangement: function () { sauver(); clearTimeout(minuterieApercu); minuterieApercu = setTimeout(apercu, 700); } });
    if (tp.console === "sql") {
      // TP de bases de données : console SQL à la place de l'aperçu de page
      var zone = document.querySelector(".tp-plan .apercu");
      zone.innerHTML = "";
      window.STIConsole.creer(zone, tp.baseSql, tp.nomBase || (tp.base || "").replace(/\.sql$/i, "")).then(function (c) {
        consoleSql = c;
        c.surExecution(function () { c.executer(etat.fichiers[ed.actif()] || ""); });
      }).catch(function (e) { zone.innerHTML = '<div class="apercu-err">Moteur SQL indisponible : ' + esc(e.message || e) + "</div>"; });
      $("editeur").addEventListener("keydown", function (e) {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && consoleSql) { e.preventDefault(); consoleSql.executer(etat.fichiers[ed.actif()] || ""); }
      });
    }
    apercu();
    rendreParties();
    tic(); setInterval(tic, 1000);
    interrogerProf(); setInterval(interrogerProf, 15000);
    sauver();
  }

  /* ---------- actions */
  var plein = false;
  $("plein").addEventListener("click", function () { plein = !plein; D.pleinEcran(plein); });
  $("usb").addEventListener("click", async function () {
    try { var d = await D.travail.copierVers(charge()); if (d) S.toast("Copie enregistrée : " + d, "ok"); } catch (e) { S.toast(S.msg(e), "ko"); }
  });
  $("remettre").addEventListener("click", async function () {
    if (!etat.debut) { S.toast("Commence d'abord le TP.", "ko"); return; }
    var ok = await S.dialogue({ titre: "Remettre mon travail", valider: "Remettre", texte: "Ton code et tes réponses vont être envoyés au poste du professeur. Tu pourras encore corriger puis remettre une nouvelle version : la dernière remplace la précédente." });
    if (!ok) return;
    var ip = await S.exigerPosteProf(); if (!ip) return;
    try {
      etat.remis = new Date().toISOString(); sauver();
      await D.reseau.remettre(ip, charge());
      S.toast("Travail remis au professeur ✔ (" + new Date().toLocaleTimeString("fr-FR") + ")", "ok");
    } catch (e) {
      S.toast(S.msg(e) + " — utilise « Copier sur clé ».", "ko");
    }
  });

  if (etat.debut) demarrer(); else ecranDepart();
})();

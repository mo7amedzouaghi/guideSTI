/* Préchargée dans la fenêtre cachée du correcteur : capte alert / confirm / prompt et les erreurs JavaScript
   de la page de l'élève, avant l'exécution de ses scripts (contextIsolation désactivée pour cette fenêtre seulement). */
window.__sti = { alertes: [], erreurs: [] };
window.alert = function (m) { window.__sti.alertes.push(String(m)); };
window.confirm = function (m) { window.__sti.alertes.push(String(m)); return true; };
window.prompt = function (m) { window.__sti.alertes.push(String(m)); return ""; };
window.addEventListener("error", function (e) { window.__sti.erreurs.push(String(e.message || e)); });

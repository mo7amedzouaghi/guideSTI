/* Pont sécurisé entre les pages (sti://app) et le processus principal. */
"use strict";
const { contextBridge, ipcRenderer, webUtils } = require("electron");
const I = (canal) => (...args) => ipcRenderer.invoke(canal, ...args);

contextBridge.exposeInMainWorld("stiDesktop", {
  info: I("info"),
  pin: { definir: I("pin:definir"), verifier: I("pin:verifier"), changer: I("pin:changer"), verrouiller: I("pin:verrouiller") },
  dossier: { choisir: I("dossier:choisir"), lireCode: I("dossier:lireCode"), ouvrir: I("dossier:ouvrir") },
  projet: { enregistrer: I("projet:enregistrer"), ouvrir: I("projet:ouvrir") },
  fichier: { enregistrerTexte: I("fichier:enregistrerTexte"), ouvrirTexte: I("fichier:ouvrirTexte"), chemin: (f) => webUtils.getPathForFile(f) },
  pdf: I("pdf:imprimer"),
  pleinEcran: I("pleinEcran"),
  tp: { liste: I("tp:liste"), charger: I("tp:charger"), corrige: I("tp:corrige"), importer: I("tp:importer"), codeDeblocage: I("tp:codeDeblocage"), verifierDeblocage: I("tp:verifierDeblocage") },
  travail: { sauver: I("travail:sauver"), copierVers: I("travail:copierVers") },
  ramassage: {
    demarrer: I("ramassage:demarrer"), arreter: I("ramassage:arreter"), etat: I("ramassage:etat"), debloquer: I("ramassage:debloquer"),
    liste: I("ramassage:liste"), lire: I("remise:lire"), noter: I("remise:noter"), importerDossier: I("remise:importerDossier"), ouvrirDossier: I("ramassage:dossier"),
    surEvenement: (fn) => { const h = (e, x) => fn(x); ipcRenderer.on("ramassage:evenement", h); return () => ipcRenderer.removeListener("ramassage:evenement", h); }
  },
  suivi: { local: I("suivi:local"), importer: I("suivi:importer") },
  app: {
    etat: I("app:etat"), verifier: I("app:verifier"), telecharger: I("app:telecharger"), installer: I("app:installer"),
    installerFichier: I("app:installerFichier"), preparerLabo: I("app:preparerLabo"),
    surEvenement: (fn) => { const h = (e, x) => fn(x); ipcRenderer.on("app:maj", h); return () => ipcRenderer.removeListener("app:maj", h); }
  },
  maj: {
    etat: I("maj:etat"), verifier: I("maj:verifier"), installerGithub: I("maj:installerGithub"), installerFichier: I("maj:installerFichier"),
    depuisProf: I("maj:depuisProf"), revenir: I("maj:revenir"),
    surProgression: (fn) => { const h = (e, x) => fn(x); ipcRenderer.on("maj:progression", h); return () => ipcRenderer.removeListener("maj:progression", h); }
  },
  cor: {
    liste: I("cor:liste"), creer: I("cor:creer"), charger: I("cor:charger"), enregistrer: I("cor:enregistrer"), supprimer: I("cor:supprimer"),
    ouvrirDossier: I("cor:ouvrirDossier"), importerTravaux: I("cor:importerTravaux"), importerGrille: I("cor:importerGrille"), modeleGrille: I("cor:modeleGrille"),
    joindre: I("cor:joindre"), ouvrirEnonce: I("cor:ouvrirEnonce"), corriger: I("cor:corriger"), fichiers: I("cor:fichiers"), ouvrirTravail: I("cor:ouvrirTravail"),
    exporter: I("cor:exporter"), ouvrirFichier: I("cor:ouvrirFichier"),
    surProgression: (fn) => { const h = (e, x) => fn(x); ipcRenderer.on("cor:progression", h); return () => ipcRenderer.removeListener("cor:progression", h); }
  },
  reseau: { chercher: I("reseau:chercher"), tester: I("reseau:tester"), remettre: I("reseau:remettre"), progression: I("reseau:progression"), etat: I("reseau:etat"), tpListe: I("reseau:tpListe"), tpRecuperer: I("reseau:tpRecuperer") }
});

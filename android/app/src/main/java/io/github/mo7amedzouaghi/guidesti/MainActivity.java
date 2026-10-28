package io.github.mo7amedzouaghi.guidesti;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.util.Base64;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.widget.Toast;
import android.window.OnBackInvokedDispatcher;

import java.io.OutputStream;

/**
 * Guide STI : l'espace élèves et l'espace enseignants du site, dans une application.
 * Le contenu vient du site en ligne (toujours à jour) ; l'application ajoute
 * le bouton retour, l'enregistrement des fichiers, l'impression et un écran hors ligne.
 */
public class MainActivity extends Activity {

    private static final String HOTE = "mo7amedzouaghi.github.io";
    private static final String CHEMIN = "/guideSTI";
    private static final String ACCUEIL = "https://" + HOTE + CHEMIN + "/connexion/";
    private static final int CODE_ENREGISTRER = 41;

    private WebView web;
    private ProgressBar barre;
    private String derniereAdresse = ACCUEIL;
    private byte[] fichierEnAttente;
    private boolean impressionEnCours = false;

    // Ajouté à chaque page : impression, téléchargements (liens blob: du bac à sable et des exports).
    private static final String SCRIPT_PONT =
        "(function(){if(window.__stiApp)return;window.__stiApp=true;" +
        "window.print=function(){AndroidSTI.imprimer();};" +
        "function enreg(href,nom){fetch(href).then(function(r){return r.blob();}).then(function(b){" +
        "var fr=new FileReader();fr.onload=function(){var s=String(fr.result);" +
        "AndroidSTI.enregistrer(s.substring(s.indexOf(',')+1),nom||'fichier',b.type||'application/octet-stream');};" +
        "fr.readAsDataURL(b);});}" +
        "var clic=HTMLAnchorElement.prototype.click;" +
        "HTMLAnchorElement.prototype.click=function(){if(this.hasAttribute('download')&&/^(blob|data):/.test(this.href)){enreg(this.href,this.getAttribute('download'));return;}return clic.apply(this,arguments);};" +
        "document.addEventListener('click',function(e){var a=e.target&&e.target.closest?e.target.closest('a[download]'):null;" +
        "if(a&&/^(blob|data):/.test(a.href)){e.preventDefault();enreg(a.href,a.getAttribute('download'));}},true);" +
        "})();";

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle etat) {
        super.onCreate(etat);

        FrameLayout racine = new FrameLayout(this);
        racine.setBackgroundColor(Color.parseColor("#0D2B6B"));

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#F6F4EE"));
        racine.addView(web, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        barre = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        barre.setMax(100);
        barre.setProgressTintList(ColorStateList.valueOf(Color.parseColor("#F5B800")));
        racine.addView(barre, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(3)));

        // Affichage bord à bord (Android 15+) : on garde le contenu hors des barres système et du clavier.
        racine.setOnApplyWindowInsetsListener((v, insets) -> {
            if (Build.VERSION.SDK_INT >= 30) {
                Insets b = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.ime() | WindowInsets.Type.displayCutout());
                v.setPadding(b.left, b.top, b.right, b.bottom);
                return WindowInsets.CONSUMED;
            }
            v.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                    insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            return insets.consumeSystemWindowInsets();
        });
        setContentView(racine);
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController c = getWindow().getInsetsController();
            if (c != null) c.setSystemBarsAppearance(0,
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS);
        }

        WebSettings r = web.getSettings();
        r.setJavaScriptEnabled(true);
        r.setDomStorageEnabled(true);
        r.setDatabaseEnabled(true);
        r.setLoadWithOverviewMode(true);
        r.setUseWideViewPort(true);
        r.setSupportZoom(true);
        r.setBuiltInZoomControls(true);
        r.setDisplayZoomControls(false);
        r.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        r.setAllowFileAccess(false);
        r.setUserAgentString(r.getUserAgentString() + " GuideSTIApp/" + BuildConfigVersion());

        web.addJavascriptInterface(new Pont(), "AndroidSTI");
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView vue, int p) {
                barre.setProgress(p);
                barre.setVisibility(p >= 100 ? View.GONE : View.VISIBLE);
            }
        });
        web.setWebViewClient(new Client());

        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::retour);
        }

        if (etat != null) web.restoreState(etat);
        else web.loadUrl(adresseDeDepart(getIntent()));
    }

    private String BuildConfigVersion() {
        try {
            return getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
        } catch (Exception e) {
            return "1";
        }
    }

    private String adresseDeDepart(Intent i) {
        Uri u = i != null ? i.getData() : null;
        if (u != null && estDuSite(u)) return u.toString();
        return ACCUEIL;
    }

    private boolean estDuSite(Uri u) {
        return "https".equals(u.getScheme()) && HOTE.equals(u.getHost())
                && u.getPath() != null && u.getPath().startsWith(CHEMIN);
    }

    private int dp(int v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }

    private void retour() {
        if (web.canGoBack()) web.goBack();
        else finish();
    }

    @SuppressWarnings("deprecation")
    @Override
    public void onBackPressed() {
        retour();
    }

    @Override
    protected void onSaveInstanceState(Bundle etat) {
        super.onSaveInstanceState(etat);
        web.saveState(etat);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (impressionEnCours) {
            impressionEnCours = false;
            web.evaluateJavascript("window.dispatchEvent(new Event('afterprint'));", null);
        }
    }

    @Override
    protected void onDestroy() {
        if (web != null) web.destroy();
        super.onDestroy();
    }

    /* ------------------------------------------------------------ navigation */
    private class Client extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView vue, WebResourceRequest req) {
            Uri u = req.getUrl();
            if (estDuSite(u)) return false;
            ouvrirAilleurs(u);
            return true;
        }

        @Override
        public void onPageFinished(WebView vue, String adresse) {
            if (adresse != null && adresse.startsWith("https://")) derniereAdresse = adresse;
            vue.evaluateJavascript(SCRIPT_PONT, null);
        }

        @Override
        public void onReceivedError(WebView vue, WebResourceRequest req, WebResourceError err) {
            if (req.isForMainFrame()) {
                derniereAdresse = req.getUrl().toString();
                vue.loadUrl("file:///android_asset/hors-ligne.html");
            }
        }
    }

    private void ouvrirAilleurs(Uri u) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, u));
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, "Aucune application pour ouvrir ce lien.", Toast.LENGTH_SHORT).show();
        }
    }

    /* ------------------------------------------------------------ pont JavaScript */
    private class Pont {
        @JavascriptInterface
        public void imprimer() {
            runOnUiThread(() -> {
                PrintManager pm = (PrintManager) getSystemService(PRINT_SERVICE);
                if (pm == null) return;
                String nom = web.getTitle() != null ? web.getTitle() : "Guide STI";
                PrintDocumentAdapter adaptateur = web.createPrintDocumentAdapter(nom);
                impressionEnCours = true;
                pm.print(nom, adaptateur, new PrintAttributes.Builder().setMediaSize(PrintAttributes.MediaSize.ISO_A4).build());
            });
        }

        @JavascriptInterface
        public void enregistrer(String base64, String nom, String type) {
            final byte[] contenu;
            try {
                contenu = Base64.decode(base64, Base64.DEFAULT);
            } catch (IllegalArgumentException e) {
                return;
            }
            runOnUiThread(() -> {
                fichierEnAttente = contenu;
                Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType(type == null || type.isEmpty() ? "application/octet-stream" : type.split(";")[0]);
                i.putExtra(Intent.EXTRA_TITLE, nom);
                try {
                    startActivityForResult(i, CODE_ENREGISTRER);
                } catch (ActivityNotFoundException e) {
                    fichierEnAttente = null;
                    Toast.makeText(MainActivity.this, "Enregistrement impossible sur cet appareil.", Toast.LENGTH_LONG).show();
                }
            });
        }

        @JavascriptInterface
        public void reessayer() {
            runOnUiThread(() -> web.loadUrl(derniereAdresse));
        }
    }

    @SuppressWarnings("deprecation")
    @Override
    protected void onActivityResult(int code, int resultat, Intent donnees) {
        super.onActivityResult(code, resultat, donnees);
        if (code != CODE_ENREGISTRER) return;
        byte[] contenu = fichierEnAttente;
        fichierEnAttente = null;
        if (resultat != RESULT_OK || donnees == null || donnees.getData() == null || contenu == null) return;
        try (OutputStream sortie = getContentResolver().openOutputStream(donnees.getData())) {
            if (sortie == null) throw new java.io.IOException();
            sortie.write(contenu);
            Toast.makeText(this, "Fichier enregistré.", Toast.LENGTH_SHORT).show();
        } catch (Exception e) {
            Toast.makeText(this, "Le fichier n'a pas pu être enregistré.", Toast.LENGTH_LONG).show();
        }
    }
}

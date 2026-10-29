; Personnalisation de l'installateur : nom de l'auteur
BrandingText "Zouaghi Mohamed — Lycée Oued Ellil"

!macro customWelcomePage
  !define MUI_WELCOMEPAGE_TITLE "${PRODUCT_NAME} — par Zouaghi Mohamed"
  !define MUI_WELCOMEPAGE_TEXT "Bienvenue dans l'installation de ${PRODUCT_NAME} ${VERSION}.$\r$\n$\r$\nGuide du Programme STI (Sciences et Technologies de l'Informatique) : cours, TP, vérificateur de conformité à l'annexe officielle et outils pour la classe, utilisables sans Internet et sans inscription.$\r$\n$\r$\nConçu et réalisé par Zouaghi Mohamed, professeur d'informatique au Lycée Oued Ellil.$\r$\n$\r$\nCliquez sur Suivant pour continuer."
  !insertmacro MUI_PAGE_WELCOME
!macroend

!macro customFinishPage
  Function StartApp
    ${StdUtils.ExecShellAsUser} $0 "$launchLink" "open" ""
  FunctionEnd
  !define MUI_FINISHPAGE_TITLE "Installation terminée"
  !define MUI_FINISHPAGE_TEXT "${PRODUCT_NAME} est installé sur cet ordinateur.$\r$\n$\r$\nApplication conçue par Zouaghi Mohamed — Lycée Oued Ellil."
  !define MUI_FINISHPAGE_RUN
  !define MUI_FINISHPAGE_RUN_FUNCTION "StartApp"
  !define MUI_FINISHPAGE_RUN_TEXT "Lancer ${PRODUCT_NAME}"
  !insertmacro MUI_PAGE_FINISH
!macroend

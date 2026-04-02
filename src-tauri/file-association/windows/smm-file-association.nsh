!macro NSIS_HOOK_POSTINSTALL
  !insertmacro APP_ASSOCIATE "smm" "MindMap.smm" "MindMap 思维导图文档" "$INSTDIR\resources\file-association\icons\smm-document.ico,0" "使用 MindMap 打开" "$\"$INSTDIR\MindMap.exe$\" $\"%1$\""
  !insertmacro UPDATEFILEASSOC
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  !insertmacro APP_UNASSOCIATE "smm" "MindMap.smm"
  !insertmacro UPDATEFILEASSOC
!macroend

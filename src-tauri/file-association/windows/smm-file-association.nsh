!macro NSIS_HOOK_POSTINSTALL
  !insertmacro APP_ASSOCIATE "smm" "MindMap.smm" "MindMap 思维导图文档" "$INSTDIR\file-association\icons\smm-document.ico,0" "使用 MindMap 打开" "$\"$INSTDIR\MindMap.exe$\" $\"%1$\""
  WriteRegStr SHELL_CONTEXT "Software\Classes\.smm" "PerceivedType" "document"
  WriteRegStr SHELL_CONTEXT "Software\Classes\.smm" "Content Type" "application/x-mindmap-smm"
  WriteRegNone SHELL_CONTEXT "Software\Classes\.smm\OpenWithProgids" "MindMap.smm"
  WriteRegStr SHELL_CONTEXT "Software\Classes\MindMap.smm" "FriendlyTypeName" "MindMap 思维导图文档"
  WriteRegStr SHELL_CONTEXT "Software\Classes\MindMap.smm\DefaultIcon" "" "$INSTDIR\file-association\icons\smm-document.ico,0"
  WriteRegStr SHELL_CONTEXT "Software\Classes\Applications\MindMap.exe" "FriendlyAppName" "MindMap"
  WriteRegStr SHELL_CONTEXT "Software\Classes\Applications\MindMap.exe\shell\open\command" "" "$\"$INSTDIR\MindMap.exe$\" $\"%1$\""
  WriteRegNone SHELL_CONTEXT "Software\Classes\Applications\MindMap.exe\SupportedTypes" ".smm"
  WriteRegStr SHELL_CONTEXT "Software\MindMap\Capabilities" "ApplicationName" "MindMap"
  WriteRegStr SHELL_CONTEXT "Software\MindMap\Capabilities" "ApplicationDescription" "MindMap 思维导图桌面应用"
  WriteRegStr SHELL_CONTEXT "Software\MindMap\Capabilities\FileAssociations" ".smm" "MindMap.smm"
  WriteRegStr SHELL_CONTEXT "Software\RegisteredApplications" "MindMap" "Software\MindMap\Capabilities"
  !insertmacro UPDATEFILEASSOC
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  !insertmacro APP_UNASSOCIATE "smm" "MindMap.smm"
  DeleteRegKey SHELL_CONTEXT "Software\Classes\Applications\MindMap.exe"
  DeleteRegKey SHELL_CONTEXT "Software\MindMap\Capabilities\FileAssociations"
  DeleteRegKey SHELL_CONTEXT "Software\MindMap\Capabilities"
  DeleteRegValue SHELL_CONTEXT "Software\RegisteredApplications" "MindMap"
  !insertmacro UPDATEFILEASSOC
!macroend

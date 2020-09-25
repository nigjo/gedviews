@cd /d %~dp0htdocs
@start "DebugServer" /WAIT /B cmd.exe /c "java ..\Server.java || pause"

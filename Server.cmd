@cd /d "%~dp0docs"
@start "DebugServer" /WAIT /B cmd.exe /c "java ..\Server.java || pause"

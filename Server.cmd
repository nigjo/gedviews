@cd /d "%~dp0docs"
@start "DebugServer" /WAIT /B cmd.exe /c "java ..\server\Server.java gedview || pause"

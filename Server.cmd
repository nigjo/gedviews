@cd /d "%~dp0docs"
@set types=
@set types=%types% ged=text/x-gedcom
@set types=%types% woff=font/woff
@set types=%types% woff2=font/woff2
@set types=%types% 
@start "DebugServer" /WAIT /B cmd.exe /c "java ..\server\Server.java %types% gedview || pause"

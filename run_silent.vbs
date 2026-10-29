' Convertify - Tichý spouštěč pro Windows na pozadí (bez otevřeného černého okna konzole)
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
WshShell.Run "python server.py", 0, False

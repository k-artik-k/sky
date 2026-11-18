Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)
exePath = currentDir & "\build\SkyWallpaper-win-x64\SkyWallpaper.exe"

If Not fso.FileExists(exePath) Then
    WshShell.Run "cmd /c npm run build:exe", 0, True
End If

WshShell.Run """" & exePath & """", 0, False

# Crée le raccourci « Rugby Manager » à la racine du projet : un double-clic ouvre le jeu dans sa propre fenêtre
# (mode application de Microsoft Edge, ou de Google Chrome à défaut : pas de barre d'adresse ni d'onglets).
# À relancer si le dossier du projet est déplacé.
# Utilisation : powershell -ExecutionPolicy Bypass -File outils\creer-raccourci.ps1
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$page = Join-Path $root 'jeu\index.html'
$browsers = @(
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)
$exe = $browsers | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $exe) { Write-Output "Ni Edge ni Chrome trouves : ouvre jeu\index.html avec ton navigateur."; exit 1 }
$url = ([System.Uri]$page).AbsoluteUri
$sh = New-Object -ComObject WScript.Shell
$lnk = $sh.CreateShortcut((Join-Path $root 'Rugby Manager.lnk'))
$lnk.TargetPath = $exe
$lnk.Arguments = "--app=`"$url`" --window-size=1400,900"
$lnk.WorkingDirectory = Join-Path $root 'jeu'
$lnk.IconLocation = (Join-Path $root 'jeu\icones\icone.ico') + ',0'
$lnk.Description = 'Rugby Manager : gestion de club de rugby'
$lnk.Save()
Write-Output "Raccourci cree : $root\Rugby Manager.lnk (navigateur : $exe)"

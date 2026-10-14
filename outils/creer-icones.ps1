# Dessine l'icône de l'appli (ballon de rugby sur fond vert) et l'enregistre dans jeu/icones/
# en PNG (16 à 512 px, pour la page et l'installation) et en .ico (pour le raccourci Windows).
# Utilisation : powershell -ExecutionPolicy Bypass -File outils\creer-icones.ps1
Add-Type -AssemblyName System.Drawing
$dir = Join-Path $PSScriptRoot '..\jeu\icones'
New-Item -ItemType Directory -Force $dir | Out-Null

function Draw-Icon([int]$s) {
  $bmp = New-Object System.Drawing.Bitmap $s, $s
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.Clear([System.Drawing.Color]::Transparent)
  # fond : carré arrondi vert pelouse
  $r = $s * 0.2; $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $p.AddArc(0, 0, $r, $r, 180, 90); $p.AddArc($s - $r - 1, 0, $r, $r, 270, 90)
  $p.AddArc($s - $r - 1, $s - $r - 1, $r, $r, 0, 90); $p.AddArc(0, $s - $r - 1, $r, $r, 90, 90); $p.CloseFigure()
  $g.FillPath((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 34, 120, 70))), $p)
  # lignes du terrain
  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(70, 255, 255, 255)), ($s * 0.02)
  $g.DrawLine($pen, $s * 0.5, $s * 0.06, $s * 0.5, $s * 0.94)
  # ballon : ovale incliné
  $g.TranslateTransform($s / 2, $s / 2); $g.RotateTransform(-35)
  $w = $s * 0.78; $h = $s * 0.46
  $g.FillEllipse((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 150, 82, 38))), -$w / 2, -$h / 2, $w, $h)
  $g.DrawEllipse((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 90, 45, 18)), ($s * 0.025)), -$w / 2, -$h / 2, $w, $h)
  # bandes blanches près des pointes
  $wp = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), ($s * 0.035)
  foreach ($x in @(-0.27, 0.27)) { $xx = $x * $s; $hh = $h * 0.36; $g.DrawLine($wp, $xx, -$hh, $xx, $hh) }
  # couture et lacets
  $lp = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), ($s * 0.03)
  $g.DrawLine($lp, -$s * 0.15, 0, $s * 0.15, 0)
  foreach ($i in -2..2) { $xx = $i * $s * 0.06; $g.DrawLine($lp, $xx, -$s * 0.045, $xx, $s * 0.045) }
  $g.Dispose()
  return $bmp
}

foreach ($size in 16, 32, 48, 180, 192, 256, 512) {
  $b = Draw-Icon $size
  $b.Save((Join-Path $dir "icone-$size.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $b.Dispose()
}

# Fichier .ico (format Windows) : plusieurs tailles PNG rangées dans un seul fichier
$sizes = 16, 32, 48, 256
$pngs = $sizes | ForEach-Object { ,[System.IO.File]::ReadAllBytes((Join-Path $dir "icone-$_.png")) }
$ms = New-Object System.IO.MemoryStream; $bw = New-Object System.IO.BinaryWriter $ms
$bw.Write([UInt16]0); $bw.Write([UInt16]1); $bw.Write([UInt16]$sizes.Count)
$offset = 6 + 16 * $sizes.Count
for ($i = 0; $i -lt $sizes.Count; $i++) {
  $sz = $sizes[$i]; $len = $pngs[$i].Length
  $bw.Write([byte]($(if ($sz -ge 256) { 0 } else { $sz }))); $bw.Write([byte]($(if ($sz -ge 256) { 0 } else { $sz })))
  $bw.Write([byte]0); $bw.Write([byte]0); $bw.Write([UInt16]1); $bw.Write([UInt16]32)
  $bw.Write([UInt32]$len); $bw.Write([UInt32]$offset); $offset += $len
}
foreach ($b in $pngs) { $bw.Write($b) }
[System.IO.File]::WriteAllBytes((Join-Path $dir 'icone.ico'), $ms.ToArray())
Remove-Item (Join-Path $dir 'icone-16.png'), (Join-Path $dir 'icone-48.png')
Write-Output "Icones creees dans $dir"

# Generates the PWA icon set from the brand sheet (assets/wasel-brand.jpeg).
# Windows PowerShell + GDI+ only, no external dependencies.
# Usage: powershell -ExecutionPolicy Bypass -File tools\make-icons.ps1
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$assets = Join-Path $root 'assets'
$srcPath = Join-Path $assets 'wasel-brand.jpeg'

$src = [System.Drawing.Image]::FromFile($srcPath)

# Downscale to find the logo mark bounding box without scanning 3.2M pixels.
$scanSize = 450
$scan = New-Object System.Drawing.Bitmap($scanSize, $scanSize)
$g = [System.Drawing.Graphics]::FromImage($scan)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($src, 0, 0, $scanSize, $scanSize)
$g.Dispose()

# The mark sits in the top third; the wordmark below it must stay out of the crop.
$maxRow = [int]($scanSize * 0.39)
$minX = $scanSize; $maxX = -1; $minY = -1; $maxY = -1
for ($y = 0; $y -lt $maxRow; $y++) {
  for ($x = 0; $x -lt $scanSize; $x++) {
    $c = $scan.GetPixel($x, $y)
    if ($c.R -lt 245 -or $c.G -lt 245 -or $c.B -lt 245) {
      if ($x -lt $minX) { $minX = $x }
      if ($x -gt $maxX) { $maxX = $x }
      if ($minY -lt 0) { $minY = $y }
      $maxY = $y
    }
  }
}
$scan.Dispose()
if ($maxX -lt 0) { throw 'Logo mark not found in brand image.' }

$factor = $src.Width / $scanSize
$pad = [int]($src.Width * 0.012)
$cropX = [int]($minX * $factor) - $pad
$cropY = [int]($minY * $factor) - $pad
$cropW = [int](($maxX - $minX + 1) * $factor) + (2 * $pad)
$cropH = [int](($maxY - $minY + 1) * $factor) + (2 * $pad)
if ($cropX -lt 0) { $cropW += $cropX; $cropX = 0 }
if ($cropY -lt 0) { $cropH += $cropY; $cropY = 0 }
if (($cropX + $cropW) -gt $src.Width) { $cropW = $src.Width - $cropX }
if (($cropY + $cropH) -gt $src.Height) { $cropH = $src.Height - $cropY }

$rect = New-Object System.Drawing.Rectangle -ArgumentList $cropX, $cropY, $cropW, $cropH
$mark = ([System.Drawing.Bitmap]$src).Clone($rect, $src.PixelFormat)
$src.Dispose()
Write-Host ("mark crop: {0}x{1} at {2},{3}" -f $rect.Width, $rect.Height, $rect.X, $rect.Y)

$white = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)

function New-Icon {
  param([int]$Size, [string]$File, [double]$Fill, [System.Drawing.Color]$Background)
  $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear($Background)
  $w = [int]($Size * $Fill)
  $h = [int]($w * $script:rect.Height / $script:rect.Width)
  $maxH = [int]($Size * 0.7)
  if ($h -gt $maxH) { $h = $maxH; $w = [int]($h * $script:rect.Width / $script:rect.Height) }
  $g.DrawImage($script:mark, [int](($Size - $w) / 2), [int](($Size - $h) / 2), $w, $h)
  $g.Dispose()
  $bmp.Save((Join-Path $assets $File), [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host ("  {0}" -f $File)
}

Write-Host 'generating icons...'
New-Icon -Size 192 -File 'icon-192.png'    -Fill 0.74 -Background $white
New-Icon -Size 512 -File 'icon-512.png'    -Fill 0.74 -Background $white
New-Icon -Size 192 -File 'icon-maskable-192.png' -Fill 0.58 -Background $white
New-Icon -Size 512 -File 'icon-maskable-512.png' -Fill 0.58 -Background $white
New-Icon -Size 180 -File 'apple-touch-icon.png'  -Fill 0.66 -Background $white
New-Icon -Size 48  -File 'favicon-48.png'  -Fill 0.74 -Background $white
New-Icon -Size 32  -File 'favicon-32.png'  -Fill 0.74 -Background $white

$mark.Dispose()
Write-Host 'done.'

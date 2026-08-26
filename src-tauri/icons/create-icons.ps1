Add-Type -AssemblyName System.Drawing

$iconsDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Create 32x32 PNG
$bmp32 = New-Object System.Drawing.Bitmap(32, 32)
$g32 = [System.Drawing.Graphics]::FromImage($bmp32)
$g32.Clear([System.Drawing.Color]::FromArgb(79, 70, 229))
$g32.Dispose()
$bmp32.Save("$iconsDir\32x32.png")

# Create 128x128 PNG
$bmp128 = New-Object System.Drawing.Bitmap(128, 128)
$g128 = [System.Drawing.Graphics]::FromImage($bmp128)
$g128.Clear([System.Drawing.Color]::FromArgb(79, 70, 229))
$g128.Dispose()
$bmp128.Save("$iconsDir\128x128.png")
$bmp128.Save("$iconsDir\128x128@2x.png")

# Create 256x256 PNG for icon
$bmp256 = New-Object System.Drawing.Bitmap(256, 256)
$g256 = [System.Drawing.Graphics]::FromImage($bmp256)
$g256.Clear([System.Drawing.Color]::FromArgb(79, 70, 229))
$g256.Dispose()
$bmp256.Save("$iconsDir\icon.png")

# Create ICO from 256x256
$icon = [System.Drawing.Icon]::FromHandle($bmp256.GetHicon())
$fs = [System.IO.File]::Create("$iconsDir\icon.ico")
$icon.Save($fs)
$fs.Close()

Write-Host "Icons created successfully"

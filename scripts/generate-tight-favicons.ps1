Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "..\public\Lumiardi logo2-Trasparente.png"
if (-not (Test-Path $srcPath)) {
    Write-Error "Source image not found: $srcPath"
    exit 1
}

$srcBmp = [System.Drawing.Bitmap]::FromFile($srcPath)

# 1. Encontrar o Bounding Box de pixels não transparentes
$minX = $srcBmp.Width
$minY = $srcBmp.Height
$maxX = 0
$maxY = 0

for ($y = 0; $y -lt $srcBmp.Height; $y++) {
    for ($x = 0; $x -lt $srcBmp.Width; $x++) {
        $pixel = $srcBmp.GetPixel($x, $y)
        if ($pixel.A -gt 10) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

$cropWidth = $maxX - $minX + 1
$cropHeight = $maxY - $minY + 1

Write-Host "Bounding Box Detectado: X=$minX..$maxX (W=$cropWidth), Y=$minY..$maxY (H=$cropHeight)"

# 2. Recortar a imagem rente ao símbolo
$cropped = New-Object System.Drawing.Bitmap($cropWidth, $cropHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gCrop = [System.Drawing.Graphics]::FromImage($cropped)
$gCrop.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gCrop.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gCrop.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$gCrop.DrawImage($srcBmp, (New-Object System.Drawing.Rectangle(0, 0, $cropWidth, $cropHeight)), $minX, $minY, $cropWidth, $cropHeight, [System.Drawing.GraphicsUnit]::Pixel)
$gCrop.Dispose()
$srcBmp.Dispose()

# Função para redimensionar ocupando ~95% da caixa (margem mínima de 2.5% para não cortar)
function Generate-Icon([System.Drawing.Bitmap]$sourceImg, [int]$size, [string]$outPath) {
    $destBmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($destBmp)
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    # Margem mínima de 2px ou 4%
    $padding = [Math]::Max(1, [int]($size * 0.03))
    $drawAreaSize = $size - ($padding * 2)

    $srcAspect = $sourceImg.Width / $sourceImg.Height
    if ($srcAspect -gt 1.0) {
        $w = $drawAreaSize
        $h = [int]($drawAreaSize / $srcAspect)
    } else {
        $h = $drawAreaSize
        $w = [int]($drawAreaSize * $srcAspect)
    }

    $x = [int](($size - $w) / 2)
    $y = [int](($size - $h) / 2)

    $g.DrawImage($sourceImg, (New-Object System.Drawing.Rectangle($x, $y, $w, $h)), 0, 0, $sourceImg.Width, $sourceImg.Height, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    $destBmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBmp.Dispose()
    Write-Host "Gerado: $outPath (${size}x${size})"
}

$publicDir = Join-Path $PSScriptRoot "..\public"
$appDir = Join-Path $PSScriptRoot "..\src\app"

# Gerar todas as resoluções
Generate-Icon $cropped 16 (Join-Path $publicDir "favicon-16x16.png")
Generate-Icon $cropped 32 (Join-Path $publicDir "favicon-32x32.png")
Generate-Icon $cropped 180 (Join-Path $publicDir "apple-touch-icon.png")
Generate-Icon $cropped 192 (Join-Path $publicDir "android-chrome-192x192.png")
Generate-Icon $cropped 512 (Join-Path $publicDir "android-chrome-512x512.png")

# Copiar para App Router
Generate-Icon $cropped 32 (Join-Path $appDir "icon.png")
Generate-Icon $cropped 180 (Join-Path $appDir "apple-icon.png")

# Criar favicon.ico usando o Bitmap 32x32
$icoPathPublic = Join-Path $publicDir "favicon.ico"
$icoPathApp = Join-Path $appDir "favicon.ico"

# Salvar como .ico
$icoBmp = New-Object System.Drawing.Bitmap((Join-Path $publicDir "favicon-32x32.png"))
$icoHandle = $icoBmp.GetHicon()
$icoObj = [System.Drawing.Icon]::FromHandle($icoHandle)
$fsPublic = [System.IO.File]::OpenWrite($icoPathPublic)
$icoObj.Save($fsPublic)
$fsPublic.Close()

$fsApp = [System.IO.File]::OpenWrite($icoPathApp)
$icoObj.Save($fsApp)
$fsApp.Close()

$icoBmp.Dispose()
$cropped.Dispose()

Write-Host "Favicons gerados com tamanho máximo e alta nitidez!"

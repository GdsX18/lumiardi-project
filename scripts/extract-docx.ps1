Add-Type -AssemblyName System.IO.Compression.FileSystem

$docxFolder = Join-Path $PSScriptRoot "..\public\docx"
$scratchFolder = Join-Path $PSScriptRoot "..\scratch"
if (-not (Test-Path $scratchFolder)) { New-Item -ItemType Directory -Path $scratchFolder -Force }

function Extract-DocxText($docxPath, $outTxtPath) {
    Write-Host "Extraindo $docxPath..."
    $zip = [System.IO.Compression.ZipFile]::OpenRead($docxPath)
    $entry = $zip.Entries | Where-Object { $_.FullName -eq "word/document.xml" }
    if ($entry) {
        $stream = $entry.Open()
        $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)
        $xmlContent = $reader.ReadToEnd()
        $reader.Close()
        $stream.Close()
        
        [xml]$docXml = $xmlContent
        $ns = New-Object System.Xml.XmlNamespaceManager($docXml.NameTable)
        $ns.AddNamespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")
        
        $paragraphs = $docXml.SelectNodes("//w:p", $ns)
        $sb = New-Object System.Text.StringBuilder
        
        foreach ($p in $paragraphs) {
            $tNodes = $p.SelectNodes(".//w:t", $ns)
            $pText = ""
            foreach ($t in $tNodes) {
                $pText += $t.InnerText
            }
            if ($pText.Trim().Length -gt 0) {
                [void]$sb.AppendLine($pText)
            }
        }
        
        [System.IO.File]::WriteAllText($outTxtPath, $sb.ToString(), [System.Text.Encoding]::UTF8)
        Write-Host "Salvo em $outTxtPath"
    }
    $zip.Dispose()
}

$files = Get-ChildItem -Path $docxFolder -Filter "*.docx"
foreach ($f in $files) {
    $outName = [System.IO.Path]::GetFileNameWithoutExtension($f.Name) + ".txt"
    $outPath = Join-Path $scratchFolder $outName
    Extract-DocxText $f.FullName $outPath
}

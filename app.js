document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const conversionOptions = document.getElementById('conversion-options');
    const progressSection = document.getElementById('progress-section');
    const resultSection = document.getElementById('result-section');
    const errorSection = document.getElementById('error-section');
    const errorMessage = document.getElementById('error-message');
    const btnErrorBack = document.getElementById('btn-error-back');
    
    const fileInfo = document.getElementById('file-info');
    const formatGrid = document.getElementById('format-grid');
    const btnConvert = document.getElementById('btn-convert');
    const btnDownload = document.getElementById('btn-download');
    const btnRestart = document.getElementById('btn-restart');
    
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const resultInfo = document.getElementById('result-info');
    const resultPreview = document.getElementById('result-preview');
    const btnBrowse = document.getElementById('btn-browse');

    const compressionSettings = document.getElementById('compression-settings');
    const qualitySlider = document.getElementById('quality-slider');
    const qualityValue = document.getElementById('quality-value');

    // History elements
    const btnHistoryToggle = document.getElementById('btn-history-toggle');
    const historyBadge = document.getElementById('history-badge');
    const historyDrawerOverlay = document.getElementById('history-drawer-overlay');
    const btnCloseDrawer = document.getElementById('btn-close-drawer');
    const btnClearHistory = document.getElementById('btn-clear-history');
    const historyList = document.getElementById('history-list');

    // Setup PDF.js worker
    if (window.pdfjsLib) {
        try {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'libs/pdf.worker.min.js';
        } catch (err) {
            console.warn('PDF.js worker setup note:', err);
        }
    }

    btnBrowse.addEventListener('click', () => fileInput.click());

    if (qualitySlider) {
        qualitySlider.addEventListener('input', (e) => {
            qualityValue.textContent = e.target.value;
        });
    }

    // State
    let currentFile = null;
    let targetFormat = null;
    let convertedBlob = null;
    let outputExtension = '';

    // File type detection
    function getNormalizedFileType(file) {
        const ext = file.name.split('.').pop().toLowerCase();
        if (file.type === 'application/pdf' || ext === 'pdf') return 'pdf';
        if (file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'].includes(ext)) return 'image';
        if (ext === 'docx' || file.type.includes('wordprocessingml')) return 'docx';
        if (['xlsx', 'xls'].includes(ext) || file.type.includes('spreadsheetml')) return 'xlsx';
        if (['md', 'markdown'].includes(ext) || file.type === 'text/markdown') return 'markdown';
        if (['txt', 'text'].includes(ext) || file.type === 'text/plain') return 'text';
        return 'unknown';
    }

    // Supported conversions with 100% genuine client-side conversion
    const conversionFormats = {
        'pdf': ['JPG', 'PNG', 'TXT'],
        'image': ['JPG', 'PNG', 'WEBP', 'PDF', 'Komprese JPG'],
        'docx': ['TXT', 'HTML'],
        'xlsx': ['CSV'],
        'markdown': ['HTML', 'PDF', 'TXT'],
        'text': ['PDF', 'HTML'],
        'unknown': ['TXT', 'PDF']
    };

    // Event Listeners for Drag & Drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
    });

    dropZone.addEventListener('drop', handleDrop, false);
    fileInput.addEventListener('change', handleFileSelect, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    function handleFileSelect(e) {
        const files = e.target.files;
        handleFiles(files);
    }

    function handleFiles(files) {
        if (files && files.length > 0) {
            currentFile = files[0];
            showConversionOptions();
        }
    }

    function formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }

    function showConversionOptions() {
        dropZone.classList.add('hidden');
        if (errorSection) errorSection.classList.add('hidden');
        conversionOptions.classList.remove('hidden');
        conversionOptions.classList.add('fade-in');

        // Display file info
        fileInfo.innerHTML = `
            <div style="display:flex;align-items:center;flex-grow:1;">
                <svg style="width:24px;height:24px;margin-right:12px;color:var(--primary-color);flex-shrink:0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                </svg>
                <div style="overflow:hidden;">
                    <strong style="word-break: break-all;" id="file-name-display"></strong>
                    <div style="color:var(--text-secondary);font-size:0.8rem">${formatBytes(currentFile.size)}</div>
                </div>
            </div>
            <button class="btn-remove-file" id="btn-remove-file" title="Odstranit soubor">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;
        document.getElementById('file-name-display').textContent = currentFile.name;
        document.getElementById('btn-remove-file').addEventListener('click', resetToUpload);

        // Generate target formats
        targetFormat = null;
        formatGrid.innerHTML = '';
        btnConvert.disabled = true;
        btnConvert.style.opacity = '0.5';

        const fileType = getNormalizedFileType(currentFile);
        const options = conversionFormats[fileType] || ['TXT', 'PDF'];

        options.forEach(format => {
            const div = document.createElement('div');
            div.className = 'format-option';
            div.textContent = format;
            div.onclick = () => selectFormat(div, format);
            formatGrid.appendChild(div);
        });
    }

    function selectFormat(element, format) {
        document.querySelectorAll('.format-option').forEach(el => el.classList.remove('selected'));
        element.classList.add('selected');
        targetFormat = format;
        btnConvert.disabled = false;
        btnConvert.style.opacity = '1';

        // Show quality slider for formats where quality compression makes sense
        if (['JPG', 'Komprese JPG', 'WEBP'].includes(format)) {
            compressionSettings.classList.remove('hidden');
            compressionSettings.classList.add('fade-in');
        } else {
            compressionSettings.classList.add('hidden');
            compressionSettings.classList.remove('fade-in');
        }
    }

    btnConvert.addEventListener('click', () => {
        if (!targetFormat || !currentFile) return;
        startConversion();
    });

    function updateProgress(percent, label) {
        progressBar.style.width = `${percent}%`;
        progressText.textContent = `${label || Math.round(percent) + '%'}`;
    }

    async function startConversion() {
        conversionOptions.classList.add('hidden');
        progressSection.classList.remove('hidden');
        progressSection.classList.add('fade-in');
        updateProgress(15, 'Načítám soubor...');

        try {
            const fileType = getNormalizedFileType(currentFile);
            const quality = parseInt(qualitySlider.value, 10) / 100;
            let resultBlob = null;
            let ext = targetFormat.toLowerCase();

            updateProgress(35, 'Zpracovávám formát...');

            if (fileType === 'image') {
                if (['JPG', 'JPEG', 'Komprese JPG'].includes(targetFormat)) {
                    resultBlob = await convertImageToFormat(currentFile, 'image/jpeg', quality);
                    ext = 'jpg';
                } else if (targetFormat === 'PNG') {
                    resultBlob = await convertImageToFormat(currentFile, 'image/png');
                    ext = 'png';
                } else if (targetFormat === 'WEBP') {
                    resultBlob = await convertImageToFormat(currentFile, 'image/webp', quality);
                    ext = 'webp';
                } else if (targetFormat === 'PDF') {
                    updateProgress(50, 'Vytvářím PDF...');
                    resultBlob = await convertImageToPdf(currentFile);
                    ext = 'pdf';
                }
            } else if (fileType === 'pdf') {
                if (['JPG', 'JPEG'].includes(targetFormat)) {
                    updateProgress(45, 'Vykresluji PDF do obrázku...');
                    const res = await convertPdfToImages(currentFile, 'image/jpeg', quality);
                    resultBlob = res.blob;
                    ext = res.extension;
                } else if (targetFormat === 'PNG') {
                    updateProgress(45, 'Vykresluji PDF do PNG...');
                    const res = await convertPdfToImages(currentFile, 'image/png');
                    resultBlob = res.blob;
                    ext = res.extension;
                } else if (targetFormat === 'TXT') {
                    updateProgress(45, 'Extrahuji text...');
                    resultBlob = await convertPdfToText(currentFile);
                    ext = 'txt';
                }
            } else if (fileType === 'markdown') {
                const text = await currentFile.text();
                if (targetFormat === 'HTML') {
                    resultBlob = convertMarkdownToHtml(text, currentFile.name);
                    ext = 'html';
                } else if (targetFormat === 'PDF') {
                    resultBlob = await convertTextToPdf(text, currentFile.name);
                    ext = 'pdf';
                } else if (targetFormat === 'TXT') {
                    resultBlob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                    ext = 'txt';
                }
            } else if (fileType === 'text') {
                const text = await currentFile.text();
                if (targetFormat === 'PDF') {
                    resultBlob = await convertTextToPdf(text, currentFile.name);
                    ext = 'pdf';
                } else if (targetFormat === 'HTML') {
                    resultBlob = convertTextToHtml(text, currentFile.name);
                    ext = 'html';
                }
            } else if (fileType === 'docx') {
                updateProgress(50, 'Zpracovávám Word dokument...');
                resultBlob = await convertDocx(currentFile, targetFormat);
                ext = targetFormat.toLowerCase();
            } else if (fileType === 'xlsx') {
                updateProgress(50, 'Zpracovávám tabulku Excel...');
                resultBlob = await convertXlsx(currentFile);
                ext = 'csv';
            }

            if (!resultBlob) {
                throw new Error(`Převod formátu ${targetFormat} není v prohlížeči podporován.`);
            }

            updateProgress(100, 'Dokončeno!');
            convertedBlob = resultBlob;
            outputExtension = ext;
            setTimeout(showResult, 400);

        } catch (err) {
            console.error('Chyba při převodu:', err);
            showError(err.message || 'Nastala chyba při převodu souboru.');
        }
    }

    // Real image conversion using HTML5 Canvas
    function convertImageToFormat(file, mimeType, quality = 0.85) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth || img.width;
                    canvas.height = img.naturalHeight || img.height;
                    const ctx = canvas.getContext('2d');

                    if (mimeType === 'image/jpeg') {
                        // Fill white background to prevent transparent areas from turning black
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    ctx.drawImage(img, 0, 0);

                    canvas.toBlob((blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error('Chyba při kódování obrázku.'));
                    }, mimeType, quality);
                };
                img.onerror = () => reject(new Error('Nepodařilo se načíst obrázek.'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Nepodařilo se přečíst soubor.'));
            reader.readAsDataURL(file);
        });
    }

    // Real PDF rendering to high-resolution JPEG / PNG using PDF.js
    async function convertPdfToImages(file, mimeType = 'image/jpeg', quality = 0.92) {
        if (!window.pdfjsLib) {
            throw new Error('Knihovna PDF.js se nenačetla. Zkontrolujte připojení k internetu.');
        }
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;

        if (numPages === 1 || !window.JSZip) {
            // Render single page
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 2.5 }); // High DPI for crisp posters
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');

            if (mimeType === 'image/jpeg') {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            await page.render({ canvasContext: ctx, viewport }).promise;

            const blob = await new Promise(resolve => canvas.toBlob(resolve, mimeType, quality));
            const ext = mimeType === 'image/png' ? 'png' : 'jpg';
            return { blob, extension: ext };
        } else {
            // Multi-page PDF bundled into ZIP
            const zip = new JSZip();
            const ext = mimeType === 'image/png' ? 'png' : 'jpg';

            for (let i = 1; i <= numPages; i++) {
                updateProgress(45 + Math.round((i / numPages) * 45), `Vykresluji stranu ${i} z ${numPages}...`);
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const ctx = canvas.getContext('2d');

                if (mimeType === 'image/jpeg') {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                await page.render({ canvasContext: ctx, viewport }).promise;
                const blob = await new Promise(resolve => canvas.toBlob(resolve, mimeType, quality));
                zip.file(`strana-${i}.${ext}`, blob);
            }

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            return { blob: zipBlob, extension: 'zip' };
        }
    }

    // Real Image to PDF using jsPDF
    function convertImageToPdf(file) {
        return new Promise((resolve, reject) => {
            if (!window.jspdf || !window.jspdf.jsPDF) {
                return reject(new Error('Knihovna jsPDF se nenačetla.'));
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    try {
                        const { jsPDF } = window.jspdf;
                        const orientation = img.naturalWidth > img.naturalHeight ? 'l' : 'p';
                        const doc = new jsPDF({
                            orientation: orientation,
                            unit: 'px',
                            format: [img.naturalWidth, img.naturalHeight]
                        });
                        doc.addImage(img, 'JPEG', 0, 0, img.naturalWidth, img.naturalHeight);
                        resolve(doc.output('blob'));
                    } catch (err) {
                        reject(err);
                    }
                };
                img.onerror = () => reject(new Error('Nepodařilo se načíst obrázek pro PDF.'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Nepodařilo se přečíst soubor.'));
            reader.readAsDataURL(file);
        });
    }

    // Real PDF text extraction
    async function convertPdfToText(file) {
        if (!window.pdfjsLib) {
            throw new Error('Knihovna PDF.js se nenačetla.');
        }
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += `--- Strana ${i} ---\n` + pageText + '\n\n';
        }
        return new Blob([fullText.trim()], { type: 'text/plain;charset=utf-8' });
    }

    // DOCX conversion using Mammoth
    async function convertDocx(file, targetFormat) {
        if (!window.mammoth) {
            throw new Error('Knihovna Mammoth se nenačetla.');
        }
        const arrayBuffer = await file.arrayBuffer();
        if (targetFormat === 'TXT') {
            const result = await mammoth.extractRawText({ arrayBuffer });
            return new Blob([result.value], { type: 'text/plain;charset=utf-8' });
        } else if (targetFormat === 'HTML') {
            const result = await mammoth.convertToHtml({ arrayBuffer });
            const html = `<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <title>${file.name}</title>
    <style>body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; padding: 2.5rem; max-width: 800px; margin: auto; color: #1e293b; }</style>
</head>
<body>${result.value}</body>
</html>`;
            return new Blob([html], { type: 'text/html;charset=utf-8' });
        }
        throw new Error(`Formát ${targetFormat} není pro DOCX podporován.`);
    }

    // Excel XLSX to CSV using SheetJS
    async function convertXlsx(file) {
        if (!window.XLSX) {
            throw new Error('Knihovna SheetJS se nenačetla.');
        }
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        return new Blob([csv], { type: 'text/csv;charset=utf-8' });
    }

    // Markdown to clean HTML
    function convertMarkdownToHtml(mdText, filename) {
        let html = mdText
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            .replace(/`([^`]+)`/gim, '<code>$1</code>')
            .replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>')
            .replace(/\n/gim, '<br />');

        const fullHtml = `<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${filename || 'Převedený dokument'}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; padding: 2.5rem; max-width: 800px; margin: 0 auto; color: #1e293b; background: #f8fafc; }
        h1, h2, h3 { color: #0f172a; margin-top: 1.5rem; }
        code { background: #e2e8f0; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.9em; }
        li { margin-left: 1.5rem; }
    </style>
</head>
<body>
${html}
</body>
</html>`;
        return new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    }

    // Text to HTML
    function convertTextToHtml(text, filename) {
        const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br />');
        const html = `<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <title>${filename || 'Dokument'}</title>
    <style>body { font-family: monospace; line-height: 1.5; padding: 2rem; white-space: pre-wrap; }</style>
</head>
<body>${escaped}</body>
</html>`;
        return new Blob([html], { type: 'text/html;charset=utf-8' });
    }

    // Text to PDF using jsPDF
    function convertTextToPdf(text, filename) {
        return new Promise((resolve, reject) => {
            if (!window.jspdf || !window.jspdf.jsPDF) {
                return reject(new Error('Knihovna jsPDF se nenačetla.'));
            }
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                doc.setFontSize(11);
                const splitText = doc.splitTextToSize(text, 180);
                doc.text(splitText, 15, 20);
                resolve(doc.output('blob'));
            } catch (err) {
                reject(err);
            }
        });
    }

    function showResult() {
        progressSection.classList.add('hidden');
        resultSection.classList.remove('hidden');
        resultSection.classList.add('fade-in');

        // Image Preview if converted to an image
        if (resultPreview) {
            if (['jpg', 'png', 'webp'].includes(outputExtension) && convertedBlob) {
                const previewUrl = URL.createObjectURL(convertedBlob);
                resultPreview.innerHTML = `<img src="${previewUrl}" alt="Náhled převedeného souboru" class="result-preview-image">`;
                resultPreview.classList.remove('hidden');
            } else {
                resultPreview.innerHTML = '';
                resultPreview.classList.add('hidden');
            }
        }

        // Details about conversion
        const originalSize = currentFile.size;
        const newSize = convertedBlob.size;
        let sizeDetails = '';

        if (['jpg', 'png', 'webp'].includes(outputExtension) && currentFile.type.startsWith('image/')) {
            const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);
            const savingsText = savings > 0 
                ? `<span style="color:var(--success-color)">Ušetřeno: ${savings}%</span>` 
                : `<span style="color:#a855f7">Nová velikost: +${Math.abs(savings)}%</span>`;
            sizeDetails = `
                <div style="display:flex; justify-content:space-between; border-top:1px solid rgba(255,255,255,0.1); padding-top:0.5rem; margin-top:0.5rem;">
                    <span>Změna velikosti:</span>
                    <strong>${savingsText}</strong>
                </div>
            `;
        }

        resultInfo.innerHTML = `
            <div style="background:rgba(0,0,0,0.2); border-radius:8px; padding:1rem; margin-bottom:1.5rem; font-size:0.9rem; text-align: left;">
                <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                    <span style="color:var(--text-secondary)">Původní soubor:</span>
                    <strong style="word-break: break-all;">${currentFile.name} (${formatBytes(originalSize)})</strong>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                    <span style="color:var(--text-secondary)">Převedený soubor:</span>
                    <strong>.${outputExtension.toUpperCase()} (${formatBytes(newSize)})</strong>
                </div>
                ${sizeDetails}
            </div>
        `;
        resultInfo.classList.remove('hidden');

        // Automatické uložení do historie (IndexedDB)
        const originalBaseName = currentFile.name.substring(0, currentFile.name.lastIndexOf('.')) || currentFile.name;
        const convertedFilename = `${originalBaseName}-converted.${outputExtension}`;
        addConversionToHistory({
            originalName: currentFile.name,
            convertedFilename: convertedFilename,
            originalSize: originalSize,
            convertedSize: newSize,
            outputExtension: outputExtension,
            blob: convertedBlob,
            timestamp: Date.now()
        });
    }

    function showError(message) {
        progressSection.classList.add('hidden');
        conversionOptions.classList.add('hidden');
        resultSection.classList.add('hidden');
        if (errorSection) {
            errorSection.classList.remove('hidden');
            errorSection.classList.add('fade-in');
            errorMessage.textContent = message;
        } else {
            alert(message);
        }
    }

    btnDownload.addEventListener('click', () => {
        if (!convertedBlob) return;
        const originalName = currentFile.name.substring(0, currentFile.name.lastIndexOf('.')) || currentFile.name;
        const filename = `${originalName}-converted.${outputExtension}`;

        const url = window.URL.createObjectURL(convertedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }, 200);
    });

    function resetToUpload() {
        conversionOptions.classList.add('hidden');
        resultSection.classList.add('hidden');
        if (errorSection) errorSection.classList.add('hidden');
        dropZone.classList.remove('hidden');
        dropZone.classList.add('fade-in');

        // Reset state
        currentFile = null;
        targetFormat = null;
        convertedBlob = null;
        outputExtension = '';
        fileInput.value = '';
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        if (resultPreview) {
            resultPreview.innerHTML = '';
            resultPreview.classList.add('hidden');
        }
    }

    btnRestart.addEventListener('click', resetToUpload);
    if (btnErrorBack) btnErrorBack.addEventListener('click', resetToUpload);

    // ==========================================
    // HISTORIE PŘEVODŮ (IndexedDB)
    // ==========================================
    const DB_NAME = 'ConvertifyHistoryDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'conversions';

    function openHistoryDB() {
        return new Promise((resolve, reject) => {
            if (!('indexedDB' in window)) {
                return reject(new Error('IndexedDB není v tomto prohlížeči podporována.'));
            }
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function addConversionToHistory(record) {
        try {
            const db = await openHistoryDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);

            store.add(record);

            // Udržovat maximálně 25 nejnovějších převodů
            const index = store.index('timestamp');
            const getAllReq = index.getAll();
            getAllReq.onsuccess = () => {
                const items = getAllReq.result;
                if (items.length > 25) {
                    const toDelete = items.slice(0, items.length - 25);
                    toDelete.forEach(item => {
                        store.delete(item.id);
                    });
                }
            };

            tx.oncomplete = () => {
                loadHistory();
            };
        } catch (err) {
            console.warn('Uložení do historie se nezdařilo:', err);
        }
    }

    async function loadHistory() {
        try {
            const db = await openHistoryDB();
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const items = (request.result || []).sort((a, b) => b.timestamp - a.timestamp);
                renderHistoryList(items);
                updateHistoryBadge(items.length);
            };
        } catch (err) {
            console.warn('Načtení historie selhalo:', err);
            renderHistoryList([]);
            updateHistoryBadge(0);
        }
    }

    function updateHistoryBadge(count) {
        if (!historyBadge) return;
        if (count > 0) {
            historyBadge.textContent = count > 99 ? '99+' : count;
            historyBadge.classList.remove('hidden');
        } else {
            historyBadge.classList.add('hidden');
        }

        if (btnClearHistory) {
            if (count > 0) {
                btnClearHistory.classList.remove('hidden');
            } else {
                btnClearHistory.classList.add('hidden');
            }
        }
    }

    function formatRelativeTime(timestamp) {
        const now = Date.now();
        const diffSec = Math.floor((now - timestamp) / 1000);

        if (diffSec < 60) return 'Před chvílí';
        const diffMin = Math.floor(diffSec / 60);
        if (diffMin < 60) return `Před ${diffMin} min`;

        const date = new Date(timestamp);
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();

        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        if (isToday) {
            return `Dnes v ${hours}:${minutes}`;
        }

        const day = date.getDate();
        const month = date.getMonth() + 1;
        return `${day}. ${month}. v ${hours}:${minutes}`;
    }

    function getFormatClass(ext) {
        const e = (ext || '').toLowerCase();
        if (e === 'pdf') return 'format-pdf';
        if (['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif', 'bmp'].includes(e)) return 'format-image';
        if (['xlsx', 'xls', 'csv'].includes(e)) return 'format-xlsx';
        if (['docx', 'doc', 'txt', 'md'].includes(e)) return 'format-docx';
        if (e === 'zip') return 'format-zip';
        return '';
    }

    function renderHistoryList(items) {
        if (!historyList) return;

        if (!items || items.length === 0) {
            historyList.innerHTML = `
                <div class="history-empty">
                    <svg class="history-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <h4>Zatím žádná historie</h4>
                    <p>Převedené soubory se zde automaticky uloží pro vaše pozdější stažení.</p>
                </div>
            `;
            return;
        }

        historyList.innerHTML = items.map(item => {
            const formatClass = getFormatClass(item.outputExtension);
            const originalExt = (item.originalName.split('.').pop() || '').toUpperCase();
            const targetExt = (item.outputExtension || '').toUpperCase();

            let sizeChange = '';
            if (item.originalSize && item.convertedSize) {
                const savings = ((item.originalSize - item.convertedSize) / item.originalSize * 100).toFixed(0);
                if (savings > 0) {
                    sizeChange = ` • <span style="color:var(--success-color)">-${savings}%</span>`;
                }
            }

            return `
                <div class="history-card" data-id="${item.id}">
                    <div class="history-card-header">
                        <span class="history-badge-format ${formatClass}">
                            ${originalExt} &rarr; ${targetExt}
                        </span>
                        <span class="history-time">${formatRelativeTime(item.timestamp)}</span>
                    </div>
                    <div class="history-card-body">
                        <div class="history-filename" title="${item.convertedFilename}">
                            ${item.convertedFilename}
                        </div>
                        <div class="history-meta">
                            <span>${formatBytes(item.convertedSize)}</span>${sizeChange}
                        </div>
                    </div>
                    <div class="history-card-footer">
                        <button class="btn-history-download" data-id="${item.id}" type="button">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Stáhnout
                        </button>
                        <button class="btn-history-delete" data-id="${item.id}" title="Smazat záznam" type="button">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Listenery pro stažení a mazání
        historyList.querySelectorAll('.btn-history-download').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = Number(e.currentTarget.getAttribute('data-id'));
                downloadFromHistory(id);
            });
        });

        historyList.querySelectorAll('.btn-history-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = Number(e.currentTarget.getAttribute('data-id'));
                deleteFromHistory(id);
            });
        });
    }

    async function downloadFromHistory(id) {
        try {
            const db = await openHistoryDB();
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(id);

            req.onsuccess = () => {
                const item = req.result;
                if (!item || !item.blob) {
                    alert('Tento soubor již není v mezipaměti dostupný.');
                    return;
                }
                const url = window.URL.createObjectURL(item.blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = item.convertedFilename;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                }, 200);
            };
        } catch (err) {
            console.error('Chyba při stahování z historie:', err);
        }
    }

    async function deleteFromHistory(id) {
        try {
            const db = await openHistoryDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.delete(id);
            tx.oncomplete = () => {
                loadHistory();
            };
        } catch (err) {
            console.error('Chyba při mazání z historie:', err);
        }
    }

    async function clearAllHistory() {
        if (!confirm('Opravdu chcete vymazat celou historii převodů?')) return;
        try {
            const db = await openHistoryDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.clear();
            tx.oncomplete = () => {
                loadHistory();
            };
        } catch (err) {
            console.error('Chyba při mazání veškeré historie:', err);
        }
    }

    function openDrawer() {
        if (!historyDrawerOverlay) return;
        historyDrawerOverlay.classList.remove('hidden');
        requestAnimationFrame(() => {
            historyDrawerOverlay.classList.add('active');
        });
        loadHistory();
    }

    function closeDrawer() {
        if (!historyDrawerOverlay) return;
        historyDrawerOverlay.classList.remove('active');
        setTimeout(() => {
            historyDrawerOverlay.classList.add('hidden');
        }, 300);
    }

    if (btnHistoryToggle) {
        btnHistoryToggle.addEventListener('click', openDrawer);
    }
    if (btnCloseDrawer) {
        btnCloseDrawer.addEventListener('click', closeDrawer);
    }
    if (historyDrawerOverlay) {
        historyDrawerOverlay.addEventListener('click', (e) => {
            if (e.target === historyDrawerOverlay) {
                closeDrawer();
            }
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && historyDrawerOverlay && historyDrawerOverlay.classList.contains('active')) {
            closeDrawer();
        }
    });
    if (btnClearHistory) {
        btnClearHistory.addEventListener('click', clearAllHistory);
    }

    // ==========================================
    // OCHRANA PROTI VÝPADKŮM A REŽIM OFFLINE
    // ==========================================
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').catch(err => {
                console.warn('Service worker registrace:', err);
            });
        });
    }

    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');

    async function checkServerConnection() {
        if (!window.location.protocol.startsWith('http')) {
            if (statusIndicator) statusIndicator.className = 'status-indicator online';
            if (statusText) statusText.textContent = 'Lokální režim (soubor)';
            return;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            const res = await fetch('/health?t=' + Date.now(), { signal: controller.signal, cache: 'no-store' });
            clearTimeout(timeoutId);

            if (res.ok) {
                if (statusIndicator) statusIndicator.className = 'status-indicator online';
                if (statusText) {
                    statusText.textContent = 'Server připojen';
                    statusText.style.color = 'var(--text-secondary)';
                }
            } else {
                throw new Error('Not ok');
            }
        } catch (e) {
            if (statusIndicator) statusIndicator.className = 'status-indicator offline';
            if (statusText) {
                statusText.textContent = 'Server se restartuje (převod stále funguje)';
                statusText.style.color = '#fbbf24';
            }
        }
    }

    setInterval(checkServerConnection, 8000);
    checkServerConnection();

    // Načíst historii při startu
    loadHistory();
});

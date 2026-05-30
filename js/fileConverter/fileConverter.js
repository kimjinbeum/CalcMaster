// DOM이 완전히 로드되면 변환기 초기화 함수를 호출합니다.
document.addEventListener('DOMContentLoaded', () => {
    // index.html의 다른 스크립트에서 이 함수를 호출할 수 있으므로,
    // DOMContentLoaded 시점에 한 번만 실행되도록 보장합니다.
    if (window.initFileConverter) {
        window.initFileConverter();
    }
});

function initFileConverter() {
    // --- 메인 변환기 탭 전환 로직 ---
    const convTabs = document.querySelector('.conv-tabs');
    const convPanels = document.querySelectorAll('.conv-panel');

    if (convTabs) {
        convTabs.addEventListener('click', (e) => {
            const targetBtn = e.target.closest('.conv-tab-btn');
            if (!targetBtn) return;

            const panelId = targetBtn.dataset.panel;
            if (!panelId) return;

            // 모든 탭과 패널을 비활성화
            convTabs.querySelectorAll('.conv-tab-btn').forEach(btn => btn.classList.remove('active'));
            convPanels.forEach(panel => panel.classList.remove('active'));

            // 클릭된 탭과 해당 패널을 활성화
            targetBtn.classList.add('active');
            const targetPanel = document.getElementById(panelId);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    }

    // --- PDF 내부 서브 탭 전환 로직 ---
    const pdfSubTabs = document.querySelector('.pdf-sub-tabs');
    if (pdfSubTabs) {
        pdfSubTabs.addEventListener('click', (e) => {
            const targetBtn = e.target.closest('.pdf-sub-btn');
            if (!targetBtn) return;

            const subPanelId = targetBtn.dataset.sub;
            if (!subPanelId) return;
            
            // pdf-conv 컨테이너 내의 탭과 패널을 제어합니다.
            const parentPanel = document.getElementById('pdf-conv'); 
            if (!parentPanel) return;

            parentPanel.querySelectorAll('.pdf-sub-btn').forEach(btn => btn.classList.remove('active'));
            parentPanel.querySelectorAll('.pdf-sub-panel').forEach(panel => panel.classList.remove('active'));
            
            targetBtn.classList.add('active');
            const targetSubPanel = document.getElementById(subPanelId);
            if (targetSubPanel) {
                targetSubPanel.classList.add('active');
            }
        });
    }

    // --- 외부 라이브러리 및 기능 초기화 ---
    // PDF.js 워커 경로 설정
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    }

    // 각 변환기 기능 설정
    setupImageConverter();
    setupDataConverter();
    setupPdfConverter();
}

// ==========================================
// 이미지 변환 (Image Converter)
// ==========================================
function setupImageConverter() {
    const dropZone = document.getElementById('img-drop-zone');
    const fileInput = document.getElementById('img-file-input');
    const fileInfo = document.getElementById('img-file-info');
    const filenameDisplay = document.getElementById('img-filename');
    const previewWrap = document.getElementById('img-preview-wrap');
    const previewImg = document.getElementById('img-preview');
    const convertBtn = document.getElementById('img-convert-btn');
    const formatBtns = document.querySelectorAll('#image-conv .format-btn');
    const qualityInput = document.getElementById('img-quality');
    const qualityVal = document.getElementById('img-quality-val');
    
    let currentFile = null;
    let selectedFormat = 'image/jpeg';

    if (!dropZone || !fileInput) return;

    const handleImageFile = (file) => {
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드 가능합니다.');
            return;
        }
        currentFile = file;
        filenameDisplay.textContent = file.name;
        fileInfo.style.display = 'flex';
        convertBtn.disabled = false;
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            previewWrap.style.display = 'block';
        };
        reader.readAsDataURL(file);
    };

    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); };
    dropZone.ondragleave = (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); };
    dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) handleImageFile(e.dataTransfer.files[0]);
    };
    dropZone.onclick = () => fileInput.click();
    fileInput.onchange = (e) => {
        if (e.target.files.length > 0) {
            handleImageFile(e.target.files[0]);
            e.target.value = '';
        }
    };

    formatBtns.forEach(btn => {
        btn.onclick = (e) => {
            formatBtns.forEach(b => b.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            selectedFormat = target.dataset.format;
            const qualityRow = document.getElementById('img-quality-row');
            if (qualityRow) {
                qualityRow.style.display = (selectedFormat === 'image/jpeg' || selectedFormat === 'image/webp') ? 'flex' : 'none';
            }
        };
    });

    if (qualityInput) qualityInput.oninput = (e) => {
        if(qualityVal) qualityVal.textContent = Math.round(e.target.value * 100) + '%';
    };

    if (convertBtn) convertBtn.onclick = () => {
        if (!currentFile) return;
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const quality = qualityInput ? parseFloat(qualityInput.value) : 0.9;
            const dataUrl = canvas.toDataURL(selectedFormat, quality);
            const link = document.createElement('a');
            link.href = dataUrl;
            let ext = selectedFormat.split('/')[1] || 'png';
            if (ext === 'jpeg') ext = 'jpg';
            const baseName = currentFile.name.substring(0, currentFile.name.lastIndexOf('.')) || currentFile.name;
            link.download = `${baseName}_converted.${ext}`;
            link.click();
        };
        img.src = URL.createObjectURL(currentFile);
    };
}

// ==========================================
// 데이터 변환 (JSON/CSV)
// ==========================================
function setupDataConverter() {
    const dropZone = document.getElementById('data-drop-zone');
    const fileInput = document.getElementById('data-file-input');
    const fileInfo = document.getElementById('data-file-info');
    const filenameDisplay = document.getElementById('data-filename');
    const detectedFormatBadge = document.getElementById('detected-format');
    const convertBtn = document.getElementById('data-convert-btn');
    const formatBtns = document.querySelectorAll('#data-conv .format-btn');
    const previewWrap = document.getElementById('data-preview-wrap');
    const previewArea = document.getElementById('data-preview');
    
    let currentData = null, originalFileName = '', selectedFormat = 'json';

    if (!dropZone || !fileInput) return;

    const handleDataFile = (file) => {
        originalFileName = file.name;
        filenameDisplay.textContent = file.name;
        fileInfo.style.display = 'flex';
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            previewArea.textContent = content.substring(0, 600) + (content.length > 600 ? '...' : '');
            previewWrap.style.display = 'block';
            try {
                currentData = JSON.parse(content);
                detectedFormatBadge.textContent = 'JSON';
                convertBtn.disabled = false;
            } catch {
                try {
                    currentData = parseCSV(content);
                    detectedFormatBadge.textContent = 'CSV';
                    convertBtn.disabled = false;
                } catch {
                    currentData = null;
                    detectedFormatBadge.textContent = '알 수 없음';
                    convertBtn.disabled = true;
                    alert('지원하지 않는 형식이거나 파일이 손상되었습니다.');
                }
            }
        };
        reader.readAsText(file, 'UTF-8');
    };

    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); };
    dropZone.ondragleave = (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); };
    dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) handleDataFile(e.dataTransfer.files[0]);
    };
    dropZone.onclick = () => fileInput.click();
    fileInput.onchange = (e) => {
        if (e.target.files.length > 0) {
            handleDataFile(e.target.files[0]);
            e.target.value = '';
        }
    };

    formatBtns.forEach(btn => {
        btn.onclick = (e) => {
            formatBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            selectedFormat = e.currentTarget.dataset.format;
        };
    });

    if (convertBtn) convertBtn.onclick = () => {
        if (!currentData) return;
        let outputContent = '', mimeType = 'text/plain';
        if (selectedFormat === 'json') {
            outputContent = JSON.stringify(currentData, null, 2);
            mimeType = 'application/json';
        } else if (selectedFormat === 'csv') {
            outputContent = toCSV(currentData);
            mimeType = 'text/csv';
        } else {
            outputContent = JSON.stringify(currentData, null, 2);
        }
        const blob = new Blob([outputContent], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const baseName = originalFileName.substring(0, originalFileName.lastIndexOf('.')) || originalFileName;
        link.download = `${baseName}_converted.${selectedFormat}`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const parseCSV = (csv) => {
        const lines = csv.trim().split(/\r\n|\n/);
        if (lines.length < 2) throw new Error("CSV must have at least a header and one data row.");
        const headers = lines[0].split(',').map(h => h.trim());
        return lines.slice(1).map(line => {
            const values = line.split(',');
            return headers.reduce((obj, header, index) => {
                obj[header] = values[index] ? values[index].trim() : '';
                return obj;
            }, {});
        });
    };

    const toCSV = (objArray) => {
        if (!Array.isArray(objArray) || objArray.length === 0) return '';
        const headers = Object.keys(objArray[0]);
        const csvRows = [headers.join(',')];
        for (const row of objArray) {
            const values = headers.map(header => {
                const escaped = ('' + row[header]).replace(/"/g, '""');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(','));
        }
        return csvRows.join('\r\n');
    };
}

// ==========================================
// PDF 변환 (PDF Converter)
// ==========================================
function setupPdfConverter() {
    // 각 서브 기능 초기화
    setupImgToPdf();
    setupPdfToImg();
    setupPdfToTxt();
}

function setupImgToPdf() {
    const dropZone = document.getElementById('img2pdf-drop-zone');
    const fileInput = document.getElementById('img2pdf-input');
    const listContainer = document.getElementById('img2pdf-list');
    const convertBtn = document.getElementById('img2pdf-btn');
    const pageBtns = document.querySelectorAll('#img2pdf-page-btns .format-btn');
    const orientBtns = document.querySelectorAll('#img2pdf-orient-btns .format-btn');

    let images = [], selectedPageSize = 'a4', selectedOrient = 'portrait';

    if (!dropZone) return;

    const handleFiles = (files) => {
        [...files].forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    images.push({ name: file.name, dataUrl: e.target.result });
                    renderList();
                };
                reader.readAsDataURL(file);
            }
        });
    };

    const renderList = () => {
        listContainer.style.display = images.length > 0 ? 'flex' : 'none';
        convertBtn.disabled = images.length === 0;
        listContainer.innerHTML = '';
        images.forEach((imgObj, index) => {
            const item = document.createElement('div');
            item.className = 'img-thumb-item';
            item.innerHTML = `<img src="${imgObj.dataUrl}" alt="${imgObj.name}"><span class="thumb-name">${imgObj.name}</span><button class="thumb-del-btn">✕</button>`;
            item.querySelector('.thumb-del-btn').onclick = () => {
                images.splice(index, 1);
                renderList();
            };
            listContainer.appendChild(item);
        });
    };

    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); };
    dropZone.ondragleave = (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); };
    dropZone.ondrop = (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); handleFiles(e.dataTransfer.files); };
    dropZone.onclick = () => fileInput.click();
    fileInput.onchange = (e) => { handleFiles(e.target.files); e.target.value = ''; };

    pageBtns.forEach(btn => btn.onclick = (e) => {
        pageBtns.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        selectedPageSize = e.currentTarget.dataset.page;
    });
    orientBtns.forEach(btn => btn.onclick = (e) => {
        orientBtns.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        selectedOrient = e.currentTarget.dataset.orient;
    });

    if (convertBtn) convertBtn.onclick = () => {
        if (images.length === 0 || typeof window.jspdf === 'undefined') return;
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: selectedOrient, format: selectedPageSize });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        images.forEach((imgObj, i) => {
            const img = new Image();
            img.src = imgObj.dataUrl;
            const imgRatio = img.width / img.height;
            const pdfRatio = pdfWidth / pdfHeight;
            let w, h;
            if (imgRatio > pdfRatio) { w = pdfWidth; h = pdfWidth / imgRatio; }
            else { h = pdfHeight; w = pdfHeight * imgRatio; }
            const x = (pdfWidth - w) / 2;
            const y = (pdfHeight - h) / 2;
            if (i > 0) pdf.addPage();
            pdf.addImage(img, 'JPEG', x, y, w, h);
        });
        pdf.save('converted_images.pdf');
    };
}

function setupPdfToImg() {
    const dropZone = document.getElementById('pdf2img-drop-zone');
    const fileInput = document.getElementById('pdf2img-input');
    const infoArea = document.getElementById('pdf2img-info');
    const nameSpan = document.getElementById('pdf2img-name');
    const pagesSpan = document.getElementById('pdf2img-pages');
    const convertBtn = document.getElementById('pdf2img-btn');
    const progressArea = document.getElementById('pdf2img-progress');
    const progFill = document.getElementById('pdf2img-prog-fill');
    const progText = document.getElementById('pdf2img-prog-text');
    const fmtBtns = document.querySelectorAll('#pdf2img-fmt-btns .format-btn');
    const scaleBtns = document.querySelectorAll('#pdf2img-scale-btns .format-btn');

    let currentPdfFile = null, selectedFmt = 'image/png', selectedScale = 1.5;

    if (!dropZone) return;

    const handlePdf = async (file) => {
        if (file.type !== 'application/pdf') return alert('PDF 파일만 가능합니다.');
        currentPdfFile = file;
        nameSpan.textContent = file.name;
        infoArea.style.display = 'flex';
        convertBtn.disabled = false;
        pagesSpan.textContent = '분석 중...';
        try {
            const typedarray = new Uint8Array(await file.arrayBuffer());
            const pdf = await pdfjsLib.getDocument(typedarray).promise;
            pagesSpan.textContent = `총 ${pdf.numPages}페이지`;
        } catch {
            pagesSpan.textContent = '읽기 오류';
        }
    };

    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); };
    dropZone.ondragleave = (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); };
    dropZone.ondrop = (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); handlePdf(e.dataTransfer.files[0]); };
    dropZone.onclick = () => fileInput.click();
    fileInput.onchange = (e) => { handlePdf(e.target.files[0]); e.target.value = ''; };

    fmtBtns.forEach(btn => btn.onclick = (e) => {
        fmtBtns.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        selectedFmt = e.currentTarget.dataset.fmt;
    });
    scaleBtns.forEach(btn => btn.onclick = (e) => {
        scaleBtns.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        selectedScale = parseFloat(e.currentTarget.dataset.scale);
    });

    if (convertBtn) convertBtn.onclick = async () => {
        if (!currentPdfFile || typeof pdfjsLib === 'undefined') return;
        convertBtn.disabled = true;
        progressArea.style.display = 'block';
        progFill.style.width = '0%';
        try {
            const pdf = await pdfjsLib.getDocument(await currentPdfFile.arrayBuffer()).promise;
            for (let i = 1; i <= pdf.numPages; i++) {
                progText.textContent = `변환 중... (${i} / ${pdf.numPages})`;
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: selectedScale });
                const canvas = document.createElement('canvas');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                const context = canvas.getContext('2d');
                await page.render({ canvasContext: context, viewport: viewport }).promise;
                const link = document.createElement('a');
                link.href = canvas.toDataURL(selectedFmt);
                link.download = `page_${i}.${selectedFmt.split('/')[1]}`;
                link.click();
                progFill.style.width = `${(i / pdf.numPages) * 100}%`;
                await new Promise(r => setTimeout(r, 200));
            }
            progText.textContent = '변환 완료!';
        } catch (err) {
            alert('PDF 변환 중 오류가 발생했습니다.');
        } finally {
            setTimeout(() => { progressArea.style.display = 'none'; convertBtn.disabled = false; }, 3000);
        }
    };
}

function setupPdfToTxt() {
    const dropZone = document.getElementById('pdf2txt-drop-zone');
    const fileInput = document.getElementById('pdf2txt-input');
    const infoArea = document.getElementById('pdf2txt-info');
    const nameSpan = document.getElementById('pdf2txt-name');
    const convertBtn = document.getElementById('pdf2txt-btn');
    const previewWrap = document.getElementById('pdf2txt-preview-wrap');
    const previewArea = document.getElementById('pdf2txt-preview');

    let currentPdfFile = null;

    if (!dropZone) return;

    const handlePdf = (file) => {
        if (file.type !== 'application/pdf') return alert('PDF 파일만 가능합니다.');
        currentPdfFile = file;
        nameSpan.textContent = file.name;
        infoArea.style.display = 'flex';
        convertBtn.disabled = false;
        previewWrap.style.display = 'none';
    };

    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); };
    dropZone.ondragleave = (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); };
    dropZone.ondrop = (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); handlePdf(e.dataTransfer.files[0]); };
    dropZone.onclick = () => fileInput.click();
    fileInput.onchange = (e) => { handlePdf(e.target.files[0]); e.target.value = ''; };

    if (convertBtn) convertBtn.onclick = async () => {
        if (!currentPdfFile || typeof pdfjsLib === 'undefined') return;
        convertBtn.disabled = true;
        convertBtn.textContent = '추출 중...';
        try {
            const pdf = await pdfjsLib.getDocument(await currentPdfFile.arrayBuffer()).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                fullText += textContent.items.map(item => item.str).join(' ') + '\n\n';
            }
            previewArea.textContent = fullText.substring(0, 1000) + (fullText.length > 1000 ? '...' : '');
            previewWrap.style.display = 'block';
            const blob = new Blob([fullText], { type: 'text/plain' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            const baseName = currentPdfFile.name.substring(0, currentPdfFile.name.lastIndexOf('.')) || currentPdfFile.name;
            link.download = `${baseName}_extracted.txt`;
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (err) {
            alert('텍스트 추출 중 오류가 발생했습니다. (이미지 기반 PDF는 지원되지 않습니다)');
        } finally {
            convertBtn.disabled = false;
            convertBtn.textContent = '⬇️ 텍스트 추출 및 다운로드';
        }
    };
}
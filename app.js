
// Basic multi-tool logic (client-side). Uses html2canvas, jsPDF, PDFLib CDN included in HTML.
(() => {
  const nav = document.getElementById('tools-nav');
  nav.addEventListener('click', e => {
    if (e.target.matches('button')) {
      [...nav.querySelectorAll('button')].forEach(b=>b.classList.remove('active'));
      e.target.classList.add('active');
      const tool = e.target.dataset.tool;
      document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
      document.getElementById(tool).classList.add('active');
    }
  });

  // ID Card Maker
  document.getElementById('id-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const form = ev.target;
    const name = form.name.value || '';
    const role = form.role.value || '';
    const idnum = form.idnum.value || '';
    const file = document.getElementById('id-photo').files[0];

    // build a small HTML card
    const card = document.createElement('div');
    card.style.width = '600px';
    card.style.padding = '20px';
    card.style.border = '1px solid #ddd';
    card.style.display = 'flex';
    card.style.gap = '20px';
    card.style.alignItems = 'center';
    card.style.background = '#fff';
    const img = document.createElement('img');
    img.style.width='140px'; img.style.height='160px'; img.style.objectFit='cover';
    if (file) img.src = URL.createObjectURL(file);
    else img.alt = 'Photo';
    const info = document.createElement('div');
    info.innerHTML = `<h2 style="margin:0">${name}</h2><p style="margin:4px 0">${role}</p><p style="margin:4px 0">ID: ${idnum}</p>`;
    card.appendChild(img); card.appendChild(info);

    const preview = document.getElementById('id-preview');
    preview.innerHTML=''; preview.appendChild(card);

    // Convert to PDF using html2canvas + jsPDF
    const canvas = await html2canvas(card, {scale:2});
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });
    pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${name || 'idcard'}.pdf`);
  });

  // Passport Photo Maker (35x45 mm) -> convert mm to px: use 300 DPI => mm*(300/25.4)
  document.getElementById('make-passport').addEventListener('click', async () => {
    const file = document.getElementById('passport-file').files[0];
    if (!file) return alert('Choose an image first');
    const bg = document.getElementById('passport-bg').value || '#fff';
    const img = await loadImage(file);
    const dpi = 300;
    const mmToPx = mm => Math.round(mm * dpi / 25.4);
    const w = mmToPx(35), h = mmToPx(45);
    const canvas = document.createElement('canvas'); canvas.width=w; canvas.height=h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle=bg; ctx.fillRect(0,0,w,h);
    // fit image center-cover
    const ratio = Math.max(w/img.width, h/img.height);
    const iw = img.width * ratio, ih = img.height * ratio;
    const ix = (w - iw)/2, iy = (h - ih)/2;
    ctx.drawImage(img, ix, iy, iw, ih);
    const data = canvas.toDataURL('image/jpeg', 0.95);
    downloadDataURL(data, 'passport_35x45.jpg');
    const pv = document.getElementById('passport-preview'); pv.innerHTML=''; const pimg=document.createElement('img'); pimg.src=data; pimg.style.maxWidth='200px'; pv.appendChild(pimg);
  });

  // Resize
  document.getElementById('do-resize').addEventListener('click', async () => {
    const f = document.getElementById('resize-file').files[0];
    if (!f) return alert('Choose image');
    const w = parseInt(document.getElementById('resize-w').value,10);
    const h = parseInt(document.getElementById('resize-h').value,10);
    const img = await loadImage(f);
    const canvas = document.createElement('canvas'); canvas.width=w; canvas.height=h;
    const ctx = canvas.getContext('2d'); ctx.drawImage(img,0,0,w,h);
    const data = canvas.toDataURL('image/jpeg',0.95);
    document.getElementById('resize-preview').innerHTML=''; const i=document.createElement('img'); i.src=data; i.style.maxWidth='300px'; document.getElementById('resize-preview').appendChild(i);
    downloadDataURL(data, `resized_${w}x${h}.jpg`);
  });

    // Photo -> PDF (multiple)
  document.getElementById('photos-to-pdf-go').addEventListener('click', async () => {
    const files = [...document.getElementById('photos-to-pdf').files];
    if (!files.length) return alert('Choose images');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit:'px' });
    for (let i=0;i<files.length;i++) {
      const img = await loadImage(files[i]);
      const canvas = document.createElement('canvas');
      const maxW = 800; const ratio = Math.min(maxW / img.width, 1);
      canvas.width = img.width * ratio; canvas.height = img.height * ratio;
      canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
      const data = canvas.toDataURL('image/jpeg',0.95);
      if (i>0) pdf.addPage();
      pdf.addImage(data,'JPEG',0,0,canvas.width,canvas.height);
    }
    pdf.save('photos.pdf');
  });

  // Merge PDFs using PDFLib
  document.getElementById('merge-pdfs-btn').addEventListener('click', async () => {
    const files = [...document.getElementById('pdf-merge-files').files];
    if (!files.length) return alert('Choose PDF files');
    const mergedPdf = await PDFLib.PDFDocument.create();
    for (const f of files) {
      const array = await f.arrayBuffer();
      const pdf = await PDFLib.PDFDocument.load(array);
      const copied = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copied.forEach(p => mergedPdf.addPage(p));
    }
    const bytes = await mergedPdf.save();
    const blob = new Blob([bytes], {type:'application/pdf'});
    const url = URL.createObjectURL(blob);
    downloadURL(url,'merged.pdf');
  });

  # (rest of code omitted for brevity in this recreation)


  // PDF -> Images (uses PDF.js and JSZip)
  document.getElementById('pdf2images-go').addEventListener('click', async () => {
    const file = document.getElementById('pdf2images-file').files[0];
    if (!file) return alert('Choose a PDF file first');
    const format = document.getElementById('pdf2images-format').value || 'image/jpeg';
    const array = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({data: array});
    const pdf = await loadingTask.promise;
    const zip = new JSZip();
    const preview = document.getElementById('pdf2images-preview');
    preview.innerHTML = '';
    for (let i=1;i<=pdf.numPages;i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({scale:2});
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width; canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      await page.render({canvasContext: ctx, viewport: viewport}).promise;
      const dataUrl = canvas.toDataURL(format, 0.95);
      const blob = dataURLtoBlob(dataUrl);
      zip.file(`page_${i}.${format.includes('png')?'png':'jpg'}`, blob);
      const img = document.createElement('img'); img.src = dataUrl; img.style.maxWidth='180px'; img.style.margin='6px';
      preview.appendChild(img);
    }
    const content = await zip.generateAsync({type:'blob'});
    const url = URL.createObjectURL(content);
    downloadURL(url, 'pdf_pages_images.zip');
  });

  // Split PDF into single-page PDFs and zip them (uses PDF-Lib + JSZip)
  document.getElementById('splitpdf-go').addEventListener('click', async () => {
    const file = document.getElementById('splitpdf-file').files[0];
    if (!file) return alert('Choose a PDF file first');
    const array = await file.arrayBuffer();
    const srcPdf = await PDFLib.PDFDocument.load(array);
    const zip = new JSZip();
    for (let i=0;i<srcPdf.getPageCount();i++) {
      const newPdf = await PDFLib.PDFDocument.create();
      const [copied] = await newPdf.copyPages(srcPdf, [i]);
      newPdf.addPage(copied);
      const bytes = await newPdf.save();
      zip.file(`page_${i+1}.pdf`, bytes);
    }
    const blob = await zip.generateAsync({type:'blob'});
    const url = URL.createObjectURL(blob);
    downloadURL(url, 'pdf_pages_split.zip');
    document.getElementById('splitpdf-preview').innerHTML = `<p>Created ${srcPdf.getPageCount()} files - downloading ZIP...</p>`;
  });

  // helper: convert dataURL to Blob
  function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]); let n = bstr.length; const u8arr = new Uint8Array(n);
    while(n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], {type:mime});
  }


import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Captures an HTML element as a high-resolution image and exports it
 * as a multi-page A4 PDF. Arabic RTL text is preserved via image capture.
 *
 * Elements with class .pdf-show are revealed during capture and restored after.
 *
 * @param element  - The DOM element to capture (use a React ref)
 * @param fileName - Output filename, e.g. 'pl-report-2026-01-01.pdf'
 * @param onStart  - Called before capture begins (set isExporting = true)
 * @param onEnd    - Called after save OR on error (set isExporting = false)
 */
export async function exportToPDF(
  element: HTMLElement,
  fileName: string,
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> {
  const pdfShowEls: HTMLElement[] = [];
  onStart?.();
  try {
    // Reveal print-only elements before capture
    element.querySelectorAll<HTMLElement>('.pdf-show').forEach((el) => {
      pdfShowEls.push(el);
      el.style.setProperty('display', 'block', 'important');
    });

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Restore immediately after capture (before PDF build)
    pdfShowEls.forEach((el) => el.style.removeProperty('display'));

    const imgData    = canvas.toDataURL('image/png');
    const pdf        = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const imgWidth   = 210;   // A4 width in mm
    const pageHeight = 297;   // A4 height in mm
    const imgHeight  = (canvas.height * imgWidth) / canvas.width;
    let heightLeft   = imgHeight;
    let position     = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Add centered page numbers before saving
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184);  // #94A3B8
      pdf.text(`${i} / ${totalPages}`, 105, 291, { align: 'center' });
    }

    pdf.save(fileName);
  } finally {
    // Safety restore — runs even if error occurs before explicit restore above
    pdfShowEls.forEach((el) => el.style.removeProperty('display'));
    onEnd?.();
  }
}

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Captures an HTML element as a high-resolution image and exports it
 * as a multi-page A4 PDF. Arabic RTL text is preserved via image capture.
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
  onStart?.();
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

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

    pdf.save(fileName);
  } finally {
    onEnd?.();
  }
}

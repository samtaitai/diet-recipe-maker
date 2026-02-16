import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates a PDF from a DOM element using html2canvas and jsPDF.
 * Optimized for A4 proportions and high-fidelity "Wellness Journal" styling.
 * 
 * @param {string} elementId - The ID of the DOM element to capture.
 * @param {string} fileName - The name of the file to save.
 */
export const generateRecipePDF = async (elementId, fileName = 'recipe.pdf') => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with id ${elementId} not found.`);
        return;
    }

    try {
        // 1. Capture the element with high scale for clarity
        const canvas = await html2canvas(element, {
            scale: 2, // High resolution
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 794, // 210mm at 96 DPI
        });

        const imgData = canvas.toDataURL('image/png');

        // 2. Initialize jsPDF (A4 format)
        // A4 dimensions: 210mm x 297mm
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        // 3. Handle multi-page if height exceeds A4
        const pageHeight = pdf.internal.pageSize.getHeight();
        let heightLeft = pdfHeight;
        let position = 0;

        // First page
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;

        // Additional pages if needed
        while (heightLeft >= 0) {
            position = heightLeft - pdfHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;
        }

        // 4. Save the PDF
        pdf.save(fileName);

        return true;
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
};

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
            windowWidth: 680, // ~180mm at 96 DPI
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
        const margin = 15; // 15mm margin
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const contentWidth = pageWidth - (margin * 2);
        const contentHeightPerPage = pageHeight - (margin * 2);

        // Calculate total PDF height based on image aspect ratio
        const totalPdfHeight = (imgProps.height * contentWidth) / imgProps.width;

        let heightLeft = totalPdfHeight;
        let position = margin; // Start position for the first page

        // Helper to draw masks and border (optional for style)
        const drawPageMasks = () => {
            pdf.setFillColor(255, 255, 255);
            // Top Mask
            pdf.rect(0, 0, pageWidth, margin, 'F');
            // Bottom Mask
            pdf.rect(0, pageHeight - margin, pageWidth, margin, 'F');
        };

        // First page
        pdf.addImage(imgData, 'PNG', margin, position, contentWidth, totalPdfHeight);
        drawPageMasks();
        heightLeft -= contentHeightPerPage;

        // Additional pages if needed
        while (heightLeft > 0) {
            position = margin - (totalPdfHeight - heightLeft);
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', margin, position, contentWidth, totalPdfHeight);
            drawPageMasks();
            heightLeft -= contentHeightPerPage;
        }

        // 4. Save the PDF
        pdf.save(fileName);

        return true;
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
};

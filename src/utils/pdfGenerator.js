import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generate and download a PDF from the itinerary data
 * @param {Object} itinerary - The itinerary data object
 * @param {string} filename - The filename for the downloaded PDF
 */
export const generateItineraryPDF = async (itinerary, filename = 'itinerary.pdf') => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // Helper function to check if we need a new page
  const checkPageBreak = (requiredSpace) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper function to add text with wrapping
  const addWrappedText = (text, x, maxWidth, fontSize = 10, style = 'normal') => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', style);
    const lines = pdf.splitTextToSize(text, maxWidth);
    lines.forEach((line, index) => {
      if (index > 0) {
        checkPageBreak(5);
        yPosition += 5;
      }
      pdf.text(line, x, yPosition);
      if (index < lines.length - 1) {
        yPosition += 5;
      }
    });
    return lines.length * 5; // Return height used
  };

  // Title
  pdf.setFillColor(102, 126, 234);
  pdf.rect(0, 0, pageWidth, 40, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Travel Itinerary', pageWidth / 2, 15, { align: 'center' });

  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'normal');
  pdf.text(itinerary.destination, pageWidth / 2, 25, { align: 'center' });

  pdf.setFontSize(12);
  const dateRange = `${new Date(itinerary.startDate).toLocaleDateString()} - ${new Date(itinerary.endDate).toLocaleDateString()}`;
  pdf.text(dateRange, pageWidth / 2, 33, { align: 'center' });

  yPosition = 50;
  pdf.setTextColor(0, 0, 0);

  // Travel Summary Section
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(102, 126, 234);
  pdf.text('Travel Summary', margin, yPosition);
  yPosition += 10;

  // Flight Details
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('Flight Details', margin, yPosition);
  yPosition += 7;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(`Airline: ${itinerary.flight.airline}`, margin + 5, yPosition);
  yPosition += 5;
  pdf.text(`Flight: ${itinerary.flight.flightNumber}`, margin + 5, yPosition);
  yPosition += 5;
  pdf.text(`Departure: ${itinerary.flight.departure}`, margin + 5, yPosition);
  yPosition += 5;
  pdf.text(`Arrival: ${itinerary.flight.arrival}`, margin + 5, yPosition);
  yPosition += 5;
  pdf.setTextColor(102, 126, 234);
  pdf.text(`Price: $${itinerary.flight.price}`, margin + 5, yPosition);
  yPosition += 10;

  // Accommodation Details
  checkPageBreak(30);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('Accommodation', margin, yPosition);
  yPosition += 7;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(`Hotel: ${itinerary.hotel.name}`, margin + 5, yPosition);
  yPosition += 5;
  pdf.text(`Rating: ${itinerary.hotel.stars} Stars (${itinerary.hotel.rating}/5)`, margin + 5, yPosition);
  yPosition += 5;
  pdf.text(`Location: ${itinerary.hotel.distance}`, margin + 5, yPosition);
  yPosition += 5;
  pdf.setTextColor(102, 126, 234);
  pdf.text(`Price: $${itinerary.hotel.pricePerNight} per night`, margin + 5, yPosition);
  yPosition += 10;

  // Total Cost
  checkPageBreak(20);
  pdf.setFillColor(240, 240, 255);
  pdf.rect(margin, yPosition - 5, pageWidth - (margin * 2), 15, 'F');
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(102, 126, 234);
  pdf.text('Total Estimated Cost:', margin + 5, yPosition + 3);
  pdf.text(`$${itinerary.totalCost}`, pageWidth - margin - 5, yPosition + 3, { align: 'right' });
  yPosition += 20;

  // Daily Schedule
  checkPageBreak(20);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(102, 126, 234);
  pdf.text('Daily Schedule', margin, yPosition);
  yPosition += 10;

  // Iterate through daily plans
  itinerary.dailyPlans.forEach((day) => {
    checkPageBreak(25);

    // Day header
    pdf.setFillColor(102, 126, 234);
    pdf.rect(margin, yPosition - 4, pageWidth - (margin * 2), 10, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Day ${day.day}: ${day.title}`, margin + 3, yPosition + 2);
    yPosition += 12;

    pdf.setTextColor(0, 0, 0);

    // Activities
    day.activities.forEach((activity, index) => {
      checkPageBreak(25);

      // Time
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(102, 126, 234);
      pdf.text(activity.time, margin + 5, yPosition);

      // Activity type badge
      const activityLabels = {
        accommodation: '[HOTEL]',
        dining: '[DINING]',
        sightseeing: '[SIGHTSEEING]',
        activity: '[ACTIVITY]',
        transport: '[TRANSPORT]'
      };
      const label = activityLabels[activity.type] || '[EVENT]';
      pdf.setFontSize(8);
      pdf.setTextColor(102, 126, 234);
      pdf.text(label, margin + 35, yPosition);

      yPosition += 5;

      // Activity name
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      addWrappedText(activity.activity, margin + 5, pageWidth - margin * 2 - 5, 10, 'bold');
      yPosition += 5;

      // Description
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(60, 60, 60);
      addWrappedText(activity.description, margin + 5, pageWidth - margin * 2 - 5, 9, 'normal');
      yPosition += 5;

      // Add separator line except for last activity
      if (index < day.activities.length - 1) {
        pdf.setDrawColor(220, 220, 220);
        pdf.line(margin + 5, yPosition, pageWidth - margin - 5, yPosition);
        yPosition += 5;
      }
    });

    yPosition += 5;
  });

  // Travel Tips
  if (yPosition > pageHeight - 60) {
    pdf.addPage();
    yPosition = margin;
  }

  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(102, 126, 234);
  pdf.text('Travel Tips', margin, yPosition);
  yPosition += 8;

  const tips = [
    { bullet: '*', title: 'Best Time to Visit', text: 'Consider local weather and peak tourist seasons when planning activities' },
    { bullet: '*', title: 'Local Cuisine', text: 'Don\'t miss trying authentic local dishes and visiting popular food markets' },
    { bullet: '*', title: 'Book in Advance', text: 'Popular attractions may require advance booking - check online' },
    { bullet: '*', title: 'Transportation', text: 'Research local public transport options or consider ride-sharing apps' }
  ];

  tips.forEach((tip) => {
    checkPageBreak(18);

    // Bullet and title
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(102, 126, 234);
    pdf.text(tip.bullet, margin + 5, yPosition);

    pdf.setTextColor(0, 0, 0);
    pdf.text(tip.title, margin + 10, yPosition);
    yPosition += 6;

    // Tip text
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(60, 60, 60);
    addWrappedText(tip.text, margin + 10, pageWidth - margin * 2 - 10, 9, 'normal');
    yPosition += 8;
  });

  // Footer
  const totalPages = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Generated by Touri - ${new Date().toLocaleDateString()} | Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );
  }

  // Save the PDF
  pdf.save(filename);
};

/**
 * Alternative method: Generate PDF from HTML element (more accurate visual representation)
 * @param {HTMLElement} element - The DOM element to convert to PDF
 * @param {string} filename - The filename for the downloaded PDF
 */
export const generatePDFFromElement = async (element, filename = 'itinerary.pdf') => {
  try {
    // Create canvas from the element
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth - 20; // 10mm margin on each side
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10; // Start with 10mm margin from top

    // Add first page
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if content is longer than one page
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 10;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

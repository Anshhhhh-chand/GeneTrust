import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { PredictionResult } from '../types';

export const exportToPDF = (result: PredictionResult) => {
  const doc = new jsPDF();

  doc.setFontSize(22);
  doc.setTextColor(59, 130, 246);
  doc.text('GeneTrust Research Report', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
  doc.setLineWidth(0.5);
  doc.line(14, 32, 196, 32);

  doc.setFontSize(14);
  doc.setTextColor(20);
  doc.text('Analysis Summary', 14, 45);

  autoTable(doc, {
    startY: 50,
    head: [['Metric', 'Value']],
    body: [
      ['Original Efficiency', `${result.originalEfficiency}%`],
      ['Optimized Efficiency', `${result.efficiency}%`],
      ['Efficiency Gain', `+${result.efficiency - result.originalEfficiency}%`],
      ['GC Content', `${result.gcContent}%`],
      ['Melting Temp (Tm)', `${result.meltingTemp ?? 'N/A'} °C`],
      ['Molecular Weight', `${result.molecularWeight ?? 'N/A'} g/mol`],
      ['Mutation Target', `Position ${result.changedPosition} (${result.originalBase} -> ${result.newBase})`]
    ],
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 100;

  doc.setFontSize(14);
  doc.setTextColor(20);
  doc.text('Sequence Optimization', 14, finalY + 15);

  autoTable(doc, {
    startY: finalY + 20,
    head: [['Type', 'Sequence']],
    body: [
      ['Original Sequence', result.originalSequence],
      ['Optimized Sequence', result.editedSequence]
    ],
    theme: 'plain',
    styles: { font: 'courier', fontSize: 11, cellPadding: 5 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] }
  });

  const finalY2 = (doc as any).lastAutoTable.finalY || 150;

  doc.setFontSize(14);
  doc.setTextColor(20);
  doc.text('AI Decision Explainability', 14, finalY2 + 15);

  doc.setFontSize(11);
  doc.setTextColor(60);
  const splitText = doc.splitTextToSize(result.explanation || 'The current sequence was analyzed against highly optimized reference targets to determine the best single-point mutation.', 180);
  doc.text(splitText, 14, finalY2 + 25);

  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text('Powered by DNABERT-2 AI Engine | GeneTrust Analysis System', 14, 280);

  doc.save(`genetrust_report_${Date.now()}.pdf`);
};

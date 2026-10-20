import { jsPDF } from 'jspdf'
import { formatCurrency } from '../../utils/format'

export function exportMonthlyPdf({ period, summary, byCategory }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 48
  let y = 64

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('ConektaFinance — Relatório financeiro', margin, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(120)
  y += 20
  doc.text(`Período: ${period.label}`, margin, y)
  y += 32

  const kpis = [
    ['Entradas', formatCurrency(summary.totalIncome)],
    ['Saídas', formatCurrency(summary.totalExpense)],
    ['Saldo', formatCurrency(summary.balance)],
    ['Taxa de poupança', summary.savingsRate != null ? `${String(summary.savingsRate).replace('.', ',')}%` : '—'],
    ['Média mensal de gastos', formatCurrency(summary.averageMonthlyExpense)],
  ]
  doc.setTextColor(0)
  kpis.forEach(([label, value]) => {
    doc.setFontSize(10)
    doc.setTextColor(110)
    doc.text(label.toUpperCase(), margin, y)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(0)
    doc.text(value, margin + 190, y)
    doc.setFont('helvetica', 'normal')
    y += 24
  })

  y += 16
  doc.setDrawColor(220)
  doc.line(margin, y, pageWidth - margin, y)
  y += 28

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Gastos por categoria', margin, y)
  y += 22

  doc.setFontSize(10)
  byCategory.slice(0, 14).forEach((category) => {
    if (y > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage()
      y = 64
    }
    const label = `${category.name}`
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60)
    doc.text(label, margin, y)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0)
    doc.text(
      `${formatCurrency(category.total)}  (${String(category.percentage).replace('.', ',')}%)`,
      pageWidth - margin,
      y,
      { align: 'right' },
    )
    doc.setFillColor(200, 210, 225)
    const barWidth = (pageWidth - margin * 2) * (category.percentage / 100)
    doc.rect(margin, y + 4, pageWidth - margin * 2, 4, 'F')
    doc.setFillColor(0, 112, 243)
    doc.rect(margin, y + 4, Math.max(2, barWidth), 4, 'F')
    y += 26
  })

  doc.save(`relatorio-conekta-${period.key}.pdf`)
}

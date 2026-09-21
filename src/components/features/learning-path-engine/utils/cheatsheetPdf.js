/**
 * Build and download a PDF of the lesson cheat sheet (client-side).
 * Returns a Promise so the UI can show a brief busy state.
 */
export async function downloadCheatsheetPdf(cheatsheet, lessonTitle = "") {
  if (typeof window === "undefined" || !cheatsheet) return;

  const { jsPDF } = await import("jspdf");

  const title = String(cheatsheet.title || lessonTitle || "Chapter reference sheet").trim();
  const headline = String(cheatsheet.headline || "").trim();
  const sections = Array.isArray(cheatsheet.sections) ? cheatsheet.sections : [];
  const terms = Array.isArray(cheatsheet.terms) ? cheatsheet.terms : [];

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 48;
  const marginTop = 52;
  const marginBottom = 48;
  const contentWidth = pageWidth - marginX * 2;
  let y = marginTop;

  function ensureSpace(needed) {
    if (y + needed <= pageHeight - marginBottom) return;
    doc.addPage();
    y = marginTop;
  }

  function writeWrapped(text, { fontSize = 11, fontStyle = "normal", color = [33, 37, 41], gap = 6 } = {}) {
    const safe = sanitizePdfText(text);
    if (!safe) return;
    doc.setFont("helvetica", fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(safe, contentWidth);
    const lineHeight = fontSize * 1.35;
    ensureSpace(lines.length * lineHeight + gap);
    doc.text(lines, marginX, y);
    y += lines.length * lineHeight + gap;
  }

  writeWrapped(title, { fontSize: 18, fontStyle: "bold", color: [15, 23, 42], gap: 8 });
  if (headline) {
    writeWrapped(headline, { fontSize: 11, color: [71, 85, 105], gap: 14 });
  }

  for (const section of sections) {
    const heading = String(section?.heading || "").trim();
    const bullets = Array.isArray(section?.bullets) ? section.bullets : [];
    ensureSpace(28);
    writeWrapped(heading, { fontSize: 13, fontStyle: "bold", color: [0, 134, 184], gap: 6 });
    for (const bullet of bullets) {
      writeWrapped(`• ${String(bullet || "").trim()}`, {
        fontSize: 11,
        color: [33, 37, 41],
        gap: 4,
      });
    }
    y += 8;
  }

  if (terms.length) {
    ensureSpace(28);
    writeWrapped("Key terms", {
      fontSize: 13,
      fontStyle: "bold",
      color: [0, 134, 184],
      gap: 8,
    });
    for (const item of terms) {
      const term = String(item?.term || "").trim();
      const definition = String(item?.definition || "").trim();
      if (!term && !definition) continue;
      writeWrapped(term, { fontSize: 11, fontStyle: "bold", color: [33, 37, 41], gap: 2 });
      writeWrapped(definition, { fontSize: 10, color: [51, 65, 85], gap: 8 });
    }
  }

  ensureSpace(24);
  writeWrapped("SCI-PATH · reference sheet", {
    fontSize: 9,
    color: [148, 163, 184],
    gap: 0,
  });

  doc.save(`${slugifyFilename(title)}-reference-sheet.pdf`);
}

/** jsPDF Helvetica is WinAnsi — strip / replace chars it cannot encode. */
function sanitizePdfText(value) {
  return String(value || "")
    .replace(/\u2022/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "?");
}

function slugifyFilename(value) {
  const slug = String(value || "cheat-sheet")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "cheat-sheet";
}

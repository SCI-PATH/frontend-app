/**
 * Open browser print dialog so the student can save the cheat sheet as PDF.
 */
export function downloadCheatsheetPdf(cheatsheet, lessonTitle = "") {
  if (typeof window === "undefined" || !cheatsheet) return;

  const title = cheatsheet.title || lessonTitle || "Chapter cheat sheet";
  const headline = cheatsheet.headline || "";
  const sections = Array.isArray(cheatsheet.sections) ? cheatsheet.sections : [];
  const terms = Array.isArray(cheatsheet.terms) ? cheatsheet.terms : [];

  const sectionHtml = sections
    .map(
      (sec) => `
      <section class="section">
        <h2>${escapeHtml(sec.heading || "")}</h2>
        <ul>${(sec.bullets || [])
          .map((b) => `<li>${escapeHtml(b)}</li>`)
          .join("")}</ul>
      </section>`,
    )
    .join("");

  const termsHtml = terms.length
    ? `<section class="section terms">
        <h2>Key terms</h2>
        <dl>${terms
          .map(
            (t) =>
              `<dt>${escapeHtml(t.term || "")}</dt><dd>${escapeHtml(t.definition || "")}</dd>`,
          )
          .join("")}</dl>
      </section>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)} — Cheat sheet</title>
  <style>
    body { font-family: Georgia, "Times New Roman", serif; color: #1e293b; margin: 2rem; line-height: 1.45; }
    h1 { font-size: 1.5rem; margin: 0 0 0.35rem; color: #0f172a; }
    .headline { font-size: 1rem; color: #475569; margin: 0 0 1.25rem; }
    .section { margin-bottom: 1.1rem; page-break-inside: avoid; }
    h2 { font-size: 1rem; margin: 0 0 0.35rem; color: #0086b8; }
    ul { margin: 0; padding-left: 1.2rem; }
    li { margin: 0.2rem 0; font-size: 0.92rem; }
    dl { margin: 0; }
    dt { font-weight: 700; margin-top: 0.45rem; font-size: 0.92rem; }
    dd { margin: 0.1rem 0 0 0; color: #334155; font-size: 0.88rem; }
    footer { margin-top: 1.5rem; font-size: 0.75rem; color: #94a3b8; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${headline ? `<p class="headline">${escapeHtml(headline)}</p>` : ""}
  ${sectionHtml}
  ${termsHtml}
  <footer>SCI-PATH · revision cheat sheet</footer>
</body>
</html>`;

  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => {
    printWindow.print();
  };
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

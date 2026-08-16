import type { Lang } from "./i18n";

export type ExportFormat = "docx" | "pdf" | "md";

export type Manuscript = {
  title: string;
  genre: string;
  language: Lang;
  chapterTitles: string[];
  chapterBodies: string[];
};

const slug = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "") || "manuscript";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function toMarkdown(m: Manuscript) {
  const parts = [`# ${m.title}`, `*${m.genre}*`, ""];
  m.chapterTitles.forEach((ct, i) => {
    parts.push(`## ${i + 1}. ${ct}`, "", (m.chapterBodies[i] ?? "").trim(), "");
  });
  return parts.join("\n");
}

export async function exportManuscript(m: Manuscript, format: ExportFormat) {
  const name = slug(m.title);

  if (format === "md") {
    download(new Blob([toMarkdown(m)], { type: "text/markdown;charset=utf-8" }), `${name}.md`);
    return;
  }

  if (format === "docx") {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak } =
      await import("docx");
    const children: InstanceType<typeof Paragraph>[] = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.TITLE,
        children: [new TextRun({ text: m.title, bold: true, size: 48 })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: m.genre, italics: true, size: 24 })],
      }),
    ];
    m.chapterTitles.forEach((ct, i) => {
      children.push(new Paragraph({ children: [new PageBreak()] }));
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: `${i + 1}. ${ct}`, bold: true, size: 32 })],
        }),
      );
      (m.chapterBodies[i] ?? "").split("\n\n").forEach((p) => {
        children.push(
          new Paragraph({
            spacing: { after: 200, line: 320 },
            bidirectional: m.language === "ar",
            children: [new TextRun({ text: p.trim(), size: 24 })],
          }),
        );
      });
    });

    const doc = new Document({
      styles: { default: { document: { run: { font: "Georgia", size: 24 } } } },
      sections: [
        {
          properties: {
            page: {
              size: { width: 12240, height: 15840 },
              margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            },
          },
          children,
        },
      ],
    });
    download(await Packer.toBlob(doc), `${name}.docx`);
    return;
  }

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const width = doc.internal.pageSize.getWidth();
  const margin = 72;
  const maxWidth = width - margin * 2;
  const bottom = doc.internal.pageSize.getHeight() - margin;

  doc.setFont("times", "bold");
  doc.setFontSize(26);
  doc.text(doc.splitTextToSize(m.title, maxWidth), width / 2, 220, { align: "center" });
  doc.setFont("times", "italic");
  doc.setFontSize(13);
  doc.text(m.genre, width / 2, 260, { align: "center" });

  m.chapterTitles.forEach((ct, i) => {
    doc.addPage();
    let y = margin;
    doc.setFont("times", "bold");
    doc.setFontSize(17);
    const head = doc.splitTextToSize(`${i + 1}. ${ct}`, maxWidth);
    doc.text(head, margin, y);
    y += head.length * 22 + 14;
    doc.setFont("times", "normal");
    doc.setFontSize(12);
    (m.chapterBodies[i] ?? "").split("\n\n").forEach((p) => {
      const lines = doc.splitTextToSize(p.trim(), maxWidth);
      lines.forEach((line: string) => {
        if (y > bottom) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 17;
      });
      y += 10;
    });
  });

  download(doc.output("blob"), `${name}.pdf`);
}

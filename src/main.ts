//import { pdfRun } from "./pdf.js";
import { __dirname, __filename } from "./globals.js";
import { parseCSV } from "./csv.js";
import { buildPDF } from "./pdf.js";

async function main() {

  try {
    const csv = await parseCSV();
    await buildPDF(csv)
  } catch (err) {
    console.error(err)
  }

}

main()

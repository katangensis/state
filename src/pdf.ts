// Load our library that generates the document
import Docxtemplater from "docxtemplater";
// Load PizZip library to load the docx/pptx/xlsx file in memory
import PizZip from "pizzip";

import open from 'open';
import mammoth from "mammoth";
import PuppeteerHTMLPDF from "puppeteer-html-pdf";


// Builtin file system utilities
import fs from "fs";
import path from "path";
import { __dirname, __filename } from "./globals.js";
import { StatementRow } from "./csv.js";


export async function buildPDF(statements: StatementRow[]): Promise<void> {

  console.log("Loading doc...")

  // Load the docx file as binary content
  const content = fs.readFileSync(
    path.resolve(__dirname, "../../document_templates/receipt_v1.docx"),
    "binary"
  );

  console.log("Unziping doc file...")

  // Unzip the content of the file
  const zip = new PizZip(content);

  console.log("Parsing template...")

  // Parse the template.
  // This function throws an error if the template is invalid,
  // for example, if the template is "Hello {user" (missing closing tag)
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  console.log("Rendering doc...")

  type StatementItems = {
    date: string;
    vendor: string;
    description: string;
    dates: string;
    amount: string;
  }
  const statementItems: StatementItems[] = statements.map(x => {
    return {
      date: x["Post Date"],
      vendor: x["Transaction Type"],
      description: x.Description,
      dates: x["Transaction Date"],
      amount: x["Source Amount"]
    }
  })
  // Render the document : Replaces :
  // - {first_name} with John
  // - {last_name} with Doe,
  // ...
  doc.render({
    first_name: "John",
    last_name: "Doe",
    account_number: "10329042",
    invoice_number: "00000493",
    subtotal: "100.00",
    total: "200.00",
    date_range: "10/1/24 - 10/31/23",
    items: [
      ...statementItems,
      /*{
      date: "10/5",
      vendor: "Comcast",
      description: "TV",
      dates: "9/1-10/5",
      amount: "75.00"
    },*/
    ]
  });

  console.log("Getting doc as zip...")

  // Get the document as a zip (docx are zipped files)
  // and generate it as a Node.js buffer
  const buf = doc.getZip().generate({
    type: "nodebuffer",
    // Compression: DEFLATE adds a compression step.
    // For a 50MB document, expect 500ms additional CPU time.
    compression: "DEFLATE",
  });

  console.log("Writing output file...")


  const docxOutputFilePath = path.resolve(__dirname, "../../output.docx")
  fs.writeFileSync(docxOutputFilePath, buf);
  await open(docxOutputFilePath);
  console.log('docX generated successfully');


  console.log("Converting docx to html....")
  const htmlResult = await mammoth.convertToHtml({ buffer: buf }, {})

  console.log("HTML conversion errors: ", htmlResult.messages)

  const textContent = htmlResult.value
  const outputFilePath = path.resolve(__dirname, "../../output.pdf")

  // https://stackoverflow.com/questions/47122579/run-puppeteer-on-already-installed-chrome-on-macos
  const htmlPDF = new PuppeteerHTMLPDF();
  htmlPDF.setOptions({ format: "A4", executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });

  try {
    const pdfBuffer = await htmlPDF.create(textContent);
    await htmlPDF.writeFile(pdfBuffer, outputFilePath);

    console.log('PDF generated successfully');

    await open(outputFilePath);

  } catch (error) {
    console.log("PuppeteerHTMLPDF error", error);
  }

}

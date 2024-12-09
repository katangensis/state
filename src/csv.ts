//import { pdfRun } from "./pdf.js";
import path from "path";
import * as fs from 'fs';
import { parseStream, parse } from 'fast-csv';
import { __dirname, __filename } from "./globals.js";
import { z } from "zod";


function removeSurroundingQuotes(str: string): string {
  // we're remove the straight double quotes, curly double quotes, and single quotes
  return str.trim().replace(/^[“”"']|[“”"']$/g, '');
}

const StatementRow = z.object({
  'Transaction Type': z.string().transform(removeSurroundingQuotes).catch("ERROR_PARSING"),
  'Account Number': z.coerce.string().transform(removeSurroundingQuotes).catch("ERROR_PARSING"),
  'Account Name': z.coerce.string().transform(removeSurroundingQuotes).catch("ERROR_PARSING"),
  'Transaction Date': z.coerce.string().transform(removeSurroundingQuotes).catch("ERROR_PARSING"),
  'Post Date': z.coerce.string().transform(removeSurroundingQuotes).catch("ERROR_PARSING"),
  'Reference Number': z.coerce.string().transform(removeSurroundingQuotes).catch("ERROR_PARSING"),
  'Description': z.coerce.string().transform(removeSurroundingQuotes).catch("ERROR_PARSING"),
  'Billing Amount': z.coerce.string().transform(removeSurroundingQuotes).catch("ERROR_PARSING"),
  'Source Currency': z.string().transform(removeSurroundingQuotes).catch("ERROR_PARSING"),
  'Source Amount': z.coerce.string().transform(removeSurroundingQuotes).catch("ERROR_PARSING"),
  'Employee Number': z.coerce.string().min(1).transform(removeSurroundingQuotes).catch("ERROR_PARSING"),
});

export type StatementRow = z.infer<typeof StatementRow>;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export async function parseCSV(): Promise<StatementRow[]> {
  return new Promise((resolve, reject) => {
    const csvPath = path.resolve(__dirname, "../../data.csv")

    const stream = fs.createReadStream(csvPath);

    const queue = []

    fs.createReadStream(csvPath)
      .pipe(parse())

    parseStream<StatementRow, StatementRow>(stream, { headers: true, })
      //.validate((data: StatementRow): boolean => StatementRow.safeParse(data).success)
      .on('error', error => {
        reject(error)
      })
      .on('data', row => {
        queue.push(row)
        //console.log(row)
      })
      .on('end', (rowCount: number) => {

        console.log(`Parsed ${rowCount} rows`)

        const result: StatementRow[] = []

        let errorOccured = false;
        for (const x of queue) {
          const { data, error } = StatementRow.safeParse(x)
          if (error) {
            console.log("Error! ", error)
            errorOccured = true;
            reject(error)
            break;
          }
          result.push(data)
        }
        if (!errorOccured) {
          console.log('Result: ', result)
          resolve(result)
        }
      });

  });
}


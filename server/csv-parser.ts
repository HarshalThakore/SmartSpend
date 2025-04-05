// server/csv-parser.ts
import fs from 'fs';
import csv from 'csv-parser';
import { InsertTransaction } from '@shared/schema';
import path from 'path';
interface CSVTransactionRow {
  description: string;
  amount: string;
  type: string;
  date: string;
  notes?: string;
  category?: string;
}
/**
 * Parse a CSV file from a file path
 * @param filePath - Path to the CSV file
 * @returns Promise that resolves to an array of transactions
 */
export function parseCSVFile(filePath: string): Promise<Partial<InsertTransaction>[]> {
  return new Promise((resolve, reject) => {
    const results: Partial<InsertTransaction>[] = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data: CSVTransactionRow) => {
        const transaction = mapCSVRowToTransaction(data);
        if (transaction) {
          results.push(transaction);
        }
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error: Error) => {
        reject(error);
      });
  });
}
/**
 * Parse a CSV file from a buffer
 * @param buffer - Buffer containing CSV data
 * @returns Promise that resolves to an array of transactions
 */
export function parseCSVBuffer(buffer: Buffer): Promise<Partial<InsertTransaction>[]> {
  // Create a temporary file
  const tempFilePath = path.join('./data/csv', `temp-${Date.now()}.csv`);

  return new Promise((resolve, reject) => {
    // Write buffer to file
    fs.writeFile(tempFilePath, buffer, (err) => {
      if (err) return reject(err);

      // Parse the file
      parseCSVFile(tempFilePath)
        .then(results => {
          // Clean up temp file
          fs.unlink(tempFilePath, () => {});
          resolve(results);
        })
        .catch(error => {
          // Clean up temp file
          fs.unlink(tempFilePath, () => {});
          reject(error);
        });
    });
  });
}
/**
 * Maps a CSV row to a transaction object
 * @param row - CSV row data
 * @returns Transaction object or null if invalid
 */
function mapCSVRowToTransaction(row: CSVTransactionRow): Partial<InsertTransaction> | null {
  try {
    // Validate required fields
    if (!row.description || !row.amount || !row.type || !row.date) {
      console.warn('Skipping row due to missing required fields', row);
      return null;
    }

    // Validate amount
    const amount = parseFloat(row.amount);
    if (isNaN(amount) || amount <= 0) {
      console.warn('Skipping row due to invalid amount', row);
      return null;
    }

    // Validate type
    const type = row.type.toLowerCase();
    if (type !== 'income' && type !== 'expense') {
      console.warn('Skipping row due to invalid type', row);
      return null;
    }

    // Parse date
    let date: Date;
    try {
      date = new Date(row.date);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
    } catch (error) {
      console.warn('Skipping row due to invalid date format', row);
      return null;
    }

    // Create transaction object
    return {
      description: row.description,
      amount,
      type: type as 'income' | 'expense',
      date,
      notes: row.notes || null,
      // Category will be matched later in the upload process
    };
  } catch (error) {
    console.error('Error parsing CSV row:', error);
    return null;
  }
}
/**
 * Ensures the CSV upload directory exists
 */
export function ensureCsvDirectoryExists(): void {
  const csvUploadDir = './data/csv';
  try {
    if (!fs.existsSync(csvUploadDir)) {
      fs.mkdirSync(csvUploadDir, { recursive: true });
    }
  } catch (error) {
    console.error(`Error ensuring CSV directory exists: ${error}`);
  }
}
/**
 * Cleans up old temporary CSV files
 * @param maxAgeInHours - Maximum age of files to keep (defaults to 24 hours)
 */
export function cleanupTempCsvFiles(maxAgeInHours = 24): void {
  const csvUploadDir = './data/csv';
  const now = Date.now();
  const maxAge = maxAgeInHours * 60 * 60 * 1000; // Convert hours to milliseconds

  try {
    fs.readdir(csvUploadDir, (err, files) => {
      if (err) {
        console.error('Error reading CSV directory:', err);
        return;
      }

      // Find temp files older than maxAge
      files.forEach(file => {
        if (file.startsWith('temp-')) {
          const filePath = path.join(csvUploadDir, file);
          fs.stat(filePath, (statErr, stats) => {
            if (statErr) {
              console.error(`Error getting stats for ${file}:`, statErr);
              return;
            }

            const fileAge = now - stats.mtime.getTime();
            if (fileAge > maxAge) {
              fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) {
                  console.error(`Error deleting ${file}:`, unlinkErr);
                } else {
                  console.log(`Deleted old temp file: ${file}`);
                }
              });
            }
          });
        }
      });
    });
  } catch (error) {
    console.error('Error cleaning up temp CSV files:', error);
  }
}
import { BlobServiceClient, StorageSharedKeyCredential, ContainerClient } from "@azure/storage-blob";

// Get environment variables
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

// Container for storing CSV files
const containerName = "transaction-uploads";

// Initialize the blob service client
let blobServiceClient: BlobServiceClient;
let containerClient: ContainerClient;

// Choose initialization method based on available credentials
if (connectionString) {
  blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
} else if (accountName && accountKey) {
  const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
  const blobServiceUrl = `https://${accountName}.blob.core.windows.net`;
  blobServiceClient = new BlobServiceClient(blobServiceUrl, sharedKeyCredential);
} else {
  throw new Error("Azure Storage credentials not provided");
}

// Initialize the container client
containerClient = blobServiceClient.getContainerClient(containerName);

/**
 * Ensures the container exists before any operations
 */
async function ensureContainerExists(): Promise<void> {
  try {
    // Check if container exists, if not, create it
    if (!(await containerClient.exists())) {
      console.log(`Creating container '${containerName}'...`);
      await containerClient.create({ access: "blob" }); // 'blob' allows public read access for blobs
      console.log(`Container '${containerName}' created successfully`);
    }
  } catch (error) {
    console.error("Error ensuring container exists:", error);
    throw error;
  }
}

/**
 * Upload a file to Azure Blob Storage
 * @param fileBuffer - The file buffer to upload
 * @param fileName - The name to use for the file in Azure
 * @returns The URL to the uploaded file
 */
export async function uploadFile(fileBuffer: Buffer, fileName: string): Promise<string> {
  try {
    await ensureContainerExists();
    
    // Create a unique name for the blob
    const uniqueName = `${Date.now()}-${fileName}`;
    const blockBlobClient = containerClient.getBlockBlobClient(uniqueName);
    
    // Upload file buffer
    await blockBlobClient.upload(fileBuffer, fileBuffer.length);
    
    // Return the URL to the blob
    return blockBlobClient.url;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

/**
 * Download a file from Azure Blob Storage
 * @param blobName - The name of the blob to download
 * @returns The downloaded file as a Buffer
 */
export async function downloadFile(blobName: string): Promise<Buffer> {
  try {
    await ensureContainerExists();
    
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const downloadResponse = await blockBlobClient.download(0);
    
    // Convert the downloaded data to a buffer
    const chunks: Buffer[] = [];
    if (downloadResponse.readableStreamBody) {
      for await (const chunk of downloadResponse.readableStreamBody) {
        chunks.push(Buffer.from(chunk));
      }
    }
    
    return Buffer.concat(chunks);
  } catch (error) {
    console.error("Error downloading file:", error);
    throw error;
  }
}

/**
 * Delete a file from Azure Blob Storage
 * @param blobName - The name of the blob to delete
 */
export async function deleteFile(blobName: string): Promise<void> {
  try {
    await ensureContainerExists();
    
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.delete();
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
}

/**
 * List all files in the container
 * @returns Array of blob names
 */
export async function listFiles(): Promise<string[]> {
  try {
    await ensureContainerExists();
    
    const blobs: string[] = [];
    for await (const blob of containerClient.listBlobsFlat()) {
      blobs.push(blob.name);
    }
    
    return blobs;
  } catch (error) {
    console.error("Error listing files:", error);
    throw error;
  }
}

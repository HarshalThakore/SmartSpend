import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, AlertCircle, CheckCircle2, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

export default function CSVUploadWidget() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Simulate progress
      const simulateProgress = () => {
        setUploadProgress(0);
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            const newProgress = prev + Math.random() * 10;
            if (newProgress >= 95) {
              clearInterval(interval);
              return 95;
            }
            return newProgress;
          });
        }, 300);
        
        return () => clearInterval(interval);
      };
      
      const clearProgressSimulation = simulateProgress();
      
      try {
        const response = await fetch("/api/upload-csv", {
          method: "POST",
          body: formData,
          // Don't set Content-Type here, it will be set automatically for FormData
        });
        
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(0), 1000);
        
        return await response.json();
      } catch (error) {
        clearProgressSimulation();
        setUploadProgress(0);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: data.message,
        variant: "default",
      });
      
      // Reset file
      setSelectedFile(null);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Invalid File",
          description: "Please upload a CSV file only.",
          variant: "destructive",
        });
      }
    }
  };

  const validateFile = (file: File) => {
    // Check file type
    const validTypes = ["text/csv", "application/vnd.ms-excel"];
    if (validTypes.indexOf(file.type) === -1) {
      // Also check file extension for .csv
      const fileNameParts = file.name.split('.');
      const extension = fileNameParts[fileNameParts.length - 1].toLowerCase();
      if (extension !== 'csv') {
        return false;
      }
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 5MB.",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to upload.",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData();
    formData.append("csvFile", selectedFile);
    
    uploadMutation.mutate(formData);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Upload className="h-5 w-5 mr-2" /> Import Transactions from CSV
        </CardTitle>
        <CardDescription>
          Upload a CSV file with your transactions to import them into SmartSpend.
          The file should have columns for description, amount, type (income/expense), and date.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div 
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/50'}
              ${selectedFile ? 'bg-secondary/50' : ''}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !selectedFile && document.getElementById('file-upload')?.click()}
          >
            <input
              type="file"
              id="file-upload"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploadMutation.isPending}
            />
            
            {selectedFile ? (
              <div className="flex flex-col items-center space-y-2">
                <CheckCircle2 className="h-8 w-8 text-primary mb-2" />
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  type="button"
                  className="mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearFile();
                  }}
                  disabled={uploadMutation.isPending}
                >
                  <X className="h-4 w-4 mr-1" /> Remove
                </Button>
              </div>
            ) : (
              <>
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">
                  Drag and drop your CSV file here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports CSV files up to 5MB
                </p>
              </>
            )}
          </div>
          
          {uploadProgress > 0 && (
            <div className="mt-4">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-center mt-1 text-muted-foreground">
                {uploadProgress < 100 
                  ? `Uploading: ${Math.round(uploadProgress)}%` 
                  : "Upload complete!"}
              </p>
            </div>
          )}
          
          {uploadMutation.isError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {uploadMutation.error instanceof Error 
                  ? uploadMutation.error.message 
                  : "Failed to upload file. Please try again."}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">CSV Format Example:</h3>
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
              description,amount,type,date,notes,category<br/>
              "Grocery shopping",120.50,expense,2025-03-15,"Monthly groceries",Food<br/>
              "Salary deposit",3000,income,2025-03-01,"March salary",Salary<br/>
            </pre>
          </div>
        </form>
      </CardContent>
      
      <CardFooter className="flex justify-end space-x-4">
        <Button
          variant="outline"
          onClick={handleClearFile}
          disabled={!selectedFile || uploadMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!selectedFile || uploadMutation.isPending}
        >
          {uploadMutation.isPending ? "Uploading..." : "Upload Transactions"}
        </Button>
      </CardFooter>
    </Card>
  );
}

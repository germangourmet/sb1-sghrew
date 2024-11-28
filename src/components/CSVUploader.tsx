import React, { useState, useRef } from 'react';
import { X, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { SoundType } from '../hooks/useSound';
import { Record } from '../types';
import { getAllRecords } from '../utils/recordManager';

interface CSVUploaderProps {
  onClose: () => void;
  playSound: (type: SoundType) => void;
}

export const CSVUploader: React.FC<CSVUploaderProps> = ({ onClose, playSound }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [processedRows, setProcessedRows] = useState(0);
  const [skippedRows, setSkippedRows] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const generateId = () => {
    const records = getAllRecords();
    const lastId = records[records.length - 1]?.id || 'CORP-0000';
    const lastNumber = parseInt(lastId.split('-')[1]);
    return `CORP-${String(lastNumber + 1).padStart(4, '0')}`;
  };

  const isRowEmpty = (data: { [key: string]: string }): boolean => {
    return Object.values(data).every(value => !value.trim());
  };

  const convertToRecord = (data: { [key: string]: string }): Record | null => {
    if (isRowEmpty(data)) return null;

    // If company_name is empty, skip this record
    if (!data.company_name?.trim()) return null;

    return {
      id: generateId(),
      status: 'ACTIVE',
      level: 'PUBLIC',
      lastAccessed: new Date().toISOString().split('T')[0],
      subject: data.company_name.trim(),
      details: data.description?.trim() || data.company_name.trim(),
      requiredClearance: 'PUBLIC',
      name: data.company_name.trim(),
      address: data.address?.trim() || '',
      zipCode: data.zipCode?.trim() || '',
      city: data.city?.trim() || '',
      country: data.country?.trim() || '',
      logo: data.logo?.trim() || 'https://images.unsplash.com/photo-1516245834210-c4c142787335?auto=format&fit=crop&w=300',
      images: data.images ? JSON.parse(data.images.trim() || '[]') : [],
      category: data.category?.trim() ? data.category.split(',').map(c => c.trim().toUpperCase()) : [],
      tags: data.tags?.trim() ? data.tags.split(',').map(t => t.trim().toUpperCase()) : [],
      socialMedia: {
        twitter: data.twitter?.trim() || '',
        linkedin: data.linkedin?.trim() || ''
      },
      description: data.description?.trim() || '',
      sourceFound: 'Company Website',
      ceo: data.ceo?.trim() || '',
      language: data.language?.trim() ? data.language.split(',').map(l => l.trim().toUpperCase()) : ['ENGLISH'],
      taxId: data.taxId?.trim() || '',
      verificationStatus: {}
    };
  };

  const processCSV = async (file: File) => {
    setUploadStatus('processing');
    setProcessedRows(0);
    setSkippedRows(0);
    playSound('diskRead');

    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());

      // Validate CSV structure
      if (!headers.includes('company_name')) {
        throw new Error('Invalid CSV format. Required column "company_name" is missing.');
      }

      // Process each line
      const newRecords: Record[] = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) {
          setSkippedRows(prev => prev + 1);
          continue;
        }
        
        const values = lines[i].split(',').map(v => v.trim());
        const data: { [key: string]: string } = {};
        
        headers.forEach((header, index) => {
          data[header] = values[index] || '';
        });

        const record = convertToRecord(data);
        if (record) {
          newRecords.push(record);
          setProcessedRows(prev => prev + 1);
        } else {
          setSkippedRows(prev => prev + 1);
        }
      }

      // In a real application, you would make an API call here
      console.log('New records:', newRecords);

      setUploadStatus('success');
      playSound('login');
      setTimeout(() => onClose(), 3000);
    } catch (error) {
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to process CSV file');
      playSound('error');
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      await processCSV(file);
    } else {
      setUploadStatus('error');
      setErrorMessage('Please upload a valid CSV file');
      playSound('error');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processCSV(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex justify-center p-8 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-black border border-green-500/30 rounded-lg p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-green-500/70 hover:text-green-500 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-bold text-green-500 mb-6 flex items-center gap-2">
          <Upload className="w-6 h-6" />
          CSV Data Upload
        </h2>

        {uploadStatus === 'idle' && (
          <>
            <div
              className={`border-2 border-dashed ${
                isDragging ? 'border-green-500' : 'border-green-500/30'
              } rounded-lg p-8 text-center transition-colors`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-green-500/50" />
              <p className="text-green-500/70 mb-4">
                Drag and drop your CSV file here, or click to select
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".csv"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-green-500/20 border border-green-500/30 rounded px-4 py-2 text-green-500 hover:bg-green-500/30 transition-colors"
              >
                Select File
              </button>
            </div>
            <div className="mt-4 text-sm text-green-500/70">
              <p className="font-bold mb-2">Required CSV Format:</p>
              <p>company_name, industry, description, address, city, country, ceo, etc.</p>
              <p className="mt-2">Note: At minimum, the CSV must include a 'company_name' column.</p>
            </div>
          </>
        )}

        {uploadStatus === 'processing' && (
          <div className="text-center py-8">
            <Upload className="w-12 h-12 mx-auto mb-4 text-green-500 animate-spin" />
            <p className="text-green-500">Processing CSV data...</p>
            <p className="text-green-500/70 mt-2">
              Processed: {processedRows} | Skipped: {skippedRows}
            </p>
          </div>
        )}

        {uploadStatus === 'success' && (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <p className="text-green-500">Companies added successfully!</p>
            <p className="text-green-500/70 mt-2">
              Successfully imported {processedRows} companies
              {skippedRows > 0 && ` (${skippedRows} rows skipped)`}
            </p>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <p className="text-red-500 mb-4">{errorMessage}</p>
            <button
              onClick={() => setUploadStatus('idle')}
              className="bg-green-500/20 border border-green-500/30 rounded px-4 py-2 text-green-500 hover:bg-green-500/30 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
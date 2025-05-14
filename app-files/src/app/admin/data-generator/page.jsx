// src/app/admin/data-generator/page.jsx
'use client';

import { useState } from 'react';

export default function DataGeneratorPage() {
  // State for form inputs
  const [numMonths, setNumMonths] = useState(12);
  const [numTeams, setNumTeams] = useState(5);
  const [avgSubTeams, setAvgSubTeams] = useState(3);
  const [avgPersonnel, setAvgPersonnel] = useState(20);
  const [avgNewContracts, setAvgNewContracts] = useState(10);
  const [numSuppliers, setNumSuppliers] = useState(50); // <-- New state for number of suppliers

  // State for UI feedback
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  // const [generatedJsonData, setGeneratedJsonData] = useState(null); // Kept if you want a "View JSON" option

  const handleGenerateAndDownload = async (event) => {
    event.preventDefault(); 
    setIsLoading(true);
    setMessage('Generating data and preparing download... please wait.');
    // setGeneratedJsonData(null);

    try {
      const response = await fetch('/api/generate-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numMonthsToGenerate: numMonths,
          numTeams,
          avgSubTeamsPerTeam: avgSubTeams,
          avgPersonnelPerSubTeam: avgPersonnel,
          avgNewContractsPerMonth: avgNewContracts,
          numSuppliers: numSuppliers, // <-- Pass new parameter
          format: "csv_zip" 
        }),
      });

      if (!response.ok) {
        let errorMessage = `API request failed with status ${response.status}`;
        try {
            const errorResult = await response.json();
            errorMessage = errorResult.message || errorMessage;
        } catch (e) {
            const textError = await response.text();
            errorMessage = textError || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob(); 
      const url = window.URL.createObjectURL(blob); 
      const a = document.createElement('a'); 
      a.href = url;
      
      const contentDisposition = response.headers.get('content-disposition');
      let fileName = "Generated_Performance_Data.zip"; 
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (fileNameMatch && fileNameMatch.length === 2) {
          fileName = fileNameMatch[1];
        }
      }
      a.download = fileName; 
      
      document.body.appendChild(a); 
      a.click(); 
      
      a.remove(); 
      window.URL.revokeObjectURL(url); 

      setMessage('Data generated and download started!');

    } catch (error) {
      console.error('Failed to generate or download data:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-primary text-textClr-primary p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-background-secondary p-6 sm:p-8 rounded-card shadow-md">
        <h1 className="text-3xl font-bold text-accent-primary mb-8 text-center">
          Fictional Data Generator
        </h1>

        <form onSubmit={handleGenerateAndDownload} className="space-y-6">
          {/* Number of Months Input */}
          <div>
            <label htmlFor="numMonths" className="block text-sm font-medium text-textClr-secondary mb-1">
              Number of Past Months for Snapshots:
            </label>
            <input
              type="number" id="numMonths" name="numMonths" value={numMonths}
              onChange={(e) => setNumMonths(Math.max(1, parseInt(e.target.value, 10)))}
              min="1" max="48" required className="input-field"
            />
          </div>

          {/* Organizational Structure Inputs */}
          <fieldset className="border border-borderClr-primary p-4 rounded-minimal">
            <legend className="text-lg font-medium text-textClr-secondary px-2">Organizational Structure</legend>
            <div className="space-y-4 mt-2">
              <div>
                <label htmlFor="numTeams" className="block text-sm font-medium text-textClr-secondary mb-1">
                  Number of Teams:
                </label>
                <input type="number" id="numTeams" value={numTeams} onChange={(e) => setNumTeams(Math.max(1, parseInt(e.target.value, 10)))} min="1" max="10" required className="input-field" />
              </div>
              <div>
                <label htmlFor="avgSubTeams" className="block text-sm font-medium text-textClr-secondary mb-1">
                  Avg. Sub-Teams per Team:
                </label>
                <input type="number" id="avgSubTeams" value={avgSubTeams} onChange={(e) => setAvgSubTeams(Math.max(1, parseInt(e.target.value, 10)))} min="1" max="5" required className="input-field" />
              </div>
              <div>
                <label htmlFor="avgPersonnel" className="block text-sm font-medium text-textClr-secondary mb-1">
                  Avg. Personnel per Sub-Team:
                </label>
                <input type="number" id="avgPersonnel" value={avgPersonnel} onChange={(e) => setAvgPersonnel(Math.max(1, parseInt(e.target.value, 10)))} min="1" max="50" required className="input-field" />
              </div>
            </div>
          </fieldset>

          {/* Contract Data Inputs */}
          <fieldset className="border border-borderClr-primary p-4 rounded-minimal">
            <legend className="text-lg font-medium text-textClr-secondary px-2">Contract & Supplier Settings</legend>
            <div className="space-y-4 mt-2">
              <div>
                <label htmlFor="avgNewContracts" className="block text-sm font-medium text-textClr-secondary mb-1">
                  Avg. New Contracts per Month:
                </label>
                <input
                  type="number" id="avgNewContracts" name="avgNewContracts" value={avgNewContracts}
                  onChange={(e) => setAvgNewContracts(Math.max(1, parseInt(e.target.value, 10)))}
                  min="1" max="50" required className="input-field"
                />
              </div>
              {/* New Input for Number of Suppliers */}
              <div>
                <label htmlFor="numSuppliers" className="block text-sm font-medium text-textClr-secondary mb-1">
                  Number of Unique Suppliers:
                </label>
                <input
                  type="number" id="numSuppliers" name="numSuppliers" value={numSuppliers}
                  onChange={(e) => setNumSuppliers(Math.max(5, parseInt(e.target.value, 10)))} // Min 5 suppliers
                  min="5" max="200" required className="input-field"
                />
              </div>
            </div>
          </fieldset>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? 'Generating...' : 'Generate & Download ZIP'}
            </button>
          </div>
        </form>

        {message && (
          <div className={`mt-6 p-3 rounded-minimal text-sm ${isLoading || message.toLowerCase().includes('error') ? 'bg-amber-600/30 text-amber-200 border border-amber-500' : 'bg-emerald-600/30 text-emerald-200 border border-emerald-500'}`}>
            {message}
          </div>
        )}
        {/* JSON display section commented out for now
        {generatedJsonData && !isLoading && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold text-accent-primary mb-2">Generated JSON Output:</h3>
            <pre className="bg-background-tertiary p-4 rounded-minimal text-sm text-textClr-secondary overflow-x-auto max-h-96">
              {JSON.stringify(generatedJsonData, null, 2)}
            </pre>
          </div>
        )}
        */}
      </div>

      <footer className="mt-12 text-center text-textClr-secondary text-sm">
        <p>This utility generates fictional CSV data for development and testing purposes.</p>
        <p>© {new Date().getFullYear()} Performance Metrics App</p>
      </footer>
    </div>
  );
}
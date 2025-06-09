'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

async function fetchComparisons() {
  const res = await fetch('/api/comparisons?limit=20', {
    cache: 'no-store',
  });

  if (!res.ok) {
    let errorData = { error: 'Unknown error' };
    try {
      errorData = await res.json();
    } catch (parseError) {
      console.error('Failed to parse error response:', parseError);
    }
    console.error('Failed to fetch comparisons:', errorData);
    throw new Error(`Failed to fetch comparisons: ${errorData.error || res.statusText}`);
  }
  return res.json();
}

export default function ComparisonsPage() {
  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getComparisons = async () => {
      try {
        const data = await fetchComparisons();
        setComparisons(data.comparisons || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    getComparisons();
  }, []);

  if (loading) {
    return <div className="p-8 text-gray-500">Loading comparison history...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">Failed to load comparison history: {error}</div>;
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Comparison History</h1>
      {comparisons.length === 0 ? (
        <div className="text-gray-500">No comparisons found.</div>
      ) : (
        <div className="space-y-4">
          {comparisons.map((comp: any) => (
            <Link key={comp.id} href={`/comparisons/${comp.id}`} className="block bg-white rounded-lg shadow p-4 hover:bg-primary-end/5 transition">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-primary-end">{new Date(comp.createdAt).toLocaleString()}</span>
                <span className="text-xs text-gray-400">ID: {comp.id.slice(0, 8)}...</span>
              </div>
              <div className="mb-2">
                <span className="font-medium text-gray-700">Prompt:</span>
                <span className="ml-2 text-gray-800">{comp.prompt.length > 80 ? comp.prompt.slice(0, 80) + '…' : comp.prompt}</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {comp.responses.map((resp: any) => (
                  <span key={resp.id} className="px-2 py-1 bg-surface-dark rounded text-xs text-gray-700">
                    {resp.modelName}: {resp.content.slice(0, 40)}{resp.content.length > 40 ? '…' : ''}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
} 
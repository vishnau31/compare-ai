'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

async function fetchComparison(id: string) {
  const res = await fetch(`/api/comparisons/${id}`, {
    cache: 'no-store',
  });

  if (res.status === 404) {
    return null; // Return null to indicate not found, handled by component state
  }

  if (!res.ok) {
    let errorData = { error: 'Unknown error' };
    try {
      errorData = await res.json();
    } catch (parseError) {
      console.error('Failed to parse error response:', parseError);
    }
    console.error(`Failed to fetch comparison ${id}:`, errorData);
    throw new Error(`Failed to fetch comparison: ${errorData.error || res.statusText}`);
  }

  return res.json();
}

export default function ComparisonDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;

    const getComparison = async () => {
      setLoading(true);
      setError(null);
      setNotFound(false);
      try {
        const data = await fetchComparison(id);
        if (data === null) {
          setNotFound(true);
        } else {
          setComparison(data);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    getComparison();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-gray-500">Loading comparison details...</div>;
  }

  if (notFound) {
    return <div className="p-8 text-red-500">Comparison not found.</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">Failed to load comparison details: {error}</div>;
  }

  if (!comparison) {
    // This case should ideally be caught by loading, error, or notFound, but as a fallback
    return <div className="p-8 text-red-500">No comparison data available.</div>;
  }

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-primary-end">Comparison Details</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">Prompt</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{comparison.prompt}</p>
        <p className="text-sm text-gray-500 mt-2">Created: {new Date(comparison.createdAt).toLocaleString()}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {comparison.responses.map((resp: any) => (
          <div key={resp.id} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2 text-surface-dark">{resp.modelName}</h3>
            <p className="text-gray-700 whitespace-pre-wrap text-sm mb-4">{resp.content}</p>
            <div className="text-xs text-gray-500 space-y-1">
              <p>Tokens: {resp.metrics?.totalTokens || 'N/A'} (P: {resp.metrics?.promptTokens || 'N/A'}, C: {resp.metrics?.completionTokens || 'N/A'})</p>
              <p>Latency: {resp.metrics?.latencyMs || 'N/A'} ms</p>
              <p>Cost: ${(resp.metrics?.cost || 0).toFixed(6)}</p>
            </div>
          </div>
        ))}
      </div>

      {comparison.metrics && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Overall Comparison Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
            <p><strong>Total Latency:</strong> {comparison.metrics.totalLatencyMs} ms</p>
            <p><strong>Total Cost:</strong> ${(comparison.metrics.totalCost || 0).toFixed(6)}</p>
            <p><strong>Fastest Model:</strong> {comparison.metrics.fastestModel}</p>
            <p><strong>Most Cost-Effective Model:</strong> {comparison.metrics.mostCostEffectiveModel}</p>
          </div>
        </div>
      )}
    </main>
  );
} 

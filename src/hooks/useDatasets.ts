import { useState, useEffect } from "react";
import { DateRange } from "@/types/time";

interface Dataset {
  id: string;
  filename: string;
  title: string;
  description: string;
  dateRange: DateRange | null;
}

export function useDatasets() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDatasets() {
      try {
        const response = await fetch("/api/datasets");
        if (!response.ok) {
          throw new Error("Failed to fetch datasets");
        }
        const data = await response.json();
        setDatasets(data.datasets);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load datasets"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchDatasets();
  }, []);

  return {
    datasets,
    loading,
    error,
  };
}

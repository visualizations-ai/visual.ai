import React from "react";
import { ChevronDown } from "lucide-react";

interface DataSourceSelectorProps {
  selectedDataSource: string;
  onDataSourceChange: (id: string) => void;
  dataSources: any[];
  loading: boolean;
}

export const DataSourceSelector: React.FC<DataSourceSelectorProps> = ({
  selectedDataSource,
  onDataSourceChange,
  dataSources,
  loading
}) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Select Data Source
      </label>
      <div className="relative">
        <select
          value={selectedDataSource}
          onChange={(e) => onDataSourceChange(e.target.value)}
          className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
          disabled={loading}
        >
          <option value="">Select a data source...</option>
          {dataSources.map((ds: any) => (
            <option key={ds.id} value={ds.id}>
              {ds.projectId} ({ds.database})
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
};
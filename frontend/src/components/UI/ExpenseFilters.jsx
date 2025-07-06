import React from "react";
import { FaFilter, FaFileExport } from "react-icons/fa";

const ExpenseFilters = ({
  filters,
  onFilterChange,
  applyFilters,
  resetFilters,
  onExport,
}) => {
  const sortOptions = [
    { value: "date", label: "Date" },
    { value: "amount", label: "Amount" },
    { value: "category", label: "Category" },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
        <FaFilter className="mr-2" /> Filters
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            name="category"
            value={filters.category}
            onChange={onFilterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            <option value="Food">Food</option>
            <option value="Transportation">Transportation</option>
            <option value="Housing">Housing</option>
            <option value="Utilities">Utilities</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Education">Education</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Amount
          </label>
          <input
            type="number"
            name="minAmount"
            value={filters.minAmount}
            onChange={onFilterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Amount
          </label>
          <input
            type="number"
            name="maxAmount"
            value={filters.maxAmount}
            onChange={onFilterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <select
            name="sortBy"
            value={filters.sortBy}
            onChange={onFilterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sort Order
          </label>
          <select
            name="sortOrder"
            value={filters.sortOrder}
            onChange={onFilterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        <div className="flex items-end space-x-2">
          <button
            onClick={applyFilters}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Apply Filters
          </button>
          <button
            onClick={resetFilters}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <div className="space-x-2">
          <button
            onClick={() => onExport("csv")}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center focus:outline-none focus:shadow-outline"
          >
            <FaFileExport className="mr-2" /> Export CSV
          </button>
          <button
            onClick={() => onExport("excel")}
            className="bg-green-600 hover:bg-green-800 text-white font-bold py-2 px-4 rounded flex items-center focus:outline-none focus:shadow-outline"
          >
            <FaFileExport className="mr-2" /> Export Excel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseFilters;

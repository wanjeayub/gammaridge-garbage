import React from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import moment from "moment";

const MonthSelector = ({
  currentMonth,
  currentYear,
  availableMonths = [],
  onMonthChange,
}) => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Safely check if month is available
  const isMonthAvailable = (month, year) => {
    if (!availableMonths || !Array.isArray(availableMonths)) return false;
    return availableMonths.some((m) => m.month === month && m.year === year);
  };

  const navigateMonth = (direction) => {
    const currentDate = moment(`${currentYear}-${currentMonth}`, "YYYY-MMMM");
    const newDate =
      direction === "prev"
        ? currentDate.subtract(1, "month")
        : currentDate.add(1, "month");

    onMonthChange(newDate.format("MMMM"), newDate.format("YYYY"));
  };

  const currentDate = moment(`${currentYear}-${currentMonth}`, "YYYY-MMMM");
  const prevDate = moment(currentDate).subtract(1, "month");
  const nextDate = moment(currentDate).add(1, "month");

  // Default to true if availableMonths isn't loaded yet
  const isPrevAvailable =
    availableMonths.length === 0 ||
    isMonthAvailable(prevDate.format("MMMM"), prevDate.format("YYYY"));
  const isNextAvailable =
    availableMonths.length === 0 ||
    isMonthAvailable(nextDate.format("MMMM"), nextDate.format("YYYY"));

  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={() => navigateMonth("prev")}
        disabled={!isPrevAvailable}
        className={`p-2 rounded-full ${
          isPrevAvailable
            ? "text-blue-600 hover:bg-blue-50"
            : "text-gray-400 cursor-not-allowed"
        }`}
      >
        <FaChevronLeft />
      </button>

      <div className="text-lg font-semibold text-gray-700">
        {currentMonth} {currentYear}
      </div>

      <button
        onClick={() => navigateMonth("next")}
        disabled={!isNextAvailable}
        className={`p-2 rounded-full ${
          isNextAvailable
            ? "text-blue-600 hover:bg-blue-50"
            : "text-gray-400 cursor-not-allowed"
        }`}
      >
        <FaChevronRight />
      </button>
    </div>
  );
};

export default MonthSelector;

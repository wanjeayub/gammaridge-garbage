import React from "react";
import PropTypes from "prop-types";
import {
  FaMoneyBillWave,
  FaCalendarAlt,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

const iconComponents = {
  money: FaMoneyBillWave,
  calendar: FaCalendarAlt,
  success: FaCheckCircle,
  warning: FaExclamationTriangle,
};

const colorClasses = {
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-600",
  },
  green: {
    bg: "bg-green-50",
    text: "text-green-600",
  },
  red: {
    bg: "bg-red-50",
    text: "text-red-600",
  },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-600",
  },
  yellow: {
    bg: "bg-yellow-50",
    text: "text-yellow-600",
  },
};

const StatCard = ({
  title,
  value,
  icon = "money",
  color = "blue",
  isLoading = false,
}) => {
  const IconComponent = iconComponents[icon] || FaMoneyBillWave;
  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-start h-full">
      <div className={`p-3 rounded-lg ${colors.bg} mr-4`}>
        <IconComponent className={`text-xl ${colors.text}`} />
      </div>
      <div className="flex-1">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        {isLoading ? (
          <div className="animate-pulse flex space-x-4 mt-1">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          </div>
        ) : (
          <p className="text-2xl font-semibold mt-1 truncate">
            {typeof value === "number"
              ? `Ksh ${value.toLocaleString()}`
              : value}
          </p>
        )}
      </div>
    </div>
  );
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  icon: PropTypes.oneOf(["money", "calendar", "success", "warning"]),
  color: PropTypes.oneOf(["blue", "green", "red", "purple", "yellow"]),
  isLoading: PropTypes.bool,
};

export default React.memo(StatCard);

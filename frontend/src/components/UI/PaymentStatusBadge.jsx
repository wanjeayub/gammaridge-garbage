import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";

const statusConfig = {
  paid: {
    color: "green",
    text: "Paid",
    icon: "💰",
  },
  pending: {
    color: "yellow",
    text: "Pending",
    icon: "⏳",
  },
  overdue: {
    color: "red",
    text: "Overdue",
    icon: "⚠️",
  },
};

const PaymentStatusBadge = ({ status, showIcon = true, className }) => {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={classNames(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        {
          "bg-green-100 text-green-800": config.color === "green",
          "bg-yellow-100 text-yellow-800": config.color === "yellow",
          "bg-red-100 text-red-800": config.color === "red",
        },
        className
      )}
      aria-label={`Payment status: ${config.text}`}
    >
      {showIcon && (
        <span className="mr-1" aria-hidden="true">
          {config.icon}
        </span>
      )}
      {config.text}
    </span>
  );
};

PaymentStatusBadge.propTypes = {
  status: PropTypes.oneOf(["paid", "pending", "overdue"]).isRequired,
  showIcon: PropTypes.bool,
  className: PropTypes.string,
};

PaymentStatusBadge.defaultProps = {
  showIcon: true,
  className: "",
};

export default React.memo(PaymentStatusBadge);

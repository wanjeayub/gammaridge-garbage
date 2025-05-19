import React, { useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Collapse,
  Chip,
  useTheme,
} from "@mui/material";
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  Edit,
  Delete,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Info,
} from "@mui/icons-material";

const PaymentStatusChip = ({ status, amount, expected }) => {
  const getStatusDetails = () => {
    switch (status) {
      case "paid":
        return {
          label: "Paid",
          color: "success",
          icon: <CheckCircle fontSize="small" />,
        };
      case "partial":
        return {
          label: `Partial (KSh ${amount?.toLocaleString()}/${expected?.toLocaleString()})`,
          color: "warning",
          icon: <Warning fontSize="small" />,
        };
      case "overdue":
        return {
          label: "Overdue",
          color: "error",
          icon: <ErrorIcon fontSize="small" />,
        };
      default:
        return {
          label: "Pending",
          color: "info",
          icon: <Info fontSize="small" />,
        };
    }
  };

  const details = getStatusDetails();

  return (
    <Chip
      icon={details.icon}
      label={details.label}
      color={details.color}
      size="small"
      sx={{
        fontWeight: 600,
        px: 1,
        borderRadius: 1,
      }}
    />
  );
};

const LocationGroup = ({ location, plots, onEdit, onDelete, theme }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          <Typography fontWeight="bold">{location.name}</Typography>
        </TableCell>
        <TableCell align="right">{plots.length} plots</TableCell>
        <TableCell align="right">
          <Chip
            label={`${plots.reduce(
              (sum, plot) => sum + (plot.payments?.length || 0),
              0
            )} payments`}
            color="primary"
            size="small"
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              {plots.map((plot) => (
                <PlotPayments
                  key={plot._id}
                  plot={plot}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  theme={theme}
                />
              ))}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const PlotPayments = ({ plot, onEdit, onDelete, theme }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          <Typography>Plot {plot.plotNumber}</Typography>
        </TableCell>
        <TableCell align="right">
          {plot.payments?.length || 0} payments
        </TableCell>
        <TableCell align="right">
          <Chip
            label={`${plot.users?.length || 0} collectors`}
            color="secondary"
            size="small"
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Payment Details
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow
                    sx={{
                      backgroundColor:
                        theme.palette.grey[
                          theme.palette.mode === "dark" ? 800 : 100
                        ],
                    }}
                  >
                    <TableCell>Expected (KSh)</TableCell>
                    <TableCell>Paid (KSh)</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {plot.payments?.map((payment) => (
                    <TableRow key={payment._id}>
                      <TableCell>
                        {payment.expectedAmount?.toLocaleString() || "0"}
                      </TableCell>
                      <TableCell>
                        {payment.paidAmount?.toLocaleString() || "0"}
                      </TableCell>
                      <TableCell>
                        {new Date(payment.dueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <PaymentStatusChip
                          status={getPaymentStatus(payment)}
                          amount={payment.paidAmount}
                          expected={payment.expectedAmount}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => onEdit(payment)}
                          sx={{
                            backgroundColor: theme.palette.primary.light,
                            color: theme.palette.primary.contrastText,
                            "&:hover": {
                              backgroundColor: theme.palette.primary.main,
                            },
                            mr: 1,
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => onDelete(payment._id)}
                          sx={{
                            backgroundColor: theme.palette.error.light,
                            color: theme.palette.error.contrastText,
                            "&:hover": {
                              backgroundColor: theme.palette.error.main,
                            },
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const getPaymentStatus = (payment) => {
  if (payment.isPaid) return "paid";
  if (payment.paidAmount > 0) return "partial";
  if (new Date(payment.dueDate) < new Date()) return "overdue";
  return "pending";
};

const GroupedPaymentsTable = ({
  payments,
  plots,
  locations,
  onEdit,
  onDelete,
}) => {
  const theme = useTheme();

  // Group plots by location
  const groupedData = locations
    .map((location) => ({
      location,
      plots: plots
        .filter((plot) => plot.location?._id === location._id)
        .map((plot) => ({
          ...plot,
          payments: payments.filter((p) => p.plot?._id === plot._id),
        })),
    }))
    .filter((group) => group.plots.length > 0);

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 1 }}>
      <Table aria-label="collapsible table">
        <TableHead>
          <TableRow
            sx={{
              backgroundColor:
                theme.palette.grey[theme.palette.mode === "dark" ? 800 : 100],
            }}
          >
            <TableCell />
            <TableCell>Location</TableCell>
            <TableCell align="right">Plots</TableCell>
            <TableCell align="right">Payments</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {groupedData.map((group) => (
            <LocationGroup
              key={group.location._id}
              location={group.location}
              plots={group.plots}
              onEdit={onEdit}
              onDelete={onDelete}
              theme={theme}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default GroupedPaymentsTable;

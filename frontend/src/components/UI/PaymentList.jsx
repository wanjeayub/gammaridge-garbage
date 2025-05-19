import React, { useMemo } from "react";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import PaymentRow from "./PaymentRow";

const PaymentList = ({ payments, onEdit, onDelete }) => {
  const memoizedPayments = useMemo(() => payments, [payments]);

  const Row = ({ index, style }) => (
    <div style={style}>
      <PaymentRow
        payment={memoizedPayments[index]}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );

  return (
    <div className="flex-1">
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            itemCount={memoizedPayments.length}
            itemSize={72} // Approx height of each row
            width={width}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
};

export default React.memo(PaymentList);

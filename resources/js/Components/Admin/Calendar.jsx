import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

function DateRangePicker({ onChange, value }) {
  // isset alternative: value?.[0], value?.[1]
  const [dateRange, setDateRange] = useState([
    value?.[0] ?? null,
    value?.[1] ?? null,
  ]);

  // Sync when parent value changes
  useEffect(() => {
    if (value) {
      setDateRange([value?.[0] ?? null, value?.[1] ?? null]);
    }
  }, [value]);

  const handleChange = (range) => {
    setDateRange(range);

    // send data back to parent (like Laravel request)
    if (onChange) {
      onChange(range);
    }
  };

  return (
    <div className="calendar-main">
      <Calendar
        selectRange
        onChange={handleChange}
        value={dateRange}
      />
    </div>
  );
}

export default DateRangePicker;
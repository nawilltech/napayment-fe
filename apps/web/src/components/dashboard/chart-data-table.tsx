import type { TransactionDailyVolume } from "@napayment/api-client";
import { formatDate, formatNaira } from "@napayment/format";

/** Screen-reader table behind every volume chart - the same data, no hover needed. */
export function ChartDataTable({ caption, data }: { caption: string; data: TransactionDailyVolume[] }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th>Date</th>
          <th>Transactions</th>
          <th>Volume</th>
        </tr>
      </thead>
      <tbody>
        {data.map((day) => (
          <tr key={day.date}>
            <td>{formatDate(day.date)}</td>
            <td>{day.count}</td>
            <td>{formatNaira(day.volume)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

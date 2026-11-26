import type { DigestRow } from "../digest/types.js";

// Missing data renders as — (styleguide). Rows with 3+ retries or a fail last line warn.
export function DigestBoard(props: { rows: DigestRow[] }) {
  if (props.rows.length === 0) return <p>nothing ran</p>;
  return (
    <table>
      <tr>
        <th>job</th>
        <th>owner</th>
        <th>runs</th>
        <th>retries</th>
        <th>last</th>
        <th>first at</th>
        <th>last at</th>
        <th>error</th>
      </tr>
      {props.rows.map((row) => (
        <tr class={row.retries >= 3 || row.lastStatus === "fail" ? "warn" : undefined}>
          <td>{row.job}</td>
          <td>{row.owner ?? "—"}</td>
          <td>{row.runs}</td>
          <td>{row.retries}</td>
          <td>{row.lastStatus}</td>
          <td>{row.firstAt}</td>
          <td>{row.lastAt}</td>
          <td>{row.lastError ?? "—"}</td>
        </tr>
      ))}
    </table>
  );
}


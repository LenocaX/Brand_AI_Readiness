import React from 'react';

export interface Column<T> {
  header: string;
  accessor?: keyof T;
  render?: (row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T = any> {
  columns?: Column<T>[];
  data?: T[];
  keyExtractor?: (row: T) => string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  className?: string;
  children?: React.ReactNode;
}

export function Table<T = any>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No records found.',
  onRowClick,
  className = '',
  children,
}: TableProps<T>) {
  if (children) {
    return (
      <div
        style={{
          overflowX: 'auto',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--color-surface-white)',
        }}
        className={className}
      >
        <table className="audit-table">
          {children}
        </table>
      </div>
    );
  }

  const safeCols = columns || [];
  const safeData = data || [];

  return (
    <div
      style={{
        overflowX: 'auto',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: 'var(--color-surface-white)',
      }}
      className={className}
    >
      <table className="audit-table">
        <thead>
          <tr>
            {safeCols.map((col, idx) => (
              <th
                key={idx}
                style={{
                  width: col.width,
                  textAlign: col.align || 'left',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {safeData.length === 0 ? (
            <tr>
              <td
                colSpan={safeCols.length}
                style={{
                  textAlign: 'center',
                  padding: 'var(--space-8)',
                  color: 'var(--color-charcoal-muted)',
                }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            safeData.map((row) => (
              <tr
                key={keyExtractor ? keyExtractor(row) : Math.random().toString()}
                onClick={() => onRowClick && onRowClick(row)}
                style={onRowClick ? { cursor: 'pointer' } : undefined}
              >
                {safeCols.map((col, idx) => (
                  <td
                    key={idx}
                    style={{
                      textAlign: col.align || 'left',
                    }}
                  >
                    {col.render
                      ? col.render(row)
                      : col.accessor
                      ? String(row[col.accessor] ?? '')
                      : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export const TableHeader: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = (props) => <th {...props} />;
export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = (props) => <tr {...props} />;
export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = (props) => <td {...props} />;

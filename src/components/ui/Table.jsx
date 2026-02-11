import React from 'react';

const Table = ({ columns = [], data = [], striped = false, hoverable = false }) => {
    const tableClass = `ui-table${striped ? ' ui-table--striped' : ''}${hoverable ? ' ui-table--hoverable' : ''}`;
    return (
        <div className="ui-table-wrapper">
            <table className={tableClass}>
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => (
                        <tr key={index}>
                            {columns.map((col) => (
                                <td key={col.key}>{row[col.key]}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Table;

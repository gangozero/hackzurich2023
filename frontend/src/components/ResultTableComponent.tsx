import { useState, useEffect } from 'react';
import { Result } from '../types';

interface ResultTableComponentProps {
    factory_id: string;
    client_id: string;
}

export const ResultTableComponent = (props: ResultTableComponentProps) => {
    const [results, setResults] = useState<Result[]>([]);


    useEffect(() => {
        if (props.factory_id && props.client_id) {
            fetch(`http://127.0.0.1:8000/api/backhaul/${props.factory_id}/${props.client_id}`)
                .then(response => response.json())
                .then(data => setResults(data));
        }
    }, [props.factory_id, props.client_id]);



    return (
        <>
            {results.length === 0 ? (
                <div>No results found</div>
            ) : (
                <table>
                    <thead>
                        <tr>

                            <th style={{ border: '1px solid white', padding: '8px', textAlign: 'left' }}>Supplier ID</th>
                            <th style={{ border: '1px solid white', padding: '8px', textAlign: 'left' }}>Supplier Name</th>
                            <th style={{ border: '1px solid white', padding: '8px', textAlign: 'left' }}>Deviation Distance</th>
                            <th style={{ border: '1px solid white', padding: '8px', textAlign: 'left' }}>Backhaul Distance</th>
                            <th style={{ border: '1px solid white', padding: '8px', textAlign: 'left' }}>Delivery Distance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map(result => (
                            <tr key={result.id}>
                                <td className={`row ${!result.existing ? 'special' : ''}`} style={{ border: '1px solid white', padding: '8px', textAlign: 'left' }}>{result.id}</td>
                                <td className={`row ${!result.existing ? 'special' : ''}`} style={{ border: '1px solid white', padding: '8px', textAlign: 'left' }}>{result.name}</td>
                                <td className={`row ${!result.existing ? 'special' : ''}`} style={{ border: '1px solid white', padding: '8px', textAlign: 'left' }}>{result.bc_distance}</td>
                                <td className={`row ${!result.existing ? 'special' : ''}`} style={{ border: '1px solid white', padding: '8px', textAlign: 'left' }}>{result.ac_distance}</td>
                                <td className={`row ${!result.existing ? 'special' : ''}`} style={{ border: '1px solid white', padding: '8px', textAlign: 'left' }}>{result.ab_distance}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </>
    )
}
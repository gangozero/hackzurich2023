import { useState, useEffect } from 'react';
import Select from 'react-select';
import { Client } from '../types';
import { ResultTableComponent } from './ResultTableComponent';


interface ClientInputProps {
  factory_id: string;
}

export const ClientInput = (props: ClientInputProps) => {
  const [options, setOptions] = useState<Client[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (props.factory_id) {
      fetch(`http://127.0.0.1:8000/api/customers/${props.factory_id}`)
        .then(response => response.json())
        .then(data => setOptions(data));
    }
  }, [props.factory_id]);

  function handleSelectChange(selectedOption: any) {
    setSelectedId(selectedOption.id);
  }

  return (
    <>
      <Select
        options={options}
        getOptionLabel={(option: Client) => option.id}
        getOptionValue={(option: Client) => option.id}
        onChange={handleSelectChange}
        placeholder="Select a client"
        styles={{
          control: (base, props) => ({
            ...base,
            width: '400px',
            backgroundColor: '#282c34;',
          }),
          menuList: (base, props) => ({
            ...base,
            backgroundColor: 'black',
          }),
          option: (base, props) => ({
            ...base,
            backgroundColor: 'black',
          }),
          placeholder: (base, props) => ({
            ...base,
            color: 'white',
          }),
          singleValue: (base, props) => ({
            ...base,
            color: 'white',
          }),
          input: (base, props) => ({
            ...base,
            color: 'white',
          }),
        }}
      />
      {selectedId && <ResultTableComponent factory_id={props.factory_id} client_id={selectedId} />}
    </>
  );
}

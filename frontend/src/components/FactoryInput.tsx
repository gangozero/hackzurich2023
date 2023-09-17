import { useState, useEffect } from 'react';
import Select from 'react-select';
import { Factory } from '../types';
import { ClientInput } from './ClientInput';

export const FactoryInput = () => {
  const [options, setOptions] = useState<Factory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/factory')
      .then(response => response.json())
      .then(data => {
        setOptions(data);
        setIsLoading(false);
      });
  }, []);

  // function handleSelectChange(event: any) {
  //   setSelectedId(event.target.value);
  // }
  function handleSelectChange(selectedOption: any) {
    setSelectedId(selectedOption.id);
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <Select
            options={options}
            getOptionLabel={(option: Factory) => option.name}
            getOptionValue={(option: Factory) => option.id}
            onChange={handleSelectChange}
            placeholder="Select a factory"
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
          {selectedId && <ClientInput factory_id={selectedId} />}
        </>
      )}
    </>
  );
}

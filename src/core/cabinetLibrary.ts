import type { CabinetTemplate } from '../types';

const FILE_NAME = 'szafki.json';

interface CabinetsFile {
  version: 1;
  cabinets: CabinetTemplate[];
}

export function downloadCabinetsFile(
  cabinets: CabinetTemplate[]
): void {
  const data: CabinetsFile = {
    version: 1,
    cabinets
  };

  const json = JSON.stringify(data, null, 2);

  const blob = new Blob(
    [json],
    { type: 'application/json;charset=utf-8' }
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = FILE_NAME;
  link.click();

  URL.revokeObjectURL(url);
}

export function readCabinetsFile(
  file: File
): Promise<CabinetTemplate[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const data = JSON.parse(
          String(reader.result)
        ) as CabinetsFile;

        if (
          !data ||
          data.version !== 1 ||
          !Array.isArray(data.cabinets)
        ) {
          throw new Error(
            'Nieprawidłowy plik szafki.json'
          );
        }

        resolve(data.cabinets);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(
        new Error('Nie można odczytać pliku szafki.json')
      );
    };

    reader.readAsText(file);
  });
}
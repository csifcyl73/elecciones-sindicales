import https from 'https';
import fs from 'fs';

const url = 'https://raw.githubusercontent.com/IagoLast/pselect/master/data/municipios.json';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      if (data && data.length > 1000) {
        fs.writeFileSync('public/municipios.json', data);
        console.log('✅ Municipios descargados con éxito: ' + data.length + ' bytes');
      } else {
        console.error('❌ Data too small or empty');
      }
    } catch(err) {
      console.error(err);
    }
  });
}).on('error', err => console.error(err));

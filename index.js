const fs = require("fs");
const pdfParse = require("pdf-parse");
const path = require("path");
const XLSX = require("xlsx");

// Función para extraer municipios desde el PDF
function extraerMunicipiosDesdePDF(text) {
  const municipios = {};

  // Dividir el texto por líneas
  const lineas = text.split("\n");

  // Recorrer cada línea y buscar municipios y códigos
  lineas.forEach((linea) => {
    // Suponiendo que el formato es: "Nombre Municipio Código"
    const match = linea.trim().match(/^(\d{5})([A-Za-zÁÉÍÓÚáéíóú\s]+)/);
    if (match) {
      console.log("linea: ", linea);

      const codigoMunicipio = parseInt(match[1].trim(), 10);
      const nombreMunicipio = match[2].trim();
      municipios[nombreMunicipio] = codigoMunicipio;
    }
  });

  return municipios;
}

// Función para procesar el PDF
async function procesarPDF(rutaPDF) {
  try {
    const dataBuffer = fs.readFileSync(rutaPDF);
    const data = await pdfParse(dataBuffer);
    // console.log("pdf ", data);

    // Extraer los municipios del texto del PDF
    const municipios = extraerMunicipiosDesdePDF(data.text);

    // Imprimir el resultado
    for (const [nombre, codigo] of Object.entries(municipios)) {
      console.log(`'${nombre}' => ${codigo},`);
    }
  } catch (error) {
    console.error("Error procesando el PDF:", error);
  }
}

/**
 * Función para extraer datos de un archivo Excel y convertirlos en un array PHP
 * @param {string} inputFilePath - Ruta del archivo Excel de entrada.
 * @param {string} outputFilePath - Ruta del archivo PHP de salida.
 */
function extractExcelToPHPArray(inputFilePath, outputFilePath) {
  try {
    // Lee el archivo Excel
    const workbook = XLSX.readFile(inputFilePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convierte la hoja de Excel a JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Usa un Set para almacenar códigos únicos
    const uniqueCodes = new Set();
    // Transforma los datos en un array de PHP
    let phpArray = "array(\n";
    jsonData.forEach((row) => {
      if (row["Nombre Municipio"] && row["Código Municipio"]) {
        const codigoMunicipio = parseInt(row["Código Municipio"]);
        // Si no está, lo agregamos al Set y al string PHP
        if (!uniqueCodes.has(codigoMunicipio)) {
          uniqueCodes.add(codigoMunicipio);
          phpArray += `'${row["Nombre Municipio"].toUpperCase()}' => ${parseInt(
            row["Código Municipio"]
          )},\n`;
        }
      }
    });
    phpArray += ");";

    // Guarda el array en un archivo PHP
    fs.writeFileSync(outputFilePath, phpArray);

    console.log(
      `Array PHP generado correctamente en el archivo ${outputFilePath}`
    );
  } catch (error) {
    console.error("Error al procesar el archivo Excel:", error);
  }
}

// Ruta al archivo PDF
const rutaPDF = path.resolve(__dirname, "codigos_municipios_dane.pdf");

// Ejecutar el procesamiento
// procesarPDF(rutaPDF);

const rutaExcel = path.resolve(__dirname, "Información_INCAD Paises.xlsx");
console.log(rutaExcel);

extractExcelToPHPArray(rutaExcel, "./municipios.php");

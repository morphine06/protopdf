
const { protopdf } = require('./lib/index');
const fs = require('fs');

// let xml = fs.readFileSync('test/test.xml', 'utf8');
// protopdf(xml, {
//     invoice: {
//         type: "Facture",
//         duplicata: true,
//         num: "20240701-0001",
//         date: "01/07/2024",
//         totalht: 130,
//         totalttc: 150,
//         totalport: 10,
//         totalremise: 0,
//         totalnet: 0,
//         paymentremaining: 150,
//         customer: {
//             code: "C001",
//             name: "CustomerName",
//             address: "CustomerAddress1\nCustomerAddress2",
//             city: "CustomerCity",
//             zip: "CustomerZip",
//             country: "CustomerCountry",
//         },
//         tvas: [
//             { rate: 20, base: 130, amount: 26 },
//             { rate: 10, base: 130, amount: 13 },
//         ],
//         lines: [
//             { desc: "Line 1 Line 1 Line 1 Line 1 Line 1 Line 1 Line 1 Line 1 Line 1 Line 1 Line 1 Line 1 Line 1 Line 1 Line 1 Line 1 Line 1 Line 1 Line 1 Line 1 Line 1 Line 1 Line 1 Line 1 Line 1 Line 1 Line 1 Line 1 Line 1 Line 1 Line 1 Line 1 Line 1 Line 1 Line 1 Line 1 ", qty: 2, priceunity: 10, pricetotal: 20, pricenet: 0, qrcode: "https://www.google.com" },
//             { desc: "Line 2", qty: 1, priceunity: 20, pricetotal: 20, pricenet: 0, qrcode: "https://www.google.com" },
//             { desc: "Line 3", qty: 3, priceunity: 30, pricetotal: 90, pricenet: 0, qrcode: "https://www.google.com" },
//             { desc: "Line 1", qty: 2, priceunity: 10, pricetotal: 20, pricenet: 0, qrcode: "https://www.google.com" },
//             { desc: "Line 2", qty: 1, priceunity: 20, pricetotal: 20, pricenet: 0, qrcode: "https://www.google.com" },
//             { desc: "Line 3", qty: 3, priceunity: 30, pricetotal: 90, pricenet: 0, qrcode: "https://www.google.com" },
//             { desc: "Line 1", qty: 2, priceunity: 10, pricetotal: 20, pricenet: 0, qrcode: "https://www.google.com" },
//             { desc: "Line 2", qty: 1, priceunity: 20, pricetotal: 20, pricenet: 0, qrcode: "https://www.google.com" },
//             { desc: "Line 3", qty: 3, priceunity: 30, pricetotal: 90, pricenet: 0, qrcode: "https://www.google.com" },
//             { desc: "Line 1", qty: 2, priceunity: 10, pricetotal: 20, pricenet: 0, qrcode: "https://www.google.com" },
//             { desc: "Line 2", qty: 1, priceunity: 20, pricetotal: 20, pricenet: 0, qrcode: "https://www.google.com" },
//             { desc: "Line 3", qty: 3, priceunity: 30, pricetotal: 90, pricenet: 0, qrcode: "https://www.google.com" },
//         ],
//     }
// }).toFile('test/test.pdf');


let xml = `
<document>
    <styles>
        <style name="title" size="30" font="Helvetica" />
        <style name="standard" size="11" font="Helvetica" color="black" />
    </styles>

    <page size="A4" layout="portrait" margins="{ top: 0, bottom: 0, left: 0, right: 0 }">
        <text style="title" x='50' y='50'>Hello, {{name}}!</text>
        <declare var="posY" val="{{lastY}}+20" />
        <text style="standard" x='50' y='{{posY}}'>
            This is a PDF
            generated from XML.
        </text>
        <rect x='40' y='{{posY}}-10' w='200' h='{{lastY}} - {{posY}} + 15' strokeColor='red' />
    </page>
</document>
`;

// or get the XML from a file
// let xml = fs.readFileSync('test/test.xml', 'utf8');

protopdf(xml, {
    name: "protopdf",
    invoice: {
        type: "Invoice",
        num: "20240701-0001",
        date: "01/07/2024",
        totalht: 130,
    }
}).toFile('test/test.pdf')

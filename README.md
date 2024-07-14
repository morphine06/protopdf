# protopdf

Describe your PDF template in a simple XML format (with styles, variables, loops, and conditions) and generate a PDF from it. 
You can create complex layouts with text, images, QR codes, barcodes, and vector graphics. Create invoices, reports, certificates, and more, now !

> **This project is in early development stage.**
> Feel free to contribute.

## Installation

```bash
npm install protopdf
```

## Usage

```javascript
const { protopdf } = require('protopdf');

let xml = `
<document>
    <styles>
        <style name="title" size="30" font="Helvetica-Bold" />
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
    name: 'protopdf'
}).toFile('test/test.pdf')

// or get the PDF as a data URL
// .toDataURL().then(dataUrl => {
//     console.log(dataUrl);
// });

// or stream it to HTTP response
// .toStream(res)
```

#### and the result will be:

<img src="firstsample.png" alt="Result" width="300"/>


## Quick jump
- [protopdf](#protopdf)
  - [Installation](#installation)
  - [Usage](#usage)
      - [and the result will be:](#and-the-result-will-be)
  - [Quick jump](#quick-jump)
  - [XML Syntax](#xml-syntax)
    - [Document](#document)
    - [Styles](#styles)
    - [Page](#page)
    - [Text](#text)
    - [Image](#image)
    - [QRCode](#qrcode)
    - [Barcode](#barcode)
    - [Paths](#paths)
    - [Line (vector graphic)](#line-vector-graphic)
    - [Rect (vector graphic)](#rect-vector-graphic)
    - [RoundedRect (vector graphic)](#roundedrect-vector-graphic)
    - [Ellipse (vector graphic)](#ellipse-vector-graphic)
    - [Circle (vector graphic)](#circle-vector-graphic)
    - [NewPage](#newpage)
    - [Declare](#declare)
    - [If](#if)
    - [For](#for)
    - [Variables](#variables)
      - [Special variable `lastY`](#special-variable-lasty)
  - [Sample for a complexe invoice](#sample-for-a-complexe-invoice)
  - [To do](#to-do)

## XML Syntax

> This library use pdfkit ([https//pdfkit.org](https://pdfkit.org/)) to generate the PDF. You can use all the pdfkit parameters in the XML attributes for text and image elements.

### Document

The document is the root element of the XML file. It contain the others elements. It is required and unique.

```xml
<document>
    <!-- other elements -->
</document>
```

### Styles

The styles element contains the styles that can be used in the document. Each style has a name and can have the following attributes: 
- `name` (string) required, a unique name for the style,
- `size` (number) default: 12, a font size,
- `font` (string) default: "Helvetica", one of : 'Courier', 'Courier-Bold', 'Courier-Oblique', 'Courier-BoldOblique', 'Helvetica', 'Helvetica-Bold', 'Helvetica-Oblique', 'Helvetica-BoldOblique', 'Symbol', 'Times-Roman', 'Times-Bold', 'Times-Italic', 'Times-BoldItalic', 'ZapfDingbats'
- `color` (string) default: "black", a color in hexadecimal format or a HTML color name,
- `opacity` (number) default: 1.

```xml
<styles>
    <style name="title" size="30" font="Helvetica" />
    <style name="standard" size="11" font="Helvetica" color="black" />
</styles>
```

### Page

The page element represents a page in the PDF. You can put multiple pages in the document. It can have the following attributes:
- `size` (string) default: "A4",
- `layout` (string) default: "portrait",
- `margins` (object) default: { top: 0, bottom: 0, left: 0, right: 0 }.

```xml
<page size="A4" layout="portrait" margins="{ top: 0, bottom: 0, left: 0, right: 0 }">
    <!-- other elements -->
</page>
```

### Text

The text element represents a text in the PDF. It can have the following attributes:
- `style` (string) required, a style name defined in the styles element
- `x` (number) required, the x position of the text,
- `y` (number) required, the y position of the text,
- `width` (number) default: 0, the width of bounding box
- `height` (number) default: 0, the height of bounding box ; the text will be clipped if it is too long
- `align` (string) default: "left", the text alignment: "left", "center", "right". `width` must be set.
- `lineGap` (number) default: 0, the gap between lines ; negative values are allowed.
- `columns` (number) default: 1, the number of columns. `width` must be set.
- `columnGap` (number) default: 0, the gap between columns. `columns` must be set.

> This library use pdfkit ([https//pdfkit.org](https://pdfkit.org/)) to generate the PDF. You can use all the pdfkit parameters in the XML attributes for text and image elements.


```xml
<text style="title" x='50' y='50'>Hello, {{name}}!</text>
```

> Go to [special variable `lastY`](#special-variable-lasty) to see how to use the special variable `lastY`. It's useful to calculate the position of the next text.


### Image

The image element represents an image in the PDF. It can have the following attributes:
- `x` (number) required, the x position of the image,
- `y` (number) required, the y position of the image,
- `src` (string) required, the path to the image file or a data URL,
- `width` (number), the width of the image.
- `height` (number), the height of the image.

> This library use pdfkit ([https//pdfkit.org](https://pdfkit.org/)) to generate the PDF. You can use all the pdfkit parameters in the XML attributes for text and image elements.

```xml
<image x="50" y="50" src="test/logo.png" width="100" />
```


### QRCode

The qrcode element represents a QR code in the PDF. It can have the following attributes:

- `x` (number) required, the x position of the QR code,
- `y` (number) required, the y position of the QR code,
- `value` (string) required, the value of the QR code,
- `options` (object) default: {}, the options of the QR code (see [https://www.npmjs.com/package/qrcode#qr-code-options](https://www.npmjs.com/package/qrcode#qr-code-options)),

```xml
<qrcode x="50" y="50" value="'{{invoice.qrcode}}'" options="{ background: '#4b8b7f' }" width="100" />
```

### Barcode

The barcode element represents a barcode in the PDF. It can have the following attributes:

- `x` (number) required, the x position of the barcode,
- `y` (number) required, the y position of the barcode,
- `value` (string) required, the value of the barcode,
- `width` (number), the width of the barcode,
- `options` (object) default: {}, the options of the barcode (see [https://www.npmjs.com/package/jsbarcode#options](https://www.npmjs.com/package/jsbarcode#options)),

```xml
<barcode x="50" y="50" value="'{{invoice.barcode}}'" width="100" options="{ fontSize: 40, background: '#4b8b7f', lineColor: '#ffffff', margin: 40, marginLeft: 80 }" />
```

### Paths

The paths element represents a set of paths in the PDF. **It pratices to set default attributes for elements inside**. It can contain `line`, `rect`, `roundedRect`, `ellipse`, `circle` elements. It can have the following attributes:
- `lineWidth` (number) default: 1, the width of the lines,
- `strokeColor` (string) default: "black", the color of the lines,
- `fillColor` (string), the color of the fill.

```xml
<paths lineWidth="0.5" strokeColor="#585858">
    <line x="50" y="50" dx="100" dy="0" />
    <rect x="50" y="50" w="100" h="100" />
    <roundedRect x="50" y="50" w="100" h="100" radius="10" />
    <ellipse x="50" y="50" w="100" h="100" />
    <circle x="50" y="50" w="100" />
</paths>
```

### Line (vector graphic)

The line element represents a line in the PDF. It can have the following attributes:
- `x` (number) required, the x position of the line,
- `y` (number) required, the y position of the line,
- `dx` (number) required, the x distance of the line,
- `dy` (number) required, the y distance of the line.

```xml
<line x="50" y="50" dx="100" dy="0" />
```

### Rect (vector graphic)

The rect element represents a rectangle in the PDF. It can have the following attributes:
- `x` (number) required, the x position of the rectangle,
- `y` (number) required, the y position of the rectangle,
- `w` (number) required, the width of the rectangle,
- `h` (number) required, the height of the rectangle.

```xml
<rect x="50" y="50" w="100" h="100" />
```

### RoundedRect (vector graphic)

The roundedRect element represents a rounded rectangle in the PDF. It can have the following attributes:
- `x` (number) required, the x position of the rectangle,
- `y` (number) required, the y position of the rectangle,
- `w` (number) required, the width of the rectangle,
- `h` (number) required, the height of the rectangle,
- `radius` (number) required, the radius of the corners.

```xml
<roundedRect x="50" y="50" w="100" h="100" radius="10" />
```

### Ellipse (vector graphic)

The ellipse element represents an ellipse in the PDF. **x, y, w, h represent the bouding box of the ellipse**. It can have the following attributes:
- `x` (number) required, the x position of the ellipse,
- `y` (number) required, the y position of the ellipse,
- `w` (number) required, the width of the ellipse,
- `h` (number) required, the height of the ellipse.

```xml
<ellipse x="50" y="50" w="100" h="100" />
```

### Circle (vector graphic)

The circle element represents a circle in the PDF. **x, y, w represent the bounding box of the circle**. It can have the following attributes:
- `x` (number) required, the x position of the circle,
- `y` (number) required, the y position of the circle,
- `w` (number) required, the width of the circle (the diameter).

```xml
<circle x="50" y="50" w="100" />
```

### NewPage

The newpage element represents a new page in the PDF.

```xml
<newpage />

<!-- or with a condition (useful in a loop) -->
<if condition="{{lastY}}>500">
    <newpage />
</if>
```

### Declare

The declare element represents a variable declaration or modification. It's useful to store a value and use it later.

- `var` (string) required, the name of the variable,
- `val` (string) required, the value of the variable.

```xml
<declare var="posY" val="50" />
```
> You can use a special variable `lastY` to get the last Y position of text for example.

```xml
<declare var="posY" val="{{lastY}}+20" />
```

### If

The if element represents a conditional block. It can have the following attribute:
- `condition` (string) required, the condition to evaluate.

```xml
<if condition="{{invoice.total}}>0">
    <text style="standard" x='275' y='{{posY}}' align="right" width="158">Total : {{invoice.total}}</text>
</if>

<!-- if variable is a string, you can use the backticks to evaluate it as a string. -->
<if condition="`{{invoice.type}}`=='Credit note'">
    <text style="standard" x='50' y='50'>Credit Note</text>
</if>
```

### For

The for element represents a loop block. It can have the following attributes:

- `var` (string) required, the name of the array to loop through.
- `as` (string) required, the name of the variable to store the current value,

```xml
<for var="invoice.lines" as="line">
    <text x="50" y="{{posY}}" style="standard">{{line.desc}}</text>
    <declare var="posY" val="{{lastY}}+20" />
</for>
```

### Variables

You can use variables in the XML using the double curly braces syntax `{{value}}`. The value can be a string, a number, a boolean or an object. You can access to nested values using the dot syntax `{{object.value}}`.

```xml
<text style="title" x='50' y='{{posY}}'>Hello, {{name}}!</text>
```
#### Special variable `lastY`
A special variable `lastY` is available to get the last Y position of text for example.

```xml
<declare var="posY" val="{{lastY}}+20" />
```



## Sample for a complexe invoice

```xml
Coming soon...
```

```javascript

const { protopdf } = require('./lib/index');

protopdf('test/test.xml', {
    invoice: {
        type: "Facture",
        duplicata: true,
        num: "20240701-0001",
        date: "01/07/2024",
        totalht: 130,
        totalttc: 150,
        totalport: 10,
        customer: {
            code: "C001",
            name: "CustomerName",
            address: "CustomerAddress1\nCustomerAddress2",
            city: "CustomerCity",
            zip: "CustomerZip",
            country: "CustomerCountry",
        },
        tvas: [
            { rate: 20, base: 130, amount: 26 },
            { rate: 10, base: 130, amount: 13 },
        ],
        lines: [
            { desc: "Line 1", qty: 2, priceunity: 10, pricetotal: 20, qrcode: "1234" },
            { desc: "Line 2", qty: 1, priceunity: 20, pricetotal: 20, qrcode: "1234" },
            { desc: "Line 3", qty: 3, priceunity: 30, pricetotal: 90, qrcode: "1234" },
            { desc: "Line 1", qty: 2, priceunity: 10, pricetotal: 20, qrcode: "1234" },
            { desc: "Line 2", qty: 1, priceunity: 20, pricetotal: 20, qrcode: "1234" },
            { desc: "Line 3", qty: 3, priceunity: 30, pricetotal: 90, qrcode: "1234" },
            { desc: "Line 1", qty: 2, priceunity: 10, pricetotal: 20, qrcode: "1234" },
            { desc: "Line 2", qty: 1, priceunity: 20, pricetotal: 20, qrcode: "1234" },
            { desc: "Line 3", qty: 3, priceunity: 30, pricetotal: 90, qrcode: "1234" },
            { desc: "Line 1", qty: 2, priceunity: 10, pricetotal: 20, qrcode: "1234" },
            { desc: "Line 2", qty: 1, priceunity: 20, pricetotal: 20, qrcode: "1234" },
            { desc: "Line 3", qty: 3, priceunity: 30, pricetotal: 90, qrcode: "1234" },
        ],
    }
}).toFile('test/test.pdf');
```


## To do

- [ ] Use other fonts
- [ ] Add `<section name="">` element and `<section render="">` to reuse elements
- [ ] Add origin attribute to set the origin of the coordinates `<origin type="translate" x="100" y="100" />` `<origin type="rotate" angle="45" />` `<origin type="scale" x="1.5" y="1.5" />` `<origin type="reset" />`
- [ ] For ellipse and circle, use the center of the shape instead of the bounding box
- [ ] Add `angle` attribute to rotate elements
- [ ] Add `clip` attribute to clip elements
- [ ] Ameliorate the `<b>xxx</b>` syntax to bold text
- [ ] Warning if a variable is not defined
- [ ] Warning : loop define a variable in the root data... bof bof
- [ ] Support linearGradient and radialGradient
- [ ] Loop through arrays of objects
- [ ] Check attributes and values
- [ ] Add `<include src="">` element to include another XML file
- [ ] Add more examples
- [ ] Create tests

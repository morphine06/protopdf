/*
warning: remplacer eval() par Function() pour la sécurité

ToDo : pouvoir charger une police de caractère
ToDo : vérifier les valeurs des attributs obligatoire dans vectorGraphics
ToDo : pour elipses et cercles, ajouter les attributs "centerX", "centerY", "radiusX", "radiusY"
ToDo : pouvoir déplacer le repère <origin type="translate" x="100" y="100" /> <origin type="rotate" angle="45" /> <origin type="scale" x="1.5" y="1.5" /> <origin type="reset" />
TODO : ajouter un attribut "angle" dans vectorGraphics
ToDo : attention, les boucles "for" pourraient remplacer des variables dans data !! (il serait préférable de créer un objet temporaire)
ToDo : améliorer le bold et italic !!!! Tout refaire !!!
ToDo: supporter linearGradient et radialGradient
ToDO : ajouter des <section name=""> et des <section render=""> pour pouvoir réutiliser des sections de code
ToDo : ajouter des <include src=""> pour inclure un autre fichier xml
*/

const fs = require('fs');
const xmldoc = require('xmldoc');
const pdfkit = require('pdfkit');
const e = require("express");
const { get } = require("http");
const QRCode = require('qrcode')
const JsBarcode = require('jsbarcode');
const { createCanvas } = require("canvas");
// var blobStream = require('blob-stream');
// let DEBUG = true;

function protopdf(xml, data, fonts) {

    // let xml;
    // try {
    //     xml = fs.readFileSync(xmlPath, 'utf8');
    // } catch (e) {
    //     console.log("ERROR reading file", e)
    //     throw e;
    // }
    let documentNode;
    try {
        documentNode = new xmldoc.XmlDocument(xml);
        // if (DEBUG) fs.writeFileSync('test/test.json', JSON.stringify(documentNode, null, 2));
    } catch (e) {
        console.log("ERROR parsing xml", e)
        throw e;
    }
    return {
        async toFile(pdfPath) {
            await generatePdf(documentNode, data, 'tofile', pdfPath);
        },
        async toDataURL() {
            return await generatePdf(documentNode, data, 'todataurl');
        },
        async toStream(res) {
            await generatePdf(documentNode, data, 'tostream', res);
        }
    }
}



async function generatePdf(documentNode, data, where, whereOptions) {
    let styles = {};

    if (stylesNode = documentNode.childNamed("styles")) {
        let styleNodes = stylesNode.childrenNamed("style");
        for (let i = 0; i < styleNodes.length; i++) {
            let attrs = getAttributes(styleNodes[i].attr, data);
            styles[styleNodes[i].attr.name] = attrs; //{font:tabStyles[i].$.font, size:tabStyles[i].$.size} ;
        }
    }
    let pdf = null, stream = null;
    let pageNodes = documentNode.childrenNamed("page");
    for (let i = 0; i < pageNodes.length; i++) {
        data._indexFor = 0;
        data.lastY = 0;
        let attrs = getAttributes(pageNodes[i].attr, data);
        data._lastPageAttrs = attrs;
        if (pdf === null) {
            pdf = new pdfkit(attrs);
            if (where == 'todataurl') {
                // stream = pdf.pipe(blobStream());
                pdf.pipe(fs.createWriteStream('output.pdf'));
            }
            if (where == 'tofile') {
                pdf.pipe(fs.createWriteStream(whereOptions));
            }
            if (where == 'tostream') {
                stream = pdf.pipe(whereOptions);
            }
            pdf.save();
        }
        else pdf.addPage(attrs);
        await goNode(pageNodes[i], pdf, styles, data)
    }

    if (pdf) {
        pdf.end();
        if (where == 'todataurl') {
            return new Promise((resolve, reject) => {
                let buffers = [];
                pdf.on('data', function (chunk) {
                    // console.log("🚀 ~ chunk:", chunk)
                    buffers.push(chunk);
                });
                pdf.on('end', () => {
                    let pdfData = Buffer.concat(buffers);
                    resolve('data:application/pdf;base64,' + pdfData.toString('base64'));
                });
            });
            // return new Promise((resolve, reject) => {
            //     stream.on('finish', function () {
            //         let url = stream.toBlobURL('application/pdf');
            //         console.log("🚀 ~ url:", url, stream)
            //         resolve(url);
            //     });
            // });
        }
    }
}

function getAttributes(attrs, data) {
    let attrsRet = {};
    for (let opt in attrs) {
        attrsRet[opt] = attrs[opt];
        if (attrs[opt].indexOf("{") === 0 && attrs[opt].substr(1, 1) !== "{") attrsRet[opt] = eval('(' + attrs[opt] + ')');
        else if (attrs[opt].indexOf("[") === 0) attrsRet[opt] = eval('(' + attrs[opt] + ')');
        else if (!isNaN(attrs[opt])) attrsRet[opt] = attrs[opt] * 1;
        else if (attrs[opt] == 'true') attrsRet[opt] = true;
        else if (attrs[opt] == 'false') attrsRet[opt] = false;
        else if (typeof attrs[opt] === "string" && attrs[opt].indexOf("{{") >= 0) {
            let temp = replaceVarsIn(attrs[opt], data);
            attrsRet[opt] = eval("(" + temp + ")");
        }
    }
    return attrsRet;
}
function setVar(what, data, val) {
    // console.log('what, val', what, val);
    let whatSplitted = what.split(".");
    whatSplitted = whatSplitted.map((w) => w.trim());
    let cur = data;
    for (let j = 0; j < whatSplitted.length - 1; j++) {
        if (!cur[whatSplitted[j]]) cur[whatSplitted[j]] = {};
        cur = cur[whatSplitted[j]];
    }
    cur[whatSplitted[whatSplitted.length - 1]] = val;
    // console.log('data[]', data[what]);
}
function getVar(what, data) {
    let whatSplitted = what.split(".");
    whatSplitted = whatSplitted.map((w) => w.trim());
    let cur = data[whatSplitted[0]];
    if (cur === undefined) {
        return undefined;
    } else {
        for (let j = 1; j < whatSplitted.length; j++) {
            cur = cur[whatSplitted[j]];
            if (cur === undefined) {
                return undefined;
            }
        }
    }
    return cur;
}

function replaceVarsIn(txt, data) {
    if (txt.indexOf("{{") >= 0 && txt.indexOf("}}") >= 0) {
        // let reg = new RegExp(/{{(.*?)}}/g);
        let f = txt.match(/{{(.*?)}}/g)
        if (!f) {
            return txt;
        }
        for (let i = 0; i < f.length; i++) {
            let what = f[i].substr(2, f[i].length - 4);
            let cur = getVar(what, data);
            if (cur === undefined) cur = f[i];
            txt = txt.replace(f[i], cur);
            // console.log("🚀 ~ txt:", f[i], cur)
        }
    }

    // txt = txt.replace(/{{today}}/g, utils.formatDate(new Date(), 'd/m/Y'));
    return txt;
}

function applyStyle(pdf, style) {
    // currentStyle = style;
    let s = style;
    if (s.font) pdf.font(s.font);
    if (s.size) pdf.fontSize(s.size * 1);
    if (s.color) pdf.fillColor(s.color);
    if (s.opacity) pdf.fillOpacity(s.opacity * 1);
    return style;
}

function vectorGraphics(pdf, node, attrs) {
    let tabFunctions = [["lineWidth", 1], ["lineCap", 'butt'], ["lineJoin", 'miter'], ["miterLimit", ''], ["dash", 0], ["fillColor", ''], ["strokeColor", ''], ["opacity", 1], ["fillOpacity", 1], ["strokeOpacity", 1]];
    for (let i = 0; i < tabFunctions.length; i++) {
        if (attrs[tabFunctions[i][0]] != undefined) {
            if (tabFunctions[i][0] == "dash" && attrs[tabFunctions[i][0]] * 1 <= 0) pdf.undash();
            else pdf[tabFunctions[i][0]](attrs[tabFunctions[i][0]]);
        } else {
            if (tabFunctions[i][0] == "dash") pdf.undash();
            else pdf[tabFunctions[i][0]](tabFunctions[i][1]);
        }
    }
    // console.log('attrs', attrs);

    if (node.name == "rect") {
        // console.log('attrs', attrs);
        pdf.rect(attrs.x * 1, attrs.y * 1, attrs.w * 1, attrs.h * 1);
    }
    if (node.name == "roundedRect") {
        pdf.roundedRect(attrs.x * 1, attrs.y * 1, attrs.w * 1, attrs.h * 1, attrs.radius * 1);
    }
    if (node.name == "line") {
        pdf.moveTo(attrs.x * 1, attrs.y * 1);
        pdf.lineTo(attrs.x * 1 + attrs.dx * 1, attrs.y * 1 + attrs.dy * 1);
    }
    if (node.name == "ellipse") {
        pdf.ellipse(
            attrs.x * 1 + (attrs.w * 1 / 2), // centerX
            attrs.y * 1 + (attrs.h * 1 / 2), // centerY
            attrs.w * 1 / 2, // radiusX
            attrs.h * 1 / 2 // radiusY
        );
    }
    if (node.name == "circle") {
        pdf.circle(
            attrs.x * 1 + (attrs.w * 1 / 2),
            attrs.y * 1 + (attrs.w * 1 / 2),
            attrs.w * 1 / 2
        );
    }
    if (node.name == "polygon") {
        pdf.path(attrs.path);
    }

    if (attrs.strokeColor && attrs.fillColor) pdf.fillAndStroke();
    else if (attrs.fillColor) pdf.fill();
    else if (attrs.strokeColor) pdf.stroke();
}


async function goNode(node, pdf, styles, data) {
    if (!data) data = {};
    let children = []
    node.eachChild(async function (child, index, array) {
        children.push(child);
    });
    for (let iChild = 0; iChild < children.length; iChild++) {
        let child = children[iChild];
        // console.log('child.name', child.name);
        if (child.name == "pagebreak") {
            pdf.addPage(data._lastPageAttrs);

            data.lastX = 0;
            data.lastY = 0;
        }
        if (child.name == "declare") {
            if (child.attr.var == "index") {
                data._indexFor = child.attr.val * 1;
            } else {
                let attrsTemp = getAttributes(child.attr, data);
                setVar(child.attr.var, data, attrsTemp.val);
                // console.log('data.posY', data.posY);
                // data[child.attr.var] = attrsTemp.val;
            }
        }
        if (child.name == "text") {
            let attrs = getAttributes(child.attr, data);
            if (attrs.style && styles[attrs.style]) {
                let currentStyle = applyStyle(pdf, styles[attrs.style]);
                setVar("_currentStyle", data, currentStyle);
            }

            let txt = child.val;
            // txt = txt.trim();
            txt = txt.replace(/\t/gi, '');
            txt = replaceVarsIn(txt, data);
            // currentStyles = "";
            attrs.continued = false;
            let partsTextOk = [];
            let partsTextLines = txt.split("\n");
            partsTextLines = partsTextLines.map((p) => p.trim());
            let partsText = partsTextLines.join('\n').split(" ");
            let indexParts = 0;
            let indexesBold = [];
            for (let k = 0; k < partsText.length; k++) {
                if (partsText[k] == "%b%") {
                    indexParts++;
                    indexesBold.push(indexParts);
                } else if (partsText[k] == "%/b%") indexParts++;
                else {
                    if (!partsTextOk[indexParts]) partsTextOk[indexParts] = "";
                    partsTextOk[indexParts] += partsText[k] + " ";
                }
            }
            attrs.continued = false;
            if (partsTextOk.length > 1) {
                // pdf.text("A", x, y, attrs);
                attrs.continued = true;
            }
            for (let k = 0; k < partsTextOk.length; k++) {
                if (indexesBold.indexOf(k) >= 0 && data._currentStyle.fontBold) {
                    pdf.font(data._currentStyle.fontBold);
                } else {
                    pdf.font(data._currentStyle.font);
                }
                let valToPrint = partsTextOk[k];
                valToPrint = valToPrint.trim();
                valToPrint = valToPrint.replace(/\r/gi, '');
                valToPrint = valToPrint.replace(/\\n/gi, '\n');
                // console.log("🚀 ~ valToPrint:", valToPrint)
                if (((attrs.x !== null || attrs.y !== null) && !attrs.continued) || k == 0) {
                    pdf.text(valToPrint, attrs.x, attrs.y, attrs);
                } else {
                    pdf.text(valToPrint, attrs);
                }
            }

            data.lastX = pdf.x;
            data.lastY = pdf.y;
        }

        if (child.name == "image") {
            let attrs = getAttributes(child.attr, data);
            try {
                // if (x !== null) {
                pdf.image('' + attrs.src, attrs.x * 1, attrs.y * 1, attrs);
                // } else {
                //     pdf.image('' + child.attr.src, attrs);
                // }
            } catch (e) {
                console.log("ERROR image", e)
            }

            data.lastX = pdf.x;
            data.lastY = pdf.y;
        }

        if (child.name == "br") {
            pdf.moveDown();
            data.lastX = pdf.x;
            data.lastY = pdf.y;
        }

        if (child.name == "if") {
            let ok = false;
            let attrs = getAttributes(child.attr, data);
            if (attrs.condition) await goNode(child, pdf, styles, data);
        }

        if (child.name == "for") {
            let tab = getVar(child.attr.var, data);
            if (tab && Array.isArray(tab)) {
                data._indexFor = 0;
                for (let i = 0; i < tab.length; i++) {
                    data[child.attr.as] = tab[i];
                    await goNode(child, pdf, styles, data);
                    data._indexFor++;
                }
            }
        }

        if (child.name == "paths") {
            let attrsPaths = getAttributes(child.attr, data);
            child.eachChild(function (childPath, indexPath, arrayPath) {
                let attrs = getAttributes(childPath.attr, data);
                attrs = { ...attrsPaths, ...attrs };
                // console.log("🚀 ~ attrs:", attrs)
                vectorGraphics(pdf, childPath, attrs);

            });
        }

        if (child.name == "rect" || child.name == "roundedRect" || child.name == "line" || child.name == "ellipse" || child.name == "circle" || child.name == "polygon") {
            let attrs = getAttributes(child.attr, data);
            // console.log("🚀 ~ attrs:", attrs)
            vectorGraphics(pdf, child, attrs);

            data.lastX = pdf.x;
            data.lastY = pdf.y;
        }

        if (child.name == "qrcode") {
            let attrs = getAttributes(child.attr, data);
            if (!attrs.options) attrs.options = {};
            let qrcode = await QRCode.toDataURL(attrs.value, attrs.options);
            pdf.image(qrcode, attrs.x * 1, attrs.y * 1, attrs);

            data.lastX = pdf.x;
            data.lastY = pdf.y;
        }

        if (child.name == "barcode") {
            let attrs = getAttributes(child.attr, data);
            // let qrcode = await QRCode.toDataURL(attrs.value);
            var canvas = createCanvas();
            if (!attrs.options) attrs.options = {};
            JsBarcode(canvas, attrs.value, attrs.options);
            pdf.image(canvas.toDataURL(), attrs.x * 1, attrs.y * 1, attrs);

            data.lastX = pdf.x;
            data.lastY = pdf.y;
        }

        if (child.name == "origin") {
            let attrs = getAttributes(child.attr, data);
            console.log("🚀 ~ goNode ~ attrs:", attrs)
            if (attrs.type == "translate") pdf.translate(attrs.dx * 1, attrs.dy * 1);
            if (attrs.type == "rotate") {
                if (attrs.origin) pdf.rotate(attrs.angle * 1, { origin: attrs.origin });
                else pdf.rotate(attrs.angle * 1);
            }
            if (attrs.type == "scale") {
                if (attrs.origin) pdf.scale(attrs.factor * 1, { origin: attrs.origin });
                else pdf.scale(attrs.factor);
            }
            if (attrs.type == "reset") pdf.restore();
        }

        if (child.name == "section") {
            let attrs = getAttributes(child.attr, data);
            if (attrs.name) {
                if (!data['_sections']) data['_sections'] = {};
                data['_sections'][attrs.name] = child;
            } else if (attrs.render) {
                if (!data['_sections'] || !data['_sections'][attrs.render]) return;
                await goNode(data['_sections'][attrs.render], pdf, styles, data);
            }
        }

    }
}


exports.protopdf = protopdf;

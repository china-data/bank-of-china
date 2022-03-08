const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const pdfPath = './a.pdf';
const fs = require('fs');
const path = require('path');

let BANK_NO = 1;
const BANK_LIST = [];

const loadingTask = pdfjsLib.getDocument(pdfPath);

!(async () => {
  const doc = await loadingTask.promise;
  const numPages = doc.numPages;
  console.log('# Document Loaded');
  console.log('Number of Pages: ' + numPages);
  console.log();

  let lastPromise; // will be used to chain promises
  lastPromise = doc.getMetadata().then(function (data) {
    console.log('# Metadata Is Loaded');
    console.log('## Info');
    console.log(JSON.stringify(data.info, null, 2));
    console.log();
    if (data.metadata) {
      console.log('## Metadata');
      console.log(JSON.stringify(data.metadata.getAll(), null, 2));
      console.log();
    }
  });

  const loadPage = function (pageNum) {
    return doc.getPage(pageNum).then(function (page) {
      console.log('# Page ' + pageNum);
      const viewport = page.getViewport({ scale: 1.0 });
      console.log('Size: ' + viewport.width + 'x' + viewport.height);
      console.log();
      return page
        .getTextContent()
        .then(function (content) {
          // Content contains lots of information about the text layout and
          // styles, but we need only strings at the moment
          const strings = (content.items.map(function (item) {
            return item.str;
          })).join('');

          let bankNumberStart = 0;
          let bankNumberEnd = 0;
          while (true) {
            bankNumberStart = strings.indexOf(`${BANK_NO} `)
            bankNumberEnd = strings.indexOf(`${BANK_NO + 1} `)
            if (bankNumberStart === -1) break;
            if (bankNumberEnd === -1) bankNumberEnd = strings.length - 1;
            BANK_LIST.push(strings.substring(bankNumberStart, bankNumberEnd));
            BANK_NO++;
          }
          page.cleanup();
        })
        .then(function () {
          console.log();
        });
    });
  };
  for (let i = 1; i <= numPages; i++) {
    await loadPage(i);
  }

  fs.writeFileSync(
    path.join(__dirname, './a.json'),
    JSON.stringify(BANK_LIST, null, 2)
  );
})();

# maildir-scan

Finds messages from Maildir. Output is an array of folder objects that include an array of message objects. Actual message content is not loaded, this module is used for listing only. Tested on Courier based Maildir folders.

## Install

    npm install maildir-scan

## Usage

```javascript
const MaildirScan = require('maildir-scan');
let scanner = new MaildirScan();
scanner.scan('/path/to/Maildir', (err, list)=>{
    console.log(err || list);
});
```

## License

**ISC**

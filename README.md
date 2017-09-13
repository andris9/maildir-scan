# maildir-scan

Finds messages from Maildir

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

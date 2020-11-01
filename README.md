# etsy-polling
Check my favorite Etsy shop for new items

# Requirements
Windows 10, NodeJS 15.x

# Install
```
> npm install
```

# Usage
```
> start.bat
```
Script will start and will poll the Etsy shop link (declared in `fetch.js`) every 5 minutes. Once there is a change, it will send native Windows 10 notification about changes.

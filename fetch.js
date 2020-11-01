const https = require( "https" );
const fs = require( 'fs' );
const JSDOM = require( "jsdom" ).JSDOM;
const { subtle } = require( 'crypto' ).webcrypto;
const { StringDecoder } = require( 'string_decoder' );
const { exec } = require( 'child_process' );


const url = 'https://www.etsy.com/pl/shop/PENBBSOfficialStore?ref=simple-shop-header-name&listing_id=641926036&sort_order=date_desc';
const hashFilePath = './hash.txt';
const pollingTime = 5 * 60 * 1000; // 5 minutes


const getPreviousHash = () => {
    if ( fs.existsSync( hashFilePath ) ) {
        return fs.readFileSync( hashFilePath )
    }
    return '';
}

const updateHash = ( hash ) => {
    fs.writeFileSync( hashFilePath, hash )
}

async function calculateHash( data, algorithm = 'SHA-512' ) {
    const digest = await subtle.digest( algorithm, data );
    const te = new StringDecoder( 'utf-8' );

    return te.end( Buffer.from( digest ) )
}

const sendNotification = ( message ) => {
    message = message ? `"${ message }"` : '';

    exec( `./notify ${ message }`, { 'shell': 'powershell.exe' }, ( error, _, stderr ) => {
        if ( error || stderr ) {
            throw `There has been a problem with notification: ${ error || stderr }`;
        }
    } )
}

const getTime = () => {
    return new Date().toGMTString();
}

const extractArticles = ( body ) => {
    const articleTitleSelector = 'h3.text-gray';
    const dom = new JSDOM( body );
    const titles = dom.window._document.querySelectorAll( articleTitleSelector );

    return Array.from( titles )
        .map( item => item.innerHTML.trim() );
}

const checkForNewArticles = () => {
    const previousHash = getPreviousHash();

    console.log( getTime(), 'Fetching articles on Etsy...' );

    https.get( url, res => {
        res.setEncoding( "utf8" );
        let body = "";
        res.on( "data", data => {
            body += data;
        } );
        res.on( "end", async () => {
            const titlesAsString = extractArticles( body ).join( ', ' );
            const currentHash = await calculateHash( titlesAsString );

            if ( currentHash != previousHash ) {
                sendNotification();
                updateHash( currentHash );
                console.log( 'Something has changed on Etsy' );
            }
        } );
    } );
}

// Send initial notification.
sendNotification( 'Just started watching Etsy' );

// Look for updates right away.
checkForNewArticles();

// Start polling for updates.
setInterval( () => checkForNewArticles(), pollingTime );
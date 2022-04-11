const webp  = require('webp-converter');
const hash  = require('fnv1a');
const path  = require('path');
const fs    = require('fs');
const express   = require('express');
const crypto    = require('crypto');
const axios = require('axios');

const download_image = (url, image_path) =>
    axios({
        url,
        responseType: 'stream',
    }).then(
        response =>
            new Promise((resolve, reject) => {
                response.data
                    .pipe(fs.createWriteStream(image_path))
                    .on('finish', () => resolve())
                    .on('error', e => reject(e));
            }),
);


const app = express();

app.get('/webp', async(req, res) => {
    const imageURL = req.query.url;
    if(!imageURL) {
        return res.send('url required.');
    }
    try {
        const hash = str => crypto.createHash('sha256').update(str).digest('hex');
        const hashCode = hash(imageURL);
        if(fs.existsSync(`./results/${hashCode}.webp`)) {
            return res.sendFile(`./results/${hashCode}.webp`, { root: __dirname });
        }

        await download_image(imageURL, `./temp/${hashCode}.png`);
        const result = webp.cwebp(`./temp/${hashCode}.png`, `./results/${hashCode}.webp`, "-q 80", logging = "-v");
        result.then(() => {
            fs.unlink(`./temp/${hashCode}.png`, err => {});
            res.sendFile(`./results/${hashCode}.webp`, { root: __dirname });
        });
    }
    catch(e) {
        res.status(500).send('Internal Server Error.');
        console.log(e);
    }
});

app.listen('3005');


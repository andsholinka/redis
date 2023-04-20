const express = require('express');
const axios = require('axios');
const {
    createClient
} = require('redis');

const client = createClient({
    // socket: {
    //     host: 'redis',
    //     port: '6379'
    // },
    username: 'andrey',
    password: 'rahasia'
});
const app = express();
client.connect();

client.on("connect", () => {
    console.log("Connected to Redis");
})
client.on('error', err => {
    global.console.log(err.message)
});

app.get('/photos', async (req, res) => {
    const albumId = req.query.albumId;
    const photos = await getOrSetCache(`photos?albumId=${albumId}`, async () => {
        console.log("data not retrived from cache");
        const {
            data
        } = await axios.get(`https://jsonplaceholder.typicode.com/photos`, {
            params: {
                albumId
            }
        })
        return data;
    });
    res.json(photos);
});

function getOrSetCache(key, cb) {
    return new Promise(async (resolve, reject) => {
        const data = await client.get(key);

        if (data !== null) {
            console.log("data retrived from cache");
            return resolve(JSON.parse(data));
        }

        const freshData = await cb();
        client.setEx(key, 60, JSON.stringify(freshData));
        resolve(freshData);
    })
}

app.listen(port = 8080, () => {
    console.log(`Example app listening on port ${port}`)
});
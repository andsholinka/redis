// create express server
const express = require('express');
const fetch = require('node-fetch');
const {
    createClient
} = require('redis');

const USER_NAME = 'username';

const client = createClient();

const app = express();

client.connect();
client.on("connect", () => {
    console.log("Connected to Redis");
})

function formatOuput(username, numOfRepos) {
    return `${username} has ${numOfRepos} repos on GitHub`;
}

//? Request data from github
async function getRepos(req, res) {
    console.log("getRepos");
    try {
        const username = req.params[USER_NAME];

        const response = await fetch(`https://api.github.com/users/${username}`);

        const {
            public_repos
        } = await response.json();

        //? Cache data to Redis
        client.setEx(username, 600, JSON.stringify(public_repos));

        res.send(formatOuput(username, public_repos));
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
}

//? Cache Middleware
async function cache(req, res, next) {
    const username = req.params[USER_NAME];
    console.log(username);

    const result = await client.get(username)

    if (result !== null) {
        console.log("data retrived from cache");
        res.send(formatOuput(username, JSON.parse(result)));
    } else {
        console.log("data not retrived from cache");
        next();
    }
}

app.get(`/repos/:${USER_NAME}`, cache, getRepos);

app.get('/', (req, res) => {
    res.status(200).send({
        message: 'redis x express'
    });
});

app.listen(port = 8080, () => {
    console.log(`Example app listening on port ${port}`)
});
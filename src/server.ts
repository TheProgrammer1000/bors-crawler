import express from 'express'

const app = express();
const port = 3000;
const hostname = `localhost`

app.get(`/`, (req, res) => {
    res.send(`Hello world!`);
})

app.listen(port, hostname, () => {
    console.log(`Listen to ${hostname}:${port}`);
})
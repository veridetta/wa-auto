const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const fs = require('fs');
const socketIO = require('socket.io');
const http = require('http');
const qrcode = require('qrcode');
const { response } = require('express');
const fileUpload = require('express-fileupload');

const app = express();
const server = http.createServer(app);
const  io = socketIO(server);

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(fileUpload({
    debug:true
}))

app.get('/', (req, res)=>{
    res.sendFile('index.html',{root:__dirname});
})
const client = new Client({
    authStrategy: new LocalAuth({ clientId: "client-one" })
});



client.initialize();

//IO
io.on('connection', function(socket){
    socket.emit('message','Connecting...');
    client.on('qr', qr => {
        qrcode.toDataURL(qr,(err,url)=>{
            socket.emit('qr',url);
            socket.emit('message','QR CODE Received, scan please ...');
        })
    });
    client.on('ready', () => {
        socket.emit('message','Whatsapp Ready!');
    });

    client.on('message', message => {
        if(message.body=='I Love You'){
            message.reply('I Love You Too');
            socket.emit('inbox',message.body);
        }
    });
})

app.post('/send-message',(req,res)=>{
    const number = req.body.number;
    const message = req.body.message;

    client.sendMessage(number,message).then(response=>{
        res.status(200).json({
            status:true,
            response:response
        })
    }).catch(err=>{
        res.status(500).json({
            status:false,
            response:err
        });
    });
});

app.post('/send-media',(req,res)=>{
    const number = req.body.number;
    const caption = req.body.caption;

    const file = req.files.file;
    const media = new MessageMedia(file.mimetype, file.data.toString('base64'), file.name);

    client.sendMessage(number,media,{caption:caption}).then(response=>{
        res.status(200).json({
            status:true,
            response:response
        })
    }).catch(err=>{
        res.status(500).json({
            status:false,
            response:err
        });
    });
});
 server.listen(8080, function(){
    console.log('Running on..');
 })
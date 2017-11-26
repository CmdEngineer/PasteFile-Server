var port = process.env.PORT || 3000;
var app = require('express')();
var http = require('http').Server(app);
var fs = require('fs');
var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
var usedIDs = [];
var messages = 0;

http.listen(port, function(){
    console.log("Starting Server... (" + port + ")");
    usedIDs = loadIDList();
    console.log("Backup Loaded " + "(" + usedIDs.length + ")");
    var stdin = process.openStdin();
    stdin.addListener("data", function(d) {
        var cmd = d.toString().trim();
        var result = "Not a command!";
        console.log(cmd + " >> " + result);
     });
});

app.post('*', function(req, res){
    var info = req.body.info;
    var json = req.body.json;
    var id = newPaste(info +  "<=Data=>" + json);
    res.send(id);
    appendIDList(id + ":");
    console.log("Paste uploaded: " + id);
});

app.get('*', function(req, res){
    var route = req.url.toString().substring(1, req.url.toString().length);
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";    
    if(route.length == 8){
        for (var i = 0; i < route.length; i++) {
            if(possible.indexOf(route.charAt(i)) == -1){
                 res.send("Error.");
                return false;
            }
        }
        var id = getPaste(route);
        res.send(id);
        console.log("Paste downloaded: " + route);
    }else{
        res.send(usedIDs.length + "");
    }
})

function newPaste(data){
    var id = newPasteID();
    fs.writeFile(__dirname + '/pastes/files/' + id + '.txt',data, 'utf8', function(err){
        if(err) return err;
    });
    return id;
}

function newPasteID(){
    var id = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var isValid = false;
    while(!isValid){
        id = "";
        for (var i = 0; i < 8; i++){
            id += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        if(usedIDs.indexOf(id) == -1) isValid = true;
    }
    usedIDs.push(id);
    return id;
}

function getPaste(id){
    return fs.readFileSync(__dirname + '/pastes/files/' + id + '.txt', 'utf8');
}

function loadIDList(){
    var ids = [];
    var id = fs.readFileSync(__dirname + "/backup.txt", 'utf8');
    ids = id.split(":");
    return ids;
}

function saveIDList(){
    fs.truncate(__dirname + '/backup.txt',0, 'utf8', function(err){
        if(err) return err;
    });
    var id = "";
    foreach(str in usedIDs)
        id += str + ":";
    fs.writeFile(__dirname + '/backup.txt', id, 'utf8', function(err){
        if(err) return err;
    });
}

function appendIDList(text){
    return fs.appendFileSync(__dirname + '/backup.txt', text, 'utf8', function(err){
        if(err) return err;
    });
}
var port = process.env.PORT || 3001;
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
        var args = cmd.split(" ");
        var result = "Not a command!";
        console.log(cmd + " >> " + result);
        if(args[0] == "new"){
            if(args[1] && args[2]){
                newPaste(args[1], args[2]);
                result = "Created!";
            }else result = "Please enter 'new string string'";
        }
        console.log(args[0] + " >> " + result);
     });
});

app.post('*', function(req, res){
    var user = req.body.user || req.get("user");
    var info = req.body.info || req.get("info");
    var json = req.body.json || req.get("json");
    var cmd = req.body.cmd || req.get("cmd") || "UPLOAD";
    var id = req.body.id || req.get("id");
    if(cmd.indexOf("UPLOAD") !== -1){
            if(checkInput(user)){
                id = newPaste(user, info + "<=Data=>" + json);
                res.send(id);
                appendIDList(id);
                console.log("Paste uploaded: " + id);
            }else{
                id = newPasteSingular(info +  "<=Data=>" + json);
                res.send(id);
                appendIDList(id);
                console.log("Paste uploaded: " + id);
            }
        }
    }else if(cmd.indexOf("REMOVE") !== -1){
        res.send("Removed!");
        if(checkInput(user)){
            removePaste(user, id);
        }else{
            removePasteSingular(id);
        }
        removeIDList(id);
        console.log("Paste removed: " + id);
    }else if(cmd.indexOf("EDIT") !== -1){
        if(checkInput(info) && checkInput(json)){
            res.send("Edited!");
            editPaste(user, data, id);
            console.log("Paste edited: " + id);
        }
    }
});

app.get('*', function(req, res){
    var route = req.url.toString().substring(1, req.url.toString().length);
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";    
    if(route.length == 8){
        for (var i = 0; i < route.length; i++) {
            if(possible.indexOf(route.charAt(i)) == -1){
                res.send("Error.");
                return;
            }
        }
        var id = getPaste(route);
        res.send(id);
        console.log("Paste downloaded: " + route);
    }else if(route.indexOf("get/") !== -1){
        route = route.substring(4, route.toString().length);
        var user = req.body.user || req.get("user") || route;
        res.send(fs.readdirSync(__dirname + "/pastes/players/" + user, 'utf8'));
    }else if(route.indexOf("get") !== -1){
        res.send(fs.readdirSync(__dirname + "/pastes/files/", 'utf8'));
    }else{
        res.send(usedIDs.length + "");
    }
});
function newPaste(user, data){
    var id = newPasteID();
    var rootDir = __dirname + '/pastes/players';
    var playerDir = __dirname + '/pastes/players/' + user;
    var fileDir = __dirname + '/pastes/files'; 
    if (!fs.existsSync(fileDir)){
        fs.mkdirSync(fileDir);
    }
    fs.writeFile(fileDir + '/' + id + '.txt', data, 'utf8', function(err){
        if(err) return err;
    });
    if (!fs.existsSync(rootDir)){
        fs.mkdirSync(rootDir);
    }
    if (!fs.existsSync(playerDir)){
        fs.mkdirSync(playerDir);
    }
    fs.writeFile(playerDir + "/" + id + '.txt', data, 'utf8', function(err){
        if(err) return err;
    });
    return id;
}
function newPasteSingular(data){
    var id = newPasteID();
    var fileDir = __dirname + '/pastes/files/'; 
    if (!fs.existsSync(fileDir)){
        fs.mkdirSync(fileDir);
    }
    fs.writeFile(fileDir + '/' + id + '.txt', data, 'utf8', function(err){
        if(err) return err;
    });
    return id;
}

function removePaste(user, id){
    var playerDir = __dirname + '/pastes/players/' + user;
    var fileDir = __dirname + '/pastes/files/'; 
    if (!fs.existsSync(fileDir)){
        fs.mkdirSync(fileDir);
    }
    if(fs.existsSync(fileDir + "/" + id + ".txt")){
        fs.unlinkSync(fileDir + "/" + id + ".txt", 'utf8');
    }
    if (fs.existsSync(playerDir + "/" + id + ".txt")){
        fs.unlinkSync(playerDir + "/" + id + ".txt", 'utf8');
    }
}
function removePasteSingular(id){
    var fileDir = __dirname + '/pastes/files/'; 
    if (!fs.existsSync(fileDir)){
        fs.mkdirSync(fileDir);
    }
    if(fs.existsSync(fileDir + "/" + id + ".txt")){
        fs.unlinkSync(fileDir + "/" + id + ".txt", 'utf8');
    }
}
function editPaste(user, data, id){
    var playerDir = __dirname + '/pastes/players/' + user;
    var fileDir = __dirname + '/pastes/files/'; 
    if (!fs.existsSync(fileDir)){
        fs.mkdirSync(fileDir);
    }
    fs.writeFile(fileDir + '/' + id + '.txt', data, 'utf8', function(err){
        if(err) return err;
    });
    if (!fs.existsSync(playerDir)){
        fs.mkdirSync(playerDir);
    }
    fs.writeFile(playerDir + "/" + id + '.txt', data, 'utf8', function(err){
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
    fs.truncateSync(__dirname + '/backup.txt',0);
    var msg = "";
    for(var i = 0; i < usedIDs.length; i++){
        msg += usedIDs[i] + ":";
    }
    fs.writeFileSync(__dirname + '/backup.txt', msg, 'utf8');
}

function appendIDList(id){
    fs.appendFileSync(__dirname + '/backup.txt', id + ":", 'utf8', function(err){
        if(err) return err;
    });
    var data = fs.readFileSync(__dirname + '/backup.txt');
    usedIDs = data.toString().split(":");
}
function removeIDList(id){
    var newArray = [];
    for(var i = 0; i < usedIDs.length; i++){
        if(usedIDs[i] !== id){
            newArray.push(usedIDs[i]);
        }
    }
    usedIDs = newArray.slice(1, newArray.length-1);
    saveIDList();
}

function checkInput(data){
    if(data){
        if(data !== " "){
            return true;
        }
    }
    return false;
}
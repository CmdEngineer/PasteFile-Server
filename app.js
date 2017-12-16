var port = process.env.PORT || 80;
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
        id = newPaste(user, info +  "<=Data=>" + json);
        res.send(id);
        appendIDList(id + ":");
        console.log("Paste uploaded: " + id);
    }else if(cmd.indexOf("REMOVE") !== -1){
        res.send("Removed!");
        removePaste(user, id);
        console.log("Paste removed: " + id);
    }else if(cmd.indexOf("EDIT") !== -1){
        res.send("Edited!");
        editPaste(user, data, id);
        console.log("Paste edited: " + id);
    }
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
});

function newPaste(user, data){
    var id = newPasteID();
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

function removePaste(user, id){
    var playerDir = __dirname + '/pastes/players/' + user;
    var fileDir = __dirname + '/pastes/files/'; 
    if (!fs.existsSync(fileDir)){
        fs.mkdirSync(fileDir);
    }
    fs.unlinkSync(fileDir + "/" + id + ".txt", 'utf8');
    if (fs.existsSync(playerDir)){
        fs.unlinkSync(playerDir + "/" + id + ".txt", 'utf8');
        if(usedIDs.indexOf(id) !== -1){
            usedIDs = removeIDList(id);
        }
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
    fs.truncate(__dirname + '/backup.txt',0, 'utf8', function(err){
        if(err) return err;
    });
    var id = "";
    for(str in usedIDs){
        id += str + ":";
    }
    fs.writeFile(__dirname + '/backup.txt', id, 'utf8', function(err){
        if(err) return err;
    });
}

function appendIDList(text){
    return fs.appendFileSync(__dirname + '/backup.txt', text, 'utf8', function(err){
        if(err) return err;
    });
}

function removeIDList(id){
    var data = fs.readFileSync(__dirname + '/backup.txt', 'utf8');
    data = data.replace(id + ":", "");
    usedIDs.remove(id);
}

Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};
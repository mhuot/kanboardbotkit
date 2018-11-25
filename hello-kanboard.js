const Kanboard = require('kanboard');
 
var kb = new Kanboard('http://192.168.1.16/jsonrpc.php', 'admin', 'admin');
 
kb.execute('getProjectByName', {name: 'test1'})
.on('success', (result) => {
    console.log(result);
})
.on('error', (error) => {
    console.log(error);
});
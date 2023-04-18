let recentMessages = new Array();
let DisplayedMessage;
var obj;

//Start Scrolling Text Box------------------------------------------------------
getValue('height', (h) => {
    let value = 'height:' + h + 'px';
    document.getElementById('container').setAttribute('style', value); 
})

var $el = $(".container");
function anim() {
  var st = $el.scrollTop();
  var sb = $el.prop("scrollHeight")-$el.outerHeight();
  $el.animate({scrollTop: st<sb/2 ? sb : 0}, 17000, anim);
}
function stop(){
  $el.stop();
}
anim();
$el.hover(stop, anim);
//End Scrolling Text Box--------------------------------------------------------

//Get messages from channel
slackGenChan = function() {
    console.log('running');
    var promise1 = new Promise(function(resolve, reject) {
        var genChan = new XMLHttpRequest();
        var url = "https://slack.com/api/conversations.history";
        var body = "inclusive=true&limit=20&channel=CHANNEL&token=TOKEN"; //replace CHANNEL and TOKEN with the respective keys
        genChan.open("POST", url, true);
        genChan.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        genChan.onreadystatechange = function()
        {
            if(genChan.readyState == 4 && genChan.status == 200) { //genChan API call SUCCESS
            recentMessages = [];
                obj = JSON.parse(genChan.responseText);
                //console.log(obj.messages);
                for (var i = 0; i < obj.messages.length; i++) {
                    if (obj.messages[i].subtype == null && obj.messages[i].bot_id == null) { //If message isn't deleted, from a bot, etc.
                        //Push all normal messages onto an array recentMessages
                        recentMessages.push(obj.messages[i]);
                        console.log(recentMessages);
                        DisplayedMessage = recentMessages[0]; //Get first message
                        console.log(DisplayedMessage);
                        if (DisplayedMessage != null) {
                            let expr = '<(.*?)>';
                            let regex = new RegExp(expr, 'gm');
                            //console.log(DisplayedMessage.user);
                            //console.log(replaceUser(DisplayedMessage.user));
                            //DisplayedMessage.user = replaceUser(DisplayedMessage.user)//Get Sender Name of the DisplayedMessage
                            
                            
                            
                            async function replaceElements() {
                                //Get message sender
                                DisplayedMessage.user = '<p style = "border-top: 2px solid black; padding: 2px; margin: 10px">Sent By <b>' + await replaceUser(DisplayedMessage.user) + '</b></p>';
                                let text = '';
                                for (let i = 0; i < DisplayedMessage.blocks[0].elements.length; i++) {
                                    console.log('i' + i);
                                    if (DisplayedMessage.blocks[0].elements[i].type == "rich_text_section") {
                                        let elem = DisplayedMessage.blocks[0].elements[i].elements; //Get all message attachments (UserID's, URL's, etc.)
                                        await replaceText(elem).then((text) => {
                                            elemText = text;
                                            
                                        });
                                        //console.log(elemText);
                                        
                                    } else if (DisplayedMessage.blocks[0].elements[i].type == "rich_text_list") {
                                        let listItems = []; //initialize array of bullet points
                                        for (k = 0; k < DisplayedMessage.blocks[0].elements[i].elements.length; k++) {
                                            let elem = DisplayedMessage.blocks[0].elements[i].elements[k].elements; //Get all message attachments (UserID's, URL's, etc.)
                                            await replaceText(elem).then((list) => {
                                                listItems.push("<li>" + list + "</li>"); //Create each HTML bullet point
                                                elemText = "<ul>" + listItems.join('') + "</ul>"; //Convert to HTML list
                                                //console.log(elemText);
                                            });
                                        }
                                    }
                                    //concatenate all elements
                                    if (i == (DisplayedMessage.blocks[0].elements.length - 1)) { //if all elements have been iterated through
                                        document.getElementById('text').innerHTML = text + '\n\n' + elemText + DisplayedMessage.user;
                                    } else {
                                        text = text + '\n\n' + elemText;
                                    }
                                }
                                
                            }
                            replaceElements();
                            //console.log(attach);
                        }
                        //console.log(DisplayedMessage);
                    }
                }
            }
        }
        genChan.send(body);
    })
}

async function replaceText(elem) { //Replace text (User names, links, etc.)
    for (let j = 0; j < elem.length; j++) {
        //attach_new[j] = attach[j].text;
        if (elem[j].type == 'user') { //if user ID
            //Run API to replace User ID with User name
            if (elem[j+1].text == ' ' && (j+2) < elem.length && elem[j+2].type == 'user') { //if there is a list of users names (eg. name1, name2)
                //elem[j] = '<b style="padding: 2px; border: 2px solid black; border-radius: 10px">' + await replaceUser(elem[j].user_id) + ', </b>';
                elem[j] = '<b>' + await replaceUser(elem[j].user_id) + ',</b>';
            } else {
                elem[j] = '<b>' + await replaceUser(elem[j].user_id) + '</b>';
                //elem[j] = '<b style="padding: 2px; border: 2px solid black; border-radius: 10px">' + await replaceUser(elem[j].user_id) + '</b>';
            }
        } else if (elem[j].type == 'channel') {
            elem[j] = '<b>#' + await replaceChannel(elem[j].channel_id) + '</b>';
            
        } else if(elem[j].type == 'link') {
            if (elem[j].text) {
                elem[j] = "<u style='color:#0000EE'>" + elem[j].text + "</u>";
            } else {
                elem[j] = "<u style='color:#0000EE'>" + elem[j].url + "</u>";
            }
            
        } else if(elem[j].type == 'text') { 
            elem[j] = elem[j].text.replace('\n', ' ');
        } else if(elem[j].type == 'emoji') {
            try{
                elem[j] = String.fromCodePoint(parseInt (elem[j].unicode, 16))
            } catch(error) {
                elem[j] = '';
            }
        } else if(elem[j].type == 'broadcast') {
            elem[j] = '<mark style="background-color: #f5e9a9; color: black; border-radius: 10px; padding: 2px">@' + elem[j].range + '</mark>';
        }
        if (j == elem.length - 1) {
            console.log(elem.join(''));
            return elem.join('');
        }
        
    }
}
                                        
//Translate UserID's
replaceUser = function(id) {
    var replace = new Promise(function(resolve, reject) {
        //console.log(id);
        var replaceReq = new XMLHttpRequest();
        let url = "https://slack.com/api/users.info";
        let body = "user=" + id + "&token=TOKEN"; // replace TOKEN with token
        replaceReq.open("POST", url, true);
        //replaceReq.setRequestHeader('Authorization', 'Bearer KEY'); //replace KEY with API key
        replaceReq.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        replaceReq.onreadystatechange = function()
        {
            if(replaceReq.readyState == 4 && replaceReq.status == 200) { //replaceReq API call SUCCESS
                output = JSON.parse(replaceReq.responseText);
                //console.log(output);
                user_name = output.user.real_name;
                console.log('user_name: ' + user_name);
                return resolve(output.user.real_name);
            }
            //console.log(replaceReq.responseText);
        }
        replaceReq.send(body);
    }).then(name => {
        return name;
    });
    return replace;
}

//Translate Channel ID's
replaceChannel = function(id) {
    var replaceChannel = new Promise(function(resolve, reject) {
        //console.log(id);
        var channelReq = new XMLHttpRequest();
        let url = "https://slack.com/api/conversations.info";
        let body = "channel=" + id + "&token=TOKEN"; //Replace TOKEN with your token
        channelReq.open("POST", url, true);
        //replaceReq.setRequestHeader('Authorization', 'Bearer KEY'); //replace KEY with your API key
        channelReq.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        channelReq.onreadystatechange = function()
        {
            if(channelReq.readyState == 4 && channelReq.status == 200) { //replaceReq API call SUCCESS
                output = JSON.parse(channelReq.responseText);
                //console.log(output);
                channel_name = output.channel.name;
                //console.log('channel_name: ' + channel_name);
                return resolve(channel_name);
            }
            //console.log(replaceReq.responseText);
        }
        channelReq.send(body);
    }).then(name => {
        return name;
    });
    return replaceChannel;
}

//Run Code at interval
slackGenChan();
setInterval(slackGenChan, 300000);

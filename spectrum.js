//Waituntil DOM is loaded to start
$(document).ready(function() {
    // create the audio context (chrome only for now)
    if (! window.AudioContext) {
        if (! window.webkitAudioContext) {
            alert('no audiocontext found');
        }
        window.AudioContext = window.webkitAudioContext;
    }
    var context = new AudioContext();
    var audioBuffer;
    var sourceNode;
    var analyser;
    var javascriptNode;

    // get the context from the canvas to draw on
    var ctx = $("#canvas").get(0).getContext("2d");
    // create a gradient for the fill. Note the strange
    // offset, since the gradient is calculated based on
    // the canvas, not the specific element we draw
    var gradient = ctx.createLinearGradient(0,0,0,300);
    gradient.addColorStop(1,'#000000');
    gradient.addColorStop(0.75,'#ff0000');
    gradient.addColorStop(0.25,'#ffff00');
    gradient.addColorStop(0,'#ffffff');

    // load the sound
    setupAudioNodes();
    loadSound("demo.mp3");
    console.log('sound loaded');

    function setupAudioNodes() {
        // setup a javascript node
        javascriptNode = context.createScriptProcessor(2048, 1, 1);
        // connect to destination, else it isn't called
        javascriptNode.connect(context.destination);
        // setup a analyzer
        analyser = context.createAnalyser();
        analyser.smoothingTimeConstant = 0.3;
        analyser.fftSize = 32;
        // create a buffer source node
        sourceNode = context.createBufferSource();
        sourceNode.connect(analyser);
        analyser.connect(javascriptNode);
        sourceNode.connect(context.destination);
    }

    // load the specified sound
    function loadSound(url) {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';
        // When loaded decode the data
        request.onload = function() {
            // decode the data
            context.decodeAudioData(request.response, function(buffer) {
                // when the audio is decoded play the sound
                console.log('success!')
                playSound(buffer);
            }, onError);
        }
        request.send();
    }

    function playSound(buffer) {
        sourceNode.buffer = buffer;
        sourceNode.start(0);
    }

    // log if an error occurs
    function onError(e) {
        console.log("Error!");
        console.log(e);
    }

    // when the javascript node is called
    // we use information from the analyzer node
    // to draw the volume
    javascriptNode.onaudioprocess = function() {
        // get the average for the first channel
        var array =  new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        // clear the current state
        ctx.clearRect(0, 0, 600, 600);
        // set the fill style
        ctx.fillStyle=gradient;
        drawSpectrum(array);
    }

    function drawSpectrum(array) {
        // Max Value possible for any bucket seems to be 255
        var ulX = 120;
        var ulY = 30;
        var maxHeight = 50;
        var x = 0, y = 0, barWidth = 5, barHeight = 0;
        var bucketNumber = 0;
        for ( var i = 0; i < (array.length); i+=2 ){
            var value = array[i];
            var scaledValue = value/255*maxHeight;
            x = ulX + bucketNumber*(barWidth+2);
            y = ulY + maxHeight - scaledValue
            barHeight = scaledValue;
            ctx.fillRect(x, y, barWidth, barHeight);
            //  console.log([i,value])
            bucketNumber++;
        }
    };

});

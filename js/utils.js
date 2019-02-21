// Helper to get hash from end of URL or generate a random one.
function getExampleRef() {
  var ref = firebase.database().ref();
  var hash = window.location.hash.replace(/#/g, '');
  if (hash) {
    ref = ref.child(hash);
  } else {
    ref = ref.push(); // generate unique location.
    window.location = window.location + '#' + ref.key; // add it as a hash to the URL.
  }
  if (typeof console !== 'undefined') {
    console.log('Firebase data: ', ref.toString());
  }
  return ref;
}

// ace.require("ace/ext/language_tools");
// var editor = ace.edit("editor");
// editor.session.setMode("ace/mode/latex");
// editor.setTheme("ace/theme/material");


// // enable autocompletion and snippets
// editor.setOptions({
//     enableBasicAutocompletion: true,
//     enableSnippets: true,
//     enableLiveAutocompletion: false,
//     enableLiveAutocompletion: true,
//     wrapBehavioursEnabled: true,
//     wrap: true
// });

// editor.commands.addCommand({
//     name: 'zoom',
//     bindKey: {win: 'Ctrl-=',  mac: 'Command-='},
//     exec: function(editor) {
//         editor.setFoneSize((editor.getFontSize())++)
//     },
//     readOnly: false // false if this command should not apply in readOnly mode
// });

// editor.commands.addCommand({
//     name: 'zoomx',
//     bindKey: {win: 'Ctrl--',  mac: 'Command--'},
//     exec: function(editor) {
//         editor.setFoneSize((editor.getFontSize())--)
//     },
//     readOnly: false // false if this command should not apply in readOnly mode
// });

// var videoElement = document.getElementById("bd");

// function toggleFullScreen() {
//     if (!document.mozFullScreen && !document.webkitFullScreen) {
//         if (videoElement.mozRequestFullScreen) {
//             videoElement.mozRequestFullScreen();
//         } else {
//             videoElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
//         }
//     } else {
//         if (document.mozCancelFullScreen) {
//             document.mozCancelFullScreen();
//         } else {
//             document.webkitCancelFullScreen();
//         }
//     }
// }

// $('#fullscreen').click(function () {
//     toggleFullScreen();
// })


function compile(source_code) {
    document.getElementById("output").textContent = "";
    showLoadingIndicator(true);

    var texlive = new TeXLive();
    var pdftex = texlive.pdftex;
    pdftex.on_stdout = appendOutput;
    pdftex.on_stderr = appendOutput;

    var start_time = new Date().getTime();

    pdftex.compile(source_code).then(function(pdf_dataurl) {
        var end_time = new Date().getTime();
        console.info("Execution time: " + (end_time - start_time) / 1000 + ' sec');

        showLoadingIndicator(false);

        if (pdf_dataurl === false)
        return;
        showOpenButton(true);
        document.getElementById("open_pdf_btn").focus();
        texlive.terminate();
    });
}

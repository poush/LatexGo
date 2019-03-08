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



function preview(datauri){
    $("#pdf").html("<iframe src="+ datauri +"></iframe>")
}


function stdout(message) {
    // console.log(message)
    message = "<p class='logline'>" + message + "</p>"
    var pdf = $("#pdf")
    pdf.find('iframe').remove()
    pdf.find('.placeholder').remove()
    pdf.append(message)
    pdf[0].scrollTop = pdf[0].scrollHeight
}


function stderr(message) {

}


function compile(source_code) {

    if(!window.enable)
       return

    var texlive = new TeXLive('texlivejs/');
    var pdftex = texlive.pdftex;
    pdftex.on_stdout = stdout;
    pdftex.on_stderr = function(m){console.log(m)};

    var start_time = new Date().getTime();

    pdftex.compile(source_code).then(function(pdf_dataurl) {
        var end_time = new Date().getTime();
        console.info("Execution time: " + (end_time - start_time) / 1000 + ' sec');

        if (pdf_dataurl === false)
            return;

        preview(pdf_dataurl);
        texlive.terminate();
    });
}


var defaultLatex = `\\documentclass[12pt]{article}
\\usepackage{amsmath}
\\usepackage{graphicx}

\\title{\\TeX live.js}
\\author{Created by Manuel Sch\\"olling}
\\date{\\today}
\\begin{document}
  \\maketitle
  \\TeX{}live.js is a compiler for the \\TeX{}
  typesetting program created using Mozilla's Emscripten
  Compiler. It offers programmable desktop
  publishing features and extensive facilities for
  automating most aspects of typesetting and desktop
  publishing, including numbering and cross-referencing,
  tables and figures, page layout, bibliographies, and
  much more. It supports \\LaTeX{} which was originally written 
  in 1984 by Leslie Lamport and has becomsds
  de the dominant method for
  using \\TeX;
 
  % This is a comment, not shown in final output.
  % The following shows typesetting power of LaTeX:
  \\begin{align}
    E_0 &= mc^2                              \\\\
    E &= \\frac{mc^2}{\\sqrt{1-\\frac{v^2}{c^2}}}
  \\end{align}


  \\TeX{}live.js even supports images! This photo was taken by Laura Poitras/Praxis Films

  \\includegraphics[height=5cm, keepaspectratio]{snowden}
\\end{document}
        `


function postAuth(token) {
  var d = drive.getInstance(token);
  d.show();
}
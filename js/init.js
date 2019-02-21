function init() {

  var config = {
    apiKey: "AIzaSyA5n3j29EO1AyQwi3huuHDUf3Fdvo24oOc",
    authDomain: "xyz-jmfdxq.firebaseapp.com",
    databaseURL: "https://xyz-jmfdxq.firebaseio.com",
    projectId: "xyz-jmfdxq",
    storageBucket: "xyz-jmfdxq.appspot.com",
    messagingSenderId: "505581208144"
  };
  firebase.initializeApp(config);


  //// Get Firebase Database reference.
  var firepadRef = getExampleRef();


  //// Create ACE
  var editor = ace.edit("editor");
  editor.setTheme("ace/theme/material");
  var session = editor.getSession();
  session.setUseWrapMode(true);
  session.setUseWorker(false);
  session.setMode("ace/mode/latex");


  //// Create Firepad.
  var firepad = Firepad.fromACE(firepadRef, editor, {
    defaultText: '% Hello World'
  });
}


function showLogin() {
  
  var uiConfig = {
    // signInSuccessUrl: '<url-to-redirect-to-on-success>',
    signInOptions: [
      // Leave the lines as is for the providers you want to offer your users.
      firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      firebase.auth.EmailAuthProvider.PROVIDER_ID
    ],
    // tosUrl and privacyPolicyUrl accept either url string or a callback
    // function.
    // Terms of service url/callback.
    // tosUrl: '<your-tos-url>',
    // Privacy policy url/callback.
    privacyPolicyUrl: function() {
      window.location.assign('<your-privacy-policy-url>');
    }
  };

  var ui = new firebaseui.auth.AuthUI(firebase.auth());

  ui.start('#logincontainer', uiConfig);
}

function initAuth(){
  firebase.auth().onAuthStateChanged(function(user) {
    if (user && user.emailVerified) {
      // User is signed in.
      window.displayName = user.displayName;
      window.email = user.email;
      window.emailVerified = user.emailVerified;
      window.photoURL = user.photoURL;
      window.uid = user.uid;

    } else {
      // User is signed out.
      showLogin()
    }
  }, function(error) {
    console.log(error);
  });
}

$(function(){
  init()
  initAuth()
})
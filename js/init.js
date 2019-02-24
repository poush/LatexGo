var editor;
var session;

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

  //// Create ACE
  editor = ace.edit("editor");
  editor.setTheme("ace/theme/material");
  session = editor.getSession();
  session.setUseWrapMode(true);
  session.setUseWorker(false);
  session.setMode("ace/mode/latex");

}

function initializeFirepad(uid) {

  //// Get Firebase Database reference.
  var firepadRef = getExampleRef();

  //// Create Firepad.
  var firepad = Firepad.fromACE(firepadRef, editor, {
    defaultText: defaultLatex,
    userId: uid
  });

  //// set events listeners
  firepad.on('ready', function() {
    // enable editing for user
  })

  firepad.on('synced', function() {
    // update sync time
  })

  var firepadUsersRef = firepadRef.child('users'); // ref for active editors
  firepadUsersRef.on('child_added', function() {
    // add to list of active editors
  });

  firepadUsersRef.on('child_removed', function() {
    // remove from list of active editors
  });
}

function showLogin() {

  var uiConfig = {
    signInSuccessUrl: window.location.href,
    signInOptions: [{
      provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      scopes: [
        "email",
        "profile",
        "https://www.googleapis.com/auth/drive.file"
      ]
    }],

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
  $("#login").animate({top: "70vh"}, 400, function(){
    $(this).animate({top: "0"}, 300)
    $('.pyaaz').addClass("blur")
  })
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
      window.enable = true

      $("#login").animate({top: "100vh"}, 450, function(){
        $('.pyaaz').removeClass("blur")
      })

      initializeFirepad(user.uid);

    } else {
      // User is signed out.
      showLogin()
    }
  }, function(error) {
    console.log(error);
  });

  // handles logout
  $("#logout").click(function(){
    firebase.auth().signOut()
      .then(function() {
        window.location.reload();
      })
      .catch(function(error) {
        // An error happened
      });
  })
}


function registerEvents(){
  jQuery(document).keydown(function(event) {
        // If Control or Command key is pressed and the S key is pressed
        // run save function. 83 is the key code for S.
        if((event.ctrlKey || event.metaKey) && event.which == 83) {
            // Save Function
            event.preventDefault();
            var code = editor.getValue();
            compile(code)
            return false;
        }
    }
  );
}

$(function(){
  init()
  initAuth()
  registerEvents()
})

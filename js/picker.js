/**
 * Drive Singleton
 */

var drive = (function () {
 
    // Instance stores a reference to the Singleton
    var instance;
   
    function init(token) {
    
        var _picker;
        var _oauthToken = token;
        var _developerKey = "AIzaSyA5n3j29EO1AyQwi3huuHDUf3Fdvo24oOc";

        function _pickerCallback(data) {
            return 0;
        }

        function _generatePicker(){
            _picker = new google.picker.PickerBuilder().addView(google.picker.ViewId.FOLDERS).setOAuthToken(_oauthToken).setDeveloperKey(_developerKey).setCallback(_pickerCallback).build();
            console.log(_picker)
        }
   
        return {
    
            show: function(){
                _generatePicker()
                _picker.setVisible(true);
            },

            hide: function(){
                _picker.setVisible(false);
            }
    
        };
   
    };
   
    return {
   
      // Get the Singleton instance if one exists
      // or create one if it doesn't
      getInstance: function (k) {
   
        if ( !instance ) {
            if(!k){
                throw new Error("Invalid token, cannot initialize drive")
            }
          instance = init(k);
        }
   
        return instance;
      }
   
    };
   
  })();
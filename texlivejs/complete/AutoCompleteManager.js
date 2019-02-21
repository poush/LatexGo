//"ace/autocomplete","./SuggestionManager", "./"
  define("complete/AutoCompleteManager",["require","ace/range","ace/autocomplete","complete/SuggestionManager", "complete/Snippets"], function(require,exports,module) {
 
   var Range = require("ace/range").Range;
   var SuggestionManager=require("complete/SuggestionManager").SuggestionManager;
   var Snippets=require("complete/Snippets").Snippets;
   var getLastCommandFragment = function(lineUpToCursor) {
      var m;
      if (m = lineUpToCursor.match(/(\\[^\\ ]+)$/)) {
        return m[1];
      } else {
        return null;
      }
    };
    
    var AutoCompleteManager =  function ($editor) {
        var onChange;
        this.editor = $editor;
        this.suggestionManager = new SuggestionManager();
        this.monkeyPatchAutocomplete();
        onChange = (function(_this) {
          return function(change) {
            return _this.onChange(change);
          };
        })(this);
        this.editor.on("changeSession", (function(_this) {
          return function(e) {
            e.oldSession.off("change", onChange);
            return e.session.on("change", onChange);
          };
        })(this));
      };

(function() {
console.log("test");
      this.enable = function() {
        var SnippetCompleter;
        this.editor.setOptions({
          enableBasicAutocompletion: true,
          enableSnippets: true,
          enableLiveAutocompletion: false
        });
        SnippetCompleter = {
          getCompletions: function(editor, session, pos, prefix, callback) {
            return callback(null, Snippets);
          }
        };
        return this.editor.completers = [this.suggestionManager, SnippetCompleter];
      };

      this.disable = function() {
        return this.editor.setOptions({
          enableBasicAutocompletion: false,
          enableSnippets: false
        });
      };

      this.onChange = function(change) {
        var commandFragment, cursorPosition, end, lineUpToCursor, range;
        cursorPosition = this.editor.getCursorPosition();
        end = change.end;
        if (end.row === cursorPosition.row && end.column === cursorPosition.column + 1) {
          if (change.action === "insert") {
            range = new Range(end.row, 0, end.row, end.column);
            lineUpToCursor = this.editor.getSession().getTextRange(range);
            commandFragment = getLastCommandFragment(lineUpToCursor);
            if ((commandFragment != null) && commandFragment.length > 2) {
              return setTimeout((function(_this) {
                return function() {
                  return _this.editor.execCommand("startAutocomplete");
                };
              })(this), 0);
            }
          }
        }
      };

      this.monkeyPatchAutocomplete = function() {
        var Autocomplete, Util, editor;
        Autocomplete =require("ace/autocomplete").Autocomplete;
        Util =require("ace/autocomplete/util");
        editor = this.editor;
        if (Autocomplete.prototype._insertMatch == null) {
          Autocomplete.prototype._insertMatch = Autocomplete.prototype.insertMatch;
          Autocomplete.prototype.insertMatch = function(data) {
            var nextChar, pos, range;
            pos = editor.getCursorPosition();
            range = new Range(pos.row, pos.column, pos.row, pos.column + 1);
            nextChar = editor.session.getTextRange(range);
            if (this.completions.filterText.match(/^\\begin\{/) && nextChar === "}") {
              editor.session.remove(range);
            }
            return Autocomplete.prototype._insertMatch.call(this, data);
          };
          Autocomplete.startCommand = {
            name: "startAutocomplete",
            exec: (function(_this) {
              return function(editor) {
                var _ref;
                if (!editor.completer) {
                  editor.completer = new Autocomplete();
                }
                editor.completer.autoInsert = false;
                editor.completer.autoSelect = true;
                editor.completer.showPopup(editor);
                editor.completer.cancelContextMenu();
                return $((_ref = editor.completer.popup) != null ? _ref.container : void 0).css({
                  'font-size': _this.$scope.fontSize + 'px'
                });
              };
            })(this),
            bindKey: "Ctrl-Space|Ctrl-Shift-Space|Alt-Space"
          };
        }
        return Util.retrievePrecedingIdentifier = function(text, pos, regex) {
          var currentLine, currentLineOffset, fragment, i, _i, _ref;
          currentLineOffset = 0;
          for (i = _i = _ref = pos - 1; _ref <= 0 ? _i <= 0 : _i >= 0; i = _ref <= 0 ? ++_i : --_i) {
            if (text[i] === "\n") {
              currentLineOffset = i + 1;
              break;
            }
          }
          currentLine = text.slice(currentLineOffset, pos);
          fragment = getLastCommandFragment(currentLine) || "";
          return fragment;
        };
      };
      
      
}).call(AutoCompleteManager.prototype);

exports.AutoCompleteManager=AutoCompleteManager;


  });


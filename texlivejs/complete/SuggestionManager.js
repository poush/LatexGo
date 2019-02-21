  define("complete/SuggestionManager",[], function(require,exports,module) {
    var Parser, SuggestionManager;
    Parser =      function Parser(doc) {
        this.doc = doc;
      }

      Parser.prototype.parse = function() {
        var args, command, commandHash, commands, docState, optionalArgs, seen;
        commands = [];
        seen = {};
        while (command = this.nextCommand()) {
          docState = this.doc;
          optionalArgs = 0;
          while (this.consumeArgument("[", "]")) {
            optionalArgs++;
          }
          args = 0;
          while (this.consumeArgument("{", "}")) {
            args++;
          }
          commandHash = "" + command + "\\" + optionalArgs + "\\" + args;
          if (seen[commandHash] == null) {
            seen[commandHash] = true;
            commands.push([command, optionalArgs, args]);
          }
          this.doc = docState;
        }
        return commands;
      };

      Parser.prototype.commandRegex = /\\([a-zA-Z][a-zA-Z]+)/;

      Parser.prototype.nextCommand = function() {
        var i, match;
        i = this.doc.search(this.commandRegex);
        if (i === -1) {
          return false;
        } else {
          match = this.doc.match(this.commandRegex)[1];
          this.doc = this.doc.substr(i + match.length + 1);
          return match;
        }
      };

      Parser.prototype.consumeWhitespace = function() {
        var match;
        match = this.doc.match(/^[ \t\n]*/m)[0];
        return this.doc = this.doc.substr(match.length);
      };

      Parser.prototype.consumeArgument = function(openingBracket, closingBracket) {
        var bracketParity, i;
        this.consumeWhitespace();
        if (this.doc[0] === openingBracket) {
          i = 1;
          bracketParity = 1;
          while (bracketParity > 0 && i < this.doc.length) {
            if (this.doc[i] === openingBracket) {
              bracketParity++;
            } else if (this.doc[i] === closingBracket) {
              bracketParity--;
            }
            i++;
          }
          if (bracketParity === 0) {
            this.doc = this.doc.substr(i);
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      };
      
exports.Parser=Parser;
    
    SuggestionManager = function SuggestionManager() {}

      SuggestionManager.prototype.getCompletions = function(editor, session, pos, prefix, callback) {
        var caption, command, commands, completions, doc, i, parser, snippet, _i, _len;
        doc = session.getValue();
        parser = new Parser(doc);
        commands = parser.parse();
        completions = [];
        for (_i = 0, _len = commands.length; _i < _len; _i++) {
          command = commands[_i];
          caption = "\\" + command[0];
          snippet = caption;
          i = 1;
          _.times(command[1], function() {
            snippet += "[${" + i + "}]";
            caption += "[]";
            return i++;
          });
          _.times(command[2], function() {
            snippet += "{${" + i + "}}";
            caption += "{}";
            return i++;
          });
          if (caption !== prefix) {
            completions.push({
              caption: caption,
              snippet: snippet,
              meta: "cmd"
            });
          }
        }
        return callback(null, completions);
      };

      SuggestionManager.prototype.loadCommandsFromDoc = function(doc) {
        var parser;
        parser = new Parser(doc);
        return this.commands = parser.parse();
      };

      SuggestionManager.prototype.getSuggestions = function(commandFragment) {
        var matchingCommands;
        matchingCommands = _.filter(this.commands, function(command) {
          return command[0].slice(0, commandFragment.length) === commandFragment;
        });
        return _.map(matchingCommands, function(command) {
          var args, base, completionAfterCursor, completionAfterCurspr, completionBase, completionBeforeCursor, curlyArgsNo, squareArgsNo, totalArgs;
          base = "\\" + commandFragment;
          args = "";
          _.times(command[1], function() {
            return args = args + "[]";
          });
          _.times(command[2], function() {
            return args = args + "{}";
          });
          completionBase = command[0].slice(commandFragment.length);
          squareArgsNo = command[1];
          curlyArgsNo = command[2];
          totalArgs = squareArgsNo + curlyArgsNo;
          if (totalArgs === 0) {
            completionBeforeCursor = completionBase;
            completionAfterCurspr = "";
          } else {
            completionBeforeCursor = completionBase + args[0];
            completionAfterCursor = args.slice(1);
          }
          return {
            base: base,
            completion: completionBase + args,
            completionBeforeCursor: completionBeforeCursor,
            completionAfterCursor: completionAfterCursor
          };
        });
      };

      exports.SuggestionManager=SuggestionManager;

  
  });


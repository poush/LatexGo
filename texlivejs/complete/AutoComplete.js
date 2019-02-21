define("complete/AutoCompleteManager", ["require", "ace/range", "ace/autocomplete", "complete/SuggestionManager", "complete/Snippets"], function(require, exports, module) {

    var Range = require("ace/range").Range;
    var SuggestionManager = require("complete/SuggestionManager").SuggestionManager;
    var Snippets = require("complete/Snippets").Snippets;
    var getLastCommandFragment = function(lineUpToCursor) {
        var m;
        if (m = lineUpToCursor.match(/(\\[^\\ ]+)$/)) {
            return m[1];
        } else {
            return null;
        }
    };

    var AutoCompleteManager = function($editor) {
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
            Autocomplete = require("ace/autocomplete").Autocomplete;
            Util = require("ace/autocomplete/util");
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
                           return;
                           // return $((_ref = editor.completer.popup) != null ? _ref.container : void 0).css({
                           //     'font-size': 10 + 'px'
                           // });
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

    exports.AutoCompleteManager = AutoCompleteManager;


});


define("complete/SuggestionManager", [], function(require, exports, module) {

    var _each = function(obj, iteratee, context) {
        iteratee = optimizeCb(iteratee, context);
        var i, length;
        if (isArrayLike(obj)) {
            for (i = 0, length = obj.length; i < length; i++) {
                iteratee(obj[i], i, obj);
            }
        } else {
            var keys = _keys(obj);
            for (i = 0, length = keys.length; i < length; i++) {
                iteratee(obj[keys[i]], keys[i], obj);
            }
        }
        return obj;
    };

    // Return the results of applying the iteratee to each element.
    var _map = function(obj, iteratee, context) {
        iteratee = cb(iteratee, context);
        var keys = !isArrayLike(obj) && _keys(obj),
            length = (keys || obj).length,
            results = Array(length);
        for (var index = 0; index < length; index++) {
            var currentKey = keys ? keys[index] : index;
            results[index] = iteratee(obj[currentKey], currentKey, obj);
        }
        return results;
    };

    var _times = function(n, iteratee, context) {
        var accum = Array(Math.max(0, n));
        iteratee = optimizeCb(iteratee, context, 1);
        for (var i = 0; i < n; i++) accum[i] = iteratee(i);
        return accum;
    };

    var _filter = function(obj, predicate, context) {
        var results = [];
        predicate = cb(predicate, context);
        _each(obj, function(value, index, list) {
            if (predicate(value, index, list)) results.push(value);
        });
        return results;
    };

    var optimizeCb = function(func, context, argCount) {
        if (context === void 0) return func;
        switch (argCount == null ? 3 : argCount) {
            case 1:
                return function(value) {
                    return func.call(context, value);
                };
            case 3:
                return function(value, index, collection) {
                    return func.call(context, value, index, collection);
                };
            case 4:
                return function(accumulator, value, index, collection) {
                    return func.call(context, accumulator, value, index, collection);
                };
        }
        return function() {
            return func.apply(context, arguments);
        };
    };

    var cb = function(value, context, argCount) {
        if (value == null) return _.identity;
        if (_.isFunction(value)) return optimizeCb(value, context, argCount);
        if (_.isObject(value)) return _.matcher(value);
        return _.property(value);
    };

    var Parser, SuggestionManager;
    Parser = function Parser(doc) {
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

    exports.Parser = Parser;

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
            _times(command[1], function() {
                snippet += "[${" + i + "}]";
                caption += "[]";
                return i++;
            });
            _times(command[2], function() {
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
        matchingCommands = _filter(this.commands, function(command) {
            return command[0].slice(0, commandFragment.length) === commandFragment;
        });
        return _map(matchingCommands, function(command) {
            var args, base, completionAfterCursor, completionAfterCurspr, completionBase, completionBeforeCursor, curlyArgsNo, squareArgsNo, totalArgs;
            base = "\\" + commandFragment;
            args = "";
            _times(command[1], function() {
                return args = args + "[]";
            });
            _times(command[2], function() {
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

    exports.SuggestionManager = SuggestionManager;


});




define("complete/Snippets", [], function(require, exports, module) {

    var env, environments, snippets;
    environments = ["abstract", "align", "align*", "equation", "equation*", "gather", "gather*", "multline", "multline*", "split", "verbatim"];
    snippets = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = environments.length; _i < _len; _i++) {
            env = environments[_i];
            _results.push({
                caption: "\\begin{" + env + "}...",
                snippet: "\\begin{" + env + "}\n$1\n\\end{" + env + "}",
                meta: "env"
            });
        }
        return _results;
    })();
    snippets = snippets.concat([{
        caption: "\\begin{array}...",
        snippet: "\\begin{array}{${1:cc}}\n$2 & $3 \\\\\\\\\n$4 & $5\n\\end{array}",
        meta: "env"
    }, {
        caption: "\\begin{figure}...",
        snippet: "\\begin{figure}\n\\centering\n\\includegraphics{$1}\n\\caption{${2:Caption}}\n\\label{${3:fig:my_label}}\n\\end{figure}",
        meta: "env"
    }, {
        caption: "\\begin{tabular}...",
        snippet: "\\begin{tabular}{${1:c|c}}\n$2 & $3 \\\\\\\\\n$4 & $5\n\\end{tabular}",
        meta: "env"
    }, {
        caption: "\\begin{table}...",
        snippet: "\\begin{table}[$1]\n\\centering\n\\begin{tabular}{${2:c|c}}\n$3 & $4 \\\\\\\\\n$5 & $6\n\\end{tabular}\n\\caption{${7:Caption}}\n\\label{${8:tab:my_label}}\n\\end{table}",
        meta: "env"
    }, {
        caption: "\\begin{list}...",
        snippet: "\\begin{list}\n\\item $1\n\\end{list}",
        meta: "env"
    }, {
        caption: "\\begin{enumerate}...",
        snippet: "\\begin{enumerate}\n\\item $1\n\\end{enumerate}",
        meta: "env"
    }, {
        caption: "\\begin{itemize}...",
        snippet: "\\begin{itemize}\n\\item $1\n\\end{itemize}",
        meta: "env"
    }, {
        caption: "\\begin{frame}...",
        snippet: "\\begin{frame}{${1:Frame Title}}\n$2\n\\end{frame}",
        meta: "env"
    }]);
    exports.Snippets = snippets;
});

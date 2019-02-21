  define("complete/Snippets",[], function(require,exports,module) {
  
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
    snippets = snippets.concat([
      {
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
      }
    ]);
    exports.Snippets=snippets;
  });


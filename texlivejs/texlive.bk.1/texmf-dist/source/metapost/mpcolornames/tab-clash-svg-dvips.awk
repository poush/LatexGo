### file tab-clash-svg-dvips.awk
### Copyright 2009, 2011 Stephan Hennig
#
# This work may be distributed and/or modified under the conditions of
# the LaTeX Project Public License, either version 1.3 of this license
# or (at your option) any later version.  The latest version of this
# license is in http://www.latex-project.org/lppl.txt
#
BEGIN {
    FS = ":=|(|)|,"
}
/^[^:]+:=[(]*[0-9.,]+[)]*);$/ {
    name = $1
    color[$1] = color[$1] + 1
#    print name
}
END {
# Build file tab-clash-dvips-svg.tex.
    file = "tab-clash-svg-dvips.tex"
    print "%%% file " file > file
    print "\\vspace{\\floatsep}" >> file
    print "\\begin{multicols}{4}[\\noindent\\parbox{\\textwidth}{%" >> file
    print "    \\captionof{table}{Color names clashing in SVG (left) and DVIPS (right) specifications.}%" >> file
    print "    \\label{tab:clash-svg-dvips}%" >> file
    print "  }]" >> file
    print "  \\raggedcolumns" >> file
    print "  \\setlength{\\parindent}{0pt}" >> file
    print "  \\ttfamily\\small\\color{mpcolor}" >> file
    ncolors = asorti(color, sortcolor)# requires gawk
    n = 0
    for (i = 1; i <= ncolors; i++) {
        name = sortcolor[i]
        if (color[name] > 1) {
            n++
            print "\\colorproof{" name "}\\par" >> file
        }
    }
    print "\\end{multicols}" >> file
    print "Found " n " color names clashing in SVG and DVIPS specs."
}

### file spec-plain-mp.awk
### Copyright 2009, 2011 Stephan Hennig
#
# This work may be distributed and/or modified under the conditions of
# the LaTeX Project Public License, either version 1.3 of this license
# or (at your option) any later version.  The latest version of this
# license is in http://www.latex-project.org/lppl.txt
#
BEGIN {
    FS = " = |\\(|\\)|,"
    i = 0
}
# file version
/base_version=\"[0-9.]+[a-z]*\";/ {
    match($0, "base_version=\"[0-9.]+[a-z]*\"")
    version = substr($0, RSTART, RLENGTH)
    match($0, "[0-9.]+[a-z]*")
    version = substr($0, RSTART, RLENGTH)
}
# RGB color spec
/^[a-z]+ = \([0-9.]+,[0-9.]+,[0-9.]+\);$/ {
    i++
    name[i] = $1
    r[i] = $3
    g[i] = $4
    b[i] = $5
#    print name[i] "=(" r[i] "," g[i] "," b[i] ")"
}
END {
    print "Found " i " plain.mp colors (" version ")."
# Build file mpcolornames-spec-plain-mp.mp.
    file = "mpcolornames-spec-plain-mp.mp"
    print "%%% file " file > file
    print "%%% Copyright 2009, 2011 Stephan Hennig" >> file
    print "%" >> file
    print "% This work may be distributed and/or modified under the conditions of" >> file
    print "% the LaTeX Project Public License, either version 1.3 of this license" >> file
    print "% or (at your option) any later version.  The latest version of this" >> file
    print "% license is in http://www.latex-project.org/lppl.txt" >> file
    print "%" >> file
    print "def _mpcolornames_spec_plain_mp=" >> file
    print "rgbcolor" >> file
    for (j = 1; j < i; j++) print name[j] "," >> file
    print name[i] ";" >> file
    for (j = 1; j <= i; j++) print name[j] ":=(" r[j] "," g[j] "," b[j] ");" >> file
    print "enddef;" >> file
    print "endinput" >> file

# Build file proof-spec-plain-mp.mp.
    file = "proof-spec-plain-mp.mp"
    print "%%% file " file > file
    print "input proof-mpcolornames" >> file
    print "defaultcolormodel := 5;% RGB" >> file
    print "specname := \"plain-mp\";" >> file
    for (j = 1; j <= i; j++) print "proof(" name[j] ");" >> file
    print "end" >> file

# Build file tab-spec-plain-mp.tex.
    file = "tab-spec-plain-mp.tex"
    print "%%% file " file > file
    print "\\vspace{\\floatsep}" >> file
    print "\\begin{multicols}{5}[\\noindent\\parbox{\\textwidth}{%" >> file
    print "    \\captionof{table}{Default RGB colors in MetaPost.}%" >> file
    print "    \\label{tab:spec-plain-mp}%" >> file
    print "    \\footnotesize Taken from file \\texttt{plain.mp} " version " as distributed by MetaPost (" i " colors)." >> file
    print "  }]" >> file
    print "  \\raggedcolumns" >> file
    print "  \\setlength{\\parindent}{0pt}" >> file
    print "  \\ttfamily\\small\\color{mpcolor}" >> file
    for (j = 1; j <= i; j++) print "\\colorproof[plain-mp]{" name[j] "}\\par" >> file
    print "\\end{multicols}" >> file
}

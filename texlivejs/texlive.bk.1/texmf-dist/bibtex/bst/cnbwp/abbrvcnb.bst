%% $Id: abbrvcnb.bst 74 2013-12-19 13:30:20Z zw $
%% Developed by Z. Wagner (http://icebearsoft.euweb.cz)
%% for the Czech National Bank as a supplement to cnbwp.cls
%% It does not work with other classes!
%% Based on abbrvnat.bst, some functions are taken from there.

FUNCTION {class.name}{"cnbwp"}

FUNCTION {class.version}{"2005/12/23"}

ENTRY
  { address
    author
    booktitle
    chapter
    edition
    editor
    howpublished
    institution
    journal
    key
    month
    note
    number
    organization
    pages
    publisher
    school
    series
    title
    type
    volume
    year
  }
  {}
  { label extra.label sort.label short.list }

% <longlabel> <label> <type> start.item
FUNCTION {start.item} {
  "l" change.case$
  "\" swap$ * "Item[" * write$
  write$ write$
  "]{" write$
  cite$ write$ "}{" write$ newline$
}

% <content> <name> output.field
FUNCTION {output.field} {
  swap$ duplicate$ empty$
  { pop$ pop$ }
  { swap$ " = {" * "  " swap$ * write$ write$ "}," write$ newline$ }
  if$
}

FUNCTION {end.item} {
  "}" write$ newline$
  "" write$ newline$
}

FUNCTION {not}
{   { #0 }
    { #1 }
  if$
}

FUNCTION {and}
{   'skip$
    { pop$ #0 }
  if$
}

FUNCTION {or}
{   { pop$ #1 }
    'skip$
  if$
}

STRINGS { s t }

INTEGERS { nameptr namesleft numnames }

FUNCTION {field.or.null}
{ duplicate$ empty$
    { pop$ "" }
    'skip$
  if$
}

FUNCTION {format.names}
{ 's :=
  #1 'nameptr :=
  s num.names$ 'numnames :=
  numnames 'namesleft :=
    { namesleft #0 > }

    { s nameptr 
	   nameptr #1 >
              { "{f.~}{vv~}{ll}{ jj}" }
              { "{vv~}{ll}{, jj}{, f.}" }
	   if$
        format.name$ 't :=
      nameptr #1 >
	{ namesleft #1 >
	    { ", " * t * }
	    { numnames #2 >
		{ "," * }
		'skip$
	      if$
	      t "others" =
		{ " et~al." * }
		{ " and " * t * }
	      if$
	    }
	  if$
	}
	't
      if$
      nameptr #1 + 'nameptr :=
      namesleft #1 - 'namesleft :=
    }
  while$
}

FUNCTION {format.XXX.names}
{ 's :=
  #1 'nameptr :=
  s num.names$ 'numnames :=
  numnames 'namesleft :=
    { namesleft #0 > }
    { s nameptr "{vv~}{ll}{~jj}{~f.}" format.name$ 't :=
      nameptr #1 >
        { namesleft #1 >
            { ", " * t * }
            { numnames #2 >
                { "," * }
                'skip$
              if$
              t "others" =
                { " et~al." * }
                { " and " * t * }
              if$
            }
          if$
        }
        't
      if$
      nameptr #1 + 'nameptr :=
      namesleft #1 - 'namesleft :=
    }
  while$
}

FUNCTION {format.key}
{ empty$
    { key field.or.null }
    { "" }
  if$
}

FUNCTION {format.authors}
{ author empty$
    { "" }
    { author format.names }
  if$
}

FUNCTION {format.editors}
{ editor empty$
    { "" }
    { editor format.names }
  if$
}

FUNCTION {format.title}
{ title empty$
    { "" }
    { title "t" change.case$ }
  if$
}

FUNCTION {format.full.names}
{'s :=
  #1 'nameptr :=
  s num.names$ 'numnames :=
  numnames 'namesleft :=
    { namesleft #0 > }
    { s nameptr
      "{vv~}{ll}" format.name$ 't :=
      nameptr #1 >
        {
          namesleft #1 >
            { ", " * t * }
            {
              numnames #2 >
                { "," * }
                'skip$
              if$
              t "others" =
                { " et~al." * }
                { " and " * t * }
              if$
            }
          if$
        }
        't
      if$
      nameptr #1 + 'nameptr :=
      namesleft #1 - 'namesleft :=
    }
  while$
}

FUNCTION {author.editor.full}
{ author empty$
    { editor empty$
        { "" }
        { editor format.full.names }
      if$
    }
    { author format.full.names }
  if$
}

FUNCTION {author.full}
{ author empty$
    { "" }
    { author format.full.names }
  if$
}

FUNCTION {editor.full}
{ editor empty$
    { "" }
    { editor format.full.names }
  if$
}

FUNCTION {make.full.names}
{ type$ "book" =
  type$ "inbook" =
  or
    'author.editor.full
    { type$ "proceedings" =
        'editor.full
        'author.full
      if$
    }
  if$
}

FUNCTION {n.dashify}
{ 't :=
  ""
    { t empty$ not }
    { t #1 #1 substring$ "-" =
        { t #1 #2 substring$ "--" = not
            { "--" *
              t #2 global.max$ substring$ 't :=
            }
            {   { t #1 #1 substring$ "-" = }
                { "-" *
                  t #2 global.max$ substring$ 't :=
                }
              while$
            }
          if$
        }
        { t #1 #1 substring$ *
          t #2 global.max$ substring$ 't :=
        }
      if$
    }
  while$
}

FUNCTION {push.labels} {
  ")" make.full.names duplicate$ short.list =
  { pop$ }
  { * }
  if$
  label
}

FUNCTION {output.pages} {
  pages missing$
  'skip$
  { pages n.dashify "pages" output.field }
  if$
}

FUNCTION {thesis.type} {
  push.labels type$ start.item
  format.authors "author" output.field
  title "title" output.field
  school "school" output.field
  year "year" output.field
  % optional
  type "type" output.field
  address "address" output.field
  month "month" output.field
  note "note" output.field
  end.item
}

FUNCTION {mastersthesis} {thesis.type}

FUNCTION {phdthesis} {thesis.type}

FUNCTION {misc} {
  push.labels "misc" start.item
  % optional
  format.authors "author" output.field
  title "title" output.field
  howpublished "howpublished" output.field
  month "month" output.field
  year "year" output.field
  note "note" output.field
  end.item
}

FUNCTION {unpublished} {
  push.labels type$ start.item
  format.authors "author" output.field
  title "title" output.field
  note "note" output.field
  % optional
  month "month" output.field
  year "year" output.field
  end.item
}

FUNCTION {manual} {
  push.labels type$ start.item
  title "title" output.field
  % optional
  format.authors "author" output.field
  organization "organization" output.field
  address "address" output.field
  edition "edition" output.field
  month "month" output.field
  year "year" output.field
  note "note" output.field
  end.item
}

FUNCTION {techreport} {
  push.labels type$ start.item
  format.authors "author" output.field
  title "title" output.field
  institution "institution" output.field
  year "year" output.field
  % optional
  type "type" output.field
  number "number" output.field
  address "address" output.field
  month "month" output.field
  note "note" output.field
  end.item
}

FUNCTION {booklet} {
  push.labels type$ start.item
  title "title" output.field
  % optional
  format.authors "author" output.field
  howpublished "howpublished" output.field
  address "address" output.field
  edition "edition" output.field
  month "month" output.field
  year "year" output.field
  note "note" output.field
  end.item
}

FUNCTION {proceedings} {
  push.labels type$ start.item
  title "title" output.field
  year "year" output.field
  % optional
  format.editors "editor" output.field
  volume "volume" output.field
  number "number" output.field
  series "series" output.field
  address "address" output.field
  month "month" output.field
  organization "organization" output.field
  publisher "publisher" output.field
  note "note" output.field
  end.item
}

FUNCTION {inproceedings} {
  push.labels type$ start.item
  format.authors "author" output.field
  title "title" output.field
  booktitle "booktitle" output.field
  year "year" output.field
  % optional
  format.editors "editor" output.field
  volume "volume" output.field
  number "number" output.field
  series "series" output.field
  output.pages
  address "address" output.field
  month "month" output.field
  organization "organization" output.field
  publisher "publisher" output.field
  note "note" output.field
  end.item
}

FUNCTION {conference} {inproceedings}

FUNCTION {book} {
  push.labels type$ start.item
  format.authors "author" output.field
  format.editors "editor" output.field
  title "title" output.field
  publisher "publisher" output.field
  year "year" output.field
  % optional
  volume "volume" output.field
  number "number" output.field
  series "series" output.field
  address "address" output.field
  edition "edition" output.field
  month "month" output.field
  note "note" output.field
  end.item
}

FUNCTION {inbook} {
  push.labels type$ start.item
  format.authors "author" output.field
  format.editors "editor" output.field
  title "title" output.field
  chapter "chapter" output.field
  output.pages
  publisher "publisher" output.field
  year "year" output.field
  % optional
  volume "volume" output.field
  number "number" output.field
  series "series" output.field
  type "type" output.field
  address "address" output.field
  edition "edition" output.field
  month "month" output.field
  note "note" output.field
  end.item
}

FUNCTION {incollection} {
  push.labels type$ start.item
  format.authors "author" output.field
  title "title" output.field
  booktitle "booktitle" output.field
  publisher "publisher" output.field
  year "year" output.field
  % optional
  format.editors "editor" output.field
  volume "volume" output.field
  number "number" output.field
  series "series" output.field
  type "type" output.field
  chapter "chapter" output.field
  output.pages
  address "address" output.field
  edition "edition" output.field
  month "month" output.field
  note "note" output.field
  end.item
}

FUNCTION {article} {
  push.labels type$ start.item
  format.authors "author" output.field
  title "title" output.field
  journal "journal" output.field
  year "year" output.field
  % optional
  volume "volume" output.field
  number "number" output.field
  output.pages
  month "month" output.field
  note "note" output.field
  end.item
}

FUNCTION {default.type} {misc}



MACRO {jan} {"Jan."}

MACRO {feb} {"Feb."}

MACRO {mar} {"Mar."}

MACRO {apr} {"Apr."}

MACRO {may} {"May"}

MACRO {jun} {"June"}

MACRO {jul} {"July"}

MACRO {aug} {"Aug."}

MACRO {sep} {"Sept."}

MACRO {oct} {"Oct."}

MACRO {nov} {"Nov."}

MACRO {dec} {"Dec."}



MACRO {acmcs} {"ACM Comput. Surv."}

MACRO {acta} {"Acta Inf."}

MACRO {cacm} {"Commun. ACM"}

MACRO {ibmjrd} {"IBM J. Res. Dev."}

MACRO {ibmsj} {"IBM Syst.~J."}

MACRO {ieeese} {"IEEE Trans. Softw. Eng."}

MACRO {ieeetc} {"IEEE Trans. Comput."}

MACRO {ieeetcad}
 {"IEEE Trans. Comput.-Aided Design Integrated Circuits"}

MACRO {ipl} {"Inf. Process. Lett."}

MACRO {jacm} {"J.~ACM"}

MACRO {jcss} {"J.~Comput. Syst. Sci."}

MACRO {scp} {"Sci. Comput. Programming"}

MACRO {sicomp} {"SIAM J. Comput."}

MACRO {tocs} {"ACM Trans. Comput. Syst."}

MACRO {tods} {"ACM Trans. Database Syst."}

MACRO {tog} {"ACM Trans. Gr."}

MACRO {toms} {"ACM Trans. Math. Softw."}

MACRO {toois} {"ACM Trans. Office Inf. Syst."}

MACRO {toplas} {"ACM Trans. Prog. Lang. Syst."}

MACRO {tcs} {"Theoretical Comput. Sci."}


READ

FUNCTION {sortify}
{ purify$
  "l" change.case$
}

INTEGERS { len }

FUNCTION {chop.word}
{ 's :=
  'len :=
  s #1 len substring$ =
    { s len #1 + global.max$ substring$ }
    's
  if$
}

FUNCTION {format.lab.names}
{ 's :=
  s #1 "{vv~}{ll}" format.name$
  s num.names$ duplicate$
  #2 >
    { pop$ " et~al." * }
    { #2 <
        'skip$
        { s #2 "{ff }{vv }{ll}{ jj}" format.name$ "others" =
            { " et~al." * }
            { " and " * s #2 "{vv~}{ll}" format.name$ * }
          if$
        }
      if$
    }
  if$
}

FUNCTION {author.key.label}
{ author empty$
    { key empty$
        { cite$ #1 #3 substring$ }
        'key
      if$
    }
    { author format.lab.names }
  if$
}

FUNCTION {author.editor.key.label}
{ author empty$
    { editor empty$
        { key empty$
            { cite$ #1 #3 substring$ }
            'key
          if$
        }
        { editor format.lab.names }
      if$
    }
    { author format.lab.names }
  if$
}

FUNCTION {author.key.organization.label}
{ author empty$
    { key empty$
        { organization empty$
            { cite$ #1 #3 substring$ }
            { "The " #4 organization chop.word #3 text.prefix$ }
          if$
        }
        'key
      if$
    }
    { author format.lab.names }
  if$
}

FUNCTION {editor.key.organization.label}
{ editor empty$
    { key empty$
        { organization empty$
            { cite$ #1 #3 substring$ }
            { "The " #4 organization chop.word #3 text.prefix$ }
          if$
        }
        'key
      if$
    }
    { editor format.lab.names }
  if$
}

FUNCTION {calc.short.authors}
{ type$ "book" =
  type$ "inbook" =
  or
    'author.editor.key.label
    { type$ "proceedings" =
        'editor.key.organization.label
        { type$ "manual" =
            'author.key.organization.label
            'author.key.label
          if$
        }
      if$
    }
  if$
  'short.list :=
}

FUNCTION {calc.label}
{ calc.short.authors
  short.list
  "("
  *
  year duplicate$ empty$
  short.list key field.or.null = or
     { pop$ "" }
     'skip$
  if$
  *
  'label :=
}

FUNCTION {sort.format.names}
{ 's :=
  #1 'nameptr :=
  ""
  s num.names$ 'numnames :=
  numnames 'namesleft :=
    { namesleft #0 > }
    {
      s nameptr "{vv{ } }{ll{ }}{  f{ }}{  jj{ }}" format.name$ 't :=
      nameptr #1 >
        {
          "   "  *
          namesleft #1 = t "others" = and
            { "zzzzz" * }
            { numnames #2 > nameptr #2 = and
                { "zz" * year field.or.null * "   " * }
                'skip$
              if$
              t sortify *
            }
          if$
        }
        { t sortify * }
      if$
      nameptr #1 + 'nameptr :=
      namesleft #1 - 'namesleft :=
    }
  while$
}

FUNCTION {sort.format.title}
{ 't :=
  "A " #2
    "An " #3
      "The " #4 t chop.word
    chop.word
  chop.word
  sortify
  #1 global.max$ substring$
}

FUNCTION {author.sort}
{ author empty$
    { key empty$
        { "to sort, need author or key in " cite$ * warning$
          ""
        }
        { key sortify }
      if$
    }
    { author sort.format.names }
  if$
}

FUNCTION {author.editor.sort}
{ author empty$
    { editor empty$
        { key empty$
            { "to sort, need author, editor, or key in " cite$ * warning$
              ""
            }
            { key sortify }
          if$
        }
        { editor sort.format.names }
      if$
    }
    { author sort.format.names }
  if$
}

FUNCTION {author.organization.sort}
{ author empty$
    { organization empty$
        { key empty$
            { "to sort, need author, organization, or key in " cite$ * warning$
              ""
            }
            { key sortify }
          if$
        }
        { "The " #4 organization chop.word sortify }
      if$
    }
    { author sort.format.names }
  if$
}

FUNCTION {editor.organization.sort}
{ editor empty$
    { organization empty$
        { key empty$
            { "to sort, need editor, organization, or key in " cite$ * warning$
              ""
            }
            { key sortify }
          if$
        }
        { "The " #4 organization chop.word sortify }
      if$
    }
    { editor sort.format.names }
  if$
}


FUNCTION {presort}
{ calc.label
  label sortify
  "    "
  *
  type$ "book" =
  type$ "inbook" =
  or
    'author.editor.sort
    { type$ "proceedings" =
        'editor.organization.sort
        { type$ "manual" =
            'author.organization.sort
            'author.sort
          if$
        }
      if$
    }
  if$
  "    "
  *
  cite$
  *
  #1 entry.max$ substring$
  'sort.label :=
  sort.label *
  #1 entry.max$ substring$
  'sort.key$ :=
}

ITERATE {presort}

SORT

STRINGS { longest.label last.label next.extra }

INTEGERS { longest.label.width last.extra.num number.label }

FUNCTION {initialize.longest.label}
{ "" 'longest.label :=
  #0 int.to.chr$ 'last.label :=
  "" 'next.extra :=
  #0 'longest.label.width :=
  #0 'last.extra.num :=
  #0 'number.label :=
}

FUNCTION {forward.pass}
{ last.label label =
    { last.extra.num #1 + 'last.extra.num :=
      last.extra.num int.to.chr$ 'extra.label :=
    }
    { "a" chr.to.int$ 'last.extra.num :=
      "" 'extra.label :=
      label 'last.label :=
    }
  if$
  number.label #1 + 'number.label :=
}

FUNCTION {reverse.pass}
{ next.extra "b" =
    { "a" 'extra.label := }
    'skip$
  if$
  extra.label 'next.extra :=
  extra.label
  duplicate$ empty$
    'skip$
    { "{\natexlab{" swap$ * "}}" * }
  if$
  'extra.label :=
  label extra.label * 'label :=
}

EXECUTE {initialize.longest.label}

ITERATE {forward.pass}

REVERSE {reverse.pass}

FUNCTION {bib.sort.order}
{ sort.label  'sort.key$ :=
}

ITERATE {bib.sort.order}

SORT

FUNCTION {begin.bib}
{
  "% Requires " class.name * " version " * class.version * " or newer" * write$ newline$
  "" write$ newline$
  "\begin{thebibliography}{" number.label int.to.str$ * "}" *
  write$ newline$
  preamble$ empty$
    'skip$
    { preamble$ write$ newline$ }
  if$
}

EXECUTE {begin.bib}

ITERATE {call.type$}

FUNCTION {end.bib}
{
  "\end{thebibliography}" write$ newline$
}

EXECUTE {end.bib}

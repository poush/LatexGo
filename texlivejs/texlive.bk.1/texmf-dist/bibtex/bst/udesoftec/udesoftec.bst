% !Mode:: "TeX:UTF-8"
%% udesoftec.bst
%% Copyright 2014-2015 J. Peter M. Schuler
%% 2018/03/28 v1.6.2 udesoftec
%
% This work may be distributed and/or modified under the
% conditions of the LaTeX Project Public License, either version 1.3
% of this license or (at your option) any later version.
% The latest version of this license is in
%   http://www.latex-project.org/lppl.txt
% and version 1.3 or later is part of all distributions of LaTeX
% version 2005/12/01 or later.
%
% This work has the LPPL maintenance status 'author-maintained'.
% 
% The current Maintainer of this work is J. Peter M. Schuler
% j.peter.m.schuler@uni-due.de
%

% special citation style which is based on german WIRTSCHAFTSINFORMATIK with some proper adjustments to reality
%
% most important things:
% * do not use crossref - it will be ignored but may raise warnings of not found entries due to wrong order in bibfile
% * journal articles are cited with short version, i.e.: <Name>, <volume>(<issue>):<pages>, <year>.
% * author forenames are one letter without dot
% * doi is shown everywhere available, if no doi is available fallback to ISBN and ISSN. ISBN and ISSN are not shown if doi is present.
% * edition field should be number without anything else, if so content gets ordinal and suffix, else plain content is displayed

ENTRY
  { address
    author
    booktitle
    chapter
    doi
    eid
    edition
    editor
    howpublished
    institution
    isbn
    issn
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
    standard
    title
    type
    url
      urldate
    volume
    year
  }
  {}
  { label extra.label sort.label short.list }

INTEGERS { output.state before.all mid.sentence after.sentence after.block before.bibitemtitle before.year}

FUNCTION {init.state.consts}
{ #0 'before.all :=
  #1 'mid.sentence :=
  #2 'after.sentence :=
  #3 'after.block :=
    #4 'before.bibitemtitle :=
    #5 'before.year :=
}

STRINGS { s t }

FUNCTION {output.justdonothing}
{ 's := 
    output.state mid.sentence =
    { "" * write$ }
    { "" * write$ }
if$
  s
}

FUNCTION {output.justdo}
{ 's := 
    output.state mid.sentence =
    { " " * write$ }
    { " " * write$ }
if$
  s
}

FUNCTION {output.justdobutcheck}
{ 't :=
  duplicate$ empty$
    { pop$ "empty " t * " in " * cite$ * warning$ }
    'output.justdo
  if$
}

FUNCTION {output.nonnull}
{ 's :=
  output.state mid.sentence =
    { ", " * write$ }
    { output.state after.block =
        { add.period$ write$
          newline$
          "\newblock " write$
        }
        { 
                    output.state before.all =
            'write$                 
            { 
                        output.state before.bibitemtitle =
                            {"\bblAuthorTitleSep{}" * write$ }
                            {
                            output.state before.bibitemtitle =
                                'write$
                                { output.state before.year =
                                    {"\bblAuthorYearSep{}" * write$ }
                                    {add.period$ " " * write$ }
                                    if$
                                }           
                                if$
                            }
                            if$
                        }                       
          if$
        }
      if$
      mid.sentence 'output.state :=
    }
  if$
  s
}
FUNCTION {output.nonnull2}
{ 's :=
  output.state mid.sentence =
    { ", " * write$ }
    { output.state after.block =
        { add.period$ write$
          newline$
          "\newblock " write$
        }
        { 
                    output.state before.all =
            'write$
                        { output.state before.year =
                            {"\bblAuthorYearSep" * write$ }
                            {add.period$ " " * write$ }
                            if$
                        }           
          if$
        }
      if$
      mid.sentence 'output.state :=
    }
  if$
  s
}
          

FUNCTION {output}
{ duplicate$ empty$
    'pop$
    'output.nonnull
  if$
}

FUNCTION {output.check}
{ 't :=
  duplicate$ empty$
    { pop$ "empty " t * " in " * cite$ * warning$ }
    'output.nonnull
  if$
}

FUNCTION {fin.entry}
{ %add.period$
  write$
  newline$
}

FUNCTION {new.block}
{ output.state before.all =  
        'skip$      
    { output.state before.bibitemtitle =
                'skip$
            {
                output.state before.year =
                {before.bibitemtitle 'output.state := }
                {after.block 'output.state := }
                if$
            }
            if$
        }
  if$
}

FUNCTION {new.sentence}
{ output.state after.block =
    'skip$
    { output.state before.all =
        'skip$
        { after.sentence 'output.state := }
      if$
    }
  if$
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

FUNCTION {new.block.checka}
{ empty$
    'skip$
    'new.block
  if$
}

FUNCTION {new.block.checkb}
{ empty$
  swap$ empty$
  and
    'skip$
    'new.block
  if$
}

FUNCTION {new.sentence.checka}
{ empty$
    'skip$
    'new.sentence
  if$
}

FUNCTION {new.sentence.checkb}
{ empty$
  swap$ empty$
  and
    'skip$
    'new.sentence
  if$
}

FUNCTION {field.or.null}
{ duplicate$ empty$
    { pop$ "" }
    'skip$
  if$
}

FUNCTION {emphasize}
{ duplicate$ empty$
    { pop$ "" }
    { "\emph{" swap$ * "}" * }
  if$
}

FUNCTION {bblnameformat} {"{vv~}{ll}{~jj}"} % von Matera, M; Rizzo, F; Carughi, GT
FUNCTION {bblnameformat2} {"{f{}}"} % von Matera, M; Rizzo, F; Carughi, GT

INTEGERS { nameptr namesleft numnames }
FUNCTION {format.names}
{ 's :=
  #1 'nameptr :=
  s num.names$ 'numnames :=
  numnames 'namesleft :=
    { namesleft #0 > }
    { s nameptr bblnameformat format.name$ "\bblFirstnameSep{}" * s nameptr bblnameformat2 format.name$ * 't :=
      nameptr #1 >
        { namesleft #1 >
            { "\bblAuthorsSep{}" * t * }
            { numnames #2 >
                { "" * }
                'skip$
              if$
              t "others" =
                { "" * }
                { "\bblAuthorsSep{}" * t * }
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

FUNCTION {format.cities}
{ 's :=
  #1 'nameptr :=
  s num.names$ 'numnames :=
  numnames 'namesleft :=
    { namesleft #0 > }
    { s nameptr  "{ll}" format.name$ 't :=
      nameptr #1 >
        { "XXXXX" }
        't
      if$
      nameptr #1 + 'nameptr :=
      namesleft #1 - 'namesleft :=
    }
  while$
}

FUNCTION {format.address}
{ address empty$
    { "" }
    { "\bblAddress{" address * "}" * }
  if$
}


FUNCTION {format.key}
{ empty$
    { key field.or.null }
    { "" }
  if$
}

FUNCTION {format.inEdBooktitle}
{ duplicate$ empty$
    { pop$ "" }
    { "\bblFontInBookTitle{" swap$ * "}" * }
  if$
}
FUNCTION {format.journaltitle}
{ duplicate$ empty$
    { pop$ "" }
    { "\bblin \bblFontJournalTitle{" swap$ * "}" * }
  if$
}

FUNCTION {format.authorStyleInText}
{ duplicate$ empty$
    { pop$ "" }
    { "\bblFontAuthorInText{" swap$ * "}" * }
  if$
}

FUNCTION {format.authorStyleInList}
{ duplicate$ empty$
    { pop$ "" }
    {
            "\bblFontAuthorInList{" swap$ * "}" *
            }
  if$
}
 
FUNCTION {format.authors} % for reference list
{ author empty$
    { "" }
    { author format.names format.authorStyleInList
        }       
  if$
}

FUNCTION {format.standard} % for reference list
{ standard empty$
    { type "\bblstdseptypenum" * number * "\bblstdsepnumed" * edition * format.authorStyleInList } 
    { standard format.authorStyleInList
        }       
  if$
}

FUNCTION {format.editors}
{ editor empty$
    { "" }
    { editor format.names 
      editor num.names$ #1 >
        { "\bbleds" * }
        { "\bbled" * }
      if$
    }
  if$
}

FUNCTION {format.editorsAsAuthors}
{ editor empty$
    { "" }
    { editor format.names format.authorStyleInList
      editor num.names$ #1 >
        { "\bbleds" format.authorStyleInList * }
        { "\bbled" format.authorStyleInList * }
      if$
    }
  if$
}


FUNCTION {format.isbn}
{ isbn empty$
    { "" }
    { new.block "\bblisbn{" isbn * "}" * }
  if$
}

FUNCTION {format.issn}
{ issn empty$
    { "" }
    { new.block "\bblissn{" issn * "}" * }
  if$
}

FUNCTION {format.url}
{ url empty$
    { "" }
    { new.block "\url{" url * "}" * }
  if$
}

FUNCTION {format.urldate}
{ urldate empty$
    { "" }
    { "\bblurldate{" urldate * "}" * }
  if$
}

FUNCTION {format.doi}
{ doi empty$
    { "" }
    { new.block "\bbldoi{" doi * "}" * }
  if$
}

FUNCTION {format.title}
{ title empty$
    { "" }
    { "\bblFontBookTitle{" title * "}" * 
          before.bibitemtitle 'output.state :=

        }
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
                { " \bbletal " * }
                { " \bbland " * t * }
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

FUNCTION {output.bibitem}
{ newline$
  "\bibitem[" write$
  label write$
  ")" make.full.names duplicate$ short.list =
     { pop$ }
     { * }
   if$
  "]{" * write$
  cite$ write$
  "}" write$
  newline$
  ""
  before.all 'output.state :=
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

FUNCTION {format.date}
{ year duplicate$ empty$
    { "empty year in " cite$ * warning$
       pop$ "\bblnoyearlong" } %for list of citations
    'skip$
  if$
  month empty$
    'skip$
    { month
      " " * swap$ *
    }
  if$
  extra.label *
}

FUNCTION {format.year}
{
        "\bblFontYearInList{\bblYear{" format.date * "}}" *
      before.year 'output.state :=
}

FUNCTION {format.yearpublished}
{
        "\bblpublishdate{" format.date * "}" *
       before.year 'output.state :=
}

FUNCTION {format.standardpublished}
{
        "\bblstandardpublishdate{" format.date * "}" *
}

FUNCTION {format.btitle}
{ 
    "\bblFontBookTitle{" title * "}" *
  before.bibitemtitle 'output.state :=
}

FUNCTION {tie.or.space.connect}
{ duplicate$ text.length$ #3 <
    { "~" }
    { " " }
  if$
  swap$ * *
}

FUNCTION {either.or.check}
{ empty$
    'pop$
    { "can't use both " swap$ * " fields in " * cite$ * warning$ }
  if$
}

FUNCTION {format.bvolume}
{ 
  "volume and number" number either.or.check
  volume empty$
    { "" }
    { series empty$
        { "\bblSeries{\bblvol{} " * volume * "}" }
        { "\bblVolumeOfSeries{" * volume * "}{" * series * "}" }
      if$
    }
  if$
}

FUNCTION {format.number.series}
{ volume empty$
    { number empty$
        { series empty$
            { "" }
            { "\bblSeries{" * series * "}"  }
          if$
        }
        { series empty$
            { "" }
            { "\bblVolumeOfSeries{" * number * "}{" * series * "}" }
          if$
        }
        if$
    }
    { series empty$
        { "" }
        { "\bblVolumeOfSeries{" * volume * "}{" * series * "}" }
      if$ 
    }
    if$
}

FUNCTION {format.edition}
{ edition empty$
    { "" }
    { output.state mid.sentence =
        { "\bbledGenerateEdition{" edition * "}" * }
        { "\bbledGenerateEdition{" edition * "}" * }
      if$
    }
  if$
}

INTEGERS { multiresult }

FUNCTION {multi.page.check}
{ 't :=
  #0 'multiresult :=
    { multiresult not
      t empty$ not
      and
    }
    { t #1 #1 substring$
      duplicate$ "-" =
      swap$ duplicate$ "," =
      swap$ "+" =
      or or
        { #1 'multiresult := }
        { t #2 global.max$ substring$ 't := }
      if$
    }
  while$
  multiresult
}

FUNCTION {format.pages}
{ pages empty$
    { "" }
    { pages multi.page.check
        { "\bblpp" pages n.dashify tie.or.space.connect }
        { "\bblp" pages tie.or.space.connect }
      if$
    }
  if$
}

FUNCTION {format.eid}
{ eid empty$
    { "" }
    { "art." eid tie.or.space.connect }
  if$
}

FUNCTION {format.vol.num.pages}
{ volume field.or.null
  number empty$
    'skip$
    { "\penalty0 (" number * ")" * *
      volume empty$
        { "there's a number but no volume in " cite$ * warning$ }
        'skip$
      if$
    }
  if$
  pages empty$
    'skip$
    { duplicate$ empty$
        { pop$ format.pages }
        { ":\penalty0 " * pages n.dashify * }
      if$
    }
  if$
}

FUNCTION {format.vol.num.eid}
{ volume field.or.null
  number empty$
    'skip$
    { "\penalty0 (" number * ")" * *
      volume empty$
        { "there's a number but no volume in " cite$ * warning$ }
        'skip$
      if$
    }
  if$
  eid empty$
    'skip$
    { duplicate$ empty$
        { pop$ format.eid }
        { ":\penalty0 " * eid * }
      if$
    }
  if$
}

FUNCTION {format.chapter.pages}
{ chapter empty$
    'format.pages
    { type empty$
        { "chapter" }
        { type "l" change.case$ }
      if$
      chapter tie.or.space.connect
      pages empty$
        'skip$
        { ", " * format.pages * }
      if$
    }
  if$
}

FUNCTION {format.in.ed.booktitle}
{ booktitle empty$
    { "" }
    { editor empty$
        { "\bblin " booktitle format.inEdBookTitle * }
        { "\bblin " format.editors * "\bblAuthorTitleSepInEd{}" * booktitle format.inEdBookTitle * }
      if$
    }
  if$
}

FUNCTION {empty.misc.check}
{ author empty$ title empty$ howpublished empty$
  month empty$ year empty$ note empty$
  and and and and and
  key empty$ not and
    { "all relevant fields are empty in " cite$ * warning$ }
    'skip$
  if$
}

FUNCTION {format.thesis.type}
{ type empty$
    'skip$
    { pop$
      type "t" change.case$
    }
  if$
}

FUNCTION {format.tr.number}
{ type empty$
    { "Technical Report" }
    'type
  if$
  number empty$
    { "t" change.case$ }
    { number tie.or.space.connect }
  if$
}

FUNCTION {article}
{ output.bibitem
  format.authors "author" output.check
  author format.key output
  format.year output.nonnull
  format.title "title" output.check
  new.block 
  journal format.journaltitle "journal" output.check
  
  eid empty$
    { format.vol.num.pages  output.justdo }
    { format.vol.num.eid  output.justdo }
  if$
  
  format.doi empty$
    { format.issn output
      format.url output
      format.urldate output.justdo}
    { format.doi output}
  if$  
  new.block
  note output
  fin.entry
}

FUNCTION {book}
{ output.bibitem
  author empty$
    { format.editorsAsAuthors "author and editor" output.check
      editor format.key output
    }
    { format.authors output.nonnull

                "author and editor" editor either.or.check

    }
  if$   
  format.year output.nonnull
  format.btitle "title" output.check

        format.bvolume output
      new.block
      format.number.series output
      new.sentence
            format.edition output
      publisher "publisher" output.check
      format.address output
   
  format.doi empty$
    {format.isbn output
  format.url output
  format.urldate output.justdo}
    {}
    if$  
  format.doi output
  new.block
  note output
  fin.entry
}

FUNCTION {booklet}
{ output.bibitem
  format.authors output
  author format.key output
  format.year output.nonnull
  format.title "title" output.check
  howpublished address new.block.checkb
  howpublished output
  format.address output
  format.doi empty$
    {format.isbn output
  format.url output
  format.urldate output.justdo}
    {}
    if$  
  format.doi output
  new.block
  note output
  fin.entry
}

FUNCTION {inbook}
{ output.bibitem
  author empty$
    { format.editorsAsAuthors "author and editor" output.check
      editor format.key output
    }
    { format.authors output.nonnull
      "author and editor" editor either.or.check 
    }
  if$
  format.year output.nonnull
  format.btitle "title" output.check
 
        format.bvolume output
      format.chapter.pages "chapter and pages" output.check
      new.block
      format.number.series output
      new.sentence
      publisher "publisher" output.check
      format.address output
   
  format.edition output
  format.doi empty$
    {format.isbn output
  format.url output
  format.urldate output.justdo}
    {}
    if$  
  format.doi output
  new.block
  note output
  fin.entry
}

FUNCTION {incollection}
{ output.bibitem
  format.authors "author" output.check
  author format.key output
  format.year output.nonnull
  format.title "title" output.check
  new.block

  format.in.ed.booktitle "booktitle" output.check
  
  format.bvolume output.justdonothing
 
  format.chapter.pages output
  new.sentence
  format.edition output
  publisher "publisher" output.check
  format.address output

  format.doi empty$
    { format.isbn output
      format.url output
      format.urldate output.justdo
    }
    { format.doi output
    }
    if$  
  
  new.block
  note output
  fin.entry
}

FUNCTION {inproceedings}
{ output.bibitem
  format.authors "author" output.check
  author format.key output
  format.year output.nonnull
  format.title "title" output.check
  new.block

        format.in.ed.booktitle "booktitle" output.check
      format.bvolume output
      format.number.series output
      new.sentence
      address empty$
        { organization publisher new.sentence.checkb
          organization output
          publisher output
                    
        }
        { 
          organization output
          publisher output
          format.address output.nonnull
        }
      if$
      format.pages output

  format.doi empty$
    {format.isbn output
  format.url output
  format.urldate output.justdo}
    {}
    if$  
  format.doi output
  new.block
  note output
  fin.entry
}

FUNCTION {conference} { inproceedings }

FUNCTION {manual}
{ output.bibitem
  format.authors output
  author format.key output
    format.year output.nonnull
   format.btitle "title" output.check
  organization address new.block.checkb
  organization output
  format.address  output
  format.edition output
  format.date output
  format.url output
  format.urldate output.justdo
  new.block
  note output
  fin.entry
}

FUNCTION {mastersthesis}
{ output.bibitem
  format.authors "author" output.check
  author format.key output
 format.year output.nonnull
   format.title "title" output.check
  new.block
  "Master's thesis" format.thesis.type output.nonnull
  school "school" output.check
  format.address  output
  format.url output
  format.urldate output.justdo
  new.block
  note output
  fin.entry
}

FUNCTION {misc}
{ output.bibitem
  format.authors output
  author format.key output
  format.year output.nonnull
  title howpublished new.block.checkb
  format.title output
  howpublished new.block.checka
  howpublished output
  format.date output
  format.issn output
  format.url output
  format.urldate output.justdo
  new.block
  note output
  fin.entry
  empty.misc.check
}

FUNCTION {techstandard}
{ output.bibitem
  format.standard  output
  format.title "title" output.check
  new.sentence
  organization output
  publisher output
  format.address output
  new.sentence
  format.standardpublished output
  new.block
  
  doi empty$
    {
        format.isbn empty$
        {}
        {
            new.sentence
            format.isbn output
        }
        if$ 
        format.url output
        format.urldate output
    }
    {   
        new.sentence
        format.doi output
    }
    if$  
  
  new.block
  note output
  fin.entry
}

FUNCTION {phdthesis}
{ output.bibitem
  format.authors "author" output.check
  author format.key output
format.year output.nonnull
   format.btitle "title" output.check
  new.block
  "PhD thesis" format.thesis.type output.nonnull
  school "school" output.check
  format.address  output
  format.url output
  format.urldate output.justdo
  new.block
  note output
  fin.entry
}

FUNCTION {proceedings}
{ output.bibitem
  format.editorsAsAuthors output
  editor format.key output
  format.year output.nonnull
  format.btitle "title" output.check
  format.bvolume output
  format.number.series output
  new.sentence
  organization output
  publisher output
  format.address output
  format.doi empty$
    {format.isbn output
  format.url output
  format.urldate output.justdo}
    {}
    if$  
  format.doi output
  new.block
  note output
  fin.entry
}

FUNCTION {techreport}
{ output.bibitem
  format.authors "author" output.check
  author format.key output
  format.year output.nonnull
  format.title "title" output.check
  new.block
  format.tr.number output.nonnull
  institution "institution" output.check
  format.address  output
  format.date "year" output.check
  format.url output
  format.urldate output.justdo
  new.block
  note output
  fin.entry
}

FUNCTION {unpublished}
{ output.bibitem
  format.authors "author" output.check
  author format.key output
  format.year output.nonnull
  format.title "title" output.check
  new.block
  note "note" output.check
  format.date output
  format.url output
  format.urldate output.justdo
  fin.entry
}

MACRO {jan} {""}

MACRO {feb} {""}

MACRO {mar} {""}

MACRO {apr} {""}

MACRO {may} {""}

MACRO {jun} {""}

MACRO {jul} {""}

MACRO {aug} {""}

MACRO {sep} {""}

MACRO {oct} {""}

MACRO {nov} {""}

MACRO {dec} {""}


FUNCTION {default.type} { misc }


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
            { " \bbletal " * }
            { " \bbland " * s #2 "{vv~}{ll}" format.name$ * }
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
    { author format.lab.names format.authorStyleInText  }
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
    { author format.lab.names format.authorStyleInText }
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
    { author format.lab.names format.authorStyleInText }
  if$
}
FUNCTION {author.techstandard.label}
{ standard empty$
    { 'type " " * number * "-" * edition * "(" * }
    { standard format.authorStyleInText "(" *   }
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
    { editor format.lab.names format.authorStyleInText }
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
{ type$ "techstandard" =
    'author.techstandard.label
    {  calc.short.authors
      short.list
      "("
      *
      year duplicate$ empty$
      short.list key field.or.null = or
         { pop$ "" }
         'skip$
      if$ 
      *   
    }
  if$
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
      s nameptr "{vv{ } }{ll{ }}{  ff{ }}{  jj{ }}" format.name$ 't :=
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
  year field.or.null sortify
  *
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
{   preamble$ empty$
    'skip$
    { preamble$ write$ newline$ }
  if$
  "\begin{thebibliography}{" number.label int.to.str$ * "}" *
  write$ newline$
}

EXECUTE {begin.bib}

EXECUTE {init.state.consts}

ITERATE {call.type$}

FUNCTION {end.bib}
{ newline$
  "\end{thebibliography}" write$ newline$
}

EXECUTE {end.bib}

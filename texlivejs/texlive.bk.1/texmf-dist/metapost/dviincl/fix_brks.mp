if unknown ifi: string ifi; ifi:="~vicar~.mpx"; fi
if unknown ofi: string ofi; ofi:="~vicar~.mpy"; fi
selected_page:=1;
write "if selected_page=1:" to ofi; 
forever:
 % re-declaration apparently cures problems with the string pool with
 % large DVI files, such as TeXbook.DVI (Oostrum's DOS implementation
 % swallows occasionally strings and issues "???" instead)
 string l_; l_:=readfrom ifi;
 exitif (l_=EOF);
 if (l_="mpxbreak"):
   l_:="elseif selected_page=" & decimal(incr(selected_page)) & ":";
 fi
 write l_ to ofi;
endfor
write "errmessage " &
 ditto & "Non-existant page " & decimal(selected_page) & ditto & ";"
 to ofi; 
write "else:" to ofi; 
write "errmessage " &
 ditto & "Non-existant page " & ditto & " & decimal(selected_page);"
 to ofi; 
write "fi" to ofi; 
write "endinput" to ofi; 
end

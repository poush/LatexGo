vardef fix_page (expr p_,f_) =
 save selected_page; selected_page=p_;
 save setbounds; def setbounds text t = enddef; % we'd better ignore it
 scantokens ("input " & f_)
enddef;

endinput

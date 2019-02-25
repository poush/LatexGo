%%
%% naive paragraph formatting for metapost. You get better results using
%% btex .. etex, since that will give you kerning, ligatures, and the
%% famous TeX paragraph breaking algorithm. This one is OK for me, though,
%%
%% Copyright 2001,2003 Patrick TJ McPhee
%% everyone is welcome to use this code for any purpose, to modify it, and
%% to copy it in whole or in part for use in other macro sets, with the
%% conditions that this copyright notice be preserved with any significant
%% portion of the code, and that modifications to this file be clearly
%% marked.


% arguments
% s - text to format
% w - maximum width
% b = baseline skip

vardef breaktowidth(expr s, w, b) =
    save p;
    picture p;

    p := s infont defaultfont scaled defaultscale;
    % if the string is too long to fit within bounds, we break it up on
    % word boundaries.
    if xpart(lrcorner p) > w:
       save q, gq, offs, len, goodlen, gl, ls, sp;

       picture q, gq;
       numeric offs, len, goodlen, ls, gl;
       string sp;

       p := nullpicture;
       offs := 0;                    % offset of current substring within s
       len := 1;                     % most recent character examined
       goodlen := 0;                 % most recent reasonable break point
       ls := length(s);

       forever:
         if len < ls:
           sp := substring(len, len+1) of s;
         else:
           sp := " ";
         fi;

         if (sp = " ") or (sp = "-") or (sp = "/"):

           if sp <>" ":
              len := len + 1;
           fi;

           % test to see if this is within the needed width
           q := (substring(offs, len) of s) infont defaultfont scaled defaultscale;


	   if xpart (lrcorner q) > w:
             % if there's no good break point, build up until we
             % get something that fits -- can't use goodlen as the
             % array index as it is reset to 0 after the loop ends
             if goodlen <= offs:
               for gl = (len-1) downto (offs+1):
                 goodlen := gl;
                 gq := (substring(offs, goodlen) of s) infont defaultfont scaled defaultscale;
                 exitunless xpart (lrcorner gq) > w;
               endfor;
             fi;
               

             p := image(draw p shifted (0, b);
			draw gq;);
	     offs := goodlen;
	     len := offs + 1;

           % we still fit, so save the current position
	   else:
             if sp <> " ":
	       goodlen := len;
             else:
	       goodlen := len+1;
             fi;
	     gq := q;
	   fi;
	 fi;

         exitunless len < ls;

         len := len + 1;
       endfor;

       if goodlen < ls:
         gq := (substring(offs, ls) of s) infont defaultfont scaled defaultscale;
       fi;

       if goodlen <> ls:
         p := image(draw p shifted (0, b);
                    draw gq;);
       fi;
    fi;
    p
enddef;


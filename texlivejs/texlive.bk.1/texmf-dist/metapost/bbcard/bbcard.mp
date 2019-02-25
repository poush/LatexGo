
% bullshit bingo card
% prepared by patrick tj mcphee, december 2002 ptjm@interlog.com
% released to the public domain. have fun

% concept and many phrases taken from
%  http://www.perkigoth.com/home/kermit/stuff/BullshitBingo
% others from the list of banished words of Lake Superior State University:
%  http://www.lssu.edu/banished
% my thanks to all who have contributed to these efforts

% to run off a single card, give a command like
%  mpost bbcard
% and the card will written to bbcard.ps

% to run off cards for several players, try
%  mpost '\nocards := 7; input bbcard'
% and the cards will be written to bbcard.1, bbcard.2, .., bbcard.7

% to add additional phrases, duplicate one of the lines starting with
%  i := i + 1; bs[i] :=
% and replace the phrase in quotes
% I keep them in alphabetical order to ease maintenance, but you don't
% have to. I suggest commenting out phrases which are not known in
% your community and adding the irritating ones which are.

input breakwidth;

defaultfont := "ptmr8r";

prologues := 2;

string bs[];
i := 0;

i := i + 1; bs[i] := "action item";
i := i + 1; bs[i] := "actual facts";
i := i + 1; bs[i] := "articulate";
i := i + 1; bs[i] := "as we speak";
i := i + 1; bs[i] := "at the end of the day";
i := i + 1; bs[i] := "at this point in time";
i := i + 1; bs[i] := "backward compatible";
i := i + 1; bs[i] := "ballpark";
i := i + 1; bs[i] := "bandwidth";
i := i + 1; bs[i] := "basically";
i := i + 1; bs[i] := "been there, done that";
i := i + 1; bs[i] := "benchmark";
i := i + 1; bs[i] := "best of breed";
i := i + 1; bs[i] := "best practice";
i := i + 1; bs[i] := "buzz";
i := i + 1; bs[i] := "by and large";
i := i + 1; bs[i] := "challenge";
i := i + 1; bs[i] := "client-focused";
i := i + 1; bs[i] := "collaborative";
i := i + 1; bs[i] := "conceptualize";
i := i + 1; bs[i] := "core business";
i := i + 1; bs[i] := "core competency";
i := i + 1; bs[i] := "critical path";
i := i + 1; bs[i] := "down the road";
i := i + 1; bs[i] := "down time";
i := i + 1; bs[i] := "downsizing";
i := i + 1; bs[i] := "drill down";
i := i + 1; bs[i] := "dynamic";
i := i + 1; bs[i] := "each and every";
i := i + 1; bs[i] := "empower employees";
i := i + 1; bs[i] := "extreme";
i := i + 1; bs[i] := "fast-track";
i := i + 1; bs[i] := "fault tolerant";
i := i + 1; bs[i] := "front lines";
i := i + 1; bs[i] := "game plan";
i := i + 1; bs[i] := "gap analysis";
i := i + 1; bs[i] := "go public";
i := i + 1; bs[i] := "go the extra mile";
i := i + 1; bs[i] := "going forward";
i := i + 1; bs[i] := "hard-won lessons";
i := i + 1; bs[i] := "hardball";
i := i + 1; bs[i] := "having said that";
i := i + 1; bs[i] := "heads up";
i := i + 1; bs[i] := "issues";
i := i + 1; bs[i] := "knock-on effect";
i := i + 1; bs[i] := "knowledgebase";
i := i + 1; bs[i] := "lessons learned";
i := i + 1; bs[i] := "make no mistake";
i := i + 1; bs[i] := "manage expectations";
i := i + 1; bs[i] := "meaningful";
i := i + 1; bs[i] := "metrics";
i := i + 1; bs[i] := "mind share";
i := i + 1; bs[i] := "mindset";
i := i + 1; bs[i] := "mission critical";
i := i + 1; bs[i] := "move the goal posts";
i := i + 1; bs[i] := "movers and shakers";
i := i + 1; bs[i] := "new economy";
i := i + 1; bs[i] := "no blame";
i := i + 1; bs[i] := "no-brainer";
i := i + 1; bs[i] := "now, more than ever";
i := i + 1; bs[i] := "off-site meeting";
i := i + 1; bs[i] := "off-the-shelf";
i := i + 1; bs[i] := "offload";
i := i + 1; bs[i] := "on the same page";
i := i + 1; bs[i] := "open source";
i := i + 1; bs[i] := "out of the loop";
i := i + 1; bs[i] := "out-source";
i := i + 1; bs[i] := "outside the box";
i := i + 1; bs[i] := "paradigm";
i := i + 1; bs[i] := "partnership";
i := i + 1; bs[i] := "proactive, not reactive";
i := i + 1; bs[i] := "profitability";
i := i + 1; bs[i] := "progressing";
i := i + 1; bs[i] := "pushback";
i := i + 1; bs[i] := "put this one to bed";
i := i + 1; bs[i] := "results-driven";
i := i + 1; bs[i] := "revenue";
i := i + 1; bs[i] := "revisit";
i := i + 1; bs[i] := "robust";
i := i + 1; bs[i] := "run it up the flagpole";
i := i + 1; bs[i] := "run the numbers";
i := i + 1; bs[i] := "sales driven";
i := i + 1; bs[i] := "scope";
i := i + 1; bs[i] := "service oriented";
i := i + 1; bs[i] := "slippery slide";
i := i + 1; bs[i] := "speaks to";
i := i + 1; bs[i] := "strategic fit";
i := i + 1; bs[i] := "stretch the envelope";
i := i + 1; bs[i] := "synergy";
i := i + 1; bs[i] := "take that offline";
i := i + 1; bs[i] := "target audience";
i := i + 1; bs[i] := "team player";
i := i + 1; bs[i] := "the big picture";
i := i + 1; bs[i] := "the bottom line";
i := i + 1; bs[i] := "think outside the box";
i := i + 1; bs[i] := "ticks in boxes";
i := i + 1; bs[i] := "time to market";
i := i + 1; bs[i] := "timeline";
i := i + 1; bs[i] := "to be perfectly honest";
i := i + 1; bs[i] := "total quality";
i := i + 1; bs[i] := "touch base";
i := i + 1; bs[i] := "up to speed";
i := i + 1; bs[i] := "user friendly";
i := i + 1; bs[i] := "value-added";
i := i + 1; bs[i] := "vast majority";
i := i + 1; bs[i] := "very unique";
i := i + 1; bs[i] := "walk the talk";
i := i + 1; bs[i] := "web-enabled";
i := i + 1; bs[i] := "win-win situation";
i := i + 1; bs[i] := "wow factor";

bsmax := i;

radius := .5 cm;

offset := 1 cm;
boxwid := 1.9 cm;


% co-ordinates for the grid
pair bpos[], bpos[].ll, bpos[].ul, bpos[].ur, bpos[].lr;
   for i = 0 upto 4:
      for j = 0 upto 4:
        bpos[i+j*5+1] := ((j+0.5)*boxwid, (i+0.5)*boxwid);
        bpos[i+j*5+1].ll := (j*boxwid, i*boxwid);
        bpos[i+j*5+1].ul := (j*boxwid, (i+1)*boxwid);
        bpos[i+j*5+1].lr := ((j+1)*boxwid, i*boxwid);
        bpos[i+j*5+1].ur := ((j+1)*boxwid, (i+1)*boxwid);
      endfor;
   endfor;

picture bbcard[];

% the grid itself
bbcard[0] := image(
   z1 = (0, radius) = z2 - (0, 5boxwid - 2radius) =
        z6 - (5boxwid, 0) = z8 - (radius, -radius);
   z3 = z8 + (0, 5boxwid) = z4 - (5boxwid-2radius, 0);
   x5 = x6; y5 = y2;
   x7 = x4;
   y7 = y8;

   pickup pencircle xscaled 4pt yscaled 1pt rotated 30;

   draw z1---z2..z3---z4..z5---z6..z7---z8..cycle;

   fill ((unitsquare shifted -(.5,.5)) scaled boxwid) shifted bpos[13] withcolor .8 white;

   pickup pencircle scaled 1pt;
   for i = 2 upto 5:
	draw bpos[i].ll--bpos[i+20].lr;
   endfor;

   for i = 10 step 5 until 25:
	draw bpos[i].ul--bpos[i-4].ll;
   endfor;
);

% handle > 1 card if nocards was set on the command-line
if known nocards:
 for bsno = 1 upto nocards:
else:
 if unknown bsno:
   bsno := -1;
 fi;
fi;

 % select the strings for each card
 % after we're done, we set the middle square to `Free Square'
 % dups[] is used to keep track of already used values to eliminate
 % duplicates within each grid (a playing card has four grids on it)

 for bb = 1 upto 4:
    string bstring[];
    numeric dups[];

    for i = 1 upto 25:
      j := 1+floor(uniformdeviate bsmax);

      forever:
         exitif unknown dups[j];
         j := 1+floor(uniformdeviate bsmax);
      endfor;
      dups[j] := i;
      bstring[i] = bs[j];
    endfor;

    bstring[13] := "Free Square";

    bbcard[bb] := image(
	draw bbcard[0];
	for i = 1 upto 25:
	   label(breaktowidth(bstring[i], 1.5cm, 11pt), bpos[i]);
	endfor;
    );
 endfor;

 beginfig(bsno);
  picture p;
  p := ("Bullshit Bingo" infont defaultfont scaled 2)
   shifted ((offset, 3offset)+2.25*ulcorner bbcard[0]);

  fill ((llcorner p)..(ulcorner p).. tension 2 .. (urcorner p)..
        (lrcorner p) .. tension 2 .. cycle)
   withcolor .5 white;
  draw p withcolor white;

  draw ("Advanced Playing Card" infont defaultfont scaled 1.2)
    shifted ((lrcorner p) + (10pt, 6pt));
  draw ("Stay awake!" infont defaultfont)
    shifted ((lrcorner p) + (10pt, -14pt));
  draw ("Watch for duplicates!" infont defaultfont)
    shifted ((lrcorner p) + (10pt, -25pt));
  draw ("Have fun!" infont defaultfont)
    shifted ((lrcorner p) + (10pt, -36pt));

  draw bbcard[1] shifted (offset, offset);
  draw bbcard[2] shifted ((1.25offset, offset)+lrcorner bbcard[0]);
  draw bbcard[3] shifted ((1.25offset, 2offset)+urcorner bbcard[0]);
  draw bbcard[4] shifted ((offset, 2offset)+ulcorner bbcard[0]);
 endfig;

if known nocards:
 endfor;
fi;

end;

%% One-page calendar
%% Patrick TJ McPhee, 1997
%% you are permitted to modify or distribute this file
%% any way you like, but please indicate modifications
%%
%% Instructions: if you run this file through metafont, it will produce a
%% one-month calendar for next month, suitable for printing on US letter-size
%% paper. You can set two parameters, theyear affects the year for which the
%% calendar will be printed, and themonth affects the month. The valid
%% range for theyear is 1997 to some year well off in the future, and the
%% valid range for themonth is -1 to 12. If themonth is set to -1, calendars
%% will be printed for every month in the year. If themonth is set to 0,
%% a calendar will be printed for the following month.
%% The ouput file for each month is calendar.<themonth>. e.g., the
%% file for April would be calendar.4.

%% fonts used to put up numbers, days of the week and holidays
string brandfont;
brandfont := "pplr8r";
defaultfont:="pplr8r";
defaultscale := 2;
prologues:=1;

%% list of holidays. The first element of the array is the month, and the
%% second is the day of the month
string brands[][];

brands[12][25] := "Christmas";
brands[1][1] = "Hogmany";
brands[1][25] = "Robbie Burns";
brands[2][14] = "Valentine";
brands[11][11] = "Remembrance";
brands[11][1] = "All Saints";
brands[11][2] = "All Souls";
brands[7][1] = "Canada Day";

%% days of the week
string weekdays[];
weekdays[1] = "Sunday";
weekdays[2] = "Monday";
weekdays[3] = "Tuesday";
weekdays[4] = "Wednesday";
weekdays[5] = "Thursday";
weekdays[6] = "Friday";
weekdays[7] = "Saturday";

%% names of the months
string mnames[];

mnames[1] = "January";
mnames[2] = "February";
mnames[3] = "March";
mnames[4] = "April";
mnames[5] = "May";
mnames[6] = "June";
mnames[7] = "July";
mnames[8] = "August";
mnames[9] = "September";
mnames[10] = "October";
mnames[11] = "November";
mnames[12] = "December";

%% I don't think anything needs to change below this point to support
%% other languages or other anticipated modifications

% the same as `label', but specify the size
vardef alabel@#(expr s,z,sz) =  % Position s near z size sz
  save p; picture p;
  if picture s:  p=s
  else:    p = s infont brandfont scaled sz
  fi;
  p shifted (z + labeloffset*laboff@# -
     (labxf@#*lrcorner p + labyf@#*ulcorner p
       + (1-labxf@#-labyf@#)*llcorner p
     )
  )
enddef;

def brand = draw alabel enddef;

hoff:=.5in;
voff:= hoff;

width:= 10in;
height := 7.5in;
margin := .05in;
daynameh := .5 in;

daywidth := (width - 2margin)/7;
dayheight := (height - 2margin - daynameh)/5;

picture frame;

  pickup pencircle scaled 2 pt yscaled .6 pt rotated 135;
%  pickup penrazor scaled 2 pt rotated 135;
  bot y1 = voff = bot y8 = top y4 - height = top y5 - height;
  lft x2 = hoff = lft x3 = rt x6 - width = rt x7 - width;
  x1 - x4 = 0 = y2 - y7 = y3 - y6 = x5 - x8;
  x1 - x2 = hoff = y2 - y1 = y4 - y3 = x7 - x8;

%  draw z1..z2---z3..z4---z5..z6---z7..z8---cycle;
   draw (x3-.25hoff,y4+.25voff){dir(-45)}..z4---z5..z6---z7..{dir(-45)}(x7+.25hoff, .75voff)
	{dir(135)}..z8---z1..z2---z3..{dir(135)}cycle;


  pickup pencircle scaled .6 pt;
  z1 - z9 = (margin, -margin) = z6 - z14 = z10 - z2 = z13 - z5;
  z3 - z11 = (-margin, -margin) = z8 - z16 = z12 - z4 = z15 - z7;

  draw z9..z10---z11..z12---z13..z14---z15..z16---cycle;
  
  for i := 1 upto 6:
    draw (x10+i*daywidth, y9)--(x10+i*daywidth, y12);
    endfor;

  for i := 1 upto 5:
    draw (x10, y9+i*dayheight)--(x15, y9+i*dayheight);
    endfor;

  for i := 1 upto 7:
    label(weekdays[i], (x10+(i-.5)*daywidth, y9+5daywidth+.2 daynameh));
    endfor;

lftedge := x10;
rtedge := x15;
botedge := y9;

frame := currentpicture;

clearit;

mdays[1] = 31;
mdays[2] = 28;
mdays[3] = 31;
mdays[4] = 30;
mdays[5] = 31;
mdays[6] = 30;
mdays[7] = 31;
mdays[8] = 31;
mdays[9] = 30;
mdays[10] = 31;
mdays[11] = 30;
mdays[12] = 31;

def drawmonth (expr mon, startday) :=
beginfig(mon);
  draw frame;

  numhoff := lftedge + startday*daywidth;
  numvoff := botedge + 5 * dayheight;

  if startday > 1:
    undraw (lftedge+daywidth, numvoff-.25 dayheight)..(lftedge+daywidth, numvoff-.75 dayheight);
    brand (mnames[mon], (lftedge+daywidth,numvoff-.5 dayheight), 3);
    brand (decimal theyear, (lftedge+daywidth,numvoff-.7 dayheight), 1);
  fi;

  for i := 1 upto mdays[mon]:
    if numvoff > botedge:
      label.lrt(decimal i, (numhoff, numvoff));
    else:
      label.ulft(decimal i, (numhoff+daywidth, numvoff));
    fi;
    numhoff := numhoff + daywidth;

    if known brands[mon][i]: brand.llft(brands[mon][i], (numhoff,numvoff), 1); fi

    if numhoff >= rtedge:
      numhoff := lftedge;
      numvoff := numvoff - dayheight;
    fi
  endfor;

  if startday <= 1:
    undraw (lftedge+6daywidth, numvoff-.25 dayheight)..(lftedge+6daywidth, numvoff-.75 dayheight);
    brand (mnames[mon], (lftedge+6daywidth,numvoff-.5 dayheight), 3);
    brand (decimal theyear, (lftedge+6daywidth,numvoff-.7 dayheight), 1);
  fi;

  currentpicture := currentpicture rotatedaround((4.25in,4.25in),90);
endfig;
enddef;

%% if no year is specified, try for the current year
if unknown theyear: theyear:=year;
elseif theyear=0: theyear:=year;
fi;
firstday := (3 + (theyear - 1997) + (theyear - 1997) div 4) mod 7;

%% if no month is specified, try for next month
if unknown themonth: themonth := month + 1;
elseif themonth=0: themonth := month + 1;
fi;
if themonth = 13:
  theyear := theyear+1;
  themonth := 1;
  fi;

if ((theyear mod 4) = 0)
     and (((theyear mod 100) <> 0) or ((theyear mod 400) = 0)):
  mdays[2] := 29;
  fi;

% special value of themonth: -1 prints the whole year's calendar
if themonth = -1:
  for j = 1 upto 12:
    drawmonth(j, firstday);
    firstday := (firstday + mdays[j]) mod 7;
    endfor;
else:
  for j = 1 upto (themonth-1):
    firstday := (firstday + mdays[j]) mod 7;
    endfor;
  drawmonth(themonth, firstday);
fi
end;

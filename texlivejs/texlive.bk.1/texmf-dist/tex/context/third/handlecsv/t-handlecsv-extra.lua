-- %D \module
-- %D   [     file=t-handlecsv-extra.lua,
-- %D      version=2018.02.26,
-- %D        title=HandleCSV extra,
-- %D     subtitle=CSV file analysis - extended functions and macros,
-- %D       author=Jaroslav Hajtmar,
-- %D         date=2018-02-26,
-- %D    copyright=Jaroslav Hajtmar,
-- %D      license=GNU General Public License]
--
-- %C Copyright (C) 2018  Jaroslav Hajtmar
-- %C
-- %C This program is free software: you can redistribute it and/or modify
-- %C it under the terms of the GNU General Public License as published by
-- %C the Free Software Foundation, either version 3 of the License, or
-- %C (at your option) any later version.
-- %C
-- %C This program is distributed in the hope that it will be useful,
-- %C but WITHOUT ANY WARRANTY; without even the implied warranty of
-- %C MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
-- %C GNU General Public License for more details.
-- %C
-- %C You should have received a copy of the GNU General Public License
-- %C along with this program.  If not, see <http://www.gnu.org/licenses/>.


thirddata = thirddata or { }

thirddata = thirddata or { }

thirddata.handlecsv = thirddata.handlecsv or { -- next global variables

}


-- Initialize global variables etc.


-- Utility and documentation function and macros



function thirddata.handlecsv.addleadingcharacters(character, tonumberortext, width)
-- Add leading characters to number to align with the width
   local strcharacter=tostring(character)
   local strnumberortext=tostring(tonumberortext)
   strnumberortext = string.rep(strcharacter, width-#strnumberortext)..strnumberortext
   return strnumberortext -- It returns a strange result unless the leading character is just one.
end

function thirddata.handlecsv.addleadingzeros(tonumberortext, width)
-- Add leading zeros to number to align with the width
   return thirddata.handlecsv.addleadingcharacters(0, tonumberortext, width)
end

function thirddata.handlecsv.addzeros(tonumber)
-- Add leading zeroes depending on the number of rows
    local width=string.len(tostring(thirddata.handlecsv.numrows()))
    return thirddata.handlecsv.addleadingzeros(tonumber, width)
end




-- ConTeXt source:
local string2print=[[%

\def\addleading#1#2#3{\ctxlua{context(thirddata.handlecsv.addleadingcharacters('#1','#2','#3'))}}
\def\addzeros#1#2{\ctxlua{context(thirddata.handlecsv.addleadingzeros('#1','#2'))}}
\def\zeroed#1{\ctxlua{context(thirddata.handlecsv.addzeros('#1'))}}
\def\zeroedlineno{\zeroed{\lineno}}% from Pablo (and simplified by him)


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% Complete listing macros and commands that can be used (to keep track of all defined macros):
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% \addleading{}{}{}, \addzeros{}{}, \zeroed{}, \zeroedlineno (from Pablo)
%


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
]]

-- write definitions into ConTeXt:
thirddata.handlecsv.string2context(string2print)


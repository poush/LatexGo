-----------------------------------------------------------------------
--         FILE:  xindex-HAdW-eKO.lua
--  DESCRIPTION:  configuration file for xindex.lua
-- REQUIREMENTS:  
--       AUTHOR:  Herbert Voß
--      LICENSE:  LPPL1.3
-----------------------------------------------------------------------
--
-- configuration for index files of the Heidelberger Akademie der Wissenschaften

if not modules then modules = { } end modules ['xindex-HAdW-eKO'] = {
      version = 0.07,
      comment = "configuration to xindex.lua",
       author = "Herbert Voss",
    copyright = "Herbert Voss",
      license = "LPPL 1.3"
}

--local version = "0.01"

itemPageDelimiter = " \\dotfill "     -- Hello .....  14
compressPages     = true    -- something like 12--15, instaead of 12,13,14,15. the |( ... |) syntax is still valid
fCompress	  = true    -- 3f -> page 3, 4 and 3ff -> page 3, 4, 5
minCompress       = 3       -- 14--17 or 
numericPage       = false   -- for non numerical pagenumbers, like "VI-17"
sublabels         = {"", "-\\,", "--\\,", "---\\,"} -- for the (sub(sub(sub-items  first one is for item
pageNoPrefixDel   = ""     -- a delimiter for page numbers like "VI-17"
indexOpening      = ""     -- commands after \begin{theindex}



--[[
    Each character's position in this array-like table determines its 'priority'.
    Several characters in the same slot have the same 'priority'.
]]
alphabet_lower = { --   for sorting
    { ' ' },  -- only for internal tests
    { 'a', 'á', 'à', 'ä'},
    { 'b' },
    { 'c' },
    { 'd' },
    { 'e', 'é', 'è', 'ë' },
    { 'f' },
    { 'g' },
    { 'h' },
    { 'i', 'í', 'ì', 'ï' },
    { 'j' },
    { 'k' },
    { 'l' },
    { 'm' },
    { 'n', 'ñ' },
    { 'o', 'ó', 'ò', 'ö' },
    { 'p' },
    { 'q' },
    { 'r' },
    { 's' },
    { 't' },
    { 'u', 'ú', 'ù', 'ü' },
    { 'v' },
    { 'w' },
    { 'x' },
    { 'y' },
    { 'z' }
}
alphabet_upper = { -- for sorting
    { ' ' },
    { 'A', 'Á', 'À', 'Ä'},
    { 'B' },
    { 'C' },
    { 'D' },
    { 'E', 'È', 'È', 'ë' },
    { 'F' },
    { 'G' },
    { 'H' },
    { 'I', 'Í', 'Ì', 'ï' },
    { 'J' },
    { 'K' },
    { 'L' },
    { 'M' },
    { 'N', 'Ñ' },
    { 'O', 'Ó', 'Ò', 'Ö' },
    { 'P' },
    { 'Q' },
    { 'R' },
    { 'S' },
    { 'T' },
    { 'U', 'Ú', 'Ù', 'Ü' },
    { 'V' },
    { 'W' },
    { 'X' },
    { 'Y' },
    { 'Z' }
}


--\indexentry{Ackers, Carolus}{VII/1-715}
--\indexentry{Bremen!Adalbert I. von, Erzbischof}{VII/2/1-948}
--\indexentry{Bremen!Adalbert I. von, Erzbischof}{VII/1-50}

function specialCompressPageList(pages)
--print(#pages..".. number:|"..pages[1]["number"].."| Special:"..pages[1]["special"])
  if (pages[1]["number"] == "") then pages[1]["number"] = " " end
  if (#pages <= 1) then 
    pages[1]["number"] = pages[1]["number"]:gsub('-',':~')-- replace "-" with ":~"
    return pages 
  end  -- only one pageno
--[[ 
modify pagelist
sortPages = {{ origin = { number=VII/1-715, special="" }, 
               sort   = 07/1-00715 },
             {...}
            }
]]
  local sortPages = {}
  local roman 
  local volume
  local page
  local i
--print("----------------------------------------")
  for i=1,#pages do
     roman = string.gsub(pages[i]["number"],'%U*','') -- only uppercase to catch VII123f (folium pages)
     if romanToNumber(roman) then
       roman = string.format("%05d",tonumber(romanToNumber(roman)))
     else
       roman = ""
     end
     volume = string.gsub(pages[i]["number"],'%a*','')
     if volume then volume = volume:gsub('-%d*','') end
     page = string.gsub(pages[i]["number"],'.*-','')
     page = string.format("%5s",page)
     sortPages[#sortPages+1] = {
     origin = pages[i],
     sort = roman..volume.." "..page }  -- no minus between Roman/Volume and first page
--print(roman..volume.." "..page.." Special:"..pages[i]["special"])
   end
-- sort the page list  
  table.sort(sortPages, function(a,b) return a["sort"] < b["sort"] end )
  local Pages = {}
  for i=1,#sortPages do    -- use the sorted origin table
    Pages[#Pages+1] = sortPages[i]["origin"]
  end
--  writeLog(1,print(getRawPagesP(Pages)),2)
-- test if two or more pages in the list
  if #Pages == 2 then  -- only two pages
    local page1 = string.gsub(Pages[1]["number"],'%A*','')  -- get prefix1
    local page2 = string.gsub(Pages[2]["number"],'%A*','')  -- ger prefix2
    if (page1 == page2) then  -- same prefix
      page1 = string.gsub(Pages[1]["number"],'.*-','') -- get page1
      page2 = string.gsub(Pages[2]["number"],'.*-','') -- get page2
      if ((type(tonumber(page1)) ~= "number") or (type(tonumber(page2)) ~= "number")) then return Pages end -- one is not numeric
      if (page2-page1) == 1 then                       -- pagediff = 1
        Pages[1]["number"] = Pages[1]["number"].."f"   
        Pages[2] = nil                                 -- remove second page
        return Pages 
      else  -- page difference > 1
        Pages[1]["number"] = pages[1]["number"]:gsub('-',':~') 
        Pages[2]["number"] = string.gsub(Pages[2]["number"],'.*-','') -- use only number -> same prefix
        return Pages  -- Pages[1] is the same
      end
    else
      Pages[1]["number"] = pages[1]["number"]:gsub('-',':~')
      Pages[2]["number"] = pages[2]["number"]:gsub('-',':~')
      return Pages  -- different prefix -> simple return of the two pages
    end
  else   -- more than two pages
    local prefixList = {}
    local lastPrefix = ""
    local currentPrefix
    for i=1,#Pages do  -- create the list of different prefixes, eg {VI, VI/2/1, VI/2/2}
      currentPrefix, j = string.gsub(Pages[i]["number"],'-.*','')
      if currentPrefix ~= lastPrefix then
        prefixList[#prefixList+1] = currentPrefix
        lastPrefix = currentPrefix
      end
    end
    pages = {}
    for j = 1,#prefixList do
      lastPrefix = prefixList[j]
      i = 1
      local subPageList = {}
      while (i <= #Pages) do
        currentPrefix, _ = string.gsub(Pages[i]["number"],'-.*','')
        if (lastPrefix == currentPrefix) then
          subPageList[#subPageList+1] = { number = string.gsub(Pages[i]["number"],'.*-',''), special = Pages[i]["special"] }
        end
          i = i +1
      end
      sortPages = compressPageList(subPageList)
      -- instead of  minus between Roman/Volume and first page insert colon
      if (stripLeadingSpaces(sortPages[1]["number"]) == "") then 
        colon = ""
        sortPages[1]["number"] = ""
      else 
        colon = ':~' 
      end
      pages[#pages+1] = { number = lastPrefix..colon..sortPages[1]["number"], special = sortPages[1]["special"] }
      for i=2,#sortPages do
        pages[#pages+1] = sortPages[i]
      end
    end
    return pages
  end
end

function replaceRoman(r)
  local i = romanToNumber(r)
  if i then return "//"..string.format("%05d",i).."//"
       else return r
  end
end

function SORTprehook(data)  -- replace roman with algebraic, eg Karl IX -> Karl // 9//
--  writeLog(1,require 'xindex-pretty'.dump(data),0)   -- only for internal dump
  local entry
  local elements = {}
  for i=1,#data do
    entry = data[i]["Entry"]
    elements = entry:split()
    if (#elements > 1) then  -- at least one space (two elements)
      local number = romanToNumber(elements[#elements])
      if number then
        local strNr = string.format("%03d",tostring(number))
        elements[#elements] = "//"..strNr.."//"
        entry = ""
        for j=1,#elements do entry=entry.." "..elements[j] end  -- has leading space
      else 
        entry:gsub("!(.-)%p",replaceRoman)
      end
      data[i]["Entry"] = entry:gsub("^%s*(.-)%s*$", "%1")  -- strip leading space
    end
  end
  return data
end

function SORTposthook(data)  -- the other way round as prehook
  local entry
  local elements = {}
  for i=1,#data do
    entry = data[i]["Entry"]
    if entry:find("//") then 
       data[i]["Entry"] = entry:gsub("//(.-)//",numberToRoman)
    end
  end
  return data
end

function colorBox(str)
  return ("\\colorbox{black!15}{"..str.."}:~")
end

--      Pages[1]["number"] = pages[1]["number"]:gsub('(.-):~',colorBox)
--      Pages[2]["number"] = pages[2]["number"]:gsub('(.-):~',colorBox)


function specialGetPageList(v,hyperpage)
  local Pages = {}
  if v["pages"] then
    table.sort(v["pages"],pageCompare)-- nur nötig, da User manuell eine Zeile einfügen kann
    if specialCompressPageList then
      Pages = specialCompressPageList(v["pages"])
    else
      Pages = compressPageList(v["pages"])
    end
--  require 'xindex-pretty'.dump(Pages)   -- only for internal dump
    local pageNo
--[[
\indexentry{Auto|hyperindexformat{\textbf}}{1}
->   \item Auto, \hyperindexformat{\textbf}{1}

    add for example  \hyperpage{5\nohyperpage{f}}  , same for ff

  \item foo, \hyperpage{1\nohyperpage{f}}, 
		\hyperpage{4\nohyperpage{ff}}, \hyperpage{8}

]]
    if hyperpage then
        if string.find(v["pages"][1]["special"],"hyperindexformat") then
          pageNo = v["pages"][1]["special"].."{"..checkFF(Pages[1]["number"].."}")
        else
          pageNo = "\\hyperpage{"..checkFF(Pages[1]["number"]).."}"
        end
      for i=2,#Pages do
        if string.find(v["pages"][i]["special"],"hyperindexformat") then
          pageNo = pageNo..", "..v["pages"][i]["special"].."{"..checkFF(Pages[i]["number"].."}")
        else
          pageNo = pageNo..", \\hyperpage{"..checkFF(Pages[i]["number"]).."}"
        end
--        Pages[i] = nil
      end
    else
      writeLog(1,"getPageList: "..tostring(Pages[1]["special"]).."{"..tostring(Pages[1]["number"]).."}\n",2) 
      if (Pages[1]["special"] == nil) or (Pages[1]["number"] == nil) then return ""  end 
      pageNo = Pages[1]["special"].."{"..Pages[1]["number"]:gsub('(.-):~',colorBox).."}"  
      for i=2,#Pages do
        if Pages[i]["number"] then
          pageNo = pageNo..", "..Pages[i]["special"].."{"..Pages[i]["number"]:gsub('(.-):~',colorBox).."}"
          Pages[i] = {}
        end
      end
    end
    return pageNo
  else
    return ""
  end
end



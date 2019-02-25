--- spelling-stage-1.lua
--- Copyright 2012, 2013 Stephan Hennig
--
-- This work may be distributed and/or modified under the conditions of
-- the LaTeX Project Public License, either version 1.3 of this license
-- or (at your option) any later version.  The latest version of this
-- license is in http://www.latex-project.org/lppl.txt
-- and version 1.3 or later is part of all distributions of LaTeX
-- version 2005/12/01 or later.
--
-- See file README for more information.
--


--- Handle lists of bad and good strings and match rules.
--
-- @author Stephan Hennig
-- @copyright 2012, 2013 Stephan Hennig
-- @release version 0.41
--
-- @trick Prevent LuaDoc from looking past here for module description.
--[[ Trick LuaDoc into entering 'module' mode without using that command.
module(...)
--]]


-- Module table.
local M = {}


-- Import external modules.
local unicode = require('unicode')
local xml = require('luaxml-mod-xml')


-- Function short-cuts.
local Sfind = string.find

local tabinsert = table.insert

local Ufind = unicode.utf8.find
local Ugmatch = unicode.utf8.gmatch
local Usub = unicode.utf8.sub


-- Declare local variables to store references to resources that are
-- provided by external code.
--
-- Table of known bad strings.
local __is_bad
--
-- Table of known good strings.
local __is_good
--
-- Table of bad rules.
local __rules_bad
--
-- Table of good rules.
local __rules_good


--- Generic function for reading bad or good spellings from a file.
-- All data from the file is read into a string, which is then parsed by
-- the given parse function.
--
-- @param fname  File name.
-- @param parse_string  Custom parse function.
-- @param t  Mapping table bad or good spellings should be added to.
-- @param hint  String for info message.  Either `bad` or `good`.
local function __parse_file(fname, parse_string, t, hint)
  local total_c = 0
  local new_c = 0
  local f, err = io.open(fname, 'r')
  if f then
    local s = f:read('*all')
    f:close()
    total_c, new_c = parse_string(s, t)
  else
    texio.write_nl('package spelling: Warning! ' .. err)
  end
  texio.write_nl('package spelling: Info! ' .. total_c .. '/' .. new_c .. ' total/new ' .. hint .. ' strings read from file \'' .. fname .. '\'.')
end


--- Generic function for parsing a string containing a plain list of
-- strings.  Input format are strings separated by new line or carriage
-- return, i.e., one string per line.  All lines found in the list are
-- mapped to the boolean value `true` in the given table.
--
-- @param s  Input string (a list of strings).
-- @param t  Table that maps strings to the value `true`.
-- @return Number of total and new strings found.
local function __parse_plain_list(s, t)
  local total_c = 0
  local new_c = 0
  -- Iterate line-wise through input string.
  for l in Ugmatch(s, '[^\r\n]+') do
    -- Map string to boolean value `true`.
    if not t[l] then
      t[l] = true
      new_c = new_c + 1
    end
    total_c = total_c + 1
  end
  return total_c, new_c
end


--- Parse a plain list of bad strings read from a file.
-- All strings found (words with known incorrect spelling) are mapped to
-- the boolean value `true` in table `__is_bad`.  The format of the
-- input file is one string per line.
--
-- @param fname  File name.
local function parse_bad_plain_list_file(fname)
  __parse_file(fname, __parse_plain_list, __is_bad, 'bad')
end
M.parse_bad_plain_list_file = parse_bad_plain_list_file


--- Parse a plain list of good strings read from a file.
-- All strings found (words with known correct spelling) are mapped to
-- the boolean value `true` in table `__is_good`.  The format of the
-- input file is one string per line.
--
-- @param fname  File name.
local function parse_good_plain_list_file(fname)
  __parse_file(fname, __parse_plain_list, __is_good, 'good')
end
M.parse_good_plain_list_file = parse_good_plain_list_file


--- Get a custom LanguageTool XML handler.
-- The returned XML handler scans LanguageTool XML data for incorrect
-- spellings.  For every incorrect spelling found, the given call-back
-- function is called with the incorrect spelling string as argument.<br
-- />
--
-- XML data is checked for being created by LanguageTool (via attribute
-- <code>software</code> in tag <code>matches</code>).
--
-- @param cb  Call-back function handling incorrect spellings found in
-- XML data.
-- @return XML handler.
local function __get_XML_handler_LanguageTool(cb)

  -- Some flags for checking validity of XML data.  LanguageTool XML
  -- data must declare as being UTF-8 encoded and advertise as being
  -- created by LanguageTool.
  local is_XML_encoding_UTF_8 = false
  local is_XML_creator_LanguageTool = false
  local is_XML_valid = false

  --- Handler object for parsing LanguageTool XML data.
  -- This table contains call-backs used by LuaXML when parsing XML
  -- data.
  --
  -- @class table
  -- @name XML_handler
  -- @field decl  Handle XML declaration.
  -- @field starttag  Handle all relevant tags.
  -- @field endtag  Not used, but mandatory.
  local XML_handler = {

    decl = function(self, text, attr)
      -- Check XML encoding declaration.
      if attr.encoding == 'UTF-8' then
        is_XML_encoding_UTF_8 = true
        is_XML_valid = is_XML_encoding_UTF_8 and is_XML_creator_LanguageTool
      else
        error('package spelling: Error! XML data not in the UTF-8 encoding.')
      end
    end,

    starttag = function(self, text, attr)
      -- Process <matches> tag.
      if text == 'matches' then
        -- Check XML creator is LanguageTool.
        if attr and attr.software == 'LanguageTool' then
          is_XML_creator_LanguageTool = true
          is_XML_valid = is_XML_encoding_UTF_8 and is_XML_creator_LanguageTool
        end
      -- Check XML data is valid.
      elseif not is_XML_valid then
        error('package spelling: Error! No valid LanguageTool XML data.')
      -- Process <error> tags.
      elseif text == 'error' then
        local ruleid = attr.ruleid
        if ruleid == 'HUNSPELL_RULE'
          or ruleid == 'HUNSPELL_NO_SUGGEST_RULE'
          or ruleid == 'GERMAN_SPELLER_RULE'
          or Ufind(ruleid, '^MORFOLOGIK_RULE_')
        then
          -- Extract misspelled word from context attribute.
          local word = Usub(attr.context, attr.contextoffset + 1, attr.contextoffset + attr.errorlength)
          cb(word)
        end
      end
    end,

    endtag = function(self, text)
    end,

  }

  return XML_handler
end


--- Parse a string containing LanguageTool XML data.
-- All incorrect spellings found in the given XML data are mapped to the
-- boolean value `true` in the given table.
--
-- @param s  String containing XML data.
-- @param t  Table mapping incorrect spellings to a boolean.
-- @return Number of total and new incorrect spellings found.
local function __parse_XML_LanguageTool(s, t)
  local total_c = 0
  local new_c = 0

  -- Create call-back for custom LanguageTool XML handler that stores a
  -- bad word in the given table and does some statistics.
  local cb_incorrect_spelling = function(word)
    if not t[word] then
      t[word] = true
      new_c = new_c + 1
    end
    total_c = total_c + 1
  end

  -- Create custom XML handler.
  local XML_handler_LT = __get_XML_handler_LanguageTool(cb_incorrect_spelling)
  -- Create custom XML parser.
  local x = xml.xmlParser(XML_handler_LT)
  -- Parse XML data.
  x:parse(s)
  return total_c, new_c
end


--- Parse LanguageTool XML data read from a file.
-- All strings found in the file (words with known incorrect spelling)
-- are mapped to the boolean value `true` in table `__is_bad`.
--
-- @param fname  File name.
local function parse_XML_LanguageTool_file(fname)
  __parse_file(fname, __parse_XML_LanguageTool, __is_bad, 'bad')
end
M.parse_XML_LanguageTool_file = parse_XML_LanguageTool_file


--- Parse default sources for bad and good strings.
-- All strings found in default sources for words with known incorrect
-- spelling are mapped to the boolean value `true` in table `__is_bad`.
-- All strings found in default sources for words with known correct
-- spelling are mapped to the boolean value `true` in table `__is_good`.
-- Default sources for bad spellings are files `<jobname>.spell.xml` (a
-- LanguageTool XML file) and `<jobname>.spell.bad` (a plain list file).
-- Default sources for good spellings are file `<jobname>.spell.good` (a
-- plain list file).
local function parse_default_bad_and_good()
  local fname, f
  -- Try to read bad spellings from LanguageTool XML file
  -- '<jobname>.spell.xml'.
  fname = tex.jobname .. '.spell.xml'
  f = io.open(fname, 'r')
  if f then
     f:close()
     parse_XML_LanguageTool_file(fname)
  end
  -- Try to read bad spellings from plain list file
  -- '<jobname>.spell.bad'.
  fname = tex.jobname .. '.spell.bad'
  f = io.open(fname, 'r')
  if f then
     f:close()
     parse_bad_plain_list_file(fname)
  end
  -- Try to read good spellings from plain list file
  -- '<jobname>.spell.good'.
  fname = tex.jobname .. '.spell.good'
  f = io.open(fname, 'r')
  if f then
     f:close()
     parse_good_plain_list_file(fname)
  end
end
M.parse_default_bad_and_good = parse_default_bad_and_good


--- Default bad dictionary look-up match rule.
-- This function looks-up both arguments in the list of bad spellings.
-- It returns `true` if either of the arguments is found in the list of
-- bad spellings, otherwise `false`.
--
-- @param raw  Raw string to check.
-- @param stripped  Same as `raw`, but with stripped surrounding
-- punctuation.
-- @return A boolean value indicating a match.
local function __bad_rule_bad_dictionary_lookup(raw, stripped)
  return __is_bad[stripped] or __is_bad[raw]
end


--- Default good dictionary look-up match rule.
-- This function looks-up both arguments in the list of good spellings.
-- It returns `true` if either of the arguments is found in the list of
-- good spellings, otherwise `false`.
--
-- @param raw  Raw string to check.
-- @param stripped  Same as `raw`, but with stripped surrounding
-- punctuation.
-- @return A boolean value indicating a match.
local function __good_rule_good_dictionary_lookup(raw, stripped)
  return __is_good[stripped] or __is_good[raw]
end


--- Load match rule module.
-- Match rule modules are loaded using `require`.  The module table must
-- follow the following convention: Indentifiers of bad match rules
-- start `bad_rule_`.  Indentifiers of good match rules start
-- `good_rule_`.  Other and non-function identifiers are ignore.
--
-- All match rules found in a module are added to the table of bad and
-- good match rules.  Arguments of a match rule function are a raw
-- string and the same string with stripped surrounding punctuation.
--
-- @param fname  Module file name.
local function read_match_rules(fname)
  local bad_c = 0
  local good_c = 0
  local rules = require(fname)
  for k,v in pairs(rules) do
    if type(v) == 'function' then
      if Sfind(k, '^bad_rule_') then
        tabinsert(__rules_bad, v)
        bad_c = bad_c + 1
      elseif Sfind(k, '^good_rule_') then
        tabinsert(__rules_good, v)
        good_c = good_c + 1
      end
    end
  end
  texio.write_nl('package spelling: Info! ' .. bad_c .. '/' .. good_c .. ' bad/good match rules read from module \'' .. fname .. '\'.')
end
M.read_match_rules = read_match_rules


--- Module initialisation.
--
local function __init()
  -- Get local references to package ressources.
  __rules_bad = PKG_spelling.res.rules_bad
  __rules_good = PKG_spelling.res.rules_good
  -- Add default dictionary look-up match rules.
  tabinsert(__rules_bad, __bad_rule_bad_dictionary_lookup)
  tabinsert(__rules_good, __good_rule_good_dictionary_lookup)
  -- Create emtpy lists of known spellings.
  __is_bad = {}
  __is_good = {}
end


-- Initialize module.
__init()


-- Return module table.
return M

--- spelling-stage-2.lua
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


--- Tag node lists with word strings before hyphenation takes place.
-- This module provides means to tag node lists by inserting
-- user-defined whatsit nodes before and after first and last node
-- belonging to a chain representing a string in the node list.  The
-- final tag node contains a reference to a string containing the word
-- string.  Tagging is applied before hyphenation takes place.
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
local recurse = require('spelling-recurse')
local unicode = require('unicode')


-- Function short-cuts.
local tabconcat = table.concat
local tabinsert = table.insert
local tabremove = table.remove

local node_new = node.new
local node_insert_after = node.insert_after
local node_insert_before = node.insert_before

local recurse_node_list = recurse.recurse_node_list

local Sfind = string.find
local Sgmatch = string.gmatch
local Smatch = string.match

local Uchar = unicode.utf8.char
local Umatch = unicode.utf8.match


-- Short-cuts for constants.
local DISC = node.id('disc')
local GLYPH = node.id('glyph')
local KERN = node.id('kern')
local WHATSIT = node.id('whatsit')
local LOCAL_PAR = node.subtype('local_par')
local USER_DEFINED = node.subtype('user_defined')
local PDF_COLORSTACK = node.subtype('pdf_colorstack')


-- Declare local variables to store references to resources that are
-- provided by external code.
--
-- Table of bad rules.
local __rules_bad
--
-- Table of good rules.
local __rules_good
--
-- ID of user-defined whatsit nodes marking the start of a word.
local __uid_start_tag
--
-- ID of user-defined whatsit nodes marking the end of a word.
local __uid_end_tag


--- Module options.
-- This table contains all module options.  User functions to set
-- options are provided.
--
-- @class table
-- @name __opts
-- @field hl_color  Colour used for highlighting bad spellings in PDF
-- output.
local __opts = {
  hl_color,
}


--- Set colour used for highlighting.
-- Set colour used for highlighting bad spellings in PDF output.  The
-- argument is checked for a valid PDF colour statement.  As an example,
-- the string `1 0 0 rg` represents a red colour in the RGB colour
-- space.  A similar colour in the CMYK colour space would be
-- represented by the string '0 1 1 0 k'.
--
-- @param col  New colour.
local function set_highlight_color(col)
  -- Extract all colour components.
  local components = Smatch(col, '^(%S+ %S+ %S+) rg$') or Smatch(col, '^(%S+ %S+ %S+ %S+) k$')
  local is_valid_arg = components
  if is_valid_arg then
    -- Validate colour components.
    for comp in Sgmatch(components, '%S+') do
      -- Check number syntax.
      local is_valid_comp = Sfind(comp, '^%d+%.?%d*$') or Sfind(comp, '^%d*%.?%d+$')
      if is_valid_comp then
        -- Check number range.
        comp = tonumber(comp)
        is_valid_comp = comp >= 0 and comp <= 1
      end
      is_valid_arg = is_valid_arg and is_valid_comp
    end
  end
  if is_valid_arg then
    __opts.hl_color = col
  else
    error('package spelling: Error! Invalid PDF colour statement: ' .. tostring(col))
  end
end
M.set_highlight_color = set_highlight_color


--- Highlighting status cache table.
-- Determining the highlighting status of a string can be an expensive
-- operation.  To reduce average run-time penalty per string,
-- highlighting status of all strings found in a document is cached in
-- this table, so that determining the highlighting status of a known
-- string requires only one table look-up.<br />
--
-- This table needs an `__index` meta method calculating the
-- highlighting status of unknown keys (strings).
--
-- @class table
-- @name __is_highlighting_needed
local __is_highlighting_needed = {}


--- Calculate and cache the highlighting status of a string.
-- First, surrounding punctuation is stripped from the string argument.
-- Then, the given raw as well as the stripped string are checked
-- against all rules.  Highlighting of the string is required, if any
-- bad rule matches, but no good rule matches.  That is, good rules take
-- precedence over bad rules.
--
-- @param t  Original table.
-- @param raw  Raw string to check.
-- @return True, if highlighting is required.  False, otherwise.
local function __calc_is_highlighting_needed(t, raw)
  -- Strip surrounding punctuation from string.
  local stripped = Umatch(raw, '^%p*(.-)%p*$')
  -- Check for a bad match.
  local is_bad = false
  for _,matches_bad in ipairs(__rules_bad) do
    is_bad = is_bad or matches_bad(raw, stripped)
    if is_bad then break end
  end
  -- Check for a good match.
  local is_good = false
  for _,matches_good in ipairs(__rules_good) do
    is_good = is_good or matches_good(raw, stripped)
    if is_good then break end
  end
  -- Calculate highlighting status.
  local status = (is_bad and not is_good) or false
  -- Store status in cache table.
  rawset(t, raw, status)
  -- Return status.
  return status
end


-- Set-up meta table for highlighting status cache table.
setmetatable(__is_highlighting_needed, {
  __index = __calc_is_highlighting_needed,
})


--- Convert a Unicode code point to a regular UTF-8 encoded string.
-- This function can be used as an `__index` meta method.
--
-- @param t  original table
-- @param cp  originl key, a Unicode code point
-- @return UTF-8 encoded string corresponding to the Unicode code point.
local function __meta_cp2utf8(t, cp)
  return Uchar(cp)
end


--- Table of Unicode code point mappings.
-- This table maps Unicode code point to strings.  The mappings are used
-- during text extraction to translate certain Unicode code points to an
-- arbitrary string instead of the corresponding UTF-8 encoded
-- character.<br />
--
-- As an example, by adding an appropriate entry to this table, the
-- single Unicode code point U-fb00 (LATIN SMALL LIGATURE FF) can be
-- resolved into the multi character string 'ff' instead of being
-- converted to the single character string 'ﬀ' ('&#xfb00;').<br />
--
-- Keys are Unicode code points.  Values must be strings in the UTF-8
-- encoding.  If a key is not present in this table, the regular UTF-8
-- character is returned by means of a meta table.<br />
--
-- @class table
-- @name __codepoint_map
local __codepoint_map = {

  [0x0132] = 'IJ',-- LATIN CAPITAL LIGATURE IJ
  [0x0133] = 'ij',-- LATIN SMALL LIGATURE IJ
  [0x0152] = 'OE',-- LATIN CAPITAL LIGATURE OE
  [0x0153] = 'oe',-- LATIN SMALL LIGATURE OE
  [0x017f] = 's',-- LATIN SMALL LETTER LONG S

  [0xfb00] = 'ff',-- LATIN SMALL LIGATURE FF
  [0xfb01] = 'fi',-- LATIN SMALL LIGATURE FI
  [0xfb02] = 'fl',-- LATIN SMALL LIGATURE FL
  [0xfb03] = 'ffi',-- LATIN SMALL LIGATURE FFI
  [0xfb04] = 'ffl',-- LATIN SMALL LIGATURE FFL
  [0xfb05] = 'st',-- LATIN SMALL LIGATURE LONG S T
  [0xfb06] = 'st',-- LATIN SMALL LIGATURE ST

}


--- Meta table for code point mapping table.
--
-- @class table
-- @name __meta_codepoint_map
-- @field __index  Index operator.
local __meta_codepoint_map = {
   __index = __meta_cp2utf8,
}


-- Set meta table for code point mapping table.
setmetatable(__codepoint_map, __meta_codepoint_map)


--- Clear all code point mappings.
-- After calling this function, there are no known code point mappings
-- and no code point mapping takes place during text extraction.
local function clear_all_mappings()
  __codepoint_map = {}
  setmetatable(__codepoint_map, __meta_codepoint_map)
end
M.clear_all_mappings = clear_all_mappings


--- Manage Unicode code point mappings.
-- This function can be used to set-up code point mappings.  First
-- argument must be a number, second argument must be a string in the
-- UTF-8 encoding or `nil`.<br />
--
-- If the second argument is a string, after calling this function, the
-- Unicode code point given as first argument, when found in a node list
-- during text extraction, is mapped to the string given as second
-- argument instead of being converted to a UTF-8 encoded character
-- corresponding to the code point.<br />
--
-- If the second argument is `nil`, a mapping for the given code point,
-- if existing, is deleted.
--
-- @param cp A Unicode code point, e.g., 0xfb00 for the code point LATIN
-- SMALL LIGATURE FF.
-- @param newt  New target string to map the code point to or `nil`.
-- @return Old target string the code point was mapped to before
-- (possibly `nil`).  If any arguments are invalid, return value is
-- `false`.  Arguments are invalid if code point is not of type `number`
-- or not in the range 0 to 0x10ffff or if new target string is neither
-- of type `string` nor `nil`).
local function set_mapping(cp, newt)
  -- Prevent from invalid entries in mapping table.
  if (type(cp) ~= 'number') or
     (cp < 0) or
     (cp > 0x10ffff) or
     ((type(newt) ~= 'string') and (type(newt) ~= 'nil')) then
    return false
  end
  -- Retrieve old mapping.
  local oldt = rawget(__codepoint_map, cp)
  -- Set new mapping.
  __codepoint_map[cp] = newt
  -- Return old mapping.
  return oldt
end
M.set_mapping = set_mapping


-- First and last nodes known to belong to the current word and their
-- head nodes.  These nodes are logged, so that after recognizing the
-- end of a word, they can be tagged by inserting new user-defined
-- whatsit nodes before and after them.
local __curr_word_start_head
local __curr_word_start
local __curr_word_end_head
local __curr_word_end


--- Tag the current word in the node list.
-- Insert tag nodes (user-defined whatsit nodes) into the node list
-- before and after the first and last nodes belonging to the current
-- word.  The tag marking the start of a word contains as value an empty
-- string.  The tag marking the end of a word contains as value a
-- reference to the word string.
--
-- @param word  Word string.
local function __tag_word(word)
  -- Check, if start node of current word is a head node.  Inserting
  -- before head nodes needs special attention.  This is not yet
  -- implemented.
  if (__curr_word_start ~= __curr_word_start_head) then
    -- Create new start tag node.
    local start_tag = node_new(WHATSIT, USER_DEFINED)
    -- Mark whatsit node with module ID, so that we can recognize it
    -- later.
    start_tag.user_id = __uid_start_tag
    -- Value is an empty string.
    start_tag.type = 115
    start_tag.value = ''
    -- Insert start tag before first node belonging to current word.
    node_insert_before(__curr_word_start_head, __curr_word_start, start_tag)
  end
  -- Create new end tag node.
  local end_tag = node_new(WHATSIT, USER_DEFINED)
  -- Mark whatsit node with module ID, so that we can recognize it
  -- later.
  end_tag.user_id = __uid_end_tag
  -- Value of end tag is an index (a number).
  end_tag.type = 115
  end_tag.value = word
  -- Insert end tag after last node belonging to current word.
  node_insert_after(__curr_word_end_head, __curr_word_end, end_tag)
end


--- Highlight bad spelling by colour.
-- Insert colour whatsits before and after the first and last nodes
-- known to belong to the current word.
local function __highlight_by_color()
  -- Check, if start node of current word is a head node.  Inserting
  -- before head nodes needs special attention.  This is not yet
  -- implemented.
  if (__curr_word_start ~= __curr_word_start_head) then
    -- Create pdf_colorstack whatsit nodes.
     local push = node_new(WHATSIT, PDF_COLORSTACK)
     local pop = node_new(WHATSIT, PDF_COLORSTACK)
     push.stack = 0
     pop.stack = 0
     push.command = 1
     pop.command = 2
     push.data = __opts.hl_color
     node_insert_before(__curr_word_start_head, __curr_word_start, push)
     node_insert_after(__curr_word_end_head, __curr_word_end, pop)
  end
end


--- Highlight bad spelling by colour (using node field `cmd`).
-- Insert colour whatsits before and after the first and last nodes
-- known to belong to the current word.
-- @see function __highlight_by_color
local function __highlight_by_color_cmd()
  -- Check, if start node of current word is a head node.  Inserting
  -- before head nodes needs special attention.  This is not yet
  -- implemented.
  if (__curr_word_start ~= __curr_word_start_head) then
    -- Create pdf_colorstack whatsit nodes.
     local push = node_new(WHATSIT, PDF_COLORSTACK)
     local pop = node_new(WHATSIT, PDF_COLORSTACK)
     push.stack = 0
     pop.stack = 0
     push.cmd = 1
     pop.cmd = 2
     push.data = __opts.hl_color
     node_insert_before(__curr_word_start_head, __curr_word_start, push)
     node_insert_after(__curr_word_end_head, __curr_word_end, pop)
  end
end


--- Generic function for highlighting bad spellings.
local function __highlight_bad_word()
  __highlight_by_color()
end


-- Tagging status.
local __is_active_tagging


-- Highlighting status.
local __is_active_highlighting


--- Data structure that stores the characters of a word string.
-- The current word data structure is an ordered list (an array) of the
-- characters of the word.  The characters are collected while scanning
-- a node list.  They are concatenated to a single string only after the
-- end of a word is detected, before inserting the current word into the
-- current paragraph data structure.
--
-- @class table
-- @name __curr_word
local __curr_word


--- Act upon detection of end of current word string.
-- If the current word contains visible characters, store the current
-- word in the current tag.
local function __finish_current_word()
  -- Finish a word?
  if __curr_word then
    local word = tabconcat(__curr_word)
    -- Check, if the current word has already been tagged.  This is only
    -- a quick hack.
    local start_prev = __curr_word_start.prev
    local end_next = __curr_word_end.next
    if start_prev and end_next
    and (start_prev.id == WHATSIT)
    and (start_prev.subtype == USER_DEFINED)
    and (start_prev.user_id == __uid_start_tag)
    and (end_next.id == WHATSIT)
    and (end_next.subtype == USER_DEFINED)
    and (end_next.user_id == __uid_end_tag)
    and (end_next.value == word) then
      __curr_word = nil
      __curr_word_start_head = nil
      __curr_word_start = nil
      __curr_word_end_head = nil
      __curr_word_end = nil
      return
    end
    -- Tag node list with word string.
    if __is_active_tagging then
      __tag_word(word)
    end
    -- Highlighting needed?
    if __is_highlighting_needed[word] and __is_active_highlighting then
      __highlight_bad_word()
    end
    __curr_word = nil
  end
  __curr_word_start_head = nil
  __curr_word_start = nil
  __curr_word_end_head = nil
  __curr_word_end = nil
end


--- Act upon detection of end of current paragraph.
-- If the current paragraph contains words, store the current paragraph
-- in the text document.
local function __finish_current_paragraph()
  -- Finish current word.
  __finish_current_word()
end


--- Paragraph management stack.
-- Stack of boolean flags, that are used for logging the occurence of a
-- new paragraph within nested vlists.
local __is_vlist_paragraph


--- Paragraph management.
-- This function puts a new boolean flag onto a stack that is used to
-- log the occurence of a new paragraph, while recursing into the coming
-- vlist.  After finishing recursing into the vlist, the flag needs to
-- be removed from the stack.  Depending on the flag, the then current
-- paragraph can be finished.
local function __vlist_pre_recurse()
  tabinsert(__is_vlist_paragraph, false)
end


--- Paragraph management.
-- Remove flag from stack after recursing into a vlist.  If necessary,
-- finish the current paragraph.
local function __vlist_post_recurse()
  local p = tabremove(__is_vlist_paragraph)
  if p then
    __finish_current_paragraph()
  end
end


--- Find paragraphs and strings.
-- While scanning a node list, this call-back function finds nodes
-- representing the start of a paragraph (local_par whatsit nodes) and
-- strings (chains of nodes of type glyph, kern, disc).
--
-- @param head  Head node of current branch.
-- @param n  The current node.
local function __visit_node(head, n)
  local nid = n.id
  -- Test for word string component node.
  if nid == GLYPH then
    -- Save first node belonging to current word and its head for later
    -- reference.
    if not __curr_word_start then
      __curr_word_start_head = head
      __curr_word_start = n
    end
    -- Save latest node belonging to current word and its head for later
    -- reference.
    __curr_word_end_head = head
    __curr_word_end = n
    -- Provide new empty word, if necessary.
    if not __curr_word then
      __curr_word = {}
    end
    -- Append character to current word string.
    tabinsert(__curr_word, __codepoint_map[n.char])
  -- Test for other word string component nodes.
  elseif (nid == DISC) or (nid == KERN) then
    -- We're still within the current word string.  Do nothing.
  -- Test for paragraph start.
  elseif (nid == WHATSIT) and (n.subtype == LOCAL_PAR) then
    __finish_current_paragraph()
    __is_vlist_paragraph[#__is_vlist_paragraph] = true
  else
    -- End of current word string detected.
    __finish_current_word()
  end
end


--- Table of call-back functions for node list recursion: store the
--- word strings found in a node list.
-- The call-back functions in this table identify chains of nodes
-- representing word strings in a node list and stores the strings in
-- the text document.  Local_par whatsit nodes are word boundaries.
-- Nodes of type `hlist` are recursed into as if they were non-existent.
-- As an example, the LaTeX input `a\mbox{a b}b` is recognized as two
-- strings `aa` and `bb`.
--
-- @class table
-- @name __cb_tag_words
-- @field vlist_pre_recurse  Paragraph management.
-- @field vlist_post_recurse  Paragraph management.
-- @field visit_node  Find nodes representing paragraphs and words.
local __cb_tag_words = {

  vlist_pre_recurse = __vlist_pre_recurse,
  vlist_post_recurse = __vlist_post_recurse,
  visit_node = __visit_node,

}


--- Process node list according to this stage.
-- This function recurses into the given node list, extracts all text
-- and stores it in the text document.
--
-- @param head  Node list.
local function __process_node_list(head)
  __curr_word_start_head = nil
  __curr_word_start = nil
  __curr_word_end_head = nil
  __curr_word_end = nil
  recurse_node_list(head, __cb_tag_words)
  -- Clean-up left-over word and/or paragraph.
  __finish_current_paragraph()
end


--- Call-back function that processes the node list.
--
-- @param head  Node list.
local function __cb_pre_linebreak_filter_pkg_spelling(head)
  __process_node_list(head)
  return head
end


--- Start tagging text.
-- After calling this function, words are tagged in node lists before
-- hyphenation takes place.
local function enable_text_tagging()
  __is_active_tagging = true
end
M.enable_text_tagging = enable_text_tagging


--- Stop tagging text.
-- After calling this function, no more word tagging in node lists takes
-- place.
local function disable_text_tagging()
  __is_active_tagging = false
end
M.disable_text_tagging = disable_text_tagging


--- Start highlighting bad spellings.
-- After calling this function, bad spellings are highlighted in PDF
-- output.
local function enable_word_highlighting()
  __is_active_highlighting = true
end
M.enable_word_highlighting = enable_word_highlighting


--- Stop highlighting bad spellings.
-- After calling this function, no more bad spellings are highlighted in
-- PDF output.
local function disable_word_highlighting()
  __is_active_highlighting = false
end
M.disable_word_highlighting = disable_word_highlighting


--- Try to maintain compatibility with older LuaTeX versions.
-- Between LuaTeX 0.70.2 and 0.76.0 node field `cmd` of `whatsits` nodes
-- of subtype `pdf_colorstack` has been renamed to `command`.  This
-- function checks which node field is the correct one and activates a
-- fall-back function in case.  Due to a bug in LuaTeX 0.76.0 (shipped
-- with TL2013) function `node.has_field()` doesn't return correct
-- results.  It is therefore tested if an assignment to field `command`
-- raises an error or not.
local function __maintain_compatibility()
  -- Create pdf_colorstack whatsit node.
  local n = node.new(WHATSIT, PDF_COLORSTACK)
  -- Function that assigns a value to node field 'command'.
  local f = function()
    n.command = 1
  end
  -- If the assignment is not successful, fall-back to node field 'cmd'.
  if not pcall(f) then
    __highlight_by_color = __highlight_by_color_cmd
  end
  -- Delete test node.
  node.free(n)
end


--- Module initialisation.
--
local function __init()
  -- Try to maintain compatibility with older LuaTeX versions.
  __maintain_compatibility()
  -- Get local references to package ressources.
  __rules_bad = PKG_spelling.res.rules_bad
  __rules_good = PKG_spelling.res.rules_good
  __uid_start_tag = PKG_spelling.res.whatsit_ids.start_tag
  __uid_end_tag = PKG_spelling.res.whatsit_ids.end_tag
  -- Create empty paragraph management stack.
  __is_vlist_paragraph = {}
  -- Remember tagging status.
  __is_active_tagging = false
  -- Remember highlighting status.
  __is_active_highlighting = false
  -- Set default highlighting colour.
  set_highlight_color('1 0 0 rg')
  -- Register call-back: Before TeX breaks a paragraph into lines, tag
  -- and highlight strings.
  luatexbase.add_to_callback('pre_linebreak_filter', __cb_pre_linebreak_filter_pkg_spelling, '__cb_pre_linebreak_filter_pkg_spelling')
end


-- Initialize module.
__init()


-- Return module table.
return M

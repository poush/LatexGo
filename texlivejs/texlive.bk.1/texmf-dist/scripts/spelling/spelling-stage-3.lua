--- spelling-stage-3.lua
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


--- Store the text of a LuaTeX document in a text document data
--- structure.
-- This module provides means to extract text from a LuaTeX document and
-- to store it in a text document data structure.
--
-- In the text document, words are stored as UTF-8 encoded strings.  A
-- mapping mechanism is provided by which, during word string
-- recognition, individual code-points, e.g., of glyph nodes, can be
-- translated to arbitrary UTF-8 strings, e.g., ligatures to single
-- letters.
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


-- Function short-cuts.
local recurse_node_list = recurse.recurse_node_list

local tabinsert = table.insert
local tabremove = table.remove


-- Short-cuts for constants.
local WHATSIT = node.id('whatsit')
local LOCAL_PAR = node.subtype('local_par')
local USER_DEFINED = node.subtype('user_defined')


-- Declare local variables to store references to resources that are
-- provided by external code.
--
-- Text document data structure.
local __text_document
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
-- @field table_par  When processing a table, when should paragraphs be
-- inserted into the text document?<br />
--
-- <ul>
-- <li> 0 - Don't touch tables in any way.</li>
-- <li> 1 - Insert paragraphs before and after hlists of type
--            <i>alignment column or row</i>, i.e., before and after
--            every table row.</li>
-- <li> 2 - Insert paragraphs before and after hlists of type
--            <i>alignment cell</i>, i.e., before and after every table
--            cell.</li>
-- </ul>
local __opts = {
  table_par,
}


--- Set table behaviour.
-- Determine when paragraphs are inserted within tables.
--
-- @param value  New value.
local function set_table_paragraphs(value)
  __opts.table_par = value
end
M.set_table_paragraphs = set_table_paragraphs


--- Data structure that stores the word strings found in a node list.
--
-- @class table
-- @name __curr_paragraph
local __curr_paragraph


--- Act upon detection of end of current word string.
-- If the current word contains visible characters, store the current
-- word in the current paragraph.
--
-- @param n  String tag node.
local function __finish_current_word(n)
  -- Provide new empty paragraph, if necessary.
  if not __curr_paragraph then
    __curr_paragraph = {}
  end
  -- Append current string to current paragraph.
  tabinsert(__curr_paragraph, n.value)
end


--- Act upon detection of end of current paragraph.
-- If the current paragraph contains words, store the current paragraph
-- in the text document.
local function __finish_current_paragraph()
  -- Finish a paragraph?
  if __curr_paragraph then
    -- Append current paragraph to document structure.
    tabinsert(__text_document, __curr_paragraph)
    __curr_paragraph = nil
  end
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


--- Handle tables lines and cells.
-- Start a new paragraph before and after an hlist of subtype `alignment
-- column or row` or `alignment cell`, depending on option `table_par`.
--
-- @param n  hlist node.
local function __handle_table(n)
  local subtype = n.subtype
  local table_par = __opts.table_par
  if (subtype == 4) and (table_par == 1) then
    __finish_current_paragraph()
  elseif (subtype == 5) and (table_par == 2) then
    __finish_current_paragraph()
  end
end


--- Find paragraphs and strings.
-- While scanning a node list, this call-back function finds nodes
-- representing the start of a paragraph (local_par whatsit nodes) and
-- string tags (user_defined whatsit nodes).
--
-- @param head  Head node of current branch.
-- @param n  The current node.
local function __visit_node(head, n)
  local nid = n.id
  -- Test for node containing a word string.
  if nid == WHATSIT then
    -- Test for word string tag.
    if (n.subtype == USER_DEFINED) and (n.user_id == __uid_end_tag) then
      __finish_current_word(n)
    -- Test for paragraph start.
    elseif n.subtype == LOCAL_PAR then
      __finish_current_paragraph()
      __is_vlist_paragraph[#__is_vlist_paragraph] = true
    end
  end
end


--- Table of call-back functions for node list recursion: store the
--- word strings found in a node list.
-- The call-back functions in this table identify chains of nodes
-- representing word strings in a node list and stores the strings in
-- the text document.  A new paragraph is started at local_par whatsit
-- nodes and after finishing a vlist containing a local_par whatsit
-- node.  Nodes of type `hlist` are recursed into as if they were
-- non-existent.  As an example, the LaTeX input `a\mbox{a b}b` is
-- recognized as two strings `aa` and `bb`.
--
-- @class table
-- @name __cb_store_words
-- @field vlist_pre_recurse  Paragraph management.
-- @field vlist_post_recurse  Paragraph management.
-- @field hlist_pre_recurse  Table management.
-- @field hlist_post_recurse  Table management.
-- @field visit_node  Find nodes representing paragraphs and words.
local __cb_store_words = {

  vlist_pre_recurse = __vlist_pre_recurse,
  vlist_post_recurse = __vlist_post_recurse,
  hlist_pre_recurse = __handle_table,
  hlist_post_recurse = __handle_table,
  visit_node = __visit_node,

}


--- Process node list according to this stage.
-- This function recurses into the given node list, finds strings in
-- tags and stores them in the text document.
--
-- @param head  Node list.
local function __process_node_list(head)
  recurse_node_list(head, __cb_store_words)
  -- Clean-up left-over word and/or paragraph.
  __finish_current_paragraph()
end


-- Call-back status.
local __is_active_storage


--- Call-back function that processes the node list.
-- <i>This function is not made available in the module table, but in
-- the global package table!</i>
--
-- @param head  Node list.
local function cb_AtBeginShipout(box)
  if __is_active_storage then
    __process_node_list(tex.box[box])
  end
end


--- Start storing text.
-- After calling this function, text is stored in the text document.
local function enable_text_storage()
  __is_active_storage = true
end
M.enable_text_storage = enable_text_storage


--- Stop storing text.
-- After calling this function, no more text is stored in the text
-- document.
local function disable_text_storage()
  __is_active_storage = false
end
M.disable_text_storage = disable_text_storage


--- Module initialisation.
--
local function __init()
  -- Get local references to package ressources.
  __text_document = PKG_spelling.res.text_document
  __uid_start_tag = PKG_spelling.res.whatsit_ids.start_tag
  __uid_end_tag = PKG_spelling.res.whatsit_ids.end_tag
  -- Make \AtBeginShipout function available in package table.
  PKG_spelling.cb_AtBeginShipout = cb_AtBeginShipout
  -- Create empty paragraph management stack.
  __is_vlist_paragraph = {}
  -- Remember call-back status.
  __is_active_storage = false
  -- Set default table paragraph behaviour.
  set_table_paragraphs(0)
end


-- Initialize module.
__init()


-- Return module table.
return M

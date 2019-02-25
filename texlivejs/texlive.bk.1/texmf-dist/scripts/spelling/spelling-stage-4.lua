--- spelling-stage-4.lua
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


--- At the end of a LuaTeX run, write the text stored in a text document
--- data structure to a file.
-- This module provides means to write the text stored in a text
-- document data structure to a file at the end of a LuaTeX run.
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


-- Function short-cuts.
local tabconcat = table.concat
local tabinsert = table.insert

local Ulen = unicode.utf8.len


-- Declare local variables to store references to resources that are
-- provided by external code.
--
-- Text document data structure.
local __text_document


--- Module options.
-- This table contains all module options.  User functions to set
-- options are provided.
--
-- @class table
-- @name __opts
-- @field output_file_name  Output file name.
-- @field output_line_length  Line length in output.
local __opts = {
  output_file_name,
  output_line_lenght,
}


--- Set output file name.
-- Text output will be written to a file with the given name.
--
-- @param name  New output file name.
local function set_output_file_name(name)
  __opts.output_file_name = name
end
M.set_output_file_name = set_output_file_name


--- Set output line length.
-- Set the number of columns in text output.  Text output will be
-- wrapped at spaces so that lines don't contain more than the specified
-- number of characters per line.  There's one exception: if a word is
-- longer than the specified number of characters, the word is put on
-- its own line and that line will be overfull.
--
-- @param cols  New line length in output.  If the argument is smaller
-- than 1, lines aren't wrapped, i.e., all text of a paragraph is put on
-- a single line.
local function set_output_line_length(cols)
  __opts.output_line_length = cols
end
M.set_output_line_length = set_output_line_length


--- Break a text paragraph into lines.
-- Lines are broken at spaces only.  Lines containing only one word may
-- exceed maximum line length.
--
-- @param par  A text paragraph (an array of words).
-- @param max_line_len Maximum length of lines in wrapped paragraph.  If
-- the argument is less then 1, paragraph isn't wrapped at all.
-- @return Table containing the lines of the paragraph.
local function __wrap_text_paragraph(par, max_line_len)
  local wrapped_par = {}
  -- Index of first word on current line.  Initialize current line with
  -- first word of paragraph.
  local line_start = 1
  -- Track current line length.
  local line_len = Ulen(par[line_start])
  -- Iterate over remaining words in paragraph.
  for i = 2,#par do
    local word_len = Ulen(par[i])
    local new_line_len = line_len + 1 + word_len
    -- Maximum line length exceeded?
    if new_line_len > max_line_len and max_line_len >= 1 then
      -- Insert current line into wrapped paragraph.
      tabinsert(wrapped_par, tabconcat(par, ' ', line_start, i-1))
      -- Initialize new current line.
      line_start = i
      new_line_len = word_len
    end
    -- Append word to current line.
    line_len = new_line_len
  end
  -- Insert last line of paragraph.
  tabinsert(wrapped_par, tabconcat(par, ' ', line_start))
  return wrapped_par
end


--- Write all text stored in the text document to a file.
--
local function __write_text_document()
  -- Open output file.
  local fname = __opts.output_file_name or (tex.jobname .. '.spell.txt')
  local f = assert(io.open(fname, 'w'))
  local max_line_len = __opts.output_line_length
  -- Iterate through document paragraphs.
  for _,par in ipairs(__text_document) do
    -- Write wrapped paragraph to file with a leading empty line.
    f:write('\n', tabconcat(__wrap_text_paragraph(par, max_line_len), '\n'), '\n')
    -- Delete paragraph from memory.
    __text_document[_] = nil
  end
  -- Close output file.
  f:close()
end


--- Callback function that writes all document text into a file.
local function __cb_stopr_pkg_spelling()
  __write_text_document()
end


-- Call-back status.
local __is_active_output


--- Enable text document output.
-- Registers call-back `stop_run` to output the text stored in the text
-- document at the end of the LuaTeX run.
local function enable_text_output()
  if not __is_active_output then
    -- Register call-back: At the end of the LuaTeX run, output all text
    -- stored in the text document.
    luatexbase.add_to_callback('stop_run', __write_text_document, '__cb_stop_run_pkg_spelling')
    __is_active_output = true
  end
end
M.enable_text_output = enable_text_output


--- Disable text document output.
-- De-registers call-back `stop_run`.
local function disable_text_output()
  if __is_active_output then
    -- De-register call-back.
    luatexbase.remove_from_callback('stop_run', '__cb_stop_run_pkg_spelling')
    __is_active_output = false
  end
end
M.disable_text_output = disable_text_output


--- Module initialisation.
--
local function __init()
  -- Get local references to package ressources.
  __text_document = PKG_spelling.res.text_document
  -- Set default output file name.
  set_output_file_name(nil)
  -- Set default output line length.
  set_output_line_length(72)
  -- Remember call-back status.
  __is_active_output = false
end


-- Initialize module.
__init()


-- Return module table.
return M
